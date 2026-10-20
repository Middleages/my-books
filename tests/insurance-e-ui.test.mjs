import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const won = value => `${(value / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}만원`;
const text = html => html.replace(/<[^>]*>/g, '');
const cells = row => [...row.matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/g)].map(match => text(match[1]));
const rows = (html, attribute) => [...html.matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/g)].filter(match => match[1].includes(`${attribute}=`)).map(match => ({ key: match[1].match(new RegExp(`${attribute}="([^"]*)"`))[1], attributes: match[1], cells: cells(match[2]) }));
let server;
before(async () => { server = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] } }); });
after(async () => { await server?.close(); });
async function render(module, name, props) { const loaded = await server.ssrLoadModule(module); return renderToStaticMarkup(createElement(loaded[name], props)); }

// These checks establish SSR model-to-markup agreement, not browser execution.
// The production/live Chromium suite separately checks painted geometry,
// all meaningful controls, keyboard focus, timers and reduced-motion frames.

test('E MDX renders explanatory scenes, learning goals, dated sources and valid published links', async () => {
  const catalog = readFileSync(new URL('../src/catalog.ts', import.meta.url), 'utf8');
  const published = new Set(['#/insurance', ...[...catalog.matchAll(/id: "([^"]+)", bookId: "insurance"/g)].map(match => `#/insurance/${match[1]}`)]);
  for (const chapter of ['Claims', 'ReadingInsurance']) {
    const html = await render(`/src/content/insurance/${chapter}.mdx`, 'default');
    assert.match(html, /learning-goals/); assert.match(html, /2026-10-(?:19|20)/);
    assert.match(html, /<figure\b/); assert.match(html, /<figcaption\b/);
    assert(!html.includes('**'), `${chapter}: raw Markdown emphasis`);
    assert(!/<p[^>]*>\s*<p\b/.test(html), `${chapter}: malformed nested paragraphs`);
    assert(!/<del\b/.test(html), `${chapter}: unintended range strikethrough`);
    assert(html.length > 10000, `${chapter}: chapter rendered only a fragment`);
    for (const match of html.matchAll(/href="(#\/insurance[^"?]*)"/g)) assert(published.has(match[1]), `${chapter}: unpublished route ${match[1]}`);
  }
});

test('claims SSR starts with usable cash only, pending decision and a not-yet-observed due shortfall', async () => {
  const html = await render('/src/components/insurance/ClaimsLab.tsx', 'ClaimsLab');
  assert.match(html, /data-insurance-lab="claims" data-claims-day="0" data-claims-scenario="standard"/);
  assert.match(html, /data-insurance-stage="incident"/);
  assert.match(html, /data-claims-value="cash" data-value="1000000">100만원/);
  assert.match(html, /data-claims-value="history" data-value="pending">아직 납기 전/);
  assert.match(html, /data-claims-value="confirmed" data-value="pending">아직 결정 전/);
  assert.match(html, /data-claims-value="received" data-value="0">0만원/);
  assert.equal((html.match(/data-claims-process="/g) || []).length, 5);
  assert.match(html, /aria-label="관찰할 날짜"[^>]*min="0"[^>]*max="20"/);
  assert.match(html, /개인정보나 건강서류를 입력하지 않습니다/);
  assert(!/NaN|undefined/.test(html));
});

test('claims SSR cash scene agrees with every day of all outcomes and cash boundaries', async () => {
  const { projectClaims, claimsScenarios } = await import('../src/simulations/insurance/claims.mjs');
  for (const scenario of claimsScenarios) {
    for (const startingCash of [0, 1000000, 3000000]) {
      const result = projectClaims({ scenario: scenario.id, startingCash });
      for (const frame of result.frames) {
        const html = await render('/src/components/insurance/ClaimsLab.tsx', 'ClaimsCashScene', { result, frame });
        for (const [key, value, label] of [['cash', frame.availableCash, won(frame.availableCash)], ['unfunded', frame.unfunded, `미충당 ${won(frame.unfunded)}`], ['history', frame.shortfallAtDue, frame.shortfallAtDue === null ? '아직 납기 전' : won(frame.shortfallAtDue)], ['received', frame.receivedToDate, won(frame.receivedToDate)], ['paid', frame.paidToDate, won(frame.paidToDate)]]) {
          assert(html.includes(`data-claims-value="${key}" data-value="${value ?? 'pending'}">${label}`), `${scenario.id}/${startingCash}/${frame.day}: ${key} differs from model`);
        }
        assert(html.includes(`data-claims-bar="cash" data-fraction="${frame.cashFraction}" style="width:${frame.cashFraction * 100}%"`));
        assert(html.includes(`data-claims-bar="history" data-fraction="${frame.historyFraction}" style="width:${frame.historyFraction * 100}%"`));
        for (const segment of frame.dueSegments) assert(html.includes(`data-claims-bar="${segment.id}" data-value="${segment.amount}" data-fraction="${segment.fraction}" data-start-fraction="${segment.startFraction}" style="left:${segment.startFraction * 100}%;width:${segment.fraction * 100}%"`));
        assert.equal(frame.availableCash + frame.paidToDate, startingCash + frame.receivedToDate);
        if (frame.day >= 5) assert.equal(frame.shortfallAtDue, result.due.shortfallAtDue, 'Late receipt erased the original due-day observation');
      }
    }
  }
});

test('claims SSR separates claim, receipt, decision, conditional branches and denied non-arrival', async () => {
  const { projectClaims, claimsScenarios } = await import('../src/simulations/insurance/claims.mjs');
  for (const scenario of claimsScenarios) {
    const result = projectClaims({ scenario: scenario.id });
    for (const day of new Set([0, 2, 5, scenario.decisionDay - 1, scenario.decisionDay, scenario.arrivalDay ?? 20, 20])) {
      const frame = result.frames[day], html = await render('/src/components/insurance/ClaimsLab.tsx', 'ClaimsProcessScene', { result, frame });
      assert(html.includes(`data-claims-value="confirmed" data-value="${frame.confirmedAmount ?? 'pending'}">${frame.confirmedAmount === null ? '아직 결정 전' : won(frame.confirmedAmount)}`));
      for (const stage of frame.process) assert(html.includes(`data-claims-process="${stage.id}" data-status="${stage.status}"`));
      assert(html.includes(`data-claims-branch="true" data-enabled="${scenario.branch}"`));
      for (const branch of frame.branch) assert(html.includes(`data-claims-branch-stage="${branch.id}" data-status="${branch.status}"`));
      if (scenario.arrivalDay === null) assert.match(html, /입금 없음/);
    }
  }
});

test('claims SSR complete static rows preserve historical shortage and the same-day receipt-first calendar', async () => {
  const { projectClaims, claimsScenarios } = await import('../src/simulations/insurance/claims.mjs');
  const html = await render('/src/components/insurance/ClaimsLab.tsx', 'ClaimsLab'), model = projectClaims();
  const daily = rows(html, 'data-static-claims');
  assert.equal(daily.length, 21);
  daily.forEach((row, index) => {
    const frame = model.frames[index];
    assert.equal(Number(row.key), frame.day);
    assert.deepEqual(row.cells, [`${frame.day}일${frame.dueToday ? ' · 납기' : ''}`, won(frame.receipt), won(frame.paidToday), won(frame.availableCash), won(frame.unfunded), frame.shortfallAtDue === null ? '납기 전' : won(frame.shortfallAtDue)]);
  });
  assert.equal(daily[5].cells[4], '200만원'); assert.equal(daily[10].cells[4], '0만원');
  assert.equal(daily[5].cells[5], '200만원'); assert.equal(daily[20].cells[5], '200만원');
  assert.equal((html.match(/role="region" aria-label="[^"]+" tabindex="0"/g) || []).length, 2);
  for (const scenario of claimsScenarios) {
    const result = projectClaims({ scenario: scenario.id });
    const scene = await render('/src/components/insurance/ClaimsLab.tsx', 'ClaimsTimeline', { result, frame: result.due });
    const calendar = scene.match(/<ol class="claims-mobile-events">([\s\S]*?)<\/ol>/)[1];
    const ids = [...calendar.matchAll(/<li class="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(ids, result.timelineEvents.map(event => event.id));
    for (const event of result.events) assert(scene.includes(`data-claims-event="${event.id}" data-day="${event.day}" data-fraction="${event.fraction}"`));
    if (scenario.id === 'same-day') assert(ids.indexOf('receipt') < ids.indexOf('due'), 'Mobile same-day ordering contradicts receipt before due');
    if (scenario.id === 'denied') assert(!ids.includes('receipt'));
  }
});

test('claims SSR overview keeps a200만원 historical shortage before and after full expense settlement', async () => {
  const html = await render('/src/components/insurance/ClaimsLab.tsx', 'ClaimsOverview');
  assert.equal((html.match(/5일 부족 기록 200만원/g) || []).length, 2);
  assert.match(html, /충당 100만원/); assert.match(html, /현재 미충당 200만원/);
  assert.match(html, /충당 300만원/); assert.match(html, /현재 미충당 0만원/);
  assert.match(html, /10일에 나머지를 채워도 5일에 부족했던 사실까지 바뀌지는 않습니다/);
});

test('reading SSR begins with all classification evidence hidden but three distinct kinds of relations', async () => {
  const { projectReading } = await import('../src/simulations/insurance/reading.mjs');
  const html = await render('/src/components/insurance/ReadingInsuranceLab.tsx', 'ReadingInsuranceLab'), model = projectReading();
  assert.match(html, /data-insurance-lab="reading-insurance"/);
  assert.match(html, /data-insurance-stage="read"/);
  assert.equal((html.match(/aria-current="step"/g) || []).length, 1);
  assert.equal((html.match(/data-reading-statement="/g) || []).length, model.assessments.length);
  assert.equal((html.match(/data-revealed="false" data-classification="hidden"/g) || []).length, model.assessments.length);
  assert.equal((html.match(/data-reading-evidence="/g) || []).length, 0);
  for (const kind of ['documented', 'assumption', 'unresolved']) assert.equal((html.match(new RegExp(`data-reading-link="${kind}"`, 'g')) || []).length, 3);
  assert.equal((html.match(/data-reading-loss-track="/g) || []).length, 2);
  assert.equal((html.match(/data-reading-fixed="b"/g) || []).length, 1);
  assert.equal((html.match(/data-reading-unknown="[abc]"[^>]*data-state="unknown"/g) || []).length, 3);
  assert(!/NaN|undefined/.test(html));
});

test('reading SSR map preserves every exact date, unknown state and fixed-benefit separation', async () => {
  const { projectReading, readingBoundaryCases } = await import('../src/simulations/insurance/reading.mjs');
  const models = [...readingBoundaryCases(), projectReading({ eventDay: null }), projectReading({ coveredEvent: null }), projectReading({ coveredEvent: false }), projectReading({ eventDay: null, coveredEvent: false }), projectReading({ loss: 0 }), projectReading({ loss: 0, coveredEvent: null })];
  for (const result of models) {
    const html = await render('/src/components/insurance/ReadingInsuranceLab.tsx', 'ReadingMap', { result });
    for (const contract of result.contracts) {
      assert(html.includes(`data-reading-contract="${contract.id}" data-reading-status="${contract.status}"`));
      assert(html.includes(`data-reading-conditional="${contract.id}" data-value="${contract.conditionalAmount ?? 'unresolved'}">${contract.conditionalAmount === null ? '미정' : won(contract.conditionalAmount)}`));
      assert(html.includes(`data-reading-unknown="${contract.id}" data-reading-link="unresolved" data-reading-link-contract="${contract.id}" data-state="unknown"`));
      for (const segment of contract.segments) assert(html.includes(`data-reading-segment="${segment.id}" data-value="${segment.amount}" data-fraction="${segment.fraction}" data-left-fraction="${segment.leftFraction}"`));
      assert.equal(contract.actualPayable, null); assert.equal(contract.received, null);
    }
    assert.equal((html.match(/실제 지급대상액 <b>미정<\/b> · 입금액 <b>미정<\/b>/g) || []).length, 3);
    assert.equal((html.match(/data-reading-loss-track="/g) || []).length, 2);
    assert.equal((html.match(/data-reading-fixed="b"/g) || []).length, 1);
    assert.match(html, /A와 C를 합친 동시 지급액도 계산하지 않습니다/);
    if (result.params.loss === 0 && result.params.coveredEvent === true) {
      assert(html.includes('data-reading-fixed="b" data-value="1000000"'));
      assert.equal((html.match(/손실 0 · 길이 없음/g) || []).length, 2);
    }
    if (result.contracts.every(contract => contract.conditionalAmount === null)) {
      assert.equal((html.match(/data-reading-conditional="[abc]" data-value="unresolved">미정/g) || []).length, 3);
      assert(!/data-reading-conditional="[abc]" data-value="0"/.test(html), 'Unknown was converted to a0won denial');
    }
  }
});

test('reading SSR complete static alternatives preserve current contracts, all evidence and every date boundary', async () => {
  const { projectReading, readingBoundaryCases } = await import('../src/simulations/insurance/reading.mjs');
  const html = await render('/src/components/insurance/ReadingInsuranceLab.tsx', 'ReadingInsuranceLab'), model = projectReading();
  const amount = value => value === null ? '미정' : won(value);
  const contracts = rows(html, 'data-static-reading-contract');
  assert.deepEqual(contracts.map(row => row.cells), model.contracts.map(contract => [contract.name, '90일', contract.statusLabel, amount(contract.conditionalAmount), '미정', '미정']));
  const statements = rows(html, 'data-static-reading-statement');
  assert.equal(statements.length, 12);
  statements.forEach((row, index) => {
    const expected = model.assessments[index];
    assert.equal(row.key, expected.id);
    assert.deepEqual(row.cells, [String(expected.number), expected.text, expected.classificationLabel, expected.clauseIds.join(' · '), expected.why]);
  });
  assert.deepEqual(rows(html, 'data-static-reading-boundary').map(row => row.cells), readingBoundaryCases().map(row => [`${row.params.eventDay}일`, ...row.contracts.map(contract => amount(contract.conditionalAmount)), '미정']));
  assert.deepEqual(rows(html, 'data-static-reading-frame').map(row => row.cells), model.frames.map(frame => [frame.label, frame.detail]));
  assert.equal((html.match(/role="region" aria-label="[^"]+" tabindex="0"/g) || []).length, 4);
});

test('reading SSR authored source excerpts and overview use the same independent model promises', async () => {
  const { projectReading, readingDocuments } = await import('../src/simulations/insurance/reading.mjs');
  const documents = await render('/src/components/insurance/ReadingInsuranceLab.tsx', 'ReadingInsuranceDocuments');
  for (const document of readingDocuments) {
    assert(documents.includes(`data-reading-document="${document.id}"`));
    for (const clause of document.clauses) { assert(documents.includes(`data-reading-clause="${clause.id}"`)); assert(documents.includes(clause.text)); }
  }
  assert.match(documents, /실제 판매 상품 아님/);
  const overview = await render('/src/components/insurance/ReadingInsuranceLab.tsx', 'ReadingInsuranceOverview'), model = projectReading();
  for (const contract of model.contracts) assert(overview.includes(`data-reading-conditional="${contract.id}" data-value="${contract.conditionalAmount}">${won(contract.conditionalAmount)}`));
  assert.match(overview, /실제 지급과 입금은 아직 알 수 없습니다/);
});

test('E styles guard zero money, open unknown boundaries, readable mobile alternatives and reduced motion', () => {
  const claims = readFileSync(new URL('../src/components/insurance/claims.css', import.meta.url), 'utf8');
  assert.match(claims, /\.historical\[data-fraction="0"\]\s*\{border:0/);
  assert.match(claims, /\.claims-chart-svg path\.cash,\.claims-chart-svg path\.unfunded,\.claims-chart-svg path\.history\s*\{fill:none/);
  assert.match(claims, /\.claims-mobile-events\s*\{display:grid/);
  assert.match(claims, /\.claims-time-lanes,\.claims-time-axis,\.claims-chart-svg\s*\{display:none/);
  assert.match(claims, /\.claims-time-axis span\s*\{[^}]*width:max-content;white-space:nowrap;overflow-wrap:normal;word-break:normal/);
  assert.match(claims, /@media\(prefers-reduced-motion:reduce\)/);
  const reading = readFileSync(new URL('../src/components/insurance/reading-insurance.css', import.meta.url), 'utf8');
  assert.match(reading, /\.reading-relation\.assumption i\s*\{border-left:3px dashed/);
  assert.match(reading, /\.reading-open-boundary\s*\{[^}]*border-right:0/);
  assert.match(reading, /@media\(max-width:850px\)\s*\{\.reading-branches\s*\{grid-template-columns:1fr/);
  assert.match(reading, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(reading, /\.reading-document header,\.reading-map-source\s*\{[^}]*height:auto/);
});

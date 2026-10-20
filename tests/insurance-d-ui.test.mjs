import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { projectTimelines } from '../src/simulations/insurance/timelines.mjs';
import { projectSurrender } from '../src/simulations/insurance/surrender.mjs';

const won = value => `${(value / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}만원`;
const percent = value => `${(value * 100).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%`;
const text = html => html.replace(/<[^>]*>/g, '');
const cells = row => [...row.matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/g)].map(match => text(match[1]));
const rows = (html, attribute) => [...html.matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/g)].filter(match => match[1].includes(`${attribute}=`)).map(match => ({ key: match[1].match(new RegExp(`${attribute}="([^"]*)"`))[1], attributes: match[1], cells: cells(match[2]) }));
let server;
before(async () => { server = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] } }); });
after(async () => { await server?.close(); });
async function render(module, name) { const loaded = await server.ssrLoadModule(module); return renderToStaticMarkup(createElement(loaded[name])); }

// SSR proves model-to-markup agreement; painted pixels and keyboard/timers are
// intentionally verified separately by the production/live Chromium pipeline.
test('timelines SSR starts immediately after the first payment and renders all three distinct clocks', async () => {
  const html = await render('/src/components/insurance/TimelinesLab.tsx', 'TimelinesLab');
  const model = projectTimelines();
  assert.match(html, /data-insurance-lab="timelines"/);
  assert.match(html, /data-insurance-stage="year-0"/);
  assert.equal((html.match(/aria-current="step"/g) || []).length, 1);
  assert.equal((html.match(/data-timelines-track="payment"/g) || []).length, 2);
  assert.equal((html.match(/data-timelines-track="coverage"/g) || []).length, 2);
  assert.equal((html.match(/data-timelines-track="renewal"/g) || []).length, 1);
  for (const contract of model.contracts) {
    assert.equal((html.match(new RegExp(`data-timelines-payment="${contract.id}"`, 'g')) || []).length, contract.payments.length);
    for (const payment of contract.payments) {
      assert(html.includes(`data-timelines-payment="${contract.id}" data-year="${payment.year}" data-amount="${payment.amount}" data-position="${payment.position}" data-height-fraction="${payment.heightFraction}" data-paid="${payment.year === 0}"`));
    }
    assert(html.includes(`data-timelines-coverage="${contract.id}" data-start="0" data-end="${contract.coverage.end}" data-fraction="${contract.coverage.fraction}"`));
    const frame = model.frames[0][contract.id];
    assert(html.includes(`data-timelines-current="${contract.id}" data-premium="${frame.premium}" data-cumulative="${frame.cumulativePremium}" data-covered="true"`));
  }
  assert.equal((html.match(/data-timelines-marker="true" data-year="0" data-position="0"/g) || []).length, 5);
  assert.equal((html.match(/data-timelines-renewal="/g) || []).length, 4);
  assert.match(html, /막대 폭은 보기 위한 폭이지 납입기간이 아닙니다/);
  assert(!html.match(/<p class="insurance-result"[^>]*>예측과/), 'Year5 prediction must not be answered at year0');
});

test('timelines SSR full annual and frozen renewal tables agree with every model row', async () => {
  const html = await render('/src/components/insurance/TimelinesLab.tsx', 'TimelinesLab');
  const model = projectTimelines(), annual = rows(html, 'data-static-timelines'), rates = rows(html, 'data-timelines-rate-row');
  assert.equal(annual.length, 13);
  annual.forEach((row, index) => {
    const frame = model.frames[index];
    assert.equal(Number(row.key), frame.year);
    assert.deepEqual(row.cells, [`${frame.year}년`, won(frame.fixed.premium), won(frame.fixed.cumulativePremium), frame.fixed.covered ? '기간 안' : '기간 밖', won(frame.renewing.premium), won(frame.renewing.cumulativePremium), frame.renewing.covered ? '기간 안' : '기간 밖', frame.renewal.label]);
  });
  assert.equal(rates.length, model.periods.length);
  rates.forEach((row, index) => {
    const period = model.periods[index];
    assert.equal(Number(row.key), period.index);
    assert.deepEqual(row.cells, [`${period.start}년 이상 · ${period.end}년 미만`, `${won(period.annualPremium)} / 년`, `${period.start}·${period.end - 1}년 시작`, '유지']);
  });
  assert.equal((html.match(/role="region" aria-label="[^"]+" tabindex="0"/g) || []).length, 2);
  assert.equal(annual[5].cells[1], '0만원'); assert.equal(annual[5].cells[3], '기간 안');
  assert.equal(annual[10].cells[1], '0만원'); assert.equal(annual[10].cells[4], '0만원');
  assert.equal(annual[10].cells[3], '기간 밖'); assert.equal(annual[10].cells[6], '기간 밖');
});

test('timelines SSR overview uses the same year5 frame, not a decorative contradictory timeline', async () => {
  const html = await render('/src/components/insurance/TimelinesLab.tsx', 'TimelinesOverview'), model = projectTimelines();
  assert.equal((html.match(/data-timelines-contract="fixed"/g) || []).length, 1);
  assert.equal((html.match(/data-timelines-contract="renewing"/g) || []).length, 0);
  assert.equal((html.match(new RegExp(`data-timelines-marker="true" data-year="5" data-position="${model.frames[5].position}"`, 'g')) || []).length, 2);
  assert.equal((html.match(/data-timelines-payment="fixed"/g) || []).length, 5);
  assert.match(html, /data-end="10"/);
  assert.match(html, /관찰 중인 5년은 기간 안입니다/);
  assert.match(html, /모든 사건의 보험금 지급이 확정되지는 않습니다/);
});

test('surrender SSR year0 retains its first premium, zero quote and exact canceled-coverage partition', async () => {
  const html = await render('/src/components/insurance/SurrenderLab.tsx', 'SurrenderLab'), frame = projectSurrender().frames[0];
  assert.match(html, /data-insurance-lab="surrender" data-surrender-year="0" data-surrender-kind="surrender"/);
  assert.match(html, /data-insurance-stage="surrender-0"/);
  assert.equal((html.match(/aria-current="step"/g) || []).length, 1);
  assert.match(html, /data-surrender-premium="true" data-value="100000">10만원/);
  assert.match(html, /data-surrender-return="true" data-value="0" data-kind="surrender">0만원/);
  for (const [kind, fraction] of [['premium', frame.paidFraction], ['return', frame.exitFraction], ['difference', frame.differenceFraction]]) assert(html.includes(`data-surrender-bar="${kind}" data-fraction="${fraction}"`));
  assert.equal((html.match(/data-surrender-payment="\d+" data-paid="true"/g) || []).length, 1);
  assert.equal((html.match(/data-surrender-payment="\d+" data-paid="false"/g) || []).length, 4);
  for (const segment of frame.coverageSegments) assert(html.includes(`data-surrender-coverage-segment="${segment.id}" data-start="${segment.start}" data-end="${segment.end}" data-fraction="${segment.fraction}"`));
  assert.match(html, /해지 전 사건의 청구 여부/);
  assert.match(html, /위약금이나 회사 이익으로 읽을 수는 없습니다/);
  assert.match(html, /비율은 수익률이 아닙니다/);
});

test('surrender SSR keeps all ten quoted exits distinct from the separate zero maturity row', async () => {
  const html = await render('/src/components/insurance/SurrenderLab.tsx', 'SurrenderLab'), model = projectSurrender();
  const quotes = rows(html, 'data-static-surrender');
  assert.equal(quotes.length, 11);
  quotes.forEach((row, index) => {
    const frame = model.frames[index];
    assert.equal(Number(row.key), frame.exitYear);
    assert(row.attributes.includes(`data-kind="${frame.kind}"`));
    assert.deepEqual(row.cells, [`${frame.exitYear}년 · ${frame.kind === 'surrender' ? '해지' : '만기'}`, won(frame.timeline[frame.exitYear].paidPremium), won(frame.cumulativePremium), frame.surrenderValue === null ? '해당 없음' : won(frame.surrenderValue), frame.maturityValue === null ? '해당 없음' : won(frame.maturityValue), percent(frame.returnRatio)]);
  });
  assert.equal(quotes[9].cells[3], '28만원'); assert.equal(quotes[9].cells[4], '해당 없음');
  assert.equal(quotes[10].cells[3], '해당 없음'); assert.equal(quotes[10].cells[4], '0만원');
  assert.equal(quotes.filter(row => row.attributes.includes('data-selected="true"')).length, 1);
  const timeline = rows(html, 'data-surrender-timeline'), frame = model.frames[0];
  assert.equal(timeline.length, 12);
  timeline.forEach((row, index) => {
    const expected = frame.timeline[index];
    assert.equal(Number(row.key), expected.year);
    assert(row.attributes.includes('data-covered="false"'));
    assert.deepEqual(row.cells, [`${expected.year}년 이상 ${expected.endYear}년 미만`, won(expected.paidPremium), expected.coverageStatus === 'canceled' ? '해지 뒤 · 보장 없음' : '원래 기간 밖', expected.exitHere ? `해지 · ${won(expected.cashAtExit)}` : '—']);
  });
  assert.equal((html.match(/role="region" aria-label="[^"]+" tabindex="0"/g) || []).length, 2);
});

test('surrender SSR overview directly compares year5 premiums50 and authored quote20 on one scale', async () => {
  const html = await render('/src/components/insurance/SurrenderLab.tsx', 'SurrenderOverview');
  assert.match(html, /data-surrender-premium="true" data-value="500000">50만원/);
  assert.match(html, /data-surrender-return="true" data-value="200000" data-kind="surrender">20만원/);
  for (const [kind, fraction] of [['premium', 1], ['return', .4], ['difference', .6]]) assert(html.includes(`data-surrender-bar="${kind}" data-fraction="${fraction}"`));
  assert.match(html, /data-surrender-ratio="true" data-value="0.4">40%/);
  assert.match(html, /총 50만원/); assert.match(html, /별도로 주어진 표/);
});

test('D MDX renders learning goals, dated sources, reasoned checks and no unreleased links or malformed Markdown', async () => {
  for (const chapter of ['Timelines', 'Surrender']) {
    const html = await render(`/src/content/insurance/${chapter}.mdx`, 'default');
    assert.match(html, /learning-goals/); assert.match(html, /2026-10-20/);
    assert(!html.includes('**')); assert(!/<p[^>]*>\s*<p\b/.test(html)); assert(!/<del\b/.test(html));
    assert(!/href="#\/insurance\/(claims|reading-insurance)/.test(html));
    assert(html.length > 10000);
  }
});

test('D CSS retains proportional zero geometry, patterned semantics and explicit no-motion alternatives', () => {
  const timelines = readFileSync(new URL('../src/components/insurance/timelines.css', import.meta.url), 'utf8');
  assert.match(timelines, /\.timelines-cursor\{[^}]*width:0/);
  assert.match(timelines, /\.timelines-premium\[data-paid=false\]\{opacity:\.4/);
  assert.match(timelines, /\.timelines-renewal-period\[data-active=false\]\{[^}]*border-style:dashed/);
  assert.match(timelines, /\.timelines-year-axis span\{[^}]*white-space:nowrap/);
  assert.match(timelines, /repeating-linear-gradient/); assert.match(timelines, /@media\(prefers-reduced-motion:reduce\)/);
  const surrender = readFileSync(new URL('../src/components/insurance/surrender.css', import.meta.url), 'utf8');
  assert.match(surrender, /\.surrender-difference\{border:2px dashed/);
  assert.match(surrender, /\.surrender-cut\{[^}]*width:0/);
  assert.match(surrender, /radial-gradient/); assert.match(surrender, /repeating-linear-gradient/);
  assert.match(surrender, /@media\(prefers-reduced-motion:reduce\)/);
  assert(!/\.surrender-return[^}]*min-width/.test(surrender), 'Known zero must not acquire a visible cash bar');
});

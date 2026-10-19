/* Run after npm run build. NODE_PATH may point at an isolated playwright install.
 * CHROME_PATH=/usr/bin/google-chrome node scripts/investing-browser-qa.cjs
 * LIVE_URL=https://middleages.github.io/my-books/ checks the deployed build too.
 * Screenshots require human visual review; passing DOM checks does not claim that review.
 */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const out = path.join(root, 'artifacts/investing-browser');
fs.mkdirSync(out, { recursive: true });
const results = { started: new Date().toISOString(), mode: process.env.LIVE_URL ? 'published' : 'local-dist', checks: [], screenshots: [], consoleErrors: [], nonApplicationResourceErrors: [], pageErrors: [], visualReview: 'Required: inspect full-page and scene PNGs; automated checks cannot certify visual explanation or readability.' };
let browser, server, base;
const safe = s => s.replace(/[^a-z0-9_-]/gi, '-');
const assets = html => [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))(?:\?[^"']*)?["']/g)].map(m => path.posix.basename(m[1])).sort();
const catalog = fs.readFileSync(path.join(root, 'src/catalog.ts'), 'utf8');
const chapterRows = [...catalog.matchAll(/\bid:\s*"([^"]+)"\s*,\s*bookId:\s*"([^"]+)"\s*,\s*readId:\s*"([^"]+)"\s*,\s*number:\s*"([^"]+)"/g)].map(m => ({ id: m[1], book: m[2], readId: m[3], number: m[4], route: `/${m[2]}/${m[1]}` }));
const investingChapters = chapterRows.filter(chapter => chapter.book === 'investing');
const investingRoutes = investingChapters.map(chapter => chapter.route);
const bookIds = [...catalog.split('export const books:')[1].matchAll(/\bid:\s*"([^"]+)"/g)].map(m => m[1]);
const appendices = [...fs.readFileSync(path.join(root, 'src/kubernetesAppendices.ts'), 'utf8').matchAll(/id:\s*['"]([^'"]+)['"]/g)].map(m => `/kubernetes/${m[1]}`);
const knownRoutes = ['/', ...bookIds.map(id => `/${id}`), ...chapterRows.map(c => c.route), ...appendices];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function capture(page, name, locator) {
  const filename = `${safe(name)}.png`;
  if (locator) await locator.screenshot({ path: path.join(out, filename), animations: 'disabled', timeout: 15000 });
  else await page.screenshot({ path: path.join(out, filename), fullPage: true, animations: 'disabled', timeout: 15000 });
  results.screenshots.push(filename);
}
async function check(name, page, run) {
  const start = Date.now();
  try { const details = await run(); results.checks.push({ name, status: 'passed', milliseconds: Date.now() - start, details }); }
  catch (error) {
    results.checks.push({ name, status: 'failed', milliseconds: Date.now() - start, error: error.stack || String(error) });
    if (page && !page.isClosed()) {
      await capture(page, `FAIL-${name}`).catch(e => results.checks.at(-1).screenshotError = String(e));
      fs.writeFileSync(path.join(out, `FAIL-${safe(name)}.html`), await page.content().catch(() => 'Unavailable'));
    }
  }
  console.log(`${results.checks.at(-1).status.toUpperCase()} ${name}`);
}
function watchPage(page, contextLabel) {
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const entry = { context: contextLabel, url: page.url(), source: msg.location().url, message: msg.text() };
    if (/\/favicon\.ico(?:\?|$)/.test(entry.source || '') && /404/.test(entry.message)) results.nonApplicationResourceErrors.push(entry);
    else results.consoleErrors.push(entry);
  });
  page.on('pageerror', error => results.pageErrors.push({ context: contextLabel, url: page.url(), message: String(error) }));
}
async function visit(page, route) {
  await page.goto(`${base}${process.env.LIVE_URL ? `?qa=${Date.now()}` : ''}#${route}`, { waitUntil: 'networkidle' });
  await page.locator('main h1').waitFor();
  assert(!/챕터를 찾을 수 없어요/.test(await page.locator('main h1').innerText()), `Unknown route: ${route}`);
}
async function domAudit(page, strict = false) {
  const data = await page.evaluate(({ knownRoutes, strict }) => {
    const main = document.querySelector('main');
    const visible = el => el.getClientRects().length > 0;
    const offenders = [...document.querySelectorAll('body *')].filter(el => visible(el) && el.getBoundingClientRect().right > innerWidth + 1 && !el.closest('.invest-table')).slice(0, 15).map(el => ({ tag: el.tagName, class: el.className?.baseVal ?? el.className, text: el.textContent.slice(0, 100), right: el.getBoundingClientRect().right }));
    const brokenLinks = [...main.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(href => href.startsWith('#/') && !knownRoutes.includes(href.slice(1)));
    const unlabelled = strict ? [...main.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(el => !el.labels?.length && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')).map(el => el.outerHTML) : [];
    const figures = [...main.querySelectorAll('figure')].map(el => ({ caption: el.querySelector('figcaption')?.textContent.trim() || '', width: el.getBoundingClientRect().width }));
    const priceBaselines = [...main.querySelectorAll('.invest-price-plot')].map(el => el.getBoundingClientRect().bottom);
    return { priceBaselines, title: document.title, h1: main.querySelectorAll('h1').length, headings: [...main.querySelectorAll('h1,h2,h3')].map(el => el.textContent), width: innerWidth, scrollWidth: document.documentElement.scrollWidth, offenders, brokenLinks, del: main.querySelectorAll('del').length, nestedParagraphs: main.querySelectorAll('p p').length, rawStars: main.innerText.includes('**'), unlabelled, figures, textLength: main.innerText.length };
  }, { knownRoutes, strict });
  assert.equal(data.h1, 1, JSON.stringify(data));
  assert(data.textLength > 150, 'Main content is suspiciously empty');
  assert(data.scrollWidth <= data.width + 1, `Page overflow: ${JSON.stringify(data)}`);
  assert.equal(data.brokenLinks.length, 0, `Unknown catalog links: ${data.brokenLinks}`);
  assert.equal(data.del, 0, 'Unexpected MDX del tag');
  assert.equal(data.nestedParagraphs, 0, 'Nested paragraphs');
  assert.equal(data.rawStars, false, 'Raw emphasis markers in rendered text');
  assert.equal(data.unlabelled.length, 0, `Unlabelled inputs: ${data.unlabelled}`);
  if (strict) for (const f of data.figures) assert(f.caption, 'Figure missing caption');
  if (data.priceBaselines.length > 1) assert(Math.max(...data.priceBaselines) - Math.min(...data.priceBaselines) <= 1, `Price chart baselines differ: ${data.priceBaselines}`);
  return data;
}
async function playbackChecks(page, lab, name) {
  const controls = lab.locator('.money-playback');
  assert.equal(await controls.count(), 1, `${name}: playback controls missing`);
  const frame = () => controls.locator('span').innerText();
  await controls.getByRole('button', { name: '처음부터', exact: true }).click();
  const initial = await frame();
  await delay(1800);
  assert.equal(await frame(), initial, 'Autoplay started without user input');
  await controls.getByRole('button', { name: '한 단계 진행', exact: true }).click();
  assert.notEqual(await frame(), initial, 'Stepping did not advance');
  await controls.getByRole('button', { name: '처음부터', exact: true }).click();
  assert.equal(await frame(), initial, 'Rewind did not restore initial frame');
  await controls.getByRole('button', { name: '재생', exact: true }).click();
  // Pause before the first tick so the one-step dividend scene is testable too.
  await delay(250);
  const stop = controls.getByRole('button', { name: '정지', exact: true });
  assert(await stop.isVisible(), 'Playback completed before a pause could be tested');
  await stop.click();
  const paused = await frame();
  await delay(1850);
  assert.equal(await frame(), paused, 'Frame advanced while paused');
  await controls.getByRole('button', { name: '재생', exact: true }).click();
  await page.waitForFunction(el => !el.textContent.trim().startsWith('0 /'), await controls.locator('span').elementHandle(), { timeout: 5000 });
  await controls.getByRole('button', { name: '처음부터', exact: true }).click();
  const select = lab.locator('.invest-predict select');
  assert.equal(await select.count(), 1, `${name}: prediction selector missing`);
  await select.selectOption({ index: 1 });
  const step = controls.getByRole('button', { name: '한 단계 진행', exact: true });
  for (let i = 0; i < 20 && await step.isEnabled(); i++) await step.click();
  assert(await step.isDisabled(), 'Playback does not terminate within 20 steps');
  assert.match(await lab.locator('.invest-result').innerText(), /예측과/, 'Prediction feedback absent at final step');
  await capture(page, `${name}-final-scene`, lab);
  const summaries = lab.locator('details > summary');
  assert(await summaries.count() > 0, 'Static alternative missing');
  for (let i = 0; i < await summaries.count(); i++) await summaries.nth(i).click();
  assert(await lab.locator('details[open] table tbody tr').count() > 1, 'Static table has no frames');
  const tableRegion = lab.locator('.invest-table').first();
  const tableSize = await tableRegion.evaluate(el => ({ width: el.clientWidth, scrollWidth: el.scrollWidth }));
  if (tableSize.scrollWidth > tableSize.width + 1) {
    await tableRegion.focus();
    await page.keyboard.press('ArrowRight');
    await delay(250);
    assert(await tableRegion.evaluate(el => el.scrollLeft > 0), 'Static table cannot be scrolled by keyboard');
    await tableRegion.evaluate(el => { el.scrollLeft = 0; });
  }
  await capture(page, `${name}-static-table`, lab.locator('details').first());
  await controls.getByRole('button', { name: '처음부터', exact: true }).click();
  // Keyboard navigation, rather than programmatic focus, exercises :focus-visible.
  await controls.getByRole('button', { name: '재생', exact: true }).focus();
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => { const el = document.activeElement; const style = getComputedStyle(el); return { text: el.textContent, visible: el.matches(':focus-visible'), outline: style.outlineStyle, width: style.outlineWidth }; });
  assert.match(focus.text, /한 단계 진행/);
  assert(focus.visible && focus.outline !== 'none' && focus.width !== '0px', `Focus indicator missing: ${JSON.stringify(focus)}`);
  await page.keyboard.press('Enter');
  assert.notEqual(await frame(), initial, 'Enter on focused step did not advance');
  return { initial, paused, focus };
}
async function conditionChecks(page, lab, name) {
  const { ownershipFrames } = await import('../src/simulations/investing/ownership.mjs');
  const { totalReturnFrames } = await import('../src/simulations/investing/total-return.mjs');
  const format = value => value.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
  const ratio = value => value === null ? '정의 불가' : `${format(value * 100)}%`;
  const label = await lab.getAttribute('aria-label');
  const observed = [];
  const finish = async () => {
    const step = lab.locator('.money-playback').getByRole('button', { name: '한 단계 진행', exact: true });
    for (let i = 0; i < 20 && await step.isEnabled(); i++) await step.click();
    assert(await step.isDisabled());
  };
  const range = async key => { await lab.locator('input[type=range]').focus(); await page.keyboard.press(key); };
  const setRange = async (accessibleName, value) => {
    const slider = lab.getByRole('slider', { name: accessibleName });
    const bounds = await slider.evaluate(el => ({ min: +el.min, max: +el.max, step: +(el.step || 1) }));
    assert(value >= bounds.min && value <= bounds.max && Number.isInteger((value - bounds.min) / bounds.step), `Invalid range test value: ${value}`);
    await slider.focus();
    await page.keyboard.press('Home');
    for (let i = 0; i < (value - bounds.min) / bounds.step; i++) await page.keyboard.press('ArrowRight');
    assert.equal(await slider.inputValue(), String(value), `Range ${accessibleName} did not reach requested value`);
  };
  // Compare actual painted lengths with the model, not just inline styles or text.
  const verifyStacks = async (locator, expected, description, childSelector = null) => {
    const actual = await locator.evaluateAll((elements, childSelector) => elements.map(element => {
      const style = getComputedStyle(element), bounds = element.getBoundingClientRect();
      const inset = parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
      const width = bounds.width - inset - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight);
      return { width, segments: [...element.children].filter(child => !childSelector || child.matches(childSelector)).map(child => { const box = child.getBoundingClientRect(); return { width: box.width, left: box.left - bounds.left - inset }; }) };
    }), childSelector);
    assert.equal(actual.length, expected.length, `${description}: wrong number of model bars`);
    actual.forEach((bar, index) => {
      assert(bar.width > 0, `${description}: bar has no visible width`);
      assert.equal(bar.segments.length, expected[index].length, `${description}: wrong number of segments`);
      let offset = 0;
      bar.segments.forEach((segment, part) => {
        const wanted = expected[index][part] * bar.width;
        assert(Math.abs(segment.width - wanted) <= 1, `${description}: bar ${index}, segment ${part} width ${segment.width} != model ${wanted}`);
        assert(Math.abs(segment.left - offset) <= 1, `${description}: segments overlap or leave an unmodelled gap`);
        offset += wanted;
      });
      assert(offset <= bar.width + 1, `${description}: model segments exceed bar scale`);
    });
    return actual;
  };
  const verifyResponsivePanels = async locator => {
    const boxes = await locator.evaluateAll(elements => elements.map(element => { const box = element.getBoundingClientRect(); return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, width: box.width }; }));
    assert.equal(boxes.length, 2, 'Expected two comparison panels');
    if (page.viewportSize().width <= 600) {
      assert(boxes[1].top >= boxes[0].bottom, 'Mobile comparison panels overlap instead of stacking');
      assert(Math.abs(boxes[0].left - boxes[1].left) <= 1 && Math.abs(boxes[0].width - boxes[1].width) <= 1, 'Mobile comparison panels do not share a readable full-width alignment');
    } else {
      assert(Math.abs(boxes[0].top - boxes[1].top) <= 1 && boxes[1].left >= boxes[0].right, 'Desktop comparison panels do not form non-overlapping aligned columns');
    }
  };
  const verify = async (scenario, expected, kind, inspectFrame, tableExpected = expected) => {
    const predictedOutcome = inspectFrame ? expected.at(-1).predictionOutcome ?? expected.at(-1).status ?? expected.find(frame => frame.phase === 'closing')?.closingCashDirection : undefined;
    if (predictedOutcome) await lab.locator('.invest-predict select').selectOption(predictedOutcome);
    if (inspectFrame) {
      const controls = lab.locator('.money-playback');
      await controls.getByRole('button', { name: '처음부터', exact: true }).click();
      const step = controls.getByRole('button', { name: '한 단계 진행', exact: true });
      for (let index = 0; index < expected.length; index++) {
        assert.equal(await controls.locator('span').innerText(), `${index} / ${expected.length - 1} 단계`, `${scenario}: wrong visible frame`);
        await inspectFrame(expected[index], index);
        if (index < expected.length - 1) {
          assert(await step.isEnabled(), `${scenario}: playback ended before model frames`);
          await step.click();
        }
      }
      assert(await step.isDisabled(), `${scenario}: playback exceeds model frames`);
    } else await finish();
    const summary = lab.locator('details > summary').first();
    if (!(await lab.locator('details').first().getAttribute('open') !== null)) await summary.click();
    const rows = await lab.locator('details').first().locator('table tbody tr').evaluateAll(els => els.map(el => [...el.querySelectorAll('td')].map(td => td.textContent.trim())));
    const wanted = tableExpected.map(typeof kind === 'function' ? kind : row => kind === 'ownership'
      ? [format(row.companyCash), format(row.buyerCash), format(row.sellerCash), format(row.cashTotal), format(row.totalShares), `${format(row.buyerShares)} / ${format(row.sellerShares)}`, ratio(row.ownershipRatio)]
      : kind === 'dividend' ? [format(row.companyCash), format(row.cash), format(row.otherShareholdersCash), format(row.cashTotal), format(row.stockValue), format(row.wealth)]
      : [format(row.price), format(row.shares), format(row.stockValue), format(row.cash), format(row.wealth), format(row.dividendsReceived), format(row.unrealizedGain), format(row.realizedGain), ratio(row.totalReturn)]);
    assert.deepEqual(rows, wanted, `${scenario}: rendered table differs from model frames`);
    assert((await lab.locator('.invest-result').innerText()).includes(expected.at(-1).message), `${scenario}: live explanation differs from model`);
    if (predictedOutcome) {
      assert((await lab.locator('.invest-result').innerText()).startsWith('예측과 같습니다.'), `${scenario}: matching model prediction was not marked correct`);
      const alternative = await lab.locator('.invest-predict select option').evaluateAll((options, expected) => options.find(option => option.value && option.value !== expected)?.value, predictedOutcome);
      assert(alternative, `${scenario}: prediction needs an alternate outcome`);
      await lab.locator('.invest-predict select').selectOption(alternative);
      assert((await lab.locator('.invest-result').innerText()).startsWith('예측과 다릅니다.'), `${scenario}: wrong prediction was not marked incorrect`);
      await lab.locator('.invest-predict select').selectOption(predictedOutcome);
    }
    await domAudit(page, true);
    await capture(page, `${name}-${scenario}`, lab);
    observed.push({ scenario, frames: rows.length, final: rows.at(-1) });
  };
  if (label === '발행과 유통 거래 실험') {
    await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
    await verify('issuance-default', ownershipFrames({ mode: 'issuance', quantity: 50 }).frames, 'ownership');
    await lab.getByRole('button', { name: '유통 매매 · 기존 주주에게 구매', exact: true }).click();
    await verify('secondary-default', ownershipFrames({ mode: 'secondary', quantity: 50 }).frames, 'ownership');
    await range('End');
    await verify('secondary-rejected-120', ownershipFrames({ mode: 'secondary', quantity: 120 }).frames, 'ownership');
    await range('Home');
    await verify('secondary-zero', ownershipFrames({ mode: 'secondary', quantity: 0 }).frames, 'ownership');
  } else if (label === '배당 전후 자산 경계 실험') {
    await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
    await verify('dividend-default', totalReturnFrames({ dividendPerShare: 5 }).frames.slice(0, 2), 'dividend');
    await range('End');
    await verify('dividend-rejected-15', totalReturnFrames({ dividendPerShare: 15 }).frames.slice(0, 2), 'dividend');
    await range('Home');
    await verify('dividend-zero', totalReturnFrames({ dividendPerShare: 0 }).frames.slice(0, 2), 'dividend');
  } else if (label === '가격 변화 재투자 매도 총수익 실험') {
    await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
    await verify('cash-default', totalReturnFrames({ endPrice: 110, reinvest: false, sellShares: 0 }).frames, 'return');
    await lab.getByRole('combobox', { name: /배당 현금 처리/ }).selectOption('yes');
    await lab.getByRole('combobox', { name: /이후 매도할 수량/ }).selectOption('1');
    await verify('reinvest-and-sell-one', totalReturnFrames({ endPrice: 110, reinvest: true, sellShares: 1 }).frames, 'return');
    await lab.getByRole('combobox', { name: /이후 매도할 수량/ }).selectOption('2');
    await verify('reject-sale-two', totalReturnFrames({ endPrice: 110, reinvest: true, sellShares: 2 }).frames, 'return');
    await range('Home');
    await verify('zero-price-reinvestment', totalReturnFrames({ endPrice: 0, reinvest: true, sellShares: 2 }).frames, 'return');
  } else if (label === '호가 잔량과 주문 체결 실험') {
    const { ordersFrames } = await import('../src/simulations/investing/orders.mjs');
    const cells = row => [row.currentFill ? `${row.currentFill.askId}: ${format(row.currentFill.price)} × ${format(row.currentFill.quantity)}` : '추가 체결 없음', format(row.filledQuantity), format(row.remainingQuantity), format(row.notional), row.averagePrice === null ? '정의 불가' : format(row.averagePrice), `${format(row.buyerCash)} / ${format(row.sellerCash)}`, format(row.shareTotal)];
    const inspect = async frame => {
      const figure = lab.locator('figure');
      const panels = figure.locator('.invest-comparison > .invest-wallet');
      const expectedBars = [...frame.asks.map(ask => [ask.remainingFraction, ask.filledFraction]), [frame.orderFilledFraction, frame.orderUnfilledFraction], [frame.buyerCashFraction, frame.sellerCashFraction]];
      await verifyStacks(figure.locator('.invest-stack'), expectedBars, `orders ${frame.phase}`);
      await verifyResponsivePanels(panels);
      const bookText = await panels.nth(0).innerText();
      for (const ask of frame.asks) {
        assert(bookText.includes(`${format(ask.price)}단위 · ${ask.id}`), 'Displayed ask identity/price differs from model');
        assert(bookText.includes(`남음 ${format(ask.remainingQuantity)}주 / 소비 ${format(ask.filledQuantity)}주`), 'Displayed ask quantity differs from model');
      }
      assert.equal((bookText.match(/지정가 초과/g) || []).length, frame.asks.filter(ask => !ask.withinLimit).length, 'Limit-price exclusion markings differ from model');
      const orderText = await panels.nth(1).innerText();
      assert(orderText.includes(`체결 ${format(frame.filledQuantity)}주`) && orderText.includes(`미체결 ${format(frame.remainingQuantity)}주`), 'Live filled/unfilled quantities differ from model');
      assert(orderText.includes(`체결대금 합계 ${format(frame.notional)}단위`), 'Live notional differs from model');
      assert(orderText.includes(frame.averagePrice === null ? '정의 불가 · 체결 0주' : `${format(frame.averagePrice)}단위 / 주`), 'Live average price differs from model');
      assert(orderText.includes(`이번 주문 마지막 체결가 ${frame.lastFillPrice === null ? '없음' : `${format(frame.lastFillPrice)}단위`}`), 'Last fill price differs from model');
      const tiles = await panels.nth(1).locator('.invest-share-grid > i').evaluateAll(elements => elements.map(element => getComputedStyle(element).borderStyle));
      assert.equal(tiles.length, frame.filledQuantity + frame.remainingQuantity, 'One-share tile count differs from order');
      assert.equal(tiles.filter(style => style === 'solid').length, frame.filledQuantity, 'Filled share tile count differs from model');
      assert.equal(tiles.filter(style => style === 'dashed').length, frame.remainingQuantity, 'Unfilled share tile count differs from model');
      assert((await lab.locator('.invest-result').innerText()).includes(frame.message), 'Live frame explanation differs from model');
    };
    await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
    const standard = ordersFrames();
    assert.equal(standard.summary.filledQuantity, 15);
    assert.equal(standard.summary.notional, 1505);
    assert.equal(standard.summary.averagePrice, 1505 / 15);
    await verify('market-15-cost-1505', standard.frames, cells, inspect);
    await lab.getByRole('button', { name: '지정가 매수', exact: true }).click();
    const limited = ordersFrames({ mode: 'limit', limitPrice: 100 });
    assert.equal(limited.summary.filledQuantity, 10);
    assert.equal(limited.summary.notional, 1000);
    assert.equal(limited.summary.reason, 'limit');
    await verify('limit-100-partial', limited.frames, cells, inspect);
    await setRange(/매수 지정가/, 99);
    await verify('limit-below-all-asks', ordersFrames({ mode: 'limit', limitPrice: 99 }).frames, cells, inspect);
    await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
    await lab.getByRole('combobox', { name: /매도 호가 시나리오/ }).selectOption('empty');
    const empty = ordersFrames({ asks: [] });
    assert.equal(empty.summary.notional, 0);
    assert.equal(empty.summary.reason, 'liquidity');
    await verify('no-liquidity', empty.frames, cells, inspect);
    await lab.getByRole('combobox', { name: /매도 호가 시나리오/ }).selectOption('thin');
    await verify('thin-book-partial', ordersFrames({ asks: [{ id: 'A', price: 100, quantity: 2, arrival: 1 }, { id: 'B', price: 101, quantity: 3, arrival: 2 }] }).frames, cells, inspect);
    await lab.getByRole('combobox', { name: /매도 호가 시나리오/ }).selectOption('queue');
    const queued = ordersFrames({ asks: [{ id: '나중', price: 100, quantity: 4, arrival: 2 }, { id: '먼저', price: 100, quantity: 6, arrival: 1 }, { id: '다음 가격', price: 101, quantity: 10, arrival: 3 }] });
    assert.deepEqual(queued.summary.fills.map(fill => fill.askId), ['먼저', '나중', '다음 가격']);
    await verify('equal-price-arrival-order', queued.frames, cells, inspect);
    await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
    await setRange(/사용 가능한 예산/, 1000);
    const constrained = ordersFrames({ budget: 1000 });
    assert.equal(constrained.summary.filledQuantity, 10);
    assert.equal(constrained.summary.buyerCash, 0);
    assert.equal(constrained.summary.reason, 'budget');
    await verify('budget-1000-partial', constrained.frames, cells, inspect);
    await setRange(/사용 가능한 예산/, 0);
    await verify('budget-zero', ordersFrames({ budget: 0 }).frames, cells, inspect);
    await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
    await setRange(/매수 주문 수량/, 0);
    await verify('order-zero', ordersFrames({ quantity: 0 }).frames, cells, inspect);
  } else if (label === '기업의 이익과 현금 실험') {
    const { financialStatementsFrames } = await import('../src/simulations/investing/financial-statements.mjs');
    const cells = row => [row.period, ...[row.cash, row.receivables, row.assets, row.liabilities, row.equity, row.periodRevenue, row.periodExpenses, row.periodProfit, row.periodOperatingCashFlow].map(format)];
    const inspect = async frame => {
      assert.equal(await lab.locator('.invest-stage').innerText(), frame.label, 'Live accounting stage differs from model');
      assert.equal(await lab.locator('.invest-timeline [aria-current=step]').innerText(), frame.label, 'Accounting timeline highlights wrong frame');
      const balance = lab.getByRole('figure', { name: '현재 단계 자산과 부채·자본의 균형', exact: true });
      const bars = balance.getByRole('img');
      await verifyStacks(bars, [frame.assetSegments.map(part => part.fraction), frame.fundingSegments.map(part => part.fraction)], `statements ${frame.phase}`);
      assert.deepEqual(await balance.locator('.invest-legend b').allTextContents(), [...frame.assetSegments, ...frame.fundingSegments].map(part => `${part.label} ${format(part.value)}단위`), 'Balance-sheet legend differs from model');
      assert((await balance.innerText()).includes(`자산 ${format(frame.assets)}단위 = 부채 ${format(frame.liabilities)}단위 + 자본 ${format(frame.equity)}단위`), 'Displayed accounting identity differs from model');
      assert((await balance.innerText()).includes(`0–${format(frame.balanceScale)}단위`), 'Common balance-sheet scale is missing');
      const paths = lab.getByRole('figure', { name: '서비스 매출이 현금과 매출채권으로 갈라지는 경로', exact: true });
      await verifyStacks(paths.locator('.invest-stack'), [[frame.saleSplit.cashFraction], [frame.saleSplit.creditFraction]], `sale split ${frame.phase}`);
      await verifyResponsivePanels(paths.locator('.invest-dividend-fork > .invest-wallet'));
      const panels = lab.locator(':scope > .invest-comparison > .invest-wallet');
      await verifyResponsivePanels(panels);
      const income = await panels.nth(0).innerText(), cash = await panels.nth(1).innerText();
      assert(income.includes(`${frame.period}의 손익`) && income.includes(`매출 ${format(frame.periodRevenue)}단위 − 비용 ${format(frame.periodExpenses)}단위`) && income.includes(`이익 ${format(frame.periodProfit)}단위`), 'Live period income differs from model');
      assert(cash.includes(`${frame.period}의 현금`) && cash.includes(`기초 현금 ${format(frame.periodOpeningCash)}단위 + 영업 현금흐름 ${format(frame.periodOperatingCashFlow)}단위`) && cash.includes(`현재 현금 ${format(frame.cash)}단위`), 'Live period cash flow differs from model');
      assert((await lab.locator('.invest-result').innerText()).includes(frame.message), 'Live accounting explanation differs from model');
    };
    for (const creditSales of [120, 0, 40]) {
      await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
      await setRange(/매출 120단위 중 외상액/, creditSales);
      const result = financialStatementsFrames({ creditSales });
      assert.equal(result.closing.periodProfit, 40);
      assert.equal(result.closing.cash, 140 - creditSales);
      assert.equal(result.closing.periodOperatingCashFlow, 40 - creditSales);
      assert.equal(result.summary.cash, 140);
      assert.equal(result.summary.receivables, 0);
      assert.equal(result.summary.periodRevenue, 0, 'Collection must not recognize revenue again');
      assert.equal(result.summary.periodProfit, 0, 'Collection must not recognize profit again');
      assert.equal(result.summary.cumulativeRevenue, 120);
      assert.equal(result.summary.cumulativeProfit, 40);
      await verify(`credit-${creditSales}-then-collection`, result.frames, cells, inspect);
      await lab.getByRole('button', { name: '당기 말 바로 보기', exact: true }).click();
      assert.equal(await lab.locator('.money-playback span').innerText(), '3 / 4 단계');
      await inspect(result.closing);
      await capture(page, `${name}-credit-${creditSales}-closing`, lab);
    }
  } else if (label === '주가·시가총액·주당이익 실험') {
    const { shareValuationFrames } = await import('../src/simulations/investing/valuation.mjs');
    const nullable = value => value === null ? '정의 불가' : format(value);
    const cells = frame => [frame.price, frame.shares, frame.marketCap, frame.earnings].map(format).concat([nullable(frame.eps), nullable(frame.per)]);
    const inspect = result => async frame => {
      assert.equal(await lab.locator('.invest-stage').innerText(), frame.label);
      const panels = lab.locator('.valuation-share-panel');
      const expected = [result.before, frame];
      const mosaics = panels.locator('.valuation-mosaic');
      const boxes = await mosaics.evaluateAll(elements => elements.map(element => {
        const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
        return { width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom, left: rect.left,
          columns: style.gridTemplateColumns.split(' ').map(Number.parseFloat), rows: style.gridTemplateRows.split(' ').map(Number.parseFloat),
          tiles: [...element.children].map(child => { const r = child.getBoundingClientRect(); return { width: r.width, height: r.height, fraction: +child.dataset.shareFraction }; }) };
      }));
      assert.equal(boxes.length, 2);
      assert(Math.abs(boxes[0].width - boxes[1].width) <= 1 && Math.abs(boxes[0].height - boxes[1].height) <= 1, 'Split changes the outer company boundary area');
      if (page.viewportSize().width <= 650) assert(boxes[1].top > boxes[0].bottom, 'Mobile split panels do not stack');
      for (let index = 0; index < expected.length; index++) {
        const snapshot = expected[index], box = boxes[index];
        assert.equal(box.tiles.length, snapshot.tiles.length, 'Share mosaic tile count differs from model');
        assert.equal(box.columns.length, snapshot.gridColumns);
        assert.equal(box.rows.length, snapshot.gridRows);
        box.tiles.forEach(tile => {
          assert(Math.abs(tile.width - box.columns[0]) <= 1 && Math.abs(tile.height - box.rows[0]) <= 1, 'Mosaic tile does not use the model grid');
          assert.equal(tile.fraction, snapshot.tiles[0].fraction);
        });
        const text = await panels.nth(index).innerText();
        for (const value of [`${format(snapshot.price)}단위`, `${format(snapshot.shares)}주`, `${format(snapshot.marketCap)}단위`]) assert(text.includes(value), `Share visual missing model value ${value}`);
      }
      const metrics = await lab.locator('.valuation-metrics').innerText();
      assert(metrics.includes(`EPS ${nullable(frame.eps)}`) && metrics.includes(`PER ${nullable(frame.per)}`), 'EPS/PER differs from model');
      assert((await lab.locator('.invest-result').innerText()).includes(frame.message));
    };
    const cases = [{ splitFactor: 2, earnings: 10000 }, { splitFactor: 1, earnings: 10000 }, { splitFactor: 5, earnings: 10000 }, { splitFactor: 5, earnings: 0 }, { splitFactor: 2, earnings: -10000 }, { splitFactor: 2, earnings: 20000 }];
    for (const input of cases) {
      await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
      await lab.getByRole('combobox', { name: /분할 배수/ }).selectOption(String(input.splitFactor));
      await setRange(/당기 이익/, input.earnings);
      const result = shareValuationFrames(input);
      assert.equal(result.before.marketCap, 100000);
      assert.equal(result.after.marketCap, result.before.marketCap);
      await verify(`split-${input.splitFactor}-earnings-${input.earnings}`, result.frames, cells, inspect(result));
    }
  } else if (label === '미래 현금의 현재가치 실험') {
    const { cashFlowValuationFrames } = await import('../src/simulations/investing/valuation.mjs');
    const cells = frame => [frame.year1Present, frame.year2Present, frame.year3Present].map(value => value === null ? '미반영' : format(value)).concat(format(frame.observedPresentValue));
    const inspect = result => async frame => {
      assert.equal(await lab.locator('.invest-stage').innerText(), frame.label);
      const years = lab.locator('.valuation-flow-year');
      assert.equal(await years.count(), frame.contributions.length);
      const boxes = await years.evaluateAll(elements => elements.map(element => { const r = element.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, width: r.width, left: r.left, right: r.right }; }));
      for (let index = 1; index < boxes.length; index++) {
        if (page.viewportSize().width <= 650) assert(boxes[index].top >= boxes[index - 1].bottom, 'Mobile cash-flow years overlap');
        else assert(Math.abs(boxes[index].top - boxes[0].top) <= 1 && boxes[index].left >= boxes[index - 1].right, 'Desktop cash-flow years overlap');
      }
      for (let index = 0; index < frame.contributions.length; index++) {
        const flow = frame.contributions[index], year = years.nth(index), bars = year.locator('.valuation-cash-bar');
        await verifyStacks(bars.nth(0), [flow.futureSegments.map(part => part.fraction)], `valuation future year ${flow.year}`);
        if (flow.observed) await verifyStacks(bars.nth(1), [flow.presentSegments.map(part => part.fraction)], `valuation present year ${flow.year}`);
        else {
          assert.equal(await bars.nth(1).locator('i').count(), 0, 'Unobserved present value is drawn as a measured amount');
          assert((await bars.nth(1).getAttribute('aria-label')).includes('아직'));
        }
        const text = await year.innerText();
        assert(text.includes(`매년 ${format(flow.regularCash)} + 잔존 ${format(flow.residualCash)}`), 'Residual/regular cash split differs from model');
        assert(text.includes(`÷ ${format(flow.discountDivisor)}`), 'Discount divisor differs from model');
      }
      await verifyStacks(lab.locator('.valuation-current-total .valuation-cash-bar'), [frame.totalSegments.map(part => part.fraction)], 'valuation accumulated present value');
      const scaleWidths = await lab.locator('.valuation-cash-bar').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
      assert(Math.max(...scaleWidths) - Math.min(...scaleWidths) <= 1, `Valuation common-scale bars differ in painted width: ${scaleWidths}`);
      assert((await lab.locator('.valuation-current-total').innerText()).includes(`${format(frame.observedPresentValue)}단위/주`));
      assert((await lab.locator('figcaption').innerText()).includes(`0–${format(result.scale)}`));
      assert((await lab.locator('.invest-result').innerText()).includes(frame.message));
    };
    const cases = [
      { annualCash: 10, residualCash: 80, ratePercent: 10 },
      { annualCash: 10, residualCash: 80, ratePercent: 0 },
      { annualCash: 10, residualCash: 80, ratePercent: 20 },
      { annualCash: 0, residualCash: 0, ratePercent: 20 },
      { annualCash: 0, residualCash: 80, ratePercent: 10 },
      { annualCash: 20, residualCash: 160, ratePercent: 20 },
    ];
    for (const input of cases) {
      await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
      await setRange(/할인율/, input.ratePercent);
      await setRange(/매년 현금/, input.annualCash);
      await setRange(/3년 말 잔존 현금/, input.residualCash);
      const result = cashFlowValuationFrames(input);
      assert.equal(result.flows[2].futureCash, input.annualCash + input.residualCash);
      assert.equal(result.undiscountedTotal, input.annualCash * 3 + input.residualCash);
      if (input.ratePercent === 0) assert.equal(result.totalPresentValue, result.undiscountedTotal);
      await verify(`cash-${input.annualCash}-residual-${input.residualCash}-rate-${input.ratePercent}`, result.frames, cells, inspect(result));
      const details = lab.locator('details').nth(1);
      if (await details.getAttribute('open') === null) await details.locator('summary').click();
      const rows = await details.locator('tbody tr').evaluateAll(elements => elements.map(element => [...element.querySelectorAll('td')].map(cell => cell.textContent.trim())));
      assert.deepEqual(rows, result.flows.map(flow => [flow.regularCash, flow.residualCash, flow.futureCash, flow.discountDivisor, flow.presentValue].map(format)), 'Complete cash-flow schedule differs from model');
    }
  } else if (label === '채권 가격과 요구수익률 실험') {
    const { bondFrames } = await import('../src/simulations/investing/bonds.mjs');
    const cells = frame => [frame.year, frame.presentValue, frame.accumulatedPV].map(format);
    const inspect = result => async frame => {
      assert.equal(await lab.locator('.invest-stage').innerText(), frame.label);
      assert.equal(await lab.getByTestId('bonds-price').innerText(), `${format(frame.accumulatedPV)}단위`);
      const rows = lab.locator('.bond-time-row');
      assert.equal(await rows.count(), result.schedule.length);
      for (let index = 0; index < result.schedule.length; index++) {
        const payment = result.schedule[index], row = rows.nth(index);
        await verifyStacks(row.locator('.bond-bar'), [payment.promisedSegments.map(part => part.fraction), payment.presentSegments.map(part => part.fraction)], `bond year ${payment.year} cash and present value`);
        await verifyResponsivePanels(row.locator('.bond-pair > div'));
        assert.equal(await row.getAttribute('aria-current'), frame.year === payment.year ? 'step' : null, 'Pricing observation highlights wrong year');
        const text = await row.innerText();
        assert(text.includes(`그때의 약속 ${format(payment.promisedCash)}단위`) && text.includes(`오늘 가치 ${format(payment.presentValue)}단위`), 'Promised/PV cash labels differ from model');
      }
      const chart = lab.locator('.bond-chart svg');
      // Node and Chrome can differ in the last binary digits of exponentiation.
      // Compare model coordinates numerically at a sub-pixel tolerance, never as strings.
      const curvePoints = (await chart.locator('polyline').getAttribute('points')).split(' ').map(point => point.split(',').map(Number));
      assert.equal(curvePoints.length, result.sensitivity.length);
      curvePoints.forEach((point, index) => {
        assert(Math.abs(point[0] - result.sensitivity[index].x) <= 1e-9 && Math.abs(point[1] - result.sensitivity[index].y) <= 1e-9, 'Yield curve differs from model points');
      });
      const point = await chart.locator('circle').evaluate(element => {
        const bounds = element.getBoundingClientRect(), svg = element.ownerSVGElement, matrix = svg.getScreenCTM();
        const p = svg.createSVGPoint(); p.x = +element.getAttribute('cx'); p.y = +element.getAttribute('cy'); const screen = p.matrixTransform(matrix);
        return { cx: +element.getAttribute('cx'), cy: +element.getAttribute('cy'), screenX: screen.x, screenY: screen.y, actualX: bounds.x + bounds.width / 2, actualY: bounds.y + bounds.height / 2 };
      });
      assert(Math.abs(point.cx - result.selectedPoint.x) <= 1e-9 && Math.abs(point.cy - result.selectedPoint.y) <= 1e-9, 'Selected point differs from model coordinates');
      assert(Math.abs(point.actualX - point.screenX) <= 1 && Math.abs(point.actualY - point.screenY) <= 1, 'Selected yield point does not paint at model coordinates');
      const labels = await chart.locator('text').evaluateAll(elements => elements.map(element => {
        const box = element.getBBox(), svg = element.ownerSVGElement, viewBox = svg.viewBox.baseVal, matrix = svg.getScreenCTM();
        return { text: element.textContent, left: box.x, top: box.y, right: box.x + box.width, bottom: box.y + box.height, width: viewBox.width, height: viewBox.height, renderedFont: parseFloat(getComputedStyle(element).fontSize) * matrix.a };
      }));
      for (const text of labels) {
        assert(text.left >= -1 && text.right <= text.width + 1 && text.top >= -1 && text.bottom <= text.height + 1, `Bond chart label outside viewBox: ${JSON.stringify(text)}`);
        assert(text.renderedFont >= 11.9, `Bond chart tick too small: ${JSON.stringify(text)}`);
      }
      const tickLabels = await lab.locator('.bond-chart-plot > span').evaluateAll(elements => elements.map(element => {
        const range = document.createRange(); range.selectNodeContents(element); const glyph = range.getBoundingClientRect();
        const bounds = element.getBoundingClientRect(), plot = element.parentElement.getBoundingClientRect(), figure = element.closest('figure').getBoundingClientRect();
        return { kind: element.className, text: element.textContent, font: parseFloat(getComputedStyle(element).fontSize), xFraction: (bounds.x + bounds.width / 2 - plot.x) / plot.width, yFraction: (bounds.y + bounds.height / 2 - plot.y) / plot.height, within: glyph.left >= figure.left && glyph.right <= figure.right && glyph.top >= figure.top && glyph.bottom <= figure.bottom };
      }));
      const xLabels = tickLabels.filter(tick => tick.kind === 'bond-x-label'), yLabels = tickLabels.filter(tick => tick.kind === 'bond-y-label');
      assert.deepEqual(xLabels.map(tick => tick.text), result.sensitivityTicks.map(tick => format(tick.requiredYield * 100)));
      assert.deepEqual(yLabels.map(tick => tick.text), result.priceTicks.map(tick => format(tick.value)));
      xLabels.forEach((tick, index) => assert(Math.abs(tick.xFraction - result.sensitivityTicks[index].xFraction) < 0.005, 'HTML yield tick position differs from model'));
      yLabels.forEach((tick, index) => assert(Math.abs(tick.yFraction - result.priceTicks[index].yFraction) < 0.005, 'HTML price tick position differs from model'));
      for (const tick of tickLabels) assert(tick.font >= 12 && tick.within, `HTML tick is tiny or outside figure: ${JSON.stringify(tick)}`);
      assert((await lab.locator('.invest-result').innerText()).includes(frame.message));
    };
    for (const requiredYield of [0.05, 0, 0.025, 0.1, 0.2]) {
      await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
      await setRange(/요구수익률/, requiredYield * 100);
      const result = bondFrames({ requiredYield });
      if (requiredYield === 0.05) assert(Math.abs(result.price - 1000) < 1e-9);
      if (requiredYield === 0) assert.equal(result.price, 1150);
      assert.deepEqual(result.schedule.map(row => [row.promisedCoupon, row.promisedPrincipal]), [[50, 0], [50, 0], [50, 1000]]);
      await verify(`yield-${requiredYield * 100}`, result.pricingFrames, cells, inspect(result));
      const details = lab.locator('details').nth(1);
      if (await details.getAttribute('open') === null) await details.locator('summary').click();
      const table = await details.locator('tbody tr').evaluateAll(elements => elements.map(element => [...element.querySelectorAll('td')].map(cell => cell.textContent.trim())));
      assert.deepEqual(table, result.schedule.map(row => [row.promisedCoupon, row.promisedPrincipal, row.presentCoupon, row.presentPrincipal, row.presentValue].map(format)), 'Bond schedule table differs from model');
      await capture(page, `${name}-yield-${requiredYield * 100}-chart`, lab.locator('.bond-chart'));
    }
  } else if (label === '채권 약속과 실제 지급 실험') {
    const { bondFrames } = await import('../src/simulations/investing/bonds.mjs');
    const cells = frame => [frame.promisedCoupon, frame.promisedPrincipal, frame.actualCoupon, frame.actualPrincipal, frame.promisedCash, frame.actualCash, frame.netCashFlow].map(format).concat(frame.isMatured ? ratio(frame.holdingPeriodReturn) : '미정산');
    const inspect = result => async frame => {
      assert.equal(await lab.getByTestId('bonds-stage').innerText(), frame.label);
      assert.equal(await lab.getByTestId('bonds-cash').innerText(), `${format(frame.actualCash)}단위`);
      assert.equal(await lab.getByTestId('bonds-return').innerText(), frame.isMatured ? ratio(frame.holdingPeriodReturn) : '만기 정산 전');
      await verifyStacks(lab.locator('.bond-cumulative .bond-bar'), [frame.promisedSegments.map(part => part.fraction), frame.actualSegments.map(part => part.fraction)], `bond receipts year ${frame.year}`);
      assert((await lab.locator('figcaption').innerText()).includes(`지급 부족 ${format(frame.missingCash)}단위`), 'Missing receipts differs from model');
      const path = lab.locator('.bond-payment-path li');
      assert.equal(await path.count(), result.frames.length);
      for (let index = 0; index < result.frames.length; index++) {
        const entry = result.frames[index];
        assert.equal(await path.nth(index).getAttribute('aria-current'), entry.year === frame.year ? 'step' : null, 'Cash timeline highlights wrong year');
        assert((await path.nth(index).innerText()).includes(`${format(entry.year === 0 ? entry.purchaseOutflow : entry.payment)}단위`), 'Cash timeline amount differs from model');
      }
      assert((await lab.locator('.invest-result').innerText()).includes(frame.message));
    };
    for (const scenario of ['normal', 'failure']) {
      await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
      await lab.getByRole('combobox', { name: /지급 시나리오/ }).selectOption(scenario);
      const result = bondFrames({ scenario });
      assert.equal(result.summary.actualCash, scenario === 'normal' ? 1150 : 450);
      assert.equal(result.summary.promisedCash, 1150);
      assert(Math.abs(result.summary.holdingPeriodReturn - (scenario === 'normal' ? 0.15 : -0.55)) < 1e-9);
      await verify(`payments-${scenario}`, result.frames, cells, inspect(result));
      await lab.getByRole('button', { name: /1년 말.*보기/ }).click();
      await inspect(result)(result.frames[1]);
      await capture(page, `${name}-payments-${scenario}-first-coupon`, lab);
    }
  } else if (label === '분산과 공통 충격 실험') {
    const { diversificationFrames } = await import('../src/simulations/investing/diversification.mjs');
    const cells = row => [ratio(row.aReturn), ratio(row.bReturn), format(row.contributionA * 100), format(row.contributionB * 100), ratio(row.portfolioReturn), format(row.endingTotal), ratio(row.comparisonWeight)];
    const inspect = result => async frame => {
      assert.equal(await lab.getByTestId('diversification-stage').innerText(), frame.label);
      assert.equal(await lab.getByTestId('diversification-mean').innerText(), ratio(result.statistics.portfolio.mean));
      assert.equal(await lab.getByTestId('diversification-spread').innerText(), `${format(result.statistics.portfolio.spread * 100)}%p`);
      await verifyStacks(lab.locator('.diversification-allocation-strip'), [result.allocation.map(part => part.weight)], 'diversification initial allocation');
      await verifyStacks(lab.locator('.diversification-money-track'), [frame.amountSegments.map(part => part.fraction)], 'diversification current amounts');
      await verifyStacks(lab.locator('.diversification-spread-track'), result.spreadBars.map(bar => [bar.fraction]), 'diversification descriptive spread');
      const panels = lab.locator('.diversification-scenario');
      const boxes = await panels.evaluateAll(elements => elements.map(element => { const rect = element.getBoundingClientRect(); return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }; }));
      assert.equal(boxes.length, 4);
      if (page.viewportSize().width <= 650) for (let index = 1; index < boxes.length; index++) assert(boxes[index].top >= boxes[index - 1].bottom, 'Mobile scenario panels overlap');
      else assert(Math.abs(boxes[0].top - boxes[1].top) <= 1 && boxes[1].left >= boxes[0].right, 'Desktop scenario comparison does not form two columns');
      for (let index = 0; index < result.scenarios.length; index++) {
        const row = result.scenarios[index], panel = panels.nth(index);
        assert.equal(await panel.getAttribute('aria-current'), frame.scenarioIndex === index ? 'step' : null);
        const geometry = await panel.locator('.diversification-return-track').evaluateAll(elements => elements.map(element => {
          const track = element.getBoundingClientRect(), bar = element.querySelector('i').getBoundingClientRect(), marker = element.querySelector('.diversification-marker').getBoundingClientRect();
          return { width: track.width, barWidth: bar.width, barStart: bar.left - track.left, markerX: marker.left + marker.width / 2 - track.left };
        }));
        assert.equal(geometry.length, row.bars.length);
        geometry.forEach((actual, part) => {
          const expected = row.bars[part];
          assert(actual.width > 0);
          assert(Math.abs(actual.barWidth - expected.widthFraction * actual.width) <= 1, 'Scenario return length differs from model');
          assert(Math.abs(actual.barStart - expected.startFraction * actual.width) <= 1, 'Scenario return origin differs from model');
          assert(Math.abs(actual.markerX - expected.endFraction * actual.width) <= 1, 'Scenario endpoint differs from model');
        });
      }
      const money = await lab.locator('.diversification-money-parts').innerText();
      for (const value of [frame.endingA, frame.endingB, frame.endingTotal]) assert(money.includes(`${format(value)}단위`), 'Current scenario valuation differs from model');
      assert((await lab.locator('.invest-result').innerText()).includes(frame.message));
    };
    const cases = [{ weightA: 0.5, commonShock: false }, { weightA: 0, commonShock: false }, { weightA: 1, commonShock: false }, { weightA: 0.25, commonShock: false }, { weightA: 0.5, commonShock: true }, { weightA: 0.25, commonShock: true }];
    for (const input of cases) {
      await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
      await setRange(/A에 나누는 최초 금액 비중/, input.weightA * 100);
      await lab.getByRole('checkbox', { name: /공통 충격/ }).setChecked(input.commonShock);
      const result = diversificationFrames(input);
      if (!input.commonShock && input.weightA === 0.5) assert.deepEqual(result.scenarios.map(row => row.portfolioReturn), [0.2, 0, 0, -0.2]);
      if (input.commonShock) assert.deepEqual(result.scenarios.map(row => row.portfolioReturn), [0.2, 0.2, -0.2, -0.2]);
      await verify(`weight-${input.weightA * 100}-common-${input.commonShock}`, result.frames, cells, inspect(result), result.scenarios);
      const statistics = lab.locator('details').nth(1);
      if (await statistics.getAttribute('open') === null) await statistics.locator('summary').click();
      const rows = await statistics.locator('tbody tr').evaluateAll(elements => elements.map(element => [...element.querySelectorAll('td')].map(cell => cell.textContent.trim())));
      assert.deepEqual(rows, result.spreadBars.map(bar => [ratio(result.statistics[bar.key].mean), format(bar.value * 100), ratio(result.statistics[bar.key].minimum), ratio(result.statistics[bar.key].maximum)]));
      await lab.getByRole('button', { name: '시나리오 4 보기', exact: true }).click();
      await inspect(result)(result.frames[4]);
      await capture(page, `${name}-weight-${input.weightA * 100}-common-${input.commonShock}-loss`, lab);
    }
  } else if (label === 'ETF 기초자산 중복 실험') {
    const { exposureFrames, trackingComparison } = await import('../src/simulations/investing/funds-etfs.mjs');
    const cells = frame => [...frame.exposures.map(part => ratio(part.fraction)), ratio(frame.accountedWeight)];
    const inspect = result => async frame => {
      assert.equal(await lab.locator('.invest-stage').innerText(), frame.label);
      await verifyStacks(lab.locator('.etf-inner-bar'), result.funds.map(fund => fund.holdings.map(part => part.fraction)), 'ETF internal holdings');
      await verifyStacks(lab.locator('.etf-contribution-bar'), result.funds.map(fund => fund.contributions.map(part => part.fraction)), 'ETF contributions to total investment');
      await verifyStacks(lab.locator('.etf-total-bar'), [frame.exposures.map(part => part.fraction)], 'ETF effective exposure');
      const commonWidths = await lab.locator('.etf-contribution-bar,.etf-total-bar').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
      assert(Math.max(...commonWidths) - Math.min(...commonWidths) <= 1, 'ETF contribution/total bars use unequal physical 100% scales');
      await verifyResponsivePanels(lab.locator('.etf-fund-pair > .etf-fund-shell'));
      assert.deepEqual(await lab.locator('.etf-contributions > div').evaluateAll(elements => elements.map(element => element.dataset.visible)), [String(frame.xVisible), String(frame.yVisible)]);
      assert.equal(await lab.locator('.etf-combined').getAttribute('data-grouped'), String(frame.grouped));
      const combined = await lab.locator('.etf-combined').innerText();
      for (const part of frame.exposures) assert(combined.includes(`${part.asset} ${ratio(part.fraction)}`), 'Displayed effective exposure differs from model');
      assert(combined.includes(`반영 ${ratio(frame.accountedWeight)}`) && combined.includes(`아직 펼치지 않은 몫 ${ratio(frame.unexaminedWeight)}`));
      assert((await lab.locator('.invest-result').innerText()).includes(frame.message));
    };
    for (const input of [{ xWeight: 0.5, sameHoldings: false }, { xWeight: 0, sameHoldings: false }, { xWeight: 1, sameHoldings: false }, { xWeight: 0.25, sameHoldings: false }, { xWeight: 0.5, sameHoldings: true }, { xWeight: 0.25, sameHoldings: true }]) {
      await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
      await setRange(/ETF X에 둔 비중/, input.xWeight * 100);
      await lab.getByRole('combobox', { name: /ETF Y의 기초자산/ }).selectOption(input.sameHoldings ? 'same' : 'original');
      const result = exposureFrames(input);
      if (input.xWeight === 0.5 && !input.sameHoldings) assert.deepEqual(result.exposure.map(part => part.fraction), [0.5, 0.2, 0.3]);
      assert(Math.abs(result.totalWeight - 1) <= 1e-12);
      await verify(`x-${input.xWeight * 100}-same-${input.sameHoldings}`, result.frames, cells, inspect(result));
    }
    const tracking = trackingComparison(), chart = page.locator('.etf-tracking');
    for (const series of tracking.series) {
      const group = chart.locator(`[data-tracking-series=${series.id}]`);
      const points = (await group.locator('polyline').getAttribute('points')).split(' ').map(value => value.split(',').map(Number));
      assert.equal(points.length, series.points.length);
      points.forEach((point, index) => assert(Math.abs(point[0] - series.points[index].x) <= 1e-9 && Math.abs(point[1] - series.points[index].y) <= 1e-9, 'Tracking polyline differs from model'));
      const actual = await group.locator('circle,rect').evaluateAll(elements => elements.map(element => {
        const rect = element.getBoundingClientRect(), svg = element.ownerSVGElement, p = svg.createSVGPoint();
        const x = element.tagName === 'circle' ? +element.getAttribute('cx') : +element.getAttribute('x') + +element.getAttribute('width') / 2;
        const y = element.tagName === 'circle' ? +element.getAttribute('cy') : +element.getAttribute('y') + +element.getAttribute('height') / 2;
        // SVGPoint stores coordinates with reduced precision in Chromium. Compare
        // model values to numeric attributes; use SVGPoint only for screen geometry.
        p.x = x; p.y = y;
        const screen = p.matrixTransform(svg.getScreenCTM());
        return { x, y, offsetX: rect.left + rect.width / 2 - screen.x, offsetY: rect.top + rect.height / 2 - screen.y };
      }));
      actual.forEach((point, index) => {
        assert(Math.abs(point.x - series.points[index].x) <= 1e-9 && Math.abs(point.y - series.points[index].y) <= 1e-9);
        assert(Math.abs(point.offsetX) <= 1 && Math.abs(point.offsetY) <= 1, 'Tracking markers do not paint at model coordinates');
      });
      assert.deepEqual(await chart.locator(`[data-tracking-summary=${series.id}] dd`).allTextContents(), [`${format(series.meanDifference * 100)}%p`, `${format(series.trackingError * 100)}%p`, ratio(series.fundReturn), ratio(series.benchmarkReturn), `${format(series.trackingDifference * 100)}%p`]);
    }
    const rows = await chart.locator('table tbody tr').evaluateAll(elements => elements.map(element => [...element.querySelectorAll('td')].map(cell => cell.textContent.trim())));
    assert.deepEqual(rows, tracking.rows.map(row => [ratio(row.benchmarkReturn), ratio(row.steadyReturn), ratio(row.varyingReturn), `${format(row.steadyDifference * 100)}%p`, `${format(row.varyingDifference * 100)}%p`]));
    const ticks = await chart.locator('.etf-tracking-plot > span').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect(), plot = element.parentElement.getBoundingClientRect(), figure = element.closest('figure').getBoundingClientRect(), range = document.createRange(); range.selectNodeContents(element); const glyph = range.getBoundingClientRect();
      return { kind: element.className, text: element.textContent, font: parseFloat(getComputedStyle(element).fontSize), x: (rect.left + rect.width / 2 - plot.left) / plot.width, y: (rect.top + rect.height / 2 - plot.top) / plot.height, within: glyph.left >= figure.left - 1 && glyph.right <= figure.right + 1 && glyph.top >= figure.top && glyph.bottom <= figure.bottom };
    }));
    const yTicks = ticks.filter(tick => tick.kind === 'etf-y-label'), xTicks = ticks.filter(tick => tick.kind === 'etf-x-label');
    assert.deepEqual(yTicks.map(tick => tick.text), tracking.ticks.map(tick => format(tick.value * 100)));
    yTicks.forEach((tick, index) => assert(Math.abs(tick.y - tracking.ticks[index].fraction) < 0.005));
    xTicks.forEach((tick, index) => assert(Math.abs(tick.x - tracking.series[0].points[index].x / tracking.chart.width) < 0.005));
    ticks.forEach(tick => assert(tick.font >= 12 && tick.within, `Tracking label tiny/outside figure: ${JSON.stringify(tick)}`));
    const region = chart.locator('.invest-table');
    if (await region.evaluate(element => element.scrollWidth > element.clientWidth + 1)) {
      await region.focus(); await page.keyboard.press('ArrowRight'); await delay(250);
      assert(await region.evaluate(element => element.scrollLeft > 0), 'Tracking static table is not keyboard-scrollable');
      await region.evaluate(element => { element.scrollLeft = 0; });
    }
    await capture(page, `${name}-tracking-difference-and-spread`, chart);
    await capture(page, `${name}-creation-and-market-routes`, page.locator('.etf-routes'));
    for (const lane of await page.locator('.etf-route-lane').all()) {
      const boxes = await lane.locator(':scope > *').evaluateAll(elements => elements.map(element => { const r = element.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }; }));
      assert.equal(boxes.length, 3);
      if (page.viewportSize().width <= 600) for (let index = 1; index < boxes.length; index++) assert(boxes[index].top >= boxes[index - 1].bottom, 'Mobile ETF relation nodes overlap');
      else for (let index = 1; index < boxes.length; index++) assert(boxes[index].left >= boxes[index - 1].right, 'Desktop ETF relation nodes overlap');
    }
    observed.push({ scenario: 'tracking-four-months', summaries: tracking.series.map(series => ({ id: series.id, trackingDifference: series.trackingDifference, trackingError: series.trackingError })) });
  } else if (label === 'ETF NAV와 시장가격 실험') {
    const { navFrames } = await import('../src/simulations/investing/funds-etfs.mjs');
    const nullable = value => value === null ? '정의 불가' : format(value);
    const cells = frame => [frame.assets, frame.liabilities, frame.netAssets, frame.issuedUnits, frame.heldUnits].map(format).concat([nullable(frame.nav), frame.marketPrice === null ? '비교 전' : format(frame.marketPrice), frame.marketPrice === null ? '비교 전' : ratio(frame.premium)]);
    const inspect = result => async frame => {
      assert.equal(await lab.locator('.invest-stage').innerText(), frame.label);
      assert.equal(await lab.getByTestId('etf-nav').innerText(), frame.nav === null ? '정의 불가' : `${format(frame.nav)}단위`);
      assert.equal(await lab.getByTestId('etf-market-price').innerText(), frame.marketPrice === null ? '마지막 단계에서 비교' : `${format(frame.marketPrice)}단위`);
      assert.equal(await lab.getByTestId('etf-premium').innerText(), frame.marketPrice === null ? '비교 전' : ratio(frame.premium));
      await verifyStacks(lab.locator('.etf-net-bar'), [[frame.netAssetFraction]], 'ETF net assets');
      await verifyStacks(lab.locator('.etf-price-bar.nav'), [frame.navFraction === null ? [] : [frame.navFraction]], 'ETF NAV per unit');
      await verifyStacks(lab.locator('.etf-price-bar.market'), [frame.marketFraction === null ? [] : [frame.marketFraction]], 'ETF market price per unit');
      const widths = await lab.locator('.etf-price-bar').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
      assert(Math.abs(widths[0] - widths[1]) <= 1, 'NAV and market prices have unequal physical scales');
      assert.equal(await lab.locator('.etf-unit-row i').count(), frame.heldUnits, 'Held-unit tiles differ from model');
      const held = await lab.locator('.etf-held').innerText();
      assert(held.includes(`내 보유 ${format(frame.heldUnits)}좌`) && held.includes(`NAV 기준 평가액 ${frame.heldNavValue === null ? '정의 불가' : `${format(frame.heldNavValue)}단위`}`));
      assert((await lab.locator('.invest-result').innerText()).includes(frame.message));
    };
    const cases = [
      { underlyingReturn: 0.1, marketPrice: 112, heldUnits: 10, issuedUnits: 100 },
      { underlyingReturn: 0.1, marketPrice: 110, heldUnits: 10, issuedUnits: 100 },
      { underlyingReturn: 0.1, marketPrice: 100, heldUnits: 10, issuedUnits: 100 },
      { underlyingReturn: -0.9, marketPrice: 10, heldUnits: 10, issuedUnits: 100 },
      { underlyingReturn: -0.8, marketPrice: 20, heldUnits: 10, issuedUnits: 100 },
      { underlyingReturn: -0.7, marketPrice: 30, heldUnits: 10, issuedUnits: 100 },
      { underlyingReturn: 0, marketPrice: 0, heldUnits: 0, issuedUnits: 100 },
      { underlyingReturn: 1, marketPrice: 220, heldUnits: 20, issuedUnits: 100 },
      { underlyingReturn: -1, marketPrice: 0, heldUnits: 10, issuedUnits: 100 },
      { underlyingReturn: -1, marketPrice: 112, heldUnits: 10, issuedUnits: 100 },
      { underlyingReturn: 0.1, marketPrice: 112, heldUnits: 0, issuedUnits: 0 },
    ];
    for (const input of cases) {
      await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
      await setRange(/기초자산 가치 변화/, input.underlyingReturn * 100);
      await setRange(/ETF 시장가격/, input.marketPrice);
      await setRange(/보유 좌수/, input.heldUnits);
      await lab.getByRole('combobox', { name: /발행 상태/ }).selectOption(input.issuedUnits === 0 ? 'zero' : 'issued');
      // Selecting issued resets held units to 10, so apply the requested holding after issuance selection.
      await setRange(/보유 좌수/, input.heldUnits);
      const result = navFrames(input);
      assert(result.frames.every(frame => frame.issuedUnits === input.issuedUnits && frame.heldUnits === input.heldUnits));
      if (input.underlyingReturn === 0.1 && input.issuedUnits === 100) assert(Math.abs(result.summary.nav - 110) < 1e-9);
      await verify(`underlying-${input.underlyingReturn * 100}-price-${input.marketPrice}-held-${input.heldUnits}-issued-${input.issuedUnits}`, result.frames, cells, inspect(result));
    }
  } else if (label === '비용과 환율 현금 흐름 실험') {
    const { costsFxScenario, costsFxPresets, fxReturnPrimer } = await import('../src/simulations/investing/costs-fx.mjs');
    const cells = frame => [frame.cashKrw, frame.cashUsd, frame.assetUsd, frame.units, frame.fx, frame.paidBuyFeeUsd, frame.paidSellFeeUsd, frame.totalKrw].map(format);
    const inspect = result => async frame => {
      assert.equal(await lab.locator('.invest-stage').innerText(), frame.label);
      assert.equal(await lab.locator('.cfx-route [aria-current=step]').getAttribute('data-cfx-step'), String(frame.index));
      assert.deepEqual(await lab.locator('.cfx-holdings strong').allTextContents(), [`${format(frame.cashKrw)}원`, `${format(frame.cashUsd)} USD`, `${format(frame.assetUsd)} USD`]);
      assert((await lab.locator('.cfx-asset-wallet').innerText()).includes(`보유 자산 · ${format(frame.units)}단위`));
      await verifyStacks(lab.locator('.cfx-value-track'), [[frame.cashKrwFraction, frame.cashUsdKrwFraction, frame.assetKrwFraction]], 'FX current cash and asset holdings');
      await verifyStacks(lab.locator('.cfx-split-track'), result.splits.map(row => [row.keptFraction, row.feeFraction]), 'FX purchase/sale cost splits');
      await verifyStacks(lab.locator('.cfx-comparison-track'), result.comparison.map(row => [row.fraction]), 'FX same-budget final comparisons');
      const widths = await lab.locator('.cfx-value-track,.cfx-comparison-track').evaluateAll(elements => elements.map(el => el.getBoundingClientRect().width));
      assert(Math.max(...widths) - Math.min(...widths) <= 1, 'KRW comparison and current bar do not share same painted scale');
      assert.equal(await lab.getByTestId('costs-fx-final-krw').innerText(), `${format(result.finalKrw)}원`);
      assert.equal(await lab.getByTestId('costs-fx-return').innerText(), ratio(result.netReturn));
      assert.equal(await lab.getByTestId('costs-fx-buy-fee').innerText(), `↘ 수수료: ${format(result.buyFeeUsd)} USD`);
      assert.equal(await lab.getByTestId('costs-fx-sell-fee').innerText(), `↘ 수수료: ${format(result.sellFeeUsd)} USD`);
      assert.deepEqual(await lab.locator('.cfx-compare-row strong').allTextContents(), result.comparison.map(row => `${format(row.value)}원`));
      const boxes = await lab.locator('.cfx-holdings > div').evaluateAll(elements => elements.map(el => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; }));
      for (let i = 1; i < boxes.length; i++) {
        if (page.viewportSize().width <= 600) assert(boxes[i].top >= boxes[i - 1].bottom, 'Mobile currency/asset holdings overlap');
        else assert(boxes[i].left >= boxes[i - 1].right, 'Desktop currency/asset holdings overlap');
      }
      assert((await lab.locator('.invest-result').innerText()).includes(frame.message));
    };
    const cases = [
      { name: 'default-21', input: {} },
      ...costsFxPresets.map(preset => ({ name: preset.id, input: preset.input, preset: preset.id })),
      { name: 'buy-fee-only', input: { buyFeeRate: 0.02 } },
      { name: 'sell-fee-only', input: { sellFeeRate: 0.02 } },
      { name: 'zero-asset', input: { sellPriceUsd: 0, buyFeeRate: 0.02, sellFeeRate: 0.02 } },
      { name: 'maximum-controls', input: { budgetKrw: 240000, sellPriceUsd: 200, sellFx: 1800, buyFeeRate: 0.1, sellFeeRate: 0.1 } },
      { name: 'adverse-fx', input: { sellPriceUsd: 110, sellFx: 600 } },
    ];
    for (const scenario of cases) {
      await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
      if (scenario.preset) await lab.locator(`[data-cfx-preset="${scenario.preset}"]`).click();
      else {
        for (const [key, label, multiplier] of [['budgetKrw', /수수료 포함 총예산/, 1], ['sellPriceUsd', /구간 말 외화 가격/, 1], ['sellFx', /매도 후 환율/, 1], ['buyFeeRate', /매수대금 기준 수수료율/, 100], ['sellFeeRate', /매도대금 기준 수수료율/, 100]]) {
          if (scenario.input[key] !== undefined) await setRange(label, scenario.input[key] * multiplier);
        }
      }
      const result = costsFxScenario(scenario.input);
      for (const [key, label, multiplier] of [['budgetKrw', /수수료 포함 총예산/, 1], ['sellPriceUsd', /구간 말 외화 가격/, 1], ['sellFx', /매도 후 환율/, 1], ['buyFeeRate', /매수대금 기준 수수료율/, 100], ['sellFeeRate', /매도대금 기준 수수료율/, 100]]) assert(Math.abs(Number(await lab.getByRole('slider', { name: label }).inputValue()) - result.input[key] * multiplier) < 1e-9, `${scenario.name}: slider value diverged from model`);
      if (scenario.name === 'default-21') { assert(Math.abs(result.finalKrw - 145200) < 1e-8); assert(Math.abs(result.netReturn - 0.21) < 1e-12); }
      assert(Math.abs(result.purchaseUsd + result.buyFeeUsd - result.budgetUsd) < 1e-8, 'Purchase exceeds inclusive budget');
      assert(Math.abs(result.netSaleUsd + result.sellFeeUsd - result.grossSaleUsd) < 1e-8, 'Sale fee applied twice');
      await verify(scenario.name, result.frames, cells, inspect(result));
      await lab.locator('.money-playback').getByRole('button', { name: '처음부터', exact: true }).click();
      await lab.locator('.money-playback').getByRole('button', { name: '한 단계 진행', exact: true }).click();
      await lab.locator('.money-playback').getByRole('button', { name: '한 단계 진행', exact: true }).click();
      await inspect(result)(result.frames[2]);
      await capture(page, `${name}-${scenario.name}-purchase-state`, lab.locator('.cfx-current'));
    }
    const result = fxReturnPrimer(), primer = page.getByTestId('fx-return-primer');
    const geometry = await primer.locator('.cfx-area').evaluate(element => {
      const r = element.getBoundingClientRect(), style = getComputedStyle(element);
      const left = parseFloat(style.borderLeftWidth), top = parseFloat(style.borderTopWidth);
      return { width: r.width - left - parseFloat(style.borderRightWidth), height: r.height - top - parseFloat(style.borderBottomWidth), pieces: [...element.children].map(child => { const box = child.getBoundingClientRect(); const label = child.querySelector('span').getBoundingClientRect(); return { left: box.left - r.left - left, top: box.top - r.top - top, width: box.width, height: box.height, labelWithin: label.left >= box.left && label.right <= box.right && label.top >= box.top && label.bottom <= box.bottom }; }) };
    });
    assert.equal(geometry.pieces.length, result.pieces.length);
    geometry.pieces.forEach((actual, index) => {
      const expected = result.pieces[index];
      for (const [key, value] of Object.entries({ left: expected.x * geometry.width, top: expected.y * geometry.height, width: expected.width * geometry.width, height: expected.height * geometry.height })) assert(Math.abs(actual[key] - value) <= 1, `FX area ${expected.id} ${key} does not match model`);
      assert(actual.labelWithin, `FX area ${expected.id} numeric key is clipped`);
    });
    assert.deepEqual(await primer.locator('.cfx-area-key strong').allTextContents(), result.pieces.map(piece => `${format(piece.amountKrw)}원`));
    assert((await primer.innerText()).includes('145,200원') && (await primer.innerText()).includes('21%'));
    await capture(page, `${name}-multiplicative-area-primer`, primer);
  } else if (label === '자산배분과 재조정 실험') {
    const { allocationFrames } = await import('../src/simulations/investing/allocation-rebalancing.mjs');
    const cells = frame => [frame.time, ...[frame.stockValue, frame.bondValue, frame.cash, frame.total].map(format), ratio(frame.stockWeight), ...[frame.sold, frame.bought, frame.externalFlow].map(format)];
    const inspectBars = async (scope, result, frames) => {
      const rows = scope.locator('.allocation-bar-row');
      assert.equal(await rows.count(), frames.length);
      await verifyStacks(rows.locator('.allocation-track'), frames.map(frame => frame.segments.map(part => part.fraction)), 'allocation common-scale bars', 'i');
      const widths = await rows.locator('.allocation-track').evaluateAll(elements => elements.map(el => el.getBoundingClientRect().width));
      assert(Math.max(...widths) - Math.min(...widths) <= 1, 'Allocation frames have different painted scales');
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i], row = rows.nth(i);
        assert.equal(await row.getAttribute('data-allocation-frame'), frame.key);
        const text = await row.innerText();
        assert(text.includes(`합계 ${format(frame.total)}단위`) && text.includes(`주식 비중 ${ratio(frame.stockWeight)}`));
        for (const segment of frame.segments) assert(text.includes(`${segment.label} ${format(segment.value)}단위`));
        const marker = row.locator('.allocation-target-marker');
        if (await marker.count()) {
          const position = await marker.evaluate(el => { const r = el.getBoundingClientRect(), p = el.parentElement.getBoundingClientRect(); return (r.left + r.width / 2 - p.left) / p.width; });
          assert(Math.abs(position - result.targetMarkerFraction) <= 0.005, 'Target marker does not paint at model amount');
        }
      }
      const ticks = await scope.locator('.allocation-axis span').allTextContents();
      assert.deepEqual(ticks, result.axis.map(tick => `${format(tick.value)}단위`));
    };
    const inspect = result => async frame => {
      assert.equal(await lab.getByTestId('allocation-stage').innerText(), frame.label);
      assert.equal(await lab.getByTestId('allocation-total').innerText(), `${format(frame.total)}단위`);
      assert.equal(await lab.getByTestId('allocation-stock-weight').innerText(), ratio(frame.stockWeight));
      assert.equal(await lab.getByTestId('allocation-cash').innerText(), `${format(frame.cash)}단위`);
      assert.equal(await lab.getByTestId('allocation-trade').innerText(), result.tradeLabel);
      const outcome = result.targetReached === null ? '총액 0: 목표 비중 도달 여부도 정의하지 않습니다.' : result.targetReached ? '같은 T1에서 목표 비중과 총액을 확인했습니다. 이후 수익의 우열은 계산하지 않았습니다.' : result.status === 'blocked-zero-price' ? '목표 비중에 도달하지 못했습니다. 가격 0인 자산에 양의 평가액을 만들어 넣을 수 없습니다.' : '매매 뒤 목표 금액과 실제 평가액의 차이가 남았습니다. 비중 복귀가 확인되지 않았습니다.';
      assert.equal(await lab.getByTestId('allocation-outcome').innerText(), outcome);
      assert.equal(await lab.locator('.allocation-bar-row[aria-current=step]').getAttribute('data-allocation-frame'), frame.key);
      await inspectBars(lab, result, result.frames);
      assert.deepEqual(await lab.locator('.allocation-arrow').evaluateAll(elements => elements.map(el => el.dataset.active)), [String(frame.movement?.to === 'cash'), String(frame.movement?.from === 'cash')]);
      const boxes = await lab.locator('.allocation-path > *').evaluateAll(elements => elements.map(el => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; }));
      assert.equal(boxes.length, 5);
      for (let i = 1; i < boxes.length; i++) {
        if (page.viewportSize().width <= 650) assert(boxes[i].top >= boxes[i - 1].bottom, 'Mobile allocation path overlaps');
        else assert(boxes[i].left >= boxes[i - 1].right, 'Desktop allocation path overlaps');
      }
      assert((await lab.locator('.invest-result').innerText()).includes(frame.message));
    };
    const cases = [
      { initialAmount: 1000, stockWeight: 0.6, stockReturn: 0.2, bondReturn: 0 },
      { initialAmount: 1000, stockWeight: 0.6, stockReturn: -0.2, bondReturn: 0 },
      { initialAmount: 1000, stockWeight: 0.6, stockReturn: 0.2, bondReturn: 0.2 },
      { initialAmount: 1000, stockWeight: 0.6, stockReturn: -0.4, bondReturn: -0.1 },
      { initialAmount: 1000, stockWeight: 0, stockReturn: 0.2, bondReturn: 0 },
      { initialAmount: 1000, stockWeight: 1, stockReturn: 0.2, bondReturn: 0 },
      { initialAmount: 0, stockWeight: 0.6, stockReturn: 0.2, bondReturn: 0 },
      { initialAmount: 1000, stockWeight: 0.6, stockReturn: -1, bondReturn: 0 },
      { initialAmount: 1000, stockWeight: 0.6, stockReturn: 0, bondReturn: -1 },
      { initialAmount: 1000, stockWeight: 0.6, stockReturn: -1, bondReturn: -1 },
      { initialAmount: 2000, stockWeight: 0.25, stockReturn: 1, bondReturn: -0.5 },
      { initialAmount: 1000, stockWeight: 0.01, stockReturn: -0.1, bondReturn: -0.95 },
    ];
    for (const input of cases) {
      await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
      await setRange(/출발·목표 주식 비중/, input.stockWeight * 100);
      await setRange(/주식 가격 변화/, input.stockReturn * 100);
      await setRange(/채권 가격 변화/, input.bondReturn * 100);
      await setRange(/출발 평가액/, input.initialAmount);
      const result = allocationFrames(input);
      if (input.stockReturn === 0.2 && input.stockWeight === 0.6 && input.initialAmount === 1000 && input.bondReturn === 0) {
        assert.equal(result.drift.total, 1120); assert.equal(result.tradeAmount, 48);
        assert.equal(result.summary.stockValue, 672); assert.equal(result.summary.bondValue, 448);
      }
      for (const frame of result.frames.slice(1)) assert(Math.abs(frame.total - result.drift.total) <= 1e-8, 'Rebalancing changed same-date total');
      assert.equal(result.afterSale.cash, result.tradeAmount);
      assert.equal(result.summary.cash, 0);
      await verify(`budget-${input.initialAmount}-weight-${input.stockWeight * 100}-stock-${input.stockReturn * 100}-bond-${input.bondReturn * 100}`, result.frames, cells, inspect(result));
      const details = lab.locator('details').nth(1);
      if (await details.getAttribute('open') === null) await details.locator('summary').click();
      const rows = await details.locator('tbody tr').evaluateAll(elements => elements.map(el => [...el.querySelectorAll('td')].map(cell => cell.textContent.trim())));
      assert.deepEqual(rows, result.frames.map(frame => [frame.stockUnits, frame.stockPrice, frame.bondUnits, frame.bondPrice, frame.targetStock, frame.targetBond].map(format)));
      await lab.locator('.allocation-step-buttons').getByRole('button', { name: result.afterSale.label, exact: true }).click();
      await inspect(result)(result.afterSale);
      await capture(page, `${name}-cash-stage-${input.initialAmount}-${input.stockWeight}-${input.stockReturn}-${input.bondReturn}`, lab.locator('.allocation-transfer'));
    }
    const primer = page.locator('.allocation-primer'), result = allocationFrames();
    await inspectBars(primer, result, [result.initial, result.drift]);
    const holdingBoxes = await primer.locator('.allocation-holdings > div').evaluateAll(elements => elements.map(el => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }; }));
    assert.equal(holdingBoxes.length, 2);
    if (page.viewportSize().width <= 650) assert(holdingBoxes[1].top >= holdingBoxes[0].bottom);
    else assert(holdingBoxes[1].left >= holdingBoxes[0].right);
    assert((await primer.innerText()).includes('64.2857%'));
    await capture(page, `${name}-same-units-drift-primer`, primer);
  } else {
    assert.fail(`${name}: no model-matching condition checks implemented for lab ${JSON.stringify(label)}`);
  }
  await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
  assert.match(await lab.locator('.money-playback span').innerText(), /^0 \/ /);
  assert.equal(await lab.locator('.invest-predict select').inputValue(), '');
  return { label, observed };
}
async function representativeControl(page) {
  const main = page.locator('main');
  const slider = main.locator('input[type=range]').first();
  if (await slider.count()) {
    const before = await slider.inputValue();
    const bounds = await slider.evaluate(el => ({ min: +el.min, max: +el.max, value: +el.value }));
    await slider.focus();
    await page.keyboard.press(bounds.value >= bounds.max ? 'ArrowLeft' : 'ArrowRight');
    assert.notEqual(await slider.inputValue(), before, 'Representative slider did not respond');
    return { type: 'slider', before, after: await slider.inputValue() };
  }
  const select = main.locator('select').first();
  if (await select.count()) {
    const opts = await select.locator('option').evaluateAll(els => els.filter(el => !el.disabled).map(el => el.value));
    const before = await select.inputValue(), next = opts.find(v => v !== before);
    assert(next !== undefined, 'Representative select has no alternate choice');
    await select.selectOption(next);
    assert.equal(await select.inputValue(), next);
    return { type: 'select', before, after: next };
  }
  const buttons = main.locator('button').filter({ hasNotText: /읽음/ });
  for (let i = 0; i < await buttons.count(); i++) {
    const button = buttons.nth(i);
    if (!await button.isVisible() || !await button.isEnabled() || await button.getAttribute('aria-pressed') === 'true') continue;
    const label = await button.innerText(), before = await main.innerText();
    await button.click();
    await delay(150);
    assert.notEqual(await main.innerText(), before, `Control '${label}' gave no observable text change`);
    return { type: 'button', label };
  }
  throw new Error('No representative interactive control found');
}
(async () => {
  try {
    assert(fs.existsSync(path.join(dist, 'index.html')), 'Build dist before running QA');
    if (process.env.LIVE_URL) base = process.env.LIVE_URL.replace(/\/?$/, '/');
    else {
      server = http.createServer((req, res) => {
        const requestPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        if (requestPath.endsWith('/favicon.ico')) { res.writeHead(204); return res.end(); }
        const relative = requestPath.replace(/^\/my-books\/?/, '') || 'index.html';
        const file = path.resolve(dist, relative);
        if (!file.startsWith(dist + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
        res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
        fs.createReadStream(file).pipe(res);
      });
      await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
      base = `http://127.0.0.1:${server.address().port}/my-books/`;
    }
    results.base = base;
    browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    if (process.env.LIVE_URL) await check('published-assets-match-dist', null, async () => {
      const expected = assets(fs.readFileSync(path.join(dist, 'index.html'), 'utf8'));
      assert(expected.length >= 2, 'Cannot extract JS/CSS build assets');
      const context = await browser.newContext();
      let actual = [], status;
      try {
        const deadline = Date.now() + 180000;
        do {
          const response = await context.request.get(`${base}?qa=${Date.now()}`);
          status = response.status(); actual = assets(await response.text());
          if (status === 200 && JSON.stringify(actual) === JSON.stringify(expected)) {
            const verifiedBytes = [];
            for (const file of expected) {
              const local = fs.readFileSync(path.join(dist, 'assets', file));
              const response = await context.request.get(`${base}assets/${file}?qa=${Date.now()}`);
              assert.equal(response.status(), 200, `Published asset unavailable: ${file}`);
              const received = await response.body();
              assert.deepEqual(received, local, `Published asset bytes differ from deployed build: ${file}`);
              verifiedBytes.push({ file, bytes: received.length, sha256: createHash('sha256').update(received).digest('hex') });
            }
            return { expected, actual, status, verifiedBytes };
          }
          await delay(5000);
        } while (Date.now() < deadline);
        assert.deepEqual({ status, actual }, { status: 200, actual: expected }, 'Published HTML still differs from this build');
      } finally { await context.close(); }
    });
    for (const width of [1440, 390, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      watchPage(page, `viewport-${width}`);
      for (const route of ['/investing', ...investingRoutes]) await check(`render-${width}-${route}`, page, async () => {
        await visit(page, route);
        const audit = await domAudit(page, true);
        await capture(page, `${width}-${route}-full`);
        const labs = page.locator('.invest-lab:not([data-static-scene=true])');
        for (let i = 0; i < await labs.count(); i++) await capture(page, `${width}-${route}-scene-${i + 1}`, labs.nth(i));
        if (route !== '/investing') assert(await labs.count() > 0, 'Chapter lab missing');
        return audit;
      });
      await check(`home-filter-${width}`, page, async () => {
        await visit(page, '/');
        assert.equal(await page.locator('.home-book').count(), 6);
        assert.equal(await page.locator('.home-cover svg').count(), 6, 'Six book cover SVGs expected');
        await page.getByRole('button', { name: /돈·경제/ }).click();
        assert.equal(await page.locator('.home-book').count(), 3);
        assert.deepEqual((await page.locator('.home-book').evaluateAll(els => els.map(el => el.getAttribute('href')))).sort(), ['#/economics', '#/investing', '#/money']);
        await capture(page, `${width}-home-money-filter`);
        return domAudit(page);
      });
      for (const route of investingRoutes) {
        await visit(page, route);
        const labs = page.locator('.invest-lab:not([data-static-scene=true])');
        for (let i = 0; i < await labs.count(); i++) {
          if (width === 1440 || width === 320) await check(`controls-${width}-${route}-${i + 1}`, page, () => playbackChecks(page, labs.nth(i), `${width}-${safe(route)}-${i + 1}`));
          await check(`conditions-${width}-${route}-${i + 1}`, page, () => conditionChecks(page, labs.nth(i), `${width}-${safe(route)}-${i + 1}`));
        }
      }
      if (width === 1440) {
        for (const book of ['money', 'economics', 'investing']) await check(`published-chapter-count-${book}`, page, async () => {
          const published = chapterRows.filter(chapter => chapter.book === book);
          const count = published.length;
          assert(count > 0, `${book}: catalog has no published chapters`);
          await visit(page, `/${book}`);
          const links = await page.locator('.chapter-list > a').evaluateAll(els => els.map(el => el.getAttribute('href')));
          assert.equal(links.length, count);
          assert.deepEqual(links, published.map(chapter => `#${chapter.route}`));
          return { book, count, links, audit: await domAudit(page) };
        });
        const selected = [['money', '01'], ['money', '02'], ['money', '05'], ['money', '09'], ['money', '10'], ['economics', '06'], ['economics', '08'], ['economics', '12'], ['computer', '01'], ['network', '02'], ['kubernetes', '03']];
        for (const [book, number] of selected) await check(`regression-${book}-${number}`, page, async () => {
          const row = chapterRows.find(c => c.book === book && c.number === number);
          assert(row, `Missing catalog row ${book} ${number}`);
          await visit(page, row.route);
          const audit = await domAudit(page);
          const interaction = await representativeControl(page);
          await capture(page, `regression-${book}-${number}`);
          return { route: row.route, audit, interaction };
        });
      }
      await context.close();
    }
    const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    watchPage(page, 'reduced-motion');
    for (const route of investingRoutes) await check(`reduced-motion-${route}`, page, async () => {
      await visit(page, route);
      assert(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches));
      const assertNoMotion = async () => {
        const running = await page.locator('.invest-lab, .etf-tracking, .cfx-primer').evaluateAll(els => els.flatMap(el => [el, ...el.querySelectorAll('*')]).filter(el => { const style = getComputedStyle(el); return style.animationName !== 'none' || style.transitionDuration.split(',').some(s => parseFloat(s) > 0); }).map(el => el.className));
        assert.deepEqual(running, [], 'Motion styles remain under reduced motion');
      };
      await assertNoMotion();
      const summaries = page.locator('.invest-lab details > summary');
      assert(await summaries.count() > 0);
      for (let i = 0; i < await summaries.count(); i++) await summaries.nth(i).click();
      const steps = page.locator('.invest-lab .money-playback').getByRole('button', { name: '한 단계 진행', exact: true });
      for (let i = 0; i < await steps.count(); i++) await steps.nth(i).click();
      await assertNoMotion();
      assert(await page.locator('.invest-lab details[open] table tbody tr').count() > 1);
      await capture(page, `${safe(route)}-reduced-motion-static`);
      return domAudit(page, true);
    });
    await context.close();
    // Separate fresh context: no seeded state leaks into screenshots or other cases.
    const reading = await browser.newContext();
    const readingPage = await reading.newPage();
    watchPage(readingPage, 'reading-state');
    await check('reading-state-preserves-unknown-and-new-ids', readingPage, async () => {
      await visit(readingPage, '/');
      await readingPage.evaluate(() => localStorage.setItem('my-books:read:v1', JSON.stringify(['unknown-future/id', 'parallel', 'money/map'])));
      await readingPage.reload({ waitUntil: 'networkidle' });
      assert(investingChapters.length > 0, 'No published investing chapters to verify');
      for (const chapter of investingChapters) {
        await visit(readingPage, chapter.route);
        await readingPage.getByRole('button', { name: '읽음으로 표시', exact: true }).click();
        await readingPage.reload({ waitUntil: 'networkidle' });
        assert(await readingPage.getByRole('button', { name: '✓ 읽음 · 표시 취소', exact: true }).isVisible());
      }
      let ids = await readingPage.evaluate(() => JSON.parse(localStorage.getItem('my-books:read:v1')));
      assert.deepEqual([...ids].sort(), ['unknown-future/id', 'parallel', 'money/map', ...investingChapters.map(chapter => chapter.readId)].sort());
      await readingPage.getByRole('button', { name: '✓ 읽음 · 표시 취소', exact: true }).click();
      await readingPage.reload({ waitUntil: 'networkidle' });
      ids = await readingPage.evaluate(() => JSON.parse(localStorage.getItem('my-books:read:v1')));
      assert.deepEqual([...ids].sort(), ['unknown-future/id', 'parallel', 'money/map', ...investingChapters.slice(0, -1).map(chapter => chapter.readId)].sort(), `Unmarking ${investingChapters.at(-1).readId} must preserve all other reading IDs`);
      return { ids };
    });
    await reading.close();
    await check('application-console', null, async () => { assert.deepEqual(results.pageErrors, []); assert.deepEqual(results.consoleErrors, []); });
  } catch (error) { results.checks.push({ name: 'harness', status: 'blocked', error: error.stack || String(error) }); }
  finally {
    await browser?.close().catch(() => {});
    if (server) await new Promise(resolve => server.close(resolve));
    results.finished = new Date().toISOString();
    results.status = results.checks.some(c => c.status !== 'passed') ? 'failed' : 'passed';
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
    if (results.status !== 'passed') process.exitCode = 1;
  }
})();

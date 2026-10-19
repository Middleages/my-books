/* Run after npm run build. NODE_PATH may point at an isolated playwright install.
 * CHROME_PATH=/usr/bin/google-chrome node scripts/investing-browser-qa.cjs
 * LIVE_URL=https://middleages.github.io/my-books/ checks the deployed build too.
 * Screenshots require human visual review; passing DOM checks does not claim that review.
 */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
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
    return { title: document.title, h1: main.querySelectorAll('h1').length, headings: [...main.querySelectorAll('h1,h2,h3')].map(el => el.textContent), width: innerWidth, scrollWidth: document.documentElement.scrollWidth, offenders, brokenLinks, del: main.querySelectorAll('del').length, nestedParagraphs: main.querySelectorAll('p p').length, rawStars: main.innerText.includes('**'), unlabelled, figures, textLength: main.innerText.length };
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
  const verify = async (scenario, expected, kind) => {
    await finish();
    const summary = lab.locator('details > summary').first();
    if (!(await lab.locator('details').first().getAttribute('open') !== null)) await summary.click();
    const rows = await lab.locator('table tbody tr').evaluateAll(els => els.map(el => [...el.querySelectorAll('td')].map(td => td.textContent.trim())));
    const wanted = expected.map(row => kind === 'ownership'
      ? [format(row.companyCash), format(row.buyerCash), format(row.sellerCash), format(row.cashTotal), format(row.totalShares), `${format(row.buyerShares)} / ${format(row.sellerShares)}`, ratio(row.ownershipRatio)]
      : kind === 'dividend' ? [format(row.companyCash), format(row.cash), format(row.otherShareholdersCash), format(row.cashTotal), format(row.stockValue), format(row.wealth)]
      : [format(row.price), format(row.shares), format(row.stockValue), format(row.cash), format(row.wealth), format(row.dividendsReceived), format(row.unrealizedGain), format(row.realizedGain), ratio(row.totalReturn)]);
    assert.deepEqual(rows, wanted, `${scenario}: rendered table differs from model frames`);
    assert((await lab.locator('.invest-result').innerText()).includes(expected.at(-1).message), `${scenario}: live explanation differs from model`);
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
  } else {
    assert.equal(label, '가격 변화 재투자 매도 총수익 실험');
    await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
    await verify('cash-default', totalReturnFrames({ endPrice: 110, reinvest: false, sellShares: 0 }).frames, 'return');
    await lab.getByLabel('배당 현금 처리', { exact: true }).selectOption('yes');
    await lab.getByLabel('이후 매도할 수량', { exact: true }).selectOption('1');
    await verify('reinvest-and-sell-one', totalReturnFrames({ endPrice: 110, reinvest: true, sellShares: 1 }).frames, 'return');
    await lab.getByLabel('이후 매도할 수량', { exact: true }).selectOption('2');
    await verify('reject-sale-two', totalReturnFrames({ endPrice: 110, reinvest: true, sellShares: 2 }).frames, 'return');
    await range('Home');
    await verify('zero-price-reinvestment', totalReturnFrames({ endPrice: 0, reinvest: true, sellShares: 2 }).frames, 'return');
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
          if (status === 200 && JSON.stringify(actual) === JSON.stringify(expected)) return { expected, actual, status };
          await delay(5000);
        } while (Date.now() < deadline);
        assert.deepEqual({ status, actual }, { status: 200, actual: expected }, 'Published HTML still differs from this build');
      } finally { await context.close(); }
    });
    for (const width of [1440, 390, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      watchPage(page, `viewport-${width}`);
      for (const route of ['/investing', '/investing/ownership', '/investing/total-return']) await check(`render-${width}-${route}`, page, async () => {
        await visit(page, route);
        const audit = await domAudit(page, true);
        await capture(page, `${width}-${route}-full`);
        const labs = page.locator('.invest-lab');
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
      for (const route of ['/investing/ownership', '/investing/total-return']) {
        await visit(page, route);
        const labs = page.locator('.invest-lab');
        for (let i = 0; i < await labs.count(); i++) {
          if (width === 1440 || width === 320) await check(`controls-${width}-${route}-${i + 1}`, page, () => playbackChecks(page, labs.nth(i), `${width}-${safe(route)}-${i + 1}`));
          await check(`conditions-${width}-${route}-${i + 1}`, page, () => conditionChecks(page, labs.nth(i), `${width}-${safe(route)}-${i + 1}`));
        }
      }
      if (width === 1440) {
        for (const [book, count] of [['money', 10], ['economics', 12], ['investing', 2]]) await check(`published-chapter-count-${book}`, page, async () => {
          await visit(page, `/${book}`);
          const links = await page.locator('.chapter-list > a').evaluateAll(els => els.map(el => el.getAttribute('href')));
          assert.equal(links.length, count);
          assert.deepEqual(links, chapterRows.filter(c => c.book === book).map(c => `#${c.route}`));
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
    for (const route of ['/investing/ownership', '/investing/total-return']) await check(`reduced-motion-${route}`, page, async () => {
      await visit(page, route);
      assert(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches));
      const running = await page.locator('.invest-lab').evaluateAll(els => els.flatMap(el => [...el.querySelectorAll('*')]).filter(el => { const style = getComputedStyle(el); return style.animationName !== 'none' || style.transitionDuration.split(',').some(s => parseFloat(s) > 0); }).map(el => el.className));
      assert.deepEqual(running, [], 'Motion styles remain under reduced motion');
      const summaries = page.locator('.invest-lab details > summary');
      assert(await summaries.count() > 0);
      for (let i = 0; i < await summaries.count(); i++) await summaries.nth(i).click();
      const steps = page.locator('.invest-lab .money-playback').getByRole('button', { name: '한 단계 진행', exact: true });
      for (let i = 0; i < await steps.count(); i++) await steps.nth(i).click();
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
      for (const id of ['ownership', 'total-return']) {
        await visit(readingPage, `/investing/${id}`);
        await readingPage.getByRole('button', { name: '읽음으로 표시', exact: true }).click();
        await readingPage.reload({ waitUntil: 'networkidle' });
        assert(await readingPage.getByRole('button', { name: '✓ 읽음 · 표시 취소', exact: true }).isVisible());
      }
      let ids = await readingPage.evaluate(() => JSON.parse(localStorage.getItem('my-books:read:v1')));
      assert.deepEqual([...ids].sort(), ['unknown-future/id', 'parallel', 'money/map', 'investing/ownership', 'investing/total-return'].sort());
      await readingPage.getByRole('button', { name: '✓ 읽음 · 표시 취소', exact: true }).click();
      await readingPage.reload({ waitUntil: 'networkidle' });
      ids = await readingPage.evaluate(() => JSON.parse(localStorage.getItem('my-books:read:v1')));
      assert(ids.includes('unknown-future/id') && !ids.includes('investing/total-return'));
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

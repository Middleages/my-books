/* Production/live Chromium evidence for the currently published insurance chapters.
 * Run after npm run build. NODE_PATH can point to an isolated Playwright install.
 * CHROME_PATH=/usr/bin/google-chrome node scripts/insurance-browser-qa.cjs
 * LIVE_URL=https://middleages.github.io/my-books/ additionally proves deployed bytes.
 * PNG generation is not human visual review; inspect the artifacts separately.
 */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const out = path.join(root, 'artifacts/insurance-browser');
fs.mkdirSync(out, { recursive: true });
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const results = {
  started: new Date().toISOString(), mode: process.env.LIVE_URL ? 'published' : 'local-dist',
  sourceSha: git('rev-parse', 'HEAD'), sourceTree: git('rev-parse', 'HEAD^{tree}'),
  sourceChanges: git('status', '--porcelain'), workflowSha: process.env.GITHUB_SHA || null,
  checks: [], screenshots: [], consoleErrors: [], pageErrors: [], resourceErrors: [],
  visualReview: 'Required: open full-page and scene PNGs. Automated results do not certify explanation, readability, real-device behavior or screen-reader speech.',
};
const catalog = fs.readFileSync(path.join(root, 'src/catalog.ts'), 'utf8');
const chapters = [...catalog.matchAll(/\bid:\s*"([^"]+)"\s*,\s*bookId:\s*"([^"]+)"\s*,\s*readId:\s*"([^"]+)"\s*,\s*number:\s*"([^"]+)"/g)].map(m => ({ id: m[1], book: m[2], readId: m[3], number: m[4], route: `/${m[2]}/${m[1]}` }));
const bookSource = catalog.split('export const books:')[1];
const books = [...bookSource.matchAll(/\bid:\s*"([^"]+)"\s*,\s*categoryId:\s*"([^"]+)"/g)].map(m => ({ id: m[1], category: m[2] }));
const insuranceChapters = chapters.filter(row => row.book === 'insurance');
const routes = ['/insurance', ...insuranceChapters.map(row => row.route)];
const appendices = [...fs.readFileSync(path.join(root, 'src/kubernetesAppendices.ts'), 'utf8').matchAll(/id:\s*['"]([^'"]+)['"]/g)].map(m => `/kubernetes/${m[1]}`);
const knownRoutes = ['/', ...books.map(row => `/${row.id}`), ...chapters.map(row => row.route), ...appendices];
results.routes = routes;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const safe = value => value.replace(/[^a-z0-9_-]/gi, '-');
const format = value => value.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
let browser, server, base;
async function capture(page, name, locator) {
  await page.evaluate(() => document.fonts.ready);
  const filename = `${safe(name)}.png`;
  if (locator) await locator.screenshot({ path: path.join(out, filename), animations: 'disabled', timeout: 15000 });
  else await page.screenshot({ path: path.join(out, filename), fullPage: true, animations: 'disabled', timeout: 15000 });
  results.screenshots.push(filename);
}
async function check(name, page, run) {
  const started = Date.now();
  try { const details = await run(); results.checks.push({ name, status: 'passed', milliseconds: Date.now() - started, details }); }
  catch (error) {
    results.checks.push({ name, status: 'failed', milliseconds: Date.now() - started, error: error.stack || String(error) });
    if (page && !page.isClosed()) {
      await capture(page, `FAIL-${name}`).catch(error => { results.checks.at(-1).screenshotError = String(error); });
      fs.writeFileSync(path.join(out, `FAIL-${safe(name)}.html`), await page.content().catch(() => 'Unavailable'));
    }
  }
  console.log(`${results.checks.at(-1).status.toUpperCase()} ${name}`);
}
function watchPage(page, context) {
  page.on('pageerror', error => results.pageErrors.push({ context, url: page.url(), message: String(error) }));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const entry = { context, url: page.url(), source: message.location().url, message: message.text() };
    if (!/\/favicon\.ico(?:\?|$)/.test(entry.source || '')) results.consoleErrors.push(entry);
  });
  page.on('requestfailed', request => { if (!/\/favicon\.ico(?:\?|$)/.test(request.url())) results.resourceErrors.push({ context, url: request.url(), error: request.failure()?.errorText }); });
}
async function visit(page, route) {
  await page.goto(`${base}${process.env.LIVE_URL ? `?qa=${Date.now()}` : ''}#${route}`, { waitUntil: 'networkidle' });
  await page.locator('main h1').waitFor();
  assert(!/챕터를 찾을 수 없어요/.test(await page.locator('main h1').innerText()), `Unpublished route: ${route}`);
}
async function domAudit(page) {
  const audit = await page.evaluate(knownRoutes => {
    const main = document.querySelector('main');
    const visible = element => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
    const offenders = [...main.querySelectorAll('*')].filter(element => {
      if (!visible(element)) return false;
      const table = element.closest('.insurance-table');
      if (table && table !== element) return false; // Only explicitly keyboard-scrollable table contents may exceed their viewport.
      const rect = element.getBoundingClientRect();
      return rect.right > innerWidth + 1 || rect.left < -1;
    }).slice(0, 20).map(element => ({ tag: element.tagName, class: element.className?.baseVal ?? element.className, text: element.textContent.slice(0, 100), rect: element.getBoundingClientRect().toJSON() }));
    const links = [...main.querySelectorAll('a[href]')].map(element => element.getAttribute('href'));
    const brokenLinks = links.filter(href => href.startsWith('#/') && !knownRoutes.includes(href.slice(1)));
    const unsafeLinks = links.filter(href => !/^(#\/|https:\/\/|mailto:)/.test(href));
    const unlabelled = [...main.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(element => !element.labels?.length && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')).map(element => element.outerHTML);
    const figures = [...main.querySelectorAll('figure')].map(element => ({ caption: element.querySelector('figcaption')?.textContent.trim() || '', width: element.getBoundingClientRect().width }));
    return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, h1: main.querySelectorAll('h1').length, textLength: main.innerText.length, offenders, brokenLinks, unsafeLinks, unlabelled, figures, rawStars: main.innerText.includes('**'), del: main.querySelectorAll('del').length, nestedParagraphs: main.querySelectorAll('p p').length };
  }, knownRoutes);
  assert.equal(audit.h1, 1, 'Expected one chapter title');
  assert(audit.textLength > 150, 'Rendered content unexpectedly empty');
  assert(audit.scrollWidth <= audit.width + 1, `Page overflows: ${JSON.stringify(audit)}`);
  assert.deepEqual(audit.offenders, [], 'Visible content extends beyond the viewport');
  assert.deepEqual(audit.brokenLinks, [], 'Links point to unpublished routes');
  assert.deepEqual(audit.unsafeLinks, [], 'Malformed or unexpected link schemes');
  assert.deepEqual(audit.unlabelled, [], 'Inputs need accessible labels');
  assert.equal(audit.rawStars, false, 'Raw Markdown emphasis reached the page');
  assert.equal(audit.del, 0, 'Unintended GFM strikethrough');
  assert.equal(audit.nestedParagraphs, 0, 'Nested MDX paragraphs');
  for (const figure of audit.figures) assert(figure.caption && figure.width > 0, 'Figure needs a visible caption and geometry');
  return audit;
}
function sourceAudit() {
  assert(insuranceChapters.length > 0, 'Insurance has no published chapters');
  assert.equal(new Set(insuranceChapters.map(row => row.id)).size, insuranceChapters.length, 'Duplicate insurance IDs');
  assert.deepEqual(insuranceChapters.map(row => row.readId), insuranceChapters.map(row => `insurance/${row.id}`));
  const files = [...catalog.matchAll(/from\s+"(\.\/content\/insurance\/[^"\n]+\.mdx)"/g)].map(match => path.resolve(root, 'src', match[1]));
  assert.equal(files.length, insuranceChapters.length + 1, 'Only published chapter MDX and the introduction should be imported');
  const checked = files.map(file => {
    const source = fs.readFileSync(file, 'utf8');
    assert(!/<del(?:\s|>)/i.test(source), `${file}: literal strikethrough`);
    assert(!/\d+\s*~\s*\d+[\s\S]*?\d+\s*~\s*\d+/.test(source), `${file}: repeated tilde ranges can become GFM strikethrough`);
    assert(!/<p\b[^>]*>\s*\n(?!\s*\{)/.test(source), `${file}: multiline paragraph wrapper can create nested MDX paragraphs`);
    for (const match of source.matchAll(/#\/insurance(?:\/[a-z0-9-]+)?/g)) assert(knownRoutes.includes(match[0].slice(1)), `${file}: unpublished link ${match[0]}`);
    assert(!/\b(?:useState|useEffect|eval)\s*\(/.test(source), `${file}: state/evaluation belongs outside MDX`);
    return { file: path.relative(root, file), bytes: Buffer.byteLength(source), sha256: sha256(source) };
  });
  return { chapters: insuranceChapters, checked };
}
async function openTables(page, lab) {
  const summaries = lab.locator('details > summary');
  assert(await summaries.count() > 0, 'Static alternative is missing');
  for (let i = 0; i < await summaries.count(); i++) {
    const summary = summaries.nth(i);
    if (!(await summary.evaluate(element => element.parentElement.open))) await summary.click();
  }
  assert(await lab.locator('details[open] tbody tr').count() > 1, 'Static table must contain the complete observation frames');
  for (const region of await lab.locator('.insurance-table').all()) {
    assert.equal(await region.getAttribute('tabindex'), '0', 'Static table needs keyboard focus');
    assert(await region.getAttribute('aria-label') || await region.getAttribute('aria-labelledby'), 'Static table needs an accessible name');
    const size = await region.evaluate(element => ({ width: element.clientWidth, scrollWidth: element.scrollWidth }));
    if (size.scrollWidth > size.width + 1) {
      await region.focus();
      await page.keyboard.press('ArrowRight');
      await delay(250);
      assert(await region.evaluate(element => element.scrollLeft > 0), 'Keyboard cannot scroll the static table');
      await region.evaluate(element => { element.scrollLeft = 0; });
    }
  }
}
async function playbackChecks(page, lab, name) {
  const controls = lab.locator('.money-playback');
  assert.equal(await controls.count(), 1, 'Exactly one shared playback control is required');
  const frame = () => controls.locator('span').innerText();
  const rewind = controls.getByRole('button', { name: '처음부터', exact: true });
  const step = controls.getByRole('button', { name: '한 단계 진행', exact: true });
  await rewind.click();
  const initial = await frame();
  await delay(1800);
  assert.equal(await frame(), initial, 'Unexpected autoplay');
  await step.click();
  assert.notEqual(await frame(), initial, 'Step did not advance');
  await rewind.click();
  assert.equal(await frame(), initial, 'Rewind did not restore frame zero');
  await controls.getByRole('button', { name: '재생', exact: true }).click();
  await delay(250);
  await controls.getByRole('button', { name: '정지', exact: true }).click();
  const paused = await frame();
  await delay(1850);
  assert.equal(await frame(), paused, 'Paused timer is still advancing');
  await controls.getByRole('button', { name: '재생', exact: true }).click();
  await page.waitForFunction(element => !element.textContent.trim().startsWith('0 /'), await controls.locator('span').elementHandle(), { timeout: 5000 });
  await rewind.click();
  await controls.getByRole('button', { name: '재생', exact: true }).focus();
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => { const element = document.activeElement, style = getComputedStyle(element); return { text: element.textContent, visible: element.matches(':focus-visible'), outline: style.outlineStyle, width: style.outlineWidth }; });
  assert.match(focus.text, /한 단계 진행/);
  assert(focus.visible && focus.outline !== 'none' && parseFloat(focus.width) > 0, `Keyboard focus is not visible: ${JSON.stringify(focus)}`);
  await page.keyboard.press('Enter');
  assert.notEqual(await frame(), initial, 'Keyboard step did not advance');
  await rewind.click();
  const prediction = lab.locator('.insurance-prediction select');
  assert.equal(await prediction.count(), 1, 'Prediction selector is missing');
  await prediction.selectOption({ index: 1 });
  for (let i = 0; i < 30 && await step.isEnabled(); i++) await step.click();
  assert(await step.isDisabled(), 'Playback does not terminate');
  assert.match(await lab.locator('.insurance-result').innerText(), /예측과/, 'Final prediction feedback is missing');
  await capture(page, `${name}-final`, lab);
  await openTables(page, lab);
  await capture(page, `${name}-static-table`, lab.locator('.insurance-static').first());
  await lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
  assert.equal(await frame(), initial, 'Full reset did not restore frame zero');
  assert.equal(await prediction.inputValue(), '', 'Full reset did not clear prediction');
  return { initial, paused, focus };
}
async function setRange(page, slider, value) {
  const bounds = await slider.evaluate(element => ({ min: +element.min, max: +element.max, step: +(element.step || 1) }));
  const steps = (value - bounds.min) / bounds.step;
  assert(value >= bounds.min && value <= bounds.max && Number.isInteger(steps), `Range test value is outside the UI domain: ${value}`);
  assert(steps <= 500, 'Keyboard range test would exceed its bounded UI domain');
  await slider.focus(); await page.keyboard.press('Home');
  for (let index = 0; index < steps; index++) await page.keyboard.press('ArrowRight');
  assert.equal(await slider.inputValue(), String(value), 'Keyboard range control did not reach the requested model input');
}
// Compare painted geometry, not only data attributes or CSS declarations.
async function assertBars(locator, expected, description, childSelector = 'i') {
  const actual = await locator.evaluateAll((elements, childSelector) => elements.map(element => {
    const style = getComputedStyle(element), box = element.getBoundingClientRect();
    const leftInset = parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
    const width = box.width - leftInset - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight);
    return { width, segments: [...element.children].filter(child => child.matches(childSelector)).map(child => { const childBox = child.getBoundingClientRect(); return { width: childBox.width, left: childBox.left - box.left - leftInset }; }) };
  }), childSelector);
  assert.equal(actual.length, expected.length, `${description}: bar count`);
  actual.forEach((bar, index) => {
    assert(bar.width > 0, `${description}: invisible scale`);
    assert.equal(bar.segments.length, expected[index].length, `${description}: segment count`);
    let offset = 0;
    bar.segments.forEach((segment, part) => {
      const wanted = expected[index][part] * bar.width;
      assert(Math.abs(segment.width - wanted) <= 1, `${description}: painted width ${segment.width} differs from model width ${wanted}`);
      assert(Math.abs(segment.left - offset) <= 1, `${description}: painted segments overlap or have an unmodelled gap`);
      offset += wanted;
    });
    assert(offset <= bar.width + 1, `${description}: model exceeds the scale`);
  });
  return actual;
}
async function conditionChecks(page, lab, name) {
  const { projectExpectedLoss, expectedLossDefaults } = await import('../src/simulations/insurance/probability.mjs');
  const { projectPooling, poolingDefaults } = await import('../src/simulations/insurance/pooling.mjs');
  const format = value => value.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
  const won = value => `${format(value / 10000)}만원`;
  const percent = value => `${format(value * 100)}%`;
  const kind = await lab.getAttribute('data-insurance-lab');
  const controls = lab.locator('.money-playback');
  const step = controls.getByRole('button', { name: '한 단계 진행', exact: true });
  const reset = () => lab.getByRole('button', { name: '조건까지 초기화', exact: true }).click();
  const prediction = lab.locator('.insurance-prediction select');
  const observed = [];
  const assertResponsivePair = async locator => {
    const boxes = await locator.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().toJSON()));
    assert.equal(boxes.length, 2);
    if (page.viewportSize().width <= 650) {
      assert(boxes[1].top >= boxes[0].bottom, 'Mobile observations must stack, not shrink desktop columns');
      assert(Math.abs(boxes[0].left - boxes[1].left) <= 1 && Math.abs(boxes[0].width - boxes[1].width) <= 1, 'Mobile observations lose their common alignment');
    } else assert(Math.abs(boxes[0].top - boxes[1].top) <= 1 && boxes[1].left >= boxes[0].right, 'Desktop observations must form separate aligned columns');
  };
  const changingStopsPlayback = async change => {
    await controls.getByRole('button', { name: '처음부터', exact: true }).click();
    await prediction.selectOption({ index: 1 });
    await controls.getByRole('button', { name: '재생', exact: true }).click();
    assert(await controls.getByRole('button', { name: '정지', exact: true }).isVisible());
    await change();
    const initial = await controls.locator('span').innerText();
    assert.match(initial, /^0 \/ /, 'Changing a model condition must rewind the observation');
    assert.equal(await controls.getByRole('button', { name: '정지', exact: true }).count(), 0, 'Changing conditions did not stop playback');
    assert.equal(await prediction.inputValue(), '', 'A condition change left stale prediction feedback');
    await delay(1850);
    assert.equal(await controls.locator('span').innerText(), initial, 'A stale timer advanced after the model input changed');
  };
  const verify = async (scenario, model, outcome, inspectFrame, tableRows) => {
    await prediction.selectOption(outcome);
    await controls.getByRole('button', { name: '처음부터', exact: true }).click();
    for (let index = 0; index < model.frames.length; index++) {
      const frame = model.frames[index];
      assert.equal(await controls.locator('span').innerText(), `${index} / ${model.frames.length - 1} 단계`, `${scenario}: observation index differs from model`);
      assert.equal(await lab.locator('[data-insurance-stage]').getAttribute('data-insurance-stage'), frame.phase);
      assert.equal(await lab.locator('[data-insurance-stage] > strong').innerText(), frame.label);
      await inspectFrame(frame, model);
      if (index < model.frames.length - 1) { assert(await step.isEnabled()); await step.click(); }
    }
    assert(await step.isDisabled(), 'UI advanced beyond the model frames');
    assert((await lab.locator('.insurance-result').innerText()).startsWith('예측과 같습니다.'), `${scenario}: correct model prediction rejected`);
    const wrong = await prediction.locator('option').evaluateAll((options, correct) => options.find(option => option.value && option.value !== correct)?.value, outcome);
    assert(wrong, 'Prediction requires a genuinely different outcome');
    await prediction.selectOption(wrong);
    assert((await lab.locator('.insurance-result').innerText()).startsWith('예측과 다릅니다.'), `${scenario}: incorrect prediction accepted`);
    await prediction.selectOption(outcome);
    await openTables(page, lab);
    const actualRows = await lab.locator('.insurance-static table tbody tr').evaluateAll(rows => rows.map(row => [...row.querySelectorAll('th,td')].map(cell => cell.textContent.trim())));
    assert.deepEqual(actualRows, tableRows(model), `${scenario}: static table differs from complete model frames`);
    await domAudit(page);
    await capture(page, `${name}-${scenario}-scene`, lab);
    observed.push({ scenario, frames: model.frames.length, rows: actualRows.length, lastRow: actualRows.at(-1) });
  };
  if (kind === 'expected-loss') {
    const cells = model => model.frames.flatMap(frame => frame.scenarios.map(scenario => {
      const outcome = scenario.observation;
      return [frame.label, scenario.id === 'frequent' ? 'A' : 'B', outcome ? outcome.possible ? '가능' : '현재 확률에서 불가능' : '결과 확정 전', format(scenario.expectedLoss / 10000), outcome ? format(outcome.loss / 10000) : '미확정', format((outcome?.cashUsed ?? 0) / 10000), outcome ? format(outcome.shortfall / 10000) : '미확정', format((outcome?.cashRemaining ?? scenario.cash) / 10000)];
    }));
    const inspect = async (frame, model) => {
      assert.equal(await lab.locator('[data-expected-equality]').getAttribute('data-expected-equality'), String(model.expectedLossEqual));
      const possibleRows = lab.locator('[data-possible-case]');
      const possibleBars = possibleRows.locator('.insurance-bar-track');
      await assertBars(possibleBars, model.scenarios.map(scenario => [scenario.fractions.loss]), 'Conditional losses on a common scale');
      const widths = await possibleBars.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
      assert(Math.max(...widths) - Math.min(...widths) <= 1, 'A/B loss tracks use different painted scales');
      for (const scenario of frame.scenarios) {
        const probability = lab.locator(`[data-probability-case="${scenario.id}"]`);
        assert.equal(await probability.locator('[data-expected-loss]').innerText(), won(scenario.expectedLoss));
        assert((await probability.locator('[role=img]').getAttribute('aria-label')).includes(percent(scenario.probability)), 'Probability label differs from model');
        const dots = await probability.locator('[data-probability-fill]').evaluateAll(elements => elements.map(element => {
          const style = getComputedStyle(element), dot = element.getBoundingClientRect(), fill = element.querySelector('i').getBoundingClientRect();
          return { fraction: Number(element.dataset.probabilityFill), track: dot.width - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth), width: fill.width };
        }));
        assert.equal(dots.length, 100, 'Probability denominator is not 100');
        dots.forEach((dot, index) => {
          assert.equal(dot.fraction, scenario.dots[index].fraction, 'Dot state differs from model');
          assert(dot.track >= 2, 'Probability fill has less than two painted pixels of width');
          assert(Math.abs(dot.width - scenario.dots[index].fraction * dot.track) <= 1, 'Painted probability fill differs from model');
        });
        const row = lab.locator(`[data-possible-case="${scenario.id}"]`);
        const boundary = await row.locator('[data-cash-boundary]').evaluate(element => { const track = element.parentElement.getBoundingClientRect(); return { left: element.getBoundingClientRect().left - track.left, width: track.width }; });
        assert(Math.abs(boundary.left - scenario.fractions.cash * boundary.width) <= 1, 'Painted cash boundary differs from model');
        assert.deepEqual(await row.locator('.insurance-axis span').allTextContents(), ['0원', won(model.moneyScale)]);
        const outcome = scenario.observation;
        const observation = lab.locator(`[data-observation-case="${scenario.id}"]`);
        assert.equal(await observation.locator('[data-observed-loss]').innerText(), outcome ? won(outcome.loss) : '아직 미확정');
        assert.equal(await observation.locator('[data-cash-used]').innerText(), won(outcome?.cashUsed ?? 0));
        assert.equal(await observation.locator('[data-shortfall]').innerText(), outcome ? won(outcome.shortfall) : '아직 미확정');
        assert.equal(await observation.locator('[data-cash-remaining]').innerText(), won(outcome?.cashRemaining ?? scenario.cash));
        assert.equal(await observation.locator('.insurance-impossible').count(), outcome && !outcome.possible ? 1 : 0, 'Impossible conditional outcome is not distinguished');
        await assertBars(observation.locator('.insurance-bar-track'), [[outcome?.fractions.cashUsed ?? 0, outcome?.fractions.shortfall ?? 0]], `${scenario.id} observed cash/shortfall partition`);
        assert.deepEqual(await observation.locator('.insurance-axis span').allTextContents(), ['0원', won(model.moneyScale)]);
      }
      await assertResponsivePair(lab.locator('[data-observation-case]'));
    };
    const cash = lab.getByRole('slider', { name: /^준비한 현금/ });
    const probability = lab.getByRole('slider', { name: /^B 발생 확률/ });
    const loss = lab.getByRole('slider', { name: /^B 사건 발생 시 손실/ });
    const run = async (scenario, options = {}) => {
      const model = projectExpectedLoss(options);
      await verify(scenario, model, model.shortfallComparison, inspect, cells);
    };
    await reset();
    await run('default-equal-expected-loss');
    await changingStopsPlayback(async () => { await cash.focus(); await page.keyboard.press('ArrowRight'); });
    await reset();
    await setRange(page, cash, 0); await run('zero-ready-cash', { cash: 0 });
    await setRange(page, cash, 2000); await run('cash-covers-both-losses', { cash: 20000000 });
    await reset();
    await openTables(page, lab);
    await setRange(page, probability, 0); await run('zero-probability-impossible-event', { severeProbability: 0 });
    await setRange(page, probability, 100); await run('certain-event-impossible-no-event', { severeProbability: 1 });
    await reset();
    await setRange(page, loss, 0); await run('zero-severe-loss', { severeLoss: 0 });
    await setRange(page, cash, 0); await run('zero-cash-zero-severe-loss', { cash: 0, severeLoss: 0 });
    await reset();
    await setRange(page, cash, 2500); await setRange(page, loss, 2500); await run('maximum-controls-equal-cash-loss', { cash: 25000000, severeLoss: 25000000 });
    await reset();
    await run('repeated-default-from-initial-state');
    assert.equal(await cash.inputValue(), String(expectedLossDefaults.cash / 10000));
    assert.equal(await probability.inputValue(), String(expectedLossDefaults.severeProbability * 100));
    assert.equal(await loss.inputValue(), String(expectedLossDefaults.severeLoss / 10000));
  } else if (kind === 'pooling') {
    const cells = model => [
      ...model.frames.map(frame => [frame.label, ...['notYetContributed', 'contributionsCollected', 'remaining', 'totalClaims', 'totalPaid', 'pendingClaims', 'unfunded', 'initialCombinedFunds'].map(key => format(frame[key] / 10000))]),
      ...model.households.map(house => [`${house.id}번`, format(house.contribution / 10000), house.affected ? '있음' : '없음', format(house.claim / 10000), format(house.paid / 10000), format(house.unpaid / 10000)]),
    ];
    const inspect = async (frame, model) => {
      const labels = { 'data-pool-remaining': frame.remaining, 'data-pool-claims': frame.totalClaims, 'data-pool-uncollected': frame.notYetContributed, 'data-pool-paid': frame.totalPaid, 'data-pool-pending': frame.pendingClaims, 'data-pool-contributions': frame.contributionsCollected };
      for (const [attribute, value] of Object.entries(labels)) assert.equal(await lab.locator(`[${attribute}]`).innerText(), won(value), `${attribute}: displayed cash differs from model`);
      const houses = await lab.locator('[data-household]').evaluateAll(elements => elements.map(element => ({ id: Number(element.dataset.household), affected: element.dataset.affected === 'true', symbolAffected: element.classList.contains('affected'), contributionState: element.querySelector('small').textContent, label: element.getAttribute('aria-label') })));
      assert.equal(houses.length, model.params.households, 'Wrong number of household symbols');
      assert.deepEqual(houses.map(house => house.id), frame.households.map(house => house.id));
      houses.forEach((house, index) => {
        const expected = frame.households[index];
        assert.equal(house.affected, expected.affected, 'Household damage state differs from model');
        assert.equal(house.symbolAffected, expected.affected, 'Visible household damage state differs from model');
        assert.equal(house.contributionState, expected.contribution ? '납부' : '준비');
        assert(house.label.includes(`낸 부담금 ${won(expected.contribution)}`), 'Household contribution label differs from model');
        if (expected.affected) assert(house.label.includes(`피해 발생, 청구 ${won(expected.claim)}`));
      });
      const affected = frame.households.filter(house => house.affected);
      assert.deepEqual(await lab.locator('[data-recipient]').evaluateAll(elements => elements.map(element => Number(element.dataset.recipient))), affected.map(house => house.id));
      for (const house of affected) {
        const row = lab.locator(`[data-recipient="${house.id}"]`);
        assert.equal(await row.locator('.insurance-recipient-heading > span').innerText(), won(house.claim));
        const track = row.locator('.insurance-household-claim-track');
        await assertBars(track, [[house.localFractions.paid, house.localFractions.unpaid]], `Household ${house.id} painted paid/unpaid partition`);
        const label = await track.getAttribute('aria-label');
        assert(label.includes(`지급 ${won(house.paid)}, 아직 미지급 ${won(house.unpaid)}`), 'Individual paid/unpaid annotation differs from model');
        assert(label.includes(`전체는 한 가구 손실 ${won(model.params.lossPerHousehold)}`), 'Individual bar must disclose its different denominator');
        assert.equal(await row.locator('[data-household-unpaid]').getAttribute('class'), frame.phase === 'payments' ? 'unfunded' : 'pending', 'Pending claims and final unfunded loss need distinct visible states');
      }
      const tracks = lab.locator('.insurance-pool-ledger .insurance-bar-track');
      await assertBars(tracks, [[frame.fractions.notYetContributed, frame.fractions.remaining, frame.fractions.paid], [frame.fractions.paid, frame.fractions.pendingClaims]], 'Pool money conservation and claims ledgers');
      const widths = await tracks.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
      assert(Math.abs(widths[0] - widths[1]) <= 1, 'Global money and claim ledgers use inconsistent painted scales');
      assert.deepEqual(await lab.locator('.insurance-pool-ledger .insurance-axis span').allTextContents(), ['0원', won(model.moneyScale), '0원', won(model.moneyScale)]);
      const tank = await lab.locator('.insurance-fund-tank').evaluate(element => {
        const style = getComputedStyle(element), box = element.getBoundingClientRect(), fill = element.querySelector('[data-insurance-tank-fill]').getBoundingClientRect();
        return { height: box.height - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth), fillHeight: fill.height, fillBottom: fill.bottom, bottom: box.bottom - parseFloat(style.borderBottomWidth), label: element.getAttribute('aria-label') };
      });
      assert(tank.height > 100, 'Tank must remain readable on mobile');
      assert(Math.abs(tank.fillHeight - tank.height * frame.fractions.remaining) <= 1, `Tank paint ${tank.fillHeight} differs from model amount ${tank.height * frame.fractions.remaining}`);
      assert(Math.abs(tank.fillBottom - tank.bottom) <= 1, 'Tank amount is not anchored at zero');
      assert(tank.label.includes(`현재 공동 재원 ${won(frame.remaining)}`));
      assert.deepEqual(await lab.locator('.insurance-tank-axis span').allTextContents(), [won(model.moneyScale), '0원']);
      assert.equal(frame.notYetContributed + frame.remaining + frame.totalPaid, model.initialCombinedFunds, 'Model cash conservation');
      assert.equal(frame.totalPaid + frame.pendingClaims, frame.totalClaims, 'Model claim conservation');
      assert.deepEqual(await lab.locator('.insurance-pool-scene > .insurance-flow-arrow').evaluateAll(elements => elements.map(element => element.classList.contains('active'))), [frame.contributionsCollected > 0, frame.totalPaid > 0], 'Money arrows activate without the corresponding model movement');
      const layout = await lab.locator('.insurance-pool-scene').evaluate(element => {
        const rect = selector => element.querySelector(selector).getBoundingClientRect().toJSON();
        return { households: rect('.insurance-household-node'), fund: rect('.insurance-fund-node'), recipients: rect('.insurance-recipient-node'), arrows: [...element.querySelectorAll(':scope > .insurance-flow-arrow > i')].map(arrow => arrow.getBoundingClientRect().toJSON()) };
      });
      if (page.viewportSize().width <= 1000) {
        assert(layout.fund.top > layout.households.bottom && layout.recipients.top > layout.fund.bottom, 'Mobile money route must flow downward in three separate stages');
        for (const arrow of layout.arrows) assert(arrow.height > arrow.width * 4, 'Mobile arrow still points across a desktop layout');
      } else {
        assert(layout.fund.left > layout.households.right && layout.recipients.left > layout.fund.right, 'Desktop money route must proceed through separate left-to-right nodes');
        for (const arrow of layout.arrows) assert(arrow.width > arrow.height * 4, 'Desktop arrow does not show the horizontal money route');
      }
      if (affected.length >= 2 && page.viewportSize().width <= 1000) {
        const boxes = await lab.locator('[data-recipient]').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().toJSON()));
        if (page.viewportSize().width <= 360) assert(boxes[1].top >= boxes[0].bottom, 'Narrow mobile recipient cards must stack');
        else assert(Math.abs(boxes[1].top - boxes[0].top) <= 1 && boxes[1].left >= boxes[0].right, 'Mobile recipient comparison did not reflow into two readable columns');
      }
    };
    const reserve = lab.getByRole('slider', { name: /^별도 출발 준비금/ });
    const common = lab.getByRole('button', { name: '공통 충격 · 8가구', exact: true });
    const individual = lab.getByRole('button', { name: '개별 충격 · 2가구', exact: true });
    const run = async (scenario, options = {}) => {
      const model = projectPooling(options);
      await verify(scenario, model, model.canCoverAllClaims ? 'enough' : 'shortfall', inspect, cells);
      const result = await lab.locator('.insurance-result').innerText();
      assert(result.includes(`청구 ${won(model.totalClaims)} 중 ${won(model.totalPaid)}을 지급하고 재원 ${won(model.remaining)}이 남았습니다. 미충당은 ${won(model.unfunded)}입니다.`), 'Final pool explanation differs from model');
      assert((await lab.locator('.insurance-distribution-rule').innerText()).includes(`배분 비율: ${percent(model.paymentRatio)}`));
    };
    await reset(); await run('individual-default');
    await changingStopsPlayback(async () => { await common.focus(); await page.keyboard.press('Enter'); });
    assert.equal(await common.getAttribute('aria-pressed'), 'true');
    await run('common-shock-default', { affectedCount: 8 });
    await changingStopsPlayback(async () => { await reserve.focus(); await page.keyboard.press('ArrowLeft'); });
    await setRange(page, reserve, 0); await run('common-shock-zero-reserve', { affectedCount: 8, reserve: 0 });
    await setRange(page, reserve, 600); await run('common-shock-exactly-funded', { affectedCount: 8, reserve: 6000000 });
    await individual.focus(); await page.keyboard.press('Enter');
    await run('individual-high-reserve', { affectedCount: 2, reserve: 6000000 });
    await setRange(page, reserve, 0); await run('individual-exactly-funded-no-reserve', { affectedCount: 2, reserve: 0 });
    await reset(); await run('repeated-default-no-double-collection');
    assert.equal(await reserve.inputValue(), String(poolingDefaults.reserve / 10000));
    assert.equal(await individual.getAttribute('aria-pressed'), 'true');
  } else assert.fail(`No model-specific verifier exists for published lab ${JSON.stringify(kind)}`);
  await reset();
  assert.match(await controls.locator('span').innerText(), /^0 \/ /);
  assert.equal(await prediction.inputValue(), '');
  return { kind, observed };
}
async function verifyAssets() {
  const entryAssets = html => [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))(?:\?[^"']*)?["']/g)].map(match => path.posix.basename(match[1])).sort();
  const expected = entryAssets(fs.readFileSync(path.join(dist, 'index.html'), 'utf8'));
  assert(expected.some(name => name.endsWith('.js')) && expected.some(name => name.endsWith('.css')), 'Cannot identify production JS and CSS');
  const context = await browser.newContext();
  try {
    let actual = [], status;
    const deadline = Date.now() + (process.env.LIVE_URL ? 180000 : 0);
    do {
      const response = await context.request.get(`${base}?qa=${Date.now()}`);
      status = response.status(); actual = entryAssets(await response.text());
      if (status === 200 && JSON.stringify(expected) === JSON.stringify(actual)) break;
      if (Date.now() >= deadline) break;
      await delay(5000);
    } while (Date.now() < deadline);
    assert.deepEqual({ status, actual }, { status: 200, actual: expected }, 'Served HTML differs from the exact build');
    const files = fs.readdirSync(path.join(dist, 'assets')).filter(file => /\.(js|css)$/.test(file)).sort();
    const verifiedBytes = [];
    for (const file of files) {
      const local = fs.readFileSync(path.join(dist, 'assets', file));
      const response = await context.request.get(`${base}assets/${file}?qa=${Date.now()}`);
      assert.equal(response.status(), 200, `Asset HTTP error: ${file}`);
      const received = await response.body();
      assert.deepEqual(received, local, `Served asset bytes differ from dist: ${file}`);
      verifiedBytes.push({ file, bytes: received.length, localSha256: sha256(local), servedSha256: sha256(received) });
    }
    return { sourceSha: results.sourceSha, expected, actual, status, verifiedBytes };
  } finally { await context.close(); }
}
(async () => {
  try {
    await check('published-source-mdx-and-links', null, sourceAudit);
    assert(fs.existsSync(path.join(dist, 'index.html')), 'Run npm run build before browser verification');
    if (process.env.LIVE_URL) base = process.env.LIVE_URL.replace(/\/?$/, '/');
    else {
      server = http.createServer((request, response) => {
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        if (pathname.endsWith('/favicon.ico')) { response.writeHead(204); return response.end(); }
        const relative = pathname.replace(/^\/my-books\/?/, '') || 'index.html';
        const file = path.resolve(dist, relative);
        if (!file.startsWith(dist + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { response.writeHead(404); return response.end('Not found'); }
        response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
        fs.createReadStream(file).pipe(response);
      });
      await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
      base = `http://127.0.0.1:${server.address().port}/my-books/`;
    }
    results.base = base;
    const { chromium } = require('playwright');
    browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    results.browserVersion = browser.version();
    await check('served-js-css-bytes-match-dist', null, verifyAssets);
    for (const width of [1440, 390, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
      const page = await context.newPage(); watchPage(page, `viewport-${width}`);
      for (const route of routes) {
        await check(`render-${width}-${route}`, page, async () => {
          await visit(page, route);
          const audit = await domAudit(page);
          await capture(page, `${width}-${route}-full`);
          const labs = page.locator('.insurance-lab');
          if (route !== '/insurance') assert(await labs.count() > 0, 'Published chapter is missing its lab');
          for (let i = 0; i < await labs.count(); i++) await capture(page, `${width}-${route}-initial-scene-${i + 1}`, labs.nth(i));
          return audit;
        });
        if (route === '/insurance') continue;
        await visit(page, route);
        const labs = page.locator('.insurance-lab');
        for (let i = 0; i < await labs.count(); i++) {
          const name = `${width}-${safe(route)}-${i + 1}`;
          await check(`playback-${name}`, page, () => playbackChecks(page, labs.nth(i), name));
          await check(`model-conditions-${name}`, page, () => conditionChecks(page, labs.nth(i), name));
        }
      }
      await check(`catalog-and-home-${width}`, page, async () => {
        await visit(page, '/insurance');
        assert.deepEqual(await page.locator('.chapter-list > a').evaluateAll(elements => elements.map(element => element.getAttribute('href'))), insuranceChapters.map(row => `#${row.route}`));
        assert.equal(await page.getByRole('button', { name: '읽음으로 표시', exact: true }).count(), 0, 'Introduction must not add a reading ID');
        await visit(page, '/');
        const allBooks = await page.locator('.home-book').evaluateAll(elements => elements.map(element => element.getAttribute('href')).sort());
        assert.deepEqual(allBooks, books.map(book => `#/${book.id}`).sort());
        for (const id of ['computer', 'network', 'kubernetes', 'money', 'economics', 'investing', 'insurance']) assert(allBooks.includes(`#/${id}`), `Existing book disappeared: ${id}`);
        assert.equal(await page.locator('.home-cover svg').count(), books.length, 'Every published book needs a cover');
        await page.getByRole('button', { name: /돈·경제/ }).click();
        assert.deepEqual(await page.locator('.home-book').evaluateAll(elements => elements.map(element => element.getAttribute('href')).sort()), books.filter(book => book.category === 'money').map(book => `#/${book.id}`).sort());
        const progress = await page.locator('.home-book[href="#/insurance"] progress').evaluate(element => ({ max: element.max, value: element.value }));
        assert.deepEqual(progress, { max: insuranceChapters.length, value: 0 }, 'Home progress must count published chapters only');
        await capture(page, `${width}-home-insurance-category`);
        return { progress, audit: await domAudit(page) };
      });
      await context.close();
    }
    // Sidebar + intermediate viewport can be tighter than either desktop or phone.
    const intermediate = await browser.newContext({ viewport: { width: 850, height: 1000 }, deviceScaleFactor: 1 });
    const intermediatePage = await intermediate.newPage(); watchPage(intermediatePage, 'intermediate-850-pooling');
    await check('intermediate-850-pooling-layout', intermediatePage, async () => {
      const route = insuranceChapters.find(chapter => chapter.id === 'pooling')?.route;
      assert(route, 'Published pooling chapter is missing');
      await visit(intermediatePage, route);
      const lab = intermediatePage.locator('[data-insurance-lab="pooling"]');
      const verifyStack = async () => {
        const boxes = await lab.locator('.insurance-household-node, .insurance-fund-node, .insurance-recipient-node').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().toJSON()));
        assert.equal(boxes.length, 3);
        assert(boxes[1].top > boxes[0].bottom && boxes[2].top > boxes[1].bottom, '850px pooling diagram must stack within the sidebar-constrained content');
        return domAudit(intermediatePage);
      };
      await verifyStack();
      await capture(intermediatePage, '850-pooling-initial-scene', lab);
      await lab.getByRole('button', { name: '지급 결과 보기', exact: true }).click();
      await verifyStack();
      await capture(intermediatePage, '850-pooling-individual-final-scene', lab);
      await lab.getByRole('button', { name: '공통 충격 · 8가구', exact: true }).click();
      await lab.getByRole('button', { name: '지급 결과 보기', exact: true }).click();
      await capture(intermediatePage, '850-pooling-common-final-scene', lab);
      return verifyStack();
    });
    await intermediate.close();
    const reduced = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
    const page = await reduced.newPage(); watchPage(page, 'reduced-motion');
    for (const chapter of insuranceChapters) await check(`reduced-motion-${chapter.id}`, page, async () => {
      await visit(page, chapter.route);
      assert(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches));
      const motion = () => page.locator('.insurance-lab').evaluateAll(labs => labs.flatMap(lab => [lab, ...lab.querySelectorAll('*')]).filter(element => { const style = getComputedStyle(element); return style.animationName !== 'none' || style.transitionDuration.split(',').some(duration => parseFloat(duration) > 0); }).map(element => element.className?.baseVal ?? element.className));
      assert.deepEqual(await motion(), [], 'Computed motion remains with reduced-motion preference');
      for (const lab of await page.locator('.insurance-lab').all()) {
        await openTables(page, lab);
        await lab.locator('.money-playback').getByRole('button', { name: '한 단계 진행', exact: true }).click();
        assert.match(await lab.locator('.money-playback span').innerText(), /^1 \/ /, 'Reduced motion must still allow manual observation');
      }
      assert.deepEqual(await motion(), [], 'Stepping reintroduced reduced-motion animation');
      await capture(page, `390-${chapter.id}-reduced-motion-static`);
      return domAudit(page);
    });
    await reduced.close();
    const reading = await browser.newContext();
    const readingPage = await reading.newPage(); watchPage(readingPage, 'reading-state');
    await check('reading-state-preserves-old-new-unknown-ids', readingPage, async () => {
      const seed = ['unknown-future/id', 'parallel', 'money/map', 'investing/ownership'];
      await visit(readingPage, '/');
      await readingPage.evaluate(seed => localStorage.setItem('my-books:read:v1', JSON.stringify(seed)), seed);
      await readingPage.reload({ waitUntil: 'networkidle' });
      for (const chapter of insuranceChapters) {
        await visit(readingPage, chapter.route);
        await readingPage.getByRole('button', { name: '읽음으로 표시', exact: true }).click();
        await readingPage.reload({ waitUntil: 'networkidle' });
        assert(await readingPage.getByRole('button', { name: '✓ 읽음 · 표시 취소', exact: true }).isVisible());
      }
      const read = () => readingPage.evaluate(() => JSON.parse(localStorage.getItem('my-books:read:v1')));
      assert.deepEqual((await read()).sort(), [...seed, ...insuranceChapters.map(row => row.readId)].sort());
      await visit(readingPage, '/');
      const progress = await readingPage.locator('.home-book[href="#/insurance"] progress').evaluate(element => ({ max: element.max, value: element.value }));
      assert.deepEqual(progress, { max: insuranceChapters.length, value: insuranceChapters.length });
      await visit(readingPage, insuranceChapters.at(-1).route);
      await readingPage.getByRole('button', { name: '✓ 읽음 · 표시 취소', exact: true }).click();
      await readingPage.reload({ waitUntil: 'networkidle' });
      const ids = await read();
      assert.deepEqual(ids.sort(), [...seed, ...insuranceChapters.slice(0, -1).map(row => row.readId)].sort(), 'Removing the last insurance reading mark must preserve all other IDs');
      return { seed, ids, progress };
    });
    await reading.close();
    await check('application-console-and-resource-errors', null, async () => {
      assert.deepEqual(results.pageErrors, []); assert.deepEqual(results.consoleErrors, []); assert.deepEqual(results.resourceErrors, []);
    });
  } catch (error) { results.checks.push({ name: 'harness', status: 'blocked', error: error.stack || String(error) }); }
  finally {
    await browser?.close().catch(() => {});
    if (server) await new Promise(resolve => server.close(resolve));
    results.finished = new Date().toISOString();
    results.status = results.checks.some(check => check.status !== 'passed') ? 'failed' : 'passed';
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
    if (results.status !== 'passed') process.exitCode = 1;
  }
})();

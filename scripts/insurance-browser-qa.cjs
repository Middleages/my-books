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
async function selectWithKeyboard(page, select, value) {
  const options = await select.locator('option').evaluateAll(elements => elements.map(element => ({ value: element.value, disabled: element.disabled })));
  const index = options.findIndex(option => option.value === value);
  assert(index >= 0 && !options[index].disabled, `Keyboard select value is not an enabled option: ${value}`);
  assert(options.every(option => !option.disabled), 'Keyboard selector helper requires an uninterrupted option list');
  await select.focus();
  await page.keyboard.press('Home');
  for (let step = 0; step < index; step++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');
  assert.equal(await select.inputValue(), value, 'Keyboard selection did not change the model input');
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
  } else if (kind === 'contract-map') {
    const { projectContractMap, contractDefaults } = await import('../src/simulations/insurance/contracts.mjs');
    const cells = model => [
      ...model.frames.map(frame => [frame.label, frame.edges.filter(edge => edge.active).map(edge => edge.label).join(' / ') || '사람과 역할 전체', frame.detail]),
      ...model.people.flatMap(person => person.roles.map(role => [person.name, role.label, role.detail])),
      ['가상 보험회사', '보험자', '계약을 인수하고 조건에 따라 지급할 책임'],
      ...model.edges.map(edge => [edge.from === 'insurer' ? '가상 보험회사' : model.people.find(person => person.id === edge.from).name, edge.label, edge.to === 'insurer' ? '가상 보험회사' : model.people.find(person => person.id === edge.to).name, edge.detail]),
      ...model.events.map(event => [event.label, event.included ? '안' : '밖', event.reason]),
      ...model.sources.map(source => [source.label, source.example, source.detail, source.connection]),
    ];
    const inspect = async (frame, model) => {
      const people = lab.locator('[data-contract-person]');
      assert.equal(await people.count(), frame.people.length, 'People must be grouped once per model person, not once per role');
      assert.equal(await lab.locator('[data-contract-role]').count(), 3, 'The three person roles must survive every person-grouping choice');
      assert.equal(await lab.locator('[data-contract-insurer]').count(), 1, 'The insurer must remain a separate counterparty');
      for (const person of frame.people) {
        const node = lab.locator(`[data-contract-person="${person.id}"]`);
        assert.equal(await node.locator(':scope > strong').innerText(), person.name);
        assert.equal(Number(await node.getAttribute('data-role-count')), person.roles.length);
        assert.deepEqual(await node.locator('[data-contract-role]').evaluateAll(elements => elements.map(element => element.dataset.contractRole)), person.roles.map(role => role.id));
        const geometry = await node.evaluate(element => {
          const box = element.getBoundingClientRect();
          return { box: box.toJSON(), roles: [...element.querySelectorAll('[data-contract-role]')].map(role => ({ box: role.getBoundingClientRect().toJSON(), text: role.textContent, font: parseFloat(getComputedStyle(role).fontSize) })), icon: element.querySelector('svg').getBoundingClientRect().toJSON() };
        });
        assert(geometry.box.width > 60 && geometry.icon.width >= 30, 'Person identity has been reduced below readable geometry');
        geometry.roles.forEach((role, index) => {
          assert(role.text.includes(person.roles[index].label), 'Visible role label differs from model');
          assert(role.font >= 12, 'A responsive role label has been shrunk below 12 CSS pixels');
          assert(role.box.left >= geometry.box.left && role.box.right <= geometry.box.right + 1 && role.box.top >= geometry.box.top && role.box.bottom <= geometry.box.bottom + 1, 'Role escaped the single-person boundary');
        });
      }
      for (const edge of frame.edges) {
        const lane = lab.locator(`[data-contract-edge="${edge.id}"]`);
        for (const [attribute, value] of [['data-from', edge.from], ['data-to', edge.to], ['data-connected', String(edge.connected)], ['data-active', String(edge.active)]]) assert.equal(await lane.getAttribute(attribute), value, `Contract ${edge.id}: ${attribute} differs from model`);
        assert.equal(await lane.locator(':scope > span').innerText(), edge.label);
        assert.equal(await lane.locator(':scope > small').innerText(), !edge.connected ? '지속 미확인' : edge.kind === 'reference' ? '관계' : edge.id === 'payout' ? '지급 약속' : '납입 의무');
        const geometry = await lane.evaluate((element, personId) => {
          const root = element.closest('[data-insurance-lab]'), line = element.querySelector('i');
          const pseudo = getComputedStyle(line, '::after'), matrix = new DOMMatrixReadOnly(pseudo.transform), box = line.getBoundingClientRect();
          return { box: box.toJSON(), person: root.querySelector(`[data-contract-person="${personId}"]`).getBoundingClientRect().toJSON(), insurer: root.querySelector('[data-contract-insurer]').getBoundingClientRect().toJSON(), headAngle: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI, headLeft: pseudo.left, headRight: pseudo.right, active: element.classList.contains('active'), uncertain: element.classList.contains('unconfirmed'), lineBorder: getComputedStyle(line).borderTopStyle };
        }, edge.personId);
        assert(geometry.box.width >= 24 && geometry.box.width > geometry.box.height * 4, 'Contract relationship must have a visible horizontal connector');
        assert(geometry.box.left >= geometry.person.right - 1 && geometry.box.right <= geometry.insurer.left + 1, 'Connection does not run between its person and the insurer');
        const center = (geometry.box.top + geometry.box.bottom) / 2;
        assert(center >= geometry.person.top && center <= geometry.person.bottom && center >= geometry.insurer.top && center <= geometry.insurer.bottom, 'A connector is visually attached to the wrong person row');
        assert(Math.abs(geometry.headAngle - (edge.direction === 'from-insurer' ? -135 : 45)) < .01, 'Painted arrowhead contradicts the model payment direction');
        assert.equal(parseFloat(edge.direction === 'from-insurer' ? geometry.headLeft : geometry.headRight), 0, 'Arrowhead is not anchored at the receiving end');
        assert.equal(geometry.active, edge.active);
        assert.equal(geometry.uncertain, !edge.connected);
        if (edge.kind === 'reference' && edge.connected) assert.equal(geometry.lineBorder, 'dashed', 'Coverage relation must remain visibly distinct from money direction');
      }
      assert.equal(await lab.locator('[data-contract-event]').count(), frame.events.length);
      for (const event of frame.events) {
        const token = lab.locator(`[data-contract-event="${event.id}"]`);
        assert.equal(await token.getAttribute('data-included'), String(event.included));
        assert.equal(await token.getAttribute('data-region'), event.region);
        assert.equal(await token.locator(':scope > strong').innerText(), event.label);
        assert.equal(await token.locator(':scope > small').innerText(), event.reason);
        const bounds = await token.evaluate(element => {
          const region = element.closest('[data-contract-boundary]');
          return { region: region.dataset.contractBoundary, token: element.getBoundingClientRect().toJSON(), boundary: region.getBoundingClientRect().toJSON(), inAgreement: !!element.closest('[data-contract-agreement]') };
        });
        assert.equal(bounds.region, event.region);
        assert.equal(bounds.inAgreement, event.included, 'Inclusion is not represented by the actual contract boundary');
        assert(bounds.token.left >= bounds.boundary.left && bounds.token.right <= bounds.boundary.right + 1 && bounds.token.top >= bounds.boundary.top && bounds.token.bottom <= bounds.boundary.bottom + 1, 'Event token is painted outside its model region');
      }
      assert.equal(await lab.locator('[data-contract-boundary="rider"]').getAttribute('data-attached'), String(model.params.addRider));
      const boundaries = await lab.locator('[data-contract-agreement], [data-contract-boundary="outside"]').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().toJSON()));
      assert.equal(boundaries.length, 2);
      if (page.viewportSize().width <= 1000) assert(boundaries[1].top >= boundaries[0].bottom, 'Sidebar/mobile coverage boundaries must stack');
      else assert(boundaries[1].left >= boundaries[0].right, 'Desktop inside/outside coverage boundaries overlap');
      assert.deepEqual(await lab.locator('[data-contract-source]').evaluateAll(elements => elements.map(element => element.dataset.contractSource)), frame.sources.map(source => source.id));
      for (const source of frame.sources) {
        const node = lab.locator(`[data-contract-source="${source.id}"]`);
        assert.equal(await node.locator(':scope > strong').innerText(), source.label);
        assert.equal(await node.locator(':scope > span').innerText(), source.example);
        assert.equal(await node.locator(':scope > small').innerText(), source.connection);
        assert.equal(await node.locator('i').evaluate(element => element.classList.contains('uncertain')), source.status === '지속 미확인');
      }
      const sources = await lab.locator('[data-contract-source]').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().toJSON()));
      for (let index = 1; index < sources.length; index++) {
        if (page.viewportSize().width <= 1000) assert(sources[index].top >= sources[index - 1].bottom, 'Source paths must reflow into readable vertical rows');
        else assert(Math.abs(sources[index].top - sources[0].top) <= 1 && sources[index].left >= sources[index - 1].right, 'Desktop source paths must remain separate and aligned');
      }
    };
    const preset = lab.getByRole('combobox', { name: '가상 역할 배치', exact: true });
    const rider = lab.getByRole('checkbox', { name: '추가 특약 · 사건 C 포함', exact: true });
    const restriction = lab.getByRole('checkbox', { name: '제한 특약 · 사건 B 제외', exact: true });
    const employment = lab.getByRole('checkbox', { name: '가상 지우가 현재 직장에 재직 중', exact: true });
    const toggle = async input => { await input.focus(); await page.keyboard.press('Space'); };
    const run = async (scenario, options = {}) => {
      const model = projectContractMap(options);
      await verify(scenario, model, model.samePayerAndBeneficiary ? 'same' : 'different', inspect, cells);
      assert((await lab.locator('.insurance-result').innerText()).includes(model.verdict));
    };
    await reset(); await run('separate-people-default');
    await changingStopsPlayback(() => selectWithKeyboard(page, preset, 'same'));
    await run('one-person-three-roles', { preset: 'same' });
    await changingStopsPlayback(() => toggle(rider));
    await run('additional-rider-includes-c', { preset: 'same', addRider: true });
    await changingStopsPlayback(() => toggle(restriction));
    await run('restriction-moves-b-outside', { preset: 'same', addRider: true, restrictRider: true });
    await toggle(rider); await run('restricted-basic-without-addition', { preset: 'same', restrictRider: true });
    await selectWithKeyboard(page, preset, 'employer');
    await run('employer-and-employee-roles', { preset: 'employer', restrictRider: true });
    await changingStopsPlayback(() => toggle(employment));
    await run('employer-after-leaving-work', { preset: 'employer', restrictRider: true, employed: false });
    await selectWithKeyboard(page, preset, 'separate');
    await run('personal-contract-and-public-work-sources', { restrictRider: true, employed: false });
    await reset(); await run('repeated-default-restores-roles-boundaries-sources');
    assert.equal(await preset.inputValue(), contractDefaults.preset);
    assert.equal(await rider.isChecked(), contractDefaults.addRider);
    assert.equal(await restriction.isChecked(), contractDefaults.restrictRider);
    assert.equal(await employment.isChecked(), contractDefaults.employed);
  } else if (kind === 'payout') {
    const { projectPayout, projectPayoutYear, payoutDefaults, previewPayoutClaim, createPayoutYear, submitPayoutClaim, startNextPayoutYear, projectFixedBenefit } = await import('../src/simulations/insurance/payout.mjs');
    const defaultClaim = { loss: payoutDefaults.loss, excluded: payoutDefaults.excluded, deductible: payoutDefaults.deductible, insurerRate: payoutDefaults.insurerRate, perClaimLimit: payoutDefaults.perClaimLimit };
    let year = createPayoutYear();
    let fixedEligible = true;
    const fixedAmount = 1000000;
    const cells = model => [
      ...model.frames.map(frame => [frame.label, ...model.frames[0].segments.map(segment => format((frame.segments.find(item => item.id === segment.id)?.amount ?? 0) / 10000)), format(frame.loss / 10000)]),
      ...projectPayoutYear(model.params).claims.map((claim, index) => [`${index + 1}번째`, ...['annualRemainingBefore', 'paid', 'remainingBurden', 'annualRemainingAfter'].map(key => format(claim[key] / 10000))]),
      ...[true, false].map(eventEligible => {
        const fixed = projectFixedBenefit({ eventEligible, amount: fixedAmount });
        return [eventEligible ? '모든 지급조건 충족' : '지급조건 불충족', won(fixed.amount), won(fixed.paid)];
      }),
    ];
    const inspectYear = async () => {
      assert.equal(Number(await lab.locator('[data-payout-year]').innerText()), year.year, 'Observation changed the insurance year');
      assert.equal(Number(await lab.locator('[data-payout-claim-count]').innerText()), year.claims.length, 'Only explicit record actions may add claims');
      for (const [attribute, value] of [['data-payout-annual-used', year.annualUsed], ['data-payout-annual-remaining', year.annualRemaining]]) {
        const label = lab.locator(`[${attribute}]`);
        assert.equal(Number(await label.getAttribute('data-value')), value);
        assert.equal(await label.innerText(), won(value), 'Annual capacity label differs from recorded claims');
      }
      await assertBars(lab.locator('[data-payout-annual-track]'), [[...year.annualSegments.map(segment => segment.fraction), year.annualRemainingFraction]], 'Recorded annual payments and remaining capacity');
      assert.deepEqual(await lab.locator('[data-payout-annual-segment]').evaluateAll(elements => elements.map(element => ({ index: Number(element.dataset.payoutAnnualSegment), amount: Number(element.dataset.amount) }))), year.annualSegments.map(segment => ({ index: segment.index, amount: segment.amount })));
      const expectedRows = year.claims.map((claim, index) => [`${index + 1}번째`, won(claim.params.loss), won(claim.paid), won(claim.remainingBurden), won(claim.annualRemainingAfter)]);
      assert.deepEqual(await lab.locator('[data-payout-claim-row]').evaluateAll(rows => rows.map(row => [...row.querySelectorAll('th,td')].map(cell => cell.textContent.trim()))), expectedRows, 'Recorded claim history changed while previewing/replaying conditions');
      const label = await lab.locator('[data-payout-annual-track]').getAttribute('aria-label');
      assert(label.includes(`연간한도 ${won(year.params.annualLimit)} 중 사용 ${won(year.annualUsed)}, 남음 ${won(year.annualRemaining)}`));
      assert.deepEqual(await lab.locator('[data-payout-annual-ledger] > .insurance-axis span').allTextContents(), ['0원', `연간총한도 ${won(year.params.annualLimit)}`]);
    };
    const inspectFixed = async () => {
      const fixed = projectFixedBenefit({ eventEligible: fixedEligible, amount: fixedAmount });
      const lane = lab.locator('[data-payout-fixed-lane]');
      assert.equal(await lane.getAttribute('data-eligible'), String(fixed.eventEligible));
      assert.equal(await lane.locator('[data-payout-fixed-paid]').innerText(), won(fixed.paid));
      assert.equal(Number(await lane.locator('[data-payout-fixed-paid]').getAttribute('data-value')), fixed.paid);
      assert.equal(await lane.locator('.payout-fixed-event strong').innerText(), fixed.eventEligible ? '조건 충족' : '조건 불충족');
      assert.equal(await lane.locator('.payout-fixed-arrow span').innerText(), fixed.eventEligible ? '→' : '×');
      assert.equal(await lane.locator('.payout-fixed-arrow').evaluate(element => element.classList.contains('closed')), !fixed.eventEligible);
      const boxes = await lane.evaluate(element => ({
        lane: element.getBoundingClientRect().toJSON(), loss: element.closest('.insurance-lab').querySelector('[data-payout-lossbar]').getBoundingClientRect().toJSON(),
        event: element.querySelector('.payout-fixed-event').getBoundingClientRect().toJSON(), promise: element.querySelector('.payout-fixed-promise').getBoundingClientRect().toJSON(),
        line: element.querySelector('.payout-fixed-arrow i').getBoundingClientRect().toJSON(), includedInLoss: !!element.closest('[data-payout-lossbar]'),
      }));
      assert(!boxes.includedInLoss && boxes.lane.top > boxes.loss.bottom, 'The fixed benefit must be a separately painted conditional promise, never a loss segment');
      assert(boxes.event.width >= 70 && boxes.promise.width >= 70, 'Fixed condition and promise are unreadably narrow');
      if (page.viewportSize().width <= 1000) {
        assert(boxes.promise.top > boxes.event.bottom, 'Mobile fixed-benefit relationship must reflow downward');
        assert(boxes.line.height > boxes.line.width * 4, 'Mobile fixed-benefit connector still points across a desktop layout');
      } else {
        assert(boxes.promise.left > boxes.event.right, 'Desktop fixed-benefit relationship overlaps');
        assert(boxes.line.width > boxes.line.height * 4, 'Desktop fixed-benefit connector is not horizontal');
      }
    };
    const inspect = async (frame, model) => {
      const bar = lab.locator('[data-payout-lossbar]');
      assert.equal(Number(await bar.getAttribute('data-loss')), frame.loss);
      assert.equal(await lab.locator('[data-payout-loss]').innerText(), won(frame.loss));
      assert.deepEqual(await bar.locator('[data-payout-segment]').evaluateAll(elements => elements.map(element => ({ id: element.dataset.payoutSegment, amount: Number(element.dataset.amount), fraction: Number(element.dataset.fraction) }))), frame.segments.map(segment => ({ id: segment.id, amount: segment.amount, fraction: segment.fraction })));
      await assertBars(bar, [frame.segments.map(segment => segment.fraction)], 'Every loss component painted once on the original loss scale');
      const total = frame.segments.reduce((sum, segment) => sum + segment.amount, 0);
      assert(Math.abs(total - frame.loss) <= 1e-8 * Math.max(1, frame.loss), 'Observation frame does not partition the original loss');
      assert.deepEqual(await lab.locator('.payout-loss-figure > .insurance-axis span').allTextContents(), ['0원', `${won(frame.loss)} · 이 손실 전체`]);
      const keys = frame.segments.filter(segment => segment.id !== 'unresolved' || segment.amount > 0);
      assert.deepEqual(await lab.locator('[data-payout-key]').evaluateAll(elements => elements.map(element => ({ id: element.dataset.payoutKey, label: element.querySelector('span').textContent, amount: element.querySelector('b').textContent }))), keys.map(segment => ({ id: segment.id, label: segment.label, amount: won(segment.amount) })));
      const description = await bar.getAttribute('aria-label');
      for (const segment of frame.segments) assert(description.includes(`${segment.label} ${won(segment.amount)}`), 'Accessible loss partition omits a model component');
      for (const [attribute, value] of [['data-payout-paid', frame.paid], ['data-payout-burden', frame.resolvedBurden]]) {
        assert.equal(Number(await lab.locator(`[${attribute}]`).getAttribute('data-value')), value);
        assert.equal(await lab.locator(`[${attribute}]`).innerText(), won(value));
      }
      const current = lab.locator('.payout-process [data-current="true"] button');
      assert.equal(await current.count(), 1, 'Exactly one computation stage should be visibly current');
      assert.equal(await current.getAttribute('aria-current'), 'step');
      assert.equal(await current.innerText(), frame.label);
      await inspectYear(); await inspectFixed();
      assert.equal(model.paid + model.remainingBurden, model.params.loss, 'Final payment plus burden must conserve the original loss');
    };
    const loss = lab.getByRole('slider', { name: /^총손실/ });
    const excluded = lab.getByRole('slider', { name: /^보장 제외 금액/ });
    const deductible = lab.getByRole('slider', { name: /^공제 금액/ });
    const rate = lab.getByRole('slider', { name: /^보험자 부담 비율/ });
    const cap = lab.getByRole('slider', { name: /^건별 지급한도/ });
    const fixedControl = lab.getByRole('checkbox', { name: '정액 지급조건 충족', exact: true });
    const clearConditions = async () => { await reset(); fixedEligible = true; };
    const run = async (scenario, options = {}) => {
      const model = previewPayoutClaim(year, { ...defaultClaim, ...options });
      await verify(scenario, model, model.remainingBurden === 0 ? 'all' : 'partial', inspect, cells);
      assert((await lab.locator('.insurance-result').innerText()).includes(model.verdict), 'Final payout explanation differs from the model');
    };
    const frozen = projectPayout();
    assert.deepEqual(frozen.segments.map(segment => segment.amount), [1000000, 500000, 700000, 800000, 0, 2000000], 'Frozen first-claim loss partition changed');
    const overview = page.locator('.payout-overview [data-payout-lossbar]');
    assert.equal(await overview.count(), 1, 'The authored first-claim overview is missing');
    await assertBars(overview, [frozen.segments.map(segment => segment.fraction)], 'Static overview and interactive first claim share the frozen model');
    assert.deepEqual(await overview.locator('[data-payout-segment]').evaluateAll(elements => elements.map(element => Number(element.dataset.amount))), frozen.segments.map(segment => segment.amount));
    await clearConditions(); await run('frozen-first-claim-partition');
    await changingStopsPlayback(async () => { await loss.focus(); await page.keyboard.press('ArrowRight'); });
    await clearConditions(); await setRange(page, loss, 0); await run('zero-loss-zero-painted-components', { loss: 0 });
    await setRange(page, loss, 50); await run('exclusion-exceeds-smaller-loss', { loss: 500000 });
    await setRange(page, loss, 150); await run('exact-deductible-boundary', { loss: 1500000 });
    await setRange(page, loss, 175); await run('one-ui-step-above-deductible', { loss: 1750000 });
    await clearConditions();
    await changingStopsPlayback(() => setRange(page, excluded, 0));
    await run('zero-exclusion-keeps-other-terms', { excluded: 0 });
    await clearConditions();
    await changingStopsPlayback(() => setRange(page, deductible, 500));
    await run('deductible-exceeds-covered-loss', { deductible: 5000000 });
    await clearConditions();
    await changingStopsPlayback(() => setRange(page, rate, 0));
    await run('zero-insurer-share', { insurerRate: 0 });
    await setRange(page, rate, 100); await run('full-insurer-share-still-capped', { insurerRate: 1 });
    await clearConditions();
    await changingStopsPlayback(() => setRange(page, cap, 0));
    await run('zero-per-claim-limit', { perClaimLimit: 0 });
    await setRange(page, cap, 1000); await run('nonbinding-per-claim-limit', { perClaimLimit: 10000000 });
    await clearConditions(); await setRange(page, loss, 200); await setRange(page, excluded, 0); await setRange(page, deductible, 0); await setRange(page, rate, 100); await setRange(page, cap, 1000);
    await run('entire-loss-covered-within-annual-cap', { loss: 2000000, excluded: 0, deductible: 0, insurerRate: 1, perClaimLimit: 10000000 });
    await setRange(page, loss, 1000);
    await run('maximum-loss-annual-cap-binds', { loss: 10000000, excluded: 0, deductible: 0, insurerRate: 1, perClaimLimit: 10000000 });
    await clearConditions();
    await changingStopsPlayback(async () => { await fixedControl.focus(); await page.keyboard.press('Space'); fixedEligible = false; });
    await run('fixed-condition-false-keeps-loss-and-year-independent');
    await fixedControl.focus(); await page.keyboard.press('Space'); fixedEligible = true;
    await run('fixed-condition-true-keeps-loss-and-year-independent');
    await clearConditions(); await run('repeated-default-no-implicit-claim');
    const record = lab.getByRole('button', { name: '이번 청구 기록하기', exact: true });
    const commit = async () => {
      await record.focus(); await page.keyboard.press('Enter');
      year = submitPayoutClaim(year, defaultClaim);
      assert.match(await controls.locator('span').innerText(), /^0 \/ /, 'Committing a claim must rewind the next preview');
      assert.equal(await prediction.inputValue(), '', 'Recorded claim left a stale prediction');
      await inspectYear();
    };
    await commit();
    assert.equal(year.claims[0].paid, 2000000);
    await run('second-claim-only-one-million-remaining');
    await changingStopsPlayback(() => setRange(page, loss, 525));
    await inspectYear();
    await clearConditions(); await inspectYear();
    await run('rewind-and-condition-reset-preserve-first-claim');
    await commit();
    assert.equal(year.claims[1].paid, 1000000);
    await run('third-claim-exhausted-annual-cap');
    await commit();
    assert.deepEqual(year.claims.map(claim => claim.paid), [2000000, 1000000, 0], 'Repeated claims must pay 200/100/0만원');
    await clearConditions(); await run('exhausted-year-survives-condition-reset');
    await fixedControl.focus(); await page.keyboard.press('Space'); fixedEligible = false;
    await run('fixed-ineligible-does-not-refill-exhausted-year');
    const newYear = lab.getByRole('button', { name: '새 보험연도 시작', exact: true });
    await changingStopsPlayback(async () => { await newYear.focus(); await page.keyboard.press('Enter'); });
    year = startNextPayoutYear(year);
    assert.equal(year.year, 2); assert.equal(year.annualUsed, 0); assert.equal(year.annualRemaining, 3000000); assert.equal(year.claims.length, 0);
    await inspectYear(); await run('explicit-new-year-restores-three-million');
    await clearConditions(); await run('new-year-default-first-claim-is-two-million-again');
    for (const [slider, value] of [[loss, payoutDefaults.loss / 10000], [excluded, payoutDefaults.excluded / 10000], [deductible, payoutDefaults.deductible / 10000], [rate, payoutDefaults.insurerRate * 100], [cap, payoutDefaults.perClaimLimit / 10000]]) assert.equal(await slider.inputValue(), String(value), 'Condition reset did not restore an authored default');
    assert.equal(await fixedControl.isChecked(), true);
    await inspectYear();
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
    const intermediatePage = await intermediate.newPage(); watchPage(intermediatePage, 'intermediate-850-insurance');
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
    for (const chapter of insuranceChapters.filter(chapter => ['contract-map', 'payout'].includes(chapter.id))) {
      await check(`intermediate-850-${chapter.id}-layout-and-model`, intermediatePage, async () => {
        await visit(intermediatePage, chapter.route);
        await domAudit(intermediatePage);
        const lab = intermediatePage.locator(`[data-insurance-lab="${chapter.id}"]`);
        assert.equal(await lab.count(), 1, 'Intermediate-width chapter must retain its published lab');
        await capture(intermediatePage, `850-${chapter.id}-initial-scene`, lab);
        return conditionChecks(intermediatePage, lab, `850-${chapter.id}`);
      });
    }
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
        const controls = lab.locator('.money-playback');
        const step = controls.getByRole('button', { name: '한 단계 진행', exact: true });
        const frameCount = Number((await controls.locator('span').innerText()).match(/^0 \/ (\d+) 단계$/)?.[1]);
        assert(Number.isInteger(frameCount) && frameCount > 0 && frameCount <= 30, 'Reduced-motion observation count must be bounded and initially at zero');
        for (let index = 1; index <= frameCount; index++) {
          await step.focus(); await page.keyboard.press('Enter');
          assert.equal(await controls.locator('span').innerText(), `${index} / ${frameCount} 단계`, 'Reduced motion must allow every manual observation frame');
          assert.deepEqual(await motion(), [], 'Manual observation reintroduced reduced-motion animation');
        }
        assert(await step.isDisabled(), 'Reduced-motion stepping did not stop at the final frame');
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

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
async function tableDisclosureGeometryChecks(page, lab, name) {
  const geometry = () => lab.evaluate(element => {
    const main = element.closest('main'), mainBox = main.getBoundingClientRect(), box = element.getBoundingClientRect();
    return { viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, scrollX, mainWidth: mainBox.width, mainLeft: mainBox.left + scrollX, labWidth: box.width, labLeft: box.left + scrollX };
  });
  const baseline = await geometry();
  const observations = [];
  const summaries = lab.locator('details.insurance-static > summary');
  assert(await summaries.count() > 0, 'Published lab needs a static-table disclosure');
  assert.equal(await lab.locator('details.insurance-static[open]').count(), 0, 'Disclosure geometry starts from the authored closed-table state');
  const inspect = async state => {
    const current = await geometry();
    assert(current.documentWidth <= current.viewport + 1, `${state}: opening a static table expanded the document: ${JSON.stringify(current)}`);
    assert.equal(current.scrollX, baseline.scrollX, `${state}: a table disclosure caused page-level horizontal scrolling`);
    for (const key of ['mainWidth', 'mainLeft', 'labWidth', 'labLeft']) assert(Math.abs(current[key] - baseline[key]) <= 1, `${state}: static table changed ${key} from ${baseline[key]} to ${current[key]}`);
    await domAudit(page);
    observations.push({ state, ...current });
  };
  for (let index = 0; index < await summaries.count(); index++) {
    const summary = summaries.nth(index);
    await summary.focus(); await page.keyboard.press('Enter');
    assert(await summary.evaluate(element => element.parentElement.open), 'Keyboard Enter did not open the static table');
    await inspect(`table-${index + 1}-open`);
    await summary.focus(); await page.keyboard.press('Enter');
    assert.equal(await summary.evaluate(element => element.parentElement.open), false, 'Keyboard Enter did not close the static table');
    await inspect(`table-${index + 1}-closed`);
  }
  await openTables(page, lab);
  await inspect('all-static-tables-open');
  await capture(page, `${name}-all-static-tables-open`, lab);
  for (const summary of await summaries.all()) {
    await summary.focus(); await page.keyboard.press('Enter');
    assert.equal(await summary.evaluate(element => element.parentElement.open), false);
  }
  await inspect('all-static-tables-closed-again');
  return observations;
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
// C has exact day boundaries; choose the nearest keyboard origin without assigning DOM values.
async function setExactRange(page, slider, value) {
  const bounds = await slider.evaluate(element => ({ min: +element.min, max: +element.max, step: +(element.step || 1), current: +element.value }));
  assert(value >= bounds.min && value <= bounds.max && Number.isInteger((value - bounds.min) / bounds.step), `Exact range value is outside the authored domain: ${value}`);
  const origins = [{ value: bounds.current }, { value: bounds.min, key: 'Home' }, { value: bounds.max, key: 'End' }].sort((a, b) => Math.abs(value - a.value) - Math.abs(value - b.value));
  const origin = origins[0], steps = Math.abs(value - origin.value) / bounds.step;
  assert(Number.isInteger(steps) && steps <= 500, 'Exact keyboard input exceeds its bounded UI domain');
  await slider.focus();
  if (origin.key) await page.keyboard.press(origin.key);
  for (let index = 0; index < steps; index++) await page.keyboard.press(value > origin.value ? 'ArrowRight' : 'ArrowLeft');
  assert.equal(await slider.inputValue(), String(value), 'Keyboard input did not reach the exact model boundary');
}
async function assertFrameSelection(lab, frame) {
  const button = lab.getByRole('button', { name: frame.label, exact: true });
  assert.equal(await button.count(), 1, 'Each observation needs one directly selectable phase');
  assert.equal(await button.getAttribute('aria-current'), 'step', 'The observed phase is not exposed as current');
  assert.equal(await lab.locator('button[aria-current="step"]').count(), 1, 'More than one observation is marked current');
}
async function keyboardFrameSelection(page, lab, model, inspect) {
  const observations = [];
  // Seek backwards, then forwards, without needing autoplay or traversing every intermediate frame.
  for (const index of [1, 0, model.frames.length - 1]) {
    const frame = model.frames[index], button = lab.getByRole('button', { name: frame.label, exact: true });
    await button.focus(); await page.keyboard.press('Tab'); await button.focus();
    const focus = await button.evaluate(element => { const style = getComputedStyle(element); return { focused: element === document.activeElement, visible: element.matches(':focus-visible'), outline: style.outlineStyle, width: parseFloat(style.outlineWidth) }; });
    assert(focus.focused && focus.visible && focus.outline !== 'none' && focus.width > 0, 'Direct observation selection has no visible keyboard focus');
    await page.keyboard.press('Enter');
    assert.equal(await lab.locator('.money-playback span').innerText(), `${index} / ${model.frames.length - 1} 단계`);
    assert.equal(await lab.locator('.money-playback').getByRole('button', { name: '정지', exact: true }).count(), 0, 'Direct phase selection must pause playback');
    await assertFrameSelection(lab, frame);
    await inspect(frame, model);
    observations.push({ index, phase: frame.phase, focus });
    if (index === 1) {
      await lab.locator('.money-playback').getByRole('button', { name: '재생', exact: true }).click();
      assert(await lab.locator('.money-playback').getByRole('button', { name: '정지', exact: true }).isVisible());
    }
  }
  return observations;
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
// C verifiers are reused for ordinary and prefers-reduced-motion observation frames.
async function coverageConditionsVerifier(page, lab) {
  const { projectConditions, conditionsDefaults, conditionsBoundaryCases } = await import('../src/simulations/insurance/conditions.mjs');
  const number = value => value.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
  const won = value => `${number(value / 10000)}만원`;
  const benefit = value => value === null ? '미정' : won(value);
  const percent = value => value === null ? '미정' : `${number(value * 100)}%`;
  const states = { pending: '○ 관찰 전', pass: '✓ 충족', fail: '× 충족하지 않음', reduced: '½ 감액 구간', unknown: '? 확인 필요', invalid: '! 순서 오류' };
  const cells = model => [
    ...model.frames.map(frame => [frame.label, ...frame.gates.map(gate => states[gate.state]), frame.statusLabel, benefit(frame.benefit)]),
    ...conditionsBoundaryCases().map(item => [`${item.params.eventDay}일`, `${item.params.claimDay}일`, item.statusLabel, percent(item.rate), benefit(item.benefit)]),
  ];
  const outcome = model => model.benefit === null ? 'unresolved' : model.rate === 0 ? 'zero' : model.rate === .5 ? 'half' : 'full';
  const inspect = async (frame, model) => {
    await assertFrameSelection(lab, frame);
    assert.equal(await lab.locator('[data-conditions-status]').getAttribute('data-conditions-status'), frame.status);
    assert.equal(await lab.locator('[data-conditions-status] > span > strong').first().innerText(), frame.statusLabel);
    for (const [attribute, value, label] of [['data-conditions-paid', frame.benefit, benefit(frame.benefit)], ['data-conditions-rate', frame.rate, percent(frame.rate)]]) {
      const element = lab.locator(`[${attribute}]`);
      assert.equal(await element.getAttribute('data-value'), value === null ? 'unresolved' : String(value));
      assert.equal(await element.innerText(), label, 'Unresolved amounts/rates must stay textual and distinct from a known zero');
      if (value === null) assert(!/0(?:원|만원|%)/.test(await element.innerText()), 'Unknown was rendered as a zero-payment denial');
    }
    if (frame.phase !== 'decision') {
      assert.equal(frame.benefit, null, 'Intermediate condition frame exposes the final amount');
      assert.equal(frame.status, 'pending');
      assert(!(await lab.locator('.insurance-result').innerText()).startsWith('예측과'), 'Prediction feedback appeared before all conditions were interpreted');
    }
    if (frame.status === 'unresolved' || frame.status === 'invalid') {
      assert.equal(frame.benefit, null);
      assert.match(await lab.locator('.insurance-result').innerText(), frame.status === 'invalid' ? /지급 거절 판정이 아닙니다/ : /0원이나 자동 거절을 뜻하지 않습니다/);
    }
    const gates = await lab.locator('[data-conditions-gate]').evaluateAll(elements => elements.map(element => {
      const opening = element.querySelector('.conditions-gate-opening'), symbol = opening.querySelector('span'), style = getComputedStyle(element), symbolStyle = getComputedStyle(symbol);
      return { id: element.dataset.conditionsGate, state: element.dataset.state, label: element.querySelector(':scope > strong').textContent, stateLabel: element.querySelector('.conditions-gate-state').textContent, detail: element.querySelector('p').textContent, symbol: symbol.textContent, border: style.borderTopStyle, borderWidth: parseFloat(style.borderTopWidth), symbolBorder: symbolStyle.borderBottomStyle, symbolColor: symbolStyle.color, symbolSize: parseFloat(symbolStyle.fontSize), box: element.getBoundingClientRect().toJSON(), opening: opening.getBoundingClientRect().toJSON(), posts: [...opening.querySelectorAll('i')].map(post => post.getBoundingClientRect().toJSON()) };
    }));
    assert.equal(gates.length, frame.gates.length);
    gates.forEach((gate, index) => {
      const expected = frame.gates[index];
      assert.deepEqual([gate.id, gate.state, gate.label, gate.stateLabel, gate.detail, gate.symbol], [expected.id, expected.state, expected.label, states[expected.state], expected.detail, states[expected.state].split(' ')[0]], 'A condition gate leaks or contradicts its observed model state');
      assert(gate.symbolSize >= 18 && gate.opening.height >= 30 && gate.opening.width >= 35, 'Gate state shape has become unreadable');
      assert.equal(gate.posts.length, 2, 'Each gate must retain two visible boundary posts');
      for (const post of gate.posts) assert(post.width >= 6 && post.height >= 30 && post.left >= gate.box.left && post.right <= gate.box.right + 1, 'Gate opening escaped its boundary');
      assert.equal(gate.symbolBorder, ['fail', 'invalid'].includes(expected.state) ? 'solid' : 'dashed', 'Gate closure/uncertainty shape contradicts the current state');
      if (expected.state === 'unknown') assert(gate.border === 'dashed' && gate.borderWidth >= 2, 'Unknown must retain a dashed uncertainty boundary');
      if (index > 0 && page.viewportSize().width <= 650) assert(gate.box.top >= gates[index - 1].box.bottom, 'Mobile condition gates must reflow into separate readable rows');
    });
    for (const first of gates) for (const second of gates) {
      if (first.state === second.state) assert.equal(first.symbolColor, second.symbolColor, 'The same condition state has inconsistent meaning colors');
      if ((first.state === 'pass' && ['fail', 'unknown', 'reduced'].includes(second.state)) || (first.state === 'unknown' && second.state === 'fail')) assert.notEqual(first.symbolColor, second.symbolColor, 'Distinct condition states have lost their meaning colors');
    }
    const timeline = await lab.locator('.conditions-timeline').evaluate(element => {
      const paint = node => { const style = getComputedStyle(node); return { color: style.backgroundColor, image: style.backgroundImage, size: style.backgroundSize }; };
      const box = node => node.getBoundingClientRect().toJSON();
      const track = element.querySelector('[data-conditions-timeline]');
      return {
        min: Number(track.dataset.min), max: Number(track.dataset.max), track: box(track), label: track.getAttribute('aria-label'),
        contractTrack: box(element.querySelector('[data-conditions-contract-track]')),
        contract: { box: box(element.querySelector('[data-conditions-contract]')), start: Number(element.querySelector('[data-conditions-contract]').dataset.start), end: Number(element.querySelector('[data-conditions-contract]').dataset.end) },
        periods: [...track.querySelectorAll('[data-conditions-period]')].map(period => ({ id: period.dataset.conditionsPeriod, start: Number(period.dataset.start), end: Number(period.dataset.end), fraction: Number(period.dataset.fraction), box: box(period), paint: paint(period), keyPaint: paint(element.querySelector(`.conditions-period-key .conditions-period-${period.dataset.conditionsPeriod}`)) })),
        boundaries: [...track.querySelectorAll('[data-conditions-boundary]')].map(boundary => ({ id: boundary.dataset.conditionsBoundary, day: Number(boundary.dataset.day), fraction: Number(boundary.dataset.fraction), box: box(boundary), border: getComputedStyle(boundary).borderLeftStyle, borderWidth: parseFloat(getComputedStyle(boundary).borderLeftWidth) })),
        markers: [...element.querySelectorAll('[data-conditions-marker-track]')].map(row => { const marker = row.querySelector('[data-conditions-marker]'), style = marker && getComputedStyle(marker); return { id: row.dataset.conditionsMarkerTrack, track: box(row), dayLabel: element.querySelector(`[data-conditions-day="${row.dataset.conditionsMarkerTrack}"]`).textContent, marker: marker && { id: marker.dataset.conditionsMarker, day: Number(marker.dataset.day), fraction: Number(marker.dataset.fraction), box: box(marker), symbol: marker.querySelector('span').textContent, color: style.color, border: style.borderLeftStyle, borderWidth: parseFloat(style.borderLeftWidth) } }; }),
        keys: [...element.querySelectorAll('.conditions-period-key > div')].map(key => ({ label: key.querySelector('b').textContent, range: key.querySelector('small').textContent })),
        boundaryKeys: [...element.querySelectorAll('.conditions-boundary-key > span')].map(key => key.textContent),
        axis: [...element.querySelectorAll('.insurance-axis span')].map(node => node.textContent), caption: element.querySelector('figcaption').textContent,
      };
    });
    const t = model.timeline;
    assert.deepEqual([timeline.min, timeline.max], [t.min, t.max]);
    assert(timeline.track.width >= 100 && timeline.track.height >= 28, 'Timeline lost its readable common date scale');
    for (const track of [timeline.contractTrack, ...timeline.markers.map(marker => marker.track)]) {
      assert(Math.abs(track.left - timeline.track.left) <= 1 && Math.abs(track.width - timeline.track.width) <= 1, 'Contract, benefit, event and claim rows no longer share the same painted scale');
    }
    assert.equal(timeline.periods.length, t.periods.length);
    timeline.periods.forEach((period, index) => {
      const expected = t.periods[index];
      assert.deepEqual([period.id, period.start, period.end, period.fraction], [expected.id, expected.start, expected.end, expected.fraction]);
      assert(Math.abs(period.box.left - timeline.track.left - expected.leftFraction * timeline.track.width) <= 1, 'Date period starts at a different painted day');
      assert(Math.abs(period.box.width - expected.fraction * timeline.track.width) <= 1, 'Date period length is not proportional to the model duration');
      assert.deepEqual(period.paint, period.keyPaint, 'Timeline period and its legend swatch disagree');
      assert(timeline.label.includes(`${expected.label}: ${expected.start}일부터 ${expected.end}일 전까지`));
    });
    assert.equal(new Set(timeline.periods.map(period => JSON.stringify(period.paint))).size, t.periods.length, 'Date regions need distinct meaning colors/patterns');
    assert.equal(timeline.periods.find(period => period.id === 'normal').paint.image, 'none');
    for (const id of ['before', 'waiting', 'reduced', 'ended']) assert.notEqual(timeline.periods.find(period => period.id === id).paint.image, 'none', `${id}: period lost its non-color pattern`);
    assert.deepEqual(timeline.keys, t.periods.map(period => ({ label: period.label, range: `${period.start}일 이상 · ${period.end}일 미만` })));
    assert.deepEqual(timeline.boundaryKeys, t.boundaries.map(boundary => `${boundary.day}일 ${boundary.label}`));
    assert.deepEqual(timeline.axis, [`${t.min}일`, `${t.max}일 · 모든 행 같은 눈금`]);
    assert.deepEqual([timeline.contract.start, timeline.contract.end], [t.contract.start, t.contract.end]);
    assert(Math.abs(timeline.contract.box.left - timeline.contractTrack.left - t.contract.leftFraction * timeline.contractTrack.width) <= 1);
    assert(Math.abs(timeline.contract.box.width - t.contract.fraction * timeline.contractTrack.width) <= 1, 'Contract effectiveness was confused with benefit coverage');
    assert.equal(timeline.boundaries.length, t.boundaries.length);
    timeline.boundaries.forEach((boundary, index) => {
      const expected = t.boundaries[index];
      assert.deepEqual([boundary.id, boundary.day, boundary.fraction], [expected.id, expected.day, expected.fraction]);
      assert(Math.abs(boundary.box.left - timeline.track.left - expected.fraction * timeline.track.width) <= 1, 'Painted boundary differs from exact model day');
      assert(boundary.border === 'solid' && boundary.borderWidth >= 1 && boundary.box.height > timeline.track.height, 'Exact date boundary lost its visible stroke');
    });
    assert.equal(timeline.markers.length, t.markers.length);
    timeline.markers.forEach((row, index) => {
      const expected = t.markers[index];
      assert.equal(row.id, expected.id); assert.equal(row.dayLabel, expected.day === null ? '미확인' : `${expected.day}일`);
      if (expected.fraction === null) assert.equal(row.marker, null, 'Unknown date was plotted as a real day');
      else {
        assert.deepEqual([row.marker.id, row.marker.day, row.marker.fraction], [expected.id, expected.day, expected.fraction]);
        assert(Math.abs(row.marker.box.left - row.track.left - expected.fraction * row.track.width) <= 1, 'Event/claim marker is painted at the wrong model day');
        assert.equal(row.marker.symbol, expected.id === 'event' ? '◆' : '●', 'Event and claim need distinct marker shapes');
        assert.equal(row.marker.border, expected.id === 'event' ? 'solid' : 'dashed');
        assert(row.marker.borderWidth >= 2 && row.marker.box.height >= 28, 'Date marker lost its readable line');
      }
    });
    assert(timeline.markers[1].track.top > timeline.markers[0].track.bottom, 'Event and claim markers must stay on independent rows, including coincident days');
    if (timeline.markers.every(row => row.marker)) assert.notEqual(timeline.markers[0].marker.color, timeline.markers[1].marker.color);
    assert.match(timeline.caption, /◆.*사건.*●.*청구/);
  };
  return { projectConditions, conditionsDefaults, inspect, cells, outcome };
}
async function overlapVerifier(page, lab) {
  const { projectOverlap, overlapDefaults, overlapScenarios } = await import('../src/simulations/insurance/overlap.mjs');
  const won = value => `${(value / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}만원`;
  const valueText = value => value === null ? '미정' : won(value);
  const cells = model => [
    ...model.frames.map(frame => [frame.label, ...frame.segments.map(segment => won(segment.amount)), valueText(frame.totalPaid), valueText(frame.fixedTotal)]),
    ...overlapScenarios().map(({ label, result }) => [label, ...[result.params.grossLoss, result.outside, result.eligibleLoss, result.eligibleCapA, result.eligibleCapB, result.paidA, result.paidB, result.totalPaid, result.gap].map(won)]),
    ...[true, false].flatMap(fixedA => [true, false].map(fixedB => { const model = projectOverlap({ fixedA, fixedB }); return [fixedA ? '충족' : '불충족', fixedB ? '충족' : '불충족', won(model.fixed[0].paid), won(model.fixed[1].paid), won(model.fixedTotal)]; })),
  ];
  const outcome = model => model.remainingBurden === 0 ? 'all' : 'gap';
  const inspect = async (frame, model) => {
    await assertFrameSelection(lab, frame);
    const bar = lab.locator('[data-overlap-lossbar]');
    assert.equal(await bar.count(), 1, 'Two contracts must fill exactly one gross-loss area');
    assert.equal(Number(await bar.getAttribute('data-loss')), frame.grossLoss);
    assert.deepEqual(await bar.locator('[data-overlap-segment]').evaluateAll(elements => elements.map(element => ({ id: element.dataset.overlapSegment, amount: Number(element.dataset.amount), fraction: Number(element.dataset.fraction), leftFraction: Number(element.dataset.left) }))), frame.segments.map(segment => ({ id: segment.id, amount: segment.amount, fraction: segment.fraction, leftFraction: segment.leftFraction })));
    await assertBars(bar, [frame.segments.map(segment => segment.fraction)], 'A/B/gap/outside/unresolved fill the original gross loss exactly once');
    assert.equal(await bar.locator('[data-overlap-fixed-lane], [data-overlap-fixed-total]').count(), 0, 'Fixed promises were nested into the loss partition');
    const total = frame.segments.reduce((sum, segment) => sum + segment.amount, 0);
    assert(Math.abs(total - frame.grossLoss) <= 1e-8 * Math.max(1, frame.grossLoss), 'Gross-loss partition creates or destroys loss');
    assert(model.totalPaid <= model.eligibleLoss && model.paidA <= model.eligibleCapA && model.paidB <= model.eligibleCapB, 'The shared allocation exceeds eligible loss or participating caps');
    assert.equal(model.paidA + model.paidB, model.totalPaid);
    assert.equal(model.totalPaid + model.remainingBurden, model.params.grossLoss);
    const signature = await lab.locator('.overlap-loss-figure').evaluate(element => {
      const paint = node => { const style = getComputedStyle(node); return { color: style.backgroundColor, image: style.backgroundImage, size: style.backgroundSize }; };
      return { height: element.querySelector('[data-overlap-lossbar]').getBoundingClientRect().height, label: element.querySelector('[data-overlap-lossbar]').getAttribute('aria-label'), axis: [...element.querySelectorAll('.insurance-axis span')].map(node => node.textContent), parts: [...element.querySelectorAll('[data-overlap-segment]')].map(part => { const key = element.querySelector(`.overlap-key.${part.dataset.overlapSegment}`); return { id: part.dataset.overlapSegment, paint: paint(part), keyPaint: paint(key.querySelector('i')), label: key.querySelector('span').childNodes[0].textContent, amount: key.querySelector('b').textContent }; }), caption: element.querySelector('figcaption').textContent };
    });
    assert(signature.height >= 60, 'The one-loss area became an unreadably thin decoration');
    assert.deepEqual(signature.axis, ['0원', `${won(frame.grossLoss)} · 이 손실 전체`]);
    assert.equal(signature.parts.length, frame.segments.length);
    signature.parts.forEach((part, index) => {
      const expected = frame.segments[index];
      assert.deepEqual([part.id, part.label, part.amount], [expected.id, expected.label, won(expected.amount)]);
      assert.deepEqual(part.paint, part.keyPaint, 'Loss paint differs from its semantic legend');
      assert(signature.label.includes(`${expected.label} ${won(expected.amount)}`), 'Accessible loss description omits a model segment');
    });
    assert.equal(new Set(signature.parts.map(part => JSON.stringify(part.paint))).size, frame.segments.length, 'Loss components lost distinct colors/patterns');
    assert.equal(signature.parts.find(part => part.id === 'a').paint.image, 'none');
    for (const id of ['b', 'gap', 'outside']) assert.notEqual(signature.parts.find(part => part.id === id).paint.image, 'none', `${id}: meaning cannot be reduced to color alone`);
    assert.match(signature.caption, /하나의 대상손실/);
    for (const [attribute, value] of [['gross', frame.grossLoss], ['loss-value', frame.grossLoss], ['eligible-loss', frame.eligibleLoss], ['paid-a', frame.paidA], ['paid-b', frame.paidB], ['paid-total', frame.totalPaid], ['burden', frame.remainingBurden], ['fixed-total', frame.fixedTotal]]) {
      const element = lab.locator(`[data-overlap-${attribute}]`);
      assert.equal(await element.getAttribute('data-value'), value === null ? 'unresolved' : String(value), `${attribute}: phase visibility/data differ from model`);
      assert.equal(await element.innerText(), valueText(value), `${attribute}: unknown value must stay distinct from a known zero`);
    }
    if (frame.index < 3) assert.equal(frame.totalPaid, null, 'Allocation was exposed before its observation phase');
    if (frame.index < 4) {
      assert.equal(frame.fixedTotal, null);
      assert(!(await lab.locator('.insurance-result').innerText()).startsWith('예측과'), 'Final prediction feedback appeared before fixed conditions were observed');
    }
    assert.equal(await lab.locator('[data-overlap-capacity]').count(), frame.capacities.length);
    const capacityWidths = [];
    for (const capacity of frame.capacities) {
      const row = lab.locator(`[data-overlap-capacity="${capacity.id}"]`);
      assert.equal(await row.getAttribute('data-eligible'), String(capacity.eligible));
      assert.equal(await row.getAttribute('data-observed'), String(capacity.observed));
      assert.equal(await row.locator(':scope > div:first-child > strong').innerText(), `${capacity.label} · 남은 한도 ${won(capacity.cap)}`);
      assert.equal(await row.locator(':scope > div:first-child > span').innerText(), !capacity.observed ? '적격 관찰 전' : capacity.eligible ? '✓ 이 사건에 적격' : '× 이 사건은 제외');
      assert.equal(await row.locator(':scope > small').innerText(), capacity.observed ? `배분에 참여하는 한도 ${won(capacity.eligibleCap)}` : '배분 참여 여부는 아직 미정');
      const geometry = await row.locator('.overlap-cap-track').evaluate(element => {
        const track = element.getBoundingClientRect(), outline = element.querySelector('.overlap-cap-outline'), fill = element.querySelector('[data-overlap-cap-fill]');
        const paint = node => { const style = getComputedStyle(node); return { color: style.backgroundColor, image: style.backgroundImage, size: style.backgroundSize }; };
        return { track: track.toJSON(), outline: outline.getBoundingClientRect().toJSON(), outlineBorder: getComputedStyle(outline).borderTopStyle, fill: fill && { box: fill.getBoundingClientRect().toJSON(), fraction: Number(fill.dataset.fraction), paint: paint(fill) } };
      });
      capacityWidths.push(geometry.track.width);
      assert(Math.abs(geometry.outline.width - geometry.track.width * capacity.capFraction) <= 1 && Math.abs(geometry.outline.left - geometry.track.left) <= 1, 'Capacity outline contradicts its common scale');
      assert.equal(geometry.outlineBorder, 'dashed', 'Capacity must remain a distinct outline, not a second paid loss bar');
      if (!capacity.observed) assert.equal(geometry.fill, null, 'An unobserved eligibility decision was painted early');
      else {
        assert(geometry.fill, 'Observed eligibility has no model fill');
        assert.equal(geometry.fill.fraction, capacity.eligibleFraction);
        assert(Math.abs(geometry.fill.box.width - geometry.track.width * capacity.eligibleFraction) <= 1 && Math.abs(geometry.fill.box.left - geometry.track.left) <= 1, 'Participating capacity fill differs from model');
        assert.deepEqual(geometry.fill.paint, signature.parts.find(part => part.id === capacity.id).paint, 'Capacity and loss contribution use different A/B meaning colors');
      }
    }
    assert(Math.max(...capacityWidths) - Math.min(...capacityWidths) <= 1, 'Capacity A and B use different painted scales');
    const convergence = await lab.locator('.overlap-converge').evaluate(element => ({ labels: [...element.children].map(child => child.textContent), box: element.getBoundingClientRect().toJSON(), loss: element.closest('[data-insurance-lab]').querySelector('[data-overlap-lossbar]').getBoundingClientRect().toJSON() }));
    assert.deepEqual(convergence.labels, ['A ↘', '↙ B']);
    assert(convergence.box.bottom < convergence.loss.top, 'A/B routes no longer converge toward the single loss area');
    assert.equal(await lab.locator('[data-overlap-fixed-lane]').count(), frame.fixed.length);
    for (const fixed of frame.fixed) {
      const lane = lab.locator(`[data-overlap-fixed-lane="${fixed.id}"]`), paid = lane.locator(`[data-overlap-fixed-${fixed.id}]`);
      assert.equal(await lane.getAttribute('data-eligible'), String(fixed.eligible));
      assert.equal(await lane.locator(':scope > div:first-child > strong').innerText(), fixed.label);
      assert.equal(await lane.locator(':scope > div:first-child > span').innerText(), `약정 ${won(fixed.promise)}`);
      assert.equal(await paid.getAttribute('data-value'), fixed.paid === null ? 'unresolved' : String(fixed.paid));
      assert.equal(await paid.innerText(), valueText(fixed.paid));
      assert.equal(await lane.locator('.overlap-promise-path > span').innerText(), fixed.paid === null ? '? 아직 관찰 전' : fixed.eligible ? '✓ 조건 충족' : '× 조건 불충족');
      assert.equal(await lane.locator('.overlap-promise-path > i').innerText(), fixed.paid === null ? '?' : fixed.eligible ? '→' : '×');
      const geometry = await lane.evaluate(element => {
        const box = node => node.getBoundingClientRect().toJSON(), path = element.querySelector('.overlap-promise-path'), mark = path.querySelector('i'), style = getComputedStyle(mark), matrix = new DOMMatrixReadOnly(style.transform);
        return { nestedInLoss: !!element.closest('[data-overlap-lossbar]'), lane: box(element), loss: box(element.closest('[data-insurance-lab]').querySelector('[data-overlap-lossbar]')), promise: box(element.firstElementChild), paid: box(element.lastElementChild), path: box(path), state: path.classList.contains('pending') ? 'pending' : path.classList.contains('open') ? 'open' : 'closed', angle: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI, border: style.borderBottomStyle, borderWidth: parseFloat(style.borderBottomWidth) };
      });
      assert(!geometry.nestedInLoss && geometry.lane.top > geometry.loss.bottom, 'Conditional fixed promises must remain outside the gross-loss partition');
      assert.equal(geometry.state, fixed.paid === null ? 'pending' : fixed.eligible ? 'open' : 'closed');
      assert.equal(geometry.border, fixed.paid === null ? 'dashed' : 'solid');
      assert(geometry.borderWidth >= 2, 'The fixed promise connector lost its visible stroke');
      if (page.viewportSize().width <= 650) {
        assert(geometry.path.top > geometry.promise.bottom && geometry.paid.top > geometry.path.bottom, 'Mobile fixed promise must reflow through separate downward stages');
        assert(Math.abs(geometry.angle - 90) < .01, 'Mobile fixed promise arrow still points across the page');
      } else {
        assert(geometry.path.left > geometry.promise.right && geometry.paid.left > geometry.path.right, 'Desktop fixed promise stages overlap');
        assert(Math.abs(geometry.angle) < .01, 'Desktop fixed promise arrow lost its horizontal direction');
      }
      assert(geometry.promise.width > 40 && geometry.paid.width > 40, 'Fixed condition/promise labels are too narrow to read');
    }
    assert.deepEqual(model.fixed.map(fixed => fixed.promise), [1000000, 2000000], 'The two separate frozen fixed promises changed');
  };
  return { projectOverlap, overlapDefaults, inspect, cells, outcome };
}
// D verifiers compare one frozen calendar/money model with actual painted geometry.
async function timelinesVerifier(page, lab) {
  const { projectTimelines, timelinesDefaults } = await import('../src/simulations/insurance/timelines.mjs');
  const won = value => `${(value / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}만원`;
  const cells = model => [
    ...model.frames.map(frame => [`${frame.year}년`, won(frame.fixed.premium), won(frame.fixed.cumulativePremium), frame.fixed.covered ? '기간 안' : '기간 밖', won(frame.renewing.premium), won(frame.renewing.cumulativePremium), frame.renewing.covered ? '기간 안' : '기간 밖', frame.renewal.label]),
    ...model.periods.map(period => [`${period.start}년 이상 · ${period.end}년 미만`, `${won(period.annualPremium)} / 년`, `${period.start}·${period.end - 1}년 시작`, period.active ? '유지' : '갱신하지 않아 미적용']),
  ];
  const inspect = async (frame, model) => {
    await assertFrameSelection(lab, frame);
    const painted = await lab.evaluate(element => {
      const rect = node => node.getBoundingClientRect().toJSON();
      const paint = node => { const style = getComputedStyle(node); return { color: style.backgroundColor, image: style.backgroundImage, border: style.borderTopStyle, opacity: Number(style.opacity) }; };
      return {
        year: Number(element.querySelector('input[type=range]').value),
        tracks: [...element.querySelectorAll('[data-timelines-track]')].map(track => ({ kind: track.dataset.timelinesTrack, contract: track.dataset.contract, box: rect(track), height: track.clientHeight, width: track.clientWidth, top: parseFloat(getComputedStyle(track).borderTopWidth), label: track.getAttribute('aria-label'), marker: (() => { const m = track.querySelector('[data-timelines-marker]'); return { year: Number(m.dataset.year), position: Number(m.dataset.position), box: rect(m), border: getComputedStyle(m).borderLeftStyle }; })(), payments: [...track.querySelectorAll('[data-timelines-payment]')].map(mark => ({ year: Number(mark.dataset.year), amount: Number(mark.dataset.amount), position: Number(mark.dataset.position), heightFraction: Number(mark.dataset.heightFraction), paid: mark.dataset.paid, box: rect(mark), paint: paint(mark), point: rect(mark.querySelector('b')) })), coverage: (() => { const c = track.querySelector('[data-timelines-coverage]'); return c && { start: Number(c.dataset.start), end: Number(c.dataset.end), fraction: Number(c.dataset.fraction), box: rect(c), paint: paint(c), endpoints: [...c.querySelectorAll('b')].map(node => ({ box: rect(node), background: getComputedStyle(node).backgroundColor, border: getComputedStyle(node).borderTopStyle })) }; })() })),
        periods: [...element.querySelectorAll('[data-timelines-period]')].map(period => ({ index: Number(period.dataset.timelinesPeriod), active: period.dataset.active, position: Number(period.dataset.position), fraction: Number(period.dataset.fraction), box: rect(period), paint: paint(period) })),
        renewals: [...element.querySelectorAll('[data-timelines-renewal]')].map(mark => ({ year: Number(mark.dataset.timelinesRenewal), state: mark.dataset.state, position: Number(mark.dataset.position), symbol: mark.textContent, box: rect(mark), font: parseFloat(getComputedStyle(mark).fontSize) })),
        axes: [...element.querySelectorAll('.timelines-year-axis')].map(axis => ({ box: rect(axis), labels: [...axis.children].map(node => ({ text: node.textContent, box: rect(node), font: parseFloat(getComputedStyle(node).fontSize), lineHeight: parseFloat(getComputedStyle(node).lineHeight) })) })),
        current: [...element.querySelectorAll('[data-timelines-current]')].map(row => ({ id: row.dataset.timelinesCurrent, premium: Number(row.dataset.premium), cumulative: Number(row.dataset.cumulative), covered: row.dataset.covered, values: [...row.querySelectorAll('dd')].map(node => node.textContent), box: rect(row) })),
        renewalStatus: element.querySelector('[data-timelines-renewal-status]').dataset.timelinesRenewalStatus,
        renewalLabel: element.querySelector('[data-timelines-renewal-status] strong').textContent,
        feedback: element.querySelector('.insurance-result').textContent,
        caption: element.querySelector('.timelines-comparison figcaption').textContent,
      };
    });
    assert.equal(painted.year, frame.year);
    assert.equal(painted.tracks.length, 5, 'A/B payment and coverage plus one renewal lane are all required');
    const common = painted.tracks[0].box;
    for (const track of painted.tracks) {
      assert(track.width > 100 && track.height >= 25, 'A shared time lane became unreadable');
      assert(Math.abs(track.box.left - common.left) <= 1 && Math.abs(track.box.width - common.width) <= 1, 'Payment, coverage and renewal do not share the same painted time scale');
      assert.deepEqual([track.marker.year, track.marker.position], [frame.year, frame.position]);
      assert(Math.abs(track.marker.box.left - track.box.left - frame.position * track.width) <= 1, 'Observation cursor is not painted at the exact model year');
      assert.equal(track.marker.border, 'solid');
      if (track.contract) {
        const contract = model.contracts.find(item => item.id === track.contract);
        if (track.kind === 'payment') {
          assert.equal(track.payments.length, contract.payments.length, 'Payment marks must not add premiums after stopping or at year10');
          track.payments.forEach((mark, index) => {
            const expected = contract.payments[index];
            assert.deepEqual([mark.year, mark.amount, mark.position, mark.heightFraction], [expected.year, expected.amount, expected.position, expected.heightFraction]);
            assert.equal(mark.paid, String(expected.year <= frame.year));
            assert(Math.abs(mark.box.left - track.box.left - expected.position * track.width) <= 1, 'Premium mark is at the wrong exact payment instant');
            assert(Math.abs(mark.box.height - expected.heightFraction * track.height) <= 1, 'Premium height does not use the common fixed24만원 scale');
            assert(Math.abs(mark.box.bottom - (track.box.top + track.top + track.height)) <= 1, 'Premium bars do not share the zero baseline');
            assert(mark.point.width >= 4 && mark.point.height >= 4 && mark.box.width >= 7, 'Exact payment marker or bar became unreadable');
            assert.equal(mark.paint.opacity, expected.year <= frame.year ? 1 : .4, 'Future planned payments are not distinguished from observed payments');
            assert.equal(mark.paint.image === 'none', contract.id === 'fixed', 'Renewing premiums need a non-color pattern distinct from A');
            assert(track.label.includes(`${expected.year}년 시작에 ${won(expected.amount)}`), 'Payment accessible description omits a model premium');
          });
        } else {
          const coverage = track.coverage;
          assert(coverage);
          assert.deepEqual([coverage.start, coverage.end, coverage.fraction], [contract.coverage.start, contract.coverage.end, contract.coverage.fraction]);
          assert(Math.abs(coverage.box.left - track.box.left) <= 1 && Math.abs(coverage.box.width - contract.coverage.fraction * track.width) <= 1, 'Painted coverage end differs from the exact contract boundary');
          assert.equal(coverage.endpoints.length, 2);
          for (const endpoint of coverage.endpoints) assert(endpoint.box.width >= 9 && endpoint.box.height >= 9 && endpoint.border === 'solid', 'Included/excluded endpoint shape is unreadable');
          assert.notEqual(coverage.endpoints[0].background, coverage.endpoints[1].background, 'Included start and excluded end lost their solid/open distinction');
          assert(track.label.includes(`0년 포함, ${contract.coverage.end}년 미만`));
        }
      }
    }
    const renewalTrack = painted.tracks.find(track => track.kind === 'renewal');
    assert.equal(painted.periods.length, model.periods.length);
    painted.periods.forEach((period, index) => {
      const expected = model.periods[index];
      assert.deepEqual([period.index, period.active, period.position, period.fraction], [expected.index, String(expected.active), expected.position, expected.fraction]);
      assert(Math.abs(period.box.left - renewalTrack.box.left - expected.position * renewalTrack.width) <= 1 && Math.abs(period.box.width - expected.fraction * renewalTrack.width) <= 1, 'Renewal interval geometry differs from the shared year axis');
      assert.equal(period.paint.border, expected.active ? 'solid' : 'dashed', 'A stopped planned renewal must not look like active coverage');
      assert.equal(period.paint.image === 'none', expected.active);
    });
    assert.equal(painted.renewals.length, model.renewals.length);
    painted.renewals.forEach((mark, index) => {
      const expected = model.renewals[index];
      assert.deepEqual([mark.year, mark.state, mark.position, mark.symbol], [expected.year, expected.state, expected.position, expected.state === 'stopped' ? '×' : '◇']);
      assert(Math.abs(mark.box.left + mark.box.width / 2 - renewalTrack.box.left - expected.position * renewalTrack.width) <= 1, 'Renewal symbol is not centered on its actual boundary');
      assert(mark.font >= 24);
    });
    assert.equal(painted.axes.length, painted.tracks.length);
    painted.axes.forEach(axis => {
      assert.deepEqual(axis.labels.map(label => label.text), model.axis.ticks.map(tick => String(tick.year)));
      for (const label of axis.labels) {
        assert(label.font >= 11 && label.box.left >= axis.box.left - 1 && label.box.right <= axis.box.right + 1, 'Year labels spill beyond the readable axis');
        assert(Number.isFinite(label.lineHeight) && label.box.height <= label.lineHeight + 1, `Numeric year tick ${label.text} wraps into multiple lines`);
      }
    });
    assert.equal(painted.current.length, model.contracts.length);
    painted.current.forEach((row, index) => {
      const expected = frame[model.contracts[index].id];
      assert.deepEqual([row.id, row.premium, row.cumulative, row.covered], [expected.id, expected.premium, expected.cumulativePremium, String(expected.covered)]);
      assert.deepEqual(row.values, [won(expected.premium), won(expected.cumulativePremium), expected.paymentStatus, expected.covered ? '✓ 기간 안' : '× 기간 밖']);
    });
    if (page.viewportSize().width <= 650) assert(painted.current[1].box.top >= painted.current[0].box.bottom, 'Mobile A/B summaries must stack without shrinking labels');
    assert.deepEqual([painted.renewalStatus, painted.renewalLabel], [frame.renewal.state, frame.renewal.label]);
    if (frame.year < 5) assert(!painted.feedback.startsWith('예측과'), 'A year5 prediction was revealed before its observation');
    assert.match(painted.caption, /0–12년/); assert.match(painted.caption, /0–24만원/); assert.match(painted.caption, /막대 폭/);
    assert.equal(frame.fixed.cumulativePremium, Math.min(frame.year + 1, 5) * 100000);
    if (frame.year === 5) assert(frame.fixed.premium === 0 && frame.fixed.covered, 'Payment end was confused with coverage end');
    if (frame.year >= 10) assert(!frame.fixed.covered && !frame.renewing.covered && frame.fixed.premium === 0 && frame.renewing.premium === 0);
  };
  return { projectTimelines, timelinesDefaults, inspect, cells, outcome: model => model.comparison.answer };
}
async function surrenderVerifier(page, lab) {
  const { projectSurrender } = await import('../src/simulations/insurance/surrender.mjs');
  const won = value => `${(value / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}만원`;
  const percent = value => `${(value * 100).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}%`;
  const cells = (model, frame = model.frames.at(-1)) => [
    ...model.frames.map(row => [`${row.exitYear}년 · ${row.kind === 'surrender' ? '해지' : '만기'}`, won(row.timeline[row.exitYear].paidPremium), won(row.cumulativePremium), row.surrenderValue === null ? '해당 없음' : won(row.surrenderValue), row.maturityValue === null ? '해당 없음' : won(row.maturityValue), percent(row.returnRatio)]),
    ...frame.timeline.map(row => [`${row.year}년 이상 ${row.endYear}년 미만`, won(row.paidPremium), row.coverageStatus === 'covered' ? '구간 안 · 다른 조건도 확인' : row.coverageStatus === 'canceled' ? '해지 뒤 · 보장 없음' : '원래 기간 밖', row.exitHere ? `${frame.kind === 'surrender' ? '해지' : '만기'} · ${won(row.cashAtExit)}` : '—']),
  ];
  const inspect = async (frame, model) => {
    await assertFrameSelection(lab, frame);
    assert.equal(await lab.getAttribute('data-surrender-year'), String(frame.exitYear));
    assert.equal(await lab.getAttribute('data-surrender-kind'), frame.kind);
    for (const [name, value, label] of [['premium', frame.cumulativePremium, won(frame.cumulativePremium)], ['return', frame.exitValue, won(frame.exitValue)], ['difference', frame.difference, won(frame.difference)], ['ratio', frame.returnRatio, percent(frame.returnRatio)]]) {
      const element = lab.locator(`[data-surrender-${name}]`);
      assert.equal(await element.getAttribute('data-value'), String(value));
      assert.equal(await element.innerText(), label, 'Money label differs from its observation frame');
    }
    assert.equal(await lab.locator('[data-surrender-return]').getAttribute('data-kind'), frame.kind);
    await assertBars(lab.locator('.surrender-money-track'), [[frame.paidFraction], [frame.exitFraction, frame.differenceFraction]], 'Paid premiums and returned money use the same fixed50만원 scale', '[data-surrender-bar]');
    await assertBars(lab.locator('[data-surrender-coverage]'), [frame.coverageSegments.map(segment => segment.fraction)], 'Covered/canceled/outside exactly partition one12year interval', '[data-surrender-coverage-segment]');
    const painted = await lab.evaluate(element => {
      const rect = node => node.getBoundingClientRect().toJSON();
      const paint = (node, pseudo) => { const style = getComputedStyle(node, pseudo); return { color: style.backgroundColor, image: style.backgroundImage, size: style.backgroundSize }; };
      const coverage = element.querySelector('[data-surrender-coverage]'), payments = element.querySelector('.surrender-payment-track'), money = element.querySelector('.surrender-money');
      return {
        year: Number(element.querySelector('input[type=range]').value),
        moneyTracks: [...money.querySelectorAll('.surrender-money-track')].map(node => ({ box: rect(node), label: node.getAttribute('aria-label') })),
        moneyAxis: [...money.querySelectorAll('.surrender-money-axis span')].map(node => node.textContent),
        paid: [...money.querySelectorAll('.surrender-paid > i')].map(node => ({ title: node.title, box: rect(node) })),
        returned: { paint: paint(money.querySelector('.surrender-return')), label: money.querySelector('[data-surrender-return]').previousElementSibling.textContent },
        gapBorder: getComputedStyle(money.querySelector('.surrender-difference')).borderTopStyle,
        caption: money.querySelector('figcaption').textContent,
        coverage: rect(coverage), coverageEnd: Number(coverage.dataset.end), coverageLabel: coverage.getAttribute('aria-label'),
        baseline: (() => { const track = element.querySelector('.surrender-time-track'); return { box: rect(track), covered: rect(track.querySelector('.covered')), outside: rect(track.querySelector('.outside')) }; })(),
        cut: rect(element.querySelector('.surrender-cut')),
        segments: [...coverage.querySelectorAll('[data-surrender-coverage-segment]')].map(node => ({ id: node.dataset.surrenderCoverageSegment, start: Number(node.dataset.start), end: Number(node.dataset.end), fraction: Number(node.dataset.fraction), paint: paint(node), legend: paint(element.querySelector(`.surrender-legend .${node.dataset.surrenderCoverageSegment}`), '::before') })),
        paymentTrack: rect(payments), payments: [...payments.querySelectorAll('[data-surrender-payment]')].map(node => ({ year: Number(node.dataset.surrenderPayment), paid: node.dataset.paid, symbol: node.textContent, box: rect(node), font: parseFloat(getComputedStyle(node).fontSize) })),
        timeAxis: [...element.querySelectorAll('.surrender-time-axis span')].map(node => ({ label: node.textContent, box: rect(node), font: parseFloat(getComputedStyle(node).fontSize), lineHeight: parseFloat(getComputedStyle(node).lineHeight) })),
        coverageCaption: element.querySelector('.surrender-coverage figcaption').textContent,
      };
    });
    assert.equal(painted.year, frame.exitYear);
    assert.deepEqual(painted.moneyAxis, ['0원', won(model.moneyScale / 2), won(model.moneyScale)]);
    assert(Math.abs(painted.moneyTracks[0].box.width - painted.moneyTracks[1].box.width) <= 1, 'Premium and return bars use different money scales');
    assert(painted.moneyTracks.every(track => track.box.height >= 35));
    assert(painted.moneyTracks[0].label.includes(`누적보험료 ${won(frame.cumulativePremium)}, 10만원씩 ${frame.paymentCount}회`));
    assert.equal(painted.paid.length, frame.paymentCount, 'Premium blocks do not equal actual payments before this exit');
    painted.paid.forEach((paid, index) => {
      assert.equal(paid.title, `${frame.paymentEvents[index].year}년 납입 ${won(frame.paymentEvents[index].amount)}`);
      assert(Math.abs(paid.box.width - painted.moneyTracks[0].box.width / 5) <= 1, 'One payment block is not exactly10만원 on the common50만원 scale');
    });
    assert.equal(painted.returned.label, frame.kind === 'surrender' ? '그날의 해약환급금' : '별도 만기보험금');
    assert.equal(painted.returned.paint.image === 'none', frame.kind === 'maturity', 'Maturity must not reuse the patterned surrender-quote meaning');
    assert.equal(painted.gapBorder, 'dashed', 'Difference is an unfilled comparison, not another cash receipt');
    assert.match(painted.caption, /위약금이나 회사 이익/); assert.match(painted.caption, /수익률이 아닙니다/);
    assert.deepEqual(painted.segments.map(segment => [segment.id, segment.start, segment.end, segment.fraction]), frame.coverageSegments.map(segment => [segment.id, segment.start, segment.end, segment.fraction]));
    for (const segment of painted.segments) assert.deepEqual(segment.paint, segment.legend, 'Coverage paint differs from its semantic legend');
    assert.equal(new Set(painted.segments.map(segment => JSON.stringify(segment.paint))).size, 3);
    assert.equal(painted.segments[0].paint.image, 'none');
    assert(painted.segments.slice(1).every(segment => segment.paint.image !== 'none'), 'Canceled and naturally outside coverage need non-color distinctions');
    for (const track of [painted.baseline.box, painted.paymentTrack]) assert(Math.abs(track.left - painted.coverage.left) <= 1 && Math.abs(track.width - painted.coverage.width) <= 1, 'Money exit and coverage tracks lost their common time scale');
    assert(Math.abs(painted.baseline.covered.width - painted.baseline.box.width * model.scheduledCoverageEnd / model.observationEnd) <= 1, 'No-exit reference coverage changed with the selected surrender');
    assert(Math.abs(painted.cut.left - painted.coverage.left - frame.exitTimeFraction * painted.coverage.width) <= 1, 'Exit line is painted at the wrong year');
    assert.equal(painted.coverageEnd, frame.coverageEnd);
    assert(painted.coverageLabel.includes(`${frame.exitYear}년 ${frame.kind === 'surrender' ? '해지' : '만기'} 이후 새 사건 보장 없음`));
    assert.equal(painted.payments.length, frame.paymentEvents.length);
    painted.payments.forEach((mark, index) => {
      const expected = frame.paymentEvents[index];
      assert.deepEqual([mark.year, mark.paid, mark.symbol], [expected.year, String(expected.paid), expected.paid ? '●' : '×']);
      const anchor = mark.year === 0 ? mark.box.left : mark.box.left + mark.box.width / 2;
      assert(Math.abs(anchor - painted.paymentTrack.left - expected.timeFraction * painted.paymentTrack.width) <= 1, 'Paid/skipped marker moved away from its scheduled exact year');
      assert(mark.font >= 16);
    });
    assert.deepEqual(painted.timeAxis.map(tick => tick.label), ['0년', '2년', '4년', '6년', '8년', '10년', '12년']);
    for (const tick of painted.timeAxis) {
      assert(tick.font >= 10 && tick.box.left >= painted.coverage.left - 1 && tick.box.right <= painted.coverage.right + 1);
      assert(Number.isFinite(tick.lineHeight) && tick.box.height <= tick.lineHeight + 1, `Numeric year tick ${tick.label} wraps into multiple lines`);
    }
    assert.match(painted.coverageCaption, /해지 전 사건/); assert.match(painted.coverageCaption, /먼저 낸 다음 해지/);
    assert.equal(frame.cumulativePremium, frame.exitValue + frame.difference, 'Returned money was subtracted twice or added to premiums');
    if (frame.exitYear === 0) assert(frame.cumulativePremium === 100000 && frame.exitValue === 0 && frame.coverageSegments[0].fraction === 0, 'Year0 must keep the first premium while removing all later new-event coverage');
    if (frame.exitYear === 10) assert(frame.kind === 'maturity' && frame.surrenderValue === null && frame.maturityValue === 0 && frame.coverageSegments[1].fraction === 0, 'Maturity incorrectly extrapolates the surrender schedule');
  };
  return { projectSurrender, inspect, cells, outcome: model => model.frames.at(-1).comparison };
}

// E reuses the same source frames for cash, receipt, historical shortfall and
// the mobile alternative. Reading a declared width alone cannot certify paint.
async function claimsVerifier(page, lab) {
  const { projectClaims, claimsDefaults, claimsScenarios } = await import('../src/simulations/insurance/claims.mjs');
  const won = value => `${(value / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}만원`;
  const cells = model => [
    ...model.frames.map(row => [`${row.day}일${row.dueToday ? ' · 납기' : ''}`, won(row.receipt), won(row.paidToday), won(row.availableCash), won(row.unfunded), row.shortfallAtDue === null ? '납기 전' : won(row.shortfallAtDue)]),
    ...model.final.process.map(row => [row.label, row.day === null ? '없음' : `${row.day}일`, row.detail]),
    ...model.final.branch.map(row => [row.label, row.enabled ? `${row.day}일` : '이 사례는 생략', '필요한 경우만 거치는 분기']),
  ];
  const inspect = async (frame, model) => {
    assert.equal(await lab.getAttribute('data-claims-day'), String(frame.day));
    assert.equal(await lab.getAttribute('data-claims-scenario'), model.params.scenario);
    assert.equal(await lab.getByRole('slider', { name: '관찰할 날짜', exact: true }).inputValue(), String(frame.day));
    for (const [key, value, label] of [
      ['cash', frame.availableCash, won(frame.availableCash)], ['unfunded', frame.unfunded, `미충당 ${won(frame.unfunded)}`],
      ['history', frame.shortfallAtDue, frame.shortfallAtDue === null ? '아직 납기 전' : won(frame.shortfallAtDue)],
      ['received', frame.receivedToDate, won(frame.receivedToDate)], ['paid', frame.paidToDate, won(frame.paidToDate)],
      ['confirmed', frame.confirmedAmount, frame.confirmedAmount === null ? '아직 결정 전' : won(frame.confirmedAmount)],
    ]) {
      const node = lab.locator(`[data-claims-value="${key}"]`);
      assert.equal(await node.getAttribute('data-value'), value === null ? 'pending' : String(value), `${key}: model value changed`);
      assert.equal(await node.innerText(), label, `${key}: visible value differs from the current day`);
    }
    const painted = await lab.evaluate(element => {
      const rect = node => node.getBoundingClientRect().toJSON();
      const style = node => { const s = getComputedStyle(node); return { background: s.backgroundColor, image: s.backgroundImage, border: s.borderTopStyle, outline: s.outlineStyle, fill: s.fill, stroke: s.stroke, dash: s.strokeDasharray, strokeWidth: parseFloat(s.strokeWidth) }; };
      const svg = element.querySelector('.claims-chart-svg'), svgVisible = svg.getClientRects().length > 0;
      return {
        tracks: [...element.querySelectorAll('.claims-money-track')].map(track => ({ box: rect(track), parts: [...track.children].map(node => ({ id: node.dataset.claimsBar, fraction: +node.dataset.fraction, start: +(node.dataset.startFraction || 0), amount: node.hasAttribute('data-value') ? +node.dataset.value : null, box: rect(node), style: style(node) })) })),
        axes: [...element.querySelectorAll('.claims-money-axis span')].map(node => node.textContent),
        process: [...element.querySelectorAll('[data-claims-process]')].map(node => ({ id: node.dataset.claimsProcess, status: node.dataset.status, label: node.querySelector('strong').textContent, box: rect(node), border: getComputedStyle(node.querySelector('.claims-process-node')).borderTopStyle, arrow: getComputedStyle(node, '::after').content })),
        branch: { enabled: element.querySelector('[data-claims-branch]').dataset.enabled, rows: [...element.querySelectorAll('[data-claims-branch-stage]')].map(node => ({ id: node.dataset.claimsBranchStage, status: node.dataset.status, text: node.textContent })) },
        timeline: [...element.querySelectorAll('.claims-time-track')].map(track => ({ box: rect(track), cursor: rect(track.querySelector('.claims-now')), events: [...track.querySelectorAll('[data-claims-event]')].map(node => ({ id: node.dataset.claimsEvent, day: +node.dataset.day, fraction: +node.dataset.fraction, box: rect(node), reached: node.classList.contains('reached'), label: node.querySelector('b').textContent })) })),
        timeLabels: [...element.querySelectorAll('.claims-time-axis span')].map(node => ({ label: node.textContent, box: rect(node), font: parseFloat(getComputedStyle(node).fontSize), lineHeight: parseFloat(getComputedStyle(node).lineHeight) })),
        mobileEvents: { visible: element.querySelector('.claims-mobile-events').getClientRects().length > 0, rows: [...element.querySelectorAll('.claims-mobile-events li')].map(node => ({ id: node.className, day: node.querySelector('strong').textContent, label: node.querySelector('span').textContent, status: node.querySelector('small').textContent, box: rect(node) })) },
        mobileCheckpoints: { visible: element.querySelector('.claims-mobile-checkpoints').getClientRects().length > 0, rows: [...element.querySelectorAll('.claims-mobile-checkpoints>div')].map(node => ({ cells: [...node.children].map(cell => cell.textContent), box: rect(node) })) },
        svg: { visible: svgVisible, viewBox: svg.getAttribute('viewBox'), box: rect(svg), paths: [...svg.querySelectorAll('[data-claims-path]')].map(node => ({ id: node.dataset.claimsPath, d: node.getAttribute('d'), style: style(node), bounds: svgVisible ? (() => { const b = node.getBBox(); return { x: b.x, y: b.y, width: b.width, height: b.height }; })() : null })),
          matrix: svgVisible ? (() => { const m = svg.getScreenCTM(); return { a: m.a, b: m.b, c: m.c, d: m.d, e: m.e, f: m.f }; })() : null,
          dots: svgVisible ? [...svg.querySelectorAll('circle')].map(node => ({ id: node.getAttribute('class'), x: +node.getAttribute('cx'), y: +node.getAttribute('cy'), box: rect(node) })) : [],
          labels: [...svg.querySelectorAll('text')].map(node => ({ text: node.textContent, font: parseFloat(getComputedStyle(node).fontSize) })),
          cursor: { x1: +svg.querySelector('.cursor').getAttribute('x1'), x2: +svg.querySelector('.cursor').getAttribute('x2') } },
      };
    });
    assert.deepEqual(painted.axes, ['0원', won(model.moneyScale / 2), won(model.moneyScale)]);
    assert.equal(painted.tracks.length, 3);
    const expectedTracks = [[{ id: 'cash', fraction: frame.cashFraction, startFraction: 0 }], frame.dueSegments, [{ id: 'history', fraction: frame.historyFraction, startFraction: 0 }]];
    painted.tracks.forEach((track, index) => {
      assert(track.box.width > 0 && track.box.height >= 30, 'Cash comparison became unreadable');
      assert(Math.abs(track.box.width - painted.tracks[0].box.width) <= 1, 'Cash, expense and historical shortfall need the same painted scale');
      assert.equal(track.parts.length, expectedTracks[index].length);
      track.parts.forEach((part, partIndex) => {
        const expected = expectedTracks[index][partIndex];
        assert.deepEqual([part.id, part.fraction, part.start], [expected.id, expected.fraction, expected.startFraction]);
        if (index === 1) assert.equal(part.amount, expected.amount);
        assert(Math.abs(part.box.width - expected.fraction * track.box.width) <= 1, `Cash ${part.id} painted width differs from the model, including zero`);
        assert(Math.abs(part.box.left - track.box.left - expected.startFraction * track.box.width) <= 1, `Cash ${part.id} moved away from the model offset`);
      });
    });
    assert.notEqual(painted.tracks[1].parts[1].style.image, 'none', 'Unfunded expense must retain its patterned distinction');
    assert.notEqual(painted.tracks[1].parts[2].style.image, 'none', 'Not-yet-due expense must not look paid');
    const historyStyle = painted.tracks[2].parts[0].style;
    if (frame.historyFraction > 0) assert(historyStyle.border === 'dashed' || historyStyle.outline === 'dashed', 'Historical shortfall requires a non-color boundary');
    assert.deepEqual(painted.process.map(row => [row.id, row.status, row.label]), frame.process.map(row => [row.id, row.status, row.label]));
    for (const row of painted.process.filter(row => ['future', 'unavailable'].includes(row.status))) assert.equal(row.border, 'dashed', 'Pending/unavailable process stages lost their distinct boundary');
    assert.equal(painted.branch.enabled, String(model.scenario.branch));
    assert.deepEqual(painted.branch.rows.map(row => [row.id, row.status, row.text]), frame.branch.map(row => [row.id, row.status, `${row.label}${row.enabled ? ` · ${row.day}일` : ' · 이 사례는 생략'}`]));
    if (page.viewportSize().width <= 650) {
      assert(!painted.svg.visible && painted.mobileEvents.visible && painted.mobileCheckpoints.visible, 'Mobile must reflow the timeline rather than shrink SVG labels');
      painted.process.slice(1).forEach((row, index) => assert(row.box.top >= painted.process[index].box.bottom, 'Mobile claims process must read down the page'));
      for (const row of painted.process.slice(0, -1)) assert(row.arrow.includes('↓'), 'Mobile process arrow still points sideways');
    } else {
      assert(painted.svg.visible && !painted.mobileEvents.visible && !painted.mobileCheckpoints.visible);
      const events = painted.timeline.flatMap(track => track.events);
      assert.deepEqual(events.map(event => [event.id, event.day, event.fraction, event.reached, event.label]), [...model.events].sort((a, b) => ['event', 'process', 'expense', 'cash'].indexOf(a.lane) - ['event', 'process', 'expense', 'cash'].indexOf(b.lane)).map(event => [event.id, event.day, event.fraction, event.day <= frame.day, event.label]));
      for (const track of painted.timeline) {
        assert(Math.abs(track.cursor.left - track.box.left - frame.timeFraction * track.box.width) <= 1, 'Date cursor differs from the current model day');
        for (const event of track.events) {
          const anchor = event.id === 'incident' ? event.box.left : event.box.left + event.box.width / 2;
          assert(Math.abs(anchor - track.box.left - event.fraction * track.box.width) <= 1, 'Timeline event moved away from its actual date');
        }
      }
      assert.deepEqual(painted.timeLabels.map(label => label.label), model.chart.xTicks.map(tick => `${tick.day}일`));
      for (const label of painted.timeLabels) assert(label.font >= 11 && Number.isFinite(label.lineHeight) && label.box.height <= label.lineHeight + 1, 'Numeric day ticks must remain readable and on one line');
    }
    const eventRank = id => id === 'receipt' ? 0 : id === 'due' ? 1 : 0;
    const sortedEvents = [...model.events].sort((a, b) => a.day - b.day || eventRank(a.id) - eventRank(b.id));
    assert.deepEqual(painted.mobileEvents.rows.map(row => [row.id, row.day, row.label, row.status]), sortedEvents.map(event => [event.id, `${event.day}일`, event.label, event.day <= frame.day ? '도달' : '예정']), 'Mobile dates must preserve receipt-before-due on the same day');
    const checkpoints = model.checkpoints.filter(row => row.dueToday || row.receipt > 0 || row.day === model.observationEnd);
    assert.deepEqual(painted.mobileCheckpoints.rows.map(row => row.cells), checkpoints.map(row => [`${row.day}일${row.dueToday ? ' · 납기' : row.receipt > 0 ? ' · 입금' : ' · 관찰 끝'}`, `현금 ${won(row.availableCash)}`, `미충당 ${won(row.unfunded)}`, `납기 부족 기록 ${row.shortfallAtDue === null ? '납기 전' : won(row.shortfallAtDue)}`]));
    assert.equal(painted.svg.viewBox, model.chart.viewBox);
    assert.deepEqual(painted.svg.paths.map(row => [row.id, row.d]), [['unfunded', model.chart.unfundedPath], ['cash', model.chart.cashPath], ['history', model.chart.historyPath]]);
    for (const path of painted.svg.paths) assert.equal(path.style.fill, 'none', 'A step line accidentally acquired a filled closed area');
    assert.equal(painted.svg.paths[0].style.dash, 'none');
    assert.notEqual(painted.svg.paths[2].style.dash, 'none');
    assert(painted.svg.paths[2].style.strokeWidth < painted.svg.paths[0].style.strokeWidth, 'Overlapping history/current lines must both remain visible');
    assert.equal(new Set(painted.svg.paths.map(row => row.style.stroke)).size, 3);
    assert.deepEqual([painted.svg.cursor.x1, painted.svg.cursor.x2], [frame.cashPoint.x, frame.cashPoint.x]);
    if (painted.svg.visible) {
      const matrix = painted.svg.matrix;
      assert(matrix.a > 0 && matrix.d > 0 && matrix.b === 0 && matrix.c === 0, 'Chart uses an unexplained skew or reflection');
      for (const label of painted.svg.labels) assert(label.font * matrix.a >= 11, `Chart label ${label.text} is shrunk below11px`);
      for (const path of painted.svg.paths) {
        const key = path.id === 'history' ? 'historyPoint' : `${path.id}Point`, points = model.frames.map(row => row[key]).filter(Boolean);
        const xs = points.map(point => point.x), ys = points.map(point => point.y);
        for (const [key, value] of Object.entries({ x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) })) assert(Math.abs(path.bounds[key] - value) <= .02, 'SVG path bounds differ from the model step geometry');
      }
      for (const dot of painted.svg.dots) {
        const expected = dot.id === 'cash' ? frame.cashPoint : frame.unfundedPoint;
        assert.deepEqual([dot.x, dot.y], [expected.x, expected.y]);
        assert(Math.abs(dot.box.left + dot.box.width / 2 - (matrix.a * expected.x + matrix.e)) <= 1 && Math.abs(dot.box.top + dot.box.height / 2 - (matrix.d * expected.y + matrix.f)) <= 1, 'Painted current-day dot differs from the model coordinates');
      }
    }
    assert.equal(frame.availableCash + frame.paidToDate, model.params.startingCash + frame.receivedToDate, 'Receipt or cash settlement was double-counted');
    assert.equal(frame.paidToDate + frame.unfunded + frame.notYetDue, model.assumptions.expense);
    if (frame.day < model.scenario.decisionDay) assert.equal(frame.confirmedAmount, null);
    if (model.scenario.arrivalDay === null || frame.day < model.scenario.arrivalDay) assert.equal(frame.receivedToDate, 0, 'Entitlement/decision was treated as arrived cash');
    if (frame.day >= model.assumptions.dueDay) assert.equal(frame.shortfallAtDue, model.due.shortfallAtDue, 'Later receipt erased the historical due-day shortfall');
    assert.equal(await lab.locator('[data-static-claims][data-selected="true"]').count(), 1);
  };
  return { projectClaims, claimsDefaults, claimsScenarios, inspect, cells, outcome: model => model.prediction };
}

async function readingInsuranceVerifier(page, lab) {
  const { projectReading, readingDefaults, readingBoundaryCases, readingStatements, readingClassifications } = await import('../src/simulations/insurance/reading.mjs');
  const won = value => `${(value / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}만원`;
  const amount = value => value === null ? '미정' : won(value);
  const cells = model => [
    ...model.contracts.map(contract => [contract.name, model.params.eventDay === null ? '미확인' : `${model.params.eventDay}일`, contract.statusLabel, amount(contract.conditionalAmount), '미정', '미정']),
    ...model.assessments.map(row => [String(row.number), row.text, row.classificationLabel, row.clauseIds.join(' · '), row.why]),
    ...readingBoundaryCases().map(row => [`${row.params.eventDay}일`, ...row.contracts.map(contract => amount(contract.conditionalAmount)), '미정']),
    ...model.frames.map(row => [row.label, row.detail]),
  ];
  const inspect = async (frame, model) => {
    await assertFrameSelection(lab, frame);
    assert.equal(await lab.locator('[data-reading-event-day]').innerText(), model.params.eventDay === null ? '미확인 · 표식 없음' : `${model.params.eventDay}일`);
    const painted = await lab.evaluate(element => {
      const rect = node => node.getBoundingClientRect().toJSON();
      const paint = node => { const style = getComputedStyle(node); return { color: style.backgroundColor, image: style.backgroundImage, size: style.backgroundSize, left: style.borderLeftStyle, top: style.borderTopStyle, rightWidth: parseFloat(style.borderRightWidth) }; };
      return {
        branches: [...element.querySelectorAll('[data-reading-contract]')].map(branch => {
          const track = branch.querySelector('[data-reading-loss-track]'), fixed = branch.querySelector('[data-reading-fixed]'), unknown = branch.querySelector('[data-reading-unknown]');
          return { id: branch.dataset.readingContract, status: branch.dataset.readingStatus, box: rect(branch),
            amount: { value: branch.querySelector('[data-reading-conditional]').dataset.value, text: branch.querySelector('[data-reading-conditional]').textContent },
            track: track ? { box: rect(track), loss: +track.dataset.loss, label: track.getAttribute('aria-label'), question: track.querySelector('.reading-track-question')?.textContent || null,
              segments: [...track.querySelectorAll('[data-reading-segment]')].map(node => ({ id: node.dataset.readingSegment, value: +node.dataset.value, fraction: +node.dataset.fraction, left: +node.dataset.leftFraction, box: rect(node), paint: paint(node), legend: paint(branch.querySelector(`.reading-segment-key .reading-segment-${node.dataset.readingSegment}`)) })) } : null,
            fixed: fixed ? { box: rect(fixed), value: fixed.dataset.value, status: fixed.dataset.state, text: fixed.querySelector('strong').textContent, paint: paint(fixed), insideLoss: !!fixed.closest('[data-reading-loss-track]'), symbol: fixed.querySelector('.reading-fixed-symbol').textContent } : null,
            links: [...branch.querySelectorAll('.reading-relation')].map(node => ({ kind: node.dataset.readingLink, text: node.querySelector('span').textContent, paint: paint(node.querySelector('i')), box: rect(node.querySelector('i')) })),
            unknown: { state: unknown.dataset.state, paint: paint(unknown), symbol: unknown.querySelector('.reading-open-symbol').textContent, facts: [...unknown.querySelectorAll('b')].map(node => node.textContent) },
            questions: [...branch.querySelectorAll('.reading-questions li')].map(node => node.textContent),
          };
        }),
        timeline: [...element.querySelectorAll('[data-reading-time-track]')].map(track => {
          const window = track.querySelector('[data-reading-window]'), after = track.querySelector('[data-reading-renewal-unknown]'), marker = track.querySelector('[data-reading-event-marker]');
          return { id: track.dataset.readingTimeTrack, box: rect(track), window: { fraction: +window.dataset.fraction, left: +window.dataset.leftFraction, box: rect(window) },
            after: after ? { fraction: +after.dataset.fraction, box: rect(after), paint: paint(after), symbol: after.textContent } : null,
            marker: marker ? { day: +marker.dataset.day, fraction: +marker.dataset.fraction, box: rect(marker), symbol: marker.textContent } : null };
        }),
        statements: [...element.querySelectorAll('[data-reading-statement]')].map(node => { const evidence = node.querySelector('[data-reading-evidence]'); return { id: node.dataset.readingStatement, revealed: node.dataset.revealed, classification: node.dataset.classification, choice: node.querySelector('select').value,
          evidence: evidence ? { label: evidence.querySelector('strong').textContent, feedback: evidence.querySelector('p').textContent, clauses: [...evidence.querySelectorAll('li')].map(row => row.textContent), paint: paint(evidence) } : null }; }),
        caption: element.querySelector('.reading-map figcaption').textContent,
      };
    });
    assert.equal(painted.branches.length, 3);
    const lossTracks = painted.branches.filter(branch => branch.track).map(branch => branch.track);
    assert.equal(lossTracks.length, 2, 'Fixed benefit must not become a third loss partition');
    assert(Math.abs(lossTracks[0].box.width - lossTracks[1].box.width) <= 1, 'A/C standalone calculations must use the same painted loss scale');
    for (const [index, branch] of painted.branches.entries()) {
      const contract = model.contracts[index];
      assert.deepEqual([branch.id, branch.status, branch.amount.value, branch.amount.text], [contract.id, contract.status, contract.conditionalAmount === null ? 'unresolved' : String(contract.conditionalAmount), amount(contract.conditionalAmount)]);
      assert.deepEqual([branch.unknown.state, branch.unknown.symbol, branch.unknown.facts], ['unknown', '?', ['미정', '미정']], 'Missing clauses must not silently become actual approval, receipt or denial0');
      assert.equal(branch.unknown.paint.top, 'dashed'); assert.equal(branch.unknown.paint.rightWidth, 0, 'Unknown conditions must retain an open boundary');
      assert.deepEqual(branch.questions, contract.questions);
      assert.deepEqual(branch.links.map(link => [link.kind, link.text]), contract.links.filter(link => link.kind !== 'unresolved').map(link => [link.kind, link.label]));
      assert.deepEqual(branch.links.map(link => link.paint.left), ['solid', 'dashed'], 'Documented promises and assumed conditions became visually identical');
      for (const link of branch.links) assert(link.box.height >= 15, 'A relationship lost its visible connector');
      if (contract.structure === 'indemnity') {
        assert(branch.track && !branch.fixed);
        assert.equal(branch.track.loss, model.params.loss);
        assert(branch.track.box.width > 0 && branch.track.box.height >= 30);
        assert.equal(branch.track.segments.length, contract.segments.length);
        let sum = 0;
        branch.track.segments.forEach((part, partIndex) => {
          const expected = contract.segments[partIndex];
          assert.deepEqual([part.id, part.value, part.fraction, part.left], [expected.id, expected.amount, expected.fraction, expected.leftFraction]);
          assert(Math.abs(part.box.width - part.fraction * branch.track.box.width) <= 1, 'Reading coverage paint does not match the modeled loss fraction');
          assert(Math.abs(part.box.left - branch.track.box.left - part.left * branch.track.box.width) <= 1, 'Reading loss segments overlap or use an invented offset');
          for (const key of ['color', 'image', 'size']) assert.equal(part.paint[key], part.legend[key], `Reading ${part.id} paint differs from its key`);
          if (['deductible', 'limit', 'outside'].includes(part.id)) assert.notEqual(part.paint.image, 'none', 'A non-color loss distinction was removed');
          if (part.id === 'unknown') { assert.equal(part.paint.top, 'dashed'); assert.equal(part.paint.rightWidth, 0); }
          sum += part.value;
        });
        assert.equal(sum, model.params.loss, 'Each standalone row must preserve the whole loss once');
        assert.equal(branch.track.question, contract.conditionalAmount === null ? '?' : null);
        if (contract.conditionalAmount === null) assert.equal(branch.track.segments.filter(part => part.id === 'conditional').length, 0, 'Unknown condition acquired a paid area');
        assert.match(branch.track.label, /실제 지급대상액은 미정/);
      } else {
        assert(branch.fixed && !branch.track && !branch.fixed.insideLoss);
        assert.deepEqual([branch.fixed.value, branch.fixed.status, branch.fixed.text, branch.fixed.symbol], [contract.conditionalAmount === null ? 'unresolved' : String(contract.conditionalAmount), contract.status, amount(contract.conditionalAmount), '◇']);
        assert(branch.fixed.box.width >= 70 && branch.fixed.box.height >= 70, 'The separate fixed promise is unreadable');
        assert.equal(branch.fixed.paint.top, contract.conditionalAmount === null ? 'dashed' : 'solid');
      }
    }
    if (page.viewportSize().width <= 850) {
      painted.branches.slice(1).forEach((branch, index) => assert(branch.box.top >= painted.branches[index].box.bottom, 'Narrow reading map must reflow its three contracts instead of shrinking their labels'));
    } else painted.branches.slice(1).forEach((branch, index) => assert(Math.abs(branch.box.top - painted.branches[0].box.top) <= 1 && branch.box.left >= painted.branches[index].box.right, 'Desktop contract branches overlap'));
    assert.equal(painted.timeline.length, 3);
    for (const [index, track] of painted.timeline.entries()) {
      const expected = model.timeline.windows[index];
      assert.deepEqual([track.id, track.window.fraction, track.window.left], [expected.id, expected.fraction, expected.leftFraction]);
      assert(Math.abs(track.box.width - painted.timeline[0].box.width) <= 1, 'Three date windows lost their shared scale');
      assert(Math.abs(track.window.box.width - expected.fraction * track.box.width) <= 1 && Math.abs(track.window.box.left - track.box.left - expected.leftFraction * track.box.width) <= 1, 'Known date window paint differs from its model');
      assert.equal(!!track.after, !!expected.unknownAfter);
      if (expected.unknownAfter) {
        assert.equal(track.after.fraction, expected.unknownAfter.fraction);
        assert(Math.abs(track.after.box.width - expected.unknownAfter.fraction * track.box.width) <= 1 && Math.abs(track.after.box.left - track.box.left - expected.unknownAfter.leftFraction * track.box.width) <= 1, 'Unknown renewal region moved away from the180-day boundary');
        assert.equal(track.after.paint.top, 'dashed'); assert.equal(track.after.symbol, '?');
      }
      assert.equal(!!track.marker, model.timeline.eventFraction !== null, 'Unknown date must not invent a position');
      if (track.marker) {
        assert.deepEqual([track.marker.day, track.marker.fraction, track.marker.symbol], [model.params.eventDay, model.timeline.eventFraction, '◆']);
        assert(Math.abs(track.marker.box.left - track.box.left - model.timeline.eventFraction * track.box.width) <= 1, 'Assumed event date marker differs from model');
      }
    }
    assert.equal(painted.statements.length, frame.assessments.length);
    for (const [index, statement] of painted.statements.entries()) {
      const expected = frame.assessments[index];
      assert.deepEqual([statement.id, statement.revealed, statement.classification, statement.choice], [expected.id, String(expected.revealed), expected.revealed ? expected.classification : 'hidden', expected.choice]);
      assert.equal(!!statement.evidence, expected.revealed, 'Evidence was revealed at the wrong observation step');
      if (expected.revealed) {
        assert.equal(statement.evidence.label, expected.classificationLabel);
        assert.equal(statement.evidence.feedback, `${expected.feedback} ${expected.why}`);
        assert.deepEqual(statement.evidence.clauses, expected.evidence.map(row => `${row.clauseId} ${row.text}`));
        assert.equal(statement.evidence.paint.left, expected.classification === 'documented' ? 'solid' : 'dashed');
      }
    }
    assert.match(painted.caption, /동시 지급액도 계산하지 않습니다/);
    assert.match(painted.caption, /금액에 비례한 도형이 아니며/);
    assert.equal(model.scenario.actualPayable, null); assert.equal(model.scenario.received, null); assert.equal(model.scenario.combinedIndemnity, null);
  };
  return { projectReading, readingDefaults, readingStatements, readingClassifications, inspect, cells, outcome: model => model.predictionAnswer };
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
  const verify = async (scenario, model, outcome, inspectFrame, tableRows, frameIndices = model.frames.map((_, index) => index), captureScene = true) => {
    await prediction.selectOption(outcome);
    await controls.getByRole('button', { name: '처음부터', exact: true }).click();
    assert.equal(frameIndices[0], 0, 'Scenario must inspect its initial state');
    assert.equal(frameIndices.at(-1), model.frames.length - 1, 'Scenario must inspect its terminal state');
    for (let cursor = 0; cursor < frameIndices.length; cursor++) {
      const index = frameIndices[cursor], frame = model.frames[index];
      assert.equal(await controls.locator('span').innerText(), `${index} / ${model.frames.length - 1} 단계`, `${scenario}: observation index differs from model`);
      assert.equal(await lab.locator('[data-insurance-stage]').getAttribute('data-insurance-stage'), frame.phase);
      assert.equal(await lab.locator('[data-insurance-stage] > strong').innerText(), frame.label);
      await inspectFrame(frame, model);
      if (cursor < frameIndices.length - 1) {
        assert(await step.isEnabled());
        const next = frameIndices[cursor + 1];
        assert(next > index && next < model.frames.length, 'Scenario observation indices must be increasing and valid');
        if (next === index + 1) await step.click();
        else { await lab.getByRole('button', { name: model.frames[next].label, exact: true }).focus(); await page.keyboard.press('Enter'); }
      }
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
    if (captureScene) await capture(page, `${name}-${scenario}-scene`, lab);
    observed.push({ scenario, frames: model.frames.length, inspectedFrames: frameIndices, rows: actualRows.length, lastRow: actualRows.at(-1) });
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
          return { box: box.toJSON(), person: root.querySelector(`[data-contract-person="${personId}"]`).getBoundingClientRect().toJSON(), insurer: root.querySelector('[data-contract-insurer]').getBoundingClientRect().toJSON(), headAngle: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI, headLeft: pseudo.left, headRight: pseudo.right, active: element.classList.contains('active'), uncertain: element.classList.contains('unconfirmed'), lineBorder: getComputedStyle(line).borderTopStyle, lineBorderWidth: parseFloat(getComputedStyle(line).borderTopWidth), lineBackground: getComputedStyle(line).backgroundColor, lineBackgroundImage: getComputedStyle(line).backgroundImage, uncertaintyContent: getComputedStyle(line, '::before').content, uncertaintyVisible: getComputedStyle(line, '::before').visibility !== 'hidden' && getComputedStyle(line, '::before').display !== 'none' && parseFloat(getComputedStyle(line, '::before').opacity) > 0 };
        }, edge.personId);
        assert(geometry.box.width >= 24 && geometry.box.width > geometry.box.height * 4, 'Contract relationship must have a visible horizontal connector');
        assert(geometry.box.left >= geometry.person.right - 1 && geometry.box.right <= geometry.insurer.left + 1, 'Connection does not run between its person and the insurer');
        const center = (geometry.box.top + geometry.box.bottom) / 2;
        assert(center >= geometry.person.top && center <= geometry.person.bottom && center >= geometry.insurer.top && center <= geometry.insurer.bottom, 'A connector is visually attached to the wrong person row');
        assert(Math.abs(geometry.headAngle - (edge.direction === 'from-insurer' ? -135 : 45)) < .01, 'Painted arrowhead contradicts the model payment direction');
        assert.equal(parseFloat(edge.direction === 'from-insurer' ? geometry.headLeft : geometry.headRight), 0, 'Arrowhead is not anchored at the receiving end');
        assert.equal(geometry.active, edge.active);
        assert.equal(geometry.uncertain, !edge.connected);
        if (edge.kind === 'reference') {
          assert.equal(geometry.lineBorder, 'dashed', 'Coverage relation must remain dashed even when continuation is unconfirmed');
          assert(geometry.lineBorderWidth > 0, 'The dashed reference relation has no painted stroke');
        } else {
          assert.notEqual(geometry.lineBorder, 'dashed', 'Money direction must remain distinct from the dashed reference relation');
          if (edge.connected) {
            assert.equal(geometry.lineBackgroundImage, 'none', 'Confirmed money direction must be a continuous solid line');
            assert(!/rgba\([^)]*,\s*0\)/.test(geometry.lineBackground), 'Confirmed money direction has no painted stroke');
          } else assert(geometry.lineBackgroundImage.startsWith('linear-gradient(') && /rgba\([^)]*,\s*0\)/.test(geometry.lineBackgroundImage), 'Unconfirmed money direction must retain its visible break');
        }
        if (!edge.connected) {
          assert.equal(geometry.uncertaintyContent.replace(/^["']|["']$/g, ''), '?', 'Unconfirmed reference/payment connection lost its uncertainty marker');
          assert(geometry.uncertaintyVisible, 'The uncertainty marker is hidden');
        }
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
  } else if (kind === 'coverage-conditions') {
    const { projectConditions, conditionsDefaults, inspect, cells, outcome } = await coverageConditionsVerifier(page, lab);
    const event = lab.getByRole('slider', { name: /^사건일/ });
    const claim = lab.getByRole('slider', { name: /^청구일/ });
    const covered = lab.getByRole('combobox', { name: '보장 사건 여부', exact: true });
    const excluded = lab.getByRole('combobox', { name: '제외 조건 적용', exact: true });
    const information = lab.getByRole('combobox', { name: '자료 확인 상태', exact: true });
    const chooseBoundary = async day => {
      const button = lab.getByRole('button', { name: `${day}일`, exact: true });
      await button.focus(); await page.keyboard.press('Enter');
      assert.equal(await event.inputValue(), String(day));
      assert.equal(await button.getAttribute('aria-pressed'), 'true', 'The selected exact-day boundary is not visibly current');
      assert.equal(await lab.locator('button[aria-pressed="true"]').count(), 1, 'Only one exact-day boundary may be selected');
    };
    const run = async (scenario, options = {}, expected) => {
      const model = projectConditions(options);
      if (expected) assert.deepEqual([model.status, model.benefit], expected, `${scenario}: frozen date/condition meaning changed`);
      await verify(scenario, model, outcome(model), inspect, cells);
      assert((await lab.locator('.insurance-result').innerText()).includes(model.verdict), 'The final explanation differs from the condition model');
      return model;
    };
    const frozen = projectConditions();
    const overview = page.locator('.conditions-overview [data-conditions-timeline]');
    assert.equal(await overview.count(), 1, 'Authored timeline overview is missing');
    await assertBars(overview, [frozen.timeline.periods.map(period => period.fraction)], 'Static overview uses the same exact date regions', '[data-conditions-period]');
    assert.deepEqual(await page.locator('.conditions-overview [data-conditions-marker]').evaluateAll(elements => elements.map(element => ({ id: element.dataset.conditionsMarker, day: Number(element.dataset.day), fraction: Number(element.dataset.fraction) }))), frozen.timeline.markers.map(marker => ({ id: marker.id, day: marker.day, fraction: marker.fraction })));
    await reset();
    const initial = await run('waiting-day-29-default', {}, ['waiting', 0]);
    await keyboardFrameSelection(page, lab, initial, inspect);
    await controls.getByRole('button', { name: '처음부터', exact: true }).click();
    await lab.getByRole('button', { name: '조건 결과 보기', exact: true }).focus(); await page.keyboard.press('Enter');
    await inspect(initial.frames.at(-1), initial);
    await changingStopsPlayback(() => chooseBoundary(30));
    await run('coverage-start-day-30-half-benefit', { eventDay: 30 }, ['reduced', 1000000]);
    await chooseBoundary(89); await run('last-reduced-day-89', { eventDay: 89 }, ['reduced', 1000000]);
    await chooseBoundary(90); await run('first-full-day-90', { eventDay: 90 }, ['full', 2000000]);
    await changingStopsPlayback(() => setExactRange(page, claim, 430));
    await run('late-claim-does-not-move-event-day-90', { eventDay: 90, claimDay: 430 }, ['full', 2000000]);
    await chooseBoundary(364); await run('last-covered-day-364', { eventDay: 364, claimDay: 430 }, ['full', 2000000]);
    await chooseBoundary(365); await run('end-day-365-is-excluded', { eventDay: 365, claimDay: 430 }, ['outside', 0]);
    await setExactRange(page, event, -1); await run('event-before-effective-day', { eventDay: -1, claimDay: 430 }, ['outside', 0]);
    assert.equal(await lab.locator('button[aria-pressed="true"]').count(), 0, 'A boundary preset stayed selected after a different slider day');
    await chooseBoundary(90); await setExactRange(page, claim, 90);
    await run('same-day-event-and-claim-use-separate-markers', { eventDay: 90, claimDay: 90 }, ['full', 2000000]);
    await setExactRange(page, claim, 89);
    await run('invalid-claim-before-event-is-not-denial', { eventDay: 90, claimDay: 89 }, ['invalid', null]);
    await setExactRange(page, claim, 100);
    await changingStopsPlayback(() => selectWithKeyboard(page, covered, 'no'));
    await run('known-not-covered-event', { eventDay: 90, coveredEvent: false }, ['not-covered', 0]);
    await selectWithKeyboard(page, covered, 'unknown');
    await run('unknown-covered-event-is-unresolved', { eventDay: 90, coveredEvent: null }, ['unresolved', null]);
    await selectWithKeyboard(page, covered, 'yes');
    await changingStopsPlayback(() => selectWithKeyboard(page, excluded, 'yes'));
    await run('known-exclusion-applies', { eventDay: 90, exclusionApplies: true }, ['excluded', 0]);
    await selectWithKeyboard(page, excluded, 'unknown');
    await run('unknown-exclusion-is-unresolved', { eventDay: 90, exclusionApplies: null }, ['unresolved', null]);
    await selectWithKeyboard(page, excluded, 'no');
    await changingStopsPlayback(() => selectWithKeyboard(page, information, 'unknown'));
    await run('unconfirmed-information-is-unresolved', { eventDay: 90, informationKnown: false }, ['unresolved', null]);
    await selectWithKeyboard(page, excluded, 'yes');
    await run('unconfirmed-information-with-known-exclusion-stays-unresolved', { eventDay: 90, informationKnown: false, exclusionApplies: true }, ['unresolved', null]);
    await reset(); await run('repeated-default-no-stale-date-or-gate', {}, ['waiting', 0]);
    assert.equal(await event.inputValue(), String(conditionsDefaults.eventDay));
    assert.equal(await claim.inputValue(), String(conditionsDefaults.claimDay));
    assert.equal(await covered.inputValue(), 'yes'); assert.equal(await excluded.inputValue(), 'no'); assert.equal(await information.inputValue(), 'known');
  } else if (kind === 'overlap') {
    const { projectOverlap, overlapDefaults, inspect, cells, outcome } = await overlapVerifier(page, lab);
    const gross = lab.getByRole('slider', { name: /^총손실/ });
    const outside = lab.getByRole('slider', { name: /^공통 대상 밖 손실/ });
    const capA = lab.getByRole('slider', { name: /^실손 A 남은 한도/ });
    const capB = lab.getByRole('slider', { name: /^실손 B 남은 한도/ });
    const eligibleA = lab.getByRole('checkbox', { name: '실손 A 적격', exact: true });
    const eligibleB = lab.getByRole('checkbox', { name: '실손 B 적격', exact: true });
    const fixedA = lab.getByRole('checkbox', { name: '정액 A 조건 충족', exact: true });
    const fixedB = lab.getByRole('checkbox', { name: '정액 B 조건 충족', exact: true });
    const toggle = async input => { await input.focus(); await page.keyboard.press('Space'); };
    const run = async (scenario, options = {}, expected) => {
      const model = projectOverlap(options);
      if (expected) assert.deepEqual([model.paidA, model.paidB, model.remainingBurden], expected, `${scenario}: frozen allocation meaning changed`);
      await verify(scenario, model, outcome(model), inspect, cells);
      assert((await lab.locator('.insurance-result').innerText()).includes(model.verdict), 'Final overlap explanation differs from the model');
      return model;
    };
    const frozen = projectOverlap();
    const overview = page.locator('.overlap-overview [data-overlap-lossbar]');
    assert.equal(await overview.count(), 1, 'Authored shared-loss overview is missing');
    await assertBars(overview, [frozen.segments.map(segment => segment.fraction)], 'Static overview shares the same single-loss model');
    assert.deepEqual(await overview.locator('[data-overlap-segment]').evaluateAll(elements => elements.map(element => Number(element.dataset.amount))), frozen.segments.map(segment => segment.amount));
    await reset();
    const initial = await run('equal-caps-share-one-loss', {}, [1500000, 1500000, 0]);
    await keyboardFrameSelection(page, lab, initial, inspect);
    await controls.getByRole('button', { name: '처음부터', exact: true }).click();
    await lab.getByRole('button', { name: '배분 결과 보기', exact: true }).focus(); await page.keyboard.press('Enter');
    await inspect(initial.frames.at(-1), initial);
    await changingStopsPlayback(() => setExactRange(page, capA, 100));
    await run('unequal-caps-one-to-three-shares', { capA: 1000000 }, [750000, 2250000, 0]);
    await reset(); await changingStopsPlayback(() => toggle(eligibleB));
    await run('only-a-eligible', { eligibleB: false }, [3000000, 0, 0]);
    await changingStopsPlayback(() => toggle(eligibleA)); await run('both-ineligible-with-visible-loss', { eligibleA: false, eligibleB: false }, [0, 0, 3000000]);
    await toggle(eligibleB); await run('only-b-eligible', { eligibleA: false }, [0, 3000000, 0]);
    await reset(); await changingStopsPlayback(() => setExactRange(page, outside, 100));
    await run('outside-amount-is-never-reimbursed', { excludedLoss: 1000000 }, [1000000, 1000000, 1000000]);
    await setExactRange(page, outside, 500);
    await run('exclusion-larger-than-gross-loss', { excludedLoss: 5000000 }, [0, 0, 3000000]);
    await reset(); await setExactRange(page, capA, 100); await changingStopsPlayback(() => setExactRange(page, capB, 100));
    await run('two-caps-leave-a-visible-gap', { capA: 1000000, capB: 1000000 }, [1000000, 1000000, 1000000]);
    await setExactRange(page, capA, 0); await setExactRange(page, capB, 0);
    await run('zero-eligible-capacity-does-not-erase-loss', { capA: 0, capB: 0 }, [0, 0, 3000000]);
    await reset(); await changingStopsPlayback(() => setExactRange(page, gross, 0));
    await run('zero-loss-zero-painted-partition-fixed-promises-separate', { grossLoss: 0 }, [0, 0, 0]);
    await reset(); await changingStopsPlayback(() => toggle(fixedA));
    await run('fixed-a-condition-false-keeps-indemnity-unchanged', { fixedA: false }, [1500000, 1500000, 0]);
    await changingStopsPlayback(() => toggle(fixedB));
    await run('both-fixed-conditions-false-keep-indemnity-unchanged', { fixedA: false, fixedB: false }, [1500000, 1500000, 0]);
    await toggle(fixedA); await run('only-fixed-a-conditional-promise', { fixedB: false }, [1500000, 1500000, 0]);
    await reset(); await run('repeated-default-no-double-allocation', {}, [1500000, 1500000, 0]);
    for (const [slider, key] of [[gross, 'grossLoss'], [outside, 'excludedLoss'], [capA, 'capA'], [capB, 'capB']]) assert.equal(await slider.inputValue(), String(overlapDefaults[key] / 10000));
    for (const input of [eligibleA, eligibleB, fixedA, fixedB]) assert.equal(await input.isChecked(), true);
  } else if (kind === 'timelines') {
    const { projectTimelines, timelinesDefaults, inspect, cells, outcome } = await timelinesVerifier(page, lab);
    const stop = lab.locator('[data-timelines-stop]');
    const year = lab.getByRole('slider', { name: /^관찰 시점/ });
    const run = async (scenario, stopRenewalYear = null, frameIndices) => {
      const model = projectTimelines({ stopRenewalYear });
      await verify(scenario, model, outcome(model), inspect, cells, frameIndices);
      return model;
    };
    const frozen = projectTimelines();
    const overview = page.locator('.timelines-overview');
    assert.equal(await overview.count(), 1, 'Authored payment/coverage contrast is missing');
    const overviewGeometry = await overview.locator('[data-timelines-track]').evaluateAll(tracks => tracks.map(track => {
      const box = track.getBoundingClientRect(), cursor = track.querySelector('[data-timelines-marker]').getBoundingClientRect(), coverage = track.querySelector('[data-timelines-coverage]');
      return { left: box.left, width: track.clientWidth, cursor: cursor.left, year: Number(track.querySelector('[data-timelines-marker]').dataset.year), coverage: coverage?.getBoundingClientRect().width, payments: [...track.querySelectorAll('[data-timelines-payment]')].map(node => Number(node.dataset.amount)) };
    }));
    assert.equal(overviewGeometry.length, 2);
    for (const track of overviewGeometry) assert(track.year === 5 && Math.abs(track.cursor - track.left - 5 / 12 * track.width) <= 1, 'Overview must visibly observe year5, after payments and before coverage ends');
    assert.deepEqual(overviewGeometry[0].payments, frozen.contracts[0].payments.map(payment => payment.amount));
    assert(Math.abs(overviewGeometry[1].coverage - frozen.contracts[0].coverage.fraction * overviewGeometry[1].width) <= 1);
    await reset();
    const initial = await run('annual-premiums-payment-end-and-coverage-end');
    await keyboardFrameSelection(page, lab, initial, inspect);
    await prediction.selectOption(outcome(initial));
    await controls.getByRole('button', { name: '처음부터', exact: true }).click();
    await controls.getByRole('button', { name: '재생', exact: true }).click();
    await setExactRange(page, year, 5);
    assert.equal(await controls.getByRole('button', { name: '정지', exact: true }).count(), 0, 'Seeking a year must pause playback');
    assert.equal(await prediction.inputValue(), outcome(initial), 'Moving the observation should not rewrite a condition prediction');
    await inspect(initial.frames[5], initial);
    await delay(1850); await inspect(initial.frames[5], initial);
    await capture(page, `${name}-year-5-payment-ended-coverage-continues`, lab);
    for (const boundary of [2, 4, 6, 8]) {
      await changingStopsPlayback(() => selectWithKeyboard(page, stop, String(boundary)));
      // All13 complete rows remain checked. Paint each distinct before/at/after stop
      // plus both fixed-contract boundaries, without repeating every similar year.
      const indices = [...new Set([0, boundary - 1, boundary, boundary + 1, 5, 9, 10, 12])].sort((a, b) => a - b);
      const model = await run(`do-not-renew-at-exact-year-${boundary}`, boundary, indices);
      assert(model.frames[boundary - 1].renewing.covered);
      for (const frame of model.frames.slice(boundary)) assert(!frame.renewing.covered && frame.renewing.premium === 0, 'A stopped contract silently resumed coverage or payments');
      const button = lab.getByRole('button', { name: model.frames[boundary].label, exact: true });
      await button.focus(); await page.keyboard.press('Enter');
      await inspect(model.frames[boundary], model);
      await capture(page, `${name}-stop-${boundary}-boundary-scene`, lab);
    }
    await changingStopsPlayback(() => selectWithKeyboard(page, stop, 'continue'));
    await run('repeat-default-no-duplicated-premiums', null, [0, 4, 5, 9, 10, 12]);
    await reset();
    assert.equal(await stop.inputValue(), timelinesDefaults.stopRenewalYear ?? 'continue');
    assert.equal(await year.inputValue(), '0');
  } else if (kind === 'surrender') {
    const { projectSurrender, inspect, cells, outcome } = await surrenderVerifier(page, lab);
    const model = projectSurrender();
    const year = lab.getByRole('slider', { name: '비교할 종료 시점', exact: true });
    const overview = page.locator('.surrender-overview');
    assert.equal(await overview.count(), 1, 'Authored year5 premium/return comparison is missing');
    await assertBars(overview.locator('.surrender-money-track'), [[1], [.4, .6]], 'Overview independently shows50만원 paid versus20만원 returned', '[data-surrender-bar]');
    assert.equal(await overview.locator('[data-surrender-premium]').getAttribute('data-value'), '500000');
    assert.equal(await overview.locator('[data-surrender-return]').getAttribute('data-value'), '200000');
    await reset();
    await verify('all-exit-years-and-separate-maturity', model, outcome(model), async (frame, current) => {
      await inspect(frame, current);
      if ([4, 5, 9].includes(frame.exitYear)) await capture(page, `${name}-year-${frame.exitYear}-surrender-scene`, lab);
    }, cells);
    await keyboardFrameSelection(page, lab, model, inspect);
    await controls.getByRole('button', { name: '처음부터', exact: true }).click();
    await prediction.selectOption('less');
    await controls.getByRole('button', { name: '재생', exact: true }).click();
    await setExactRange(page, year, 5);
    assert.equal(await controls.getByRole('button', { name: '정지', exact: true }).count(), 0, 'Changing the independent exit case must stop playback');
    assert.equal(await prediction.inputValue(), '', 'Changing the exit case must clear its prior prediction');
    await inspect(model.frames[5], model);
    await delay(1850); await inspect(model.frames[5], model);
    await openTables(page, lab);
    assert.deepEqual(await lab.locator('.insurance-static table tbody tr').evaluateAll(rows => rows.map(row => [...row.querySelectorAll('th,td')].map(cell => cell.textContent.trim()))), cells(model, model.frames[5]), 'Year5 static timeline is stale after seeking from maturity');
    await controls.getByRole('button', { name: '재생', exact: true }).click();
    await reset();
    await delay(1850);
    await inspect(model.frames[0], model);
    assert.equal(await prediction.inputValue(), '');
    await prediction.selectOption('less');
    await verify('repeat-all-exits-no-accumulated-double-payments', model, outcome(model), inspect, cells);
    assert.equal(await lab.locator('[data-static-surrender][data-selected="true"]').count(), 1, 'Exactly one independent exit case must be highlighted');
  } else if (kind === 'claims') {
    const { projectClaims, claimsDefaults, claimsScenarios, inspect, cells, outcome } = await claimsVerifier(page, lab);
    const scenario = lab.getByRole('combobox', { name: '청구 결과 사례', exact: true });
    const cash = lab.getByRole('slider', { name: '출발현금', exact: true });
    const day = lab.getByRole('slider', { name: '관찰할 날짜', exact: true });
    const run = async (label, options = {}, captureDays = []) => {
      const model = projectClaims(options);
      for (const summary of await lab.locator('.insurance-static[open] > summary').all()) await summary.click();
      await verify(label, model, outcome(model), async (frame, current) => {
        await inspect(frame, current);
        if (captureDays.includes(frame.day)) await capture(page, `${name}-${label}-day-${frame.day}`, lab);
      }, cells, undefined, false);
      return model;
    };
    const frozen = projectClaims();
    const overview = page.locator('.claims-overview');
    assert.equal(await overview.count(), 1, 'The fixed due/arrival comparison is missing');
    // Zero-width not-due segments deliberately remain anchored at0; compare only
    // the paid/unfunded partition here, with all three inspected in the live scene.
    await assertBars(overview.locator('.claims-overview-track'), [[1 / 3, 2 / 3], [1, 0]], 'Overview keeps due-day shortage after receipt', '.paid,.unfunded');
    assert.deepEqual(await overview.locator('.claims-history-stamp').allTextContents(), ['5일 부족 기록 200만원', '5일 부족 기록 200만원']);
    const overviewBoxes = await overview.locator('.claims-overview-pair>section').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().toJSON()));
    if (page.viewportSize().width <= 650) assert(overviewBoxes[1].top >= overviewBoxes[0].bottom, 'Mobile due/arrival comparison must stack');
    await reset();
    await run('standard-receipt-does-not-erase-due-shortfall', {}, [5, 10]);
    assert.deepEqual([frozen.frames[8].confirmedAmount, frozen.frames[8].receivedToDate, frozen.frames[10].unfunded, frozen.frames[10].shortfallAtDue], [2000000, 0, 0, 2000000]);
    await controls.getByRole('button', { name: '처음부터', exact: true }).click();
    await prediction.selectOption('shortfall');
    await controls.getByRole('button', { name: '재생', exact: true }).click();
    await setExactRange(page, day, 8);
    assert.equal(await controls.getByRole('button', { name: '정지', exact: true }).count(), 0, 'Seeking a date must stop playback');
    assert.equal(await prediction.inputValue(), 'shortfall', 'Observing another day must not change the cash-condition prediction');
    const focus = await day.evaluate(element => { const s = getComputedStyle(element); return { visible: element.matches(':focus-visible'), outline: s.outlineStyle, width: parseFloat(s.outlineWidth) }; });
    assert(focus.visible && focus.outline !== 'none' && focus.width > 0, 'The canonical day slider needs visible keyboard focus');
    await inspect(frozen.frames[8], frozen);
    await delay(1850); await inspect(frozen.frames[8], frozen);
    if ([1440, 320].includes(page.viewportSize().width)) await capture(page, `${name}-decision-confirmed-but-not-received`, lab.locator('.claims-process-scene'));
    for (const [label, selectedDay] of [['5일 납기 보기', 5], ['10일 입금 보기', 10], ['전체 결과 보기', 20]]) {
      const shortcut = lab.getByRole('button', { name: label, exact: true });
      await shortcut.focus(); await page.keyboard.press('Enter'); await inspect(frozen.frames[selectedDay], frozen);
    }
    const expected = { 'same-day': [0, 2000000, 0], delayed: [2000000, 2000000, 0], denied: [2000000, 0, 2000000], partial: [2000000, 1000000, 1000000] };
    const captures = { 'same-day': [5], delayed: [9, 18], denied: [8], partial: [10] };
    for (const item of claimsScenarios.filter(item => item.id !== 'standard')) {
      await changingStopsPlayback(() => selectWithKeyboard(page, scenario, item.id));
      const model = await run(`${item.id}-separate-outcome`, { scenario: item.id }, captures[item.id]);
      assert.deepEqual([model.final.shortfallAtDue, model.final.receivedToDate, model.final.unfunded], expected[item.id]);
      if (item.id === 'same-day') assert.deepEqual([model.due.receipt, model.due.cashBeforePayment, model.due.paidToday], [2000000, 3000000, 3000000], 'Same-day receipt must precede the due payment');
      if (item.id === 'denied') {
        await lab.getByRole('button', { name: '거절 결정 보기', exact: true }).focus(); await page.keyboard.press('Enter');
        await inspect(model.frames[item.decisionDay], model);
        assert.equal(await lab.locator('[data-claims-event="receipt"]').count(), 0, 'Denied scenario invented an arrival event');
      }
    }
    await reset();
    await changingStopsPlayback(() => setExactRange(page, cash, 0));
    const noCash = await run('zero-starting-cash-leaves-one-million-unfunded', { startingCash: 0 });
    assert.deepEqual([noCash.final.shortfallAtDue, noCash.final.unfunded], [3000000, 1000000]);
    await changingStopsPlayback(() => setExactRange(page, cash, 3000000));
    const enough = await run('cash-covers-due-history-stays-exactly-zero', { startingCash: 3000000 });
    assert.deepEqual([enough.final.shortfallAtDue, enough.final.availableCash, enough.final.unfunded], [0, 2000000, 0]);
    await controls.getByRole('button', { name: '처음부터', exact: true }).click();
    await controls.getByRole('button', { name: '재생', exact: true }).click();
    await reset(); await delay(1850);
    await inspect(frozen.frames[0], frozen);
    assert.equal(await scenario.inputValue(), claimsDefaults.scenario);
    assert.equal(await cash.inputValue(), String(claimsDefaults.startingCash));
    assert.equal(await day.inputValue(), '0');
    await run('repeat-default-receipt-never-double-counted');
  } else if (kind === 'reading-insurance') {
    const { projectReading, readingDefaults, readingStatements, inspect, cells, outcome } = await readingInsuranceVerifier(page, lab);
    const date = lab.getByRole('slider', { name: /^가상 사건일/ });
    const event = lab.getByRole('combobox', { name: '보장 사건이라는 가정', exact: true });
    const chooseDay = async selected => {
      const button = lab.getByRole('button', { name: selected === null ? '사건일 미확인' : `${selected}일`, exact: true });
      await button.focus(); await page.keyboard.press('Enter');
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      assert.equal(await lab.locator('.reading-boundary-buttons button[aria-pressed="true"]').count(), 1);
    };
    const run = async (label, options = {}, captureResult = false, captureFrames = []) => {
      const model = projectReading(options);
      for (const summary of await lab.locator('.insurance-static[open] > summary').all()) await summary.click();
      await verify(label, model, outcome(model), async (frame, current) => {
        await inspect(frame, current);
        if (captureFrames.includes(frame.index)) await capture(page, `${name}-${label}-${frame.phase}`, lab);
      }, cells, undefined, captureResult);
      return model;
    };
    const overview = page.locator('.reading-overview');
    assert.equal(await overview.count(), 1, 'The authored three-contract reading overview is missing');
    const frozen = projectReading();
    for (const contract of frozen.contracts) {
      assert.equal(await overview.locator(`[data-reading-conditional="${contract.id}"]`).getAttribute('data-value'), String(contract.conditionalAmount));
      if (contract.structure === 'indemnity') await assertBars(overview.locator(`[data-reading-loss-track="${contract.id}"]`), [contract.segments.map(segment => segment.fraction)], 'Authored overview uses the same full standalone loss', '[data-reading-segment]');
    }
    await reset();
    const initial = await run('promises-assumptions-and-open-questions', {}, false, [1440, 320].includes(page.viewportSize().width) ? [1, 3] : []);
    await keyboardFrameSelection(page, lab, initial, inspect);
    await controls.getByRole('button', { name: '처음부터', exact: true }).click();
    await lab.getByRole('button', { name: '전체 근거와 결과 보기', exact: true }).focus(); await page.keyboard.press('Enter');
    await inspect(initial.frames.at(-1), initial);
    const boundaries = [[29, [0, 0, 1000000]], [30, [2000000, 0, 1000000]], [89, [2000000, 0, 1000000]], [90, [2000000, 1000000, 1000000]], [179, [2000000, 1000000, 1000000]], [180, [2000000, 1000000, null]], [364, [2000000, 1000000, null]], [365, [0, 0, null]]];
    for (const [selected, amounts] of boundaries) {
      await changingStopsPlayback(() => chooseDay(selected));
      const model = await run(`exact-event-day-${selected}`, { eventDay: selected }, [29, 30, 180, 365].includes(selected));
      assert.deepEqual(model.contracts.map(contract => contract.conditionalAmount), amounts, 'Known date boundaries and unknown renewal must remain distinct');
    }
    await changingStopsPlayback(() => setExactRange(page, date, -1));
    const beforeStart = await run('before-all-initial-periods', { eventDay: -1 });
    assert.deepEqual(beforeStart.contracts.map(contract => contract.conditionalAmount), [0, 0, 0]);
    await setExactRange(page, date, 0);
    const dayZero = await run('day-zero-c-only-first-period', { eventDay: 0 });
    assert.deepEqual(dayZero.contracts.map(contract => contract.conditionalAmount), [0, 0, 1000000]);
    await chooseDay(90);
    await changingStopsPlayback(() => selectWithKeyboard(page, event, 'no'));
    const outside = await run('event-assumed-outside-clears-conditional-paint', { coveredEvent: false }, true);
    assert.deepEqual(outside.contracts.map(contract => contract.conditionalAmount), [0, 0, 0]);
    await changingStopsPlayback(() => selectWithKeyboard(page, event, 'unknown'));
    const unresolved = await run('unknown-event-is-not-denial-zero', { coveredEvent: null }, true);
    assert.deepEqual(unresolved.contracts.map(contract => contract.conditionalAmount), [null, null, null]);
    await selectWithKeyboard(page, event, 'no');
    await changingStopsPlayback(() => chooseDay(null));
    const unknownDate = await run('unknown-date-preserved-even-with-outside-assumption', { eventDay: null, coveredEvent: false }, true);
    assert.deepEqual(unknownDate.contracts.map(contract => contract.conditionalAmount), [null, null, null]);
    assert.equal(await lab.locator('[data-reading-event-marker]').count(), 0, 'Unknown date must remove every invented date marker');
    const hiddenDate = lab.locator('input[type="range"]');
    assert.equal(await hiddenDate.count(), 1);
    assert(await hiddenDate.isDisabled() && !(await hiddenDate.isVisible()), 'Unknown date must not display an enabled numeric slider value');
    await chooseDay(90); await selectWithKeyboard(page, event, 'yes');
    await run('known-assumptions-restored-without-resolving-missing-clauses');
    await reset();
    await prediction.selectOption('unresolved');
    await controls.getByRole('button', { name: '재생', exact: true }).click();
    const wrongChoice = 'assumption', first = readingStatements[0];
    await selectWithKeyboard(page, lab.getByRole('combobox', { name: `문장 ${first.number} 분류`, exact: true }), wrongChoice);
    assert.equal(await controls.getByRole('button', { name: '정지', exact: true }).count(), 0, 'Classifying evidence must pause the observation');
    assert.equal(await prediction.inputValue(), 'unresolved', 'Classifying a statement must not silently rewrite the overall prediction');
    const wrongModel = projectReading({ selections: { [first.id]: wrongChoice } });
    await inspect(wrongModel.frames[0], wrongModel);
    await delay(1850); await inspect(wrongModel.frames[0], wrongModel);
    await lab.getByRole('button', { name: wrongModel.frames[1].label, exact: true }).focus(); await page.keyboard.press('Enter');
    await inspect(wrongModel.frames[1], wrongModel);
    assert.match(await lab.locator(`[data-reading-evidence="${first.id}"]`).innerText(), /분류가 다릅니다/);
    if ([1440, 320].includes(page.viewportSize().width)) await capture(page, `${name}-classification-choice-before-correction`, lab.locator(`[data-reading-statement="${first.id}"]`));
    const selections = {};
    for (const statement of readingStatements) {
      await selectWithKeyboard(page, lab.getByRole('combobox', { name: `문장 ${statement.number} 분류`, exact: true }), statement.classification);
      selections[statement.id] = statement.classification;
    }
    await run('all-classifications-correct-still-no-actual-payment', { selections });
    await controls.getByRole('button', { name: '처음부터', exact: true }).click();
    await controls.getByRole('button', { name: '재생', exact: true }).click();
    await reset(); await delay(1850);
    await inspect(frozen.frames[0], frozen);
    assert.equal(await date.inputValue(), String(readingDefaults.eventDay));
    assert.equal(await event.inputValue(), 'yes');
    assert.deepEqual(await lab.locator('.reading-statement select').evaluateAll(elements => elements.map(element => element.value)), readingStatements.map(() => ''), 'Full reset must clear every classification');
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
          if (['coverage-conditions', 'overlap', 'timelines', 'surrender', 'claims', 'reading-insurance'].includes(await labs.nth(i).getAttribute('data-insurance-lab'))) {
            await check(`static-disclosure-geometry-${name}`, page, () => tableDisclosureGeometryChecks(page, labs.nth(i), name));
          }
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
      const disclosures = await tableDisclosureGeometryChecks(intermediatePage, lab, '850-pooling');
      await lab.getByRole('button', { name: '지급 결과 보기', exact: true }).click();
      await verifyStack();
      await capture(intermediatePage, '850-pooling-individual-final-scene', lab);
      await lab.getByRole('button', { name: '공통 충격 · 8가구', exact: true }).click();
      await lab.getByRole('button', { name: '지급 결과 보기', exact: true }).click();
      await capture(intermediatePage, '850-pooling-common-final-scene', lab);
      return { disclosures, audit: await verifyStack() };
    });
    for (const chapter of insuranceChapters.filter(chapter => ['contract-map', 'payout', 'coverage-conditions', 'overlap', 'timelines', 'surrender', 'claims', 'reading-insurance'].includes(chapter.id))) {
      await check(`intermediate-850-${chapter.id}-layout-and-model`, intermediatePage, async () => {
        await visit(intermediatePage, chapter.route);
        await domAudit(intermediatePage);
        const lab = intermediatePage.locator(`[data-insurance-lab="${chapter.id}"]`);
        assert.equal(await lab.count(), 1, 'Intermediate-width chapter must retain its published lab');
        await capture(intermediatePage, `850-${chapter.id}-initial-scene`, lab);
        const disclosures = await tableDisclosureGeometryChecks(intermediatePage, lab, `850-${chapter.id}`);
        return { disclosures, model: await conditionChecks(intermediatePage, lab, `850-${chapter.id}`) };
      });
    }
    await check('intermediate-850-existing-investing-static-tables', intermediatePage, async () => {
      await visit(intermediatePage, '/investing/costs-fx');
      const lab = intermediatePage.locator('[data-testid="costs-fx-lab"]');
      assert.equal(await lab.count(), 1, 'Existing investing lab remains available');
      const geometry = () => intermediatePage.evaluate(() => {
        const rect = document.querySelector('main').getBoundingClientRect();
        return { viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, mainWidth: rect.width, mainLeft: rect.left, scrollX };
      });
      const initial = await geometry();
      assert(initial.documentWidth <= initial.viewport + 1, 'Existing chapter overflows before opening tables');
      const summaries = lab.locator('details > summary');
      assert(await summaries.count() > 0, 'Existing chapter static alternatives are preserved');
      for (const summary of await summaries.all()) {
        if (!(await summary.evaluate(element => element.parentElement.open))) { await summary.focus(); await intermediatePage.keyboard.press('Enter'); }
      }
      const opened = await geometry();
      assert(opened.documentWidth <= opened.viewport + 1, 'Existing chapter expanded after opening tables');
      for (const key of ['mainWidth', 'mainLeft', 'scrollX']) assert(Math.abs(opened[key] - initial[key]) <= 1, `Existing chapter changed ${key}`);
      let scrollingRegions = 0;
      for (const region of await lab.locator('.invest-table').all()) {
        assert.equal(await region.getAttribute('tabindex'), '0');
        const size = await region.evaluate(element => ({ width: element.clientWidth, content: element.scrollWidth }));
        if (size.content > size.width + 1) {
          await region.focus(); await intermediatePage.keyboard.press('ArrowRight'); await delay(250);
          assert(await region.evaluate(element => element.scrollLeft > 0), 'Existing table no longer supports keyboard scrolling');
          await region.evaluate(element => { element.scrollLeft = 0; }); scrollingRegions++;
        }
      }
      assert(scrollingRegions > 0, 'Regression must exercise at least one overflowing internal table');
      await capture(intermediatePage, '850-existing-investing-costs-fx-static-tables', lab);
      for (const summary of await summaries.all()) { await summary.focus(); await intermediatePage.keyboard.press('Enter'); }
      const closed = await geometry();
      assert(closed.documentWidth <= closed.viewport + 1);
      for (const key of ['mainWidth', 'mainLeft', 'scrollX']) assert(Math.abs(closed[key] - initial[key]) <= 1);
      return { initial, opened, closed, scrollingRegions };
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
        const kind = await lab.getAttribute('data-insurance-lab');
        const verifier = kind === 'coverage-conditions' ? await coverageConditionsVerifier(page, lab) : kind === 'overlap' ? await overlapVerifier(page, lab) : kind === 'timelines' ? await timelinesVerifier(page, lab) : kind === 'surrender' ? await surrenderVerifier(page, lab) : kind === 'claims' ? await claimsVerifier(page, lab) : kind === 'reading-insurance' ? await readingInsuranceVerifier(page, lab) : null;
        const model = verifier ? (kind === 'coverage-conditions' ? verifier.projectConditions() : kind === 'overlap' ? verifier.projectOverlap() : kind === 'timelines' ? verifier.projectTimelines() : kind === 'surrender' ? verifier.projectSurrender() : kind === 'claims' ? verifier.projectClaims() : verifier.projectReading()) : null;
        if (verifier) await verifier.inspect(model.frames[0], model);
        const controls = lab.locator('.money-playback');
        const step = controls.getByRole('button', { name: '한 단계 진행', exact: true });
        const frameCount = Number((await controls.locator('span').innerText()).match(/^0 \/ (\d+) 단계$/)?.[1]);
        assert(Number.isInteger(frameCount) && frameCount > 0 && frameCount <= 30, 'Reduced-motion observation count must be bounded and initially at zero');
        for (let index = 1; index <= frameCount; index++) {
          await step.focus(); await page.keyboard.press('Enter');
          assert.equal(await controls.locator('span').innerText(), `${index} / ${frameCount} 단계`, 'Reduced motion must allow every manual observation frame');
          assert.deepEqual(await motion(), [], 'Manual observation reintroduced reduced-motion animation');
          if (verifier) await verifier.inspect(model.frames[index], model);
        }
        assert(await step.isDisabled(), 'Reduced-motion stepping did not stop at the final frame');
        if (verifier) {
          assert.equal(frameCount, model.frames.length - 1, 'Reduced-motion observation count differs from its ordinary model');
          const rows = await lab.locator('.insurance-static table tbody tr').evaluateAll(elements => elements.map(row => [...row.querySelectorAll('th,td')].map(cell => cell.textContent.trim())));
          assert.deepEqual(rows, verifier.cells(model), 'Reduced-motion static alternative differs from the same complete model frames');
        }
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

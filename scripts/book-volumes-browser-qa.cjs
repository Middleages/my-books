/* Verify category-volume labels against the exact production build.
 * npm run build && NODE_PATH=/path/to/playwright/node_modules CHROME_PATH=/usr/bin/chromium node scripts/book-volumes-browser-qa.cjs
 * LIVE_URL=https://middleages.github.io/my-books/ optionally verifies deployed assets too.
 * Inspect generated PNGs separately; assertions do not certify visual readability.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const out = path.join(root, 'artifacts/book-volumes-browser');
fs.mkdirSync(out, { recursive: true });
const source = fs.readFileSync(path.join(root, 'src/catalog.ts'), 'utf8');
const books = [...source.split('export const books:')[1].matchAll(/\bid:\s*"([^"]+)"\s*,\s*categoryId:\s*"([^"]+)"\s*,\s*volume:\s*(\d+)/g)]
  .map(match => ({ id: match[1], category: match[2], volume: Number(match[3]) }));
const chapters = [...source.matchAll(/\bid:\s*"([^"]+)"\s*,\s*bookId:\s*"([^"]+)"\s*,\s*readId:\s*"([^"]+)"/g)]
  .map(match => ({ id: match[1], book: match[2], readId: match[3], href: `#/${match[2]}/${match[1]}` }));
const categories = Object.fromEntries([...source.split('export const bookCategories =')[1].split('] as const')[0].matchAll(/id:\s*"([^"]+)", label:\s*"([^"]+)"/g)].map(match => [match[1], match[2]]));
const label = book => `${categories[book.category]} ${book.volume}권`;
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const results = { started: new Date().toISOString(), sourceSha: git('rev-parse', 'HEAD'), sourceTree: git('rev-parse', 'HEAD^{tree}'), workflowSha: process.env.GITHUB_SHA || null, sourceChanges: git('status', '--porcelain'), mode: process.env.LIVE_URL ? 'published' : 'local-dist', checks: [], screenshots: [], errors: [] };
let browser, server, base;
async function check(name, run) {
  const details = await run();
  results.checks.push({ name, status: 'passed', details });
  console.log(`PASSED ${name}`);
}
async function visit(page, route = '/') {
  await page.goto(`${base}${process.env.LIVE_URL ? `?qa=${Date.now()}` : ''}#${route}`, { waitUntil: 'networkidle' });
  await page.locator('main h1').waitFor();
}
async function screenshot(page, name, locator) {
  await page.evaluate(() => document.fonts.ready);
  const file = `${name}.png`;
  if (locator) await locator.screenshot({ path: path.join(out, file), animations: 'disabled' });
  else await page.screenshot({ path: path.join(out, file), fullPage: true, animations: 'disabled' });
  results.screenshots.push(file);
}
async function tabTo(page, locator) {
  // Real Tab navigation establishes keyboard modality and verifies reachability.
  // Programmatic focus alone can leave :focus-visible dependent on prior input.
  for (let attempt = 0; attempt < 75; attempt++) {
    await page.keyboard.press('Tab');
    if (await locator.evaluate(element => document.activeElement === element)) return;
  }
  throw new Error('Expected control was not reachable with Tab');
}
async function geometry(page) {
  const value = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('.home-book,.home-cover,.home-book-volume,.home-badge,.book-volume,.book-heading-meta,.chapter-list > a')];
    return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, labels: nodes.map(element => {
      const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
      return { text: element.textContent, x: rect.x, right: rect.right, width: rect.width, height: rect.height, font: style.fontSize, display: style.display, visibility: style.visibility, clipped: element.scrollWidth > element.clientWidth + 1 && style.overflow !== 'visible' };
    }) };
  });
  assert(value.scrollWidth <= value.width + 1, `Page overflow: ${JSON.stringify(value)}`);
  for (const item of value.labels) {
    assert(item.x >= -1 && item.right <= value.width + 1 && item.width > 0 && item.height > 0, `Label outside viewport: ${JSON.stringify(item)}`);
    assert(item.display !== 'none' && item.visibility !== 'hidden' && !item.clipped, 'Label must remain visible');
  }
  return value;
}
(async () => {
  try {
    assert(books.length > 0);
    if (process.env.LIVE_URL) base = process.env.LIVE_URL.replace(/\/?$/, '/');
    else {
      server = http.createServer((request, response) => {
        const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        if (pathname.endsWith('/favicon.ico')) { response.writeHead(204); return response.end(); }
        const file = path.resolve(dist, pathname.replace(/^\/my-books\/?/, '') || 'index.html');
        if (!file.startsWith(dist + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { response.writeHead(404); return response.end(); }
        response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream');
        fs.createReadStream(file).pipe(response);
      });
      await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
      base = `http://127.0.0.1:${server.address().port}/my-books/`;
    }
    browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    results.browser = browser.version();
    await check('served-production-assets-match-dist', async () => {
      const context = await browser.newContext();
      const local = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
      const names = text => [...text.matchAll(/(?:src|href)="[^"\n]*assets\/([^"\n]+)"/g)].map(match => match[1]).sort();
      const expected = names(local);
      assert(expected.some(name => name.endsWith('.js')) && expected.some(name => name.endsWith('.css')), 'Exact build must contain JS and CSS');
      let html, actual;
      const deadline = Date.now() + (process.env.LIVE_URL ? 180000 : 0);
      do {
        html = await context.request.get(`${base}?qa=${Date.now()}`);
        actual = names(await html.text());
        if (html.ok() && JSON.stringify(actual) === JSON.stringify(expected)) break;
        if (Date.now() >= deadline) break;
        await new Promise(resolve => setTimeout(resolve, 5000));
      } while (Date.now() < deadline);
      assert(html.ok());
      assert.deepEqual(actual, expected);
      const assets = [];
      for (const name of fs.readdirSync(path.join(dist, 'assets')).filter(name => /\.(js|css)$/.test(name)).sort()) {
        const response = await context.request.get(`${base}assets/${name}?qa=${Date.now()}`);
        assert(response.ok());
        const data = await response.body();
        const built = fs.readFileSync(path.join(dist, 'assets', name));
        assert.deepEqual(data, built);
        assets.push({ name, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex'), localSha256: createHash('sha256').update(built).digest('hex') });
      }
      await context.close(); return assets;
    });
    for (const width of [1440, 390, 320]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.on('pageerror', error => results.errors.push(String(error)));
      page.on('console', message => { if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) results.errors.push(message.text()); });
      page.on('requestfailed', request => { if (!/\/favicon\.ico(?:\?|$)/.test(request.url())) results.errors.push(`${request.url()}: ${request.failure()?.errorText}`); });
      await check(`${width}-home-labels-and-unchanged-catalog-order`, async () => {
        await visit(page);
        assert.deepEqual(await page.locator('.home-book').evaluateAll(cards => cards.map(card => card.getAttribute('href').slice(2))), books.map(book => book.id));
        assert.deepEqual(await page.locator('.home-book-volume').allTextContents(), books.map(label));
        assert.equal(await page.locator('.home-cover .home-book-volume').count(), 0);
        assert.equal(await page.locator('main h1').count(), 1);
        assert.equal(await page.locator('.home-cover svg').count(), books.length, 'Every published book needs a cover');
        assert.equal(await page.locator('.home-order-note').innerText(), '권차는 분야별 권장 학습 순서예요.');
        for (const book of books) {
          const card = page.locator(`.home-book[href="#/${book.id}"]`);
          assert((await card.ariaSnapshot()).includes(label(book)), 'Volume must be in the accessible link name');
          const progress = await card.locator('progress').evaluate(element => ({ max: element.max, value: element.value }));
          assert.deepEqual(progress, { max: chapters.filter(chapter => chapter.book === book.id).length, value: 0 }, 'Home progress must count the exact published chapters');
        }
        await screenshot(page, `${width}-home`);
        return geometry(page);
      });
      await check(`${width}-category-filters-and-keyboard-labels`, async () => {
        for (const [category, categoryLabel] of Object.entries(categories)) {
          const button = page.getByRole('button', { name: new RegExp(`^${categoryLabel}`) });
          await tabTo(page, button); await page.keyboard.press('Enter');
          assert.equal(await button.getAttribute('aria-pressed'), 'true');
          const focus = await button.evaluate(element => ({ active: document.activeElement === element, outline: getComputedStyle(element).outlineStyle }));
          assert(focus.active && focus.outline !== 'none');
          assert.deepEqual(await page.locator('.home-book-volume').allTextContents(), books.filter(book => book.category === category).map(label));
          await geometry(page);
        }
      });
      await check(`${width}-every-book-overview-label`, async () => {
        for (const book of books) {
          await visit(page, `/${book.id}`);
          assert.equal(await page.locator('.book-volume').innerText(), label(book));
          assert((await page.locator('main').ariaSnapshot()).includes(label(book)));
          assert.equal(await page.locator('main h1').count(), 1);
          const links = chapters.filter(chapter => chapter.book === book.id).map(chapter => chapter.href);
          assert.deepEqual(await page.locator('.chapter-list > a').evaluateAll(elements => elements.map(element => element.getAttribute('href'))), links, 'Overview links must preserve the exact published catalog order');
          const sidebar = await page.locator('nav[aria-label="챕터 목차"] > a').evaluateAll(elements => elements.map(element => element.getAttribute('href')));
          assert.deepEqual(sidebar.slice(0, links.length + 1), [`#/${book.id}`, ...links], 'Sidebar must expose the same chapter links');
          assert.equal(await page.getByRole('button', { name: '읽음으로 표시', exact: true }).count(), 0, 'Book overview must not add a reading ID');
          await geometry(page);
          await screenshot(page, `${width}-${book.id}-heading`, page.locator('.book-heading-meta'));
        }
      });
      await check(`${width}-reading-first-does-not-change-volume`, async () => {
        await visit(page);
        const seed = ['unknown-future/id', 'money/map', 'network/packets'];
        await page.evaluate(seed => localStorage.setItem('my-books:read:v1', JSON.stringify(seed)), seed);
        await page.reload({ waitUntil: 'networkidle' });
        const activeIds = await page.locator('.home-book').filter({ has: page.locator('.home-badge') }).evaluateAll(cards => cards.map(card => card.getAttribute('href').slice(2)));
        assert.deepEqual(activeIds, ['network', 'money']);
        assert.deepEqual(await page.locator('.home-book').evaluateAll(cards => cards.map(card => card.getAttribute('href').slice(2))), ['network', 'money', ...books.filter(book => !activeIds.includes(book.id)).map(book => book.id)]);
        assert.equal(await page.locator('.home-book[href="#/network"] .home-book-volume').innerText(), 'IT·기술 2권');
        assert.equal(await page.locator('.home-book[href="#/money"] .home-book-volume').innerText(), '돈·경제 1권');
        await screenshot(page, `${width}-reading-first`);
        await geometry(page);
        await visit(page, '/money/map');
        await page.getByRole('button', { name: '✓ 읽음 · 표시 취소', exact: true }).click();
        await page.reload({ waitUntil: 'networkidle' });
        assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('my-books:read:v1'))), ['unknown-future/id', 'network/packets']);
        await page.getByRole('button', { name: '읽음으로 표시', exact: true }).click();
        await page.reload({ waitUntil: 'networkidle' });
        assert.deepEqual((await page.evaluate(() => JSON.parse(localStorage.getItem('my-books:read:v1')))).sort(), seed.sort());
      });
      await context.close();
    }
    await check('application-errors', async () => assert.deepEqual(results.errors, []));
    results.status = 'passed';
  } catch (error) { results.status = 'failed'; results.error = error.stack || String(error); process.exitCode = 1; }
  finally {
    await browser?.close();
    if (server) await new Promise(resolve => server.close(resolve));
    results.finished = new Date().toISOString();
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  }
})();

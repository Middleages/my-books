import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import * as queries from '../src/simulations/database/queries.mjs';
import * as indexes from '../src/simulations/database/indexes.mjs';
import { createFixture } from '../src/simulations/database/fixture.mjs';

// These are verifier/helper contracts, not a Chromium run or a visual review.
// Only the marked pure helper block executes here; browser entry points are never invoked.
const source = readFileSync(new URL('../scripts/database-browser-qa.cjs', import.meta.url), 'utf8');
const pure = source.match(/\/\/ BEGIN B-QA CONTRACT HELPERS([\s\S]*?)\/\/ END B-QA CONTRACT HELPERS/)?.[1];
assert(pure, 'Keep pure verifier contracts separate from the browser runner');
const { expectedReadFocus, pointerIsReached, assertEndpoint, assertNoObstacleCrossing, assertUnitGeometry, classifyDbDiagnostic, isBlockingBrowserError, assertTextLineBounds } =
  runInNewContext(`${pure}\n({ expectedReadFocus, pointerIsReached, assertEndpoint, assertNoObstacleCrossing, assertUnitGeometry, classifyDbDiagnostic, isBlockingBrowserError, assertTextLineBounds })`, { assert });
const plain = value => JSON.parse(JSON.stringify(value));

test('database verifier preserves every preexisting A scenario and assertion byte-for-byte', () => {
  const start = source.indexOf('    for(const route of knownRoutes.slice(1))');
  const end = source.indexOf('    await runBatchB(');
  assert(start >= 0 && end > start);
  // A scenario body captured before adding B. Diagnostics are strengthened separately.
  const digest = createHash('sha256').update(source.slice(start, end)).digest('hex');
  assert.equal(digest, '7d8ecc3b8d56c4b46e83c7dfd5fa1bfd52c25eef3595423862526d801966c828');
  for (const assertion of ['assert.deepEqual(report.pageErrors,[])', 'assert.deepEqual(report.consoleErrors,[])', 'assert.deepEqual(report.resourceErrors,[])']) assert(source.includes(assertion));
});

test('B runner is syntax-valid and retains truthful screenshot and fixed-fixture evidence boundaries', () => {
  execFileSync(process.execPath, ['--check', new URL('../scripts/database-browser-qa.cjs', import.meta.url).pathname]);
  assert.match(source, /Screenshots are evidence, not a completed human visual review/);
  assert.match(source, /Current-price mutation is model-only/);
  assert.match(source, /for\(const width of \[1440,390,320\]\)/);
  assert.match(source, /await runBatchB\(page,width,queryModel,indexModel,fixtureModel\)/);
  assert.match(source, /reducedMotion: 'no-preference'/);
  assert.match(source, /wirePageDiagnostics\(normalPage, 390, 'no-preference'\)/);
  assert.match(source, /wirePageDiagnostics\(page,width,'reduce'\)/);
  for (const helper of ['assertQueryFrame', 'assertFilterFrame', 'assertIndexFrame', 'assertWriteFrame', 'assertComposite', 'assertPageComparison', 'exerciseBPlayback']) assert(source.includes(`async function ${helper}(`));
  for (const contract of ['getPointAtLength', 'getScreenCTM', 'getBoundingClientRect', 'assertNoObstacleCrossing(edge.points', 'sourceCentered: row.orderId !== null', "sourceSide: 'bottom'", 'targetSide: mobile && n >= 2']) assert(source.includes(contract), contract);
});

test('read focus never treats a boundary comparison as a fetched result, including after completion', () => {
  for (const layout of indexes.INDEX_LAYOUTS) for (const query of indexes.INDEX_QUERIES) for (const path of indexes.INDEX_PATHS) {
    const frames = indexes.indexFrames({ layout, query, path });
    for (const f of frames) {
      const focus = expectedReadFocus(f);
      const reached = pointerIsReached(f, focus);
      assert.equal(reached, path === 'index' && !!focus && f.returnedRowIds.includes(focus.rowId) && f.heapPageIds.includes(focus.heapPageId));
      if (!f.finished) assert.equal(focus, f.selectedEntry);
      if (f.finished && f.returnedRowIds.length) assert(f.returnedRowIds.includes(focus.rowId));
      if (!f.returnedRowIds.length) assert.equal(reached, false);
    }
    const final = frames.at(-1);
    if (final.returnedRowIds.length) {
      for (const id of [final.returnedRowIds[0], final.returnedRowIds[1], final.returnedRowIds.at(-1)].filter(Boolean)) {
        assert.equal(expectedReadFocus(final, String(id)).rowId, id);
        assert.equal(pointerIsReached(final, expectedReadFocus(final, String(id))), path === 'index');
      }
    }
  }
  const wide = indexes.indexFrames({ query: 'wide' });
  const boundary = wide.find(f => f.event?.kind === 'leaf' && f.stopProof?.entry?.day === 33);
  assert.equal(expectedReadFocus(boundary).rowId, 2033);
  assert.equal(pointerIsReached(boundary, expectedReadFocus(boundary)), false);
  assert.notEqual(expectedReadFocus(wide.at(-1)).rowId, 2033);
});

test('read screenshot scenarios have explicit page-unit and boundary evidence', () => {
  for (const layout of indexes.INDEX_LAYOUTS) for (const query of indexes.INDEX_QUERIES) {
    const scan = indexes.indexFrames({ layout, query, path: 'scan' }).at(-1);
    const frames = indexes.indexFrames({ layout, query, path: 'index' }), index = frames.at(-1);
    assert.equal(scan.measurements.totalPages.value, 8);
    assert.deepEqual(scan.returnedRowIds, index.returnedRowIds);
    assert.equal(index.measurements.totalPages.value, { ordered: { narrow: 3, wide: 8, all: 13, empty: 2 }, scattered: { narrow: 6, wide: 12, all: 13, empty: 2 } }[layout][query]);
    if (query === 'wide') {
      const boundary = frames.find(f => f.event?.kind === 'leaf' && f.stopProof?.entry?.day === 33);
      assert.deepEqual(boundary.indexPageIds, ['index:root', 'index:leaf:0', 'index:leaf:1', 'index:leaf:2']);
      assert(!boundary.returnedRowIds.includes(2033));
      if (layout === 'ordered') assert(!boundary.heapPageIds.includes('heap:4'));
    }
    if (query === 'empty') {
      assert.deepEqual(index.indexPageIds, ['index:root', 'index:leaf:3']);
      assert.deepEqual(index.heapPageIds, []);
      assert.equal(index.stopProof.kind, 'end-marker');
    }
  }
});

test('endpoint geometry rejects correct labels pointing to the wrong side, row, or empty box', () => {
  const box = { x: 10, y: 20, width: 80, height: 40 };
  for (const [side, point] of [['left', { x: 10, y: 40 }], ['right', { x: 90, y: 40 }], ['top', { x: 50, y: 20 }], ['bottom', { x: 50, y: 60 }]]) assertEndpoint(point, box, side, 'valid endpoint');
  // NULL extension may start anywhere on the customer boundary, not necessarily its center.
  assertEndpoint({ x: 22, y: 60 }, box, 'bottom', 'NULL source', false);
  assert.throws(() => assertEndpoint({ x: 10, y: 40 }, box, 'right', 'wrong side'), /boundary/);
  assert.throws(() => assertEndpoint({ x: 90, y: 90 }, box, 'right', 'wrong row'), /outside/);
  assert.throws(() => assertEndpoint({ x: 90, y: 22 }, box, 'right', 'wrong center'), /center/);
  assert.throws(() => assertEndpoint({ x: 0, y: 0 }, { ...box, width: 0 }, 'left', 'empty'), /empty entity/);
});

test('path sampling catches old mobile lower-leaf and write routes crossing unrelated leaves', () => {
  const topLeft = { id: 'L0', x: 8, y: 78, width: 124, height: 36 };
  const topRight = { id: 'L1', x: 147, y: 78, width: 124, height: 36 };
  const oldVertical = Array.from({ length: 83 }, (_, i) => ({ x: 70, y: 64 + i }));
  assert.throws(() => assertNoObstacleCrossing(oldVertical, [topLeft, topRight], 'old root-to-L2'), /unrelated entity L0/);
  const outsideRail = Array.from({ length: 83 }, (_, i) => ({ x: 3, y: 64 + i }));
  assertNoObstacleCrossing(outsideRail, [topLeft, topRight], 'outside lower-leaf route');
  const writeTopRight = { id: 'L1', x: 146, y: 212, width: 126, height: 78 };
  const oldWrite = Array.from({ length: 131 }, (_, i) => ({ x: 209, y: 200 + i }));
  assert.throws(() => assertNoObstacleCrossing(oldWrite, [writeTopRight], 'old write-to-L3'), /unrelated entity L1/);
  assertNoObstacleCrossing(oldWrite.map(point => ({ ...point, x: 278 })), [writeTopRight], 'outer write rail');
  assertNoObstacleCrossing([{ x: topLeft.x, y: 90 }, { x: topLeft.x + topLeft.width, y: 90 }], [topLeft], 'touching a boundary is not crossing');
});

test('one-page comparison geometry rejects unequal unit widths, scales, origins and overlapping cells', () => {
  const row = { x: 5, width: 154, units: Array.from({ length: 13 }, (_, i) => ({ x: 5 + i * 12, width: 10 })) };
  assertUnitGeometry([structuredClone(row), structuredClone(row)]);
  assert.throws(() => assertUnitGeometry([row]), /Both completed paths/);
  const unequal = structuredClone(row); unequal.units[2].width = 7;
  assert.throws(() => assertUnitGeometry([row, unequal]), /different visual width/);
  const short = structuredClone(row); short.units.pop();
  assert.throws(() => assertUnitGeometry([row, short]), /scales differ/);
  assert.throws(() => assertUnitGeometry([row, { ...row, x: 8 }]), /same origin/);
  const overlap = structuredClone(row); overlap.units[2].x = overlap.units[1].x + 1;
  assert.throws(() => assertUnitGeometry([row, overlap]), /overlap/);
});

test('query evidence uses actual fan-out, NULL/no-group rules, count identities and historical unit prices', () => {
  const base = queries.queryFrames().at(-1);
  assert.deepEqual(base.groups[0].metrics, { countStar: 3, countOrder: 3, countDistinctOrder: 2, sumQty: 7, sumWon: 36000 });
  assert.equal(base.resultRows.filter(row => row.orderKey === 'orders:1001').length, 2);
  const distinct = queries.queryFrames({ metric: 'count-distinct-order' }).at(-1);
  assert.deepEqual(distinct.selectedCountedIds, ['orders:1001', 'orders:1002']);
  const left = queries.queryFrames({ customerId: 3, join: 'left' }).at(-1);
  assert.deepEqual(left.groups[0].metrics, { countStar: 1, countOrder: 0, countDistinctOrder: 0, sumQty: null, sumWon: null });
  assert.equal(left.resultRows[0].orderKey, null);
  assert.deepEqual(queries.queryFrames({ customerId: 3 }).at(-1).groups, []);
  const changed = createFixture(); changed.products[0].unit_price_won = 15000; changed.products[1].unit_price_won = 99000;
  assert.deepEqual(queries.queryFrames({ fixture: changed }).at(-1).resultRows, base.resultRows);
  assert.match(source, /queryShots = new Map/);
  for (const name of ['fork-count3', 'distinct2', 'left-null-sum-null', 'inner-no-group', 'cancelled-only-left-null', 'cancelled-order-included']) assert(source.includes(name));
});

test('WHERE comparison separates candidate and excluded entities from the result boundary', () => {
  const on = queries.joinFilterFrames({ placement: 'on' }).at(-1);
  const where = queries.joinFilterFrames({ placement: 'where' });
  assert.deepEqual(on.preservedCustomerIds, [1, 2, 3]);
  assert.equal(where[1].candidateRows.length, 4);
  assert.deepEqual(where.at(-1).preservedCustomerIds, [1]);
  assert.deepEqual(where.at(-1).discardedRows.map(row => row.customerId), [2, 3]);
  assert.match(source, /Discarded row still appears in the result diagram/);
  assert.match(source, /Displayed filter rows must stay inside their result boundary/);
});

test('write lifecycle checks old-key removal, new-key addition, no-index absence, and logical units', () => {
  for (const operation of ['indexed-key-update', 'insert']) for (const indexed of [true, false]) {
    const frames = indexes.indexWriteFrames({ operation, indexed }), final = frames.at(-1);
    assert.equal(final.measurements.logicalRecordChanges.value, 1);
    assert.equal(final.measurements.indexEntryAdditions.value, Number(indexed));
    assert.equal(final.measurements.indexEntryRemovals.value, Number(indexed && operation === 'indexed-key-update'));
    assert.equal(final.measurements.logicalRecordChanges.unit, '논리 레코드');
    if (indexed && operation === 'indexed-key-update') {
      assert.equal(frames[0].indexChange.before.leafPageId, 'index:leaf:0');
      assert.equal(final.indexChange.after.leafPageId, 'index:leaf:3');
      assert.equal(frames[0].indexChange.before.rowId, final.indexChange.after.rowId);
    }
  }
  for (const text of ['현재 인덱스에서 빠짐', '현재 인덱스에 들어옴', 'Old key entity remains in its old leaf']) assert(source.includes(text));
});

test('composite strip compares model spans with customer-contained visual order, not only count text', () => {
  assert.equal(indexes.compositeIndexSpans().spans.length, 3);
  for (const customerId of [1, 2, 3]) {
    const f = indexes.compositeIndexSpans({ customerId });
    assert.equal(f.spans.length, 1);
    assert.deepEqual(f.spans[0].entryIds, f.entries.filter(entry => entry.matches).map(entry => entry.id));
  }
  for (const text of ['Entry escaped its customer boundary', 'Composite key order reverses visually', 'Each green boundary must enclose exactly one model span', '[data-composite-span]', "name: '정렬 띠 초기화'"]) assert(source.includes(text));
});

const publicBase = 'https://middleages.github.io/my-books/';
const faviconConsole = { type: 'console', source: 'https://middleages.github.io/favicon.ico', message: 'Failed to load resource: the server responded with a status of 404 ()', page: `${publicBase}#/database` };
const faviconResponse = { type: 'response', source: 'https://middleages.github.io/favicon.ico', status: 404, page: `${publicBase}#/database` };

test('diagnostic fixture one retains only the exact observed public host-default favicon console 404 separately', () => {
  assert.deepEqual(plain(classifyDbDiagnostic(faviconConsole, publicBase)), { ...faviconConsole, kind: 'host-default-favicon-404' });
  for (const entry of [
    { ...faviconConsole, source: `${publicBase}favicon.ico` },
    { ...faviconConsole, source: `${publicBase}assets/missing.js` },
    { ...faviconConsole, source: 'https://example.com/favicon.ico' },
    { ...faviconConsole, source: '' },
    { ...faviconConsole, source: 'https://middleages.github.io/favicon.ico?x=1' },
    { ...faviconConsole, message: 'Failed to load resource: the server responded with a status of 500 ()' },
    { ...faviconConsole, message: 'Application failed while loading favicon configuration' },
    { ...faviconConsole, message: 'Failed to load resource: the server responded with a status of 404 (Not Found)' },
  ]) assert.equal(classifyDbDiagnostic(entry, publicBase).kind, 'application');
  for (const base of ['https://example.com/my-books/', 'https://middleages.github.io/other/', 'http://127.0.0.1:4173/my-books/']) assert.equal(classifyDbDiagnostic(faviconConsole, base).kind, 'application');
});

test('diagnostic fixture two retains only exact public root response 404; failed requests and all app errors stay fatal', () => {
  assert.deepEqual(plain(classifyDbDiagnostic(faviconResponse, publicBase)), { ...faviconResponse, kind: 'host-default-favicon-404' });
  for (const entry of [
    { ...faviconResponse, source: `${publicBase}favicon.ico` },
    { ...faviconResponse, source: 'https://example.com/favicon.ico' },
    { ...faviconResponse, source: '' },
    { ...faviconResponse, status: 403 },
    { ...faviconResponse, status: 500 },
    { ...faviconResponse, type: 'requestfailed', error: 'net::ERR_FAILED' },
  ]) assert.equal(classifyDbDiagnostic(entry, publicBase).kind, 'application');
  assert.equal(classifyDbDiagnostic(faviconResponse, 'https://example.com/my-books/').kind, 'application');
  assert.match(source, /page\.on\('requestfailed', request => report\.resourceErrors\.push/);
  assert.match(source, /report\.nonApplicationDiagnostics\.push\(entry\)/);
  assert(!source.includes("name.endsWith('/favicon.ico')"), 'The local server must not hide an app-owned missing favicon');
});

test('new animated labs cover keyboard, pause, no-autoplay, settings, reset, static alternatives and route cleanup', () => {
  for (const lab of ['queries', 'join-filter', 'index-read', 'index-write']) assert(source.includes(`lab: '${lab}'`));
  for (const token of ["page.keyboard.press('Enter')", "page.keyboard.press('ArrowDown')", "e.matches(':focus-visible')", 'Never auto-start.', 'Pause changed the diagram', 'getAnimations({ subtree: true })', "'.db-static li strong'", "'.db-static li p'", 'Setting changes must cancel the timer', 'routeCleanup: true']) assert(source.includes(token), token);
  assert.match(source, /snapNearEffect\(page, `\$\{width\}-b03-controls-and-fork`/);
  assert.match(source, /snapNearEffect\(page, `\$\{width\}-b04-controls-and-pointer`/);
  assert.match(source, /await lab\.locator\('\.db-controls'\)\.scrollIntoViewIfNeeded\(\)/);
  assert(source.includes('${spec.lab}-normal-paused'), 'Normal-motion paused scene needs direct screenshot evidence');
  assert(source.includes('${spec.lab}-${motion}-static-open'), 'Expanded static alternatives need screenshot evidence in both motion settings');
});

test('B selects expose the visible control label without concatenating option text', () => {
  let total = 0;
  for (const file of ['QueryLabs.tsx', 'IndexLabs.tsx']) {
    const ui = readFileSync(new URL(`../src/components/database/${file}`, import.meta.url), 'utf8');
    const controls = [...ui.matchAll(/<label[^>]*>([^<]+)<select\s+aria-label="([^"]+)"/g)];
    assert.equal(controls.length, [...ui.matchAll(/<select\s/g)].length);
    for (const [, visible, name] of controls) assert.equal(name, visible.trim());
    total += controls.length;
  }
  assert.equal(total, 12);
  assert(source.includes("getByLabel(label, { exact: true })"), 'Do not weaken exact-name browser checks');
});


test('a blocking browser timeout preserves a partial failure instead of repeating missing selectors', () => {
  assert.equal(isBlockingBrowserError({ name: 'TimeoutError' }), true);
  assert.equal(isBlockingBrowserError({ name: 'AssertionError' }), false);
  assert.equal(isBlockingBrowserError(null), false);
  assert.match(source, /if\(isBlockingBrowserError\(error\)\)/);
  assert(source.includes("await snap(page,'blocking-failure')"));
  assert(source.includes('throw error;'));
  assert(source.includes("report.fatal=String(error.stack||error);process.exitCode=1"));
  assert(source.includes("if(report.failed||report.fatal)process.exitCode=1"));
});

test('chapter 03 introductory SQL keeps its meaning with narrow-screen line breaks', () => {
  const mdx = readFileSync(new URL('../src/content/database/QueriesAndJoins.mdx', import.meta.url), 'utf8');
  const sql = mdx.match(/```sql\n([\s\S]*?)\n```/)?.[1];
  assert(sql);
  assert.equal(sql.replace(/\s+/g, ' '), "SELECT id FROM orders WHERE customer_id = 1 AND status = 'confirmed' ORDER BY id;");
  for (const line of sql.split('\n')) assert(line.length <= 28, `Introductory SQL line is too long: ${line.length}`);
  assert(source.includes('assert.deepEqual(x.overflow,[],JSON.stringify(x))'), 'Keep actual browser overflow checks strict');
});


test('explanation line geometry rejects hidden text overflow even if its element fits the viewport', () => {
  const box = { left: 25, right: 210 };
  assertTextLineBounds([{ text: 'wrapped', box, lines: [{ left: 25, right: 150 }, { left: 25, right: 200 }] }]);
  assert.throws(() => assertTextLineBounds([{ text: 'long token', box, lines: [{ left: 25, right: 260 }] }]), /own explanation box/);
  assert.throws(() => assertTextLineBounds([{ text: 'left overflow', box, lines: [{ left: 20, right: 150 }] }]), /own explanation box/);
  assert(source.includes("await assertExplanationBounds(lab, '.db-current p')"));
  assert(source.includes("await assertExplanationBounds(lab, '.db-static li p')"));
  const detail = queries.queryFrames().at(-1).detail;
  assert(detail.includes('COUNT(*), COUNT(o.id), COUNT(DISTINCT o.id)'));
  assert(!detail.includes('COUNT(*)·COUNT'));
  const css = readFileSync(new URL('../src/components/database/database.css', import.meta.url), 'utf8');
  assert.match(css, /\.db-lab p\{[^}]*overflow-wrap:anywhere/);
  assert(!css.includes('word-break:break-all'), 'Keep normal word boundaries when they fit');
  assert(source.includes('320 long SQL-term explanation wrapping regression'));
  assert(source.includes('restoredBeforeScenariosAndScreenshots: true'));
});

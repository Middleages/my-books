/* Reproducible production/live Chromium checks. Screenshots require separate visual review. */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process'),{createHash}=require('node:crypto'),{pathToFileURL}=require('node:url');
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist'),out=path.join(root,'artifacts/database-browser');fs.mkdirSync(out,{recursive:true});
const report={started:new Date().toISOString(),mode:process.env.LIVE_URL?'published':'production',sourceSha:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sourceChanges:execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}),checks:[],screenshots:[],pageErrors:[],consoleErrors:[],resourceErrors:[],nonApplicationDiagnostics:[],visualReview:'Screenshots are evidence, not a completed human visual review.'};
const catalog=fs.readFileSync(path.join(root,'src/catalog.ts'),'utf8');
const chapters=[...catalog.matchAll(/id:\s*"([^"]+)"\s*,\s*bookId:\s*"database"\s*,\s*readId:\s*"([^"]+)"\s*,\s*number:\s*"([^"]+)"[^}]*?heading:\s*"([^"]+)"/g)].map(m=>({id:m[1],readId:m[2],number:m[3],heading:m[4]}));
const knownRoutes=['/','/database',...chapters.map(c=>`/database/${c.id}`)];
const hash=b=>createHash('sha256').update(b).digest('hex');
let server,browser,base;
async function check(name,fn){try{const details=await fn();report.checks.push({name,status:'passed',details});console.log('PASS',name);}catch(error){report.checks.push({name,status:'failed',error:String(error.stack||error)});console.error('FAIL',name,error.message);if(isBlockingBrowserError(error)){try{const page=browser?.contexts().at(-1)?.pages().at(-1);if(page)await snap(page,'blocking-failure');}catch(captureError){report.diagnosticCaptureError=String(captureError);}throw error;}}}
async function snap(page,name,locator){const file=name+'.png';await page.evaluate(()=>document.fonts.ready);if(locator)await locator.screenshot({path:path.join(out,file),animations:'disabled'});else await page.screenshot({path:path.join(out,file),fullPage:true,animations:'disabled'});report.screenshots.push(file);}
async function visit(page,route){await page.goto(base+'#'+route,{waitUntil:'networkidle'});if(route==='/')await page.locator('#home-books').waitFor();else{const chapter=chapters.find(c=>route===`/database/${c.id}`);await page.getByRole('heading',{level:1,name:chapter?.heading||'웹앱 개발자를 위한 데이터베이스',exact:true}).waitFor();}}
async function audit(page){const x=await page.evaluate(()=>{const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';return{width:innerWidth,scroll:document.documentElement.scrollWidth,nested:document.querySelectorAll('p p').length,inputs:[...document.querySelectorAll('main input,main select')].filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')).map(e=>e.outerHTML),overflow:[...document.querySelectorAll('main *')].filter(e=>visible(e)&&!e.closest('.db-table')&&e.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(e=>({tag:e.tagName,cls:e.className?.baseVal??e.className,text:e.textContent.slice(0,60)})),headings:document.querySelectorAll('main h1').length};});assert.equal(x.scroll<=x.width+1,true,JSON.stringify(x));assert.deepEqual(x.overflow,[],JSON.stringify(x));assert.equal(x.nested,0);assert.equal(x.headings,1);assert.deepEqual(x.inputs,[]);return x;}
async function assertFileFrame(lab,f){
  const scenes=lab.locator('.db-figure svg:visible');assert.equal(await scenes.count(),1);const svg=scenes.first();
  const store=svg.locator('[data-shared-qty]');assert.equal(await store.getAttribute('data-shared-qty'),String(f.availableQty));assert.equal(await store.getAttribute('data-revision'),String(f.sourceRevision));assert((await store.textContent()).includes(`${f.availableQty}개`));
  assert.equal(await svg.locator('[data-order-count]').getAttribute('data-order-count'),String(f.committedOrders.length));
  assert.deepEqual(await svg.locator('[data-edge-from]').evaluateAll(es=>es.map(e=>({from:e.dataset.edgeFrom,to:e.dataset.edgeTo,active:e.dataset.active}))),f.edges.map(e=>({from:e.from,to:e.to,active:String(e.active)})));
  for(const c of f.localCopies){const g=svg.locator(`[data-app="${c.app}"]`);assert.equal(await g.getAttribute('data-copy-status'),c.status);assert.equal(await g.getAttribute('data-read-qty'),c.readQty===null?null:String(c.readQty));assert.equal(await g.getAttribute('data-write-qty'),c.writeQty===null?null:String(c.writeQty));assert.equal(await g.getAttribute('data-revision'),c.sourceRevision===null?null:String(c.sourceRevision));if(c.readQty!==null)assert((await g.textContent()).includes(`${c.readQty}개`));}
  assert.equal(await lab.locator('.db-invariant').getAttribute('data-holds'),String(f.invariant.holds));
}

// BEGIN B-QA CONTRACT HELPERS
// These pure contracts are unit tested without starting a browser. They are not browser evidence.
function isBlockingBrowserError(error) { return error?.name === 'TimeoutError'; }
function assertTextLineBounds(samples) {
  for (const sample of samples) for (const line of sample.lines) {
    assert(line.left >= sample.box.left - 1 && line.right <= sample.box.right + 1,
      `Text overflows its own explanation box: ${JSON.stringify(sample)}`);
  }
}
function expectedReadFocus(frame, selectedRowId = '') {
  if (!frame.finished || !frame.returnedRowIds.length) return frame.selectedEntry;
  const id = selectedRowId ? Number(selectedRowId) :
    frame.selectedEntry && frame.returnedRowIds.includes(frame.selectedEntry.rowId)
      ? frame.selectedEntry.rowId : frame.returnedRowIds[0];
  return frame.fixture.entries.find(entry => entry.rowId === id) ?? null;
}
function pointerIsReached(frame, focus) {
  return frame.path === 'index' && !!focus && frame.returnedRowIds.includes(focus.rowId) &&
    frame.heapPageIds.includes(focus.heapPageId);
}
function assertEndpoint(point, box, side, label, centered = true) {
  assert(box && box.width > 0 && box.height > 0, `${label}: missing or empty entity box`);
  const epsilon = 2;
  assert(point.x >= box.x - epsilon && point.x <= box.x + box.width + epsilon &&
    point.y >= box.y - epsilon && point.y <= box.y + box.height + epsilon,
  `${label}: endpoint is outside its entity ${JSON.stringify({ point, box })}`);
  const coordinate = side === 'left' ? box.x : side === 'right' ? box.x + box.width :
    side === 'top' ? box.y : box.y + box.height;
  const actual = ['left', 'right'].includes(side) ? point.x : point.y;
  assert(Math.abs(actual - coordinate) <= epsilon, `${label}: misses ${side} boundary`);
  if (centered) {
    const along = ['left', 'right'].includes(side) ? point.y : point.x;
    const middle = ['left', 'right'].includes(side) ? box.y + box.height / 2 : box.x + box.width / 2;
    assert(Math.abs(along - middle) <= 4, `${label}: misses entity center`);
  }
}
function assertNoObstacleCrossing(points, obstacles, label) {
  for (const obstacle of obstacles) {
    assert(!points.some(point => point.x > obstacle.x + .5 && point.x < obstacle.x + obstacle.width - .5 &&
      point.y > obstacle.y + .5 && point.y < obstacle.y + obstacle.height - .5),
    `${label}: path passes through unrelated entity ${obstacle.id}`);
  }
}
function assertUnitGeometry(rows) {
  assert.equal(rows.length, 2, 'Both completed paths must use the same visual unit');
  const units = rows.flatMap(row => row.units);
  assert(units.length > 0 && units[0].width > 0, 'Page units need visible area');
  for (const row of rows) {
    assert.equal(row.units.length, rows[0].units.length, 'Comparison scales differ');
    assert(Math.abs(row.x - rows[0].x) <= 1 && Math.abs(row.width - rows[0].width) <= 1,
      'Comparison tracks do not have the same origin and scale');
    for (let i = 0; i < row.units.length; i++) {
      const unit = row.units[i];
      assert(Math.abs(unit.width - units[0].width) <= .15, 'One page has different visual width');
      if (i) assert(unit.x >= row.units[i - 1].x + row.units[i - 1].width - .15,
        'Page units overlap or reverse their order');
    }
  }
}
function classifyDbDiagnostic(entry, publicBase) {
  const hostDefault = publicBase === 'https://middleages.github.io/my-books/' &&
    entry.source === 'https://middleages.github.io/favicon.ico';
  const observed404 = entry.type === 'console'
    ? entry.message === 'Failed to load resource: the server responded with a status of 404 ()'
    : entry.type === 'response' && entry.status === 404;
  return { ...entry, kind: hostDefault && observed404 ? 'host-default-favicon-404' : 'application' };
}
// END B-QA CONTRACT HELPERS

const dataSelector = (name, value) => `[data-${name}="${String(value).replaceAll('"', '\\"')}"]`;
const sorted = values => [...values].sort();
function wirePageDiagnostics(page, width, motion) {
  page.on('pageerror', error => report.pageErrors.push({ width, motion, error: String(error) }));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const entry = classifyDbDiagnostic({ type: 'console', width, motion, source: message.location().url,
      message: message.text(), page: page.url() }, base);
    if (entry.kind === 'host-default-favicon-404') report.nonApplicationDiagnostics.push(entry);
    else report.consoleErrors.push(entry);
  });
  // A request failure is never hidden, even for a favicon: its outcome is not an observed HTTP 404.
  page.on('requestfailed', request => report.resourceErrors.push({ type: 'requestfailed', width, motion,
    url: request.url(), error: request.failure()?.errorText, page: page.url() }));
  page.on('response', response => {
    if (response.status() < 400) return;
    const entry = classifyDbDiagnostic({ type: 'response', width, motion, source: response.url(),
      status: response.status(), page: page.url() }, base);
    if (entry.kind === 'host-default-favicon-404') report.nonApplicationDiagnostics.push(entry);
    else report.resourceErrors.push(entry);
  });
}
async function visibleScene(lab) {
  const svg = lab.locator('.db-figure svg:visible');
  assert.equal(await svg.count(), 1, 'Exactly one responsive scene must be visible');
  return svg;
}
async function assertGeometry(svg, edges) {
  if (!edges.length) return [];
  const measured = await svg.evaluate((root, descriptors) => descriptors.map(edge => {
    const path = root.querySelector(edge.path), source = root.querySelector(edge.source), target = root.querySelector(edge.target);
    if (!path || !source || !target) throw new Error(`Missing geometry entity for ${edge.path}`);
    const screen = length => {
      const point = path.getPointAtLength(length), matrix = path.getScreenCTM();
      return { x: matrix.a * point.x + matrix.c * point.y + matrix.e,
        y: matrix.b * point.x + matrix.d * point.y + matrix.f };
    };
    const box = element => { const b = element.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; };
    const length = path.getTotalLength(), steps = Math.max(1, Math.ceil(length));
    const allowed = [source, target, ...(edge.allowSelectors ?? []).map(selector => root.querySelector(selector))];
    const obstacles = edge.avoidSelector ? [...root.querySelectorAll(edge.avoidSelector)]
      .filter(element => !allowed.includes(element)).map(element => ({ ...box(element), id: element.parentElement.getAttribute('data-index-page') ?? element.parentElement.getAttribute('data-write-leaf') ?? element.parentElement.getAttribute('data-heap-row') })) : [];
    return { ...edge, start: screen(0), end: screen(length), a: box(source), b: box(target), obstacles,
      points: obstacles.length ? Array.from({ length: steps + 1 }, (_, i) => screen(length * i / steps)) : [] };
  }), edges);
  for (const edge of measured) {
    assertEndpoint(edge.start, edge.a, edge.sourceSide, `${edge.path} source`, edge.sourceCentered !== false);
    assertEndpoint(edge.end, edge.b, edge.targetSide, `${edge.path} target`, edge.targetCentered !== false);
    assertNoObstacleCrossing(edge.points, edge.obstacles, edge.path);
  }
  return measured;
}
async function assertExplanationBounds(lab, selector) {
  const samples = await lab.locator(selector).evaluateAll(elements => elements.filter(e => e.getClientRects().length).map(e => {
    const box = e.getBoundingClientRect(), range = document.createRange(); range.selectNodeContents(e);
    return { text: e.textContent, box: { left: box.left, right: box.right },
      lines: [...range.getClientRects()].map(r => ({ left: r.left, right: r.right })) };
  }));
  assertTextLineBounds(samples);
}
async function assertFrameText(lab, frame, count) {
  assert.equal(await lab.locator('.db-step-count').innerText(), `${frame.step + 1} / ${count}단계`);
  assert.equal(await lab.locator('.db-current strong').innerText(), frame.title);
  assert.equal(await lab.locator('.db-current p').innerText(), frame.detail);
  await assertExplanationBounds(lab, '.db-current p');
}
async function assertQueryFrame(lab, f, count) {
  await assertFrameText(lab, f, count);
  const svg = await visibleScene(lab);
  assert.equal(await svg.getAttribute('data-query-phase'), f.phase);
  assert.deepEqual(await svg.locator('[data-query-source]').evaluateAll(es => es.map(e => e.dataset.querySource)),
    [...f.sourceRows.customers.map(row => `customers:${row.id}`), ...f.sourceRows.orders.map(row => `orders:${row.id}`)]);
  assert.deepEqual(await svg.locator('[data-order-pair]').evaluateAll(es => es.map(e => Number(e.dataset.orderPair))),
    f.matchedPairs.filter(pair => pair.kind === 'customer-order' && pair.matched).map(pair => pair.orderId));
  assert.deepEqual(await svg.locator('[data-query-result]').evaluateAll(es => es.map(e => ({
    id: e.dataset.queryResult, order: e.dataset.orderId, item: e.dataset.itemKey, counted: e.dataset.counted,
  }))), f.resultRows.map(row => ({ id: row.id, order: String(row.orderId ?? 'NULL'), item: row.itemKey ?? 'NULL', counted: String(f.selectedCountedIds.includes(row.id)) })));
  assert.deepEqual(await svg.locator('[data-query-edge]').evaluateAll(es => es.map(e => ({ id: e.dataset.queryEdge, from: e.dataset.from, to: e.dataset.to }))),
    f.resultRows.map(row => ({ id: row.id, from: row.orderKey ?? row.customerKey, to: row.id })));
  for (const row of f.resultRows) {
    assert.equal(await svg.locator(dataSelector('query-edge', row.id)).getAttribute('stroke-dasharray'), row.orderId === null ? '5 3' : null);
    assert.equal(await svg.locator(`${dataSelector('query-result', row.id)} > rect`).first().getAttribute('stroke-dasharray'), row.nullExtended ? '5 3' : null);
  }
  const geometry = await assertGeometry(svg, f.resultRows.map(row => ({
    path: dataSelector('query-edge', row.id), source: `${dataSelector('query-source', row.orderKey ?? row.customerKey)} > rect`,
    target: `${dataSelector('query-result', row.id)} > rect`,
    sourceSide: row.orderId === null ? 'bottom' : 'right', sourceCentered: row.orderId !== null, targetSide: 'left',
  })));
  // The same order must fork from exactly one source point into two different result-row centers.
  const fork = geometry.filter(edge => edge.source.includes('orders:1001'));
  if (fork.length === 2) {
    assert(Math.abs(fork[0].start.x - fork[1].start.x) < .1 && Math.abs(fork[0].start.y - fork[1].start.y) < .1);
    assert(Math.abs(fork[0].end.y - fork[1].end.y) > 20, 'Fan-out has no distinct row destinations');
  }
  assert.equal(await svg.locator('[data-query-empty]').count(), f.resultRows.length ? 0 : 1);
  assert.deepEqual(await lab.locator('[data-query-group]').evaluateAll(es => es.map(e => e.dataset.queryGroup)), f.groups.map(group => group.id));
  assert.equal(await lab.locator('[data-query-no-group]').count(), f.finished && !f.groups.length ? 1 : 0);
  for (const group of f.groups) {
    const node = lab.locator(dataSelector('query-group', group.id));
    for (const [metric, value] of Object.entries(group.metrics)) {
      const unit = metric === 'sumQty' ? '개' : metric === 'sumWon' ? '원' : '';
      assert.equal(await node.locator(dataSelector('query-metric', metric)).innerText(), value === null ? 'NULL' : value.toLocaleString('ko-KR') + unit);
    }
    assert.deepEqual(await node.locator('[data-distinct-order]').evaluateAll(es => es.map(e => ({ id: e.dataset.distinctOrder, counted: e.dataset.counted }))),
      group.orderIds.map(id => ({ id: `orders:${id}`, counted: String(f.selectedCountedIds.includes(`orders:${id}`)) })));
    const amounts = f.resultRows.filter(row => group.resultRowIds.includes(row.id) && row.amountWon !== null);
    assert.deepEqual(await node.locator('[data-amount-row]').evaluateAll(es => es.map(e => ({ id: e.dataset.amountRow, amount: Number(e.dataset.amount) }))),
      amounts.map(row => ({ id: row.id, amount: row.amountWon })));
    assert.equal(await node.locator('.db-null-amount').count(), group.metrics.sumWon === null ? 1 : 0);
    assert.equal(await node.locator('.db-amount-track').count(), group.metrics.sumWon === null ? 0 : 1);
    if (amounts.length) {
      const bars = await node.locator('.db-amount-track').evaluate(track => {
        const style = getComputedStyle(track), box = track.getBoundingClientRect();
        return { width: box.width - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth),
          segments: [...track.children].map(e => ({ amount: Number(e.dataset.amount), width: e.getBoundingClientRect().width })) };
      });
      for (const segment of bars.segments) assert(Math.abs(segment.width - segment.amount / Math.max(36000, group.metrics.sumWon ?? 0) * bars.width) <= 1,
        'Amount segment width does not use its captured order-item amount');
    }
  }
  assert.deepEqual(await lab.locator('.db-query-sql code').allTextContents(), [f.sql, f.aggregateSql]);
}
async function assertFilterFrame(lab, f, count) {
  await assertFrameText(lab, f, count);
  const svg = await visibleScene(lab), rows = f.finished ? f.resultRows : f.candidateRows;
  assert.equal(await svg.getAttribute('data-filter-phase'), f.phase);
  assert.deepEqual(await svg.locator('[data-filter-customer]').evaluateAll(es => es.map(e => Number(e.dataset.filterCustomer))), f.sourceRows.customers.map(row => row.id));
  assert.deepEqual(await svg.locator('[data-filter-row]').evaluateAll(es => es.map(e => ({ id: e.dataset.filterRow, order: e.dataset.filterOrder }))),
    rows.map(row => ({ id: row.id, order: String(row.orderId ?? 'NULL') })));
  assert.deepEqual(await svg.locator('[data-filter-edge]').evaluateAll(es => es.map(e => e.dataset.filterEdge)), rows.map(row => row.id));
  for (const row of rows) assert.equal(await svg.locator(dataSelector('filter-edge', row.id)).getAttribute('stroke-dasharray'), row.nullExtended ? '4 3' : null);
  await assertGeometry(svg, rows.map(row => ({
    path: dataSelector('filter-edge', row.id), source: `${dataSelector('filter-customer', row.customerId)} > rect`,
    target: `${dataSelector('filter-row', row.id)} > rect`, sourceSide: 'right', targetSide: 'left',
  })));
  assert.equal(await svg.locator('[data-filter-boundary]').count(), rows.length ? 1 : 0);
  if (rows.length) {
    assert.equal(await svg.locator('[data-filter-boundary]').getAttribute('data-filter-boundary'), f.finished ? 'result' : 'candidate');
    const containment = await svg.evaluate(root => {
      const outer = root.querySelector('[data-filter-boundary]').getBBox();
      return [...root.querySelectorAll('[data-filter-row] > rect')].every(e => {
        const b = e.getBBox(); return b.x >= outer.x && b.y >= outer.y && b.x + b.width <= outer.x + outer.width && b.y + b.height <= outer.y + outer.height;
      });
    });
    assert.equal(containment, true, 'Displayed filter rows must stay inside their result boundary');
  }
  assert.deepEqual(await lab.locator('[data-discarded-row]').evaluateAll(es => es.map(e => e.dataset.discardedRow)), f.discardedRows.map(row => row.id));
  for (const row of f.discardedRows) assert.equal(await svg.locator(dataSelector('filter-row', row.id)).count(), 0, 'Discarded row still appears in the result diagram');
  assert.equal(await lab.locator('[data-preserved-customers]').count(), f.finished ? 1 : 0);
  if (f.finished) assert.equal(await lab.locator('[data-preserved-customers]').getAttribute('data-preserved-customers'), f.preservedCustomerIds.join(','));
  assert.equal(await lab.locator('.db-query-sql code').textContent(), f.sql);
}
async function assertPageComparison(lab, indexModel, f) {
  const compared = ['scan', 'index'].map(path => indexModel.indexFrames({ layout: f.layout, query: f.query, path }).at(-1));
  assert.deepEqual(compared[0].returnedRowIds, compared[1].returnedRowIds);
  const maximum = Math.max(13, ...compared.map(frame => frame.measurements.totalPages.value));
  for (const frame of compared) {
    const row = lab.locator(dataSelector('path-summary', frame.path));
    assert.equal(await row.locator('[data-cost-value]').getAttribute('data-cost-value'), String(frame.measurements.totalPages.value));
    assert.deepEqual(await row.locator('[data-unit-kind]').evaluateAll(es => es.map(e => e.dataset.unitKind)),
      Array.from({ length: maximum }, (_, i) => i < frame.indexPageIds.length ? 'index' : i < frame.indexPageIds.length + frame.heapPageIds.length ? 'heap' : 'empty'));
    assert((await row.locator('small').innerText()).includes(`반환 ${frame.returnedRowIds.length}행`));
  }
  const geometry = await lab.locator('.db-page-units').evaluateAll(es => es.map(e => {
    const b = e.getBoundingClientRect(); return { x: b.x, width: b.width,
      units: [...e.children].map(unit => { const r = unit.getBoundingClientRect(); return { x: r.x, width: r.width }; }) };
  }));
  assertUnitGeometry(geometry);
  return compared.map(frame => ({ path: frame.path, totalPages: frame.measurements.totalPages.value, returnedRows: frame.returnedRowIds.length }));
}
async function assertIndexFrame(lab, f, count, selectedRowId = '') {
  await assertFrameText(lab, f, count);
  const svg = await visibleScene(lab), focus = expectedReadFocus(f, selectedRowId), reached = pointerIsReached(f, focus);
  const mobile = (await svg.getAttribute('viewBox')).split(/\s+/)[2] === '280';
  assert.equal(await svg.getAttribute('data-index-path'), f.path);
  assert.deepEqual(await svg.locator('[data-index-page]').evaluateAll(es => es.map(e => e.dataset.indexPage)), f.path === 'index' ? [f.fixture.rootPageId, ...f.fixture.leafPageIds] : []);
  assert.deepEqual(sorted(await svg.locator('[data-index-page][data-visited=true]').evaluateAll(es => es.map(e => e.dataset.indexPage))), sorted(f.indexPageIds));
  assert.deepEqual(await svg.locator('[data-heap-page]').evaluateAll(es => es.map(e => e.dataset.heapPage)), f.fixture.heapPages.map(page => page.id));
  assert.deepEqual(sorted(await svg.locator('[data-heap-page][data-visited=true]').evaluateAll(es => es.map(e => e.dataset.heapPage))), sorted(f.heapPageIds));
  assert.deepEqual(sorted(await svg.locator('[data-heap-row][data-returned=true]').evaluateAll(es => es.map(e => Number(e.dataset.heapRow)))), sorted(f.returnedRowIds));
  for (const page of f.fixture.heapPages) assert.deepEqual(await svg.locator(`${dataSelector('heap-page', page.id)} [data-heap-row]`).evaluateAll(es => es.map(e => ({ slot: Number(e.dataset.slot), rowId: Number(e.dataset.heapRow) }))), page.slots);
  for (const key of ['indexPages', 'heapPages', 'returnedRows']) assert.equal(await lab.locator(dataSelector('read-count', key)).innerText(), String(f.measurements[key].value));
  assert.equal(await lab.locator('[data-returned-ids]').getAttribute('data-returned-ids'), f.returnedRowIds.join(','));
  assert.equal(await lab.locator('[data-stop-kind]').count(), f.stopProof ? 1 : 0);
  if (f.stopProof) {
    assert.equal(await lab.locator('[data-stop-kind]').getAttribute('data-stop-kind'), f.stopProof.kind);
    assert((await lab.locator('[data-stop-kind]').innerText()).includes(f.stopProof.detail));
  }
  const edges = [];
  if (f.path === 'index') {
    assert.equal(await svg.locator('[data-focused-entry]').getAttribute('data-focused-entry'), focus?.id ?? '');
    assert.deepEqual(await svg.locator('[data-index-tree-edge]').evaluateAll(es => es.map(e => e.dataset.indexTreeEdge)), f.fixture.leafPageIds);
    for (const [n, leaf] of f.fixture.leafPageIds.entries()) edges.push({ path: dataSelector('index-tree-edge', leaf), source: `${dataSelector('index-page', f.fixture.rootPageId)} > rect`,
      target: `${dataSelector('index-page', leaf)} > rect`, sourceSide: 'bottom', targetSide: mobile && n >= 2 ? n % 2 === 0 ? 'left' : 'right' : 'top',
      avoidSelector: '[data-index-page^="index:leaf:"] > rect' });
    assert.equal(await svg.locator('[data-entry-leaf]').count(), focus ? 1 : 0);
    if (focus) {
      assert.equal(await svg.locator('[data-entry-leaf]').getAttribute('data-entry-leaf'), focus.leafPageId);
      assert((await svg.locator('[data-focused-entry]').textContent()).includes(String(focus.rowId)));
      edges.push({ path: '[data-entry-leaf]', source: `${dataSelector('index-page', focus.leafPageId)} > rect`, target: '[data-focused-entry] > rect', sourceSide: 'bottom', targetSide: 'top', avoidSelector: '[data-index-page^="index:leaf:"] > rect' });
    }
  }
  assert.equal(await svg.locator('[data-index-pointer]').count(), reached ? 1 : 0, 'Do not draw a returned-row pointer for a merely compared boundary key');
  if (reached) {
    const pointer = svg.locator('[data-index-pointer]');
    assert.equal(await pointer.getAttribute('data-index-pointer'), focus.id);
    assert.equal(await pointer.getAttribute('data-target-page'), focus.heapPageId);
    assert.equal(await pointer.getAttribute('data-target-slot'), String(focus.slot));
    assert.equal(await pointer.getAttribute('data-target-row'), String(focus.rowId));
    edges.push({ path: '[data-index-pointer]', source: '[data-focused-entry] > rect',
      target: `${dataSelector('heap-page', focus.heapPageId)} ${dataSelector('heap-row', focus.rowId)} > rect`,
      sourceSide: 'bottom', targetSide: focus.slot % 2 === 0 ? 'left' : 'right', avoidSelector: '[data-heap-row] > rect' });
  }
  await assertGeometry(svg, edges);
  assert.equal(await lab.locator('.db-query-sql code').textContent(), f.sql);
}
async function assertWriteFrame(lab, f, count) {
  await assertFrameText(lab, f, count);
  const svg = await visibleScene(lab), recordTouched = f.affectedStructureIds.includes('logical-records'), indexTouched = f.affectedStructureIds.includes('created-at-index');
  const entry = indexTouched ? f.indexChange.after : f.indexChange.before;
  const mobile = (await svg.getAttribute('viewBox')).split(/\s+/)[2] === '280';
  for (const key of ['logicalRecordChanges', 'indexEntryAdditions', 'indexEntryRemovals']) assert.equal(await lab.locator(dataSelector('write-count', key)).innerText(), String(f.measurements[key].value));
  assert.equal(await svg.locator('[data-write-record]').count(), recordTouched ? 1 : 0);
  assert.equal(await svg.locator('[data-write-index-edge]').count(), indexTouched && entry ? 1 : 0);
  assert.deepEqual(await svg.locator('[data-write-leaf]').evaluateAll(es => es.map(e => e.dataset.writeLeaf)), f.indexed ? [0, 1, 2, 3].map(n => `index:leaf:${n}`) : []);
  assert.deepEqual(await svg.locator('[data-write-entry]').evaluateAll(es => es.map(e => ({ rowId: Number(e.dataset.writeEntry), key: e.dataset.writeKey, leaf: e.closest('[data-write-leaf]').dataset.writeLeaf }))),
    f.indexed && entry ? [{ rowId: entry.rowId, key: entry.key, leaf: entry.leafPageId }] : []);
  const edges = [];
  if (recordTouched) {
    assert.equal(await svg.locator('[data-write-record]').getAttribute('data-write-record'), String(f.record.after.id));
    edges.push({ path: '[data-write-record]', source: ':scope > rect:nth-of-type(1)', target: ':scope > rect:nth-of-type(2)', sourceSide: 'right', targetSide: 'left' });
  }
  if (indexTouched && entry) {
    assert.equal(await svg.locator('[data-write-index-edge]').getAttribute('data-write-index-edge'), String(entry.rowId));
    edges.push({ path: '[data-write-index-edge]', source: ':scope > rect:nth-of-type(2)', target: '[data-write-entry] > rect', sourceSide: 'bottom',
      targetSide: mobile && Number(entry.leafPageId.split(':').at(-1)) >= 2 ? 'right' : 'top',
      avoidSelector: '[data-write-leaf] > rect', allowSelectors: [`${dataSelector('write-leaf', entry.leafPageId)} > rect`] });
    const caption = await svg.textContent();
    if (f.indexChange.before) { assert(caption.includes('현재 인덱스에서 빠짐')); assert.equal(f.measurements.indexEntryRemovals.value, 1); }
    else { assert(caption.includes('현재 인덱스에 들어옴')); assert(!caption.includes('현재 인덱스에서 빠짐')); assert.equal(f.measurements.indexEntryRemovals.value, 0); }
  }
  await assertGeometry(svg, edges);
  if (indexTouched && f.indexChange.before?.leafPageId !== f.indexChange.after?.leafPageId)
    assert.equal(await svg.locator(`${dataSelector('write-leaf', f.indexChange.before?.leafPageId ?? 'absent')} [data-write-entry]`).count(), 0, 'Old key entity remains in its old leaf');
}
async function assertComposite(lab, f) {
  assert.deepEqual(await lab.locator('[data-composite-entry]').evaluateAll(es => es.map(e => ({ id: e.dataset.compositeEntry,
    position: Number(e.dataset.position), matches: e.dataset.match === 'true', customerId: Number(e.closest('[data-composite-customer]').dataset.compositeCustomer) }))),
  f.entries.map(entry => ({ id: entry.id, position: entry.position, matches: entry.matches, customerId: entry.customerId })));
  for (const key of ['spanCount', 'matchingRows']) assert.equal(await lab.locator(dataSelector('composite-metric', key)).innerText(), String(f.measurements[key].value));
  const displayedSpans = await lab.locator('[data-composite-span]').evaluateAll(es => es.map(span => ({
    id: span.dataset.compositeSpan, customerId: Number(span.closest('[data-composite-customer]').dataset.compositeCustomer),
    entryIds: [...span.querySelectorAll('[data-composite-entry]')].map(entry => entry.dataset.compositeEntry),
    enclosesEntries: [...span.querySelectorAll('[data-composite-entry]')].every(entry => {
      const outer = span.getBoundingClientRect(), inner = entry.getBoundingClientRect();
      return inner.x >= outer.x && inner.y >= outer.y && inner.right <= outer.right + 1 && inner.bottom <= outer.bottom + 1;
    }),
  })));
  assert.equal(displayedSpans.length, f.measurements.spanCount.value);
  assert.deepEqual(displayedSpans, f.spans.map(span => ({ id: `${span.customerId}:${span.start}:${span.endExclusive}`,
    customerId: span.customerId, entryIds: span.entryIds, enclosesEntries: true })), 'Each green boundary must enclose exactly one model span');
  assert.equal(await lab.locator('[data-composite-returned]').getAttribute('data-composite-returned'), f.returnedRowIds.join(','));
  assert.equal(await lab.locator('.db-query-sql code').textContent(), f.sql);
  const groups = await lab.locator('[data-composite-customer]').evaluateAll(es => es.map(group => {
    const box = group.getBoundingClientRect();
    return { id: Number(group.dataset.compositeCustomer), box: { x: box.x, y: box.y, right: box.right, bottom: box.bottom },
      entries: [...group.querySelectorAll('[data-composite-entry]')].map(e => {
        const b = e.getBoundingClientRect(); return { id: e.dataset.compositeEntry, position: Number(e.dataset.position), match: e.dataset.match === 'true', x: b.x, y: b.y, right: b.right, bottom: b.bottom };
      }) };
  }));
  const spans = [];
  for (const group of groups) {
    for (let i = 0; i < group.entries.length; i++) {
      const entry = group.entries[i], previous = group.entries[i - 1];
      assert(entry.x >= group.box.x && entry.right <= group.box.right + 1 && entry.y >= group.box.y && entry.bottom <= group.box.bottom + 1, 'Entry escaped its customer boundary');
      if (previous) assert(entry.y >= previous.y - 1 && (entry.y > previous.y + 1 || entry.x >= previous.right - 1), 'Composite key order reverses visually');
      for (const earlier of group.entries.slice(0, i)) assert(entry.x >= earlier.right - 1 || entry.right <= earlier.x + 1 ||
        entry.y >= earlier.bottom - 1 || entry.bottom <= earlier.y + 1, 'Composite entry rectangles overlap');
      if (!entry.match) continue;
      let span = spans.at(-1);
      if (!span || span.customerId !== group.id || span.endExclusive !== entry.position) {
        span = { customerId: group.id, start: entry.position, endExclusive: entry.position, entryIds: [] }; spans.push(span);
      }
      span.endExclusive = entry.position + 1; span.entryIds.push(entry.id);
    }
  }
  assert.deepEqual(spans, f.spans.map(span => ({ customerId: span.customerId, start: span.start, endExclusive: span.endExclusive, entryIds: span.entryIds })));
}
async function selectSettings(lab, settings) {
  // Replay resets timers even if selectOption chooses the value already selected.
  await lab.getByRole('button', { name: '다시 보기', exact: true }).click();
  for (const [label, value] of settings) await lab.getByLabel(label, { exact: true }).selectOption(String(value));
}
async function eachFrame(lab, frames, assertion, onFrame = async () => {}) {
  for (let i = 0; i < frames.length; i++) {
    await assertion(lab, frames[i], frames.length); await onFrame(frames[i]);
    if (i < frames.length - 1) await lab.getByRole('button', { name: '다음 단계', exact: true }).click();
  }
}
async function snapBState(page, name, lab) {
  // A full lab capture keeps controls, the actual diagram, and its effect together on mobile.
  // These captures still require separate human review; no visual pass is inferred here.
  await lab.locator('.db-controls').scrollIntoViewIfNeeded();
  await snap(page, name, lab);
}
async function snapNearEffect(page, name, lab) {
  // A viewport capture complements the full-lab image: playback and the start of the
  // changed diagram stay close, rather than photographing only distant result text.
  const controls = lab.locator('.db-playback');
  await controls.evaluate(e => window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 12, behavior: 'instant' }));
  const viewport = page.viewportSize(), b = await controls.boundingBox();
  assert(b && b.y >= -1 && b.y < viewport.height / 2, 'Mobile playback is not near the captured effect');
  const file = name + '.png'; await page.screenshot({ path: path.join(out, file), fullPage: false, animations: 'disabled' });
  report.screenshots.push(file);
}
async function exerciseBPlayback(page, spec, motion) {
  await visit(page, spec.route); const lab = page.locator(`[data-db-lab="${spec.lab}"]`);
  await lab.getByRole('button', { name: '전체 초기화', exact: true }).click();
  await spec.assertion(lab, spec.initial[0], spec.initial.length);
  assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), motion === 'reduce');
  await page.waitForTimeout(1750);
  await spec.assertion(lab, spec.initial[0], spec.initial.length); // Never auto-start.
  const next = lab.getByRole('button', { name: '다음 단계', exact: true });
  await next.focus(); await page.keyboard.press('Enter');
  assert.equal(await next.evaluate(e => document.activeElement === e && e.matches(':focus-visible')), true);
  const focusStyle = await next.evaluate(e => { const s = getComputedStyle(e); return { outline: s.outlineStyle, width: parseFloat(s.outlineWidth), shadow: s.boxShadow }; });
  assert(focusStyle.outline !== 'none' && focusStyle.width > 0 || focusStyle.shadow !== 'none', 'Keyboard focus is not visibly styled');
  await spec.assertion(lab, spec.initial[1], spec.initial.length);
  await lab.getByRole('button', { name: '이전', exact: true }).focus(); await page.keyboard.press('Enter');
  await spec.assertion(lab, spec.initial[0], spec.initial.length);
  await lab.getByRole('button', { name: '재생', exact: true }).click();
  await page.waitForFunction(({ id, first }) => document.querySelector(`[data-db-lab="${id}"] .db-step-count`).textContent !== first,
    { id: spec.lab, first: `1 / ${spec.initial.length}단계` });
  await lab.getByRole('button', { name: '정지', exact: true }).click();
  const frozen = await lab.locator('.db-step-count').innerText(), drawing = await (await visibleScene(lab)).innerHTML();
  await page.waitForTimeout(1750);
  assert.equal(await lab.locator('.db-step-count').innerText(), frozen);
  assert.equal(await (await visibleScene(lab)).innerHTML(), drawing, 'Pause changed the diagram');
  assert.equal(await lab.evaluate(e => e.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length), 0);
  if (motion === 'no-preference') await snapBState(page, `${page.viewportSize().width}-b-${spec.lab}-normal-paused`, lab);
  await lab.getByRole('button', { name: '다시 보기', exact: true }).click();
  await spec.assertion(lab, spec.initial[0], spec.initial.length);
  const summary = lab.locator('.db-static > summary');
  if (!await summary.evaluate(e => e.parentElement.open)) { await summary.focus(); await page.keyboard.press('Enter'); }
  assert.deepEqual(await lab.locator('.db-static li strong').allTextContents(), spec.initial.map(frame => frame.title));
  assert.deepEqual(await lab.locator('.db-static li p').allTextContents(), spec.initial.map(frame => frame.detail));
  await assertExplanationBounds(lab, '.db-static li p');
  await snapBState(page, `${page.viewportSize().width}-b-${spec.lab}-${motion}-static-open`, lab);
  if (spec.prediction) await lab.getByLabel('먼저 예상해 보세요', { exact: true }).selectOption(spec.prediction);
  await lab.getByRole('button', { name: '재생', exact: true }).click();
  const setting = lab.getByLabel(spec.setting, { exact: true });
  await setting.focus(); await page.keyboard.press('Home'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  assert.equal(await setting.inputValue(), spec.changedValue, 'Keyboard must change the selected setting');
  if (spec.prediction) assert.equal(await lab.getByLabel('먼저 예상해 보세요', { exact: true }).inputValue(), '');
  await page.waitForTimeout(1750);
  await spec.assertion(lab, spec.changed[0], spec.changed.length);
  assert.equal(await lab.getByRole('button', { name: '정지', exact: true }).count(), 0, 'Setting changes must cancel the timer');
  await lab.getByRole('button', { name: '전체 초기화', exact: true }).click();
  for (const [label, value] of spec.defaults) assert.equal(await lab.getByLabel(label, { exact: true }).inputValue(), value);
  await spec.assertion(lab, spec.initial[0], spec.initial.length);
  await lab.getByRole('button', { name: '재생', exact: true }).click();
  await visit(page, '/database'); await page.waitForTimeout(1750); await visit(page, spec.route);
  await spec.assertion(page.locator(`[data-db-lab="${spec.lab}"]`), spec.initial[0], spec.initial.length);
  return { motion, frozen, staticSteps: spec.initial.length, keyboardSetting: spec.changedValue, routeCleanup: true };
}
function bPlaybackSpecs(queryModel, indexModel) {
  return [
    { route: '/database/queries-and-joins', lab: 'queries', initial: queryModel.queryFrames(), changed: queryModel.queryFrames({ customerId: 2 }), assertion: assertQueryFrame,
      setting: '조회할 고객', changedValue: '2', prediction: 'different', defaults: [['조회할 고객', '1'], ['짝이 없는 행', 'inner'], ['주문을 연결할 조건', 'confirmed'], ['강조할 세기 기준', 'count-star']] },
    { route: '/database/queries-and-joins', lab: 'join-filter', initial: queryModel.joinFilterFrames(), changed: queryModel.joinFilterFrames({ placement: 'where' }), assertion: assertFilterFrame,
      setting: '확정 조건의 위치', changedValue: 'where', prediction: 'position', defaults: [['확정 조건의 위치', 'on']] },
    { route: '/database/indexes-and-costs', lab: 'index-read', initial: indexModel.indexFrames(), changed: indexModel.indexFrames({ layout: 'scattered' }), assertion: assertIndexFrame,
      setting: '같은 행의 배치', changedValue: 'scattered', prediction: 'depends', defaults: [['찾을 날짜 범위', 'narrow'], ['같은 행의 배치', 'ordered'], ['조회 경로', 'index']] },
    { route: '/database/indexes-and-costs', lab: 'index-write', initial: indexModel.indexWriteFrames({ operation: 'indexed-key-update' }), changed: indexModel.indexWriteFrames({ operation: 'insert' }), assertion: assertWriteFrame,
      setting: '논리적 변경', changedValue: 'insert', defaults: [['논리적 변경', 'indexed-key-update'], ['별도 날짜 인덱스', 'true']] },
  ];
}
async function runBatchB(page, width, queryModel, indexModel, fixtureModel) {
  await visit(page, '/database/queries-and-joins'); const queries = page.locator('[data-db-lab=queries]');
  if (width === 320) await check('320 long SQL-term explanation wrapping regression', async () => {
    const explanation = queries.locator('.db-current p'), original = await explanation.textContent();
    const samples = ['COUNT(*)·COUNT(o.id)·COUNT(DISTINCT o.id)', 'COUNT(DISTINCT order_items.order_id)'];
    try {
      for (const text of samples) {
        await explanation.evaluate((e, value) => { e.textContent = value; }, text);
        await assertExplanationBounds(queries, '.db-current p');
      }
    } finally { await explanation.evaluate((e, value) => { e.textContent = value; }, original); }
    assert.equal(await explanation.textContent(), original);
    return { syntheticStyleFixture: true, restoredBeforeScenariosAndScreenshots: true, samples };
  });
  const queryShots = new Map([
    ['1:inner:confirmed:count-star', 'fork-count3'], ['1:inner:confirmed:count-distinct-order', 'distinct2'],
    ['3:left:confirmed:count-star', 'left-null-sum-null'], ['3:inner:confirmed:count-star', 'inner-no-group'],
    ['2:left:confirmed:count-order', 'cancelled-only-left-null'], ['2:inner:all:count-star', 'cancelled-order-included'],
  ]);
  for (const customerId of [1, 2, 3]) for (const join of queryModel.QUERY_JOINS) for (const status of queryModel.QUERY_STATUSES) for (const metric of queryModel.QUERY_METRICS) {
    await check(`${width} B03 query ${customerId} ${join} ${status} ${metric} every frame and geometry`, async () => {
      await selectSettings(queries, [['조회할 고객', customerId], ['짝이 없는 행', join], ['주문을 연결할 조건', status], ['강조할 세기 기준', metric]]);
      const frames = queryModel.queryFrames({ customerId, join, status, metric });
      await eachFrame(queries, frames, assertQueryFrame); await audit(page);
      const shot = queryShots.get(`${customerId}:${join}:${status}:${metric}`);
      if (shot) await snapBState(page, `${width}-b03-${shot}`, queries);
      if (width < 600 && shot === 'fork-count3') await snapNearEffect(page, `${width}-b03-controls-and-fork`, queries);
      return { frames: frames.length, resultRows: frames.at(-1).resultRows.map(row => row.id), metrics: frames.at(-1).groups.map(group => group.metrics) };
    });
  }
  await check(`${width} B03 historical order-item prices and drawn amounts`, async () => {
    await selectSettings(queries, [['조회할 고객', 1], ['짝이 없는 행', 'inner'], ['주문을 연결할 조건', 'confirmed'], ['강조할 세기 기준', 'count-star']]);
    const fixture = fixtureModel.createFixture(); fixture.products[0].unit_price_won = 15000; fixture.products[1].unit_price_won = 99000;
    const baseFrames = queryModel.queryFrames(), changedPrices = queryModel.queryFrames({ fixture });
    assert.deepEqual(changedPrices.at(-1).resultRows, baseFrames.at(-1).resultRows);
    assert.equal(changedPrices.at(-1).groups[0].metrics.sumWon, 36000);
    await eachFrame(queries, baseFrames, assertQueryFrame);
    assert.equal(await queries.locator('[data-query-metric=sumWon]').innerText(), '36,000원');
    assert.match(await queries.locator('.db-query-sql code').last().textContent(), /SUM\(i\.qty \* i\.unit_price_won\)/);
    return { displayedCapturedAmounts: changedPrices.at(-1).resultRows.map(row => row.amountWon), totalWon: 36000,
      scope: 'Current-price mutation is model-only; the UI is the fixed fixture and its drawn amounts/SQL are checked against that result.' };
  });
  const filter = page.locator('[data-db-lab=join-filter]');
  for (const placement of queryModel.JOIN_FILTER_PLACEMENTS) await check(`${width} B03 ${placement.toUpperCase()} candidate result and removed-row boundary`, async () => {
    await selectSettings(filter, [['확정 조건의 위치', placement]]); const frames = queryModel.joinFilterFrames({ placement });
    await eachFrame(filter, frames, assertFilterFrame, async f => {
      if (placement === 'where' && f.phase === 'join') await snapBState(page, `${width}-b03-where-candidates`, filter);
    });
    await audit(page); await snapBState(page, `${width}-b03-${placement}-final`, filter);
    return { kept: frames.at(-1).preservedCustomerIds, removed: frames.at(-1).discardedRows.map(row => row.id) };
  });
  await visit(page, '/database/indexes-and-costs'); const read = page.locator('[data-db-lab=index-read]');
  const indexShots = new Set(['narrow:ordered', 'narrow:scattered', 'wide:scattered', 'empty:ordered', 'all:scattered']);
  for (const layout of indexModel.INDEX_LAYOUTS) for (const query of indexModel.INDEX_QUERIES) for (const path of indexModel.INDEX_PATHS) {
    await check(`${width} B04 read ${layout} ${query} ${path} exact pages slots and boundary`, async () => {
      await selectSettings(read, [['같은 행의 배치', layout], ['찾을 날짜 범위', query], ['조회 경로', path]]);
      const frames = indexModel.indexFrames({ layout, query, path });
      await eachFrame(read, frames, assertIndexFrame, async f => {
        if (path === 'index' && query === 'wide' && f.event?.kind === 'leaf' && f.stopProof?.entry?.day === 33) {
          assert.equal(f.indexPageIds.length, 4); assert(!f.returnedRowIds.includes(2033));
          assert.equal(await (await visibleScene(read)).locator('[data-index-pointer]').count(), 0);
          if (layout === 'ordered') await snapBState(page, `${width}-b04-wide-third-leaf-boundary33-not-fetched`, read);
        }
      });
      const comparison = await assertPageComparison(read, indexModel, frames.at(-1)); await audit(page);
      if (path === 'index' && indexShots.has(`${query}:${layout}`)) await snapBState(page, `${width}-b04-${query}-${layout}-final`, read);
      if (width < 600 && path === 'index' && query === 'narrow' && layout === 'scattered') await snapNearEffect(page, `${width}-b04-controls-and-pointer`, read);
      if (path === 'index' && query === 'empty') {
        assert.deepEqual(frames.at(-1).indexPageIds, ['index:root', 'index:leaf:3']);
        assert.deepEqual(frames.at(-1).heapPageIds, []); assert.equal(frames.at(-1).measurements.totalPages.value, 2);
      }
      if (path === 'index' && frames.at(-1).returnedRowIds.length) {
        const f = frames.at(-1), focus = read.locator('.db-index-focus select');
        // Exercise both slot sides and the range's last returned entity, without extra screenshots.
        const choices = [...new Set([f.returnedRowIds[0], f.returnedRowIds[1], f.returnedRowIds.at(-1)])].filter(Boolean);
        for (const id of choices) { await focus.selectOption(String(id)); await assertIndexFrame(read, f, frames.length, String(id)); }
        assert.deepEqual(await assertPageComparison(read, indexModel, f), comparison, 'Pointer inspection must not change query costs');
      }
      return { frames: frames.length, indexPages: frames.at(-1).indexPageIds, heapPages: frames.at(-1).heapPageIds, comparison };
    });
  }
  const write = page.locator('[data-db-lab=index-write]');
  for (const operation of ['indexed-key-update', 'insert']) for (const indexed of [true, false]) await check(`${width} B04 write ${operation} indexed ${indexed} entity lifecycle and logical costs`, async () => {
    await selectSettings(write, [['논리적 변경', operation], ['별도 날짜 인덱스', indexed]]); const frames = indexModel.indexWriteFrames({ operation, indexed });
    await eachFrame(write, frames, assertWriteFrame, async f => {
      if (operation === 'indexed-key-update' && indexed && f.step === 0) await snapBState(page, `${width}-b04-write-update-old-L0`, write);
    });
    await audit(page);
    if (indexed || operation === 'indexed-key-update') await snapBState(page, `${width}-b04-write-${operation}-${indexed ? 'new-L3' : 'no-index'}-final`, write);
    return { frames: frames.length, changes: frames.at(-1).measurements, affectedLeaves: frames.at(-1).affectedLeafPageIds };
  });
  const composite = page.locator('[data-db-lab=composite-index]');
  for (const customer of ['all', '1', '2', '3']) await check(`${width} B04 composite ${customer} exact ordered entries and spans`, async () => {
    await composite.getByLabel('앞쪽 고객 키 조건', { exact: true }).selectOption(customer);
    const f = indexModel.compositeIndexSpans(customer === 'all' ? {} : { customerId: Number(customer) });
    await assertComposite(composite, f); await audit(page);
    if (customer === 'all' || customer === '1') await snapBState(page, `${width}-b04-composite-${customer === 'all' ? '3' : '1'}-spans`, composite);
    return { spans: f.spans, returnedRowIds: f.returnedRowIds };
  });
  await check(`${width} B04 composite keyboard and reset`, async () => {
    const select = composite.getByLabel('앞쪽 고객 키 조건', { exact: true });
    await select.focus(); await page.keyboard.press('Home'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
    assert.equal(await select.inputValue(), '1'); await assertComposite(composite, indexModel.compositeIndexSpans({ customerId: 1 }));
    await composite.getByRole('button', { name: '정렬 띠 초기화', exact: true }).focus(); await page.keyboard.press('Enter');
    assert.equal(await select.inputValue(), 'all'); await assertComposite(composite, indexModel.compositeIndexSpans());
  });
  for (const spec of bPlaybackSpecs(queryModel, indexModel)) await check(`${width} B ${spec.lab} reduced-motion keyboard pause settings reset static route cleanup`, () => exerciseBPlayback(page, spec, 'reduce'));
}

(async()=>{try{
  const model=await import(pathToFileURL(path.join(root,'src/simulations/database/foundation.mjs')));const fixtureModel=await import(pathToFileURL(path.join(root,'src/simulations/database/fixture.mjs')));
  const queryModel=await import(pathToFileURL(path.join(root,'src/simulations/database/queries.mjs'))),indexModel=await import(pathToFileURL(path.join(root,'src/simulations/database/indexes.mjs')));
  if(process.env.LIVE_URL){base=process.env.LIVE_URL.endsWith('/')?process.env.LIVE_URL:process.env.LIVE_URL+'/';await check('exact published assets match this dist',async()=>{const html=await fetch(base+'?dbqa='+Date.now()).then(r=>{assert.equal(r.ok,true);return r.text();});const local=fs.readFileSync(path.join(dist,'index.html'),'utf8');const assets=[...local.matchAll(/(?:src|href)="([^"]+\/assets\/[^\"]+)"/g)].map(m=>m[1]);assert(assets.length>=2);const compared=[];for(const url of assets){assert(html.includes(url),`Live HTML missing ${url}`);const remote=Buffer.from(await fetch(new URL(url,base)).then(r=>{assert.equal(r.ok,true);return r.arrayBuffer();}));const filename=url.split('/assets/')[1];const localBytes=fs.readFileSync(path.join(dist,'assets',filename));assert.equal(hash(remote),hash(localBytes));compared.push({asset:filename,sha256:hash(remote)});}return compared;});}
  else{server=http.createServer((req,res)=>{let name=decodeURIComponent(req.url.split('?')[0]).replace(/^\/my-books\//,'/');if(req.url.split('?')[0]==='/favicon.ico'){res.writeHead(204).end();return;}if(name==='/'||!path.extname(name))name='/index.html';const full=path.resolve(dist,'.'+name);if(!full.startsWith(dist+path.sep)){res.writeHead(403).end();return;}fs.readFile(full,(err,data)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(data);});});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}/my-books/`;}
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const width of [1440,390,320]){
    const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await context.newPage();wirePageDiagnostics(page,width,'reduce');
    for(const route of knownRoutes.slice(1))await check(`${width} render ${route}`,async()=>{await visit(page,route);const a=await audit(page);await snap(page,`${width}-${route.replaceAll('/','-')}`);return a;});
    await visit(page,'/database/files-and-database');const fileLab=page.locator('[data-db-lab=files]');
    for(const mode of model.FILE_MODES)for(const first of ['A','B'])await check(`${width} file ${mode} first ${first} every frame`,async()=>{await fileLab.getByLabel('처리 방식',{exact:true}).selectOption(mode);await fileLab.getByLabel('먼저 처리할 요청',{exact:true}).selectOption(first);const frames=model.fileWriteFrames({mode,first});for(let i=0;i<frames.length;i++){await assertFileFrame(fileLab,frames[i]);if(i<frames.length-1)await fileLab.getByRole('button',{name:'다음 단계',exact:true}).click();}await audit(page);if(first==='A'&&['race','database'].includes(mode))await snap(page,`${width}-files-${mode}-final`,fileLab);return {steps:frames.length,orders:frames.at(-1).committedOrders.length};});
    await check(`${width} reset replay keyboard pause and static alternative`,async()=>{await fileLab.getByRole('button',{name:'전체 초기화',exact:true}).click();assert.equal(await fileLab.getByLabel('처리 방식',{exact:true}).inputValue(),'race');const next=fileLab.getByRole('button',{name:'다음 단계',exact:true});await next.focus();await page.keyboard.press('Enter');await assertFileFrame(fileLab,model.fileWriteFrames()[1]);const beforePlay=await fileLab.locator('.db-step-count').innerText();await fileLab.getByRole('button',{name:'재생',exact:true}).click();await page.waitForFunction(before=>document.querySelector('[data-db-lab=files] .db-step-count').textContent!==before,beforePlay);await fileLab.getByRole('button',{name:'정지',exact:true}).click();const frozen=await fileLab.locator('.db-step-count').innerText();await page.waitForTimeout(1750);assert.equal(await fileLab.locator('.db-step-count').innerText(),frozen);await fileLab.getByRole('button',{name:'다시 보기',exact:true}).click();await assertFileFrame(fileLab,model.fileWriteFrames()[0]);await fileLab.getByText('모든 단계 · 움직임 없이 읽기',{exact:true}).click();assert.equal(await fileLab.locator('.db-static ol li').count(),model.fileWriteFrames().length);return{frozen};});
    await visit(page,'/database/tables-and-constraints');const relations=page.locator('[data-db-lab=relations]'),lab=page.locator('[data-db-lab=constraints]');
    await check(`${width} identity survives rename and duplicate names`,async()=>{const selector=relations.getByLabel('관계를 따라갈 고객',{exact:true});const paths=()=>relations.locator('svg:visible [data-relation]').evaluateAll(es=>es.map(e=>[e.dataset.from,e.dataset.to]));const initial=await paths();assert(initial.length>0);await relations.getByLabel('고객1 이름 변경',{exact:true}).check();assert.deepEqual(await paths(),initial);await relations.getByLabel('이름이 같은 고객 둘',{exact:true}).check();assert.deepEqual(await paths(),initial);await selector.selectOption('3');assert.equal((await paths()).length,0);assert((await relations.locator('.db-relation-summary').innerText()).includes('확정 주문 0건'));await relations.getByRole('button',{name:'관계 그림 초기화',exact:true}).click();assert.deepEqual(await paths(),initial);await snap(page,`${width}-key-relationships`,relations);return{edges:initial};});
    for(const focus of ['customer','order','product','all'])for(const customer of [1,2,3])await check(`${width} visible FK ${focus} customer ${customer}`,async()=>{
      await relations.getByLabel('따라갈 외래키',{exact:true}).selectOption(focus);await relations.getByLabel('관계를 따라갈 고객',{exact:true}).selectOption(String(customer));const fixture=fixtureModel.createFixture();
      const orders=new Set(fixture.orders.filter(o=>o.customer_id===customer).map(o=>o.id));const keys=new Set([...fixture.orders.filter(o=>orders.has(o.id)).map(o=>fixtureModel.rowKey('orders',o)),...fixture.order_items.filter(i=>orders.has(i.order_id)).map(i=>fixtureModel.rowKey('order_items',i))]);
      const parent={customer:'customers',order:'orders',product:'products'}[focus];const expected=fixtureModel.fixtureRelations(fixture).filter(e=>keys.has(e.from.rowKey)&&(focus==='all'||e.to.table===parent));const svg=relations.locator('svg:visible');assert.equal(await svg.count(),1);
      assert.deepEqual(await svg.locator('[data-relation]').evaluateAll(es=>es.map(e=>({id:e.dataset.relation,from:e.dataset.from,to:e.dataset.to,column:e.dataset.column}))),expected.map(e=>({id:e.id,from:e.from.rowKey,to:e.to.rowKey,column:e.from.column})));
      const endpoints=await svg.evaluate(svg=>[...svg.querySelectorAll('path[data-relation]')].map(p=>{const start=p.getPointAtLength(0),end=p.getPointAtLength(p.getTotalLength());const box=key=>svg.querySelector(`[data-row-key="${key}"] rect`).getBBox();const a=box(p.dataset.from),b=box(p.dataset.to);return{id:p.dataset.relation,start:{x:start.x,y:start.y},end:{x:end.x,y:end.y},a:{x:a.x,y:a.y,w:a.width,h:a.height},b:{x:b.x,y:b.y,w:b.width,h:b.height}};}));
      for(const e of endpoints){assert(Math.abs(e.start.y-e.a.y-e.a.h/2)<.1,`FK start misses source row ${e.id}`);assert(Math.abs(e.end.y-e.b.y-e.b.h/2)<.1,`FK end misses parent row ${e.id}`);assert(Math.min(Math.abs(e.start.x-e.a.x),Math.abs(e.start.x-e.a.x-e.a.w))<=2);assert(Math.min(Math.abs(e.end.x-e.b.x),Math.abs(e.end.x-e.b.x-e.b.w))<=2);}
      await audit(page);if(customer===1)await snap(page,`${width}-key-${focus}`,relations);return{edges:expected.length,endpoints};
    });
    for(const scenario of model.CONSTRAINT_SCENARIOS)for(const notNull of [true,false])await check(`${width} constraints ${scenario} notNull ${notNull}`,async()=>{await lab.getByLabel('넣어 볼 기록',{exact:true}).selectOption(scenario);await lab.getByLabel('수량의 필수 값 규칙',{exact:true}).selectOption(String(notNull));const frames=model.constraintFrames({scenario,notNull});for(let i=0;i<frames.length;i++){const f=frames[i];assert.equal(await lab.locator('.db-candidate').getAttribute('data-candidate-status'),f.candidate.status);assert.deepEqual(await lab.locator('.db-checks li').evaluateAll(es=>es.map(e=>e.dataset.result)),f.checks.map(c=>c.result));const links=f.candidate.status==='accepted'?f.edges.filter(e=>e.from.rowKey===f.candidate.rowKey):f.candidateEdges;assert.deepEqual(await lab.locator('svg [data-from]').evaluateAll(es=>es.map(e=>[e.dataset.from,e.dataset.to])),links.map(e=>[e.from.rowKey,e.to.rowKey]));assert.equal(await lab.locator('.db-store [data-status=accepted]').count(),f.accepted===true?1:0);const txt=await lab.locator('.db-store').innerText();assert(txt.includes(`고객 ${f.fixture.customers.length}행`));assert(txt.includes(`주문 ${f.fixture.orders.length}행`));assert(txt.includes(`항목 ${f.fixture.order_items.length}행`));if(i<frames.length-1)await lab.getByRole('button',{name:'다음 단계',exact:true}).click();}await audit(page);if((scenario==='null-qty'&&!notNull)||(scenario==='missing-fk'&&notNull)||(scenario==='normal'&&notNull)||(scenario==='empty-order'&&notNull))await snap(page,`${width}-constraints-${scenario}-${notNull}`,lab);return{accepted:frames.at(-1).accepted};});
    await check(`${width} settings reset and route cleanup`,async()=>{await lab.getByRole('button',{name:'다시 보기',exact:true}).click();await lab.getByLabel('먼저 예상해 보세요',{exact:true}).selectOption('yes');await lab.getByRole('button',{name:'재생',exact:true}).click();await lab.getByLabel('넣어 볼 기록',{exact:true}).selectOption('zero-qty');assert.equal(await lab.getByLabel('먼저 예상해 보세요',{exact:true}).inputValue(),'');await page.waitForTimeout(1750);assert.equal(await lab.locator('.db-step-count').innerText(),'1 / 3단계');await lab.getByRole('button',{name:'전체 초기화',exact:true}).click();assert.equal(await lab.getByLabel('넣어 볼 기록',{exact:true}).inputValue(),'missing-fk');await lab.getByRole('button',{name:'재생',exact:true}).click();await visit(page,'/database');await page.waitForTimeout(1750);await visit(page,'/database/tables-and-constraints');assert.equal(await page.locator('[data-db-lab=constraints] .db-step-count').innerText(),'1 / 3단계');});
    await check(`${width} book filter and reading storage preserve unknown IDs`,async()=>{await page.evaluate(()=>localStorage.setItem('my-books:read:v1',JSON.stringify(['unknown/keep','database/files-and-database'])));await visit(page,'/');await page.reload();await page.getByRole('button',{name:/^IT·기술/}).click();assert.equal(await page.locator('a.home-book[href="#/database"]').count(),1);assert.equal(await page.locator('a.home-book[href="#/database"] .home-book-volume').innerText(),'IT·기술 4권');assert((await page.locator('a.home-book[href="#/database"]').innerText()).includes(`1 / ${chapters.length}`));await page.locator('a.home-book[href="#/database"]').click();assert.equal(await page.locator('.book-volume').innerText(),'IT·기술 4권');await page.locator('nav[aria-label="챕터 목차"]').getByRole('link',{name:/01.*파일 다음/}).click();const readButton=page.getByRole('button',{name:/읽음/}).last();await readButton.click();await page.reload();const ids=await page.evaluate(()=>JSON.parse(localStorage.getItem('my-books:read:v1')));assert(ids.includes('unknown/keep'));assert(!ids.includes('database/files-and-database'));await page.getByRole('button',{name:'읽음으로 표시',exact:true}).click();await page.reload();await page.getByRole('button',{name:'✓ 읽음 · 표시 취소',exact:true}).waitFor();const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('my-books:read:v1')));assert(restored.includes('unknown/keep'));assert(restored.includes('database/files-and-database'));return{ids,restored};});
    await runBatchB(page,width,queryModel,indexModel,fixtureModel);
    await context.close();
  }
  // Reduced motion is the primary three-width matrix; a separate real context proves normal-motion controls too.
  const normalContext = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'no-preference' });
  const normalPage = await normalContext.newPage();
  wirePageDiagnostics(normalPage, 390, 'no-preference');
  for (const spec of bPlaybackSpecs(queryModel, indexModel)) await check(`390 B ${spec.lab} normal-motion keyboard pause settings reset static route cleanup`, () => exerciseBPlayback(normalPage, spec, 'no-preference'));
  await normalContext.close();
  await check('no browser runtime errors',async()=>{assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.resourceErrors,[]);});
} catch(error){report.fatal=String(error.stack||error);process.exitCode=1;}finally{await browser?.close();if(server)await new Promise(r=>server.close(r));report.finished=new Date().toISOString();report.passed=report.checks.filter(c=>c.status==='passed').length;report.failed=report.checks.filter(c=>c.status==='failed').length;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,failed:report.failed,fatal:report.fatal,screenshots:report.screenshots.length}));if(report.failed||report.fatal)process.exitCode=1;}})();

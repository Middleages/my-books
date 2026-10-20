/* Full housing book production/live verification. Screenshot creation is not visual review.
 * NODE_PATH=/tmp/insurance-qa/node_modules CHROME_PATH=/usr/bin/chromium node scripts/housing-browser-qa.cjs
 * LIVE_URL=https://middleages.github.io/my-books/ verifies exact published JS/CSS bytes first.
 */
// Match only the observed host-root favicon 404. Unknown provenance remains fatal.
// Reuse the reviewed tax-browser-diagnostics rule; never match console text alone.
const { classifyConsoleError } = require('./tax-browser-diagnostics.cjs');
function classifyResourceFailure(entry, base) {
  const kind = entry.event === 'response' && entry.status === 404
    ? classifyConsoleError({source:entry.source,message:'Failed to load resource: the server responded with a status of 404 ()'},base).kind
    : 'application';
  return {...entry,kind};
}
function installPageDiagnostics(page, results, base) {
  const retain=(entry,list)=>{
    results[list].push(entry);
    if(entry.kind==='host-default-favicon-404') results.nonApplicationDiagnostics.push(entry);
    else results.errors.push(entry);
  };
  page.on('pageerror',e=>results.errors.push({kind:'pageerror',message:String(e),page:page.url()}));
  page.on('console',m=>{
    if(m.type()!=='error') return;
    const location=m.location();
    retain(classifyConsoleError({source:location.url||'',lineNumber:location.lineNumber,columnNumber:location.columnNumber,message:m.text(),page:page.url()},base),'consoleDiagnostics');
  });
  page.on('response',r=>{
    if(r.status()<400) return;
    const request=r.request();
    retain(classifyResourceFailure({event:'response',source:r.url(),status:r.status(),method:request.method(),resourceType:request.resourceType(),page:page.url()},base),'resourceDiagnostics');
  });
  page.on('requestfailed',request=>retain(classifyResourceFailure({event:'requestfailed',source:request.url(),failure:request.failure()?.errorText||'unknown failure',method:request.method(),resourceType:request.resourceType(),page:page.url()},base),'resourceDiagnostics'));
}
module.exports={classifyConsoleError,classifyResourceFailure,installPageDiagnostics};

// Importing this verifier for diagnostic regression tests must not launch a browser.
if (require.main === module) {
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process"),
  { createHash } = require("node:crypto"),
  { pathToFileURL } = require("node:url");
const root = path.resolve(__dirname, ".."),
  dist = path.join(root, "dist"),
  out = path.join(root, "artifacts/housing-browser");
fs.mkdirSync(out, { recursive: true });
const catalog = fs.readFileSync(path.join(root, "src/catalog.ts"), "utf8");
const chapters = [
  ...catalog.matchAll(
    /id: "([^"]+)", bookId: "housing", readId: "([^"]+)", number: "(\d+)"/g,
  ),
].map((m) => ({ id: m[1], readId: m[2], number: m[3] }));
const requested = process.env.HOUSING_CHAPTERS?.split(',').filter(Boolean);
const selected = requested ? chapters.filter(c=>requested.includes(c.id)) : chapters;
if(requested) assert.deepEqual(selected.map(c=>c.id).sort(), [...requested].sort(), 'unknown requested chapter');
const allRoutes = new Set(
  [...catalog.matchAll(/id:\s*"([^"]+)"\s*,\s*bookId:\s*"([^"]+)"/g)].map(
    (m) => `#/${m[2]}/${m[1]}`,
  ),
);
const books = [
  ...catalog
    .split("export const books:")[1]
    .matchAll(/id:\s*"([^"]+)"\s*,\s*categoryId:\s*"([^"]+)"/g),
].map((m) => ({ id: m[1], category: m[2] }));
books.forEach((b) => allRoutes.add(`#/${b.id}`));
allRoutes.add("#/");
const sha = () =>
  execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
const results = {
  sourceSha: sha(),
  sourceChanges: execFileSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  }),
  mode: process.env.LIVE_URL ? "published" : "local-dist",
  started: new Date().toISOString(),
  checks: [],
  screenshots: [],
  errors: [],
  consoleDiagnostics: [],
  resourceDiagnostics: [],
  nonApplicationDiagnostics: [],
  visualReview:
    "Open scene PNGs separately. Automated checks do not prove readability or educational efficacy.",
};
let browser, server, base, model;
const hash = (b) => createHash("sha256").update(b).digest("hex"),
  safe = (s) => s.replace(/[^a-z0-9_-]/gi, "-");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
async function capture(page, name, selector) {
  const file = safe(name) + ".png";
  await page.evaluate(() => document.fonts.ready);
  if (selector)
    await page
      .locator(selector)
      .screenshot({ path: path.join(out, file), animations: "disabled" });
  else
    await page.screenshot({
      path: path.join(out, file),
      fullPage: true,
      animations: "disabled",
    });
  results.screenshots.push(file);
}
async function check(name, page, fn) {
  try {
    const detail = await fn();
    results.checks.push({ name, status: "passed", detail });
  } catch (e) {
    results.checks.push({
      name,
      status: "failed",
      error: e.stack || String(e),
    });
    if (page) await capture(page, "FAIL-" + name).catch(() => {});
  }
  console.log(results.checks.at(-1).status.toUpperCase(), name);
}
async function visit(page, id) {
  await page.goto(`${base}#/${id}`, { waitUntil: "networkidle" });
  await page.locator("main h1").waitFor();
  assert(!/찾을 수 없어요/.test(await page.locator("main h1").innerText()));
}
async function audit(page) {
  const x = await page.evaluate(() => {
    const main = document.querySelector("main");
    return {
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      h1: main.querySelectorAll("h1").length,
      raw: main.innerText.includes("**"),
      del: main.querySelectorAll("del").length,
      nested: main.querySelectorAll("p p").length,
      unlabelled: [...main.querySelectorAll("input,select")]
        .filter((e) => !e.labels?.length && !e.getAttribute("aria-label"))
        .map((e) => e.outerHTML),
      links: [...main.querySelectorAll('a[href^="#/"]')].map((e) =>
        e.getAttribute("href"),
      ),
      overflow: [...main.querySelectorAll("*")]
        .filter((e) => {
          if (e.closest(".housing-scroll") || !e.getClientRects().length)
            return false;
          const r = e.getBoundingClientRect();
          return r.right > innerWidth + 1 || r.left < -1;
        })
        .slice(0, 5)
        .map((e) => ({
          tag: e.tagName,
          class: e.className,
          text: e.textContent.slice(0, 80),
        })),
      figures: [...main.querySelectorAll(".housing-lab figure")].map((e) => ({
        caption: e.querySelector("figcaption")?.textContent,
        width: e.clientWidth,
      })),
    };
  });
  assert.equal(x.h1, 1);
  assert(x.scroll <= x.width + 1, JSON.stringify(x));
  assert.equal(x.raw, false, "raw markdown");
  assert.equal(x.del, 0);
  assert.equal(x.nested, 0);
  assert.deepEqual(x.unlabelled, []);
  assert.deepEqual(x.overflow, []);
  x.links.forEach((l) => assert(allRoutes.has(l), l));
  x.figures.forEach((f) => assert(f.caption && f.width > 0));
  return x;
}
async function setRange(lab, index, value) {
  await lab
    .locator("input[type=range]")
    .nth(index)
    .evaluate((e, n) => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      ).set;
      setter.call(e, n);
      e.dispatchEvent(new Event("input", { bubbles: true }));
      e.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
  await delay(250);
}
async function bars(page) {
  // Let the finite CSS transition reach its endpoint before comparing geometry.
  // Values may update immediately while an old width is still interpolating.
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll(".housing-fill")].every((e) => {
        const value = +e.dataset.value,
          max = +e.dataset.max;
        const actual = e.getBoundingClientRect().width,
          track = e.parentElement.getBoundingClientRect().width;
        return value === 0
          ? actual < 0.01
          : Math.abs(actual - (track * Math.abs(value)) / max) <= 1;
      }),
    undefined,
    { timeout: 3000 },
  );
  const rows = await page.locator(".housing-fill").evaluateAll((es) =>
    es.map((e) => ({
      value: +e.dataset.value,
      max: +e.dataset.max,
      width: e.getBoundingClientRect().width,
      track: e.parentElement.getBoundingClientRect().width,
    })),
  );
  for (const b of rows)
    assert(
      Math.abs(b.width - (b.track * Math.abs(b.value)) / b.max) <= 1,
      JSON.stringify(b),
    );
  return rows;
}
async function tables(page) {
  const lab = page.locator(".housing-lab").first(),
    main = page.locator("main");
  const before = await main.boundingBox();
  for (const summary of await lab.locator(".housing-static summary").all()) {
    await summary.focus();
    await page.keyboard.press("Enter");
    assert(await summary.evaluate((e) => e.parentElement.open));
  }
  await audit(page);
  const after = await main.boundingBox();
  assert(Math.abs(before.width - after.width) < 1, "table expanded main");
  for (const region of await lab.locator(".housing-scroll").all()) {
    assert.equal(await region.getAttribute("tabindex"), "0");
    assert(await region.getAttribute("aria-label"));
    await region.focus();
    const style = await region.evaluate(
      (e) => getComputedStyle(e).outlineStyle,
    );
    assert.notEqual(style, "none");
    if (await region.evaluate((e) => e.scrollWidth > e.clientWidth + 1)) {
      await page.keyboard.press("ArrowRight");
      await delay(200);
      assert(await region.evaluate((e) => e.scrollLeft > 0));
      await region.evaluate((e) => (e.scrollLeft = 0));
    }
  }
  return { rows: await lab.locator("tbody tr").count() };
}
async function playback(page) {
  const lab = page.locator(".housing-lab").first(),
    play = lab.getByRole("button", { name: "재생", exact: true });
  if (!(await play.count())) return { manualOnly: true };
  await play.click();
  await delay(1800);
  await lab.getByRole("button", { name: "정지", exact: true }).click();
  const before = await lab.locator(".money-playback").innerText();
  await delay(1800);
  assert.equal(
    await lab.locator(".money-playback").innerText(),
    before,
    "pause timer changed frame",
  );
  await lab.getByRole("button", { name: "한 단계 진행", exact: true }).click();
  await lab.getByRole("button", { name: "처음부터", exact: true }).click();
  assert.match(await lab.locator(".money-playback").innerText(), /0\s*\//);
  await play.click();
  const reset = lab.getByRole("button", {
    name: "조건까지 초기화",
    exact: true,
  });
  if (await reset.count()) await reset.click();
  else await lab.getByRole("button", { name: "처음부터", exact: true }).click();
  await delay(1800);
  assert.match(await lab.locator(".money-playback").innerText(), /0\s*\//);
  return { pauseReset: true };
}
async function scenarios(page, id) {
  const lab = page.locator('.housing-lab').first();
  if(id === 'housing-rights') {
    for(const mode of ['rent','jeonse','buy']) {
      await lab.locator('select').selectOption(mode);
      for(const fee of [false,true]) {
        await lab.locator('input[type=checkbox]').setChecked(fee);
        await lab.getByRole('button',{name:'처음부터',exact:true}).click();
        const expected=model.rightsFrames(mode,fee);
        for(let i=0;i<4;i++) {
          assert.equal(await lab.locator('.housing-rights-scene').getAttribute('data-step'),String(i));
          assert.equal(Number(await lab.locator('[data-net-worth]').getAttribute('data-net-worth')),expected.states[i].netWorth);
          assert.deepEqual(await lab.locator('.housing-fill').evaluateAll(es=>es.map(e=>+e.dataset.value)),[expected.states[i].cash,expected.states[i].claim,expected.states[i].home,expected.states[i].debt]);
          await bars(page);
          if(i<3) await lab.getByRole('button',{name:'한 단계 진행',exact:true}).click();
        }
      }
    }
    assert.match(await lab.innerText(), /담보권 ≠ 은행의 소유 지분/);
  }
  if(id === 'rent-and-deposit') {
    const timeline=lab.locator('.housing-rental-timeline');
    assert.equal(await timeline.locator('.money-playback').count(),1,'timeline owns its only playback controls');
    assert.equal(await lab.locator('.money-playback').count(),1,'no duplicate timer UI');
    const next=timeline.getByRole('button',{name:'한 단계 진행',exact:true});
    await next.scrollIntoViewIfNeeded();
    const near=await next.boundingBox(), panel=await timeline.locator('.housing-offer').first().boundingBox();
    assert(panel.y-(near.y+near.height)<260,'step control too far from changing timeline panel');
    await lab.getByRole('button',{name:'조건까지 초기화',exact:true}).click();
    assert.equal(await lab.locator('[data-offer-rate]').getAttribute('data-offer-rate'),'0.06');
    await lab.getByRole('button',{name:'보증금 차이 0',exact:true}).click();
    assert.equal(await lab.locator('[data-offer-rate]').getAttribute('data-offer-rate'),'undefined');
    await lab.getByRole('button',{name:'B가 더 작은 보증금',exact:true}).click();
    assert.equal(await lab.locator('[data-offer-rate]').getAttribute('data-offer-rate'),'undefined');
    await lab.getByRole('button',{name:'둘 다 더 비싼 B',exact:true}).click();
    assert.equal(await lab.locator('[data-offer-rate]').getAttribute('data-offer-rate'),'-0.03');
    await lab.getByRole('button',{name:'조건까지 초기화',exact:true}).click();
    await setRange(lab,6,2000);
    assert.equal(await lab.locator('[data-shortage]').getAttribute('data-shortage'),'40000000');
    await setRange(lab,3,100);
    assert.equal(await lab.locator('[data-shortage]').getAttribute('data-shortage'),'0');
    const r=model.rentComparison({loanShare:1,available:20e6});
    assert.deepEqual(await lab.locator('.housing-fill').evaluateAll(es=>es.map(e=>+e.dataset.value)),[r.depositA,r.rentA,r.depositB,r.rentB,r.ownAdditional,r.financed,0,0,0,0]);
    await bars(page);
    for(let i=0;i<4;i++) {
      assert.equal(await lab.locator('[data-timeline-step]').getAttribute('data-timeline-step'),String(i));
      const a=model.rentalTimeline({deposit:r.depositA,rent:r.rentA})[i], b=model.rentalTimeline({deposit:r.depositB,rent:r.rentB})[i];
      assert.deepEqual(await lab.locator('.housing-fill').evaluateAll(es=>es.map(e=>+e.dataset.value)),[r.depositA,r.rentA,r.depositB,r.rentB,r.ownAdditional,r.financed,a.claim,a.rentExpense,b.claim,b.rentExpense]);
      await bars(page);
      if(i<3) await lab.getByRole('button',{name:'한 단계 진행',exact:true}).click();
    }
  }
  if(id === 'rental-contract') {
    for(const caseId of Object.keys(model.contractCases)) {
      await lab.locator('select').selectOption(caseId);
      const frames=model.contractFrames(caseId);
      for(let i=0;i<4;i++) {
        assert.equal(await lab.locator('[data-contract-step]').getAttribute('data-contract-step'),String(i));
        if(i<=1) {
          assert.equal(await lab.locator('[data-address-match]').getAttribute('data-address-match'),String(frames[i].addressMatch));
          assert.equal(await lab.locator('[data-authority-shown]').getAttribute('data-authority-shown'),String(frames[i].authorityShown));
        }
        if(i===2) assert.equal(await lab.locator('[data-new-entry]').getAttribute('data-new-entry'),String(frames[i].newEntry));
        if(i===3) assert.equal(await lab.locator('.housing-event.observed').count(),4);
        if(i<3) await lab.getByRole('button',{name:'한 단계 진행',exact:true}).click();
      }
    }
    await lab.getByRole('button',{name:'처음부터',exact:true}).click();
    await lab.getByRole('button',{name:'한 단계 진행',exact:true}).click();
    await lab.getByRole('button',{name:'한 단계 진행',exact:true}).click();
    const control=await lab.locator('.money-playback').boundingBox(), scene=await lab.locator('.housing-record-history').boundingBox();
    assert(scene.y-(control.y+control.height)<100,'contract controls detached from changing evidence');
  }
  if(id === 'deposit-risk') {
    for(const guarantee of ['none','unknown','assumed']) for(const arrivalDay of [60,120]) {
      await lab.locator('select').nth(0).selectOption(guarantee);
      await lab.locator('select').nth(1).selectOption(String(arrivalDay));
      const frames=model.recoveryFrames({guarantee,arrivalDay});
      for(let i=0;i<frames.length;i++) {
        const f=frames[i];
        assert.equal(await lab.locator('[data-recovery-step]').getAttribute('data-recovery-step'),String(i));
        assert.equal(Number(await lab.locator('[data-cash-arrived]').getAttribute('data-cash-arrived')),f.totalCash);
        assert.equal(Number(await lab.locator('[data-institution-claim]').getAttribute('data-institution-claim')),f.institutionClaim);
        assert.deepEqual(await lab.locator('.housing-fill').evaluateAll(es=>es.map(e=>+e.dataset.value)),[f.proceeds,f.unrecovered,f.totalCash,f.remainingClaim]);
        await bars(page);
        if(i<frames.length-1) await lab.getByRole('button',{name:'한 단계 진행',exact:true}).click();
      }
    }
    await setRange(lab,0,0);
    assert.equal(await lab.locator('[data-allocated]').getAttribute('data-allocated'),'0');
    await page.waitForFunction(()=>[...document.querySelectorAll('[data-allocation]')].every(e=>e.getBoundingClientRect().width===0),undefined,{timeout:3000});
    assert.deepEqual(await lab.locator('[data-allocation]').evaluateAll(es=>es.map(e=>({value:+e.dataset.allocation,width:e.getBoundingClientRect().width}))),[{value:0,width:0},{value:0,width:0},{value:0,width:0}]);
    assert.match(await lab.locator('.housing-payment-tracks').innerText(),/배분액 없음/);
    await bars(page);
    await capture(page,`${page.viewportSize().width}-deposit-risk-zero`,'.housing-recovery-scene');
    await setRange(lab,0,16000);
    await lab.getByRole('button',{name:'한 단계 진행',exact:true}).click();
    await lab.getByRole('button',{name:'한 단계 진행',exact:true}).click();
    await lab.getByRole('button',{name:'한 단계 진행',exact:true}).click();
    assert.equal(await lab.locator('[data-cash-arrived]').getAttribute('data-cash-arrived'),'110000000');
    const control=await lab.locator('.money-playback').boundingBox(), scene=await lab.locator('.housing-payment-tracks').boundingBox();
    assert(scene.y-(control.y+control.height)<240,'recovery controls detached from changing cash scene');
    assert.match(await lab.innerText(),/양도와 현금 입금은 별개/);
    assert.match(await lab.locator('[role=status]').innerText(),/미현금화 원금/);
    assert.match(await lab.locator('summary').last().innerText(),/현금과 원금 기록/);
  }
  if(id === 'purchase-cash') {
    for(const timing of model.purchaseTimings) {
      await lab.locator('select').selectOption(timing);
      const frames=model.purchaseFrames({timing});
      for(let i=0;i<frames.length;i++) {
        const f=frames[i];
        assert.equal(await lab.locator('[data-purchase-step]').getAttribute('data-purchase-step'),String(i));
        assert.equal(await lab.locator('[data-purchase-failure]').getAttribute('data-purchase-failure'),f.failure?.kind??'none');
        assert.equal(Number(await lab.locator('[data-book-difference]').getAttribute('data-book-difference')),f.bookDifference);
        assert.deepEqual(await lab.locator('.housing-fill').evaluateAll(es=>es.map(e=>+e.dataset.value)),[f.cash,f.advance,f.home,f.debt]);
        await bars(page);
        if(i<frames.length-1) await lab.getByRole('button',{name:'한 단계 진행',exact:true}).click();
      }
    }
    await lab.getByText('시작자금·비용 바꾸기',{exact:true}).click();
    await setRange(lab,1,2000);
    await lab.getByRole('checkbox').uncheck();
    await lab.getByRole('button',{name:'현금만으로 지급 가능',exact:true}).click();
    assert.equal(await lab.locator('input[type=range]').nth(1).inputValue(),'500');
    assert(await lab.getByRole('checkbox').isChecked());
    for(let i=0;i<5;i++) await lab.getByRole('button',{name:'한 단계 진행',exact:true}).click();
    assert.equal(await lab.locator('[data-purchase-failure]').getAttribute('data-purchase-failure'),'none');
    assert.equal(await lab.locator('[data-purchase-debt]').getAttribute('data-purchase-debt'),'0');
    assert.match(await lab.innerText(),/실제 채무가 0이라는 판정이 아닙니다/);
    await setRange(lab,1,0);
    await lab.getByRole('checkbox').uncheck();
    await lab.getByRole('button',{name:'대출 실행 뒤 1원 부족',exact:true}).click();
    assert.equal(await lab.locator('input[type=range]').nth(1).inputValue(),'500');
    assert(await lab.getByRole('checkbox').isChecked());
    for(let i=0;i<5;i++) await lab.getByRole('button',{name:'한 단계 진행',exact:true}).click();
    assert.equal(await lab.locator('[data-purchase-failure]').getAttribute('data-purchase-failure'),'shortage');
    assert.equal(await lab.locator('[data-purchase-debt]').getAttribute('data-purchase-debt'),'80000000');
    assert.match(await lab.locator('.housing-closing-gate').innerText(),/부족 1원/);
    assert.match(await lab.locator('.housing-closing-gate').innerText(),/당시 확인 현금 대비 부족액 1원/);
    assert.match(await lab.locator('.housing-closing-gate').innerText(),/144,999,999원/);
    const f=model.purchaseFrames({startCash:124999999}).at(-1);
    assert.deepEqual(await lab.locator('.housing-fill').evaluateAll(es=>es.map(e=>+e.dataset.value)),[f.cash,f.advance,f.home,f.debt]);
    await bars(page);
    const control=await lab.locator('.money-playback').boundingBox(),scene=await lab.locator('.housing-closing-gate').boundingBox();
    assert(scene.y-(control.y+control.height)<400,'purchase controls detached from current dated cash');
  }
  if(id === 'mortgage-limits') {
    const base=model.mortgageMeasures();
    for(let i=0;i<4;i++) {
      assert.equal(await lab.locator('[data-budget-step]').getAttribute('data-budget-step'),String(i));
      assert.deepEqual(await lab.locator('.housing-fill').evaluateAll(es=>es.map(e=>+e.dataset.value)),[base.appraisal,base.principal,base.annualIncome,base.screenAnnual,base.takeHome,base.frames[i].out,base.frames[i].remaining]);
      await bars(page);
      if(i<3) await lab.getByRole('button',{name:'한 단계 진행',exact:true}).click();
    }
    await setRange(lab,2,5);
    assert.equal(Number(await lab.locator('[data-contract-payment]').getAttribute('data-contract-payment')),base.payment);
    assert.equal(Number(await lab.locator('[data-budget-remaining]').getAttribute('data-budget-remaining')),base.remaining);
    assert.equal(Number(await lab.locator('[data-annual-ratio]').getAttribute('data-annual-ratio')),model.mortgageMeasures({stress:5}).annualRatio);
    await setRange(lab,0,0);assert.equal(await lab.locator('[data-ltv]').getAttribute('data-ltv'),'undefined');
    await setRange(lab,1,0);assert.equal(await lab.locator('[data-annual-ratio]').getAttribute('data-annual-ratio'),'undefined');
    await bars(page);
    await lab.getByRole('button',{name:'조건까지 초기화',exact:true}).click();
    await lab.getByRole('button',{name:'생활비만 250만원',exact:true}).click();
    for(let i=0;i<3;i++) await lab.getByRole('button',{name:'한 단계 진행',exact:true}).click();
    const r=model.mortgageMeasures({living:2.5e6});
    assert.equal(Number(await lab.locator('[data-budget-remaining]').getAttribute('data-budget-remaining')),r.remaining);
    assert(r.remaining<0);assert.equal(await lab.locator('.housing-fill.negative').count(),1);
    await bars(page);
    const control=await lab.locator('.money-playback').boundingBox(),scene=await lab.locator('.housing-month-cash').boundingBox();
    assert(scene.y-(control.y+control.height)<100,'monthly controls detached from cash boundary');
  }
  await audit(page);
  return {id,verified:true};
}
async function assets() {
  const entry = (html) =>
    [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))["']/g)]
      .map((m) => path.basename(m[1]))
      .sort();
  const context = await browser.newContext();
  try {
    const expected = entry(
      fs.readFileSync(path.join(dist, "index.html"), "utf8"),
    );
    const response = await context.request.get(base);
    assert.equal(response.status(), 200);
    assert.deepEqual(entry(await response.text()), expected);
    const files = [];
    for (const file of fs
      .readdirSync(path.join(dist, "assets"))
      .filter((f) => /\.(js|css)$/.test(f))) {
      const remote = await context.request.get(`${base}assets/${file}`);
      assert.equal(remote.status(), 200);
      const bytes = await remote.body(),
        local = fs.readFileSync(path.join(dist, "assets", file));
      assert.deepEqual(bytes, local);
      files.push({ file, bytes: bytes.length, sha256: hash(bytes) });
    }
    return { files, expected };
  } finally {
    await context.close();
  }
}
(async () => {
  try {
    assert(
      [2, 4, 6, 8, 10, 12].includes(chapters.length),
      "published chapters must be a complete batch",
    );
    model = {...await import(pathToFileURL(path.join(root, "src/simulations/housing/foundations.mjs")).href), ...await import(pathToFileURL(path.join(root, "src/simulations/housing/contracts.mjs")).href), ...await import(pathToFileURL(path.join(root, "src/simulations/housing/purchase.mjs")).href)};
    if (process.env.LIVE_URL) base = process.env.LIVE_URL.replace(/\/?$/, "/");
    else {
      server = http.createServer((req, res) => {
        const route = decodeURIComponent(
          new URL(req.url, "http://localhost").pathname,
        );
        if (route.endsWith("favicon.ico")) {
          res.writeHead(204);
          return res.end();
        }
        const rel = route.replace(/^\/my-books\/?/, "") || "index.html",
          file = path.resolve(dist, rel);
        if (!file.startsWith(dist + path.sep) || !fs.existsSync(file)) {
          res.writeHead(404);
          return res.end();
        }
        res.setHeader(
          "Content-Type",
          {
            ".html": "text/html",
            ".js": "text/javascript",
            ".css": "text/css",
          }[path.extname(file)] || "application/octet-stream",
        );
        fs.createReadStream(file).pipe(res);
      });
      await new Promise((r) => server.listen(0, "127.0.0.1", r));
      base = `http://127.0.0.1:${server.address().port}/my-books/`;
    }
    browser = await require("playwright").chromium.launch({
      executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    results.browser = browser.version();
    results.base = base;
    await check("exact-served-assets", null, assets);
    for (const width of [1440, 850, 390, 320]) {
      const ctx = await browser.newContext({
          viewport: { width, height: 1000 },
        }),
        page = await ctx.newPage();
      installPageDiagnostics(page, results, base);
      for (const id of ["", ...selected.map((c) => c.id)]) {
        const route = "housing" + (id ? "/" + id : "");
        await check(`render-${width}-${id || "intro"}`, page, async () => {
          await visit(page, route);
          const a = await audit(page);
          await capture(page, `${width}-${id || "intro"}-initial`, ".housing-lab");
          if (width === 390 || width === 1440)
            await capture(page, `${width}-${id || "intro"}-full`);
          return a;
        });
        if (!id) continue;
        await check(`tables-${width}-${id}`, page, () => tables(page));
        await check(`scenarios-${width}-${id}`, page, async () => {
          await scenarios(page, id);
          await capture(page, `${width}-${id}-changed`, ".housing-lab");
        });
      }
      await check(`home-and-reading-${width}`, page, async () => {
        await visit(page, "");
        assert.equal(await page.locator(".home-book").count(), books.length);
        await page.getByRole("button", { name: /돈·경제/ }).click();
        assert.equal(
          await page.locator(".home-book").count(),
          books.filter((b) => b.category === "money").length,
        );
        await visit(page, "housing");
        assert.equal(
          await page.locator(".chapter-list > a").count(),
          chapters.length,
        );
        await page.evaluate(() =>
          localStorage.setItem(
            "my-books:read:v1",
            JSON.stringify([
              "future/unknown",
              "network/addressing",
              "parallel",
            ]),
          ),
        );
        await visit(page, "housing/housing-rights");
        await page.reload();
        await page
          .getByRole("button", { name: "읽음으로 표시", exact: true })
          .click();
        await page.reload();
        const read = await page.evaluate(() =>
          JSON.parse(localStorage.getItem("my-books:read:v1")),
        );
        assert(read.includes("housing/housing-rights"));
        assert(read.includes("future/unknown"));
        assert(read.includes("network/addressing"));
        assert(read.includes("parallel"));
        await visit(page, "");
        const progress = await page
          .locator('.home-book[href="#/housing"] progress')
          .evaluate((e) => ({ max: e.max, value: e.value }));
        assert.deepEqual(progress, { max: chapters.length, value: 1 });
        await audit(page);
        return progress;
      });
      await ctx.close();
    }
    const ctx = await browser.newContext({
        viewport: { width: 390, height: 1000 },
        reducedMotion: "reduce",
      }),
      page = await ctx.newPage();
    installPageDiagnostics(page, results, base);
    for (const c of selected) {
      await visit(page, "housing/" + c.id);
      await check(`reduced-motion-${c.id}`, page, async () => {
        await scenarios(page, c.id);
        await tables(page);
        const motion = await page.locator(".housing-lab *").evaluateAll((es) =>
          es.some((e) => {
            const s = getComputedStyle(e);
            return (
              s.animationName !== "none" || parseFloat(s.transitionDuration) > 0
            );
          }),
        );
        assert.equal(motion, false);
        await capture(page, `390-${c.id}-reduced-static`, ".housing-lab");
      });
    }
    for (const id of selected.map(c=>c.id)) {
      await visit(page,'housing/'+id);
      await check('play-pause-reset-'+id,page,()=>playback(page));
    }
    await check("keyboard-focus-and-history", page, async () => {
      await visit(page, "housing/rent-and-deposit");
      const range = page.locator(".housing-lab input[type=range]").nth(1);
      await range.focus();
      await page.keyboard.press("Tab");
      await page.keyboard.press("Shift+Tab");
      assert(
        await range.evaluate(
          (e) => document.activeElement === e && e.matches(":focus-visible"),
        ),
      );
      assert.notEqual(
        await range.evaluate((e) => getComputedStyle(e).outlineStyle),
        "none",
      );
      await page.keyboard.press("ArrowRight");
      assert.equal(await range.inputValue(), "6500");
      const next = "housing-rights";
      await visit(page, "housing/" + next);
      await page.goBack();
      assert(page.url().includes("rent-and-deposit"));
      await page.goForward();
      assert(page.url().includes(next));
    });
    for (const route of [
      "computer/parallel",
      "network/addressing",
      "money/plan",
      "economics/fiscal-policy",
      "investing/total-return",
      "insurance/payout",
      "tax/tax-events",
      "kubernetes/why-kubernetes",
    ])
      await check("existing-" + route, page, async () => {
        await visit(page, route);
        assert(allRoutes.has("#/" + route));
        assert((await page.locator("main h1").innerText()).length > 3);
        assert.equal(
          await page
            .getByRole("button", { name: "읽음으로 표시", exact: true })
            .count(),
          1,
        );
      });
    await ctx.close();
    assert.deepEqual(results.errors, [], "console/page errors");
  } catch (e) {
    results.fatal = e.stack || String(e);
  } finally {
    results.finished = new Date().toISOString();
    fs.writeFileSync(
      path.join(out, "results.json"),
      JSON.stringify(results, null, 2),
    );
    await browser?.close();
    await new Promise((r) => (server ? server.close(r) : r()));
    const failed = results.checks.filter((c) => c.status === "failed");
    console.log(
      JSON.stringify({
        checks: results.checks.length,
        failed: failed.length,
        errors: results.errors.length,
        fatal: results.fatal,
        screenshots: results.screenshots.length,
      }),
    );
    process.exitCode =
      failed.length || results.errors.length || results.fatal ? 1 : 0;
  }
})();

}

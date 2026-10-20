/* Full tax book production/live verification. Screenshot creation is not visual review.
 * NODE_PATH=/tmp/insurance-qa/node_modules CHROME_PATH=/usr/bin/chromium node scripts/tax-browser-qa.cjs
 * LIVE_URL=https://middleages.github.io/my-books/ verifies exact published JS/CSS bytes first.
 */
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process"),
  { createHash } = require("node:crypto"),
  { pathToFileURL } = require("node:url");
const root = path.resolve(__dirname, ".."),
  dist = path.join(root, "dist"),
  out = path.join(root, "artifacts/tax-browser");
fs.mkdirSync(out, { recursive: true });
const catalog = fs.readFileSync(path.join(root, "src/catalog.ts"), "utf8");
const chapters = [
  ...catalog.matchAll(
    /id: "([^"]+)", bookId: "tax", readId: "([^"]+)", number: "(\d+)"/g,
  ),
].map((m) => ({ id: m[1], readId: m[2], number: m[3] }));
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
          if (e.closest(".tax-scroll") || !e.getClientRects().length)
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
      figures: [...main.querySelectorAll(".tax-lab figure")].map((e) => ({
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
      [...document.querySelectorAll(".tax-fill")].every((e) => {
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
  const rows = await page.locator(".tax-fill").evaluateAll((es) =>
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
  const lab = page.locator(".tax-lab").first(),
    main = page.locator("main");
  const before = await main.boundingBox();
  for (const summary of await lab.locator(".tax-static summary").all()) {
    await summary.focus();
    await page.keyboard.press("Enter");
    assert(await summary.evaluate((e) => e.parentElement.open));
  }
  await audit(page);
  const after = await main.boundingBox();
  assert(Math.abs(before.width - after.width) < 1, "table expanded main");
  for (const region of await lab.locator(".tax-scroll").all()) {
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
  const lab = page.locator(".tax-lab").first(),
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
  const lab = page.locator(".tax-lab").first();
  if (id === "tax-events") {
    for (const v of ["salary", "shopping", "transfer", "holding", "gift"]) {
      await lab.locator("select").selectOption(v);
      assert(await lab.locator(`.tax-event-scene.${v}`).count());
    }
    assert.match(await lab.innerText(), /이전/);
  }
  if (id === "progressive-tax") {
    for (const n of [0, 100, 101, 300, 301, 400, 600]) {
      await lab.getByRole("button", { name: String(n), exact: true }).click();
      const r = await import(
        pathToFileURL(path.join(root, "src/simulations/tax/taxModel.mjs")).href
      );
      assert(
        (await lab.locator(".tax-result").innerText()).includes(
          r
            .progressiveTax(n)
            .tax.toLocaleString("ko-KR", { maximumFractionDigits: 4 }),
        ),
      );
      const data = r.progressiveTax(n);
      assert.deepEqual(
        await lab
          .locator(".tax-fill")
          .evaluateAll((es) => es.map((e) => +e.dataset.value)),
        [...data.parts.map((p) => p.base), data.tax],
      );
      await bars(page);
      const pieces = await lab
        .locator(".tax-base-stack i")
        .evaluateAll((es) =>
          es.map((e) => ({
            base: +e.dataset.base,
            width: e.getBoundingClientRect().width,
            track: e.parentElement.getBoundingClientRect().width,
          })),
        );
      assert.deepEqual(
        pieces.map((p) => p.base),
        data.parts.map((p) => p.base),
      );
      for (const piece of pieces)
        assert(Math.abs(piece.width - (piece.track * piece.base) / 600) <= 1);
      const stack = await lab.locator(".tax-base-stack").boundingBox(),
        track = await lab
          .locator(".tax-bracket-row .tax-track")
          .first()
          .boundingBox();
      assert(
        Math.abs(stack.x - track.x) < 1 &&
          Math.abs(stack.width - track.width) < 1,
        "total stack and bracket axes must coincide",
      );
    }
    await lab.getByRole("button", { name: "0", exact: true }).click();
    assert.match(await lab.locator(".tax-result").innerText(), /정의되지 않음/);
  }
  if (id === "withholding") {
    for (const n of [0, 15, 60]) {
      await setRange(lab, 0, n);
      const r = model.payroll({ withheld: n });
      assert(
        (await lab.locator(".tax-result").innerText()).includes(
          `통장 입금 ${r.net}`,
        ),
      );
      const vals = await lab
        .locator(".tax-stack i")
        .evaluateAll((es) => es.map((e) => +e.dataset.value));
      assert.deepEqual(
        vals,
        r.parts.map((p) => p.value),
      );
    }
  }
  if (id === "year-end-settlement") {
    for (const n of [0, 50, 70, 90, 150]) {
      await setRange(lab, 0, n);
      const r = model.settlement({ prepaid: n });
      assert(await lab.locator(".tax-cash-direction." + r.direction).count());
      assert(
        (await lab.locator(".tax-result").innerText()).includes(
          `차감세액 ${r.difference}`,
        ),
      );
      await bars(page);
    }
  }
  if (id === "value-added-tax") {
    for (const mode of ["taxable", "zero", "exempt"]) {
      await lab.locator("select").selectOption(mode);
      const r = model.vatChain({ mode });
      assert.deepEqual(
        await lab
          .locator(".tax-fill")
          .evaluateAll((es) => es.map((e) => +e.dataset.value)),
        r.stages.flatMap((s) => [s.output, s.credit]),
      );
      assert(
        (await lab.locator(".tax-result").innerText()).includes(
          `납부 계산의 합 ${r.totalRemit}`,
        ),
      );
      await bars(page);
    }
    await setRange(lab, 0, 500);
    assert.match(await lab.innerText(), /500/);
  }
  if (id === "investment-taxes") {
    for (const k of model.investmentKinds) {
      await lab.locator("select").nth(0).selectOption(k.id);
      assert.equal(await lab.locator(".tax-tree-root").innerText(), k.label);
    }
    await lab.locator("select").nth(1).selectOption("special");
    assert.match(await lab.innerText(), /특례계좌의 가입/);
    assert.match(await lab.locator(".tax-result").innerText(), /자료 부족/);
  }
  if (id === "tax-accounts") {
    for (const k of model.accountKinds) {
      await lab.locator("select").nth(0).selectOption(k.id);
      assert.match(await lab.locator(".tax-result").innerText(), /미확인/);
      for (let i = 1; i < 4; i++)
        await lab.locator("select").nth(i).selectOption("yes");
      assert.match(await lab.locator(".tax-result").innerText(), /별도 검토/);
      await lab.locator("select").nth(2).selectOption("no");
      assert.match(await lab.locator(".tax-result").innerText(), /불일치/);
    }
  }
  if (id === "housing-taxes") {
    for (let i = 0; i < 3; i++) {
      await lab.locator(".tax-housing-scene button").nth(i).click();
      assert.equal(
        await lab
          .locator(".tax-housing-scene button[aria-pressed=true]")
          .count(),
        1,
      );
      assert.match(
        await lab.locator(".tax-stage").innerText(),
        new RegExp(
          model
            .housingRoute(i)
            .current.check.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        ),
      );
    }
  }
  if (id === "gifts-inheritance") {
    await lab.locator("input[type=checkbox]").uncheck();
    assert.match(await lab.locator(".tax-result").innerText(), /계산 보류/);
    await lab.locator("input[type=checkbox]").check();
    await setRange(lab, 0, 0);
    assert.match(await lab.locator(".tax-result").innerText(), /과세표준 0/);
    await lab.locator("select").selectOption("inheritance");
    assert.match(await lab.locator(".tax-estate").innerText(), /상속재산 전체/);
    await bars(page);
  }
  if (id === "deductions-credits") {
    for (const [base, off] of [
      [400, 50],
      [0, 150],
      [100, 150],
      [600, 0],
    ]) {
      await setRange(lab, 0, base);
      await setRange(lab, 1, off);
      const values = await lab
        .locator(".tax-fill")
        .evaluateAll((es) => es.map((e) => +e.dataset.value));
      assert.deepEqual(
        values,
        model.deductionComparison(base, off).rows.map((r) => r.finalTax),
      );
      await bars(page);
    }
  }
  if (id === "tax-timeline") {
    for (const monthly of [0, 8, 12])
      for (const settleMonth of [14, 16, 18]) {
        await setRange(lab, 0, monthly);
        await lab.locator("select").nth(0).selectOption(String(settleMonth));
        await lab.locator("select").nth(1).selectOption("18");
        assert.match(
          await lab.locator(".tax-result").innerText(),
          /현재 누적 순유출 80/,
        );
        const r = model.taxTimeline({ monthly, settleMonth });
        const heights = await lab
          .locator(".tax-time-columns i")
          .evaluateAll((es) => es.map((e) => e.getBoundingClientRect().height));
        for (let i = 0; i < heights.length; i++)
          if (r.frames[i].cumulative === 0)
            assert.equal(heights[i], 0, "zero tax must paint no bar");
      }
  }
  if (id === "reading-tax-documents") {
    for (const d of model.taxDocuments) {
      await lab.locator("select").selectOption(d.id);
      for (let i = 0; i < d.rows.length; i++) {
        await lab.locator(".tax-paper button").nth(i).click();
        const order = ["fact", "assumption", "unknown"].indexOf(d.rows[i].kind);
        await lab.locator("input[type=radio]").nth(order).check();
        assert.match(
          await lab.locator("[role=status]").innerText(),
          /맞습니다/,
        );
      }
    }
  }
  for (const prediction of await lab.locator(".tax-prediction").all()) {
    await prediction.locator('input[value="yes"]').check();
    await prediction
      .getByRole("button", { name: "이유 확인", exact: true })
      .click();
    assert(
      (await prediction.locator('[role="status"]').innerText()).length > 25,
    );
    await prediction.locator('input[value="no"]').check();
    assert.equal(await prediction.locator('[role="status"]').count(), 0);
    await prediction
      .getByRole("button", { name: "이유 확인", exact: true })
      .click();
    assert(
      (await prediction.locator('[role="status"]').innerText()).length > 25,
    );
  }
  await audit(page);
  return { id, verified: true };
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
    if (chapters.length >= 4)
      model = await import(
        pathToFileURL(path.join(root, "src/simulations/tax/lifeModel.mjs")).href
      );
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
      page.on("pageerror", (e) => results.errors.push(String(e)));
      page.on("console", (m) => {
        if (m.type() === "error")
          results.errors.push({ source: m.location().url, message: m.text(), page: page.url() });
      });
      for (const id of ["", ...chapters.map((c) => c.id)]) {
        const route = "tax" + (id ? "/" + id : "");
        await check(`render-${width}-${id || "intro"}`, page, async () => {
          await visit(page, route);
          const a = await audit(page);
          await capture(page, `${width}-${id || "intro"}-initial`, ".tax-lab");
          if (width === 390 || width === 1440)
            await capture(page, `${width}-${id || "intro"}-full`);
          return a;
        });
        if (!id) continue;
        await check(`tables-${width}-${id}`, page, () => tables(page));
        await check(`scenarios-${width}-${id}`, page, async () => {
          await scenarios(page, id);
          await capture(page, `${width}-${id}-changed`, ".tax-lab");
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
        await visit(page, "tax");
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
        await visit(page, "tax/tax-events");
        await page.reload();
        await page
          .getByRole("button", { name: "읽음으로 표시", exact: true })
          .click();
        await page.reload();
        const read = await page.evaluate(() =>
          JSON.parse(localStorage.getItem("my-books:read:v1")),
        );
        assert(read.includes("tax/tax-events"));
        assert(read.includes("future/unknown"));
        assert(read.includes("network/addressing"));
        assert(read.includes("parallel"));
        await visit(page, "");
        const progress = await page
          .locator('.home-book[href="#/tax"] progress')
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
    page.on("pageerror", (e) => results.errors.push(String(e)));
    for (const c of chapters) {
      await visit(page, "tax/" + c.id);
      await check(`reduced-motion-${c.id}`, page, async () => {
        await scenarios(page, c.id);
        await tables(page);
        const motion = await page.locator(".tax-lab *").evaluateAll((es) =>
          es.some((e) => {
            const s = getComputedStyle(e);
            return (
              s.animationName !== "none" || parseFloat(s.transitionDuration) > 0
            );
          }),
        );
        assert.equal(motion, false);
        await capture(page, `390-${c.id}-reduced-static`, ".tax-lab");
      });
    }
    for (const id of [
      "tax-events",
      "progressive-tax",
      "withholding",
      "year-end-settlement",
      "value-added-tax",
      "investment-taxes",
      "housing-taxes",
      "gifts-inheritance",
      "tax-timeline",
    ].filter((id) => chapters.some((c) => c.id === id))) {
      await visit(page, "tax/" + id);
      await check(`play-pause-reset-${id}`, page, () => playback(page));
    }
    await check("keyboard-focus-and-history", page, async () => {
      await visit(page, "tax/progressive-tax");
      const range = page.locator(".tax-lab input[type=range]");
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
      assert.equal(await range.inputValue(), "401");
      const next = chapters.length >= 4 ? "withholding" : "tax-events";
      await visit(page, "tax/" + next);
      await page.goBack();
      assert(page.url().includes("progressive-tax"));
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

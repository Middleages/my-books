import test from "node:test";
import assert from "node:assert/strict";
import {
  cycleRows,
  cycleSnapshot,
  changeRate,
  outputGap,
  newsCase,
  newsIds,
  categories,
  assessNews,
} from "../src/simulations/economics/cycles-news.mjs";
test("one series produces levels, rates, past peaks and sector aggregation", () => {
  const rows = cycleRows();
  assert.equal(rows.length, 9);
  for (const r of rows) assert.equal(r.output, (r.a + r.b) / 2);
  const r = cycleSnapshot(6);
  assert.equal(r.output, 97);
  assert.equal(r.previous, 96);
  assert.ok(Math.abs(r.growth - 100 / 96) < 1e-9);
  assert.equal(r.peak, 108);
  assert.ok(r.fromPeak < 0);
  assert.equal(r.a, 110);
  assert.equal(r.b, 84);
  assert.equal(cycleSnapshot(0).growth, null);
  assert.deepEqual(cycleSnapshot(6), cycleSnapshot(6));
});
test("positive quarter rate can coexist with negative annual rate and weak employment", () => {
  const r = cycleSnapshot(6);
  assert.ok(r.growth > 0);
  assert.ok(r.annualGrowth < 0);
  assert.ok(r.employmentGrowth < 0);
  assert.equal(cycleSnapshot(3).annualGrowth, null);
});
test("fictional indicator turning points differ, without producing a phase verdict", () => {
  const rows = cycleRows();
  const minimum = (key) =>
    rows.reduce((a, r) => (r[key] < a[key] ? r : a), rows[0]).quarter;
  assert.equal(minimum("orders"), 4);
  assert.equal(minimum("output"), 5);
  assert.equal(minimum("employment"), 6);
  assert.equal("recession" in cycleSnapshot(6), false);
});
test("zero base is undefined and output gap depends on positive estimated potential", () => {
  assert.equal(changeRate(100, 0), null);
  assert.equal(changeRate(0, 100), -100);
  assert.ok(outputGap(97, 94).gap > 0);
  assert.ok(outputGap(97, 102).gap < 0);
  assert.equal(outputGap(97, 97).gap, 0);
  assert.equal(outputGap(0, 100).gap, -100);
});
test("news price observations match reused market while quantities distinguish demand and cost cases", () => {
  const d = newsCase("demand"),
    c = newsCase("cost");
  assert.equal(d.market.equilibrium.price, 4500);
  assert.equal(c.market.equilibrium.price, 4500);
  assert.equal(d.market.equilibrium.quantity, 70);
  assert.equal(c.market.equilibrium.quantity, 30);
  assert.match(
    d.claims.find((c) => c.category === "observation").text,
    /4,500/,
  );
  assert.equal(newsCase("mixed").cycle.output, 97);
});
test("classification reports reasons per claim, accepts missing choices and separates evidence roles", () => {
  for (const id of newsIds) {
    const c = newsCase(id);
    assert.equal(new Set(c.claims.map((c) => c.category)).size, 4);
    assert.equal(assessNews(id, {}, []).correct, 0);
    const answers = Object.fromEntries(c.claims.map((c) => [c.id, c.category]));
    const r = assessNews(id, answers, [c.evidence[0].id]);
    assert.equal(r.correct, 4);
    assert.equal(r.feedback.length, 4);
    assert.ok(r.feedback.every((f) => f.reason.length > 10));
    assert.equal(r.evidence.length, 1);
    assert.ok(r.evidence[0].reason.length > 10);
    const wrong = Object.fromEntries(
      c.claims.map((c) => [
        c.id,
        categories.find((t) => t.id !== c.category).id,
      ]),
    );
    assert.equal(assessNews(id, wrong, []).correct, 0);
  }
});
test("invalid ranges, identifiers and classifications rejected; returned data cannot corrupt later runs", () => {
  for (const fn of [
    () => cycleSnapshot(-1),
    () => cycleSnapshot(1.5),
    () => cycleSnapshot(9),
    () => outputGap(97, 0),
    () => changeRate(NaN, 1),
    () => newsCase("unknown"),
    () => assessNews("demand", { fact: "bogus" }, []),
    () => assessNews("cost", {}, ["bogus"]),
  ])
    assert.throws(fn, RangeError);
  const r = cycleRows();
  r[0].output = 0;
  assert.equal(cycleRows()[0].output, 100);
  const c = newsCase("demand");
  c.claims[0].text = "changed";
  assert.notEqual(newsCase("demand").claims[0].text, "changed");
});

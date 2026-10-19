import test from "node:test";
import assert from "node:assert/strict";
import {
  basket,
  pricePath,
  realRate,
  rateComparison,
} from "../src/simulations/economics/prices-rates.mjs";
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
test("fixed basket expenditure weights determine index and contributions", () => {
  const r = basket(75, 20, -10);
  near(r.index, 112.5);
  near(r.items[0].contribution, 15);
  near(r.items[1].contribution, -2.5);
  near(
    r.items.reduce((s, x) => s + x.cost, 0),
    r.cost,
  );
  near(basket(0, 20, -10).index, 90);
  near(basket(100, 20, -10).index, 120);
});
test("disinflation keeps level rising; deflation lowers it; flat is zero", () => {
  const a = pricePath("disinflation"),
    b = pricePath("deflation");
  assert.ok(a[14].index > a[13].index);
  assert.ok(a[14].yoy < a[13].yoy);
  assert.ok(b[14].index < b[13].index);
  assert.equal(pricePath("flat")[14].mom, 0);
});
test("base effect changes annual rate despite unchanged current price", () => {
  const r = pricePath("base");
  assert.equal(r[12].index, r[13].index);
  assert.equal(r[13].mom, 0);
  near(r[12].yoy, 10);
  near(r[13].yoy, 0);
  assert.equal(r[0].mom, null);
  assert.equal(r[11].yoy, null);
});
test("exact real rate and subtraction are distinct; expected differs from realised", () => {
  const r = rateComparison(5, 2, 8);
  near(r.before.exact, 100 * (1.05 / 1.02 - 1));
  near(r.after.exact, 100 * (1.05 / 1.08 - 1));
  assert.ok(r.before.exact > 0 && r.after.exact < 0);
  assert.equal(r.after.approx, -3);
});
test("zero negative inflation high inflation and nominal loss remain meaningful", () => {
  near(realRate(0, 0).exact, 0);
  near(realRate(0, -10).exact, 100 * (1 / 0.9 - 1));
  near(realRate(50, 25).exact, 20);
  near(realRate(-100, 5).exact, -100);
  assert.equal(realRate(5, -100).exact, null);
  assert.equal(realRate(5, -100).approx, null);
});
test("boundaries and invalid inputs are explicit", () => {
  for (const bad of [NaN, Infinity, -1, 101])
    assert.throws(() => basket(bad, 0, 0));
  assert.throws(() => basket(50, -101, 0));
  assert.throws(() => realRate(-101, 0));
  assert.throws(() => realRate(0, -101));
  assert.throws(() => realRate(Infinity, 0));
  assert.throws(() => pricePath("unknown"));
});
test("repeat calculations do not mutate results or accumulate changes", () => {
  const a = pricePath("base");
  a[0].index = 777;
  assert.equal(pricePath("base")[0].index, 100);
  assert.deepEqual(basket(75, 20, -10), basket(75, 20, -10));
  assert.deepEqual(rateComparison(5, 2, 8), rateComparison(5, 2, 8));
});

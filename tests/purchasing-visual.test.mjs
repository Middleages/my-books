import test from "node:test";
import assert from "node:assert/strict";
import * as visual from "../src/simulations/money/purchasing-visual.mjs";
import {
  projectPurchasingPower,
  inflationDefaults,
} from "../src/simulations/money/inflation.mjs";
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
test("same ten-basket target separates nominal gains from the missing purchasing power", () => {
  const fs = projectPurchasingPower({ ...inflationDefaults, years: 1 });
  const s = visual.purchasingScene(fs, 1);
  near(s.targetCost, 105000);
  near(s.frame.nominal, 103000);
  near(s.gap, -2000);
  near(s.goalCount, 10);
  near(s.base, 100000);
  near(s.accountTiles.reduce((a, b) => a + b, 0) * s.unit, 103000 / 10500);
  near(s.cashTiles.reduce((a, b) => a + b, 0) * s.unit, 100000 / 10500);
  near(s.baselineTiles.reduce((a, b) => a + b, 0) * s.unit, 10);
  assert.equal(s.verdict, "down");
});
test("equal rates, deflation, negative return and personal mix use the existing exact frame", () => {
  for (const patch of [
    { rate: 5, inflation: 5 },
    { rate: 0, inflation: -3 },
    { rate: -5, inflation: 0 },
    { mode: "personal", foodShare: 80 },
  ]) {
    const fs = projectPurchasingPower({
      ...inflationDefaults,
      ...patch,
      years: 20,
    });
    for (let year = 0; year <= 20; year++) {
      const s = visual.purchasingScene(fs, year);
      assert.strictEqual(s.frame, fs[year]);
      near(s.targetCost, s.goalCount * fs[year].basketCost);
      assert.equal(
        s.verdict,
        Math.abs(s.gap) < 1e-7 ? "same" : s.gap > 0 ? "up" : "down",
      );
      assert.ok(s.scaleMax >= Math.max(s.targetCost, s.frame.nominal));
      for (const tiles of [s.accountTiles, s.cashTiles, s.baselineTiles])
        assert.ok(tiles.every((n) => n >= 0 && n <= 1));
    }
  }
});
test("one stable scale covers every year and does not saturate growing purchasing power", () => {
  const fs = projectPurchasingPower({
    ...inflationDefaults,
    years: 20,
    rate: 15,
    inflation: -3,
  });
  const a = visual.purchasingScene(fs, 0),
    b = visual.purchasingScene(fs, 20);
  assert.equal(a.unit, b.unit);
  assert.equal(a.scaleMax, b.scaleMax);
  near(b.accountTiles.reduce((s, x) => s + x, 0) * b.unit, fs[20].baskets);
  near(a.baselineTiles.reduce((s, x) => s + x, 0) * a.unit, 10);
  assert.throws(() => visual.purchasingScene(fs, -1), RangeError);
});

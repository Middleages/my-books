import test from "node:test";
import assert from "node:assert/strict";
import * as v from "../src/simulations/money/interest-visual.mjs";
import {
  projectInterest,
  interestDefaults,
} from "../src/simulations/money/interest.mjs";
const near = (a, b) =>
  assert.ok(Math.abs(a - b) < Math.max(1, Math.abs(b)) * 1e-9, `${a} != ${b}`);
test("primer carries the first interest into the next basis without discarding the simple reserve", () => {
  const stages = v.interestPrimerFrames();
  assert.equal(stages.length, 4);
  near(stages[1].simple.total, 101000);
  near(stages[1].compound.total, 101000);
  near(stages[1].simple.reserve, 1000);
  near(stages[1].compound.active, 101000);
  near(stages[2].simple.basis, 100000);
  near(stages[2].compound.basis, 101000);
  near(stages[3].simple.periodReturn, 1000);
  near(stages[3].compound.periodReturn, 1010);
  near(stages[3].extraInterest, 10);
  near(stages[3].simple.total, 102000);
  near(stages[3].compound.total, 102010);
});
test("cost gap distinguishes money deducted from later path effects including negative rates", () => {
  for (const annualRate of [12, 0, -12]) {
    const r = projectInterest({
      ...interestDefaults,
      payment: 0,
      months: 24,
      annualRate,
      taxRate: 20,
      annualFee: 1,
      fixedFee: 100,
    });
    for (let i = 0; i < r.paths.compound.length; i++) {
      const s = v.interestVisualFrame(r, i);
      assert.strictEqual(s.compound, r.paths.compound[i]);
      near(s.gap, s.directCost + s.pathEffect);
      near(s.gap, s.free.total - s.compound.total);
      near(s.compound.total, s.compound.active + s.compound.reserve);
    }
    const last = v.interestVisualFrame(r, r.paths.compound.length - 1);
    if (annualRate > 0) assert.ok(last.pathEffect > 0);
    if (annualRate === 0) near(last.pathEffect, 0);
    if (annualRate < 0) assert.ok(last.pathEffect < 0);
  }
});
test("scales remain common, support wiped-out funds, and never overflow at input extremes", () => {
  for (const patch of [
    { months: 0 },
    { months: 1, initial: 0, payment: 0, fixedFee: 10000 },
    { annualRate: -100, rateMode: "effective" },
    { months: 120, annualRate: 120, initial: 1000000, payment: 100000 },
  ]) {
    const r = projectInterest({ ...interestDefaults, ...patch });
    const first = v.interestVisualFrame(r, 0),
      last = v.interestVisualFrame(r, r.paths.compound.length - 1);
    assert.equal(first.poolMax, last.poolMax);
    assert.equal(first.costMax, last.costMax);
    for (let i = 0; i < r.paths.compound.length; i++) {
      const s = v.interestVisualFrame(r, i);
      assert.ok(
        s.poolMax >=
          Math.max(s.compound.active, s.simple.active, s.simple.reserve),
      );
      assert.ok(
        s.costMax >=
          Math.max(Math.abs(s.gap), s.directCost, Math.abs(s.pathEffect)),
      );
    }
    assert.throws(() => v.interestVisualFrame(r, -1), RangeError);
  }
});

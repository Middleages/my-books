import test from "node:test";
import assert from "node:assert/strict";
import {
  projectProtection,
  protectionDefaults,
  projectDiversification,
} from "../src/simulations/money/risk.mjs";
const run = (p = {}) => projectProtection({ ...protectionDefaults, ...p });
const near = (a, b) =>
  assert.ok(
    Math.abs(a - b) < Math.max(1, Math.abs(a), Math.abs(b)) * 1e-10,
    `${a} != ${b}`,
  );
test("identical starting allocation and shock isolate premium and covered payout", () => {
  const r = run(),
    a = r.uninsured.frames.at(-1),
    b = r.insured.frames.at(-1);
  assert.equal(a.marketChange, -2100000);
  assert.equal(b.marketChange, -2100000);
  assert.equal(a.sale, 2000000);
  assert.equal(b.sale, 0);
  assert.equal(a.assets, 2900000);
  assert.equal(b.assets, 5800000);
  assert.equal(b.payout, 3000000);
  assert.equal(b.premium, 100000);
});
test("deductible and cap apply once; expense zero, below deductible, at boundaries", () => {
  for (const [expense, claim] of [
    [0, 0],
    [499999, 0],
    [500000, 0],
    [500001, 1],
    [3500000, 3000000],
    [9000000, 3000000],
  ])
    assert.equal(run({ expense }).insured.claim, claim);
  assert.equal(run({ limit: 0 }).insured.claim, 0);
  assert.equal(run({ deductible: 0, expense: 1 }).insured.claim, 1);
});
test("excluded event never pays and costs premium even when no claim happens", () => {
  const r = run({ covered: false });
  assert.equal(r.insured.claim, 0);
  assert.equal(r.insured.frames.at(-1).payout, 0);
  const no = run({ expense: 0 });
  near(
    no.uninsured.frames.at(-1).assets - no.insured.frames.at(-1).assets,
    100000,
  );
});
test("delayed claim is not spendable at the deadline or counted as investment return", () => {
  const r = run({ onTime: false, sellAllowed: false }),
    f = r.insured.frames.at(-1);
  assert.equal(r.insured.claim, 3000000);
  assert.equal(f.payout, 0);
  assert.equal(f.gap, 2100000);
  assert.equal(f.sale, 0);
  assert.equal(f.marketChange, -2100000);
  assert.equal(r.insured.status, "deadline-gap");
});
test("selling moves value to cash, then expense consumes it once", () => {
  const f = run({ covered: false }).insured.frames.at(-1);
  assert.equal(f.sale, 2100000);
  assert.equal(f.investment, 2800000);
  assert.equal(f.cash, 0);
  assert.equal(f.paid, 5000000);
  assert.equal(f.gap, 0);
});
test("total loss and oversized bill never create negative assets or automatic debt", () => {
  const r = run({ marketReturn: -100, expense: 20000000 });
  for (const path of [r.uninsured, r.insured]) {
    const f = path.frames.at(-1);
    assert.equal(f.investment, 0);
    assert.equal(f.cash, 0);
    assert.ok(f.gap > 0);
    assert.equal(path.status, "deadline-gap");
  }
});
test("zero cash/premium, all cash, zero bill and exact deadline boundary", () => {
  assert.equal(
    run({ reserve: 0, premium: 0, sellAllowed: false }).uninsured.frames.at(-1)
      .gap,
    5000000,
  );
  assert.equal(
    run({ reserve: 10000000 }).insured.frames.at(-1).marketChange,
    0,
  );
  assert.equal(
    run({ expense: 3000000, sellAllowed: false }).uninsured.status,
    "covered-at-deadline",
  );
  assert.equal(
    run({ expense: 3000001, sellAllowed: false }).uninsured.status,
    "deadline-gap",
  );
  assert.equal(run({ premium: 0, expense: 0 }).insured.frames.at(-1).paid, 0);
});
test("each phase conserves assets and expense allocation; repeat is identical", () => {
  for (const patch of [
    {},
    { marketReturn: 100 },
    { marketReturn: -100 },
    { reserve: 0, premium: 0 },
    { reserve: 10000000 },
    { covered: false },
    { onTime: false },
    { expense: 20000000 },
    { sellAllowed: false },
  ]) {
    const p = { ...protectionDefaults, ...patch },
      r = run(patch);
    for (const path of [r.uninsured, r.insured])
      for (const f of path.frames) {
        near(f.cash + f.investment, f.assets);
        near(
          f.assets + f.paid,
          10000000 - f.premium + f.marketChange + f.payout,
        );
        near(f.paid + f.gap, f.expenseDue);
        assert.ok(
          f.cash >= 0 && f.investment >= 0 && f.paid >= 0 && f.gap >= 0,
        );
      }
    assert.deepEqual(r, run(patch));
  }
});
test("diversification reduces one-asset shock but not shared loss or guaranteed upside", () => {
  const r = projectDiversification(-40, 0);
  assert.equal(r.concentrated.total, 600000);
  assert.equal(r.diversified.total, 800000);
  assert.equal(projectDiversification(-40, -40).diversified.total, 600000);
  assert.equal(projectDiversification(40, 0).diversified.total, 1200000);
  assert.equal(projectDiversification(-100, -100).diversified.total, 0);
  assert.equal(projectDiversification(0, 0).diversified.total, 1000000);
  for (const a of [-100, -12.5, 0, 20, 100])
    for (const b of [-100, 0, 100]) {
      const v = projectDiversification(a, b);
      for (const x of [v.concentrated, v.diversified]) near(x.total, x.a + x.b);
    }
});
test("invalid ranges, unaffordable premium and nonboolean conditions rejected", () => {
  for (const p of [
    { reserve: -1 },
    { reserve: 10000001 },
    { premium: 3000001 },
    { reserve: 0, premium: 1 },
    { marketReturn: -101 },
    { marketReturn: 101 },
    { expense: NaN },
    { expense: 20000001 },
    { deductible: -1 },
    { limit: Infinity },
    { covered: 1 },
    { onTime: "yes" },
    { sellAllowed: null },
  ])
    assert.throws(() => run(p), RangeError);
  assert.throws(() => projectDiversification(NaN, 0), RangeError);
  assert.throws(() => projectDiversification(0, -101), RangeError);
});

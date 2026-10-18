import test from "node:test";
import assert from "node:assert/strict";
import {
  creditDefaults,
  projectCredit,
} from "../src/simulations/money/credit.mjs";
const run = (patch = {}) => projectCredit({ ...creditDefaults, ...patch });
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
test("same loan, income and expenses: rate change reduces margin at month four", () => {
  const r = run(),
    a = r.baseline.rows[3],
    b = r.changed.rows[3];
  near(a.opening, 16500000);
  near(a.principal, 500000);
  near(a.interest, 82500);
  near(a.payment, 582500);
  near(a.cash, 217500);
  near(a.margin, 17500);
  near(b.interest, 165000);
  near(b.cash, 135000);
  near(b.margin, -65000);
  assert.equal(b.status, "reserve-gap");
  assert.equal(r.baseline.firstPlanGap, null);
  assert.equal(r.changed.firstPlanGap, 4);
  for (let i = 0; i < 3; i++)
    assert.deepEqual(r.baseline.rows[i], r.changed.rows[i]);
});
test("income reduction changes household margin but not loan interest", () => {
  const r = run({ changedRate: 6, incomeCut: 10 });
  const a = r.baseline.rows[3],
    b = r.changed.rows[3];
  near(b.income, 2700000);
  near(b.interest, a.interest);
  near(b.payment, a.payment);
  near(b.cash, a.cash - 300000);
  assert.equal(b.status, "cash-gap");
});
test("planned reserve is retained cash, not another expense or debt payment", () => {
  const r = run(),
    f = r.baseline.frames[4];
  near(f.cash, 210000);
  near(f.reserve, 200000);
  near(f.margin, 10000);
  near(f.totalUse, 2990000);
  near(f.income - f.living - f.existing - f.principal - f.interest, f.cash);
  near(f.cash - f.reserve, f.margin);
});
test("zero rate, zero loan and one-month payoff keep principal and interest separate", () => {
  const r = run({ months: 1, annualRate: 0, changedRate: 0, changeMonth: 1 });
  assert.equal(r.horizon, 1);
  assert.equal(r.baseline.rows.length, 1);
  near(r.baseline.rows[0].payment, 18000000);
  near(r.baseline.rows[0].closing, 0);
  const z = run({ principal: 0 });
  for (const row of z.changed.rows) {
    near(row.principal, 0);
    near(row.interest, 0);
    near(row.closing, 0);
  }
});
test("unchanged comparison and changes outside the observation window stay equal", () => {
  assert.deepEqual(
    run({ changedRate: 6 }).baseline,
    run({ changedRate: 6 }).changed,
  );
  const r = run({ changeMonth: 13 });
  assert.deepEqual(r.baseline, r.changed);
  assert.equal(r.horizon, 12);
});
test("zero income, 100 percent cut, exact reserve boundary and no reserve are classified honestly", () => {
  const cash = run({ income: 0 }).baseline.rows[0];
  assert.equal(cash.status, "cash-gap");
  near(cash.cash, -2790000);
  const cut = run({ incomeCut: 100, changeMonth: 1 }).changed.rows[0];
  near(cut.income, 0);
  assert.equal(cut.status, "cash-gap");
  assert.equal(run({ income: 2990000 }).baseline.rows[0].status, "no-extra");
  assert.equal(
    run({ reserve: 0, income: 2790000 }).baseline.rows[0].status,
    "no-extra",
  );
  assert.equal(
    run({ reserve: 0, income: 2790001 }).baseline.rows[0].status,
    "room",
  );
});
test("rate decrease, existing payments and living costs have explicit effects", () => {
  const r = run({ changedRate: 0, changeMonth: 1 });
  near(r.changed.rows[0].margin - r.baseline.rows[0].margin, 90000);
  near(
    run({ existing: 0 }).baseline.rows[0].margin -
      run().baseline.rows[0].margin,
    200000,
  );
  near(
    run({ living: 2100000 }).baseline.rows[0].margin,
    run().baseline.rows[0].margin - 100000,
  );
});
test("every phase conserves income and deductions; schedule is hypothetical even at a gap", () => {
  for (const patch of [
    {},
    { months: 7, principal: 1000000 },
    { income: 0 },
    { months: 1 },
    { annualRate: 0, changedRate: 0 },
  ]) {
    const p = { ...creditDefaults, ...patch },
      r = projectCredit(p);
    for (const path of [r.baseline, r.changed]) {
      for (const row of path.rows) {
        near(row.payment, row.principal + row.interest);
        near(row.cash, row.income - row.living - row.existing - row.payment);
        near(row.margin, row.cash - p.reserve);
        near(row.closing, row.opening - row.principal);
        assert.ok(row.closing >= 0);
      }
      for (const f of path.frames) {
        near(
          f.cash,
          f.income - f.living - f.existing - f.principal - f.interest,
        );
        near(
          f.totalUse,
          f.living + f.existing + f.principal + f.interest + f.reserve,
        );
      }
    }
    assert.deepEqual(r, projectCredit(p));
  }
});
test("invalid periods, rates and nonfinite or negative money are rejected", () => {
  for (const patch of [
    { months: 0 },
    { months: 121 },
    { months: 1.5 },
    { principal: -1 },
    { income: NaN },
    { living: Infinity },
    { reserve: -1 },
    { annualRate: -1 },
    { changedRate: 31 },
    { changeMonth: 0 },
    { changeMonth: 25 },
    { incomeCut: 101 },
  ])
    assert.throws(() => run(patch), RangeError);
});

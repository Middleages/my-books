import test from "node:test";
import assert from "node:assert/strict";
import {
  projectRepayment,
  repaymentDefaults,
  repaymentKinds,
} from "../src/simulations/money/repayment.mjs";
const run = (p = {}) => projectRepayment({ ...repaymentDefaults, ...p });
const near = (a, b) =>
  assert.ok(
    Math.abs(a - b) <= Math.max(1, Math.abs(a), Math.abs(b)) * 1e-10,
    `${a} != ${b}`,
  );
test("equal principal schedule matches a hand-calculated three-month example", () => {
  const s = run({ principal: 300, annualRate: 12, months: 3 }).paths
    .equalPrincipal;
  assert.deepEqual(
    s.rows.map((r) => r.interest),
    [3, 2, 1],
  );
  assert.deepEqual(
    s.rows.map((r) => r.payment),
    [103, 102, 101],
  );
  assert.equal(s.totalInterest, 6);
});
test("annuity agrees with independent present value and changes payment composition", () => {
  const p = { principal: 12000000, annualRate: 12, months: 24 },
    s = run(p).paths.annuity;
  const payment =
    p.principal /
    Array.from({ length: p.months }, (_, i) => 1 / 1.01 ** (i + 1)).reduce(
      (a, b) => a + b,
    );
  s.rows.forEach((r) => near(r.payment, payment));
  assert.ok(s.rows[0].interest > s.rows.at(-1).interest);
  assert.ok(s.rows[0].principal < s.rows.at(-1).principal);
});
test("bullet pays full principal AND interest in the final month", () => {
  const s = run({ principal: 300, annualRate: 12, months: 3 }).paths.bullet;
  assert.deepEqual(
    s.rows.map((r) => r.principal),
    [0, 0, 300],
  );
  assert.deepEqual(
    s.rows.map((r) => r.payment),
    [3, 3, 303],
  );
  assert.equal(s.totalPayment, 309);
});
test("zero rate splits principal without division by zero; bullet still waits", () => {
  const r = run({ principal: 100, annualRate: 0, months: 3 });
  for (const k of repaymentKinds) {
    assert.equal(r.paths[k].totalInterest, 0);
    near(r.paths[k].totalPayment, 100);
  }
  near(r.paths.annuity.rows[0].payment, 100 / 3);
  assert.equal(r.paths.bullet.rows[0].payment, 0);
});
test("zero principal, one month, fractional division, long and high rate boundaries conserve every row and frame", () => {
  for (const patch of [
    {},
    { principal: 0 },
    { months: 1 },
    { principal: 0.01, months: 7 },
    { principal: 1000000, months: 7 },
    { months: 600, annualRate: 30, principal: 100000000 },
    { annualRate: 1e-10, months: 600 },
  ]) {
    const p = { ...repaymentDefaults, ...patch },
      r = run(p);
    for (const k of repaymentKinds) {
      const s = r.paths[k];
      let previous = p.principal;
      for (const row of s.rows) {
        near(row.opening, previous);
        near(row.opening - row.principal, row.closing);
        near(row.interest, (row.opening * p.annualRate) / 1200);
        near(row.payment, row.principal + row.interest);
        near(row.cumulativePrincipal + row.closing, p.principal);
        near(
          row.cumulativePayment,
          row.cumulativePrincipal + row.cumulativeInterest,
        );
        assert.ok(row.closing >= 0);
        previous = row.closing;
      }
      assert.equal(s.rows.at(-1).closing, 0);
      near(s.totalPayment, p.principal + s.totalInterest);
      for (const f of s.frames) {
        near(f.cumulativePrincipal + f.balance, p.principal);
        near(f.cumulativePayment, f.cumulativePrincipal + f.cumulativeInterest);
      }
    }
    assert.deepEqual(r, run(p));
  }
});
test("four observation phases apply payment once and do not capitalize interest", () => {
  const s = run({ principal: 300, annualRate: 12, months: 3 }).paths
    .equalPrincipal;
  assert.deepEqual(
    s.frames.slice(0, 4).map((f) => f.balance),
    [300, 300, 200, 200],
  );
  assert.deepEqual(
    s.frames.slice(0, 4).map((f) => f.cumulativePayment),
    [0, 0, 103, 103],
  );
  assert.deepEqual(
    s.frames.slice(0, 4).map((f) => f.interestDue),
    [0, 3, 0, 0],
  );
  assert.equal(s.frames[4].balance, 200);
});
test("longer term lowers amortizing first payment but increases interest; bullet monthly interest stays", () => {
  const a = run({ months: 24 }),
    b = run({ months: 48 });
  for (const k of repaymentKinds) {
    assert.ok(b.paths[k].totalInterest > a.paths[k].totalInterest);
    if (k !== "bullet")
      assert.ok(b.paths[k].rows[0].payment < a.paths[k].rows[0].payment);
  }
  near(a.paths.bullet.rows[0].payment, b.paths.bullet.rows[0].payment);
});
test("same conditions imply interest ordering, and one-month methods coincide", () => {
  const r = run();
  assert.ok(
    r.paths.equalPrincipal.totalInterest < r.paths.annuity.totalInterest,
  );
  assert.ok(r.paths.annuity.totalInterest < r.paths.bullet.totalInterest);
  const one = run({ months: 1 });
  assert.deepEqual(one.paths.equalPrincipal.rows, one.paths.annuity.rows);
  assert.deepEqual(one.paths.annuity.rows, one.paths.bullet.rows);
});
test("invalid values are rejected rather than silently coerced", () => {
  for (const p of [
    { principal: -1 },
    { principal: Infinity },
    { principal: 100000001 },
    { months: 0 },
    { months: 601 },
    { months: 1.5 },
    { annualRate: -1 },
    { annualRate: 31 },
    { annualRate: NaN },
  ])
    assert.throws(() => run(p), RangeError);
});
test("prediction judgement is supplied by the model including ties", () => {
  assert.equal(run().lowestInterest, "equalPrincipal");
  for (const p of [{ annualRate: 0 }, { principal: 0 }, { months: 1 }])
    assert.equal(run(p).lowestInterest, "same");
});

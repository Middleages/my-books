import test from "node:test";
import assert from "node:assert/strict";
import {
  projectRepayment,
  repaymentDefaults,
  repaymentKinds,
} from "../src/simulations/money/repayment.mjs";
import {
  repaymentScene,
  repaymentMilestones,
} from "../src/simulations/money/repayment-visual.mjs";
const near = (a, b) =>
  assert.ok(Math.abs(a - b) < Math.max(1, Math.abs(b)) * 1e-9);
test("payment splits into principal and interest; only payment phase reduces debt once", () => {
  const r = projectRepayment({ principal: 3000000, annualRate: 12, months: 3 });
  for (let phase = 0; phase < 4; phase++) {
    const s = repaymentScene(r, "equalPrincipal", phase);
    near(s.row.payment, 1030000);
    near(s.row.principal, 1000000);
    near(s.row.interest, 30000);
    near(s.appliedPrincipal, phase >= 2 ? 1000000 : 0);
    near(s.frame.balance, phase >= 2 ? 2000000 : 3000000);
    near(s.row.opening - s.appliedPrincipal, s.frame.balance);
  }
  near(
    repaymentScene(r, "equalPrincipal", 2).frame.balance,
    repaymentScene(r, "equalPrincipal", 3).frame.balance,
  );
});
test("milestones keep actual first/middle/final rows and one amount scale per path", () => {
  const r = projectRepayment(repaymentDefaults);
  for (const k of repaymentKinds) {
    const m = repaymentMilestones(r, k);
    assert.deepEqual(
      m.rows.map((x) => x.month),
      [1, 12, 24],
    );
    for (const row of m.rows) {
      assert.strictEqual(row, r.paths[k].rows[row.month - 1]);
      assert.ok(m.paymentMax >= row.payment);
    }
  }
  const a = repaymentMilestones(r, "annuity").rows;
  near(a[0].payment, a[2].payment);
  assert.ok(a[0].principal < a[2].principal);
  assert.ok(a[0].interest > a[2].interest);
  const p = repaymentMilestones(r, "equalPrincipal").rows;
  near(p[0].principal, p[2].principal);
  assert.ok(p[0].payment > p[2].payment);
  const b = repaymentMilestones(r, "bullet").rows;
  near(b[1].principal, 0);
  near(b[2].principal, repaymentDefaults.principal);
});
test("all frames conserve initial principal including zero, one month, and extremes", () => {
  for (const p of [
    { principal: 0, annualRate: 0, months: 1 },
    { principal: 100000000, annualRate: 30, months: 600 },
    { principal: 1000000, annualRate: 0, months: 7 },
  ]) {
    const r = projectRepayment(p);
    for (const k of repaymentKinds) {
      for (let i = 0; i < r.paths[k].frames.length; i++) {
        const s = repaymentScene(r, k, i);
        near(s.frame.balance + s.frame.cumulativePrincipal, p.principal);
        near(s.row.opening - s.appliedPrincipal, s.frame.balance);
        assert.ok(s.principalScale >= 1);
      }
      assert.equal(
        repaymentMilestones(r, k).rows.length,
        p.months === 1 ? 1 : 3,
      );
    }
    assert.throws(() => repaymentScene(r, "annuity", -1), RangeError);
  }
});

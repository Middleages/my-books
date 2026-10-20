import test from "node:test";
import assert from "node:assert/strict";
import {
  payroll,
  settlement,
} from "../src/simulations/tax/lifeModel.mjs";
const close = (a, b) => assert(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
test("tax payroll: cash partitions, non-taxable classification is not another outflow", () => {
  for (const gross of [0, 100, 300, 1000000])
    for (const fraction of [0, 0.1, 0.5, 1]) {
      const r = payroll({
        gross,
        exempt: gross * 0.2,
        social: 0,
        withheld: gross * fraction,
      });
      close(
        r.parts.reduce((s, p) => s + p.value, 0),
        gross,
      );
      close(r.taxablePay, gross * 0.8);
      for (const f of r.frames) close(f.cash + f.tax + f.social, gross);
    }
  const r = payroll();
  assert.equal(r.net, 260);
  assert.equal(r.taxablePay, 280);
  assert.deepEqual(payroll(), r);
});
test("tax payroll rejects invalid/overdrawn input instead of silently clipping", () => {
  for (const n of [-1, NaN, Infinity, 1000001])
    assert.throws(() => payroll({ gross: n }), RangeError);
  assert.throws(() =>
    payroll({ gross: 10, exempt: 11, social: 0, withheld: 0 }),
  );
  assert.throws(() =>
    payroll({ gross: 10, exempt: 0, social: 9, withheld: 2 }),
  );
});
test("tax settlement: refund, additional, zero, over-credit and over-deduction", () => {
  assert.equal(settlement().difference, -20);
  assert.equal(settlement({ prepaid: 50 }).extra, 20);
  assert.equal(settlement({ prepaid: 70 }).difference, 0);
  assert.equal(settlement({ credit: 100 }).finalTax, 0);
  assert.equal(settlement({ credit: 100 }).unusedCredit, 20);
  assert.equal(settlement({ deduction: 500 }).taxableBase, 0);
  for (const base of [0, 99, 100, 101, 299, 300, 301, 400, 1000000])
    for (const prepaid of [0, 20, 90, 200]) {
      const r = settlement({ base, prepaid });
      close(r.prepaid + r.extra - r.refund, r.finalTax);
      assert(r.finalTax >= 0);
      close(r.usedCredit + r.unusedCredit, r.credit);
      assert.deepEqual(settlement({ base, prepaid }), r);
    }
});
test("tax settlement validates all money fields", () => {
  for (const key of ["base", "deduction", "credit", "prepaid"])
    for (const v of [-1, NaN, Infinity, 1000001])
      assert.throws(() => settlement({ [key]: v }), RangeError);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  payroll,
  settlement,
  vatChain,
  investmentRoute,
  investmentKinds,
  accountRoute,
  accountKinds,
  housingRoute,
  transferBase,
  deductionComparison,
  taxTimeline,
  documentReview,
  taxDocuments,
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
test("tax VAT: telescoping taxation and price tax separation", () => {
  for (const sale of [200, 201, 300, 500, 1000000]) {
    const r = vatChain({ sale });
    close(r.totalRemit, r.consumerTax);
    close(r.consumerTax, sale * 0.1);
    for (const s of r.stages) {
      close(s.output - s.credit, s.remit);
      close(s.price + s.output, s.consumerPayment);
    }
  }
});
test("tax VAT: zero-rated refund differs from exempt embedded input tax", () => {
  const zero = vatChain({ mode: "zero" }),
    exempt = vatChain({ mode: "exempt" });
  assert.equal(zero.stages[2].remit, -20);
  assert.equal(zero.totalRemit, 0);
  assert.equal(exempt.stages[2].remit, 0);
  assert.equal(exempt.embeddedTax, 20);
  assert.equal(exempt.totalRemit, 20);
  assert.equal(exempt.consumerTax, 0);
  assert.throws(() => vatChain({ mode: "made-up" }));
  assert.throws(() => vatChain({ sale: 199 }));
});
test("tax investment routes keep all four income kinds and unknown final tax", () => {
  for (const k of investmentKinds)
    for (const account of ["ordinary", "special"]) {
      const r = investmentRoute(k.id, account);
      assert.equal(r.nodes.length, 4);
      assert.match(r.result, /자료 부족/);
      assert(!("tax" in r));
    }
  assert.throws(() => investmentRoute("bogus"));
  assert.throws(() => investmentRoute("interest", "bogus"));
});
test("tax accounts: unknown never counted as met or failed, checked never means zero tax", () => {
  for (const item of accountKinds) {
    const unknown = accountRoute(item.id, ["yes", "unknown", "yes"]);
    assert.match(unknown.result, /미확인/);
    assert.equal(unknown.gates[1].symbol, "?");
    assert.match(accountRoute(item.id, ["yes", "no", "yes"]).result, /불일치/);
    assert.match(
      accountRoute(item.id, ["yes", "yes", "yes"]).result,
      /별도 검토/,
    );
  }
  assert.throws(() => accountRoute("x"));
  for (const v of [Array(3), null, { length: 3 }, ["yes", , "no"]])
    assert.throws(() => accountRoute("isa", v));
  assert.throws(() => accountRoute("isa", ["yes"]));
  assert.throws(() => accountRoute("isa", ["yes", "invalid", "no"]));
});
test("tax housing: all events remain separate, index input bounded", () => {
  assert.equal(housingRoute(0).current.id, "buy");
  assert.equal(housingRoute(1).current.id, "hold");
  assert.equal(housingRoute(2).current.id, "sell");
  for (const x of [-1, 3, 0.5, NaN])
    assert.throws(() => housingRoute(x), RangeError);
});
test("tax transfers: valuation, prior amounts and deduction bounds without invented unknowns", () => {
  for (const kind of ["gift", "inheritance"])
    for (const value of [0, 20, 400, 100000]) {
      const r = transferBase({ kind, value });
      close(r.combined, r.value + r.prior);
      close(r.base + r.usedDeduction, r.combined);
      assert(r.base >= 0);
      assert.equal(transferBase({ kind, value, confirmed: false }).base, null);
    }
  assert.equal(transferBase({ value: 0, prior: 0, deduction: 200 }).base, 0);
  assert.throws(() => transferBase({ value: 1000000, prior: 1 }));
  assert.throws(() => transferBase({ kind: "unknown" }));
  for (const v of ["unknown", 0, 1, null])
    assert.throws(() => transferBase({ confirmed: v }), TypeError);
});
test("tax deduction comparison uses the same progressive calculation in all rows", () => {
  const r = deductionComparison();
  assert.deepEqual(
    r.rows.map((x) => x.finalTax),
    [80, 65, 30],
  );
  assert.deepEqual(
    r.rows.map((x) => x.saving),
    [0, 15, 50],
  );
  for (const base of [0, 100, 300, 400, 600])
    for (const off of [0, 50, 150, 1000]) {
      const c = deductionComparison(base, off);
      for (const row of c.rows) {
        assert(row.finalTax >= 0);
        close(row.saving, c.rows[0].finalTax - row.finalTax);
        if (row.id === "income")
          close(row.taxableBase, Math.max(0, base - off));
        if (row.id === "credit") close(row.taxableBase, base);
      }
    }
});
test("tax timeline: only one settlement, delay never changes final tax", () => {
  for (const monthly of [0, 8, 12])
    for (const settleMonth of [13, 14, 16, 18]) {
      const r = taxTimeline({ monthly, settleMonth });
      assert.equal(r.frames.length, 19);
      assert.equal(r.frames[0].cumulative, 0);
      close(r.frames[12].cumulative, r.prepaid);
      close(r.frames.at(-1).cumulative, 80);
      close(
        r.frames.reduce((s, f) => s + f.adjustment, 0),
        r.difference,
      );
      close(
        r.frames.reduce((s, f) => s + f.withheld, 0),
        r.prepaid,
      );
      for (let i = 1; i < r.frames.length; i++)
        close(
          r.frames[i].cumulative - r.frames[i - 1].cumulative,
          r.frames[i].withheld + r.frames[i].adjustment,
        );
      assert.deepEqual(taxTimeline({ monthly, settleMonth }), r);
    }
});
test("tax timeline: invalid scheduling and monetary inputs rejected", () => {
  for (const settleMonth of [0, 12, 19, 14.5, NaN])
    assert.throws(() => taxTimeline({ settleMonth }));
  for (const monthly of [-1, NaN, Infinity, 100000])
    assert.throws(() => taxTimeline({ monthly }));
});
test("tax documents: every statement has an explained category, no reader personal input", () => {
  assert.equal(taxDocuments.length, 3);
  for (const d of taxDocuments) {
    assert.equal(documentReview(d.id), d);
    assert.equal(d.rows.length, 4);
    for (const row of d.rows) {
      assert(["fact", "assumption", "unknown"].includes(row.kind));
      assert(row.why.length > 20);
    }
  }
  assert.throws(() => documentReview("unknown"));
});

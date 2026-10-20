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
  for (const sale of [200, 200.01, 299.99, 300, 350.75, 500, 1000000]) {
    const r = vatChain({ sale });
    close(r.totalRemit, r.consumerTax);
    close(r.consumerTax, sale / 10);
    for (const s of r.stages) {
      close(s.output - s.credit, s.remit);
      close(s.price + s.output, s.consumerPayment);
    }
    assert.deepEqual(r.stages.slice(0, 2), vatChain().stages.slice(0, 2));
    assert.deepEqual(
      r.frames.map((f) => f.value),
      r.stages.map((s) => s.remit),
    );
    assert.deepEqual(vatChain({ sale }), r);
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
  for (const sale of [200, 200.01, 299.99, 500, 1000000])
    for (const mode of ["zero", "exempt"]) {
      const r = vatChain({ sale, mode });
      close(r.totalRemit, mode === "zero" ? 0 : 20);
      close(r.stages[2].credit, mode === "zero" ? 20 : 0);
      close(r.embeddedTax, mode === "zero" ? 0 : 20);
      close(r.stages[2].consumerPayment, sale);
    }
  assert.throws(() => vatChain({ mode: "made-up" }));
  for (const sale of [199, 199.99, -1, NaN, Infinity, 1000001, "300", null])
    assert.throws(() => vatChain({ sale }), RangeError);
});
test("tax investment routes keep all four income kinds and unknown final tax", () => {
  for (const k of investmentKinds)
    for (const account of ["ordinary", "special"]) {
      const r = investmentRoute(k.id, account);
      assert.equal(r.nodes.length, 4);
      assert.equal(r.nodes[0].detail, k.origin);
      assert.equal(r.nodes[1].detail, k.event);
      assert.equal(r.nodes[2].detail, k.category);
      assert.equal(r.account, account);
      if (account === "ordinary") assert.equal(r.nodes[3].detail, k.question);
      else assert.match(r.nodes[3].detail, /가입·상품·해지/);
      assert.match(r.result, /자료 부족/);
      assert(!("tax" in r));
      assert.deepEqual(investmentRoute(k.id, account), r);
    }
  assert.throws(() => investmentRoute("bogus"));
  assert.throws(() => investmentRoute("interest", "bogus"));
});
test("tax accounts: unknown never counted as met or failed, checked never means zero tax", () => {
  const states = ["yes", "no", "unknown"];
  for (const item of accountKinds) {
    const unknown = accountRoute(item.id, ["yes", "unknown", "yes"]);
    assert.match(unknown.result, /미확인/);
    assert.equal(unknown.gates[1].symbol, "?");
    assert.match(accountRoute(item.id, ["yes", "no", "yes"]).result, /불일치/);
    assert.match(
      accountRoute(item.id, ["yes", "yes", "yes"]).result,
      /별도 검토/,
    );
    for (const a of states)
      for (const b of states)
        for (const c of states) {
          const inputs = [a, b, c];
          const r = accountRoute(item.id, inputs);
          assert.deepEqual(
            r.gates.map((g) => g.state),
            inputs,
          );
          assert.deepEqual(
            r.gates.map((g) => g.symbol),
            inputs.map((v) => (v === "yes" ? "✓" : v === "no" ? "×" : "?")),
          );
          assert.match(
            r.result,
            inputs.includes("no")
              ? /불일치/
              : inputs.includes("unknown")
                ? /미확인/
                : /별도 검토/,
          );
          assert(!("tax" in r));
          assert.deepEqual(accountRoute(item.id, inputs), r);
        }
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
  for (let i = 0; i < 3; i++) {
    const r = housingRoute(i);
    assert.equal(r.current, r.events[i]);
    assert.equal(r.index, i);
    assert.deepEqual(
      r.events.map((e) => e.id),
      ["buy", "hold", "sell"],
    );
    assert.equal(new Set(r.events.map((e) => e.kind)).size, 3);
    assert(!("tax" in r));
    assert.deepEqual(housingRoute(i), r);
  }
  for (const x of [-1, 3, 0.5, NaN, Infinity, "1", null])
    assert.throws(() => housingRoute(x), RangeError);
});

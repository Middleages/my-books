// Separate closed-form oracle retained from the independent review.
import test from "node:test";
import assert from "node:assert/strict";
import { progressiveTax } from "../src/simulations/tax/taxModel.mjs";
import {
  settlement,
  deductionComparison,
  taxTimeline,
  accountRoute,
  accountKinds,
  vatChain,
} from "../src/simulations/tax/lifeModel.mjs";
const referenceTax = (n) =>
  n <= 100 ? n / 10 : n <= 300 ? n / 5 - 10 : n * 0.3 - 40;
const close = (actual, expected, label) => {
  assert(Number.isFinite(actual) && Number.isFinite(expected), label);
  assert(
    Math.abs(actual - expected) <=
      1e-8 * Math.max(1, Math.abs(actual), Math.abs(expected)),
    `${label}: ${actual} != ${expected}`,
  );
};
test("tax independent oracle: fractional and huge finite bracket boundaries", () => {
  for (const base of [
    0,
    0.1,
    99.9,
    100,
    100.1,
    299.9,
    300,
    300.1,
    400,
    600,
    1e6,
    Number.MAX_VALUE,
  ])
    close(progressiveTax(base).tax, referenceTax(base), `boundary ${base}`);
});
test("tax independent oracle: 5000 seeded settlement, deduction and complete timeline cases", () => {
  let seed = 0x54415826;
  const random = () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  for (let i = 0; i < 5000; i++) {
    const base = random() * 1e6,
      deduction = random() * 1e6,
      credit = random() * 1e6,
      prepaid = random() * 1e6;
    const expectedBase = Math.max(0, base - deduction),
      expectedCalculated = referenceTax(expectedBase),
      expectedFinal = Math.max(0, expectedCalculated - credit),
      difference = expectedFinal - prepaid;
    const s = settlement({ base, deduction, credit, prepaid });
    close(s.taxableBase, expectedBase, `base ${i}`);
    close(s.calculated, expectedCalculated, `calculated ${i}`);
    close(s.finalTax, expectedFinal, `final ${i}`);
    close(s.extra, Math.max(0, difference), `extra ${i}`);
    close(s.refund, Math.max(0, -difference), `refund ${i}`);
    assert.equal(
      s.direction,
      difference < 0 ? "refund" : difference > 0 ? "pay" : "balanced",
    );
    const d = deductionComparison(base, deduction);
    close(d.rows[0].finalTax, referenceTax(base), `plain ${i}`);
    close(
      d.rows[1].finalTax,
      referenceTax(Math.max(0, base - deduction)),
      `income ${i}`,
    );
    close(
      d.rows[2].finalTax,
      Math.max(0, referenceTax(base) - deduction),
      `credit ${i}`,
    );
    const monthly = random() * 1000,
      finalTax = random() * 10000,
      settleMonth = 13 + (i % 6),
      t = taxTimeline({ monthly, finalTax, settleMonth });
    let cash = 0;
    for (const f of t.frames) {
      const withheld = f.month >= 1 && f.month <= 12 ? monthly : 0,
        adjustment = f.month === settleMonth ? finalTax - monthly * 12 : 0;
      cash += withheld + adjustment;
      close(f.withheld, withheld, `withheld ${i}/${f.month}`);
      close(f.adjustment, adjustment, `adjustment ${i}/${f.month}`);
      close(f.cumulative, cash, `cash ${i}/${f.month}`);
    }
    close(t.frames.at(-1).cumulative, finalTax, `terminal ${i}`);
  }
});
test("tax independent oracle: all 81 account gate combinations preserve missing versus failed facts", () => {
  const states = ["yes", "no", "unknown"];
  for (const account of accountKinds)
    for (const a of states)
      for (const b of states)
        for (const c of states) {
          const inputs = [a, b, c],
            r = accountRoute(account.id, inputs);
          assert.deepEqual(
            r.gates.map((g) => g.state),
            inputs,
          );
          r.gates.forEach((g, i) =>
            assert.equal(
              g.symbol,
              inputs[i] === "yes" ? "✓" : inputs[i] === "no" ? "×" : "?",
            ),
          );
          if (inputs.includes("no")) assert.match(r.result, /불일치/);
          else if (inputs.includes("unknown")) assert.match(r.result, /미확인/);
          else assert.match(r.result, /별도 검토/);
        }
});
test("tax independent oracle: fractional VAT total and exemption non-credit distinction", () => {
  for (const sale of [200, 200.01, 299.99, 350.75, 499.99, 999999.99])
    for (const mode of ["taxable", "zero", "exempt"]) {
      const r = vatChain({ sale, mode });
      close(
        r.totalRemit,
        mode === "taxable" ? sale / 10 : mode === "exempt" ? 20 : 0,
        `${sale}/${mode}`,
      );
      close(r.stages[2].credit, mode === "exempt" ? 0 : 20, "credit");
      close(r.embeddedTax, mode === "exempt" ? 20 : 0, "embedded");
    }
});

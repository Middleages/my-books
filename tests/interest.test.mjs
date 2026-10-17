import test from "node:test";
import assert from "node:assert/strict";
import {
  interestDefaults as defaults,
  projectInterest,
  compareInterest,
} from "../src/simulations/money/interest.mjs";
const near = (a, b) =>
  assert.ok(Math.abs(a - b) < Math.max(1, Math.abs(b)) * 1e-10, `${a} != ${b}`);
const run = (patch = {}) => projectInterest({ ...defaults, ...patch });
const last = (r, k = "compound") => r.paths[k].at(-1);
test("same principal and payments: simple 1200 vs compound 1210 after two months at 10% monthly", () => {
  const r = run({
    initial: 1000,
    payment: 0,
    months: 2,
    annualRate: 120,
    taxRate: 0,
    annualFee: 0,
    fixedFee: 0,
  });
  near(last(r, "simple").total, 1200);
  near(last(r).total, 1210);
  near(
    r.paths.compound.find((f) => f.month === 2 && f.phase === "basis").basis,
    1100,
  );
  near(
    r.paths.simple.find((f) => f.month === 2 && f.phase === "basis").basis,
    1000,
  );
  assert.equal(compareInterest(1210, 1200), "more");
});
test("month end deposit earns from next month; start deposit earns immediately", () => {
  const p = { initial: 1000, payment: 100, months: 2, annualRate: 120 };
  const end = run({ ...p, timing: "end" }),
    start = run({ ...p, timing: "start" });
  near(last(end).total, 1420);
  near(last(start).total, 1441);
  near(last(end, "simple").total, 1410);
  near(last(start, "simple").total, 1430);
  near(last(end).added, 200);
  near(last(start).added, 200);
});
test("effective annual conversion vs nominal annual divided by 12", () => {
  const p = { initial: 1000, payment: 0, months: 12, annualRate: 12 };
  near(last(run({ ...p, rateMode: "effective" })).total, 1120);
  near(last(run({ ...p, rateMode: "nominal" })).total, 1000 * 1.01 ** 12);
  near(run({ ...p, rateMode: "effective" }).monthlyRate, 1.12 ** (1 / 12) - 1);
});
test("tax on positive monthly gain then fee on after-tax total, end deposit after costs", () => {
  const r = run({
    initial: 1000,
    payment: 100,
    months: 1,
    annualRate: 120,
    taxRate: 20,
    annualFee: 12,
    fixedFee: 5,
  });
  const f = last(r);
  near(f.gross, 100);
  near(f.tax, 20);
  near(f.fee, 15.8);
  near(f.total, 1164.2);
  near(r.paths.compound.find((f) => f.phase === "return").total, 1100);
  near(r.paths.compound.find((f) => f.phase === "cost").total, 1064.2);
  near(f.cost, 35.8);
  assert.ok(last(r, "free").total > f.total);
});
test("zero rate, zero deposit, zero/one month, total loss and fee capped to available funds", () => {
  for (const timing of ["start", "end"]) {
    near(
      last(
        run({ initial: 1000, payment: 100, months: 2, annualRate: 0, timing }),
      ).total,
      1200,
    );
    near(
      last(
        run({
          initial: 0,
          payment: 0,
          months: 12,
          annualRate: 0,
          timing,
          fixedFee: 100,
        }),
      ).total,
      0,
    );
  }
  const z = run({ months: 0 });
  assert.equal(z.paths.compound.length, 1);
  near(last(z).total, defaults.initial);
  const n = run({
    initial: 1000,
    payment: 0,
    months: 2,
    annualRate: -12,
    taxRate: 20,
  });
  near(last(n).total, 980.1);
  near(last(n, "simple").total, 980.1);
  near(last(n).tax, 0);
  const cap = run({
    initial: 10,
    payment: 100,
    months: 1,
    annualRate: 0,
    fixedFee: 1000,
  });
  near(last(cap).fee, 10);
  near(last(cap).total, 100);
  near(last(cap).cost, 10);
  near(
    last(
      run({
        initial: 1000,
        payment: 0,
        months: 1,
        annualRate: -100,
        rateMode: "effective",
      }),
    ).total,
    0,
  );
});
test("every phase reconciles funding, returns and costs; no mutation or duplicate replay", () => {
  const p = {
    ...defaults,
    months: 36,
    annualRate: -20,
    payment: 100,
    annualFee: 10,
    fixedFee: 200,
    taxRate: 30,
  };
  const r = projectInterest(p);
  for (const frames of Object.values(r.paths))
    for (const f of frames) {
      near(f.total, p.initial + f.added + f.gross - f.cost);
      assert.ok(f.total >= -1e-8);
      near(f.total, f.active + f.reserve);
      near(f.cost, f.tax + f.fee);
    }
  assert.deepEqual(r, projectInterest(p));
  assert.equal(p.months, 36);
  const pos = run({
    months: 3,
    annualRate: 120,
    taxRate: 100,
    annualFee: 0,
    fixedFee: 0,
    payment: 0,
  });
  near(last(pos).total, defaults.initial);
  assert.equal(compareInterest(1 + 1e-12, 1), "same");
});
test("invalid and nonfinite inputs fail rather than silently distort chart", () => {
  for (const patch of [
    { months: -1 },
    { months: 1.5 },
    { months: 361 },
    { initial: -1 },
    { payment: NaN },
    { annualRate: Infinity },
    { annualRate: -101 },
    { annualRate: 121 },
    { taxRate: 101 },
    { annualFee: -1 },
    { fixedFee: -1 },
    { timing: "bad" },
    { rateMode: "bad" },
  ])
    assert.throws(() => run(patch), RangeError);
});

test("simple costs use the reserve first, then reduce next month principal; fee gap includes later returns", () => {
  const r = run({
    initial: 1000,
    payment: 0,
    months: 2,
    annualRate: 120,
    fixedFee: 200,
  });
  const first = r.paths.simple[5];
  near(first.active, 900);
  near(first.reserve, 0);
  near(
    r.paths.simple.find((f) => f.month === 2 && f.phase === "basis").basis,
    900,
  );
  near(last(r).total, 790);
  near(last(r, "simple").total, 790);
  near(last(r).cost, 400);
  near(last(r, "free").total - last(r).total, 420);
});

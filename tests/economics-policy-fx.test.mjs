import test from "node:test";
import assert from "node:assert/strict";
import {
  policyMap,
  policyExposure,
  quote,
  fxComparison,
  fxDefaults,
} from "../src/simulations/economics/policy-fx.mjs";
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} ≠ ${b}`);
test("policy map has five conditional channels and observation frames, no macro forecast", () => {
  const r = policyMap("up", "normal", 2);
  assert.equal(r.channels.length, 5);
  assert.deepEqual(
    r.channels.map((c) => c.id),
    ["interest", "credit", "assets", "fx", "expectations"],
  );
  assert.equal(r.phase, 2);
  assert.equal(r.gdp, undefined);
  assert.match(r.channels[3].condition, /해외 금리/);
  assert.match(policyMap("down", "stress", 3).channels[1].effect, /신중/);
  assert.match(policyMap("down", "stress", 3).channels[3].effect, /확정/);
});
test("repricing lags leave contracts unchanged until their own dates", () => {
  const m0 = policyExposure("up", "staggered", 0);
  assert.ok(m0.rows.every((r) => r.cashDelta === 0));
  const m1 = policyExposure("up", "staggered", 1);
  assert.ok(m1.rows[1].cashDelta > 0);
  assert.equal(m1.rows[0].cashDelta, 0);
  const m3 = policyExposure("up", "staggered", 3);
  near(m3.rows[0].cashDelta, (-100000000 * 0.01) / 12);
  assert.equal(m3.rows[2].cashDelta, 0);
  const m6 = policyExposure("up", "staggered", 6);
  near(m6.rows[2].cashDelta, (-200000000 * 0.01) / 12);
});
test("rate cuts reverse cashflow under the specified conditions, fixed contracts stay fixed", () => {
  const up = policyExposure("up", "staggered", 12),
    down = policyExposure("down", "staggered", 12);
  for (let i = 0; i < 3; i++)
    near(up.rows[i].cashDelta, -down.rows[i].cashDelta);
  assert.ok(
    policyExposure("down", "fixed", 12).rows.every((r) => r.cashDelta === 0),
  );
  assert.ok(
    policyExposure("same", "staggered", 12).rows.every(
      (r) => r.cashDelta === 0,
    ),
  );
});
test("quote and reciprocal change direction, percentage changes are not simple negatives", () => {
  const q = quote(1500);
  near(q.inverse, 1 / 1500);
  assert.equal(q.unit, "KRW/USD");
  assert.throws(() => quote(1500, "USD/KRW"));
  const r = fxComparison({ ...fxDefaults, rate: 1500 });
  near(r.rateChange, 25);
  near(r.inverseChange, -20);
});
test("same foreign amount changes KRW costs, zero amount and hypothetical fee work", () => {
  const r = fxComparison({ ...fxDefaults, rate: 1400, fee: 2 });
  assert.equal(r.purchase.gross, 140000);
  assert.equal(r.purchase.fee, 2800);
  assert.equal(r.purchase.total, 142800);
  assert.equal(
    fxComparison({ ...fxDefaults, amount: 0, fee: 5 }).purchase.total,
    0,
  );
});
test("same exchange rate increases revenue, import cost and foreign debt valuation", () => {
  const r = fxComparison(fxDefaults);
  assert.equal(r.firm.revenue.current, 1400000);
  assert.equal(r.firm.imports.current, 840000);
  assert.equal(r.firm.debt.current, 420000);
  assert.equal(r.firm.margin.current, 360000);
  assert.equal(r.firm.margin.base, 280000);
  assert.equal(
    r.firm.margin.delta,
    r.firm.revenue.delta - r.firm.imports.delta,
  );
});
test("export invoicing in KRW and high import exposure defeat blanket profit claims", () => {
  const krw = fxComparison({ ...fxDefaults, invoice: "KRW" });
  assert.equal(krw.firm.revenue.delta, 0);
  assert.ok(krw.firm.margin.delta < 0);
  const high = fxComparison({ ...fxDefaults, importUsd: 1500 });
  assert.ok(high.firm.revenue.delta > 0);
  assert.ok(high.firm.margin.delta < 0);
});
test("retail pass-through is conditional on lag, zero pass-through is unchanged", () => {
  const p = { ...fxDefaults, pass: 50, lag: 3, month: 2 };
  assert.equal(fxComparison(p).retail.delta, 0);
  const r = fxComparison({ ...p, month: 3 });
  assert.equal(r.retail.delta, 10000);
  assert.equal(r.retail.current, 160000);
  assert.equal(fxComparison({ ...p, month: 6, pass: 0 }).retail.delta, 0);
});
test("falling and unchanged FX rates preserve signed differences and accounting", () => {
  for (const rate of [500, 1200, 2500]) {
    const r = fxComparison({ ...fxDefaults, rate });
    near(
      r.firm.margin.current,
      r.firm.revenue.current - r.firm.imports.current - 200000,
    );
    assert.ok(
      r.scale >=
        Math.max(
          r.firm.revenue.base,
          r.firm.revenue.current,
          r.firm.imports.current,
          r.firm.debt.current,
        ),
    );
  }
  const r = fxComparison({ ...fxDefaults, rate: 1200 });
  assert.equal(r.rateChange, 0);
  assert.equal(r.firm.margin.delta, 0);
  assert.equal(r.retail.delta, 0);
});
test("invalid inputs and replay cannot create nonfinite values or mutate defaults", () => {
  for (const v of [0, -1, NaN, Infinity, "1400"]) assert.throws(() => quote(v));
  for (const p of [
    { amount: -1 },
    { fee: 6 },
    { pass: 101 },
    { lag: 1.5 },
    { month: -1 },
    { invoice: "EUR" },
    { importUsd: Infinity },
    { rate: 0 },
  ])
    assert.throws(() => fxComparison({ ...fxDefaults, ...p }));
  assert.throws(() => policyMap("bad", "normal", 0));
  assert.throws(() => policyExposure("up", "bad", 1));
  assert.throws(() => policyExposure("up", "fixed", 13));
  const before = { ...fxDefaults };
  const a = fxComparison(fxDefaults);
  a.firm.revenue.current = 0;
  assert.deepEqual(fxDefaults, before);
  assert.equal(fxComparison(fxDefaults).firm.revenue.current, 1400000);
});

test("a rate hold does not assign a directional exchange-rate exposure", () => {
  for (const context of ["normal", "stress"]) {
    const fx = policyMap("same", context, 2).channels.find(
      (c) => c.id === "fx",
    );
    assert.match(fx.exposure, /방향을 정하지/);
    assert.doesNotMatch(fx.exposure, /약세|강세|상승 압력|하락 압력/);
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  projectPurchasingPower,
  inflationDefaults,
  comparePower,
} from "../src/simulations/money/inflation.mjs";
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
test("잔액은 늘어도 구매력은 감소, 가격·수량·실질금액 일치", () => {
  const r = projectPurchasingPower({
    ...inflationDefaults,
    years: 1,
    rate: 3,
    inflation: 5,
  });
  const f = r[1];
  near(f.nominal, 103000);
  near(f.priceFactor, 1.05);
  near(f.real, 103000 / 1.05);
  near(f.basketCost, 10500);
  near(f.fixedBaskets, 100000 / 10500);
  near(f.baskets, 103000 / 10500);
  near(f.baskets * 10000, f.real);
  assert.equal(comparePower(f.real, 100000), "down");
  f.items.forEach((i) => near(i.price, i.basePrice * 1.05));
});
test("0년·0금리·동률·물가 하락·음수 수익·다년 검증", () => {
  const z = projectPurchasingPower({ ...inflationDefaults, years: 0 });
  assert.equal(z.length, 1);
  near(z[0].real, 100000);
  for (const rate of [-5, 0, 5]) {
    const r = projectPurchasingPower({
      ...inflationDefaults,
      rate,
      inflation: rate,
    });
    r.forEach((f) => near(f.real, 100000));
  }
  const d = projectPurchasingPower({
    ...inflationDefaults,
    rate: 0,
    inflation: -2,
    years: 10,
  }).at(-1);
  near(d.real, 100000 / 0.98 ** 10);
  const n = projectPurchasingPower({
    ...inflationDefaults,
    rate: -5,
    inflation: 0,
    years: 2,
  }).at(-1);
  near(n.nominal, 90250);
  near(
    projectPurchasingPower({
      ...inflationDefaults,
      rate: 3,
      inflation: 5,
      years: 10,
    }).at(-1).real,
    100000 * (1.03 / 1.05) ** 10,
  );
});
test("구성·품목 상승률 차이는 고정 수량 비용비에 반영", () => {
  const p = {
    ...inflationDefaults,
    mode: "personal",
    foodShare: 80,
    foodInflation: 10,
    otherInflation: 0,
    years: 2,
  };
  const r = projectPurchasingPower(p);
  near(r[1].priceFactor, 1.08);
  near(r[2].priceFactor, 0.8 * 1.1 ** 2 + 0.2);
  near(r[2].annualInflation, r[2].priceFactor / r[1].priceFactor - 1);
  assert.ok(
    r[2].real < projectPurchasingPower({ ...p, foodShare: 20 })[2].real,
  );
  near(projectPurchasingPower({ ...p, foodShare: 0 })[2].priceFactor, 1);
  near(projectPurchasingPower({ ...p, foodShare: 100 })[2].priceFactor, 1.21);
  assert.deepEqual(r, projectPurchasingPower(p));
});
test("exact ratio differs from subtraction approximation; tolerant equality", () => {
  const f = projectPurchasingPower({
    ...inflationDefaults,
    years: 1,
    rate: 10,
    inflation: 20,
  })[1];
  near(f.realReturn, 1.1 / 1.2 - 1);
  near(f.approxReturn, -0.1);
  assert.notEqual(f.realReturn, f.approxReturn);
  assert.equal(comparePower(100000 + 1e-10, 100000), "same");
});
test("invalid inputs rejected, including nonfinite and impossible years", () => {
  for (const patch of [
    { years: -1 },
    { years: 1.5 },
    { years: 31 },
    { rate: NaN },
    { rate: Infinity },
    { rate: -100 },
    { inflation: -100 },
    { foodShare: 101 },
    { mode: "bad" },
    { foodInflation: -100 },
  ])
    assert.throws(
      () => projectPurchasingPower({ ...inflationDefaults, ...patch }),
      RangeError,
    );
});

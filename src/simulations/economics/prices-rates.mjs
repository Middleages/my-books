/** Self-contained teaching models. Percent inputs, no real statistical series. */
const check = (v, min, max) => {
  if (!Number.isFinite(v) || v < min || v > max)
    throw new RangeError("범위를 벗어난 값");
};
export function basket(foodWeight = 75, foodChange = 20, serviceChange = 0) {
  check(foodWeight, 0, 100);
  check(foodChange, -100, 100);
  check(serviceChange, -100, 100);
  const items = [
    { name: "식품", weight: foodWeight, change: foodChange },
    { name: "서비스", weight: 100 - foodWeight, change: serviceChange },
  ].map((i) => ({
    ...i,
    baseCost: i.weight * 100,
    cost: i.weight * 100 * (1 + i.change / 100),
    contribution: (i.weight * i.change) / 100,
  }));
  const cost = items.reduce((s, i) => s + i.cost, 0);
  return {
    items,
    baseCost: 10000,
    cost,
    index: cost / 100,
    change: cost / 100 - 100,
  };
}
export function pricePath(kind = "disinflation") {
  if (!["disinflation", "deflation", "base", "flat"].includes(kind))
    throw new RangeError("알 수 없는 경로");
  const values =
    kind === "base"
      ? [100, ...Array(14).fill(110)]
      : kind === "flat"
        ? Array(15).fill(100)
        : [
            100,
            100,
            110,
            111,
            112,
            113,
            114,
            115,
            116,
            117,
            118,
            118,
            118,
            120,
            kind === "deflation" ? 110 : 122,
          ];
  return values.map((index, m) => ({
    month: m,
    index,
    mom: m === 0 ? null : (index / values[m - 1] - 1) * 100,
    yoy: m < 12 ? null : (index / values[m - 12] - 1) * 100,
  }));
}
export function realRate(nominal, inflation) {
  check(nominal, -100, 100);
  check(inflation, -100, 100);
  return {
    nominal,
    inflation,
    nominalFactor: 1 + nominal / 100,
    priceFactor: 1 + inflation / 100,
    exact:
      inflation === -100
        ? null
        : ((1 + nominal / 100) / (1 + inflation / 100) - 1) * 100,
    approx: inflation === -100 ? null : nominal - inflation,
  };
}
export function rateComparison(nominal = 5, expected = 2, realised = 8) {
  return {
    before: realRate(nominal, expected),
    after: realRate(nominal, realised),
  };
}

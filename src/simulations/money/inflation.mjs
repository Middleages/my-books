// 원, 연말, 기준 0년. UI 반올림 전의 값으로 모든 그림·표를 계산한다.
export const inflationDefaults = {
  years: 10,
  rate: 3,
  inflation: 5,
  mode: "uniform",
  foodShare: 50,
  foodInflation: 8,
  otherInflation: 2,
};
export function comparePower(value, base) {
  return Math.abs(value - base) <= Math.max(1, Math.abs(base)) * 1e-10
    ? "same"
    : value > base
      ? "up"
      : "down";
}
export function projectPurchasingPower(p) {
  if (
    !Number.isInteger(p.years) ||
    p.years < 0 ||
    p.years > 30 ||
    !["uniform", "personal"].includes(p.mode)
  )
    throw new RangeError("기간 또는 모드 오류");
  for (const key of ["rate", "inflation", "foodInflation", "otherInflation"])
    if (!Number.isFinite(p[key]) || p[key] <= -100 || p[key] > 100)
      throw new RangeError("연율은 -100% 초과 100% 이하");
  if (!Number.isFinite(p.foodShare) || p.foodShare < 0 || p.foodShare > 100)
    throw new RangeError("비중은 0~100%");
  const frames = [];
  for (let year = 0; year <= p.years; year++) {
    const share = p.mode === "uniform" ? 0.5 : p.foodShare / 100;
    const items = [
      {
        id: "food",
        label: "식료품 묶음",
        basePrice: 5000,
        quantity: 2 * share,
        rate: p.mode === "uniform" ? p.inflation : p.foodInflation,
      },
      {
        id: "other",
        label: "생활용품 묶음",
        basePrice: 5000,
        quantity: 2 * (1 - share),
        rate: p.mode === "uniform" ? p.inflation : p.otherInflation,
      },
    ].map((i) => ({ ...i, price: i.basePrice * (1 + i.rate / 100) ** year }));
    const basketCost = items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      priceFactor = basketCost / 10000;
    const nominal = 100000 * (1 + p.rate / 100) ** year,
      real = nominal / priceFactor;
    const annualInflation =
      year === 0 ? 0 : priceFactor / frames[year - 1].priceFactor - 1;
    frames.push({
      year,
      items,
      basketCost,
      priceFactor,
      nominal,
      real,
      fixedBaskets: 100000 / basketCost,
      baskets: nominal / basketCost,
      annualInflation,
      realReturn:
        year === 0 ? 0 : (1 + p.rate / 100) / (1 + annualInflation) - 1,
      approxReturn: year === 0 ? 0 : p.rate / 100 - annualInflation,
    });
  }
  return frames;
}

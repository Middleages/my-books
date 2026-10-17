// 원 단위, 월별 교육 모델. 표시할 때만 반올림한다.
export const interestDefaults = {
  initial: 100000,
  payment: 10000,
  months: 24,
  annualRate: 12,
  rateMode: "nominal",
  timing: "end",
  taxRate: 0,
  annualFee: 0,
  fixedFee: 0,
};
export function compareInterest(a, b) {
  return Math.abs(a - b) <= Math.max(1, Math.abs(a), Math.abs(b)) * 1e-10
    ? "same"
    : a > b
      ? "more"
      : "less";
}
export function projectInterest(p) {
  for (const [key, min, max] of [
    ["initial", 0, 10000000],
    ["payment", 0, 1000000],
    ["months", 0, 360],
    ["annualRate", -100, 120],
    ["taxRate", 0, 100],
    ["annualFee", 0, 100],
    ["fixedFee", 0, 1000000],
  ])
    if (!Number.isFinite(p[key]) || p[key] < min || p[key] > max)
      throw new RangeError(`범위 밖 입력: ${key}`);
  if (
    !Number.isInteger(p.months) ||
    !["start", "end"].includes(p.timing) ||
    !["nominal", "effective"].includes(p.rateMode)
  )
    throw new RangeError("기간·계산 방식 오류");
  const monthlyRate =
    p.rateMode === "nominal"
      ? p.annualRate / 1200
      : (1 + p.annualRate / 100) ** (1 / 12) - 1;
  const paths = {};
  for (const kind of ["simple", "compound", "free"]) {
    let active = p.initial,
      reserve = 0,
      added = 0,
      gross = 0,
      tax = 0,
      fee = 0;
    const frames = [];
    let basis = 0,
      periodReturn = 0,
      periodTax = 0,
      periodFee = 0;
    const snapshot = (month, phase) =>
      frames.push({
        month,
        phase,
        initial: p.initial,
        active,
        reserve,
        total: active + reserve,
        added,
        gross,
        tax,
        fee,
        cost: tax + fee,
        net: gross - tax - fee,
        basis,
        periodReturn,
        periodTax,
        periodFee,
      });
    // Simple interest stays in a non-earning reserve; losses and costs can consume principal.
    const debit = (amount) => {
      const fromReserve = Math.min(reserve, amount);
      reserve -= fromReserve;
      active = Math.max(0, active - (amount - fromReserve));
    };
    snapshot(0, "initial");
    for (let month = 1; month <= p.months; month++) {
      basis = 0;
      periodReturn = 0;
      periodTax = 0;
      periodFee = 0;
      if (p.timing === "start") {
        active += p.payment;
        added += p.payment;
      }
      snapshot(month, "deposit");
      basis = active;
      snapshot(month, "basis");
      periodReturn = basis * monthlyRate;
      gross += periodReturn;
      if (kind === "simple" && periodReturn >= 0) reserve += periodReturn;
      else active += periodReturn;
      snapshot(month, "return");
      if (kind !== "free") {
        periodTax = (Math.max(0, periodReturn) * p.taxRate) / 100;
        debit(periodTax);
        tax += periodTax;
        periodFee = Math.min(
          active + reserve,
          ((active + reserve) * p.annualFee) / 1200 + p.fixedFee,
        );
        debit(periodFee);
        fee += periodFee;
      }
      snapshot(month, "cost");
      if (p.timing === "end") {
        active += p.payment;
        added += p.payment;
      }
      snapshot(month, "close");
    }
    paths[kind] = frames;
  }
  return { monthlyRate, effectiveAnnual: (1 + monthlyRate) ** 12 - 1, paths };
}

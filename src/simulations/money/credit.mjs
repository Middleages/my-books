// 원 단위. 원금균등 가정의 예정 부담을 관찰하며 실제 납부·연체를 실행하지 않는다.
export const creditDefaults = {
  income: 3000000,
  living: 2000000,
  existing: 200000,
  reserve: 200000,
  principal: 18000000,
  months: 36,
  annualRate: 6,
  changedRate: 12,
  changeMonth: 4,
  incomeCut: 0,
};
function statusOf(cash, margin) {
  const eps = 1e-7;
  return cash < -eps
    ? "cash-gap"
    : margin < -eps
      ? "reserve-gap"
      : Math.abs(margin) <= eps
        ? "no-extra"
        : "room";
}
export function projectCredit(p) {
  for (const [k, max] of [
    ["income", 10000000],
    ["living", 10000000],
    ["existing", 10000000],
    ["reserve", 10000000],
    ["principal", 100000000],
  ])
    if (!Number.isFinite(p[k]) || p[k] < 0 || p[k] > max)
      throw new RangeError(`잘못된 금액: ${k}`);
  if (
    !Number.isInteger(p.months) ||
    p.months < 1 ||
    p.months > 120 ||
    !Number.isInteger(p.changeMonth) ||
    p.changeMonth < 1 ||
    p.changeMonth > 24
  )
    throw new RangeError("기간 오류");
  for (const k of ["annualRate", "changedRate", "incomeCut"])
    if (
      !Number.isFinite(p[k]) ||
      p[k] < 0 ||
      p[k] > (k === "incomeCut" ? 100 : 30)
    )
      throw new RangeError("비율 오류");
  const horizon = Math.min(12, p.months),
    paths = {};
  for (const kind of ["baseline", "changed"]) {
    const rows = [],
      frames = [];
    frames.push({
      month: 0,
      phase: "start",
      income: 0,
      living: 0,
      existing: 0,
      principal: 0,
      interest: 0,
      reserve: 0,
      cash: 0,
      margin: 0,
      totalUse: 0,
      scheduledRemaining: p.principal,
    });
    for (let month = 1; month <= horizon; month++) {
      const changed = kind === "changed" && month >= p.changeMonth;
      const rate = changed ? p.changedRate : p.annualRate;
      const income = p.income * (changed ? 1 - p.incomeCut / 100 : 1);
      const opening = Math.max(
        0,
        p.principal - ((month - 1) * p.principal) / p.months,
      );
      const principal = Math.min(opening, p.principal / p.months),
        interest = (opening * rate) / 1200;
      const payment = principal + interest,
        cash = income - p.living - p.existing - payment,
        margin = cash - p.reserve;
      const row = {
        month,
        rate,
        income,
        living: p.living,
        existing: p.existing,
        reserve: p.reserve,
        opening,
        principal,
        interest,
        payment,
        closing: Math.max(0, opening - principal),
        cash,
        margin,
        status: statusOf(cash, margin),
      };
      rows.push(row);
      for (const [phase, stage] of [
        ["income", 1],
        ["expenses", 2],
        ["loan", 3],
        ["compare", 4],
      ]) {
        const living = stage >= 2 ? p.living : 0,
          existing = stage >= 2 ? p.existing : 0;
        const allocatedPrincipal = stage >= 3 ? principal : 0,
          allocatedInterest = stage >= 3 ? interest : 0,
          reserve = stage === 4 ? p.reserve : 0;
        const totalUse =
          living + existing + allocatedPrincipal + allocatedInterest + reserve;
        const remaining =
          income - living - existing - allocatedPrincipal - allocatedInterest;
        frames.push({
          month,
          phase,
          income,
          living,
          existing,
          principal: allocatedPrincipal,
          interest: allocatedInterest,
          reserve,
          cash: remaining,
          margin: remaining - reserve,
          totalUse,
          scheduledRemaining: stage >= 3 ? row.closing : opening,
        });
      }
    }
    paths[kind] = {
      rows,
      frames,
      firstPlanGap: rows.find((r) => r.margin < -1e-7)?.month ?? null,
      firstCashGap: rows.find((r) => r.cash < -1e-7)?.month ?? null,
    };
  }
  return { horizon, ...paths };
}

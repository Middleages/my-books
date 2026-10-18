export const protectionDefaults = Object.freeze({
  reserve: 3000000,
  premium: 100000,
  marketReturn: -30,
  expense: 5000000,
  deductible: 500000,
  limit: 3000000,
  covered: true,
  onTime: true,
  sellAllowed: true,
});
const range = (x, min, max) => {
  if (!Number.isFinite(x) || x < min || x > max)
    throw new RangeError("가정의 범위를 벗어났습니다.");
};
export function projectDiversification(aReturn, bReturn) {
  range(aReturn, -100, 100);
  range(bReturn, -100, 100);
  const path = (a, b) => ({ a, b, total: a + b });
  return {
    concentrated: path(1000000 * (1 + aReturn / 100), 0),
    diversified: path(
      500000 * (1 + aReturn / 100),
      500000 * (1 + bReturn / 100),
    ),
  };
}
export function projectProtection(p) {
  range(p.reserve, 0, 10000000);
  range(p.premium, 0, p.reserve);
  range(p.marketReturn, -100, 100);
  for (const k of ["expense", "deductible", "limit"]) range(p[k], 0, 20000000);
  for (const k of ["covered", "onTime", "sellAllowed"])
    if (typeof p[k] !== "boolean")
      throw new RangeError("조건은 참 또는 거짓이어야 합니다.");
  const path = (insured) => {
    const claim =
      insured && p.covered
        ? Math.min(p.limit, Math.max(0, p.expense - p.deductible))
        : 0;
    let cash = p.reserve,
      investment = 10000000 - p.reserve,
      premium = 0,
      marketChange = 0,
      payout = 0,
      expenseDue = 0,
      paid = 0,
      gap = 0,
      sale = 0;
    const frames = [];
    const snap = (phase) =>
      frames.push({
        phase,
        cash,
        investment,
        assets: cash + investment,
        premium,
        marketChange,
        payout,
        expenseDue,
        paid,
        gap,
        sale,
      });
    snap(0);
    premium = insured ? p.premium : 0;
    cash -= premium;
    snap(1);
    marketChange = (investment * p.marketReturn) / 100 || 0;
    investment += marketChange;
    snap(2);
    expenseDue = p.expense;
    gap = expenseDue;
    snap(3);
    payout = p.onTime ? claim : 0;
    cash += payout;
    snap(4);
    sale = p.sellAllowed
      ? Math.min(investment, Math.max(0, expenseDue - cash))
      : 0;
    investment -= sale;
    cash += sale;
    paid = Math.min(cash, expenseDue);
    cash -= paid;
    gap = expenseDue - paid;
    snap(5);
    return {
      claim,
      frames,
      status: gap > 0 ? "deadline-gap" : "covered-at-deadline",
    };
  };
  return { uninsured: path(false), insured: path(true) };
}

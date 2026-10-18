import { projectRepayment } from "./repayment.mjs";
export const planDefaults = Object.freeze({
  initialCash: 3000000,
  income: 3000000,
  living: 2200000,
  principal: 6000000,
  annualRate: 6,
  loanMonths: 12,
  goal: 3000000,
  monthlySaving: 250000,
  goalMonth: 12,
  delay: 6,
  incomeDrop: 20,
  extraExpense: 1000000,
});
export const planKeys = ["base", "shock", "later"];
export const planPhases = [
  "출발",
  "월수입 반영",
  "생활비·큰 지출",
  "예정 원리금",
  "목표 통장으로 이동",
  "목표일 확인",
];
const range = (v, max, integer = false, min = 0) => {
  if (
    !Number.isFinite(v) ||
    v < min ||
    v > max ||
    (integer && !Number.isInteger(v))
  )
    throw new RangeError("계획 가정의 범위를 확인하세요.");
};
export function projectPlan(p) {
  for (const key of ["initialCash", "goal"]) range(p[key], 10000000);
  for (const key of ["income", "living"]) range(p[key], 6000000);
  range(p.principal, 12000000);
  range(p.annualRate, 30);
  range(p.loanMonths, 24, true, 1);
  range(p.goalMonth, 24, true, 1);
  range(p.delay, 24 - p.goalMonth, true);
  range(p.monthlySaving, 1000000);
  range(p.incomeDrop, 100);
  range(p.extraExpense, 5000000);
  const loan = projectRepayment({
    principal: p.principal,
    annualRate: p.annualRate,
    months: p.loanMonths,
  }).paths.annuity;
  const path = (shock, goalMonth) => {
    let cash = p.initialCash,
      savings = 0,
      debt = p.principal,
      firstGap = null,
      minCash = cash;
    let cumulativeIncome = 0,
      cumulativeLiving = 0,
      cumulativeExtra = 0,
      cumulativeInterest = 0,
      cumulativePrincipal = 0,
      cumulativeGoal = 0;
    let goal = {
      month: goalMonth,
      status: "pending",
      available: 0,
      shortfall: p.goal,
    };
    const frames = [],
      rows = [];
    let income = 0,
      living = 0,
      extra = 0,
      principal = 0,
      interest = 0,
      transfer = 0,
      goalSpent = 0;
    const snap = (month, phase) => {
      const f = {
        month,
        phase,
        cash,
        savings,
        debt,
        income,
        living,
        extra,
        principal,
        interest,
        transfer,
        goalSpent,
        cumulativeIncome,
        cumulativeLiving,
        cumulativeExtra,
        cumulativeInterest,
        cumulativePrincipal,
        cumulativeGoal,
        firstGap,
        goal: { ...goal },
      };
      frames.push(f);
      return f;
    };
    rows.push(snap(0, 0));
    for (let month = 1; month <= 24; month++) {
      income =
        p.income *
        (shock && month >= 6 && month <= 8 ? 1 - p.incomeDrop / 100 : 1);
      living = 0;
      extra = 0;
      principal = 0;
      interest = 0;
      transfer = 0;
      goalSpent = 0;
      cash += income;
      cumulativeIncome += income;
      snap(month, 1);
      living = p.living;
      extra = shock && month === 6 ? p.extraExpense : 0;
      cash -= living + extra;
      cumulativeLiving += living;
      cumulativeExtra += extra;
      snap(month, 2);
      const payment = loan.rows[month - 1];
      principal = payment?.principal ?? 0;
      interest = payment?.interest ?? 0;
      debt = payment?.closing ?? 0;
      cash -= principal + interest;
      // Remove sub-micro-won floating-point residue at an exact funding boundary.
      if (Math.abs(cash) <= 1e-7) cash = 0;
      cumulativePrincipal += principal;
      cumulativeInterest += interest;
      if (cash < 0 && firstGap === null) firstGap = month;
      minCash = Math.min(minCash, cash);
      snap(month, 3);
      // Saving uses this month's positive surplus, never the initial cash reserve or borrowed money.
      const surplus = Math.max(
        0,
        income - living - extra - principal - interest,
      );
      if (month <= goalMonth && firstGap === null)
        transfer = Math.min(
          p.monthlySaving,
          surplus,
          Math.max(0, cash),
          Math.max(0, p.goal - savings),
        );
      cash -= transfer;
      savings += transfer;
      minCash = Math.min(minCash, cash);
      snap(month, 4);
      if (month === goalMonth) {
        const shortfall = Math.max(0, p.goal - savings);
        const status =
          firstGap !== null ? "gap" : shortfall > 1e-7 ? "short" : "reached";
        goal = { month, status, available: savings, shortfall };
        if (status === "reached") {
          goalSpent = Math.min(p.goal, savings);
          savings -= goalSpent;
          cumulativeGoal += goalSpent;
        }
      }
      rows.push(snap(month, 5));
    }
    return { frames, rows, goal, firstGap, minCash };
  };
  const paths = {
    base: path(false, p.goalMonth),
    shock: path(true, p.goalMonth),
    later: path(true, p.goalMonth + p.delay),
  };
  const values = Object.values(paths).flatMap((x) =>
    x.rows.flatMap((f) => [f.cash, f.savings, f.debt]),
  );
  const chartMin = Math.floor(Math.min(0, ...values) / 1000000) * 1000000;
  const chartMax = Math.max(
    1000000,
    Math.ceil(Math.max(0, ...values) / 1000000) * 1000000,
  );
  return { paths, chartMin, chartMax, monthlyPayment: loan.rows[0].payment };
}

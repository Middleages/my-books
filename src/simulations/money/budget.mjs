// 가상 2027년. 음수는 자동대출이 아니라 계획상 미충당 금액이다.
export const budgetDefaults = {
  opening: 100,
  income: 300,
  regular: 260,
  annual: 360,
  dueMonth: 3,
  payday: 5,
  saving: 30,
};
export function projectBudget(p) {
  for (const key of ["opening", "income", "regular", "annual", "saving"])
    if (!Number.isSafeInteger(p[key]) || p[key] < 0)
      throw new RangeError("0 이상의 정수 만원");
  if (
    !Number.isInteger(p.dueMonth) ||
    p.dueMonth < 1 ||
    p.dueMonth > 12 ||
    ![5, 25].includes(p.payday)
  )
    throw new RangeError("잘못된 일정");
  let living = p.opening,
    reserve = 0,
    firstGap = null;
  const months = [];
  for (let month = 1; month <= 12; month++) {
    const days = [];
    let saved = 0,
      used = 0;
    for (let day = 1; day <= new Date(2027, month, 0).getDate(); day++) {
      const events = [];
      if (day === p.payday) {
        living += p.income;
        events.push({ label: "세후 급여", amount: p.income, kind: "income" });
        saved = Math.min(p.saving, Math.max(0, living));
        living -= saved;
        reserve += saved;
        events.push({
          label: "목적통장으로 이체",
          amount: saved,
          kind: "transfer",
        });
      }
      if (day === 10) {
        living -= p.regular;
        events.push({
          label: "고정·변동 생활비",
          amount: p.regular,
          kind: "expense",
        });
      }
      if (month === p.dueMonth && day === 20) {
        used = Math.min(reserve, p.annual);
        reserve -= used;
        living -= p.annual - used;
        events.push({
          label: "연간 비정기 지출",
          amount: p.annual,
          kind: "expense",
        });
      }
      const total = living + reserve;
      if (total < 0 && !firstGap) firstGap = { month, day, amount: -total };
      days.push({ month, day, living, reserve, total, events });
    }
    months.push({
      month,
      days,
      living,
      reserve,
      total: living + reserve,
      saved,
      used,
    });
  }
  return {
    months,
    firstGap,
    averageSurplus: p.income - p.regular - p.annual / 12,
  };
}

// 원 단위 정수. 이자·수수료 0, 한 목표의 전액 지출만 다룬다.
export const savingsDefaults = {
  initial: 600000,
  locked: 400000,
  releaseMonth: 9,
  payment: 100000,
  target: 1000000,
  dueMonth: 6,
};
export function projectSavings(p) {
  for (const [key, max] of [
    ["initial", 20000000],
    ["locked", 20000000],
    ["payment", 3000000],
    ["target", 30000000],
    ["dueMonth", 24],
    ["releaseMonth", 36],
  ])
    if (!Number.isSafeInteger(p[key]) || p[key] < 0 || p[key] > max)
      throw new RangeError(`잘못된 입력: ${key}`);
  if (p.locked > p.initial) throw new RangeError("묶인 돈은 시작 준비금 이내");
  const horizon = Math.max(12, p.dueMonth, p.releaseMonth);
  const usableInitial =
    p.initial - p.locked + (p.releaseMonth <= p.dueMonth ? p.locked : 0);
  const deficit = Math.max(0, p.target - usableInitial);
  const requiredMonthly =
    deficit === 0
      ? 0
      : p.dueMonth === 0
        ? null
        : Math.ceil(deficit / p.dueMonth);
  let available = p.initial - (p.releaseMonth === 0 ? 0 : p.locked),
    locked = p.releaseMonth === 0 ? 0 : p.locked,
    added = 0,
    paid = 0,
    due = null;
  const frames = [],
    rows = [];
  const snapshot = (month, phase, released = 0, contribution = 0, spent = 0) =>
    frames.push({
      month,
      phase,
      available,
      locked,
      total: available + locked,
      added,
      paid,
      released,
      contribution,
      spent,
      due,
    });
  const check = (month) => {
    if (month !== p.dueMonth) return 0;
    const availableBefore = available,
      totalBefore = available + locked;
    const success = available >= p.target;
    const spent = success ? p.target : 0;
    available -= spent;
    paid += spent;
    due = {
      month,
      totalBefore,
      availableBefore,
      lockedBefore: locked,
      totalEnough: totalBefore >= p.target,
      success,
      shortfall: Math.max(0, p.target - availableBefore),
      paid: spent,
    };
    return spent;
  };
  snapshot(0, "initial");
  const initialAvailable = available,
    initialTotal = available + locked;
  const spentAtStart = p.dueMonth === 0 ? check(0) : 0;
  if (p.dueMonth === 0) snapshot(0, "check", 0, 0, spentAtStart);
  rows.push({
    month: 0,
    availableBefore: initialAvailable,
    lockedBefore: initialTotal - initialAvailable,
    totalBefore: initialTotal,
    added: 0,
    released: p.releaseMonth === 0 ? p.locked : 0,
    contribution: 0,
    spent: spentAtStart,
    remaining: available + locked,
  });
  for (let month = 1; month <= horizon; month++) {
    const released = month === p.releaseMonth ? locked : 0;
    available += released;
    locked -= released;
    snapshot(month, "release", released);
    available += p.payment;
    added += p.payment;
    snapshot(month, "save", 0, p.payment);
    const availableBefore = available,
      lockedBefore = locked,
      totalBefore = available + locked;
    const spent = check(month);
    snapshot(month, "check", 0, 0, spent);
    rows.push({
      month,
      availableBefore,
      lockedBefore,
      totalBefore,
      added,
      released,
      contribution: p.payment,
      spent,
      remaining: available + locked,
    });
  }
  return { horizon, frames, rows, due, usableInitial, requiredMonthly };
}

// All amounts are fictional units for a single period; no empirical forecasts.
const range = (v, min, max) => {
  if (!Number.isFinite(v) || v < min || v > max)
    throw new RangeError(`Expected ${min}..${max}`);
  return v;
};
export function exportValue(gross = 100, share = 40) {
  range(gross, 0, 200);
  range(share, 0, 100);
  const imports = (gross * share) / 100,
    domestic = gross - imports;
  return { gross, share, imports, domestic, wrong: gross + domestic };
}
export function externalAccounts(
  exports = 100,
  imports = 60,
  services = -50,
  primary = 5,
  secondary = -10,
  borrowing = 80,
) {
  range(exports, 0, 200);
  range(imports, 0, 200);
  for (const v of [services, primary, secondary]) range(v, -200, 200);
  range(borrowing, 0, 200);
  const goods = exports - imports;
  return {
    goods,
    services,
    primary,
    secondary,
    current: goods + services + primary + secondary,
    borrowing,
  };
}
export function comparativeTrade(bread = 9) {
  range(bread, 6, 18);
  const before = [
      { name: "A국", bread: 24, cloth: 12 },
      { name: "B국", bread: 6, cloth: 6 },
    ],
    production = [
      { name: "A국", bread: 36, cloth: 6 },
      { name: "B국", bread: 0, cloth: 12 },
    ],
    after = [
      { name: "A국", bread: 36 - bread, cloth: 12 },
      { name: "B국", bread, cloth: 6 },
    ];
  const gains = after.map((r, i) => r.bread - before[i].bread);
  return {
    before,
    production,
    after,
    bread,
    cloth: 6,
    ratio: bread / 6,
    gains,
    bothGain: gains.every((x) => x > 0),
    phases: [
      "① 교환 전: 각자 시간을 절반씩",
      "② 상대적 기회비용에 따라 생산 변경",
      "③ 천 6장과 빵을 교환",
    ],
  };
}
export function fiscalLedger(
  tax = 200,
  purchase = 250,
  transfer = 100,
  initialDebt = 200,
) {
  for (const v of [tax, purchase, transfer]) range(v, 0, 300);
  range(initialDebt, 0, 1000);
  const balance = tax - purchase - transfer,
    borrow = Math.max(0, -balance),
    repay = Math.min(initialDebt, Math.max(0, balance)),
    reserve = Math.max(0, balance) - repay;
  let s = {
    household: 1000,
    firm: 100,
    government: 0,
    lender: 1000,
    debt: initialDebt,
  };
  const frames = [];
  const snap = (label, flow) => frames.push({ ...s, label, flow });
  snap("① 시작 잔액", "아직 이번 기간의 거래 없음");
  s = {
    ...s,
    government: s.government + borrow,
    lender: s.lender - borrow,
    debt: s.debt + borrow,
  };
  snap("② 부족 재원 조달", `채권 매입자 → 정부 ${borrow} · 채무 +${borrow}`);
  s = { ...s, household: s.household - tax, government: s.government + tax };
  snap("③ 세금", `가계 → 정부 ${tax}`);
  s = {
    ...s,
    government: s.government - transfer,
    household: s.household + transfer,
  };
  snap("④ 이전지출", `정부 → 가계 ${transfer} · 생산물 대가 아님`);
  s = { ...s, government: s.government - purchase, firm: s.firm + purchase };
  snap("⑤ 정부 구매", `정부 → 기업 ${purchase} · 기업 → 정부 새 서비스`);
  s = {
    ...s,
    government: s.government - repay,
    lender: s.lender + repay,
    debt: s.debt - repay,
  };
  snap(
    "⑥ 기간 말 결산",
    `정부 → 채권 매입자 상환 ${repay} · 남은 현금 ${reserve}`,
  );
  return {
    tax,
    purchase,
    transfer,
    initialDebt,
    balance,
    borrow,
    repay,
    reserve,
    debt: s.debt,
    directGDP: purchase,
    frames,
  };
}
export function stabilizer(income = 600, extra = 100, lag = 3, month = 0) {
  range(income, 400, 1400);
  range(extra, 0, 200);
  range(lag, 0, 6);
  range(month, 0, 6);
  const tax = income * 0.2,
    transfer = 50 + Math.max(0, 1000 - income) * 0.25,
    disposable = income - tax + transfer,
    fixedDisposable = income - 200 + 50,
    extraApplied = month >= lag ? extra : 0,
    purchase = 250 + extraApplied;
  return {
    income,
    tax,
    transfer,
    disposable,
    fixedDisposable,
    cushion: disposable - fixedDisposable,
    extra,
    extraApplied,
    lag,
    month,
    purchase,
    balance: tax - purchase - transfer,
    baselineBalance: -100,
    baselineDisposable: 850,
    phases: [
      "① 소득 충격 관찰",
      "② 기존 세금·급여 규칙 적용",
      "③ 추가 구매의 집행 여부 확인",
    ],
  };
}

export type CreditParams = {
  income: number;
  living: number;
  existing: number;
  reserve: number;
  principal: number;
  months: number;
  annualRate: number;
  changedRate: number;
  changeMonth: number;
  incomeCut: number;
};
export type CreditStatus = "cash-gap" | "reserve-gap" | "no-extra" | "room";
export type CreditRow = {
  month: number;
  rate: number;
  income: number;
  living: number;
  existing: number;
  reserve: number;
  opening: number;
  principal: number;
  interest: number;
  payment: number;
  closing: number;
  cash: number;
  margin: number;
  status: CreditStatus;
};
export type CreditFrame = {
  month: number;
  phase: "start" | "income" | "expenses" | "loan" | "compare";
  income: number;
  living: number;
  existing: number;
  principal: number;
  interest: number;
  reserve: number;
  cash: number;
  margin: number;
  totalUse: number;
  scheduledRemaining: number;
};
export type CreditPath = {
  rows: CreditRow[];
  frames: CreditFrame[];
  firstPlanGap: number | null;
  firstCashGap: number | null;
};
export type CreditResult = {
  horizon: number;
  baseline: CreditPath;
  changed: CreditPath;
};
export const creditDefaults: CreditParams;
export function projectCredit(p: CreditParams): CreditResult;

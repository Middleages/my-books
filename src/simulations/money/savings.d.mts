export type SavingsParams = {
  initial: number;
  locked: number;
  releaseMonth: number;
  payment: number;
  target: number;
  dueMonth: number;
};
export type SavingsDue = {
  month: number;
  totalBefore: number;
  availableBefore: number;
  lockedBefore: number;
  totalEnough: boolean;
  success: boolean;
  shortfall: number;
  paid: number;
};
export type SavingsFrame = {
  month: number;
  phase: "initial" | "release" | "save" | "check";
  available: number;
  locked: number;
  total: number;
  added: number;
  paid: number;
  released: number;
  contribution: number;
  spent: number;
  due: SavingsDue | null;
};
export type SavingsRow = {
  month: number;
  availableBefore: number;
  lockedBefore: number;
  totalBefore: number;
  added: number;
  released: number;
  contribution: number;
  spent: number;
  remaining: number;
};
export type SavingsResult = {
  horizon: number;
  frames: SavingsFrame[];
  rows: SavingsRow[];
  due: SavingsDue;
  usableInitial: number;
  requiredMonthly: number | null;
};
export const savingsDefaults: SavingsParams;
export function projectSavings(p: SavingsParams): SavingsResult;

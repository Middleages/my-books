export type RepaymentKind = "equalPrincipal" | "annuity" | "bullet";
export type RepaymentParams = {
  principal: number;
  annualRate: number;
  months: number;
};
export type RepaymentRow = {
  month: number;
  opening: number;
  interest: number;
  principal: number;
  payment: number;
  closing: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
  cumulativePayment: number;
};
export type RepaymentFrame = {
  month: number;
  phase: number;
  balance: number;
  interestDue: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
  cumulativePayment: number;
};
export type RepaymentPath = {
  rows: RepaymentRow[];
  frames: RepaymentFrame[];
  totalInterest: number;
  totalPayment: number;
};
export type RepaymentResult = {
  lowestInterest: RepaymentKind | "same";
  monthlyRate: number;
  annuityPayment: number;
  paths: Record<RepaymentKind, RepaymentPath>;
};
export const repaymentDefaults: RepaymentParams;
export const repaymentKinds: RepaymentKind[];
export function projectRepayment(p: RepaymentParams): RepaymentResult;

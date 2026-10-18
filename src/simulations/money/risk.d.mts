export type ProtectionParams = {
  reserve: number;
  premium: number;
  marketReturn: number;
  expense: number;
  deductible: number;
  limit: number;
  covered: boolean;
  onTime: boolean;
  sellAllowed: boolean;
};
export type ProtectionFrame = {
  phase: number;
  cash: number;
  investment: number;
  assets: number;
  premium: number;
  marketChange: number;
  payout: number;
  expenseDue: number;
  paid: number;
  gap: number;
  sale: number;
};
export type ProtectionPath = {
  claim: number;
  frames: ProtectionFrame[];
  status: "deadline-gap" | "covered-at-deadline";
};
export const protectionDefaults: ProtectionParams;
export function projectProtection(p: ProtectionParams): {
  uninsured: ProtectionPath;
  insured: ProtectionPath;
};
export function projectDiversification(
  a: number,
  b: number,
): {
  concentrated: { a: number; b: number; total: number };
  diversified: { a: number; b: number; total: number };
};

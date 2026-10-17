export type InterestParams = {
  initial: number;
  payment: number;
  months: number;
  annualRate: number;
  rateMode: "nominal" | "effective";
  timing: "start" | "end";
  taxRate: number;
  annualFee: number;
  fixedFee: number;
};
export type InterestFrame = {
  month: number;
  phase: string;
  initial: number;
  active: number;
  reserve: number;
  total: number;
  added: number;
  gross: number;
  tax: number;
  fee: number;
  cost: number;
  net: number;
  basis: number;
  periodReturn: number;
  periodTax: number;
  periodFee: number;
};
export const interestDefaults: InterestParams;
export function compareInterest(a: number, b: number): "same" | "more" | "less";
export function projectInterest(p: InterestParams): {
  monthlyRate: number;
  effectiveAnnual: number;
  paths: Record<"simple" | "compound" | "free", InterestFrame[]>;
};

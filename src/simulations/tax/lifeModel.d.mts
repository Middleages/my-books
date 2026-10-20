export interface Frame {
  label: string;
  value?: number | null;
  detail: string;
}
export declare const MODEL_LIMIT: number;
export declare function payroll(options?: {
  gross?: number;
  exempt?: number;
  social?: number;
  withheld?: number;
}): {
  gross: number;
  exempt: number;
  taxablePay: number;
  social: number;
  withheld: number;
  net: number;
  parts: {
    id: string;
    label: string;
    value: number;
  }[];
  frames: (Frame & {
    cash: number;
    tax: number;
    social: number;
  })[];
};
export interface Settlement {
  base: number;
  deduction: number;
  usedDeduction: number;
  taxableBase: number;
  calculated: number;
  credit: number;
  usedCredit: number;
  unusedCredit: number;
  finalTax: number;
  prepaid: number;
  difference: number;
  refund: number;
  extra: number;
  direction: string;
  frames: Frame[];
}
export declare function settlement(options?: {
  base?: number;
  deduction?: number;
  credit?: number;
  prepaid?: number;
}): Settlement;

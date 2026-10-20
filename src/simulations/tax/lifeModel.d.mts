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
export declare function vatChain(options?: { sale?: number; mode?: string }): {
  sale: number;
  mode: string;
  rate: number;
  stages: {
    id: number;
    label: string;
    price: number;
    input: number;
    output: number;
    credit: number;
    remit: number;
    costTax: number;
    consumerPayment: number;
  }[];
  totalRemit: number;
  consumerTax: number;
  embeddedTax: number;
  frames: Frame[];
};
export declare const investmentKinds: {
  id: string;
  label: string;
  origin: string;
  event: string;
  category: string;
  question: string;
}[];
export declare function investmentRoute(
  id?: string,
  account?: string,
): (typeof investmentKinds)[number] & {
  account: string;
  nodes: {
    label: string;
    detail: string;
  }[];
  result: string;
};
export declare const accountKinds: {
  id: string;
  label: string;
  checks: string[];
  detail: string;
}[];
export declare function accountRoute(
  id?: string,
  states?: string[],
): (typeof accountKinds)[number] & {
  gates: {
    label: string;
    state: string;
    symbol: string;
    status: string;
  }[];
  result: string;
};
export declare const housingEvents: {
  id: string;
  label: string;
  time: string;
  kind: string;
  check: string;
  symbol: string;
}[];
export declare function housingRoute(index?: number): {
  events: typeof housingEvents;
  current: (typeof housingEvents)[number];
  index: number;
  result: string;
};
export declare function transferBase(options?: {
  kind?: string;
  value?: number;
  prior?: number;
  deduction?: number;
  confirmed?: boolean;
}): {
  kind: string;
  value: number;
  prior: number;
  deduction: number;
  combined: number;
  usedDeduction: number;
  base: number | null;
  scope: string;
  result: string;
  frames: Frame[];
};
export declare function deductionComparison(
  base?: number,
  amountOff?: number,
): {
  base: number;
  amountOff: number;
  rows: (Settlement & {
    id: string;
    label: string;
    saving: number;
  })[];
};

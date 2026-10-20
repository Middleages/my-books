export interface TaxBracket {
  start: number;
  end: number;
  rate: number;
  base: number;
  tax: number;
}
export declare const brackets: ReadonlyArray<{
  start: number;
  end: number;
  rate: number;
}>;
export declare function progressiveTax(amount: number): {
  amount: number;
  parts: TaxBracket[];
  tax: number;
  averageRate: number | null;
};
export declare const events: Array<{
  id: string;
  label: string;
  from: string;
  to: string;
  kind: string;
  check: string;
}>;

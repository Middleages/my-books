export function exportValue(
  gross?: number,
  share?: number,
): {
  gross: number;
  share: number;
  imports: number;
  domestic: number;
  wrong: number;
};
export function externalAccounts(
  exports?: number,
  imports?: number,
  services?: number,
  primary?: number,
  secondary?: number,
  borrowing?: number,
): {
  goods: number;
  services: number;
  primary: number;
  secondary: number;
  current: number;
  borrowing: number;
};
export type Goods = { name: string; bread: number; cloth: number };
export function comparativeTrade(bread?: number): {
  before: Goods[];
  production: Goods[];
  after: Goods[];
  bread: number;
  cloth: number;
  ratio: number;
  gains: number[];
  bothGain: boolean;
  phases: string[];
};
export type FiscalFrame = {
  household: number;
  firm: number;
  government: number;
  lender: number;
  debt: number;
  label: string;
  flow: string;
};
export function fiscalLedger(
  tax?: number,
  purchase?: number,
  transfer?: number,
  initialDebt?: number,
): {
  tax: number;
  purchase: number;
  transfer: number;
  initialDebt: number;
  balance: number;
  borrow: number;
  repay: number;
  reserve: number;
  debt: number;
  directGDP: number;
  frames: FiscalFrame[];
};
export function stabilizer(
  income?: number,
  extra?: number,
  lag?: number,
  month?: number,
): {
  income: number;
  tax: number;
  transfer: number;
  disposable: number;
  fixedDisposable: number;
  cushion: number;
  extra: number;
  extraApplied: number;
  lag: number;
  month: number;
  purchase: number;
  balance: number;
  baselineBalance: number;
  baselineDisposable: number;
  phases: string[];
};

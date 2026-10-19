export type Direction = "up" | "down" | "same";
export type PolicyChannel = {
  id: string;
  name: string;
  financial: string;
  exposure: string;
  effect: string;
  condition: string;
};
export const policyPhases: string[];
export function policyMap(
  direction?: Direction,
  context?: "normal" | "stress",
  phase?: number,
): {
  direction: Direction;
  context: string;
  phase: number;
  policy: string;
  phaseLabel: string;
  channels: PolicyChannel[];
};
export type PolicyRow = {
  name: string;
  principal: number;
  baseRate: number;
  reset: number;
  sign: number;
  resetMonth: number;
  applied: boolean;
  newRate: number;
  baseInterest: number;
  currentInterest: number;
  cashDelta: number;
};
export function policyExposure(
  direction?: Direction,
  schedule?: "staggered" | "fixed",
  month?: number,
): { month: number; delta: number; rows: PolicyRow[]; scale: number };
export type FxInput = {
  rate: number;
  amount: number;
  fee: number;
  importUsd: number;
  invoice: "USD" | "KRW";
  pass: number;
  lag: number;
  month: number;
};
export const fxDefaults: Readonly<FxInput>;
export type FxPair = { base: number; current: number; delta: number };
export function quote(
  rate: number,
  unit?: "KRW/USD",
): { rate: number; inverse: number; unit: string };
export function fxComparison(p?: FxInput): {
  baseRate: number;
  rate: number;
  baseQuote: ReturnType<typeof quote>;
  currentQuote: ReturnType<typeof quote>;
  rateChange: number;
  inverseChange: number;
  purchase: {
    base: number;
    gross: number;
    fee: number;
    total: number;
    baseTotal: number;
  };
  firm: {
    revenue: FxPair;
    imports: FxPair;
    debt: FxPair;
    margin: FxPair;
    domestic: number;
    invoice: string;
  };
  retail: FxPair & {
    effectivePass: number;
    lag: number;
    month: number;
    unitImport: FxPair;
    scale: number;
  };
  scale: number;
};

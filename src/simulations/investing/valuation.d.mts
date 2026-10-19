export type ShareValuationOptions = { price: number; shares: number; earnings: number; splitFactor: number };
export type CashFlowValuationOptions = { annualCash: number; residualCash: number; ratePercent: number };
export const shareValuationDefaults: Readonly<ShareValuationOptions>;
export const cashFlowValuationDefaults: Readonly<CashFlowValuationOptions>;
export type ShareValuationSnapshot = {
  factor: number; price: number; shares: number; marketCap: number; earnings: number; eps: number | null; per: number | null;
  perStatus: 'no-shares' | 'zero-earnings' | 'loss' | 'positive'; perExplanation: string;
  gridColumns: number; gridRows: number; tiles: { id: number; shares: number; marketValue: number; fraction: number }[];
  sharesPerTile: number; totalFraction: number;
};
export type ShareValuationFrame = ShareValuationSnapshot & {
  index: number; phase: 'before' | 'split' | 'compare'; label: string; message: string; splitObserved: boolean; predictionOutcome: 'same';
};
export function shareValuationFrames(options?: Partial<ShareValuationOptions>): {
  input: ShareValuationOptions; before: ShareValuationSnapshot; after: ShareValuationSnapshot;
  frames: ShareValuationFrame[]; summary: ShareValuationFrame; marketCapDirection: 'up' | 'same' | 'down';
};
export type ValuationCashSegment = { kind: 'regular' | 'residual'; label: string; value: number; fraction: number };
export type ValuationCashFlow = {
  year: number; label: string; regularCash: number; residualCash: number; futureCash: number;
  discountDivisor: number; discountFactor: number; regularPresent: number; residualPresent: number; presentValue: number;
  futureSegments: ValuationCashSegment[]; presentSegments: ValuationCashSegment[]; futureFraction: number; presentFraction: number;
};
export type CashFlowValuationFrame = {
  phase: 'assumptions' | 'year-1' | 'year-2' | 'year-3' | 'total'; label: string; message: string; index: number;
  predictionOutcome: 'up' | 'same' | 'down'; observedYears: number; contributions: (ValuationCashFlow & { observed: boolean })[]; observedPresentValue: number;
  totalSegments: { year: number; label: string; value: number; fraction: number }[];
  totalFraction: number; scale: number; isComplete: boolean;
  year1Present: number | null; year2Present: number | null; year3Present: number | null;
};
export function cashFlowValuationFrames(options?: Partial<CashFlowValuationOptions>): {
  input: CashFlowValuationOptions; rate: number; scale: number; flows: ValuationCashFlow[];
  frames: CashFlowValuationFrame[]; summary: CashFlowValuationFrame; undiscountedTotal: number; totalPresentValue: number;
  regularPresentTotal: number; residualPresentTotal: number; versusZeroRateDirection: 'up' | 'same' | 'down';
};

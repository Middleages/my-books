export interface SurrenderOptions { exitYear?: number }
export interface SurrenderPayment { year: number; amount: number; paid: boolean; timeFraction: number; moneyFraction: number }
export interface SurrenderCoverageSegment {
  id: 'covered' | 'canceled' | 'outside'; label: string; start: number; end: number; startFraction: number; fraction: number;
}
export interface SurrenderTimelineYear {
  year: number; endYear: number; scheduledPremium: number; paidPremium: number;
  newEventCovered: boolean; coverageStatus: 'covered' | 'canceled' | 'outside'; exitHere: boolean; cashAtExit: number;
}
export interface SurrenderFrame {
  index: number; phase: string; exitYear: number; kind: 'surrender' | 'maturity'; label: string; paymentCount: number; remainingScheduledPremium: number;
  cumulativePremium: number; surrenderValue: number | null; maturityValue: number | null;
  exitValue: number; difference: number; returnRatio: number; comparison: 'less' | 'same' | 'more';
  paidFraction: number; exitFraction: number; differenceFraction: number; exitTimeFraction: number;
  coverageEnd: number; coverageAfterExit: false; paymentEvents: SurrenderPayment[];
  coverageSegments: SurrenderCoverageSegment[]; timeline: SurrenderTimelineYear[]; detail: string;
}
export interface SurrenderResult {
  params: Required<SurrenderOptions>; moneyScale: number; observationEnd: number; scheduledCoverageEnd: number;
  frames: SurrenderFrame[]; frame: SurrenderFrame; quotes: SurrenderFrame[]; maturity: SurrenderFrame;
}
export const surrenderDefaults: Readonly<Required<SurrenderOptions>>;
export const surrenderContract: Readonly<{ annualPremium: number; paymentYears: readonly number[]; coverageEnd: number; observationEnd: number; maturityBenefit: number; moneyScale: number }>;
export const surrenderSchedule: readonly number[];
export function surrenderQuote(year: number): number;
export function projectSurrender(options?: SurrenderOptions): SurrenderResult;

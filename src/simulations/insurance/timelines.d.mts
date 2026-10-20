export type TimelinesOptions = { stopRenewalYear?: number | null };
export type TimelinesParams = { stopRenewalYear: number | null };
export type TimelinePayment = { year: number; amount: number; position: number; heightFraction: number };
export type TimelineContract = {
  id: 'fixed' | 'renewing'; label: string; payments: TimelinePayment[];
  paymentPeriodEnd: number;
  coverage: { start: number; end: number; position: number; fraction: number };
  totalPremium: number;
};
export type TimelineContractFrame = {
  id: 'fixed' | 'renewing'; premium: number; cumulativePremium: number; paidCount: number;
  covered: boolean; paymentStatus: string; coverageStatus: string; paymentPeriodEnded: boolean;
};
export type TimelineFrame = {
  index: number; phase: string; year: number; position: number; label: string; detail: string;
  fixed: TimelineContractFrame; renewing: TimelineContractFrame;
  renewal: { state: 'initial' | 'renewed' | 'continuing' | 'stopped' | 'inactive' | 'ended'; label: string };
};
export type TimelinesResult = {
  params: TimelinesParams;
  axis: { start: number; end: number; unit: string; premiumMax: number; ticks: { year: number; position: number }[] };
  contracts: TimelineContract[];
  periods: { index: number; start: number; end: number; annualPremium: number; position: number; fraction: number; active: boolean }[];
  renewals: { year: number; position: number; state: 'renewed' | 'stopped' | 'inactive' }[];
  frames: TimelineFrame[];
  boundaries: { id: string; year: number; position: number; label: string }[];
  comparison: { year: number; fixedCovered: boolean; fixedPremium: number; renewingCovered: boolean; answer: string };
};
export const timelinesDefaults: Readonly<TimelinesParams>;
export const timelinesTerms: Readonly<{
  observationEnd: number; fixedPaymentYears: number; fixedCoverageEnd: number; fixedAnnualPremium: number;
  renewalInterval: number; renewalCoverageEnd: number; renewalAnnualPremiums: readonly number[];
}>;
export function projectTimelines(options?: TimelinesOptions): TimelinesResult;
export function timelineBoundaryCases(options?: TimelinesOptions): TimelineFrame[];

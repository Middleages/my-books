export type PayoutContractParams = {
  loss: number;
  excluded: number;
  deductible: number;
  insurerRate: number;
  perClaimLimit: number;
  annualLimit: number;
};
export type PayoutParams = PayoutContractParams & {
  /** Effective usage, clamped to annualLimit; all money inputs are finite 0..1e12 won. */
  annualUsed: number;
};
export type PayoutOptions = Partial<PayoutParams>;
export type PayoutClaimOptions = Partial<Omit<PayoutContractParams, 'annualLimit'>>;
export type PayoutSegmentId = 'excluded' | 'deductible' | 'coinsurance' | 'capExcess' | 'annualExcess' | 'paid' | 'unresolved';
export type PayoutSegment = {
  id: PayoutSegmentId;
  label: string;
  amount: number;
  /** Share of the original loss, or zero for zero loss. No minimum visual widths. */
  fraction: number;
  leftFraction: number;
};
export type PayoutPhase = 'loss' | 'exclusion' | 'deductible' | 'coinsurance' | 'per-claim' | 'annual';
export type PayoutFrame = {
  index: number;
  phase: PayoutPhase;
  label: string;
  detail: string;
  loss: number;
  unresolved: number;
  resolvedBurden: number;
  paid: number;
  segments: PayoutSegment[];
};
export type PayoutResult = {
  params: PayoutParams;
  frames: PayoutFrame[];
  segments: PayoutSegment[];
  excluded: number;
  coveredLoss: number;
  deductible: number;
  rateBase: number;
  coinsurance: number;
  payableBeforeCaps: number;
  capExcess: number;
  payableBeforeAnnual: number;
  annualExcess: number;
  paid: number;
  remainingBurden: number;
  annualRemainingBefore: number;
  annualRemainingAfter: number;
  annualUsedAfter: number;
  verdict: string;
};
export type PayoutAnnualSegment = { index: number; amount: number; fraction: number; leftFraction: number };
export type PayoutYearGeometry = {
  initialAnnualUsed: number;
  annualUsedFraction: number;
  annualRemainingFraction: number;
  annualSegments: PayoutAnnualSegment[];
};
export type PayoutYearState = PayoutYearGeometry & {
  year: number;
  params: PayoutContractParams;
  annualUsed: number;
  annualRemaining: number;
  claims: PayoutResult[];
};
export type PayoutYearResult = PayoutYearGeometry & {
  params: PayoutParams;
  /** Exactly three successive identical claims, each with all observation frames. */
  claims: PayoutResult[];
  totalPaid: number;
  annualUsed: number;
  annualRemaining: number;
};
export type FixedBenefitOptions = { eventEligible: boolean; amount: number };
export type FixedBenefitResult = FixedBenefitOptions & { paid: number; verdict: string };
export const payoutDefaults: Readonly<PayoutParams>;
export function projectPayout(options?: PayoutOptions): PayoutResult;
export function projectPayoutYear(options?: PayoutOptions): PayoutYearResult;
export function createPayoutYear(options?: PayoutOptions): PayoutYearState;
export function previewPayoutClaim(state: PayoutYearState, options?: PayoutClaimOptions): PayoutResult;
export function submitPayoutClaim(state: PayoutYearState, options?: PayoutClaimOptions): PayoutYearState;
export function startNextPayoutYear(state: PayoutYearState): PayoutYearState;
export function projectFixedBenefit(options: FixedBenefitOptions): FixedBenefitResult;

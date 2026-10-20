export type ClaimsScenarioId = 'standard' | 'same-day' | 'delayed' | 'denied' | 'partial';
export interface ClaimsScenario { id: ClaimsScenarioId; label: string; decisionDay: number; arrivalDay: number | null; payableAmount: number; branch: boolean; outcome: 'full' | 'partial' | 'denied'; explanation: string }
export interface ClaimsOptions { scenario?: ClaimsScenarioId; startingCash?: number; day?: number }
export interface ClaimCashOptions { startingCash?: number; expense?: number; dueDay?: number; receiptDay?: number | null; receiptAmount?: number; observationEnd?: number }
export interface ClaimCashRow { day: number; receipt: number; receivedToDate: number; dueToday: boolean; dueOccurred: boolean; cashBeforePayment: number; paidToday: number; paidToDate: number; availableCash: number; unfunded: number; shortfallAtDue: number | null; notYetDue: number }
export interface ClaimsProcess { id: string; label: string; day: number | null; symbol: string; detail: string; status: string }
export interface ClaimsBranch { id: string; day: number; label: string; enabled: boolean; status: string }
export interface ClaimsSegment { id: string; label: string; amount: number; startFraction: number; fraction: number }
export interface ClaimsPoint { x: number; y: number }
export interface ClaimsFrame extends ClaimCashRow { index: number; phase: string; label: string; detail: string; timeFraction: number; process: ClaimsProcess[]; branch: ClaimsBranch[]; requestedAmount: number; confirmedAmount: number | null; expectedReceipt: number; cashFraction: number; dueSegments: ClaimsSegment[]; historyFraction: number; cashPoint: ClaimsPoint; unfundedPoint: ClaimsPoint; historyPoint: ClaimsPoint | null }
export interface ClaimsAssumptions { expense: number; requestedAmount: number; incidentDay: number; claimDay: number; dueDay: number; observationEnd: number; moneyScale: number }
export interface ClaimsEvent { id: string; label: string; day: number; lane: string; fraction: number }
export interface ClaimsResult { params: Required<ClaimsOptions>; assumptions: ClaimsAssumptions; scenario: ClaimsScenario; frames: ClaimsFrame[]; frame: ClaimsFrame; final: ClaimsFrame; due: ClaimsFrame; checkpoints: ClaimsFrame[]; events: ClaimsEvent[]; timelineEvents: ClaimsEvent[]; moneyScale: number; observationEnd: number; prediction: 'shortfall' | 'enough'; chart: { viewBox: string; cashPath: string; unfundedPath: string; historyPath: string; xTicks: { day: number; x: number }[]; yTicks: { amount: number; y: number }[]; dueX: number; receiptX: number | null } }
export const claimsDefaults: Readonly<Required<ClaimsOptions>>;
export const claimsAssumptions: Readonly<ClaimsAssumptions>;
export const claimsScenarios: readonly Readonly<ClaimsScenario>[];
export function simulateClaimCash(options?: ClaimCashOptions): ClaimCashRow[];
export function projectClaims(options?: ClaimsOptions): ClaimsResult;

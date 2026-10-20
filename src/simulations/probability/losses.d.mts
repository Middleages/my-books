export type LossParams = { cash: number; dueDay: number };
export const lossDefaults: Readonly<LossParams>;
export type LossOutcome = { loss: number; probability: number };
export type LossRow = LossOutcome & { index: number; possible: boolean; funded: number; shortage: number; remaining: number; lossFraction: number; fundedFraction: number; shortageFraction: number };
export const lossCases: readonly { id: string; label: string; outcomes: LossOutcome[] }[];
export function evaluateLoss(outcomes: LossOutcome[], cash: number): { rows: LossRow[]; expectedLoss: number; expectedShortage: number; shortageProbability: number };
export type LossResult = ReturnType<typeof evaluateLoss> & { id: string; label: string; outcomes: LossOutcome[] };
export type LossFrame = { step: number; label: string; explanation: string; cases: { id: string; row: LossRow | null }[] };
export function lossModel(input?: Partial<LossParams>): { caseId: string; dataKind: string; params: LossParams; arrival: { amount: number; day: number }; arrived: boolean; cashAtDue: number; axisMax: number; cashFraction: number; cases: LossResult[]; frames: LossFrame[]; timeline: { day: number; label: string; amount: number; meaning: string }[]; verdict: string };

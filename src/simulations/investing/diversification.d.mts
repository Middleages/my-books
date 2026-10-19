export type DiversificationKey = 'a' | 'b' | 'portfolio';
export type DiversificationOutcome = 'less' | 'same';
export interface DiversificationInput { initialAmount: number; weightA: number; commonShock: boolean }
export interface DiversificationAllocation { key: 'a' | 'b'; label: string; weight: number; amount: number }
export interface DiversificationBar { key: DiversificationKey; value: number; startFraction: number; widthFraction: number; endFraction: number }
export interface DiversificationAmountSegment { key: 'a' | 'b'; amount: number; fraction: number }
export interface DiversificationScenario { index: number; label: string; comparisonWeight: number; aReturn: number; bReturn: number; contributionA: number; contributionB: number; portfolioReturn: number; endingA: number; endingB: number; endingTotal: number; profit: number; sameDirection: boolean; bars: DiversificationBar[]; amountSegments: DiversificationAmountSegment[] }
export interface DiversificationStatistics { mean: number; variance: number; spread: number; minimum: number; maximum: number }
export interface DiversificationFrame { index: number; scenarioIndex: number | null; label: string; message: string; isSummary: boolean; portfolioReturn: number | null; contributionA: number; contributionB: number; endingA: number; endingB: number; endingTotal: number; amountSegments: DiversificationAmountSegment[]; predictionOutcome: DiversificationOutcome }
export interface DiversificationResult { input: DiversificationInput; weightB: number; allocation: DiversificationAllocation[]; initialA: number; initialB: number; moneyScale: number; scenarios: DiversificationScenario[]; statistics: Record<DiversificationKey, DiversificationStatistics>; frames: DiversificationFrame[]; summary: DiversificationFrame; predictionOutcome: DiversificationOutcome; sameDirectionCount: number; axis: { minimum: number; maximum: number; zeroFraction: number; ticks: { value: number; fraction: number }[] }; spreadBars: { key: DiversificationKey; value: number; fraction: number }[] }
export const diversificationDefaults: Readonly<DiversificationInput>;
export function diversificationFrames(options?: Partial<DiversificationInput>): DiversificationResult;
export function classifyDiversificationPrediction(outcome: DiversificationOutcome, prediction: string): boolean | null;

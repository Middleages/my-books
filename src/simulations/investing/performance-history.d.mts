export type PerformanceOutcome = 'a-deeper' | 'same' | 'undefined' | 'greater' | 'separate' | 'contaminated';
export type PathScenario = 'paths' | 'zero' | 'single';
export type ReviewMode = 'held' | 'future-leak' | 'reselection';
export type RuleId = 'a' | 'b' | 'c';
export interface PerformancePoint { index: number; label: string; value: number; peak: number; peakIndex: number; drawdown: number | null; maxDrawdown: number | null; periodReturn: number | null }
export interface PerformancePath { values: number[]; points: PerformancePoint[]; intervalCount: number; initialAmount: number; finalAmount: number; totalReturn: number | null; maxDrawdown: number | null; maxDrawdownPoint: number | null }
export interface PlotPoint extends PerformancePoint { x: number; y: number }
export interface PathPlot { id: 'a' | 'b'; label: string; points: PlotPoint[]; current: PlotPoint; polyline: string; peakY: number; gapHeight: number; totalReturn: number | null }
export interface PerformanceFrame { index: number; observationIndex: number; label: string; isSummary: boolean; paths: PathPlot[]; predictionOutcome: PerformanceOutcome; message: string }
export interface PerformanceHistoryResult { input: { scenario: PathScenario }; externalFlows: number; paths: (PerformancePath & { id: 'a' | 'b'; label: string })[]; scale: { minimum: number; maximum: number; ticks: { value: number; y: number }[] }; ticks: { label: string; x: number }[]; predictionOutcome: PerformanceOutcome; frames: PerformanceFrame[]; summary: PerformanceFrame }
export interface RecoveryFrame { index: number; label: string; message: string; isSummary: boolean; recoveryAmount: number; recoveryFraction: number; recoveryIsAssumed: boolean; compoundIndex: number; compoundAmount: number; predictionOutcome: PerformanceOutcome }
export interface RecoveryResult { input: { lossRate: number }; initialAmount: number; lossAmount: number; remainingAmount: number; requiredGain: number; recoveryRate: number | null; recoveredAmount: number | null; predictionOutcome: PerformanceOutcome; remainingFraction: number; requiredFraction: number; compounding: { returns: number[]; values: number[]; arithmeticMean: number; cumulativeReturn: number; bars: { index: number; label: string; value: number; fraction: number }[] }; frames: RecoveryFrame[]; summary: RecoveryFrame }
export interface RuleWindow extends PerformancePath { returns: number[]; endFraction: number }
export interface HistoryRule { id: RuleId; label: string; description: string; weightX: number; rebalanceEachInterval: boolean; externalFlows: number; costRate: number; normalization: string; training: RuleWindow; review: RuleWindow }
export interface ReviewFrame { index: number; label: string; message: string; isSummary: boolean; trainingVisible: boolean; reviewVisible: boolean; selectedId: RuleId | null; originalSelectedId: RuleId; futureLeak: boolean; reselected: boolean; independentReview: boolean; status: string; predictionOutcome: PerformanceOutcome }
export interface HistoryReviewResult { input: { reviewMode: ReviewMode }; rules: HistoryRule[]; trainingWindow: string[]; reviewWindow: string[]; selectionTime: string; scale: number; originalSelectedId: RuleId; selectedId: RuleId; futureLeak: boolean; reselected: boolean; independentReview: boolean; predictionOutcome: PerformanceOutcome; status: string; frames: ReviewFrame[]; summary: ReviewFrame }
export function analyzePerformancePath(values: readonly number[]): PerformancePath;
export function performanceHistoryFrames(options?: { scenario?: PathScenario }): PerformanceHistoryResult;
export function recoveryCompoundingFrames(options?: { lossRate?: number }): RecoveryResult;
export function historyReviewFrames(options?: { reviewMode?: ReviewMode }): HistoryReviewResult;
export function classifyPerformancePrediction(outcome: PerformanceOutcome, prediction: string): boolean | null;

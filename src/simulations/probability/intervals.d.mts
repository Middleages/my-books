export type IntervalParams = { mode: 'summary' | 'repeated'; n: number; sigma: number; level: number; sampleIndex: number };
export const intervalDefaults: Readonly<IntervalParams>;
export const normalCritical: Readonly<{ '.9': number; '.95': number }>;
export type Bounds = { lower: number; upper: number; half: number };
export type Intervals = { mean: number; n: number; sigma: number; level: number; z: number; ci: Bounds; pi: Bounds };
export type RepeatedInterval = Intervals & { index: number; observations: number[]; future: number; meanCovered: boolean; futureCovered: boolean };
export function knownSigmaIntervals(input: { mean: number; n: number; sigma: number; level?: number }): Intervals;
export function zeroEventUpper(n: number, confidence?: number): number;
export function intervalModel(input?: Partial<IntervalParams>): { params: IntervalParams; intervals: Intervals; plot: { meanX: number; truthX: number; futureX: number | null; ci: { start: number; width: number }; pi: { start: number; width: number } }; selected: RepeatedInterval | null; repeats: RepeatedInterval[]; coverage: { total: number; mean: number; future: number }; axis: { min: number; max: number }; zeroEvents: { n: number; events: number; confidence: number; upper: number }[]; frames: { label: string; explanation: string; ci: boolean; pi: boolean; coverage: boolean }[]; verdict: string };

import type { Summary, Bin } from './descriptive.mjs';
export type SamplingParams = { population: 'narrow' | 'tail'; n: number; mode: 'random' | 'convenience' | 'copied'; sampleIndex: number };
export const samplingDefaults: Readonly<SamplingParams>;
export type Household = { id: string; index: number; value: number };
export type MeanRecord = { index: number; mean: number; error: number; fraction: number; unique: number };
export type NumericSummary = { [K in keyof Summary]: number };
export function finiteMeanSE(sigma: number, n: number, total: number): number;
export function householdPopulation(kind?: SamplingParams['population']): Household[];
export function samplingModel(input?: Partial<SamplingParams>): { params: SamplingParams; unit: string; period: string; population: (Household & { selectedCount: number })[]; populationSummary: NumericSummary; populationMeanFraction: number; selected: (Household & { record: number })[]; current: MeanRecord; repeats: MeanRecord[]; repeatSummary: NumericSummary; bins: Bin[]; axis: { min: number; max: number; binWidth: number; maxCount: number }; inference: { available: boolean; se: number | null; reason: string }; frames: { label: string; explanation: string; selection: boolean; mean: boolean; repetition: boolean }[]; verdict: string };

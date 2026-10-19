export type ReadingId = 'stock' | 'bond' | 'etf';
export type ReadingCategory = 'observed' | 'assumed' | 'estimated' | 'missing';
export type ReadingFocus = 'structure' | 'basis' | 'claims' | 'source';
export interface ReadingClaim { id: string; category: ReadingCategory; text: string; reason: string; counterexample: string }
export interface ReadingSource { id: string; label: string; best: boolean; reason: string; limitation: string }
export interface StockStructure { kind: 'stock'; company: string; investor: string; totalShares: number; heldShares: number; ownership: number; cellShares: number; cells: { index: number; shares: number; held: boolean }[]; caption: string }
export interface BondStructure { kind: 'bond'; company: string; investor: string; face: number; schedule: { year: number; date: string; coupon: number; principal: number; total: number }[]; caption: string }
export interface EtfStructure { kind: 'etf'; fund: string; investor: string; issuedUnits: number; heldUnits: number; fundFraction: number; holdingsAsOf: string; holdings: { asset: string; code: string; weight: number; exposure: number }[]; caption: string }
export type ReadingStructure = StockStructure | BondStructure | EtfStructure;
export interface ReadingDossier {
  id: ReadingId; name: string; shortName: string; currency: string; asOf: string; period: string; introduction: string; headline: string; predictionQuestion: string; predictionReason: string;
  structure: ReadingStructure; metrics: Record<string, number | boolean | null>;
  metricRows: { label: string; value: string }[];
  sections: { id: string; label: string; text: string }[];
  claims: ReadingClaim[]; sourceQuestion: string; sources: ReadingSource[]; counterexample: string;
}
export interface ReadingFrame { index: number; focus: ReadingFocus; label: string; message: string; structure: ReadingStructure; metrics: ReadingDossier['metrics'] }
export interface ReadingResult { dossier: ReadingDossier; frames: ReadingFrame[]; summary: ReadingFrame; predictionOutcome: 'not-guaranteed' }
export interface ReadingAssessment { feedback: { id: string; category: ReadingCategory; selected: ReadingCategory | ''; correct: boolean | null; reason: string; counterexample: string }[]; source: { selected: string; correct: boolean | null; reason: string; limitation: string }; counterexample: string }
export const readingIds: readonly ReadingId[];
export const readingCategories: ReadonlyArray<{ id: ReadingCategory; label: string; description: string }>;
export function readingDossier(id?: ReadingId): ReadingDossier;
export function readingFrames(id?: ReadingId): ReadingResult;
export function classifyReadingPrediction(id: ReadingId, prediction: string): boolean | null;
export function assessReading(id: ReadingId, answers?: Record<string, ReadingCategory>, sourceAnswer?: string): ReadingAssessment;

export type AssociationParams = { lowWeight: number };
export const associationDefaults: Readonly<AssociationParams>;
export type SeasonalRecord = { group: 'used' | 'unused'; season: 'low' | 'high'; count: number; mean: number };
export const seasonalRecords: ReadonlyArray<Readonly<SeasonalRecord>>;
export function countWeightedMean(rows: { count: number; mean: number }[]): { count: number; sum: number; mean: number | null };
export function associationModel(input?: Partial<AssociationParams>): {
  params: AssociationParams;
  cells: (SeasonalRecord & { sum: number; meanFraction: number })[];
  groups: { group: string; label: string; observed: { count: number; sum: number; mean: number }; observedFraction: number; standardized: number; standardizedFraction: number; observedWeights: { low: number; high: number }; contributions: { low: number; high: number } }[];
  total: { count: number; sum: number; mean: number };
  standardizedWeights: { low: number; high: number }; observedDifference: number; standardizedDifference: number;
  causalEstimate: null; causalReason: string; axis: { min: number; max: number; unit: string };
  frames: { label: string; explanation: string; strata: boolean; standardized: boolean; causes: boolean }[];
  candidatePaths: { from: string; to: string; label: string; status: string }[];
  verdict: string;
};

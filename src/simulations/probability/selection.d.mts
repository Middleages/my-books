export type SelectionParams = { filter: 'all' | 'survivors'; information: 'known' | 'bounded' | 'unknown' };
export const selectionDefaults: Readonly<SelectionParams>;
export type CohortInput = { initial: number; ending: number | null; status: 'active' | 'closed' | 'unconfirmed' };
export type CohortSummary = { count: number; initial: number; knownEnding: number; missing: number; ending: number | null; meanEnding: number | null; totalReturn: number | null; bounds: { lower: number; upper: number; missingCount: number; assumedEndpointBounds: number[]; kind: string } | null };
export function summarizeCohort(rows: CohortInput[], filter?: 'all' | 'survivors', missingBounds?: number[] | null): CohortSummary;
export function selectionModel(input?: Partial<SelectionParams>): {
 params: SelectionParams; rows: (CohortInput & { id: string; valueKind: string; included: boolean; endingFraction: number | null; initialFraction: number })[];
 all: CohortSummary; survivors: CohortSummary; selected: CohortSummary;
 comparisons: (CohortSummary & { id: string; label: string; zeroX: number; x: number | null; interval: { lowerX: number; upperX: number } | null })[];
 counts: { initial: number; active: number; closed: number; unconfirmed: number }; axes: { amount: number[]; totalReturn: number[] }; missingBounds: number[] | null;
 frames: { label: string; explanation: string; endpoint: boolean; selected: boolean; compare: boolean }[]; verdict: string;
};

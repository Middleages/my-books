export type DependenceParams = { bothCount: number; weightA: number };
export const dependenceDefaults: Readonly<DependenceParams>;
export type JointCell = { id: string; aLoss: boolean; bLoss: boolean; count: number; label: string; probability: number; possible: boolean };
export type Joint = { total: number; aCount: number; bCount: number; bothCount: number; pA: number; pB: number; q: number; bounds: { lower: number; upper: number }; cells: JointCell[]; tokens: { state: string; aLoss: boolean; bLoss: boolean; localIndex: number; index: number; probability: number }[]; covariance: number; correlation: number | null; independent: boolean };
export function binaryJoint(input?: { total?: number; aCount?: number; bCount?: number; bothCount?: number }): Joint;
export function linearCorrelation(a: number[], b: number[]): { meanA: number; meanB: number; varianceA: number; varianceB: number; covariance: number; correlation: number | null };
export type NonlinearRow = { index: number; a: number; b: number; probability: number; x: number; y: number; selected: boolean };
export function nonlinearExample(selectedA?: number): { rows: NonlinearRow[]; selected: NonlinearRow; stats: ReturnType<typeof linearCorrelation>; marginalB: number; conditionalB: number; axis: { min: number; max: number; unit: string }; independent: boolean };
export function dependenceModel(input?: Partial<DependenceParams>): {
  params: DependenceParams; joint: Joint; initial: number; allocation: { a: number; b: number }; threshold: number; thresholdFraction: number;
  outcomes: (JointCell & { lossA: number; lossB: number; loss: number; ending: number; fraction: number; exceeds: boolean })[];
  distribution: { loss: number; count: number; probability: number; possible: boolean; fraction: number }[];
  expectedLoss: number; variance: number; sd: number; exceedsProbability: number; axis: { min: number; max: number; probabilityMin: number; probabilityMax: number };
  frames: { label: string; explanation: string; joint: boolean; loss: boolean; compare: boolean }[]; relation: string; verdict: string;
};

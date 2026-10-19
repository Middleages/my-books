export type ExpectedLossParams = {
  cash: number;
  frequentProbability: number;
  frequentLoss: number;
  severeProbability: number;
  severeLoss: number;
};
export type ExpectedLossOutcome = {
  id: 'absent' | 'present';
  eventOccurred: boolean;
  possible: boolean;
  probability: number;
  loss: number;
  cashUsed: number;
  cashRemaining: number;
  shortfall: number;
  fractions: { loss: number; cashUsed: number; cashRemaining: number; shortfall: number };
};
export type ExpectedLossScenario = {
  id: 'frequent' | 'severe';
  label: string;
  probability: number;
  loss: number;
  cash: number;
  expectedLoss: number;
  dots: { id: number; fraction: number }[];
  fractions: { probability: number; loss: number; cash: number; expectedLoss: number };
  outcomes: ExpectedLossOutcome[];
};
export type ExpectedLossFrame = {
  index: number;
  phase: 'distribution' | 'absent' | 'present';
  label: string;
  scenarios: (ExpectedLossScenario & { observation: ExpectedLossOutcome | null })[];
};
export type ExpectedLossResult = {
  params: ExpectedLossParams;
  moneyScale: number;
  scenarios: ExpectedLossScenario[];
  frames: ExpectedLossFrame[];
  expectedLossEqual: boolean;
  shortfallComparison: 'same' | 'frequent' | 'severe';
};
export const expectedLossDefaults: Readonly<ExpectedLossParams>;
export function projectExpectedLoss(options?: Partial<ExpectedLossParams>): ExpectedLossResult;

export type FinancialStatementsOptions = { creditSales: number };
export type StatementSegment = { kind: 'cash' | 'receivable' | 'liability' | 'equity'; label: string; value: number; fraction: number };
export type FinancialStatementsFrame = {
  index: number;
  phase: 'opening' | 'sale' | 'cost' | 'closing' | 'collection';
  label: string; message: string; period: '당기' | '다음 기간';
  cash: number; receivables: number; assets: number; liabilities: number; equity: number;
  periodOpeningCash: number; periodOpeningReceivables: number;
  periodRevenue: number; periodExpenses: number; periodProfit: number;
  periodOperatingCashFlow: number; periodCashChange: number; periodReceivablesChange: number;
  cumulativeRevenue: number; cumulativeExpenses: number; cumulativeProfit: number;
  cumulativeOperatingCashFlow: number; cashChange: number; saleCashReceived: number; collectionReceived: number;
  saleSplit: { total: number; cash: number; credit: number; cashFraction: number; creditFraction: number; recognized: boolean; collected: boolean };
  event: { cashIn: number; cashOut: number; revenue: number; expense: number; receivablesChange: number };
  assetSegments: StatementSegment[]; fundingSegments: StatementSegment[]; balanceScale: number;
  closingCashDirection: 'up' | 'same' | 'down';
};
export const financialStatementsDefaults: Readonly<FinancialStatementsOptions>;
export const financialStatementsScenario: Readonly<{
  openingCash: number; openingLiabilities: number; openingEquity: number;
  serviceRevenue: number; cashCosts: number; balanceScale: number;
}>;
export function financialStatementsFrames(options?: Partial<FinancialStatementsOptions>): {
  input: typeof financialStatementsScenario & FinancialStatementsOptions;
  frames: FinancialStatementsFrame[]; closing: FinancialStatementsFrame; summary: FinancialStatementsFrame;
};

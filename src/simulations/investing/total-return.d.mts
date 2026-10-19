export type TotalReturnInput = {
  initialPrice: number; dividendPerShare: number; endPrice: number; reinvest: boolean;
  sellShares: number; investorShares: number; totalShares: number; companyCash: number; investorCash: number;
};
export type ReturnCashFlow = { from: 'company' | 'investor' | 'market'; to: 'investor' | 'others' | 'market'; amount: number };
export type TotalReturnFrame = {
  phase: 'initial' | 'dividend' | 'market' | 'reinvest' | 'sale';
  status: 'ready' | 'completed' | 'rejected' | 'skipped'; message: string;
  price: number; shares: number; cash: number; companyCash: number; otherShareholdersCash: number;
  counterpartyCashChange: number; otherShares: number; totalShares: number;
  dividendsReceived: number; totalDividendPaid: number; costBasis: number;
  realizedGain: number; unrealizedGain: number; reinvestedCash: number; saleProceeds: number;
  stockValue: number; wealth: number; initialInvestment: number; initialWealth: number;
  totalGain: number; totalReturn: number | null; priceReturn: number | null; cashTotal: number;
  wealthDirection: 'up' | 'down' | 'same'; cashFlows: ReturnCashFlow[];
};
export const totalReturnDefaults: Readonly<TotalReturnInput>;
export function totalReturnFrames(options?: Partial<TotalReturnInput>): { input: TotalReturnInput; frames: TotalReturnFrame[]; summary: TotalReturnFrame };

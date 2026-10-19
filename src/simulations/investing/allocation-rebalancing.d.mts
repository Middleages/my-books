export type AllocationAsset = 'stock' | 'bond';
export type AllocationKey = AllocationAsset | 'cash';
export type AllocationOutcome = 'up' | 'same' | 'down' | 'undefined';
export interface AllocationInput { initialAmount: number; stockWeight: number; stockReturn: number; bondReturn: number }
export interface AllocationState { stockUnits: number; bondUnits: number; stockPrice: number; bondPrice: number; cash: number }
export interface AllocationSnapshot extends AllocationState { stockValue: number; bondValue: number; total: number; stockWeight: number | null; bondWeight: number | null; cashWeight: number | null }
export interface AllocationOrder { asset: AllocationAsset; side: 'sell' | 'buy'; amount: number }
export interface AllocationTrade { accepted: boolean; reason: 'no-trade' | 'executed' | 'zero-price' | 'budget-exceeded' | 'holding-exceeded' | 'unsupported-quantity' | 'unrepresentable-trade'; amount: number; units: number; state: AllocationState }
export interface AllocationSegment { key: AllocationKey; label: string; value: number; fraction: number }
export interface AllocationFrame extends AllocationSnapshot { key: 'initial' | 'drift' | 'sell' | 'buy'; index: number; label: string; time: string; message: string; sold: number; bought: number; externalFlow: number; cost: number; tax: number; targetStock: number; targetBond: number; targetStockWeight: number; targetBondWeight: number; segments: AllocationSegment[]; predictionOutcome: AllocationOutcome; movement: { from: AllocationKey; to: AllocationKey; amount: number } | null }
export interface AllocationResult { input: AllocationInput; frames: AllocationFrame[]; initial: AllocationFrame; drift: AllocationFrame; afterSale: AllocationFrame; summary: AllocationFrame; moneyScale: number; axis: { value: number; fraction: number }[]; targetStock: number; targetBond: number; targetBondWeight: number; seller: AllocationAsset | null; buyer: AllocationAsset | null; plannedAmount: number; tradeAmount: number; soldUnits: number; boughtUnits: number; status: 'undefined-total' | 'blocked-zero-price' | 'already-target' | 'rebalanced'; targetReached: boolean | null; predictionOutcome: AllocationOutcome; profit: number; totalReturn: number | null; weightChange: number | null; targetMarkerFraction: number; tradeLabel: string }
export const allocationDefaults: Readonly<AllocationInput>;
export function allocationSnapshot(state: AllocationState): AllocationSnapshot;
export function executeAllocationTrade(state: AllocationState, order: AllocationOrder): AllocationTrade;
export function allocationFrames(options?: Partial<AllocationInput>): AllocationResult;
export function classifyAllocationPrediction(outcome: AllocationOutcome, prediction: string): boolean | null;

export interface CostsFxInput { budgetKrw: number; buyPriceUsd: number; sellPriceUsd: number; buyFx: number; sellFx: number; buyFeeRate: number; sellFeeRate: number; }
export type CostsFxOutcome = 'up' | 'same' | 'down' | 'undefined';
export interface CostsFxFrame { predictionOutcome: CostsFxOutcome; index: number; label: string; message: string; cashKrw: number; cashUsd: number; assetUsd: number; units: number; fx: number; paidBuyFeeUsd: number; paidSellFeeUsd: number; totalKrw: number; cashKrwFraction: number; cashUsdKrwFraction: number; assetKrwFraction: number; }
export interface CostsFxComparison { id: string; label: string; value: number; fraction: number; }
export interface CostsFxSplit { id: string; label: string; totalUsd: number; keptUsd: number; feeUsd: number; keptLabel: string; keptFraction: number; feeFraction: number; }
export interface CostsFxResult { input: CostsFxInput; budgetUsd: number; purchaseUsd: number; buyFeeUsd: number; quantity: number; grossSaleUsd: number; sellFeeUsd: number; netSaleUsd: number; finalKrw: number; assetMultiplier: number; fxMultiplier: number; combinedMultiplier: number; assetReturn: number; fxReturn: number; noFeeReturn: number | null; netReturn: number | null; noFeeFinalKrw: number; buyFeeOnlyFinalKrw: number; costEffectKrw: number; paidTradeFeesKrw: number; fxFeesKrw: number; additionalOperatingFee: number; predictionOutcome: CostsFxOutcome; krwScale: number; usdScale: number; comparison: CostsFxComparison[]; splits: CostsFxSplit[]; frames: CostsFxFrame[]; summary: CostsFxFrame; }
export interface FxAreaPiece { id: string; label: string; amountKrw: number; x: number; y: number; width: number; height: number; }
export const costsFxDefaults: Readonly<CostsFxInput>;
export const costsFxPresets: ReadonlyArray<{ id: string; label: string; input: Readonly<CostsFxInput> }>;
export function costsFxScenario(options?: Partial<CostsFxInput>): CostsFxResult;
export function classifyCostsFxPrediction(actual: CostsFxOutcome, prediction: string): boolean | null;
export function fxReturnPrimer(): CostsFxResult & { pieces: FxAreaPiece[]; additiveReturn: number; interactionReturn: number };

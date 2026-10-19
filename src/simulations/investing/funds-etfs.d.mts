export type FundsDirection = 'up' | 'same' | 'down' | 'undefined';
export interface ExposureInput { xWeight: number; sameHoldings: boolean }
export interface AssetSegment { asset: string; fraction: number }
export interface ExposureFrame { index: number; label: string; message: string; predictionOutcome: FundsDirection; exposures: AssetSegment[]; accountedWeight: number; unexaminedWeight: number; xVisible: boolean; yVisible: boolean; grouped: boolean }
export interface ExposureResult { input: ExposureInput; yWeight: number; funds: { id: string; weight: number; holdings: AssetSegment[]; contributions: AssetSegment[] }[]; frames: ExposureFrame[]; summary: ExposureFrame; exposure: AssetSegment[]; totalWeight: number; overlapAssets: string[]; predictionOutcome: FundsDirection }
export interface NavInput { initialAssets: number; liabilities: number; issuedUnits: number; heldUnits: number; underlyingReturn: number; marketPrice: number }
export interface NavSnapshot { assets: number; liabilities: number; netAssets: number; issuedUnits: number; heldUnits: number; nav: number | null; marketPrice: number | null; premium: number | null; heldNavValue: number | null; heldMarketValue: number | null; predictionOutcome: FundsDirection }
export interface NavFrame extends NavSnapshot { index: number; label: string; message: string; navFraction: number | null; marketFraction: number | null; netAssetFraction: number }
export interface NavResult { input: NavInput; frames: NavFrame[]; summary: NavFrame; initial: NavFrame; predictionOutcome: FundsDirection; priceScale: number; assetScale: number }
export interface TrackingMetrics { differences: number[]; meanDifference: number; trackingError: number; benchmarkReturn: number; fundReturn: number; trackingDifference: number; periods: number }
export interface TrackingResult { chart: { minimum: number; maximum: number; width: number; height: number; left: number; top: number; plotWidth: number; plotHeight: number }; ticks: { value: number; y: number; fraction: number }[]; series: (TrackingMetrics & { id: string; label: string; returns: number[]; symbol: string; points: { month: number; value: number; x: number; y: number }[] })[]; rows: { month: number; benchmarkReturn: number; steadyReturn: number; varyingReturn: number; steadyDifference: number; varyingDifference: number }[] }
export const fundsDefaults: Readonly<ExposureInput>;
export const navDefaults: Readonly<NavInput>;
export function exposureFrames(options?: Partial<ExposureInput>): ExposureResult;
export function navSnapshot(input: { assets: number; liabilities?: number; issuedUnits: number; heldUnits?: number; marketPrice?: number | null }): NavSnapshot;
export function navFrames(options?: Partial<NavInput>): NavResult;
export function classifyFundsPrediction(actual: FundsDirection, prediction: string): boolean | null;
export function trackingMetrics(benchmarkReturns: number[], fundReturns: number[]): TrackingMetrics;
export function trackingComparison(): TrackingResult;

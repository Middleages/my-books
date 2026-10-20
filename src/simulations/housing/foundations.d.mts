export type HousingMode = 'rent' | 'jeonse' | 'buy';
export interface RightsState {label: string; cash: number; debt: number; claim: number; home: number; expense: number; route: string; detail: string; netWorth: number;}
export const housingModes: { id: HousingMode; label: string; payment: number; loan: number; fee: number }[];
export function rightsFrames(mode?: HousingMode, withFee?: boolean): { id: HousingMode; label: string; payment: number; loan: number; fee: number; states: RightsState[] };
export interface RentOptions {depositB?: number; rentB?: number; loanShare?: number; loanRate?: number; opportunityRate?: number; available?: number;}
export function rentComparison(options?: RentOptions): {depositA: number; rentA: number; depositB: number; rentB: number; additional: number; rentSaving: number; financed: number; ownAdditional: number; monthlyInterest: number; monthlyOpportunity: number; annualizedOffer: number | null; monthlyCashSaving: number; monthlyEconomicDifference: number | null; requiredA: number; requiredB: number; shortageA: number; shortageB: number; rateReason: string;};
export function rentalTimeline(options?: {deposit?:number;rent?:number;months?:number}): {label:string;paid:number;claim:number;refund:number;rentExpense:number;netOut:number}[];

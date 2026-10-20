import type {Snapshot,Event,Period} from './business-ledger.mjs';
export interface DepreciationOptions {cost?:number;residual?:number;lifeMonths?:number;availableMonth?:number}
export interface DepreciationRow {month:number;used:number;amount:number;accumulated:number;net:number;unallocated:number;residual:number}
export interface DepreciationSchedule {cost:number;residual:number;lifeMonths:number;availableMonth:number;depreciable:number;monthly:number;months:number;rows:DepreciationRow[]}
export interface EquipmentFrame extends Snapshot {index:number;title:string;detail:string;event:Event|null;month:number;purchased:boolean;schedule:DepreciationSchedule;periodResult:Period;expenseThisMonth:number;exerciseCash:number;purchasePayment:number;exerciseProfit:number;unallocated:number;residualHeld:number}
export type FinancingMode='capital'|'loan'|'settlement';
export type FinancingRoute='none'|'owner-in'|'bank-in'|'bank-interest'|'bank-principal'|'owner-dividend';
export interface FinancingFrame extends Snapshot {index:number;title:string;detail:string;event:Event|null;route:FinancingRoute;mode:FinancingMode;before:Snapshot;flowAmount:number;flowDirection:'in'|'out'|'none';exerciseCash:number;impact:{cash:number;profit:number;loan:number;capital:number;retained:number}}
export function depreciationSchedule(options?:DepreciationOptions):DepreciationSchedule;
export function equipmentFrames(options?:DepreciationOptions):EquipmentFrame[];
export const financingModes:readonly FinancingMode[];
export const financingLabels:Readonly<Record<FinancingMode,string>>;
export function financingFrames(mode?:FinancingMode):FinancingFrame[];

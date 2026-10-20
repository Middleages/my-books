import type {Snapshot,Event,Period} from './business-ledger.mjs';
export type RevenueMode='credit'|'advance'|'next-period';
export interface TimingFrame extends Snapshot {index:number;title:string;detail:string;period:string;periodResult:Period;event:Event|null;exerciseCash:number;exerciseExpenses:number}
export interface RevenueFrame extends TimingFrame {elapsedDay:number;mode:RevenueMode;soldQuantity:number;timeline:{duration:number;deliveryDay:number;receiptDay:number;receiptAmount:number;claimSegments:{id:string;amount:number;offsetAmount:number;startDay:number;endDay:number|null;displayEndDay:number;observedEndDay:number;settled:boolean}[];obligationSegment:{amount:number;startDay:number;endDay:number;observedEndDay:number;recognized:boolean;settled:boolean}|null};transferred:boolean;receiptTotal:number}
export interface ExpenseFrame extends TimingFrame {monthsUsed:number;payment:number;prepaidSegments:{month:number;amount:number;recognized:boolean;used:boolean}[];serviceReceived:number;servicePaid:number}
export const revenueModes:readonly RevenueMode[];
export const revenueLabels:Readonly<Record<RevenueMode,string>>;
export function revenueFrames(options?:{mode?:RevenueMode}):RevenueFrame[];
export function expenseFrames(options?:{payment?:number}):ExpenseFrame[];

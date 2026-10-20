import type {Snapshot,Event} from './business-ledger.mjs';
export type CostMethod='single'|'fifo'|'average';
export interface CostAllocation {quantity:number;unitCost:number;amount:number}
export interface InventoryCost {method:CostMethod;soldQuantity:number;purchasedQuantity:number;remainingQuantity:number;layers:{quantity:number;unitCost:number}[];allocations:CostAllocation[];totalCost:number;costOfSales:number;endingCost:number;sales:number}
export interface OperationsFrame extends Snapshot {index:number;title:string;detail:string;day:number;event:Event|null;exerciseCash:number;receiptTotal:number;paymentTotal:number}
export interface InventoryFrame extends OperationsFrame {method:CostMethod;cost:InventoryCost;purchased:boolean;delivered:boolean;tokens:{id:number;quantity:number;remaining:number;sold:number;planned:boolean}[];purchasedQuantity:number;remainingQuantity:number;soldQuantity:number;availableCost:number}
export type WorkingMode='base'|'stock-credit'|'stock-paid'|'due-before'|'due-after';
export interface PaymentAttempt {id:string;day:number;required:number;available:number;shortage:number;status:'blocked'|'paid'}
export interface WorkingFrame extends OperationsFrame {mode:WorkingMode;collection:number;extra:boolean;dueDay:number;payment:number;attempted:PaymentAttempt|null;attempts:PaymentAttempt[];owc:number;owcChange:number;exerciseProfit:number;bridgeCash:number;history:{day:number;cash:number}[]}
export const costMethods:readonly CostMethod[];
export const costLabels:Readonly<Record<CostMethod,string>>;
export function inventoryCost(soldQuantity?:number,method?:CostMethod):InventoryCost;
export function inventoryFrames(options?:{soldQuantity?:number;method?:CostMethod}):InventoryFrame[];
export const workingModes:readonly WorkingMode[];
export const workingLabels:Readonly<Record<WorkingMode,string>>;
export function narrowWorkingCapital(s:Snapshot):number;
export function workingCapitalFrames(options?:{mode?:WorkingMode;collection?:number}):WorkingFrame[];

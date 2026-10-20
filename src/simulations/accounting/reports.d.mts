import type {Snapshot,Event} from './business-ledger.mjs';
export type ReportScenario='base'|'no-collection'|'full-collection'|'stock-credit'|'stock-paid'|'service-paid'|'long-life';
export type Basis='profit'|'operating';
export interface BridgeRow {id:string;label:string;amount:number;before:number;after:number;detail?:string}
export interface Geometry {left:number;width:number;start:number;end:number;zero:number|null;direction:'right'|'left'|'none'}
export interface Parts {assets:[string,string,number][];claims:[string,string,number][]}
export interface SourceEvent extends Omit<Event,'rows'> {impact:{cash:number;profit:number;equity:number};rows:(Event['rows'][number]&{label:string})[]}
export interface Report {scenario:ReportScenario;label:string;company:string;period:string;unit:string;opening:Snapshot;closing:Snapshot;openingParts:Parts;closingParts:Parts;income:BridgeRow[];equity:BridgeRow[];cash:BridgeRow[];direct:{id:string;label:string;amount:number}[];directTotal:number;sourceEntries:SourceEvent[];reconciled:boolean}
export interface StatementFrame {index:number;kind:'position'|'income'|'equity'|'cash';title:string;detail:string;report:Report}
export interface ProfitCashFrame {index:number;basis:Basis;scenario:ReportScenario;title:string;detail:string;current:BridgeRow;rows:(BridgeRow&{observed:boolean;geometry:Geometry})[];report:Report;result:number;complete:boolean;reconciled:boolean}
export const reportScenarios:readonly ReportScenario[];
export const reportLabels:Readonly<Record<ReportScenario,string>>;
export function bridgeGeometry(row:Pick<BridgeRow,'amount'|'before'|'after'>,min?:number,max?:number):Geometry;
export function reportModel(scenario?:ReportScenario):Report;
export function statementFrames(scenario?:ReportScenario):StatementFrame[];
export function profitCashFrames(scenario?:ReportScenario,basis?:Basis):ProfitCashFrame[];
export function scopeComparison(mode?:'same'|'mixed'):{mode:string;compatible:boolean;incomePeriod:string;cashPeriod:string;profit:number;cashFlow:number;partialProfit?:number;endingCash?:number;reconciliation:number|null};

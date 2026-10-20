export interface Row {account:string;side:'debit'|'credit';amount:number}
export interface Event {id:string;label:string;rows:Row[];period?:string;day?:number;cashFlow?:'operating'|'investing'|'financing'|'unclassified'}
export interface State {balances:Record<string,number>;openingCash:number;openingBalances:Record<string,number>;entries:Event[];appliedIds:string[]}
export interface Flows {operating:number;investing:number;financing:number;unclassified:number}
export interface Period {period:string;revenue:number;expenses:number;profit:number;cashChange:number;cashFlows:Flows;movements:Record<string,number>;entryIds:string[]}
export interface Snapshot extends State {assets:number;liabilities:number;equity:number;revenue:number;expenses:number;profit:number;balanced:boolean;cashChange:number;cashFlows:Flows;grossProfit:number;operatingProfit:number;netEquipment:number;retainedEarnings:number}
export const businessAccounts:Readonly<Record<string,Readonly<{label:string;kind:string;normal:'debit'|'credit';contra?:boolean}>>>;
export function createLedger(opening?:Record<string,number>):State;
export function post(state:State,event:Event):State;
export function snapshot(state:State):Snapshot;
export function periodSummary(state:State,period:string):Period;
export function debit(account:string,amount:number):Row;
export function credit(account:string,amount:number):Row;

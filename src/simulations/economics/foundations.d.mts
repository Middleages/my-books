export type FlowParams={hours:number;wanted:number};
export type FlowFrame={phase:number;householdCash:number;firmCash:number;wages:number;produced:number;sold:number;revenue:number;labour:number;inventory:number;unfilled:number};
export const flowDefaults: Readonly<FlowParams>;
export const flowPhases:string[];
export function flowFrames(p:FlowParams):FlowFrame[];
export type Market={d:number;s:number;price:number;demand:number;supply:number;gap:number;equilibrium:{price:number;quantity:number};curves:{demand:{p:number;q:number}[];supply:{p:number;q:number}[]}};
export function market(d:number,s:number,price:number):Market;
export function compareMarkets(current:Market,base:Market):{price:'up'|'same'|'down';quantity:'up'|'same'|'down'};

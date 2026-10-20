export const domains: string[];
export const states: string[];
export const observations: string[][];
export function observationFrame(index?:number): {domain:string;state:string;code:number;note:string}[];
export function ageFrame(gestationWeeks?:number,elapsedWeeks?:number):{gestationWeeks:number;elapsedWeeks:number;earlyDays:number;elapsedDays:number;correctedDays:number;birth:string;due:string;now:string};
export function calendarDays(start:string,end:string):number;
export const evidenceAges:number[];
export function ageNeighbors(months:number):{months:number;exact:boolean;before:number|null;after:number|null};

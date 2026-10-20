export const routineSource:{source:string;version:string;country:string;checkedAt:string;targetPopulation:string;limitations:string};
export const napWindow:{start:number;end:number};
export const napDays:{id:string;label:string;context:string;opportunity:number[][]|null;confirmed:number[][];estimated:number[][]}[];
export function napTime(minute:number):string;
export function napFrame(id:string,includeEstimates?:boolean):typeof napDays[number]&{hasEstimate:boolean;confirmedMinutes:number;hasConfirmed:boolean;transitionDate:null;window:typeof napWindow};
export const routineCards:{id:string;label:string;explanation:string}[];
export const families:{id:string;label:string;order:string[];care:string}[];
export function routineFrame(familyId:string,order?:string[]):{family:typeof families[number];order:string[];cards:typeof routineCards;sleepOnset:null;score:null;source:typeof routineSource};
export function moveRoutineCard(order:string[],id:string,delta:number):string[];

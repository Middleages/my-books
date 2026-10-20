export const changedDays:{id:string;label:string;event:string;eventHour:number|null;sleep:number[][];unknown:number[][];note:string}[];
export function changedDayFrame(id?:string,showContext?:boolean):{day:typeof changedDays[number];showContext:boolean;confirmedHours:number;cause:null;regressionWeek:null;diagnosis:null};
export const restPlans:{id:string;label:string;people:string[];slots:string[][];note:string}[];
export const slotLabels:string[];
export function restFrame(id?:string):{plan:typeof restPlans[number];coverage:number[];gaps:number[];restHours:number[];longestRestHours:number[];actualSleep:null;childSleep:null;familyScore:null};

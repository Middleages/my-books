export const drinkLabels:{id:string;label:string;basis:number;sugar:number;calcium:number}[];
export const dayEvents:{time:string;kind:string;label:string}[];
export function drinkFrame(mode?:string,highlight?:string):{mode:string;labels:(typeof drinkLabels[number]&{displayBasis:number;displaySugar:number;displayCalcium:number})[];events:(typeof dayEvents[number]&{highlighted:boolean})[];recommendedVolume:null;replacement:null;nutrientAdequacy:null};
export const encounterRecords:{day:number;offered:boolean|null;explored:boolean|null;intake:boolean|null;context:string}[];
export function encounterFrame(mode?:string):{mode:string;days:typeof encounterRecords;prediction:null;requiredAttempts:null;growthScore:null;allergyRechallenge:false};

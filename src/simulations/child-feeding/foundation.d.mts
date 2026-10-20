export const roles:{id:string;label:string;note:string}[];
export const meals:{id:string;label:string;offered:number|null;remaining:number|null;intake:number|null;spilled:number|null;discarded:number|null;unknown:number|null;note:string}[];
export function mealFrame(id:string):typeof meals[number]&{destinations:{key:string;label:string;amount:number|null}[];disappeared:number|null};
export const experiences:{id:string;label:string;x:number;text:string}[];
export const readinessCases:{id:string;label:string;known:string;unknown:string;question:string;kind:string}[];
export function readinessFrame(id:string):typeof readinessCases[number]&{sourceAge:string;decision:string;source:{country:string;organization:string;updated:string;checked:string}};

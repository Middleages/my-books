export const supportCases:{id:string;title:string;record:string;question:string;next:string}[];
export const supportTerms:{id:string;title:string;meaning:string;not:string}[];
export function supportFrame(id:string,step?:number):typeof supportCases[number]&{step:number;note:string;documentX:number;lineActive:boolean;diagnosis:null};

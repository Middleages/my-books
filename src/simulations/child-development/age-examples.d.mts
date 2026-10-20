export const ageDomains:{id:string;title:string}[];
export const ageSources:{age:number;url:string;checked:string}[];
export const ageExamples:{id:string;age:number;domain:string;text:string}[];
export function ageExampleFrame(age:number,domain?:string):{source:typeof ageSources[number];domain:string;examples:typeof ageExamples;position:number;interpolated:boolean};

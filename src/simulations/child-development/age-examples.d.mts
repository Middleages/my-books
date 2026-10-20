export const ageDomains:{id:string;title:string}[];
export const ageSources:{age:number;url:string;checked:string}[];
export const ageExamples:{id:string;age:number;domain:string;text:string;title:string;observe:string;sourceDomain:string}[];
export function ageExampleFrame(age:number,domain?:string):{source:typeof ageSources[number];domain:string;examples:typeof ageExamples;position:number;interpolated:boolean};

export const ageGroups:Record<string,number[]>;
export const allAgeSources:typeof ageSources;
export function sourcesForGroup(group:string):typeof ageSources;
export function sourcePosition(age:number,group:string):number;

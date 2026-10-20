export const consultationTopics:{id:string;label:string;fact:string;unknown:string;question:string}[];
export function consultationFrame(focus?:string):{focus:string;topics:(typeof consultationTopics[number]&{selected:boolean})[];summary:string[];diagnosis:null;diseaseProbability:null;reassurance:null;urgencyScore:null};
export const weekCases:{id:string;label:string;days:(string|null)[]}[];
export const planLayers:{id:string;label:string;text:string}[];
export function weekFrame(id?:string,focus?:string):{week:typeof weekCases[number];missingDays:number;focus:string;layers:(typeof planLayers[number]&{selected:boolean})[];sleepTotal:null;improvement:null;safetyPassed:null;completionScore:null};

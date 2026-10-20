export const windowStart:number,windowEnd:number;
export const scenarios:{id:string;label:string;bed:number[][];sleep:number[][];awake:number[][]}[];
export const states:Record<string,string>;
export function timeLabel(minute:number):string;
export function recordFrame(id:string):{segments:{start:number;end:number;state:string;bed:boolean}[];bedMinutes:number;sleepMinutes:number;awakeMinutes:number;unknownMinutes:number;conflictMinutes:number;hasSleep:boolean};
export function intervalFrame(s:{bed:number[][];sleep:number[][];awake:number[][]}):ReturnType<typeof recordFrame>;
export const spaceParts:{id:string;label:string;explanation:string}[];

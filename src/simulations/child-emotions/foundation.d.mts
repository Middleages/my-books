export function boundaryFrame(emotion?: number, action?: string): {emotion:number;interpretation:string;observed:string;action:string;safePath:boolean;boundary:string;age:string;unknown:string;fact:string};
export function careFrame(step?:number): {signal:string;attention:string;response:string;connection:string;next:string;step:number;age:string;outcome:string;steps:number};
export function moveStep(step:number,delta:number):number;

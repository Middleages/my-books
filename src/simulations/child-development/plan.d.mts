export const planContexts:{id:string;title:string;question:string;opportunity:string}[];
export const planRecords:{id:string;symbol:string;title:string;note:string}[];
export function planFrame(context:string,record:string,day?:number):{context:typeof planContexts[number];record:typeof planRecords[number];day:number;slots:{day:number;planned:boolean;state:string;symbol:string}[];question:string;next:string};

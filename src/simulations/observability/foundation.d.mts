export type Signal='logs'|'metrics'|'traces';
export const signals: Signal[];
export const requests: readonly {id:string;status:number;durationMs:number;traceId:string}[];
export function signalFrame(step?:number,hidden?:string):{step:number;seen:typeof requests;total:number;errors:number;errorRate:number|null;logs:null|{requestId:string;message:string}[];metrics:null|{count:number;errors:number};traces:null|{requestId:string;traceId:string;durationMs:number}[];hidden:string};
export const stages:string[];
export function pipelineFrame(step?:number,failure?:string):{step:number;stage:string;failure:string;paths:{signal:Signal;backend:string;accepted:boolean;persisted:boolean;queried:boolean;queryable:boolean;status:string}[]};

export type LabelEvent={id:string;service:string;route:string;url:string;status:number};
export const labelEvents:readonly LabelEvent[];
export type LabelGroup={key:string;labels:Record<string,string|number>;events:string[]};
export function cardinalityFrame(step?:number,mode?:string):{step:number;mode:string;events:readonly LabelEvent[];groups:LabelGroup[];baseline:LabelGroup[];observedCount:number;potentialProduct:number;domains:{key:string;values:(string|number)[]}[];totalEvents:number;baselinePotential:number};
export type Span={id:string;name:string;start:number;end:number;parentId:string|null;traceId:string;received:boolean};
export function traceFrame(step?:number,mode?:string):{step:number;mode:string;now:number;spans:Span[];received:Span[];elapsed:number|null;childDurationSum:number;childrenComplete:boolean;rootEnd:number;axisMax:number};

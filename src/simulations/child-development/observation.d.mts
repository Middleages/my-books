export type ObservationCase={id:string;title:string;state:string;opportunity:boolean|null;known:boolean;help:string;context:string;behavior:string;toyX:number|null;handX:number|null;adult:boolean};
export const observationCases:ObservationCase[];
export function recordFrame(id?:string,step?:number):ObservationCase&{step:number;parts:string[];visible:string[];record:string};
export const actions:{id:string;title:string}[];
export function movementFrame(action?:string,placement?:string,step?:number):{action:string;placement:string;step:number;handX:number;toyX:number;bodyAngle:number;grip:boolean;resting:boolean;note:string;placementRelevant:boolean};

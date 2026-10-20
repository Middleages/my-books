export const communicationCases:{id:string;title:string;signal:string;channel:string;target:string}[];
export type CommunicationFrame={id:string;title:string;signal:string;channel:string;target:string;response:string;step:number;adultTarget:string;shared:boolean;direction:string;note:string;parts:string[];nextKnown:boolean};
export function communicationFrame(id?:string,response?:string,step?:number):CommunicationFrame;
export const interactionCases:{id:string;title:string;signal:string;response:string;next:string;pause:boolean}[];
export type InteractionFrame={id:string;title:string;signal:string;response:string;next:string;pause:boolean;step:number;parts:string[];note:string;direction:string;resting:boolean;nextKnown:boolean};
export function interactionFrame(id?:string,step?:number):InteractionFrame;

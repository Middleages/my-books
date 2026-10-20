export const signalCases:{id:string;label:string;observation:string;unknown:string}[];
export const responses:{id:string;label:string;text:string}[];
export function responsiveFrame(id?:string,response?:string,step?:number):{case:typeof signalCases[number];response:typeof responses[number];step:number;stages:{label:string;text:string;revealed:boolean}[];cause:null;intake:null;score:null};
export const toolScenes:{id:string;label:string;tool:string;help:string;paths:string[];confirmed:null}[];
export function toolFrame(id?:string):typeof toolScenes[number]&{intake:null;ability:null;safetyClearance:false;legend:string};

export const trustCases:Readonly<Record<string,string>>;
export const diagnosisCases:Readonly<Record<string,string>>;
export const excludedFields:readonly string[];
type Gate={id:string;label:string;status:string};
export function trustFrame(step?:number,scenario?:string):{step:number;scenario:string;gates:Gate[];issuer:string;connection:string;browserReachable:boolean|null;serverReachable:boolean|null;discoveryReachable:boolean|null;jwksCache:string[];keyId:string;jwksRefresh:string;now:number;exp:number;clockSkew:number;decision:string;failed:string[];tlsBypass:boolean};
export function authDiagnosisFrame(step?:number,scenario?:string):{step:number;scenario:string;symptom:string;gates:Gate[];target:string;reason:string|null;correlationId:string;log:Record<string,string>|null;redactedFields:readonly string[];conclusion:string;next:string;actionExecuted:boolean};

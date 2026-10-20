export const varietySource:{source:string;version:string;checkedAt:string;scope:string};
export const foodGroups:{id:string;label:string}[];
export const weekRecords:{day:number;entries:{food:string;group:string;confirmed:boolean|null}[]|null}[];
export function varietyFrame(mode?:string,highlight?:string):{basis:string;highlight:string;groups:typeof foodGroups;days:{day:number;missing:boolean;cells:{group:string;foods:string[];state:string;highlighted:boolean}[]}[];nutrientAdequacy:null;deficiency:null;source:typeof varietySource};
export const allergyCases:{id:string;label:string;ingredients:string[];unknownIngredient:boolean;eaten:string|null;time:string|null;observation:string;question:string}[];
export const recordStages:{id:string;label:string}[];
export function allergyFrame(id?:string,step?:number):{case:typeof allergyCases[number];step:number;stages:{id:string;label:string;revealed:boolean}[];diagnosis:null;culprit:null;rechallengePlan:null;emergencyDelay:false};

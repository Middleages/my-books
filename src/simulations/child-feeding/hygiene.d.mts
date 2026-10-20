export interface Portion {id:string;label:string;served:boolean|null;date:string;storage:string;next:string}
export const portions:Portion[];
export function hygieneFrame(id?:string,step?:number):{portion:Portion;step:number;source:{country:string;targetPopulation:string;checkedAt:string;url:string;limitations:string};stages:{label:string;text:string;revealed:boolean}[];safe:null;expiry:null;temperature:null};
export function familyFrame(mode?:string):{mode:string;rows:{id:string;label:string;fact:string;question:string;showQuestion:boolean}[];nutritionScore:null;diagnosis:null;storedPersonalData:boolean};

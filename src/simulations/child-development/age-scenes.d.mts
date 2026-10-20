export const sceneAges:number[];
export const sceneDomains:{id:string;title:string}[];
export const sceneSources:{age:number;url:string;checked:string;pageDate:string}[];
export type EverydayScene={id:string;age:number;tag:string;sourceDomain:string;title:string;scene:string;observe:string;sourceConcept:string};
export const everydayScenes:EverydayScene[];
export function ageSceneFrame(month:number,domain?:string):{month:number;exact:boolean;before:number|null;after:number|null;interpolated:false;score:null;diagnosis:null;groups:{source:typeof sceneSources[number];examples:EverydayScene[]}[]};

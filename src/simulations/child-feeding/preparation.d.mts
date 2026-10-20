export const preparationSource:{source:string;version:string;country:string;checkedAt:string;targetPopulation:string;limitations:string};
export const preparationScenes:{id:string;shapeKind:string;label:string;texture:string;shape:string;hard:boolean;pieces:{x:number;y:number;r:number}[];meaning:string}[];
export function preparationFrame(id:string):typeof preparationScenes[number]&{safe:null;source:typeof preparationSource};
export const safetySource:typeof preparationSource;
export const safetyScenes:{id:string;label:string;seated:boolean;moving:boolean;watched:boolean|null;meaning:string}[];
export function safetyFrame(id:string):typeof safetyScenes[number]&{foodPreparation:null;safe:null;source:typeof safetySource};

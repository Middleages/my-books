export type FoundationFrame = {scenarioId:string;ageBand:string;sourceIds:string[];observedFacts:string[];hypotheses:string[];unknowns:string[];step:number;selectedOption:string};
export function layerFrame(position?:string):FoundationFrame & {position:string;object:string;directPath:boolean;location:string;path:string;unknown:string;remaining:string};
export function movementFrame(movement?:string,furniture?:string):FoundationFrame & {movement:string;furniture:string;connected:boolean;movementLabel:string;furnitureLabel:string;path:string;unknown:string};

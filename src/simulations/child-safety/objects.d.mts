export interface PreventionFrame {scenarioId:string;ageBand:string;sourceIds:string[];observedFacts:string[];hypotheses:string[];unknowns:string[];step:number;selectedOption:string}
export function fallsFrame(area?:string,changed?:boolean):PreventionFrame & {area:string;changed:boolean;label:string;before:string;after:string;remaining:string;explanation:string};
export const objectKinds:string[];
export function objectFrame(kind?:string,location?:string,checked?:boolean):PreventionFrame & {kind:string;location:string;checked:boolean;name:string;check:string;directPath:boolean;status:string};

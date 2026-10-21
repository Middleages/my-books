export type HandoverState={variant:string;step:number};
export function handoverInitial():HandoverState;
export function handoverTransition(state:HandoverState,action:string):HandoverState;
export function handoverFrame(state?:HandoverState):{scenarioId:string;ageBand:string;sourceIds:string[];step:number;selectedOption:string;label:string;observedFacts:string[];hypotheses:string[];unknowns:string[];next:string;stages:{id:string;label:string;done:boolean;detail:string}[];status:string;accepted:boolean;sender:string;receiver:string;limit:string};
export function childcareFrame(topic?:string,replied?:boolean):{scenarioId:string;ageBand:string;sourceIds:string[];step:number;selectedOption:string;topics:{id:string;label:string}[];home:string;question:string;answer:string;replied:boolean;observedFacts:string[];hypotheses:string[];unknowns:string[];status:string;limit:string};

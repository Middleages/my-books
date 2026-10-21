export interface SiblingNode {id:string;label:string;x:number;y:number;kind:string;detail:string}
export interface SiblingEdge {from:string;to:string;label:string;status:string}
export interface SiblingScene {id:string;title:string;nodes:SiblingNode[];edges:SiblingEdge[];space:string;time:string}
export interface SiblingFrame {scenarioId:string;ageBand:string;sourceIds:string[];step:number;selectedOption:string;observedFacts:string[];hypotheses:string[];unknowns:string[];explanation:string;adultPreparation:string;scenes:SiblingScene[];limit:string;needs?:{id:string;label:string;need:string;owner:string;action:string}[]}
export const siblingSource: {id:string;publisher:string;title:string;url:string;checkedAt:string;updatedAt:string;country:string;targetAge:string;reviewedScope:string;limitations:string;chapterIds:string[]};
export const siblingAges: string[];
export function beforeSiblingFrame(age?:string,option?:string):SiblingFrame;
export function livingSiblingFrame(age?:string,option?:string):SiblingFrame;

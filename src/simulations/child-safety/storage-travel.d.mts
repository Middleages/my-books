import type {PreventionFrame} from './objects.mjs';
export function poisonFrame(label?:string,storage?:string):PreventionFrame & {label:string;storage:string;identified:boolean;separated:boolean;explanation:string;question:string};
export function travelFrame(seat?:string,vehicle?:string,child?:string):PreventionFrame & {seat:string;vehicle:string;child:string;nodes:{id:string;title:string;detail:string;state:string}[];explanation:string};

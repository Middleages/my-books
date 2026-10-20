import type {PreventionFrame} from './objects.mjs';
export function helpFrame(topic?:string):PreventionFrame & {topic:string;title:string;example:string;limit:string;connected:false;notice:string;boundary:string};
export function sharedPlanFrame(owner?:string,accepted?:boolean):PreventionFrame & {owner:string;accepted:boolean;rows:{id:string;place:string;fact:string;state:string;mark:string}[];handoff:string;explanation:string};

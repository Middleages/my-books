import type {PreventionFrame} from './objects.mjs';
export function waterFrame(handoff?:string,access?:string):PreventionFrame & {handoff:string;access:string;accepted:boolean;observer:string;explanation:string;accessLabel:string;remaining:string};
export function heatFrame(object?:string,cord?:string):PreventionFrame & {object:string;cord:string;touch:boolean;pull:boolean;explanation:string};

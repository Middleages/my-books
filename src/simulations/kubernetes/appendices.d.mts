export type RecoveryScenario = 'complete' | 'no-token' | 'no-pv';
export type RecoveryFrame = {api:string;pv:string;app:string;externalDb:string;title:string;detail:string};
export function recoveryFrames(scenario?:RecoveryScenario):RecoveryFrame[];
export function dependencyMap():{id:string;label:string;requires:string[];detail:string}[];

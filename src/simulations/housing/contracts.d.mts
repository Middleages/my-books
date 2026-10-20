export type ContractCase = 'matched'|'address'|'authority'|'changed';
export interface ContractScenario {label:string;address:string;signer:string;authority:string;later:string;note:string}
export const contractCases:Record<ContractCase,ContractScenario>;
export function contractFrames(caseId?:ContractCase): {step:number;scenario:ContractScenario;evidenceVisible:boolean;rechecked:boolean;addressMatch:boolean|null;authorityShown:boolean|null;newEntry:boolean|null;events:{day:number;label:string;visible:boolean}[];legalDecision:null}[];
export interface RecoveryAllocation {proceeds:number;prior:number;claim:number;first:number;tenant:number;unused:number;unrecovered:number}
export function allocateRecovery(options?:{proceeds?:number;prior?:number;claim?:number}):RecoveryAllocation;
export const recoveryDays:number[];
export type GuaranteeScenario='none'|'unknown'|'assumed';
export interface RecoveryFrame extends RecoveryAllocation {day:number;step:number;guarantee:GuaranteeScenario;arrivalDay:number;landlordCash:number;guaranteeCash:number;totalCash:number;remainingClaim:number;institutionClaim:number;debt:number;guaranteeStatus:string}
export function recoveryFrames(options?:{proceeds?:number;prior?:number;claim?:number;guarantee?:GuaranteeScenario;arrivalDay?:number;debt?:number}):RecoveryFrame[];

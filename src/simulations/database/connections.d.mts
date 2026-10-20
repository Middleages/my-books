export type PoolSize=1|2;
export type PoolScenario='normal'|'long-hold'|'leak'|'acquire-failure';
export type BindingMode='pinned'|'split';
export interface PoolRequest { readonly id:string; readonly arrival:number; readonly status:'queued'|'db-work'|'app-held'|'completed'|'acquire-error';readonly acquiredAt:number|null;readonly sqlEndedAt:number|null;readonly completedAt:number|null;readonly clientId:string|null;readonly leaseId:string|null;readonly error:string|null }
export interface PoolClient {readonly id:string;readonly sessionId:string;readonly slotId:string;readonly ownerRequestId:string|null}
export interface PoolLease {readonly id:string;readonly requestId:string;readonly clientId:string;readonly startedAt:number}
export interface PoolSegment {readonly id:string;readonly requestId:string;readonly kind:'acquireWait'|'dbWork'|'appHeld';readonly start:number;readonly end:number}
export interface PoolFrame {
 readonly step:number;readonly tick:number;readonly phase:string;readonly title:string;readonly detail:string;readonly size:PoolSize;readonly scenario:PoolScenario;readonly horizon:number;
 readonly requests:readonly PoolRequest[];readonly slots:readonly {readonly id:string;readonly clientId:string|null}[];readonly clients:readonly PoolClient[];readonly leases:readonly PoolLease[];
 readonly leaseHistory:readonly (PoolLease&{readonly releasedAt:number})[];readonly queue:readonly string[];readonly segments:readonly PoolSegment[];
 readonly edges:readonly {readonly id:string;readonly kind:'lease'|'session';readonly from:string;readonly to:string;readonly leaseId:string|null}[];
 readonly events:readonly {readonly kind:string;readonly requestId:string;readonly clientId:string|null;readonly leaseId?:string}[];
 readonly metrics:{readonly queued:number;readonly inUse:number;readonly idle:number;readonly openConnections:number;readonly completed:number;readonly failed:number};
 readonly invariants:{readonly capacity:boolean;readonly uniqueOwners:boolean;readonly noPhantomClient:boolean};readonly finished:boolean;readonly assumptions:readonly string[];
}
export interface BindingFrame {
 readonly step:number;readonly mode:BindingMode;readonly title:string;readonly detail:string;readonly phase:string;readonly calls:readonly {readonly id:string;readonly kind:string;readonly clientId:string;readonly sessionId:string}[];
 readonly activeTransactionClientId:string|null;readonly committedStock:number;readonly pendingStock:number|null;
 readonly edges:readonly {readonly id:string;readonly from:string;readonly to:string}[];readonly finished:boolean;
}
export interface ConnectionBudget {
 readonly instances:1|3;readonly poolMax:2|4;readonly serverMax:number;readonly superuserReserve:number;readonly reservedRoleReserve:number;readonly otherConnections:number;readonly ordinaryThreshold:number;readonly privilegedThreshold:number;readonly appBudget:number;readonly configuredDemand:number;readonly excess:number;readonly fits:boolean;
 readonly tokens:readonly {readonly id:string;readonly instance:number;readonly ordinal:number;readonly exceedsOrdinaryBudget:boolean}[];readonly title:string;readonly detail:string;
}
export const POOL_SIZES:readonly PoolSize[];
export const POOL_SCENARIOS:readonly PoolScenario[];
export const BINDING_MODES:readonly BindingMode[];
export const CAPACITY_INSTANCES:readonly (1|3)[];
export const CAPACITY_MAXIMA:readonly (2|4)[];
export function poolFrames(options?:{size?:PoolSize;scenario?:PoolScenario}):readonly PoolFrame[];
export function bindingFrames(options?:{mode?:BindingMode}):readonly BindingFrame[];
export function connectionBudget(options?:{instances?:1|3;poolMax?:2|4}):ConnectionBudget;

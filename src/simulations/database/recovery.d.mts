import type {ReadonlyFixture} from './fixture.mjs';
export type RecoveryCase='physical-continuous'|'logical-dump'|'missing-wal'|'same-storage-lost'|'validation-failure';
export interface RecoveryEvent {readonly id:string;readonly minute:number;readonly orderId:number;readonly productId:number;readonly qty:number;readonly requestKey:string}
export interface RecoveryMeasures {readonly orderCount:number;readonly itemCount:number;readonly confirmedAmountWon:number;readonly stocks:readonly {readonly rowId:string;readonly qty:number}[];readonly rowIds:readonly string[]}
export interface RestorePhase {readonly id:string;readonly label:string;readonly duration:number}
export interface RecoveryFrame {readonly step:number;readonly scenario:RecoveryCase;readonly phase:string;readonly title:string;readonly detail:string;readonly finished:boolean;readonly fixtureId:string;
 readonly failureMinute:number;readonly rpoTargetMinutes:number;readonly rtoTargetMinutes:number;
 readonly backup:{readonly id:string;readonly kind:'physical'|'logical';readonly location:string;readonly survives:boolean;readonly snapshotMinute:number|null;readonly startMinute:number;readonly completedMinute:number;readonly bootstrapWalComplete:boolean};
 readonly segments:readonly {readonly id:string;readonly start:number;readonly end:number;readonly available:boolean}[];readonly events:readonly RecoveryEvent[];
 readonly recoverableThrough:number|null;readonly recoveredThrough:number|null;readonly lossWindow:number|null;readonly rpoWithinTarget:boolean|null;readonly elapsed:number;readonly recoveryDuration:number|null;readonly rtoWithinTarget:boolean|null;
 readonly transfer:{readonly sourceGroup:string;readonly sourceIds:readonly string[];readonly targetId:string;readonly label:string}|null;
 readonly relationProof:{readonly orderKey:string;readonly orderId:number;readonly itemKey:string;readonly productKey:string;readonly productId:number;readonly qty:number;readonly stock:number}|null;
 readonly target:{readonly id:string;readonly state:string;readonly appReadAllowed:boolean}|null;readonly dataset:ReadonlyFixture|null;readonly measures:RecoveryMeasures|null;readonly expectedMeasures:RecoveryMeasures|null;readonly appliedIds:readonly string[];
 readonly steps:readonly (RestorePhase&{readonly start:number;readonly end:number;readonly status:string})[];readonly checks:readonly {readonly id:string;readonly label:string;readonly passed:boolean;readonly expected:string;readonly actual:string}[];readonly serviceUp:boolean;
 readonly flows:readonly {readonly id:string;readonly from:string;readonly to:string;readonly label:string}[];readonly unavailableEventIds:readonly string[]|null;readonly assumptions:readonly string[];
}
export const RECOVERY_CASES:readonly RecoveryCase[];
export const RECOVERY_EVENTS:readonly RecoveryEvent[];
export const RESTORE_PHASES:readonly RestorePhase[];
export function recoverySnapshot(minute:number):ReadonlyFixture;
export function recoveryMeasures(data:ReadonlyFixture):RecoveryMeasures;
export function recoveryFrames(options?:{scenario?:RecoveryCase}):readonly RecoveryFrame[];

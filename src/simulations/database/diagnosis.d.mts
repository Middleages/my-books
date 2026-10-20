import type {PoolFrame} from './connections.mjs';
import type {ConcurrencyFrame} from './concurrency.mjs';
import type {ExplainFrame} from './explain.mjs';
import type {OrderRow,OrderItemRow,ProductRow} from './fixture.mjs';
export type DiagnosisScenario='pool-wait'|'row-lock'|'plan-estimate'|'commit-unknown'|'compound';
export type RetryPayload='same'|'different';
export type DiagnosisBoundary='request'|'pool'|'session'|'lock'|'plan'|'commit';
export interface LookupSource {readonly step:number;readonly phase:string;readonly requestKey:string;readonly order:Readonly<OrderRow>;readonly items:readonly Readonly<OrderItemRow>[];readonly product:Readonly<ProductRow>;readonly storedPayload:{readonly customerId:number;readonly productId:number;readonly qty:number};readonly retryPayload:{readonly customerId:number;readonly productId:number;readonly qty:number};readonly payloadMatches:boolean;readonly sourceScenario:string;readonly sourceStep:number;readonly insertedOrders:number;readonly decision:'not-yet'|'return-existing'|'reject-payload'}
type EvidenceBase={readonly id:string;readonly label:string;readonly boundary:DiagnosisBoundary;readonly runId:string;readonly requestId:string;readonly sourceStep:number;readonly observedAt:string};
export type DiagnosisEvidence=EvidenceBase&({readonly sourceKind:'pool';readonly source:PoolFrame}|{readonly sourceKind:'lock';readonly source:ConcurrencyFrame}|{readonly sourceKind:'plan';readonly source:ExplainFrame}|{readonly sourceKind:'lookup';readonly source:LookupSource});
export interface DiagnosisFrame{readonly scenario:DiagnosisScenario;readonly payload:RetryPayload;readonly step:number;readonly phase:string;readonly title:string;readonly detail:string;readonly observationKind:'evidence-limited-diagnosis';readonly evidence:readonly DiagnosisEvidence[];readonly activeEvidenceId:string|null;readonly unknownBoundaries:readonly DiagnosisBoundary[];readonly executionLinks:readonly {readonly id:string;readonly runId:string;readonly requestId:string;readonly from:DiagnosisBoundary;readonly to:DiagnosisBoundary}[];readonly supportedHypotheses:readonly string[];readonly nextChecks:readonly string[];readonly verdict:string;readonly finished:boolean;readonly assumptions:readonly string[]}
export const DIAGNOSIS_SCENARIOS:readonly DiagnosisScenario[];export const RETRY_PAYLOADS:readonly RetryPayload[];export const DIAGNOSIS_BOUNDARIES:readonly {readonly id:DiagnosisBoundary;readonly label:string}[];
export function diagnosisFrames(options?:{scenario?:DiagnosisScenario;payload?:RetryPayload}):readonly DiagnosisFrame[];

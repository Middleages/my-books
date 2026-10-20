export type ExplainCase='growth-count'|'nested-loop'|'limit';
export type ExplainEstimate='low'|'aligned';
export interface PlanNode {
 readonly id:string;readonly label:string;readonly estimatedRows:number;readonly cost:number;readonly children:readonly string[];
 readonly actualRows:number|null;readonly loops:number|null;readonly totalEmitted:number|null;readonly emittedIds:readonly string[];readonly visitedIds:readonly string[];
 readonly buffers:{readonly hit:number;readonly read:number}|null;readonly actualStartupMs:number|null;readonly actualTotalMs:number|null;readonly bufferAccesses:readonly {readonly id:string;readonly pageId:string;readonly kind:'hit'|'read'}[];
}
export interface PlanPacket {readonly id:string;readonly nodeId:string;readonly execution:number;readonly inputIds:readonly string[];readonly outputIds:readonly string[]}
export interface ExplainFrame {
 readonly step:number;readonly example:ExplainCase;readonly observed:boolean;readonly estimate:ExplainEstimate;readonly phase:string;readonly title:string;readonly detail:string;readonly fixtureId:string;readonly sql:string;
 readonly nodes:readonly PlanNode[];readonly rootId:string;readonly edges:readonly {readonly id:string;readonly from:string;readonly to:string}[];
 readonly sourceRows:readonly {readonly id:string;readonly label:string;readonly matches:boolean}[];readonly packets:readonly PlanPacket[];
 readonly events:readonly {readonly id:string;readonly nodeId:string;readonly packetId:string}[];
 readonly intervals:readonly {readonly id:string;readonly nodeId:string;readonly start:number;readonly end:number}[];
 readonly scaleMax:number;readonly activeNodeId:string|null;readonly finished:boolean;readonly result:{readonly rows:number;readonly countValue:number|null}|null;
 readonly stopProof:{readonly reason:string;readonly visited:number;readonly emitted:number;readonly possibleFullOutputs:number}|null;readonly provenance:string;readonly assumptions:readonly string[];
}
export interface AppCall {readonly id:string;readonly label:string;readonly orderIds:readonly number[];readonly outputIds:readonly string[]}
export const EXPLAIN_CASES:readonly ExplainCase[];
export const EXPLAIN_ESTIMATES:readonly ExplainEstimate[];
export function explainFrames(options?:{example?:ExplainCase;observed?:boolean;estimate?:ExplainEstimate}):readonly ExplainFrame[];
export function appCallComparison():{readonly oneQuery:readonly AppCall[];readonly nPlusOne:readonly AppCall[];readonly applicationRows:number;readonly totalReturnedRows:{readonly oneQuery:number;readonly nPlusOne:number};readonly detail:string};

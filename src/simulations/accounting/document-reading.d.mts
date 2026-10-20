import type {Snapshot,Period} from './business-ledger.mjs';
export type PacketKey='base'|'next-month'|'missing-cost'|'capital-revenue'|'mixed';
export type ClaimKey='revenue'|'cost'|'cash-period'|'capital'|'connection'|'dividend';
export interface EvidenceRow {label:string;value:string|number}
export interface EvidenceDocument {id:string;title:string;kind:'observed'|'calculated'|'assumption'|'unverified';available:boolean;rows:EvidenceRow[]}
export interface Scope {company:string;period:string;unit:string;boundary:string}
export interface Packet {key:PacketKey;label:string;intentionalError:boolean;scopeMismatch:boolean;canonicalScope:Scope;receivedScope:Scope;closing:Snapshot;facts:Snapshot;documents:EvidenceDocument[];cashRows:{id:string;period:string;day:number;amount:number;classification:string;label:string}[];expected:{revenue:number;cost:number;inventory:number;capital:number;receipt:number;operating:number};bridge:{id:string;amount:number;before:number;after:number}[];direct:number;balanced:boolean;bridgeMatches:boolean;cashMatches:boolean;nextPeriod:{period:string;profit:number;cashFlow:number;cash:number}|null}
export interface Evidence {packet:Packet;claim:ClaimKey;label:string;required:string[];opened:string[];status:'unread'|'matches'|'contradiction'|'insufficient'|'scope-mismatch';allRead:boolean;checks:EvidenceRow[];matches:boolean|null;detail:string;links:{id:string;opened:boolean;available:boolean;document:EvidenceDocument}[]}
export interface EvidenceFrame extends Evidence {index:number}
export const packetKeys:readonly PacketKey[];
export const packetLabels:Readonly<Record<PacketKey,string>>;
export const claimKeys:readonly ClaimKey[];
export const claimLabels:Readonly<Record<ClaimKey,string>>;
export function documentPacket(key?:PacketKey):Packet;
export function claimEvidence(packetKey?:PacketKey,claim?:ClaimKey,opened?:string[]):Evidence;
export function evidenceFrames(packetKey?:PacketKey,claim?:ClaimKey):EvidenceFrame[];

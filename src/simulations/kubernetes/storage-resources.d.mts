export type StorageOptions={event?:'restart'|'replace'|'offline'|'disk-loss'|'delete-pvc';reclaim?:'Delete'|'Retain'};
export type StorageFile={label:string;path:string;state:string;value:string};
export type StorageFrame={title:string;detail:string;event:string;reclaim:string;pod:string;container:string;pvc:string;pv:string;node:string;readable:boolean;binding:string;mount:string;files:StorageFile[]};
export function storageFrames(options?:StorageOptions):StorageFrame[];
export type ResourceOptions={existingCpu?:number;requestCpu?:number;existingMemory?:number;quotaCpu?:number;load?:'normal'|'cpu'|'memory'};
export type NodeResource={allocatable:number;assigned:number;proposed:number;used:number};
export type ResourceFrame={title:string;detail:string;outcome:string;reason:string;load:string;node:{cpu:NodeResource;memory:NodeResource};quota:{limit:number;before:number;proposed:number;used:number};cpu:{request:number;limit:number;demand:number;actual:number};memory:{request:number;limit:number;demand:number;actual:number;oom:boolean}};
export function resourceFrames(options?:ResourceOptions):ResourceFrame[];

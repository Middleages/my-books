export type DesiredOptions = {event?:'delete'|'restart'|'scale'|'node'|'vm';target?:number};
export type DesiredPod = {uid:string;owner:string;ready:boolean;state:string;restarts:number;node:string|null};
export type DesiredFrame = {title:string;detail:string;desired:number;current:number;ready:number;pods:DesiredPod[];deployment:string;replicaSet:string;controlUp:boolean;nodeUp:boolean;observation:'current'|'stale'};
export function desiredFrames(options?:DesiredOptions):DesiredFrame[];
export type ServiceOptions = {selector?:string;targetPort?:number;ready?:boolean;clientNamespace?:string;query?:string};
export type ServicePod = {uid:string;ip:string;ready:boolean;namespace:string;label:string;listenPort:number};
export type Endpoint = ServicePod & {port:number};
export type ServiceFrame = {title:string;detail:string;pods:ServicePod[];clientNamespace:string;query:string;service:{name:string;namespace:string;selector:string;port:number;targetPort:number;clusterIP:string};dns:{name:string;found:boolean;address:string|null};endpoints:Endpoint[];eligible:Endpoint[];result:{code:string;reason:string;next:string;destination:string|null;selectedUid:string|null}};
export function serviceFrames(options?:ServiceOptions):ServiceFrame[];

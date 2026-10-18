export type ProbeOptions={scenario?:'readiness'|'liveness'|'startup-timeout'|'db';threshold?:number;dbInLiveness?:boolean};
export type Probe={status:string;failures:number;threshold:number};
export type ProbeFrame={title:string;detail:string;tick:number;pod:string;container:string;restarts:number;ready:boolean;dbUp:boolean;targets:string[];startup:Probe;liveness:Probe;readiness:Probe};
export function probeFrames(options?:ProbeOptions):ProbeFrame[];
export type RolloutOptions={scenario?:'normal'|'bad-ready'|'capacity';surge?:number;unavailable?:number;rollback?:boolean};
export type RolloutPod={uid:string;version:string;ready:boolean;state:string;checked?:boolean};
export type RolloutFrame={title:string;detail:string;result:string;target:string;desired:number;surge:number;unavailable:number;minReady:number;backgroundCpu:number;assignedCpu:number;allocatableCpu:number;podRequestCpu:number;pods:RolloutPod[];old:{count:number;ready:number};new:{count:number;ready:number};ready:number;targets:string[];externalState:string};
export function rolloutFrames(options?:RolloutOptions):RolloutFrame[];

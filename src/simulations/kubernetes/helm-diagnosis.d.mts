import type {NodeResource} from './storage-resources.mjs';
import type {ServiceFrame} from './workloads.mjs';
import type {IngressFrame} from './edge-config.mjs';
export type DiagnosisScene={kind:'resource';resource:NodeResource}|{kind:'service';service:ServiceFrame}|{kind:'ingress';ingress:IngressFrame;comparison:{actual:string;expected:string;label:string;scope:string}}|{kind:'image';requested:string;registry:string;running:boolean}|{kind:'crash';key:string;provided:boolean;exitCode:number;restarts:number};
export type HelmOptions={operation?:'template'|'install'|'upgrade'|'rollback';environment?:'dev'|'prod';change?:'replicas'|'config'|'image'};
export type HelmValues={replicas:number;image:string;message:string};
export type HelmFrame={title:string;detail:string;summary:string;phase:string;operation:string;environment:string;change:string;chart:string;target:HelmValues;before:HelmValues|null;live:HelmValues|null;history:{revision:number;status:string;values:HelmValues}[];deploymentRevision:number|null;yaml:string;command:string;ready:string;externalState:string};
export function helmFrames(options?:HelmOptions):HelmFrame[];
export const observations:{id:string;label:string;command:string;where:string;question:string}[];
export const diagnosticCases:{id:string;label:string;best:string}[];
export type DiagnosisOptions={scenario?:string;observation?:string};
export type DiagnosisFrame={scene:DiagnosisScene|null;scenario:string;observed:boolean;title:string;detail:string;symptom:string;evidence:string|null;conclusion:string|null;next:string|null;matched:boolean;command:string;where:string;question:string;zones:{label:string;state:string}[]};
export function diagnosisFrames(options?:DiagnosisOptions):DiagnosisFrame[];

export function helmEnvironments():{environment:string;values:HelmValues}[];

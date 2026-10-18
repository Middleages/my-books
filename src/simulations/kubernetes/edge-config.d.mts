export type IngressOptions={mode?:'direct'|'conflict'|'host-http'|'host-tls';host?:string;path?:string;outerValid?:boolean;innerValid?:boolean;controller?:boolean;ready?:boolean};
export type IngressFrame={title:string;detail:string;outcome:string;mode:string;host:string;path:string;route:boolean;service:{name:string;port:number;targetPort:number;ready:number};outer:{terminator:string;status:string};inner:{terminator:string;status:string};hops:{name:string;address:string;protocol:string;stage:number;status:string}[]};
export function ingressFrames(options?:IngressOptions):IngressFrame[];
export type ConfigurationOptions={delivery?:'env'|'volume'|'subpath';reload?:boolean;kind?:'ConfigMap'|'Secret'};
export type ConfigurationFrame={title:string;detail:string;kind:string;delivery:string;image:string;source:string;delivered:string;app:string;pod:string;process:string};
export function configurationFrames(options?:ConfigurationOptions):ConfigurationFrame[];
export const secretEncoding:{readonly plain:string;readonly encoded:string;readonly encrypted:boolean};

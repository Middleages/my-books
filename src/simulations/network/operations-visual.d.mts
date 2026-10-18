export type Connection = {
  sourceLabel?: string;
  destinationLabel?: string;
  pathLabel?: string;
  src: string;
  dst: string;
  protocol: string;
  path: string;
};
export type OperationFrame = {
  id: string;
  title: string;
  detail: string;
  node: string;
  edge: [string, string] | null;
  connection: Connection | null;
  before?: Connection;
  code?: string;
};
export type OperationNode = {
  id: string;
  name: string;
  address: string;
  zone: string;
};
export type ProxyState = {
  host: string;
  path: string;
  strip: boolean;
  fault: string;
  upstreamTls: boolean;
  trusted: boolean;
  browserTrusted: boolean;
  sni?: string;
  authority?: string;
};
export type DockerState = {
  placement: string;
  target: string;
  publish: string;
  bind: string;
  network: boolean;
  allowed: boolean;
  expose: boolean;
};
export function proxyJourney(options?: Partial<ProxyState>): {
  domain: string;
  authority: string;
  certificate: string;
  external: Connection;
  upstream: Connection;
  appId: string;
  apps: OperationNode[];
  uri: string;
  comparison: {
    strip: boolean;
    config: string;
    uri: string;
    applies: boolean;
  }[];
  result: {
    ok: boolean;
    code: string;
    app: string;
    uri: string;
    steps: string[];
    next: string;
  };
  origin: string;
  frames: OperationFrame[];
  tls: { name: string; verifier: string; certificate: string; state: string }[];
};
export function dockerJourney(options?: Partial<DockerState>): {
  result: { ok: boolean; path: string; why: string; next: string };
  frames: OperationFrame[];
  localhostOwner: string;
  publish: string;
  bind: string;
  expose: string;
  network: boolean;
  nodes: OperationNode[];
  roles: { title: string; value: string; detail: string }[];
};

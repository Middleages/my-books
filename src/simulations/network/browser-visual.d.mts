import type { OperationFrame } from "./operations-visual.mjs";
export type HttpState = {
  scheme: string;
  scenario: string;
  path: string;
  host: string;
};
export type HttpFrame = OperationFrame & {
  phase: string;
  dns: string;
  tcp: string;
  tls: string;
  requestSent: boolean;
  responseCode: number | null;
  known: string;
  unknown: string;
};
export function httpJourney(options?: Partial<HttpState>): {
  url: string;
  domain: string;
  sni: string;
  port: number;
  scheme: string;
  host: string;
  requestTarget: string;
  requestMessage: string;
  frames: HttpFrame[];
  result: { code: number | null; outcome: string; detail: string };
  parts: { id: string; label: string; value: string; phases: string[] }[];
  stages: string[];
};
export type CorsState = {
  target: string;
  kind: string;
  allowOrigin: string;
  allowPreflight: boolean;
  credentials: boolean;
  allowCredentials: boolean;
  preflightPolicy: string;
};
export type CorsFrame = OperationFrame & {
  optionsSent: boolean;
  optionsArrived: boolean;
  mainSent: boolean;
  mainArrived: boolean;
  processed: boolean;
  responseArrived: boolean;
  readable: string;
  jsValue: string;
  message: string;
};
export function corsJourney(options?: Partial<CorsState>): {
  frames: CorsFrame[];
  result: {
    sent: boolean;
    readable: boolean;
    preflight: boolean;
    stage: string;
    steps: string[];
    next: string;
  };
  pageOrigin: string;
  apiOrigin: string;
  url: string;
  method: string;
  endpoint: string;
  preflightHeaders: string;
  actualHeaders: string;
  outcome: string;
};

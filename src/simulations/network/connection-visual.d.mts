import type { OperationFrame, Connection } from "./operations-visual.mjs";
export type PortState = {
  observer: string;
  bind: string;
  listening: boolean;
  policy: string;
  port: string;
};
export type DnsState = {
  browser: boolean;
  os: boolean;
  cache: boolean;
  age: number;
  record: string;
  app: boolean;
};
export type Cache = {
  id: string;
  name: string;
  address: string | null;
  remaining: number;
  valid: boolean;
};
export type DnsFrame = OperationFrame & {
  caches: Cache[];
  answer: string | null;
};
export function portJourney(options?: Partial<PortState>): {
  result: { ok: boolean; title: string; detail: string; target: string };
  frames: OperationFrame[];
  outbound: Connection;
  listeners: { port: string; address: string; active: boolean }[];
  connections: Connection[];
};
export function dnsJourney(options?: Partial<DnsState>): {
  result: {
    address: string | null;
    source: string;
    remaining: number;
    connection: string;
    detail: string;
  };
  source: string;
  frames: DnsFrame[];
  authoritative: string;
  initialCaches: Cache[];
};
export type TcpFrame = {
  event: string;
  title: string;
  detail: string;
  chunk: string | null;
  reverse: boolean;
  received: boolean[];
  ack: number;
  senderAck: number;
  delivered: number;
  buffered: number;
};
export function tcpJourney(mode?: string): {
  frames: TcpFrame[];
  prediction: number;
  mode: string;
};
export type TimeSegment = {
  name: string;
  start: number;
  end: number;
  kind: string;
};
export type TimeFrame = {
  time: number;
  title: string;
  detail: string;
  lanes: {
    done: boolean;
    segments: (TimeSegment & { width: number; progress: number })[];
  }[];
};
export function performanceJourney(options?: {
  mb?: number;
  mbps?: number;
  rtt?: number;
}): {
  current: { serialization: number; roundTrip: number; total: number };
  lanes: {
    name: string;
    mbps: number;
    rtt: number;
    serialization: number;
    total: number;
    segments: TimeSegment[];
  }[];
  frames: TimeFrame[];
  maxTime: number;
};

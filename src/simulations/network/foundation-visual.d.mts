export type Packet = {
  protocol: string;
  src: string;
  dst: string;
  sport: number;
  dport: number;
};
export type Mapping = {
  protocol: string;
  internalIp: string;
  internalPort: number;
  externalIp: string;
  externalPort: number;
};
export type Frame = {
  node: string;
  title: string;
  detail: string;
  edge: [string, string] | null;
  packet: Packet;
  before: Packet;
  change: string;
  source?: string;
  mappings: Mapping[];
};
export type PacketFrame = {
  title: string;
  detail: string;
  phase: string;
  delivered: number;
  buffered: number;
  ack: number;
  received: boolean[];
  complete: boolean;
  chunk: string | null;
  moving?: boolean;
};
export function packetFrames(loss?: boolean): PacketFrame[];
export function addressFrames(config?: {
  prefix?: number;
  destination?: string;
  badGateway?: boolean;
}): {
  source: string;
  destination: string;
  prefix: number;
  sourceRange: string;
  destinationRange: string;
  gateway: string;
  local: boolean;
  outcome: string;
  frames: Frame[];
};
export function routeFrames(config?: {
  source?: string;
  destination?: string;
  scenario?: string;
  both?: boolean;
}): {
  local: boolean;
  outcome: string;
  frames: Frame[];
  mapping: Mapping | null;
};

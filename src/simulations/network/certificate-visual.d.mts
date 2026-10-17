export type Certificate = {
  id: string;
  name: string;
  role: string;
  issuer: string;
  sans?: string[];
};
export type Leaf = Certificate & { sans: string[] };
export type VisualConfig = {
  server: string;
  target: string;
  date: string;
  intermediate: string;
  rootSent: boolean;
  environment: string;
  stores: Record<string, string[]>;
  caches: Record<string, string[]>;
};
export type Check = {
  id: string;
  label: string;
  ok: boolean;
  evidence: string;
  fix: string;
};
export type VisualResult = {
  name: string;
  checks: Check[];
  ok: boolean;
  first: string;
  bundle: string[];
  leaf: Leaf;
  issuer: Certificate;
  root: Certificate;
  sent: Certificate[];
  roots: Certificate[];
  intermediateSource: "server" | "cache" | "missing";
};
export const authorities: Record<string, Certificate>;
export const servers: Record<string, Leaf>;
export function visualPreset(id?: string): VisualConfig;
export function visualResult(config: VisualConfig): VisualResult;
export const observationStages: string[];
export function playbackStep(step: number, action: string): number;

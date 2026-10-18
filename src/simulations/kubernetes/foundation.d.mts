export type RecoveryOptions = {
  mode?: "docker" | "compose" | "kubernetes";
  failure?: "app" | "vm";
  replicas?: number;
};
export type AccessOptions = {
  context?: "lab-user" | "lab-admin" | "remote-reader";
  namespace?: "books-lab" | "other";
  action?: "deploy" | "nodes";
};
export type Access = {
  cluster: string;
  user: string;
  defaultNamespace: string;
  namespace: string;
  action: string;
  allowed: boolean;
  reason: string;
};
export type RecoveryFrame = {
  title: string;
  detail: string;
  running: number;
  vmUp: boolean;
  recovered: boolean;
  image: string;
  agent: string;
  instances: { id: number; running: boolean }[];
};
export type ClusterFrame = {
  title: string;
  detail: string;
  active: string[];
  edge: string[] | null;
  outcome: string;
  access: Access;
};
export const contexts: Record<
  NonNullable<AccessOptions["context"]>,
  { cluster: string; user: string; defaultNamespace: string }
>;
export function accessDecision(options?: AccessOptions): Access;
export function recoveryFrames(options?: RecoveryOptions): RecoveryFrame[];
export function clusterFrames(
  options?: AccessOptions & { path?: "control" | "http" },
): ClusterFrame[];

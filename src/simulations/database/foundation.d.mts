import type { Fixture, RelationEdge, RowByTable, TableName } from "./fixture.mjs";

export type AppId = "A" | "B";
export type FileMode = "sequential" | "race" | "file-lock" | "database";
export type CopyStatus = "pending" | "waiting" | "copy" | "write" | "confirmed" | "rejected";
export interface LocalCopy {
  app: AppId; sourceRevision: number | null; readQty: number | null;
  writeQty: number | null; status: CopyStatus;
}
export type FileNodeId = "app:A" | "app:B" | "copy:A" | "copy:B" | "store" | "orders";
export interface FileEventEdge {
  id: string; from: FileNodeId; to: FileNodeId;
  kind: "read" | "prepare" | "write" | "confirm" | "acquire" | "reject";
  step: number; active: boolean;
}
export interface Measurement { value: number; unit: string }
export interface FileWriteFrame {
  scenarioId: string; step: number; observationKind: "educational-schedule";
  title: string; detail: string; assumptions: string[];
  mode: FileMode; first: AppId; initialQty: number; availableQty: number;
  sourceRevision: number; localCopies: LocalCopy[];
  committedOrders: { id: string; app: AppId; qty: number }[];
  revisionHistory: {
    revision: number; availableQty: number; writer: AppId | null; sourceRevision: number | null;
  }[];
  lockOwner: AppId | null; activeApp: AppId | null;
  edges: FileEventEdge[]; protection: string;
  invariant: { expectedQty: number; actualQty: number; holds: boolean };
  measurements: {
    initialQty: Measurement; availableQty: Measurement; confirmedQty: Measurement;
    committedOrderCount: Measurement; overCommittedQty: Measurement;
  };
  finished: boolean;
}
export type ConstraintScenario =
  "normal" | "duplicate-pk" | "missing-fk" | "zero-qty" | "null-qty" |
  "duplicate-name" | "empty-order";
export type CandidateStatus = "pending" | "checking" | "accepted" | "rejected";
export type ConstraintCandidate = {
  [T in TableName]: {
    table: T; row: RowByTable[T]; rowKey: string; nodeKey: string; status: CandidateStatus;
  };
}[TableName];
export interface ConstraintCheck {
  id: string; label: string; result: "pass" | "fail" | "unknown" | "disabled";
}
export interface ConstraintFrame {
  scenarioId: string; step: number; observationKind: "constraint-observation";
  title: string; detail: string; assumptions: string[];
  scenario: ConstraintScenario; notNull: boolean; rename: boolean; sameNames: boolean;
  phase: "candidate" | "checking" | "result" | "rename";
  fixture: Fixture; candidate: ConstraintCandidate; checks: ConstraintCheck[];
  accepted: boolean | null; violations: string[];
  edges: RelationEdge[]; candidateEdges: RelationEdge[]; selectedRowKeys: string[];
  measurements: {
    customerRows: Measurement; productRows: Measurement; orderRows: Measurement;
    itemRows: Measurement; foreignKeyLinks: Measurement;
  };
  invariant: { committedFixtureValid: boolean; allForeignKeysExist: boolean };
  businessWarnings: string[]; finished: boolean;
}
export const FILE_MODES: readonly FileMode[];
export const CONSTRAINT_SCENARIOS: readonly ConstraintScenario[];
export function fileWriteFrames(options?: { mode?: FileMode; first?: AppId }): FileWriteFrame[];
export function constraintFrames(options?: {
  scenario?: ConstraintScenario; notNull?: boolean; rename?: boolean; sameNames?: boolean;
}): ConstraintFrame[];

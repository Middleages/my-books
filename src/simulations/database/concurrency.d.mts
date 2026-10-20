import type { ModelEvent, ModelStatement, ModelTransaction, ReadObservation, ModelSnapshot, RowVersion, ReservationFrameBase } from "./transactions.mjs";
import type { ReadonlyFixture } from "./fixture.mjs";
export type ConcurrencyStrategy = "unsafe-absolute" | "conditional-update" | "select-for-update";
export type FirstOutcome = "commit" | "rollback";
export type SnapshotIsolation = "read-committed" | "repeatable-read";
export type DeadlockOrder = "opposite" | "consistent";
export interface OwnershipEdge {
  readonly id: string; readonly from: string; readonly to: string;
  readonly resourceId: string; readonly txId: string;
  readonly mode: "conflicting-row-update" | "select-for-update";
}
export interface WaitEdge {
  readonly id: string; readonly from: string; readonly to: string;
  readonly resourceId: string; readonly txId: string; readonly statementId: string;
  readonly blockedByTxId: string;
}
export interface ConcurrencyFrame extends ReservationFrameBase {
  readonly observationKind: "last-item-schedule";
  readonly strategy: ConcurrencyStrategy; readonly firstOutcome: FirstOutcome;
  readonly ownershipEdges: readonly OwnershipEdge[]; readonly waitEdges: readonly WaitEdge[];
  readonly resources: readonly { readonly id: string; readonly rowKey: string; readonly productId: number }[];
}
export interface SnapshotFrame extends ReservationFrameBase {
  readonly observationKind: "snapshot-visibility"; readonly isolation: SnapshotIsolation;
  readonly retainedSnapshotId: string | null;
}
export interface DeadlockFrame {
  readonly scenarioId: string; readonly step: number; readonly phase: string;
  readonly observationKind: "two-resource-lock-graph"; readonly order: DeadlockOrder;
  readonly title: string; readonly detail: string; readonly assumptions: readonly string[];
  readonly event: ModelEvent; readonly events: readonly ModelEvent[];
  readonly statements: readonly ModelStatement[]; readonly transactions: readonly ModelTransaction[];
  readonly committedFixture: ReadonlyFixture; readonly versions: readonly RowVersion[];
  readonly readObservations: readonly ReadObservation[]; readonly snapshots: readonly ModelSnapshot[];
  readonly resources: readonly { readonly id: string; readonly rowKey: string; readonly productId: number }[];
  readonly ownershipEdges: readonly OwnershipEdge[]; readonly waitEdges: readonly WaitEdge[];
  readonly edgeHistory: readonly { readonly edge: OwnershipEdge | WaitEdge; readonly removedAtStep: number; readonly reason: string }[];
  readonly cycle: readonly string[]; readonly victimTxId: string | null;
  readonly retryOfTxId: string | null; readonly retryTxId: string | null;
  readonly completedRequestTxIds: readonly string[];
  readonly invariants: { readonly currentEdgesHaveLiveEndpoints: boolean; readonly hasCycle: boolean; readonly noOrdersAdded: boolean };
  readonly finished: boolean;
}
export const CONCURRENCY_STRATEGIES: readonly ConcurrencyStrategy[];
export const FIRST_OUTCOMES: readonly FirstOutcome[];
export const SNAPSHOT_ISOLATIONS: readonly SnapshotIsolation[];
export const DEADLOCK_ORDERS: readonly DeadlockOrder[];
export const CONCURRENCY_ASSUMPTIONS: readonly string[];
export function concurrencyFrames(options?: { strategy?: ConcurrencyStrategy; firstOutcome?: FirstOutcome }): readonly ConcurrencyFrame[];
export function snapshotFrames(options?: { isolation?: SnapshotIsolation }): readonly SnapshotFrame[];
export function deadlockFrames(options?: { order?: DeadlockOrder }): readonly DeadlockFrame[];

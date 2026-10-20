import type { ReadonlyFixture, RowByTable, TableName } from "./fixture.mjs";
export type TransactionMode = "atomic" | "statement-autocommit";
export type TransactionOutcome = "success" | "header-constraint-error" | "item-constraint-error";
export type ModelRow = Readonly<RowByTable[TableName]>;
export interface ModelEvent {
  readonly id: string; readonly atStep: number; readonly kind: string;
  readonly sessionId: string | null; readonly txId: string | null;
  readonly statementId: string | null; readonly sql: string | null;
  readonly title: string; readonly detail: string;
}
export interface ModelStatement {
  readonly id: string; readonly sessionId: string; readonly txId: string | null;
  readonly kind: "begin" | "update" | "insert" | "select" | "select-for-update" | "nextval" | "commit" | "rollback";
  readonly sql: string; readonly status: "succeeded" | "waiting" | "error";
  readonly affectedRows: number | null; readonly returnedCount: number | null;
  readonly errorCode: string | null; readonly implicitCommit: boolean;
  readonly targetAtStartVersionId: string | null; readonly recheckedVersionId: string | null;
}
export interface ModelTransaction {
  readonly id: string; readonly sessionId: string;
  readonly blockStatus: "idle" | "in-transaction" | "failed";
  readonly outcome: "not-started" | "active" | "committed" | "aborted" | "rolled-back";
}
export interface ModelChange {
  readonly id: string; readonly txId: string; readonly statementId: string;
  readonly table: TableName; readonly rowKey: string; readonly versionId: string;
  readonly beforeVersionId: string | null; readonly row: ModelRow;
}
export interface DiscardedChange extends ModelChange {
  readonly discardedAtStep: number; readonly reason: string;
}
export interface RowVersion {
  readonly id: string; readonly table: TableName; readonly rowKey: string;
  readonly row: ModelRow; readonly createdByTxId: string | null;
  readonly createdAtStep: number; readonly predecessorId: string | null;
  readonly state: "committed" | "active" | "superseded" | "discarded";
}
export interface ReservationMeasurements {
  readonly initialStock: number; readonly availableQty: number;
  readonly newOrderCount: number; readonly newItemQty: number;
  readonly fulfilledRequests: number;
}
export interface ReadObservation {
  readonly id: string; readonly atStep: number; readonly sessionId: string;
  readonly txId: string | null; readonly statementId: string;
  readonly snapshotId: string | null; readonly status: "succeeded" | "error";
  readonly versionIds: readonly string[];
  readonly rows: readonly { readonly rowKey: string; readonly versionId: string; readonly row: ModelRow }[];
  readonly view: ReservationMeasurements | null; readonly errorCode: string | null;
}
export interface ModelSnapshot {
  readonly id: string; readonly sessionId: string; readonly txId: string | null;
  readonly establishedAtStep: number; readonly statementId: string;
  readonly versionIds: readonly string[]; readonly scope: "statement" | "transaction";
}
export interface ModelRequest {
  readonly id: string; readonly sessionId: string; readonly orderId: number | null;
  readonly qty: number; readonly status: "pending" | "fulfilled" | "rejected" | "failed" | "cancelled";
}
export interface ModelInvariants {
  readonly schemaValid: boolean; readonly stockNonnegative: boolean;
  readonly reservationBalance: boolean; readonly terminalBusinessValid: boolean | null;
  readonly verdict: "pending" | "fulfilled" | "rolled-back" | "partial-failure" | "oversold" | "safe-rejection" | "read-check-complete";
}
export interface ReservationFrameBase {
  readonly scenarioId: string; readonly step: number; readonly phase: string;
  readonly observationKind: string; readonly title: string; readonly detail: string;
  readonly assumptions: readonly string[]; readonly event: ModelEvent;
  readonly events: readonly ModelEvent[]; readonly statements: readonly ModelStatement[];
  readonly transactions: readonly ModelTransaction[]; readonly requests: readonly ModelRequest[];
  readonly committedFixture: ReadonlyFixture; readonly activeChanges: readonly ModelChange[];
  readonly discardedChanges: readonly DiscardedChange[]; readonly versions: readonly RowVersion[];
  readonly currentVersionIds: readonly string[]; readonly committedVersionIds: readonly string[];
  readonly currentHeadVersionId: string;
  readonly readObservations: readonly ReadObservation[]; readonly snapshots: readonly ModelSnapshot[];
  readonly measurements: ReservationMeasurements; readonly invariants: ModelInvariants;
  readonly finished: boolean;
}
export interface TransactionFrame extends ReservationFrameBase {
  readonly observationKind: "transaction-boundaries";
  readonly mode: TransactionMode; readonly outcome: TransactionOutcome;
  readonly committedThisStepVersionIds: readonly string[];
  readonly sequence: {
    readonly name: "education_order_id_seq"; readonly nextValue: number;
    readonly allocations: readonly { readonly value: number; readonly atStep: number; readonly statementId: string; readonly txId: string }[];
  };
  readonly rejectedCandidate: {
    readonly table: "orders" | "order_items"; readonly rowKey: string;
    readonly row: ModelRow; readonly statementId: string;
    readonly constraint: "orders_request_key_key" | "order_items_qty_check";
  } | null;
}
export const TRANSACTION_MODES: readonly TransactionMode[];
export const TRANSACTION_OUTCOMES: readonly TransactionOutcome[];
export const TRANSACTION_ASSUMPTIONS: readonly string[];
export function transactionFrames(options?: {
  mode?: TransactionMode; outcome?: TransactionOutcome;
}): readonly TransactionFrame[];

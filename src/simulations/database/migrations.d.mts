export type MigrationScenario = "immediate-rename" | "safe-expand-contract" | "old-writer-remains" | "interrupted-backfill" | "ddl-wait";
export type MigrationRole = "old" | "bridge" | "new";
export type MigrationColumnName = "id" | "name" | "display_name" | "unit_price_won" | "available_qty";
export interface MigrationColumn {
  readonly id: string; readonly name: MigrationColumnName;
  readonly type: "integer" | "text"; readonly nullable: boolean;
}
export interface MigrationValues {
  readonly id: number; readonly name?: string; readonly display_name?: string | null;
  readonly unit_price_won: number; readonly available_qty: number;
}
export interface MigrationRow {
  readonly rowKey: string; readonly productId: number; readonly versionId: string;
  readonly version: number; readonly values: MigrationValues;
}
export interface MigrationVersion extends MigrationRow {
  readonly previousVersionId: string | null; readonly createdAtStep: number;
  readonly eventId: string; readonly schemaVersion: number;
}
export interface MigrationApp {
  readonly id: string; readonly role: MigrationRole; readonly label: string; readonly active: boolean;
  readonly readColumns: readonly MigrationColumnName[]; readonly writeColumns: readonly MigrationColumnName[];
  readonly atomicWrite: boolean; readonly readReady: boolean; readonly writeReady: boolean;
}
export interface MigrationCapabilityEdge {
  readonly id: string; readonly appId: string; readonly role: MigrationRole;
  readonly operation: "read" | "write"; readonly column: MigrationColumnName; readonly columnId: string | null;
  readonly status: "inactive" | "ready" | "missing-column" | "unfilled";
  readonly affectedRowKeys: readonly string[];
}
export interface MigrationValidation {
  readonly fill: { readonly available: boolean; readonly filled: number; readonly total: number; readonly complete: boolean };
  readonly equality: {
    readonly available: boolean; readonly equal: number; readonly total: number;
    readonly complete: boolean; readonly mismatchedRowKeys: readonly string[];
  };
  readonly oldOnlyWriterCount: number; readonly oldReaderCount: number;
  readonly oldWriterCount: number; readonly oldReferenceCount: number;
  readonly canBackfill: boolean; readonly canSwitchToNew: boolean; readonly canDropOld: boolean;
  readonly blockers: readonly string[];
}
export interface MigrationEvent {
  readonly id: string; readonly kind: string; readonly title: string; readonly detail: string;
  readonly rowKeys: readonly string[]; readonly beforeVersionIds: readonly string[];
  readonly afterVersionIds: readonly string[]; readonly txId: string | null;
  readonly atomic: boolean; readonly changedColumns: readonly MigrationColumnName[];
}
export interface MigrationBackfill {
  readonly status: "idle" | "running" | "interrupted" | "complete";
  readonly attempt: number; readonly selectedRowKeys: readonly string[];
  readonly filledRowKeys: readonly string[]; readonly skippedRowKeys: readonly string[];
  readonly sourceVersionIds: readonly string[];
}
export interface MigrationLockWait {
  readonly status: "held" | "waiting" | "granted" | "released";
  readonly holderTxId: string; readonly holderMode: "ACCESS SHARE"; readonly holderStatus: "active" | "committed";
  readonly ddlTxId: string; readonly ddlMode: "ACCESS EXCLUSIVE";
  readonly ddlStatus: "not-requested" | "waiting" | "granted" | "committed";
  readonly statementId: string; readonly blockerTxIds: readonly string[];
  readonly relation: "products";
}
export interface MigrationVerification {
  readonly atStep: number; readonly rowVersionIds: readonly string[];
  readonly filled: number; readonly equal: number; readonly total: number;
  readonly passed: boolean; readonly current: boolean;
}
export interface MigrationFrame {
  readonly id: string; readonly scenario: MigrationScenario; readonly step: number; readonly phase: string;
  readonly title: string; readonly detail: string; readonly assumptions: readonly string[];
  readonly schemaVersion: number; readonly schemaColumns: readonly MigrationColumn[];
  readonly rows: readonly MigrationRow[]; readonly versions: readonly MigrationVersion[];
  readonly appCapabilities: readonly MigrationApp[]; readonly capabilityEdges: readonly MigrationCapabilityEdge[];
  readonly failedReferences: readonly MigrationCapabilityEdge[]; readonly activeWriters: readonly string[];
  readonly validation: MigrationValidation; readonly changedRowKeys: readonly string[];
  readonly event: MigrationEvent; readonly currentEvent: MigrationEvent;
  readonly backfill: MigrationBackfill; readonly lockWait: MigrationLockWait | null;
  readonly lastVerification: MigrationVerification | null; readonly finished: boolean;
}
export const MIGRATION_SCENARIOS: readonly MigrationScenario[];
export const MIGRATION_ASSUMPTIONS: readonly string[];
export function migrationsFrames(options?: { scenario?: MigrationScenario }): readonly MigrationFrame[];

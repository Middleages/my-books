export interface CustomerRow { id: number; display_name: string }
export interface ProductRow {
  id: number; name: string; unit_price_won: number; available_qty: number;
}
export interface OrderRow {
  id: number; customer_id: number; request_key: string;
  status: "confirmed" | "cancelled"; created_at: string;
}
export interface OrderItemRow {
  order_id: number; line_no: number; product_id: number;
  qty: number | null; unit_price_won: number;
}
export interface RowByTable {
  customers: CustomerRow; products: ProductRow;
  orders: OrderRow; order_items: OrderItemRow;
}
export type TableName = keyof RowByTable;
export type Fixture = { [T in TableName]: RowByTable[T][] };
export type ReadonlyFixture = { readonly [T in TableName]: readonly Readonly<RowByTable[T]>[] };
export type FixtureName = "canonical" | "last-item" | "same-name";
export interface FixtureViolation { code: string; rowKey: string; column: string | null; message: string }
export interface RelationEndpoint { table: TableName; rowKey: string; column: string; value: number }
export interface RelationEdge { id: string; from: RelationEndpoint; to: RelationEndpoint; exists: boolean }
export interface CustomerSummary {
  orderCount: number; itemCount: number; totalQty: number; totalWon: number; orderIds: number[];
}
export const TABLE_COLUMNS: Readonly<{ [T in TableName]: readonly (keyof RowByTable[T])[] }>;
export const CANONICAL_FIXTURE: ReadonlyFixture;
export function rowKey<T extends TableName>(table: T, row: RowByTable[T]): string;
export function validateFixture(fixture: unknown, options?: { notNull?: boolean }): {
  valid: boolean; violations: FixtureViolation[];
};
export function assertFixture<T extends ReadonlyFixture>(fixture: T, options?: { notNull?: boolean }): T;
export function cloneFixture(fixture?: ReadonlyFixture, options?: { notNull?: boolean }): Fixture;
export function createFixture(name?: FixtureName): Fixture;
export function renameCustomer(fixture: ReadonlyFixture, id: number, displayName: string): Fixture;
export function summarizeCustomer(fixture?: ReadonlyFixture, customerId?: number): CustomerSummary;
export function fixtureRelations(fixture?: ReadonlyFixture): RelationEdge[];

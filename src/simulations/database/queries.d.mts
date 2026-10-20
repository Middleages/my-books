import type { CustomerRow, OrderRow, OrderItemRow, ReadonlyFixture } from "./fixture.mjs";

export type QueryJoin = "inner" | "left";
export type QueryStatus = "confirmed" | "all";
export type QueryMetric = "count-star" | "count-order" | "count-distinct-order";
export type QueryPhase = "source" | "order-match" | "item-join" | "aggregate";
export interface QuerySourceRows {
  readonly customers: readonly Readonly<CustomerRow>[];
  readonly orders: readonly Readonly<OrderRow>[];
  readonly order_items: readonly Readonly<OrderItemRow>[];
}
export interface QueryPair {
  readonly id: string;
  readonly kind: "customer-order" | "order-item";
  readonly fromKey: string | null;
  readonly toKey: string | null;
  readonly parentPairId: string | null;
  readonly customerId: number;
  readonly orderId: number | null;
  readonly lineNo: number | null;
  readonly matched: boolean;
}
export interface QueryResultRow {
  readonly id: string;
  readonly customerId: number;
  readonly customerName: string;
  readonly customerKey: string;
  readonly orderId: number | null;
  readonly orderKey: string | null;
  readonly itemKey: string | null;
  readonly lineNo: number | null;
  readonly qty: number | null;
  readonly capturedUnitPriceWon: number | null;
  readonly amountWon: number | null;
  readonly nullExtended: boolean;
  readonly pairIds: readonly string[];
  readonly sourceRowKeys: readonly string[];
}
export interface QueryMetrics {
  readonly countStar: number;
  readonly countOrder: number;
  readonly countDistinctOrder: number;
  readonly sumQty: number | null;
  readonly sumWon: number | null;
}
export interface QueryCountedIds {
  /** COUNT(*) and COUNT(o.id) count result-row identities, not source orders. */
  readonly countStar: readonly string[];
  readonly countOrder: readonly string[];
  /** DISTINCT counts source order identities, once per group. */
  readonly countDistinctOrder: readonly string[];
  readonly sumQty: readonly string[];
  readonly sumWon: readonly string[];
}
export interface QueryGroup {
  readonly id: string;
  readonly customerId: number;
  readonly customerName: string;
  readonly resultRowIds: readonly string[];
  readonly orderIds: readonly number[];
  readonly metrics: QueryMetrics;
  readonly countedIds: QueryCountedIds;
}
export interface QueryFrame {
  readonly scenarioId: string;
  readonly observationKind: "logical-query-relations";
  readonly step: number;
  readonly phase: QueryPhase;
  readonly title: string;
  readonly detail: string;
  readonly assumptions: readonly string[];
  readonly customerId: number;
  readonly join: QueryJoin;
  readonly status: QueryStatus;
  readonly metric: QueryMetric;
  readonly sourceRows: QuerySourceRows;
  readonly sourceRowKeys: readonly string[];
  /** Matched and explicitly null-extended pairs; inspect matched before drawing an FK edge. */
  readonly matchedPairs: readonly QueryPair[];
  readonly resultRows: readonly QueryResultRow[];
  readonly groups: readonly QueryGroup[];
  readonly selectedCountedIds: readonly string[];
  readonly sql: string;
  readonly aggregateSql: string;
  readonly ordering: string;
  readonly finished: boolean;
}
export interface QueryOptions {
  fixture?: ReadonlyFixture;
  customerId?: number;
  join?: QueryJoin;
  status?: QueryStatus;
  metric?: QueryMetric;
}
export type JoinFilterPlacement = "on" | "where";
export interface JoinFilterRow {
  readonly id: string;
  readonly customerId: number;
  readonly customerName: string;
  readonly customerKey: string;
  readonly orderId: number | null;
  readonly orderKey: string | null;
  readonly status: "confirmed" | "cancelled" | null;
  readonly pairId: string;
  readonly nullExtended: boolean;
}
export interface JoinFilterFrame {
  readonly scenarioId: string;
  readonly observationKind: "logical-outer-join-filter";
  readonly step: number;
  readonly phase: "source" | "join" | "filter";
  readonly title: string;
  readonly detail: string;
  readonly assumptions: readonly string[];
  readonly placement: JoinFilterPlacement;
  readonly sourceRows: {
    readonly customers: readonly Readonly<CustomerRow>[];
    readonly orders: readonly Readonly<OrderRow>[];
  };
  readonly matchedPairs: readonly QueryPair[];
  /** Before WHERE; candidates are not yet final output. */
  readonly candidateRows: readonly JoinFilterRow[];
  readonly resultRows: readonly JoinFilterRow[];
  readonly discardedRows: readonly JoinFilterRow[];
  readonly preservedCustomerIds: readonly number[];
  readonly sql: string;
  readonly ordering: string;
  readonly finished: boolean;
}
export const QUERY_JOINS: readonly QueryJoin[];
export const QUERY_STATUSES: readonly QueryStatus[];
export const QUERY_METRICS: readonly QueryMetric[];
export const JOIN_FILTER_PLACEMENTS: readonly JoinFilterPlacement[];
export const QUERY_ASSUMPTIONS: readonly string[];
export function queryFrames(options?: QueryOptions): readonly QueryFrame[];
export function joinFilterFrames(options?: {
  fixture?: ReadonlyFixture; placement?: JoinFilterPlacement;
}): readonly JoinFilterFrame[];

import { CANONICAL_FIXTURE, cloneFixture, rowKey } from "./fixture.mjs";

const freeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const optionsObject = (value, allowed) => {
  if (value === null || typeof value !== "object" || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value)))
    throw new TypeError("Query options must be a plain object");
  if (Reflect.ownKeys(value).some((key) => !allowed.includes(key)))
    throw new RangeError("Unknown query option");
};
const choose = (value, choices, name) => {
  if (!choices.includes(value)) throw new RangeError(`Unknown ${name}: ${String(value)}`);
  return value;
};
const safe = (value, name) => {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new RangeError(`${name} exceeds the nonnegative safe integer range`);
  return value;
};
const unique = (values) => [...new Set(values)];
const byId = (a, b) => a.id - b.id;
const byItem = (a, b) => a.order_id - b.order_id || a.line_no - b.line_no;

export const QUERY_JOINS = freeze(["inner", "left"]);
export const QUERY_STATUSES = freeze(["confirmed", "all"]);
export const QUERY_METRICS = freeze(["count-star", "count-order", "count-distinct-order"]);
export const JOIN_FILTER_PLACEMENTS = freeze(["on", "where"]);
export const QUERY_ASSUMPTIONS = freeze([
  "고정 선택지를 계산하는 브라우저 교육 모델입니다. SQL 파서·평가기·실제 DB 실행이 아닙니다.",
  "단계는 결과의 의미를 설명하는 논리적 관찰입니다. PostgreSQL 내부 실행 순서나 실행계획이 아닙니다.",
  "LEFT 선택은 고객→주문과 주문→항목 모두 LEFT JOIN입니다. 확정 상태 조건은 주문 JOIN의 ON에 둡니다.",
  "금액은 주문 항목에 저장된 당시 단가×수량의 정수 원입니다. 현재 상품 단가는 사용하지 않습니다.",
  "SUM은 NULL을 제외하고 더하며 더할 값이 없으면 NULL입니다. GROUP BY 입력이 없으면 그룹도 없습니다.",
]);

function orderPairs(customers, orders, join, status) {
  return customers.flatMap((customer) => {
    const matches = orders.filter((order) => order.customer_id === customer.id &&
      (status === "all" || order.status === "confirmed"));
    const pair = (order) => ({
      id: `pair:customer:${customer.id}:order:${order?.id ?? "NULL"}`,
      kind: "customer-order", fromKey: rowKey("customers", customer),
      toKey: order ? rowKey("orders", order) : null, parentPairId: null,
      customerId: customer.id, orderId: order?.id ?? null, lineNo: null,
      matched: order !== null,
    });
    return matches.length ? matches.map(pair) : join === "left" ? [pair(null)] : [];
  });
}

function joinedItems(sourceRows, pairs, join) {
  const itemPairs = [];
  const resultRows = [];
  for (const pair of pairs) {
    const customer = sourceRows.customers.find((row) => row.id === pair.customerId);
    const items = pair.orderId === null ? [] :
      sourceRows.order_items.filter((row) => row.order_id === pair.orderId);
    for (const item of items.length ? items : join === "left" ? [null] : []) {
      const itemKey = item ? rowKey("order_items", item) : null;
      const itemPair = {
        id: `pair:customer:${pair.customerId}:order:${pair.orderId ?? "NULL"}:item:${item?.line_no ?? "NULL"}`,
        kind: "order-item", fromKey: pair.toKey, toKey: itemKey,
        parentPairId: pair.id, customerId: pair.customerId,
        orderId: pair.orderId, lineNo: item?.line_no ?? null, matched: item !== null,
      };
      const qty = item?.qty ?? null;
      const capturedUnitPriceWon = item?.unit_price_won ?? null;
      const amountWon = qty === null ? null : safe(qty * capturedUnitPriceWon, "Line amount");
      itemPairs.push(itemPair);
      resultRows.push({
        id: `result:${pair.customerId}:${pair.orderId ?? "NULL"}:${item?.line_no ?? "NULL"}`,
        customerId: pair.customerId, customerName: customer.display_name,
        customerKey: pair.fromKey, orderId: pair.orderId, orderKey: pair.toKey,
        itemKey, lineNo: item?.line_no ?? null, qty, capturedUnitPriceWon, amountWon,
        nullExtended: item === null,
        pairIds: [pair.id, itemPair.id],
        sourceRowKeys: [pair.fromKey, pair.toKey, itemKey].filter((key) => key !== null),
      });
    }
  }
  return { itemPairs, resultRows };
}

function aggregate(rows) {
  const ids = unique(rows.map((row) => row.customerId));
  return ids.map((customerId) => {
    const members = rows.filter((row) => row.customerId === customerId);
    const withOrders = members.filter((row) => row.orderId !== null);
    const withQty = members.filter((row) => row.qty !== null);
    const withAmount = members.filter((row) => row.amountWon !== null);
    const sum = (values, name) => values.length ?
      values.reduce((total, value) => safe(total + value, name), 0) : null;
    const countedIds = {
      countStar: members.map((row) => row.id),
      countOrder: withOrders.map((row) => row.id),
      countDistinctOrder: unique(withOrders.map((row) => row.orderKey)),
      sumQty: withQty.map((row) => row.id),
      sumWon: withAmount.map((row) => row.id),
    };
    return {
      id: `group:customer:${customerId}`, customerId, customerName: members[0].customerName,
      resultRowIds: members.map((row) => row.id),
      orderIds: unique(withOrders.map((row) => row.orderId)),
      metrics: {
        countStar: safe(countedIds.countStar.length, "COUNT(*)"),
        countOrder: safe(countedIds.countOrder.length, "COUNT(o.id)"),
        countDistinctOrder: safe(countedIds.countDistinctOrder.length, "COUNT(DISTINCT o.id)"),
        sumQty: sum(withQty.map((row) => row.qty), "SUM(qty)"),
        sumWon: sum(withAmount.map((row) => row.amountWon), "SUM(amount)"),
      },
      countedIds,
    };
  });
}

function querySql({ customerId, join, status }) {
  const joinSql = join === "left" ? "LEFT JOIN" : "INNER JOIN";
  const from = `FROM customers c\n${joinSql} orders o ON o.customer_id = c.id${status === "confirmed" ? " AND o.status = 'confirmed'" : ""}\n${joinSql} order_items i ON i.order_id = o.id\nWHERE c.id = ${customerId}`;
  return {
    sql: `SELECT c.id AS customer_id, o.id AS order_id, i.line_no,\n       i.qty, i.unit_price_won, i.qty * i.unit_price_won AS amount_won\n${from}\nORDER BY c.id, o.id, i.line_no;`,
    aggregateSql: `SELECT c.id, COUNT(*) AS result_rows, COUNT(o.id) AS nonnull_order_ids,\n       COUNT(DISTINCT o.id) AS distinct_orders,\n       SUM(i.qty) AS quantity, SUM(i.qty * i.unit_price_won) AS amount_won\n${from}\nGROUP BY c.id\nORDER BY c.id;`,
  };
}

/** Preset relational observations only. No SQL string is parsed or executed. */
export function queryFrames(options = {}) {
  optionsObject(options, ["fixture", "customerId", "join", "status", "metric"]);
  const { fixture = CANONICAL_FIXTURE, customerId = 1, join = "inner",
    status = "confirmed", metric = "count-star" } = options;
  if (!Number.isSafeInteger(customerId) || customerId < 1)
    throw new RangeError("Customer id must be a positive safe integer");
  choose(join, QUERY_JOINS, "join");
  choose(status, QUERY_STATUSES, "status");
  choose(metric, QUERY_METRICS, "metric");
  const snapshot = cloneFixture(fixture, { notNull: false });
  const customers = snapshot.customers.filter((row) => row.id === customerId).sort(byId);
  const orders = snapshot.orders.filter((row) => row.customer_id === customerId).sort(byId);
  const orderIds = new Set(orders.map((row) => row.id));
  const sourceRows = {
    customers, orders,
    order_items: snapshot.order_items.filter((row) => orderIds.has(row.order_id)).sort(byItem),
  };
  const sourceRowKeys = Object.entries(sourceRows).flatMap(([table, rows]) =>
    rows.map((row) => rowKey(table, row)));
  const pairs = orderPairs(customers, orders, join, status);
  const { itemPairs, resultRows } = joinedItems(sourceRows, pairs, join);
  const groups = aggregate(resultRows);
  const metricKey = {
    "count-star": "countStar", "count-order": "countOrder", "count-distinct-order": "countDistinctOrder",
  }[metric];
  const descriptions = [
    ["source", "원본 행과 키", "선택한 고객의 원본을 관찰합니다. 같은 주문 행을 아직 항목 수만큼 늘리지 않습니다."],
    ["order-match", "고객과 주문의 짝", "ON 조건을 만족하는 주문을 연결합니다. LEFT는 맞는 주문이 없는 고객에 NULL 자리를 남깁니다."],
    ["item-join", "항목마다 만들어진 결과행", "주문 1행에 항목이 여러 개면 같은 주문 id가 여러 결과행에 나타납니다. LEFT는 항목 없는 주문도 남깁니다."],
    ["aggregate", "고객별 묶음과 세 가지 COUNT", "같은 결과행에서 COUNT(*), COUNT(o.id), COUNT(DISTINCT o.id)와 수량·금액을 계산합니다."],
  ];
  const base = {
    scenarioId: `query:${customerId}:${join}:${status}:${metric}`,
    observationKind: "logical-query-relations", assumptions: QUERY_ASSUMPTIONS,
    customerId, join, status, metric, sourceRows, sourceRowKeys,
    ...querySql({ customerId, join, status }),
    ordering: "결과행: ORDER BY c.id, o.id, i.line_no. 집계행: ORDER BY c.id. 원본 표 정렬은 화면용입니다.",
  };
  return freeze(descriptions.map(([phase, title, detail], step) => ({
    ...base, step, phase, title, detail,
    matchedPairs: step < 1 ? [] : step < 2 ? pairs : [...pairs, ...itemPairs],
    resultRows: step < 2 ? [] : resultRows,
    groups: step < 3 ? [] : groups,
    selectedCountedIds: step < 3 ? [] : groups.flatMap((group) => group.countedIds[metricKey]),
    finished: step === descriptions.length - 1,
  })));
}

/** Two-table LEFT JOIN example kept separate from item fan-out and grouping. */
export function joinFilterFrames(options = {}) {
  optionsObject(options, ["fixture", "placement"]);
  const { fixture = CANONICAL_FIXTURE, placement = "on" } = options;
  choose(placement, JOIN_FILTER_PLACEMENTS, "filter placement");
  const snapshot = cloneFixture(fixture, { notNull: false });
  const sourceRows = {
    customers: snapshot.customers.sort(byId), orders: snapshot.orders.sort(byId),
  };
  const matchedPairs = orderPairs(sourceRows.customers, sourceRows.orders, "left",
    placement === "on" ? "confirmed" : "all");
  const candidateRows = matchedPairs.map((pair) => {
    const customer = sourceRows.customers.find((row) => row.id === pair.customerId);
    const order = sourceRows.orders.find((row) => row.id === pair.orderId);
    return {
      id: `filter:${pair.customerId}:${pair.orderId ?? "NULL"}`,
      customerId: pair.customerId, customerName: customer.display_name,
      customerKey: pair.fromKey, orderId: pair.orderId, orderKey: pair.toKey,
      status: order?.status ?? null, pairId: pair.id, nullExtended: !pair.matched,
    };
  });
  const resultRows = candidateRows.filter((row) => placement === "on" || row.status === "confirmed");
  const discardedRows = candidateRows.filter((row) => !resultRows.includes(row));
  const sql = `SELECT c.id AS customer_id, o.id AS order_id, o.status\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id${placement === "on" ? " AND o.status = 'confirmed'" : "\nWHERE o.status = 'confirmed'"}\nORDER BY c.id, o.id;`;
  const assumptions = [
    "고객·주문 두 표만 사용하는 별도 예입니다. 주문 항목 JOIN·집계는 포함하지 않습니다.",
    "ON은 연결할 주문을 정하고, WHERE는 연결한 뒤의 행을 거릅니다. WHERE에서 NULL과 'confirmed'의 비교는 TRUE가 아니므로 남지 않습니다.",
    "교육용 논리 관찰이며 SQL 실행이나 물리적 연산 순서의 재현이 아닙니다.",
  ];
  const descriptions = [
    ["source", "같은 고객·주문 원본", "같은 고객·주문에서 조건에 맞는 주문, 조건에 맞지 않는 주문, 주문이 없는 경우를 살펴봅니다."],
    ["join", "LEFT JOIN 후보", placement === "on" ?
      "ON에서 확정 주문만 연결합니다. 맞는 주문이 없는 고객에는 NULL 자리가 생깁니다." :
      "상태와 무관하게 먼저 연결합니다. 취소 주문도 연결되고, 주문이 없는 고객에는 NULL 자리가 생깁니다."],
    ["filter", "최종 결과 비교", placement === "on" ?
      "상태 WHERE가 없으므로 맞는 주문이 없는 고객의 NULL 행도 남습니다." :
      "WHERE status = 'confirmed'는 취소 주문 행과 NULL 행을 모두 제외합니다."],
  ];
  return freeze(descriptions.map(([phase, title, detail], step) => ({
    scenarioId: `join-filter:${placement}`, observationKind: "logical-outer-join-filter",
    step, phase, title, detail, assumptions, placement, sourceRows,
    matchedPairs: step < 1 ? [] : matchedPairs,
    candidateRows: step < 1 ? [] : candidateRows,
    resultRows: step < 2 ? [] : resultRows,
    discardedRows: step < 2 ? [] : discardedRows,
    preservedCustomerIds: step < 2 ? [] : unique(resultRows.map((row) => row.customerId)),
    sql, ordering: "ORDER BY c.id, o.id를 명시한 결과입니다. 원본 표 정렬은 화면용입니다.",
    finished: step === descriptions.length - 1,
  })));
}

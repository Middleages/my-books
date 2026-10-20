import test from "node:test";
import assert from "node:assert/strict";
import { CANONICAL_FIXTURE, createFixture, rowKey } from "../src/simulations/database/fixture.mjs";
import {
  QUERY_JOINS, QUERY_STATUSES, QUERY_METRICS, JOIN_FILTER_PLACEMENTS,
  queryFrames, joinFilterFrames,
} from "../src/simulations/database/queries.mjs";

const last = (frames) => frames.at(-1);
const metrics = (options) => last(queryFrames(options)).groups[0]?.metrics;
const canonical = structuredClone(CANONICAL_FIXTURE);

function assertFrozen(value) {
  if (value && typeof value === "object") {
    assert.ok(Object.isFrozen(value));
    Object.values(value).forEach(assertFrozen);
  }
}

function assertProvenance(frame) {
  const sources = Object.entries(frame.sourceRows).flatMap(([table, rows]) =>
    rows.map((row) => ({ key: rowKey(table, row), row })));
  assert.deepEqual(frame.sourceRowKeys, sources.map((source) => source.key));
  const source = (key) => sources.find((entry) => entry.key === key)?.row;
  assert.equal(new Set(frame.matchedPairs.map((pair) => pair.id)).size, frame.matchedPairs.length);
  assert.equal(new Set(frame.resultRows.map((row) => row.id)).size, frame.resultRows.length);
  for (const pair of frame.matchedPairs) {
    if (pair.fromKey !== null) assert.ok(source(pair.fromKey));
    if (pair.toKey !== null) assert.ok(source(pair.toKey));
    if (pair.kind === "customer-order") {
      assert.equal(source(pair.fromKey).id, pair.customerId);
      if (pair.matched) {
        assert.equal(source(pair.toKey).customer_id, source(pair.fromKey).id);
        assert.equal(source(pair.toKey).id, pair.orderId);
      } else assert.equal(pair.orderId, null);
    } else {
      const parent = frame.matchedPairs.find((entry) => entry.id === pair.parentPairId);
      assert.ok(parent);
      assert.equal(pair.fromKey, parent.toKey);
      if (pair.matched) {
        assert.equal(source(pair.toKey).order_id, source(pair.fromKey).id);
        assert.equal(source(pair.toKey).line_no, pair.lineNo);
      } else assert.equal(pair.lineNo, null);
    }
    assert.equal(pair.matched, pair.toKey !== null);
  }
  for (const row of frame.resultRows) {
    assert.deepEqual(row.sourceRowKeys,
      [row.customerKey, row.orderKey, row.itemKey].filter((key) => key !== null));
    for (const key of row.sourceRowKeys) assert.ok(source(key));
    const pairs = row.pairIds.map((id) => frame.matchedPairs.find((pair) => pair.id === id));
    assert.equal(pairs.length, 2);
    assert.ok(pairs.every(Boolean));
    assert.equal(pairs[1].parentPairId, pairs[0].id);
    assert.equal(pairs[1].toKey, row.itemKey);
    assert.equal(row.customerId, source(row.customerKey).id);
    assert.equal(row.orderId, row.orderKey === null ? null : source(row.orderKey).id);
    assert.equal(row.nullExtended, row.itemKey === null);
    if (row.itemKey !== null) {
      const item = source(row.itemKey);
      assert.equal(row.qty, item.qty);
      assert.equal(row.capturedUnitPriceWon, item.unit_price_won);
      assert.equal(row.amountWon, item.qty === null ? null : item.qty * item.unit_price_won);
    } else {
      assert.equal(row.qty, null);
      assert.equal(row.amountWon, null);
      assert.equal(row.capturedUnitPriceWon, null);
    }
  }
  for (const group of frame.groups) {
    const rows = group.resultRowIds.map((id) => frame.resultRows.find((row) => row.id === id));
    assert.ok(rows.every((row) => row.customerId === group.customerId));
    assert.deepEqual(group.countedIds.countStar, rows.map((row) => row.id));
    assert.deepEqual(group.countedIds.countOrder, rows.filter((row) => row.orderId !== null).map((row) => row.id));
    assert.deepEqual(group.countedIds.countDistinctOrder,
      [...new Set(rows.filter((row) => row.orderKey !== null).map((row) => row.orderKey))]);
    assert.deepEqual(group.countedIds.sumQty, rows.filter((row) => row.qty !== null).map((row) => row.id));
    assert.deepEqual(group.countedIds.sumWon, rows.filter((row) => row.amountWon !== null).map((row) => row.id));
    assert.equal(group.metrics.countStar, group.countedIds.countStar.length);
    assert.equal(group.metrics.countOrder, group.countedIds.countOrder.length);
    assert.equal(group.metrics.countDistinctOrder, group.countedIds.countDistinctOrder.length);
    const sum = (key) => {
      const values = rows.map((row) => row[key]).filter((value) => value !== null);
      return values.length ? values.reduce((total, value) => total + value, 0) : null;
    };
    assert.equal(group.metrics.sumQty, sum("qty"));
    assert.equal(group.metrics.sumWon, sum("amountWon"));
  }
}

test("canonical confirmed customer 1 has two orders but three joined rows, seven pieces and captured 36000 won", () => {
  const final = last(queryFrames());
  assert.deepEqual(final.groups[0].metrics, {
    countStar: 3, countOrder: 3, countDistinctOrder: 2, sumQty: 7, sumWon: 36000,
  });
  assert.deepEqual(final.groups[0].orderIds, [1001, 1002]);
  assert.deepEqual(final.resultRows.map((row) => row.id), [
    "result:1:1001:1", "result:1:1001:2", "result:1:1002:1",
  ]);
  assert.equal(final.sourceRows.orders.filter((row) => row.id === 1001).length, 1);
  assert.equal(final.resultRows.filter((row) => row.orderId === 1001).length, 2);
  assert.deepEqual(final.resultRows.map((row) => row.amountWon), [12000, 16000, 8000]);
  assert.equal(final.matchedPairs.filter((pair) => pair.kind === "customer-order").length, 2);
  assert.equal(final.matchedPairs.filter((pair) => pair.kind === "order-item").length, 3);
  assertProvenance(final);
});

test("logical phases expose only constructed relations, not a fake physical optimizer trace", () => {
  const frames = queryFrames();
  assert.deepEqual(frames.map((frame) => frame.phase), ["source", "order-match", "item-join", "aggregate"]);
  assert.deepEqual(frames.map((frame) => frame.matchedPairs.length), [0, 2, 5, 5]);
  assert.deepEqual(frames.map((frame) => frame.resultRows.length), [0, 0, 3, 3]);
  assert.deepEqual(frames.map((frame) => frame.groups.length), [0, 0, 0, 1]);
  assert.deepEqual(frames.map((frame) => frame.selectedCountedIds.length), [0, 0, 0, 3]);
  for (const [step, frame] of frames.entries()) {
    assert.equal(frame.step, step);
    assert.equal(frame.finished, step === 3);
    assert.equal(frame.observationKind, "logical-query-relations");
    assert.ok(frame.assumptions.some((text) => text.includes("실행계획이 아닙니다")));
    assertProvenance(frame);
  }
});

test("LEFT no-order customer is one null-extended row with COUNT 1/0/0 and NULL SUM, INNER has no group", () => {
  const left = last(queryFrames({ customerId: 3, join: "left" }));
  assert.deepEqual(left.groups[0].metrics, {
    countStar: 1, countOrder: 0, countDistinctOrder: 0, sumQty: null, sumWon: null,
  });
  assert.equal(left.resultRows[0].id, "result:3:NULL:NULL");
  assert.deepEqual(left.resultRows[0].sourceRowKeys, ["customers:3"]);
  assert.equal(left.resultRows[0].orderKey, null);
  assert.equal(left.resultRows[0].itemKey, null);
  assert.equal(left.resultRows[0].nullExtended, true);
  assertProvenance(left);
  const inner = last(queryFrames({ customerId: 3, join: "inner" }));
  assert.deepEqual(inner.resultRows, []);
  assert.deepEqual(inner.groups, []);
  assert.deepEqual(inner.selectedCountedIds, []);
});

test("confirmed in ON preserves cancelled-only customer under LEFT, while all status retains their actual order", () => {
  assert.deepEqual(metrics({ customerId: 2, join: "left", status: "confirmed" }), {
    countStar: 1, countOrder: 0, countDistinctOrder: 0, sumQty: null, sumWon: null,
  });
  assert.deepEqual(metrics({ customerId: 2, join: "left", status: "all" }), {
    countStar: 1, countOrder: 1, countDistinctOrder: 1, sumQty: 1, sumWon: 9000,
  });
  assert.equal(last(queryFrames({ customerId: 2, join: "inner" })).groups.length, 0);
});

test("all join/status/count-focus presets preserve exact provenance and simultaneous metrics", () => {
  const field = { "count-star": "countStar", "count-order": "countOrder", "count-distinct-order": "countDistinctOrder" };
  for (const customerId of [1, 2, 3, 999]) for (const join of QUERY_JOINS)
    for (const status of QUERY_STATUSES) for (const metric of QUERY_METRICS) {
      const frames = queryFrames({ customerId, join, status, metric });
      for (const frame of frames) assertProvenance(frame);
      const final = last(frames);
      assert.deepEqual(final.selectedCountedIds, final.groups.flatMap((group) => group.countedIds[field[metric]]));
      assert.deepEqual(final.groups, last(queryFrames({ customerId, join, status })).groups);
    }
  assert.deepEqual(last(queryFrames({ metric: "count-distinct-order" })).selectedCountedIds,
    ["orders:1001", "orders:1002"]);
});

test("LEFT applies through both joins so an empty confirmed order is counted but contributes NULL quantity/amount", () => {
  const fixture = createFixture();
  fixture.orders.push({
    id: 1004, customer_id: 3, request_key: "key-1004", status: "confirmed", created_at: "2026-01-12T01:00:00Z",
  });
  const left = last(queryFrames({ fixture, customerId: 3, join: "left" }));
  assert.deepEqual(left.groups[0].metrics, {
    countStar: 1, countOrder: 1, countDistinctOrder: 1, sumQty: null, sumWon: null,
  });
  assert.equal(left.resultRows[0].orderId, 1004);
  assert.equal(left.resultRows[0].itemKey, null);
  assertProvenance(left);
  assert.equal(last(queryFrames({ fixture, customerId: 3, join: "inner" })).groups.length, 0);
  assert.match(left.sql, /LEFT JOIN orders/);
  assert.match(left.sql, /LEFT JOIN order_items/);
});

test("a nullable qty still contributes to COUNT but SUM ignores it, and a numeric zero is not NULL", () => {
  const fixture = createFixture();
  fixture.order_items[0].qty = null;
  assert.deepEqual(metrics({ fixture }), {
    countStar: 3, countOrder: 3, countDistinctOrder: 2, sumQty: 6, sumWon: 24000,
  });
  fixture.order_items[1].qty = null;
  fixture.order_items[2].qty = null;
  assert.deepEqual(metrics({ fixture }), {
    countStar: 3, countOrder: 3, countDistinctOrder: 2, sumQty: null, sumWon: null,
  });
  fixture.order_items[0].qty = 1;
  fixture.order_items[0].unit_price_won = 0;
  assert.deepEqual(metrics({ fixture }), {
    countStar: 3, countOrder: 3, countDistinctOrder: 2, sumQty: 1, sumWon: 0,
  });
  const final = last(queryFrames({ fixture }));
  assert.deepEqual(final.groups[0].countedIds.sumWon, ["result:1:1001:1"]);
  assertProvenance(final);
});

test("current product prices and duplicate customer names cannot change captured amounts or group identity", () => {
  const fixture = createFixture("same-name");
  const before = last(queryFrames({ fixture }));
  for (const product of fixture.products) product.unit_price_won = Number.MAX_SAFE_INTEGER;
  const after = last(queryFrames({ fixture }));
  assert.deepEqual(after, before);
  assert.equal(after.groups[0].customerId, 1);
  assert.equal(after.groups[0].metrics.sumWon, 36000);
  assert.equal(last(queryFrames({ fixture, customerId: 2, status: "all" })).groups[0].metrics.sumWon, 9000);
});

test("empty fixture or nonexistent customer yields no GROUP BY output, including LEFT", () => {
  const fixture = { customers: [], products: [], orders: [], order_items: [] };
  for (const join of QUERY_JOINS) {
    assert.deepEqual(last(queryFrames({ fixture, join })).groups, []);
    assert.deepEqual(last(queryFrames({ customerId: 999, join })).groups, []);
    assert.deepEqual(last(queryFrames({ customerId: Number.MAX_SAFE_INTEGER, join })).groups, []);
  }
});

test("line multiplication and separate aggregate quantity/amount overflow fail instead of rounding", () => {
  const fixture = createFixture();
  fixture.order_items[0].qty = 2;
  fixture.order_items[0].unit_price_won = Number.MAX_SAFE_INTEGER;
  assert.throws(() => queryFrames({ fixture }), /Line amount.*safe integer/);
  fixture.order_items[0].qty = 1;
  assert.throws(() => queryFrames({ fixture }), /SUM\(amount\).*safe integer/);
  fixture.order_items[0].qty = Number.MAX_SAFE_INTEGER;
  fixture.order_items[0].unit_price_won = 0;
  assert.throws(() => queryFrames({ fixture }), /SUM\(qty\).*safe integer/);
  fixture.order_items = fixture.order_items.slice(0, 1);
  assert.equal(metrics({ fixture }).sumQty, Number.MAX_SAFE_INTEGER);
  assert.equal(metrics({ fixture }).sumWon, 0);
  fixture.order_items[0].qty = 1;
  fixture.order_items[0].unit_price_won = Number.MAX_SAFE_INTEGER;
  assert.equal(metrics({ fixture }).sumWon, Number.MAX_SAFE_INTEGER);
});

test("query and aggregate display SQL explicitly order output and place confirmed only in ON", () => {
  for (const join of QUERY_JOINS) for (const status of QUERY_STATUSES) {
    const frame = last(queryFrames({ customerId: 3, join, status }));
    assert.match(frame.sql, /ORDER BY c\.id, o\.id, i\.line_no;/);
    assert.match(frame.aggregateSql, /GROUP BY c\.id\nORDER BY c\.id;/);
    assert.match(frame.sql, /WHERE c\.id = 3\nORDER BY/);
    assert.equal(frame.sql.includes("AND o.status = 'confirmed'"), status === "confirmed");
    assert.equal(frame.aggregateSql.includes("AND o.status = 'confirmed'"), status === "confirmed");
    assert.equal((frame.sql.match(new RegExp(`${join.toUpperCase()} JOIN`, "g")) ?? []).length, 2);
  }
});

test("two-table ON keeps cancelled-only/no-order customers; WHERE removes both without inventing an item fan-out", () => {
  const on = last(joinFilterFrames({ placement: "on" }));
  const where = last(joinFilterFrames({ placement: "where" }));
  assert.deepEqual(on.preservedCustomerIds, [1, 2, 3]);
  assert.deepEqual(on.resultRows.map((row) => [row.customerId, row.orderId]), [
    [1, 1001], [1, 1002], [2, null], [3, null],
  ]);
  assert.deepEqual(on.discardedRows, []);
  assert.deepEqual(where.preservedCustomerIds, [1]);
  assert.deepEqual(where.candidateRows.map((row) => [row.customerId, row.orderId]), [
    [1, 1001], [1, 1002], [2, 1003], [3, null],
  ]);
  assert.deepEqual(where.resultRows.map((row) => row.orderId), [1001, 1002]);
  assert.deepEqual(where.discardedRows.map((row) => [row.customerId, row.status]), [
    [2, "cancelled"], [3, null],
  ]);
  assert.ok([...on.resultRows, ...where.resultRows].every((row) => !Object.hasOwn(row, "lineNo")));
  assert.match(on.sql, /ON o\.customer_id = c\.id AND o\.status = 'confirmed'/);
  assert.match(where.sql, /ON o\.customer_id = c\.id\nWHERE o\.status = 'confirmed'/);
});

test("filter phases retain exact candidate pair identities and discarded/result partition", () => {
  for (const placement of JOIN_FILTER_PLACEMENTS) {
    const frames = joinFilterFrames({ placement });
    assert.deepEqual(frames.map((frame) => frame.phase), ["source", "join", "filter"]);
    assert.equal(frames[0].matchedPairs.length, 0);
    assert.equal(frames[0].candidateRows.length, 0);
    assert.equal(frames[1].resultRows.length, 0);
    assert.equal(frames[1].discardedRows.length, 0);
    for (const [step, frame] of frames.entries()) {
      assert.equal(frame.step, step);
      assert.equal(frame.finished, step === 2);
      for (const row of frame.candidateRows) {
        const pair = frame.matchedPairs.find((pair) => pair.id === row.pairId);
        assert.ok(pair);
        assert.equal(pair.fromKey, row.customerKey);
        assert.equal(pair.toKey, row.orderKey);
        assert.equal(pair.matched, !row.nullExtended);
      }
    }
    const frame = last(frames);
    assert.deepEqual([...frame.resultRows, ...frame.discardedRows].map((row) => row.id).sort(),
      frame.candidateRows.map((row) => row.id).sort());
    assert.match(frame.ordering, /ORDER BY/);
  }
  const empty = { customers: [], products: [], orders: [], order_items: [] };
  assert.deepEqual(last(joinFilterFrames({ fixture: empty })).preservedCustomerIds, []);
});

test("replay is deterministic and input array permutation does not change explicit output ordering", () => {
  for (const join of QUERY_JOINS) for (const metric of QUERY_METRICS) {
    const fixture = createFixture();
    const options = Object.freeze({ fixture, join, metric });
    const before = structuredClone(options);
    const frames = queryFrames(options);
    assert.deepEqual(frames, queryFrames(options));
    assert.deepEqual(options, before);
    for (const table of Object.values(fixture)) table.reverse();
    assert.deepEqual(queryFrames(options), frames);
  }
  const fixture = createFixture();
  const filters = joinFilterFrames({ fixture, placement: "where" });
  for (const table of Object.values(fixture)) table.reverse();
  assert.deepEqual(joinFilterFrames({ fixture, placement: "where" }), filters);
  assert.deepEqual(CANONICAL_FIXTURE, canonical);
});

test("all output snapshots and choices are deeply immutable without freezing the caller's fixture", () => {
  const fixture = createFixture();
  const frames = queryFrames({ fixture });
  const filters = joinFilterFrames({ fixture });
  for (const value of [frames, filters, QUERY_JOINS, QUERY_STATUSES, QUERY_METRICS, JOIN_FILTER_PLACEMENTS])
    assertFrozen(value);
  assert.throws(() => { frames[3].resultRows[0].qty = 999; }, TypeError);
  assert.throws(() => { frames[0].sourceRows.orders.push({}); }, TypeError);
  assert.throws(() => { filters[2].resultRows.pop(); }, TypeError);
  fixture.customers[0].display_name = "변경";
  fixture.order_items[0].qty = 99;
  assert.equal(frames[0].sourceRows.customers[0].display_name, "가람");
  assert.equal(frames[3].groups[0].metrics.sumQty, 7);
  assert.equal(filters[2].resultRows[0].customerName, "가람");
});

test("models reject malformed options, unknown choices and invalid fixture shapes", () => {
  for (const value of [null, [], 1, true, "sql", new Date()]) {
    assert.throws(() => queryFrames(value), TypeError);
    assert.throws(() => joinFilterFrames(value), TypeError);
  }
  for (const customerId of [0, -1, 1.1, "1", null, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => queryFrames({ customerId }), RangeError);
  for (const [key, value] of [["join", "full"], ["status", "paid"], ["metric", "sum"], ["sql", "SELECT 1"]])
    assert.throws(() => queryFrames({ [key]: value }), RangeError);
  assert.throws(() => queryFrames({ [Symbol("unknown")]: true }), RangeError);
  assert.throws(() => queryFrames({ join: Symbol("unknown") }), RangeError);
  assert.throws(() => joinFilterFrames({ placement: "having" }), RangeError);
  assert.throws(() => joinFilterFrames({ customerId: 1 }), RangeError);
  for (const fixture of [null, {}, { customers: [] }, { ...canonical, extra: [] }]) {
    assert.throws(() => queryFrames({ fixture }), RangeError);
    assert.throws(() => joinFilterFrames({ fixture }), RangeError);
  }
  const invalid = createFixture();
  invalid.order_items[0].qty = 0;
  assert.throws(() => queryFrames({ fixture: invalid }), RangeError);
  assert.throws(() => joinFilterFrames({ fixture: invalid }), RangeError);
});

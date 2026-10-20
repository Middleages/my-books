import test from "node:test";
import assert from "node:assert/strict";
import {
  CANONICAL_FIXTURE, TABLE_COLUMNS, createFixture, cloneFixture, rowKey,
  validateFixture, assertFixture, summarizeCustomer, fixtureRelations, renameCustomer,
} from "../src/simulations/database/fixture.mjs";
import {
  FILE_MODES, CONSTRAINT_SCENARIOS, fileWriteFrames, constraintFrames,
} from "../src/simulations/database/foundation.mjs";

const last = (frames) => frames.at(-1);
const rowCount = (fixture) =>
  Object.values(fixture).reduce((sum, rows) => sum + rows.length, 0);
const check = (frame, id) => frame.checks.find((entry) => entry.id === id)?.result;
const expected = {
  customers: [
    { id: 1, display_name: "가람" }, { id: 2, display_name: "누리" }, { id: 3, display_name: "다온" },
  ],
  products: [
    { id: 101, name: "머그", unit_price_won: 12000, available_qty: 5 },
    { id: 102, name: "노트", unit_price_won: 4000, available_qty: 8 },
    { id: 103, name: "파우치", unit_price_won: 9000, available_qty: 3 },
  ],
  orders: [
    { id: 1001, customer_id: 1, request_key: "key-1001", status: "confirmed", created_at: "2026-01-10T01:00:00Z" },
    { id: 1002, customer_id: 1, request_key: "key-1002", status: "confirmed", created_at: "2026-01-11T01:00:00Z" },
    { id: 1003, customer_id: 2, request_key: "key-1003", status: "cancelled", created_at: "2026-01-11T02:00:00Z" },
  ],
  order_items: [
    { order_id: 1001, line_no: 1, product_id: 101, qty: 1, unit_price_won: 12000 },
    { order_id: 1001, line_no: 2, product_id: 102, qty: 4, unit_price_won: 4000 },
    { order_id: 1002, line_no: 1, product_id: 102, qty: 2, unit_price_won: 4000 },
    { order_id: 1003, line_no: 1, product_id: 103, qty: 1, unit_price_won: 9000 },
  ],
};

test("canonical fixture has exactly the four tables and specified columns, values and row identities", () => {
  assert.deepEqual(createFixture(), expected);
  assert.deepEqual(Object.keys(CANONICAL_FIXTURE), ["customers", "products", "orders", "order_items"]);
  for (const [table, rows] of Object.entries(CANONICAL_FIXTURE)) {
    for (const row of rows) assert.deepEqual(Object.keys(row), TABLE_COLUMNS[table]);
  }
  assert.deepEqual(CANONICAL_FIXTURE.order_items.map((row) => rowKey("order_items", row)), [
    "order_items:1001:1", "order_items:1001:2", "order_items:1002:1", "order_items:1003:1",
  ]);
  assert.deepEqual(validateFixture(CANONICAL_FIXTURE), { valid: true, violations: [] });
  assert.equal(rowCount(CANONICAL_FIXTURE), 13);
});

test("customer summary counts orders, item rows, quantity and historical amount separately", () => {
  assert.deepEqual(summarizeCustomer(), {
    orderCount: 2, itemCount: 3, totalQty: 7, totalWon: 36000, orderIds: [1001, 1002],
  });
  for (const id of [2, 3, 999]) assert.deepEqual(summarizeCustomer(CANONICAL_FIXTURE, id), {
    orderCount: 0, itemCount: 0, totalQty: 0, totalWon: 0, orderIds: [],
  });
  const fixture = createFixture();
  for (const [id, total] of [[1001, 28000], [1002, 8000]]) {
    fixture.orders = CANONICAL_FIXTURE.orders.map((order) => ({
      ...order, status: order.id === id ? "confirmed" : "cancelled",
    }));
    assert.equal(summarizeCustomer(fixture).totalWon, total);
  }
});

test("current price changes do not rewrite historical item prices or subtract historical stock again", () => {
  const fixture = createFixture();
  fixture.products[0].unit_price_won = 15000;
  assert.equal(summarizeCustomer(fixture).totalWon, 36000);
  assert.deepEqual(fixture.products.map((row) => row.available_qty), [5, 8, 3]);
  assert.equal(fixture.order_items[0].unit_price_won, 12000);
});

test("named variants are explicit independent copies and the canonical fixture is deeply frozen", () => {
  const lastItem = createFixture("last-item");
  assert.deepEqual(lastItem.products.map((row) => row.available_qty), [1, 8, 3]);
  const sameName = createFixture("same-name");
  assert.deepEqual(sameName.customers.map((row) => row.display_name), ["가람", "가람", "다온"]);
  lastItem.products[0].available_qty = 88;
  sameName.customers[0].display_name = "별개 사본";
  assert.deepEqual(createFixture(), expected);
  assert.throws(() => { CANONICAL_FIXTURE.products[0].available_qty = 0; }, TypeError);
  assert.throws(() => { TABLE_COLUMNS.customers.push("other"); }, TypeError);
  assert.notEqual(createFixture().customers[0], createFixture().customers[0]);
  assert.deepEqual(cloneFixture(), expected);
});

test("actual FK endpoint keys and values agree and express customer/order/item fan-out", () => {
  const edges = fixtureRelations();
  assert.equal(edges.length, 11);
  for (const edge of edges) {
    const source = CANONICAL_FIXTURE[edge.from.table].find((row) => rowKey(edge.from.table, row) === edge.from.rowKey);
    const target = CANONICAL_FIXTURE[edge.to.table].find((row) => rowKey(edge.to.table, row) === edge.to.rowKey);
    assert.ok(source);
    assert.ok(target);
    assert.equal(source[edge.from.column], target[edge.to.column]);
    assert.equal(edge.from.value, edge.to.value);
    assert.equal(edge.exists, true);
  }
  assert.equal(edges.filter((edge) => edge.to.rowKey === "customers:1").length, 2);
  assert.equal(edges.filter((edge) => edge.to.rowKey === "orders:1001").length, 2);
  assert.equal(edges.filter((edge) => edge.to.rowKey === "products:102").length, 2);
});

test("same names and id-preserving rename never redirect a relation", () => {
  const fixture = createFixture("same-name");
  const before = structuredClone(fixture);
  const changed = renameCustomer(fixture, 1, "새 이름");
  assert.equal(changed.customers[0].display_name, "새 이름");
  assert.equal(changed.customers[1].display_name, "가람");
  assert.deepEqual(fixtureRelations(changed), fixtureRelations(fixture));
  assert.deepEqual(fixture, before);
  assert.deepEqual(summarizeCustomer(changed), summarizeCustomer(fixture));
});

test("fixture validation rejects malformed shapes and invalid keys, types, status and timestamps", () => {
  const mutations = [
    (f) => { delete f.customers; },
    (f) => { f.extra = []; },
    (f) => { f.customers = {}; },
    (f) => { f.customers[0] = null; },
    (f) => { f.products[0].extra = 1; },
    (f) => { delete f.products[0].name; },
    (f) => { f.customers[0].id = null; },
    (f) => { f.customers[0].id = 0; },
    (f) => { f.customers[0].id = 1.5; },
    (f) => { f.customers[0].display_name = null; },
    (f) => { f.customers[0].display_name = 4; },
    (f) => { f.products[0].name = null; },
    (f) => { f.products[0].unit_price_won = -1; },
    (f) => { f.products[0].available_qty = -1; },
    (f) => { f.products[0].available_qty = NaN; },
    (f) => { f.products[0].available_qty = Infinity; },
    (f) => { f.products[0].unit_price_won = Number.MAX_SAFE_INTEGER + 1; },
    (f) => { f.orders[0].customer_id = 999; },
    (f) => { f.orders[0].request_key = null; },
    (f) => { f.orders[1].request_key = f.orders[0].request_key; },
    (f) => { f.orders[0].status = "paid"; },
    (f) => { f.orders[0].created_at = "2026-02-30T01:00:00Z"; },
    (f) => { f.orders[0].created_at = "2026-01-10"; },
    (f) => { f.order_items[0].order_id = 999; },
    (f) => { f.order_items[0].product_id = 999; },
    (f) => { f.order_items[0].line_no = null; },
    (f) => { f.order_items[0].qty = 0; },
    (f) => { f.order_items[0].qty = 1.5; },
    (f) => { f.order_items[0].qty = "1"; },
    (f) => { f.order_items[0].qty = null; },
    (f) => { f.order_items[0].unit_price_won = null; },
    (f) => { f.order_items.push({ ...f.order_items[0] }); },
    (f) => { f.customers.push({ ...f.customers[0] }); },
    (f) => { f.products.push({ ...f.products[0] }); },
    (f) => { f.orders.push({ ...f.orders[0] }); },
  ];
  for (const mutate of mutations) {
    const fixture = createFixture();
    mutate(fixture);
    const result = validateFixture(fixture);
    assert.equal(result.valid, false, mutate.toString());
    assert.ok(result.violations.length > 0);
    assert.throws(() => assertFixture(fixture), RangeError);
  }
  for (const value of [null, [], undefined, "fixture", 1])
    assert.equal(validateFixture(value).valid, false);
});

test("zero price/stock are valid, qty zero is not; nullable qty alone allows SQL CHECK UNKNOWN", () => {
  const fixture = createFixture();
  fixture.products[0].unit_price_won = 0;
  fixture.products[0].available_qty = 0;
  fixture.order_items[0].unit_price_won = 0;
  assert.equal(validateFixture(fixture).valid, true);
  fixture.order_items[0].qty = null;
  assert.equal(validateFixture(fixture).valid, false);
  assert.equal(validateFixture(fixture, { notNull: false }).valid, true);
  fixture.order_items[0].qty = 0;
  assert.equal(validateFixture(fixture, { notNull: false }).valid, false);
});

test("summaries reject unsafe products and accumulated amounts without rounding", () => {
  const fixture = createFixture();
  fixture.order_items[0].unit_price_won = Number.MAX_SAFE_INTEGER;
  assert.equal(validateFixture(fixture).valid, true);
  assert.throws(() => summarizeCustomer(fixture), /safe integer range/);
  fixture.order_items[0].qty = 2;
  assert.throws(() => summarizeCustomer(fixture), /Line amount/);
  const empty = { customers: [], products: [], orders: [], order_items: [] };
  assert.deepEqual(summarizeCustomer(empty), {
    orderCount: 0, itemCount: 0, totalQty: 0, totalWon: 0, orderIds: [],
  });
});

test("fixture helper invalid arguments fail explicitly", () => {
  assert.throws(() => createFixture("random"), RangeError);
  assert.throws(() => rowKey("unknown", { id: 1 }), RangeError);
  assert.throws(() => rowKey("customers", null), TypeError);
  assert.throws(() => rowKey("customers", { id: -1 }), RangeError);
  assert.throws(() => renameCustomer(CANONICAL_FIXTURE, 999, "이름"), RangeError);
  assert.throws(() => renameCustomer(CANONICAL_FIXTURE, 0, "이름"), RangeError);
  assert.throws(() => renameCustomer(CANONICAL_FIXTURE, 1, null), TypeError);
  assert.throws(() => summarizeCustomer(CANONICAL_FIXTURE, -1), RangeError);
  assert.throws(() => validateFixture(CANONICAL_FIXTURE, { notNull: "false" }), TypeError);
});

for (const first of ["A", "B"]) {
  test(`race ${first} first: both read revision zero before either writes, confirm two from one`, () => {
    const frames = fileWriteFrames({ mode: "race", first });
    const copiesReady = frames.find((frame) => frame.localCopies.every((entry) => entry.readQty !== null));
    assert.deepEqual(copiesReady.localCopies.map((entry) => entry.sourceRevision), [0, 0]);
    assert.deepEqual(copiesReady.localCopies.map((entry) => entry.readQty), [1, 1]);
    assert.equal(copiesReady.sourceRevision, 0);
    assert.equal(copiesReady.committedOrders.length, 0);
    const result = last(frames);
    assert.equal(result.availableQty, 0);
    assert.equal(result.committedOrders.length, 2);
    assert.equal(result.committedOrders[0].app, first);
    assert.equal(result.invariant.holds, false);
    assert.equal(result.invariant.expectedQty, -1);
    assert.equal(result.measurements.overCommittedQty.value, 1);
    assert.deepEqual(result.revisionHistory.map((revision) => revision.availableQty), [1, 0, 0]);
    assert.deepEqual(result.revisionHistory.map((revision) => revision.sourceRevision), [null, 0, 0]);
    assert.equal(frames.filter((frame) => !frame.invariant.holds).length, 1);
    assert.ok(frames.every((frame) => frame.availableQty >= 0));
  });
  for (const mode of ["sequential", "file-lock", "database"]) {
    test(`${mode} ${first} first: one confirmation and one rejection preserve stock at every frame`, () => {
      const frames = fileWriteFrames({ mode, first });
      const result = last(frames);
      assert.equal(result.availableQty, 0);
      assert.equal(result.committedOrders.length, 1);
      assert.equal(result.committedOrders[0].app, first);
      assert.equal(result.localCopies.find((entry) => entry.app === first).status, "confirmed");
      const second = result.localCopies.find((entry) => entry.app !== first);
      assert.equal(second.status, "rejected");
      assert.equal(second.sourceRevision, 1);
      assert.equal(second.readQty, 0);
      assert.equal(second.writeQty, null);
      assert.ok(frames.every((frame) => frame.invariant.holds));
      assert.equal(result.lockOwner, null);
      assert.equal(result.sourceRevision, 1);
      assert.equal(result.measurements.overCommittedQty.value, 0);
      if (mode !== "sequential") {
        assert.ok(frames.some((frame) => frame.localCopies.some((entry) => entry.status === "waiting")));
        for (const frame of frames.filter((frame) => frame.edges.some((edge) => edge.active && edge.kind === "read")))
          assert.equal(frame.lockOwner, frame.activeApp);
      } else assert.ok(frames.every((frame) => frame.lockOwner === null));
    });
  }
}

test("every file event uses actual, stable endpoints and state changes agree with active edges", () => {
  const nodes = new Set(["app:A", "app:B", "copy:A", "copy:B", "store", "orders"]);
  for (const mode of FILE_MODES) {
    const frames = fileWriteFrames({ mode });
    assert.equal(frames[0].edges.length, 0);
    for (const [step, frame] of frames.entries()) {
      assert.equal(frame.step, step);
      assert.equal(frame.finished, step === frames.length - 1);
      assert.equal(frame.revisionHistory.at(-1).revision, frame.sourceRevision);
      assert.equal(frame.revisionHistory.at(-1).availableQty, frame.availableQty);
      assert.equal(new Set(frame.committedOrders.map((entry) => entry.id)).size, frame.committedOrders.length);
      assert.equal(frame.measurements.confirmedQty.value, frame.committedOrders.reduce((sum, order) => sum + order.qty, 0));
      for (const edge of frame.edges) {
        assert.ok(nodes.has(edge.from) && nodes.has(edge.to));
        assert.equal(edge.active, edge.step === step);
        assert.ok(edge.step <= step);
      }
      const active = frame.edges.filter((edge) => edge.active);
      const previous = frames[step - 1];
      if (previous && frame.sourceRevision !== previous.sourceRevision) {
        assert.equal(frame.sourceRevision, previous.sourceRevision + 1);
        assert.deepEqual(active.map((edge) => edge.kind), ["write", "confirm"]);
        assert.equal(frame.committedOrders.length, previous.committedOrders.length + 1);
      }
      if (frame.localCopies.some((entry) => entry.status === "write") &&
          active.some((edge) => edge.kind === "prepare"))
        assert.equal(frame.sourceRevision, previous.sourceRevision);
    }
  }
});

test("file and constraint replays are deterministic, inputs untouched and frames do not alias", () => {
  const options = Object.freeze({ mode: "race", first: "B" });
  assert.deepEqual(fileWriteFrames(options), fileWriteFrames(options));
  const frames = fileWriteFrames(options);
  last(frames).localCopies[0].readQty = 99;
  last(frames).revisionHistory[0].availableQty = 99;
  assert.equal(frames[0].localCopies[0].readQty, null);
  assert.equal(frames[0].revisionHistory[0].availableQty, 1);
  for (const scenario of CONSTRAINT_SCENARIOS) {
    const settings = Object.freeze({ scenario, notNull: false, rename: true, sameNames: true });
    assert.deepEqual(constraintFrames(settings), constraintFrames(settings));
  }
  const constraints = constraintFrames({ scenario: "normal" });
  last(constraints).fixture.customers[0].display_name = "mutated";
  last(constraints).candidate.row.qty = 99;
  assert.equal(constraints[0].fixture.customers[0].display_name, "가람");
  assert.equal(constraints[0].candidate.row.qty, 1);
  assert.deepEqual(CANONICAL_FIXTURE, expected);
});

test("normal item is pending outside storage, then joins its actual order and product after acceptance", () => {
  const frames = constraintFrames({ scenario: "normal" });
  assert.deepEqual(frames.map((frame) => frame.candidate.status), ["pending", "checking", "accepted"]);
  assert.deepEqual(frames.map((frame) => frame.fixture.order_items.length), [4, 4, 5]);
  assert.equal(last(frames).candidate.rowKey, "order_items:1002:2");
  assert.equal(frames[0].candidate.nodeKey, "candidate:order_items:1002:2");
  assert.equal(frames[0].candidateEdges.length, 2);
  assert.equal(last(frames).candidateEdges.length, 0);
  assert.equal(last(frames).edges.length, 13);
  assert.equal(last(frames).accepted, true);
  assert.equal(last(frames).measurements.itemRows.value, 5);
  assert.deepEqual(last(frames).fixture.order_items.slice(0, 4), expected.order_items);
});

for (const [scenario, failed] of [
  ["duplicate-pk", "primary-key"], ["missing-fk", "product-foreign-key"],
  ["zero-qty", "qty-positive"], ["null-qty", "qty-not-null"],
]) {
  test(`${scenario} is rejected without an invalid or changed committed snapshot`, () => {
    const frames = constraintFrames({ scenario });
    const result = last(frames);
    assert.equal(result.accepted, false);
    assert.equal(result.candidate.status, "rejected");
    assert.deepEqual(result.violations, [failed]);
    assert.equal(check(result, failed), "fail");
    for (const frame of frames) {
      assert.deepEqual(frame.fixture, expected);
      assert.deepEqual(frame.edges, fixtureRelations());
      assert.equal(frame.invariant.committedFixtureValid, true);
      assert.ok(frame.edges.every((edge) => edge.exists));
    }
    if (scenario === "missing-fk") {
      const missing = result.candidateEdges.find((edge) => !edge.exists);
      assert.equal(missing.to.rowKey, "products:999");
      assert.equal(missing.from.rowKey, "candidate:order_items:1002:2");
      assert.equal(missing.from.value, 999);
    }
  });
}

test("composite PK rejects the pair, not either independently reusable component", () => {
  assert.equal(last(constraintFrames({ scenario: "normal" })).accepted, true);
  const duplicate = last(constraintFrames({ scenario: "duplicate-pk" }));
  assert.equal(duplicate.candidate.rowKey, "order_items:1001:1");
  assert.notEqual(duplicate.candidate.nodeKey, duplicate.candidate.rowKey);
  assert.equal(check(duplicate, "primary-key"), "fail");
  assert.equal(check(duplicate, "order-foreign-key"), "pass");
});

test("duplicate display names are legal distinct identities with existing relationships unchanged", () => {
  const frames = constraintFrames({ scenario: "duplicate-name" });
  const result = last(frames);
  assert.equal(result.accepted, true);
  assert.equal(result.fixture.customers.length, 4);
  assert.equal(result.candidate.rowKey, "customers:4");
  assert.equal(check(result, "name-not-unique"), "disabled");
  assert.deepEqual(result.edges, frames[0].edges);
  assert.deepEqual(result.fixture.customers.filter((row) => row.display_name === "가람").map((row) => row.id), [1, 4]);
});

test("CHECK-only NULL is UNKNOWN and accepted, but unchanged zero is still FALSE and rejected", () => {
  const nullable = last(constraintFrames({ scenario: "null-qty", notNull: false }));
  assert.equal(nullable.accepted, true);
  assert.equal(check(nullable, "qty-not-null"), "disabled");
  assert.equal(check(nullable, "qty-positive"), "unknown");
  assert.equal(nullable.fixture.order_items.at(-1).qty, null);
  assert.equal(validateFixture(nullable.fixture, { notNull: false }).valid, true);
  assert.equal(validateFixture(nullable.fixture).valid, false);
  assert.equal(nullable.invariant.committedFixtureValid, true);
  const required = last(constraintFrames({ scenario: "null-qty" }));
  assert.equal(check(required, "qty-positive"), "unknown");
  assert.equal(check(required, "qty-not-null"), "fail");
  const zero = last(constraintFrames({ scenario: "zero-qty", notNull: false }));
  assert.equal(check(zero, "qty-positive"), "fail");
  assert.equal(zero.accepted, false);
});

test("an empty confirmed order passes FK yet leaves an explicit business warning", () => {
  const frame = last(constraintFrames({ scenario: "empty-order" }));
  assert.equal(frame.accepted, true);
  assert.equal(frame.fixture.orders.length, 4);
  assert.equal(frame.fixture.order_items.length, 4);
  assert.equal(frame.businessWarnings.length, 1);
  assert.match(frame.businessWarnings[0], /1004/);
  assert.ok(frame.edges.some((edge) => edge.from.rowKey === "orders:1004" && edge.to.rowKey === "customers:3"));
  assert.deepEqual(summarizeCustomer(frame.fixture, 3), {
    orderCount: 1, itemCount: 0, totalQty: 0, totalWon: 0, orderIds: [1004],
  });
});

test("optional rename gives before/after name observations with identical keys and lines", () => {
  for (const scenario of CONSTRAINT_SCENARIOS) {
    const frames = constraintFrames({ scenario, rename: true, sameNames: true, notNull: false });
    const renamed = last(frames);
    const before = frames.at(-2);
    assert.equal(renamed.phase, "rename");
    assert.equal(before.fixture.customers[0].display_name, "가람");
    assert.equal(renamed.fixture.customers[0].display_name, "가람(새 이름)");
    assert.equal(renamed.fixture.customers[1].display_name, "가람");
    assert.deepEqual(renamed.edges, before.edges);
    assert.deepEqual(renamed.candidateEdges, before.candidateEdges);
    assert.equal(renamed.fixture.customers[0].id, 1);
  }
});

test("every constraint frame preserves committed FK endpoint existence, quantities and row counts", () => {
  for (const scenario of CONSTRAINT_SCENARIOS) for (const notNull of [true, false]) {
    const frames = constraintFrames({ scenario, notNull });
    for (const [step, frame] of frames.entries()) {
      assert.equal(frame.step, step);
      assert.equal(frame.finished, step === frames.length - 1);
      assert.equal(validateFixture(frame.fixture, { notNull }).valid, true);
      assert.equal(frame.measurements.foreignKeyLinks.value, frame.edges.length);
      assert.equal(frame.measurements.orderRows.value, frame.fixture.orders.length);
      assert.equal(frame.measurements.itemRows.value, frame.fixture.order_items.length);
      assert.deepEqual(frame.fixture.products.map((row) => row.available_qty), [5, 8, 3]);
      for (const edge of frame.edges) {
        const source = frame.fixture[edge.from.table].find((row) => rowKey(edge.from.table, row) === edge.from.rowKey);
        const target = frame.fixture[edge.to.table].find((row) => rowKey(edge.to.table, row) === edge.to.rowKey);
        assert.ok(source && target);
        assert.equal(source[edge.from.column], target[edge.to.column]);
        assert.equal(edge.exists, true);
      }
      for (const edge of frame.candidateEdges) {
        assert.equal(edge.from.rowKey, frame.candidate.nodeKey);
        assert.equal(edge.from.value, frame.candidate.row[edge.from.column]);
        const target = frame.fixture[edge.to.table].find((row) => rowKey(edge.to.table, row) === edge.to.rowKey);
        assert.equal(edge.exists, Boolean(target));
        if (target) assert.equal(target[edge.to.column], edge.from.value);
      }
    }
  }
});

test("bounded scenario functions reject unknown choices and non-boolean switches", () => {
  assert.throws(() => fileWriteFrames({ mode: "auto" }), RangeError);
  assert.throws(() => fileWriteFrames({ first: "C" }), RangeError);
  assert.throws(() => constraintFrames({ scenario: "arbitrary-sql" }), RangeError);
  for (const key of ["notNull", "rename", "sameNames"])
    for (const value of [null, 1, "false"])
      assert.throws(() => constraintFrames({ [key]: value }), TypeError);
  for (const value of [null, "race", 1, [], true]) {
    assert.throws(() => fileWriteFrames(value), TypeError);
    assert.throws(() => constraintFrames(value), TypeError);
    assert.throws(() => validateFixture(CANONICAL_FIXTURE, value), TypeError);
  }
});

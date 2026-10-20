// Synthetic study-shop data, not a connection to a database.
// Money is integer KRW; quantities are integer pieces. Existing orders have
// already been accounted for in available_qty and must not be subtracted again.
const freeze = (value) => {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

export const TABLE_COLUMNS = freeze({
  customers: ["id", "display_name"],
  products: ["id", "name", "unit_price_won", "available_qty"],
  orders: ["id", "customer_id", "request_key", "status", "created_at"],
  order_items: ["order_id", "line_no", "product_id", "qty", "unit_price_won"],
});

export const CANONICAL_FIXTURE = freeze({
  customers: [
    { id: 1, display_name: "가람" },
    { id: 2, display_name: "누리" },
    { id: 3, display_name: "다온" },
  ],
  products: [
    { id: 101, name: "머그", unit_price_won: 12000, available_qty: 5 },
    { id: 102, name: "노트", unit_price_won: 4000, available_qty: 8 },
    { id: 103, name: "파우치", unit_price_won: 9000, available_qty: 3 },
  ],
  orders: [
    {
      id: 1001, customer_id: 1, request_key: "key-1001",
      status: "confirmed", created_at: "2026-01-10T01:00:00Z",
    },
    {
      id: 1002, customer_id: 1, request_key: "key-1002",
      status: "confirmed", created_at: "2026-01-11T01:00:00Z",
    },
    {
      id: 1003, customer_id: 2, request_key: "key-1003",
      status: "cancelled", created_at: "2026-01-11T02:00:00Z",
    },
  ],
  order_items: [
    { order_id: 1001, line_no: 1, product_id: 101, qty: 1, unit_price_won: 12000 },
    { order_id: 1001, line_no: 2, product_id: 102, qty: 4, unit_price_won: 4000 },
    { order_id: 1002, line_no: 1, product_id: 102, qty: 2, unit_price_won: 4000 },
    { order_id: 1003, line_no: 1, product_id: 103, qty: 1, unit_price_won: 9000 },
  ],
});

const integer = (value, minimum = 0) =>
  Number.isSafeInteger(value) && value >= minimum;
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const plain = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

export function rowKey(table, row) {
  if (!own(TABLE_COLUMNS, table)) throw new RangeError(`Unknown table: ${table}`);
  if (!plain(row)) throw new TypeError("A row must be a plain object");
  const keys = table === "order_items" ? [row.order_id, row.line_no] : [row.id];
  if (!keys.every((value) => integer(value, 1)))
    throw new RangeError("Row identifiers must be positive safe integers");
  return `${table}:${keys.join(":")}`;
}

// This validates this book's bounded data contract, not SQL syntax or a general
// SQL type system. Positive integer ids are our fixture convention, not an
// implication of PostgreSQL PRIMARY KEY. Only order_items.qty NOT NULL is
// switchable for the NULL experiment.
export function validateFixture(fixture, options = {}) {
  if (!plain(options)) throw new TypeError("Validation options must be a plain object");
  const { notNull = true } = options;
  if (typeof notNull !== "boolean") throw new TypeError("notNull must be boolean");
  const violations = [];
  const report = (code, key, column, message) =>
    violations.push({ code, rowKey: key, column, message });
  if (!plain(fixture)) {
    report("shape", "fixture", null, "Fixture must be a plain object");
    return { valid: false, violations };
  }
  const tables = Object.keys(TABLE_COLUMNS);
  if (Object.keys(fixture).some((table) => !tables.includes(table)))
    report("shape", "fixture", null, "Fixture must contain only the four known tables");
  for (const table of tables) {
    if (!Array.isArray(fixture[table])) {
      report("shape", table, null, "Table must be an array");
      continue;
    }
    const usedKeys = new Set();
    for (const [index, row] of fixture[table].entries()) {
      const fallback = `${table}:row-${index}`;
      if (!plain(row) ||
          Object.keys(row).length !== TABLE_COLUMNS[table].length ||
          !TABLE_COLUMNS[table].every((column) => own(row, column))) {
        report("shape", fallback, null, "Row must have exactly the declared columns");
        continue;
      }
      let key = fallback;
      try {
        key = rowKey(table, row);
        if (usedKeys.has(key)) report("primary-key", key, null, "Primary key is duplicated");
        usedKeys.add(key);
      } catch {
        report("primary-key", key, null, "Primary key must contain positive integer identifiers");
      }
      const number = (column, minimum) => {
        if (!integer(row[column], minimum))
          report("integer-range", key, column, `Expected a safe integer >= ${minimum}`);
      };
      const text = (column) => {
        if (typeof row[column] !== "string")
          report("not-null", key, column, "Expected non-null text");
      };
      if (table === "customers") text("display_name");
      if (table === "products") {
        text("name");
        number("unit_price_won", 0);
        number("available_qty", 0);
      }
      if (table === "orders") {
        number("customer_id", 1);
        text("request_key");
        if (!["confirmed", "cancelled"].includes(row.status))
          report("check", key, "status", "Status must be confirmed or cancelled");
        if (typeof row.created_at !== "string" ||
            !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(row.created_at) ||
            !Number.isFinite(Date.parse(row.created_at)) ||
            new Date(row.created_at).toISOString().replace(".000Z", "Z") !== row.created_at)
          report("timestamp", key, "created_at", "Expected a valid, explicit UTC timestamp");
      }
      if (table === "order_items") {
        number("product_id", 1);
        number("unit_price_won", 0);
        if (row.qty === null) {
          if (notNull) report("not-null", key, "qty", "qty cannot be NULL");
        } else number("qty", 1);
      }
    }
  }
  // Do not traverse malformed table shapes. Every reported constraint refers to
  // actual row identifiers when they are available.
  if (tables.every((table) => Array.isArray(fixture[table]))) {
    const customerIds = new Set(fixture.customers.filter(plain).map((row) => row.id));
    const orderIds = new Set(fixture.orders.filter(plain).map((row) => row.id));
    const productIds = new Set(fixture.products.filter(plain).map((row) => row.id));
    const requestKeys = new Set();
    for (const row of fixture.orders.filter(plain)) {
      if (!integer(row.id, 1)) continue;
      const key = rowKey("orders", row);
      if (!customerIds.has(row.customer_id))
        report("foreign-key", key, "customer_id", "Referenced customer does not exist");
      if (typeof row.request_key === "string") {
        if (requestKeys.has(row.request_key))
          report("unique", key, "request_key", "Request key is duplicated");
        requestKeys.add(row.request_key);
      }
    }
    for (const row of fixture.order_items.filter(plain)) {
      if (!integer(row.order_id, 1) || !integer(row.line_no, 1)) continue;
      const key = rowKey("order_items", row);
      if (!orderIds.has(row.order_id))
        report("foreign-key", key, "order_id", "Referenced order does not exist");
      if (!productIds.has(row.product_id))
        report("foreign-key", key, "product_id", "Referenced product does not exist");
    }
  }
  return { valid: violations.length === 0, violations };
}

export function assertFixture(fixture, options) {
  const result = validateFixture(fixture, options);
  if (!result.valid) {
    const first = result.violations[0];
    throw new RangeError(`${first.rowKey}: ${first.message}`);
  }
  return fixture;
}

export function cloneFixture(fixture = CANONICAL_FIXTURE, options) {
  assertFixture(fixture, options);
  return Object.fromEntries(
    Object.keys(TABLE_COLUMNS).map((table) => [table, fixture[table].map((row) => ({ ...row }))]),
  );
}

export function createFixture(name = "canonical") {
  if (!["canonical", "last-item", "same-name"].includes(name))
    throw new RangeError(`Unknown fixture: ${name}`);
  const fixture = cloneFixture();
  if (name === "last-item") fixture.products.find((row) => row.id === 101).available_qty = 1;
  if (name === "same-name") fixture.customers.find((row) => row.id === 2).display_name = "가람";
  return fixture;
}

export function renameCustomer(fixture, id, displayName) {
  if (!integer(id, 1)) throw new RangeError("Customer id must be a positive safe integer");
  if (typeof displayName !== "string") throw new TypeError("displayName must be non-null text");
  const next = cloneFixture(fixture, { notNull: false });
  const customer = next.customers.find((row) => row.id === id);
  if (!customer) throw new RangeError(`Unknown customer: ${id}`);
  customer.display_name = displayName;
  return next;
}

function checkedAdd(left, right) {
  const value = left + right;
  if (!integer(value)) throw new RangeError("Summary exceeds the safe integer range");
  return value;
}

export function summarizeCustomer(fixture = CANONICAL_FIXTURE, customerId = 1) {
  assertFixture(fixture);
  if (!integer(customerId, 1)) throw new RangeError("Customer id must be a positive safe integer");
  const orders = fixture.orders
    .filter((row) => row.customer_id === customerId && row.status === "confirmed")
    .sort((left, right) => left.id - right.id);
  const orderIds = orders.map((row) => row.id);
  const items = fixture.order_items.filter((row) => orderIds.includes(row.order_id));
  let totalQty = 0;
  let totalWon = 0;
  for (const item of items) {
    const amount = item.qty * item.unit_price_won;
    if (!integer(amount)) throw new RangeError("Line amount exceeds the safe integer range");
    totalQty = checkedAdd(totalQty, item.qty);
    totalWon = checkedAdd(totalWon, amount);
  }
  // A business summary with explicit zero defaults, not SQL SUM(empty) semantics.
  return { orderCount: orders.length, itemCount: items.length, totalQty, totalWon, orderIds };
}

export function fixtureRelations(fixture = CANONICAL_FIXTURE) {
  assertFixture(fixture, { notNull: false });
  const edges = [];
  const add = (table, row, column, targetTable) => {
    const fromKey = rowKey(table, row);
    const value = row[column];
    edges.push({
      id: `${fromKey}.${column}->${targetTable}:${value}.id`,
      from: { table, rowKey: fromKey, column, value },
      to: { table: targetTable, rowKey: `${targetTable}:${value}`, column: "id", value },
      exists: true,
    });
  };
  for (const row of fixture.orders) add("orders", row, "customer_id", "customers");
  for (const row of fixture.order_items) {
    add("order_items", row, "order_id", "orders");
    add("order_items", row, "product_id", "products");
  }
  return edges;
}

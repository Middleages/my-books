import {
  createFixture, cloneFixture, renameCustomer, fixtureRelations,
  rowKey, validateFixture,
} from "./fixture.mjs";

const choose = (value, choices, name) => {
  if (!choices.includes(value)) throw new RangeError(`Unknown ${name}: ${value}`);
  return value;
};
const boolean = (value, name) => {
  if (typeof value !== "boolean") throw new TypeError(`${name} must be boolean`);
};
const optionsObject = (value) => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new TypeError("Scenario options must be an object");
};
const copy = (value) => structuredClone(value);

export const FILE_MODES = Object.freeze(["sequential", "race", "file-lock", "database"]);
export const CONSTRAINT_SCENARIOS = Object.freeze([
  "normal", "duplicate-pk", "missing-fk", "zero-qty", "null-qty",
  "duplicate-name", "empty-order",
]);

const protections = {
  sequential: "요청이 겹치지 않는 가정. 일반적인 동시 쓰기 보호는 없습니다.",
  race: "읽기와 쓰기 사이에 다른 요청이 들어올 수 있고, 낡은 사본 쓰기를 검사하지 않습니다.",
  "file-lock": "모든 writer가 같은 파일 잠금을 지키며 읽기·확인·쓰기·주문 확정 동안 잠금을 유지합니다.",
  database: "같은 트랜잭션에서 재고의 조건부 감소와 주문 저장을 수행하고, 갱신된 행 수가 1인지 확인합니다.",
};

/**
 * Two fixed requests, each reserving one item. The schedule is an explanatory
 * observation, not an OS file protocol or a PostgreSQL transaction emulator.
 * "write" means a prepared local write. Publication and order confirmation are
 * shown at one completed-request boundary; partial I/O/crashes are out of scope.
 */
export function fileWriteFrames(options = {}) {
  optionsObject(options);
  const { mode = "race", first = "A" } = options;
  choose(mode, FILE_MODES, "file mode");
  choose(first, ["A", "B"], "first app");
  const second = first === "A" ? "B" : "A";
  const initialQty = createFixture("last-item").products.find((row) => row.id === 101).available_qty;
  const localCopies = ["A", "B"].map((app) => ({
    app, sourceRevision: null, readQty: null, writeQty: null, status: "pending",
  }));
  let availableQty = initialQty;
  let sourceRevision = 0;
  let lockOwner = null;
  const committedOrders = [];
  const revisionHistory = [{ revision: 0, availableQty, writer: null, sourceRevision: null }];
  const events = [];
  const frames = [];
  const lane = (app) => localCopies.find((entry) => entry.app === app);
  const protectedMode = mode === "file-lock" || mode === "database";
  const assumptions = [
    "가상 상품 101의 last-item 변형: 시작 가용 재고 1개, 요청 A/B는 각각 1개입니다.",
    "과거 주문은 다시 차감하지 않으며 여기의 주문 확정은 재고 예약 약속이지 결제가 아닙니다.",
    "한 프레임은 교육용 관찰 단계입니다. 파일의 개별 I/O·장애·복구 또는 DB 내부 스케줄을 재현하지 않습니다.",
    "write 상태는 쓰기 준비입니다. 공유 재고 게시와 주문 확정은 요청 완료 경계에서 함께 관찰합니다.",
    protections[mode],
  ];
  const push = (title, detail, activeApp = null, additions = []) => {
    const step = frames.length;
    for (const [from, to, kind] of additions)
      events.push({ id: `event:${events.length}`, from, to, kind, step });
    const confirmedQty = committedOrders.reduce((sum, order) => sum + order.qty, 0);
    const expectedQty = initialQty - confirmedQty;
    frames.push(copy({
      scenarioId: `file:${mode}:${first}`,
      step, observationKind: "educational-schedule", title, detail, assumptions,
      mode, first, initialQty, availableQty, sourceRevision, localCopies,
      committedOrders, revisionHistory, lockOwner, activeApp,
      edges: events.map((event) => ({ ...event, active: event.step === step })),
      protection: protections[mode],
      invariant: { expectedQty, actualQty: availableQty, holds: expectedQty === availableQty },
      measurements: {
        initialQty: { value: initialQty, unit: "개" },
        availableQty: { value: availableQty, unit: "개" },
        confirmedQty: { value: confirmedQty, unit: "개" },
        committedOrderCount: { value: committedOrders.length, unit: "건" },
        overCommittedQty: { value: Math.max(0, confirmedQty - initialQty), unit: "개" },
      },
      finished: false,
    }));
  };
  const acquire = (app, waiting = null) => {
    lockOwner = app;
    if (waiting) lane(waiting).status = "waiting";
    lane(app).status = "pending";
    push(
      `${app}가 보호 구간에 진입`,
      mode === "file-lock"
        ? `같은 파일 잠금은 읽기부터 주문 확정까지 유지합니다.${waiting ? ` ${waiting}는 잠금 밖에서 기다립니다.` : ""}`
        : `재고 행 변경과 주문 저장을 한 트랜잭션으로 묶습니다.${waiting ? ` ${waiting}의 같은 재고 변경은 기다립니다.` : ""}`,
      app, [[`app:${app}`, "store", "acquire"]],
    );
  };
  const read = (app) => {
    const current = lane(app);
    current.sourceRevision = sourceRevision;
    current.readQty = availableQty;
    current.status = "copy";
    push(
      `${app}: revision ${sourceRevision}의 ${availableQty}개를 읽음`,
      `공유 저장소의 현재 값이 ${app}의 관찰 사본으로 복사됩니다. 이후 공유 값이 바뀌어도 이 사본은 저절로 갱신되지 않습니다.`,
      app, [["store", `copy:${app}`, "read"]],
    );
  };
  const prepare = (app) => {
    const current = lane(app);
    current.writeQty = current.readQty - 1;
    current.status = "write";
    push(
      `${app}: 사본에서 ${current.readQty} → ${current.writeQty} 준비`,
      `아직 공유 저장소에는 쓰지 않았습니다. ${app}는 읽은 재고가 1 이상이라는 조건으로 1개 감소를 준비했습니다.`,
      app, [[`app:${app}`, `copy:${app}`, "prepare"]],
    );
  };
  const publish = (app) => {
    const current = lane(app);
    const stale = current.sourceRevision !== sourceRevision;
    availableQty = current.writeQty;
    sourceRevision += 1;
    committedOrders.push({ id: `new-order-${app}`, app, qty: 1 });
    revisionHistory.push({
      revision: sourceRevision, availableQty, writer: app,
      sourceRevision: current.sourceRevision,
    });
    current.status = "confirmed";
    lockOwner = null;
    push(
      `${app}: ${availableQty}개를 저장하고 주문 1건 확정`,
      stale
        ? `revision ${current.sourceRevision}에서 만든 낡은 0이 최신 저장소를 다시 덮었습니다. 남은 재고는 음수가 아니지만 시작 1개에 새 주문 2건을 약속했습니다.`
        : `요청 완료 경계입니다. 시작 1개 중 1개를 새 주문에 예약했고 남은 재고는 0개입니다.${protectedMode ? " 보호 구간을 나옵니다." : ""}`,
      app, [[`copy:${app}`, "store", "write"], ["store", "orders", "confirm"]],
    );
  };
  const reject = (app) => {
    lane(app).status = "rejected";
    lockOwner = null;
    push(
      `${app}: 0개를 확인했으므로 새 주문을 확정하지 않음`,
      mode === "database"
        ? "재고가 1 이상인 행만 감소시키는 조건을 만족하지 않습니다. 갱신된 행 수 0을 확인하고 주문을 저장하지 않습니다. DB 도입 자체가 아니라 이 보호 조건이 결과를 만듭니다."
        : "최신 재고를 읽으니 더 예약할 수 없습니다. 공유 저장소를 다시 쓰거나 새 주문을 확정하지 않습니다.",
      app, [["store", `app:${app}`, "reject"]],
    );
  };

  push("두 요청, 공유 재고는 1개", "A와 B는 같은 상품을 1개씩 원합니다. 두 사본은 아직 비어 있습니다.");
  if (mode === "race") {
    read(first);
    read(second);
    prepare(first);
    prepare(second);
    publish(first);
    publish(second);
  } else {
    if (protectedMode) acquire(first, second);
    read(first);
    prepare(first);
    publish(first);
    if (protectedMode) acquire(second);
    read(second);
    reject(second);
  }
  frames.at(-1).finished = true;
  return frames;
}

function makeCandidate(scenario) {
  if (scenario === "duplicate-name")
    return { table: "customers", row: { id: 4, display_name: "가람" } };
  if (scenario === "empty-order")
    return {
      table: "orders",
      row: {
        id: 1004, customer_id: 3, request_key: "key-1004",
        status: "confirmed", created_at: "2026-01-12T01:00:00Z",
      },
    };
  const row = { order_id: 1002, line_no: 2, product_id: 103, qty: 1, unit_price_won: 9000 };
  if (scenario === "duplicate-pk") { row.order_id = 1001; row.line_no = 1; }
  if (scenario === "missing-fk") row.product_id = 999;
  if (scenario === "zero-qty") row.qty = 0;
  if (scenario === "null-qty") row.qty = null;
  return { table: "order_items", row };
}

function candidateRelations(candidate, fixture) {
  const targets = candidate.table === "orders"
    ? [["customer_id", "customers"]]
    : candidate.table === "order_items"
      ? [["order_id", "orders"], ["product_id", "products"]] : [];
  return targets.map(([column, targetTable]) => {
    const value = candidate.row[column];
    return {
      id: `${candidate.nodeKey}.${column}->${targetTable}:${value}.id`,
      from: { table: candidate.table, rowKey: candidate.nodeKey, column, value },
      to: { table: targetTable, rowKey: `${targetTable}:${value}`, column: "id", value },
      exists: fixture[targetTable].some((row) => row.id === value),
    };
  });
}

function candidateChecks(candidate, fixture, notNull) {
  const { table, row } = candidate;
  const check = (id, label, result) => ({ id, label, result });
  const checks = [
    check("primary-key", table === "order_items" ? "PK (order_id, line_no) 조합" : "PK id",
      fixture[table].some((stored) => rowKey(table, stored) === candidate.rowKey) ? "fail" : "pass"),
  ];
  if (table === "customers") {
    checks.push(check("name-not-null", "display_name NOT NULL", "pass"));
    checks.push(check("name-not-unique", "이름에는 UNIQUE가 없음", "disabled"));
  }
  if (table === "orders") {
    checks.push(check("customer-foreign-key", "customer_id FK", fixture.customers.some((r) => r.id === row.customer_id) ? "pass" : "fail"));
    checks.push(check("request-key-unique", "request_key UNIQUE", fixture.orders.some((r) => r.request_key === row.request_key) ? "fail" : "pass"));
    checks.push(check("request-key-not-null", "request_key NOT NULL", "pass"));
    checks.push(check("status-check", "status CHECK", "pass"));
  }
  if (table === "order_items") {
    checks.push(check("order-foreign-key", "order_id FK", fixture.orders.some((r) => r.id === row.order_id) ? "pass" : "fail"));
    checks.push(check("product-foreign-key", "product_id FK", fixture.products.some((r) => r.id === row.product_id) ? "pass" : "fail"));
    checks.push(check("qty-not-null", "qty NOT NULL", notNull ? (row.qty === null ? "fail" : "pass") : "disabled"));
    checks.push(check("qty-positive", "CHECK (qty > 0)", row.qty === null ? "unknown" : row.qty > 0 ? "pass" : "fail"));
    checks.push(check("unit-price", "단가 NOT NULL · CHECK (단가 >= 0)", "pass"));
  }
  return checks;
}

/**
 * One bounded insert plus an optional rename. Checks are displayed together:
 * their display order is not PostgreSQL's internal execution order.
 */
export function constraintFrames(options = {}) {
  optionsObject(options);
  const { scenario = "normal", notNull = true, rename = false, sameNames = false } = options;
  choose(scenario, CONSTRAINT_SCENARIOS, "constraint scenario");
  boolean(notNull, "notNull");
  boolean(rename, "rename");
  boolean(sameNames, "sameNames");
  let fixture = createFixture(sameNames ? "same-name" : "canonical");
  const initialCandidate = makeCandidate(scenario);
  const candidateKey = rowKey(initialCandidate.table, initialCandidate.row);
  const candidate = {
    ...initialCandidate, rowKey: candidateKey, nodeKey: `candidate:${candidateKey}`, status: "pending",
  };
  const checks = candidateChecks(candidate, fixture, notNull);
  const violations = checks.filter((check) => check.result === "fail").map((check) => check.id);
  const accepted = violations.length === 0;
  const assumptions = [
    "기준 네 표의 실제 키 값을 연결합니다. 후보 행은 검사 전 영역에 있고, 성공한 뒤에만 저장된 표에 들어갑니다.",
    "검사 표시 순서는 설명용이며 PostgreSQL 내부의 제약 검사 실행 순서를 재현하지 않습니다.",
    "독립적인 제약 검사 예입니다. 재고 예약·결제·전체 주문 생성 업무를 실행하지 않습니다.",
    notNull
      ? "기본 스키마에서 주문 항목 qty에는 NOT NULL과 CHECK (qty > 0)를 함께 둡니다."
      : "가상 스키마 변경: order_items.qty의 NOT NULL만 제거합니다. CHECK는 FALSE를 거절하지만 UNKNOWN은 허용합니다.",
  ];
  const frames = [];
  const push = (title, detail, phase, visibleChecks, result) => {
    const validation = validateFixture(fixture, { notNull });
    if (!validation.valid) throw new Error("A constraint frame cannot commit an invalid fixture");
    const edges = fixtureRelations(fixture);
    frames.push(copy({
      scenarioId: `constraints:${scenario}:${notNull ? "not-null" : "nullable"}:${sameNames ? "same-names" : "names"}:${rename ? "rename" : "keep"}`,
      step: frames.length, observationKind: "constraint-observation",
      title, detail, assumptions, scenario, notNull, rename, sameNames,
      phase, fixture, candidate, checks: visibleChecks, accepted: result,
      violations: visibleChecks.filter((check) => check.result === "fail").map((check) => check.id),
      edges, candidateEdges: candidate.status === "accepted" ? [] : candidateRelations(candidate, fixture),
      selectedRowKeys: [
        candidate.status === "accepted" ? candidate.rowKey : candidate.nodeKey,
        ...candidateRelations(candidate, fixture).filter((edge) => edge.exists).map((edge) => edge.to.rowKey),
        ...(phase === "rename" ? ["customers:1"] : []),
      ],
      measurements: {
        customerRows: { value: fixture.customers.length, unit: "행" },
        productRows: { value: fixture.products.length, unit: "행" },
        orderRows: { value: fixture.orders.length, unit: "행" },
        itemRows: { value: fixture.order_items.length, unit: "행" },
        foreignKeyLinks: { value: edges.length, unit: "개" },
      },
      invariant: { committedFixtureValid: validation.valid, allForeignKeysExist: edges.every((edge) => edge.exists) },
      businessWarnings: fixture.orders
        .filter((order) => order.status === "confirmed" && !fixture.order_items.some((item) => item.order_id === order.id))
        .map((order) => `확정 주문 ${order.id}에 항목이 없습니다. FK만으로 '주문마다 항목이 있어야 함'을 보장하지 않습니다.`),
      finished: false,
    }));
  };
  push("저장된 네 표와 검사 전 후보", "선은 이름이 아니라 실제 PK와 FK 값의 일치를 나타냅니다. 후보는 아직 저장되지 않았습니다.", "candidate", [], null);
  candidate.status = "checking";
  push("후보의 키·존재·값 조건 관찰", "모든 검사 결과를 함께 비교합니다. 하나라도 FALSE로 위반되면 후보를 저장하지 않습니다. CHECK의 UNKNOWN과 NOT NULL 실패는 다릅니다.", "checking", checks, null);
  if (accepted) {
    fixture = cloneFixture(fixture, { notNull });
    fixture[candidate.table].push({ ...candidate.row });
    candidate.status = "accepted";
  } else candidate.status = "rejected";
  const detail = !accepted
    ? "실패한 조건이 있으므로 후보는 저장 영역 밖에 남습니다. 기존 행과 참조선은 바뀌지 않습니다."
    : scenario === "null-qty"
      ? "qty > 0은 NULL에서 UNKNOWN입니다. NOT NULL을 제거했으므로 이 후보는 들어갑니다. 양수 수량이 확인됐다는 뜻은 아닙니다."
      : scenario === "duplicate-name"
        ? "가람이라는 이름은 이미 있지만 id 4는 다릅니다. 이름에는 UNIQUE를 두지 않았으므로 다른 고객 행을 저장할 수 있습니다."
        : scenario === "empty-order"
          ? "고객 FK가 존재하므로 주문 행은 저장됩니다. FK는 주문에 항목이 하나 이상 있어야 한다는 역방향 업무 규칙을 강제하지 않습니다."
          : "모든 적용 제약을 만족하여 후보를 저장합니다. 관계선의 출발점도 후보 영역에서 저장된 행으로 옮겨집니다.";
  push(accepted ? "후보 저장 성공" : "후보 저장 거절", detail, "result", checks, accepted);
  if (rename) {
    fixture = renameCustomer(fixture, 1, "가람(새 이름)");
    push("이름을 바꾸어도 고객 id 1은 그대로", "가람을 가람(새 이름)으로 바꿨습니다. 주문의 customer_id와 연결선 끝점은 그대로입니다.", "rename", checks, accepted);
  }
  frames.at(-1).finished = true;
  return frames;
}

import { assertFixture, cloneFixture, createFixture, rowKey } from "./fixture.mjs";

// Fixed educational schedules. No query, connection, server or timer runs here.
// Semantics: PostgreSQL 18 transaction-iso.html and explicit-locking.html.
const freeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const optionsObject = (value, allowed) => {
  if (value === null || typeof value !== "object" || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value)))
    throw new TypeError("Concurrency options must be a plain object");
  if (Reflect.ownKeys(value).some((key) => !allowed.includes(key)))
    throw new RangeError("Unknown concurrency option");
};
const choose = (value, choices, name) => {
  if (!choices.includes(value)) throw new RangeError(`Unknown ${name}: ${String(value)}`);
};
export const CONCURRENCY_STRATEGIES = freeze(["unsafe-absolute", "conditional-update", "select-for-update"]);
export const FIRST_OUTCOMES = freeze(["commit", "rollback"]);
export const SNAPSHOT_ISOLATIONS = freeze(["read-committed", "repeatable-read"]);
export const DEADLOCK_ORDERS = freeze(["opposite", "consistent"]);
export const CONCURRENCY_ASSUMPTIONS = freeze([
  "PostgreSQL 18 문서 의미를 설명하는 고정 교육 schedule입니다. 실제 SQL·DB·서버를 실행하지 않았습니다.",
  "단계 축은 관찰 순서이지 측정한 밀리초나 실제 병렬 스케줄러의 예측이 아닙니다.",
  "일반 SELECT는 여기 그린 충돌 행 잠금에 막히지 않습니다. 아무 잠금도 잡지 않는다는 뜻은 아닙니다.",
  "같은 transaction의 모든 문장은 같은 세션·연결에서 진행합니다. 대기 중인 연결은 다음 주문 INSERT를 실행하지 않습니다.",
  "재개된 문장은 같은 문장 ID를 유지하고 대상의 현재 버전을 재확인합니다. 전체 statement snapshot을 새로 만든다는 뜻이 아닙니다.",
  "고정 주문 번호1004·1005는 시나리오 식별자입니다. 이 그림은 sequence 호출이나 자동 ID 할당을 모델링하지 않습니다.",
  "시작 재고에는 기존 주문이 반영되어 있습니다. 새 주문 항목만 재고 감소와 비교합니다. 행에는 잠금·버전 메타데이터를 추가하지 않습니다.",
]);
const resources = [{ id: "resource:products:101", rowKey: "products:101", productId: 101 }];
const stockSql = "SELECT available_qty FROM products WHERE id = 101;";
const lockingSql = "SELECT available_qty FROM products WHERE id = 101 FOR UPDATE;";
const conditionalSql = "UPDATE products SET available_qty = available_qty - 1 WHERE id = 101 AND available_qty >= 1;";
const absoluteSql = "UPDATE products SET available_qty = 0 WHERE id = 101;";
const product = (fixture) => fixture.products.find((row) => row.id === 101);
const session = (who) => `session:${who}`;
const txId = (prefix, who) => `tx:${prefix}:${who}`;
const newHeader = (id) => ({ id, customer_id: 1, request_key: `key-${id}`,
  status: "confirmed", created_at: "2026-01-12T01:00:00Z" });
const newItem = (id, qty) => ({ order_id: id, line_no: 1, product_id: 101, qty, unit_price_won: 12000 });
const headerSql = (id) => `INSERT INTO orders (id, customer_id, request_key, status, created_at)\nVALUES (${id}, 1, 'key-${id}', 'confirmed', '2026-01-12T01:00:00Z');`;
const itemSql = (id, qty) => `INSERT INTO order_items (order_id, line_no, product_id, qty, unit_price_won)\nVALUES (${id}, 1, 101, ${qty}, 12000);`;
function apply(fixture, changes) {
  const result = cloneFixture(fixture);
  for (const change of changes) {
    const rows = result[change.table];
    const index = rows.findIndex((row) => rowKey(change.table, row) === change.rowKey);
    if (index === -1) rows.push({ ...change.row }); else rows[index] = { ...change.row };
  }
  return assertFixture(result);
}
function measure(fixture, requests, initialStock, orderIds) {
  const items = fixture.order_items.filter((row) => orderIds.includes(row.order_id));
  if (items.some((row) => row.qty === null)) throw new RangeError("Reservation quantities must not be NULL");
  return { initialStock, availableQty: product(fixture).available_qty,
    newOrderCount: fixture.orders.filter((row) => orderIds.includes(row.id)).length,
    newItemQty: items.reduce((sum, row) => sum + row.qty, 0),
    fulfilledRequests: requests.filter((request) => request.status === "fulfilled").length };
}
// Small bookkeeping shared only by the three predeclared scenes below. It does
// not accept commands, parse SQL, or decide a schedule from arbitrary input.
function reservationScene(prefix, fixtureName, orderIds, scenarioId, extra, assumptions = CONCURRENCY_ASSUMPTIONS) {
  let committedFixture = createFixture(fixtureName);
  const initialStock = product(committedFixture).available_qty;
  const head = `version:${prefix}:stock:v0`;
  const state = { activeChanges: [], discardedChanges: [], versions: [{ id: head, table: "products",
    rowKey: "products:101", row: { ...product(committedFixture) }, createdByTxId: null,
    createdAtStep: 0, predecessorId: null, state: "committed" }], committedVersionIds: [head], currentHeadVersionId: head,
    events: [], statements: [], transactions: [], requests: [], readObservations: [], snapshots: [] };
  const frames = [];
  const transaction = (who) => state.transactions.find((entry) => entry.id === txId(prefix, who));
  const addTransaction = (who) => state.transactions.push({ id: txId(prefix, who), sessionId: session(who), blockStatus: "in-transaction", outcome: "active" });
  const emit = (phase, title, detail, eventData = {}, finished = false) => {
    assertFixture(committedFixture);
    for (const transaction of state.transactions) apply(committedFixture, state.activeChanges.filter((change) => change.txId === transaction.id));
    const measured = measure(committedFixture, state.requests, initialStock, orderIds);
    const balanced = measured.availableQty + measured.newItemQty === initialStock;
    const complete = balanced && measured.newOrderCount === state.requests.filter((request) => request.status === "fulfilled").length;
    const event = { id: `event:${prefix}:${frames.length}`, atStep: frames.length, kind: phase,
      sessionId: null, txId: null, statementId: null, sql: null, title, detail, ...eventData };
    state.events.push(event);
    const verdict = !finished ? "pending" : !balanced ? "oversold" : state.requests.some((request) => request.status === "rejected") ? "safe-rejection" : "fulfilled";
    frames.push(freeze(structuredClone({ scenarioId, step: frames.length, phase, title, detail, assumptions,
      event, ...state, committedFixture, currentVersionIds: [...state.committedVersionIds, ...state.activeChanges.map((change) => change.versionId)],
      measurements: measured, invariants: { schemaValid: true, stockNonnegative: measured.availableQty >= 0,
        reservationBalance: balanced, terminalBusinessValid: finished ? complete : null, verdict }, ...extra, finished })));
  };
  const statement = (who, id, kind, sql, result = {}) => {
    const fullId = `statement:${prefix}:${who}:${id}`;
    const old = state.statements.find((entry) => entry.id === fullId);
    const record = { id: fullId, sessionId: session(who), txId: txId(prefix, who), kind, sql,
      status: "succeeded", affectedRows: null, returnedCount: null, errorCode: null, implicitCommit: false,
      targetAtStartVersionId: null, recheckedVersionId: null, ...old, ...result };
    if (old) state.statements[state.statements.indexOf(old)] = record; else state.statements.push(record);
    return { sessionId: record.sessionId, txId: record.txId, statementId: record.id, sql };
  };
  const snapshot = (who, id, statementId, versionIds = [state.currentHeadVersionId], scope = "statement") => {
    const snapshotId = `snapshot:${prefix}:${who}:${id}`;
    if (!state.snapshots.some((entry) => entry.id === snapshotId)) state.snapshots.push({ id: snapshotId,
      sessionId: session(who), txId: txId(prefix, who), establishedAtStep: frames.length, statementId, versionIds: [...versionIds], scope });
    return snapshotId;
  };
  const observe = (who, id, event, versionId, snapshotId) => {
    const version = state.versions.find((entry) => entry.id === versionId);
    const viewFixture = cloneFixture(committedFixture);
    viewFixture.products[viewFixture.products.findIndex((row) => row.id === 101)] = { ...version.row };
    state.readObservations.push({ id: `read:${prefix}:${who}:${id}`, atStep: frames.length, sessionId: session(who),
      txId: txId(prefix, who), statementId: event.statementId, snapshotId, status: "succeeded", versionIds: [versionId],
      rows: [{ rowKey: version.rowKey, versionId, row: version.row }],
      view: measure(viewFixture, state.requests, initialStock, orderIds), errorCode: null });
  };
  const read = (who, id, title, versionId = state.currentHeadVersionId, snapshotId = null) => {
    const event = statement(who, id, "select", stockSql, { returnedCount: 1 });
    snapshotId ??= snapshot(who, id, event.statementId, [versionId]);
    observe(who, id, event, versionId, snapshotId);
    emit(`${who}-${id}`, title, "관측 시점과 반환 버전을 연결합니다. 일반 SELECT는 여기 그린 행 잠금에 대기하지 않습니다.", event);
  };
  const change = (who, id, table, row, event, beforeVersionId = null) => {
    const versionId = `version:${prefix}:${who}:${id}`;
    const record = { id: `change:${prefix}:${who}:${id}`, txId: txId(prefix, who), statementId: event.statementId,
      table, rowKey: rowKey(table, row), versionId, beforeVersionId, row: { ...row } };
    state.activeChanges.push(record);
    state.versions.push({ id: versionId, table, rowKey: record.rowKey, row: { ...row }, createdByTxId: record.txId,
      createdAtStep: frames.length, predecessorId: beforeVersionId, state: "active" });
  };
  const finishTransaction = (who, outcome) => {
    const changes = state.activeChanges.filter((change) => change.txId === txId(prefix, who));
    if (outcome === "commit") {
      committedFixture = apply(committedFixture, changes);
      for (const change of changes) {
        const old = state.committedVersionIds.find((id) => state.versions.find((version) => version.id === id).rowKey === change.rowKey);
        if (old) {
          state.versions.find((version) => version.id === old).state = "superseded";
          state.committedVersionIds = state.committedVersionIds.filter((id) => id !== old);
        }
        state.versions.find((version) => version.id === change.versionId).state = "committed";
        state.committedVersionIds.push(change.versionId);
        if (change.rowKey === "products:101") state.currentHeadVersionId = change.versionId;
      }
    } else for (const change of changes) {
      state.discardedChanges.push({ ...change, discardedAtStep: frames.length, reason: `${who} ROLLBACK` });
      state.versions.find((version) => version.id === change.versionId).state = "discarded";
    }
    state.activeChanges = state.activeChanges.filter((change) => change.txId !== txId(prefix, who));
    transaction(who).outcome = outcome === "commit" ? "committed" : "rolled-back";
    transaction(who).blockStatus = "idle";
  };
  const insertOrder = (who, id, qty) => {
    let event = statement(who, "header", "insert", headerSql(id), { affectedRows: 1 });
    change(who, "header", "orders", newHeader(id), event);
    emit(`${who}-header`, `${who}: 주문${id} 헤더`, "유효한 헤더는 아직 같은 transaction의 미확정 변경입니다.", event);
    event = statement(who, "item", "insert", itemSql(id, qty), { affectedRows: 1 });
    change(who, "item", "order_items", newItem(id, qty), event);
    emit(`${who}-item`, `${who}: 항목${qty}개 연결`, "재고·헤더·항목은 같은 transaction에서 확정하거나 취소합니다.", event);
  };
  return { state, frames, emit, statement, snapshot, observe, read, change, finishTransaction, insertOrder, addTransaction,
    transaction, getFixture: () => committedFixture };
}

export function concurrencyFrames(options = {}) {
  optionsObject(options, ["strategy", "firstOutcome"]);
  const { strategy = "unsafe-absolute", firstOutcome = "commit" } = options;
  choose(strategy, CONCURRENCY_STRATEGIES, "strategy"); choose(firstOutcome, FIRST_OUTCOMES, "first outcome");
  const locking = strategy === "select-for-update";
  const extra = { observationKind: "last-item-schedule", strategy, firstOutcome, resources, ownershipEdges: [], waitEdges: [] };
  const model = reservationScene("06", "last-item", [1004, 1005], `concurrency:${strategy}:${firstOutcome}`, extra);
  const { state, frames, emit, statement, snapshot, observe, read, change, finishTransaction, insertOrder, addTransaction } = model;
  state.requests.push(...["A", "B"].map((who, index) => ({ id: `request:06:${who}`, sessionId: session(who), orderId: 1004 + index, qty: 1, status: "pending" })));
  const own = (who) => { extra.ownershipEdges = [{ id: `ownership:06:${who}:101`, from: resources[0].id,
    to: txId("06", who), resourceId: resources[0].id, txId: txId("06", who), mode: locking ? "select-for-update" : "conflicting-row-update" }]; };
  const release = () => { extra.ownershipEdges = []; };
  const update = (who, id, resumed = false) => {
    const before = state.currentHeadVersionId;
    const sql = strategy === "unsafe-absolute" ? absoluteSql : conditionalSql;
    const event = statement(who, id, "update", sql, { status: "succeeded", affectedRows: 1,
      targetAtStartVersionId: resumed ? "version:06:stock:v0" : before, recheckedVersionId: resumed ? before : null });
    own(who);
    change(who, "stock", "products", { ...product(model.getFixture()), available_qty: 0 }, event, before);
    emit(`${who}-${resumed ? "resume" : "update"}`, `${who}: UPDATE 1행, 재고0 버전`, resumed ?
      "같은 대기 문장이 현재 대상 버전을 재확인했습니다. 값0이 같아도 A와 B의 버전 ID는 다릅니다." :
      "행을 바꾸고 충돌하는 행 잠금을 보유합니다. 아직 다른 세션의 확정 보기는 바뀌지 않습니다.", event);
  };
  emit("initial", "마지막 한 개, 요청은 두 개", "A와 B는 각1개를 원합니다. CHECK(재고>=0)만으로 초과판매를 막을 수 있는지 비교합니다.");
  for (const who of ["A", "B"]) {
    addTransaction(who);
    emit(`${who}-begin`, `${who}: BEGIN`, "각 세션은 자신의 연결과 transaction을 유지합니다.", statement(who, "begin", "begin", "BEGIN ISOLATION LEVEL READ COMMITTED;"));
  }
  read("A", "old-read", "A의 일반 SELECT: 재고1");
  read("B", "old-read", "B도 일반 SELECT: 재고1");
  if (locking) {
    const event = statement("A", "reserve", "select-for-update", lockingSql, { returnedCount: 1, targetAtStartVersionId: state.currentHeadVersionId });
    own("A"); observe("A", "locked-read", event, state.currentHeadVersionId, snapshot("A", "reserve", event.statementId));
    emit("A-lock", "A: 잠금 뒤 현재 재고1 반환", "FOR UPDATE도 반환값을 앱이 검사해야 합니다. 반환1행과 UPDATE 1행은 다른 결과입니다.", event);
    emit("A-check", "A: 같은 transaction에서 재고 확인", "반환 재고1 >= 요청1이므로 이 연결에서 차감과 주문을 계속합니다.", { sessionId: session("A"), txId: txId("06", "A") });
  }
  update("A", locking ? "stock-update" : "reserve");
  const waitEvent = statement("B", "reserve", locking ? "select-for-update" : "update", locking ? lockingSql : strategy === "unsafe-absolute" ? absoluteSql : conditionalSql,
    { status: "waiting", targetAtStartVersionId: "version:06:stock:v0" });
  snapshot("B", "reserve", waitEvent.statementId, ["version:06:stock:v0"]);
  extra.waitEdges = [{ id: "wait:06:B:101", from: txId("06", "B"), to: resources[0].id,
    resourceId: resources[0].id, txId: txId("06", "B"), statementId: waitEvent.statementId, blockedByTxId: txId("06", "A") }];
  emit("B-wait", "B: 같은 행의 잠금을 기다림", "문장이 아직 끝나지 않아 affectedRows·returnedCount는 없습니다. B는 주문 INSERT로 넘어가지 않습니다.", waitEvent);
  insertOrder("A", 1004, 1);
  finishTransaction("A", firstOutcome); release();
  // B has not returned a result yet, but A no longer blocks its row access.
  extra.waitEdges = [];
  state.requests[0].status = firstOutcome === "commit" ? "fulfilled" : "cancelled";
  emit(`A-${firstOutcome}`, firstOutcome === "commit" ? "A 확정: 최신 재고0" : "A 취소: 확정 재고1 유지",
    firstOutcome === "commit" ? "A의 세 변경이 함께 확정되고 행 잠금이 풀립니다." : "A의 모든 미확정 객체는 현재 경계에서 사라집니다. B는 취소된 A 버전을 쓰지 않습니다.",
    statement("A", firstOutcome, firstOutcome, firstOutcome === "commit" ? "COMMIT;" : "ROLLBACK;"));
  extra.waitEdges = [];
  const rejectB = firstOutcome === "commit" && strategy !== "unsafe-absolute";
  if (locking) {
    const event = statement("B", "reserve", "select-for-update", lockingSql, { status: "succeeded", returnedCount: 1, recheckedVersionId: state.currentHeadVersionId });
    own("B"); observe("B", "locked-read", event, state.currentHeadVersionId, "snapshot:06:B:reserve");
    emit("B-resume", `B: 대기 끝, 현재 재고${product(model.getFixture()).available_qty} 반환`,
      "같은 SELECT FOR UPDATE가 현재 버전을 잠그고 반환했습니다. 반환1행은 주문 가능 판정이 아닙니다.", event);
    emit("B-check", rejectB ? "B: 재고0, 앱이 요청 거절" : "B: 재고1, 앱이 계속 진행",
      "잠금 획득 뒤 반환된 재고를 같은 transaction과 연결에서 확인합니다.", { sessionId: session("B"), txId: txId("06", "B") });
    if (!rejectB) update("B", "stock-update");
  } else if (rejectB) {
    const event = statement("B", "reserve", "update", conditionalSql, { status: "succeeded", affectedRows: 0, recheckedVersionId: state.currentHeadVersionId });
    emit("B-resume", "B: 조건 재확인 후 UPDATE 0행", "재고0에서는 WHERE 조건이 거짓입니다. SQL은 성공했고 앱이 이 0행을 검사합니다. 전체 snapshot 갱신이 아닙니다.", event);
  } else update("B", "reserve", true);
  if (rejectB) {
    state.requests[1].status = "rejected"; finishTransaction("B", "rollback"); release();
    emit("B-rollback", "B: 주문을 만들지 않고 ROLLBACK", "조건부 UPDATE 0행 또는 잠금 뒤 재고0을 확인한 앱이 요청을 거절합니다.", statement("B", "rollback", "rollback", "ROLLBACK;"));
  } else {
    insertOrder("B", 1005, 1); finishTransaction("B", "commit"); release(); state.requests[1].status = "fulfilled";
    emit("B-commit", "B: 새 주문 확정", "B의 변경도 하나의 transaction으로 확정합니다. 원자성과 업무 규칙의 안전성은 별도로 판정합니다.", statement("B", "commit", "commit", "COMMIT;"));
  }
  emit("complete", strategy === "unsafe-absolute" && firstOutcome === "commit" ? "음수는 없지만 초과판매" : "확정 주문은 한 개", strategy === "unsafe-absolute" && firstOutcome === "commit" ?
    "시작1 = 남은0 + 새 주문2가 아닙니다. 두 transaction 모두 원자적이어도 낡은 절대값 저장은 업무 규칙을 깨뜨립니다." :
    "시작1 = 남은0 + 새 주문1입니다. 대기, SQL 결과 확인, 앱의 주문 판단을 함께 봅니다.", {}, true);
  return freeze(frames);
}

export function snapshotFrames(options = {}) {
  optionsObject(options, ["isolation"]);
  const { isolation = "read-committed" } = options;
  choose(isolation, SNAPSHOT_ISOLATIONS, "isolation");
  const rr = isolation === "repeatable-read";
  const extra = { observationKind: "snapshot-visibility", isolation, retainedSnapshotId: null };
  const assumptions = [...CONCURRENCY_ASSUMPTIONS,
    "이 보조 장면은 재고5에서 B가 정당하게 2개를 예약해 재고3이 됩니다. 마지막 한 개 실험의 결과와 섞지 않습니다.",
    "Repeatable Read의 snapshot은 BEGIN 자체가 아니라 첫 데이터 문장에서 정합니다. 이 장면에서 A는 읽기만 합니다.",
    "자기 transaction의 변경을 읽는 예외는 이 장면 밖입니다. Repeatable Read가 모든 업무 직렬성을 보장하지는 않습니다."];
  const model = reservationScene("snapshot", "canonical", [1004], `snapshot:${isolation}`, extra, assumptions);
  const { state, frames, emit, statement, snapshot, observe, change, finishTransaction, insertOrder, addTransaction } = model;
  state.requests.push({ id: "request:snapshot:B", sessionId: session("B"), orderId: 1004, qty: 2, status: "pending" });
  emit("initial", "같은 SELECT를 두 번 읽으면", "A의 두 SELECT 사이에 B가 2개 예약을 확정합니다.");
  addTransaction("A");
  emit("A-begin", "A: BEGIN, 아직 snapshot 없음", "이 고정 schedule에서 첫 데이터 문장은 다음 SELECT입니다.", statement("A", "begin", "begin", `BEGIN ISOLATION LEVEL ${rr ? "REPEATABLE READ" : "READ COMMITTED"};`));
  let event = statement("A", "first-read", "select", stockSql, { returnedCount: 1 });
  const firstSnapshot = snapshot("A", "first", event.statementId, [state.currentHeadVersionId], rr ? "transaction" : "statement");
  if (rr) extra.retainedSnapshotId = firstSnapshot;
  observe("A", "first", event, state.currentHeadVersionId, firstSnapshot);
  emit("A-first-read", "A 첫 SELECT: 재고5", rr ? "첫 데이터 문장에서 정한 snapshot을 transaction 동안 유지합니다." : "이 SELECT가 시작한 시점의 snapshot입니다.", event);
  addTransaction("B");
  emit("B-begin", "B: 별도 연결에서 BEGIN", "B는 재고·헤더·항목을 하나로 묶어 예약합니다.", statement("B", "begin", "begin", "BEGIN ISOLATION LEVEL READ COMMITTED;"));
  event = statement("B", "update", "update", "UPDATE products SET available_qty = available_qty - 2 WHERE id = 101 AND available_qty >= 2;", { affectedRows: 1, targetAtStartVersionId: state.currentHeadVersionId });
  change("B", "stock", "products", { ...product(model.getFixture()), available_qty: 3 }, event, state.currentHeadVersionId);
  emit("B-update", "B: 재고5 → 3, 아직 미확정", "A의 기존 관측은 재고5였다는 과거 기록입니다.", event);
  insertOrder("B", 1004, 2); finishTransaction("B", "commit"); state.requests[0].status = "fulfilled";
  emit("B-commit", "B 확정: 최신 head는 재고3", "최신 확정 head와 A가 선택하는 읽기 버전은 구별합니다.", statement("B", "commit", "commit", "COMMIT;"));
  event = statement("A", "second-read", "select", stockSql, { returnedCount: 1 });
  const selected = rr ? "version:snapshot:stock:v0" : state.currentHeadVersionId;
  const secondSnapshot = rr ? firstSnapshot : snapshot("A", "second", event.statementId, [selected]);
  observe("A", "second", event, selected, secondSnapshot);
  if (rr) {
    // view is a summary of this retained snapshot, not latest-head rows mixed
    // with old stock. The actual SQL observation's rows contain only product101.
    state.readObservations.at(-1).view = measure(createFixture("canonical"), [], 5, [1004]);
  }
  emit("A-second-read", `A 두 번째 SELECT: 재고${rr ? 5 : 3}`, rr ?
    "동일 snapshot의 v0을 다시 선택합니다. 최신 head는3이어도 이 조회는5입니다." :
    "두 번째 SELECT는 새 snapshot으로 B의 확정 버전을 선택합니다.", event);
  finishTransaction("A", "commit");
  extra.retainedSnapshotId = null;
  emit("A-commit", "A의 읽기 transaction 종료", "첫 관측과 두 번째 관측은 각자의 시점·snapshot·버전에 연결된 이력으로 남습니다.", statement("A", "commit", "commit", "COMMIT;"));
  extra.retainedSnapshotId = null;
  emit("complete", rr ? "같은 snapshot: 5 → 5" : "문장별 snapshot: 5 → 3", "두 격리 수준 모두 최신 확정 재고는3, 새 주문수량은2입니다. 차이는 A가 읽는 버전입니다.", {}, true);
  return freeze(frames);
}

export function deadlockFrames(options = {}) {
  optionsObject(options, ["order"]);
  const { order = "opposite" } = options;
  choose(order, DEADLOCK_ORDERS, "deadlock order");
  const prefix = "deadlock";
  const committedFixture = createFixture("canonical");
  const graphResources = [101, 102].map((id) => ({ id: `resource:products:${id}`, rowKey: `products:${id}`, productId: id }));
  const state = {
    transactions: [], statements: [], events: [], readObservations: [], snapshots: [],
    ownershipEdges: [], waitEdges: [], edgeHistory: [], cycle: [], victimTxId: null,
    retryOfTxId: null, retryTxId: null, completedRequestTxIds: [],
    versions: [101, 102].map((id) => ({ id: `version:deadlock:${id}:v0`, table: "products", rowKey: `products:${id}`,
      row: { ...committedFixture.products.find((row) => row.id === id) }, createdByTxId: null,
      createdAtStep: 0, predecessorId: null, state: "committed" })),
  };
  const frames = [];
  const assumptions = [...CONCURRENCY_ASSUMPTIONS,
    "두 상품을 잠그고 읽고 확인한 뒤 종료하는 작은 요청입니다. 이 장면은 주문·재고 변경을 추가하지 않습니다.",
    "B를 희생 transaction으로 고르는 것은 교육용 결정이며 PostgreSQL의 실제 선택을 예측하지 않습니다.",
    "오류 중단은 일반 transaction 잠금을 해제합니다. 이후 ROLLBACK은 실패 block을 정리하며 재시도는 새 transaction입니다.",
    "같은 상품 순서로 잠그면 여기 그린 순환을 피합니다. 모든 종류의 교착 상태가 사라진다는 보장은 아닙니다."];
  const transaction = (who) => state.transactions.find((entry) => entry.id === txId(prefix, who));
  const emit = (phase, title, detail, eventData = {}, finished = false) => {
    const event = { id: `event:deadlock:${frames.length}`, atStep: frames.length, kind: phase,
      sessionId: null, txId: null, statementId: null, sql: null, title, detail, ...eventData };
    state.events.push(event);
    const live = state.transactions.filter((tx) => tx.outcome === "active").map((tx) => tx.id);
    const validEdges = [...state.ownershipEdges, ...state.waitEdges].every((edge) =>
      live.includes(edge.txId) && graphResources.some((resource) => resource.id === edge.resourceId));
    if (!validEdges) throw new Error("Current graph has a dead endpoint");
    frames.push(freeze(structuredClone({ scenarioId: `deadlock:${order}`, step: frames.length, phase,
      observationKind: "two-resource-lock-graph", order, title, detail, assumptions, event,
      ...state, committedFixture, resources: graphResources,
      invariants: { currentEdgesHaveLiveEndpoints: validEdges, hasCycle: state.cycle.length > 0, noOrdersAdded: true }, finished })));
  };
  const statement = (who, id, kind, sql, result = {}) => {
    const fullId = `statement:deadlock:${who}:${id}`;
    const old = state.statements.find((entry) => entry.id === fullId);
    const row = { id: fullId, sessionId: session(who === "B2" ? "B" : who), txId: txId(prefix, who), kind, sql,
      status: "succeeded", affectedRows: null, returnedCount: null, errorCode: null, implicitCommit: false,
      targetAtStartVersionId: null, recheckedVersionId: null, ...old, ...result };
    if (old) state.statements[state.statements.indexOf(old)] = row; else state.statements.push(row);
    return { sessionId: row.sessionId, txId: row.txId, statementId: fullId, sql };
  };
  const begin = (who) => {
    state.transactions.push({ id: txId(prefix, who), sessionId: session(who === "B2" ? "B" : who), blockStatus: "in-transaction", outcome: "active" });
    emit(`${who}-begin`, `${who}: 새 transaction 시작`, who === "B2" ?
      "재시도는 B의 마지막 문장만 반복하지 않습니다. 새 transaction에서 두 상품 읽기·확인을 처음부터 시작합니다." :
      "상품 두 개를 읽고 확인하는 요청을 같은 연결에서 진행합니다.", statement(who, "begin", "begin", "BEGIN;"));
  };
  const removeEdges = (predicate, reason) => {
    for (const name of ["ownershipEdges", "waitEdges"]) {
      for (const edge of state[name].filter(predicate)) state.edgeHistory.push({ edge, removedAtStep: frames.length, reason });
      state[name] = state[name].filter((edge) => !predicate(edge));
    }
  };
  const lock = (who, id, waiting = false, resumed = false) => {
    const versionId = `version:deadlock:${id}:v0`;
    const sql = `SELECT id, available_qty FROM products WHERE id = ${id} FOR UPDATE;`;
    const event = statement(who, `lock-${id}`, "select-for-update", sql, { status: waiting ? "waiting" : "succeeded",
      returnedCount: waiting ? null : 1, targetAtStartVersionId: versionId, recheckedVersionId: resumed ? versionId : null });
    const resourceId = `resource:products:${id}`;
    const snapshotId = `snapshot:deadlock:${who}:${id}`;
    if (!state.snapshots.some((entry) => entry.id === snapshotId)) state.snapshots.push({ id: snapshotId, sessionId: event.sessionId, txId: event.txId,
      establishedAtStep: frames.length, statementId: event.statementId, versionIds: [versionId], scope: "statement" });
    if (waiting) {
      const owner = state.ownershipEdges.find((edge) => edge.resourceId === resourceId);
      state.waitEdges.push({ id: `wait:deadlock:${who}:${id}`, from: txId(prefix, who), to: resourceId,
        resourceId, txId: txId(prefix, who), statementId: event.statementId, blockedByTxId: owner.txId });
    } else {
      if (resumed) removeEdges((edge) => edge.statementId === event.statementId, "대기 문장 재개");
      state.ownershipEdges.push({ id: `ownership:deadlock:${who}:${id}`, from: resourceId,
        to: txId(prefix, who), resourceId, txId: txId(prefix, who), mode: "select-for-update" });
      const version = state.versions.find((entry) => entry.id === versionId);
      state.readObservations.push({ id: `read:deadlock:${who}:${id}`, atStep: frames.length,
        sessionId: event.sessionId, txId: event.txId, statementId: event.statementId, snapshotId,
        status: "succeeded", versionIds: [versionId], rows: [{ rowKey: version.rowKey, versionId, row: version.row }],
        view: null, errorCode: null });
    }
    if (state.waitEdges.length === 2) state.cycle = [txId(prefix, "A"), "resource:products:102", txId(prefix, "B"), "resource:products:101", txId(prefix, "A")];
    emit(`${who}-${waiting ? "wait" : resumed ? "resume" : "lock"}-${id}`, `${who}: 상품${id} ${waiting ? "대기" : "잠금·읽기"}`,
      waiting ? "transaction → 상품은 기다리는 방향입니다. 대기 문장의 반환 행 수는 아직 없습니다." : "상품 → transaction은 소유 방향입니다. 실제 반환된 행의 버전에 조회 토큰을 연결합니다.", event);
  };
  const complete = (who) => {
    const seen = state.readObservations.filter((read) => read.txId === txId(prefix, who));
    if (seen.length !== 2 || !seen.every((read) => read.rows[0].row.available_qty >= 1)) throw new Error("Two-product read/check request is incomplete");
    emit(`${who}-check`, `${who}: 두 상품을 모두 다시 확인`, "반환 재고101=5·102=8을 확인했습니다. 이 작은 요청은 주문을 추가하지 않습니다.", { sessionId: session(who === "B2" ? "B" : who), txId: txId(prefix, who) });
    removeEdges((edge) => edge.txId === txId(prefix, who) || edge.blockedByTxId === txId(prefix, who), "transaction 종료로 차단 해제");
    transaction(who).blockStatus = "idle"; transaction(who).outcome = "committed";
    state.completedRequestTxIds.push(txId(prefix, who));
    emit(`${who}-commit`, `${who}: 읽기·확인 완료`, "현재 소유·대기 선은 사라지고 제거 이력만 따로 남습니다.", statement(who, "commit", "commit", "COMMIT;"));
  };
  emit("initial", "두 상품, 두 transaction", "선의 방향은 잠금 소유와 대기 관계를 구별합니다.");
  begin("A"); begin("B"); lock("A", 101);
  if (order === "opposite") {
    lock("B", 102); lock("A", 102, true); lock("B", 101, true);
    const waitingB = state.statements.find((row) => row.id === "statement:deadlock:B:lock-101");
    waitingB.status = "error"; waitingB.errorCode = "40P01";
    state.victimTxId = txId(prefix, "B"); transaction("B").outcome = "aborted"; transaction("B").blockStatus = "failed";
    removeEdges((edge) => edge.txId === txId(prefix, "B") || edge.blockedByTxId === txId(prefix, "B"), "교육용 희생 B 중단·잠금 해제");
    state.cycle = [];
    emit("victim-abort", "교육용 희생 B 중단, 잠금 해제", "이 희생자 선택은 서버 예측이 아닙니다. B의 block은 아직 실패 상태지만 현재 소유·대기 선은 없습니다.",
      { sessionId: session("B"), txId: txId(prefix, "B"), statementId: waitingB.id, sql: waitingB.sql });
    lock("A", 102, false, true); complete("A");
    transaction("B").blockStatus = "idle"; transaction("B").outcome = "rolled-back";
    emit("B-rollback", "B: 실패 block 정리", "ROLLBACK 뒤 새 transaction으로 요청 전체를 다시 시도합니다.", statement("B", "rollback", "rollback", "ROLLBACK;"));
    state.retryOfTxId = txId(prefix, "B"); state.retryTxId = txId(prefix, "B2");
    begin("B2"); lock("B2", 101); lock("B2", 102); complete("B2");
  } else {
    lock("B", 101, true); lock("A", 102); complete("A");
    lock("B", 101, false, true); lock("B", 102); complete("B");
  }
  emit("complete", order === "opposite" ? "중단 뒤 전체 요청 재시도" : "같은 순서로 이 순환 예방",
    "그래프의 현재 선과 과거 이력은 구별합니다. 다른 자원·다른 코드까지 교착이 없다는 보장은 아닙니다.", {}, true);
  return freeze(frames);
}

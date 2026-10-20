import { CANONICAL_FIXTURE, assertFixture, cloneFixture, rowKey } from "./fixture.mjs";

// PostgreSQL 18 documentation is the semantic baseline, not an executed server.
// https://www.postgresql.org/docs/18/tutorial-transactions.html
// https://www.postgresql.org/docs/18/functions-sequence.html
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
    throw new TypeError("Transaction options must be a plain object");
  if (Reflect.ownKeys(value).some((key) => !allowed.includes(key)))
    throw new RangeError("Unknown transaction option");
};
const choose = (value, choices, name) => {
  if (!choices.includes(value)) throw new RangeError(`Unknown ${name}: ${String(value)}`);
};
export const TRANSACTION_MODES = freeze(["atomic", "statement-autocommit"]);
export const TRANSACTION_OUTCOMES = freeze(["success", "header-constraint-error", "item-constraint-error"]);
export const TRANSACTION_ASSUMPTIONS = freeze([
  "가상 자료와 고정 사건을 재생하는 교육 모델입니다. SQL·서버·컨테이너는 실행하지 않았습니다.",
  "PostgreSQL 18 문서의 의미를 기준으로 합니다. 내부 실행 순서나 물리 저장 구조의 재현은 아닙니다.",
  "고객1이 상품101을 2개 주문하며 당시 단가는 12,000원입니다. 기존 주문은 시작 재고5에 이미 반영되어 있습니다.",
  "orders.status='confirmed'는 업무 데이터이며 COMMIT 표시가 아닙니다. 빈 주문 헤더는 스키마상 유효해도 주문 완료가 아닙니다.",
  "education_order_id_seq는 이 실험에 별도로 가정한 sequence입니다. 기존 스키마에 자동 생성기가 있다는 뜻이 아닙니다.",
  "명시적으로 성공한 nextval의 소비 값은 rollback하지 않습니다. cache·crash·내구성은 이 실험 밖입니다.",
  "조회 표시는 해당 단계에 실제로 모델링한 SELECT의 과거 관측입니다. 그림의 현재 확정 상태가 매 단계 새 SELECT를 뜻하지는 않습니다.",
  "외부 결제·이메일·파일과 COMMIT 응답 유실은 이 실험의 rollback 범위 밖입니다. SAVEPOINT는 사용하지 않습니다.",
]);
const stock = (fixture) => fixture.products.find((row) => row.id === 101).available_qty;
const header = (key = "key-1004") => ({ id: 1004, customer_id: 1, request_key: key,
  status: "confirmed", created_at: "2026-01-12T01:00:00Z" });
const item = (qty = 2) => ({ order_id: 1004, line_no: 1, product_id: 101, qty, unit_price_won: 12000 });
const selectSql = "SELECT p.available_qty,\n  (SELECT COUNT(*) FROM orders WHERE id = 1004) AS new_orders,\n  (SELECT COALESCE(SUM(qty), 0) FROM order_items WHERE order_id = 1004) AS new_qty\nFROM products p WHERE p.id = 101;";
const headerSql = (row) => `INSERT INTO orders (id, customer_id, request_key, status, created_at)\nVALUES (1004, 1, '${row.request_key}', 'confirmed', '2026-01-12T01:00:00Z');`;
const itemSql = (row) => `INSERT INTO order_items (order_id, line_no, product_id, qty, unit_price_won)\nVALUES (1004, 1, 101, ${row.qty}, 12000);`;
function measurements(fixture, requests) {
  const items = fixture.order_items.filter((row) => row.order_id === 1004);
  // The shared chapter-02 type admits NULL. This lab requires the default NOT NULL contract.
  if (items.some((row) => row.qty === null)) throw new RangeError("Reservation quantities must not be NULL");
  return { initialStock: 5, availableQty: stock(fixture),
    newOrderCount: fixture.orders.filter((row) => row.id === 1004).length,
    newItemQty: items.reduce((sum, row) => sum + row.qty, 0),
    fulfilledRequests: requests.filter((request) => request.status === "fulfilled").length };
}
function apply(fixture, changes) {
  const next = cloneFixture(fixture);
  for (const change of changes) {
    const rows = next[change.table];
    const index = rows.findIndex((row) => rowKey(change.table, row) === change.rowKey);
    if (index === -1) rows.push({ ...change.row }); else rows[index] = { ...change.row };
  }
  return assertFixture(next);
}

/** Six fixed reservation schedules, not a SQL parser or database engine. */
export function transactionFrames(options = {}) {
  optionsObject(options, ["mode", "outcome"]);
  const { mode = "atomic", outcome = "success" } = options;
  choose(mode, TRANSACTION_MODES, "mode"); choose(outcome, TRANSACTION_OUTCOMES, "outcome");
  const atomic = mode === "atomic";
  let committedFixture = cloneFixture(CANONICAL_FIXTURE);
  const initialRow = committedFixture.products.find((row) => row.id === 101);
  const state = {
    activeChanges: [], discardedChanges: [], versions: [{ id: "version:05:stock:v0", table: "products",
      rowKey: "products:101", row: { ...initialRow }, createdByTxId: null, createdAtStep: 0,
      predecessorId: null, state: "committed" }],
    committedVersionIds: ["version:05:stock:v0"], currentHeadVersionId: "version:05:stock:v0",
    statements: [], transactions: atomic ? [{ id: "tx:05:A", sessionId: "session:A", blockStatus: "idle", outcome: "not-started" }] : [],
    requests: [{ id: "request:05:A", sessionId: "session:A", orderId: null, qty: 2, status: "pending" }],
    events: [], readObservations: [], snapshots: [], rejectedCandidate: null,
    sequence: { name: "education_order_id_seq", nextValue: 1004, allocations: [] },
  };
  const frames = [];
  let committedThisStepVersionIds = [];
  const tx = () => state.transactions.find((entry) => entry.id === "tx:05:A");
  const emit = (phase, title, detail, eventData = {}, finished = false) => {
    assertFixture(committedFixture); apply(committedFixture, state.activeChanges);
    const measured = measurements(committedFixture, state.requests);
    const balanced = measured.availableQty + measured.newItemQty === measured.initialStock;
    const complete = balanced && measured.newOrderCount === (measured.newItemQty === 2 ? 1 : 0);
    const verdict = !finished ? "pending" : outcome === "success" ? "fulfilled" : atomic ? "rolled-back" : "partial-failure";
    const event = { id: `event:05:${frames.length}`, atStep: frames.length, kind: phase,
      sessionId: null, txId: null, statementId: null, sql: null, title, detail, ...eventData };
    state.events.push(event);
    frames.push(freeze(structuredClone({ scenarioId: `transaction:${mode}:${outcome}`, step: frames.length,
      phase, observationKind: "transaction-boundaries", mode, outcome, title, detail,
      assumptions: TRANSACTION_ASSUMPTIONS, event, ...state, committedFixture, committedThisStepVersionIds,
      currentVersionIds: [...state.committedVersionIds, ...state.activeChanges.map((change) => change.versionId)],
      measurements: measured, invariants: { schemaValid: true, stockNonnegative: measured.availableQty >= 0,
        reservationBalance: balanced, terminalBusinessValid: finished ? complete : null, verdict }, finished })));
    committedThisStepVersionIds = [];
  };
  const statement = (id, kind, sql, result = {}, sessionId = "session:A", txId = atomic ? "tx:05:A" : `tx:05:${id}`) => {
    const row = { id: `statement:05:${id}`, sessionId, txId, kind, sql, status: "succeeded",
      affectedRows: null, returnedCount: null, errorCode: null, implicitCommit: !atomic && sessionId === "session:A",
      targetAtStartVersionId: null, recheckedVersionId: null, ...result };
    state.statements.push(row);
    if (!atomic && sessionId === "session:A") state.transactions.push({ id: txId, sessionId,
      blockStatus: "idle", outcome: row.status === "error" ? "aborted" : "committed" });
    return { sessionId, txId, statementId: row.id, sql };
  };
  const commitChanges = (changes) => {
    committedFixture = apply(committedFixture, changes);
    for (const change of changes) {
      const oldId = state.committedVersionIds.find((id) => state.versions.find((version) => version.id === id).rowKey === change.rowKey);
      if (oldId) {
        state.versions.find((version) => version.id === oldId).state = "superseded";
        state.committedVersionIds = state.committedVersionIds.filter((id) => id !== oldId);
      }
      state.versions.find((version) => version.id === change.versionId).state = "committed";
      state.committedVersionIds.push(change.versionId);
      committedThisStepVersionIds.push(change.versionId);
      if (change.rowKey === "products:101") state.currentHeadVersionId = change.versionId;
    }
  };
  const write = (table, row, id, kind, sql, title) => {
    const event = statement(id, kind, sql, { affectedRows: 1 });
    const key = rowKey(table, row);
    const beforeId = state.committedVersionIds.find((versionId) => state.versions.find((version) => version.id === versionId).rowKey === key) ?? null;
    const versionId = `version:05:${id}`;
    const change = { id: `change:05:${id}`, txId: event.txId, statementId: event.statementId,
      table, rowKey: key, versionId, beforeVersionId: beforeId, row: { ...row } };
    state.versions.push({ id: versionId, table, rowKey: key, row: { ...row }, createdByTxId: event.txId,
      createdAtStep: frames.length, predecessorId: beforeId, state: "active" });
    if (atomic) state.activeChanges.push(change); else commitChanges([change]);
    emit(id, title, atomic ? "문장은 성공했지만 변경은 아직 확정되지 않았습니다." : "이 문장 완료와 자동 확정은 하나의 사건입니다. 사용자 COMMIT은 보내지 않습니다.", event);
  };
  const read = (id, author, title) => {
    const sessionId = author ? "session:A" : "session:observer";
    const failed = author && atomic && tx().blockStatus === "failed";
    const event = statement(id, "select", selectSql, { status: failed ? "error" : "succeeded",
      returnedCount: failed ? null : 1, errorCode: failed ? "25P02" : null, implicitCommit: !atomic && author }, sessionId, author ? (atomic ? "tx:05:A" : `tx:05:${id}`) : null);
    const ids = [...state.committedVersionIds];
    if (author && atomic && !failed) for (const change of state.activeChanges) {
      const index = ids.findIndex((versionId) => state.versions.find((version) => version.id === versionId).rowKey === change.rowKey);
      if (index !== -1) ids.splice(index, 1);
      ids.push(change.versionId);
    }
    const snapshotId = failed ? null : `snapshot:05:${id}`;
    if (!failed) state.snapshots.push({ id: snapshotId, sessionId, txId: event.txId,
      establishedAtStep: frames.length, statementId: event.statementId, versionIds: ids, scope: "statement" });
    state.readObservations.push({ id: `read:05:${id}`, atStep: frames.length, sessionId, txId: event.txId,
      statementId: event.statementId, snapshotId, status: failed ? "error" : "succeeded", versionIds: failed ? [] : ids,
      rows: failed ? [] : ids.map((versionId) => { const version = state.versions.find((entry) => entry.id === versionId);
        return { rowKey: version.rowKey, versionId, row: version.row }; }),
      view: failed ? null : measurements(author && atomic ? apply(committedFixture, state.activeChanges) : committedFixture, state.requests),
      errorCode: failed ? "25P02" : null });
    emit(id, title, failed ? "실패한 명시적 block에서는 SELECT도 오류입니다. 반환 행이나 현재 조회 보기를 만들지 않습니다." :
      "이 SELECT의 반환값을 관측 시점과 버전 ID로 보관합니다. 다음 단계에서도 과거 관측입니다.", event);
  };
  const reject = (table, row, id, constraint) => {
    const sql = table === "orders" ? headerSql(row) : itemSql(row);
    const event = statement(id, "insert", sql, { status: "error", errorCode: table === "orders" ? "23505" : "23514", implicitCommit: false });
    state.rejectedCandidate = { table, rowKey: rowKey(table, row), row, statementId: event.statementId, constraint };
    state.requests[0].status = "failed";
    if (atomic) {
      tx().blockStatus = "failed"; tx().outcome = "aborted";
      for (const change of state.activeChanges) {
        state.discardedChanges.push({ ...change, discardedAtStep: frames.length, reason: "문장 오류로 transaction 중단" });
        state.versions.find((version) => version.id === change.versionId).state = "discarded";
      }
      state.activeChanges = [];
    }
    emit(id, table === "orders" ? "중복 요청 키로 헤더 거절" : "수량0 항목은 CHECK 오류", "실패 후보는 유효한 행 집합에 한 번도 들어가지 않습니다. 앞서 성공한 변경의 이력과 구별합니다.", event);
  };

  emit("initial", "재고5에서 주문2개 시작", "새 주문1004만 셉니다. 기존 주문은 다시 차감하지 않습니다.");
  if (atomic) {
    tx().blockStatus = "in-transaction"; tx().outcome = "active";
    emit("begin", "하나의 transaction 경계", "같은 연결에서 재고·헤더·항목을 함께 묶습니다.", statement("begin", "begin", "BEGIN;"));
  }
  write("products", { ...initialRow, available_qty: 3 }, "stock-update", "update",
    "UPDATE products SET available_qty = available_qty - 2 WHERE id = 101 AND available_qty >= 2;", "재고5 → 3, UPDATE 1행");
  const allocationEvent = statement("allocate", "nextval", "SELECT nextval('education_order_id_seq');", { returnedCount: 1 });
  state.sequence.allocations.push({ value: 1004, atStep: frames.length, statementId: allocationEvent.statementId, txId: allocationEvent.txId });
  state.sequence.nextValue = 1005;
  state.requests[0].orderId = 1004;
  emit("allocate", "명시적으로 번호1004 소비", "교육용 sequence의 nextval이 성공했습니다. 다음 값1005는 rollback에도 돌아가지 않습니다.", allocationEvent);
  if (outcome === "header-constraint-error") reject("orders", header("key-1001"), "header-error", "orders_request_key_key");
  else {
    write("orders", header(), "header-insert", "insert", headerSql(header()), "주문 헤더1개 생성");
    if (outcome === "item-constraint-error") reject("order_items", item(0), "item-error", "order_items_qty_check");
    else write("order_items", item(), "item-insert", "insert", itemSql(item()), "주문 항목2개 연결");
  }
  if (outcome === "success") {
    read("author-read", true, "작성자 SELECT: 자신의 변경 보임");
    read("observer-before", false, atomic ? "확정 전 다른 세션: 여전히 재고5" : "다른 세션: 앞선 문장 결과가 이미 확정됨");
    if (atomic) {
      const event = statement("commit", "commit", "COMMIT;");
      commitChanges(state.activeChanges); state.activeChanges = [];
      tx().blockStatus = "idle"; tx().outcome = "committed";
      state.requests[0].status = "fulfilled";
      emit("commit", "세 변경을 함께 확정", "재고3·새 헤더1·항목수량2가 함께 최신 확정 상태가 됩니다.", event);
    } else state.requests[0].status = "fulfilled";
  } else if (atomic) {
    read("author-error-read", true, "오류 뒤 SELECT도 실패");
    read("observer-error", false, "다른 세션은 기존 확정 상태 조회");
    tx().blockStatus = "idle"; tx().outcome = "rolled-back";
    emit("rollback", "ROLLBACK으로 실패 block 종료", "취소된 변경은 현재 경계에 없고 이력에만 남습니다. 소비된 sequence 값은 복원하지 않습니다.", statement("rollback", "rollback", "ROLLBACK;"));
  }
  read("observer-final", false, "새 SELECT로 최종 확정 상태 확인");
  emit("complete", outcome === "success" ? "주문 완료" : atomic ? "변경 없음으로 종료" : "스키마 유효와 주문 완료는 다름",
    outcome === "success" ? "새 주문수량2와 재고 감소2가 맞습니다." : atomic ? "재고5·새 주문0·새 항목0입니다. 번호1004의 소비는 별개입니다." :
      "앞선 문장의 자동 확정은 뒤 문장의 오류로 취소되지 않습니다. 재고 감소와 주문수량이 맞지 않습니다.", {}, true);
  return freeze(frames);
}

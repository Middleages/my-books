import { CANONICAL_FIXTURE, rowKey } from "./fixture.mjs";

// Five closed educational schedules, not a SQL interpreter, migration runner,
// PostgreSQL storage engine, or a promise of zero downtime.
const freeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
export const MIGRATION_SCENARIOS = freeze([
  "immediate-rename", "safe-expand-contract", "old-writer-remains", "interrupted-backfill", "ddl-wait",
]);
export const MIGRATION_ASSUMPTIONS = freeze([
  "PostgreSQL 18 문서를 바탕으로 만든 고정 교육 장면입니다. 실제 SQL·서버·시간 측정은 실행하지 않습니다.",
  "products의 가상 상품101·102·103만 다룹니다. 상품 ID·가격·재고는 유지하며 열 이름과 상품 이름 값은 구별합니다.",
  "행 version은 교육용 상태 번호입니다. 스키마 투영 변경도 기록하며 PostgreSQL xmin·물리 행 재작성 횟수를 뜻하지 않습니다.",
  "old는 name 읽기·쓰기, bridge는 name 읽기와 같은 transaction의 양열 쓰기, new는 display_name 읽기·쓰기를 합니다.",
  "새 앱은 모든 표시 이름에 값이 있어야 합니다. nullable 열의 NULL 읽기 자체가 SQL 오류라는 뜻은 아닙니다.",
  "backfill은 선택한 현재 행에서 display_name이 NULL일 때만 name을 복사합니다. 저장해 둔 옛 snapshot 값을 쓰지 않습니다.",
  "여기서는 앱 쓰기와 작은 backfill 묶음의 완료 사이를 관찰합니다. 실제 동시 갱신의 잠금·격리·재시도 전체를 재현하지 않습니다.",
  "채움·값 동등성·옛 단일열 writer 제거·모든 옛열 참조 제거는 별도 조건입니다. bridge의 name 쓰기도 마지막 삭제를 막습니다.",
  "잠금 예는 nullable ADD COLUMN의 ACCESS EXCLUSIVE와 기존 SELECT transaction의 ACCESS SHARE 충돌만 다룹니다. 모든 DDL의 잠금이 같다는 뜻은 아닙니다.",
]);
const appDefinitions = [
  { id: "app:old", role: "old", label: "옛 앱", readColumns: ["name"], writeColumns: ["name"], atomicWrite: true },
  { id: "app:bridge", role: "bridge", label: "전환 앱", readColumns: ["name"], writeColumns: ["name", "display_name"], atomicWrite: true },
  { id: "app:new", role: "new", label: "새 앱", readColumns: ["display_name"], writeColumns: ["display_name"], atomicWrite: true },
];
const initialColumns = [
  { id: "column:products:id", name: "id", type: "integer", nullable: false },
  { id: "column:products:name", name: "name", type: "text", nullable: false },
  { id: "column:products:unit_price_won", name: "unit_price_won", type: "integer", nullable: false },
  { id: "column:products:available_qty", name: "available_qty", type: "integer", nullable: false },
];

function scene(scenario) {
  const frames = [];
  const state = {
    schemaVersion: 0, schemaColumns: structuredClone(initialColumns),
    activeRoles: ["old"], rows: [], versions: [],
    backfill: { status: "idle", attempt: 0, selectedRowKeys: [], filledRowKeys: [], skippedRowKeys: [], sourceVersionIds: [] },
    lockWait: null, lastVerification: null,
  };
  const eventId = () => `event:migration:${scenario}:${frames.length}`;
  const versionId = (key, version) => `version:migration:${scenario}:${key}:${version}`;
  for (const product of CANONICAL_FIXTURE.products) {
    const key = rowKey("products", product);
    const row = { rowKey: key, productId: product.id, versionId: versionId(key, 0), version: 0, values: { ...product } };
    state.rows.push(row);
    state.versions.push({ ...structuredClone(row), previousVersionId: null, createdAtStep: 0, eventId: eventId(), schemaVersion: 0 });
  }
  const hasColumn = (name) => state.schemaColumns.some((column) => column.name === name);
  const currentVersions = () => state.rows.map((row) => row.versionId);
  const capabilities = () => {
    const edges = [];
    const apps = appDefinitions.map((definition) => {
      const active = state.activeRoles.includes(definition.role);
      for (const operation of ["read", "write"]) {
        for (const name of definition[`${operation}Columns`]) {
          const column = state.schemaColumns.find((candidate) => candidate.name === name);
          const unfilled = operation === "read" && column ?
            state.rows.filter((row) => row.values[name] === null).map((row) => row.rowKey) : [];
          edges.push({
            id: `capability:${definition.role}:${operation}:${name}`,
            appId: definition.id, role: definition.role, operation, column: name, columnId: column?.id ?? null,
            status: !active ? "inactive" : !column ? "missing-column" : unfilled.length ? "unfilled" : "ready",
            affectedRowKeys: !column ? state.rows.map((row) => row.rowKey) : unfilled,
          });
        }
      }
      return {
        ...definition, active,
        readReady: definition.readColumns.every((name) => hasColumn(name) && state.rows.every((row) => row.values[name] !== null)),
        writeReady: definition.writeColumns.every(hasColumn),
      };
    });
    return { apps, edges };
  };
  const inspect = () => {
    const { apps, edges } = capabilities();
    const total = state.rows.length;
    const fillAvailable = hasColumn("display_name");
    const equalityAvailable = fillAvailable && hasColumn("name");
    const filled = fillAvailable ? state.rows.filter((row) => row.values.display_name !== null).length : 0;
    const equal = equalityAvailable ? state.rows.filter((row) => row.values.display_name !== null && row.values.name === row.values.display_name).length : 0;
    const mismatchedRowKeys = equalityAvailable ?
      state.rows.filter((row) => row.values.display_name !== null && row.values.name !== row.values.display_name).map((row) => row.rowKey) : [];
    const fill = { available: fillAvailable, filled, total, complete: fillAvailable && filled === total };
    const equality = { available: equalityAvailable, equal, total, complete: equalityAvailable && equal === total, mismatchedRowKeys };
    const active = apps.filter((app) => app.active);
    const oldOnlyWriterCount = active.filter((app) => app.writeColumns.includes("name") && !app.writeColumns.includes("display_name")).length;
    const oldReaderCount = active.filter((app) => app.readColumns.includes("name")).length;
    const oldWriterCount = active.filter((app) => app.writeColumns.includes("name")).length;
    // Count capability references, not machines, processes, or all production clients.
    const oldReferenceCount = edges.filter((edge) => edge.status !== "inactive" && edge.column === "name").length;
    const checked = state.lastVerification;
    const lastVerification = checked ? {
      ...checked,
      current: equalityAvailable && checked.rowVersionIds.every((id, index) => id === currentVersions()[index]),
    } : null;
    const verified = lastVerification?.current === true && lastVerification.passed;
    const canBackfill = equalityAvailable && oldOnlyWriterCount === 0;
    const canSwitchToNew = canBackfill && fill.complete && equality.complete && verified;
    const canDropOld = canSwitchToNew && oldReferenceCount === 0 && active.some((app) => app.role === "new");
    const blockers = [];
    if (!equalityAvailable) blockers.push("name과 display_name이 함께 있어야 전환 전 비교를 할 수 있습니다.");
    if (!fill.complete) blockers.push("새 열이 없거나 아직 NULL인 행이 있습니다.");
    if (mismatchedRowKeys.length) blockers.push("새 열이 채워졌어도 현재 name과 다른 행이 있습니다.");
    if (oldOnlyWriterCount) blockers.push("name만 쓰는 옛 writer가 남아 있습니다.");
    if (!verified) blockers.push("현재 행 버전에 대한 명시적 동등성 검증이 아직 통과하지 않았습니다.");
    if (oldReferenceCount) blockers.push(`name을 읽거나 쓰는 활성 참조가 ${oldReferenceCount}개 남아 있습니다.`);
    if (!active.some((app) => app.role === "new")) blockers.push("새열 전용 앱으로 전환하지 않았습니다.");
    return {
      appCapabilities: apps, capabilityEdges: edges,
      failedReferences: edges.filter((edge) => edge.status === "missing-column"),
      activeWriters: active.filter((app) => app.writeColumns.length > 0).map((app) => app.id),
      lastVerification,
      validation: { fill, equality, oldOnlyWriterCount, oldReaderCount, oldWriterCount, oldReferenceCount,
        canBackfill, canSwitchToNew, canDropOld, blockers },
    };
  };
  const emit = (phase, title, detail, changes = {}, finished = false) => {
    const event = {
      id: eventId(), kind: phase, title, detail,
      rowKeys: [], beforeVersionIds: [], afterVersionIds: [], txId: null, atomic: false, changedColumns: [],
      ...changes,
    };
    frames.push(freeze(structuredClone({
      id: `migration:${scenario}:${phase}`, scenario, step: frames.length, phase, title, detail,
      assumptions: MIGRATION_ASSUMPTIONS, schemaVersion: state.schemaVersion, schemaColumns: state.schemaColumns,
      rows: state.rows, versions: state.versions, ...inspect(), event, currentEvent: event,
      changedRowKeys: event.rowKeys, backfill: state.backfill, lockWait: state.lockWait, finished,
    })));
  };
  const changeRows = (keys, update, columns, txId = null) => {
    const changes = { rowKeys: [], beforeVersionIds: [], afterVersionIds: [], txId, atomic: true, changedColumns: columns };
    for (const key of keys) {
      const index = state.rows.findIndex((row) => row.rowKey === key);
      if (index === -1) throw new Error("Internal migration schedule references a missing product");
      const before = state.rows[index];
      const values = update({ ...before.values });
      const version = before.version + 1;
      const row = { ...before, values, version, versionId: versionId(key, version) };
      state.rows[index] = row;
      state.versions.push({ ...structuredClone(row), previousVersionId: before.versionId,
        createdAtStep: frames.length, eventId: eventId(), schemaVersion: state.schemaVersion });
      changes.rowKeys.push(key);
      changes.beforeVersionIds.push(before.versionId);
      changes.afterVersionIds.push(row.versionId);
    }
    return changes;
  };
  const addColumn = (phase = "expand", finished = false) => {
    if (hasColumn("display_name")) throw new Error("Internal schedule attempted to add an existing column");
    state.schemaVersion += 1;
    state.schemaColumns.splice(2, 0, { id: "column:products:display_name", name: "display_name", type: "text", nullable: true });
    const changes = changeRows(state.rows.map((row) => row.rowKey), (values) => ({ ...values, display_name: null }),
      ["display_name"], state.lockWait?.ddlTxId ?? "tx:migration:add-column");
    emit(phase, "새 nullable 열을 먼저 추가", "옛 name은 그대로 있고 새 display_name은 세 행 모두 NULL입니다. 추가만으로 새 앱 읽기 준비가 끝나지 않습니다.", changes, finished);
  };
  const deployBridge = () => {
    state.activeRoles = ["old", "bridge"];
    emit("deploy-bridge", "양열 쓰기 전환 앱을 배포", "전환 앱은 name을 읽고 이름 변경 시 name과 display_name을 같은 transaction에서 씁니다. 옛 앱도 아직 남아 있습니다.");
  };
  const retireOld = () => {
    state.activeRoles = ["bridge"];
    emit("retire-old-writer", "옛 단일열 writer를 제거", "이 교육 범위의 활성 앱 중 name만 쓰는 writer가 0입니다. 전환 앱의 name 읽기·쓰기는 아직 남아 있습니다.");
  };
  const fillChunk = (phase, selectedIds, attempt, title, detail, unsafeCounterexample = false) => {
    if (!hasColumn("name") || !hasColumn("display_name")) throw new Error("Backfill requires both columns");
    if (!inspect().validation.canBackfill && !unsafeCounterexample) throw new Error("Safe backfill requires retiring old-only writers");
    const selected = selectedIds.map((id) => state.rows.find((row) => row.productId === id));
    if (selected.some((row) => !row)) throw new Error("Internal migration chunk references a missing product");
    const filled = selected.filter((row) => row.values.display_name === null);
    const skipped = selected.filter((row) => row.values.display_name !== null);
    const sourceVersionIds = selected.map((row) => row.versionId);
    const changes = changeRows(filled.map((row) => row.rowKey), (values) => ({ ...values, display_name: values.name }),
      filled.length ? ["display_name"] : [], `tx:migration:backfill:${attempt}:${phase}`);
    state.backfill = {
      status: state.rows.every((row) => row.values.display_name !== null) ? "complete" : "running", attempt,
      selectedRowKeys: selected.map((row) => row.rowKey), filledRowKeys: filled.map((row) => row.rowKey),
      skippedRowKeys: skipped.map((row) => row.rowKey), sourceVersionIds,
    };
    emit(phase, title, detail, changes);
  };
  const writeName = (role, productId, value, phase) => {
    if (!state.activeRoles.includes(role)) throw new Error("Internal migration schedule used an inactive writer");
    const definition = appDefinitions.find((app) => app.role === role);
    if (!definition.writeColumns.every(hasColumn)) throw new Error("Internal migration write targets a missing column");
    const changes = changeRows([`products:${productId}`], (values) => {
      for (const column of definition.writeColumns) values[column] = value;
      return values;
    }, definition.writeColumns, `tx:migration:${role}:${phase}`);
    emit(phase, role === "bridge" ? `상품${productId}: 두 이름을 함께 변경` : `상품${productId}: 옛 writer가 name만 변경`,
      role === "bridge" ?
        "한 transaction이 두 값을 같은 새 이름으로 확정했습니다. 한쪽만 바뀐 중간 프레임은 만들지 않습니다." :
        "display_name은 채워진 상태지만 이전 값입니다. 채움 100%와 최신 name 동등성은 다른 조건입니다.", changes);
  };
  const verify = (phase = "verify", finished = false) => {
    const { fill, equality } = inspect().validation;
    state.lastVerification = { atStep: frames.length, rowVersionIds: currentVersions(),
      filled: fill.filled, equal: equality.equal, total: state.rows.length, passed: fill.complete && equality.complete };
    emit(phase, state.lastVerification.passed ? "현재 행의 채움과 동등성 확인" : "채움은 완료, 동등성은 실패",
      state.lastVerification.passed ?
        "이 프레임의 세 행은 모두 채워졌고 name과 display_name이 같습니다. 이 확인만으로 남아 있는 옛열 참조를 제거한 것은 아닙니다." :
        "현재 행의 값을 직접 비교했습니다. NULL이 없다는 이유만으로 새 읽기나 옛열 삭제를 허용하지 않습니다.", {}, finished);
  };
  const switchToNew = () => {
    if (!inspect().validation.canSwitchToNew) throw new Error("Internal migration schedule switched before validation");
    state.activeRoles = ["new"];
    emit("new-only", "새열 전용 앱으로 전환", "새 앱은 display_name만 읽고 씁니다. 전환 앱의 양열 쓰기도 종료되어 모든 name 읽기·쓰기 참조가 0입니다.");
  };
  const dropOld = () => {
    if (!inspect().validation.canDropOld) throw new Error("Internal migration schedule dropped before all gates");
    state.schemaVersion += 1;
    state.schemaColumns = state.schemaColumns.filter((column) => column.name !== "name");
    const changes = changeRows(state.rows.map((row) => row.rowKey), (values) => {
      delete values.name;
      return values;
    }, ["name"], "tx:migration:drop-old");
    emit("drop-old", "옛열은 현재 스키마에서 제거", "삭제 직전 프레임에서 채움·동등성 검증과 옛열 참조 0을 확인했습니다. 지금은 display_name만 남고 이전 비교는 과거 기록입니다.", changes, true);
  };
  return { state, frames, emit, addColumn, deployBridge, retireOld, fillChunk, writeName, verify, switchToNew, dropOld, changeRows };
}

function immediateRename(model) {
  const { state, emit, changeRows } = model;
  state.schemaVersion += 1;
  // Renaming preserves column identity; adding a separate column does not.
  state.schemaColumns.find((column) => column.name === "name").name = "display_name";
  const changes = changeRows(state.rows.map((row) => row.rowKey), (values) => {
    values.display_name = values.name;
    delete values.name;
    return values;
  }, ["name", "display_name"], "tx:migration:rename");
  emit("rename", "값은 보존됐지만 옛 이름은 사라짐", "열의 이름을 바꿔도 상품 값은 사라지지 않습니다. 그러나 아직 name을 참조하는 옛 앱의 읽기·쓰기 연결은 현재 스키마를 찾지 못합니다.", changes);
  emit("old-reference-failed", "DB 변경 성공과 앱 호환성은 다름", "현재 표에 name은 없습니다. 실패 지점은 현재 빈 열이 아니라 옛 앱이 계속 사용하는 이름 참조입니다.", {}, true);
}
function safeExpandContract(model, interrupted) {
  model.addColumn();
  model.deployBridge();
  model.retireOld();
  model.fillChunk("backfill-first", [101], 1, "첫 묶음: 상품101을 채움",
    "선택한 현재 행에서 NULL인 새 열만 채웠습니다. 아직 상품102·103은 NULL입니다.");
  if (interrupted) {
    model.state.backfill.status = "interrupted";
    model.emit("interrupted", "묶음 사이에서 작업 중단", "첫 묶음은 이미 확정되었습니다. 아직 채우지 않은 행은 NULL이고, 중단이 완료된 묶음을 되돌리지는 않습니다.");
  }
  model.writeName("bridge", 102, "노트 새판", "bridge-update");
  model.fillChunk(interrupted ? "resume" : "backfill-rest", [101, 102, 103], interrupted ? 2 : 1,
    interrupted ? "재실행: 채운 행은 건너뛰기" : "다음 묶음: 남은 NULL만 채우기",
    "현재 상품101·102의 새 열은 이미 채워져 건너뜁니다. 상품102의 새 이름도 유지하며 현재 상품103의 name만 복사합니다.");
  if (interrupted) model.fillChunk("replay-noop", [101, 102, 103], 3, "같은 작업을 다시 해도 변경 0",
    "세 행 모두 NULL이 아니어서 건너뜁니다. 값과 행 version이 그대로이며 저장해 둔 옛 이름을 덮어쓰지 않습니다.");
  model.verify();
  model.switchToNew();
  model.dropOld();
}
function oldWriterRemains(model) {
  model.addColumn();
  model.deployBridge();
  model.fillChunk("unsafe-fill", [101, 102, 103], 1, "반례: 옛 writer를 남긴 채 모두 채움",
    "이 단계는 안전 게이트를 일부러 어긴 반례입니다. 지금 채움과 값 동등성이 3/3이어도 옛 단일열 writer가 다음 값을 어긋나게 만들 수 있습니다.", true);
  model.verify("premature-verify");
  model.writeName("old", 101, "머그 새색", "old-only-update");
  model.fillChunk("retry-cannot-repair", [101, 102, 103], 2, "NULL-only 재실행으로는 불일치가 안 고쳐짐",
    "이미 채운 새 열은 모두 건너뜁니다. 이 작업의 재실행 안전성은 옛 writer가 만든 값 불일치까지 자동 복구한다는 뜻이 아닙니다.", true);
  model.verify("verify-failed");
  model.emit("drop-blocked", "옛열 삭제는 차단", "옛 writer와 전환 앱의 name 참조가 남고 상품101의 값도 다릅니다. 스키마와 행을 그대로 두고 종료합니다.", {}, true);
}
function ddlWait(model) {
  const { state, emit } = model;
  state.lockWait = {
    status: "held", holderTxId: "tx:select:held", holderMode: "ACCESS SHARE", holderStatus: "active",
    ddlTxId: "tx:ddl:add-column", ddlMode: "ACCESS EXCLUSIVE", ddlStatus: "not-requested",
    statementId: "statement:ddl:add-column", blockerTxIds: [], relation: "products",
  };
  emit("select-held", "SELECT의 transaction이 아직 열려 있음", "SELECT가 잡은 products의 ACCESS SHARE는 이 transaction이 끝날 때까지 유지됩니다.",
    { txId: state.lockWait.holderTxId });
  state.lockWait.status = "waiting";
  state.lockWait.ddlStatus = "waiting";
  state.lockWait.blockerTxIds = [state.lockWait.holderTxId];
  emit("ddl-waiting", "ADD COLUMN이 잠금을 기다림", "이 ADD COLUMN이 요구한 ACCESS EXCLUSIVE는 기존 ACCESS SHARE와 충돌합니다. 명령이 기다리는 동안 새 열은 아직 없습니다.",
    { txId: state.lockWait.ddlTxId });
  state.lockWait.holderStatus = "committed";
  state.lockWait.status = "granted";
  state.lockWait.ddlStatus = "granted";
  state.lockWait.blockerTxIds = [];
  emit("ddl-granted", "기존 transaction 종료 뒤 잠금 획득", "충돌 보유자가 사라져 DDL이 진행할 수 있습니다. 잠금 획득과 스키마 변경 완료는 별도의 관찰 단계로 표시합니다.",
    { txId: state.lockWait.ddlTxId });
  state.lockWait.status = "released";
  state.lockWait.ddlStatus = "committed";
  model.addColumn("ddl-applied", true);
}

export function migrationsFrames(options = {}) {
  if (options === null || typeof options !== "object" || Array.isArray(options) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(options)))
    throw new TypeError("Migration options must be a plain object");
  if (Reflect.ownKeys(options).some((key) => key !== "scenario"))
    throw new RangeError("Unknown migration option");
  const { scenario = "safe-expand-contract" } = options;
  if (!MIGRATION_SCENARIOS.includes(scenario)) throw new RangeError(`Unknown migration scenario: ${String(scenario)}`);
  const model = scene(scenario);
  model.emit("initial", "같은 상품, 옛 이름을 쓰는 앱", "상품101·102·103의 name을 옛 앱이 읽고 씁니다. display_name은 아직 현재 스키마에 없습니다.");
  if (scenario === "immediate-rename") immediateRename(model);
  else if (scenario === "safe-expand-contract") safeExpandContract(model, false);
  else if (scenario === "interrupted-backfill") safeExpandContract(model, true);
  else if (scenario === "old-writer-remains") oldWriterRemains(model);
  else ddlWait(model);
  return freeze(model.frames);
}

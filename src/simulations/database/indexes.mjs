// Bounded, synthetic page and key-order diagrams. No SQL or database is executed.
const freeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const plain = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const optionsObject = (value, allowed) => {
  if (!plain(value)) throw new TypeError("Options must be a plain object");
  if (Reflect.ownKeys(value).some((key) => !allowed.includes(key)))
    throw new RangeError("Unknown option");
};
const choose = (value, choices, name) => {
  if (!choices.includes(value)) throw new RangeError(`Unknown ${name}: ${String(value)}`);
  return value;
};
const dateForDay = (day) =>
  new Date(Date.UTC(2026, 0, day)).toISOString().replace(".000Z", "Z");
const rangeFor = (fromDay, toDay) => ({
  fromDay, toDay, fromInclusive: dateForDay(fromDay), toExclusive: dateForDay(toDay + 1),
});
const measure = (value, unit) => ({ value, unit });
const unique = (values) => [...new Set(values)];
const sortedIds = (values) => unique(values).sort((a, b) => a - b);

export const INDEX_LAYOUTS = Object.freeze(["ordered", "scattered"]);
export const INDEX_QUERIES = Object.freeze(["narrow", "wide", "all", "empty"]);
export const INDEX_PATHS = Object.freeze(["scan", "index"]);

const FIXTURE_ASSUMPTIONS = freeze([
  "가상 주문 64행(2001–2064), 데이터 8페이지와 페이지당 8개 슬롯을 쓰는 교육용 배치입니다.",
  "day 1은 2026-01-01 UTC이며 날짜는 하루씩 증가합니다. day 64는 2026-03-05입니다.",
  "ordered와 scattered는 같은 행의 위치만 바꿉니다. PostgreSQL의 기본 키가 저장 순서를 정한다는 뜻이 아닙니다.",
  "별도 인덱스는 루트 1페이지와 리프 4페이지, 리프당 16개 항목입니다. 실제 페이지 용량·트리 높이가 아닙니다.",
  "인덱스 키는 created_at, 포인터는 정확한 데이터 페이지와 0부터 시작하는 슬롯을 가리킵니다.",
]);

export function createIndexFixture(layout = "ordered") {
  choose(layout, INDEX_LAYOUTS, "layout");
  const rows = Array.from({ length: 64 }, (_, i) => ({
    id: 2001 + i, customer_id: (i % 3) + 1, created_at: dateForDay(i + 1), day: i + 1,
  }));
  const heapPages = Array.from({ length: 8 }, (_, i) => ({ id: `heap:${i}`, slots: [] }));
  const leafPageIds = Array.from({ length: 4 }, (_, i) => `index:leaf:${i}`);
  const entries = rows.map((row, i) => {
    const location = layout === "ordered" ? i : (i * 17) % 64;
    const page = heapPages[Math.floor(location / 8)];
    const slot = location % 8;
    page.slots.push({ slot, rowId: row.id });
    return {
      id: `entry:${row.id}`, rowId: row.id, key: row.created_at, day: row.day,
      leafPageId: leafPageIds[Math.floor(i / 16)], heapPageId: page.id, slot,
    };
  });
  heapPages.forEach((page) => page.slots.sort((a, b) => a.slot - b.slot));
  const rootPageId = "index:root";
  const indexPages = [{
    id: rootPageId, kind: "root",
    children: leafPageIds.map((pageId, i) => ({
      pageId, lowerBoundKey: entries[i * 16].key, lowerBoundDay: entries[i * 16].day,
    })),
  }, ...leafPageIds.map((id, i) => ({
    id, kind: "leaf", entries: entries.slice(i * 16, (i + 1) * 16),
    nextPageId: leafPageIds[i + 1] ?? null,
  }))];
  return freeze({
    layout, rows, heapPages, indexPages, entries, rootPageId, leafPageIds,
    assumptions: FIXTURE_ASSUMPTIONS,
  });
}

const READ_ASSUMPTIONS = freeze([
  "비교 단위는 서로 다른 접근 페이지 수입니다. 경과 시간·물리 디스크 I/O·PostgreSQL planner cost가 아닙니다.",
  "같은 페이지를 다시 만지는 이벤트도 보존하지만 페이지 개수에는 한 번만 셉니다.",
  "리프의 키 비교 후 해당 리프의 일치 항목을 데이터 페이지별로 묶어 관찰합니다. 실제 실행기의 처리 순서 재현이 아닙니다.",
  "끝을 확인하려면 범위 다음 키 또는 마지막 리프의 끝 표시를 실제로 관찰합니다. 0행도 탐색이 공짜는 아닙니다.",
  "선택 항목의 포인터는 위치 관계입니다. 범위 다음 키를 선택해도 그 데이터 페이지를 방문하거나 그 행을 반환한 것은 아닙니다.",
  "반환 행 표시는 ORDER BY id로 정렬합니다. 다른 ORDER BY 없는 SQL의 반환 순서를 보장하지 않습니다.",
  "cache·bitmap scan·index-only scan·MVCC·병렬 처리·통계와 실제 I/O는 생략합니다. 어떤 경로가 실제로 더 빠른지는 판정하지 않습니다.",
]);

function sqlFor(range, customerId = null) {
  return [
    "SELECT id, customer_id, created_at",
    "FROM synthetic_orders",
    `WHERE ${customerId === null ? "" : `customer_id = ${customerId} AND `}created_at >= TIMESTAMPTZ '${range.fromInclusive}'`,
    `  AND created_at < TIMESTAMPTZ '${range.toExclusive}'`,
    "ORDER BY id;",
  ].join("\n");
}

export function indexFrames(options = {}) {
  optionsObject(options, ["layout", "query", "path"]);
  const { layout = "ordered", query = "narrow", path = "index" } = options;
  choose(layout, INDEX_LAYOUTS, "layout");
  choose(query, INDEX_QUERIES, "query");
  choose(path, INDEX_PATHS, "path");
  const fixture = createIndexFixture(layout);
  const range = {
    narrow: rangeFor(1, 4), wide: rangeFor(1, 32),
    all: rangeFor(1, 64), empty: rangeFor(65, 68),
  }[query];
  const inRange = (row) => row.created_at >= range.fromInclusive && row.created_at < range.toExclusive;
  const events = [];
  const add = (kind, values) => {
    events.push({
      id: `access:${events.length}`, kind, indexPageId: null, heapPageId: null,
      selectedChildPageId: null, comparisons: [], routingComparisons: [],
      comparedRowIds: [], returnedRowIds: [], selectedEntry: null, stopProof: null,
      ...values,
    });
  };
  if (path === "scan") {
    for (const page of fixture.heapPages) {
      const rows = page.slots.map((slot) => fixture.rows.find((row) => row.id === slot.rowId));
      add("heap", {
        heapPageId: page.id, comparedRowIds: rows.map((row) => row.id),
        returnedRowIds: rows.filter(inRange).map((row) => row.id),
        title: `${page.id}의 8행 확인`,
        detail: "인덱스 없이 이 페이지의 모든 행에 날짜 조건을 확인합니다.",
        stopProof: page === fixture.heapPages.at(-1) ? {
          kind: "heap-exhausted", pageId: page.id, entry: null,
          detail: "데이터 8페이지의 모든 행에 조건을 확인했습니다.",
        } : null,
      });
    }
  } else {
    const root = fixture.indexPages[0];
    const routingComparisons = [];
    let selectedChildPageId = root.children[0].pageId;
    for (const child of root.children) {
      const before = child.lowerBoundKey <= range.fromInclusive;
      routingComparisons.push({
        pageId: child.pageId, key: child.lowerBoundKey, day: child.lowerBoundDay,
        relation: before ? "at-or-before" : "after",
      });
      if (!before) break;
      selectedChildPageId = child.pageId;
    }
    add("root", {
      indexPageId: root.id, selectedChildPageId, routingComparisons,
      title: "루트에서 시작 리프로",
      detail: `시작 날짜와 분기 키를 비교하여 ${selectedChildPageId}로 이동합니다.`,
    });
    let pageId = selectedChildPageId;
    while (pageId !== null) {
      const leaf = fixture.indexPages.find((page) => page.id === pageId);
      const comparisons = [];
      const matches = [];
      let stopProof = null;
      for (const entry of leaf.entries) {
        const relation = entry.key < range.fromInclusive
          ? "before-range" : entry.key >= range.toExclusive ? "after-range" : "match";
        comparisons.push({
          entryId: entry.id, rowId: entry.rowId, key: entry.key, day: entry.day, relation,
        });
        if (relation === "match") matches.push(entry);
        if (relation === "after-range") {
          stopProof = {
            kind: "next-key", pageId: leaf.id, entry,
            detail: `day ${entry.day} (${entry.key.slice(0, 10)}) 키가 범위 다음임을 확인했습니다.`,
          };
          break;
        }
      }
      if (stopProof === null && leaf.nextPageId === null) {
        stopProof = {
          kind: "end-marker", pageId: leaf.id, entry: null,
          detail: "마지막 리프의 끝 표시를 확인했습니다. 뒤에 더 비교할 키가 없습니다.",
        };
      }
      const selectedEntry = matches[0] ??
        leaf.entries.find((entry) => entry.id === comparisons.at(-1)?.entryId) ?? null;
      add("leaf", {
        indexPageId: leaf.id, comparisons,
        comparedRowIds: comparisons.map((comparison) => comparison.rowId),
        selectedEntry, stopProof, title: `${leaf.id}의 키 확인`,
        detail: `${comparisons.length}개 키를 비교해 ${matches.length}개 일치 항목의 위치를 찾았습니다.${stopProof ? ` ${stopProof.detail}` : " 다음 리프에서 계속 확인합니다."}`,
      });
      // Group within one leaf for a readable educational page event; repeated
      // heap accesses across leaves remain visible in the event history.
      for (const heapPageId of unique(matches.map((entry) => entry.heapPageId))) {
        const group = matches.filter((entry) => entry.heapPageId === heapPageId);
        add("heap", {
          heapPageId, returnedRowIds: group.map((entry) => entry.rowId), selectedEntry: group[0],
          title: `${heapPageId}에서 일치 행 가져오기`,
          detail: `인덱스 항목의 정확한 슬롯 포인터로 ${group.length}행을 가져옵니다. 다른 슬롯의 행은 결과에 넣지 않습니다.`,
        });
      }
      if (stopProof) break;
      pageId = leaf.nextPageId;
    }
  }
  add("complete", {
    title: "같은 결과, 다른 접근 경로",
    detail: "반환 행은 id 순서로 표시합니다. 방문 페이지 수만으로 실제 실행 시간을 결론 내리지 않습니다.",
  });
  const assumptions = [...fixture.assumptions, ...READ_ASSUMPTIONS];
  const frames = [];
  const history = [];
  let selectedEntry = null;
  let stopProof = null;
  const snapshot = (event) => {
    if (event) history.push(event);
    if (event?.selectedEntry) selectedEntry = event.selectedEntry;
    if (event?.stopProof) stopProof = event.stopProof;
    const indexPageIds = unique(history.map((item) => item.indexPageId).filter(Boolean));
    const heapPageIds = unique(history.map((item) => item.heapPageId).filter(Boolean));
    const returnedRowIds = sortedIds(history.flatMap((item) => item.returnedRowIds));
    frames.push({
      scenarioId: `index:${layout}:${query}:${path}`, step: frames.length,
      observationKind: "educational-page-access", layout, query, path, fixture, range,
      sql: sqlFor(range), assumptions, title: event?.title ?? "같은 64행에서 출발",
      detail: event?.detail ?? "날짜 범위와 배치를 고른 뒤 페이지 접근을 한 단계씩 관찰합니다.",
      event, events: [...history], indexPageIds, heapPageIds, returnedRowIds,
      selectedEntry, stopProof,
      measurements: {
        indexPages: measure(indexPageIds.length, "페이지"),
        heapPages: measure(heapPageIds.length, "페이지"),
        totalPages: measure(indexPageIds.length + heapPageIds.length, "서로 다른 페이지"),
        keyComparisons: measure(history.reduce((sum, item) =>
          sum + item.comparisons.length + item.routingComparisons.length, 0), "키 비교"),
        rowComparisons: measure(path === "scan"
          ? history.reduce((sum, item) => sum + item.comparedRowIds.length, 0) : 0, "행 조건 확인"),
        returnedRows: measure(returnedRowIds.length, "행"),
      },
      finished: event?.kind === "complete",
    });
  };
  snapshot(null);
  events.forEach(snapshot);
  return freeze(frames);
}

export function indexWriteFrames(options = {}) {
  optionsObject(options, ["operation", "indexed"]);
  const { operation = "insert", indexed = true } = options;
  choose(operation, ["insert", "indexed-key-update"], "write operation");
  if (typeof indexed !== "boolean") throw new TypeError("indexed must be boolean");
  const before = operation === "insert" ? null : createIndexFixture().rows[0];
  const after = {
    id: before?.id ?? 2065, customer_id: before?.customer_id ?? 2,
    created_at: dateForDay(65), day: 65,
  };
  const indexChange = {
    kind: !indexed ? "none" : before ? "move" : "add",
    before: indexed && before ? {
      rowId: before.id, key: before.created_at, leafPageId: "index:leaf:0",
    } : null,
    after: indexed ? {
      rowId: after.id, key: after.created_at, leafPageId: "index:leaf:3",
    } : null,
  };
  const assumptions = [
    "이 장면은 한 논리적 쓰기가 영향을 주는 구조의 전후 관계입니다. DB의 실제 중간 상태나 물리 쓰기 순서가 아닙니다.",
    "논리 레코드 1개와 인덱스 항목의 추가·이동만 셉니다. 페이지 쓰기 수·I/O·시간을 계산하지 않습니다.",
    "PostgreSQL의 tuple version·HOT·WAL·vacuum·페이지 분할과 동시성은 생략합니다. 기존 heap tuple을 제자리에서 덮어쓴다는 뜻이 아닙니다.",
    "끝 리프에 여유가 있는 고정 예시입니다. 읽기 실험의 64행·8페이지 배치를 바꾸거나 삽입 후 페이지 수를 추정하지 않습니다.",
    "도식의 전후 모습은 하나의 논리적 변경을 설명합니다. 레코드와 인덱스가 어긋난 상태를 외부에 게시하는 단계가 아닙니다.",
  ];
  const events = [{
    id: "write:0", kind: "logical-record", structureId: "logical-records",
    leafPageIds: [], recordChanges: 1, entryAdditions: 0, entryRemovals: 0,
    title: before ? "같은 행 id의 날짜 변경" : "새 논리 레코드 추가",
    detail: before
      ? `${before.id}의 날짜가 ${before.created_at.slice(0, 10)}에서 ${after.created_at.slice(0, 10)}로 바뀝니다.`
      : `${after.id}, ${after.created_at.slice(0, 10)}의 레코드가 추가됩니다.`,
  }];
  if (indexed) events.push({
    id: "write:1", kind: "index-entry", structureId: "created-at-index",
    leafPageIds: unique([indexChange.before?.leafPageId, indexChange.after.leafPageId].filter(Boolean)),
    recordChanges: 0, entryAdditions: 1, entryRemovals: before ? 1 : 0,
    title: before ? "정렬된 키 항목도 이동" : "새 키 항목도 추가",
    detail: before
      ? "이전 키의 항목을 빼고 새 날짜 위치에 같은 행 id의 항목을 놓는 논리적 영향을 표시합니다."
      : "created_at 인덱스가 있으면 새 레코드를 찾을 키 항목도 함께 추가해야 합니다.",
  });
  events.push({
    id: `write:${events.length}`, kind: "complete", structureId: null,
    leafPageIds: [], recordChanges: 0, entryAdditions: 0, entryRemovals: 0,
    title: "읽는 길을 유지하는 쓰기 부담",
    detail: indexed ? "논리 레코드 외에 인덱스 구조도 변경의 영향을 받습니다."
      : "이 비교에는 created_at 인덱스가 없으므로 해당 인덱스 항목 변경도 없습니다.",
  });
  const history = [];
  const frames = [];
  const snapshot = (event) => {
    if (event) history.push(event);
    const affectedStructureIds = unique(history.map((item) => item.structureId).filter(Boolean));
    frames.push({
      scenarioId: `index-write:${operation}:${indexed}`, step: frames.length,
      observationKind: "logical-write-impact", operation, indexed, assumptions,
      title: event?.title ?? "어떤 구조가 달라질까?",
      detail: event?.detail ?? "예정된 논리적 변경의 전후를 보고 영향을 받는 구조를 확인합니다.",
      record: { before, after }, indexChange, event, events: [...history],
      affectedStructureIds, affectedLeafPageIds: unique(history.flatMap((item) => item.leafPageIds)),
      measurements: {
        logicalRecordChanges: measure(history.reduce((sum, item) => sum + item.recordChanges, 0), "논리 레코드"),
        indexEntryAdditions: measure(history.reduce((sum, item) => sum + item.entryAdditions, 0), "항목"),
        indexEntryRemovals: measure(history.reduce((sum, item) => sum + item.entryRemovals, 0), "항목"),
        affectedStructures: measure(affectedStructureIds.length, "구조"),
      },
      finished: event?.kind === "complete",
    });
  };
  snapshot(null);
  events.forEach(snapshot);
  return freeze(frames);
}

// This extension accepts only the fixed teaching fixture, not arbitrary user
// data or an implicit general-purpose database/index implementation.
function assertTeachingFixture(fixture) {
  if (!plain(fixture)) throw new TypeError("fixture must be an index fixture");
  choose(fixture.layout, INDEX_LAYOUTS, "fixture layout");
  const expected = createIndexFixture(fixture.layout);
  const equal = (a, b) => {
    if (a === b) return true;
    if (Array.isArray(a) || Array.isArray(b)) {
      if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    } else if (!plain(a) || !plain(b)) return false;
    const keys = Reflect.ownKeys(a);
    return keys.length === Reflect.ownKeys(b).length &&
      keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]));
  };
  if (!equal(fixture, expected))
    throw new RangeError("fixture must preserve the declared 64-row teaching structure");
}

export function compositeIndexSpans(options = {}) {
  optionsObject(options, ["customerId", "fixture"]);
  const { customerId, fixture = createIndexFixture() } = options;
  if (customerId !== undefined && (!Number.isSafeInteger(customerId) || customerId < 1))
    throw new RangeError("customerId must be a positive safe integer");
  assertTeachingFixture(fixture);
  // Copy the validated fixture so freezing output never freezes a caller's clone.
  const ownedFixture = createIndexFixture(fixture.layout);
  const selectedCustomerId = customerId ?? null;
  const range = rangeFor(9, 16);
  const sampleRows = ownedFixture.rows.slice(0, 16);
  const entries = [...sampleRows]
    .sort((a, b) => a.customer_id - b.customer_id || a.created_at.localeCompare(b.created_at))
    .map((row, position) => ({
      id: `composite-entry:${row.id}`, position, rowId: row.id,
      customerId: row.customer_id, key: row.created_at, day: row.day,
      matches: (selectedCustomerId === null || row.customer_id === selectedCustomerId) &&
        row.created_at >= range.fromInclusive && row.created_at < range.toExclusive,
    }));
  const customerGroups = [];
  const spans = [];
  for (const entry of entries) {
    let group = customerGroups.at(-1);
    if (!group || group.customerId !== entry.customerId) {
      group = { customerId: entry.customerId, start: entry.position, endExclusive: entry.position };
      customerGroups.push(group);
    }
    group.endExclusive = entry.position + 1;
    if (!entry.matches) continue;
    let span = spans.at(-1);
    if (!span || span.customerId !== entry.customerId || span.endExclusive !== entry.position) {
      span = {
        customerId: entry.customerId, start: entry.position, endExclusive: entry.position,
        rowIds: [], entryIds: [],
      };
      spans.push(span);
    }
    span.endExclusive = entry.position + 1;
    span.rowIds.push(entry.rowId);
    span.entryIds.push(entry.id);
  }
  const returnedRowIds = sortedIds(entries.filter((entry) => entry.matches).map((entry) => entry.rowId));
  return freeze({
    observationKind: "composite-key-order", fixture: ownedFixture, customerId: selectedCustomerId,
    range, sql: sqlFor(range, selectedCustomerId), sampleRowIds: sampleRows.map((row) => row.id),
    entries, customerGroups, spans, returnedRowIds,
    measurements: {
      spanCount: measure(spans.length, "연속 구간"), matchingRows: measure(returnedRowIds.length, "행"),
    },
    assumptions: [
      "64행 fixture 중 첫 16행(2001–2016)을 뽑아 (customer_id, created_at) 순서로 정렬한 작은 표본 띠입니다. 전체 인덱스가 아닙니다.",
      "날짜 범위는 2026-01-09 이상, 2026-01-17 미만입니다. 이 범위의 일치 행은 모두 표본 안에 있습니다.",
      "고객 조건이 있으면 해당 고객 안의 연속 구간, 날짜 조건만 있으면 여러 고객 구간에 흩어진 일치를 관찰합니다.",
      "이 띠는 키 순서의 기하이지 실제 선택된 실행계획이나 페이지 비용이 아닙니다.",
      "PostgreSQL 18은 조건과 비용에 따라 skip scan을 사용할 수 있습니다. 첫 열 조건이 없으면 복합 인덱스를 절대 사용 못 한다는 뜻이 아닙니다.",
      "반환 행 목록은 ORDER BY id로 표시합니다. 복합 인덱스의 정렬 띠와 결과 표시 순서는 구별합니다.",
    ],
  });
}

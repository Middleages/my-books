import test from "node:test";
import assert from "node:assert/strict";
import {
  INDEX_LAYOUTS, INDEX_QUERIES, INDEX_PATHS, createIndexFixture, indexFrames,
  indexWriteFrames, compositeIndexSpans,
} from "../src/simulations/database/indexes.mjs";

const last = (frames) => frames.at(-1);
const unique = (values) => [...new Set(values)];
const sorted = (values) => [...values].sort((a, b) => a - b);
const day = (n) => new Date(Date.UTC(2026, 0, n)).toISOString().replace(".000Z", "Z");
const inRange = (row, range) =>
  row.created_at >= range.fromInclusive && row.created_at < range.toExclusive;
const expectedIds = (count) => Array.from({ length: count }, (_, i) => 2001 + i);
const assertFrozen = (value) => {
  if (!value || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  Object.values(value).forEach(assertFrozen);
};
const assertPointer = (fixture, entry) => {
  const leaf = fixture.indexPages.find((page) => page.id === entry.leafPageId);
  const page = fixture.heapPages.find((page) => page.id === entry.heapPageId);
  const row = fixture.rows.find((row) => row.id === entry.rowId);
  assert.deepEqual(leaf.entries.find((item) => item.id === entry.id), entry);
  assert.equal(page.slots.find((slot) => slot.slot === entry.slot).rowId, row.id);
  assert.equal(entry.key, row.created_at);
  assert.equal(entry.day, row.day);
};

for (const layout of INDEX_LAYOUTS) {
  test(`${layout}: 64 unique identities occupy exactly eight complete heap pages`, () => {
    const fixture = createIndexFixture(layout);
    assert.equal(fixture.layout, layout);
    assert.deepEqual(fixture.rows.map((row) => row.id), expectedIds(64));
    assert.deepEqual(fixture.rows.map((row) => row.day), Array.from({ length: 64 }, (_, i) => i + 1));
    assert.deepEqual(fixture.rows.map((row) => row.created_at), fixture.rows.map((row) => day(row.day)));
    assert.deepEqual(fixture.rows.map((row) => row.customer_id), fixture.rows.map((_, i) => (i % 3) + 1));
    assert.equal(fixture.rows[31].created_at, "2026-02-01T00:00:00Z");
    assert.equal(fixture.rows[59].created_at, "2026-03-01T00:00:00Z");
    assert.equal(fixture.rows[63].created_at, "2026-03-05T00:00:00Z");
    assert.equal(fixture.heapPages.length, 8);
    const located = [];
    for (const [pageIndex, page] of fixture.heapPages.entries()) {
      assert.equal(page.id, `heap:${pageIndex}`);
      assert.deepEqual(page.slots.map((slot) => slot.slot), [0, 1, 2, 3, 4, 5, 6, 7]);
      for (const slot of page.slots) {
        const ordinal = slot.rowId - 2001;
        const expectedLocation = layout === "ordered" ? ordinal : (ordinal * 17) % 64;
        assert.equal(pageIndex * 8 + slot.slot, expectedLocation);
        located.push(slot.rowId);
      }
    }
    assert.deepEqual(sorted(located), expectedIds(64));
    assert.equal(new Set(located).size, 64);
    assertFrozen(fixture);
  });

  test(`${layout}: root, four leaves, sibling pointers and every entry have real endpoints`, () => {
    const fixture = createIndexFixture(layout);
    const [root, ...leaves] = fixture.indexPages;
    assert.equal(fixture.indexPages.length, 5);
    assert.equal(root.id, fixture.rootPageId);
    assert.equal(root.kind, "root");
    assert.deepEqual(root.children.map((child) => child.pageId), fixture.leafPageIds);
    assert.deepEqual(root.children.map((child) => child.lowerBoundDay), [1, 17, 33, 49]);
    assert.deepEqual(root.children.map((child) => child.lowerBoundKey), [1, 17, 33, 49].map(day));
    assert.equal(fixture.entries.length, 64);
    assert.deepEqual(leaves.flatMap((leaf) => leaf.entries), fixture.entries);
    for (const [i, leaf] of leaves.entries()) {
      assert.equal(leaf.kind, "leaf");
      assert.equal(leaf.entries.length, 16);
      assert.equal(leaf.nextPageId, fixture.leafPageIds[i + 1] ?? null);
      assert.deepEqual(leaf.entries.map((entry) => entry.day),
        Array.from({ length: 16 }, (_, j) => i * 16 + j + 1));
      for (const entry of leaf.entries) {
        assert.equal(entry.id, `entry:${entry.rowId}`);
        assertPointer(fixture, entry);
      }
    }
  });
}

test("layout changes only placement; logical rows and date-to-id mapping are identical", () => {
  const ordered = createIndexFixture();
  const scattered = createIndexFixture("scattered");
  assert.deepEqual(ordered.rows, scattered.rows);
  assert.deepEqual(
    ordered.entries.map(({ heapPageId, slot, ...identity }) => identity),
    scattered.entries.map(({ heapPageId, slot, ...identity }) => identity),
  );
  assert.notDeepEqual(ordered.heapPages, scattered.heapPages);
  assert.equal(new Set(Array.from({ length: 64 }, (_, i) => (i * 17) % 64)).size, 64);
});

const counts = {
  ordered: { narrow: [2, 1, 4], wide: [4, 4, 32], all: [5, 8, 64], empty: [2, 0, 0] },
  scattered: { narrow: [2, 4, 4], wide: [4, 8, 32], all: [5, 8, 64], empty: [2, 0, 0] },
};
for (const layout of INDEX_LAYOUTS) for (const query of INDEX_QUERIES) {
  test(`${layout}/${query}: scan and index return the same exact rows; unique-page arithmetic is not clipped`, () => {
    const scan = last(indexFrames({ layout, query, path: "scan" }));
    const index = last(indexFrames({ layout, query, path: "index" }));
    const [indexPages, heapPages, rowCount] = counts[layout][query];
    const selected = index.fixture.rows.filter((row) => inRange(row, index.range)).map((row) => row.id);
    assert.deepEqual(index.returnedRowIds, expectedIds(rowCount));
    assert.deepEqual(index.returnedRowIds, selected);
    assert.deepEqual(scan.returnedRowIds, index.returnedRowIds);
    assert.deepEqual(scan.fixture, index.fixture);
    assert.equal(scan.measurements.indexPages.value, 0);
    assert.equal(scan.measurements.heapPages.value, 8);
    assert.equal(scan.measurements.totalPages.value, 8);
    assert.equal(scan.measurements.rowComparisons.value, 64);
    assert.equal(scan.measurements.keyComparisons.value, 0);
    assert.equal(index.measurements.indexPages.value, indexPages);
    assert.equal(index.measurements.heapPages.value, heapPages);
    assert.equal(index.measurements.totalPages.value, indexPages + heapPages);
    assert.equal(index.measurements.rowComparisons.value, 0);
    assert.ok(index.measurements.keyComparisons.value > 0);
    assert.equal(index.measurements.returnedRows.value, rowCount);
    assert.equal(scan.measurements.returnedRows.value, rowCount);
    for (const frame of [scan, index]) {
      assert.equal(frame.finished, true);
      assert.match(frame.sql, /ORDER BY id;/);
      assert.ok(frame.sql.includes(frame.range.fromInclusive));
      assert.ok(frame.sql.includes(frame.range.toExclusive));
      assert.ok(frame.assumptions.some((text) => text.includes("planner cost")));
      assert.equal(frame.measurements.totalPages.unit, "서로 다른 페이지");
    }
  });
}

test("wide boundary proves its end by visiting the next leaf and key33, not by free metadata", () => {
  for (const layout of INDEX_LAYOUTS) {
    const frame = last(indexFrames({ layout, query: "wide" }));
    assert.deepEqual(frame.indexPageIds, ["index:root", "index:leaf:0", "index:leaf:1", "index:leaf:2"]);
    assert.equal(frame.stopProof.kind, "next-key");
    assert.equal(frame.stopProof.entry.rowId, 2033);
    assert.equal(frame.stopProof.entry.day, 33);
    assert.equal(frame.stopProof.pageId, "index:leaf:2");
    const boundary = frame.events.find((event) => event.indexPageId === "index:leaf:2");
    assert.deepEqual(boundary.comparedRowIds, [2033]);
    assert.deepEqual(boundary.comparisons.map((comparison) => comparison.relation), ["after-range"]);
    assert.equal(frame.returnedRowIds.includes(2033), false);
    assert.equal(frame.selectedEntry.rowId, 2033);
    assert.ok(frame.assumptions.some((text) => text.includes("방문하거나 그 행을 반환한 것은 아닙니다")));
    assert.deepEqual(boundary.returnedRowIds, []);
    assert.equal(boundary.heapPageId, null);
  }
});

test("narrow reads the next key; all and beyond-end empty really reach the last-leaf end marker", () => {
  const narrow = last(indexFrames());
  assert.equal(narrow.stopProof.kind, "next-key");
  assert.equal(narrow.stopProof.entry.day, 5);
  assert.deepEqual(narrow.events.find((event) => event.kind === "leaf").comparedRowIds, expectedIds(5));
  const all = last(indexFrames({ query: "all" }));
  assert.equal(all.stopProof.kind, "end-marker");
  assert.equal(all.stopProof.pageId, "index:leaf:3");
  assert.equal(all.stopProof.entry, null);
  const empty = last(indexFrames({ query: "empty" }));
  assert.deepEqual(empty.indexPageIds, ["index:root", "index:leaf:3"]);
  assert.deepEqual(empty.heapPageIds, []);
  assert.deepEqual(empty.returnedRowIds, []);
  assert.equal(empty.events.find((event) => event.kind === "root").selectedChildPageId, "index:leaf:3");
  assert.equal(empty.stopProof.kind, "end-marker");
  const leaf = empty.events.find((event) => event.kind === "leaf");
  assert.deepEqual(leaf.comparedRowIds, Array.from({ length: 16 }, (_, i) => 2049 + i));
  assert.ok(leaf.comparisons.every((comparison) => comparison.relation === "before-range"));
  assert.equal(empty.measurements.totalPages.value, 2);
  assert.equal(empty.range.fromInclusive, "2026-03-06T00:00:00Z");
  assert.equal(empty.range.toExclusive, "2026-03-10T00:00:00Z");
});

for (const layout of INDEX_LAYOUTS) for (const query of INDEX_QUERIES) for (const path of INDEX_PATHS) {
  test(`${layout}/${query}/${path}: every frame replays only its prefix of real page events`, () => {
    const frames = indexFrames({ layout, query, path });
    const seenMatches = new Set();
    let selectedEntry = null;
    let stopProof = null;
    for (const [step, frame] of frames.entries()) {
      assert.equal(frame.step, step);
      assert.equal(frame.finished, step === frames.length - 1);
      assert.equal(frame.events.length, step);
      assert.equal(frame.event, frame.events.at(-1) ?? null);
      assert.deepEqual(frame.events, last(frames).events.slice(0, step));
      assert.deepEqual(frame.indexPageIds, unique(frame.events.map((event) => event.indexPageId).filter(Boolean)));
      assert.deepEqual(frame.heapPageIds, unique(frame.events.map((event) => event.heapPageId).filter(Boolean)));
      const returned = frame.events.flatMap((event) => event.returnedRowIds);
      assert.equal(returned.length, new Set(returned).size);
      assert.deepEqual(frame.returnedRowIds, sorted(returned));
      assert.equal(frame.measurements.indexPages.value, frame.indexPageIds.length);
      assert.equal(frame.measurements.heapPages.value, frame.heapPageIds.length);
      assert.equal(frame.measurements.totalPages.value, frame.indexPageIds.length + frame.heapPageIds.length);
      assert.equal(frame.measurements.returnedRows.value, returned.length);
      assert.equal(frame.measurements.keyComparisons.value, frame.events.reduce((sum, event) =>
        sum + event.comparisons.length + event.routingComparisons.length, 0));
      assert.equal(frame.measurements.rowComparisons.value, path === "scan" ? frame.events.reduce((sum, event) =>
        sum + event.comparedRowIds.length, 0) : 0);
      const event = frame.event;
      if (!event) {
        assert.deepEqual(frame.indexPageIds, []);
        assert.deepEqual(frame.heapPageIds, []);
        assert.deepEqual(frame.returnedRowIds, []);
        assert.equal(frame.measurements.totalPages.value, 0);
        continue;
      }
      assert.equal(event.id, `access:${step - 1}`);
      if (event.selectedEntry) selectedEntry = event.selectedEntry;
      if (event.stopProof) stopProof = event.stopProof;
      assert.deepEqual(frame.selectedEntry, selectedEntry);
      assert.deepEqual(frame.stopProof, stopProof);
      if (frame.selectedEntry) assertPointer(frame.fixture, frame.selectedEntry);
      if (event.indexPageId)
        assert.ok(frame.fixture.indexPages.some((page) => page.id === event.indexPageId));
      if (event.kind === "root") {
        assert.equal(event.heapPageId, null);
        assert.ok(frame.fixture.leafPageIds.includes(event.selectedChildPageId));
        const children = frame.fixture.indexPages[0].children;
        assert.deepEqual(event.routingComparisons.map((comparison) => comparison.key),
          children.slice(0, event.routingComparisons.length).map((child) => child.lowerBoundKey));
        for (const comparison of event.routingComparisons)
          assert.equal(comparison.relation, comparison.key <= frame.range.fromInclusive ? "at-or-before" : "after");
      }
      if (event.kind === "leaf") {
        const leaf = frame.fixture.indexPages.find((page) => page.id === event.indexPageId);
        assert.equal(event.heapPageId, null);
        assert.deepEqual(event.comparedRowIds, event.comparisons.map((comparison) => comparison.rowId));
        for (const comparison of event.comparisons) {
          const entry = leaf.entries.find((item) => item.id === comparison.entryId);
          assert.ok(entry);
          assert.equal(comparison.key, entry.key);
          assert.equal(comparison.rowId, entry.rowId);
          const expected = entry.key < frame.range.fromInclusive ? "before-range"
            : entry.key >= frame.range.toExclusive ? "after-range" : "match";
          assert.equal(comparison.relation, expected);
          if (expected === "match") seenMatches.add(entry.rowId);
        }
      }
      if (event.kind === "heap") {
        const page = frame.fixture.heapPages.find((page) => page.id === event.heapPageId);
        assert.ok(page);
        if (path === "scan")
          assert.deepEqual(event.comparedRowIds, page.slots.map((slot) => slot.rowId));
        else assert.deepEqual(event.comparedRowIds, []);
        for (const id of event.returnedRowIds) {
          assert.ok(page.slots.some((slot) => slot.rowId === id));
          assert.ok(inRange(frame.fixture.rows.find((row) => row.id === id), frame.range));
          if (path === "index") assert.ok(seenMatches.has(id));
        }
        if (path === "index") assert.equal(event.selectedEntry.heapPageId, event.heapPageId);
      }
      if (event.stopProof?.kind === "next-key") {
        assert.ok(event.comparisons.some((comparison) =>
          comparison.entryId === event.stopProof.entry.id && comparison.relation === "after-range"));
        assert.equal(event.indexPageId, event.stopProof.pageId);
      }
      if (event.stopProof?.kind === "end-marker") {
        assert.equal(frame.fixture.indexPages.find((page) => page.id === event.stopProof.pageId).nextPageId, null);
        assert.equal(event.comparisons.at(-1).day, 64);
      }
      if (event.kind === "complete") {
        assert.equal(event.indexPageId, null);
        assert.equal(event.heapPageId, null);
        assert.deepEqual(event.comparedRowIds, []);
        assert.deepEqual(event.returnedRowIds, []);
        assert.deepEqual(frame.measurements, frames[step - 1].measurements);
      }
    }
  });
}

test("repeated scattered heap events remain recorded but unique-page accounting counts each once", () => {
  const frame = last(indexFrames({ layout: "scattered", query: "all" }));
  const visits = frame.events.filter((event) => event.kind === "heap").map((event) => event.heapPageId);
  assert.ok(visits.length > new Set(visits).size);
  assert.equal(new Set(visits).size, 8);
  assert.equal(frame.measurements.totalPages.value, 13);
  assert.equal(last(indexFrames({ layout: "scattered", query: "wide" })).measurements.totalPages.value, 12);
  assert.equal(last(indexFrames({ layout: "ordered", query: "wide" })).measurements.totalPages.value, 8);
});

for (const operation of ["insert", "indexed-key-update"]) for (const indexed of [false, true]) {
  test(`${operation}/${indexed}: write impact counts logical structures and never fabricates physical writes`, () => {
    const frames = indexWriteFrames({ operation, indexed });
    const frame = last(frames);
    assert.equal(frame.observationKind, "logical-write-impact");
    assert.equal(frame.record.after.id, operation === "insert" ? 2065 : 2001);
    assert.equal(frame.record.after.created_at, day(65));
    assert.equal(frame.record.after.day, 65);
    if (operation === "insert") assert.equal(frame.record.before, null);
    else {
      assert.equal(frame.record.before.id, frame.record.after.id);
      assert.equal(frame.record.before.customer_id, frame.record.after.customer_id);
      assert.equal(frame.record.before.created_at, day(1));
    }
    assert.equal(frame.indexChange.kind, !indexed ? "none" : operation === "insert" ? "add" : "move");
    assert.deepEqual(frame.affectedStructureIds, indexed
      ? ["logical-records", "created-at-index"] : ["logical-records"]);
    assert.deepEqual(frame.affectedLeafPageIds, !indexed ? []
      : operation === "insert" ? ["index:leaf:3"] : ["index:leaf:0", "index:leaf:3"]);
    assert.equal(frame.measurements.logicalRecordChanges.value, 1);
    assert.equal(frame.measurements.indexEntryAdditions.value, indexed ? 1 : 0);
    assert.equal(frame.measurements.indexEntryRemovals.value, indexed && operation === "indexed-key-update" ? 1 : 0);
    assert.equal(frame.measurements.affectedStructures.value, indexed ? 2 : 1);
    assert.equal("heapPages" in frame.measurements, false);
    assert.equal("physicalWrites" in frame.measurements, false);
    if (!indexed) assert.deepEqual(frame.indexChange, { kind: "none", before: null, after: null });
    else {
      assert.equal(frame.indexChange.after.rowId, frame.record.after.id);
      assert.equal(frame.indexChange.after.key, frame.record.after.created_at);
      if (operation === "indexed-key-update") {
        assert.equal(frame.indexChange.before.rowId, frame.record.before.id);
        assert.equal(frame.indexChange.before.key, frame.record.before.created_at);
      }
    }
    assert.ok(frame.assumptions.some((text) => ["tuple version", "HOT", "WAL", "vacuum", "분할"].every((word) => text.includes(word))));
    for (const [step, current] of frames.entries()) {
      assert.equal(current.step, step);
      assert.equal(current.events.length, step);
      assert.equal(current.event, current.events.at(-1) ?? null);
      assert.equal(current.finished, step === frames.length - 1);
      assert.deepEqual(current.events, frame.events.slice(0, step));
      assert.equal(current.measurements.logicalRecordChanges.value,
        current.events.reduce((sum, event) => sum + event.recordChanges, 0));
      assert.equal(current.measurements.indexEntryAdditions.value,
        current.events.reduce((sum, event) => sum + event.entryAdditions, 0));
      assert.equal(current.measurements.indexEntryRemovals.value,
        current.events.reduce((sum, event) => sum + event.entryRemovals, 0));
      assert.deepEqual(current.affectedStructureIds,
        unique(current.events.map((event) => event.structureId).filter(Boolean)));
      assert.deepEqual(current.affectedLeafPageIds, unique(current.events.flatMap((event) => event.leafPageIds)));
    }
    assertFrozen(frames);
  });
}

test("composite strip uses the first16 known rows, sorts by the actual key pair and distinguishes three spans", () => {
  const result = compositeIndexSpans();
  assert.equal(result.entries.length, 16);
  assert.deepEqual(result.sampleRowIds, expectedIds(16));
  assert.deepEqual(sorted(result.entries.map((entry) => entry.rowId)), result.sampleRowIds);
  assert.deepEqual(result.returnedRowIds, expectedIds(16).slice(8));
  assert.equal(result.spans.length, 3);
  assert.equal(result.measurements.spanCount.value, 3);
  assert.equal(result.measurements.matchingRows.value, 8);
  assert.deepEqual(result.customerGroups.map((group) => group.customerId), [1, 2, 3]);
  assert.deepEqual(result.customerGroups.map((group) => group.endExclusive - group.start), [6, 5, 5]);
  for (const [i, entry] of result.entries.entries()) {
    const row = result.fixture.rows.find((row) => row.id === entry.rowId);
    assert.equal(entry.position, i);
    assert.equal(entry.customerId, row.customer_id);
    assert.equal(entry.key, row.created_at);
    assert.equal(entry.day, row.day);
    assert.equal(entry.matches, inRange(row, result.range));
    if (i > 0) {
      const previous = result.entries[i - 1];
      assert.ok(previous.customerId < entry.customerId ||
        previous.customerId === entry.customerId && previous.key < entry.key);
    }
  }
  for (const span of result.spans) {
    const entries = result.entries.slice(span.start, span.endExclusive);
    assert.ok(entries.every((entry) => entry.matches && entry.customerId === span.customerId));
    assert.deepEqual(entries.map((entry) => entry.rowId), span.rowIds);
    assert.deepEqual(entries.map((entry) => entry.id), span.entryIds);
    assert.ok(span.start === 0 || !result.entries[span.start - 1].matches);
    assert.ok(span.endExclusive === result.entries.length || !result.entries[span.endExclusive].matches);
  }
  assert.deepEqual(sorted(result.spans.flatMap((span) => span.rowIds)), result.returnedRowIds);
  assert.ok(result.assumptions.some((text) => text.includes("skip scan")));
  assert.ok(result.assumptions.some((text) => text.includes("첫 16행")));
  assert.ok(result.assumptions.some((text) => text.includes("실행계획")));
  assert.match(result.sql, /ORDER BY id;/);
});

test("customer equality restricts composite matches to one contiguous prefix-qualified span", () => {
  for (const customerId of [1, 2, 3]) {
    const result = compositeIndexSpans({ customerId });
    assert.equal(result.spans.length, 1);
    assert.equal(result.spans[0].customerId, customerId);
    assert.deepEqual(result.returnedRowIds,
      result.fixture.rows.filter((row) => row.customer_id === customerId && inRange(row, result.range)).map((row) => row.id));
    assert.ok(result.sql.includes(`customer_id = ${customerId}`));
    assert.equal(result.measurements.matchingRows.value, result.returnedRowIds.length);
  }
  const empty = compositeIndexSpans({ customerId: 999 });
  assert.deepEqual(empty.spans, []);
  assert.deepEqual(empty.returnedRowIds, []);
  assert.equal(empty.measurements.spanCount.value, 0);
  assert.equal(empty.measurements.matchingRows.value, 0);
  const ordered = compositeIndexSpans({ fixture: createIndexFixture("ordered") });
  const scattered = compositeIndexSpans({ fixture: createIndexFixture("scattered") });
  assert.deepEqual(ordered.entries, scattered.entries);
  assert.deepEqual(ordered.spans, scattered.spans);
});

test("all outputs are deeply immutable, deterministic and never freeze or mutate caller-owned inputs", () => {
  for (const layout of INDEX_LAYOUTS) for (const query of INDEX_QUERIES) for (const path of INDEX_PATHS) {
    const options = Object.freeze({ layout, query, path });
    const frames = indexFrames(options);
    assert.deepEqual(frames, indexFrames(options));
    assertFrozen(frames);
    assert.throws(() => frames[0].fixture.rows[0].day = 999, TypeError);
    assert.throws(() => last(frames).returnedRowIds.push(999), TypeError);
    assert.throws(() => last(frames).measurements.totalPages.value = 0, TypeError);
    assert.equal(indexFrames(options)[0].fixture.rows[0].day, 1);
  }
  for (const operation of ["insert", "indexed-key-update"]) for (const indexed of [false, true]) {
    const options = Object.freeze({ operation, indexed });
    assert.deepEqual(indexWriteFrames(options), indexWriteFrames(options));
  }
  const clone = structuredClone(createIndexFixture("scattered"));
  const before = structuredClone(clone);
  const options = { fixture: clone, customerId: 2 };
  const result = compositeIndexSpans(options);
  assert.deepEqual(clone, before);
  assert.equal(Object.isFrozen(clone), false);
  assert.equal(Object.isFrozen(clone.rows[0]), false);
  assert.equal(Object.isFrozen(options), false);
  assert.deepEqual(result, compositeIndexSpans(options));
  assertFrozen(result);
  assertFrozen(INDEX_LAYOUTS);
  assertFrozen(INDEX_QUERIES);
  assertFrozen(INDEX_PATHS);
});

test("bounded public functions reject malformed or unknown options rather than silently guessing", () => {
  for (const value of [null, false, 1, "ordered", [], new Date(), new Map()]) {
    assert.throws(() => indexFrames(value), TypeError);
    assert.throws(() => indexWriteFrames(value), TypeError);
    assert.throws(() => compositeIndexSpans(value), TypeError);
  }
  for (const value of ["clustered", null, 1, {}, []])
    assert.throws(() => createIndexFixture(value), RangeError);
  for (const key of ["layout", "query", "path"])
    for (const value of ["other", null, 1, false, []])
      assert.throws(() => indexFrames({ [key]: value }), RangeError);
  assert.throws(() => indexFrames({ layout: "ordered", hidden: true }), /Unknown option/);
  assert.throws(() => indexWriteFrames({ operation: "delete" }), RangeError);
  for (const indexed of [0, 1, "false", null, []])
    assert.throws(() => indexWriteFrames({ indexed }), TypeError);
  assert.throws(() => indexWriteFrames({ indexed: true, physical: true }), /Unknown option/);
  for (const customerId of [null, 0, -1, 1.5, NaN, Infinity, "1", false, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => compositeIndexSpans({ customerId }), RangeError);
  assert.throws(() => compositeIndexSpans({ fromDay: 1 }), /Unknown option/);
  assert.throws(() => compositeIndexSpans({ fixture: null }), TypeError);
  assert.throws(() => compositeIndexSpans({ fixture: {} }), RangeError);
  assert.throws(() => indexFrames({ [Symbol("unknown")]: true }), /Unknown option/);
  assert.deepEqual(indexFrames(Object.create(null)), indexFrames());
});

test("composite fixture rejects forged rows, dates, slots, topology and extra fields", () => {
  const edits = [
    (fixture) => fixture.rows[0].day = 999,
    (fixture) => fixture.rows[0].created_at = "2026-02-30T00:00:00Z",
    (fixture) => fixture.rows[0].customer_id = 999,
    (fixture) => fixture.rows.push({ ...fixture.rows[0] }),
    (fixture) => delete fixture.rows[0],
    (fixture) => fixture.rows.extra = "unrecognized array property",
    (fixture) => fixture.heapPages[0].slots[0].rowId = 2064,
    (fixture) => fixture.entries[0].slot = 7,
    (fixture) => fixture.indexPages[1].nextPageId = null,
    (fixture) => fixture.indexPages[0].children[0].lowerBoundDay = 99,
    (fixture) => fixture.rows[0].secret = "unrecognized",
    (fixture) => fixture.extra = [],
  ];
  for (const edit of edits) {
    const fixture = structuredClone(createIndexFixture());
    edit(fixture);
    assert.throws(() => compositeIndexSpans({ fixture }), /declared 64-row/);
  }
});

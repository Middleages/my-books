import test from "node:test";
import assert from "node:assert/strict";
import { CANONICAL_FIXTURE } from "../src/simulations/database/fixture.mjs";
import { MIGRATION_SCENARIOS, MIGRATION_ASSUMPTIONS, migrationsFrames } from "../src/simulations/database/migrations.mjs";

const phase = (frames, name) => {
  const result = frames.find((frame) => frame.phase === name);
  assert.ok(result, `Missing phase: ${name}`);
  return result;
};
const product = (frame, id) => frame.rows.find((row) => row.productId === id);
const columns = (frame) => frame.schemaColumns.map((column) => column.name);
const deepFrozen = (value) => {
  if (!value || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  Object.values(value).forEach(deepFrozen);
};

test("migration API has exactly five fixed scenarios and a safe default", () => {
  assert.deepEqual(MIGRATION_SCENARIOS, [
    "immediate-rename", "safe-expand-contract", "old-writer-remains", "interrupted-backfill", "ddl-wait",
  ]);
  assert.deepEqual(migrationsFrames(), migrationsFrames({ scenario: "safe-expand-contract" }));
  assert.ok(MIGRATION_ASSUMPTIONS.some((text) => text.includes("xmin")));
  assert.ok(MIGRATION_ASSUMPTIONS.some((text) => text.includes("NULL 읽기 자체가 SQL 오류")));
  deepFrozen(MIGRATION_SCENARIOS);
  deepFrozen(MIGRATION_ASSUMPTIONS);
});

test("invalid migration options are rejected without coercing a scenario", () => {
  for (const value of [null, [], "safe-expand-contract", 3, true, new Date(), Object.create({})])
    assert.throws(() => migrationsFrames(value), TypeError);
  for (const scenario of ["safe", "", null, false, 1, {}, [], Symbol("safe")])
    assert.throws(() => migrationsFrames({ scenario }), RangeError);
  for (const value of [{ extra: true }, { scenario: "ddl-wait", rows: [] }, { [Symbol("scenario")]: "ddl-wait" }])
    assert.throws(() => migrationsFrames(value), RangeError);
  assert.deepEqual(migrationsFrames(Object.create(null)), migrationsFrames());
});

for (const scenario of MIGRATION_SCENARIOS) {
  test(`${scenario}: immutable deterministic reset with canonical product identity`, () => {
    const before = structuredClone(CANONICAL_FIXTURE);
    const frames = migrationsFrames({ scenario });
    const reset = migrationsFrames({ scenario });
    assert.deepEqual(frames, reset);
    assert.notEqual(frames, reset);
    deepFrozen(frames);
    assert.equal(frames.filter((frame) => frame.finished).length, 1);
    assert.equal(frames.at(-1).finished, true);
    assert.equal(new Set(frames.map((frame) => frame.id)).size, frames.length);
    assert.deepEqual(frames[0].rows.map((row) => row.values), CANONICAL_FIXTURE.products);
    for (const [step, frame] of frames.entries()) {
      assert.equal(frame.step, step);
      assert.equal(frame.scenario, scenario);
      assert.equal(frame.event, frame.currentEvent);
      assert.deepEqual(frame.changedRowKeys, frame.event.rowKeys);
      assert.equal(frame.event.rowKeys.length, frame.event.beforeVersionIds.length);
      assert.equal(frame.event.rowKeys.length, frame.event.afterVersionIds.length);
      assert.deepEqual(frame.rows.map((row) => row.productId), [101, 102, 103]);
      for (const row of frame.rows) {
        const original = CANONICAL_FIXTURE.products.find((entry) => entry.id === row.productId);
        assert.equal(row.rowKey, `products:${row.productId}`);
        assert.equal(row.values.id, original.id);
        assert.equal(row.values.unit_price_won, original.unit_price_won);
        assert.equal(row.values.available_qty, original.available_qty);
        assert.deepEqual(Object.keys(row.values).sort(), columns(frame).sort(), "Absent columns must be absent, not NULL placeholders");
        const version = frame.versions.find((entry) => entry.versionId === row.versionId);
        assert.ok(version);
        assert.deepEqual(version.values, row.values);
        assert.equal(version.version, row.version);
        assert.equal(version.rowKey, row.rowKey);
        assert.ok(version.createdAtStep <= step);
        if (version.previousVersionId) {
          const previous = frame.versions.find((entry) => entry.versionId === version.previousVersionId);
          assert.equal(previous.rowKey, row.rowKey);
          assert.equal(previous.version + 1, version.version);
        }
      }
      for (const [index, key] of frame.event.rowKeys.entries()) {
        const row = frame.rows.find((candidate) => candidate.rowKey === key);
        assert.equal(row.versionId, frame.event.afterVersionIds[index]);
        assert.ok(frame.versions.some((entry) => entry.versionId === frame.event.beforeVersionIds[index]));
      }
    }
    assert.throws(() => { frames[0].rows[0].values.name = "mutated"; }, TypeError);
    assert.throws(() => { frames[0].schemaColumns.push({}); }, TypeError);
    assert.deepEqual(CANONICAL_FIXTURE, before);
    assert.deepEqual(migrationsFrames({ scenario }), reset);
  });

  test(`${scenario}: capability edges and gates are derived from this frame's schema and rows`, () => {
    for (const frame of migrationsFrames({ scenario })) {
      const names = columns(frame);
      const available = names.includes("display_name");
      const comparable = available && names.includes("name");
      const filled = available ? frame.rows.filter((row) => row.values.display_name !== null).length : 0;
      const equal = comparable ? frame.rows.filter((row) => row.values.display_name !== null && row.values.display_name === row.values.name).length : 0;
      assert.deepEqual(frame.validation.fill, { available, filled, total: 3, complete: available && filled === 3 });
      assert.deepEqual(frame.validation.equality, {
        available: comparable, equal, total: 3, complete: comparable && equal === 3,
        mismatchedRowKeys: comparable ? frame.rows.filter((row) =>
          row.values.display_name !== null && row.values.display_name !== row.values.name).map((row) => row.rowKey) : [],
      });
      const activeApps = frame.appCapabilities.filter((app) => app.active);
      assert.deepEqual(frame.activeWriters, activeApps.map((app) => app.id));
      const activeOldEdges = frame.capabilityEdges.filter((edge) => edge.column === "name" && edge.status !== "inactive");
      assert.equal(frame.validation.oldReferenceCount, activeOldEdges.length);
      assert.equal(frame.validation.oldReaderCount, activeOldEdges.filter((edge) => edge.operation === "read").length);
      assert.equal(frame.validation.oldWriterCount, activeOldEdges.filter((edge) => edge.operation === "write").length);
      assert.equal(frame.validation.oldOnlyWriterCount, activeApps.filter((app) =>
        app.writeColumns.includes("name") && !app.writeColumns.includes("display_name")).length);
      assert.deepEqual(frame.failedReferences, frame.capabilityEdges.filter((edge) => edge.status === "missing-column"));
      for (const edge of frame.capabilityEdges) {
        const app = frame.appCapabilities.find((candidate) => candidate.id === edge.appId);
        const target = frame.schemaColumns.find((column) => column.name === edge.column);
        assert.equal(edge.columnId, target?.id ?? null);
        assert.ok(app[`${edge.operation}Columns`].includes(edge.column));
        if (!app.active) assert.equal(edge.status, "inactive");
        else if (!target) assert.equal(edge.status, "missing-column");
        else if (edge.operation === "read" && frame.rows.some((row) => row.values[edge.column] === null))
          assert.equal(edge.status, "unfilled");
        else assert.equal(edge.status, "ready");
      }
      if (frame.validation.canSwitchToNew) {
        assert.equal(frame.validation.oldOnlyWriterCount, 0);
        assert.equal(frame.validation.fill.complete, true);
        assert.equal(frame.validation.equality.complete, true);
        assert.equal(frame.lastVerification.current, true);
        assert.equal(frame.lastVerification.passed, true);
      }
      if (frame.validation.canDropOld) {
        assert.equal(frame.validation.canSwitchToNew, true);
        assert.equal(frame.validation.oldReferenceCount, 0);
        assert.ok(activeApps.some((app) => app.role === "new"));
      }
      if (frame.lastVerification?.current) {
        assert.equal(comparable, true);
        assert.deepEqual(frame.lastVerification.rowVersionIds, frame.rows.map((row) => row.versionId));
      }
    }
  });
}

test("immediate rename preserves values and column identity but breaks old read and write references", () => {
  const frames = migrationsFrames({ scenario: "immediate-rename" });
  const renamed = phase(frames, "rename");
  const originalColumn = frames[0].schemaColumns.find((column) => column.name === "name");
  const renamedColumn = renamed.schemaColumns.find((column) => column.name === "display_name");
  assert.equal(renamedColumn.id, originalColumn.id);
  assert.equal(renamedColumn.nullable, false);
  assert.equal(columns(renamed).includes("name"), false);
  for (const row of renamed.rows) {
    assert.equal(row.values.display_name, CANONICAL_FIXTURE.products.find((entry) => entry.id === row.productId).name);
    assert.equal(Object.hasOwn(row.values, "name"), false);
  }
  assert.equal(renamed.validation.fill.complete, true);
  assert.equal(renamed.validation.equality.available, false);
  assert.deepEqual(renamed.failedReferences.map((edge) => [edge.role, edge.operation, edge.column, edge.columnId]),
    [["old", "read", "name", null], ["old", "write", "name", null]]);
  assert.equal(renamed.appCapabilities.find((app) => app.role === "old").readReady, false);
  assert.equal(renamed.appCapabilities.find((app) => app.role === "old").writeReady, false);
  assert.equal(renamed.appCapabilities.find((app) => app.role === "new").readReady, true);
  assert.deepEqual(frames.at(-1).rows, renamed.rows);
});

test("expand adds a distinct nullable column and keeps old readers and writers compatible", () => {
  const frames = migrationsFrames();
  const expanded = phase(frames, "expand");
  const oldColumn = expanded.schemaColumns.find((column) => column.name === "name");
  const newColumn = expanded.schemaColumns.find((column) => column.name === "display_name");
  assert.notEqual(oldColumn.id, newColumn.id);
  assert.equal(newColumn.nullable, true);
  assert.ok(expanded.rows.every((row) => row.values.display_name === null));
  assert.equal(expanded.validation.fill.filled, 0);
  assert.equal(expanded.appCapabilities.find((app) => app.role === "old").readReady, true);
  assert.equal(expanded.appCapabilities.find((app) => app.role === "new").readReady, false);
  for (const frame of frames) {
    assert.equal(frame.failedReferences.length, 0);
    for (const app of frame.appCapabilities.filter((entry) => entry.active)) {
      assert.equal(app.readReady, true);
      assert.equal(app.writeReady, true);
    }
  }
});

test("safe path removes old-only writers before backfill and all bridge references before drop", () => {
  const frames = migrationsFrames();
  const retired = phase(frames, "retire-old-writer");
  assert.equal(retired.validation.oldOnlyWriterCount, 0);
  assert.equal(retired.validation.oldReaderCount, 1);
  assert.equal(retired.validation.oldWriterCount, 1);
  assert.equal(retired.validation.oldReferenceCount, 2);
  assert.equal(retired.validation.canBackfill, true);
  assert.equal(retired.validation.canDropOld, false);
  assert.ok(retired.step < phase(frames, "backfill-first").step);
  const filled = phase(frames, "backfill-rest");
  assert.equal(filled.validation.fill.complete, true);
  assert.equal(filled.validation.equality.complete, true);
  assert.equal(filled.validation.canSwitchToNew, false, "An explicit current-version check is still required");
  const verified = phase(frames, "verify");
  assert.equal(verified.validation.canSwitchToNew, true);
  assert.equal(verified.validation.canDropOld, false, "Bridge reads and writes still reference name");
  const newOnly = phase(frames, "new-only");
  assert.equal(newOnly.validation.oldReferenceCount, 0);
  assert.equal(newOnly.validation.canDropOld, true);
  const dropped = phase(frames, "drop-old");
  assert.equal(columns(dropped).includes("name"), false);
  assert.deepEqual(dropped.rows.map((row) => row.values.display_name), newOnly.rows.map((row) => row.values.display_name));
  assert.equal(dropped.validation.equality.available, false);
  assert.equal(dropped.lastVerification.passed, true);
  assert.equal(dropped.lastVerification.current, false, "Historical comparison is not relabeled as a current comparison");
});

test("bridge changes both columns in one event and records one new row version", () => {
  for (const scenario of ["safe-expand-contract", "interrupted-backfill"]) {
    const frames = migrationsFrames({ scenario });
    const updated = phase(frames, "bridge-update");
    const before = frames[updated.step - 1];
    assert.equal(updated.event.atomic, true);
    assert.ok(updated.event.txId);
    assert.deepEqual(updated.event.changedColumns, ["name", "display_name"]);
    assert.deepEqual(updated.changedRowKeys, ["products:102"]);
    assert.equal(product(updated, 102).values.name, "노트 새판");
    assert.equal(product(updated, 102).values.display_name, "노트 새판");
    assert.equal(product(updated, 102).version, product(before, 102).version + 1);
    assert.equal(updated.versions.length, before.versions.length + 1);
    assert.deepEqual(product(updated, 101), product(before, 101));
    assert.deepEqual(product(updated, 103), product(before, 103));
  }
});

test("100 percent fill does not permit switching while an old writer remains", () => {
  const frames = migrationsFrames({ scenario: "old-writer-remains" });
  const checked = phase(frames, "premature-verify");
  assert.equal(checked.validation.fill.complete, true);
  assert.equal(checked.validation.equality.complete, true);
  assert.equal(checked.lastVerification.passed, true);
  assert.equal(checked.validation.oldOnlyWriterCount, 1);
  assert.equal(checked.validation.canBackfill, false);
  assert.equal(checked.validation.canSwitchToNew, false);
  const updated = phase(frames, "old-only-update");
  assert.equal(updated.validation.fill.filled, 3);
  assert.equal(updated.validation.equality.equal, 2);
  assert.deepEqual(updated.validation.equality.mismatchedRowKeys, ["products:101"]);
  assert.equal(product(updated, 101).values.name, "머그 새색");
  assert.equal(product(updated, 101).values.display_name, "머그");
  assert.equal(updated.lastVerification.current, false);
  const retry = phase(frames, "retry-cannot-repair");
  assert.deepEqual(retry.rows, updated.rows);
  assert.equal(retry.backfill.filledRowKeys.length, 0);
  assert.equal(retry.backfill.skippedRowKeys.length, 3);
  assert.equal(retry.validation.equality.complete, false);
  const final = frames.at(-1);
  assert.equal(final.phase, "drop-blocked");
  assert.equal(final.validation.canDropOld, false);
  assert.equal(final.lastVerification.passed, false);
  assert.ok(columns(final).includes("name"));
  assert.ok(frames.every((frame) => !frame.appCapabilities.some((app) => app.role === "new" && app.active)));
});

test("interrupted backfill reads current versions, skips existing values, and replays without new versions", () => {
  const frames = migrationsFrames({ scenario: "interrupted-backfill" });
  const first = phase(frames, "backfill-first");
  const interrupted = phase(frames, "interrupted");
  assert.deepEqual(interrupted.rows, first.rows);
  assert.deepEqual(interrupted.versions, first.versions);
  assert.equal(interrupted.backfill.status, "interrupted");
  assert.equal(interrupted.validation.fill.filled, 1);
  const updated = phase(frames, "bridge-update");
  const resumed = phase(frames, "resume");
  assert.equal(resumed.backfill.attempt, 2);
  assert.deepEqual(resumed.backfill.sourceVersionIds, updated.rows.map((row) => row.versionId));
  assert.deepEqual(resumed.backfill.filledRowKeys, ["products:103"]);
  assert.deepEqual(resumed.backfill.skippedRowKeys, ["products:101", "products:102"]);
  assert.deepEqual(product(resumed, 102), product(updated, 102), "No old snapshot overwrites the bridge's new name");
  const replay = phase(frames, "replay-noop");
  assert.equal(replay.backfill.attempt, 3);
  assert.equal(replay.backfill.status, "complete");
  assert.deepEqual(replay.rows, resumed.rows);
  assert.deepEqual(replay.versions, resumed.versions);
  assert.deepEqual(replay.changedRowKeys, []);
  assert.deepEqual(replay.event.changedColumns, []);
  assert.deepEqual(replay.backfill.filledRowKeys, []);
  assert.deepEqual(replay.backfill.skippedRowKeys, ["products:101", "products:102", "products:103"]);
  assert.deepEqual(replay.backfill.sourceVersionIds, resumed.rows.map((row) => row.versionId));
});

test("ADD COLUMN cannot change schema while ACCESS EXCLUSIVE waits on SELECT ACCESS SHARE", () => {
  const frames = migrationsFrames({ scenario: "ddl-wait" });
  const held = phase(frames, "select-held");
  const waiting = phase(frames, "ddl-waiting");
  const granted = phase(frames, "ddl-granted");
  assert.equal(held.lockWait.ddlStatus, "not-requested");
  assert.equal(waiting.lockWait.holderMode, "ACCESS SHARE");
  assert.equal(waiting.lockWait.ddlMode, "ACCESS EXCLUSIVE");
  assert.equal(waiting.lockWait.status, "waiting");
  assert.equal(waiting.lockWait.holderStatus, "active");
  assert.deepEqual(waiting.lockWait.blockerTxIds, [waiting.lockWait.holderTxId]);
  assert.equal(waiting.event.txId, waiting.lockWait.ddlTxId);
  assert.equal(granted.lockWait.status, "granted");
  assert.equal(granted.lockWait.holderStatus, "committed");
  assert.deepEqual(granted.lockWait.blockerTxIds, []);
  for (const frame of [held, waiting, granted]) {
    assert.deepEqual(frame.schemaColumns, frames[0].schemaColumns);
    assert.deepEqual(frame.rows, frames[0].rows);
    assert.deepEqual(frame.changedRowKeys, []);
    assert.equal(columns(frame).includes("display_name"), false);
  }
  const applied = phase(frames, "ddl-applied");
  assert.equal(applied.lockWait.status, "released");
  assert.equal(applied.lockWait.ddlStatus, "committed");
  assert.equal(applied.event.txId, applied.lockWait.ddlTxId);
  assert.equal(applied.schemaVersion, frames[0].schemaVersion + 1);
  assert.ok(columns(applied).includes("display_name"));
  assert.ok(applied.rows.every((row) => row.values.display_name === null));
  assert.equal(applied.validation.fill.complete, false);
  assert.equal(applied.validation.canSwitchToNew, false);
});

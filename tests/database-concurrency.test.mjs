import test from "node:test";
import assert from "node:assert/strict";
import { CANONICAL_FIXTURE, TABLE_COLUMNS, assertFixture, rowKey } from "../src/simulations/database/fixture.mjs";
import { CONCURRENCY_STRATEGIES, FIRST_OUTCOMES, SNAPSHOT_ISOLATIONS, DEADLOCK_ORDERS,
  concurrencyFrames, snapshotFrames, deadlockFrames } from "../src/simulations/database/concurrency.mjs";
const last = (frames) => frames.at(-1);
const phase = (frames, name) => frames.find((frame) => frame.phase === name);
const baseline = structuredClone(CANONICAL_FIXTURE);
const frozen = (value) => {
  if (!value || typeof value !== "object") return;
  assert.ok(Object.isFrozen(value));
  assert.ok(Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype);
  Object.values(value).forEach(frozen);
};
function provenance(frame) {
  assertFixture(frame.committedFixture);
  const version = (id) => frame.versions.find((entry) => entry.id === id);
  const statement = (id) => frame.statements.find((entry) => entry.id === id);
  assert.equal(new Set(frame.versions.map((entry) => entry.id)).size, frame.versions.length);
  assert.equal(new Set(frame.statements.map((entry) => entry.id)).size, frame.statements.length);
  assert.equal(new Set(frame.snapshots.map((entry) => entry.id)).size, frame.snapshots.length);
  for (const entry of frame.versions) {
    assert.deepEqual(Object.keys(entry.row).sort(), [...TABLE_COLUMNS[entry.table]].sort());
    assert.equal(entry.rowKey, rowKey(entry.table, entry.row));
    if (entry.predecessorId) assert.equal(version(entry.predecessorId).rowKey, entry.rowKey);
  }
  for (const read of frame.readObservations) {
    assert.ok(read.atStep <= frame.step); assert.ok(statement(read.statementId));
    assert.deepEqual(read.versionIds, read.rows.map((row) => row.versionId));
    const snapshot = frame.snapshots.find((entry) => entry.id === read.snapshotId);
    assert.ok(snapshot); assert.ok(snapshot.establishedAtStep <= read.atStep);
    for (const row of read.rows) assert.deepEqual(row.row, version(row.versionId).row);
  }
  for (const entry of frame.statements.filter((statement) => statement.status === "waiting")) {
    assert.equal(entry.affectedRows, null); assert.equal(entry.returnedCount, null);
  }
  for (const edge of frame.ownershipEdges ?? []) {
    assert.ok(frame.resources.some((resource) => resource.id === edge.from && resource.id === edge.resourceId));
    assert.equal(edge.to, edge.txId);
    assert.ok(frame.transactions.some((tx) => tx.id === edge.to && tx.outcome === "active"));
  }
  for (const edge of frame.waitEdges ?? []) {
    assert.equal(edge.from, edge.txId); assert.equal(edge.to, edge.resourceId);
    assert.ok(frame.transactions.some((tx) => tx.id === edge.from && tx.outcome === "active"));
    assert.ok(frame.resources.some((resource) => resource.id === edge.to));
    assert.ok(frame.ownershipEdges.some((owner) => owner.resourceId === edge.to && owner.txId === edge.blockedByTxId));
    assert.equal(statement(edge.statementId).status, "waiting");
  }
  if (frame.currentVersionIds) {
    assert.deepEqual(frame.currentVersionIds, [...frame.committedVersionIds, ...frame.activeChanges.map((change) => change.versionId)]);
    for (const id of frame.committedVersionIds) {
      const entry = version(id); assert.equal(entry.state, "committed");
      assert.deepEqual(frame.committedFixture[entry.table].find((row) => rowKey(entry.table, row) === entry.rowKey), entry.row);
    }
    for (const change of frame.activeChanges) {
      assert.equal(version(change.versionId).state, "active");
      assert.ok(frame.transactions.some((tx) => tx.id === change.txId && tx.outcome === "active"));
    }
    for (const change of frame.discardedChanges) {
      assert.equal(version(change.versionId).state, "discarded");
      assert.ok(!frame.currentVersionIds.includes(change.versionId));
    }
    const m = frame.measurements;
    assert.equal(m.availableQty, frame.committedFixture.products.find((row) => row.id === 101).available_qty);
    assert.equal(frame.invariants.reservationBalance, m.availableQty + m.newItemQty === m.initialStock);
    if (!frame.finished) assert.equal(frame.invariants.terminalBusinessValid, null);
  }
}
for (const strategy of CONCURRENCY_STRATEGIES) for (const firstOutcome of FIRST_OUTCOMES) {
  test(`${strategy}/${firstOutcome}: all exact outcomes, active boundaries, row/edge endpoints and deterministic replay`, () => {
    const frames = concurrencyFrames({ strategy, firstOutcome });
    const result = last(frames);
    const oversold = strategy === "unsafe-absolute" && firstOutcome === "commit";
    assert.deepEqual(result.measurements, { initialStock: 1, availableQty: 0, newOrderCount: oversold ? 2 : 1,
      newItemQty: oversold ? 2 : 1, fulfilledRequests: oversold ? 2 : 1 });
    assert.equal(result.invariants.schemaValid, true);
    assert.equal(result.invariants.stockNonnegative, true);
    assert.equal(result.invariants.terminalBusinessValid, !oversold);
    assert.equal(result.invariants.reservationBalance, !oversold);
    for (const [step, frame] of frames.entries()) {
      assert.equal(frame.step, step); assert.equal(frame.event.atStep, step);
      assert.equal(frame.events.length, step + 1); assert.equal(frame.finished, step === frames.length - 1);
      provenance(frame);
    }
    assert.deepEqual(result.activeChanges, []); assert.deepEqual(result.ownershipEdges, []); assert.deepEqual(result.waitEdges, []);
    assert.deepEqual(frames, concurrencyFrames({ strategy, firstOutcome })); frozen(frames);
    assert.deepEqual(CANONICAL_FIXTURE, baseline);
  });
}
test("both old reads see1, A owns row while B's unfinished statement waits and cannot insert", () => {
  for (const strategy of CONCURRENCY_STRATEGIES) for (const firstOutcome of FIRST_OUTCOMES) {
    const frames = concurrencyFrames({ strategy, firstOutcome });
    const initialReads = phase(frames, "B-old-read").readObservations;
    assert.deepEqual(initialReads.map((read) => read.view.availableQty), [1, 1]);
    assert.deepEqual(initialReads.map((read) => read.versionIds), [["version:06:stock:v0"], ["version:06:stock:v0"]]);
    const waiting = phase(frames, "B-wait");
    const resume = phase(frames, "B-resume");
    for (const frame of frames.filter((frame) => frame.step >= waiting.step && frame.step < resume.step)) {
      const pending = frame.statements.find((entry) => entry.id === waiting.event.statementId);
      assert.equal(pending.status, "waiting"); assert.equal(pending.affectedRows, null); assert.equal(pending.returnedCount, null);
      assert.ok(!frame.statements.some((entry) => entry.txId === "tx:06:B" && entry.kind === "insert"));
      assert.ok(!frame.activeChanges.some((entry) => entry.txId === "tx:06:B"));
    }
    assert.equal(waiting.ownershipEdges[0].txId, "tx:06:A");
    assert.equal(waiting.waitEdges[0].blockedByTxId, "tx:06:A");
    assert.equal(resume.event.statementId, waiting.event.statementId);
    const resumed = resume.statements.find((entry) => entry.id === waiting.event.statementId);
    assert.equal(resumed.targetAtStartVersionId, "version:06:stock:v0");
    assert.equal(resumed.recheckedVersionId, firstOutcome === "commit" ? "version:06:A:stock" : "version:06:stock:v0");
  }
});
test("unsafe absolute zero creates two distinct zero versions and two complete orders despite a passing CHECK", () => {
  const result = last(concurrencyFrames());
  const a = result.versions.find((entry) => entry.id === "version:06:A:stock");
  const b = result.versions.find((entry) => entry.id === "version:06:B:stock");
  assert.equal(a.row.available_qty, 0); assert.equal(b.row.available_qty, 0);
  assert.notEqual(a.id, b.id); assert.notEqual(a.createdByTxId, b.createdByTxId);
  assert.equal(b.predecessorId, a.id); assert.equal(a.state, "superseded"); assert.equal(b.state, "committed");
  assert.equal(result.currentHeadVersionId, b.id);
  assert.equal(result.statements.find((entry) => entry.id === "statement:06:B:reserve").affectedRows, 1);
  assert.equal(result.invariants.verdict, "oversold");
});
test("conditional UPDATE succeeds with0 after recheck; application rollback is a separate event without an order", () => {
  const frames = concurrencyFrames({ strategy: "conditional-update" });
  const resumed = phase(frames, "B-resume");
  const statement = resumed.statements.find((entry) => entry.id === resumed.event.statementId);
  assert.equal(statement.kind, "update"); assert.equal(statement.status, "succeeded");
  assert.equal(statement.affectedRows, 0); assert.equal(statement.returnedCount, null); assert.equal(statement.errorCode, null);
  assert.equal(resumed.requests[1].status, "pending");
  assert.equal(resumed.transactions[1].blockStatus, "in-transaction");
  const rollback = phase(frames, "B-rollback"); assert.ok(rollback.step > resumed.step);
  assert.equal(rollback.requests[1].status, "rejected");
  assert.ok(last(frames).statements.every((entry) => entry.txId !== "tx:06:B" || entry.kind !== "insert"));
  assert.equal(last(frames).invariants.verdict, "safe-rejection");
  const snapshot = resumed.snapshots.find((entry) => entry.id === "snapshot:06:B:reserve");
  assert.deepEqual(snapshot.versionIds, ["version:06:stock:v0"]);
  assert.ok(snapshot.establishedAtStep < resumed.step);
});
test("FOR UPDATE returns one current row at stock0; same-session app check rejects rather than mistaking it for UPDATE success", () => {
  const frames = concurrencyFrames({ strategy: "select-for-update" });
  const resumed = phase(frames, "B-resume");
  const statement = resumed.statements.find((entry) => entry.id === resumed.event.statementId);
  assert.equal(statement.kind, "select-for-update"); assert.equal(statement.returnedCount, 1); assert.equal(statement.affectedRows, null);
  assert.equal(resumed.readObservations.at(-1).view.availableQty, 0);
  assert.deepEqual(resumed.readObservations.at(-1).versionIds, ["version:06:A:stock"]);
  assert.deepEqual(resumed.snapshots.find((snapshot) => snapshot.id === "snapshot:06:B:reserve").versionIds, ["version:06:stock:v0"]);
  assert.equal(resumed.ownershipEdges[0].txId, "tx:06:B");
  assert.ok(phase(frames, "B-check").step > resumed.step);
  assert.ok(last(frames).statements.filter((entry) => entry.txId === "tx:06:B").every((entry) => !["insert", "update"].includes(entry.kind)));
});
test("A rollback removes its pending versions, header and item; B can reserve from surviving committed v0", () => {
  for (const strategy of CONCURRENCY_STRATEGIES) {
    const frames = concurrencyFrames({ strategy, firstOutcome: "rollback" });
    const rollback = phase(frames, "A-rollback");
    assert.equal(rollback.currentHeadVersionId, "version:06:stock:v0");
    assert.deepEqual(rollback.currentVersionIds, ["version:06:stock:v0"]);
    assert.equal(rollback.measurements.availableQty, 1); assert.equal(rollback.measurements.newOrderCount, 0);
    assert.equal(rollback.discardedChanges.length, 3); assert.deepEqual(rollback.activeChanges, []);
    assert.deepEqual(rollback.ownershipEdges, []); assert.deepEqual(rollback.waitEdges, []);
    assert.ok(last(frames).committedFixture.orders.some((order) => order.id === 1005));
    assert.ok(!last(frames).committedFixture.orders.some((order) => order.id === 1004));
    assert.equal(last(frames).versions.find((version) => version.id === "version:06:B:stock").predecessorId, "version:06:stock:v0");
  }
});
for (const isolation of SNAPSHOT_ISOLATIONS) {
  test(`${isolation}: first data statement establishes snapshot, legitimate B order commits, A selects exact version`, () => {
    const frames = snapshotFrames({ isolation });
    assert.deepEqual(phase(frames, "A-begin").snapshots, []);
    assert.equal(phase(frames, "A-begin").retainedSnapshotId, null);
    const first = phase(frames, "A-first-read").readObservations.at(-1);
    const second = phase(frames, "A-second-read").readObservations.at(-1);
    const rr = isolation === "repeatable-read";
    assert.equal(first.view.availableQty, 5); assert.equal(second.view.availableQty, rr ? 5 : 3);
    assert.equal(first.snapshotId === second.snapshotId, rr);
    assert.deepEqual(second.versionIds, [rr ? "version:snapshot:stock:v0" : "version:snapshot:B:stock"]);
    assert.equal(phase(frames, "A-second-read").currentHeadVersionId, "version:snapshot:B:stock");
    assert.equal(phase(frames, "A-second-read").retainedSnapshotId, rr ? first.snapshotId : null);
    assert.equal(last(frames).retainedSnapshotId, null);
    assert.deepEqual(last(frames).measurements, { initialStock: 5, availableQty: 3, newOrderCount: 1, newItemQty: 2, fulfilledRequests: 1 });
    assert.equal(last(frames).invariants.terminalBusinessValid, true);
    for (const frame of frames) provenance(frame);
    assert.deepEqual(frames, snapshotFrames({ isolation })); frozen(frames);
  });
}
test("opposite lock acquisition is an actual four-edge cycle; victim abort removes edges before later ROLLBACK", () => {
  const frames = deadlockFrames();
  const cycle = phase(frames, "B-wait-101");
  assert.deepEqual(cycle.cycle, ["tx:deadlock:A", "resource:products:102", "tx:deadlock:B", "resource:products:101", "tx:deadlock:A"]);
  const edges = [...cycle.waitEdges, ...cycle.ownershipEdges];
  for (let i = 1; i < cycle.cycle.length; i++) assert.ok(edges.some((edge) => edge.from === cycle.cycle[i - 1] && edge.to === cycle.cycle[i]));
  const aborted = phase(frames, "victim-abort");
  assert.equal(aborted.victimTxId, "tx:deadlock:B");
  assert.equal(aborted.transactions.find((tx) => tx.id === aborted.victimTxId).outcome, "aborted");
  assert.equal(aborted.transactions.find((tx) => tx.id === aborted.victimTxId).blockStatus, "failed");
  assert.ok([...aborted.ownershipEdges, ...aborted.waitEdges].every((edge) => edge.txId !== aborted.victimTxId && edge.blockedByTxId !== aborted.victimTxId));
  assert.deepEqual(aborted.cycle, []); assert.ok(aborted.edgeHistory.length >= 3);
  const rolledBack = phase(frames, "B-rollback"); assert.ok(rolledBack.step > aborted.step);
  assert.equal(rolledBack.transactions.find((tx) => tx.id === aborted.victimTxId).blockStatus, "idle");
});
test("deadlock retry B2 is a fresh transaction on the same B session and repeats both reads plus app check", () => {
  const frames = deadlockFrames();
  const retry = phase(frames, "B2-begin");
  assert.equal(retry.retryOfTxId, "tx:deadlock:B"); assert.equal(retry.retryTxId, "tx:deadlock:B2");
  assert.equal(retry.transactions.at(-1).sessionId, "session:B");
  assert.ok(!retry.readObservations.some((read) => read.txId === "tx:deadlock:B2"));
  const final = last(frames);
  const reads = final.readObservations.filter((read) => read.txId === "tx:deadlock:B2");
  assert.equal(reads.length, 2); assert.deepEqual(reads.map((read) => read.rows[0].rowKey), ["products:101", "products:102"]);
  assert.ok(reads.every((read) => read.atStep > retry.step));
  assert.ok(phase(frames, "B2-check").step > reads.at(-1).atStep);
  assert.deepEqual(final.completedRequestTxIds, ["tx:deadlock:A", "tx:deadlock:B2"]);
  assert.equal(final.statements.find((statement) => statement.id === "statement:deadlock:A:lock-102").status, "succeeded");
});
for (const order of DEADLOCK_ORDERS) {
  test(`${order}: graph replay, frozen values, live endpoints and no invented business writes`, () => {
    const frames = deadlockFrames({ order });
    for (const frame of frames) {
      provenance(frame); assert.equal(frame.invariants.currentEdgesHaveLiveEndpoints, true);
      assert.deepEqual(frame.committedFixture, baseline); assert.equal(frame.invariants.noOrdersAdded, true);
      assert.equal(frame.invariants.hasCycle, frame.cycle.length > 0);
    }
    if (order === "consistent") {
      assert.ok(frames.every((frame) => !frame.invariants.hasCycle));
      assert.equal(last(frames).victimTxId, null); assert.equal(last(frames).retryTxId, null);
      assert.deepEqual(last(frames).completedRequestTxIds, ["tx:deadlock:A", "tx:deadlock:B"]);
    }
    assert.deepEqual(last(frames).ownershipEdges, []); assert.deepEqual(last(frames).waitEdges, []);
    assert.deepEqual(frames, deadlockFrames({ order })); frozen(frames);
  });
}
test("all bounded factories reject malformed, unknown, null and widened inputs and preserve the fixture", () => {
  for (const factory of [concurrencyFrames, snapshotFrames, deadlockFrames]) {
    for (const input of [null, [], 1, "read-committed", new Date()]) assert.throws(() => factory(input), TypeError);
    for (const input of [{ qty: null }, { fixture: { order_items: [{ qty: null }] } }, { [Symbol("extra")]: true }]) assert.throws(() => factory(input), RangeError);
    assert.deepEqual(factory(Object.freeze({})), factory());
    assert.deepEqual(factory(Object.create(null)), factory());
  }
  for (const options of [{ strategy: null }, { strategy: "serializable" }, { firstOutcome: "timeout" }]) assert.throws(() => concurrencyFrames(options), RangeError);
  for (const isolation of [null, "serializable", "snapshot"]) assert.throws(() => snapshotFrames({ isolation }), RangeError);
  for (const order of [null, "random"]) assert.throws(() => deadlockFrames({ order }), RangeError);
  assert.throws(() => last(concurrencyFrames()).versions[0].row.available_qty = 10, TypeError);
  assert.deepEqual(CANONICAL_FIXTURE, baseline);
});

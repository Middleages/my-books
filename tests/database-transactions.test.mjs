import test from "node:test";
import assert from "node:assert/strict";
import { CANONICAL_FIXTURE, TABLE_COLUMNS, assertFixture, rowKey } from "../src/simulations/database/fixture.mjs";
import { TRANSACTION_MODES, TRANSACTION_OUTCOMES, transactionFrames } from "../src/simulations/database/transactions.mjs";
const last = (frames) => frames.at(-1);
const phase = (frames, name) => frames.find((frame) => frame.phase === name);
const baseline = structuredClone(CANONICAL_FIXTURE);
const frozen = (value) => {
  if (!value || typeof value !== "object") return;
  assert.ok(Object.isFrozen(value));
  assert.ok(Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype);
  Object.values(value).forEach(frozen);
};
function assertFrame(frame) {
  assertFixture(frame.committedFixture);
  assert.equal(new Set(frame.versions.map((row) => row.id)).size, frame.versions.length);
  assert.equal(new Set(frame.statements.map((row) => row.id)).size, frame.statements.length);
  const version = (id) => frame.versions.find((entry) => entry.id === id);
  for (const entry of frame.versions) {
    assert.deepEqual(Object.keys(entry.row).sort(), [...TABLE_COLUMNS[entry.table]].sort());
    assert.equal(rowKey(entry.table, entry.row), entry.rowKey);
    if (entry.predecessorId) assert.equal(version(entry.predecessorId).rowKey, entry.rowKey);
  }
  for (const id of frame.committedVersionIds) {
    const entry = version(id);
    assert.equal(entry.state, "committed");
    assert.deepEqual(frame.committedFixture[entry.table].find((row) => rowKey(entry.table, row) === entry.rowKey), entry.row);
  }
  assert.deepEqual(frame.currentVersionIds, [...frame.committedVersionIds, ...frame.activeChanges.map((entry) => entry.versionId)]);
  for (const change of frame.activeChanges) {
    assert.equal(version(change.versionId).state, "active");
    assert.deepEqual(change.row, version(change.versionId).row);
    assert.ok(frame.transactions.some((tx) => tx.id === change.txId && tx.outcome === "active"));
  }
  for (const change of frame.discardedChanges) {
    assert.equal(version(change.versionId).state, "discarded");
    assert.ok(!frame.currentVersionIds.includes(change.versionId));
  }
  for (const read of frame.readObservations) {
    assert.ok(read.atStep <= frame.step);
    assert.ok(frame.statements.some((entry) => entry.id === read.statementId));
    assert.deepEqual(read.rows.map((row) => row.versionId), read.versionIds);
    for (const row of read.rows) assert.deepEqual(row.row, version(row.versionId).row);
    if (read.status === "error") {
      assert.equal(read.view, null); assert.equal(read.snapshotId, null); assert.deepEqual(read.rows, []);
    } else assert.ok(frame.snapshots.some((entry) => entry.id === read.snapshotId));
  }
  for (const id of frame.committedThisStepVersionIds) {
    assert.ok(frame.committedVersionIds.includes(id));
    assert.equal(version(id).state, "committed");
  }
  const m = frame.measurements;
  assert.equal(m.availableQty, frame.committedFixture.products.find((row) => row.id === 101).available_qty);
  assert.equal(m.newOrderCount, frame.committedFixture.orders.filter((row) => row.id === 1004).length);
  assert.equal(m.newItemQty, frame.committedFixture.order_items.filter((row) => row.order_id === 1004).reduce((sum, row) => sum + row.qty, 0));
  assert.equal(m.fulfilledRequests, frame.requests.filter((request) => request.status === "fulfilled").length);
  assert.equal(frame.invariants.reservationBalance, m.availableQty + m.newItemQty === 5);
  assert.equal(frame.invariants.schemaValid, true);
  if (!frame.finished) assert.equal(frame.invariants.terminalBusinessValid, null);
}
for (const mode of TRANSACTION_MODES) for (const outcome of TRANSACTION_OUTCOMES) {
  test(`${mode}/${outcome}: exact terminal reservation, validity, identity and replay`, () => {
    const frames = transactionFrames({ mode, outcome });
    const result = last(frames);
    const success = outcome === "success";
    const atomic = mode === "atomic";
    const expected = success ? [3, 1, 2, 1] : atomic ? [5, 0, 0, 0] : outcome === "header-constraint-error" ? [3, 0, 0, 0] : [3, 1, 0, 0];
    assert.deepEqual(Object.values(result.measurements), [5, ...expected]);
    assert.equal(result.invariants.terminalBusinessValid, success || atomic);
    assert.equal(result.invariants.verdict, success ? "fulfilled" : atomic ? "rolled-back" : "partial-failure");
    for (const [step, frame] of frames.entries()) {
      assert.equal(frame.step, step); assert.equal(frame.event.atStep, step);
      assert.equal(frame.finished, step === frames.length - 1); assert.equal(frame.events.length, step + 1);
      assertFrame(frame);
    }
    assert.deepEqual(frames, transactionFrames({ mode, outcome })); frozen(frames);
    assert.deepEqual(CANONICAL_FIXTURE, baseline);
  });
}
test("atomic own writes and fresh observer SELECT have distinct versions; only COMMIT publishes", () => {
  const frames = transactionFrames();
  const author = phase(frames, "author-read").readObservations.at(-1);
  const observer = phase(frames, "observer-before").readObservations.at(-1);
  assert.deepEqual([author.view.availableQty, author.view.newOrderCount, author.view.newItemQty], [3, 1, 2]);
  assert.deepEqual([observer.view.availableQty, observer.view.newOrderCount, observer.view.newItemQty], [5, 0, 0]);
  assert.equal(author.versionIds.length, 3); assert.deepEqual(observer.versionIds, ["version:05:stock:v0"]);
  assert.equal(phase(frames, "commit").committedThisStepVersionIds.length, 3);
  assert.ok(frames.filter((frame) => frame.phase !== "commit").every((frame) => frame.committedThisStepVersionIds.length === 0));
  const finalRead = phase(frames, "observer-final").readObservations.at(-1);
  assert.equal(finalRead.view.availableQty, 3); assert.equal(finalRead.view.newItemQty, 2);
  assert.deepEqual(last(frames).readObservations.find((read) => read.id === observer.id), observer);
  assert.ok(frames.filter((frame) => ["stock-update", "allocate", "header-insert", "item-insert"].includes(frame.phase)).every((frame) => frame.readObservations.length === 0));
});
test("autocommit writes finish and commit in the same event, with no fake COMMIT SQL", () => {
  const frames = transactionFrames({ mode: "statement-autocommit" });
  for (const name of ["stock-update", "header-insert", "item-insert"]) {
    const frame = phase(frames, name);
    assert.equal(frame.statements.at(-1).implicitCommit, true);
    assert.equal(frame.committedThisStepVersionIds.length, 1);
    assert.deepEqual(frame.activeChanges, []);
  }
  assert.ok(frames.every((frame) => frame.phase !== "commit"));
  assert.ok(last(frames).statements.every((statement) => statement.kind !== "commit"));
  assert.ok(last(frames).transactions.every((tx) => typeof tx.id === "string" && tx.blockStatus === "idle"));
});
test("constraint candidates never become current rows; active valid writes are discarded on atomic error", () => {
  for (const outcome of TRANSACTION_OUTCOMES.filter((value) => value !== "success")) {
    const frames = transactionFrames({ outcome });
    const error = phase(frames, outcome === "header-constraint-error" ? "header-error" : "item-error");
    assert.equal(error.transactions[0].blockStatus, "failed");
    assert.equal(error.transactions[0].outcome, "aborted");
    assert.deepEqual(error.activeChanges, []);
    assert.equal(error.discardedChanges.length, outcome === "header-constraint-error" ? 1 : 2);
    assert.ok(error.versions.every((version) => JSON.stringify(version.row) !== JSON.stringify(error.rejectedCandidate.row)));
    if (outcome === "header-constraint-error") assert.equal(error.rejectedCandidate.row.request_key, baseline.orders[0].request_key);
    else assert.equal(error.rejectedCandidate.row.qty, 0);
    const failedRead = phase(frames, "author-error-read");
    assert.equal(failedRead.statements.at(-1).status, "error");
    assert.equal(failedRead.statements.at(-1).errorCode, "25P02");
    assert.equal(failedRead.statements.at(-1).returnedCount, null);
    assert.deepEqual(failedRead.readObservations.at(-1).versionIds, []);
    const rollback = phase(frames, "rollback");
    assert.equal(rollback.transactions[0].blockStatus, "idle");
    assert.equal(rollback.transactions[0].outcome, "rolled-back");
  }
});
test("explicit educational nextval consumes only at its event and survives all rollback/error outcomes", () => {
  for (const mode of TRANSACTION_MODES) for (const outcome of TRANSACTION_OUTCOMES) {
    const frames = transactionFrames({ mode, outcome });
    const allocation = phase(frames, "allocate");
    for (const before of frames.filter((frame) => frame.step < allocation.step)) {
      assert.equal(before.sequence.nextValue, 1004); assert.deepEqual(before.sequence.allocations, []);
      assert.equal(before.requests[0].orderId, null);
    }
    for (const after of frames.filter((frame) => frame.step >= allocation.step)) {
      assert.equal(after.sequence.name, "education_order_id_seq");
      assert.equal(after.sequence.nextValue, 1005); assert.equal(after.sequence.allocations.length, 1);
      assert.equal(after.sequence.allocations[0].value, 1004); assert.equal(after.requests[0].orderId, 1004);
      assert.equal(after.sequence.allocations[0].atStep, allocation.step);
    }
  }
});
test("pending partial groups are not terminal failures; empty committed header can pass schema but fail request", () => {
  const frames = transactionFrames({ mode: "statement-autocommit", outcome: "item-constraint-error" });
  const header = phase(frames, "header-insert");
  assert.equal(header.invariants.reservationBalance, false);
  assert.equal(header.invariants.terminalBusinessValid, null);
  assert.equal(header.requests[0].status, "pending");
  assert.equal(last(frames).invariants.schemaValid, true);
  assert.equal(last(frames).invariants.terminalBusinessValid, false);
  assert.equal(last(frames).committedFixture.orders.at(-1).status, "confirmed");
  assert.equal(last(frames).measurements.fulfilledRequests, 0);
});
test("default NOT NULL rows narrow quantities and reject invalid/unbounded options without mutation", () => {
  assert.ok(baseline.order_items.every((item) => typeof item.qty === "number"));
  for (const input of [null, [], 1, "atomic", new Date()]) assert.throws(() => transactionFrames(input), TypeError);
  for (const input of [{ mode: null }, { mode: "auto" }, { outcome: null }, { outcome: "network-error" }, { fixture: { order_items: [{ qty: null }] } }, { qty: 0 }, { [Symbol("unknown")]: 1 }]) assert.throws(() => transactionFrames(input), RangeError);
  const options = Object.freeze({ mode: "atomic", outcome: "success" });
  assert.deepEqual(transactionFrames(options), transactionFrames());
  assert.deepEqual(transactionFrames(Object.create(null)), transactionFrames());
  assert.throws(() => last(transactionFrames()).committedFixture.products[0].available_qty = 999, TypeError);
  assert.deepEqual(CANONICAL_FIXTURE, baseline);
});

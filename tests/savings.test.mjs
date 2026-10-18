import test from "node:test";
import assert from "node:assert/strict";
import {
  savingsDefaults,
  projectSavings,
} from "../src/simulations/money/savings.mjs";
const run = (patch = {}) => projectSavings({ ...savingsDefaults, ...patch });
test("enough total money can still miss the due date when part is locked", () => {
  const r = run();
  assert.equal(r.due.totalBefore, 1200000);
  assert.equal(r.due.availableBefore, 800000);
  assert.equal(r.due.totalEnough, true);
  assert.equal(r.due.success, false);
  assert.equal(r.due.shortfall, 200000);
  assert.equal(r.due.paid, 0);
  assert.equal(r.requiredMonthly, 133334);
  assert.equal(r.rows[9].availableBefore, 1500000);
  assert.equal(r.frames.at(-1).due.success, false); // Later release does not repair a missed deadline.
});
test("release in the due month is before payment and does not create profit", () => {
  const r = run({ releaseMonth: 6 });
  assert.equal(r.due.success, true);
  assert.equal(r.due.availableBefore, 1200000);
  assert.equal(r.due.paid, 1000000);
  assert.equal(r.rows[6].remaining, 200000);
  assert.equal(r.requiredMonthly, 66667);
  const release = r.frames.find((f) => f.month === 6 && f.phase === "release");
  assert.equal(release.released, 400000);
  assert.equal(release.total, 1100000);
  assert.equal(release.added, 500000);
  assert.equal(release.locked, 0);
  assert.equal(release.available, 1100000);
});
test("only changing availability keeps due-date funding equal", () => {
  const a = run({ releaseMonth: 5 }),
    b = run({ releaseMonth: 7 });
  assert.equal(a.due.totalBefore, b.due.totalBefore);
  assert.notEqual(a.due.success, b.due.success);
  assert.equal(a.due.availableBefore - b.due.availableBefore, 400000);
});
test("month end savings happen before spending; exact funding succeeds once", () => {
  const r = run({
    initial: 0,
    locked: 0,
    payment: 100000,
    target: 300000,
    dueMonth: 3,
  });
  assert.equal(r.due.success, true);
  assert.equal(r.due.paid, 300000);
  assert.equal(r.rows[3].remaining, 0);
  assert.equal(r.frames.filter((f) => f.spent > 0).length, 1);
  assert.equal(r.frames.at(-1).paid, 300000);
  assert.equal(r.requiredMonthly, 100000);
});
test("immediate deadline has no contributions; release at zero is immediately usable", () => {
  const miss = run({ dueMonth: 0 });
  assert.equal(miss.due.availableBefore, 200000);
  assert.equal(miss.requiredMonthly, null);
  const yes = run({ dueMonth: 0, releaseMonth: 0, target: 500000 });
  assert.equal(yes.frames[0].available, 600000);
  assert.equal(yes.due.success, true);
  assert.equal(yes.requiredMonthly, 0);
  assert.equal(yes.frames[1].paid, 500000);
  assert.equal(yes.rows[0].remaining, 100000);
});
test("zero target, zero payments, fully locked funds and insufficient total", () => {
  const z = run({ initial: 0, locked: 0, payment: 0, target: 0, dueMonth: 0 });
  assert.equal(z.due.success, true);
  assert.equal(z.requiredMonthly, 0);
  const fully = run({
    initial: 600000,
    locked: 600000,
    payment: 0,
    target: 600000,
    dueMonth: 1,
    releaseMonth: 2,
  });
  assert.equal(fully.due.totalEnough, true);
  assert.equal(fully.due.shortfall, 600000);
  const low = run({ initial: 0, locked: 0, payment: 0 });
  assert.equal(low.due.totalEnough, false);
  assert.equal(low.due.shortfall, 1000000);
});
test("deadline extension and smaller target change funding without inventing income", () => {
  assert.equal(run({ dueMonth: 9 }).due.success, true);
  assert.equal(run({ target: 800000 }).due.success, true);
  assert.equal(run({ payment: 140000 }).due.success, true);
  const needed = run().requiredMonthly;
  assert.equal(run({ payment: needed }).due.success, true);
  assert.equal(run({ payment: needed - 1 }).due.success, false);
});
test("every frame reconciles money and timeline; seeking/replay is deterministic", () => {
  for (const patch of [
    {},
    { dueMonth: 0, releaseMonth: 0 },
    { dueMonth: 24, releaseMonth: 36 },
    { target: 0 },
    { initial: 0, locked: 0 },
  ]) {
    const p = { ...savingsDefaults, ...patch },
      r = projectSavings(p);
    for (const f of r.frames) {
      assert.equal(f.total, f.available + f.locked);
      assert.equal(f.total, p.initial + f.added - f.paid);
      assert.ok(f.available >= 0 && f.locked >= 0);
    }
    for (const row of r.rows) {
      assert.equal(row.totalBefore - row.spent, row.remaining);
    }
    assert.deepEqual(projectSavings(p), r);
    assert.equal(r.frames.at(-1).month, r.horizon);
  }
});
test("reject bad amounts, locked money exceeding initial, dates and nonfinite values", () => {
  for (const patch of [
    { initial: -1 },
    { locked: 700000 },
    { locked: -1 },
    { target: NaN },
    { payment: Infinity },
    { dueMonth: -1 },
    { dueMonth: 1.5 },
    { dueMonth: 25 },
    { releaseMonth: 37 },
    { payment: 0.5 },
    { target: 30000001 },
  ])
    assert.throws(() => run(patch), RangeError);
});

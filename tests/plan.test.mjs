import test from "node:test";
import assert from "node:assert/strict";
import { projectPlan, planDefaults } from "../src/simulations/money/plan.mjs";
const run = (p = {}) => projectPlan({ ...planDefaults, ...p });
const near = (a, b) =>
  assert.ok(
    Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b)),
    `${a} != ${b}`,
  );
test("base reaches goal, shock reduces funding, later date restores time to save", () => {
  const r = run();
  assert.equal(r.paths.base.goal.status, "reached");
  assert.equal(r.paths.shock.goal.status, "short");
  assert.equal(r.paths.later.goal.status, "reached");
  assert.equal(r.paths.later.goal.month, 18);
  assert.equal(r.paths.base.firstGap, null);
});
test("identical shocks and dates produce identical paths", () => {
  let r = run({ incomeDrop: 0, extraExpense: 0, delay: 0 });
  assert.deepEqual(r.paths.base, r.paths.shock);
  assert.deepEqual(r.paths.shock, r.paths.later);
});
test("transfers preserve money; spending once consumes goal money", () => {
  const p = run().paths.base;
  for (let i = 1; i < p.frames.length; i++) {
    const f = p.frames[i],
      before = p.frames[i - 1];
    if (f.phase === 4) near(f.cash + f.savings, before.cash + before.savings);
  }
  assert.equal(p.rows.filter((x) => x.goalSpent > 0).length, 1);
  assert.equal(p.rows[12].goalSpent, 3000000);
  assert.equal(p.rows[12].savings, 0);
  assert.equal(p.rows[13].transfer, 0);
});
test("all phases conserve budget resources and scheduled principal", () => {
  for (const patch of [
    {},
    { income: 0 },
    { principal: 0 },
    { annualRate: 0 },
    { loanMonths: 1 },
    { loanMonths: 24 },
    { goalMonth: 1, delay: 0 },
    { goalMonth: 24, delay: 0 },
    { goal: 0 },
    { incomeDrop: 100, extraExpense: 5000000 },
    { monthlySaving: 0 },
  ]) {
    const p = { ...planDefaults, ...patch };
    for (const path of Object.values(run(patch).paths))
      for (const f of path.frames) {
        near(
          f.cash +
            f.savings +
            f.cumulativeLiving +
            f.cumulativeExtra +
            f.cumulativeInterest +
            f.cumulativePrincipal +
            f.cumulativeGoal,
          p.initialCash + f.cumulativeIncome,
        );
        near(f.debt + f.cumulativePrincipal, p.principal);
        assert.ok(f.savings >= 0 && f.transfer >= 0 && f.debt >= 0);
      }
  }
});
test("funding gap stays a planning shortfall, no new debt or automatic savings", () => {
  const p = run({ initialCash: 0, income: 0, principal: 0 }).paths.shock;
  assert.equal(p.firstGap, 1);
  assert.equal(p.goal.status, "gap");
  assert.equal(p.rows[24].debt, 0);
  assert.ok(p.rows[24].cash < 0);
  assert.equal(p.rows[24].savings, 0);
  assert.equal(p.rows[24].cumulativeGoal, 0);
});
test("a past gap is not erased by later income or a postponed goal", () => {
  const p = run({
    initialCash: 0,
    income: 3000000,
    living: 2000000,
    principal: 12000000,
    loanMonths: 1,
    goalMonth: 18,
    delay: 6,
  }).paths.later;
  assert.equal(p.firstGap, 1);
  assert.ok(p.rows[24].cash > 0);
  assert.equal(p.goal.status, "gap");
});
test("no oversaving, goal zero, exact target and no retry after shortfall", () => {
  assert.equal(run({ goal: 0 }).paths.base.goal.status, "reached");
  const a = run({ goal: 100000, monthlySaving: 1000000 }).paths.base;
  assert.equal(a.rows[1].transfer, 100000);
  assert.equal(a.rows[2].transfer, 0);
  const b = run({ monthlySaving: 0 }).paths.base;
  assert.equal(b.goal.status, "short");
  assert.equal(b.rows[24].cumulativeGoal, 0);
  assert.equal(b.goal.available, 0);
});
test("zero rate schedule, one month final payment and 24-month boundary", () => {
  let p = run({ annualRate: 0, loanMonths: 1 }).paths.base;
  assert.equal(p.rows[1].principal, 6000000);
  assert.equal(p.rows[1].interest, 0);
  assert.equal(p.rows[2].principal, 0);
  p = run({ loanMonths: 24, goalMonth: 24, delay: 0 }).paths.base;
  assert.equal(p.rows[24].debt, 0);
  assert.equal(p.frames.length, 121);
  assert.equal(p.rows.length, 25);
});
test("fractional payments reconcile and deterministic rerun", () => {
  const r = run({ principal: 1000001, annualRate: 7, loanMonths: 7 });
  near(r.paths.base.rows[24].cumulativePrincipal, 1000001);
  assert.deepEqual(
    r,
    run({ principal: 1000001, annualRate: 7, loanMonths: 7 }),
  );
});
test("reject invalid ranges and out-of-horizon delay", () => {
  for (const p of [
    { initialCash: -1 },
    { income: NaN },
    { living: Infinity },
    { principal: 12000001 },
    { annualRate: 31 },
    { loanMonths: 0 },
    { loanMonths: 1.5 },
    { goalMonth: 25 },
    { goalMonth: 24, delay: 1 },
    { delay: -1 },
    { incomeDrop: 101 },
    { extraExpense: -1 },
    { monthlySaving: 1000001 },
  ])
    assert.throws(() => run(p), RangeError);
});

test('fractional exact-zero funding boundary does not create a phantom gap',()=>{
 const p=run({initialCash:0,income:1000000/3,living:0,principal:1000000,annualRate:0,loanMonths:3,monthlySaving:0,goal:0,incomeDrop:0,extraExpense:0}).paths.base;
 assert.equal(p.firstGap,null);assert.equal(p.rows[3].cash,0);
 const q=run({initialCash:0,income:1000000/3-0.001,living:0,principal:1000000,annualRate:0,loanMonths:3,monthlySaving:0,goal:0}).paths.base;
 assert.equal(q.firstGap,1);
});

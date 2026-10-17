import test from "node:test";
import assert from "node:assert/strict";
import {
  initialWallet,
  totals,
  transact,
  transactionFrames,
  scenarios,
} from "../src/simulations/money/transactions.mjs";
import {
  budgetDefaults,
  projectBudget,
} from "../src/simulations/money/budget.mjs";
test("순자산은 음수도 보존", () =>
  assert.equal(
    totals({ ...initialWallet, living: 0, reserve: 0, other: 10, loan: 20 })
      .net,
    -10,
  ));
test("내 계좌 이체는 현금·순자산과 수입·소비 보존", () => {
  const r = transact(initialWallet, "transfer", 50);
  assert.equal(r.living, initialWallet.living - 50);
  assert.equal(r.reserve, initialWallet.reserve + 50);
  assert.deepEqual(totals(r), totals(initialWallet));
  assert.equal(r.spending, 0);
  assert.equal(r.income, 0);
});
test("카드 구매와 결제는 소비를 한 번만 인식", () => {
  const b = transact(initialWallet, "purchase", 30),
    p = transact(b, "cardPayment", 30);
  assert.equal(b.living, initialWallet.living);
  assert.equal(b.card, 30);
  assert.equal(p.card, 0);
  assert.equal(p.spending, 30);
  assert.equal(totals(p).net, totals(initialWallet).net - 30);
});
test("원금은 현금·채무 동시 감소, 이자는 순자산 감소", () => {
  const p = transact(initialWallet, "principal", 50),
    i = transact(initialWallet, "interest", 10);
  assert.equal(p.loan, initialWallet.loan - 50);
  assert.equal(totals(p).net, totals(initialWallet).net);
  assert.equal(p.spending, 0);
  assert.equal(i.loan, initialWallet.loan);
  assert.equal(i.spending, 10);
  assert.equal(i.interest, 10);
  assert.equal(totals(i).net, totals(initialWallet).net - 10);
});
test("대출 유입은 수입 아님, 급여와 소비는 순자산 변화", () => {
  const b = transact(initialWallet, "borrow", 100);
  assert.equal(totals(b).net, totals(initialWallet).net);
  assert.equal(b.income, 0);
  const r = transact(
    transact(initialWallet, "salary", 100),
    "cashPurchase",
    20,
  );
  assert.equal(r.income, 100);
  assert.equal(r.spending, 20);
  assert.equal(totals(r).net, totals(initialWallet).net + 80);
});
test("잔액·채무 초과·잘못된 금액 거부, 0과 완납", () => {
  for (const n of [-1, NaN, Infinity, 1.5])
    assert.throws(() => transact(initialWallet, "transfer", n));
  assert.throws(() => transact(initialWallet, "transfer", 10000));
  assert.throws(() =>
    transact(initialWallet, "principal", initialWallet.loan + 1),
  );
  assert.throws(() => transact(initialWallet, "cardPayment", 1));
  assert.deepEqual(transact(initialWallet, "transfer", 0), initialWallet);
  assert.equal(
    transact(
      { ...initialWallet, living: 2000 },
      "principal",
      initialWallet.loan,
    ).loan,
    0,
  );
});
test("중간 프레임은 미확정, 다시 계산해도 중복 반영 없음", () => {
  for (const s of scenarios) {
    const f = transactionFrames(initialWallet, s.id, 20);
    assert.deepEqual(f[1].wallet, initialWallet);
    assert.deepEqual(f, transactionFrames(initialWallet, s.id, 20));
    assert.equal(f.at(-1).phase, "after");
  }
});
test("평균 흑자와 3월20일 부족 공존, 일별·월말 일치", () => {
  const r = projectBudget(budgetDefaults);
  assert.equal(r.averageSurplus, 10);
  assert.equal(r.firstGap.month, 3);
  assert.equal(r.firstGap.day, 20);
  assert.equal(r.months[2].total, -140);
  for (const m of r.months) assert.equal(m.days.at(-1).total, m.total);
});
test("목적 적립은 총현금 보존, 비정기 지출 한 번 차감", () => {
  const a = projectBudget({ ...budgetDefaults, saving: 0 }),
    b = projectBudget({ ...budgetDefaults, saving: 30 });
  assert.deepEqual(
    a.months.map((m) => m.total),
    b.months.map((m) => m.total),
  );
  assert.equal(b.months.at(-1).total, 100 + 12 * 40 - 360);
  for (const m of b.months)
    for (const d of m.days) assert.equal(d.total, d.living + d.reserve);
});
test("출금월과 월급일로 부족 시점 변화", () => {
  assert.equal(
    projectBudget({ ...budgetDefaults, dueMonth: 12 }).firstGap,
    null,
  );
  const r = projectBudget({ ...budgetDefaults, payday: 25 });
  assert.equal(r.firstGap.month, 1);
  assert.equal(r.firstGap.day, 10);
});
test("0원·목적통장 전액 지출·유효성", () => {
  const z = projectBudget({
    ...budgetDefaults,
    income: 0,
    regular: 0,
    annual: 0,
    opening: 0,
  });
  assert.equal(z.months.at(-1).total, 0);
  assert.equal(z.firstGap, null);
  const r = projectBudget({ ...budgetDefaults, opening: 500, saving: 120 });
  assert.equal(r.months[2].reserve, 0);
  assert.equal(r.months[2].total, 500 + 3 * 40 - 360);
  assert.throws(() => projectBudget({ ...budgetDefaults, dueMonth: 13 }));
});

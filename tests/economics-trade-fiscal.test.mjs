import test from "node:test";
import assert from "node:assert/strict";
import {
  exportValue,
  externalAccounts,
  comparativeTrade,
  fiscalLedger,
  stabilizer,
} from "../src/simulations/economics/trade-fiscal.mjs";
test("exports contain imported inputs and domestic value added without double counting", () => {
  for (const gross of [0, 100, 200])
    for (const share of [0, 40, 100]) {
      const r = exportValue(gross, share);
      assert.equal(r.imports + r.domestic, r.gross);
      assert.equal(r.wrong - r.gross, r.domestic);
    }
  assert.equal(exportValue(100, 40).domestic, 60);
});
test("current flows exclude financial borrowing and can offset goods surplus", () => {
  const r = externalAccounts(100, 60, -50, 5, -10, 80);
  assert.equal(r.goods, 40);
  assert.equal(r.current, -15);
  assert.equal(r.borrowing, 80);
  assert.equal(externalAccounts(100, 60, -50, 5, -10, 0).current, r.current);
});
test("comparative advantage uses fixed labor, conserves exchange and permits losers", () => {
  for (const bread of [6, 9, 12, 18]) {
    const r = comparativeTrade(bread);
    assert.equal(r.after[0].bread + r.after[1].bread, 36);
    assert.equal(r.after[0].cloth + r.after[1].cloth, 18);
    assert.equal(r.before[0].bread + r.before[1].bread, 30);
    assert.equal(r.before[0].cloth + r.before[1].cloth, 18);
  }
  assert.equal(comparativeTrade(9).bothGain, true);
  assert.equal(comparativeTrade(18).bothGain, false);
  assert.equal(comparativeTrade(6).gains[1], 0);
});
test("fiscal frames conserve cash; deficit finances spending and debt is a stock", () => {
  for (const tax of [0, 200, 300])
    for (const purchase of [0, 250, 300])
      for (const transfer of [0, 100, 300]) {
        const r = fiscalLedger(tax, purchase, transfer, 200);
        assert.equal(r.balance, tax - purchase - transfer);
        assert.equal(r.debt, 200 + r.borrow - r.repay);
        assert.equal(r.directGDP, purchase);
        for (const f of r.frames) {
          assert.equal(f.household + f.firm + f.government + f.lender, 2100);
          for (const k of ["household", "firm", "government", "lender", "debt"])
            assert.ok(f[k] >= 0);
        }
        assert.equal(r.frames.at(-1).government, r.reserve);
      }
});
test("surplus repays at most outstanding debt and retains remaining cash", () => {
  let r = fiscalLedger(300, 0, 0, 100);
  assert.equal(r.debt, 0);
  assert.equal(r.repay, 100);
  assert.equal(r.reserve, 200);
  r = fiscalLedger(0, 0, 0, 0);
  assert.equal(r.debt, 0);
  assert.equal(r.borrow, 0);
  assert.equal(r.balance, 0);
});
test("automatic rules cushion income changes without a new decision; purchases wait for lag", () => {
  const r = stabilizer(600, 100, 3, 0);
  assert.equal(r.tax, 120);
  assert.equal(r.transfer, 150);
  assert.equal(r.disposable, 630);
  assert.equal(r.fixedDisposable, 450);
  assert.equal(r.cushion, 180);
  assert.equal(r.extraApplied, 0);
  assert.equal(stabilizer(600, 100, 3, 3).extraApplied, 100);
  assert.equal(stabilizer(1000, 0, 3, 6).cushion, 0);
  assert.equal(stabilizer(1400, 0).transfer, 50);
});
test("models are deterministic and reject invalid units and ranges", () => {
  assert.deepEqual(fiscalLedger(), fiscalLedger());
  assert.deepEqual(stabilizer(), stabilizer());
  for (const fn of [
    () => exportValue(100, 101),
    () => comparativeTrade(19),
    () => fiscalLedger(-1),
    () => stabilizer(NaN),
    () => externalAccounts(Infinity),
  ])
    assert.throws(fn, RangeError);
});

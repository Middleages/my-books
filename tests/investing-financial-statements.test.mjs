import test from 'node:test';
import assert from 'node:assert/strict';
import { financialStatementsDefaults, financialStatementsFrames } from '../src/simulations/investing/financial-statements.mjs';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
function checkBalances(result) {
  for (const f of result.frames) {
    close(f.cash + f.receivables, f.assets);
    close(f.assets, f.liabilities + f.equity);
    close(f.equity, result.input.openingEquity + f.cumulativeProfit);
    close(f.cashChange, f.cumulativeOperatingCashFlow);
    close(f.periodCashChange, f.periodOperatingCashFlow);
    close(f.cash, f.periodOpeningCash + f.periodOperatingCashFlow);
    close(f.periodProfit - f.periodReceivablesChange, f.periodOperatingCashFlow);
    close(f.cumulativeProfit, f.cumulativeRevenue - f.cumulativeExpenses);
    assert.ok(f.cash >= 0 && f.receivables >= 0);
  }
}

test('financial statements begin at cash100 = liabilities40 + equity60 with zero period flows', () => {
  const r = financialStatementsFrames(); checkBalances(r);
  const f = r.frames[0];
  assert.equal(f.cash, 100); assert.equal(f.liabilities, 40); assert.equal(f.equity, 60);
  assert.equal(f.periodRevenue, 0); assert.equal(f.periodProfit, 0); assert.equal(f.periodOperatingCashFlow, 0);
  assert.equal(f.saleSplit.recognized, false);
});

test('all-credit profit40 coexists with operating cashflow-80 and closing cash20', () => {
  const r = financialStatementsFrames({ creditSales: 120 }); checkBalances(r);
  const f = r.closing;
  assert.equal(f.periodRevenue, 120); assert.equal(f.periodExpenses, 80); assert.equal(f.periodProfit, 40);
  assert.equal(f.periodOperatingCashFlow, -80); assert.equal(f.cash, 20); assert.equal(f.receivables, 120);
  assert.equal(f.assets, 140); assert.equal(f.equity, 100); assert.equal(f.closingCashDirection, 'down');
});

test('all-cash sale gives closing cash140, profit40, and zero later collection', () => {
  const r = financialStatementsFrames({ creditSales: 0 }); checkBalances(r);
  assert.equal(r.closing.cash, 140); assert.equal(r.closing.receivables, 0); assert.equal(r.closing.periodOperatingCashFlow, 40);
  assert.equal(r.closing.closingCashDirection, 'up');
  assert.equal(r.summary.event.cashIn, 0); assert.equal(r.summary.periodRevenue, 0); assert.equal(r.summary.periodProfit, 0);
  assert.equal(r.summary.cash, 140); assert.equal(r.summary.periodOperatingCashFlow, 0);
});

test('40 credit leaves cash unchanged despite a profit and creates 40 receivables', () => {
  const r = financialStatementsFrames({ creditSales: 40 }); checkBalances(r);
  assert.equal(r.closing.cash, 100); assert.equal(r.closing.periodOperatingCashFlow, 0);
  assert.equal(r.closing.periodProfit, 40); assert.equal(r.closing.receivables, 40);
  assert.equal(r.closing.closingCashDirection, 'same');
});

test('sale and expense observation frames each keep the accounting equation', () => {
  const r = financialStatementsFrames({ creditSales: 90 }); checkBalances(r);
  const sale = r.frames[1], cost = r.frames[2];
  assert.equal(sale.cash, 130); assert.equal(sale.receivables, 90); assert.equal(sale.assets, 220);
  assert.equal(sale.equity, 180); assert.equal(sale.periodProfit, 120);
  assert.equal(cost.cash, 50); assert.equal(cost.periodProfit, 40); assert.equal(cost.assets, 140);
  assert.equal(cost.event.cashOut, 80); assert.equal(cost.event.expense, 80);
});

test('closing records no second cost, receipt, profit or balance change', () => {
  const r = financialStatementsFrames();
  for (const key of ['cash', 'receivables', 'assets', 'liabilities', 'equity', 'periodProfit', 'periodOperatingCashFlow']) {
    assert.equal(r.frames[2][key], r.closing[key]);
  }
  assert.deepEqual(r.closing.event, { cashIn: 0, cashOut: 0, revenue: 0, expense: 0, receivablesChange: 0 });
});

test('later collection changes asset form, adds no revenue, and opens a separate period', () => {
  const r = financialStatementsFrames({ creditSales: 90 }); checkBalances(r);
  const f = r.summary;
  assert.equal(f.period, '다음 기간'); assert.equal(f.periodOpeningCash, 50); assert.equal(f.periodOpeningReceivables, 90);
  assert.equal(f.cash, 140); assert.equal(f.receivables, 0); assert.equal(f.periodOperatingCashFlow, 90);
  assert.equal(f.periodRevenue, 0); assert.equal(f.periodExpenses, 0); assert.equal(f.periodProfit, 0);
  assert.equal(f.cumulativeRevenue, 120); assert.equal(f.cumulativeExpenses, 80); assert.equal(f.cumulativeProfit, 40);
  assert.equal(f.equity, r.closing.equity); assert.equal(f.assets, r.closing.assets);
  assert.equal(f.event.revenue, 0); assert.equal(f.event.receivablesChange, -90);
  assert.equal(r.closing.periodOperatingCashFlow, -50);
});

test('sum of events counts revenue, cash sales and collection each once', () => {
  for (const creditSales of [0, 40, 90, 120]) {
    const r = financialStatementsFrames({ creditSales });
    const total = key => r.frames.reduce((sum, f) => sum + f.event[key], 0);
    assert.equal(total('revenue'), 120); assert.equal(total('expense'), 80);
    assert.equal(total('cashIn'), 120); assert.equal(total('cashOut'), 80); assert.equal(total('receivablesChange'), 0);
    assert.equal(r.summary.cash, r.input.openingCash + total('cashIn') - total('cashOut'));
  }
});

test('all allowed integer credit amounts preserve every equation and expected closing values', () => {
  for (let creditSales = 0; creditSales <= 120; creditSales += 1) {
    const r = financialStatementsFrames({ creditSales }); checkBalances(r);
    assert.equal(r.closing.cash, 140 - creditSales); assert.equal(r.closing.receivables, creditSales);
    assert.equal(r.closing.periodProfit, 40); assert.equal(r.closing.assets, 140); assert.equal(r.summary.cash, 140);
  }
});

test('fractional credit is not rounded in accounting, branch shares or chart geometry', () => {
  const r = financialStatementsFrames({ creditSales: 33.333333 }); checkBalances(r);
  close(r.closing.cash, 106.666667); close(r.closing.receivables, 33.333333);
  close(r.closing.saleSplit.cash + r.closing.saleSplit.credit, 120);
  close(r.closing.saleSplit.cashFraction + r.closing.saleSplit.creditFraction, 1);
});

test('balance bars use scale220 across all frames and encode exact current asset and funding sums', () => {
  for (const creditSales of [0, 1, 40, 119, 120]) {
    const r = financialStatementsFrames({ creditSales });
    for (const f of r.frames) {
      assert.equal(f.balanceScale, 220);
      for (const list of [f.assetSegments, f.fundingSegments]) {
        close(list.reduce((sum, s) => sum + s.value, 0), f.assets);
        close(list.reduce((sum, s) => sum + s.fraction, 0), f.assets / 220);
        for (const segment of list) { close(segment.fraction * 220, segment.value); assert.ok(segment.fraction >= 0 && segment.fraction <= 1); }
      }
      assert.equal(f.assetSegments[0].value, f.cash); assert.equal(f.assetSegments[1].value, f.receivables);
      assert.equal(f.fundingSegments[0].value, f.liabilities); assert.equal(f.fundingSegments[1].value, f.equity);
    }
  }
});

test('invalid or out-of-range credit inputs fail instead of silently changing the scenario', () => {
  for (const creditSales of [-1, 120.0001, NaN, Infinity, -Infinity, '90', null]) {
    assert.throws(() => financialStatementsFrames({ creditSales }), RangeError);
  }
});

test('financial statements replay deterministically without mutating inputs or sharing earlier frame arrays', () => {
  const input = Object.freeze({ ...financialStatementsDefaults });
  const first = financialStatementsFrames(input), copy = structuredClone(first);
  assert.deepEqual(financialStatementsFrames(input), first);
  first.summary.cash = -1; first.summary.assetSegments[0].value = -1;
  assert.deepEqual(first.frames[0], copy.frames[0]); assert.deepEqual(first.closing, copy.closing);
  assert.deepEqual(financialStatementsFrames(input), copy); assert.equal(input.creditSales, 120);
});

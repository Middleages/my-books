import test from 'node:test';
import assert from 'node:assert/strict';
import { allocationDefaults, allocationFrames, allocationSnapshot, executeAllocationTrade, classifyAllocationPrediction } from '../src/simulations/investing/allocation-rebalancing.mjs';
const close = (actual, expected, epsilon = 1e-8) => assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);
const baseState = () => ({ stockUnits: 6, bondUnits: 4, stockPrice: 120, bondPrice: 100, cash: 0 });
const fields = frame => [frame.stockValue, frame.bondValue, frame.cash, frame.total];

test('allocation default: 600/400 to 720/400 to sale cash48 to 672/448', () => {
  const r = allocationFrames();
  assert.deepEqual(fields(r.initial), [600, 400, 0, 1000]);
  assert.deepEqual(fields(r.drift), [720, 400, 0, 1120]);
  assert.deepEqual(fields(r.afterSale), [672, 400, 48, 1120]);
  fields(r.summary).forEach((value, i) => close(value, [672, 448, 0, 1120][i]));
  close(r.drift.stockWeight, 9 / 14); close(r.weightChange, 9 / 14 - .6);
  assert.equal(r.targetStock, 672); assert.equal(r.targetBond, 448);
  assert.equal(r.tradeAmount, 48); close(r.soldUnits, .4); close(r.boughtUnits, .48);
  assert.equal(r.status, 'rebalanced'); assert.equal(r.targetReached, true);
  assert.equal(r.predictionOutcome, 'up');
});

test('same units reprice once; trades do not repeat the market return', () => {
  const r = allocationFrames();
  assert.equal(r.initial.stockUnits, r.drift.stockUnits); assert.equal(r.initial.bondUnits, r.drift.bondUnits);
  assert.deepEqual(r.frames.map(f => f.stockPrice), [100, 120, 120, 120]);
  assert.deepEqual(r.frames.map(f => f.bondPrice), [100, 100, 100, 100]);
  assert.equal(r.profit, 120); assert.equal(r.totalReturn, .12);
  close(r.summary.total - r.initial.total, r.profit);
});

test('sale cash and subsequent purchase are equal internal movements, never external flow', () => {
  const r = allocationFrames();
  assert.deepEqual(r.frames.map(f => f.sold), [0, 0, 48, 48]);
  assert.deepEqual(r.frames.map(f => f.bought), [0, 0, 0, 48]);
  assert.deepEqual(r.afterSale.movement, { from: 'stock', to: 'cash', amount: 48 });
  assert.deepEqual(r.summary.movement, { from: 'cash', to: 'bond', amount: 48 });
  for (const f of r.frames) assert.deepEqual([f.externalFlow, f.cost, f.tax], [0, 0, 0]);
  assert.equal(r.initial.time, 'T0 · 관찰 시작');
  assert.ok(r.frames.slice(1).every(f => f.time === 'T1 · 같은 관찰 종료 시점'));
});

test('stock decline reverses the sale and purchase sides', () => {
  const r = allocationFrames({ stockReturn: -.2 });
  assert.deepEqual(fields(r.drift), [480, 400, 0, 880]);
  assert.equal(r.seller, 'bond'); assert.equal(r.buyer, 'stock'); assert.equal(r.tradeAmount, 48);
  close(r.summary.stockValue, 528); close(r.summary.bondValue, 352);
  close(r.summary.stockWeight, .6); assert.equal(r.predictionOutcome, 'down');
});

test('same proportional price change leaves every starting weight at target with zero trades', () => {
  for (const stockWeight of [0, .01, .17, .6, .97, 1]) for (const r of [-.95, -.2, 0, .2, .55, 1]) {
    const result = allocationFrames({ stockWeight, stockReturn: r, bondReturn: r });
    assert.equal(result.tradeAmount, 0); assert.equal(result.plannedAmount, 0);
    assert.equal(result.status, 'already-target'); assert.equal(result.targetReached, true);
    assert.equal(result.predictionOutcome, 'same');
    assert.equal(result.summary.cash, 0); close(result.summary.stockWeight, stockWeight);
  }
});

test('zero stock or bond holdings and 100-percent weights remain valid boundaries', () => {
  for (const stockWeight of [0, 1]) {
    const r = allocationFrames({ stockWeight, stockReturn: .2, bondReturn: -.4 });
    close(r.initial.stockWeight, stockWeight); close(r.summary.stockWeight, stockWeight);
    assert.equal(r.tradeAmount, 0); assert.equal(r.status, 'already-target');
    assert.equal(stockWeight === 0 ? r.summary.stockUnits : r.summary.bondUnits, 0);
    close(r.summary.stockWeight + r.summary.bondWeight, 1);
  }
});

test('zero initial total has undefined actual weights and return despite selected target', () => {
  const r = allocationFrames({ initialAmount: 0 });
  for (const f of r.frames) {
    assert.deepEqual(fields(f), [0, 0, 0, 0]);
    assert.deepEqual([f.stockWeight, f.bondWeight, f.cashWeight], [null, null, null]);
    assert.ok(f.segments.every(s => s.value === 0 && s.fraction === 0));
  }
  assert.equal(r.totalReturn, null); assert.equal(r.targetReached, null);
  assert.equal(r.status, 'undefined-total'); assert.equal(r.predictionOutcome, 'undefined');
  assert.equal(r.tradeAmount, 0); assert.equal(r.input.stockWeight, .6);
});

test('total loss leaves zero total with undefined weights and a minus100 percent past return', () => {
  for (const stockWeight of [0, .6, 1]) {
    const r = allocationFrames({ stockWeight, stockReturn: -1, bondReturn: -1 });
    assert.equal(r.summary.total, 0); assert.equal(r.totalReturn, -1);
    assert.equal(r.summary.stockWeight, null); assert.equal(r.predictionOutcome, 'undefined');
    assert.equal(r.status, 'undefined-total'); assert.equal(r.targetReached, null);
  }
});

test('a zero-priced asset cannot be purchased into positive target value in either direction', () => {
  for (const options of [{ stockReturn: -1 }, { stockReturn: 0, bondReturn: -1 }]) {
    const r = allocationFrames(options);
    assert.equal(r.status, 'blocked-zero-price'); assert.equal(r.targetReached, false);
    assert.ok(r.plannedAmount > 0); assert.equal(r.tradeAmount, 0);
    assert.deepEqual(fields(r.summary), fields(r.drift)); assert.deepEqual(fields(r.afterSale), fields(r.drift));
    assert.equal(r.summary.cash, 0); assert.equal(r.summary.movement, null);
  }
});

test('zero-priced unheld asset does not obstruct a 100-percent target in the other asset', () => {
  const stocks = allocationFrames({ stockWeight: 1, bondReturn: -1 });
  const bonds = allocationFrames({ stockWeight: 0, stockReturn: -1 });
  for (const r of [stocks, bonds]) { assert.equal(r.status, 'already-target'); assert.equal(r.targetReached, true); }
});

test('rebalance restores exposure after both assets lose money but does not restore lost wealth', () => {
  const r = allocationFrames({ stockReturn: -.4, bondReturn: -.1 });
  assert.equal(r.drift.total, 720); close(r.summary.total, 720);
  close(r.summary.stockValue, 432); close(r.summary.bondValue, 288);
  assert.equal(r.totalReturn, -.28); assert.equal(r.targetReached, true);
});

test('every snapshot, chart segment and target marker shares the model values and scale', () => {
  for (const options of [{}, { stockReturn: -.4, bondReturn: -.1 }, { initialAmount: 0 }, { stockWeight: 1 }, { stockReturn: 1, bondReturn: .5 }]) {
    const r = allocationFrames(options);
    for (const f of r.frames) {
      close(f.stockValue + f.bondValue + f.cash, f.total);
      close(f.segments.reduce((sum, s) => sum + s.value, 0), f.total);
      for (const s of f.segments) { close(s.fraction, s.value / r.moneyScale); assert.ok(s.fraction >= 0 && s.fraction <= 1); }
      if (f.total > 0) close(f.stockWeight + f.bondWeight + f.cashWeight, 1);
      close(f.stockUnits * f.stockPrice, f.stockValue); close(f.bondUnits * f.bondPrice, f.bondValue);
    }
    close(r.targetStock + r.targetBond, r.drift.total);
    close(r.targetMarkerFraction, r.targetStock / r.moneyScale);
    assert.equal(r.input.stockWeight + r.targetBondWeight, 1);
    assert.deepEqual(r.axis.map(t => t.fraction), [0, .5, 1]);
  }
});

test('many weights, shocks and budgets conserve the T1 total and do not create negative cash', () => {
  for (const initialAmount of [.01, 1, 1000, 1e9]) for (const stockWeight of [0, .01, .23, .5, .6, .99, 1]) for (const stockReturn of [-1, -.5, 0, .2, 1]) for (const bondReturn of [-1, -.5, 0, .3, 1]) {
    const r = allocationFrames({ initialAmount, stockWeight, stockReturn, bondReturn });
    for (const f of r.frames.slice(1)) { close(f.total, r.drift.total, 1e-6); assert.ok(f.cash >= 0 && f.stockUnits >= 0 && f.bondUnits >= 0); }
    if (r.targetReached) { close(r.summary.stockWeight, stockWeight); close(r.summary.bondWeight, 1 - stockWeight); }
    close(r.summary.sold, r.summary.bought);
  }
});

test('exact cash budget can be spent; excess, including tiny excess, is rejected unchanged', () => {
  const state = { ...baseState(), cash: 48 };
  const full = executeAllocationTrade(state, { asset: 'bond', side: 'buy', amount: 48 });
  assert.equal(full.accepted, true); assert.equal(full.state.cash, 0); close(full.units, .48);
  for (const amount of [48.0000000001, 49, 1000]) {
    const rejected = executeAllocationTrade(state, { asset: 'bond', side: 'buy', amount });
    assert.equal(rejected.accepted, false); assert.equal(rejected.reason, 'budget-exceeded');
    assert.deepEqual(rejected.state, state); assert.equal(rejected.amount, 0);
  }
  assert.equal(state.cash, 48);
});

test('no cash cannot fund a positive purchase and zero order is an explicit no-op', () => {
  const state = baseState();
  const rejected = executeAllocationTrade(state, { asset: 'stock', side: 'buy', amount: 1 });
  assert.equal(rejected.reason, 'budget-exceeded'); assert.deepEqual(rejected.state, state);
  for (const side of ['buy', 'sell']) { const r = executeAllocationTrade(state, { asset: 'stock', side, amount: 0 }); assert.equal(r.accepted, true); assert.equal(r.reason, 'no-trade'); assert.deepEqual(r.state, state); }
});

test('selling all units is allowed; excess holdings cannot be sold or borrowed', () => {
  const state = baseState();
  const full = executeAllocationTrade(state, { asset: 'stock', side: 'sell', amount: 720 });
  assert.equal(full.accepted, true); assert.equal(full.state.stockUnits, 0); assert.equal(full.state.cash, 720);
  for (const amount of [720.00000001, 721]) { const r = executeAllocationTrade(state, { asset: 'stock', side: 'sell', amount }); assert.equal(r.reason, 'holding-exceeded'); assert.deepEqual(r.state, state); }
});

test('zero-price trade and unrepresentable positive trades fail with unchanged state', () => {
  const zero = { ...baseState(), stockPrice: 0, cash: 50 };
  for (const side of ['buy', 'sell']) { const r = executeAllocationTrade(zero, { asset: 'stock', side, amount: 10 }); assert.equal(r.reason, 'zero-price'); assert.deepEqual(r.state, zero); }
  const tiny = { stockUnits: 1, stockPrice: 1, bondUnits: 0, bondPrice: 1, cash: 0 };
  const r = executeAllocationTrade(tiny, { asset: 'stock', side: 'sell', amount: 1e-17 });
  assert.equal(r.reason, 'unrepresentable-trade'); assert.deepEqual(r.state, tiny);
});

test('trade executor and frames never mutate inputs and repeated runs restart rather than accumulate', () => {
  const input = Object.freeze({ ...allocationDefaults });
  assert.deepEqual(allocationFrames(input), allocationFrames(input));
  const state = Object.freeze(baseState()), order = Object.freeze({ asset: 'stock', side: 'sell', amount: 48 });
  const first = executeAllocationTrade(state, order), second = executeAllocationTrade(state, order);
  assert.deepEqual(first, second); assert.deepEqual(state, baseState());
  first.state.cash = 999;
  assert.equal(second.state.cash, 48); assert.equal(state.cash, 0);
  const frames = allocationFrames(); frames.summary.stockValue = 999;
  close(allocationFrames().summary.stockValue, 672);
});

test('predictions use unrounded model outcomes and distinguish undefined from zero percent', () => {
  for (const outcome of ['up', 'same', 'down', 'undefined']) {
    assert.equal(classifyAllocationPrediction(outcome, ''), null);
    for (const prediction of ['up', 'same', 'down', 'undefined']) assert.equal(classifyAllocationPrediction(outcome, prediction), outcome === prediction);
  }
  const small = allocationFrames({ stockReturn: 1e-8, bondReturn: 0 });
  assert.equal(small.predictionOutcome, 'up'); assert.ok(small.tradeAmount > 0);
  assert.throws(() => classifyAllocationPrediction('unknown', 'up'));
  assert.throws(() => classifyAllocationPrediction('up', 'unknown'));
});

test('unsupported amounts, rates, weights, state and orders fail explicitly', () => {
  for (const initialAmount of [-1, Number.MIN_VALUE, 1e-320, .009, 1e9 + 1, NaN, Infinity]) assert.throws(() => allocationFrames({ initialAmount }), RangeError);
  for (const stockWeight of [-.01, 1.01, NaN, Infinity]) assert.throws(() => allocationFrames({ stockWeight }), RangeError);
  for (const key of ['stockReturn', 'bondReturn']) for (const value of [-1.01, 1.01, NaN, Infinity]) assert.throws(() => allocationFrames({ [key]: value }), RangeError);
  for (const options of [null, [], 2]) assert.throws(() => allocationFrames(options), TypeError);
  assert.throws(() => allocationSnapshot({ ...baseState(), cash: -1 }), RangeError);
  assert.throws(() => executeAllocationTrade(baseState(), { asset: 'stock', side: 'buy', amount: -1 }), RangeError);
  assert.throws(() => executeAllocationTrade(baseState(), { asset: 'other', side: 'buy', amount: 1 }), RangeError);
  assert.throws(() => executeAllocationTrade(baseState(), { asset: 'stock', side: 'other', amount: 1 }), RangeError);
});


test('small target values use whole-portfolio floating precision for post-trade confirmation', () => {
  const r = allocationFrames({ stockWeight: .01, stockReturn: -.1, bondReturn: -.95 });
  close(r.targetStock, .585); close(r.summary.stockValue, .585);
  assert.equal(r.status, 'rebalanced'); assert.equal(r.targetReached, true);
});

test('all 169781 visible UI combinations confirm feasible targets and conserved totals', () => {
  // Formatting is irrelevant here; avoid locale allocation work across the exhaustive UI grid.
  const original = Number.prototype.toLocaleString;
  Number.prototype.toLocaleString = function () { return String(this); };
  let count = 0;
  try {
    for (let w = 0; w <= 100; w++) for (let a = -100; a <= 100; a += 5) for (let b = -100; b <= 100; b += 5) {
      const r = allocationFrames({ stockWeight: w / 100, stockReturn: a / 100, bondReturn: b / 100 });
      for (const f of r.frames.slice(1)) close(f.total, r.drift.total, 1e-9);
      if (r.status === 'rebalanced' || r.status === 'already-target') assert.equal(r.targetReached, true, JSON.stringify({ w, a, b }));
      else assert.equal(r.targetReached, r.status === 'undefined-total' ? null : false);
      count++;
    }
  } finally { Number.prototype.toLocaleString = original; }
  assert.equal(count, 169781);
});

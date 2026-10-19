import test from 'node:test';
import assert from 'node:assert/strict';
import { ordersDefaults, ordersFrames } from '../src/simulations/investing/orders.mjs';
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
function conserve(result) {
  for (const frame of result.frames) {
    assert.equal(frame.cashTotal, result.input.budget);
    assert.equal(frame.shareTotal, result.initialShares);
    assert.equal(frame.buyerCash + frame.sellerCash, result.input.budget);
    assert.equal(frame.buyerShares + frame.sellerShares, result.initialShares);
    assert.equal(frame.filledQuantity + frame.remainingQuantity, result.input.quantity);
    assert.equal(frame.notional, frame.fills.reduce((sum, fill) => sum + fill.price * fill.quantity, 0));
    assert.equal(frame.sellerCash, frame.notional);
    assert.equal(frame.buyerShares, frame.fills.reduce((sum, fill) => sum + fill.quantity, 0));
    assert.ok(frame.buyerCash >= 0 && frame.sellerShares >= 0 && frame.remainingQuantity >= 0);
    assert.equal(frame.averagePrice, frame.filledQuantity ? frame.notional / frame.filledQuantity : null);
    for (const ask of frame.asks) {
      assert.equal(ask.filledQuantity + ask.remainingQuantity, ask.initialQuantity);
      assert.equal(ask.sellerCash, ask.filledQuantity * ask.price);
      assert.ok(ask.remainingQuantity >= 0 && ask.filledQuantity >= 0);
      close((ask.filledFraction + ask.remainingFraction) * frame.bookScale, ask.initialQuantity);
      if (result.input.mode === 'limit' && ask.price > result.input.limitPrice) assert.equal(ask.filledQuantity, 0);
    }
    close(frame.orderFilledFraction * frame.orderScale, frame.filledQuantity);
    close(frame.orderUnfilledFraction * frame.orderScale, frame.remainingQuantity);
    close(frame.buyerCashFraction * frame.cashScale, frame.buyerCash);
    close(frame.sellerCashFraction * frame.cashScale, frame.sellerCash);
  }
}
test('market 15 buys 100x10 plus 101x5 for 1505 and a quantity-weighted average', () => {
  const r = ordersFrames(); conserve(r);
  assert.deepEqual(r.summary.fills.map(f => [f.price, f.quantity]), [[100, 10], [101, 5]]);
  assert.equal(r.summary.notional, 1505); close(r.summary.averagePrice, 100 + 1 / 3);
  assert.equal(r.summary.lastFillPrice, 101); assert.equal(r.summary.initialLastTradedPrice, 100);
  assert.equal(r.summary.status, 'filled'); assert.equal(r.summary.buyerCash, 495);
  assert.deepEqual(r.frames.map(f => f.phase), ['initial', 'fill', 'fill', 'complete']);
});
test('limit 100 buys only 10 shares, leaves 5 unfilled and never crosses its limit', () => {
  const r = ordersFrames({ mode: 'limit', limitPrice: 100 }); conserve(r);
  assert.equal(r.summary.notional, 1000); assert.equal(r.summary.filledQuantity, 10);
  assert.equal(r.summary.remainingQuantity, 5); assert.equal(r.summary.status, 'partial');
  assert.equal(r.summary.reason, 'limit'); assert.equal(r.summary.asks[1].remainingQuantity, 10);
});
test('a high limit is a cap, not a price to pay; lower asks execute at their own price', () => {
  const r = ordersFrames({ mode: 'limit', limitPrice: 102 }); conserve(r);
  assert.equal(r.summary.notional, 1505); assert.equal(r.summary.averagePrice, 1505 / 15);
  const low = ordersFrames({ mode: 'limit', limitPrice: 99 }); conserve(low);
  assert.equal(low.summary.filledQuantity, 0); assert.equal(low.summary.reason, 'limit');
  assert.equal(low.summary.averagePrice, null); assert.equal(low.summary.status, 'unfilled');
});
test('budget 999 fills only nine whole shares and leaves 99 without negative cash', () => {
  const r = ordersFrames({ budget: 999 }); conserve(r);
  assert.equal(r.summary.filledQuantity, 9); assert.equal(r.summary.buyerCash, 99);
  assert.equal(r.summary.reason, 'budget'); assert.equal(r.summary.asks[0].remainingQuantity, 1);
});
test('budget exhaustion at a level boundary and exactly sufficient cash are distinct', () => {
  const r = ordersFrames({ budget: 1000 }); conserve(r);
  assert.equal(r.summary.filledQuantity, 10); assert.equal(r.summary.reason, 'budget');
  const exact = ordersFrames({ budget: 1505 }); conserve(exact);
  assert.equal(exact.summary.buyerCash, 0); assert.equal(exact.summary.status, 'filled');
  const short = ordersFrames({ budget: 1504 }); conserve(short);
  assert.equal(short.summary.filledQuantity, 14); assert.equal(short.summary.buyerCash, 100);
});
test('finite liquidity leaves the remaining five shares unfilled', () => {
  const r = ordersFrames({ quantity: 25, budget: 3000 }); conserve(r);
  assert.equal(r.summary.filledQuantity, 20); assert.equal(r.summary.notional, 2010);
  assert.equal(r.summary.remainingQuantity, 5); assert.equal(r.summary.reason, 'liquidity');
});
test('zero quantity, zero budget and empty book have no invented trades or average', () => {
  for (const input of [{ quantity: 0 }, { budget: 0 }, { asks: [] }, { asks: [], quantity: 0, budget: 0 }]) {
    const r = ordersFrames(input); conserve(r);
    assert.equal(r.summary.fills.length, 0); assert.equal(r.summary.averagePrice, null);
    assert.equal(r.summary.lastFillPrice, null); assert.equal(r.summary.notional, 0);
    assert.equal(r.frames.length, 2);
  }
  assert.equal(ordersFrames({ quantity: 0 }).summary.reason, null);
  assert.equal(ordersFrames({ quantity: 0 }).summary.status, 'no-order');
  assert.equal(ordersFrames({ budget: 0 }).summary.reason, 'budget');
  assert.equal(ordersFrames({ asks: [] }).summary.reason, 'liquidity');
  assert.equal(ordersFrames({ asks: [] }).summary.initialBestAsk, null);
});
test('price wins before arrival; the earlier order wins within the same price', () => {
  const asks = [
    { id: 'late', price: 100, quantity: 4, arrival: 3 },
    { id: 'dear', price: 101, quantity: 10, arrival: 1 },
    { id: 'early', price: 100, quantity: 6, arrival: 2 },
  ];
  const r = ordersFrames({ asks, quantity: 8 }); conserve(r);
  assert.deepEqual(r.summary.fills.map(f => [f.askId, f.quantity]), [['early', 6], ['late', 2]]);
  assert.equal(r.summary.asks.find(a => a.id === 'dear').filledQuantity, 0);
});
test('zero-size quotes are skipped and a tied arrival preserves input order', () => {
  const asks = [
    { id: 'empty', price: 1, quantity: 0, arrival: 0 },
    { id: 'a', price: 100, quantity: 2, arrival: 1 },
    { id: 'b', price: 100, quantity: 2, arrival: 1 },
  ];
  const r = ordersFrames({ asks, quantity: 3 }); conserve(r);
  assert.equal(r.summary.initialBestAsk, 100);
  assert.deepEqual(r.summary.fills.map(f => [f.askId, f.quantity]), [['a', 2], ['b', 1]]);
});
test('changing the previously traded price cannot change current fills or cost', () => {
  const base = ordersFrames().summary;
  for (const lastTradedPrice of [1, 50, 1000, null]) {
    const r = ordersFrames({ lastTradedPrice }); conserve(r);
    assert.deepEqual(r.summary.fills, base.fills); assert.equal(r.summary.notional, base.notional);
    assert.equal(r.summary.initialLastTradedPrice, lastTradedPrice);
  }
});
test('result confirmation does not duplicate the last trade; every frame is isolated', () => {
  const r = ordersFrames(); conserve(r);
  const lastFill = r.frames.at(-2);
  assert.equal(lastFill.notional, r.summary.notional); assert.equal(r.summary.currentFill, null);
  r.summary.asks[0].remainingQuantity = 999;
  r.summary.fills[0].quantity = 999;
  assert.equal(r.frames[0].asks[0].remainingQuantity, 10);
  assert.equal(lastFill.asks[0].remainingQuantity, 0); assert.equal(lastFill.fills[0].quantity, 10);
});
test('inputs are immutable, repeated execution starts fresh, and output input is copied', () => {
  const options = Object.freeze({ ...ordersDefaults });
  const first = ordersFrames(options), copy = structuredClone(first);
  assert.deepEqual(ordersFrames(options), copy);
  first.input.asks[0].quantity = 999;
  assert.equal(options.asks[0].quantity, 10);
  assert.deepEqual(ordersFrames(options), copy);
});
test('invalid kinds, numbers, IDs and over-large books are rejected explicitly', () => {
  for (const input of [{ mode: 'sell' }, { quantity: -1 }, { quantity: 1.5 }, { budget: NaN }, { budget: Infinity }, { limitPrice: -1 }, { lastTradedPrice: 0 }, { quantity: 1e7 }, { asks: null }, { asks: Array(101).fill(ordersDefaults.asks[0]) }, { asks: [ordersDefaults.asks[0], ordersDefaults.asks[0]] }, { asks: [{ id: '', price: 1, quantity: 1, arrival: 1 }] }, { asks: [{ id: 'a', price: 0, quantity: 1, arrival: 1 }] }, { asks: [{ id: 'a', price: 1, quantity: 1.1, arrival: 1 }] }, { asks: [{ id: 'a', price: 1, quantity: 1, arrival: -1 }] }]) assert.throws(() => ordersFrames(input), RangeError);
});
test('all input boundaries preserve quantities, budget and limit over a deterministic grid', () => {
  for (const mode of ['market', 'limit']) for (const quantity of [0, 1, 9, 10, 11, 15, 20, 25]) for (const budget of [0, 99, 100, 999, 1000, 1504, 1505, 3000]) for (const limitPrice of [0, 99, 100, 101, 102]) {
    const r = ordersFrames({ mode, quantity, budget, limitPrice }); conserve(r);
    assert.equal(r.summary.asks.length, 2);
  }
});
test('large permitted integer inputs stay finite and exact without iterating per share', () => {
  const r = ordersFrames({ quantity: 1e6, budget: 1e12, asks: [{ id: 'large', price: 1e9, quantity: 1e6, arrival: 0 }] }); conserve(r);
  assert.equal(r.summary.filledQuantity, 1000); assert.equal(r.summary.buyerCash, 0);
  assert.equal(r.frames.length, 3); assert.ok(Number.isFinite(r.summary.averagePrice));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { shareValuationDefaults, shareValuationFrames, cashFlowValuationDefaults, cashFlowValuationFrames } from '../src/simulations/investing/valuation.mjs';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 1e-10 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);

test('valuation baseline separates price, market cap, EPS and PER', () => {
  const r = shareValuationFrames();
  assert.equal(r.before.price, 100); assert.equal(r.before.shares, 1000);
  assert.equal(r.before.marketCap, 100000); assert.equal(r.before.earnings, 10000);
  assert.equal(r.before.eps, 10); assert.equal(r.before.per, 10); assert.equal(r.before.perStatus, 'positive');
});

test('split preserves total market value and earnings with reciprocal price and share count', () => {
  for (const splitFactor of [1, 2, 5]) {
    const r = shareValuationFrames({ splitFactor });
    assert.equal(r.after.price, 100 / splitFactor); assert.equal(r.after.shares, 1000 * splitFactor);
    assert.equal(r.after.marketCap, r.before.marketCap); assert.equal(r.after.earnings, r.before.earnings);
    assert.equal(r.after.eps, 10 / splitFactor); assert.equal(r.after.per, 10);
    assert.equal(r.marketCapDirection, 'same');
    for (const f of r.frames) {
      assert.equal(f.predictionOutcome, 'same');
      close(f.price * f.shares, f.marketCap); close(f.eps * f.shares, f.earnings);
    }
  }
});

test('fractional prices do not create an artificial market cap loss after a split', () => {
  for (const price of [0.7, 0.1, 1.3, 12.345678901]) {
    const r = shareValuationFrames({ price, shares: 1000, splitFactor: 5 });
    assert.equal(r.after.marketCap, r.before.marketCap); assert.equal(r.marketCapDirection, 'same');
    close(r.after.price * r.after.shares, r.after.marketCap);
  }
});

test('EPS zero makes PER undefined instead of zero or infinity', () => {
  const r = shareValuationFrames({ earnings: 0 });
  for (const f of r.frames) {
    assert.equal(f.eps, 0); assert.equal(f.per, null); assert.equal(f.perStatus, 'zero-earnings');
    assert.match(f.perExplanation, /정의 불가/);
  }
});

test('negative EPS allows arithmetic negative PER with a separate interpretation warning', () => {
  const r = shareValuationFrames({ earnings: -10000 });
  assert.equal(r.before.eps, -10); assert.equal(r.after.eps, -5);
  for (const f of r.frames) {
    assert.equal(f.per, -10); assert.equal(f.perStatus, 'loss');
    assert.match(f.perExplanation, /비교할 수 없습니다/);
  }
});

test('zero price is distinct from zero earnings, and zero shares makes both per-share ratios undefined', () => {
  assert.equal(shareValuationFrames({ price: 0 }).after.per, 0);
  assert.equal(shareValuationFrames({ price: 0, earnings: 0 }).after.per, null);
  const r = shareValuationFrames({ shares: 0 });
  for (const f of r.frames) {
    assert.equal(f.marketCap, 0); assert.equal(f.eps, null); assert.equal(f.per, null);
    assert.equal(f.tiles.length, 0); assert.equal(f.totalFraction, 0); assert.equal(f.perStatus, 'no-shares');
  }
});

test('mosaic tile count and fractions encode the same whole and share units', () => {
  for (const splitFactor of [1, 2, 5]) {
    const r = shareValuationFrames({ splitFactor });
    for (const f of r.frames) {
      assert.equal(f.tiles.length, f.gridColumns * f.gridRows);
      assert.equal(f.sharesPerTile, 100);
      close(f.tiles.reduce((s, p) => s + p.shares, 0), f.shares);
      close(f.tiles.reduce((s, p) => s + p.marketValue, 0), f.marketCap);
      close(f.tiles.reduce((s, p) => s + p.fraction, 0), f.totalFraction);
    }
  }
});

test('share model rejects invalid finite, whole-share and split inputs', () => {
  for (const options of [
    { price: -1 }, { price: NaN }, { price: Infinity }, { price: '100' }, { price: null },
    { shares: -1 }, { shares: 1.5 }, { shares: Infinity }, { earnings: NaN }, { earnings: null },
    { splitFactor: 0 }, { splitFactor: -2 }, { splitFactor: 3 }, { splitFactor: '2' },
  ]) assert.throws(() => shareValuationFrames(options), RangeError);
});

test('share snapshots and replays do not mutate inputs or alias previous diagrams', () => {
  const input = Object.freeze({ ...shareValuationDefaults });
  const first = shareValuationFrames(input), saved = structuredClone(first);
  assert.deepEqual(shareValuationFrames(input), first);
  first.frames[1].tiles[0].shares = -50;
  assert.equal(first.before.tiles[0].shares, 100); assert.equal(first.after.tiles[0].shares, 100);
  assert.equal(first.frames[2].tiles[0].shares, 100);
  assert.deepEqual(shareValuationFrames(input), saved); assert.deepEqual(input, shareValuationDefaults);
});

test('finite valuation adds residual only at year three and discounts the combined last cash once', () => {
  const r = cashFlowValuationFrames();
  assert.deepEqual(r.flows.map(f => f.futureCash), [10, 10, 90]);
  assert.deepEqual(r.flows.map(f => f.residualCash), [0, 0, 80]);
  close(r.flows[2].presentValue, 90 / 1.1 ** 3);
  close(r.totalPresentValue, 10 / 1.1 + 10 / 1.1 ** 2 + 90 / 1.1 ** 3);
  close(r.totalPresentValue, 84.97370398196841);
  assert.equal(r.undiscountedTotal, 110);
});

test('zero discount rate leaves future amounts unchanged without double counting residual', () => {
  const r = cashFlowValuationFrames({ ratePercent: 0 });
  assert.equal(r.totalPresentValue, 110); assert.equal(r.regularPresentTotal, 30); assert.equal(r.residualPresentTotal, 80);
  assert.equal(r.versusZeroRateDirection, 'same');
  for (const f of r.flows) { assert.equal(f.discountDivisor, 1); assert.equal(f.presentValue, f.futureCash); }
});

test('discount rate 20 percent is accepted and results match the exact finite formula', () => {
  const r = cashFlowValuationFrames({ ratePercent: 20 });
  close(r.totalPresentValue, 67.36111111111111); assert.equal(r.versusZeroRateDirection, 'down');
});

test('higher discount rate lowers a fixed positive future cash series', () => {
  let previous = Infinity;
  for (let ratePercent = 0; ratePercent <= 20; ratePercent += .5) {
    const r = cashFlowValuationFrames({ ratePercent });
    assert.ok(r.totalPresentValue < previous); previous = r.totalPresentValue;
    if (ratePercent > 0) {
      assert.equal(r.versusZeroRateDirection, 'down');
      assert.ok(r.flows[0].regularPresent > r.flows[1].regularPresent);
      assert.ok(r.flows[1].regularPresent > r.flows[2].regularPresent);
    }
  }
});

test('zero future cash remains zero and gives same prediction for every allowed rate', () => {
  for (const ratePercent of [0, 10, 20]) {
    const r = cashFlowValuationFrames({ annualCash: 0, residualCash: 0, ratePercent });
    assert.equal(r.totalPresentValue, 0); assert.equal(r.undiscountedTotal, 0); assert.equal(r.versusZeroRateDirection, 'same');
    for (const f of r.frames) {
      assert.equal(f.predictionOutcome, 'same'); assert.equal(f.observedPresentValue, 0);
      assert.equal(f.totalFraction, 0); assert.ok(f.totalSegments.every(p => p.fraction === 0));
    }
  }
});

test('residual-only and no-residual scenarios have no implied perpetual or later cash', () => {
  const only = cashFlowValuationFrames({ annualCash: 0 });
  assert.deepEqual(only.flows.map(f => f.futureCash), [0, 0, 80]); close(only.totalPresentValue, 80 / 1.1 ** 3);
  const none = cashFlowValuationFrames({ residualCash: 0 });
  close(none.totalPresentValue, 24.86851990984222); assert.equal(none.residualPresentTotal, 0);
  assert.equal(none.flows.length, 3);
});

test('observation frames accumulate contributions once and final summary adds no new cash', () => {
  const r = cashFlowValuationFrames();
  assert.deepEqual(r.frames.map(f => f.observedYears), [0, 1, 2, 3, 3]);
  assert.equal(r.frames[0].year1Present, null); assert.equal(r.frames[1].year2Present, null);
  assert.equal(r.frames[2].year3Present, null);
  for (const f of r.frames) {
    close(f.observedPresentValue, r.flows.slice(0, f.observedYears).reduce((s, x) => s + x.presentValue, 0));
    close(f.totalSegments.reduce((s, x) => s + x.value, 0), f.observedPresentValue);
  }
  assert.equal(r.frames[3].observedPresentValue, r.frames[4].observedPresentValue);
  assert.equal(r.summary.observedPresentValue, r.totalPresentValue);
});

test('all cash and total bar fractions encode values on one fixed 220-unit scale', () => {
  for (const options of [{}, { annualCash: 20, residualCash: 160, ratePercent: 0 }, { annualCash: 0, residualCash: 0 }, { ratePercent: 20 }]) {
    const r = cashFlowValuationFrames(options); assert.equal(r.scale, 220);
    for (const row of r.flows) {
      close(row.futureFraction * r.scale, row.futureCash); close(row.presentFraction * r.scale, row.presentValue);
      for (const segments of [row.futureSegments, row.presentSegments]) {
        for (const p of segments) { close(p.fraction * r.scale, p.value); assert.ok(p.fraction >= 0 && p.fraction <= 1); }
      }
      close(row.presentSegments.reduce((s, p) => s + p.value, 0), row.presentValue);
    }
    for (const f of r.frames) { close(f.totalFraction * r.scale, f.observedPresentValue); assert.ok(f.totalFraction <= 1); }
  }
});

test('maximal cash condition fits the fixed scale without clipping', () => {
  const r = cashFlowValuationFrames({ annualCash: 20, residualCash: 160, ratePercent: 0 });
  assert.equal(r.totalPresentValue, 220); assert.equal(r.summary.totalFraction, 1);
  close(r.summary.totalSegments.reduce((s, p) => s + p.fraction, 0), 1);
});

test('fractional cash remains unrounded until display and components sum to total', () => {
  const r = cashFlowValuationFrames({ annualCash: 1.23456789, residualCash: 35.777777, ratePercent: 7.5 });
  close(r.totalPresentValue, 1.23456789 / 1.075 + 1.23456789 / 1.075 ** 2 + (1.23456789 + 35.777777) / 1.075 ** 3);
  close(r.regularPresentTotal + r.residualPresentTotal, r.totalPresentValue);
});

test('cash model rejects nonfinite, negative or out-of-scope assumptions', () => {
  for (const options of [
    { annualCash: -1 }, { annualCash: 21 }, { annualCash: NaN }, { annualCash: null },
    { residualCash: -1 }, { residualCash: 161 }, { residualCash: Infinity },
    { ratePercent: -1 }, { ratePercent: 20.0001 }, { ratePercent: '10' }, { ratePercent: NaN },
  ]) assert.throws(() => cashFlowValuationFrames(options), RangeError);
});

test('cash replay is deterministic, input-preserving and isolates per-frame chart arrays', () => {
  const input = Object.freeze({ ...cashFlowValuationDefaults });
  const first = cashFlowValuationFrames(input), saved = structuredClone(first);
  assert.deepEqual(cashFlowValuationFrames(input), first);
  first.frames[1].contributions[0].futureSegments[0].value = -1;
  assert.equal(first.flows[0].futureSegments[0].value, 10);
  assert.equal(first.frames[2].contributions[0].futureSegments[0].value, 10);
  assert.deepEqual(cashFlowValuationFrames(input), saved); assert.deepEqual(input, cashFlowValuationDefaults);
});

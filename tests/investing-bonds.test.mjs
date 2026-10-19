import test from 'node:test';
import assert from 'node:assert/strict';
import { bondDefaults, bondFrames, bondPrice, classifyBondPrediction } from '../src/simulations/investing/bonds.mjs';

const close = (actual, expected, epsilon = 1e-8) => assert.ok(Math.abs(actual - expected) < epsilon, `${actual} != ${expected}`);

test('annual coupon equals required yield: par price and separate coupon/principal PV', () => {
  const result = bondFrames();
  close(result.price, 1000);
  close(result.couponRate, .05);
  close(result.couponPV + result.principalPV, result.price);
  close(result.pricingSummary.accumulatedPV, result.price);
  assert.equal(result.parDirection, 'same');
  assert.equal(result.priceDirection, 'same');
  for (const years of [1, 3, 10]) close(bondPrice({ years }), 1000);
});

test('same promises give lower prices for higher yields', () => {
  const low = bondFrames({ requiredYield: 0 }), base = bondFrames(), high = bondFrames({ requiredYield: .1 });
  close(low.price, 1150);
  close(high.price, 875.6574004507887);
  assert.ok(low.price > base.price && base.price > high.price);
  assert.equal(low.priceDirection, 'up');
  assert.equal(high.priceDirection, 'down');
  assert.deepEqual(low.schedule.map(row => row.promisedCash), high.schedule.map(row => row.promisedCash));
});

test('zero coupon and one-year terms preserve end-of-period payment timing', () => {
  const zero = bondFrames({ annualCoupon: 0 });
  close(zero.price, 1000 / 1.05 ** 3);
  assert.deepEqual(zero.schedule.map(row => row.promisedCash), [0, 0, 1000]);
  const one = bondFrames({ years: 1 });
  close(one.price, 1050 / 1.05);
  assert.deepEqual(one.schedule.map(row => [row.year, row.promisedCoupon, row.promisedPrincipal]), [[1, 50, 1000]]);
  assert.equal(one.input.failureYear, 1);
});

test('zero yield discounts no cash flows and preserves total promised cash', () => {
  const result = bondFrames({ requiredYield: 0 });
  for (const row of result.schedule) {
    assert.equal(row.discountFactor, 1);
    assert.equal(row.presentValue, row.promisedCash);
    assert.deepEqual(row.presentSegments, row.promisedSegments);
  }
  assert.equal(result.price, result.promisedTotal);
});

test('no original principal is paid before maturity; final coupon is counted once', () => {
  const result = bondFrames();
  assert.deepEqual(result.schedule.map(row => row.promisedPrincipal), [0, 0, 1000]);
  assert.deepEqual(result.schedule.map(row => row.promisedCoupon), [50, 50, 50]);
  assert.deepEqual(result.frames.map(row => row.actualCash), [0, 50, 100, 1150]);
  assert.deepEqual(result.frames.map(row => row.purchaseOutflow), [result.price, 0, 0, 0]);
  assert.equal(result.frames[0].promisedCash, 0);
  assert.equal(result.promisedTotal, 1150);
});

test('actual coupons and reduced recovery never change the original promised-price calculation', () => {
  const normal = bondFrames(), failure = bondFrames({ scenario: 'failure' });
  close(failure.price, normal.price);
  assert.deepEqual(failure.schedule.map(row => row.promisedCash), [50, 50, 1050]);
  assert.deepEqual(failure.schedule.map(row => row.actualCash), [50, 0, 400]);
  assert.deepEqual(failure.frames.map(row => row.actualCash), [0, 50, 50, 450]);
  assert.equal(failure.summary.missingCash, 700);
  close(failure.summary.netCashFlow, -550);
  close(failure.summary.holdingPeriodReturn, -.55);
  assert.equal(failure.summary.predictionOutcome, 'down');
});

test('holding-period return uses received cash only after final settlement, without reinvestment', () => {
  const result = bondFrames();
  assert.ok(result.frames.slice(0, -1).every(frame => frame.holdingPeriodReturn === null));
  close(result.summary.holdingPeriodReturn, .15);
  close(result.summary.netCashFlow, 150);
  assert.equal(result.summary.cumulativeActualCoupon, 150);
  assert.equal(result.summary.cumulativeActualPrincipal, 1000);
  assert.notEqual(result.summary.actualCash, 1000 * 1.05 ** 3);
  assert.equal(result.summary.predictionOutcome, 'up');
});

test('failure from first payment and zero recovery loses all original investment', () => {
  const result = bondFrames({ scenario: 'failure', failureYear: 1, recoveryRate: 0 });
  assert.ok(result.frames.every(frame => frame.actualCash === 0));
  close(result.summary.holdingPeriodReturn, -1);
  assert.equal(result.summary.missingCash, 1150);
});

test('full face recovery does not restore missed coupons', () => {
  const result = bondFrames({ scenario: 'failure', recoveryRate: 1 });
  assert.equal(result.summary.actualCash, 1050);
  assert.equal(result.summary.missingCash, 100);
  close(result.summary.holdingPeriodReturn, .05);
});

test('one-year default does not accidentally pay final coupon', () => {
  const result = bondFrames({ years: 1, scenario: 'failure' });
  assert.equal(result.schedule[0].actualCoupon, 0);
  assert.equal(result.schedule[0].actualPrincipal, 400);
  close(result.summary.holdingPeriodReturn, -.6);
});

test('zero face and zero coupons have zero price and undefined ratio denominators', () => {
  const result = bondFrames({ face: 0, annualCoupon: 0 });
  assert.equal(result.price, 0);
  assert.equal(result.couponRate, null);
  assert.equal(result.summary.holdingPeriodReturn, null);
  assert.equal(result.summary.netCashFlow, 0);
  assert.ok(result.sensitivity.every(point => point.price === 0 && Number.isFinite(point.y)));
});

test('all same-scale bar fractions and chart points read the same underlying values', () => {
  for (const options of [{}, { requiredYield: .2 }, { annualCoupon: 0 }, { face: 0, annualCoupon: 0 }, { face: 1000000, annualCoupon: 100000, years: 10 }, { scenario: 'failure' }]) {
    const result = bondFrames(options);
    for (const row of result.schedule) {
      for (const segments of [row.promisedSegments, row.presentSegments, row.actualSegments]) {
        for (const segment of segments) close(segment.fraction * result.paymentScale, segment.value);
        assert.ok(segments.reduce((total, segment) => total + segment.fraction, 0) <= 1 + 1e-10);
      }
    }
    for (const frame of result.frames) {
      close(frame.actualCash, frame.cumulativeActualCoupon + frame.cumulativeActualPrincipal);
      close(frame.actualCash - result.price, frame.netCashFlow);
      for (const segments of [frame.promisedSegments, frame.actualSegments]) for (const segment of segments) close(segment.fraction * result.cashScale, segment.value);
    }
    for (const point of result.sensitivity) {
      close(point.price, bondPrice({ ...options, requiredYield: point.requiredYield }));
      assert.ok(point.x >= 52 && point.x <= 318 && point.y >= 22 && point.y <= 188);
    }
    close(result.selectedPoint.price, result.price);
  }
});

test('farther equal coupons are discounted more at a positive yield', () => {
  const schedule = bondFrames({ requiredYield: .1 }).schedule;
  assert.ok(schedule[0].presentCoupon > schedule[1].presentCoupon);
  assert.ok(schedule[1].presentCoupon > schedule[2].presentCoupon);
});

test('pure deterministic re-runs do not mutate inputs or accumulate extra payments', () => {
  const options = Object.freeze({ scenario: 'failure', requiredYield: .1 });
  const first = bondFrames(options), second = bondFrames(options);
  assert.deepEqual(first, second);
  first.schedule[0].actualCash = 999;
  assert.equal(second.schedule[0].actualCash, 50);
  assert.equal(bondFrames(options).schedule[0].actualCash, 50);
  assert.equal(bondDefaults.requiredYield, .05);
});

test('invalid, negative, non-finite, fractional-term and out-of-range inputs are rejected', () => {
  for (const options of [
    { face: -1 }, { face: Infinity }, { face: 1000001 }, { annualCoupon: -1 }, { annualCoupon: 100001 },
    { requiredYield: -.001 }, { requiredYield: .201 }, { requiredYield: NaN }, { requiredYield: Infinity },
    { years: 0 }, { years: 1.5 }, { years: 11 }, { years: NaN },
    { recoveryRate: -1 }, { recoveryRate: 1.1 }, { recoveryRate: Infinity },
    { failureYear: 0 }, { failureYear: 4 }, { failureYear: 1.5 }, { scenario: 'unknown' },
  ]) assert.throws(() => bondFrames(options), RangeError);
});

test('prediction checks use unrounded model outcome and leave an unanswered choice ungraded', () => {
  assert.equal(classifyBondPrediction(bondFrames({ requiredYield: .1 }).priceDirection, 'down'), true);
  assert.equal(classifyBondPrediction(bondFrames().summary.predictionOutcome, 'down'), false);
  assert.equal(classifyBondPrediction('same', ''), null);
  assert.throws(() => classifyBondPrediction('invalid', 'up'), RangeError);
});

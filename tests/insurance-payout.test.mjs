import test from 'node:test';
import assert from 'node:assert/strict';
import {
  payoutDefaults, projectPayout, projectPayoutYear, createPayoutYear,
  submitPayoutClaim, previewPayoutClaim, startNextPayoutYear, projectFixedBenefit,
} from '../src/simulations/insurance/payout.mjs';

const sum = values => values.reduce((total, value) => total + value, 0);
// Rounding tolerance is only for IEEE-754 identities, never payment eligibility/caps.
const close = (actual, expected, scale = Math.max(1, Math.abs(expected))) =>
  assert.ok(Math.abs(actual - expected) <= 16 * Number.EPSILON * scale, `${actual} != ${expected}`);
const amounts = frame => Object.fromEntries(frame.segments.map(segment => [segment.id, segment.amount]));
const deepFreeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

function checkConservation(result) {
  const { params } = result;
  const scale = Math.max(1, params.loss, params.annualLimit);
  for (const frame of result.frames) {
    close(sum(frame.segments.map(segment => segment.amount)), params.loss);
    close(frame.resolvedBurden + frame.unresolved + frame.paid, params.loss);
    let left = 0;
    for (const segment of frame.segments) {
      assert.ok(segment.amount >= 0 && segment.amount <= params.loss);
      assert.ok(Number.isFinite(segment.amount));
      assert.ok(segment.fraction >= 0 && segment.fraction <= 1);
      assert.ok(segment.leftFraction >= 0 && segment.leftFraction <= 1);
      close(segment.fraction * params.loss, segment.amount, Math.max(1, params.loss));
      close(segment.leftFraction * params.loss, left, Math.max(1, params.loss));
      left += segment.amount;
    }
    close(sum(frame.segments.map(segment => segment.fraction)), params.loss === 0 ? 0 : 1);
  }
  close(result.paid + result.remainingBurden, params.loss);
  close(result.excluded + result.coveredLoss, params.loss);
  close(result.deductible + result.rateBase, result.coveredLoss, scale);
  close(result.coinsurance + result.payableBeforeCaps, result.rateBase, scale);
  close(result.capExcess + result.payableBeforeAnnual, result.payableBeforeCaps, scale);
  close(result.annualExcess + result.paid, result.payableBeforeAnnual, scale);
  close(result.annualRemainingBefore + params.annualUsed, params.annualLimit, scale);
  close(result.annualRemainingAfter + result.paid, result.annualRemainingBefore, scale);
  close(result.annualRemainingAfter + result.annualUsedAfter, params.annualLimit, scale);
  assert.ok(result.paid >= 0 && result.paid <= params.loss);
  assert.ok(result.paid <= params.perClaimLimit);
  assert.ok(result.paid <= result.annualRemainingBefore);
  assert.ok(result.payableBeforeCaps <= result.rateBase);
  assert.ok(result.annualRemainingAfter >= 0 && result.annualRemainingAfter <= params.annualLimit);
  assert.ok(result.annualUsedAfter >= params.annualUsed && result.annualUsedAfter <= params.annualLimit);
  assert.ok(result.remainingBurden >= 0 && result.remainingBurden <= params.loss);
  close(sum(result.segments.filter(segment => segment.id !== 'paid').map(segment => segment.amount)), result.remainingBurden, scale);
}

function checkYear(state, initialUsed = 0) {
  const scale = Math.max(1, state.params.annualLimit);
  const totalPaid = sum(state.claims.map(claim => claim.paid));
  close(initialUsed + totalPaid, state.annualUsed, scale);
  close(state.annualUsed + state.annualRemaining, state.params.annualLimit, scale);
  assert.ok(totalPaid <= state.params.annualLimit - initialUsed + 16 * Number.EPSILON * scale);
  state.claims.forEach(checkConservation);
}

test('default fictional contract pays 2m and partitions the 5m loss once', () => {
  const result = projectPayout();
  assert.deepEqual(result.params, payoutDefaults);
  assert.deepEqual(amounts(result.frames.at(-1)), {
    excluded: 1000000, deductible: 500000, coinsurance: 700000,
    capExcess: 800000, annualExcess: 0, paid: 2000000,
  });
  assert.equal(result.coveredLoss, 4000000);
  assert.equal(result.rateBase, 3500000);
  assert.equal(result.payableBeforeCaps, 2800000);
  assert.equal(result.payableBeforeAnnual, 2000000);
  assert.equal(result.paid, 2000000);
  assert.equal(result.remainingBurden, 3000000);
  assert.equal(result.annualRemainingBefore, 3000000);
  assert.equal(result.annualRemainingAfter, 1000000);
  assert.equal(result.annualUsedAfter, 2000000);
  assert.match(result.verdict, /가상 조건/);
  assert.deepEqual(result.segments, result.frames.at(-1).segments);
  checkConservation(result);
});

test('six observation frames preserve total loss and reveal the authored order only', () => {
  const result = projectPayout();
  assert.deepEqual(result.frames.map(frame => frame.phase), ['loss', 'exclusion', 'deductible', 'coinsurance', 'per-claim', 'annual']);
  assert.deepEqual(result.frames.map(frame => frame.index), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(result.frames.map(frame => frame.unresolved), [5000000, 4000000, 3500000, 2800000, 2000000, 0]);
  assert.deepEqual(result.frames.map(frame => frame.resolvedBurden), [0, 1000000, 1500000, 2200000, 3000000, 3000000]);
  assert.deepEqual(result.frames.map(frame => frame.paid), [0, 0, 0, 0, 0, 2000000]);
  const reveals = { excluded: 1, deductible: 2, coinsurance: 3, capExcess: 4, annualExcess: 5 };
  for (const frame of result.frames) {
    assert.ok(frame.label.length > 0 && frame.detail.length > 0);
    const values = amounts(frame);
    for (const [id, at] of Object.entries(reveals)) assert.equal(values[id], frame.index >= at ? result[id] : 0);
    assert.equal(values.unresolved ?? 0, frame.unresolved);
    assert.ok(frame.segments.every(segment => segment.label.length > 0));
    assert.equal(new Set(frame.segments.map(segment => segment.id)).size, frame.segments.length);
  }
  checkConservation(result);
});

test('second and third annual claims expose annual excess only at the final stage', () => {
  for (const [annualUsed, paid, annualExcess] of [[2000000, 1000000, 1000000], [3000000, 0, 2000000]]) {
    const result = projectPayout({ annualUsed });
    assert.equal(result.paid, paid);
    assert.equal(result.annualExcess, annualExcess);
    assert.equal(amounts(result.frames[4]).annualExcess, 0);
    assert.equal(result.frames[4].unresolved, 2000000);
    assert.equal(result.frames[5].unresolved, 0);
    assert.equal(result.remainingBurden, 5000000 - paid);
    checkConservation(result);
  }
});

test('annual projection contains exactly three complete identical claims paying 2m, 1m, 0', () => {
  const result = projectPayoutYear();
  assert.equal(result.claims.length, 3);
  assert.deepEqual(result.claims.map(claim => claim.paid), [2000000, 1000000, 0]);
  assert.deepEqual(result.claims.map(claim => claim.params.annualUsed), [0, 2000000, 3000000]);
  assert.deepEqual(result.claims.map(claim => claim.annualRemainingAfter), [1000000, 0, 0]);
  assert.deepEqual(result.claims.map(claim => claim.remainingBurden), [3000000, 4000000, 5000000]);
  assert.equal(result.totalPaid, 3000000);
  assert.equal(result.annualUsed, 3000000);
  assert.equal(result.annualRemaining, 0);
  assert.ok(result.claims.every(claim => claim.frames.length === 6));
  checkYear(result);
});

test('starting annual usage is retained and excessive usage normalizes to exhausted capacity', () => {
  const partial = projectPayoutYear({ annualUsed: 2500000 });
  assert.deepEqual(partial.claims.map(claim => claim.paid), [500000, 0, 0]);
  checkYear(partial, 2500000);
  for (const annualUsed of [3000000, 3000001, 1e12]) {
    const result = projectPayout({ annualUsed });
    assert.equal(result.params.annualUsed, 3000000);
    assert.equal(result.annualRemainingBefore, 0);
    assert.equal(result.paid, 0);
    assert.equal(result.annualExcess, 2000000);
    checkConservation(result);
  }
});

test('claim submission consumes annual capacity once; reading and replaying frames cannot reset it', () => {
  const initial = deepFreeze(createPayoutYear());
  const once = deepFreeze(submitPayoutClaim(initial));
  assert.equal(initial.annualUsed, 0);
  assert.equal(initial.claims.length, 0);
  assert.equal(once.annualUsed, 2000000);
  assert.equal(once.claims.length, 1);
  const replay = projectPayout(once.claims[0].params);
  assert.deepEqual(replay, once.claims[0]);
  for (let replayIndex = 0; replayIndex < 4; replayIndex++) {
    assert.equal(projectPayout({ ...once.params, annualUsed: once.annualUsed }).paid, 1000000);
  }
  assert.equal(once.annualUsed, 2000000);
  const twice = submitPayoutClaim(once), thrice = submitPayoutClaim(twice);
  assert.deepEqual(thrice.claims.map(claim => claim.paid), [2000000, 1000000, 0]);
  assert.equal(submitPayoutClaim(thrice).claims.at(-1).paid, 0);
  checkYear(thrice);
});

test('explicit new insurance year resets usage and claim list while retaining contract conditions', () => {
  const old = deepFreeze(submitPayoutClaim(submitPayoutClaim(createPayoutYear({ insurerRate: .9 }))));
  const next = startNextPayoutYear(old);
  assert.equal(old.year, 1);
  assert.equal(old.annualUsed, 3000000);
  assert.equal(next.year, 2);
  assert.equal(next.annualUsed, 0);
  assert.equal(next.annualRemaining, 3000000);
  assert.deepEqual(next.claims, []);
  assert.equal(next.params.insurerRate, .9);
  assert.equal(submitPayoutClaim(next).claims[0].paid, 2000000);
  assert.equal(startNextPayoutYear(next).year, 3);
  checkYear(next);
});

test('changing a new claim updates settings without rewriting history or replenishing annual usage', () => {
  const once = deepFreeze(submitPayoutClaim(createPayoutYear()));
  const overrides = deepFreeze({ loss: 1200000, excluded: 100000, deductible: 100000, insurerRate: .75, perClaimLimit: 900000 });
  const twice = submitPayoutClaim(once, overrides);
  assert.deepEqual(twice.claims[0], once.claims[0]);
  assert.equal(twice.claims[1].paid, 750000);
  assert.equal(twice.annualUsed, 2750000);
  assert.equal(twice.annualRemaining, 250000);
  assert.deepEqual(twice.params, { ...once.params, ...overrides });
  const resetControls = { ...payoutDefaults };
  delete resetControls.annualLimit;
  delete resetControls.annualUsed;
  const third = submitPayoutClaim(twice, resetControls);
  assert.equal(third.claims[2].paid, 250000);
  assert.equal(third.annualUsed, 3000000);
  assert.equal(third.params.loss, 5000000);
  const next = startNextPayoutYear(twice);
  assert.deepEqual(next.params, twice.params);
  assert.equal(next.annualUsed, 0);
  assert.equal(submitPayoutClaim(next).claims[0].paid, 750000);
  checkYear(third);
});

test('loss zero keeps every frame and proportional width at zero', () => {
  const result = projectPayout({ loss: 0 });
  assert.equal(result.paid, 0);
  assert.equal(result.remainingBurden, 0);
  assert.equal(result.annualUsedAfter, 0);
  assert.match(result.verdict, /손실이 없어/);
  for (const frame of result.frames) for (const segment of frame.segments) {
    assert.equal(segment.amount, 0);
    assert.equal(segment.fraction, 0);
    assert.equal(segment.leftFraction, 0);
  }
  checkConservation(result);
});

test('exclusion beyond loss is logically clamped and cannot create a negative rate base', () => {
  for (const excluded of [5000000, 5000001, 1e12]) {
    const result = projectPayout({ excluded });
    assert.equal(result.params.excluded, excluded);
    assert.equal(result.excluded, 5000000);
    assert.equal(result.coveredLoss, 0);
    assert.equal(result.deductible, 0);
    assert.equal(result.rateBase, 0);
    assert.equal(result.paid, 0);
    assert.equal(result.remainingBurden, 5000000);
    checkConservation(result);
  }
});

test('deductible is applied after exclusion and bounded by the remaining covered loss', () => {
  for (const deductible of [3999999, 4000000, 4000001, 1e12]) {
    const result = projectPayout({ deductible, insurerRate: 1 });
    assert.equal(result.deductible, Math.min(4000000, deductible));
    assert.equal(result.paid, deductible < 4000000 ? 1 : 0);
    checkConservation(result);
  }
});

test('zero and full insurer rates preserve the split without extra money', () => {
  const none = projectPayout({ insurerRate: 0 });
  assert.equal(none.coinsurance, 3500000);
  assert.equal(none.paid, 0);
  const full = projectPayout({ insurerRate: 1, perClaimLimit: 1e12, annualLimit: 1e12 });
  assert.equal(full.coinsurance, 0);
  assert.equal(full.paid, 3500000);
  const entire = projectPayout({ excluded: 0, deductible: 0, insurerRate: 1, perClaimLimit: 1e12, annualLimit: 1e12 });
  assert.equal(entire.remainingBurden, 0);
  assert.match(entire.verdict, /전부가 보험금/);
  [none, full, entire].forEach(checkConservation);
});

test('per-claim and annual zero caps attribute the shortfall to the correct stage', () => {
  const perClaim = projectPayout({ perClaimLimit: 0 });
  assert.equal(perClaim.paid, 0);
  assert.equal(perClaim.capExcess, 2800000);
  assert.equal(perClaim.annualExcess, 0);
  const annual = projectPayout({ annualLimit: 0 });
  assert.equal(annual.paid, 0);
  assert.equal(annual.capExcess, 800000);
  assert.equal(annual.annualExcess, 2000000);
  const both = projectPayout({ perClaimLimit: 0, annualLimit: 0 });
  assert.equal(both.capExcess, 2800000);
  assert.equal(both.annualExcess, 0);
  [perClaim, annual, both].forEach(checkConservation);
});

test('exact cap boundaries and a one-won difference are not rounded away', () => {
  for (const limit of [2799999, 2800000, 2800001]) {
    const result = projectPayout({ perClaimLimit: limit, annualLimit: 1e12 });
    assert.equal(result.paid, Math.min(2800000, limit));
    assert.equal(result.capExcess, limit < 2800000 ? 1 : 0);
    checkConservation(result);
  }
  for (const annualLimit of [1999999, 2000000, 2000001]) {
    const result = projectPayout({ annualLimit });
    assert.equal(result.paid, Math.min(2000000, annualLimit));
    assert.equal(result.annualExcess, annualLimit < 2000000 ? 1 : 0);
    checkConservation(result);
  }
});

test('fractional won remain fractional and annual rounding cannot overpay the final claim', () => {
  const options = { loss: .1, excluded: 0, deductible: 0, insurerRate: 1, perClaimLimit: 1, annualLimit: .3 };
  const result = projectPayoutYear(options);
  assert.equal(result.claims[0].paid, .1);
  assert.equal(result.claims[1].paid, .1);
  assert.equal(result.claims[2].paid, .3 - .2);
  assert.equal(result.totalPaid, .3);
  assert.equal(result.annualRemaining, 0);
  checkYear(result);
  const fraction = projectPayout({ loss: 1 / 3, excluded: .01, deductible: .02, insurerRate: .713, perClaimLimit: 1, annualLimit: 1 });
  assert.equal(fraction.paid, ((1 / 3 - .01) - .02) * .713);
  assert.notEqual(fraction.paid, Math.round(fraction.paid));
  checkConservation(fraction);
});

test('large finite and near-equal boundary amounts retain conservation without overflow', () => {
  for (const options of [
    { loss: 1e12, excluded: 0, deductible: 0, insurerRate: 1, perClaimLimit: 1e12, annualLimit: 1e12 },
    { loss: 1e12, excluded: 999999999999.9, deductible: .01, insurerRate: .8, annualUsed: 2999999.99 },
    { loss: 999999999999.9, excluded: 1 / 3, deductible: .2, insurerRate: 1 - Number.EPSILON, perClaimLimit: 1e12, annualLimit: 1e12 },
    { loss: 1e12, excluded: 0, deductible: 0, insurerRate: 1, perClaimLimit: 1e12, annualLimit: 1e12, annualUsed: 999999999999.9 },
    { loss: Number.MIN_VALUE, excluded: 0, deductible: 0, insurerRate: 1, perClaimLimit: 1, annualLimit: 1 },
  ]) checkConservation(projectPayout(options));
});

test('all zero inputs and negative zero normalize to finite positive zeros', () => {
  const zeros = Object.fromEntries(Object.keys(payoutDefaults).map(key => [key, -0]));
  const result = projectPayout(zeros);
  const check = value => {
    if (typeof value === 'number') {
      assert.ok(Number.isFinite(value));
      assert.equal(Object.is(value, -0), false);
    } else if (value && typeof value === 'object') Object.values(value).forEach(check);
  };
  check(result);
  check(projectPayoutYear(zeros));
  check(projectFixedBenefit({ eventEligible: true, amount: -0 }));
  checkConservation(result);
});

test('broad deterministic fractional and large-value combinations preserve all caps and frame identities', () => {
  const values = [0, Number.MIN_VALUE, .1, 1 / 3, 1.23, 1000000, 999999999999.9, 1e12];
  for (let index = 0; index < 512; index++) {
    const options = {
      loss: values[index % values.length], excluded: values[Math.floor(index / 8) % values.length],
      deductible: values[Math.floor(index / 64) % values.length],
      insurerRate: [0, .1, 1 / 3, .8, 1 - Number.EPSILON, 1][index % 6],
      perClaimLimit: values[(index * 3) % values.length], annualLimit: values[(index * 5) % values.length],
      annualUsed: values[(index * 7) % values.length],
    };
    checkConservation(projectPayout(options));
    const year = projectPayoutYear(options);
    checkYear(year, year.params.annualUsed);
  }
});

test('many successive small claims and condition changes never replenish the annual cap', () => {
  let state = createPayoutYear({ loss: .07, excluded: 0, deductible: 0, insurerRate: 1, perClaimLimit: 1, annualLimit: 3.3 });
  let previousUsed = 0;
  for (let index = 0; index < 100; index++) {
    state = submitPayoutClaim(state, { loss: index % 2 === 0 ? .07 : .13 });
    assert.ok(state.annualUsed >= previousUsed);
    previousUsed = state.annualUsed;
    checkYear(state);
  }
  assert.equal(state.annualUsed, 3.3);
  assert.equal(state.annualRemaining, 0);
  assert.equal(state.claims.at(-1).paid, 0);
});

test('fixed benefits depend only on the event and agreed amount, separate from loss allocation', () => {
  const eligible = projectFixedBenefit({ eventEligible: true, amount: 10000000 });
  const ineligible = projectFixedBenefit({ eventEligible: false, amount: 10000000 });
  assert.equal(eligible.paid, 10000000);
  assert.equal(ineligible.paid, 0);
  assert.ok(eligible.paid > projectPayout().params.loss);
  assert.equal(projectFixedBenefit({ eventEligible: true, amount: 0 }).paid, 0);
  assert.equal(projectFixedBenefit({ eventEligible: true, amount: 1 / 3 }).paid, 1 / 3);
  assert.equal(projectFixedBenefit({ eventEligible: true, amount: 1e12 }).paid, 1e12);
  assert.equal('segments' in eligible, false);
  assert.equal('loss' in eligible, false);
  assert.match(eligible.verdict, /조건을 충족/);
});

test('inputs and defaults remain immutable and independent projections reproduce identical observations', () => {
  const options = deepFreeze({ loss: 5432109.8765, insurerRate: .713, annualUsed: 123456.789 });
  const before = structuredClone(options);
  const first = projectPayout(options), second = projectPayout(options);
  assert.deepEqual(first, second);
  first.frames[0].segments[0].amount = 123;
  first.params.loss = 7;
  assert.deepEqual(second, projectPayout(options));
  assert.deepEqual(options, before);
  assert.ok(Object.isFrozen(payoutDefaults));
  const year = deepFreeze(createPayoutYear(options));
  assert.deepEqual(submitPayoutClaim(year), submitPayoutClaim(year));
  assert.deepEqual(startNextPayoutYear(year), startNextPayoutYear(year));
  assert.deepEqual(projectPayoutYear(options), projectPayoutYear(options));
});

test('invalid money, rates and non-object options are rejected rather than coerced', () => {
  for (const key of ['loss', 'excluded', 'deductible', 'perClaimLimit', 'annualLimit', 'annualUsed']) {
    for (const value of [-1, 1e12 + 1, NaN, Infinity, -Infinity, '1', null, undefined, true]) {
      assert.throws(() => projectPayout({ [key]: value }), RangeError);
      assert.throws(() => projectPayoutYear({ [key]: value }), RangeError);
      assert.throws(() => createPayoutYear({ [key]: value }), RangeError);
    }
  }
  for (const insurerRate of [-.1, 1.00001, NaN, Infinity, '0.8', null, undefined, true]) {
    assert.throws(() => projectPayout({ insurerRate }), RangeError);
  }
  for (const options of [null, [], 1, 'default', false]) {
    assert.throws(() => projectPayout(options), TypeError);
    assert.throws(() => projectPayoutYear(options), TypeError);
    assert.throws(() => createPayoutYear(options), TypeError);
  }
});

test('claim overrides cannot reset usage or change the annual contract, and invalid year states fail', () => {
  const state = createPayoutYear();
  for (const options of [{ annualUsed: 0 }, { annualLimit: 9e6 }, { unexpected: 1 }]) {
    assert.throws(() => submitPayoutClaim(state, options), RangeError);
  }
  for (const options of [null, [], false, 'new']) assert.throws(() => submitPayoutClaim(state, options), TypeError);
  assert.throws(() => submitPayoutClaim(state, { loss: -1 }), RangeError);
  for (const invalid of [null, [], false, 1]) assert.throws(() => submitPayoutClaim(invalid), TypeError);
  for (const year of [0, -1, .5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => submitPayoutClaim({ ...state, year }), RangeError);
  }
  assert.throws(() => startNextPayoutYear({ ...state, year: Number.MAX_SAFE_INTEGER }), RangeError);
  assert.throws(() => submitPayoutClaim({ ...state, claims: null }), TypeError);
  assert.throws(() => submitPayoutClaim({ ...state, params: null }), TypeError);
  assert.throws(() => submitPayoutClaim({ ...state, annualUsed: 3000001 }), RangeError);
  assert.throws(() => submitPayoutClaim({ ...state, annualRemaining: 100 }), RangeError);
});

test('fixed benefit validates strict event booleans and bounded finite money', () => {
  for (const eventEligible of [0, 1, 'true', null, undefined]) {
    assert.throws(() => projectFixedBenefit({ eventEligible, amount: 1 }), TypeError);
  }
  for (const amount of [-1, NaN, Infinity, 1e12 + 1, '1', null, undefined]) {
    assert.throws(() => projectFixedBenefit({ eventEligible: true, amount }), RangeError);
  }
  for (const options of [undefined, null, [], 1, 'default', false]) assert.throws(() => projectFixedBenefit(options), TypeError);
});

test('annual capacity and cumulative claim geometry are model-derived on a shared annual scale', () => {
  let state = createPayoutYear();
  assert.equal(state.annualUsedFraction, 0);
  assert.equal(state.annualRemainingFraction, 1);
  assert.deepEqual(state.annualSegments, []);
  state = submitPayoutClaim(state);
  assert.deepEqual(state.annualSegments, [{ index: 0, amount: 2000000, fraction: 2 / 3, leftFraction: 0 }]);
  state = submitPayoutClaim(state);
  state = submitPayoutClaim(state);
  assert.equal(state.annualUsedFraction, 1);
  assert.equal(state.annualRemainingFraction, 0);
  assert.deepEqual(state.annualSegments, [
    { index: 0, amount: 2000000, fraction: 2 / 3, leftFraction: 0 },
    { index: 1, amount: 1000000, fraction: 1 / 3, leftFraction: 2 / 3 },
    { index: 2, amount: 0, fraction: 0, leftFraction: 1 },
  ]);
  const projection = projectPayoutYear();
  assert.deepEqual(projection.annualSegments, state.annualSegments);
  assert.equal(projection.annualUsedFraction, state.annualUsedFraction);
  assert.equal(projection.annualRemainingFraction, state.annualRemainingFraction);
  const resumed = submitPayoutClaim(createPayoutYear({ annualUsed: 2500000 }));
  assert.equal(resumed.initialAnnualUsed, 2500000);
  assert.equal(resumed.annualSegments[0].leftFraction, 5 / 6);
  assert.equal(resumed.annualSegments[0].fraction, 1 / 6);
  const next = startNextPayoutYear(resumed);
  assert.equal(next.initialAnnualUsed, 0);
  assert.deepEqual(next.annualSegments, []);
  assert.equal(next.annualRemainingFraction, 1);
  const zero = projectPayoutYear({ annualLimit: 0 });
  assert.equal(zero.annualUsedFraction, 0);
  assert.equal(zero.annualRemainingFraction, 0);
  assert.ok(zero.annualSegments.every(segment => segment.amount === 0 && segment.fraction === 0 && segment.leftFraction === 0));
});

test('tiny repeated payments near a large annual cap cannot disappear from the ledger', () => {
  const initialUsed = 999999999999.9999;
  const initialRemaining = 1e12 - initialUsed;
  let state = createPayoutYear({ loss: .00001, excluded: 0, deductible: 0, insurerRate: 1, perClaimLimit: 1, annualLimit: 1e12, annualUsed: initialUsed });
  for (let index = 0; index < 40; index++) {
    const before = structuredClone(state);
    const preview = previewPayoutClaim(state);
    const submitted = submitPayoutClaim(state);
    assert.deepEqual(preview, submitted.claims.at(-1));
    assert.deepEqual(state, before);
    assert.ok(preview.paid <= before.annualRemaining);
    state = submitted;
  }
  const paid = sum(state.claims.map(claim => claim.paid));
  close(paid, initialRemaining, initialRemaining);
  assert.ok(paid <= initialRemaining + 2 * Number.EPSILON * initialRemaining);
  assert.equal(state.annualRemaining, 0);
  assert.equal(state.annualUsed, 1e12);
  assert.equal(state.claims.at(-1).paid, 0);
  assert.equal(previewPayoutClaim(state, { loss: 1e12 }).paid, 0);
});

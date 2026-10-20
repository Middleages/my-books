import test from 'node:test';
import assert from 'node:assert/strict';
import { projectTimelines, timelinesDefaults, timelinesTerms, timelineBoundaryCases } from '../src/simulations/insurance/timelines.mjs';

function checkModel(result) {
  assert.equal(result.frames.length, 13);
  assert.deepEqual(result.axis.ticks.map(tick => tick.year), [0, 2, 4, 6, 8, 10, 12]);
  assert.equal(result.axis.premiumMax, 240000);
  for (const tick of result.axis.ticks) assert.equal(tick.position, tick.year / 12);
  for (const contract of result.contracts) {
    assert.equal(contract.coverage.fraction, (contract.coverage.end - contract.coverage.start) / 12);
    assert.equal(contract.totalPremium, contract.payments.reduce((sum, p) => sum + p.amount, 0));
    for (const payment of contract.payments) {
      assert.equal(payment.position, payment.year / 12);
      assert.equal(payment.heightFraction, payment.amount / result.axis.premiumMax);
      assert(payment.amount > 0 && payment.heightFraction <= 1);
    }
    for (const frame of result.frames) {
      const current = frame[contract.id];
      assert.equal(frame.index, frame.year);
      assert.equal(frame.phase, `year-${frame.year}`);
      assert.equal(frame.position, frame.year / 12);
      assert.equal(current.premium, contract.payments.find(p => p.year === frame.year)?.amount ?? 0);
      assert.equal(current.cumulativePremium, contract.payments.filter(p => p.year <= frame.year).reduce((sum, p) => sum + p.amount, 0));
      assert.equal(current.covered, frame.year >= contract.coverage.start && frame.year < contract.coverage.end);
      assert.equal(current.paymentPeriodEnded, frame.year >= contract.paymentPeriodEnd);
      assert.equal(current.paidCount, contract.payments.filter(p => p.year <= frame.year).length);
    }
  }
}

test('timeline defaults use a 12-year shared scale and independent five-year payment / ten-year coverage', () => {
  const result = projectTimelines();
  assert.deepEqual(result.params, timelinesDefaults);
  assert.equal(result.axis.start, 0);
  assert.equal(result.axis.end, 12);
  assert.deepEqual(timelinesTerms.renewalAnnualPremiums, [120000, 140000, 170000, 200000, 240000]);
  assert.equal(result.contracts[0].paymentPeriodEnd, 5);
  assert.deepEqual(result.contracts[0].payments.map(p => p.year), [0, 1, 2, 3, 4]);
  assert.equal(result.contracts[0].coverage.end, 10);
  checkModel(result);
});

test('year zero is after the first payment, not a fictitious zero-cost opening frame', () => {
  const { fixed, renewing, renewal } = projectTimelines().frames[0];
  assert.equal(fixed.premium, 100000); assert.equal(fixed.cumulativePremium, 100000);
  assert.equal(renewing.premium, 120000); assert.equal(renewing.cumulativePremium, 120000);
  assert.equal(fixed.paidCount, 1); assert.equal(renewing.paidCount, 1);
  assert.equal(fixed.covered, true); assert.equal(renewing.covered, true);
  assert.equal(renewal.state, 'initial');
});

test('four-year final payment and five-year payment-period boundary are distinct', () => {
  const { frames } = projectTimelines();
  assert.equal(frames[4].fixed.premium, 100000);
  assert.equal(frames[4].fixed.cumulativePremium, 500000);
  assert.equal(frames[4].fixed.paymentPeriodEnded, false);
  assert.equal(frames[4].fixed.paymentStatus, '마지막 납입');
  assert.equal(frames[5].fixed.premium, 0);
  assert.equal(frames[5].fixed.cumulativePremium, 500000);
  assert.equal(frames[5].fixed.paymentPeriodEnded, true);
  assert.equal(frames[5].fixed.covered, true);
});

test('renewal means a two-year price segment but payments still occur every year', () => {
  const result = projectTimelines();
  assert.deepEqual(result.frames.map(f => f.renewing.premium), [120000, 120000, 140000, 140000, 170000, 170000, 200000, 200000, 240000, 240000, 0, 0, 0]);
  assert.deepEqual(result.renewals.map(r => r.year), [2, 4, 6, 8]);
  for (const year of [2, 4, 6, 8]) assert.equal(result.frames[year].renewal.state, 'renewed');
  for (const year of [1, 3, 5, 7, 9]) assert.equal(result.frames[year].renewal.state, 'continuing');
  assert.equal(result.frames[5].renewing.cumulativePremium, 860000);
  assert.equal(result.contracts[1].totalPremium, 1740000);
  assert.equal(result.frames[9].renewing.cumulativePremium, 1740000);
});

for (const year of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) test(`timeline exact year ${year} obeys the common coverage end`, () => {
  const frame = projectTimelines().frames[year];
  assert.equal(frame.fixed.covered, year < 10);
  assert.equal(frame.renewing.covered, year < 10);
  if (year >= 10) {
    assert.equal(frame.fixed.premium, 0); assert.equal(frame.renewing.premium, 0);
    assert.equal(frame.fixed.cumulativePremium, 500000); assert.equal(frame.renewing.cumulativePremium, 1740000);
    assert.equal(frame.renewal.state, 'ended');
  }
});

for (const stopRenewalYear of [2, 4, 6, 8]) test(`nonrenewal at ${stopRenewalYear} removes that boundary payment and all later new-event coverage`, () => {
  const result = projectTimelines({ stopRenewalYear }), base = projectTimelines();
  const stopped = result.frames[stopRenewalYear], previous = result.frames[stopRenewalYear - 1];
  assert.equal(stopped.renewing.premium, 0);
  assert.equal(stopped.renewing.covered, false);
  assert.equal(previous.renewing.covered, true);
  assert.equal(stopped.renewal.state, 'stopped');
  assert.equal(stopped.renewing.cumulativePremium, previous.renewing.cumulativePremium);
  assert.equal(result.contracts[1].coverage.end, stopRenewalYear);
  assert.equal(result.contracts[1].payments.length, stopRenewalYear);
  assert.equal(result.renewals.find(r => r.year === stopRenewalYear).state, 'stopped');
  for (const renewal of result.renewals) assert.equal(renewal.state, renewal.year < stopRenewalYear ? 'renewed' : renewal.year === stopRenewalYear ? 'stopped' : 'inactive');
  for (const period of result.periods) assert.equal(period.active, period.start < stopRenewalYear);
  for (const frame of result.frames) {
    assert.deepEqual(frame.fixed, base.frames[frame.year].fixed);
    if (frame.year >= stopRenewalYear) {
      assert.equal(frame.renewing.premium, 0);
      assert.equal(frame.renewing.covered, false);
      assert.equal(frame.renewing.paymentStatus, '갱신 중단');
      assert.equal(frame.renewing.cumulativePremium, previous.renewing.cumulativePremium);
      assert.equal(frame.renewal.state, frame.year === stopRenewalYear ? 'stopped' : 'inactive');
    }
  }
  checkModel(result);
});

test('stop-four total is 52만원 and no phantom year-four 17만원 is charged', () => {
  const result = projectTimelines({ stopRenewalYear: 4 });
  assert.equal(result.contracts[1].totalPremium, 520000);
  assert.equal(result.frames[4].renewing.cumulativePremium, 520000);
  assert.equal(result.frames[4].fixed.cumulativePremium, 500000);
});

test('boundary snapshots are exact references to annual frames, never interpolations', () => {
  for (const stopRenewalYear of [null, 2, 4, 6, 8]) {
    const result = projectTimelines({ stopRenewalYear }), rows = timelineBoundaryCases({ stopRenewalYear });
    assert.deepEqual(rows.map(f => f.year), [0, 1, 2, 4, 5, 8, 9, 10, 12]);
    for (const row of rows) assert.deepEqual(row, result.frames[row.year]);
  }
});

test('renewal price map and plot geometry remain fixed under all stop plans', () => {
  const base = projectTimelines();
  for (const stopRenewalYear of [2, 4, 6, 8]) {
    const result = projectTimelines({ stopRenewalYear });
    assert.deepEqual(result.axis, base.axis);
    assert.deepEqual(result.periods.map(({ active, ...rest }) => rest), base.periods.map(({ active, ...rest }) => rest));
    assert.deepEqual(result.contracts[0], base.contracts[0]);
    assert.equal(result.comparison.answer, 'coverage-continues');
  }
});

test('timeline inputs reject unsupported years and values without coercion or rounding', () => {
  for (const value of [null, [], 'x', 5, false]) assert.throws(() => projectTimelines(value), TypeError);
  for (const stopRenewalYear of [undefined, NaN, Infinity, -Infinity, -2, 0, 1, 3, 5, 7, 9, 10, 12, 2.5, '4', true, {}, []]) assert.throws(() => projectTimelines({ stopRenewalYear }), RangeError);
});

test('deterministic runs and resets do not leak mutable arrays or frame state', () => {
  const options = Object.freeze({ stopRenewalYear: 4 });
  assert.deepEqual(projectTimelines(options), projectTimelines(options));
  assert.deepEqual(projectTimelines(timelinesDefaults), projectTimelines());
  const result = projectTimelines();
  result.frames[0].fixed.cumulativePremium = 0;
  result.contracts[0].payments[0].amount = 1;
  result.periods[0].annualPremium = 1;
  assert.equal(result.frames[1].fixed.cumulativePremium, 200000);
  assert.equal(projectTimelines().frames[0].fixed.cumulativePremium, 100000);
  assert.equal(projectTimelines().contracts[0].payments[0].amount, 100000);
  assert.equal(timelinesTerms.renewalAnnualPremiums[0], 120000);
  assert(Object.isFrozen(timelinesTerms.renewalAnnualPremiums));
});

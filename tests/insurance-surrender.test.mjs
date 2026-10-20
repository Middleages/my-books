import test from 'node:test';
import assert from 'node:assert/strict';
import { surrenderContract, surrenderDefaults, surrenderSchedule, surrenderQuote, projectSurrender } from '../src/simulations/insurance/surrender.mjs';

const expectedQuotes = [0, 20000, 50000, 90000, 140000, 200000, 220000, 240000, 260000, 280000];
const close = (actual, expected) => assert(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

test('the fictional quote table is explicit, frozen and independent of any inferred fee formula', () => {
  assert.deepEqual(surrenderSchedule, expectedQuotes);
  assert(Object.isFrozen(surrenderSchedule));
  assert(Object.isFrozen(surrenderContract));
  assert(Object.isFrozen(surrenderContract.paymentYears));
  assert.deepEqual(surrenderContract.paymentYears, [0, 1, 2, 3, 4]);
  assert.equal(surrenderContract.annualPremium, 100000);
  assert.equal(surrenderContract.coverageEnd, 10);
  assert.equal(surrenderContract.observationEnd, 12);
  assert.equal(surrenderContract.maturityBenefit, 0);
});
for (let year = 0; year <= 9; year++) {
  test(`year ${year}: exact table quote follows the due payment and ends future new-event coverage`, () => {
    const r = projectSurrender({ exitYear: year }), f = r.frame;
    assert.equal(surrenderQuote(year), expectedQuotes[year]);
    assert.equal(f.kind, 'surrender');
    assert.equal(f.phase, `surrender-${year}`);
    assert.equal(f.index, year);
    assert.equal(f.exitYear, year);
    assert.equal(f.paymentCount, Math.min(year + 1, 5));
    assert.equal(f.remainingScheduledPremium, Math.max(4 - year, 0) * 100000);
    assert.equal(f.cumulativePremium, Math.min(year + 1, 5) * 100000);
    assert.equal(f.surrenderValue, expectedQuotes[year]);
    assert.equal(f.maturityValue, null);
    assert.equal(f.exitValue, expectedQuotes[year]);
    assert.equal(f.coverageEnd, year);
    assert.equal(f.coverageAfterExit, false);
    assert.equal(f.timeline[year].paidPremium, year <= 4 ? 100000 : 0);
    assert.equal(f.timeline[year].newEventCovered, false);
    assert.equal(f.timeline[year].coverageStatus, 'canceled');
    assert.equal(f.timeline[year].exitHere, true);
    assert.equal(f.timeline[year].cashAtExit, expectedQuotes[year]);
    assert.equal(f.difference, f.cumulativePremium - f.exitValue);
    assert.equal(f.returnRatio, f.exitValue / f.cumulativePremium);
    assert.equal(f.comparison, 'less');
  });
}

test('year zero means AFTER first premium, not an unpaid quote or a withdrawal-rights model', () => {
  const f = projectSurrender({ exitYear: 0 }).frame;
  assert.equal(f.cumulativePremium, 100000);
  assert.equal(f.surrenderValue, 0);
  assert.equal(f.returnRatio, 0);
  assert.equal(f.difference, 100000);
  assert.deepEqual(f.paymentEvents.map(event => event.paid), [true, false, false, false, false]);
  assert.equal(f.coverageSegments[0].fraction, 0);
  assert(f.timeline.every(row => !row.newEventCovered));
});

test('last payment is at year four and year five is a no-payment quote with the same cumulative premium', () => {
  const r = projectSurrender(), four = r.frames[4], five = r.frames[5];
  assert.equal(four.cumulativePremium, 500000);
  assert.equal(five.cumulativePremium, 500000);
  assert.equal(four.timeline[4].paidPremium, 100000);
  assert.equal(five.timeline[5].paidPremium, 0);
  assert.equal(four.surrenderValue, 140000);
  assert.equal(five.surrenderValue, 200000);
  assert.equal(five.returnRatio, .4);
});

test('year ten is a separately defined maturity, never a zero-valued surrender quote', () => {
  const r = projectSurrender({ exitYear: 10 }), f = r.frame;
  assert.equal(f.kind, 'maturity');
  assert.equal(f.phase, 'maturity-10');
  assert.equal(f.surrenderValue, null);
  assert.equal(f.maturityValue, 0);
  assert.equal(f.exitValue, 0);
  assert.equal(f.cumulativePremium, 500000);
  assert.equal(f.timeline[10].scheduledPremium, 0);
  assert.equal(f.timeline[10].paidPremium, 0);
  assert.equal(f.timeline[9].newEventCovered, true);
  assert.equal(f.timeline[10].newEventCovered, false);
  assert.equal(f.timeline[10].coverageStatus, 'outside');
  assert.equal(f.timeline[10].exitHere, true);
  assert.equal(f.coverageSegments[1].fraction, 0);
  assert.equal(r.quotes.length, 10);
  assert(r.quotes.every(row => row.kind === 'surrender'));
  assert.equal(r.maturity, f);
  assert.throws(() => surrenderQuote(10), RangeError);
});

test('the final year-nine quote does not flow into or extrapolate a year-ten maturity value', () => {
  const r = projectSurrender();
  assert.equal(r.frames[9].exitValue, 280000);
  assert.equal(r.frames[10].exitValue, 0);
  assert.notEqual(r.frames[10].exitValue, r.frames[9].exitValue);
  assert.notEqual(r.frames[10].exitValue, 300000);
});

test('coverage is the half-open interval before selected exit, never every future year after paid-up status', () => {
  for (const f of projectSurrender().frames) {
    assert.equal(f.timeline.filter(row => row.newEventCovered).length, f.exitYear);
    for (const row of f.timeline) {
      assert.equal(row.newEventCovered, row.year < f.exitYear);
      assert.equal(row.coverageStatus, row.year < f.exitYear ? 'covered' : row.year < 10 ? 'canceled' : 'outside');
    }
  }
});

test('future due payments stop after cancellation without deleting payments made before and at the boundary', () => {
  for (const f of projectSurrender().frames) {
    for (const event of f.paymentEvents) {
      assert.equal(event.paid, event.year <= f.exitYear);
      assert.equal(event.amount, event.year <= f.exitYear ? 100000 : 0);
      assert.equal(f.timeline[event.year].paidPremium, event.amount);
    }
    assert.equal(f.paymentEvents.reduce((sum, event) => sum + event.amount, 0), f.cumulativePremium);
    assert.equal(f.timeline.reduce((sum, row) => sum + row.paidPremium, 0), f.cumulativePremium);
    assert(f.timeline.slice(f.exitYear + 1).every(row => row.paidPremium === 0));
  }
});

test('each hypothetical contract has one exit event; refunds are not repeatedly collected or continued after cancellation', () => {
  for (const f of projectSurrender().frames) {
    assert.equal(f.timeline.filter(row => row.exitHere).length, 1);
    assert.equal(f.timeline.reduce((sum, row) => sum + row.cashAtExit, 0), f.exitValue);
    assert(f.timeline.filter(row => !row.exitHere).every(row => row.cashAtExit === 0));
  }
});

test('three contiguous coverage regions exactly span the common twelve-year axis', () => {
  for (const f of projectSurrender().frames) {
    assert.deepEqual(f.coverageSegments.map(segment => segment.id), ['covered', 'canceled', 'outside']);
    let end = 0, fractionSum = 0;
    for (const s of f.coverageSegments) {
      assert.equal(s.start, end);
      assert(s.end >= s.start);
      assert.equal(s.startFraction, s.start / 12);
      assert.equal(s.fraction, (s.end - s.start) / 12);
      end = s.end;
      fractionSum += s.fraction;
    }
    assert.equal(end, 12);
    close(fractionSum, 1);
    assert.equal(f.exitTimeFraction, f.exitYear / 12);
    assert.equal(f.coverageSegments[0].end, f.coverageEnd);
    assert.equal(f.coverageSegments[1].end, 10);
  }
});

test('all bars use one fixed 500000-won axis and the difference starts where the return ends', () => {
  const r = projectSurrender();
  assert.equal(r.moneyScale, 500000);
  for (const f of r.frames) {
    assert.equal(f.paidFraction, f.cumulativePremium / r.moneyScale);
    assert.equal(f.exitFraction, f.exitValue / r.moneyScale);
    assert.equal(f.differenceFraction, f.difference / r.moneyScale);
    close(f.exitFraction + f.differenceFraction, f.paidFraction);
    close(f.paymentEvents.reduce((sum, event) => sum + event.moneyFraction, 0), f.paidFraction);
    for (const value of [f.paidFraction, f.exitFraction, f.differenceFraction]) assert(Number.isFinite(value) && value >= 0 && value <= 1);
  }
});

test('each alternative frame, selected result, static quote row and maturity reuse the same definitions', () => {
  const r = projectSurrender();
  assert.equal(r.frames.length, 11);
  assert.deepEqual(r.frames.map(f => f.index), Array.from({ length: 11 }, (_, i) => i));
  assert.equal(new Set(r.frames.map(f => f.phase)).size, 11);
  assert.equal(new Set(r.frames.map(f => f.label)).size, 11);
  for (const f of r.frames) {
    assert.deepEqual(projectSurrender({ exitYear: f.exitYear }).frame, f);
    assert.equal(f.kind, f.exitYear === 10 ? 'maturity' : 'surrender');
    assert.equal(f.surrenderValue === null, f.kind === 'maturity');
    assert.equal(f.maturityValue === null, f.kind === 'surrender');
  }
});

test('neither quotes nor exit choices interpolate intermediate times or extrapolate beyond their domains', () => {
  for (const value of [-1, -.1, .1, 4.5, 9.001, 9.5, 10, 11, 1e12, NaN, Infinity, -Infinity, '5', null, undefined, true, false, {}, []]) {
    assert.throws(() => surrenderQuote(value), RangeError, `quote accepted ${String(value)}`);
  }
  for (const value of [-1, -.1, .1, 4.5, 9.001, 10.1, 11, 1e12, NaN, Infinity, -Infinity, '5', null, undefined, true, false, {}, []]) {
    assert.throws(() => projectSurrender({ exitYear: value }), RangeError, `exit accepted ${String(value)}`);
  }
});

test('malformed option containers fail rather than silently coercing input', () => {
  for (const value of [null, [], 0, 1, '5', true, false]) assert.throws(() => projectSurrender(value), TypeError);
});

test('repeated runs and resetting to year zero do not accumulate payment or cash events', () => {
  const p = Object.freeze({ exitYear: 5 });
  const a = projectSurrender(p), b = projectSurrender(p);
  assert.deepEqual(a, b);
  assert.deepEqual(projectSurrender(surrenderDefaults), projectSurrender());
  assert.deepEqual(projectSurrender().params, { exitYear: 0 });
  a.frames[0].paymentEvents[0].amount = 123;
  a.frames[0].coverageSegments[0].end = 999;
  a.frames[0].timeline[0].paidPremium = 123;
  assert.equal(a.frames[1].paymentEvents[0].amount, 100000);
  assert.equal(a.frames[1].coverageSegments[0].end, 1);
  assert.equal(a.frames[1].timeline[0].paidPremium, 100000);
  assert.deepEqual(projectSurrender(p), b);
  assert.deepEqual(surrenderSchedule, expectedQuotes);
});

test('after the last due payment there is no future premium saving to attribute to surrender', () => {
  const r = projectSurrender();
  assert.equal(r.frames[2].remainingScheduledPremium, 200000);
  assert.equal(r.frames[3].remainingScheduledPremium, 100000);
  for (const f of r.frames.slice(4, 10)) {
    assert.equal(f.remainingScheduledPremium, 0);
    assert.match(f.detail, /납입은 이미 끝나 더 줄어드는 보험료는 없습니다/);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { claimsDefaults, claimsAssumptions, claimsScenarios, projectClaims, simulateClaimCash } from '../src/simulations/insurance/claims.mjs';

const close = (a, b) => assert(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test('fixed assumptions and outcomes are explicit, frozen, fictional and separately named', () => {
  assert.deepEqual(claimsDefaults, { scenario: 'standard', startingCash: 1000000, day: 0 });
  assert.deepEqual(claimsAssumptions, { expense: 3000000, requestedAmount: 2000000, incidentDay: 0, claimDay: 2, dueDay: 5, observationEnd: 20, moneyScale: 3000000 });
  for (const value of [claimsDefaults, claimsAssumptions, claimsScenarios, ...claimsScenarios]) assert(Object.isFrozen(value));
  assert.deepEqual(claimsScenarios.map(s => s.id), ['standard', 'same-day', 'delayed', 'denied', 'partial']);
});

test('default day-five liquidity shortfall is not erased by day-ten settlement', () => {
  const r = projectClaims(), before = r.frames[4], due = r.frames[5], receipt = r.frames[10];
  assert.equal(before.shortfallAtDue, null);
  assert.equal(before.availableCash, 1000000);
  assert.equal(before.notYetDue, 3000000);
  assert.equal(due.availableCash, 0);
  assert.equal(due.paidToday, 1000000);
  assert.equal(due.unfunded, 2000000);
  assert.equal(due.shortfallAtDue, 2000000);
  assert.equal(receipt.receipt, 2000000);
  assert.equal(receipt.paidToday, 2000000);
  assert.equal(receipt.paidToDate, 3000000);
  assert.equal(receipt.unfunded, 0);
  assert.equal(receipt.availableCash, 0);
  for (const row of r.frames.slice(5)) assert.equal(row.shortfallAtDue, 2000000);
  assert.equal(r.prediction, 'shortfall');
});

test('claim, acceptance, determination and receipt remain distinct facts', () => {
  const r = projectClaims();
  assert.equal(r.frames[2].phase, 'accept');
  assert.equal(r.frames[2].confirmedAmount, null);
  assert.equal(r.frames[2].receivedToDate, 0);
  assert.equal(r.frames[7].confirmedAmount, null);
  assert.equal(r.frames[8].confirmedAmount, 2000000);
  assert.equal(r.frames[8].receivedToDate, 0);
  assert.equal(r.frames[9].receivedToDate, 0);
  assert.equal(r.frames[10].receivedToDate, 2000000);
  assert.equal(r.frames[10].expectedReceipt, 0);
  assert(r.frames.every(row => row.requestedAmount === 2000000));
});

test('receipt on the due date is credited first and fills the same expense exactly once', () => {
  const r = projectClaims({ scenario: 'same-day' }), f = r.due;
  assert.equal(f.receipt, 2000000);
  assert.equal(f.cashBeforePayment, 3000000);
  assert.equal(f.paidToday, 3000000);
  assert.equal(f.availableCash, 0);
  assert.equal(f.unfunded, 0);
  assert.equal(f.shortfallAtDue, 0);
  assert.equal(r.prediction, 'enough');
  assert.deepEqual(r.timelineEvents.filter(event => event.day === 5).map(event => event.id), ['receipt', 'due']);
  assert.equal(r.frames.reduce((sum, row) => sum + row.paidToday, 0), 3000000);
});

test('late receipt lengthens unmet expense without increasing or clearing the historical shortfall', () => {
  const r = projectClaims({ scenario: 'delayed' });
  assert.equal(r.scenario.arrivalDay, 18);
  for (const row of r.frames.slice(5, 18)) assert.equal(row.unfunded, 2000000);
  assert.equal(r.frames[18].unfunded, 0);
  assert.equal(r.final.shortfallAtDue, 2000000);
  assert.equal(r.frames[6].phase, 'documents');
  assert.equal(r.frames[9].phase, 'investigation');
  assert.equal(r.frames[16].phase, 'decision');
  assert.equal(r.frames[18].phase, 'receipt');
});

test('documents and investigation are conditional branches, not mandatory stages', () => {
  for (const scenario of claimsScenarios) {
    const r = projectClaims({ scenario: scenario.id });
    assert(r.frames.every(frame => frame.branch.every(branch => branch.enabled === scenario.branch)));
    if (scenario.id !== 'delayed') {
      assert(r.frames.every(frame => frame.branch.every(branch => branch.status === 'not-needed')));
      assert(r.frames.every(frame => frame.phase !== 'documents' && frame.phase !== 'investigation'));
    }
  }
});

test('denial has no arrival event, cash or imaginary eventual payment', () => {
  const r = projectClaims({ scenario: 'denied' });
  assert.equal(r.scenario.payableAmount, 0);
  assert.equal(r.scenario.arrivalDay, null);
  assert(r.frames.every(frame => frame.receipt === 0 && frame.receivedToDate === 0 && frame.expectedReceipt === 0));
  assert.equal(r.frames[8].confirmedAmount, 0);
  assert.equal(r.frames[7].confirmedAmount, null);
  assert.equal(r.final.unfunded, 2000000);
  assert.equal(r.final.shortfallAtDue, 2000000);
  assert(!r.events.some(event => event.id === 'receipt'));
  assert(r.frames.every(frame => frame.process.find(stage => stage.id === 'receipt').status === 'unavailable'));
});

test('partial payment leaves an unmet expense, not a fictional second installment', () => {
  const r = projectClaims({ scenario: 'partial' });
  assert.equal(r.frames[8].confirmedAmount, 1000000);
  assert.equal(r.frames[10].receivedToDate, 1000000);
  assert.equal(r.frames[10].unfunded, 1000000);
  assert.equal(r.final.unfunded, 1000000);
  assert.equal(r.final.paidToDate, 2000000);
  assert.equal(r.final.shortfallAtDue, 2000000);
  assert.equal(r.frames.reduce((sum, row) => sum + row.receipt, 0), 1000000);
  assert.equal(r.final.expectedReceipt, 0);
});

for (const scenario of claimsScenarios) {
  test(`${scenario.id}: every frame conserves cash and expense across all cash-slider conditions`, () => {
    for (let cash = 0; cash <= 3000000; cash += 250000) {
      const r = projectClaims({ scenario: scenario.id, startingCash: cash });
      let previousReceived = 0, previousPaid = 0;
      for (const frame of r.frames) {
        assert.equal(frame.availableCash + frame.paidToDate, cash + frame.receivedToDate);
        assert.equal(frame.paidToDate + frame.unfunded + frame.notYetDue, 3000000);
        assert.equal(frame.receivedToDate - previousReceived, frame.receipt);
        assert.equal(frame.paidToDate - previousPaid, frame.paidToday);
        assert(frame.availableCash >= 0 && frame.unfunded >= 0 && frame.paidToday >= 0);
        assert(frame.paidToday <= frame.cashBeforePayment);
        if (frame.day >= 5) assert.equal(frame.shortfallAtDue, r.due.shortfallAtDue);
        else assert.equal(frame.shortfallAtDue, null);
        previousReceived = frame.receivedToDate; previousPaid = frame.paidToDate;
      }
      assert.equal(r.final.receivedToDate, scenario.payableAmount);
      assert.equal(r.prediction, r.due.shortfallAtDue > 0 ? 'shortfall' : 'enough');
    }
  });
}

test('zero cash is zero money, not assumed borrowing, and sufficient starting cash leaves later receipts available', () => {
  const zero = projectClaims({ startingCash: 0 }), enough = projectClaims({ startingCash: 3000000 });
  assert.equal(zero.due.paidToday, 0);
  assert.equal(zero.due.unfunded, 3000000);
  assert.equal(zero.final.unfunded, 1000000);
  assert.equal(zero.final.availableCash, 0);
  assert.equal(enough.due.shortfallAtDue, 0);
  assert.equal(enough.due.availableCash, 0);
  assert.equal(enough.final.availableCash, 2000000);
  assert.equal(enough.final.unfunded, 0);
});

test('all money geometry is bounded and preserves the same 300만원 scale', () => {
  for (const scenario of claimsScenarios) for (const startingCash of [0, 1, 999999, 1000000, 2999999, 3000000]) {
    const r = projectClaims({ scenario: scenario.id, startingCash });
    assert.equal(r.moneyScale, 3000000);
    assert.equal(r.observationEnd, 20);
    for (const frame of r.frames) {
      assert.equal(frame.cashFraction, frame.availableCash / r.moneyScale);
      assert.equal(frame.historyFraction, (frame.shortfallAtDue ?? 0) / r.moneyScale);
      close(frame.dueSegments.reduce((sum, part) => sum + part.fraction, 0), 1);
      for (const part of frame.dueSegments) {
        assert.equal(part.fraction, part.amount / r.moneyScale);
        assert(part.fraction >= 0 && part.fraction <= 1);
        assert(part.startFraction + part.fraction <= 1);
      }
      for (const fraction of [frame.cashFraction, frame.historyFraction, frame.timeFraction]) assert(Number.isFinite(fraction) && fraction >= 0 && fraction <= 1);
      assert.equal(frame.cashPoint.x, 54 + frame.day / 20 * 508);
      assert.equal(frame.cashPoint.y, 204 - frame.availableCash / 3000000 * 174);
      assert.equal(frame.unfundedPoint.y, 204 - frame.unfunded / 3000000 * 174);
      assert.equal(frame.historyPoint === null, frame.shortfallAtDue === null);
    }
    for (const event of r.events) assert.equal(event.fraction, event.day / 20);
  }
});

test('the chart keeps step transitions rather than interpolating imaginary income between events', () => {
  const r = projectClaims();
  for (const key of ['cashPath', 'unfundedPath', 'historyPath']) {
    assert.match(r.chart[key], /^M/);
    assert(!/[LCQ]/.test(r.chart[key]));
    assert(!/NaN|Infinity|undefined/.test(r.chart[key]));
  }
  assert(r.chart.historyPath.startsWith(`M${r.chart.dueX},88`));
  assert.equal(r.chart.receiptX, r.frames[10].cashPoint.x);
  assert.deepEqual(r.chart.xTicks.map(t => t.day), [0, 5, 10, 15, 20]);
  assert.deepEqual(r.chart.yTicks.map(t => t.amount), [0, 1000000, 2000000, 3000000]);
});

test('selected frame, checkpoints, static table and recomputed state are identical', () => {
  const r = projectClaims();
  assert.equal(r.frames.length, 21);
  assert.equal(r.frame, r.frames[0]);
  assert.equal(r.due, r.frames[5]);
  assert.equal(r.final, r.frames[20]);
  for (const frame of r.frames) assert.deepEqual(projectClaims({ day: frame.day }).frame, frame);
  for (const frame of r.checkpoints) assert.equal(frame, r.frames[frame.day]);
  assert.equal(new Set(r.checkpoints.map(f => f.day)).size, r.checkpoints.length);
});

test('zero-day same-day boundary processes a receipt before the only due obligation', () => {
  const rows = simulateClaimCash({ startingCash: 0, expense: 1, dueDay: 0, receiptDay: 0, receiptAmount: 1, observationEnd: 0 });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].receipt, 1);
  assert.equal(rows[0].shortfallAtDue, 0);
  assert.equal(rows[0].paidToDate, 1);
  assert.equal(rows[0].availableCash, 0);
  assert.equal(rows[0].unfunded, 0);
});

test('zero expenses, zero receipts, and no receipt remain finite without fabricated deficits', () => {
  for (const receiptDay of [null, 0, 1]) {
    const rows = simulateClaimCash({ startingCash: 0, expense: 0, dueDay: 0, receiptDay, receiptAmount: 0, observationEnd: 1 });
    assert(rows.every(row => row.shortfallAtDue === 0 && row.availableCash === 0 && row.unfunded === 0 && row.paidToDate === 0));
  }
});

test('one-day earlier/on-time/later changes due history at the exact boundary', () => {
  for (const receiptDay of [4, 5, 6]) {
    const rows = simulateClaimCash({ startingCash: 0, expense: 100, dueDay: 5, receiptDay, receiptAmount: 100, observationEnd: 6 });
    assert.equal(rows[5].shortfallAtDue, receiptDay <= 5 ? 0 : 100);
    assert.equal(rows[6].unfunded, 0);
    assert.equal(rows[6].shortfallAtDue, receiptDay <= 5 ? 0 : 100);
  }
});

test('receipt beyond the expense remains cash, not extra payment or a negative obligation', () => {
  const rows = simulateClaimCash({ startingCash: 10, expense: 3, dueDay: 0, receiptDay: 1, receiptAmount: 5, observationEnd: 1 });
  assert.equal(rows[0].paidToDate, 3);
  assert.equal(rows[0].availableCash, 7);
  assert.equal(rows[1].paidToday, 0);
  assert.equal(rows[1].availableCash, 12);
  assert.equal(rows[1].unfunded, 0);
});

test('large supported amounts preserve integer conservation without overflow', () => {
  const rows = simulateClaimCash({ startingCash: 1000000000000, expense: 1000000000000, dueDay: 1, receiptDay: 0, receiptAmount: 1000000000000, observationEnd: 1 });
  for (const row of rows) {
    assert(Number.isSafeInteger(row.availableCash));
    assert.equal(row.availableCash + row.paidToDate, 1000000000000 + row.receivedToDate);
  }
});

for (const field of ['dueDay', 'receiptDay', 'observationEnd']) {
  test(`${field}: malformed dates are rejected without coercion or truncation`, () => {
    for (const value of [-1, -.01, .1, 1.5, 366, NaN, Infinity, -Infinity, undefined, '5', true, false, {}, []]) {
      assert.throws(() => simulateClaimCash({ [field]: value }), RangeError, `${field} accepted ${String(value)}`);
    }
    if (field !== 'receiptDay') assert.throws(() => simulateClaimCash({ [field]: null }), RangeError);
  });
}

test('dates outside observation and positive receipt without date are explicit errors', () => {
  assert.throws(() => simulateClaimCash({ dueDay: 21 }), RangeError);
  assert.throws(() => simulateClaimCash({ receiptDay: 21 }), RangeError);
  assert.throws(() => simulateClaimCash({ observationEnd: 4 }), RangeError);
  assert.throws(() => simulateClaimCash({ receiptDay: null, receiptAmount: 1 }), RangeError);
  assert.throws(() => projectClaims({ day: 21 }), RangeError);
  for (const value of [-1, .5, '0', null, undefined, NaN, Infinity]) assert.throws(() => projectClaims({ day: value }), RangeError);
});

for (const field of ['startingCash', 'expense', 'receiptAmount']) {
  test(`${field}: invalid money is rejected without silently creating funds`, () => {
    for (const value of [-1, .01, 1000000000001, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, -Infinity, undefined, null, '100', true, false, {}, []]) assert.throws(() => simulateClaimCash({ [field]: value }), RangeError);
  });
}

test('malformed option containers and unknown scenario names are rejected', () => {
  for (const value of [null, [], 0, 1, 'default', true, false]) {
    assert.throws(() => projectClaims(value), TypeError);
    assert.throws(() => simulateClaimCash(value), TypeError);
  }
  for (const value of ['unknown', '', null, undefined, 0, true]) assert.throws(() => projectClaims({ scenario: value }), RangeError);
  assert.throws(() => projectClaims({ startingCash: 3000001 }), RangeError);
});

test('seeking, replay and reset recompute from zero with no duplicate payment', () => {
  const options = Object.freeze({ scenario: 'delayed', startingCash: 500000, day: 18 });
  const a = projectClaims(options), b = projectClaims(options);
  assert.deepEqual(a, b);
  assert.deepEqual(projectClaims(claimsDefaults), projectClaims());
  a.frames[0].dueSegments[0].amount = 123;
  a.frames[0].process[0].label = 'changed';
  a.frames[0].branch[0].enabled = false;
  assert.equal(a.frames[1].dueSegments[0].amount, 0);
  assert.equal(a.frames[1].process[0].label, '청구');
  assert.equal(a.frames[1].branch[0].enabled, true);
  assert.deepEqual(projectClaims(options), b);
});

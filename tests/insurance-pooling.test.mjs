import test from 'node:test';
import assert from 'node:assert/strict';
import { poolingDefaults, projectPooling } from '../src/simulations/insurance/pooling.mjs';

// IEEE-754 sum tolerance only; classifications and payment bounds remain exact.
const close = (actual, expected, scale = Math.max(1, Math.abs(expected))) =>
  assert.ok(Math.abs(actual - expected) <= 1e-12 * scale, `${actual} != ${expected}`);
const sum = values => values.reduce((total, value) => total + value, 0);

function checkConservation(result) {
  for (const frame of result.frames) {
    close(frame.notYetContributed + frame.remaining + frame.totalPaid, frame.initialCombinedFunds);
    close(frame.reserve + frame.contributionsCollected, frame.available);
    close(frame.remaining + frame.totalPaid, frame.available);
    close(frame.totalPaid + frame.pendingClaims, frame.totalClaims);
    close(sum(frame.households.map(row => row.contribution)), frame.contributionsCollected);
    close(sum(frame.households.map(row => row.claim)), frame.totalClaims);
    close(sum(frame.households.map(row => row.paid)), frame.totalPaid);
    // Subtracting large near-equal claims/payments must use their scale, not the tiny residual.
    close(sum(frame.households.map(row => row.unpaid)), frame.pendingClaims, Math.max(1, frame.totalClaims, frame.totalPaid));
    assert.equal(frame.unfunded, Math.max(0, frame.totalClaims - frame.available));
    assert.ok(frame.totalPaid >= 0 && frame.totalPaid <= frame.available);
    assert.ok(frame.remaining >= 0 && frame.pendingClaims >= 0);
    for (const row of frame.households) {
      close(row.paid + row.unpaid, row.claim);
      assert.ok(row.paid >= 0 && row.paid <= row.claim);
      assert.ok(row.unpaid >= 0);
    }
  }
}

test('20 authored households contribute 100,000 each and combine with 1m initial reserve', () => {
  const result = projectPooling();
  assert.equal(result.households.length, 20);
  assert.deepEqual(result.households.map(row => row.id), Array.from({ length: 20 }, (_, index) => index + 1));
  assert.ok(result.households.every(row => row.contribution === 100000));
  assert.equal(result.totalContributions, 2000000);
  assert.equal(result.initialReserve, 1000000);
  assert.equal(result.initialCombinedFunds, 3000000);
  assert.equal(result.available, 3000000);
  assert.equal(result.totalClaims, 2000000);
  assert.equal(result.totalPaid, 2000000);
  assert.equal(result.remaining, 1000000);
  assert.equal(result.unfunded, 0);
  assert.equal(result.canCoverAllClaims, true);
  assert.equal(result.paymentRatio, 1);
  checkConservation(result);
});

test('8-household common-shock example leaves exactly 5m unfunded after the 3m pool is used', () => {
  const result = projectPooling({ affectedCount: 8 });
  assert.equal(result.totalClaims, 8000000);
  assert.equal(result.totalPaid, 3000000);
  assert.equal(result.remaining, 0);
  assert.equal(result.unfunded, 5000000);
  assert.equal(result.pendingClaims, 5000000);
  assert.equal(result.paymentRatio, .375);
  assert.equal(result.canCoverAllClaims, false);
  assert.deepEqual(result.households.filter(row => row.affected).map(row => row.id), [1, 2, 3, 4, 5, 6, 7, 8]);
  for (const row of result.households.slice(0, 8)) {
    assert.equal(row.claim, 1000000);
    assert.equal(row.paid, 375000);
    assert.equal(row.unpaid, 625000);
    assert.deepEqual(row.localFractions, { paid: .375, unpaid: .625 });
  }
  checkConservation(result);
});

test('observation frames move money once from households into the pool and then to claimants', () => {
  const result = projectPooling({ affectedCount: 8 });
  assert.deepEqual(result.frames.map(frame => frame.phase), ['initial', 'contributions', 'claims', 'payments']);
  assert.deepEqual(result.frames.map(frame => frame.index), [0, 1, 2, 3]);
  assert.deepEqual(result.frames.map(frame => frame.notYetContributed), [2000000, 0, 0, 0]);
  assert.deepEqual(result.frames.map(frame => frame.contributionsCollected), [0, 2000000, 2000000, 2000000]);
  assert.deepEqual(result.frames.map(frame => frame.totalClaims), [0, 0, 8000000, 8000000]);
  assert.deepEqual(result.frames.map(frame => frame.totalPaid), [0, 0, 0, 3000000]);
  assert.deepEqual(result.frames.map(frame => frame.remaining), [1000000, 3000000, 3000000, 0]);
  assert.deepEqual(result.frames.map(frame => frame.pendingClaims), [0, 0, 8000000, 5000000]);
  assert.deepEqual(result.frames.map(frame => frame.unfunded), [0, 0, 5000000, 5000000]);
  assert.ok(result.frames[0].households.every(row => !row.affected && row.contribution === 0 && row.claim === 0));
  assert.deepEqual(result.households, result.frames[3].households);
});

test('the two authored shocks retain a common 8m chart scale without tank saturation', () => {
  const individual = projectPooling(), common = projectPooling({ affectedCount: 8 });
  assert.equal(individual.moneyScale, 8000000);
  assert.equal(common.moneyScale, 8000000);
  assert.equal(individual.fractions.available, .375);
  assert.equal(common.fractions.available, .375);
  assert.equal(individual.fractions.claims, .25);
  assert.equal(common.fractions.claims, 1);
  assert.equal(common.fractions.unfunded, .625);
  assert.equal(common.frames[1].fractions.reserve + common.frames[1].fractions.contributions, common.frames[1].fractions.available);
});

test('all geometry including local claim splits reads exact model amounts without minimum widths', () => {
  const fields = {
    contributions: 'contributionsCollected', reserve: 'reserve', available: 'available',
    claims: 'totalClaims', paid: 'totalPaid', remaining: 'remaining', unfunded: 'unfunded',
    pendingClaims: 'pendingClaims', notYetContributed: 'notYetContributed', initialCombinedFunds: 'initialCombinedFunds',
  };
  for (const options of [{}, { affectedCount: 8 }, { contribution: 0, reserve: 0 }, { lossPerHousehold: 0 }, { contribution: 1e12, reserve: 1e12, lossPerHousehold: 1e12, affectedCount: 20 }]) {
    const result = projectPooling(options);
    for (const frame of result.frames) {
      for (const [key, field] of Object.entries(fields)) {
        close(frame.fractions[key] * result.moneyScale, frame[field]);
        assert.ok(frame.fractions[key] >= 0 && frame.fractions[key] <= 1);
        if (frame[field] === 0) assert.equal(frame.fractions[key], 0);
      }
      for (const row of frame.households) {
        for (const [key, fraction] of Object.entries(row.fractions)) {
          close(fraction * result.moneyScale, row[key]);
          assert.ok(fraction >= 0 && fraction <= 1);
        }
        for (const key of ['paid', 'unpaid']) {
          close(row.localFractions[key] * result.params.lossPerHousehold, row[key]);
          assert.ok(row.localFractions[key] >= 0 && row.localFractions[key] <= 1);
        }
      }
    }
  }
});

test('no affected households means no claims, no payments and all collected money remains', () => {
  const result = projectPooling({ affectedCount: 0 });
  assert.equal(result.totalClaims, 0);
  assert.equal(result.totalPaid, 0);
  assert.equal(result.remaining, 3000000);
  assert.equal(result.unfunded, 0);
  assert.equal(result.paymentRatio, 1);
  assert.equal(result.canCoverAllClaims, true);
  assert.ok(result.households.every(row => !row.affected && row.paid === 0 && row.claim === 0));
  checkConservation(result);
});

test('zero loss and all-zero amounts remain finite and never create payments', () => {
  for (const options of [{ lossPerHousehold: 0 }, { contribution: 0, reserve: 0, lossPerHousehold: 0, affectedCount: 20 }]) {
    const result = projectPooling(options);
    assert.equal(result.totalClaims, 0);
    assert.equal(result.totalPaid, 0);
    assert.equal(result.unfunded, 0);
    assert.equal(result.paymentRatio, 1);
    for (const row of result.households) assert.deepEqual(row.localFractions, { paid: 0, unpaid: 0 });
    checkConservation(result);
  }
});

test('zero reserve and contributions leave claims unfunded without generating cash', () => {
  const result = projectPooling({ contribution: 0, reserve: 0, affectedCount: 8 });
  assert.equal(result.available, 0);
  assert.equal(result.totalPaid, 0);
  assert.equal(result.remaining, 0);
  assert.equal(result.unfunded, 8000000);
  assert.equal(result.paymentRatio, 0);
  assert.ok(result.households.slice(0, 8).every(row => row.paid === 0 && row.unpaid === 1000000));
  checkConservation(result);
});

test('exactly sufficient pool pays every claim while one won less preserves the shortfall', () => {
  const exact = projectPooling({ affectedCount: 3 });
  assert.equal(exact.totalClaims, exact.available);
  assert.equal(exact.totalPaid, 3000000);
  assert.equal(exact.remaining, 0);
  assert.equal(exact.unfunded, 0);
  assert.equal(exact.canCoverAllClaims, true);
  const short = projectPooling({ affectedCount: 3, reserve: 999999 });
  assert.equal(short.unfunded, 1);
  assert.equal(short.canCoverAllClaims, false);
  checkConservation(exact);
  checkConservation(short);
});

test('every affected count from zero to twenty preserves funds and is capped by the pool', () => {
  for (let affectedCount = 0; affectedCount <= 20; affectedCount++) {
    const result = projectPooling({ affectedCount });
    assert.equal(result.totalClaims, affectedCount * 1000000);
    assert.equal(result.totalPaid, Math.min(result.available, result.totalClaims));
    assert.equal(result.households.filter(row => row.affected).length, affectedCount);
    assert.equal(result.canCoverAllClaims, affectedCount <= 3);
    checkConservation(result);
  }
});

test('fractional won are retained; the final allocation absorbs floating-point residue without display rounding', () => {
  for (const affectedCount of [1, 3, 7, 13, 20]) for (const lossPerHousehold of [.1, .25, 1 / 3, 1.1234567]) {
    for (const contribution of [0, .01, .2]) {
      const result = projectPooling({ contribution, reserve: .1, lossPerHousehold, affectedCount });
      checkConservation(result);
      for (const row of result.households.filter(row => row.affected)) close(row.paid, result.totalPaid / affectedCount);
    }
  }
  const result = projectPooling({ reserve: 0, contribution: .01, affectedCount: 3, lossPerHousehold: 1 });
  assert.ok(result.households[0].paid > .06 && result.households[0].paid < .07);
  assert.equal(sum(result.households.map(row => row.paid)), result.totalPaid);
});

test('fully funded fractional claims never overpay the final row through floating-point residue', () => {
  for (const households of [3, 7, 100]) for (const lossPerHousehold of [.1, 1 / 3, 999999999999.9, 1e12]) {
    const result = projectPooling({ households, affectedCount: households, contribution: lossPerHousehold, reserve: 0, lossPerHousehold });
    assert.equal(result.canCoverAllClaims, true);
    assert.equal(result.totalPaid, result.totalClaims);
    assert.equal(result.pendingClaims, 0);
    assert.equal(result.unfunded, 0);
    for (const row of result.households) {
      assert.equal(row.paid, row.claim);
      assert.equal(row.unpaid, 0);
      assert.deepEqual(row.localFractions, { paid: 1, unpaid: 0 });
    }
    checkConservation(result);
  }
});

test('almost fully funded fractional claims keep residual allocation inside each actual claim', () => {
  for (const households of [3, 7, 100]) for (const lossPerHousehold of [.1, 999999999999.9]) {
    const result = projectPooling({ households, affectedCount: households, contribution: lossPerHousehold * (1 - Number.EPSILON), reserve: 0, lossPerHousehold });
    for (const row of result.households) {
      assert.ok(row.paid >= 0 && row.paid <= row.claim);
      assert.ok(row.unpaid >= 0);
      assert.ok(row.localFractions.paid >= 0 && row.localFractions.paid <= 1);
      assert.ok(row.localFractions.unpaid >= 0 && row.localFractions.unpaid <= 1);
    }
    checkConservation(result);
  }
});

test('large finite supported inputs and household-count bounds avoid overflow', () => {
  for (const households of [1, 100]) {
    const result = projectPooling({ households, affectedCount: households, contribution: 1e12, reserve: 1e12, lossPerHousehold: 1e12 });
    assert.equal(result.households.length, households);
    assert.equal(result.totalClaims, households * 1e12);
    const check = value => {
      if (typeof value === 'number') assert.ok(Number.isFinite(value));
      else if (value && typeof value === 'object') Object.values(value).forEach(check);
    };
    check(result);
    checkConservation(result);
  }
});

test('replays start fresh and cannot carry payments into another run', () => {
  const input = Object.freeze({ affectedCount: 8, reserve: 1234567.89 });
  const before = { ...input };
  const first = projectPooling(input), second = projectPooling(input);
  assert.deepEqual(first, second);
  first.frames[0].households[0].contribution = 999;
  first.households[0].paid = 999;
  assert.deepEqual(second, projectPooling(input));
  assert.deepEqual(input, before);
  assert.ok(Object.isFrozen(poolingDefaults));
  assert.deepEqual(projectPooling(), projectPooling());
});

test('invalid numbers, fractional counts and non-object input are rejected instead of coerced', () => {
  for (const key of ['contribution', 'reserve', 'lossPerHousehold']) for (const value of [-1, 1e12 + 1, NaN, Infinity, -Infinity, '100000', null, undefined, true]) {
    assert.throws(() => projectPooling({ [key]: value }), RangeError);
  }
  for (const households of [0, -1, 1.5, 101, NaN, Infinity, '20', null, undefined]) {
    assert.throws(() => projectPooling({ households }), RangeError);
  }
  for (const affectedCount of [-1, .5, 21, NaN, Infinity, '2', null, undefined]) {
    assert.throws(() => projectPooling({ affectedCount }), RangeError);
  }
  assert.throws(() => projectPooling({ households: 2, affectedCount: 3 }), RangeError);
  for (const options of [null, [], 1, 'default', false]) assert.throws(() => projectPooling(options), TypeError);
});

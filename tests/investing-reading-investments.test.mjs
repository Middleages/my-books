import test from 'node:test';
import assert from 'node:assert/strict';
import { readingIds, readingCategories, readingDossier, readingFrames, assessReading, classifyReadingPrediction } from '../src/simulations/investing/reading-investments.mjs';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 1e-10 + 1e-12 * Math.max(Math.abs(actual), Math.abs(expected)), `${actual} != ${expected}`);

test('three original dossiers each cover the nine reading questions and four evidence categories', () => {
  assert.deepEqual(readingIds, ['stock', 'bond', 'etf']);
  assert.deepEqual(readingCategories.map(row => row.id), ['observed', 'assumed', 'estimated', 'missing']);
  assert.equal(readingCategories.find(row => row.id === 'estimated').label, '추정·평가');
  for (const id of readingIds) {
    const dossier = readingDossier(id);
    assert.equal(dossier.id, id);
    assert.equal(dossier.currency, 'KRW');
    assert.equal(dossier.asOf, '2026-09-30');
    assert.deepEqual(dossier.sections.map(row => row.id), ['rights', 'promise', 'underlying', 'basis', 'cost', 'liquidity', 'loss', 'estimate', 'missing']);
    assert.deepEqual(dossier.claims.map(row => row.category).sort(), ['assumed', 'estimated', 'missing', 'observed']);
    assert.equal(new Set(dossier.claims.map(row => row.id)).size, 4);
    for (const row of [...dossier.sections, ...dossier.claims]) assert.ok(row.text.length > 12);
    for (const claim of dossier.claims) { assert.ok(claim.reason.length > 12); assert.ok(claim.counterexample.length > 12); }
    assert.ok(dossier.counterexample.length > 12);
  }
});

test('stock share grid and total return conserve the one holding without double-counting cash', () => {
  const { structure: s, metrics } = readingDossier('stock');
  assert.equal(s.kind, 'stock'); assert.equal(s.totalShares, 1000); assert.equal(s.heldShares, 10);
  close(s.ownership, .01); assert.equal(s.cells.length, 100); assert.equal(s.cells.filter(cell => cell.held).length, 1);
  assert.equal(s.cells.reduce((sum, cell) => sum + cell.shares, 0), s.totalShares);
  assert.equal(metrics.initialValue, 100000); assert.equal(metrics.endingValue, 108000); assert.equal(metrics.cashReceived, 2000);
  assert.equal(metrics.endingWealth, 110000); close(metrics.priceReturn, .08); close(metrics.totalReturn, .1);
  assert.equal(metrics.investorFees, 0); assert.equal(metrics.externalFlow, 0); assert.equal(metrics.reinvested, false);
});

test('bond dates and amounts are promises, never fabricated received cash or realized return', () => {
  const { structure: s, metrics } = readingDossier('bond');
  assert.equal(s.kind, 'bond'); assert.deepEqual(s.schedule.map(row => row.date), ['2027-09-30', '2028-09-30', '2029-09-30']);
  assert.deepEqual(s.schedule.map(row => row.coupon), [50000, 50000, 50000]);
  assert.deepEqual(s.schedule.map(row => row.principal), [0, 0, 1000000]);
  assert.deepEqual(s.schedule.map(row => row.total), [50000, 50000, 1050000]);
  assert.equal(metrics.promisedTotal, 1150000); close(metrics.couponRate, .05);
  assert.equal(metrics.cashReceived, null); assert.equal(metrics.totalReturn, null);
  close(metrics.estimatedPrice, 50000 / 1.06 + 50000 / 1.06 ** 2 + 1050000 / 1.06 ** 3);
  assert.ok(metrics.estimatedPrice < s.face);
});

test('ETF nesting, same-date premium and fee-reflected performance use separate denominators', () => {
  const { structure: s, metrics, period } = readingDossier('etf');
  assert.equal(s.kind, 'etf'); assert.equal(s.holdingsAsOf, '2026-09-30');
  close(s.holdings.reduce((sum, row) => sum + row.weight, 0), 1);
  assert.equal(s.issuedUnits, 1000); assert.equal(s.heldUnits, 10); close(s.fundFraction, .01);
  assert.deepEqual(s.holdings.map(row => row.exposure), [63000, 42000]);
  assert.equal(s.holdings.reduce((sum, row) => sum + row.exposure, 0), metrics.heldNavValue);
  assert.equal(metrics.nav, 10500); assert.equal(metrics.marketPrice, 10710); close(metrics.premium, .02);
  close(metrics.totalReturn, .05); assert.equal(metrics.operatingFeesAlreadyIncluded, true);
  assert.equal(metrics.feeDeductedAgain, 0); assert.equal(metrics.investorFees, null);
  assert.equal(period, '2025-09-30 → 2026-09-30 · 1년');
});

test('four observation frames retain the same structure and never replay a cash transaction', () => {
  for (const id of readingIds) {
    const result = readingFrames(id);
    assert.deepEqual(result.frames.map(row => row.index), [0, 1, 2, 3]);
    assert.deepEqual(result.frames.map(row => row.focus), ['structure', 'basis', 'claims', 'source']);
    assert.equal(result.predictionOutcome, 'not-guaranteed');
    result.frames.forEach(row => { assert.deepEqual(row.structure, result.dossier.structure); assert.deepEqual(row.metrics, result.dossier.metrics); });
    assert.deepEqual(result.summary, result.frames[3]);
  }
});

test('each source question has one best first source and explains every alternative and its limit', () => {
  for (const id of readingIds) {
    const d = readingDossier(id);
    assert.equal(d.sources.length, 3); assert.equal(d.sources.filter(row => row.best).length, 1);
    for (const source of d.sources) {
      const result = assessReading(id, {}, source.id);
      assert.equal(result.source.correct, source.best); assert.equal(result.source.selected, source.id);
      assert.equal(result.source.reason, source.reason); assert.equal(result.source.limitation, source.limitation);
      assert.ok(source.reason.length > 12); assert.ok(source.limitation.length > 12);
    }
  }
});

test('classification gives exact reasons and counterexamples without assigning product suitability', () => {
  for (const id of readingIds) {
    const d = readingDossier(id), answers = Object.fromEntries(d.claims.map(claim => [claim.id, claim.category]));
    const result = assessReading(id, answers, d.sources.find(source => source.best).id);
    assert.ok(result.feedback.every(row => row.correct === true));
    for (const claim of d.claims) {
      const feedback = result.feedback.find(row => row.id === claim.id);
      assert.equal(feedback.reason, claim.reason); assert.equal(feedback.counterexample, claim.counterexample);
    }
    assert.equal('suitability' in result, false); assert.equal('recommendation' in result, false);
    const wrong = Object.fromEntries(d.claims.map(claim => [claim.id, claim.category === 'observed' ? 'assumed' : 'observed']));
    assert.ok(assessReading(id, wrong).feedback.every(row => row.correct === false));
  }
});

test('unanswered classifications and sources remain unanswered', () => {
  for (const id of readingIds) {
    const result = assessReading(id);
    assert.ok(result.feedback.every(row => row.correct === null && row.selected === ''));
    assert.equal(result.source.correct, null); assert.equal(result.source.selected, '');
    assert.equal(classifyReadingPrediction(id, ''), null);
    assert.equal(classifyReadingPrediction(id, 'not-guaranteed'), true);
    assert.equal(classifyReadingPrediction(id, 'guaranteed'), false);
  }
});

test('unknown ids, answers and source options are rejected rather than silently scored', () => {
  for (const id of ['', 'unknown', null, 1]) {
    assert.throws(() => readingDossier(id), RangeError); assert.throws(() => readingFrames(id), RangeError);
    assert.throws(() => assessReading(id), RangeError); assert.throws(() => classifyReadingPrediction(id, ''), RangeError);
  }
  for (const answers of [null, [], 'observed', 42]) assert.throws(() => assessReading('stock', answers), TypeError);
  assert.throws(() => assessReading('stock', { unknown: 'observed' }), RangeError);
  const claim = readingDossier('stock').claims[0];
  for (const answer of ['unknown', '', null, true]) assert.throws(() => assessReading('stock', { [claim.id]: answer }), RangeError);
  assert.throws(() => assessReading('stock', {}, 'bond-terms'), RangeError);
  assert.throws(() => classifyReadingPrediction('stock', 'unknown'), RangeError);
});

test('fresh immutable results preserve inputs and remain deterministic over repeated calls', () => {
  for (const id of readingIds) {
    const a = readingDossier(id), b = readingDossier(id);
    assert.notEqual(a, b); assert.notEqual(a.claims, b.claims); assert.deepEqual(a, b);
    assert.throws(() => { a.claims[0].text = 'changed'; }, TypeError);
    assert.throws(() => { a.sources.push({}); }, TypeError);
    const answers = { [a.claims[0].id]: a.claims[0].category }, before = structuredClone(answers);
    const result = assessReading(id, answers);
    assert.deepEqual(answers, before); assert.deepEqual(assessReading(id, answers), result);
    assert.deepEqual(readingFrames(id), readingFrames(id));
    assert.throws(() => { readingFrames(id).frames[0].index = 99; }, TypeError);
  }
});

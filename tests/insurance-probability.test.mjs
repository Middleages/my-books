import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedLossDefaults, projectExpectedLoss } from '../src/simulations/insurance/probability.mjs';

const close = (actual, expected, scale = Math.max(1, Math.abs(expected))) =>
  assert.ok(Math.abs(actual - expected) <= 1e-12 * scale, `${actual} != ${expected}`);
const sum = values => values.reduce((total, value) => total + value, 0);

test('authored defaults compare the same 200,000 won expectation with different shock sizes', () => {
  const result = projectExpectedLoss();
  assert.equal(result.params.cash, 2000000);
  assert.equal(result.moneyScale, 20000000);
  assert.deepEqual(result.scenarios.map(row => [row.probability, row.loss, row.expectedLoss]), [
    [.2, 1000000, 200000], [.01, 20000000, 200000],
  ]);
  assert.equal(result.expectedLossEqual, true);
  assert.equal(result.shortfallComparison, 'severe');
});

test('the expected loss is a probability-weighted summary, never the realized loss', () => {
  for (const row of projectExpectedLoss().scenarios) {
    assert.deepEqual(row.outcomes.map(outcome => outcome.loss), [0, row.loss]);
    assert.equal(row.expectedLoss, sum(row.outcomes.map(outcome => outcome.probability * outcome.loss)));
    assert.ok(row.outcomes.every(outcome => outcome.loss !== row.expectedLoss));
    assert.equal(sum(row.outcomes.map(outcome => outcome.probability)), 1);
  }
});

test('100 probability dots have exact fractional coverage rather than rounded event counts', () => {
  for (const probability of [0, .0001, .01, .0125, .2, 1 / 3, .9999, 1]) {
    const row = projectExpectedLoss({ frequentProbability: probability }).scenarios[0];
    assert.equal(row.dots.length, 100);
    assert.equal(new Set(row.dots.map(dot => dot.id)).size, 100);
    close(sum(row.dots.map(dot => dot.fraction)) / 100, probability);
    assert.ok(row.dots.every(dot => dot.fraction >= 0 && dot.fraction <= 1));
    assert.equal(row.fractions.probability, probability);
  }
  const fractional = projectExpectedLoss({ frequentProbability: .0125 }).scenarios[0].dots;
  assert.deepEqual(fractional.slice(0, 3).map(dot => dot.fraction), [1, .25, 0]);
});

test('one-period no-event and event alternatives both restart from the same cash', () => {
  const result = projectExpectedLoss();
  assert.equal(result.frames.length, 3);
  assert.deepEqual(result.frames.map(frame => frame.phase), ['distribution', 'absent', 'present']);
  assert.ok(result.frames[0].scenarios.every(row => row.observation === null));
  for (let index = 0; index < result.scenarios.length; index++) {
    const absent = result.frames[1].scenarios[index].observation;
    const present = result.frames[2].scenarios[index].observation;
    assert.equal(absent.cashRemaining, result.params.cash);
    assert.equal(absent.loss, 0);
    assert.deepEqual(absent, result.scenarios[index].outcomes[0]);
    assert.deepEqual(present, result.scenarios[index].outcomes[1]);
    assert.equal(present.cashRemaining + present.cashUsed, result.params.cash);
  }
  assert.equal(result.scenarios[0].outcomes[1].cashUsed, 1000000);
  assert.equal(result.scenarios[0].outcomes[1].shortfall, 0);
  assert.equal(result.scenarios[1].outcomes[1].cashUsed, 2000000);
  assert.equal(result.scenarios[1].outcomes[1].shortfall, 18000000);
});

test('probability zero and one mark impossible alternatives without fabricating a sampled event', () => {
  for (const probability of [0, 1]) {
    const result = projectExpectedLoss({ frequentProbability: probability, severeProbability: probability });
    for (const row of result.scenarios) {
      assert.deepEqual(row.outcomes.map(outcome => outcome.possible), [probability < 1, probability > 0]);
      assert.deepEqual(row.outcomes.map(outcome => outcome.probability), [1 - probability, probability]);
      assert.equal(row.expectedLoss, probability * row.loss);
      assert.equal(sum(row.dots.map(dot => dot.fraction)), probability * 100);
    }
    assert.deepEqual(result.frames[2].scenarios.map(row => row.observation.possible), [probability > 0, probability > 0]);
  }
});

test('zero cash, exact cash boundary and enough cash preserve loss and cash identities', () => {
  for (const cash of [0, .1, 1000000, 2000000, 20000000, 1e12]) {
    const result = projectExpectedLoss({ cash });
    for (const row of result.scenarios) for (const outcome of row.outcomes) {
      close(outcome.cashUsed + outcome.cashRemaining, cash);
      close(outcome.cashUsed + outcome.shortfall, outcome.loss);
      assert.ok(outcome.cashUsed >= 0 && outcome.cashUsed <= cash);
      assert.ok(outcome.shortfall >= 0 && outcome.cashRemaining >= 0);
    }
  }
  const covered = projectExpectedLoss({ cash: 20000000 });
  assert.equal(covered.shortfallComparison, 'same');
  assert.ok(covered.scenarios.every(row => row.outcomes[1].shortfall === 0));
});

test('same-scale geometry covers all money values and never gives zero a minimum visible width', () => {
  for (const options of [{}, { cash: 1e12 }, { cash: 0 }, { frequentLoss: 0 }, { frequentLoss: .125, severeLoss: .5, cash: .25 }]) {
    const result = projectExpectedLoss(options);
    assert.equal(result.moneyScale, Math.max(result.params.cash, result.params.frequentLoss, result.params.severeLoss));
    for (const row of result.scenarios) {
      for (const key of ['loss', 'cash', 'expectedLoss']) close(row.fractions[key] * result.moneyScale, row[key]);
      for (const outcome of row.outcomes) for (const [key, fraction] of Object.entries(outcome.fractions)) {
        close(fraction * result.moneyScale, outcome[key]);
        assert.ok(fraction >= 0 && fraction <= 1);
        if (outcome[key] === 0) assert.equal(fraction, 0);
      }
    }
  }
});

test('all-zero money inputs return finite zero geometry with no fabricated scale floor', () => {
  const result = projectExpectedLoss({ cash: 0, frequentLoss: 0, severeLoss: 0 });
  assert.equal(result.moneyScale, 0);
  assert.equal(result.shortfallComparison, 'same');
  for (const row of result.scenarios) {
    assert.equal(row.expectedLoss, 0);
    for (const key of ['loss', 'cash', 'expectedLoss']) assert.equal(row.fractions[key], 0);
    for (const outcome of row.outcomes) assert.ok(Object.values(outcome.fractions).every(value => value === 0));
  }
});

test('fractional won and unrounded probabilities drive expectations and comparisons', () => {
  const result = projectExpectedLoss({ cash: .03, frequentProbability: .2, frequentLoss: .07, severeProbability: .1, severeLoss: .14 });
  close(result.scenarios[0].expectedLoss, .014);
  close(result.scenarios[0].outcomes[1].shortfall, .04);
  close(result.scenarios[1].outcomes[1].shortfall, .11);
  assert.equal(result.expectedLossEqual, true);
  assert.equal(projectExpectedLoss({ frequentProbability: .20000000000000004 }).expectedLossEqual, false);
  assert.equal(projectExpectedLoss({ frequentLoss: 30000000 }).shortfallComparison, 'frequent');
});

test('maximum finite money and extreme probabilities remain finite', () => {
  for (const probability of [Number.MIN_VALUE, Number.EPSILON, 1 - Number.EPSILON, 1]) {
    const result = projectExpectedLoss({ cash: 1e12, frequentLoss: 1e12, severeLoss: 1e12, frequentProbability: probability });
    const check = value => {
      if (typeof value === 'number') assert.ok(Number.isFinite(value));
      else if (value && typeof value === 'object') Object.values(value).forEach(check);
    };
    check(result);
  }
});

test('replays are deterministic, independent between runs and preserve frozen input/defaults', () => {
  const input = Object.freeze({ cash: 3141592.65, frequentProbability: .0125 });
  const before = { ...input };
  const first = projectExpectedLoss(input), second = projectExpectedLoss(input);
  assert.deepEqual(first, second);
  first.scenarios[0].dots[0].fraction = 999;
  first.frames[2].scenarios[1].observation.shortfall = 999;
  assert.deepEqual(second, projectExpectedLoss(input));
  assert.deepEqual(input, before);
  assert.ok(Object.isFrozen(expectedLossDefaults));
});

test('invalid money, probability and option shapes are rejected without coercion or clipping', () => {
  for (const key of ['cash', 'frequentLoss', 'severeLoss']) for (const value of [-1, 1e12 + 1, NaN, Infinity, -Infinity, '100', null, undefined, true]) {
    assert.throws(() => projectExpectedLoss({ [key]: value }), RangeError);
  }
  for (const key of ['frequentProbability', 'severeProbability']) for (const value of [-Number.EPSILON, 1 + Number.EPSILON, NaN, Infinity, '0.2', null, undefined, false]) {
    assert.throws(() => projectExpectedLoss({ [key]: value }), RangeError);
  }
  for (const options of [null, [], 1, 'default', true]) assert.throws(() => projectExpectedLoss(options), TypeError);
});

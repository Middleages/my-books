import test from 'node:test';
import assert from 'node:assert/strict';
import { diversificationDefaults, diversificationFrames, classifyDiversificationPrediction } from '../src/simulations/investing/diversification.mjs';

const close = (actual, expected, epsilon = 1e-9) => assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);
const sum = values => values.reduce((total, value) => total + value, 0);

test('four authored alternatives have the specified individual and half-and-half returns', () => {
  const result = diversificationFrames();
  assert.deepEqual(result.scenarios.map(row => row.aReturn), [.2, .2, -.2, -.2]);
  assert.deepEqual(result.scenarios.map(row => row.bReturn), [.2, -.2, .2, -.2]);
  assert.deepEqual(result.scenarios.map(row => row.portfolioReturn), [.2, 0, 0, -.2]);
  assert.deepEqual(result.scenarios.map(row => row.endingTotal), [1200, 1000, 1000, 800]);
  assert.equal(result.initialA, 500);
  assert.equal(result.initialB, 500);
});

test('comparison weights are equal and sum to one; holding weights are a separate input', () => {
  const result = diversificationFrames({ weightA: .75 });
  assert.deepEqual(result.scenarios.map(row => row.comparisonWeight), [.25, .25, .25, .25]);
  assert.equal(sum(result.scenarios.map(row => row.comparisonWeight)), 1);
  assert.deepEqual(result.allocation.map(part => part.weight), [.75, .25]);
  close(sum(result.allocation.map(part => part.amount)), result.input.initialAmount);
});

test('weight boundaries reproduce one asset instead of adding two full investments', () => {
  for (const weightA of [0, 1]) {
    const result = diversificationFrames({ weightA });
    for (const row of result.scenarios) close(row.portfolioReturn, weightA ? row.aReturn : row.bReturn);
    close(result.statistics.portfolio.spread, .2);
    assert.equal(result.predictionOutcome, 'same');
    assert.equal(result.initialA + result.initialB, 1000);
  }
});

test('75/25 initial amounts produce weighted contributions and 10% in opposite-direction case', () => {
  const result = diversificationFrames({ weightA: .75 });
  const row = result.scenarios[1];
  close(row.contributionA, .15);
  close(row.contributionB, -.05);
  close(row.portfolioReturn, .1);
  close(row.endingA, 900);
  close(row.endingB, 200);
  close(row.endingTotal, 1100);
  close(result.scenarios[2].portfolioReturn, -.1);
});

test('common shock makes B identical to A and removes spread reduction for every holding weight', () => {
  for (let integer = 0; integer <= 100; integer++) {
    const result = diversificationFrames({ weightA: integer / 100, commonShock: true });
    for (const row of result.scenarios) {
      assert.equal(row.aReturn, row.bReturn);
      close(row.portfolioReturn, row.aReturn);
    }
    close(result.statistics.portfolio.spread, .2);
    assert.equal(result.predictionOutcome, 'same');
    assert.equal(result.sameDirectionCount, 4);
  }
  assert.equal(diversificationFrames().sameDirectionCount, 2);
});

test('all three series have zero descriptive mean despite different spreads', () => {
  for (const weightA of [0, .01, .25, .5, .73, .99, 1]) {
    const result = diversificationFrames({ weightA });
    for (const series of Object.values(result.statistics)) close(series.mean, 0);
    const weightedIndividualMean = weightA * result.statistics.a.mean + result.weightB * result.statistics.b.mean;
    close(result.statistics.portfolio.mean, weightedIndividualMean);
  }
});

test('spread is the population descriptive standard deviation of the four alternatives, not n-minus-one', () => {
  const result = diversificationFrames();
  close(result.statistics.a.variance, .04);
  close(result.statistics.portfolio.variance, .02);
  close(result.statistics.portfolio.spread, Math.sqrt(.02));
  assert.notEqual(result.statistics.portfolio.spread, Math.sqrt(.08 / 3));
  for (const key of ['a', 'b', 'portfolio']) {
    const values = result.scenarios.map(row => row[key === 'a' ? 'aReturn' : key === 'b' ? 'bReturn' : 'portfolioReturn']);
    const { mean, variance } = result.statistics[key];
    close(mean, sum(values) / 4);
    close(variance, sum(values.map(value => (value - mean) ** 2)) / 4);
  }
});

test('smaller spread does not remove the shared loss or change the worst authored scenario', () => {
  const result = diversificationFrames();
  assert.ok(result.statistics.portfolio.spread < result.statistics.a.spread);
  assert.equal(result.statistics.portfolio.minimum, -.2);
  assert.equal(result.statistics.a.minimum, -.2);
  assert.equal(result.scenarios[3].endingTotal, 800);
  assert.equal(result.scenarios[3].profit, -200);
});

test('symmetric example has a smaller spread at half than at interior asymmetric allocations', () => {
  const half = diversificationFrames().statistics.portfolio.spread;
  for (const weightA of [.1, .2, .3, .4]) {
    const lower = diversificationFrames({ weightA }).statistics.portfolio.spread;
    const upper = diversificationFrames({ weightA: 1 - weightA }).statistics.portfolio.spread;
    close(lower, upper);
    assert.ok(lower > half);
    assert.equal(diversificationFrames({ weightA }).predictionOutcome, 'less');
  }
});

test('scenarios restart from the same initial amount and are never compounded over time', () => {
  const result = diversificationFrames();
  for (const row of result.scenarios) {
    close(row.endingA, result.initialA * (1 + row.aReturn));
    close(row.endingB, result.initialB * (1 + row.bReturn));
    close(row.endingTotal, result.input.initialAmount * (1 + row.portfolioReturn));
    close(row.endingTotal - result.input.initialAmount, row.profit);
  }
  assert.equal(result.scenarios[1].endingTotal, 1000);
  assert.equal(result.scenarios[3].endingTotal, 800);
  assert.notEqual(result.scenarios[3].endingTotal, 1000 * 1.2 * .8);
});

test('changing nominal initial amount rescales values but not returns or descriptive spread', () => {
  const baseline = diversificationFrames();
  for (const initialAmount of [.01, 1, 1234.5, 1e9]) {
    const result = diversificationFrames({ initialAmount });
    assert.deepEqual(result.statistics, baseline.statistics);
    result.scenarios.forEach((row, index) => {
      close(row.endingTotal, baseline.scenarios[index].endingTotal * initialAmount / 1000, 1e-6);
      close(sum(row.amountSegments.map(part => part.fraction)), row.endingTotal / result.moneyScale);
    });
  }
});

test('all signed chart positions and bar lengths use the fixed minus20-to-plus20 axis', () => {
  for (const options of [{}, { weightA: 0 }, { weightA: 1 }, { weightA: .73 }, { commonShock: true }]) {
    const result = diversificationFrames(options);
    assert.equal(result.axis.minimum, -.2);
    assert.equal(result.axis.maximum, .2);
    for (const row of result.scenarios) for (const bar of row.bars) {
      close(bar.endFraction * .4 - .2, bar.value);
      close(bar.widthFraction * .4, Math.abs(bar.value));
      close(bar.startFraction, Math.min(.5, bar.endFraction));
      assert.ok(bar.startFraction >= -1e-12 && bar.startFraction + bar.widthFraction <= 1 + 1e-12);
    }
  }
  const zero = diversificationFrames().scenarios[1].bars[2];
  assert.equal(zero.widthFraction, 0);
  assert.equal(zero.endFraction, .5);
});

test('same-scale money bars and spread bars preserve the underlying values including zero holdings', () => {
  for (const weightA of [0, .01, .5, .99, 1]) {
    const result = diversificationFrames({ weightA });
    for (const frame of result.frames) {
      close(frame.endingA + frame.endingB, frame.endingTotal);
      for (const part of frame.amountSegments) {
        close(part.fraction * result.moneyScale, part.amount);
        assert.ok(part.fraction >= 0 && part.fraction <= 1);
      }
      close(sum(frame.amountSegments.map(part => part.amount)), frame.endingTotal);
    }
    for (const bar of result.spreadBars) close(bar.fraction * .2, result.statistics[bar.key].spread);
  }
});

test('observation frames reuse scenario results while start and summary never invent a cumulative result', () => {
  const result = diversificationFrames({ weightA: .37 });
  assert.equal(result.frames.length, 6);
  assert.equal(result.frames[0].scenarioIndex, null);
  assert.equal(result.frames[0].portfolioReturn, null);
  assert.equal(result.summary.isSummary, true);
  assert.equal(result.summary.scenarioIndex, null);
  assert.equal(result.summary.endingTotal, 1000);
  result.scenarios.forEach((row, index) => {
    const frame = result.frames[index + 1];
    assert.equal(frame.scenarioIndex, index);
    assert.equal(frame.portfolioReturn, row.portfolioReturn);
    assert.equal(frame.endingTotal, row.endingTotal);
    assert.equal(frame.contributionA, row.contributionA);
    assert.equal(frame.contributionB, row.contributionB);
    assert.deepEqual(frame.amountSegments, row.amountSegments);
  });
});

test('every one-percent UI allocation preserves money and gives a bounded weighted return', () => {
  for (let integer = 0; integer <= 100; integer++) for (const commonShock of [false, true]) {
    const result = diversificationFrames({ weightA: integer / 100, commonShock });
    close(result.initialA + result.initialB, result.input.initialAmount);
    close(sum(result.allocation.map(part => part.weight)), 1);
    for (const row of result.scenarios) {
      close(row.portfolioReturn, row.contributionA + row.contributionB);
      assert.ok(row.portfolioReturn >= -.2 - 1e-12 && row.portfolioReturn <= .2 + 1e-12);
      close(row.endingTotal, row.endingA + row.endingB);
    }
    assert.ok(result.statistics.portfolio.spread <= result.statistics.a.spread + 1e-12);
  }
});

test('frozen caller inputs and defaults are immutable and repeated runs are independent', () => {
  const input = Object.freeze({ weightA: .37, commonShock: true, initialAmount: 321 });
  const first = diversificationFrames(input), second = diversificationFrames(input);
  assert.deepEqual(first, second);
  first.scenarios[0].bars[0].value = 999;
  first.frames[1].amountSegments[0].amount = 999;
  first.statistics.portfolio.spread = 999;
  assert.deepEqual(second, diversificationFrames(input));
  assert.equal(diversificationDefaults.weightA, .5);
  assert.ok(Object.isFrozen(diversificationDefaults));
});

test('unsupported amounts, non-finite weights and non-boolean shocks are rejected', () => {
  for (const initialAmount of [0, -1, Number.MIN_VALUE, .009, NaN, Infinity, 1e9 + 1, '1000']) {
    assert.throws(() => diversificationFrames({ initialAmount }), RangeError);
  }
  for (const weightA of [-.01, 1.01, NaN, Infinity, '0.5', null]) {
    assert.throws(() => diversificationFrames({ weightA }), RangeError);
  }
  for (const commonShock of ['true', 1, null, undefined]) {
    assert.throws(() => diversificationFrames({ commonShock }), TypeError);
  }
  for (const input of [null, [], 1, 'default']) assert.throws(() => diversificationFrames(input), TypeError);
});

test('prediction grading reads the model outcome and does not grade an empty choice', () => {
  assert.equal(classifyDiversificationPrediction(diversificationFrames().predictionOutcome, 'less'), true);
  assert.equal(classifyDiversificationPrediction(diversificationFrames({ commonShock: true }).predictionOutcome, 'less'), false);
  assert.equal(classifyDiversificationPrediction('same', 'same'), true);
  assert.equal(classifyDiversificationPrediction('same', ''), null);
  assert.throws(() => classifyDiversificationPrediction('more', 'less'), RangeError);
  assert.throws(() => classifyDiversificationPrediction('less', 'unknown'), RangeError);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePerformancePath, performanceHistoryFrames, recoveryCompoundingFrames, historyReviewFrames, classifyPerformancePrediction } from '../src/simulations/investing/performance-history.mjs';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 1e-12 + 1e-12 * Math.max(Math.abs(actual), Math.abs(expected)), `${actual} != ${expected}`);

test('same endpoints and periods conceal drawdowns of 50 and 10 percent', () => {
  const r = performanceHistoryFrames();
  assert.equal(r.input.scenario, 'paths');
  assert.deepEqual(r.paths.map(p => p.values), [[100, 150, 75, 100], [100, 95, 90, 100]]);
  assert.deepEqual(r.paths.map(p => p.totalReturn), [0, 0]);
  assert.deepEqual(r.paths.map(p => p.maxDrawdown), [.5, .1]);
  assert.deepEqual(r.paths.map(p => p.intervalCount), [3, 3]);
  assert.equal(r.externalFlows, 0); assert.equal(r.predictionOutcome, 'a-deeper');
});

test('drawdown uses only a peak already observed, never a later high', () => {
  const r = analyzePerformancePath([100, 80, 200, 180]);
  assert.deepEqual(r.points.map(p => p.peak), [100, 100, 200, 200]);
  assert.deepEqual(r.points.map(p => p.peakIndex), [0, 0, 2, 2]);
  assert.deepEqual(r.points.map(p => p.drawdown), [0, .2, 0, .1]);
  assert.equal(r.maxDrawdown, .2);
  assert.equal(r.points[1].drawdown, analyzePerformancePath([100, 80]).points[1].drawdown);
});

test('equal repeated peaks preserve the first observed peak index', () => {
  const r = analyzePerformancePath([100, 150, 150, 75]);
  assert.deepEqual(r.points.map(p => p.peakIndex), [0, 1, 1, 1]);
  assert.equal(r.maxDrawdown, .5); assert.equal(r.maxDrawdownPoint, 3);
});

test('all-zero paths keep percentage denominators undefined', () => {
  const r = performanceHistoryFrames({ scenario: 'zero' });
  for (const p of r.paths) {
    assert.equal(p.totalReturn, null); assert.equal(p.maxDrawdown, null);
    assert.ok(p.points.every(point => point.drawdown === null && point.periodReturn === null));
  }
  assert.equal(r.predictionOutcome, 'undefined');
  assert.ok(r.frames.every(f => f.paths.every(p => p.current.value === 0)));
});

test('one observation has no interval return or evidence of future safety', () => {
  const r = performanceHistoryFrames({ scenario: 'single' });
  assert.equal(r.frames.length, 2);
  for (const p of r.paths) {
    assert.equal(p.intervalCount, 0); assert.equal(p.totalReturn, 0);
    assert.equal(p.maxDrawdown, 0); assert.equal(p.points[0].periodReturn, null);
  }
  assert.equal(r.predictionOutcome, 'same');
  assert.match(r.summary.message, /관찰값 1개/);
});

test('zero after a positive peak is total loss and cannot be multiplied into positive wealth', () => {
  const r = analyzePerformancePath([100, 0, 0]);
  assert.equal(r.maxDrawdown, 1); assert.equal(r.totalReturn, -1);
  assert.equal(r.points[1].periodReturn, -1); assert.equal(r.points[2].periodReturn, null);
  assert.throws(() => analyzePerformancePath([100, 0, 10]), RangeError);
  assert.throws(() => analyzePerformancePath([0, 1]), RangeError);
});

test('plot geometry, peak gap and frame values use one fixed 0-to-150 scale', () => {
  for (const scenario of ['paths', 'zero', 'single']) {
    const r = performanceHistoryFrames({ scenario });
    assert.equal(r.scale.maximum, 150);
    for (const f of r.frames) for (const p of f.paths) {
      close(p.current.y, 1 - p.current.value / r.scale.maximum);
      close(p.peakY, 1 - p.current.peak / r.scale.maximum);
      close(p.gapHeight, (p.current.peak - p.current.value) / r.scale.maximum);
      assert.equal(p.current, p.points.at(-1));
      assert.ok(p.points.every(point => point.index <= f.observationIndex));
      assert.equal(p.current.maxDrawdown, r.paths.find(row => row.id === p.id).points[f.observationIndex].maxDrawdown);
    }
    assert.equal(r.frames[0].index, 0); assert.equal(r.summary.isSummary, true);
  }
});

test('path model rejects unsupported shape, lengths and nonfinite or negative levels', () => {
  for (const values of [null, {}, 100, '100']) assert.throws(() => analyzePerformancePath(values), TypeError);
  for (const values of [[], Array(49).fill(100), [100, -1], [NaN], [Infinity], ['100'], [Number.MIN_VALUE], [1e9 + 1], Array(2)]) assert.throws(() => analyzePerformancePath(values), RangeError);
  assert.equal(analyzePerformancePath([.01, 1e9]).points.length, 2);
  for (const input of [null, [], 1]) assert.throws(() => performanceHistoryFrames(input), TypeError);
  assert.throws(() => performanceHistoryFrames({ scenario: 'unknown' }), RangeError);
});

test('50-percent loss needs 100-percent recovery from the smaller denominator', () => {
  const r = recoveryCompoundingFrames();
  assert.equal(r.initialAmount, 100); assert.equal(r.lossAmount, 50); assert.equal(r.remainingAmount, 50);
  assert.equal(r.requiredGain, 50); assert.equal(r.recoveryRate, 1); assert.equal(r.recoveredAmount, 100);
  assert.equal(r.predictionOutcome, 'greater');
  assert.deepEqual(r.frames.map(f => f.recoveryAmount), [100, 50, 100, 100]);
  assert.equal(r.frames[2].recoveryIsAssumed, true);
});

test('zero loss needs no gain; total loss has no finite percentage recovery', () => {
  const zero = recoveryCompoundingFrames({ lossRate: 0 });
  assert.equal(zero.recoveryRate, 0); assert.equal(zero.recoveredAmount, 100); assert.equal(zero.predictionOutcome, 'same');
  const all = recoveryCompoundingFrames({ lossRate: 1 });
  assert.equal(all.recoveryRate, null); assert.equal(all.recoveredAmount, null);
  assert.equal(all.remainingAmount, 0); assert.equal(all.requiredGain, 100);
  assert.equal(all.predictionOutcome, 'undefined');
  assert.deepEqual(all.frames.map(f => f.recoveryAmount), [100, 0, 0, 0]);
  assert.match(all.summary.message, /정의 불가/);
});

test('every UI loss step preserves amounts and correct denominator', () => {
  for (let integer = 0; integer <= 100; integer += 5) {
    const r = recoveryCompoundingFrames({ lossRate: integer / 100 });
    close(r.lossAmount + r.remainingAmount, 100);
    close(r.requiredGain + r.remainingAmount, 100);
    if (integer < 100) {
      close(r.recoveryRate, r.lossAmount / r.remainingAmount);
      close(r.remainingAmount * (1 + r.recoveryRate), 100);
    }
    for (const f of r.frames) close(f.recoveryFraction * 100, f.recoveryAmount);
  }
});

test('arithmetic average zero is not the compound minus25-percent result', () => {
  const r = recoveryCompoundingFrames();
  assert.deepEqual(r.compounding.returns, [.5, -.5]);
  assert.deepEqual(r.compounding.values, [100, 150, 75]);
  assert.equal(r.compounding.arithmeticMean, 0); assert.equal(r.compounding.cumulativeReturn, -.25);
  assert.deepEqual(r.frames.map(f => f.compoundAmount), [100, 150, 75, 75]);
  r.compounding.bars.forEach(bar => close(bar.fraction * 150, bar.value));
  assert.deepEqual(recoveryCompoundingFrames({ lossRate: 1 }).compounding, r.compounding);
});

test('loss input validation is bounded and does not coerce strings or nonfinite values', () => {
  for (const lossRate of [-.01, 1.01, NaN, Infinity, '0.5', null, undefined]) assert.throws(() => recoveryCompoundingFrames({ lossRate }), RangeError);
  for (const input of [null, [], 1]) assert.throws(() => recoveryCompoundingFrames(input), TypeError);
  for (const lossRate of [1e-12, 1 - 1e-12]) assert.ok(Number.isFinite(recoveryCompoundingFrames({ lossRate }).recoveryRate));
  const tiny = recoveryCompoundingFrames({ lossRate: 1e-17 });
  assert.ok(tiny.requiredGain > 0); assert.ok(tiny.recoveryRate > 0);
  close(tiny.requiredGain, tiny.lossAmount);
  assert.equal(Object.is(recoveryCompoundingFrames({ lossRate: -0 }).recoveryRate, -0), false);
});

test('exactly three fixed rules share dates and independently normalized windows', () => {
  const r = historyReviewFrames();
  assert.equal(r.rules.length, 3);
  assert.deepEqual(r.trainingWindow, ['S0', 'S1', 'S2']);
  assert.deepEqual(r.reviewWindow, ['S2', 'S3', 'S4']);
  assert.equal(r.originalSelectedId, 'a'); assert.equal(r.selectedId, 'a');
  for (const rule of r.rules) {
    assert.equal(rule.training.values[0], 100); assert.equal(rule.review.values[0], 100);
    assert.equal(rule.training.intervalCount, 2); assert.equal(rule.review.intervalCount, 2);
    assert.equal(rule.externalFlows, 0); assert.equal(rule.costRate, 0);
    assert.equal(rule.normalization, 'each-window-100');
  }
  assert.notEqual(r.rules[0].review.values[0], r.rules[0].training.values.at(-1));
});

test('authored rule results demonstrate that the training leader need not lead later', () => {
  const r = historyReviewFrames();
  const [a, b, c] = r.rules;
  close(a.training.totalReturn, .32); close(a.review.totalReturn, -.16);
  close(b.training.totalReturn, .1025); close(b.review.totalReturn, .155);
  close(c.training.totalReturn, .209375); close(c.review.totalReturn, -.0025);
  assert.equal(c.rebalanceEachInterval, true);
  assert.deepEqual(c.training.returns, [.125, .07500000000000001]);
  c.review.returns.forEach((value, index) => close(value, [-.05, .05][index]));
  assert.notEqual(c.training.values.at(-1), (a.training.values.at(-1) + b.training.values.at(-1)) / 2);
});

test('held choice preserves separation but gives no guarantee', () => {
  const r = historyReviewFrames();
  assert.equal(r.futureLeak, false); assert.equal(r.reselected, false); assert.equal(r.independentReview, true);
  assert.equal(r.predictionOutcome, 'separate');
  assert.equal(r.status, '구간 분리 유지 · 미래 보장 아님');
  assert.equal(r.frames[0].reviewVisible, false); assert.equal(r.frames[1].reviewVisible, false);
  assert.equal(r.frames[2].reviewVisible, true); assert.equal(r.frames[3].reviewVisible, true);
});

test('future leakage and subsequent reselection explicitly invalidate independent review', () => {
  const leaked = historyReviewFrames({ reviewMode: 'future-leak' });
  const reselected = historyReviewFrames({ reviewMode: 'reselection' });
  assert.equal(leaked.futureLeak, true); assert.equal(leaked.reselected, false);
  assert.equal(leaked.status, '미래 자료 누출 · 독립 검토 아님');
  assert.equal(leaked.frames[1].reviewVisible, true);
  assert.equal(reselected.futureLeak, false); assert.equal(reselected.reselected, true);
  assert.equal(reselected.status, '사후 재선택 · 독립 검토 아님');
  assert.equal(reselected.frames[1].selectedId, 'a'); assert.equal(reselected.frames[2].selectedId, 'b');
  for (const r of [leaked, reselected]) {
    assert.equal(r.originalSelectedId, 'a'); assert.equal(r.selectedId, 'b');
    assert.equal(r.independentReview, false); assert.equal(r.predictionOutcome, 'contaminated');
    assert.deepEqual(r.rules, historyReviewFrames().rules);
  }
});

test('review comparison bars use one money scale and chronological gate labels', () => {
  for (const reviewMode of ['held', 'future-leak', 'reselection']) {
    const r = historyReviewFrames({ reviewMode });
    assert.equal(r.scale, 150); assert.equal(r.selectionTime, 'S2');
    for (const rule of r.rules) for (const key of ['training', 'review']) close(rule[key].endFraction * r.scale, rule[key].values.at(-1));
    assert.deepEqual(r.frames.map(f => f.index), [0, 1, 2, 3]);
    assert.equal(r.summary.isSummary, true);
  }
  for (const input of [null, [], 1]) assert.throws(() => historyReviewFrames(input), TypeError);
  assert.throws(() => historyReviewFrames({ reviewMode: 'optimize' }), RangeError);
});

test('deterministic calls do not mutate frozen inputs or leak mutable returned arrays between runs', () => {
  const path = Object.freeze([100, 150, 75, 100]);
  const first = analyzePerformancePath(path), second = analyzePerformancePath(path);
  assert.deepEqual(first, second); first.values[0] = 999; first.points[0].peak = 999;
  assert.deepEqual(second, analyzePerformancePath(path));
  for (const [fn, input] of [[performanceHistoryFrames, { scenario: 'paths' }], [recoveryCompoundingFrames, { lossRate: .5 }], [historyReviewFrames, { reviewMode: 'held' }]]) {
    Object.freeze(input); const a = fn(input), b = fn(input); assert.deepEqual(a, b);
    a.frames[0].label = 'changed'; assert.deepEqual(b, fn(input));
  }
  const review = historyReviewFrames(); review.rules[0].training.values[0] = 999;
  assert.equal(historyReviewFrames().rules[0].training.values[0], 100);
});

test('predictions grade raw model outcomes without grading an empty answer', () => {
  for (const outcome of ['a-deeper', 'same', 'undefined', 'greater', 'separate', 'contaminated']) {
    assert.equal(classifyPerformancePrediction(outcome, outcome), true);
    assert.equal(classifyPerformancePrediction(outcome, ''), null);
  }
  assert.equal(classifyPerformancePrediction('greater', 'same'), false);
  assert.throws(() => classifyPerformancePrediction('best', 'same'), RangeError);
  assert.throws(() => classifyPerformancePrediction('same', 'best'), RangeError);
});

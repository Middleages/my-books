import test from 'node:test';
import assert from 'node:assert/strict';
import { fundsDefaults, navDefaults, exposureFrames, navSnapshot, navFrames, classifyFundsPrediction, trackingMetrics, trackingComparison } from '../src/simulations/investing/funds-etfs.mjs';
const close = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

test('two half-weight ETFs expose A50/B20/C30 exactly once', () => {
  const result = exposureFrames();
  assert.deepEqual(result.exposure.map(part => part.asset), ['A', 'B', 'C']);
  result.exposure.forEach((part, index) => close(part.fraction, [.5, .2, .3][index]));
  assert.equal(result.totalWeight, 1);
  assert.deepEqual(result.overlapAssets, ['A']);
  assert.equal(result.predictionOutcome, 'same');
});
test('ETF endpoints and every five-percent weight conserve total exposure', () => {
  for (let percent = 0; percent <= 100; percent += 5) {
    const result = exposureFrames({ xWeight: percent / 100 });
    assert.equal(result.totalWeight, 1);
    assert.equal(result.summary.unexaminedWeight, 0);
    close(result.funds.reduce((sum, fund) => sum + fund.weight, 0), 1);
    result.funds.forEach(fund => close(fund.contributions.reduce((sum, part) => sum + part.fraction, 0), fund.weight));
    result.frames.forEach(frame => {
      close(frame.accountedWeight + frame.unexaminedWeight, 1);
      close(frame.exposures.reduce((sum, part) => sum + part.fraction, 0), frame.accountedWeight);
    });
  }
  assert.deepEqual(exposureFrames({ xWeight: 0 }).exposure.map(part => part.fraction), [.4, 0, .6]);
  assert.deepEqual(exposureFrames({ xWeight: 1 }).exposure.map(part => part.fraction), [.6, .4, 0]);
  assert.deepEqual(exposureFrames({ xWeight: 0 }).overlapAssets, []);
  assert.deepEqual(exposureFrames({ xWeight: 1 }).overlapAssets, []);
});
test('same underlying holdings do not create new asset exposure', () => {
  for (const xWeight of [0, .1, .5, .9, 1]) {
    const result = exposureFrames({ xWeight, sameHoldings: true });
    result.exposure.forEach((part, index) => close(part.fraction, [.6, .4, 0][index]));
    assert.equal(result.predictionOutcome, 'up');
  }
  assert.deepEqual(exposureFrames({ sameHoldings: true }).overlapAssets, ['A', 'B']);
});
test('exposure frames reveal X then Y without adding the result twice', () => {
  const result = exposureFrames();
  assert.deepEqual(result.frames.map(frame => frame.accountedWeight), [0, .5, 1, 1]);
  assert.deepEqual(result.frames[1].exposures.map(part => part.fraction), [.3, .2, 0]);
  assert.equal(result.frames[0].xVisible, false);
  assert.equal(result.frames[1].xVisible, true);
  assert.equal(result.frames[1].yVisible, false);
  assert.equal(result.summary.grouped, true);
});
test('invalid weights and holdings modes are rejected without clamping', () => {
  for (const xWeight of [-1, 1.001, NaN, Infinity, '0.5', null]) assert.throws(() => exposureFrames({ xWeight }), RangeError);
  for (const sameHoldings of [1, 'true', null]) assert.throws(() => exposureFrames({ sameHoldings }), TypeError);
});
test('NAV subtracts liabilities before dividing by all issued units', () => {
  const row = navSnapshot({ assets: 10200, liabilities: 200, issuedUnits: 100, heldUnits: 10, marketPrice: 105 });
  assert.equal(row.netAssets, 10000);
  assert.equal(row.nav, 100);
  assert.equal(row.heldNavValue, 1000);
  assert.equal(row.heldMarketValue, 1050);
  close(row.premium, .05);
});
test('NAV premium uses NAV denominator and preserves positive/zero/negative signs', () => {
  for (const [marketPrice, premium, outcome] of [[112, .12, 'up'], [100, 0, 'same'], [90, -.1, 'down'], [0, -1, 'down']]) {
    const row = navSnapshot({ assets: 10000, issuedUnits: 100, marketPrice });
    close(row.premium, premium); assert.equal(row.predictionOutcome, outcome);
  }
  const tiny = navSnapshot({ assets: 10000, issuedUnits: 100, marketPrice: 100 + 1e-11 });
  assert(tiny.premium > 0); assert.equal(tiny.predictionOutcome, 'up');
  const tinyNegative = navSnapshot({ assets: 10000, issuedUnits: 100, marketPrice: 100 - 1e-11 });
  assert(tinyNegative.premium < 0); assert.equal(tinyNegative.predictionOutcome, 'down');
});
test('decimal loss presets preserve mathematically equal NAV and price', () => {
  for (const [underlyingReturn, marketPrice] of [[-.9, 10], [-.8, 20], [-.7, 30], [-.6, 40], [-.1, 90], [0, 100], [.1, 110], [.3, 130]]) {
    const result = navFrames({ underlyingReturn, marketPrice });
    assert.equal(result.summary.nav, marketPrice); assert.equal(result.summary.premium, 0); assert.equal(result.predictionOutcome, 'same');
  }
});
test('zero issuance is undefined NAV, not zero; zero NAV has undefined premium', () => {
  const noUnits = navSnapshot({ assets: 10000, issuedUnits: 0, heldUnits: 0, marketPrice: 112 });
  assert.equal(noUnits.nav, null); assert.equal(noUnits.premium, null); assert.equal(noUnits.heldNavValue, null);
  const noAssets = navSnapshot({ assets: 0, issuedUnits: 100, heldUnits: 10, marketPrice: 112 });
  assert.equal(noAssets.nav, 0); assert.equal(noAssets.premium, null); assert.equal(noAssets.heldNavValue, 0);
  assert.equal(navSnapshot({ assets: 0, issuedUnits: 100, marketPrice: 0 }).premium, null);
});
test('NAV value changes without mutating investor units or outstanding units', () => {
  const result = navFrames();
  assert.deepEqual(result.frames.map(frame => frame.issuedUnits), [100, 100, 100]);
  assert.deepEqual(result.frames.map(frame => frame.heldUnits), [10, 10, 10]);
  close(result.summary.assets, 11000); close(result.summary.nav, 110); close(result.summary.heldNavValue, 1100);
  close(result.summary.premium, 2 / 110);
  assert.equal(result.frames[0].marketPrice, null); assert.equal(result.frames[1].marketPrice, null);
  assert.equal(result.frames[2].marketPrice, 112);
});
test('no holdings does not change NAV, and total loss keeps units while NAV falls to zero', () => {
  const zeroHolding = navFrames({ heldUnits: 0 });
  assert.equal(zeroHolding.summary.heldNavValue, 0); close(zeroHolding.summary.nav, 110);
  const totalLoss = navFrames({ underlyingReturn: -1 });
  assert.equal(totalLoss.summary.nav, 0); assert.equal(totalLoss.summary.navFraction, 0);
  assert.equal(totalLoss.summary.premium, null); assert.equal(totalLoss.summary.heldUnits, 10);
  const noIssue = navFrames({ issuedUnits: 0, heldUnits: 0 });
  assert.equal(noIssue.summary.navFraction, null); assert.equal(noIssue.summary.premium, null);
  assert.equal(noIssue.predictionOutcome, 'undefined');
});
test('NAV charts use a shared numeric scale and represent absent values as null', () => {
  for (const options of [{}, { underlyingReturn: 1, marketPrice: 220 }, { underlyingReturn: -1 }, { issuedUnits: 0, heldUnits: 0 }]) {
    const result = navFrames(options);
    result.frames.forEach(row => {
      if (row.nav === null) assert.equal(row.navFraction, null); else close(row.navFraction * result.priceScale, row.nav);
      if (row.marketPrice === null) assert.equal(row.marketFraction, null); else close(row.marketFraction * result.priceScale, row.marketPrice);
      close(row.netAssetFraction * result.assetScale, row.netAssets);
    });
  }
});
test('already booked expenses are not deducted from reported NAV a second time', () => {
  const result = navFrames({ initialAssets: 9900, underlyingReturn: 0, marketPrice: 99 });
  assert.equal(result.summary.nav, 99);
  assert.equal(result.summary.heldNavValue, 990);
  assert.equal(result.summary.premium, 0);
  assert.deepEqual(result.frames.map(frame => frame.netAssets), [9900, 9900, 9900]);
});
test('NAV refuses impossible holdings, nonfinite inputs and unrepresentable division', () => {
  for (const patch of [{ issuedUnits: -1 }, { heldUnits: 101 }, { heldUnits: NaN }, { issuedUnits: 0, heldUnits: 1 }, { marketPrice: -1 }, { marketPrice: Infinity }, { liabilities: 11000 }]) assert.throws(() => navSnapshot({ assets: 10000, issuedUnits: 100, ...patch }), RangeError);
  assert.throws(() => navSnapshot({ assets: 10000, issuedUnits: Number.MIN_VALUE }), RangeError);
  assert.throws(() => navSnapshot({ assets: Number.MIN_VALUE, issuedUnits: 1, marketPrice: 1e9 }), RangeError);
  for (const patch of [{ underlyingReturn: -1.1 }, { underlyingReturn: 2 }, { underlyingReturn: NaN }, { initialAssets: 0, liabilities: 1 }, { liabilities: 100, underlyingReturn: -1 }, { issuedUnits: Number.MIN_VALUE, heldUnits: 0 }]) assert.throws(() => navFrames(patch), RangeError);
});
test('tracking difference compounds whole-period returns; error is spread of monthly differences', () => {
  const result = trackingComparison();
  const [steady, varying] = result.series;
  close(steady.meanDifference, -.002); close(varying.meanDifference, -.002);
  close(steady.trackingError, 0); close(varying.trackingError, .004);
  close(steady.fundReturn, 1.008 ** 4 - 1); close(steady.benchmarkReturn, 1.01 ** 4 - 1);
  close(steady.trackingDifference, 1.008 ** 4 - 1.01 ** 4);
  close(varying.trackingDifference, (1.004 * 1.012) ** 2 - 1.01 ** 4);
  assert.notEqual(steady.trackingDifference, varying.trackingDifference);
  assert.notEqual(steady.meanDifference, steady.trackingDifference);
});
test('tracking chart and table share every modeled difference and period', () => {
  const result = trackingComparison();
  result.series.forEach(series => series.points.forEach((point, index) => {
    close(point.value, series.differences[index]); assert.equal(point.month, index + 1);
    close(result.chart.maximum - ((point.y - result.chart.top) / result.chart.plotHeight) * (result.chart.maximum - result.chart.minimum), point.value);
  }));
  result.rows.forEach((row, index) => {
    close(row.steadyReturn - row.benchmarkReturn, result.series[0].points[index].value);
    close(row.varyingReturn - row.benchmarkReturn, result.series[1].points[index].value);
  });
});
test('tracking boundaries: zero differences, one observation, total loss and invalid lengths', () => {
  const same = trackingMetrics([0, -.1, .2], [0, -.1, .2]);
  assert.equal(same.trackingDifference, 0); assert.equal(same.trackingError, 0);
  assert.equal(trackingMetrics([0], [.1]).trackingError, 0);
  assert.equal(trackingMetrics([0, 0], [-1, .5]).fundReturn, -1);
  for (const args of [[[], []], [[0], [0, 0]], [[NaN], [0]], [[0], [2]], [null, []]]) assert.throws(() => trackingMetrics(...args), RangeError);
  assert.throws(() => trackingMetrics(Array(1200).fill(1), Array(1200).fill(1)), RangeError);
  assert.throws(() => trackingMetrics(Array(1201).fill(0), Array(1201).fill(0)), RangeError);
});
test('predictions are model-classified and invalid choices rejected', () => {
  assert.equal(classifyFundsPrediction('same', ''), null);
  for (const actual of ['up', 'same', 'down', 'undefined']) {
    assert.equal(classifyFundsPrediction(actual, actual), true);
    assert.equal(classifyFundsPrediction(actual, actual === 'up' ? 'down' : 'up'), false);
  }
  assert.throws(() => classifyFundsPrediction('other', ''), RangeError);
  assert.throws(() => classifyFundsPrediction('up', 'other'), RangeError);
});
test('inputs/defaults are preserved and every run is deterministic and immutable', () => {
  const exposureInput = { xWeight: .35, sameHoldings: true };
  const navInput = { underlyingReturn: -.2, marketPrice: 80, heldUnits: 5 };
  const bench = [0, .1], fund = [0, .09];
  const before = structuredClone({ exposureInput, navInput, bench, fund, fundsDefaults, navDefaults });
  const e = exposureFrames(exposureInput), n = navFrames(navInput), t = trackingMetrics(bench, fund);
  assert.deepEqual({ exposureInput, navInput, bench, fund, fundsDefaults, navDefaults }, before);
  assert.deepEqual(exposureFrames(exposureInput), e); assert.deepEqual(navFrames(navInput), n); assert.deepEqual(trackingMetrics(bench, fund), t);
  assert.throws(() => { e.frames[0].exposures[0].fraction = 999; }, TypeError);
  assert.throws(() => { n.summary.nav = 999; }, TypeError);
  assert.throws(() => { t.differences.push(999); }, TypeError);
  assert.deepEqual(trackingComparison(), trackingComparison());
});

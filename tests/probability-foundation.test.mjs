import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, quantile, histogram, distributionModel, narrowValues } from '../src/simulations/probability/descriptive.mjs';
import { evaluateLoss, lossModel } from '../src/simulations/probability/losses.mjs';
const close = (a, b) => assert(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
test('probability 01: fixed whole-population summaries, tail counterexample and common axes', () => {
  const m = distributionModel(), [a, b] = m.groups;
  assert.equal(m.equalMean, true); assert.equal(m.dataKind, '자체 가상 관측');
  assert.equal(a.summary.sum, 200); assert.equal(b.summary.sum, 200);
  assert.equal(a.summary.mean, 20); assert.equal(b.summary.mean, 20);
  assert.equal(a.summary.median, 20); assert.equal(b.summary.median, 10);
  assert.equal(b.summary.sd, 30); assert.equal(b.summary.iqr, 0); assert.equal(b.summary.max, 110);
  assert.equal(a.axisMax, b.axisMax); assert.equal(a.axisMax, 120);
  for (const g of m.groups) { assert.equal(g.points.length, 10); assert.equal(g.ordered.filter(p => p.middle).length, 2); for (const p of g.points) assert.equal(p.x, p.value / g.axisMax); }
  assert.equal(b.points.filter(p => p.value === 10).at(-1).stack, 8);
});
test('probability 01: permutations, empty/singleton, even/odd, negative and repeated values', () => {
  assert.deepEqual(describe([...narrowValues].reverse()), describe(narrowValues));
  assert.equal(describe([]).mean, null); assert.equal(describe([]).sd, null); assert.equal(quantile([], .5), null);
  assert.equal(describe([7]).variance, 0); assert.equal(describe([7]).median, 7);
  assert.equal(describe([1, 9, 3]).median, 3); assert.equal(describe([1, 9, 3, 5]).median, 4);
  assert.equal(describe([0, 0, 0]).sd, 0); assert.equal(describe([-4, -2, 0]).mean, -2);
  assert.equal(quantile([0, 10, 20, 30], .25), 7.5); assert.equal(quantile([0, 10], 1), 10);
  for (const invalid of [[NaN], [Infinity], [-Infinity]]) assert.throws(() => describe(invalid));
  assert.throws(() => describe([Number.MAX_VALUE, Number.MAX_VALUE]));
  assert.throws(() => quantile([1], 2)); assert.throws(() => quantile([1], NaN));
});
test('probability 01: changing bins preserves raw records and summaries; edges counted exactly once', () => {
  for (const tail of [20, 60, 110]) for (const binWidth of [10, 20, 40]) {
    const m = distributionModel({ tail, binWidth });
    for (const g of m.groups) { assert.equal(g.bins.reduce((s, b) => s + b.count, 0), 10); close(g.bins.reduce((s, b) => s + b.fraction, 0), 1); assert.deepEqual(g.summary, describe(g.values)); }
    assert.equal(m.groups[1].summary.median, 10); assert.equal(m.groups[1].summary.mean, (90 + tail) / 10);
  }
  assert.deepEqual(histogram([0, 20, 120]).map(b => b.count), [1, 1, 0, 0, 0, 1]);
  assert.equal(histogram([]).reduce((s, b) => s + b.count, 0), 0);
  for (const options of [{ width: 0 }, { width: 25 }, { min: 120, max: 0 }]) assert.throws(() => histogram([20], options));
  assert.throws(() => histogram([-1])); assert.throws(() => histogram([121]));
  assert.throws(() => distributionModel({ tail: 200 })); assert.throws(() => distributionModel({ binWidth: 0 }));
});
test('probability 02: fixed expected losses and large versus expected shortage', () => {
  const m = lossModel();
  assert.equal(m.cashAtDue, 200); assert.equal(m.arrived, false);
  assert.equal(m.cases[0].expectedLoss, 20); assert.equal(m.cases[1].expectedLoss, 20);
  assert.equal(m.cases[0].expectedShortage, 0); assert.equal(m.cases[1].expectedShortage, 14);
  assert.equal(m.cases[1].shortageProbability, .01); assert.equal(m.frames.at(-1).cases[1].row.shortage, 1400);
  assert.equal(m.frames[0].cases[0].row, null); assert.equal(m.frames[1].cases[1].row.loss, 0);
  assert.equal(m.frames[2].cases[1].row.loss, 200); assert.equal(m.frames[3].cases[1].row.loss, 1600);
});
test('probability 02: cash conservation, exact equality and deposit-before-withdrawal date boundaries', () => {
  for (const cash of [0, 200, 300, 1600]) for (const dueDay of [15, 30, 45]) {
    const m = lossModel({ cash, dueDay }); assert.equal(m.cashAtDue, cash + (dueDay >= 30 ? 100 : 0));
    assert.equal(m.cashFraction, m.cashAtDue / m.axisMax);
    for (const c of m.cases) for (const row of c.rows) {
      assert.equal(row.funded + row.shortage, row.loss); assert.equal(row.funded + row.remaining, m.cashAtDue);
      close(row.fundedFraction + row.shortageFraction, row.lossFraction);
      assert.equal(row.shortage, Math.max(row.loss - m.cashAtDue, 0));
    }
  }
  const sameDay = lossModel({ dueDay: 30 }); assert.equal(sameDay.cashAtDue, 300);
  assert.equal(sameDay.timeline[1].label, '확정 외부 유입'); assert.equal(sameDay.timeline[2].label, '지출 납기');
  assert.equal(lossModel({ cash: 300 }).cases[1].expectedShortage, 13);
  assert.equal(lossModel({ cash: 1600 }).cases[1].shortageProbability, 0);
  assert.equal(lossModel({ cash: 1600 }).cases[1].expectedLoss, 20);
  assert.deepEqual(lossModel(), lossModel());
});
test('probability 02: probability0/1, impossible result and invalid model rejection', () => {
  const m = evaluateLoss([{ loss: 0, probability: 1 }, { loss: 100, probability: 0 }], 100);
  assert.equal(m.expectedLoss, 0); assert.equal(m.rows[1].possible, false); assert.equal(m.rows[1].shortage, 0);
  assert.equal(evaluateLoss([{ loss: 0, probability: 1 }], 0).expectedShortage, 0);
  for (const outcomes of [[], [{ loss: 1, probability: .5 }], [{ loss: -1, probability: 1 }], [{ loss: Infinity, probability: 1 }], [{ loss: 1, probability: -1 }], [{ loss: 1, probability: NaN }]]) assert.throws(() => evaluateLoss(outcomes, 20));
  assert.throws(() => evaluateLoss([{ loss: 1, probability: 1 }], -1)); assert.throws(() => lossModel({ dueDay: 0 }));
});
test('probability A: only implemented reserved routes and volume8; preserve data labels and honest boundaries', () => {
  const catalog = readFileSync(new URL('../src/catalog.ts', import.meta.url), 'utf8');
  assert.match(catalog, /id: "probability", categoryId: "money", volume: 8/);
  const ids = [...catalog.matchAll(/id: "([^"]+)", bookId: "probability", readId: "([^"]+)"/g)];
  assert.deepEqual(ids.map(x => [x[1], x[2]]), [['averages-and-distributions', 'probability/averages-and-distributions'], ['losses-and-liquidity', 'probability/losses-and-liquidity']]);
  for (const file of ['Intro', 'AveragesDistributions', 'LossesLiquidity']) { const text = readFileSync(new URL(`../src/content/probability/${file}.mdx`, import.meta.url), 'utf8'); assert(!text.includes('Math.random')); assert(text.includes('가상')); }
});

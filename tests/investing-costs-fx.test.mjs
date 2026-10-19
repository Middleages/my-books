import test from 'node:test';
import assert from 'node:assert/strict';
import { costsFxDefaults, costsFxPresets, costsFxScenario, classifyCostsFxPrediction, fxReturnPrimer } from '../src/simulations/investing/costs-fx.mjs';
const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);

test('costs-fx: USD 100→110 and KRW/USD 1200→1320 produce exactly modeled 21%, not20%', () => {
  const r = costsFxScenario();
  assert.equal(r.budgetUsd, 100); assert.equal(r.quantity, 1); assert.equal(r.grossSaleUsd, 110);
  assert.equal(r.finalKrw, 145200); close(r.netReturn, 0.21); assert.notEqual(r.netReturn, 0.2);
  close(r.assetReturn, 0.1); close(r.fxReturn, 0.1); close(r.combinedMultiplier, 1.21);
});
test('costs-fx: no exchange-rate change leaves the asset return', () => {
  const r = costsFxScenario({ sellFx: 1200 }); close(r.netReturn, 0.1); close(r.netReturn, r.assetReturn); assert.equal(r.fxReturn, 0);
});
test('costs-fx: no foreign price return leaves the FX return', () => {
  const r = costsFxScenario({ sellPriceUsd: 100 }); close(r.netReturn, r.fxReturn); close(r.netReturn, 0.1);
});
test('costs-fx: reciprocal multipliers offset, opposite percentage changes do not', () => {
  const r = costsFxScenario({ sellPriceUsd: 120, sellFx: 1000 }); close(r.finalKrw, 120000); close(r.netReturn, 0); assert.equal(r.predictionOutcome, 'same');
  close(costsFxScenario({ sellPriceUsd: 120, sellFx: 960 }).netReturn, -0.04);
  close(costsFxScenario({ sellPriceUsd: 110, sellFx: 1200 / 1.1 }).netReturn, 0);
});
test('costs-fx: total budget includes purchase fee using B/(1+f)', () => {
  const r = costsFxScenario({ buyFeeRate: 0.02 });
  close(r.purchaseUsd, r.budgetUsd / 1.02); close(r.buyFeeUsd, r.budgetUsd - r.purchaseUsd);
  close(r.buyFeeUsd, r.purchaseUsd * 0.02); close(r.purchaseUsd + r.buyFeeUsd, r.budgetUsd);
  assert.equal(r.sellFeeUsd, 0); assert.ok(r.quantity < 1); close(r.finalKrw, 145200 / 1.02);
});
test('costs-fx: sale fee charged once on sale proceeds, including a losing sale', () => {
  const r = costsFxScenario({ sellPriceUsd: 50, sellFeeRate: 0.02 });
  assert.equal(r.grossSaleUsd, 50); assert.equal(r.sellFeeUsd, 1); assert.equal(r.netSaleUsd, 49);
  assert.equal(r.finalKrw, 49 * 1320); assert.equal(r.frames[4].paidSellFeeUsd, 1); assert.equal(r.frames[5].paidSellFeeUsd, 1);
});
test('costs-fx: independent buy and sell fees use their own bases and currencies', () => {
  const r = costsFxScenario({ buyFeeRate: 0.02, sellFeeRate: 0.03 });
  close(r.finalKrw, 120000 / 1200 / 1.02 * 1.1 * 0.97 * 1320);
  close(r.sellFeeUsd, r.grossSaleUsd * 0.03); close(r.netSaleUsd + r.sellFeeUsd, r.grossSaleUsd);
  close(r.paidTradeFeesKrw, r.buyFeeUsd * 1200 + r.sellFeeUsd * 1320);
  assert.equal(r.fxFeesKrw, 0); assert.equal(r.additionalOperatingFee, 0);
});
test('costs-fx: zero fees reproduce no-fee baseline without extra operating deductions', () => {
  const r = costsFxScenario();
  assert.equal(r.buyFeeUsd, 0); assert.equal(r.sellFeeUsd, 0); assert.equal(r.costEffectKrw, 0);
  assert.equal(r.finalKrw, r.noFeeFinalKrw); assert.equal(r.finalKrw, r.buyFeeOnlyFinalKrw);
  assert.equal(r.additionalOperatingFee, 0);
});
test('costs-fx: zero budget is no position, no fees, undefined investment return', () => {
  const r = costsFxScenario({ budgetKrw: 0, buyFeeRate: 0.5, sellFeeRate: 0.5 });
  assert.equal(r.netReturn, null); assert.equal(r.noFeeReturn, null); assert.equal(r.predictionOutcome, 'undefined');
  for (const value of [r.purchaseUsd, r.quantity, r.buyFeeUsd, r.sellFeeUsd, r.finalKrw]) assert.equal(value, 0);
  for (const f of r.frames) { assert.equal(f.totalKrw, 0); assert.equal(f.assetUsd, 0); assert.equal(f.cashUsd, 0); assert.equal(f.predictionOutcome, 'undefined'); }
});
test('costs-fx: total loss remains zero asset value and −100% return', () => {
  const r = costsFxScenario({ sellPriceUsd: 0, buyFeeRate: 0.02, sellFeeRate: 0.02 });
  assert.equal(r.finalKrw, 0); assert.equal(r.netReturn, -1); assert.equal(r.sellFeeUsd, 0); assert.equal(r.frames[3].assetUsd, 0);
  assert.ok(r.frames[3].units > 0); assert.equal(r.frames[4].units, 0);
});
test('costs-fx: zero/positive minimum/max budget boundaries preserve proportional outcomes', () => {
  for (const budgetKrw of [0.01, 1, 12000, 240000, 1e9]) {
    const r = costsFxScenario({ budgetKrw }); close(r.finalKrw, budgetKrw * 1.21); close(r.netReturn, 0.21);
  }
  assert.throws(() => costsFxScenario({ budgetKrw: 1e9 + 1 }), RangeError);
});
test('costs-fx: unsupported tiny positive budgets cannot silently disappear', () => {
  for (const budgetKrw of [Number.MIN_VALUE, 1e-320, 0.009]) assert.throws(() => costsFxScenario({ budgetKrw }), /at least 0.01/);
});
test('costs-fx: broad fee boundaries never overspend the inclusive budget', () => {
  for (const budgetKrw of [0, 0.01, 1, 120000, 1e9]) for (const buyFeeRate of [0, 0.005, 0.02, 0.1, 1]) for (const sellFeeRate of [0, 0.02, 1]) {
    const r = costsFxScenario({ budgetKrw, buyFeeRate, sellFeeRate });
    close(r.purchaseUsd + r.buyFeeUsd, r.budgetUsd); assert.ok(r.purchaseUsd <= r.budgetUsd); assert.ok(r.buyFeeUsd >= 0);
    assert.ok(r.netSaleUsd >= 0); assert.ok(r.sellFeeUsd <= r.grossSaleUsd);
    close(r.netSaleUsd + r.sellFeeUsd, r.grossSaleUsd); close(r.finalKrw + r.sellFeeUsd * r.input.sellFx, r.buyFeeOnlyFinalKrw);
    assert.ok(r.finalKrw <= r.noFeeFinalKrw + 1e-6); assert.equal(r.frames[5].cashUsd, 0);
  }
});
test('costs-fx: 100% sell fee exhausts only sale proceeds', () => {
  const r = costsFxScenario({ sellFeeRate: 1 }); assert.equal(r.finalKrw, 0); assert.equal(r.netReturn, -1); assert.equal(r.sellFeeUsd, r.grossSaleUsd);
});
test('costs-fx: state transitions conserve money at conversion and separate assets from cash', () => {
  const r = costsFxScenario({ buyFeeRate: 0.02, sellFeeRate: 0.02 });
  close(r.frames[0].totalKrw, r.frames[1].totalKrw);
  close(r.frames[1].cashUsd, r.frames[2].assetUsd + r.frames[2].paidBuyFeeUsd);
  close(r.frames[3].assetUsd, r.frames[4].cashUsd + r.frames[4].paidSellFeeUsd);
  close(r.frames[4].totalKrw, r.frames[5].totalKrw);
  for (const f of r.frames) {
    assert.ok(f.cashUsd === 0 || f.assetUsd === 0); assert.ok(f.cashKrw === 0 || (f.cashUsd === 0 && f.assetUsd === 0));
    close(f.totalKrw, f.cashKrw + (f.cashUsd + f.assetUsd) * f.fx);
  }
});
test('costs-fx: all proportional diagram dimensions come from their represented model value', () => {
  for (const input of [costsFxDefaults, ...costsFxPresets.map(row => row.input), { budgetKrw: 0, sellPriceUsd: 0 }]) {
    const r = costsFxScenario(input);
    for (const row of r.comparison) { close(row.fraction * r.krwScale, row.value); assert.ok(row.fraction >= 0 && row.fraction <= 1); }
    for (const row of r.splits) { close(row.keptFraction * r.usdScale, row.keptUsd); close(row.feeFraction * r.usdScale, row.feeUsd); close(row.keptUsd + row.feeUsd, row.totalUsd); }
    for (const f of r.frames) close((f.cashKrwFraction + f.cashUsdKrwFraction + f.assetKrwFraction) * r.krwScale, f.totalKrw);
  }
});
test('costs-fx: area primer decomposes 21% including multiplicative corner', () => {
  const r = fxReturnPrimer(); close(r.pieces.reduce((sum, part) => sum + part.amountKrw, 0), r.finalKrw);
  for (const part of r.pieces) close(part.width * part.height * r.finalKrw, part.amountKrw);
  close(r.pieces.at(-1).amountKrw, 1200); close(r.interactionReturn, 0.01); close(r.additiveReturn, 0.2);
  close(r.pieces.reduce((sum, part) => sum + part.width * part.height, 0), 1);
});
test('costs-fx: comparison gap is not mislabeled as actual fees paid', () => {
  const r = costsFxScenario({ buyFeeRate: 0.02, sellFeeRate: 0.02 });
  close(r.costEffectKrw, r.noFeeFinalKrw - r.finalKrw); assert.notEqual(r.costEffectKrw, r.paidTradeFeesKrw);
});
test('costs-fx: input/default/output immutability and repeat execution', () => {
  const input = { ...costsFxDefaults, buyFeeRate: 0.02 }; const copy = { ...input };
  const first = costsFxScenario(input); const second = costsFxScenario(input);
  assert.deepEqual(input, copy); assert.deepEqual(first, second); assert.notEqual(first, second);
  assert.ok(Object.isFrozen(costsFxDefaults)); assert.ok(Object.isFrozen(first)); assert.ok(Object.isFrozen(first.frames)); assert.ok(Object.isFrozen(first.frames[0]));
  assert.throws(() => { first.frames[4].cashUsd = 999; }, TypeError);
  assert.deepEqual(costsFxScenario(input), second);
});
test('costs-fx: presets are frozen and reciprocal example lies on native range grid', () => {
  const r = costsFxPresets.find(row => row.id === 'offset');
  assert.equal(r.input.sellPriceUsd, 120); assert.equal(r.input.sellFx, 1000); assert.equal(r.input.sellFx % 10, 0);
  assert.ok(Object.isFrozen(r.input)); assert.ok(Object.isFrozen(costsFxPresets));
});
test('costs-fx: invalid shapes, nonfinite values, invalid prices/FX and fee ranges rejected', () => {
  for (const value of [null, [], 'input', 1]) assert.throws(() => costsFxScenario(value), TypeError);
  for (const [key, values] of Object.entries({ budgetKrw: [-1, Infinity, NaN], buyPriceUsd: [0, -1, NaN], sellPriceUsd: [-1, Infinity], buyFx: [0, -1, NaN], sellFx: [0, Infinity], buyFeeRate: [-0.01, 1.01], sellFeeRate: [-0.01, 1.01] })) for (const value of values) assert.throws(() => costsFxScenario({ [key]: value }), RangeError);
});
test('costs-fx: prediction results use unrounded model outcome and undefined baseline', () => {
  assert.equal(classifyCostsFxPrediction('up', ''), null); assert.equal(classifyCostsFxPrediction('up', 'up'), true); assert.equal(classifyCostsFxPrediction('up', 'down'), false);
  assert.equal(classifyCostsFxPrediction('undefined', 'undefined'), true);
  assert.throws(() => classifyCostsFxPrediction('up', 'maybe'), RangeError); assert.throws(() => classifyCostsFxPrediction('unknown', ''), RangeError);
  for (const row of costsFxScenario().frames) assert.equal(row.predictionOutcome, 'up');
});

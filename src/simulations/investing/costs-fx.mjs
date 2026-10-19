// One fictional buy and one sale; no dividend, external flow, FX spread or tax.
// Prices are the supplied asset price path. Never subtract operating expenses
// again from an already-net NAV/price. Fees below are investor trade fees only.
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
const fmt = value => value.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
const finite = (value, name, min, max) => {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`${name} must be finite and between ${min} and ${max}.`);
};
const outcome = value => value === null ? 'undefined' : Math.abs(value) < 1e-12 ? 'same' : value > 0 ? 'up' : 'down';
export const costsFxDefaults = freeze({ budgetKrw: 120000, buyPriceUsd: 100, sellPriceUsd: 110, buyFx: 1200, sellFx: 1320, buyFeeRate: 0, sellFeeRate: 0 });
export const costsFxPresets = freeze([
  { id: 'unchanged-fx', label: '환율 그대로', input: { ...costsFxDefaults, sellFx: 1200 } },
  { id: 'unchanged-asset', label: '외화 가격 그대로', input: { ...costsFxDefaults, sellPriceUsd: 100 } },
  { id: 'offset', label: '서로 상쇄', input: { ...costsFxDefaults, sellPriceUsd: 120, sellFx: 1000 } },
  { id: 'fees', label: '비용 비교 2%씩', input: { ...costsFxDefaults, buyFeeRate: 0.02, sellFeeRate: 0.02 } },
  { id: 'max', label: '예산 240,000원', input: { ...costsFxDefaults, budgetKrw: 240000 } },
  { id: 'zero', label: '예산 0원', input: { ...costsFxDefaults, budgetKrw: 0 } },
]);
export function classifyCostsFxPrediction(actual, prediction) {
  const choices = ['up', 'same', 'down', 'undefined'];
  if (!choices.includes(actual)) throw new RangeError('Unknown outcome.');
  if (prediction === '') return null;
  if (!choices.includes(prediction)) throw new RangeError('Unknown prediction.');
  return actual === prediction;
}
export function costsFxScenario(options = {}) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Options must be an object.');
  const input = { ...costsFxDefaults, ...options };
  finite(input.budgetKrw, 'budgetKrw', 0, 1e9);
  if (input.budgetKrw > 0 && input.budgetKrw < 0.01) throw new RangeError('Positive budgetKrw must be at least 0.01 to avoid floating-point underflow.');
  finite(input.buyPriceUsd, 'buyPriceUsd', 0.01, 1e6);
  finite(input.sellPriceUsd, 'sellPriceUsd', 0, 1e6);
  finite(input.buyFx, 'buyFx', 0.01, 1e6);
  finite(input.sellFx, 'sellFx', 0.01, 1e6);
  finite(input.buyFeeRate, 'buyFeeRate', 0, 1);
  finite(input.sellFeeRate, 'sellFeeRate', 0, 1);
  const budgetUsd = input.budgetKrw / input.buyFx;
  // Inclusive total budget: buying an asset worth B would overspend by B*f.
  const purchaseUsd = budgetUsd / (1 + input.buyFeeRate);
  const buyFeeUsd = budgetUsd - purchaseUsd;
  const quantity = purchaseUsd / input.buyPriceUsd;
  const grossSaleUsd = quantity * input.sellPriceUsd;
  const sellFeeUsd = grossSaleUsd * input.sellFeeRate;
  const netSaleUsd = grossSaleUsd - sellFeeUsd;
  const finalKrw = netSaleUsd * input.sellFx;
  const assetMultiplier = input.sellPriceUsd / input.buyPriceUsd;
  const fxMultiplier = input.sellFx / input.buyFx;
  const combinedMultiplier = assetMultiplier * fxMultiplier;
  const assetReturn = assetMultiplier - 1;
  const fxReturn = fxMultiplier - 1;
  const noFeeFinalKrw = (budgetUsd / input.buyPriceUsd) * input.sellPriceUsd * input.sellFx;
  const buyFeeOnlyFinalKrw = grossSaleUsd * input.sellFx;
  const netReturn = input.budgetKrw === 0 ? null : finalKrw / input.budgetKrw - 1;
  const noFeeReturn = input.budgetKrw === 0 ? null : combinedMultiplier - 1;
  const predictionOutcome = outcome(netReturn);
  const krwScale = Math.max(input.budgetKrw, noFeeFinalKrw, finalKrw, 1);
  const usdScale = Math.max(budgetUsd, grossSaleUsd, 1);
  const labels = ['원화 예산 준비', '달러로 환전', '매수와 매수수수료', '보유 구간 말 평가', '매도와 매도수수료', '원화로 환전 완료'];
  const descriptions = [
    `총예산 ${fmt(input.budgetKrw)}원에는 매수수수료도 포함됩니다. 추가 입금이나 차입은 없습니다.`,
    `${fmt(input.budgetKrw)}원 ÷ ${fmt(input.buyFx)}원/USD = ${fmt(budgetUsd)} USD입니다. 원화와 달러를 동시에 보유한 것으로 더하지 않습니다.`,
    `달러 예산 ${fmt(budgetUsd)}에서 자산 ${fmt(purchaseUsd)}와 수수료 ${fmt(buyFeeUsd)} USD로 나눕니다. 매수대금 기준 수수료율은 ${fmt(input.buyFeeRate * 100)}%입니다.`,
    `보유 ${fmt(quantity)}단위의 가격이 ${fmt(input.sellPriceUsd)} USD가 됐습니다. 평가액 ${fmt(grossSaleUsd)} USD는 아직 매도 현금이 아닙니다.`,
    `자산을 모두 팔아 대금 ${fmt(grossSaleUsd)}에서 수수료 ${fmt(sellFeeUsd)} USD를 한 번 뺍니다. 수취 현금은 ${fmt(netSaleUsd)} USD입니다.`,
    input.budgetKrw === 0 ? '시작 예산과 최종액은 모두 0원입니다. 나눌 시작 금액이 없어 투자 수익률은 정의 불가입니다.' : `수취 ${fmt(netSaleUsd)} USD × ${fmt(input.sellFx)}원/USD = ${fmt(finalKrw)}원입니다. 총예산 대비 수익률은 ${fmt(netReturn * 100)}%입니다.`,
  ];
  const states = [
    { cashKrw: input.budgetKrw, cashUsd: 0, assetUsd: 0, units: 0, fx: input.buyFx, paidBuyFeeUsd: 0, paidSellFeeUsd: 0 },
    { cashKrw: 0, cashUsd: budgetUsd, assetUsd: 0, units: 0, fx: input.buyFx, paidBuyFeeUsd: 0, paidSellFeeUsd: 0 },
    { cashKrw: 0, cashUsd: 0, assetUsd: purchaseUsd, units: quantity, fx: input.buyFx, paidBuyFeeUsd: buyFeeUsd, paidSellFeeUsd: 0 },
    { cashKrw: 0, cashUsd: 0, assetUsd: grossSaleUsd, units: quantity, fx: input.sellFx, paidBuyFeeUsd: buyFeeUsd, paidSellFeeUsd: 0 },
    { cashKrw: 0, cashUsd: netSaleUsd, assetUsd: 0, units: 0, fx: input.sellFx, paidBuyFeeUsd: buyFeeUsd, paidSellFeeUsd: sellFeeUsd },
    { cashKrw: finalKrw, cashUsd: 0, assetUsd: 0, units: 0, fx: input.sellFx, paidBuyFeeUsd: buyFeeUsd, paidSellFeeUsd: sellFeeUsd },
  ];
  const frames = states.map((state, index) => {
    const totalKrw = state.cashKrw + (state.cashUsd + state.assetUsd) * state.fx;
    return { ...state, index, predictionOutcome, label: labels[index], message: descriptions[index], totalKrw,
      cashKrwFraction: state.cashKrw / krwScale, cashUsdKrwFraction: state.cashUsd * state.fx / krwScale,
      assetKrwFraction: state.assetUsd * state.fx / krwScale,
    };
  });
  const comparison = [
    { id: 'budget', label: '같은 출발 예산', value: input.budgetKrw },
    { id: 'no-fee', label: '매매수수료가 없을 때', value: noFeeFinalKrw },
    { id: 'buy-fee', label: '매수수수료만 반영', value: buyFeeOnlyFinalKrw },
    { id: 'both-fees', label: '매수·매도수수료 모두 반영', value: finalKrw },
  ].map(row => ({ ...row, fraction: row.value / krwScale }));
  const splits = [
    { id: 'buy', label: '매수 시 · 달러 예산을 나눔', totalUsd: budgetUsd, keptUsd: purchaseUsd, feeUsd: buyFeeUsd, keptLabel: '자산 매수대금', keptFraction: purchaseUsd / usdScale, feeFraction: buyFeeUsd / usdScale },
    { id: 'sell', label: '매도 시 · 매도대금을 나눔', totalUsd: grossSaleUsd, keptUsd: netSaleUsd, feeUsd: sellFeeUsd, keptLabel: '내 수취 현금', keptFraction: netSaleUsd / usdScale, feeFraction: sellFeeUsd / usdScale },
  ];
  return freeze({ input, budgetUsd, purchaseUsd, buyFeeUsd, quantity, grossSaleUsd, sellFeeUsd, netSaleUsd, finalKrw,
    assetMultiplier, fxMultiplier, combinedMultiplier, assetReturn, fxReturn, noFeeReturn, netReturn,
    noFeeFinalKrw, buyFeeOnlyFinalKrw, costEffectKrw: noFeeFinalKrw - finalKrw,
    paidTradeFeesKrw: buyFeeUsd * input.buyFx + sellFeeUsd * input.sellFx,
    fxFeesKrw: 0, additionalOperatingFee: 0, predictionOutcome, krwScale, usdScale, comparison, splits, frames, summary: frames.at(-1),
  });
}
// Fixed no-fee primer: area = USD amount × KRW per USD. All areas and labels
// derive from the same scenario; the small corner is the multiplicative term.
export function fxReturnPrimer() {
  const result = costsFxScenario();
  const baseWidth = result.budgetUsd / (result.budgetUsd * result.assetMultiplier);
  const baseHeight = result.input.buyFx / result.input.sellFx;
  const pieces = [
    { id: 'principal', label: '처음 원금', amountKrw: result.input.budgetKrw, x: 0, y: 0, width: baseWidth, height: baseHeight },
    { id: 'asset', label: '외화 가격 상승분', amountKrw: result.input.budgetKrw * result.assetReturn, x: baseWidth, y: 0, width: 1 - baseWidth, height: baseHeight },
    { id: 'fx', label: '처음 원금의 환율 변화분', amountKrw: result.input.budgetKrw * result.fxReturn, x: 0, y: baseHeight, width: baseWidth, height: 1 - baseHeight },
    { id: 'interaction', label: '늘어난 외화에도 붙는 환율 변화분', amountKrw: result.input.budgetKrw * result.assetReturn * result.fxReturn, x: baseWidth, y: baseHeight, width: 1 - baseWidth, height: 1 - baseHeight },
  ];
  return freeze({ ...result, pieces, additiveReturn: result.assetReturn + result.fxReturn, interactionReturn: result.assetReturn * result.fxReturn });
}

// One fictional observation period, then trades at unchanged end-of-period prices.
// No deposits, withdrawals, distributions, costs, taxes, leverage or settlement delay.
export const allocationDefaults = Object.freeze({ initialAmount: 1000, stockWeight: 0.6, stockReturn: 0.2, bondReturn: 0 });
const names = { stock: '주식', bond: '채권', cash: '매매 현금' };
const formatted = value => value.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
const rateText = value => value === null ? '정의 불가' : `${formatted(value * 100)}%`;
const near = (a, b, operationScale = 0) => Math.abs(a - b) <= Number.EPSILON * 8 * Math.max(Math.abs(a), Math.abs(b), operationScale, Number.MIN_VALUE);
function object(value, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${name} must be an object.`);
}
function finite(value, name, minimum, maximum = 1e12) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) throw new RangeError(`${name} is outside the supported finite range.`);
}
function checkedState(state) {
  object(state, 'state');
  const copy = {};
  for (const key of ['stockUnits', 'bondUnits', 'stockPrice', 'bondPrice', 'cash']) {
    finite(state[key], key, 0);
    copy[key] = state[key];
  }
  if (!Number.isFinite(copy.stockUnits * copy.stockPrice + copy.bondUnits * copy.bondPrice + copy.cash)) throw new RangeError('Portfolio value must be finite.');
  return copy;
}
export function allocationSnapshot(state) {
  const copy = checkedState(state);
  const stockValue = copy.stockUnits * copy.stockPrice;
  const bondValue = copy.bondUnits * copy.bondPrice;
  const total = stockValue + bondValue + copy.cash;
  return { ...copy, stockValue, bondValue, total, stockWeight: total === 0 ? null : stockValue / total, bondWeight: total === 0 ? null : bondValue / total, cashWeight: total === 0 ? null : copy.cash / total };
}

// amount is the actual trade consideration, not units. A rejected order leaves state unchanged.
export function executeAllocationTrade(state, order) {
  const before = checkedState(state);
  object(order, 'order');
  if (!['stock', 'bond'].includes(order.asset)) throw new RangeError('Unknown asset.');
  if (!['sell', 'buy'].includes(order.side)) throw new RangeError('Unknown side.');
  finite(order.amount, 'amount', 0);
  const fail = reason => ({ accepted: false, reason, amount: 0, units: 0, state: { ...before } });
  const price = before[`${order.asset}Price`];
  const unitsKey = `${order.asset}Units`;
  if (order.amount === 0) return { accepted: true, reason: 'no-trade', amount: 0, units: 0, state: { ...before } };
  if (price === 0) return fail('zero-price');
  if (order.side === 'buy' && order.amount > before.cash) return fail('budget-exceeded');
  if (order.side === 'sell' && order.amount > before[unitsKey] * price) return fail('holding-exceeded');
  const units = order.amount / price;
  if (!Number.isFinite(units) || units > 1e12) return fail('unsupported-quantity');
  const next = { ...before };
  next[unitsKey] += order.side === 'buy' ? units : -units;
  next.cash += order.side === 'buy' ? -order.amount : order.amount;
  // Selling exactly the available value must leave zero units, not a floating-point residue.
  if (order.side === 'sell' && order.amount === before[unitsKey] * price) next[unitsKey] = 0;
  if (next[unitsKey] === before[unitsKey] || next.cash === before.cash) return fail('unrepresentable-trade');
  checkedState(next);
  return { accepted: true, reason: 'executed', amount: order.amount, units, state: next };
}

export function classifyAllocationPrediction(outcome, prediction) {
  if (!['up', 'same', 'down', 'undefined'].includes(outcome)) throw new RangeError('Unknown outcome.');
  if (!['', 'up', 'same', 'down', 'undefined'].includes(prediction)) throw new RangeError('Unknown prediction.');
  return prediction === '' ? null : prediction === outcome;
}

export function allocationFrames(options = {}) {
  object(options, 'options');
  const input = { ...allocationDefaults, ...options };
  finite(input.initialAmount, 'initialAmount', 0, 1e9);
  if (input.initialAmount > 0 && input.initialAmount < 0.01) throw new RangeError('initialAmount must be zero or at least 0.01.');
  finite(input.stockWeight, 'stockWeight', 0, 1);
  finite(input.stockReturn, 'stockReturn', -1, 1);
  finite(input.bondReturn, 'bondReturn', -1, 1);
  const initialStock = input.initialAmount * input.stockWeight;
  const initialBond = input.initialAmount - initialStock;
  const initialState = { stockUnits: initialStock / 100, bondUnits: initialBond / 100, stockPrice: 100, bondPrice: 100, cash: 0 };
  const driftState = { ...initialState, stockPrice: 100 + 100 * input.stockReturn, bondPrice: 100 + 100 * input.bondReturn };
  const initial = allocationSnapshot(initialState);
  const drift = allocationSnapshot(driftState);
  const targetStock = drift.total * input.stockWeight;
  const targetBond = drift.total - targetStock;
  const difference = drift.stockValue - targetStock;
  const plannedAmount = near(drift.stockValue, targetStock) ? 0 : Math.abs(difference);
  const seller = plannedAmount === 0 ? null : difference > 0 ? 'stock' : 'bond';
  const buyer = seller === null ? null : seller === 'stock' ? 'bond' : 'stock';
  // Check feasibility before selling. Zero-priced assets cannot acquire positive value by buying units.
  const blocked = buyer !== null && driftState[`${buyer}Price`] === 0;
  const sale = seller === null || blocked ? null : executeAllocationTrade(driftState, { asset: seller, side: 'sell', amount: plannedAmount });
  if (sale !== null && !sale.accepted) throw new Error(`Unexpected planned sale failure: ${sale.reason}`);
  const afterSaleState = sale === null ? { ...driftState } : sale.state;
  const purchase = buyer === null || blocked ? null : executeAllocationTrade(afterSaleState, { asset: buyer, side: 'buy', amount: plannedAmount });
  if (purchase !== null && !purchase.accepted) throw new Error(`Unexpected planned purchase failure: ${purchase.reason}`);
  const finalState = purchase === null ? { ...afterSaleState } : purchase.state;
  const afterSale = allocationSnapshot(afterSaleState);
  const final = allocationSnapshot(finalState);
  const tradeAmount = sale?.amount ?? 0;
  const status = drift.total === 0 ? 'undefined-total' : blocked ? 'blocked-zero-price' : plannedAmount === 0 ? 'already-target' : 'rebalanced';
  const targetReached = drift.total === 0 ? null : near(final.stockValue, targetStock, drift.total) && near(final.bondValue, targetBond, drift.total) && final.cash === 0;
  const predictionOutcome = initial.stockWeight === null || drift.stockWeight === null ? 'undefined' : near(initial.stockWeight, drift.stockWeight) ? 'same' : drift.stockWeight > initial.stockWeight ? 'up' : 'down';
  // A single scale is shared across all frames and before/after bars within this scenario.
  const moneyScale = Math.max(initial.total, drift.total, final.total, 1);
  const segments = snapshot => ['stock', 'bond', 'cash'].map(key => ({ key, label: names[key], value: key === 'cash' ? snapshot.cash : snapshot[`${key}Value`], fraction: (key === 'cash' ? snapshot.cash : snapshot[`${key}Value`]) / moneyScale }));
  const noTradeMessage = status === 'undefined-total' ? '전체 평가액이 0이므로 비중의 분모가 없습니다. 60% 같은 비율로 표시하지 않고 거래도 하지 않습니다.' : status === 'blocked-zero-price' ? `${names[buyer]} 가격이 0이라 양의 목표 평가액을 매수로 만들 수 없습니다. 손실을 복구한 척하지 않고 두 거래 모두 실행하지 않습니다.` : '이미 목표 비중이므로 매도와 매수 모두 0입니다. 같은 비중을 확인하는 것만으로 돈이 생기지 않습니다.';
  const makeFrame = (key, index, label, snapshot, message, sold, bought) => ({
    key, index, label, time: key === 'initial' ? 'T0 · 관찰 시작' : 'T1 · 같은 관찰 종료 시점', ...snapshot,
    message, sold, bought, externalFlow: 0, cost: 0, tax: 0, targetStock, targetBond,
    targetStockWeight: input.stockWeight, targetBondWeight: 1 - input.stockWeight,
    segments: segments(snapshot), predictionOutcome,
    movement: key === 'sell' && tradeAmount > 0 ? { from: seller, to: 'cash', amount: tradeAmount } : key === 'buy' && tradeAmount > 0 ? { from: 'cash', to: buyer, amount: tradeAmount } : null,
  });
  const frames = [
    makeFrame('initial', 0, '출발 · 선택한 목표 비중', initial, `주식 ${formatted(initial.stockValue)}단위와 채권 ${formatted(initial.bondValue)}단위, 합계 ${formatted(initial.total)}단위로 출발합니다. 목표 주식 비중은 ${rateText(input.stockWeight)}지만, 실제 비중은 총액이 0이면 정의되지 않습니다.`, 0, 0),
    makeFrame('drift', 1, '가격 변화 · 매매 없이 비중 이동', drift, `수량은 그대로이고 가격만 바뀌었습니다. 주식 ${formatted(drift.stockValue)}단위와 채권 ${formatted(drift.bondValue)}단위, 합계 ${formatted(drift.total)}단위입니다. 주식 비중은 ${rateText(drift.stockWeight)}입니다.`, 0, 0),
    makeFrame('sell', 2, '매도 · 평가액에서 현금으로', afterSale, tradeAmount > 0 ? `${names[seller]} ${formatted(tradeAmount)}단위를 팔아 현금 ${formatted(afterSale.cash)}단위를 받았습니다. 자산 평가액은 줄고 현금은 같은 만큼 늘어 합계 ${formatted(afterSale.total)}단위가 유지됩니다.` : noTradeMessage, tradeAmount, 0),
    makeFrame('buy', 3, '매수 · 현금에서 다른 자산으로', final, tradeAmount > 0 ? `그 현금 ${formatted(tradeAmount)}단위로 ${names[buyer]}을 삽니다. 주식 ${formatted(final.stockValue)}단위·채권 ${formatted(final.bondValue)}단위·현금 ${formatted(final.cash)}단위, 합계 ${formatted(final.total)}단위입니다. 목표 비중으로 돌아와도 재조정 자체가 수익을 더하지는 않습니다.` : noTradeMessage, tradeAmount, purchase?.amount ?? 0),
  ];
  const profit = drift.total - initial.total;
  return {
    input, frames, initial: frames[0], drift: frames[1], afterSale: frames[2], summary: frames[3], moneyScale,
    axis: [0, moneyScale / 2, moneyScale].map(value => ({ value, fraction: value / moneyScale })),
    targetStock, targetBond, targetBondWeight: 1 - input.stockWeight, seller, buyer, plannedAmount, tradeAmount,
    soldUnits: sale?.units ?? 0, boughtUnits: purchase?.units ?? 0, status, targetReached, predictionOutcome,
    profit, totalReturn: initial.total === 0 ? null : profit / initial.total,
    weightChange: initial.stockWeight === null || drift.stockWeight === null ? null : drift.stockWeight - initial.stockWeight,
    targetMarkerFraction: targetStock / moneyScale,
    tradeLabel: tradeAmount === 0 ? noTradeMessage : `${names[seller]} ${formatted(tradeAmount)}단위 매도 → 같은 현금으로 ${names[buyer]} ${formatted(tradeAmount)}단위 매수`,
  };
}

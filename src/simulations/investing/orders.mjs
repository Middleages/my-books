// One incoming buy order against a fixed, finite sell book. Whole shares and
// integer fictional currency units; fees and settlement delay are omitted.
const defaultAsks = Object.freeze([
  Object.freeze({ id: 'A', price: 100, quantity: 10, arrival: 1 }),
  Object.freeze({ id: 'B', price: 101, quantity: 10, arrival: 2 }),
]);
export const ordersDefaults = Object.freeze({ mode: 'market', quantity: 15, budget: 2000, limitPrice: 100, lastTradedPrice: 100, asks: defaultAsks });

const integer = (value, label, maximum = 1e12, minimum = 0) => {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new RangeError(`잘못된 정수 입력: ${label}`);
};

export function ordersFrames(options = {}) {
  const input = { ...ordersDefaults, ...options };
  if (!['market', 'limit'].includes(input.mode)) throw new RangeError('주문 종류 오류');
  integer(input.quantity, '주문 수량', 1e6);
  integer(input.budget, '예산');
  integer(input.limitPrice, '지정가', 1e9);
  if (input.lastTradedPrice !== null) integer(input.lastTradedPrice, '직전 체결가', 1e9, 1);
  if (!Array.isArray(input.asks) || input.asks.length > 100) throw new RangeError('매도 호가는 100개 이내 배열이어야 합니다.');
  const ids = new Set();
  input.asks = input.asks.map((ask) => {
    if (!ask || typeof ask.id !== 'string' || !ask.id.trim() || ids.has(ask.id)) throw new RangeError('매도 주문 ID는 비어 있지 않고 고유해야 합니다.');
    ids.add(ask.id);
    integer(ask.price, '매도 가격', 1e9, 1);
    integer(ask.quantity, '매도 수량', 1e6);
    integer(ask.arrival, '도착 순서');
    return { id: ask.id, price: ask.price, quantity: ask.quantity, arrival: ask.arrival };
  });
  // Stable input order breaks a tied arrival value. Neither caller input nor
  // an earlier observation frame is ever mutated.
  const book = input.asks.map(ask => ({ ...ask, initialQuantity: ask.quantity, remainingQuantity: ask.quantity, filledQuantity: 0, sellerCash: 0 }))
    .sort((a, b) => a.price - b.price || a.arrival - b.arrival);
  const initialShares = book.reduce((sum, ask) => sum + ask.quantity, 0);
  const bestAsk = book.find(ask => ask.quantity > 0)?.price ?? null;
  const bookScale = Math.max(10, ...book.map(ask => ask.quantity));
  const orderScale = Math.max(1, input.quantity);
  const cashScale = Math.max(1, input.budget);
  const fills = [];
  let filledQuantity = 0, notional = 0, reason = null;
  const frame = (phase, message, currentFill = null) => {
    const remainingQuantity = input.quantity - filledQuantity;
    const sellerShares = book.reduce((sum, ask) => sum + ask.remainingQuantity, 0);
    const sellerCash = book.reduce((sum, ask) => sum + ask.sellerCash, 0);
    const buyerCash = input.budget - notional;
    return {
      phase, message, reason, status: phase !== 'complete' ? 'observing' : input.quantity === 0 ? 'no-order' : remainingQuantity === 0 ? 'filled' : filledQuantity > 0 ? 'partial' : 'unfilled',
      filledQuantity, remainingQuantity, notional, averagePrice: filledQuantity === 0 ? null : notional / filledQuantity,
      lastFillPrice: fills.at(-1)?.price ?? null, initialLastTradedPrice: input.lastTradedPrice, initialBestAsk: bestAsk,
      buyerCash, sellerCash, cashTotal: buyerCash + sellerCash,
      buyerShares: filledQuantity, sellerShares, shareTotal: filledQuantity + sellerShares,
      bookScale, orderScale, cashScale, orderFilledFraction: filledQuantity / orderScale, orderUnfilledFraction: remainingQuantity / orderScale,
      buyerCashFraction: buyerCash / cashScale, sellerCashFraction: sellerCash / cashScale,
      currentFill: currentFill ? { ...currentFill } : null,
      fills: fills.map(fill => ({ ...fill })),
      asks: book.map(ask => ({ ...ask, remainingFraction: ask.remainingQuantity / bookScale, filledFraction: ask.filledQuantity / bookScale, withinLimit: input.mode === 'market' || ask.price <= input.limitPrice })),
    };
  };
  const frames = [frame('initial', '매도 주문이 가격순으로 기다립니다. 아직 매수 수량과 대금은 0입니다.')];
  for (const ask of book) {
    if (filledQuantity === input.quantity) break;
    if (ask.remainingQuantity === 0) continue;
    if (input.mode === 'limit' && ask.price > input.limitPrice) { reason = 'limit'; break; }
    const affordable = Math.floor((input.budget - notional) / ask.price);
    if (affordable === 0) { reason = 'budget'; break; }
    const quantity = Math.min(input.quantity - filledQuantity, ask.remainingQuantity, affordable);
    const trade = { askId: ask.id, price: ask.price, quantity, notional: ask.price * quantity };
    ask.remainingQuantity -= quantity;
    ask.filledQuantity += quantity;
    ask.sellerCash += trade.notional;
    filledQuantity += quantity;
    notional += trade.notional;
    fills.push(trade);
    frames.push(frame('fill', `${ask.id}의 ${ask.price}단위 호가에서 ${quantity}주 체결. 이번 대금 ${trade.notional}단위가 반영됩니다.`, trade));
    // A partly consumed level means budget is exhausted for another whole share.
    if (filledQuantity < input.quantity && ask.remainingQuantity > 0) { reason = 'budget'; break; }
  }
  if (filledQuantity < input.quantity && reason === null) reason = 'liquidity';
  const messages = {
    limit: '다음 매도 가격이 매수 지정가를 넘습니다. 가격 한도를 지키고 나머지는 미체결로 남깁니다.',
    budget: '다음 한 주를 살 예산이 부족합니다. 가능한 수량만 체결하고 가용 예산을 음수로 만들지 않습니다.',
    liquidity: '이 모형에 남은 매도 잔량이 없습니다. 없는 주식을 만들어 체결하지 않습니다.',
  };
  const message = input.quantity === 0 ? '주문 수량이 0이므로 체결도 대금 이동도 없습니다.'
    : reason ? messages[reason] : '주문 수량을 모두 체결했습니다. 평균 체결가는 각 가격의 대금을 합한 뒤 전체 체결 수량으로 나눕니다.';
  frames.push(frame('complete', message));
  return { input, initialShares, frames, summary: frames.at(-1) };
}

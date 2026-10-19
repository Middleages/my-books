// 세금·비용·외부 입출금0, 분수 주식 허용. 배당 지급과 이론 배당락은 같은 관찰 단계다.
export const totalReturnDefaults = Object.freeze({ initialPrice: 100, dividendPerShare: 5, endPrice: 95, reinvest: false, sellShares: 0, investorShares: 1, totalShares: 1000, companyCash: 10000, investorCash: 0 });
export function totalReturnFrames(options = {}) {
  const input = { ...totalReturnDefaults, ...options };
  // endPrice를 생략하면 해당 배당의 이론 가격을 유지한다.
  if (options.endPrice === undefined) input.endPrice = Math.max(0, input.initialPrice - input.dividendPerShare);
  for (const [key, value] of Object.entries(input)) {
    if (key !== 'reinvest' && (!Number.isFinite(value) || value < 0 || value > 1e12)) throw new RangeError(`잘못된 입력: ${key}`);
  }
  if (typeof input.reinvest !== 'boolean') throw new RangeError('재투자 입력 오류');
  if (input.investorShares > input.totalShares) throw new RangeError('전체 주식보다 보유 주식이 많습니다.');
  const initialInvestment = input.initialPrice * input.investorShares;
  if (input.initialPrice > 0 && input.investorShares > 0 && initialInvestment === 0) throw new RangeError('기초 투자액이 계산 가능한 정밀도보다 작습니다.');
  const initialWealth = initialInvestment + input.investorCash;
  let state = { price: input.initialPrice, shares: input.investorShares, cash: input.investorCash, companyCash: input.companyCash, otherShareholdersCash: 0, counterpartyCashChange: 0, otherShares: input.totalShares - input.investorShares, dividendsReceived: 0, totalDividendPaid: 0, costBasis: initialInvestment, realizedGain: 0, reinvestedCash: 0, saleProceeds: 0 };
  const frames = [];
  const push = (phase, status, message, cashFlows = []) => {
    const stockValue = state.price * state.shares;
    const wealth = stockValue + state.cash;
    const unrealizedGain = stockValue - state.costBasis;
    const totalReturn = initialInvestment === 0 ? null : (wealth - initialWealth) / initialInvestment;
    const priceReturn = input.initialPrice === 0 ? null : (state.price - input.initialPrice) / input.initialPrice;
    if ([totalReturn, priceReturn].some(value => value !== null && !Number.isFinite(value))) throw new RangeError('수익률이 계산 가능한 유한 범위를 벗어났습니다.');
    frames.push({ ...state, phase, status, message, cashFlows, stockValue, wealth, initialInvestment, initialWealth, unrealizedGain, totalGain: wealth - initialWealth, wealthDirection: Math.abs(wealth - initialWealth) < 1e-9 ? 'same' : wealth > initialWealth ? 'up' : 'down', totalReturn, priceReturn, cashTotal: state.companyCash + state.cash + state.otherShareholdersCash + state.counterpartyCashChange, totalShares: input.totalShares });
  };
  push('initial', 'ready', '기초 평가액과 보유 현금입니다. 아직 배당을 받지 않았습니다.');
  const payment = input.totalShares * input.dividendPerShare;
  if (payment > input.companyCash) push('dividend', 'rejected', '기업의 지급 현금이 부족합니다. 배당과 이론 배당락을 적용하지 않습니다.');
  else if (input.dividendPerShare > input.initialPrice) push('dividend', 'rejected', '배당이 주가보다 큰 경우는 이 단순 배당락 모형의 범위 밖입니다.');
  else {
    const received = input.investorShares * input.dividendPerShare;
    const others = payment - received;
    state = { ...state, price: input.initialPrice - input.dividendPerShare, cash: state.cash + received, companyCash: state.companyCash - payment, otherShareholdersCash: others, dividendsReceived: received, totalDividendPaid: payment };
    push('dividend', 'completed', '회사 현금이 주주에게 이동하고 이론 주가는 배당만큼 낮아집니다. 실제 시장가격의 예측은 아닙니다.', [{ from: 'company', to: 'investor', amount: received }, { from: 'company', to: 'others', amount: others }]);
  }
  // 별도의 시장가격 가정이다. 배당 실패 후 생략된 endPrice는 기존 가격을 유지한다.
  const marketPrice = frames.at(-1).status === 'rejected' && options.endPrice === undefined ? input.initialPrice : input.endPrice;
  state = { ...state, price: marketPrice };
  push('market', 'completed', '별도로 정한 관찰 시점의 가격입니다. 가격 변화와 배당을 합쳐 총수익을 읽습니다.');
  const spending = state.dividendsReceived;
  if (!input.reinvest || spending === 0) push('reinvest', 'skipped', '배당 현금을 그대로 보유합니다.');
  else if (state.price === 0) push('reinvest', 'rejected', '가격이 0이면 배당 현금을 나누어 매수 수량을 정할 수 없습니다.');
  else if (spending / state.price > state.otherShares) push('reinvest', 'rejected', '다른 주주의 보유 수량보다 많이 살 수 없습니다.');
  else {
    const purchased = spending / state.price;
    state = { ...state, shares: state.shares + purchased, otherShares: state.otherShares - purchased, cash: state.cash - spending, counterpartyCashChange: state.counterpartyCashChange + spending, costBasis: state.costBasis + spending, reinvestedCash: spending };
    push('reinvest', 'completed', '받은 배당 현금을 한 번 사용해 기존 주식을 삽니다. 현금과 주식에 동시에 더하지 않습니다.', [{ from: 'investor', to: 'market', amount: spending }]);
  }
  if (input.sellShares > state.shares) push('sale', 'rejected', '보유 수량을 넘는 매도는 거부합니다.');
  else if (input.sellShares === 0) push('sale', 'skipped', '매도하지 않은 주식의 손익은 평가손익입니다.');
  else {
    const proceeds = input.sellShares * state.price;
    const soldBasis = state.costBasis * (input.sellShares / state.shares);
    state = { ...state, shares: state.shares - input.sellShares, otherShares: state.otherShares + input.sellShares, cash: state.cash + proceeds, counterpartyCashChange: state.counterpartyCashChange - proceeds, costBasis: state.costBasis - soldBasis, realizedGain: state.realizedGain + proceeds - soldBasis, saleProceeds: proceeds };
    push('sale', 'completed', '평균 취득원가로 매도분의 실현손익을 구분합니다. 매도대금 전체가 수익인 것은 아닙니다.', [{ from: 'market', to: 'investor', amount: proceeds }]);
  }
  return { input, frames, summary: frames.at(-1) };
}

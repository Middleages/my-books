// 가상 현금 단위·보통주. 기존 관찰 주주, 판매 주주, 신규 구매자는 서로 다른 사람이다.
export const ownershipDefaults = Object.freeze({ mode: 'issuance', quantity: 50, price: 100, existingShares: 1000, investorShares: 10, companyCash: 10000, buyerCash: 10000, sellerShares: 100 });
export function ownershipFrames(options = {}) {
  const input = { ...ownershipDefaults, ...options };
  for (const [key, value] of Object.entries(input)) {
    if (key !== 'mode' && (!Number.isFinite(value) || value < 0 || value > 1e12)) throw new RangeError(`잘못된 입력: ${key}`);
  }
  if (!['issuance', 'secondary'].includes(input.mode)) throw new RangeError('거래 종류 오류');
  if (input.investorShares + input.sellerShares > input.existingShares) throw new RangeError('전체 주식보다 보유 주식이 많습니다.');
  const { mode, quantity, price } = input;
  const amount = quantity * price;
  const recipient = mode === 'issuance' ? 'company' : 'seller';
  // 거래 전후 같은 단위. 큰 입력도 그림 조각은 약 200개 이내로 제한한다.
  const maximumShares = input.existingShares + (mode === 'issuance' ? quantity : 0);
  const shareTileUnit = Math.max(10, Math.ceil(maximumShares / 198));
  const tilesFor = (state) => {
    const tiles = [];
    for (const [kind, amount] of [
      ['observer', state.investorShares],
      ['existing', input.existingShares - state.investorShares],
      ['issued', state.totalShares - input.existingShares],
    ]) {
      const count = Math.ceil(amount / shareTileUnit);
      for (let index = 0; index < count; index += 1) {
        const shares = Math.min(shareTileUnit, amount - index * shareTileUnit);
        tiles.push({ kind, shares, fraction: shares / shareTileUnit });
      }
    }
    return tiles;
  };
  const initial = { companyCash: input.companyCash, buyerCash: input.buyerCash, sellerCash: 0, totalShares: input.existingShares, investorShares: input.investorShares, buyerShares: 0, sellerShares: input.sellerShares, otherShares: input.existingShares - input.investorShares - input.sellerShares };
  const decorate = (state, phase, status, message, cashFlow = null, shareFlow = null) => ({ ...state, shareTileUnit, shareTiles: tilesFor(state), phase, status, message, cashFlow, shareFlow, ownershipRatio: state.totalShares === 0 ? null : state.investorShares / state.totalShares, cashTotal: state.companyCash + state.buyerCash + state.sellerCash, issuedShares: state.totalShares - input.existingShares, companyCashChange: state.companyCash - input.companyCash, expectedCashRecipient: recipient, cashRecipient: cashFlow && cashFlow.amount > 0 ? recipient : 'none', companyCashDirection: state.companyCash > input.companyCash ? 'up' : 'same', ownershipPercent: state.totalShares === 0 ? null : state.investorShares / state.totalShares * 100 });
  const frames = [decorate(initial, 'initial', 'ready', '거래 전: 기존 관찰 주주의 주식과 회사 통장을 구분합니다.'), decorate(initial, 'order', 'ready', `구매자가 ${quantity}주에 ${amount}단위를 내는 조건입니다. 아직 잔액은 바뀌지 않았습니다.`)];
  let reason = '';
  if (amount > input.buyerCash) reason = '구매자의 현금이 부족하여 거래하지 않습니다.';
  if (mode === 'secondary' && quantity > input.sellerShares) reason = '판매자의 보유 주식보다 많이 팔 수 없습니다.';
  if (reason) frames.push(decorate(initial, 'settled', 'rejected', reason));
  else {
    const settled = { ...initial, buyerCash: initial.buyerCash - amount, buyerShares: quantity, companyCash: initial.companyCash + (mode === 'issuance' ? amount : 0), sellerCash: mode === 'secondary' ? amount : 0, sellerShares: initial.sellerShares - (mode === 'secondary' ? quantity : 0), totalShares: initial.totalShares + (mode === 'issuance' ? quantity : 0) };
    const lostShares = quantity > 0 && (mode === 'issuance' ? settled.totalShares === initial.totalShares : settled.sellerShares === initial.sellerShares);
    const lostPayment = quantity > 0 && price > 0 && (amount === 0 || settled.buyerCash === initial.buyerCash || (mode === 'issuance' ? settled.companyCash === initial.companyCash : settled.sellerCash === initial.sellerCash));
    if (lostShares || lostPayment) frames.push(decorate(initial, 'settled', 'rejected', '요청한 양수 변화를 현재 장부의 계산 정밀도로 표현할 수 없어 거래하지 않습니다.'));
    else frames.push(decorate(settled, 'settled', 'completed', quantity === 0 ? '거래 수량이 0주이므로 주식과 현금은 그대로입니다.' : price === 0 ? mode === 'issuance' ? '대금 0의 가상 신주 이전입니다. 전체 주식 수는 늘고 회사 현금은 그대로입니다.' : '기존 주식만 투자자 사이로 이전합니다. 대금은 0이며 회사 현금은 그대로입니다.' : mode === 'issuance' ? '신주와 회사 현금이 함께 늘었습니다. 지분 비율 하락만으로 가치 손실을 확정할 수 없습니다.' : '기존 주식과 매매대금이 투자자 사이를 이동했습니다. 회사로 들어온 돈은 0입니다.', { from: 'buyer', to: recipient, amount }, { from: recipient, to: 'buyer', amount: quantity }));
  }
  return { input, frames, summary: frames.at(-1) };
}

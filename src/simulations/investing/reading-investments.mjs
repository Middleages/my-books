// Original fictional dossiers. No real securities, account data, API requests or suitability scoring.
// Observation frames are a reading order, not a replay of trades or a prediction of future payments.
import { bondPrice } from './bonds.mjs';

function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
const copy = value => freeze(structuredClone(value));
const n = value => value.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
const won = value => `${n(value)}원`;
const pct = value => `${n(value * 100)}%`;
export const readingIds = freeze(['stock', 'bond', 'etf']);
export const readingCategories = freeze([
  { id: 'observed', label: '관측·기록', description: '가상 자료에 이미 기록된 값이나 계약 문구. 미래 지급 완료를 뜻하지 않습니다.' },
  { id: 'assumed', label: '계산 가정', description: '비교를 위해 정한 조건. 현실에서도 같은지 따로 확인합니다.' },
  { id: 'estimated', label: '추정·평가', description: '미래 예상이나 가정에 따른 현재 평가값. 실제 관측값·확정 지급과 구별합니다.' },
  { id: 'missing', label: '누락 정보', description: '현재 설명만으로 알 수 없어 추가 자료가 필요한 부분입니다.' },
]);
const sectionLabels = { rights: '권리', promise: '지급 약속·현금', underlying: '연결되는 자산', basis: '가격·수익 기준', cost: '비용', liquidity: '유동성', loss: '손실 조건', estimate: '추정', missing: '누락 정보' };
const sections = values => Object.entries(sectionLabels).map(([id, label]) => ({ id, label, text: values[id] }));
const claim = (id, category, text, reason, counterexample) => ({ id, category, text, reason, counterexample });
const source = (id, label, best, reason, limitation) => ({ id, label, best, reason, limitation });

function stockDossier() {
  const totalShares = 1000, heldShares = 10, initialPrice = 10000, endingPrice = 10800, dividendPerShare = 200;
  const initialValue = initialPrice * heldShares, endingValue = endingPrice * heldShares, cashReceived = dividendPerShare * heldShares;
  const metrics = { initialPrice, endingPrice, dividendPerShare, initialValue, endingValue, cashReceived, endingWealth: endingValue + cashReceived, priceReturn: (endingPrice - initialPrice) / initialPrice, totalReturn: (endingValue + cashReceived - initialValue) / initialValue, investorFees: 0, externalFlow: 0, reinvested: false };
  return {
    id: 'stock', name: '가람공구 보통주', shortName: '주식', currency: 'KRW', asOf: '2026-09-30', period: '2025-09-30 → 2026-09-30 · 1년',
    introduction: '가람공구는 공구를 만드는 가상 기업입니다. 이 설명서의 주식은 회사의 지분이며, 정해진 날짜에 원금과 이자를 갚는 채권은 아닙니다. 관찰자는 전체 1,000주 중 10주를 보유합니다.',
    headline: '“올해 주당 배당 200원을 받았으니 다음 해 예상 배당 300원도 받을 수 있을까요?”',
    predictionQuestion: '다음 해 예상 배당 300원은 지급이 확정됐을까요?',
    predictionReason: '지난 배당의 지급 기록과 다음 해 예상은 다릅니다. 다음 배당은 기업의 상황과 실제 결정·권리 조건을 확인해야 합니다.',
    structure: { kind: 'stock', company: '가람공구', investor: '주주 · 회사 지분 직접 보유', totalShares, heldShares, ownership: heldShares / totalShares, cellShares: 10, cells: Array.from({ length: totalShares / 10 }, (_, index) => ({ index, shares: 10, held: index < heldShares / 10 })), caption: '공장 모양은 기업, 100칸은 전체 1,000주입니다. 한 칸은 10주이며 테두리가 진한 한 칸이 관찰자의 1% 지분입니다. 공장 설비 한 조각을 직접 떼어 소유한다는 뜻은 아닙니다.' },
    metrics,
    metricRows: [
      { label: '기초 주식 평가액', value: won(initialValue) }, { label: '기말 주식 평가액 + 받은 현금', value: `${won(endingValue)} + ${won(cashReceived)} = ${won(metrics.endingWealth)}` },
      { label: '1년 가격 수익률 / 총수익률', value: `${pct(metrics.priceReturn)} / ${pct(metrics.totalReturn)}` },
    ],
    sections: sections({
      rights: '회사 지분을 직접 보유합니다. 실제 의결권·배당 관련 권리는 주식 종류와 정관·결정 문서를 확인해야 하며, 이 사례가 한국의 모든 주식 권리를 재현하지는 않습니다.',
      promise: '기간 중 주당 200원을 실제 받은 것으로 적힌 가상 기록입니다. 다음 해 배당 300원은 추정일 뿐이며 주식에는 이 채권 사례와 같은 만기 원금 상환 약속이 없습니다.',
      underlying: '기업의 사업·이익·현금·부채와 연결됩니다. 별도 펀드에 담긴 자산을 보유하는 구조가 아닙니다.',
      basis: `1주 가격 ${won(initialPrice)} → ${won(endingPrice)}. 보유 10주·배당 현금 별도 보유·외부 입출금 0으로 계산한 1년 총수익률은 ${pct(metrics.totalReturn)}입니다. 기말 평가액은 매도대금 입금이 아닙니다.`,
      cost: '위 계산은 매매비용·세금 0이라는 교육용 가정입니다. 실제 수수료표는 빠져 있으므로 실제 투자자의 비용 후 수익률로 바꿔 부르지 않습니다.',
      liquidity: '팔려면 거래 상대와 가격별 주문 수량이 필요합니다. 마지막 가격 10,800원은 내 10주가 그 가격에 즉시 모두 팔린다는 약속이 아닙니다.',
      loss: '기업 실적 악화·기대 변화로 가격이 하락하거나 배당이 줄 수 있습니다. 기업이 실패하면 주식 가치 전부를 잃을 수도 있으며, 원하는 때 팔지 못할 위험도 남습니다.',
      estimate: '다음 해 주당 배당 300원은 자체 가상 작성자의 예상입니다. 현금 전망과 지급 결정의 근거가 없어 확정액으로 쓸 수 없습니다.',
      missing: '최근 현금흐름·부채와 배당 결정의 근거, 실제 매매비용, 매도 시점 호가·잔량이 제시되지 않았습니다.',
    }),
    claims: [
      claim('stock-record', 'observed', '가상 기록에는 1주 가격 10,000원 → 10,800원과 기간 중 지급된 주당 배당 200원이 적혀 있습니다.', '이미 지난 구간의 가격·지급 기록입니다. 이 기록에서 계산하는 총수익에는 배당 현금을 한 번만 더합니다.', '배당이 지급됐다는 과거 기록이 있어도 다음 해 배당이 같거나 늘어난다는 결론은 나오지 않습니다.'),
      claim('stock-assumption', 'assumed', '수익 비교에서는 같은 10주를 보유하고, 재투자·추가 입출금·비용·세금은 0으로 놓습니다.', '자료가 보장한 거래 조건이 아니라 계산 범위를 맞추기 위해 정한 단순화입니다.', '실제로 매매수수료를 냈다면 위 10%를 그대로 실제 비용 후 수익률이라고 할 수 없습니다.'),
      claim('stock-estimate', 'estimated', '다음 해에는 주당 배당이 300원이 될 것으로 예상합니다.', '아직 지급되거나 확정된 배당이 아닌 미래 예상입니다. 과거 200원 지급과 증거의 성격이 다릅니다.', '이익이 늘어도 현금이 부족하거나 다른 용도로 자금을 쓰면 배당이 예상보다 작거나 없을 수 있습니다.'),
      claim('stock-missing', 'missing', '실제 수수료율과 매도 시점 호가 잔량, 예상 배당의 산출 근거는 설명에 없습니다.', '주어진 숫자만으로 채울 수 없는 빈칸입니다. 없다는 이유로 수수료나 위험이 0이라고 놓지 않습니다.', '최근 거래가격이 있어도 내가 팔 수 있는 수량·가격이나 수수료까지 알 수 있는 것은 아닙니다.'),
    ],
    sourceQuestion: '배당을 낼 현금 여력을 확인하려면 먼저 어떤 자료 묶음을 읽을까요?',
    sources: [
      source('stock-financials', '최근 재무제표·현금흐름표·부채 관련 주석', true, '영업으로 생긴 현금, 현금 잔액, 갚아야 할 돈을 함께 확인할 수 있는 출발점입니다. 공시의 보고 기간과 연결·별도 기준도 맞춥니다.', '과거 재무제표만으로 미래 배당이 확정되지는 않습니다. 실제 배당 결정 문서와 이후 변화도 확인해야 합니다.'),
      source('stock-quotes', '거래소의 과거 주가·거래량 자료', false, '가격과 거래량의 기록을 확인하는 데 맞는 자료지만 기업 통장에 현금이 얼마나 남는지 직접 설명하지 못합니다.', '주가가 올랐어도 외상 매출이 늘어 현금이 부족할 수 있습니다. 가격 상승으로 배당 여력을 대신 판단할 수 없습니다.'),
      source('stock-forecast', '다음 해 예상 배당을 적은 홍보 요약', false, '어떤 예상을 제시했는지는 알 수 있지만 계산 근거와 원문이 없으면 지급 가능성을 검토하기 부족합니다.', '예상 숫자가 크거나 전문적으로 보이는 문장이어도 지급 결정·계약·현금 확보의 증거가 아닙니다.'),
    ],
    counterexample: '주가가 오르고 회계상 이익이 늘어도 외상 매출이 많아 현금은 부족할 수 있습니다. 과거 총수익 10%와 다음 배당의 실현 가능성은 서로 다른 질문입니다.',
  };
}

function bondDossier() {
  const face = 1000000, coupon = 50000, requiredYield = .06;
  const schedule = [1, 2, 3].map((year, index) => ({ year, date: `${2026 + year}-09-30`, coupon, principal: index === 2 ? face : 0, total: coupon + (index === 2 ? face : 0) }));
  const estimatedPrice = bondPrice({ face, annualCoupon: coupon, years: 3, requiredYield });
  const metrics = { issuePrice: face, couponRate: coupon / face, promisedTotal: schedule.reduce((sum, row) => sum + row.total, 0), estimatedPrice, requiredYield, cashReceived: null, totalReturn: null, investorFees: 0 };
  return {
    id: 'bond', name: '다온설비 3년 고정금리채권', shortName: '일반 채권', currency: 'KRW', asOf: '2026-09-30', period: '2026-09-30 발행 → 2029-09-30 만기 · 3년',
    introduction: '다온설비는 생산 설비 자금을 빌리는 가상 기업입니다. 관찰자는 기업 지분 대신 원금과 이자를 받을 계약상 권리를 보유합니다. 이 사례는 중도상환권·전환권이 없는 단순 고정금리채권입니다.',
    headline: '“매년 50,000원, 3년 뒤 원금 1,000,000원을 약속했으니 실제 수익도 확정됐을까요?”',
    predictionQuestion: '지급 시간표만 있으면 만기까지 실제 수익이 확정될까요?',
    predictionReason: '시간표는 계약상 약속입니다. 발행자가 지급하지 못하거나 실제 매수가격·비용이 달라지면 실제 수익도 달라집니다.',
    structure: { kind: 'bond', company: '다온설비 · 발행자', investor: '채권자 · 원리금 청구권', face, schedule, caption: '날짜별 점은 지급 예정일입니다. 원형 표시는 이자, 사각 표시는 만기 원금입니다. 모양의 크기는 금액 비례가 아니며 금액은 라벨로 읽습니다. 점선은 미래의 약속이고 지금 받은 현금이 아닙니다.' },
    metrics,
    metricRows: [
      { label: '액면 / 연 쿠폰금리', value: `${won(face)} / ${pct(metrics.couponRate)}` },
      { label: '3년 약속 현금 합계 / 실제 수익률', value: `${won(metrics.promisedTotal)} / 아직 알 수 없음` },
      { label: '요구수익률 6% 가정의 평가값', value: won(estimatedPrice) },
    ],
    sections: sections({
      rights: '발행자에게 정해진 원리금 지급을 청구하는 채권자의 권리입니다. 주식 지분과 달리 이 설명서에는 회사 의결권을 둔다고 쓰지 않았습니다.',
      promise: '2027·2028·2029년 9월 30일에 각각 이자 50,000원, 마지막 날 원금 1,000,000원을 지급하기로 약속합니다. 2026-09-30 시점에는 미래 지급 완료를 관측하지 않았습니다.',
      underlying: '펀드 안의 자산 묶음이 아니라 발행자에게 빌려준 돈과 지급 능력에 연결됩니다. 특정 설비를 직접 소유하는 지분은 아닙니다.',
      basis: `액면 ${won(face)}·발행가격 ${won(face)}·연 쿠폰금리 ${pct(metrics.couponRate)}입니다. 요구수익률 ${pct(requiredYield)}와 정상 지급을 가정해 할인한 평가값 ${won(estimatedPrice)}는 실제 체결가나 미래 매도가격이 아닙니다.`,
      cost: '평가식은 거래비용·세금·경과이자 0입니다. 지급일 사이 거래, 실제 수수료와 세금은 계산하지 않았으며 현실 비용 후 수익률을 제시하지 않습니다.',
      liquidity: '만기 전에 팔려면 거래 상대가 필요합니다. 금리가 바뀌거나 매수자가 적으면 원하는 가격에 바로 팔기 어렵습니다.',
      loss: '발행자의 지급 실패로 원금·이자를 덜 받을 수 있습니다. 중도 매각 가격 하락, 거래 어려움, 고정 지급액의 구매력 하락도 구별해야 합니다.',
      estimate: '요구수익률 6%는 계산을 위해 둔 조건입니다. 이 조건에서 나온 현재가치가 시장의 정답 가격이나 지급 보증액은 아닙니다.',
      missing: '발행자의 최근 재무상태, 담보·보증·변제 순위의 상세 조항, 실제 호가·거래비용과 미래 지급 결과는 제시하지 않았습니다.',
    }),
    claims: [
      claim('bond-record', 'observed', '가상 발행 조건에 연 이자 50,000원과 2029-09-30 원금 1,000,000원의 지급 약속이 기록돼 있습니다.', '지금 읽는 계약 문구가 있다는 사실을 분류합니다. 미래 지급이 완료됐다는 관측으로 분류한 것이 아닙니다.', '약정서가 있어도 발행자가 지급 불능이면 약속과 실제 수령액이 달라질 수 있습니다.'),
      claim('bond-assumption', 'assumed', '평가 계산은 정상 지급·요구수익률 6%·비용과 세금 0·중도상환권 없음으로 단순화합니다.', '미래 가격을 알아낸 것이 아니라 계산 조건을 정했습니다. 요구수익률은 쿠폰금리 5%와 다른 값입니다.', '지급 실패나 중도상환권이 있는 상품을 같은 현금 시간표로 계산하면 중요한 조건을 놓칠 수 있습니다.'),
      claim('bond-estimate', 'estimated', `정상 지급과 요구수익률 6%를 가정한 현재 평가값은 약 ${won(estimatedPrice)}입니다.`, '미래 약속을 할인해서 얻은 조건부 추정값입니다. 실제 거래가 관측됐다는 뜻이 아닙니다.', '동일한 쿠폰이어도 요구수익률이나 신용 조건이 달라지면 평가값은 달라집니다.'),
      claim('bond-missing', 'missing', '실제 미래 수령액·매도 호가와 발행자의 지급 능력을 검토할 최신 자료는 없습니다.', '약정 이자율만으로 채울 수 없는 정보입니다. 실제 보유기간 수익률도 아직 확정할 수 없습니다.', '만기까지 보유한다고 해도 지급 실패가 있으면 액면 전액을 돌려받지 못할 수 있습니다.'),
    ],
    sourceQuestion: '이 채권의 정확한 지급일과 지급 조건을 확인하려면 무엇을 먼저 읽을까요?',
    sources: [
      source('bond-terms', '해당 발행 회차의 증권신고서·발행 조건 원문', true, '같은 발행자의 채권도 회차별 날짜·이자·상환 조항이 다를 수 있습니다. 대상 회차와 정정 여부를 맞춘 원문이 직접 근거입니다.', '원문은 무엇을 약속했는지 알려 줍니다. 발행자의 지급 능력이나 실제 지급 완료까지 보증하지는 않습니다.'),
      source('bond-financials', '발행자의 최근 재무제표', false, '발행자의 현금과 부채를 살피는 데 필요하지만 이 특정 채권의 모든 지급일·계약 조항을 대신하는 자료는 아닙니다.', '같은 기업이 만기·쿠폰이 다른 채권을 여러 번 발행할 수 있으므로 기업 이름만 맞추면 부족합니다.'),
      source('bond-price', '채권 시장가격·수익률 화면', false, '거래가격과 수익률 기준을 확인하는 데 쓰지만 해당 회차의 상세 지급 조건은 원문을 확인해야 합니다.', '시장가격이 액면과 같아도 이자 지급 빈도나 중도상환 조항이 다른 채권일 수 있습니다.'),
    ],
    counterexample: '쿠폰 5%라는 약속을 읽었다고 실제 연 수익률 5%가 보장되지는 않습니다. 액면과 다른 매수가격, 비용, 지급 실패, 중도 매각은 각각 결과를 바꿉니다.',
  };
}

function etfDossier() {
  const issuedUnits = 1000, heldUnits = 10, netAssets = 10500000, beginningNav = 10000, nav = netAssets / issuedUnits, marketPrice = 10710;
  const heldNavValue = nav * heldUnits;
  const holdings = [{ asset: '가람공구', code: 'A', weight: .6 }, { asset: '누리소재', code: 'B', weight: .4 }].map(row => ({ ...row, exposure: heldNavValue * row.weight }));
  const metrics = { netAssets, beginningNav, nav, marketPrice, premium: (marketPrice - nav) / nav, heldNavValue, heldMarketValue: marketPrice * heldUnits, totalReturn: (nav - beginningNav) / beginningNav, operatingFeeRate: .002, operatingFeesAlreadyIncluded: true, feeDeductedAgain: 0, investorFees: null, cashReceived: 0 };
  return {
    id: 'etf', name: '온길 두기업 ETF', shortName: '일반 ETF', currency: 'KRW', asOf: '2026-09-30', period: '2025-09-30 → 2026-09-30 · 1년',
    introduction: '온길 두기업 ETF는 가상 두 회사의 주식을 실제로 담는 단순 펀드입니다. 관찰자는 ETF 10좌를 직접 보유하고, 펀드가 보유한 기업 주식의 변화에 간접적으로 영향을 받습니다. 두 기업만 담으므로 넓은 분산을 뜻하지 않습니다.',
    headline: '“지난 1년 NAV 수익률이 5%이고 운용비용은 연 0.2%라면, 다음 해 수익도 5%일까요?”',
    predictionQuestion: '과거 NAV 수익률 5%는 다음 1년의 지급 약속일까요?',
    predictionReason: '과거 수익률은 일정한 기준의 기록입니다. ETF 안쪽 자산 가격은 하락할 수 있고 이후 같은 성과를 약속하지 않습니다.',
    structure: { kind: 'etf', fund: '온길 두기업 ETF', investor: '투자자 · ETF 지분 직접 보유', issuedUnits, heldUnits, fundFraction: heldUnits / issuedUnits, holdingsAsOf: '2026-09-30', holdings, caption: '바깥 테두리는 펀드, 안쪽 띠는 같은 기준일의 보유 평가금액 비중입니다. A 60%·B 40%의 너비만 비례합니다. 투자자는 펀드 10좌를 직접 보유하며 기업 주식이 각각 계좌에 들어오는 것은 아닙니다.' },
    metrics,
    metricRows: [
      { label: '동일 시점 좌당 NAV / 시장가격', value: `${won(nav)} / ${won(marketPrice)}` },
      { label: 'NAV를 분모로 한 괴리율', value: pct(metrics.premium) },
      { label: '1년 NAV 기준 성과 · 운용비용 반영 후', value: pct(metrics.totalReturn) },
    ],
    sections: sections({
      rights: '펀드의 지분 10좌를 직접 보유합니다. 안쪽 기업의 직접 주주와 같은 방식으로 권리를 행사한다고 놓지 않으며 법적 형태·권리 규칙은 상품 문서에서 확인합니다.',
      promise: '정해진 만기 원금이나 다음 해 수익을 약속하지 않습니다. 이 가상 관찰 기간의 분배금은 0이며 실제 상품의 향후 분배 정책을 대신하지 않습니다.',
      underlying: '2026-09-30 평가금액 기준 가람공구 60%·누리소재 40%입니다. 현물 주식만 보유하고 레버리지·인버스·파생상품·별도 부채는 없는 가상 조건입니다.',
      basis: `같은 시점 좌당 NAV ${won(nav)}·시장가격 ${won(marketPrice)}, 괴리율 ${pct(metrics.premium)}입니다. 별도로 1년 NAV ${won(beginningNav)} → ${won(nav)}와 분배금 0을 사용한 성과는 ${pct(metrics.totalReturn)}입니다. 시장 매매 수익률과 같다고 놓지 않습니다.`,
      cost: '설명서의 연 운용비용률 0.2%는 NAV 경로에 이미 반영됐다고 명시했습니다. 위 5%에서 같은 0.2%를 다시 빼지 않습니다. 투자자 매매수수료·호가 차이·세금은 별도이며 실제 금액은 빠져 있습니다.',
      liquidity: '거래소에서 매도하려면 시장가격과 호가 잔량을 확인합니다. 좌당 NAV가 곧 내가 언제든 현금으로 환매받는 금액이라는 뜻은 아닙니다.',
      loss: '두 기업의 가격 하락·공통 산업 위험·집중 위험이 남습니다. 시장가격과 NAV의 차이, 거래 어려움도 손익에 영향을 줄 수 있습니다.',
      estimate: '다음 1년에도 5%를 얻는다는 문장은 과거 결과를 바탕으로 한 예상일 뿐입니다. 미래 손실 가능성을 지우지 않습니다.',
      missing: '비교하려는 다른 ETF의 같은 기준일 보유 목록과 비중, 최신 호가·개인 매매비용은 없습니다. 이 자료만으로 중복·즉시 매도대금·개인 비용 후 수익을 확정할 수 없습니다.',
    }),
    claims: [
      claim('etf-record', 'observed', '가상 보유 목록은 2026-09-30 기준 가람공구 60%·누리소재 40%이고, 같은 날 좌당 NAV는 10,500원입니다.', '기준일을 가진 보유 내역과 평가 기록입니다. 미래에도 같은 구성일 것이라고 확대하지 않습니다.', '한 달 뒤에는 가격 변화나 펀드 매매 때문에 같은 두 기업의 비중도 달라질 수 있습니다.'),
      claim('etf-assumption', 'assumed', '1년 성과는 분배금 0, 원화 NAV 기준이며 운용비용을 이미 반영한 경로로 비교합니다.', '비교에 사용하는 기준을 정한 것입니다. 투자자의 실제 매수가격과 거래비용까지 반영했다는 뜻은 아닙니다.', 'NAV가 5% 올라도 시장가격의 괴리나 개인 수수료 때문에 투자자의 수익률은 다를 수 있습니다.'),
      claim('etf-estimate', 'estimated', '과거 NAV 수익률이 5%였으니 다음 1년에도 5%를 얻을 것으로 예상합니다.', '아직 관측하지 않은 기간의 예상입니다. 과거 성과는 다음 수익의 지급 계약이 아닙니다.', '두 기초기업이 함께 하락하면 일반 ETF도 손실을 볼 수 있습니다. 보유 기간이 길다는 말만으로 손실을 없애지 못합니다.'),
      claim('etf-missing', 'missing', '다른 ETF와 비교할 동일 기준일 보유 목록, 최신 호가, 개인 매매수수료는 주어지지 않았습니다.', '다른 상품과 겹치는 노출이나 실제 매매 결과를 정하기에 자료가 부족합니다.', '이름이 다른 ETF라도 같은 기업을 많이 담을 수 있으므로 이름 두 개가 독립된 위험 두 개라는 뜻은 아닙니다.'),
    ],
    sourceQuestion: '다른 ETF와 같은 기업을 얼마나 겹쳐 담는지 확인하려면 어떤 자료가 먼저 필요할까요?',
    sources: [
      source('etf-holdings', '각 운용사의 같은 기준일 보유 목록·비중', true, '같은 자산을 같은 기준일·평가 기준으로 맞춰야 중복을 계산할 수 있습니다. 각 ETF에 투자한 내 비중도 함께 필요합니다.', '보유 중복이 없어도 산업·국가·금리처럼 함께 움직이는 위험은 남습니다. 이 목록만으로 미래 분산 효과를 확정하지 않습니다.'),
      source('etf-fees', '각 ETF의 비용표', false, '내부 운용비용과 별도 매매비용의 구분에는 필요하지만 어느 기업을 얼마나 담는지는 비용률만으로 알 수 없습니다.', '운용비용이 같은 두 ETF가 완전히 다른 자산을 담을 수도, 같은 기업에 집중할 수도 있습니다.'),
      source('etf-performance', '지난 1년 수익률 비교 그래프', false, '기간·통화·분배금·비용 기준을 맞춰 과거 경로를 비교하는 데 쓰지만 현재 보유의 상세 구성을 대신하지 못합니다.', '과거 수익률이 비슷해도 보유 자산이 다를 수 있고, 반대로 보유가 겹쳐도 시작 시점이나 비용 때문에 성과가 다를 수 있습니다.'),
    ],
    counterexample: 'ETF 이름이 두 개여도 안쪽 기업이 겹칠 수 있습니다. 또한 NAV 성과가 운용비용을 이미 반영했다면 같은 비용을 다시 빼는 것이 더 보수적인 계산이 아니라 중복 차감입니다.',
  };
}

const dossiers = freeze({ stock: stockDossier(), bond: bondDossier(), etf: etfDossier() });
function validated(id) {
  if (!readingIds.includes(id)) throw new RangeError('Unknown reading dossier.');
  return dossiers[id];
}
export function readingDossier(id = 'stock') { return copy(validated(id)); }

export function readingFrames(id = 'stock') {
  const dossier = readingDossier(id);
  const stages = [
    ['structure', '권리와 대상', '모양과 경계를 따라 내가 직접 보유한 권리와 그 뒤의 대상을 구분합니다.'],
    ['basis', '금액과 기준', '통화·기간·분모와 비용 반영 여부를 먼저 맞춥니다. 약속과 평가액을 받은 현금으로 더하지 않습니다.'],
    ['claims', '문장의 성격', '관측·기록, 계산 가정, 추정·평가, 누락 정보를 나눕니다. 아래 네 문장을 직접 분류해 보세요.'],
    ['source', '추가 확인 자료', dossier.predictionReason],
  ];
  const frames = stages.map(([focus, label, message], index) => ({ index, focus, label, message, structure: dossier.structure, metrics: dossier.metrics }));
  return copy({ dossier, frames, summary: frames[frames.length - 1], predictionOutcome: 'not-guaranteed' });
}

export function classifyReadingPrediction(id, prediction) {
  validated(id);
  if (!['', 'guaranteed', 'not-guaranteed'].includes(prediction)) throw new RangeError('Unknown reading prediction.');
  return prediction === '' ? null : prediction === 'not-guaranteed';
}

export function assessReading(id, answers = {}, sourceAnswer = '') {
  const dossier = validated(id);
  if (answers === null || typeof answers !== 'object' || Array.isArray(answers) || Object.getPrototypeOf(answers) !== Object.prototype) throw new TypeError('Classification answers must be a plain object.');
  for (const [key, answer] of Object.entries(answers)) {
    if (!dossier.claims.some(row => row.id === key) || !readingCategories.some(row => row.id === answer)) throw new RangeError('Unknown claim or category.');
  }
  const selectedSource = dossier.sources.find(row => row.id === sourceAnswer);
  if (sourceAnswer !== '' && !selectedSource) throw new RangeError('Unknown source option.');
  const feedback = dossier.claims.map(row => ({ id: row.id, category: row.category, selected: answers[row.id] ?? '', correct: answers[row.id] === undefined ? null : answers[row.id] === row.category, reason: row.reason, counterexample: row.counterexample }));
  return copy({ feedback, source: { selected: sourceAnswer, correct: selectedSource ? selectedSource.best : null, reason: selectedSource?.reason ?? '질문에 가장 직접 답하는 첫 자료를 골라 보세요.', limitation: selectedSource?.limitation ?? '하나의 자료가 모든 판단을 끝내 주지는 않습니다.' }, counterexample: dossier.counterexample });
}

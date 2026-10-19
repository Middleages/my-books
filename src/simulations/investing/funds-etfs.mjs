// Fictional, unleveraged physical holdings; same currency and valuation time.
// NAV inputs already include booked operating expenses. No second expense deduction.
const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
const fmt = value => value.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
const direction = value => value > 0 ? 'up' : value < 0 ? 'down' : 'same';
function finite(value, name, min, max) {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`${name} must be finite and between ${min} and ${max}.`);
}
export const fundsDefaults = freeze({ xWeight: 0.5, sameHoldings: false });
export const navDefaults = freeze({ initialAssets: 10000, liabilities: 0, issuedUnits: 100, heldUnits: 10, underlyingReturn: 0.1, marketPrice: 112 });
const ASSETS = ['A', 'B', 'C'];
const X = [0.6, 0.4, 0];
const Y = [0.4, 0, 0.6];
const segments = values => values.map((fraction, index) => ({ asset: ASSETS[index], fraction }));

export function classifyFundsPrediction(actual, prediction) {
  if (!['up', 'same', 'down', 'undefined'].includes(actual)) throw new RangeError('Unknown outcome.');
  if (prediction === '') return null;
  if (!['up', 'same', 'down', 'undefined'].includes(prediction)) throw new RangeError('Unknown prediction.');
  return actual === prediction;
}

export function exposureFrames(options = {}) {
  const input = { ...fundsDefaults, ...options };
  finite(input.xWeight, 'xWeight', 0, 1);
  if (typeof input.sameHoldings !== 'boolean') throw new TypeError('sameHoldings must be boolean.');
  const yWeight = 1 - input.xWeight;
  const yHoldings = input.sameHoldings ? X : Y;
  const xContribution = X.map(value => value * input.xWeight);
  const yContribution = yHoldings.map(value => value * yWeight);
  const exposure = xContribution.map((value, index) => value + yContribution[index]);
  const predictionOutcome = direction(exposure[0] - 0.5);
  const labels = ['겉의 상품 비중', 'X 안의 자산을 펼치기', 'Y 안의 자산도 펼치기', '같은 자산끼리 합치기'];
  const values = [ASSETS.map(() => 0), xContribution, exposure, exposure];
  const messages = [
    `X ${fmt(input.xWeight * 100)}%와 Y ${fmt(yWeight * 100)}%를 보유합니다. 아직 안쪽 자산을 합치지 않았습니다.`,
    `X 비중에 내부 비중을 곱합니다. 전체 중 A ${fmt(xContribution[0] * 100)}%, B ${fmt(xContribution[1] * 100)}%가 X에서 나옵니다.`,
    `Y 몫을 한 번만 더하면 전체 기초자산 노출이 100%가 됩니다. 두 상품에 든 같은 A를 따로 다른 자산으로 세지 않습니다.`,
    `실질 노출은 A ${fmt(exposure[0] * 100)}%, B ${fmt(exposure[1] * 100)}%, C ${fmt(exposure[2] * 100)}%입니다. 상품 수보다 안쪽 구성과 함께 움직이는 위험을 확인합니다.`,
  ];
  const frames = values.map((row, index) => ({
    index, label: labels[index], message: messages[index], predictionOutcome,
    exposures: segments([...row]), accountedWeight: index === 0 ? 0 : index === 1 ? input.xWeight : input.xWeight + yWeight,
    unexaminedWeight: index === 0 ? 1 : index === 1 ? yWeight : 0,
    xVisible: index >= 1, yVisible: index >= 2, grouped: index === 3,
  }));
  const funds = [
    { id: 'X', weight: input.xWeight, holdings: segments([...X]), contributions: segments(xContribution) },
    { id: 'Y', weight: yWeight, holdings: segments([...yHoldings]), contributions: segments(yContribution) },
  ];
  const overlapAssets = ASSETS.filter((_, index) => input.xWeight > 0 && yWeight > 0 && X[index] > 0 && yHoldings[index] > 0);
  return freeze({ input, yWeight, funds, frames, summary: frames.at(-1), exposure: segments(exposure), totalWeight: input.xWeight + yWeight, overlapAssets, predictionOutcome });
}

export function navSnapshot({ assets, liabilities = 0, issuedUnits, heldUnits = 0, marketPrice = null }) {
  finite(assets, 'assets', 0, 1e9);
  finite(liabilities, 'liabilities', 0, assets);
  finite(issuedUnits, 'issuedUnits', 0, 1e7);
  finite(heldUnits, 'heldUnits', 0, issuedUnits);
  if (marketPrice !== null) finite(marketPrice, 'marketPrice', 0, 1e9);
  const netAssets = assets - liabilities;
  const nav = issuedUnits === 0 ? null : netAssets / issuedUnits;
  const premium = marketPrice === null || nav === null || nav === 0 ? null : (marketPrice - nav) / nav;
  const heldNavValue = nav === null ? null : nav * heldUnits;
  const heldMarketValue = marketPrice === null ? null : marketPrice * heldUnits;
  if ([nav, premium, heldNavValue, heldMarketValue].some(value => value !== null && !Number.isFinite(value))) throw new RangeError('NAV or valuation cannot be represented as a finite number.');
  return freeze({ assets, liabilities, netAssets, issuedUnits, heldUnits, nav, marketPrice, premium,
    heldNavValue, heldMarketValue,
    predictionOutcome: premium === null ? 'undefined' : direction(premium),
  });
}

export function navFrames(options = {}) {
  const input = { ...navDefaults, ...options };
  finite(input.underlyingReturn, 'underlyingReturn', -1, 1);
  finite(input.initialAssets, 'initialAssets', 0, 1e8);
  finite(input.liabilities, 'liabilities', 0, input.initialAssets);
  finite(input.marketPrice, 'marketPrice', 0, 1e9);
  // Add the modeled change to the starting amount to avoid cancellation in 1 + (-0.9).
  const endingAssets = input.initialAssets + input.initialAssets * input.underlyingReturn;
  if (endingAssets < input.liabilities) throw new RangeError('This unleveraged model does not represent negative net assets.');
  const snapshot = (assets, marketPrice = null) => navSnapshot({ assets, liabilities: input.liabilities, issuedUnits: input.issuedUnits, heldUnits: input.heldUnits, marketPrice });
  const initial = snapshot(input.initialAssets);
  const changed = snapshot(endingAssets);
  const quoted = snapshot(endingAssets, input.marketPrice);
  const predictionOutcome = quoted.predictionOutcome;
  const labels = ['처음의 순자산과 좌수', '기초자산 가치 변화', '같은 시점의 시장가격 비교'];
  const navText = quoted.nav === null ? '발행 좌수가 0이라 좌당 NAV를 정의할 수 없습니다.' : `좌당 NAV는 ${fmt(quoted.nav)}단위입니다.`;
  const premiumText = quoted.premium === null ? 'NAV가 없거나 0이어서 괴리율도 정의할 수 없습니다.' : `시장가격 ${fmt(input.marketPrice)}단위의 괴리율은 ${fmt(quoted.premium * 100)}%입니다. 분모는 좌당 NAV입니다.`;
  const messages = [
    initial.nav === null ? '발행 좌수 0은 나눗셈의 경계 확인용입니다. 실제 거래 가능한 ETF를 뜻하지 않습니다.' : `순자산 ${fmt(initial.netAssets)}단위를 발행 ${fmt(input.issuedUnits)}좌로 나누면 좌당 NAV ${fmt(initial.nav)}단위입니다.`,
    `기초자산 가치가 ${fmt(input.underlyingReturn * 100)}% 변해도 매매·분배·추가 설정이 없으므로 보유 ${fmt(input.heldUnits)}좌와 발행 ${fmt(input.issuedUnits)}좌는 그대로입니다. ${navText}`,
    `${navText} ${premiumText} 시장가격 비교는 매수·매도나 현금 입금이 아닙니다.`,
  ];
  const priceScale = Math.max(220, initial.nav ?? 0, quoted.nav ?? 0, input.marketPrice);
  const assetScale = Math.max(20000, initial.assets, quoted.assets);
  const frames = [initial, changed, quoted].map((row, index) => ({ ...row, index, label: labels[index], message: messages[index], predictionOutcome,
    navFraction: row.nav === null ? null : row.nav / priceScale,
    marketFraction: row.marketPrice === null ? null : row.marketPrice / priceScale,
    netAssetFraction: row.netAssets / assetScale,
  }));
  return freeze({ input, frames, summary: frames.at(-1), initial: frames[0], predictionOutcome, priceScale, assetScale });
}

export function trackingMetrics(benchmarkReturns, fundReturns) {
  if (!Array.isArray(benchmarkReturns) || !Array.isArray(fundReturns) || benchmarkReturns.length === 0 || benchmarkReturns.length !== fundReturns.length || benchmarkReturns.length > 1200) throw new RangeError('Equal nonempty return arrays are required (up to 1200 periods).');
  benchmarkReturns.forEach(value => finite(value, 'benchmark return', -1, 1));
  fundReturns.forEach(value => finite(value, 'fund return', -1, 1));
  const differences = fundReturns.map((value, index) => value - benchmarkReturns[index]);
  const meanDifference = differences.reduce((sum, value) => sum + value, 0) / differences.length;
  // Population SD of this complete four-observation teaching set; no annualisation.
  const trackingError = Math.sqrt(differences.reduce((sum, value) => sum + (value - meanDifference) ** 2, 0) / differences.length);
  const cumulative = values => values.reduce((value, current) => {
    const next = value * (1 + current);
    if (!Number.isFinite(next)) throw new RangeError('Compounded return exceeds the finite numeric range.');
    return next;
  }, 1) - 1;
  const benchmarkReturn = cumulative(benchmarkReturns), fundReturn = cumulative(fundReturns);
  return freeze({ differences, meanDifference, trackingError, benchmarkReturn, fundReturn, trackingDifference: fundReturn - benchmarkReturn, periods: differences.length });
}

export function trackingComparison() {
  const benchmarkReturns = [0.01, 0.01, 0.01, 0.01];
  const samples = [
    { id: 'steady', label: '가상 경로 가', returns: [0.008, 0.008, 0.008, 0.008], symbol: '●' },
    { id: 'varying', label: '가상 경로 나', returns: [0.004, 0.012, 0.004, 0.012], symbol: '◆' },
  ].map(sample => ({ ...sample, ...trackingMetrics(benchmarkReturns, sample.returns) }));
  const chart = { minimum: -0.008, maximum: 0.004, width: 320, height: 180, left: 40, top: 15, plotWidth: 260, plotHeight: 140 };
  const y = difference => chart.top + (chart.maximum - difference) / (chart.maximum - chart.minimum) * chart.plotHeight;
  const ticks = [-0.008, -0.004, 0, 0.004].map(value => ({ value, y: y(value), fraction: y(value) / chart.height }));
  const series = samples.map(sample => ({ ...sample, points: sample.differences.map((value, index) => ({ month: index + 1, value, x: chart.left + index * chart.plotWidth / 3, y: y(value) })) }));
  const rows = benchmarkReturns.map((value, index) => ({ month: index + 1, benchmarkReturn: value, steadyReturn: samples[0].returns[index], varyingReturn: samples[1].returns[index], steadyDifference: samples[0].differences[index], varyingDifference: samples[1].differences[index] }));
  return freeze({ chart, ticks, series, rows });
}

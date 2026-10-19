// A fictional annual-pay, fixed-coupon bond. All amounts use the same fictional currency unit.
// No accrued interest, call option, taxes, transaction costs, reinvestment or default probabilities.
export const bondDefaults = Object.freeze({
  face: 1000, annualCoupon: 50, years: 3, requiredYield: 0.05,
  scenario: 'normal', failureYear: 2, recoveryRate: 0.4,
});

function normalize(options) {
  const input = { ...bondDefaults, ...options };
  if (options.failureYear === undefined) input.failureYear = Math.min(bondDefaults.failureYear, input.years);
  for (const [key, maximum] of [['face', 1000000], ['annualCoupon', 100000], ['requiredYield', 0.2], ['recoveryRate', 1]]) {
    if (!Number.isFinite(input[key]) || input[key] < 0 || input[key] > maximum) {
      throw new RangeError(`${key} must be finite and between 0 and ${maximum}.`);
    }
  }
  if (!Number.isInteger(input.years) || input.years < 1 || input.years > 10) throw new RangeError('years must be an integer from 1 to 10.');
  if (!Number.isInteger(input.failureYear) || input.failureYear < 1 || input.failureYear > input.years) throw new RangeError('failureYear must be an integer within the bond term.');
  if (!['normal', 'failure'].includes(input.scenario)) throw new RangeError('Unknown payment scenario.');
  return input;
}

function presentValue(input, requiredYield = input.requiredYield) {
  let total = 0;
  for (let year = 1; year <= input.years; year++) {
    total += (input.annualCoupon + (year === input.years ? input.face : 0)) / (1 + requiredYield) ** year;
  }
  return total;
}

export function bondPrice(options = {}) {
  return presentValue(normalize(options));
}

const formatted = value => value.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
const direction = value => Math.abs(value) < 1e-9 ? 'same' : value > 0 ? 'up' : 'down';
const segment = (kind, value, scale) => ({ kind, value, fraction: value / scale });
const parts = (coupon, principal, scale) => [segment('coupon', coupon, scale), segment('principal', principal, scale)];

export function classifyBondPrediction(actualDirection, prediction) {
  if (!['up', 'same', 'down'].includes(actualDirection)) throw new RangeError('Unknown direction.');
  return prediction === '' ? null : prediction === actualDirection;
}

export function bondFrames(options = {}) {
  const input = normalize(options);
  const price = presentValue(input);
  const baselinePrice = presentValue(input, bondDefaults.requiredYield);
  const couponRate = input.face === 0 ? null : input.annualCoupon / input.face;
  const paymentScale = Math.max(1, input.face + input.annualCoupon);
  const promisedTotal = input.face + input.annualCoupon * input.years;
  const cashScale = Math.max(1, promisedTotal);
  let couponPV = 0, principalPV = 0;
  const schedule = Array.from({ length: input.years }, (_, index) => {
    const year = index + 1;
    const promisedCoupon = input.annualCoupon;
    const promisedPrincipal = year === input.years ? input.face : 0;
    const discountFactor = 1 / (1 + input.requiredYield) ** year;
    const presentCoupon = promisedCoupon * discountFactor;
    const presentPrincipal = promisedPrincipal * discountFactor;
    const failed = input.scenario === 'failure' && year >= input.failureYear;
    const actualCoupon = failed ? 0 : promisedCoupon;
    const actualPrincipal = promisedPrincipal * (failed ? input.recoveryRate : 1);
    couponPV += presentCoupon;
    principalPV += presentPrincipal;
    return {
      year, label: `${year}년 말`, promisedCoupon, promisedPrincipal,
      promisedCash: promisedCoupon + promisedPrincipal, discountFactor,
      presentCoupon, presentPrincipal, presentValue: presentCoupon + presentPrincipal,
      actualCoupon, actualPrincipal, actualCash: actualCoupon + actualPrincipal, failed,
      missingCash: promisedCoupon + promisedPrincipal - actualCoupon - actualPrincipal,
      promisedSegments: parts(promisedCoupon, promisedPrincipal, paymentScale),
      presentSegments: parts(presentCoupon, presentPrincipal, paymentScale),
      actualSegments: parts(actualCoupon, actualPrincipal, paymentScale),
    };
  });
  let cumulativePromisedCoupon = 0, cumulativePromisedPrincipal = 0;
  let cumulativeActualCoupon = 0, cumulativeActualPrincipal = 0, accumulatedPV = 0;
  const frames = [], pricingFrames = [];
  for (let year = 0; year <= input.years; year++) {
    const row = year === 0 ? null : schedule[year - 1];
    cumulativePromisedCoupon += row?.promisedCoupon ?? 0;
    cumulativePromisedPrincipal += row?.promisedPrincipal ?? 0;
    cumulativeActualCoupon += row?.actualCoupon ?? 0;
    cumulativeActualPrincipal += row?.actualPrincipal ?? 0;
    accumulatedPV += row?.presentValue ?? 0;
    const actualCash = cumulativeActualCoupon + cumulativeActualPrincipal;
    const promisedCash = cumulativePromisedCoupon + cumulativePromisedPrincipal;
    const isMatured = year === input.years;
    const holdingPeriodReturn = isMatured && price > 0 ? (actualCash - price) / price : null;
    const message = year === 0
      ? `오늘 매수가격 ${formatted(price)}단위가 나갑니다. 받은 쿠폰과 원금은 아직 0입니다. 미래의 약속을 현재 현금에 더하지 않습니다.`
      : isMatured
        ? `만기까지 약속한 현금 ${formatted(promisedCash)}단위와 실제 받은 현금 ${formatted(actualCash)}단위를 비교합니다. 실제 현금에서 매수가격 ${formatted(price)}단위를 한 번 빼면 ${formatted(actualCash - price)}단위입니다. 만기 원금을 별도 보유 자산으로 다시 더하지 않습니다.`
        : `${year}년 말의 약속은 ${formatted(row.promisedCash)}단위, 실제 수령은 ${formatted(row.actualCash)}단위입니다. 지금까지 받은 현금은 ${formatted(actualCash)}단위입니다. 남은 채권의 매도가격은 이 장부에 넣지 않았으므로 중간 총수익률은 계산하지 않습니다.`;
    frames.push({
      index: year, year, label: year === 0 ? '오늘 · 매수 직후' : `${year}년 말${isMatured ? ' · 만기 정산' : ' · 지급 관찰'}`,
      message, isMatured, promisedCoupon: row?.promisedCoupon ?? 0, promisedPrincipal: row?.promisedPrincipal ?? 0,
      actualCoupon: row?.actualCoupon ?? 0, actualPrincipal: row?.actualPrincipal ?? 0,
      payment: row?.actualCash ?? 0, promisedCash, actualCash, cumulativeActualCoupon, cumulativeActualPrincipal,
      netCashFlow: actualCash - price, purchaseOutflow: year === 0 ? price : 0,
      missingCash: promisedCash - actualCash, holdingPeriodReturn,
      promisedSegments: parts(cumulativePromisedCoupon, cumulativePromisedPrincipal, cashScale),
      actualSegments: parts(cumulativeActualCoupon, cumulativeActualPrincipal, cashScale),
      cashDirection: direction(actualCash - price),
      predictionOutcome: direction(actualCash - price),
    });
    pricingFrames.push({
      index: year, year, label: year === 0 ? '오늘 · 약속의 시간표' : `오늘 · ${year}년 말 현금까지 할인`,
      presentValue: row?.presentValue ?? 0, accumulatedPV,
      predictionOutcome: direction(price - baselinePrice),
      message: year === 0
        ? '미래의 약속을 각 지급 시점에 놓습니다. 지금 통장에 들어온 돈이 아닙니다.'
        : `각 지급액을 오늘의 가치로 옮겨 더했습니다. ${year}년 말 현금까지의 현재가치 합은 ${formatted(accumulatedPV)}단위입니다.${isMatured ? ' 모든 약속의 현재가치를 더한 값이 이 모형의 가격입니다.' : ' 아직 뒤의 지급액은 합계에 넣지 않았습니다.'}`,
    });
  }
  // All points use one fixed scale for all allowed yields, including the selected value.
  const chart = { left: 52, top: 22, width: 266, height: 166, viewWidth: 340, viewHeight: 240, maximumPrice: cashScale };
  const point = requiredYield => {
    const pointPrice = presentValue(input, requiredYield);
    const x = chart.left + requiredYield / 0.2 * chart.width;
    const y = chart.top + chart.height * (1 - pointPrice / chart.maximumPrice);
    return { requiredYield, price: pointPrice, x, y, xFraction: x / chart.viewWidth, yFraction: y / chart.viewHeight };
  };
  const sensitivity = Array.from({ length: 21 }, (_, index) => point(index / 100));
  const selectedPoint = point(input.requiredYield);
  return {
    input, price, couponRate, couponPV, principalPV, promisedTotal, paymentScale, cashScale,
    schedule, frames, pricingFrames, summary: frames.at(-1), pricingSummary: pricingFrames.at(-1),
    priceDirection: direction(price - baselinePrice), parDirection: direction(price - input.face),
    sensitivity, selectedPoint, chart, curve: sensitivity.map(p => `${p.x},${p.y}`).join(' '),
    sensitivityTicks: [0, 0.05, 0.1, 0.15, 0.2].map(point),
    priceTicks: [0, cashScale / 2, cashScale].map(value => {
      const y = chart.top + chart.height * (1 - value / chart.maximumPrice);
      return { value, y, yFraction: y / chart.viewHeight };
    }),
    priceSegments: parts(couponPV, principalPV, cashScale), baselinePrice,
  };
}

// Four alternative one-year illustrations, not a time series or estimated probabilities.
// Every alternative starts with the same amount. No flows, fees, tax or rebalancing.
export const diversificationDefaults = Object.freeze({ initialAmount: 1000, weightA: 0.5, commonShock: false });
const A_RETURNS = Object.freeze([0.2, 0.2, -0.2, -0.2]);
const B_RETURNS = Object.freeze([0.2, -0.2, 0.2, -0.2]);
const COMPARISON_WEIGHT = 0.25;
const formatted = value => value.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
const rateText = value => `${value > 0 ? '+' : ''}${formatted(value * 100)}%`;
const pointText = value => `${value > 0 ? '+' : ''}${formatted(value * 100)}%p`;

function normalize(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Options must be an object.');
  const input = { ...diversificationDefaults, ...options };
  if (!Number.isFinite(input.initialAmount) || input.initialAmount < 0.01 || input.initialAmount > 1e9) throw new RangeError('initialAmount must be finite, at least 0.01 and at most 1,000,000,000.');
  if (!Number.isFinite(input.weightA) || input.weightA < 0 || input.weightA > 1) throw new RangeError('weightA must be finite and between 0 and 1.');
  if (typeof input.commonShock !== 'boolean') throw new TypeError('commonShock must be a boolean.');
  return input;
}

// Population descriptive spread of all four authored illustrations; never n−1 estimation.
function describe(values) {
  const mean = values.reduce((sum, value) => sum + COMPARISON_WEIGHT * value, 0);
  const variance = values.reduce((sum, value) => sum + COMPARISON_WEIGHT * (value - mean) ** 2, 0);
  return { mean, variance, spread: Math.sqrt(variance), minimum: Math.min(...values), maximum: Math.max(...values) };
}

function returnBar(key, value) {
  const endFraction = (value + 0.2) / 0.4;
  return { key, value, endFraction, startFraction: Math.min(0.5, endFraction), widthFraction: Math.abs(endFraction - 0.5) };
}

export function classifyDiversificationPrediction(outcome, prediction) {
  if (!['less', 'same'].includes(outcome)) throw new RangeError('Unknown descriptive-spread outcome.');
  if (!['', 'less', 'same'].includes(prediction)) throw new RangeError('Unknown prediction.');
  return prediction === '' ? null : prediction === outcome;
}

export function diversificationFrames(options = {}) {
  const input = normalize(options);
  const weightB = 1 - input.weightA;
  const initialA = input.initialAmount * input.weightA;
  const initialB = input.initialAmount * weightB;
  const moneyScale = input.initialAmount * 1.2;
  const allocation = [
    { key: 'a', label: 'A', weight: input.weightA, amount: initialA },
    { key: 'b', label: 'B', weight: weightB, amount: initialB },
  ];
  const amountSegments = (a, b) => [
    { key: 'a', amount: a, fraction: a / moneyScale },
    { key: 'b', amount: b, fraction: b / moneyScale },
  ];
  const scenarios = A_RETURNS.map((aReturn, index) => {
    const bReturn = input.commonShock ? aReturn : B_RETURNS[index];
    const contributionA = input.weightA * aReturn;
    const contributionB = weightB * bReturn;
    const portfolioReturn = contributionA + contributionB;
    const endingA = initialA * (1 + aReturn);
    const endingB = initialB * (1 + bReturn);
    const endingTotal = endingA + endingB;
    return {
      index, label: `시나리오 ${index + 1}`, comparisonWeight: COMPARISON_WEIGHT,
      aReturn, bReturn, contributionA, contributionB, portfolioReturn,
      endingA, endingB, endingTotal, profit: endingTotal - input.initialAmount,
      sameDirection: Math.sign(aReturn) === Math.sign(bReturn),
      bars: [returnBar('a', aReturn), returnBar('b', bReturn), returnBar('portfolio', portfolioReturn)],
      amountSegments: amountSegments(endingA, endingB),
    };
  });
  const statistics = {
    a: describe(scenarios.map(row => row.aReturn)),
    b: describe(scenarios.map(row => row.bReturn)),
    portfolio: describe(scenarios.map(row => row.portfolioReturn)),
  };
  // The two single-asset boundaries and B=A have exactly the same scenario spread as A.
  // Use the structural boundary, not rounded values, even for very small interior weights.
  const predictionOutcome = input.commonShock || input.weightA === 0 || input.weightA === 1 ? 'same' : 'less';
  const baseFrame = {
    scenarioIndex: null, portfolioReturn: null, contributionA: 0, contributionB: 0,
    endingA: initialA, endingB: initialB, endingTotal: input.initialAmount,
    amountSegments: amountSegments(initialA, initialB), predictionOutcome,
  };
  const frames = [{
    ...baseFrame, index: 0, label: '출발 · 같은 최초 금액 나누기', isSummary: false,
    message: `매번 ${formatted(input.initialAmount)}단위에서 출발합니다. A ${formatted(initialA)}단위와 B ${formatted(initialB)}단위로 나눕니다. 네 시나리오는 차례로 이어지는 4년이 아니라 같은 1년의 서로 다른 가상 결과입니다.`,
  }];
  for (const row of scenarios) {
    frames.push({
      index: row.index + 1, scenarioIndex: row.index, label: `${row.label} · 1년 말 비교`,
      isSummary: false, portfolioReturn: row.portfolioReturn,
      contributionA: row.contributionA, contributionB: row.contributionB,
      endingA: row.endingA, endingB: row.endingB, endingTotal: row.endingTotal,
      amountSegments: amountSegments(row.endingA, row.endingB), predictionOutcome,
      message: `A의 ${rateText(row.aReturn)}에 최초 비중 ${formatted(input.weightA * 100)}%를 곱하면 ${pointText(row.contributionA)}, B의 ${rateText(row.bReturn)}에 ${formatted(weightB * 100)}%를 곱하면 ${pointText(row.contributionB)}입니다. 두 기여를 더한 묶음 수익률은 ${rateText(row.portfolioReturn)}, 기말 평가액은 ${formatted(row.endingTotal)}단위입니다.`,
    });
  }
  frames.push({
    ...baseFrame, index: 5, label: '전체 비교 · 평균과 흩어짐', isSummary: true,
    message: `네 결과를 각각 25%의 비교 비중으로 요약하면 묶음의 평균은 ${rateText(statistics.portfolio.mean)}, 흩어짐은 ${formatted(statistics.portfolio.spread * 100)}%p입니다. A만 보유한 흩어짐 ${formatted(statistics.a.spread * 100)}%p보다 ${predictionOutcome === 'less' ? '작습니다' : '작아지지 않습니다'}. 가장 낮은 결과 ${rateText(statistics.portfolio.minimum)}도 남습니다. 이는 이 네 사례의 기술값이며 실제 발생 확률이나 미래 손실 한도가 아닙니다.`,
  });
  return {
    input, weightB, allocation, initialA, initialB, moneyScale, scenarios, statistics,
    frames, summary: frames.at(-1), predictionOutcome,
    sameDirectionCount: scenarios.filter(row => row.sameDirection).length,
    axis: { minimum: -0.2, maximum: 0.2, zeroFraction: 0.5, ticks: [-0.2, 0, 0.2].map(value => ({ value, fraction: (value + 0.2) / 0.4 })) },
    spreadBars: ['a', 'b', 'portfolio'].map(key => ({ key, value: statistics[key].spread, fraction: statistics[key].spread / 0.2 })),
  };
}

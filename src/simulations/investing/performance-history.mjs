// Authored, bounded educational histories. No live data, optimization or return forecast.
const fmt = value => value.toLocaleString('ko-KR', { maximumFractionDigits: 4 });
const pct = value => value === null ? '정의 불가' : `${fmt(value * 100)}%`;
const optionsObject = options => {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Options must be an object.');
};
const choices = ['a-deeper', 'same', 'undefined', 'greater', 'separate', 'contaminated'];
export function classifyPerformancePrediction(outcome, prediction) {
  if (!choices.includes(outcome) || !['', ...choices].includes(prediction)) throw new RangeError('Unknown performance prediction.');
  return prediction === '' ? null : prediction === outcome;
}

export function analyzePerformancePath(values) {
  if (!Array.isArray(values)) throw new TypeError('A path must be an array.');
  if (values.length < 1 || values.length > 48) throw new RangeError('A path needs 1 to 48 observations.');
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (!Number.isFinite(value) || value < 0 || (value > 0 && value < .01) || value > 1e9) throw new RangeError('Values must be 0 or finite numbers from 0.01 to 1,000,000,000.');
    if (index > 0 && values[index - 1] === 0 && value > 0) throw new RangeError('This no-flow multiplicative model cannot recover positive value from zero.');
  }
  const copied = [...values];
  let peak = copied[0], peakIndex = 0, maxDrawdown = peak === 0 ? null : 0, maxDrawdownPoint = peak === 0 ? null : 0;
  const points = copied.map((value, index) => {
    if (value > peak) { peak = value; peakIndex = index; }
    const drawdown = peak === 0 ? null : (peak - value) / peak;
    if (drawdown !== null && (maxDrawdown === null || drawdown > maxDrawdown)) { maxDrawdown = drawdown; maxDrawdownPoint = index; }
    return {
      index, label: `T${index}`, value, peak, peakIndex, drawdown, maxDrawdown,
      periodReturn: index === 0 || copied[index - 1] === 0 ? null : (value - copied[index - 1]) / copied[index - 1],
    };
  });
  return {
    values: copied, points, intervalCount: copied.length - 1, initialAmount: copied[0], finalAmount: copied.at(-1),
    totalReturn: copied[0] === 0 ? null : (copied.at(-1) - copied[0]) / copied[0], maxDrawdown, maxDrawdownPoint,
  };
}

export function performanceHistoryFrames(options = {}) {
  optionsObject(options);
  const input = { scenario: 'paths', ...options };
  if (!['paths', 'zero', 'single'].includes(input.scenario)) throw new RangeError('Unknown fixed path scenario.');
  const values = input.scenario === 'zero' ? [[0, 0, 0, 0], [0, 0, 0, 0]] : input.scenario === 'single' ? [[100], [100]] : [[100, 150, 75, 100], [100, 95, 90, 100]];
  const scale = { minimum: 0, maximum: 150, ticks: [0, 50, 100, 150].map(value => ({ value, y: 1 - value / 150 })) };
  const paths = values.map((values, index) => ({ id: index === 0 ? 'a' : 'b', label: index === 0 ? '경로 A' : '경로 B', ...analyzePerformancePath(values) }));
  const predictionOutcome = input.scenario === 'paths' ? 'a-deeper' : input.scenario === 'zero' ? 'undefined' : 'same';
  const count = paths[0].points.length;
  const at = observationIndex => paths.map(path => {
    const points = path.points.slice(0, observationIndex + 1).map(point => ({ ...point, x: count === 1 ? .5 : point.index / (count - 1), y: 1 - point.value / scale.maximum }));
    const current = points.at(-1);
    return {
      id: path.id, label: path.label, points, current,
      polyline: points.map(point => `${point.x * 100},${point.y * 100}`).join(' '),
      peakY: 1 - current.peak / scale.maximum, gapHeight: (current.peak - current.value) / scale.maximum,
      totalReturn: path.initialAmount === 0 ? null : (current.value - path.initialAmount) / path.initialAmount,
    };
  });
  const frames = paths[0].points.map((point, index) => ({
    index, observationIndex: index, label: `${point.label} · 그때까지의 정점 확인`, isSummary: false, paths: at(index), predictionOutcome,
    message: index === 0 ? `출발 관찰값은 두 경로 모두 ${fmt(point.value)}단위입니다. 아직 미래 값을 정점에 넣지 않습니다.` : `T${index}까지 관찰합니다. ${paths.map(path => { const p = path.points[index]; return `${path.label}: 정점 ${fmt(p.peak)}단위, 현재 ${fmt(p.value)}단위, 현재 낙폭 ${pct(p.drawdown)}`; }).join('. ')}.`,
  }));
  frames.push({
    index: count, observationIndex: count - 1, label: '전체 비교 · 종점과 최대낙폭', isSummary: true, paths: at(count - 1), predictionOutcome,
    message: input.scenario === 'paths' ? '같은 세 구간 뒤 두 경로 모두 100단위, 최종 수익률 0%입니다. 관찰된 최대낙폭은 A 50%, B 10%로 다릅니다. A는 마지막에도 과거 정점 150단위보다 낮습니다.' : input.scenario === 'zero' ? '기초 평가액과 정점이 모두 0입니다. 금액 차이는 0이지만 수익률과 낙폭은 분모가 없어 정의 불가입니다.' : '관찰값 1개에서는 종점 차이와 관찰된 낙폭이 0입니다. 시간 구간의 수익률은 없으며, 경로가 안전했다거나 앞으로도 안전하다고 판단할 수 없습니다.',
  });
  return { input, externalFlows: 0, paths, scale, ticks: paths[0].points.map(point => ({ label: point.label, x: count === 1 ? .5 : point.index / (count - 1) })), predictionOutcome, frames, summary: frames.at(-1) };
}

export function recoveryCompoundingFrames(options = {}) {
  optionsObject(options);
  const input = { lossRate: .5, ...options };
  if (!Number.isFinite(input.lossRate) || input.lossRate < 0 || input.lossRate > 1) throw new RangeError('lossRate must be finite and from 0 to 1.');
  if (input.lossRate === 0) input.lossRate = 0;
  const initialAmount = 100, lossAmount = initialAmount * input.lossRate, remainingAmount = initialAmount * (1 - input.lossRate);
  // Reuse the lost amount, avoiding cancellation of nearly equal 100-level numbers.
  const requiredGain = lossAmount;
  const recoveryRate = remainingAmount === 0 ? null : input.lossRate / (1 - input.lossRate);
  const recoveredAmount = remainingAmount === 0 ? null : initialAmount;
  const predictionOutcome = input.lossRate === 1 ? 'undefined' : input.lossRate === 0 ? 'same' : 'greater';
  const returns = [.5, -.5];
  const values = [100];
  for (const rate of returns) values.push(values.at(-1) * (1 + rate));
  const compounding = {
    returns, values, arithmeticMean: returns.reduce((sum, rate) => sum + rate, 0) / returns.length,
    cumulativeReturn: (values.at(-1) - values[0]) / values[0],
    bars: values.map((value, index) => ({ index, label: ['출발', '1구간 · +50%', '2구간 · −50%'][index], value, fraction: value / 150 })),
  };
  const labels = ['출발 · 같은 100단위', '손실 뒤 · 분모가 작아짐', '필요한 회복 가정 · 별도 복리 경로', '전체 비교 · 금액과 비율 구분'];
  const messages = [
    '위쪽 손실·회복과 아래쪽 +50%/−50%는 별개의 가상 사례입니다. 둘 다 100단위에서 시작합니다.',
    `${pct(input.lossRate)} 손실 뒤 ${fmt(remainingAmount)}단위가 남습니다. 원래 100까지 부족한 돈은 ${fmt(requiredGain)}단위입니다. 아래 별도 사례는 첫 구간 +50% 뒤 150단위입니다.`,
    recoveryRate === null ? '남은 금액이 0이므로 같은 자산의 백분율 회복률은 정의 불가입니다. 유한한 상승률을 0에 곱해 100을 만들 수 없습니다. 아래는 150에서 50% 줄어 75단위입니다.' : `남은 ${fmt(remainingAmount)}단위에 ${pct(recoveryRate)}가 올라야 100이 됩니다. 이 상승은 필요한 조건을 가정한 것이며 실제 회복 예측이 아닙니다. 아래는 150에서 50% 줄어 75단위입니다.`,
    `손실 ${pct(input.lossRate)} 뒤 필요한 회복률은 ${pct(recoveryRate)}입니다. 별도 +50%/−50%의 산술평균은 ${pct(compounding.arithmeticMean)}지만 100→150→75의 누적 수익률은 ${pct(compounding.cumulativeReturn)}입니다.`,
  ];
  const frames = labels.map((label, index) => {
    const recoveryAmount = index === 0 ? initialAmount : index === 1 || recoveredAmount === null ? remainingAmount : recoveredAmount;
    const compoundIndex = Math.min(index, values.length - 1);
    return { index, label, message: messages[index], isSummary: index === labels.length - 1, recoveryAmount, recoveryFraction: recoveryAmount / initialAmount, recoveryIsAssumed: index >= 2 && recoveredAmount !== null, compoundIndex, compoundAmount: values[compoundIndex], predictionOutcome };
  });
  return { input, initialAmount, lossAmount, remainingAmount, requiredGain, recoveryRate, recoveredAmount, predictionOutcome, remainingFraction: remainingAmount / initialAmount, requiredFraction: requiredGain / initialAmount, compounding, frames, summary: frames.at(-1) };
}

// These are authored rule cards, not a user-configurable strategy engine.
// C resets X/Y weights at every interval start, with fractional holdings and zero costs.
function fixedWindow(xReturns, yReturns, weightX) {
  const returns = xReturns.map((rate, index) => weightX * rate + (1 - weightX) * yReturns[index]);
  const values = [100];
  for (const rate of returns) values.push(values.at(-1) * (1 + rate));
  return { ...analyzePerformancePath(values), returns, endFraction: values.at(-1) / 150 };
}

export function historyReviewFrames(options = {}) {
  optionsObject(options);
  const input = { reviewMode: 'held', ...options };
  if (!['held', 'future-leak', 'reselection'].includes(input.reviewMode)) throw new RangeError('Unknown fixed review mode.');
  const rules = [
    { id: 'a', label: '규칙 A', description: '매 구간 X만 보유', weightX: 1, rebalanceEachInterval: false },
    { id: 'b', label: '규칙 B', description: '매 구간 Y만 보유', weightX: 0, rebalanceEachInterval: false },
    { id: 'c', label: '규칙 C', description: '매 구간 시작 X/Y 50/50 재조정 · 비용 0', weightX: .5, rebalanceEachInterval: true },
  ].map(rule => ({
    ...rule, externalFlows: 0, costRate: 0, normalization: 'each-window-100',
    training: fixedWindow([.2, .1], [.05, .05], rule.weightX),
    review: fixedWindow([-.2, .05], [.1, .05], rule.weightX),
  }));
  // Original A is pre-authored at S2 using only the training window. No search/optimizer.
  const originalSelectedId = 'a';
  const futureLeak = input.reviewMode === 'future-leak', reselected = input.reviewMode === 'reselection';
  const independentReview = !futureLeak && !reselected;
  const selectedId = independentReview ? originalSelectedId : 'b';
  const predictionOutcome = independentReview ? 'separate' : 'contaminated';
  const status = futureLeak ? '미래 자료 누출 · 독립 검토 아님' : reselected ? '사후 재선택 · 독립 검토 아님' : '구간 분리 유지 · 미래 보장 아님';
  const labels = ['구간 고정 · 규칙 세 개만 준비', 'S2 · 과거 두 구간 뒤 선택 기록', 'S4 · 이후 두 구간 검토', '전체 비교 · 선택에 쓴 자료 확인'];
  const messages = [
    '규칙과 구간을 먼저 고정합니다. S0–S2는 선택에 쓸 과거, S2–S4는 이후 검토입니다. 각 창은 비교를 위해 100부터 따로 계산합니다.',
    futureLeak ? '실패 사례: S2에서 아직 오지 않은 S3·S4 결과를 미리 읽고 B를 선택합니다. 미래 자료 누출이므로 뒤 구간은 독립 검토가 아닙니다.' : '가상 원래 기록: S2에서 과거 두 구간의 A 결과 +32%를 보고 A를 선택했다고 고정합니다. 이 선택에는 S3·S4 자료를 쓰지 않습니다.',
    reselected ? '실패 사례: 이후 결과를 본 다음 원래 A를 B로 바꿉니다. A를 택했던 기록은 남지만, B를 바꿔 고른 근거와 검토 자료가 겹칩니다.' : '이후 두 구간에서 A는 −16%, B는 +15.5%입니다. 과거에 높았던 결과가 다음 구간에도 그대로 이어지지 않습니다.',
    `${status}. ${independentReview ? '선택과 검토 자료를 나눈 것은 절차상의 구분입니다. 가상 두 구간만으로 미래 성과나 통계적 신뢰성을 보장하지 않습니다.' : '이미 본 이후 구간을 다시 쓰면서 독립적인 검증 결과라고 부를 수 없습니다. 새 규칙의 검토에는 그 선택에 쓰지 않은 자료가 필요합니다.'}`,
  ];
  const frames = labels.map((label, index) => ({
    index, label, message: messages[index], isSummary: index === labels.length - 1,
    trainingVisible: index >= 1, reviewVisible: index >= 2 || (futureLeak && index >= 1),
    selectedId: index === 0 ? null : futureLeak || (reselected && index >= 2) ? 'b' : 'a',
    originalSelectedId, futureLeak, reselected, independentReview, status, predictionOutcome,
  }));
  return { input, rules, trainingWindow: ['S0', 'S1', 'S2'], reviewWindow: ['S2', 'S3', 'S4'], selectionTime: 'S2', scale: 150, originalSelectedId, selectedId, futureLeak, reselected, independentReview, predictionOutcome, status, frames, summary: frames.at(-1) };
}

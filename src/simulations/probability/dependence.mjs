// Finite, explicitly assumed joint probabilities. No real returns, fitted parameters or draws.
export const dependenceDefaults = Object.freeze({ bothCount: 4, weightA: 0.5 });
export function binaryJoint({ total = 100, aCount = 20, bCount = 20, bothCount = 4 } = {}) {
  if (![total, aCount, bCount, bothCount].every(Number.isSafeInteger) || total < 1 || total > 10000 || aCount < 0 || aCount > total || bCount < 0 || bCount > total) throw new RangeError('Integer probability units required');
  const lower = Math.max(0, aCount + bCount - total), upper = Math.min(aCount, bCount);
  if (bothCount < lower || bothCount > upper) throw new RangeError('Joint count violates its marginal bounds');
  const cells = [
    { id: 'both', aLoss: true, bLoss: true, count: bothCount, label: 'A와 B 모두 손실' },
    { id: 'a-only', aLoss: true, bLoss: false, count: aCount - bothCount, label: 'A만 손실' },
    { id: 'b-only', aLoss: false, bLoss: true, count: bCount - bothCount, label: 'B만 손실' },
    { id: 'neither', aLoss: false, bLoss: false, count: total - aCount - bCount + bothCount, label: '둘 다 손실 없음' },
  ].map(c => ({ ...c, probability: c.count / total, possible: c.count > 0 }));
  const pA = aCount / total, pB = bCount / total, q = bothCount / total;
  const varianceA = pA * (1 - pA), varianceB = pB * (1 - pB), covariance = (bothCount * total - aCount * bCount) / total ** 2;
  const correlation = varianceA === 0 || varianceB === 0 ? null : covariance / Math.sqrt(varianceA) / Math.sqrt(varianceB);
  // Every token has the same probability mass. Token index is not a time order.
  const tokens = cells.flatMap(c => Array.from({ length: c.count }, (_, i) => ({ state: c.id, aLoss: c.aLoss, bLoss: c.bLoss, localIndex: i }))).map((t, index) => ({ ...t, index, probability: 1 / total }));
  return { total, aCount, bCount, bothCount, pA, pB, q, bounds: { lower, upper }, cells, tokens, covariance, correlation, independent: bothCount * total === aCount * bCount };
}

export function linearCorrelation(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length < 1 || [...a, ...b].some(v => !Number.isFinite(v))) throw new RangeError('Equal nonempty finite arrays required');
  const n = a.length, meanA = a.reduce((s, v) => s + v, 0) / n, meanB = b.reduce((s, v) => s + v, 0) / n;
  const varianceA = a.reduce((s, v) => s + (v - meanA) ** 2, 0) / n, varianceB = b.reduce((s, v) => s + (v - meanB) ** 2, 0) / n;
  const covariance = a.reduce((s, v, i) => s + (v - meanA) * (b[i] - meanB), 0) / n;
  if (![meanA, meanB, varianceA, varianceB, covariance].every(Number.isFinite)) throw new RangeError('Finite moments required');
  return { meanA, meanB, varianceA, varianceB, covariance, correlation: varianceA === 0 || varianceB === 0 ? null : covariance / Math.sqrt(varianceA) / Math.sqrt(varianceB) };
}

export function nonlinearExample(selectedA = 0) {
  const a = [-20, 0, 20], b = [10, -20, 10];
  if (!a.includes(selectedA)) throw new RangeError('Choose an authored A outcome');
  const rows = a.map((value, index) => ({ index, a: value, b: b[index], probability: 1 / 3, x: (value + 25) / 50, y: (25 - b[index]) / 50, selected: value === selectedA }));
  const selected = rows.find(r => r.selected);
  return { rows, selected, stats: linearCorrelation(a, b), marginalB: rows.filter(r => r.b === selected.b).length / rows.length, conditionalB: 1, axis: { min: -25, max: 25, unit: '%' }, independent: false };
}

export function dependenceModel(input = {}) {
  const params = { ...dependenceDefaults, ...input };
  if (![0, 4, 20].includes(params.bothCount) || ![0, 0.5, 1].includes(params.weightA)) throw new RangeError('Authored joint relationship and holding weight required');
  const joint = binaryJoint({ bothCount: params.bothCount }), initial = 1000, threshold = 150;
  const allocation = { a: initial * params.weightA, b: initial * (1 - params.weightA) };
  const outcomes = joint.cells.map(c => {
    const lossA = c.aLoss ? allocation.a * 0.2 : 0, lossB = c.bLoss ? allocation.b * 0.2 : 0, loss = lossA + lossB;
    return { ...c, lossA, lossB, loss, ending: initial - loss, fraction: loss / 200, exceeds: loss > threshold };
  });
  const distribution = [0, 100, 200].map(loss => { const count = outcomes.filter(o => o.loss === loss).reduce((sum, o) => sum + o.count, 0); return { loss, count, probability: count / joint.total, possible: count > 0, fraction: loss / 200 }; });
  const expectedLoss = outcomes.reduce((sum, o) => sum + o.probability * o.loss, 0);
  const variance = outcomes.reduce((sum, o) => sum + o.probability * (o.loss - expectedLoss) ** 2, 0);
  const exceedsProbability = outcomes.filter(o => o.exceeds).reduce((sum, o) => sum + o.probability, 0);
  const frames = [
    { label: '개별 손실 확률은 둘 다 20%', explanation: '각 대상의 분포는 고정했습니다. 처음 1,000단위를 나누는 보유 비중은 사건 확률과 다른 양입니다.', joint: false, loss: false, compare: false },
    { label: '같이 손실 나는 칸을 보기', explanation: '한 칸은 가정한 확률 1%입니다. 실제 100회 관측이 아닙니다. A와 B의 주변 합은 각각 20칸으로 유지됩니다.', joint: true, loss: false, compare: false },
    { label: '같은 사건을 묶음의 손실로 바꾸기', explanation: 'A와 B에 실제로 나눈 최초 금액에 손실률을 적용합니다. 사건 확률을 보유 비중처럼 바꾸지 않습니다.', joint: true, loss: true, compare: false },
    { label: '평균과 큰 손실의 가능성 나누기', explanation: '손실 150단위를 엄격히 넘는 확률을 비교합니다. 이것은 가상의 손실 비교선이며 납부 의무나 파산 기준이 아닙니다.', joint: true, loss: true, compare: true },
  ];
  return {
    params, joint, initial, allocation, threshold, thresholdFraction: threshold / 200, outcomes, distribution,
    expectedLoss, variance, sd: Math.sqrt(variance), exceedsProbability, axis: { min: 0, max: 200, probabilityMin: 0, probabilityMax: 1 }, frames,
    relation: params.bothCount === 4 ? '이 두 사건은 독립인 가정' : params.bothCount === 20 ? '항상 함께 손실 나는 가정' : '같은 기간에는 함께 손실 나지 않는 가정',
    verdict: params.weightA === 0.5 ? '반반 보유의 기대손실은 관계와 무관하게 40단위입니다. 큰 손실 확률까지 같다는 뜻은 아닙니다.' : '한쪽만 보유하면 묶음은 그 한 대상의 결과입니다. 다른 대상과의 짝짓기를 바꿔도 손실 분포는 같습니다.',
  };
}

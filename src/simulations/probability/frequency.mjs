import { fixedBlock } from './seeded.mjs';
export const frequencyDefaults = Object.freeze({ n: 100, p: .01, sampleIndex: 0 });
export function binomial(n, p) {
  if (!Number.isInteger(n) || n < 0 || n > 1000 || !Number.isFinite(p) || p < 0 || p > 1) throw new RangeError('Integer n0–1000 and probability0–1 required');
  let logChoose = 0;
  const rows = Array.from({ length: n + 1 }, (_, k) => {
    if (k) logChoose += Math.log(n - k + 1) - Math.log(k);
    const possible = p === 0 ? k === 0 : p === 1 ? k === n : true;
    const logProbability = !possible ? -Infinity : n === 0 || p === 0 || p === 1 ? 0 : logChoose + k * Math.log(p) + (n - k) * Math.log1p(-p);
    const probability = Math.exp(logProbability);
    return { k, probability, logProbability, possible, underflow: possible && probability === 0 };
  });
  return { n, p, rows, expected: n * p, variance: n * p * (1 - p), probabilitySum: rows.reduce((sum, r) => sum + r.probability, 0), zeroProbability: rows[0].probability, zeroPossible: rows[0].possible };
}
function groupedMass(rows) {
  const n = rows.length - 1, intervals = [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 10], [11, 20], [21, 100], [101, n]];
  return intervals.filter(([lower]) => lower <= n).map(([lower, requestedUpper]) => {
    const upper = Math.min(n, requestedUpper), group = rows.slice(lower, upper + 1);
    return { lower, upper, label: lower === upper ? `${lower}건` : `${lower}–${upper}건 합계`, outcomes: group.length, probability: group.reduce((sum, r) => sum + r.probability, 0), possible: group.some(r => r.possible) };
  });
}
export function frequencyModel(input = {}) {
  const params = { ...frequencyDefaults, ...input };
  if (![10, 100, 1000].includes(params.n) || ![0, .01, .02, 1].includes(params.p) || ![0, 1, 2].includes(params.sampleIndex)) throw new RangeError('Use supported frequency conditions');
  const theory = binomial(params.n, params.p), uniforms = fixedBlock(params.sampleIndex, params.n);
  const records = uniforms.map((u, i) => ({ index: i + 1, event: u < params.p, u }));
  const observed = records.filter(r => r.event).length;
  const groupSize = Math.max(1, params.n / 20);
  const stages = [...new Set([0, Math.min(10, params.n), Math.ceil(params.n / 2), params.n])].sort((a, b) => a - b);
  const frames = stages.map((seen, step) => {
    const count = records.slice(0, seen).filter(r => r.event).length;
    const groups = Array.from({ length: Math.ceil(params.n / groupSize) }, (_, i) => {
      const lower = i * groupSize + 1, upper = Math.min(params.n, (i + 1) * groupSize);
      const shown = records.slice(lower - 1, Math.min(seen, upper)), observedCount = shown.filter(r => r.event).length;
      return { lower, upper, size: upper - lower + 1, seen: shown.length, count: observedCount, fraction: observedCount / (upper - lower + 1) };
    });
    return { step, seen, count, rate: seen ? count / seen : null, groups, label: seen ? `${seen}건까지 관찰` : '기록을 펼치기 전', explanation: seen ? `지연 ${count}건 ÷ 관찰 ${seen}건. 고정된 가상 기록의 비율이며 가정 p를 새로 알아낸 값은 아닙니다.` : '가능한 횟수의 이론 확률과, 선택한 가상 기록을 따로 읽습니다. 아직 관찰 분모는 0입니다.' };
  });
  return { params, dataKind: '독립·일정확률 모형 / 고정 수열의 가상 기록', theory, massGroups: groupedMass(theory.rows), records, observed, observedRate: observed / params.n, groupSize, frames,
    finiteGridProbability: Math.ceil(params.p * 2 ** 32) / 2 ** 32,
    comparison: { before: .01, after: .02, absoluteChange: .01, relativeChange: 1, denominator: 10000, expectedBefore: 100, expectedAfter: 200 },
    verdict: `가정상 기대 ${theory.expected}건과 이 기록의 지연 ${observed}건은 다른 값입니다. ${params.n}건 관측비율은 ${(observed / params.n * 100).toLocaleString('ko-KR', { maximumFractionDigits: 4 })}%입니다.` };
}

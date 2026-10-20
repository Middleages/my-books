import { describe, narrowValues, histogram } from './descriptive.mjs';
import { teachingWordBlocks, shuffledIndices } from './samplingRandom.mjs';
export const samplingDefaults = Object.freeze({ population: 'narrow', n: 20, mode: 'random', sampleIndex: 0 });
const permutations = Object.freeze(teachingWordBlocks().map(words => Object.freeze(shuffledIndices(100, words).indices)));
export function finiteMeanSE(sigma, n, total) {
  if (!Number.isFinite(sigma) || sigma < 0 || !Number.isInteger(n) || !Number.isInteger(total) || total < 2 || n < 1 || n > total) throw new RangeError('Nonnegative sigma, 1≤n≤N and N≥2 required');
  return sigma / Math.sqrt(n) * Math.sqrt((total - n) / (total - 1));
}
export function householdPopulation(kind = 'narrow') {
  if (!['narrow', 'tail'].includes(kind)) throw new RangeError('Authored population required');
  const ten = kind === 'narrow' ? narrowValues : [...Array(9).fill(10), 110];
  return Array.from({ length: 100 }, (_, i) => ({ id: `H${String(i + 1).padStart(3, '0')}`, index: i, value: ten[i % 10] }));
}
export function samplingModel(input = {}) {
  const params = { ...samplingDefaults, ...input };
  if (!Number.isInteger(params.n) || params.n < 1 || params.n > 100 || !Number.isInteger(params.sampleIndex) || params.sampleIndex < 0 || params.sampleIndex > 199 || !['random', 'convenience', 'copied'].includes(params.mode)) throw new RangeError('Supported sampling conditions required');
  const population = householdPopulation(params.population), populationSummary = describe(population.map(h => h.value));
  const low = [...population].sort((a, b) => a.value - b.value || a.index - b.index);
  const select = index => params.mode === 'convenience' ? low.slice(0, params.n) : params.mode === 'copied' ? Array(params.n).fill(population[permutations[index][0]]) : permutations[index].slice(0, params.n).map(i => population[i]);
  const repeats = Array.from({ length: 200 }, (_, index) => { const records = select(index), summary = describe(records.map(h => h.value)); return { index, mean: summary.mean, error: summary.mean - populationSummary.mean, fraction: summary.mean / 120, unique: new Set(records.map(h => h.id)).size }; });
  const selected = select(params.sampleIndex).map((h, i) => ({ ...h, record: i + 1 })), current = repeats[params.sampleIndex], selectedCounts = new Map();
  for (const h of selected) selectedCounts.set(h.id, (selectedCounts.get(h.id) ?? 0) + 1);
  const inference = params.mode === 'random' ? { available: true, se: finiteMeanSE(populationSummary.sd, params.n, 100), reason: '이론: 100가구에서 비복원 단순무작위 표본을 새로 고른다는 가정' } : { available: false, se: null, reason: '편의 선택·복사에는 단순무작위 표준오차를 붙이지 않음' };
  const repeatSummary = describe(repeats.map(r => r.mean)), bins = histogram(repeats.map(r => r.mean), { width: 2 });
  const frames = [
    { label: '전체 100가구 보기', explanation: '각 번호는 서로 다른 가구입니다. 값이 같아도 같은 가구를 복사한 기록은 아닙니다.', selection: false, mean: false, repetition: false },
    { label: '가구와 기록 수 구별', explanation: `선택한 ${params.n}행은 서로 다른 ${current.unique}가구의 기록입니다. ${params.mode === 'random' ? '이 표본 안에서는 가구를 다시 뽑지 않습니다.' : params.mode === 'copied' ? '같은 한 가구를 여러 행에 복사해도 독립 정보가 늘지 않습니다.' : '지출이 적은 순서의 명부 앞쪽만 골랐습니다.'}`, selection: true, mean: false, repetition: false },
    { label: '이 표본평균 하나 놓기', explanation: '선택한 기록을 더해 기록 수로 나눈 한 점입니다. 전체 평균과의 차이는 이 한 번의 오차이지 표준오차가 아닙니다.', selection: true, mean: true, repetition: false },
    { label: '200개 표본평균 비교', explanation: '막대 높이는 같은 2만원 구간에 들어간 표본평균의 개수입니다. 가구 지출 200개를 모은 그림이 아닙니다. 반복 기록의 퍼짐을 이론 표준오차와 같게 조정하지 않았습니다.', selection: true, mean: true, repetition: true },
  ];
  return { params, unit: '만원', period: '같은 한 달', population: population.map(h => ({ ...h, selectedCount: selectedCounts.get(h.id) ?? 0 })), populationSummary, populationMeanFraction: populationSummary.mean / 120, selected, current, repeats, repeatSummary, bins, axis: { min: 0, max: 120, binWidth: 2, maxCount: 200 }, inference, frames, verdict: params.mode === 'random' ? params.n === 100 ? '전수조사이므로 표본 오차는 0. 실제 조사 오류까지 0이라는 뜻은 아닙니다.' : '표본이 클수록 이론상 평균의 퍼짐은 줄지만, 모든 한 번의 오차가 반드시 작아지지는 않습니다.' : '행 수가 많다는 이유만으로 대표성이나 독립 정보가 늘었다고 할 수 없습니다.' };
}

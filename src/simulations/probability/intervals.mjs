import { describe } from './descriptive.mjs';
import { teachingWordBlocks, normalFromWords } from './samplingRandom.mjs';
export const intervalDefaults = Object.freeze({ mode: 'summary', n: 25, sigma: 20, level: .95, sampleIndex: 0 });
export const normalCritical = Object.freeze({ '.9': 1.6448536269514722, '.95': 1.959963984540054 });
const normalRecords = Object.freeze(teachingWordBlocks().map(words => Object.freeze(Array.from({ length: 101 }, (_, i) => normalFromWords(words[2 * i], words[2 * i + 1])))));
export function knownSigmaIntervals({ mean, n, sigma, level = .95 }) {
  if (!Number.isFinite(mean) || !Number.isInteger(n) || n < 1 || !Number.isFinite(sigma) || sigma < 0 || ![.9, .95].includes(level)) throw new RangeError('Finite mean, positive n, nonnegative known sigma and supported level required');
  const z = level === .95 ? normalCritical['.95'] : normalCritical['.9'], meanHalf = z * sigma / Math.sqrt(n), predictionHalf = z * sigma * Math.sqrt(1 + 1 / n);
  if (![mean - predictionHalf, mean + predictionHalf, meanHalf, predictionHalf].every(Number.isFinite)) throw new RangeError('Intervals exceed finite range');
  return { mean, n, sigma, level, z, ci: { lower: mean - meanHalf, upper: mean + meanHalf, half: meanHalf }, pi: { lower: mean - predictionHalf, upper: mean + predictionHalf, half: predictionHalf } };
}
export function zeroEventUpper(n, confidence = .95) {
  if (!Number.isInteger(n) || n < 1 || !Number.isFinite(confidence) || confidence <= 0 || confidence >= 1) throw new RangeError('Positive n and confidence in (0,1) required');
  return -Math.expm1(Math.log1p(-confidence) / n);
}
export function intervalModel(input = {}) {
  const params = { ...intervalDefaults, ...input };
  if (!['summary', 'repeated'].includes(params.mode) || ![25, 100].includes(params.n) || ![0, 10, 20, 30].includes(params.sigma) || ![.9, .95].includes(params.level) || !Number.isInteger(params.sampleIndex) || params.sampleIndex < 0 || params.sampleIndex > 199 || (params.mode === 'repeated' && params.sigma !== 20)) throw new RangeError('Supported known-sigma teaching conditions required');
  const repeats = normalRecords.map((record, index) => {
    const observations = record.slice(0, params.n).map(z => 20 * z), mean = describe(observations).mean, future = 20 * record[100], intervals = knownSigmaIntervals({ mean, n: params.n, sigma: 20, level: params.level });
    return { index, observations, mean, future, ...intervals, meanCovered: intervals.ci.lower <= 0 && 0 <= intervals.ci.upper, futureCovered: intervals.pi.lower <= future && future <= intervals.pi.upper };
  });
  const selected = repeats[params.sampleIndex], intervals = params.mode === 'summary' ? knownSigmaIntervals({ mean: 5, n: params.n, sigma: params.sigma, level: params.level }) : selected;
  const coverage = { total: 200, mean: repeats.filter(r => r.meanCovered).length, future: repeats.filter(r => r.futureCovered).length };
  const frames = [
    { label: '대상을 나누기', explanation: '같은 가운데 값이라도 평균의 위치와 새 한 번의 결과는 다른 대상입니다.', ci: false, pi: false, coverage: false },
    { label: '평균의 신뢰구간', explanation: '알려진 표준편차와 독립·동일 정규분포 가정 아래 평균 위치의 불확실성을 나타냅니다.', ci: true, pi: false, coverage: false },
    { label: '다음 한 번의 예측구간', explanation: '새 결과 자체의 변동이 더해집니다. 표본 수가 커져도 이 변동이 사라지지는 않습니다.', ci: true, pi: true, coverage: false },
    { label: '반복 절차와 한 번의 범위', explanation: params.mode === 'repeated' ? '가정한 참평균 0과 독립 새 결과를 각 구간이 덮는지 셉니다. 200번의 실제 포함률이 명목 수준과 정확히 같아야 하는 것은 아닙니다.' : '현재 평균 5는 별도의 가상 요약 예입니다. 반복 생성 자료의 평균이나 실제 가게의 예측으로 읽지 않습니다.', ci: true, pi: true, coverage: true },
  ];
  const x = value => (value + 100) / 200, plot = { meanX: x(intervals.mean), truthX: .5, futureX: params.mode === 'repeated' ? x(selected.future) : null, ci: { start: x(intervals.ci.lower), width: (intervals.ci.upper - intervals.ci.lower) / 200 }, pi: { start: x(intervals.pi.lower), width: (intervals.pi.upper - intervals.pi.lower) / 200 } };
  if ([plot.meanX, plot.truthX, plot.futureX, plot.ci.start, plot.ci.start + plot.ci.width, plot.pi.start, plot.pi.start + plot.pi.width].some(v => v !== null && (v < 0 || v > 1))) throw new RangeError('Authored interval point outside common axis');
  return { params, intervals, plot, selected: params.mode === 'repeated' ? selected : null, repeats, coverage, axis: { min: -100, max: 100 }, zeroEvents: [10, 100, 1000].map(n => ({ n, events: 0, confidence: .95, upper: zeroEventUpper(n) })), frames, verdict: '평균을 더 정밀하게 알아도 새 한 번의 흔들림까지 사라지지는 않습니다.' };
}

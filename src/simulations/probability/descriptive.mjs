/** Authored finite household records, not a real survey or future distribution. */
export const narrowValues = [12, 14, 16, 18, 20, 20, 22, 24, 26, 28];
export const descriptiveDefaults = Object.freeze({ tail: 110, binWidth: 20 });
export function quantile(values, p) {
  if (!Array.isArray(values) || values.some(v => !Number.isFinite(v))) throw new TypeError('Finite values required');
  if (!Number.isFinite(p) || p < 0 || p > 1) throw new RangeError('Quantile must be in [0,1]');
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b), i = (sorted.length - 1) * p;
  return sorted[Math.floor(i)] + (sorted[Math.ceil(i)] - sorted[Math.floor(i)]) * (i % 1);
}
export function describe(values) {
  if (!Array.isArray(values) || values.some(v => !Number.isFinite(v))) throw new TypeError('Finite values required');
  const n = values.length, sum = values.reduce((a, b) => a + b, 0);
  if (!n) return { n, sum, mean: null, median: null, variance: null, sd: null, q1: null, q3: null, iqr: null, min: null, max: null };
  const mean = sum / n, variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
  if (!Number.isFinite(sum) || !Number.isFinite(mean) || !Number.isFinite(variance)) throw new RangeError('Summary exceeds finite numerical range');
  const q1 = quantile(values, .25), q3 = quantile(values, .75);
  return { n, sum, mean, median: quantile(values, .5), variance, sd: Math.sqrt(variance), q1, q3, iqr: q3 - q1, min: Math.min(...values), max: Math.max(...values) };
}
export function histogram(values, { min = 0, max = 120, width = 20 } = {}) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(width) || max <= min || width <= 0 || !Number.isInteger((max - min) / width)) throw new RangeError('Equal finite bins required');
  if (values.some(v => !Number.isFinite(v) || v < min || v > max)) throw new RangeError('Values outside displayed axis');
  const bins = Array.from({ length: (max - min) / width }, (_, i) => ({ lower: min + i * width, upper: min + (i + 1) * width, last: i === (max - min) / width - 1, count: 0 }));
  for (const value of values) bins[Math.min(bins.length - 1, Math.floor((value - min) / width))].count++;
  return bins.map(bin => ({ ...bin, fraction: values.length ? bin.count / values.length : 0 }));
}
function group(id, label, values, width) {
  const summary = describe(values), axisMax = 120, stacks = new Map();
  const points = values.map((value, i) => { const stack = stacks.get(value) ?? 0; stacks.set(value, stack + 1); return { id: `${id}-${i}`, value, x: value / axisMax, stack }; });
  const ordered = [...points].sort((a, b) => a.value - b.value || a.id.localeCompare(b.id));
  return { id, label, values, summary, points, ordered: ordered.map((p, i) => ({ ...p, rank: i + 1, middle: i === 4 || i === 5 })), bins: histogram(values, { width }), axisMax, meanFraction: summary.mean / axisMax, medianFraction: summary.median / axisMax };
}
export function distributionModel(input = {}) {
  const params = { ...descriptiveDefaults, ...input };
  if (![20, 60, 110].includes(params.tail) || ![10, 20, 40].includes(params.binWidth)) throw new RangeError('Use supported authored conditions');
  const groups = [group('narrow', '고른 집단', [...narrowValues], params.binWidth), group('tail', '꼬리 집단', [...Array(9).fill(10), params.tail], params.binWidth)];
  const equalMean = groups[0].summary.mean === groups[1].summary.mean;
  const frames = [
    { label: '전체 기록을 펼치기', explanation: '점 하나가 같은 한 달의 한 가구입니다. 위로 쌓인 점도 서로 다른 가구이며 가로 위치는 지출액입니다.' },
    { label: '순서의 가운데 찾기', explanation: '금액순으로 세어 5번째와 6번째를 고릅니다. 가운데 두 금액의 평균이 중앙값입니다. 정렬해도 기록과 합계는 변하지 않습니다.' },
    { label: '평균과 꼬리를 함께 읽기', explanation: equalMean ? '두 집단의 평균은 20만원으로 같습니다. 하지만 꼬리 집단의 9가구는 10만원, 1가구는 110만원입니다. 대표값 하나가 이 차이를 지웁니다.' : '큰 값 하나를 바꾸면 합계와 평균이 움직입니다. 나머지 아홉 값이 10만원이므로 꼬리 집단의 중앙값은 10만원입니다.' },
  ];
  return { caseId: 'ten-households', dataKind: '자체 가상 관측', unit: '만원', period: '같은 한 달', params, groups, frames, equalMean, verdict: equalMean ? '같은 평균, 다른 중앙과 꼬리' : '큰 값 하나가 평균을 움직인다' };
}

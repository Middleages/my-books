// Authored store-day summaries, not a randomized experiment or real campaign data.
export const associationDefaults = Object.freeze({ lowWeight: 0.5 });
export const seasonalRecords = Object.freeze([
  Object.freeze({ group: 'used', season: 'low', count: 80, mean: 80 }),
  Object.freeze({ group: 'unused', season: 'low', count: 20, mean: 70 }),
  Object.freeze({ group: 'used', season: 'high', count: 20, mean: 180 }),
  Object.freeze({ group: 'unused', season: 'high', count: 80, mean: 170 }),
]);

export function countWeightedMean(rows) {
  if (!Array.isArray(rows) || rows.some(r => !Number.isSafeInteger(r.count) || r.count < 0 || !Number.isFinite(r.mean))) throw new RangeError('Finite means and nonnegative integer counts required');
  const count = rows.reduce((sum, r) => sum + r.count, 0);
  const sum = rows.reduce((total, r) => total + r.count * r.mean, 0);
  if (!Number.isSafeInteger(count) || !Number.isFinite(sum)) throw new RangeError('Finite aggregate required');
  return { count, sum, mean: count === 0 ? null : sum / count };
}

export function associationModel(input = {}) {
  const params = { ...associationDefaults, ...input };
  if (!Number.isFinite(params.lowWeight) || params.lowWeight < 0 || params.lowWeight > 1) throw new RangeError('Comparison weight must be between zero and one');
  const cells = seasonalRecords.map(r => ({ ...r, sum: r.count * r.mean, meanFraction: r.mean / 200 }));
  const groups = ['used', 'unused'].map(group => {
    const rows = cells.filter(r => r.group === group), observed = countWeightedMean(rows);
    const low = rows.find(r => r.season === 'low'), high = rows.find(r => r.season === 'high');
    const standardized = params.lowWeight * low.mean + (1 - params.lowWeight) * high.mean;
    return {
      group, label: group === 'used' ? '캠페인 사용' : '캠페인 미사용',
      observed, observedFraction: observed.mean / 200, standardized, standardizedFraction: standardized / 200,
      observedWeights: { low: low.count / observed.count, high: high.count / observed.count },
      contributions: { low: params.lowWeight * low.mean, high: (1 - params.lowWeight) * high.mean },
    };
  });
  const frames = [
    { label: '전체 평균과 날짜 구성', explanation: '각 집단은 100건이지만 비수기와 성수기의 비중이 다릅니다. 구성 띠의 길이는 기록 수이며 매출액이 아닙니다.', strata: false, standardized: false, causes: false },
    { label: '같은 계절 안에서 다시 보기', explanation: '각 계절 안에서는 사용 집단의 평균이 10단위 높습니다. 원래 네 칸의 기록 수와 평균을 그대로 펼쳤습니다.', strata: true, standardized: false, causes: false },
    { label: '새 관측 없이 같은 비중으로 비교', explanation: '두 집단에 같은 계절 가중치를 적용한 별도 기술 비교입니다. 원래 200건을 옮기거나 새로 조사하지 않았습니다.', strata: true, standardized: true, causes: false },
    { label: '숫자의 관계와 원인의 간격', explanation: '계절이 선택과 매출에 함께 영향을 주었을 가능성을 그립니다. 후보 설명이며, 캠페인의 인과효과를 확인한 화살표가 아닙니다.', strata: true, standardized: true, causes: true },
  ];
  return {
    params, cells, groups, total: countWeightedMean(cells),
    standardizedWeights: { low: params.lowWeight, high: 1 - params.lowWeight },
    observedDifference: groups[0].observed.mean - groups[1].observed.mean,
    standardizedDifference: groups[0].standardized - groups[1].standardized,
    causalEstimate: null,
    causalReason: '배정 방식·매장 차이·가격·동시 변화 등이 확인되지 않아 인과효과는 판정하지 않음',
    axis: { min: 0, max: 200, unit: '가상 매출 단위 / 매장·일' }, frames,
    candidatePaths: [
      { from: 'season', to: 'campaign', label: '계절이 선택에 영향을 줄 가능성', status: 'candidate' },
      { from: 'season', to: 'sales', label: '계절이 매출에 영향을 줄 가능성', status: 'candidate' },
      { from: 'campaign', to: 'sales', label: '캠페인 효과는 이 표만으로 모름', status: 'unidentified' },
    ],
    verdict: '전체 평균의 방향은 구성비에 따라 달라집니다. 같은 구성으로 비교해도 인과효과가 확인된 것은 아닙니다.',
  };
}

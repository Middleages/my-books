export const pathDefaults = Object.freeze({ withdrawal: 30, periods: 2 });
export function runPath(returns, withdrawal = 30, initial = 100) {
  if (!Array.isArray(returns) || returns.length > 12 || returns.some(r => !Number.isFinite(r) || r < -1) || !Number.isFinite(withdrawal) || withdrawal < 0 || !Number.isFinite(initial) || initial < 0) throw new RangeError('Finite nonnegative money and authored finite returns >= -1 required');
  let balance = initial, firstFailure = null, totalPaid = 0;
  const stages = [{ index: 0, period: 0, kind: 'start', label: '처음', before: initial, amount: initial, applied: 0, needed: 0, shortfall: 0, status: 'recorded' }], periods = [];
  for (let i = 0; i < returns.length; i++) {
    const period = i + 1, rate = returns[i];
    if (firstFailure !== null) { periods.push({ period, rate, before: null, afterReturn: null, requested: withdrawal, paid: null, ending: null, shortfall: null, status: 'unexecuted' }); for (const kind of ['return', 'payment']) stages.push({ index: stages.length, period, kind, label: `${period}기 ${kind === 'return' ? '수익' : '지출'} · 미실행`, before: null, amount: null, applied: null, needed: kind === 'payment' ? withdrawal : 0, shortfall: null, status: 'unexecuted' }); continue; }
    const before = balance, afterReturn = before * (1 + rate);
    if (!Number.isFinite(afterReturn)) throw new RangeError('Path amount exceeds finite representation');
    balance = afterReturn;
    stages.push({ index: stages.length, period, kind: 'return', label: `${period}기 수익 반영`, before, amount: balance, applied: balance - before, needed: withdrawal, shortfall: 0, status: 'recorded' });
    const shortfall = Math.max(0, withdrawal - balance), failed = balance < withdrawal, paid = failed ? 0 : withdrawal;
    if (failed) firstFailure = period; else { balance -= withdrawal; totalPaid += withdrawal; }
    const status = failed ? 'failed' : 'paid';
    stages.push({ index: stages.length, period, kind: 'payment', label: `${period}기 ${failed ? '지출 직전 중단' : '지출 반영'}`, before: afterReturn, amount: balance, applied: paid === 0 ? 0 : -paid, needed: withdrawal, shortfall, status });
    periods.push({ period, rate, before, afterReturn, requested: withdrawal, paid, ending: failed ? null : balance, shortfall, status });
  }
  return { initial, returns: returns.slice(), withdrawal, stages, periods, failed: firstFailure !== null, firstFailure, totalPaid, ending: firstFailure === null ? balance : null, stoppedBalance: balance, depleted: balance === 0, legalBankruptcy: null };
}
export function enumeratePaths(periods = 2, withdrawal = 40, initial = 100) {
  if (!Number.isInteger(periods) || periods < 0 || periods > 10) throw new RangeError('An exact finite horizon0–10 required');
  const count = 2 ** periods, rows = Array.from({ length: count }, (_, index) => { const returns = Array.from({ length: periods }, (_, p) => (index >> (periods - p - 1)) & 1 ? 1 : -.5); return { id: `P${String(index + 1).padStart(3, '0')}`, probability: 1 / count, ...runPath(returns, withdrawal, initial) }; });
  const failedCount = rows.filter(r => r.failed).length, survivors = rows.filter(r => !r.failed), groups = Array.from({ length: periods }, (_, index) => { const period = index + 1, atRisk = rows.filter(r => r.firstFailure === null || r.firstFailure >= period).length, failures = rows.filter(r => r.firstFailure === period).length, cumulative = rows.filter(r => r.firstFailure !== null && r.firstFailure <= period).length; return { period, atRisk, failures, cumulative, conditionalFailure: atRisk ? failures / atRisk : null, cumulativeFailure: cumulative / count, fraction: failures / count }; });
  return { periods, withdrawal, initial, rows, count, failedCount, survivorCount: survivors.length, failureProbability: failedCount / count, survivalProbability: survivors.length / count, conditionalSurvivorMean: survivors.length ? survivors.reduce((sum, r) => sum + r.ending, 0) / survivors.length : null, groups, expectedSinglePeriodReturn: .25, assumptions: { downProbability: .5, upProbability: .5, independentPeriods: true, transactionCosts: 0, inflation: 0, additionalIncome: 0 } };
}
export function pathsModel(input = {}) {
  const params = { ...pathDefaults, ...input }; if (![0, 30, 40].includes(params.withdrawal) || ![2, 4, 6].includes(params.periods)) throw new RangeError('Authored withdrawal and horizon required');
  const comparison = [{ id: 'down-first', label: '하락 먼저', returns: [-.5, 1] }, { id: 'up-first', label: '상승 먼저', returns: [1, -.5] }].map(c => ({ ...c, ...runPath(c.returns, params.withdrawal), stages: runPath(c.returns, params.withdrawal).stages.map(s => ({ ...s, fraction: s.amount === null ? null : s.amount / 200 })) }));
  const ensemble = enumeratePaths(params.periods, params.withdrawal), frames = comparison[0].stages.map((s, index) => ({ index, label: ['같은 처음100', '첫 수익률 적용', '첫 지출 뒤 남은 바탕', '다음 수익률의 다른 바탕', '지출 가능 여부와 첫 실패'][index], explanation: ['두 경로는 같은 두 수익률을 반대 순서로 겪습니다. 앞으로의 길이를 그린 것이 아니라 가정한 순서 비교입니다.', '같은100에서 시작해도 첫 배율 뒤50과200입니다. 아래 금액 눈금은 둘 다0–200입니다.', '수익 반영 뒤 같은 금액을 한 번만 냅니다. 다음 배율은 처음100이 아니라 남은 돈에 적용됩니다.', '중간 지출이 있으면 배율의 순서를 바꾼 결과가 달라집니다. 지출이0이면 두 배율의 곱은 같습니다.', '필요 지출에 못 미치면 지급 직전 중단합니다. 자동 차입·음수 잔액·부분 납부나 미래 회복으로 과거 실패를 지우지 않습니다.'][index] }));
  return { params, comparison, ensemble, amountAxis: [0, 200], thresholdFraction: params.withdrawal / 200, frames, verdict: params.withdrawal === 0 ? '중간 입출금이 없으면 두 순서 모두100입니다. 이것이 현실의 장기 위험이 사라진다는 뜻은 아닙니다.' : params.withdrawal === 30 ? '같은 두 수익률과 매번30 지출이어도 기말10/55입니다. 다음 배율을 적용할 바탕이 달랐습니다.' : '하락 먼저는2기 지출 직전20이 부족해 중단하며20을 보유합니다. 상승 먼저는40이 남습니다. 지출 실패와 자산0·법적 파산은 서로 다릅니다.' };
}

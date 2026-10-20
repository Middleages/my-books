export const conditionalDefaults = Object.freeze({ errors: 100, signal: 'standard' });
export const signalModes = Object.freeze({
  standard: Object.freeze({ label: '기본 알림', sensitivity: .9, falsePositive: .02 }),
  perfect: Object.freeze({ label: '완전 알림', sensitivity: 1, falsePositive: 0 }),
  uninformative: Object.freeze({ label: '구분 못 하는 알림', sensitivity: .02, falsePositive: .02 }),
  silent: Object.freeze({ label: '알림 없음', sensitivity: 0, falsePositive: 0 }),
});
export function naturalCounts(total, errors, sensitivity, falsePositive) {
  if (!Number.isSafeInteger(total) || total < 1 || !Number.isSafeInteger(errors) || errors < 0 || errors > total || [sensitivity, falsePositive].some(p => !Number.isFinite(p) || p < 0 || p > 1)) throw new RangeError('Finite whole counts and valid signal probabilities required');
  const normal = total - errors, tp = errors * sensitivity, fp = normal * falsePositive;
  if (!Number.isSafeInteger(tp) || !Number.isSafeInteger(fp)) throw new RangeError('Natural-frequency teaching cells must be integer counts');
  const fn = errors - tp, tn = normal - fp, alerted = tp + fp, silent = fn + tn;
  const fraction = (numerator, denominator, label) => ({ numerator, denominator, value: denominator ? numerator / denominator : null, label });
  return { total, errors, normal, tp, fn, fp, tn, alerted, silent, baseRate: errors / total,
    posterior: fraction(tp, alerted, '알림 중 실제 오류'), sensitivity: fraction(tp, errors, '실제 오류 중 알림'), falsePositive: fraction(fp, normal, '정상 중 알림'),
    cells: [ { id: 'tp', truth: '오류', alert: '알림', count: tp }, { id: 'fn', truth: '오류', alert: '없음', count: fn }, { id: 'fp', truth: '정상', alert: '알림', count: fp }, { id: 'tn', truth: '정상', alert: '없음', count: tn } ],
    alertedParts: [{ id: 'tp', label: '실제 오류', count: tp, fraction: alerted ? tp / alerted : null }, { id: 'fp', label: '실제 정상', count: fp, fraction: alerted ? fp / alerted : null }],
  };
}
export function conditionalModel(input = {}) {
  const params = { ...conditionalDefaults, ...input };
  if (![0, 100, 1000, 10000].includes(params.errors) || !Object.hasOwn(signalModes, params.signal)) throw new RangeError('Use supported natural-frequency conditions');
  const mode = signalModes[params.signal], counts = naturalCounts(10000, params.errors, mode.sensitivity, mode.falsePositive);
  const frames = [
    { label: '전체 청구서', explanation: `가상 청구서 ${counts.total.toLocaleString('ko-KR')}건을 같은 전체로 셉니다.`, denominator: counts.total, selected: ['tp', 'fn', 'fp', 'tn'] },
    { label: '실제 오류부터 나누기', explanation: `오류 ${counts.errors.toLocaleString('ko-KR')}건과 정상 ${counts.normal.toLocaleString('ko-KR')}건입니다.`, denominator: counts.total, selected: ['tp', 'fn', 'fp', 'tn'] },
    { label: '각 집단의 알림', explanation: `오류 중 ${counts.tp.toLocaleString('ko-KR')}건, 정상 중 ${counts.fp.toLocaleString('ko-KR')}건에 알림이 붙습니다.`, denominator: counts.total, selected: ['tp', 'fn', 'fp', 'tn'] },
    { label: '알림을 받은 것만 다시 세기', explanation: counts.alerted ? `알림 ${counts.alerted.toLocaleString('ko-KR')}건 중 오류는 ${counts.tp.toLocaleString('ko-KR')}건입니다. 분모는 전체도, 오류만도 아닙니다.` : '알림이 0건이므로 알림 중 오류의 비율은 정의되지 않습니다. 0%로 바꾸지 않습니다.', denominator: counts.alerted, selected: ['tp', 'fp'] },
  ].map((f, step) => ({ ...f, step }));
  return { params, dataKind: '자체 가상 건수 / 전체에서 동일 가능성으로 한 건 선택', mode, counts, frames, verdict: counts.alerted ? `오류 ${counts.tp.toLocaleString('ko-KR')}건 ÷ 알림 ${counts.alerted.toLocaleString('ko-KR')}건 = ${(counts.posterior.value * 100).toLocaleString('ko-KR', { maximumFractionDigits: 4 })}%.` : '알림 0건: 조건을 만족하는 분모가 없어 비율을 정의할 수 없습니다.' };
}

// Same-start fictional cohort; liquidation proceeds are kept as cash to the common endpoint.
const endpoints = Object.freeze([130, 120, 110, 105, 100, 95, 90, 80, 40, 30]);
export const selectionDefaults = Object.freeze({ filter: 'survivors', information: 'known' });
export function summarizeCohort(rows, filter = 'all', missingBounds = null) {
  if (!Array.isArray(rows) || !['all', 'survivors'].includes(filter)) throw new RangeError('Rows and a supported cohort filter required');
  if (rows.some(r => !Number.isFinite(r.initial) || r.initial <= 0 || !['active', 'closed', 'unconfirmed'].includes(r.status) || (r.ending !== null && (!Number.isFinite(r.ending) || r.ending < 0)))) throw new RangeError('Positive starts, nonnegative or unknown endpoints and explicit statuses required');
  if (missingBounds !== null && (!Array.isArray(missingBounds) || missingBounds.length !== 2 || missingBounds.some(v => !Number.isFinite(v) || v < 0) || missingBounds[0] > missingBounds[1])) throw new RangeError('Ordered nonnegative missing-endpoint bounds required');
  const included = rows.filter(r => filter === 'all' || r.status === 'active'), initial = included.reduce((s, r) => s + r.initial, 0), knownEnding = included.reduce((s, r) => s + (r.ending ?? 0), 0), missing = included.filter(r => r.ending === null).length;
  const ending = missing ? null : knownEnding, meanEnding = !included.length || ending === null ? null : ending / included.length, totalReturn = initial === 0 || ending === null ? null : (ending - initial) / initial;
  const bounds = initial > 0 && missing > 0 && missingBounds ? { lower: (knownEnding + missing * missingBounds[0] - initial) / initial, upper: (knownEnding + missing * missingBounds[1] - initial) / initial, missingCount: missing, assumedEndpointBounds: missingBounds.slice(), kind: 'assumption-sensitivity' } : null;
  return { count: included.length, initial, knownEnding, missing, ending, meanEnding, totalReturn, bounds };
}
export function selectionModel(input = {}) {
  const params = { ...selectionDefaults, ...input };
  if (!['all', 'survivors'].includes(params.filter) || !['known', 'bounded', 'unknown'].includes(params.information)) throw new RangeError('Supported filter and information condition required');
  const rows = endpoints.map((value, index) => { const closed = index >= 8, ending = closed && params.information !== 'known' ? null : value; return { id: `F${String(index + 1).padStart(2, '0')}`, initial: 100, status: closed ? 'closed' : 'active', ending, valueKind: closed ? '청산 회수 현금' : '계속 보유 평가액', included: params.filter === 'all' || !closed, endingFraction: ending === null ? null : ending / 150, initialFraction: 100 / 150 }; });
  const missingBounds = params.information === 'bounded' ? [0, 100] : null, all = summarizeCohort(rows, 'all', missingBounds), survivors = summarizeCohort(rows, 'survivors', missingBounds), selected = params.filter === 'all' ? all : survivors;
  const comparisons = [{ id: 'all', label: '최초 전체', ...all }, { id: 'survivors', label: '종점에 존속', ...survivors }].map(r => ({ ...r, zeroX: 2 / 3, x: r.totalReturn === null ? null : (r.totalReturn + 1) / 1.5, interval: r.bounds ? { lowerX: (r.bounds.lower + 1) / 1.5, upperX: (r.bounds.upper + 1) / 1.5 } : null }));
  const frames = [
    { label: '처음의 열 이름', explanation: '각각 100단위로 시작한 열 대상을 먼저 고정합니다. 현재 목록을 과거 출발 명부로 바꾸지 않습니다.', endpoint: false, selected: false, compare: false },
    { label: '존속과 종료로 갈라진 명부', explanation: '종점에는 여덟 대상이 존속하고 두 대상은 청산됐습니다. 종료된 이름도 과거 투자자의 기록에서 사라지지 않습니다.', endpoint: true, selected: false, compare: false },
    { label: '선택한 목록의 분모', explanation: '필터는 보고 있는 집단만 바꿉니다. 제외한 기록은 줄무늬와 제외 표시로 남기며, 빠진 금액을 0으로 채우지 않습니다.', endpoint: true, selected: true, compare: false },
    { label: '처음 전체와 남은 집단을 나란히', explanation: '같은 기간이어도 분모 10과 8은 다른 집단입니다. 미상 회수액의 범위는 추가 가정을 둘 때만 계산합니다.', endpoint: true, selected: true, compare: true },
  ];
  return { params, rows, all, survivors, selected, comparisons, counts: { initial: rows.length, active: rows.filter(r => r.status === 'active').length, closed: rows.filter(r => r.status === 'closed').length, unconfirmed: 0 }, axes: { amount: [0, 150], totalReturn: [-1, .5] }, missingBounds, frames,
    verdict: params.information === 'known' ? '전체는 −10%, 존속한 여덟 대상만의 평균은 +3.75%입니다. 집단 선택이 바뀐 차이이며 원래 손실이 사라진 것이 아닙니다.' : params.information === 'bounded' ? '전체 성과의 −17%~+3%는 두 미상 회수액을 각각 0~100으로 제한한 민감도 범위입니다. 신뢰구간이나 발생 확률이 아닙니다.' : '종료 대상의 회수액이 미상이고 범위 가정도 없습니다. 최초 전체의 성과는 이 자료로 확정할 수 없습니다.' };
}

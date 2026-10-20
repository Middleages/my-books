import { xoshiro128ss, teachingSeed } from './seeded.mjs';
// Same predeclared seed as earlier chapters. No search for an attractive held-out result.
export const validationDefaults = Object.freeze({ candidateCount: 100, relation: 'independent' });
export const validationWindows = Object.freeze({ train: Object.freeze([0, 24]), tune: Object.freeze([24, 36]), holdout: Object.freeze([36, 48]) });
export function noiseCandidates(relation = 'independent') {
  if (!['independent', 'identical'].includes(relation)) throw new RangeError('Declared candidate relationship required');
  const next = xoshiro128ss(teachingSeed), rows = Array.from({ length: 100 }, (_, index) => ({ id: `R${String(index + 1).padStart(3, '0')}`, index, values: Array.from({ length: 48 }, () => next() < 0x80000000 ? -2 : 2) }));
  return rows.map(r => ({ ...r, values: relation === 'identical' ? rows[0].values.slice() : r.values }));
}
export function windowMean(values, window) {
  const bounds = validationWindows[window];
  if (!bounds || !Array.isArray(values) || values.length !== 48 || values.some(v => !Number.isFinite(v))) throw new RangeError('48 finite values and an authored window required');
  return values.slice(...bounds).reduce((s, v) => s + v, 0) / (bounds[1] - bounds[0]);
}
export function selectCandidate(rows, rule = 'train') {
  if (!['train', 'tune'].includes(rule) || !Array.isArray(rows) || !rows.length || new Set(rows.map(r => r.id)).size !== rows.length) throw new RangeError('Distinct candidates and a pre-holdout selection rule required');
  return rows.map(r => ({ id: r.id, score: windowMean(r.values, rule) })).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id, 'en'))[0];
}
export function falseAlarmProbability(count, relation = 'independent', alpha = .05) {
  if (!Number.isInteger(count) || count < 0 || count > 10000 || !['independent', 'identical'].includes(relation) || !Number.isFinite(alpha) || alpha < 0 || alpha > 1) throw new RangeError('Nonnegative count and explicit relation/probability required');
  return count === 0 || alpha === 0 ? 0 : relation === 'identical' || alpha === 1 ? alpha : -Math.expm1(count * Math.log1p(-alpha));
}
export function informationTimeline(selectionDay = 24) {
  if (!Number.isInteger(selectionDay) || selectionDay < 0 || selectionDay > 30) throw new RangeError('Day0–30 required');
  const rows = [{ id: 'published', observedThrough: 23, releasedDay: 24, label: 'T23까지의 기록 · T24 공개' }, { id: 'late', observedThrough: 24, releasedDay: 25, label: 'T24까지의 기록 · T25 공개' }].map(r => ({ ...r, available: r.releasedDay <= selectionDay, observedX: r.observedThrough / 30, releasedX: r.releasedDay / 30 }));
  return { selectionDay, selectionX: selectionDay / 30, rows, axis: [0, 30] };
}
function validateParams(params) { if (![1, 10, 100].includes(params.candidateCount) || !['independent', 'identical'].includes(params.relation)) throw new RangeError('Authored candidate count and relationship required'); }
export function createValidationState(input = {}, previouslySeen = false) {
  const params = { ...validationDefaults, ...input }; validateParams(params);
  return { params, phase: 'selection', rule: 'train', lockedId: null, holdoutSeen: Boolean(previouslySeen), firstRevealAfterLock: false, history: [{ order: 1, action: 'start', text: `가상 후보 ${params.candidateCount}개 · 선택24/조정12/보류12 · 동률은ID순` }] };
}
export function validationTransition(state, action) {
  let next = { ...state, params: { ...state.params }, history: state.history.slice() }, text;
  if (action.type === 'conditions') { next.params = { ...next.params, ...action.params }; validateParams(next.params); next.phase = 'selection'; next.rule = 'train'; next.lockedId = null; next.firstRevealAfterLock = false; text = `조건 변경: 후보 ${next.params.candidateCount}개, ${next.params.relation === 'independent' ? '독립 잡음 가정' : '동일 기록 복제'}${state.holdoutSeen ? ' · 보류 자료는 이미 봄' : ''}`; }
  else if (action.type === 'adjust' && state.phase === 'selection') { next.phase = 'adjustment'; text = '조정 구간 공개: 이제 이 구간을 선택에 사용할 수 있음'; }
  else if (action.type === 'rule' && ['adjustment', 'revealed'].includes(state.phase) && ['train', 'tune'].includes(action.rule)) { next.rule = action.rule; next.phase = 'adjustment'; next.lockedId = null; next.firstRevealAfterLock = false; text = `선택 기준: ${action.rule === 'train' ? '처음24기간 평균' : '조정12기간 평균'}${state.holdoutSeen ? ' · 이미 본 보류 자료를 새 검증으로 부르지 않음' : ''}`; }
  else if (action.type === 'lock' && state.phase === 'adjustment') { next.phase = 'locked'; next.lockedId = selectCandidate(noiseCandidates(state.params.relation).slice(0, state.params.candidateCount), state.rule).id; text = `최종 후보 ${next.lockedId}와 ${state.rule === 'train' ? '선택24' : '조정12'} 기준 고정`; }
  else if (action.type === 'reveal' && state.phase === 'locked') { next.phase = 'revealed'; next.firstRevealAfterLock = !state.holdoutSeen; next.holdoutSeen = true; text = `${next.lockedId}의 보류12기간 공개${state.holdoutSeen ? ' · 같은 자료 재사용' : ' · 이 화면의 첫 공개'}`; }
  else if (action.type === 'reset') { const fresh = createValidationState({}, state.holdoutSeen); next = { ...fresh, history: state.history.slice() }; text = `같은 고정 자료로 다시 보기${state.holdoutSeen ? ' · 보류 열람 이력 유지' : ''}`; }
  else throw new RangeError('Action does not follow the selection → adjustment → lock → reveal protocol');
  next.history.push({ order: next.history.length + 1, action: action.type, text }); return next;
}
export function validationModel(state) {
  validateParams(state.params);
  const raw = noiseCandidates(state.params.relation).slice(0, state.params.candidateCount), tuningVisible = state.phase !== 'selection', revealed = state.phase === 'revealed', selected = selectCandidate(raw, state.rule), locked = state.lockedId ? raw.find(r => r.id === state.lockedId) : null;
  const rows = raw.map(r => ({ id: r.id, index: r.index, train: windowMean(r.values, 'train'), tune: tuningVisible ? windowMean(r.values, 'tune') : null, holdout: revealed ? windowMean(r.values, 'holdout') : null, selected: r.id === selected.id, x: (windowMean(r.values, 'train') + 2) / 4, values: r.values.map((value, index) => ({ period: index + 1, window: index < 24 ? 'train' : index < 36 ? 'tune' : 'holdout', value: index < 24 || (index < 36 && tuningVisible) || revealed ? value : null })) }));
  const selectedRow = rows.find(r => r.id === selected.id), initialWinner = selectCandidate(raw, 'train'), initialSelected = rows.find(r => r.id === initialWinner.id), ranks = new Map();
  const points = rows.map(r => { const key = r.train, stack = ranks.get(key) ?? 0; ranks.set(key, stack + 1); return { id: r.id, x: r.x, stack, selected: r.id === initialWinner.id, train: r.train }; });
  const bins = Array.from({ length: 25 }, (_, index) => { const score = -2 + index / 6, count = rows.filter(r => Math.abs(r.train - score) < 1e-12).length; return { index, score, count, fraction: count / 100, x: index / 24 }; });
  const frames = [{ label: '최초 후보 수를 먼저 남기기', explanation: '모든 후보의 참기대 초과수익은0인 잡음 모형입니다. 최고값만 남기기 전에 시도한 전체 후보 수를 기록합니다.', scores: false, selected: false }, { label: '같은 선택 구간의 평균 분포', explanation: '가로는 선택24기간의 산술평균 초과수익(%p), 세로는 해당 평균의 후보 수입니다. 누적 계좌 수익률이 아닙니다.', scores: true, selected: false }, { label: '고정 기준으로 한 후보 표시', explanation: '평균이 가장 큰 후보를 고르고, 동률이면ID가 앞선 후보를 고릅니다. 이 선택에는 조정·보류 구간을 쓰지 않았습니다.', scores: true, selected: true }, { label: '다음 자료를 보기 전 경계', explanation: '아래에서 조정 구간을 열고 최종 후보를 고정한 뒤 보류 구간을 공개합니다. 선택을 바꾼 기록과 이미 본 사실을 지우지 않습니다.', scores: true, selected: true }];
  return { state, rows, points, bins, initialSelected, selected: selectedRow, lockedId: locked?.id ?? null, tuningVisible, revealed, count: rows.length, uniqueRecords: state.params.relation === 'identical' ? 1 : rows.length, axis: { min: -2, max: 2, unit: '%p / 가상 기간', maxCount: 100 }, windows: validationWindows, frames, alarm: { count: rows.length, alpha: .05, relation: state.params.relation, probability: falseAlarmProbability(rows.length, state.params.relation) }, timeline: informationTimeline(),
    evaluationLabel: revealed ? state.firstRevealAfterLock ? '규칙 고정 뒤 이 화면에서 첫 공개 · 실제 시장 검증 아님' : '이미 본 고정 자료 재사용 · 새 독립 검증 아님' : state.holdoutSeen ? '가려도 이미 본 고정 자료 · 열람 이력 유지' : '아직 화면에서 가려 둔 보류 구간 · 독립성 보증 아님',
    verdict: '선택 구간의 최고값과 보류 구간의 결과는 다른 질문입니다. 좋은 보류 결과도 잡음 모형에서 나올 수 있으며, 한 번의 공개가 실력이나 미래 성과를 증명하지 않습니다.' };
}

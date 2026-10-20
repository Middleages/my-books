// All dates, amounts and outcomes are fictional teaching assumptions, not deadlines.
export const claimsDefaults = Object.freeze({ scenario: 'standard', startingCash: 1000000, day: 0 });
export const claimsAssumptions = Object.freeze({ expense: 3000000, requestedAmount: 2000000, incidentDay: 0, claimDay: 2, dueDay: 5, observationEnd: 20, moneyScale: 3000000 });
export const claimsScenarios = Object.freeze([
  Object.freeze({ id: 'standard', label: '기본 · 10일 전액 입금', decisionDay: 8, arrivalDay: 10, payableAmount: 2000000, branch: false, outcome: 'full', explanation: '가상 약관상 지급대상 200만원을 8일에 확인하고 10일에 받습니다. 납기 5일보다 입금이 늦습니다.' }),
  Object.freeze({ id: 'same-day', label: '비교 · 납기 5일에 입금', decisionDay: 4, arrivalDay: 5, payableAmount: 2000000, branch: false, outcome: 'full', explanation: '지급대상은 기본과 같고 입금만 5일로 앞당긴 비교입니다. 이 모형은 같은 날 입금을 먼저, 지출 납기를 다음으로 처리합니다.' }),
  Object.freeze({ id: 'delayed', label: '지연 · 추가 확인 뒤 18일 입금', decisionDay: 16, arrivalDay: 18, payableAmount: 2000000, branch: true, outcome: 'full', explanation: '이 가상 사례에만 추가서류와 조사가 필요하다고 정했습니다. 16일 결정, 18일 입금이며 모든 청구의 필수 경로가 아닙니다.' }),
  Object.freeze({ id: 'denied', label: '거절 · 지급 0원', decisionDay: 8, arrivalDay: null, payableAmount: 0, branch: false, outcome: 'denied', explanation: '이 별도 사례는 청구한 사건이 가상 계약의 제외조건에 해당하여 지급대상 0원으로 정했습니다. 이미 확정된 200만원을 임의로 없애는 사례가 아닙니다.' }),
  Object.freeze({ id: 'partial', label: '일부지급 · 10일 100만원', decisionDay: 8, arrivalDay: 10, payableAmount: 1000000, branch: false, outcome: 'partial', explanation: '이 별도 사례는 청구 200만원 중 가상 계약상 인정되는 부분을 100만원으로 정했습니다. 나머지 100만원의 후속 입금을 약속한 사례가 아닙니다.' }),
]);
function dayValue(value, name, maximum = 365) {
  if (!Number.isInteger(value) || value < 0 || value > maximum) throw new RangeError(`${name} must be an integer day within 0..${maximum}.`);
}
function moneyValue(value, name) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 1000000000000) throw new RangeError(`${name} must be a nonnegative integer amount in won, at most 1e12.`);
}
function objectValue(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Options must be an object.');
}

// Recompute from day zero. Receipt -> due obligation -> cash settlement, in that order.
// Unfunded expense is an unmet obligation, NOT an invented loan or negative cash.
export function simulateClaimCash(options = {}) {
  objectValue(options);
  const p = { startingCash: 1000000, expense: 3000000, dueDay: 5, receiptDay: 10, receiptAmount: 2000000, observationEnd: 20, ...options };
  moneyValue(p.startingCash, 'Starting cash'); moneyValue(p.expense, 'Expense'); moneyValue(p.receiptAmount, 'Receipt amount');
  dayValue(p.observationEnd, 'Observation end'); dayValue(p.dueDay, 'Due day', p.observationEnd);
  if (p.receiptDay !== null) dayValue(p.receiptDay, 'Receipt day', p.observationEnd);
  if (p.receiptDay === null && p.receiptAmount !== 0) throw new RangeError('A positive receipt requires a receipt day.');
  let availableCash = p.startingCash, receivedToDate = 0, paidToDate = 0, unfunded = 0, shortfallAtDue = null;
  return Array.from({ length: p.observationEnd + 1 }, (_, day) => {
    const receipt = day === p.receiptDay ? p.receiptAmount : 0;
    availableCash += receipt; receivedToDate += receipt;
    const cashBeforePayment = availableCash;
    const dueToday = day === p.dueDay;
    if (dueToday) { unfunded += p.expense; shortfallAtDue = Math.max(0, p.expense - availableCash); }
    const paidToday = Math.min(availableCash, unfunded);
    availableCash -= paidToday; unfunded -= paidToday; paidToDate += paidToday;
    return { day, receipt, receivedToDate, dueToday, dueOccurred: day >= p.dueDay, cashBeforePayment, paidToday, paidToDate, availableCash, unfunded, shortfallAtDue, notYetDue: day < p.dueDay ? p.expense : 0 };
  });
}

function processFor(scenario) {
  return [
    { id: 'claim', label: '청구', day: 2, symbol: '①', detail: '가상 사건과 청구자료를 제출합니다. 청구액은 지급 확정액이 아닙니다.' },
    { id: 'accept', label: '접수', day: 2, symbol: '②', detail: '이 사례에서는 같은 날 접수합니다. 접수 기록은 보관하되 지급 승인으로 읽지 않습니다.' },
    { id: 'review', label: '심사', day: 3, symbol: '③', detail: '사건·계약·자료를 대조합니다. 필요한 사례에만 추가서류나 조사가 생깁니다.' },
    { id: 'decision', label: scenario.outcome === 'denied' ? '거절 결정' : '지급 결정', day: scenario.decisionDay, symbol: '④', detail: scenario.outcome === 'denied' ? '가상 제외조건 때문에 지급대상 0원입니다. 입금 단계로 진행하지 않습니다.' : '지급대상과 금액을 확인했습니다. 결정만으로 현금이 늘어나지는 않습니다.' },
    { id: 'receipt', label: scenario.outcome === 'denied' ? '입금 없음' : '입금', day: scenario.arrivalDay, symbol: '⑤', detail: scenario.outcome === 'denied' ? '지급하지 않는 결말입니다. 지연 사례와 구별합니다.' : '도착한 금액만 현금에 더합니다. 납기가 지난 미충당 지출이 있으면 그 금액부터 충당합니다.' },
  ];
}
function phaseFor(day, scenario) {
  if (scenario.arrivalDay !== null && day >= scenario.arrivalDay) return 'receipt';
  if (day >= scenario.decisionDay) return 'decision';
  if (scenario.branch && day >= 9) return 'investigation';
  if (scenario.branch && day >= 6) return 'documents';
  if (day >= 3) return 'review';
  if (day >= 2) return 'accept';
  return 'incident';
}
const phaseLabels = { incident: '사고 발생 · 청구 전', accept: '청구 · 접수', review: '심사', documents: '추가서류 확인 · 이 사례의 분기', investigation: '사고조사 · 이 사례의 분기', decision: '결정 통지', receipt: '보험금 입금 후' };
const phaseDetails = {
  incident: '사고로 지출이 필요해졌지만 아직 납기 전입니다. 받을 것으로 생각하는 보험금을 현금에 더하지 않습니다.',
  accept: '청구와 접수를 마쳤습니다. 접수 사실만으로 지급 여부나 입금 날짜가 확정되지는 않습니다.',
  review: '가상 계약과 사건을 확인하는 중입니다. 납기와 심사 일정은 서로 다른 시간표입니다.',
  documents: '필요한 추가 자료를 확인하는 고정 사례입니다. 자료 요청 자체가 지급 승인이나 거절을 뜻하지 않습니다.',
  investigation: '이 사례에 필요한 조사 분기를 거칩니다. 이 과정의 길이는 실제 조사기간을 예측한 값이 아닙니다.',
  decision: '지급 여부와 금액을 결정했어도 입금 전에는 그 돈을 사용할 수 없습니다. 거절 사례에는 입금이 없습니다.',
  receipt: '실제 도착한 돈만 반영했습니다. 미충당 지출을 나중에 해결해도 납기 당시 부족했던 기록은 남습니다.',
};
function linePath(points, valueKey, geometry, history = false) {
  const filtered = history ? points.filter(row => row[valueKey] !== null) : points;
  return filtered.map((row, index) => `${index ? 'H' : 'M'}${geometry.x(row.day)}${index ? `V${geometry.y(row[valueKey])}` : `,${geometry.y(row[valueKey])}`}`).join(' ');
}

export function projectClaims(options = {}) {
  objectValue(options);
  const params = { ...claimsDefaults, ...options };
  const scenario = claimsScenarios.find(item => item.id === params.scenario);
  if (!scenario) throw new RangeError('Unknown fixed claims scenario.');
  moneyValue(params.startingCash, 'Starting cash');
  if (params.startingCash > claimsAssumptions.moneyScale) throw new RangeError('Starting cash must remain within the common 0..3000000-won scale.');
  dayValue(params.day, 'Selected day', claimsAssumptions.observationEnd);
  const a = claimsAssumptions;
  const rows = simulateClaimCash({ startingCash: params.startingCash, expense: a.expense, dueDay: a.dueDay, receiptDay: scenario.arrivalDay, receiptAmount: scenario.payableAmount, observationEnd: a.observationEnd });
  const processes = processFor(scenario);
  const geometry = { x: day => 54 + day / a.observationEnd * 508, y: amount => 204 - amount / a.moneyScale * 174 };
  const frames = rows.map(row => {
    const phase = phaseFor(row.day, scenario);
    const process = processes.map(item => ({ ...item, status: item.day === null ? 'unavailable' : row.day < item.day ? 'future' : item.id === 'review' && row.day < scenario.decisionDay ? 'active' : row.day === item.day ? 'active' : 'done' }));
    const branch = [
      { id: 'documents', day: 6, label: '추가서류 확인' },
      { id: 'investigation', day: 9, label: '사고조사' },
    ].map(item => ({ ...item, enabled: scenario.branch, status: !scenario.branch ? 'not-needed' : row.day < item.day ? 'future' : row.day < scenario.decisionDay ? 'active' : 'done' }));
    return {
      ...row, index: row.day, phase, label: `${row.day}일 · ${phaseLabels[phase]}`, detail: phaseDetails[phase],
      timeFraction: row.day / a.observationEnd,
      process, branch,
      requestedAmount: a.requestedAmount,
      confirmedAmount: row.day >= scenario.decisionDay ? scenario.payableAmount : null,
      expectedReceipt: scenario.arrivalDay !== null && row.day < scenario.arrivalDay ? scenario.payableAmount : 0,
      cashFraction: row.availableCash / a.moneyScale,
      dueSegments: [
        { id: 'paid', label: '충당한 지출', amount: row.paidToDate, startFraction: 0, fraction: row.paidToDate / a.moneyScale },
        { id: 'unfunded', label: '아직 미충당', amount: row.unfunded, startFraction: row.paidToDate / a.moneyScale, fraction: row.unfunded / a.moneyScale },
        { id: 'not-due', label: '납기 전 지출', amount: row.notYetDue, startFraction: 0, fraction: row.notYetDue / a.moneyScale },
      ],
      historyFraction: (row.shortfallAtDue ?? 0) / a.moneyScale,
      cashPoint: { x: geometry.x(row.day), y: geometry.y(row.availableCash) },
      unfundedPoint: { x: geometry.x(row.day), y: geometry.y(row.unfunded) },
      historyPoint: row.shortfallAtDue === null ? null : { x: geometry.x(row.day), y: geometry.y(row.shortfallAtDue) },
    };
  });
  const events = [
    { id: 'incident', label: '사고', day: a.incidentDay, lane: 'event' },
    { id: 'claim', label: '청구·접수', day: a.claimDay, lane: 'process' },
    { id: 'due', label: '지출 납기', day: a.dueDay, lane: 'expense' },
    { id: 'decision', label: '결정', day: scenario.decisionDay, lane: 'process' },
    ...(scenario.arrivalDay === null ? [] : [{ id: 'receipt', label: '입금', day: scenario.arrivalDay, lane: 'cash' }]),
  ].map(event => ({ ...event, fraction: event.day / a.observationEnd }));
  const checkpointDays = [...new Set([0, a.claimDay, 3, a.dueDay, scenario.decisionDay, ...(scenario.branch ? [6, 9] : []), ...(scenario.arrivalDay === null ? [] : [scenario.arrivalDay]), a.observationEnd])].sort((x, y) => x - y);
  return {
    params, assumptions: a, scenario, frames, frame: frames[params.day], final: frames[a.observationEnd], due: frames[a.dueDay],
    checkpoints: checkpointDays.map(day => frames[day]), events,
    timelineEvents: [...events].sort((left, right) => left.day - right.day || (left.id === 'receipt' ? -1 : right.id === 'receipt' ? 1 : 0)),
    moneyScale: a.moneyScale, observationEnd: a.observationEnd,
    prediction: frames[a.dueDay].shortfallAtDue > 0 ? 'shortfall' : 'enough',
    chart: {
      viewBox: '0 0 600 244',
      cashPath: linePath(frames, 'availableCash', geometry),
      unfundedPath: linePath(frames, 'unfunded', geometry),
      historyPath: linePath(frames, 'shortfallAtDue', geometry, true),
      xTicks: [0, 5, 10, 15, 20].map(day => ({ day, x: geometry.x(day) })),
      yTicks: [0, 1000000, 2000000, 3000000].map(amount => ({ amount, y: geometry.y(amount) })),
      dueX: geometry.x(a.dueDay),
      receiptX: scenario.arrivalDay === null ? null : geometry.x(scenario.arrivalDay),
    },
  };
}

// Fictional evidence-reading and allocation models, NOT Korean title/priority adjudication.
export const contractCases = {
  matched: { label: '자료의 표시가 일치', address: '가상길 10 · 201호', signer: '가상 소유자 가', authority: '소유자 표시와 본인 확인 자료 일치', later: '새 등기 기재 없음', note: '보여 준 자료 사이의 일치일 뿐, 숨은 권리·세금·다른 임차인·반환 능력까지 확인한 것은 아닙니다.' },
  address: { label: '주소가 다른 자료', address: '가상길 10 · 202호', signer: '가상 소유자 가', authority: '소유자 표시와 본인 확인 자료 일치', later: '새 등기 기재 없음', note: '계약의 201호와 제시 자료의 202호가 다릅니다. 같은 건물처럼 보여도 목적물이 일치하는 근거를 다시 확인해야 합니다.' },
  authority: { label: '대리 권한 미확인', address: '가상길 10 · 201호', signer: '대리인이라고 말하는 나', authority: '위임 범위·진위 확인 자료 미제시', later: '새 등기 기재 없음', note: '소유자 이름을 알아도 계약 상대의 임대 권한이 입증되는 것은 아닙니다. 신탁·대리 등은 권한과 허용 범위를 별도로 확인합니다.' },
  changed: { label: '잔금 전 새 권리 기재', address: '가상길 10 · 201호', signer: '가상 소유자 가', authority: '소유자 표시와 본인 확인 자료 일치', later: '가상 담보권 기재 추가', note: '처음 읽은 자료와 잔금 직전 자료가 다릅니다. 새 권리의 내용·순위·금액을 다시 확인해야 하며 여기서는 배당 순위를 판정하지 않습니다.' },
};
export function contractFrames(caseId = 'matched') {
  if (!Object.hasOwn(contractCases, caseId)) throw new RangeError('unknown contract case');
  const scenario = contractCases[caseId];
  return [0, 1, 2, 3].map(step => ({
    step, scenario,
    evidenceVisible: step >= 1,
    rechecked: step >= 2,
    addressMatch: step < 1 ? null : scenario.address === '가상길 10 · 201호',
    authorityShown: step < 1 ? null : caseId !== 'authority',
    newEntry: step < 2 ? null : caseId === 'changed',
    // Fixed dates are observations of a teaching example, never a legal result.
    events: [
      { day: 0, label: '계약 서명', visible: true },
      { day: 0, label: '확정일자 부여 가정', visible: step >= 1 },
      { day: 30, label: '주택 인도·전입신고 완료 가정', visible: step >= 3 },
      { day: 31, label: '다음 날 · 일반 규정 읽기', visible: step >= 3 },
    ],
    legalDecision: null,
  }));
}
function money(n, name) {
  if (!Number.isFinite(n) || n < 0 || n > 1e10) throw new RangeError(name);
  return n;
}
export function allocateRecovery({ proceeds = 160e6, prior = 50e6, claim = 140e6 } = {}) {
  money(proceeds, 'proceeds'); money(prior, 'prior'); money(claim, 'claim');
  const first = Math.min(proceeds, prior);
  const tenant = Math.min(claim, proceeds - first);
  return { proceeds, prior, claim, first, tenant, unused: proceeds - first - tenant, unrecovered: claim - tenant };
}
export const recoveryDays = [0, 10, 30, 60, 120];
export function recoveryFrames({ proceeds = 160e6, prior = 50e6, claim = 140e6, guarantee = 'unknown', arrivalDay = 60, debt = 20e6 } = {}) {
  const a = allocateRecovery({ proceeds, prior, claim });
  money(debt, 'debt');
  if (!['none', 'unknown', 'assumed'].includes(guarantee)) throw new RangeError('guarantee');
  if (![60, 120].includes(arrivalDay)) throw new RangeError('arrivalDay');
  return recoveryDays.map((day, step) => {
    const landlordCash = day >= 10 ? a.tenant : 0;
    // "assumed" expressly supplies eligibility AND full gap coverage; no institutional rules.
    const guaranteeCash = guarantee === 'assumed' && day >= arrivalDay ? a.unrecovered : 0;
    const totalCash = landlordCash + guaranteeCash;
    // institutionClaim records paid-gap recovery correspondence only, NOT assignment timing.
    // Actual assignments may precede issue/claim/payment; this is a cash-oriented teaching ledger.
    return { ...a, day, step, guarantee, arrivalDay, landlordCash, guaranteeCash, totalCash, remainingClaim: claim - totalCash, institutionClaim: guaranteeCash, debt,
      guaranteeStatus: guarantee === 'assumed' && a.unrecovered === 0 ? '추가 보증 지급액 없음 · 배분으로 전액 회수 가능' : guarantee === 'none' ? '반환보증 없음' : guarantee === 'unknown' ? '가입·이행 조건 미확인' : day < 30 ? '가입·이행 적격을 가정 · 아직 지급 전' : day < arrivalDay ? '가상 지급 결정 · 아직 입금 전' : '가상 지급액 도착',
    };
  });
}

// Educational transactions in KRW. Not contract execution, approval, or a quote.
const valid = (n, name, max = 1e10) => {
  if (!Number.isFinite(n) || n < 0 || n > max) throw new RangeError(name);
  return n;
};
export const housingModes = [
  { id: 'rent', label: '월세', payment: 20_000_000, loan: 0, fee: 1_000_000 },
  { id: 'jeonse', label: '전세', payment: 140_000_000, loan: 20_000_000, fee: 1_000_000 },
  { id: 'buy', label: '매수', payment: 200_000_000, loan: 80_000_000, fee: 5_000_000 },
];
export function rightsFrames(mode = 'rent', withFee = false) {
  const option = housingModes.find(x => x.id === mode);
  if (!option) throw new RangeError('mode');
  const { payment, loan } = option, fee = withFee ? option.fee : 0;
  const states = [
    { label: '거래 전', cash: 150_000_000, debt: 0, claim: 0, home: 0, expense: 0, route: 'none', detail: '같은 시작 현금 1억 5,000만원입니다. 점선은 앞으로 생길 관계이며 이미 완료된 거래가 아닙니다.' },
    { label: '차입', cash: 150_000_000 + loan, debt: loan, claim: 0, home: 0, expense: 0, route: 'loan', detail: loan ? '은행에서 받은 현금과 갚을 채무가 같은 금액 늘어납니다. 대출은 새 소득이 아닙니다.' : '이 월세 사례에는 차입이 없습니다. 현금과 부채가 그대로입니다.' },
    { label: mode === 'buy' ? '집과 대금 교환' : '보증금과 반환청구권', cash: 150_000_000 + loan - payment, debt: loan, claim: mode === 'buy' ? 0 : payment, home: mode === 'buy' ? payment : 0, expense: 0, route: 'exchange', detail: mode === 'buy' ? '매도인에게 대금을 보내고 집을 보유합니다. 은행은 소유 지분이 아니라 별도의 담보권을 가질 수 있습니다.' : '현금은 임대인에게 갑니다. 민지에게 남는 것은 그 현금 금고가 아니라 계약에 따른 보증금 반환청구권입니다.' },
    { label: '비회수성 초기비용', cash: 150_000_000 + loan - payment - fee, debt: loan, claim: mode === 'buy' ? 0 : payment, home: mode === 'buy' ? payment : 0, expense: fee, route: 'fee', detail: fee ? '가상 초기비용을 지출하면 자산과 순자산이 그만큼 줄어듭니다. 실제 세율·보수 요율이 아닙니다.' : '비용을 제외한 교환만 보면 순자산은 보존됩니다. 현실의 거래비용·이자·월세가 없다는 뜻은 아닙니다.' },
  ];
  return { ...option, fee, states: states.map(s => ({ ...s, netWorth: s.cash + s.claim + s.home - s.debt })) };
}
export function rentComparison({ depositB = 60_000_000, rentB = 500_000, loanShare = 0, loanRate = .04, opportunityRate = .03, available = 150_000_000 } = {}) {
  [depositB, rentB, available].forEach((n, i) => valid(n, ['depositB', 'rentB', 'available'][i]));
  valid(loanShare, 'loanShare', 1); valid(loanRate, 'loanRate', 1); valid(opportunityRate, 'opportunityRate', 1);
  const depositA = 20_000_000, rentA = 700_000;
  const additional = depositB - depositA, rentSaving = rentA - rentB;
  const financed = Math.max(0, additional) * loanShare;
  const ownAdditional = Math.max(0, additional) - financed;
  const monthlyInterest = financed * loanRate / 12;
  const monthlyOpportunity = ownAdditional * opportunityRate / 12;
  const annualizedOffer = additional > 0 ? rentSaving * 12 / additional : null;
  return { depositA, rentA, depositB, rentB, additional, rentSaving, financed, ownAdditional,
    monthlyInterest, monthlyOpportunity, annualizedOffer,
    monthlyCashSaving: rentSaving - monthlyInterest,
    monthlyEconomicDifference: additional < 0 ? null : rentSaving - monthlyInterest - monthlyOpportunity,
    requiredA: depositA, requiredB: depositB - financed,
    shortageA: Math.max(0, depositA - available), shortageB: Math.max(0, depositB - financed - available),
    rateReason: additional === 0 ? '보증금 차이가 0이므로 나눌 수 없습니다.' : additional < 0 ? 'B의 보증금이 더 작습니다. 추가 보증금 비교율 대신 두 항목을 각각 읽으세요.' : rentSaving < 0 ? '보증금도 월세도 증가한 제안입니다. 음수 비교율을 이익으로 읽지 마세요.' : '가상 제안의 단순 연 환산 차이입니다. 법정 전환율·투자수익률이 아닙니다.' };
}

// Contract-only cash timeline. Borrowing, fees and default are deliberately separate.
export function rentalTimeline({deposit = 20_000_000, rent = 700_000, months = 24} = {}) {
  valid(deposit,'deposit'); valid(rent,'rent'); valid(months,'months',120);
  if(!Number.isInteger(months) || months<1) throw new RangeError('months');
  const totalRent=rent*months;
  return [
    {label:'계약 전',paid:0,claim:0,refund:0,rentExpense:0},
    {label:'시작 · 보증금 지급',paid:deposit,claim:deposit,refund:0,rentExpense:0},
    {label:`1–${months}개월 · 월세 누적`,paid:deposit+totalRent,claim:deposit,refund:0,rentExpense:totalRent},
    {label:`${months}개월 말 · 전액 반환 가정`,paid:deposit+totalRent,claim:0,refund:deposit,rentExpense:totalRent},
  ].map(s=>({...s,netOut:s.paid-s.refund}));
}

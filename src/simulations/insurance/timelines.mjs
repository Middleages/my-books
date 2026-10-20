// Fictional annual contracts. Year t is the instant just AFTER the scheduled
// payment at the start of year t. Coverage intervals exclude their end point.
// The renewal-price table is authored data, not a forecast or a pricing model.
export const timelinesDefaults = Object.freeze({ stopRenewalYear: null });
export const timelinesTerms = Object.freeze({
  observationEnd: 12,
  fixedPaymentYears: 5,
  fixedCoverageEnd: 10,
  fixedAnnualPremium: 100000,
  renewalInterval: 2,
  renewalCoverageEnd: 10,
  renewalAnnualPremiums: Object.freeze([120000, 140000, 170000, 200000, 240000]),
});

function normalize(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Options must be an object.');
  const params = { ...timelinesDefaults, ...options };
  if (params.stopRenewalYear !== null && ![2, 4, 6, 8].includes(params.stopRenewalYear)) {
    throw new RangeError('stopRenewalYear must be null or an exact renewal boundary: 2, 4, 6, 8.');
  }
  return params;
}

function payment(year, amount) {
  return { year, amount, position: year / 12, heightFraction: amount / 240000 };
}

function contractAt(contract, year) {
  const paid = contract.payments.filter(item => item.year <= year);
  const premium = contract.payments.find(item => item.year === year)?.amount ?? 0;
  const covered = year >= contract.coverage.start && year < contract.coverage.end;
  const paymentStatus = contract.id === 'fixed'
    ? year < 4 ? '납입 중' : year === 4 ? '마지막 납입' : '납입 완료'
    : covered ? '연납 유지' : contract.coverage.end < 10 ? '갱신 중단' : '계약 종료';
  return {
    id: contract.id,
    premium,
    cumulativePremium: paid.reduce((total, item) => total + item.amount, 0),
    paidCount: paid.length,
    covered,
    paymentStatus,
    coverageStatus: covered ? '기간 안 · 사건 조건은 별도' : '기간 밖 · 새 사건 보장 없음',
    paymentPeriodEnded: year >= contract.paymentPeriodEnd,
  };
}

function renewalAt(year, stopYear) {
  if (year === 0) return { state: 'initial', label: '최초 계약 시작 · 갱신 아님' };
  if (stopYear !== null && year >= stopYear) return {
    state: year === stopYear ? 'stopped' : 'inactive',
    label: year === stopYear ? `${year}년 갱신하지 않음` : `${stopYear}년 중단 이후`,
  };
  if (year >= 10) return { state: 'ended', label: '10년 종료 · 추가 갱신 없음' };
  if (year % 2 === 0) return { state: 'renewed', label: `${year}년 갱신 · 새 2년 구간` };
  return { state: 'continuing', label: '갱신 사이의 연납 시점' };
}

export function projectTimelines(options = {}) {
  const params = normalize(options);
  const end = params.stopRenewalYear ?? 10;
  const fixedPayments = Array.from({ length: 5 }, (_, year) => payment(year, 100000));
  const renewingPayments = Array.from({ length: end }, (_, year) => payment(year, timelinesTerms.renewalAnnualPremiums[Math.floor(year / 2)]));
  const contracts = [
    {
      id: 'fixed', label: 'A · 5년 납입, 10년 보장', payments: fixedPayments,
      paymentPeriodEnd: 5, coverage: { start: 0, end: 10, position: 0, fraction: 10 / 12 },
      totalPremium: fixedPayments.reduce((sum, item) => sum + item.amount, 0),
    },
    {
      id: 'renewing', label: 'B · 2년마다 갱신', payments: renewingPayments,
      paymentPeriodEnd: end, coverage: { start: 0, end, position: 0, fraction: end / 12 },
      totalPremium: renewingPayments.reduce((sum, item) => sum + item.amount, 0),
    },
  ];
  const periods = timelinesTerms.renewalAnnualPremiums.map((annualPremium, index) => ({
    index, start: index * 2, end: index * 2 + 2, annualPremium,
    position: index * 2 / 12, fraction: 2 / 12, active: index * 2 < end,
  }));
  const renewals = [2, 4, 6, 8].map(year => ({
    year, position: year / 12,
    state: year < end ? 'renewed' : year === params.stopRenewalYear ? 'stopped' : 'inactive',
  }));
  const frames = Array.from({ length: 13 }, (_, year) => {
    const [fixed, renewing] = contracts.map(contract => contractAt(contract, year));
    const renewal = renewalAt(year, params.stopRenewalYear);
    let detail;
    if (year === 0) detail = '가입 시점의 첫 보험료를 이미 냈습니다. 경과 0년의 누적보험료가 0원이 아닌 이유입니다.';
    else if (year >= 10) detail = params.stopRenewalYear === null
      ? '10년 경계부터 두 계약 모두 새 사건의 보장기간 밖입니다. 누적 납입 기록은 남지만, 이 예시에서는 납입도 갱신도 더 하지 않습니다.'
      : `A는 10년에, B는 앞선 ${params.stopRenewalYear}년에 보장기간이 끝났습니다. 지금은 둘 다 새 사건의 보장기간 밖이며 납입·갱신도 없습니다. 과거 납입 기록은 그대로 남습니다.`;
    else if (params.stopRenewalYear !== null && year >= params.stopRenewalYear) detail = `B는 ${params.stopRenewalYear}년 경계에서 갱신하지 않아 그 시점부터 보험료와 새 사건의 보장이 모두 없습니다. A의 납입·보장 시간표는 바뀌지 않습니다.`;
    else if (year === 5) detail = 'A는 5년 납입기간이 끝났지만 보장은 10년 직전까지 이어집니다. B는 4년 갱신구간의 두 번째 보험료를 내는 해이며, 올해가 갱신일은 아닙니다.';
    else if (year === 4) detail = 'A는 다섯 번째이자 마지막 보험료를 냈습니다. B는 4년 경계에서 갱신하고, 연 17만원 구간의 첫 보험료를 냈습니다.';
    else if (year > 5) detail = 'A의 올해 납입액은 0원이지만 아직 보장기간 안입니다. B는 계속 갱신한다는 가정에서 해당 연도 보험료를 냅니다.';
    else detail = '매년 시작에 그해의 보험료를 냅니다. B의 갱신은 2년마다지만, 보험료는 갱신 사이의 해에도 한 번씩 냅니다.';
    return { index: year, phase: `year-${year}`, year, position: year / 12, label: `${year}년 시점 · 그해 예정 납입 직후`, detail, fixed, renewing, renewal };
  });
  return {
    params,
    axis: { start: 0, end: 12, unit: '경과년', premiumMax: 240000, ticks: [0, 2, 4, 6, 8, 10, 12].map(year => ({ year, position: year / 12 })) },
    contracts, periods, renewals, frames,
    boundaries: [
      { id: 'payment-end', year: 5, position: 5 / 12, label: 'A 납입기간 종료' },
      { id: 'coverage-end', year: 10, position: 10 / 12, label: 'A 종료 · B는 갱신 유지 시 종료' },
    ],
    comparison: { year: 5, fixedCovered: frames[5].fixed.covered, fixedPremium: frames[5].fixed.premium, renewingCovered: frames[5].renewing.covered, answer: 'coverage-continues' },
  };
}

export function timelineBoundaryCases(options = {}) {
  const result = projectTimelines(options);
  return [0, 1, 2, 4, 5, 8, 9, 10, 12].map(year => result.frames[year]);
}

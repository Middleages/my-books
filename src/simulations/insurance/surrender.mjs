// FICTIONAL contract. Quotes are provided directly, never inferred from premiums.
// Each quote is measured immediately AFTER that year's scheduled premium is paid.
// Year 10 is a separate maturity event, not a surrender quote.
export const surrenderDefaults = Object.freeze({ exitYear: 0 });
export const surrenderContract = Object.freeze({
  annualPremium: 100000,
  paymentYears: Object.freeze([0, 1, 2, 3, 4]),
  coverageEnd: 10,
  observationEnd: 12,
  maturityBenefit: 0,
  moneyScale: 500000,
});
export const surrenderSchedule = Object.freeze([0, 20000, 50000, 90000, 140000, 200000, 220000, 240000, 260000, 280000]);

function integerYear(value, maximum, name) {
  if (!Number.isInteger(value) || value < 0 || value > maximum) {
    throw new RangeError(`${name} must be an integer within 0..${maximum}; no interpolation or extrapolation is available.`);
  }
}
export function surrenderQuote(year) {
  integerYear(year, 9, 'Surrender year');
  return surrenderSchedule[year];
}

function makeFrame(exitYear) {
  const c = surrenderContract;
  const kind = exitYear === c.coverageEnd ? 'maturity' : 'surrender';
  const paymentEvents = c.paymentYears.map(year => ({
    year,
    amount: year <= exitYear ? c.annualPremium : 0,
    paid: year <= exitYear,
    timeFraction: year / c.observationEnd,
    moneyFraction: year <= exitYear ? c.annualPremium / c.moneyScale : 0,
  }));
  const paidEvents = paymentEvents.filter(event => event.paid);
  const remainingScheduledPremium = paymentEvents.filter(event => !event.paid).length * c.annualPremium;
  const cumulativePremium = paidEvents.reduce((total, event) => total + event.amount, 0);
  const surrenderValue = kind === 'surrender' ? surrenderQuote(exitYear) : null;
  const maturityValue = kind === 'maturity' ? c.maturityBenefit : null;
  const exitValue = kind === 'surrender' ? surrenderValue : maturityValue;
  const difference = cumulativePremium - exitValue;
  const coverageSegments = [
    { id: 'covered', label: '해지 또는 만기 전 보장 구간', start: 0, end: exitYear },
    { id: 'canceled', label: '해지 때문에 사라진 새 사건의 보장', start: exitYear, end: c.coverageEnd },
    { id: 'outside', label: '원래 보장기간 밖', start: c.coverageEnd, end: c.observationEnd },
  ].map(segment => ({ ...segment, startFraction: segment.start / c.observationEnd, fraction: (segment.end - segment.start) / c.observationEnd }));
  const timeline = Array.from({ length: c.observationEnd }, (_, year) => {
    const paymentEvent = paymentEvents.find(event => event.year === year);
    return {
      year,
      endYear: year + 1,
      scheduledPremium: paymentEvent ? c.annualPremium : 0,
      paidPremium: paymentEvent?.amount ?? 0,
      newEventCovered: year < exitYear,
      coverageStatus: year < exitYear ? 'covered' : year < c.coverageEnd ? 'canceled' : 'outside',
      exitHere: year === exitYear,
      cashAtExit: year === exitYear ? exitValue : 0,
    };
  });
  return {
    index: exitYear,
    phase: `${kind}-${exitYear}`,
    exitYear,
    kind,
    label: kind === 'surrender' ? `${exitYear}년 시점 · 예정 납입 직후 해지` : '10년 시점 · 보장 종료 후 만기',
    paymentCount: paidEvents.length,
    remainingScheduledPremium,
    cumulativePremium,
    surrenderValue,
    maturityValue,
    exitValue,
    difference,
    returnRatio: exitValue / cumulativePremium,
    comparison: exitValue < cumulativePremium ? 'less' : exitValue === cumulativePremium ? 'same' : 'more',
    paidFraction: cumulativePremium / c.moneyScale,
    exitFraction: exitValue / c.moneyScale,
    differenceFraction: difference / c.moneyScale,
    exitTimeFraction: exitYear / c.observationEnd,
    coverageEnd: exitYear,
    coverageAfterExit: false,
    paymentEvents,
    coverageSegments,
    timeline,
    detail: kind === 'surrender'
      ? `${exitYear}년의 예정 납입이 있으면 먼저 낸 뒤 해지합니다. 이후 새 사건은 이 계약의 보장 구간 밖입니다. ${remainingScheduledPremium > 0 ? '아직 남아 있던 예정 납입도 중단됩니다.' : '납입은 이미 끝나 더 줄어드는 보험료는 없습니다.'}`
      : '해지하지 않고 10년까지 유지한 별도 사례입니다. 보장기간이 끝났고 이 가상 계약의 만기보험금은 0원입니다. 해약환급금 표를 10년으로 연장한 값이 아닙니다.',
  };
}

export function projectSurrender(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Options must be an object.');
  const params = { ...surrenderDefaults, ...options };
  integerYear(params.exitYear, 10, 'Exit year');
  const frames = Array.from({ length: 11 }, (_, year) => makeFrame(year));
  return {
    params,
    moneyScale: surrenderContract.moneyScale,
    observationEnd: surrenderContract.observationEnd,
    scheduledCoverageEnd: surrenderContract.coverageEnd,
    frames,
    frame: frames[params.exitYear],
    quotes: frames.filter(frame => frame.kind === 'surrender'),
    maturity: frames[10],
  };
}

// 가상의 같은 종류 보통주와, 그 회사와 별개인 유한 주당 현금흐름.
// 그림의 분할 수·막대 길이·관찰 단계·판정은 이 모델의 값만 사용한다.
export const shareValuationDefaults = Object.freeze({ price: 100, shares: 1000, earnings: 10000, splitFactor: 2 });
export const cashFlowValuationDefaults = Object.freeze({ annualCash: 10, residualCash: 80, ratePercent: 10 });

function finiteRange(value, min, max, label) {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`${label}: ${min}–${max} 범위의 유한한 숫자가 필요합니다.`);
}
const direction = value => value > 0 ? 'up' : value < 0 ? 'down' : 'same';

export function shareValuationFrames(options = {}) {
  const input = { ...shareValuationDefaults, ...options };
  finiteRange(input.price, 0, 1000000, '주당 가격');
  finiteRange(input.shares, 0, 1000000000, '발행 주식 수');
  finiteRange(input.earnings, -1000000000, 1000000000, '당기 이익');
  if (!Number.isInteger(input.shares)) throw new RangeError('발행 주식 수는 정수여야 합니다.');
  if (![1, 2, 5].includes(input.splitFactor)) throw new RangeError('분할 배수는 1·2·5 중 하나여야 합니다.');
  const snapshot = factor => {
    const price = input.price / factor, shares = input.shares * factor;
    const marketCap = input.price * input.shares;
    const eps = shares === 0 ? null : input.earnings / shares;
    const per = eps === null || eps === 0 ? null : price === 0 ? 0 : price / eps;
    const perStatus = shares === 0 ? 'no-shares' : eps === 0 ? 'zero-earnings' : eps < 0 ? 'loss' : 'positive';
    const perExplanation = perStatus === 'no-shares'
      ? '발행 주식이 0이면 주당이익을 정의할 수 없어 PER도 정의할 수 없습니다.'
      : perStatus === 'zero-earnings'
        ? 'EPS가 0이므로 0으로 나눌 수 없습니다. PER은 0배가 아니라 정의 불가입니다.'
        : perStatus === 'loss'
          ? '손실이면 산술 PER은 음수일 수 있습니다. 이를 양의 PER보다 낮아서 싸다는 뜻으로 비교할 수 없습니다.'
          : '양의 PER도 이익의 지속성·성장·위험이 다른 회사를 싸고 비싸다고 자동 판정하지 못합니다.';
    const tileCount = shares === 0 ? 0 : 10 * factor;
    const gridColumns = 10, gridRows = factor;
    const tiles = Array.from({ length: tileCount }, (_, index) => ({
      id: index, shares: shares / tileCount, marketValue: marketCap / tileCount,
      fraction: 1 / tileCount,
    }));
    return { factor, price, shares, marketCap, earnings: input.earnings, eps, per, perStatus, perExplanation,
      gridColumns, gridRows, tiles, sharesPerTile: tileCount === 0 ? 0 : shares / tileCount,
      totalFraction: shares === 0 ? 0 : 1 };
  };
  const before = snapshot(1), after = snapshot(input.splitFactor);
  const phases = [
    { phase: 'before', label: '분할 전 · 전체와 한 주', factor: 1,
      message: '주당 가격에 전체 발행 주식 수를 곱한 것이 시가총액입니다. 한 주의 가격과 전체 주식의 시장가치를 구분하세요.' },
    { phase: 'split', label: '분할 후 · 조각 수 변경', factor: input.splitFactor,
      message: input.splitFactor === 1 ? '1배는 분할하지 않는 비교입니다. 주당 가격·주식 수·시가총액이 모두 같습니다.' : '분할 배수만큼 주식 수가 늘고 주당 가격은 같은 배수로 나뉩니다. 이 가상 비교에서 시가총액과 당기 이익은 그대로입니다.' },
    { phase: 'compare', label: '주당이익과 PER 비교', factor: input.splitFactor,
      message: `${after.perExplanation} 분할은 같은 이익을 더 많은 주식으로 나누며 새 이익이나 현금을 만들지 않습니다.` },
  ];
  const frames = phases.map((phase, index) => ({ ...snapshot(phase.factor), ...phase, index, splitObserved: index >= 1, predictionOutcome: 'same' }));
  return { input, before, after, frames, summary: frames.at(-1), marketCapDirection: direction(after.marketCap - before.marketCap) };
}

export function cashFlowValuationFrames(options = {}) {
  const input = { ...cashFlowValuationDefaults, ...options };
  finiteRange(input.annualCash, 0, 20, '매년 현금');
  finiteRange(input.residualCash, 0, 160, '3년 말 잔존 현금');
  finiteRange(input.ratePercent, 0, 20, '연 할인율');
  const rate = input.ratePercent / 100;
  // 고정 눈금. 최대 입력 20×3+160=220이며 어떤 단계도 다시 자동 확대하지 않는다.
  const scale = 220;
  const flows = [1, 2, 3].map(year => {
    const regularCash = input.annualCash, residualCash = year === 3 ? input.residualCash : 0;
    const futureCash = regularCash + residualCash;
    const discountDivisor = (1 + rate) ** year;
    const regularPresent = regularCash / discountDivisor, residualPresent = residualCash / discountDivisor;
    const presentValue = futureCash / discountDivisor;
    const segments = (regular, residual) => [
      { kind: 'regular', label: '매년 현금', value: regular, fraction: regular / scale },
      { kind: 'residual', label: '잔존 현금', value: residual, fraction: residual / scale },
    ];
    return { year, label: `${year}년 말`, regularCash, residualCash, futureCash, discountDivisor,
      discountFactor: 1 / discountDivisor, regularPresent, residualPresent, presentValue,
      futureSegments: segments(regularCash, residualCash), presentSegments: segments(regularPresent, residualPresent),
      futureFraction: futureCash / scale, presentFraction: presentValue / scale };
  });
  const undiscountedTotal = flows.reduce((sum, flow) => sum + flow.futureCash, 0);
  const totalPresentValue = flows.reduce((sum, flow) => sum + flow.presentValue, 0);
  const regularPresentTotal = flows.reduce((sum, flow) => sum + flow.regularPresent, 0);
  const residualPresentTotal = flows.reduce((sum, flow) => sum + flow.residualPresent, 0);
  const phases = [
    { phase: 'assumptions', label: '0단계 · 받을 현금과 시점', message: '미래 현금은 각 연도 말에 있습니다. 3년 말에는 매년 현금과 잔존 현금을 한 번씩만 더하며, 4년 이후 현금은 가정하지 않습니다.' },
    { phase: 'year-1', label: '1단계 · 1년 말 현금을 현재로', message: '1년 말 현금을 (1 + 할인율)로 한 번 나눕니다. 계산한 현재가치는 오늘 받은 현금이 아니라 가정에 따른 평가입니다.' },
    { phase: 'year-2', label: '2단계 · 2년 말 현금을 현재로', message: '2년 말 현금은 (1 + 할인율)의 제곱으로 나눕니다. 양의 할인율에서는 같은 금액도 멀리 받을수록 현재가치가 작습니다.' },
    { phase: 'year-3', label: '3단계 · 마지막 현금을 현재로', message: '3년 말 매년 현금과 잔존 현금은 같은 시점입니다. 둘을 합해 세제곱으로 나누며 잔존 현금을 따로 다시 더하지 않습니다.' },
    { phase: 'total', label: '4단계 · 같은 현재 시점에서 합산', message: '각 현금을 현재 시점으로 맞춘 뒤 합칩니다. 이 합계는 입력한 현금·종료 시점·할인율의 조건부 결과이며 정답 주가나 목표주가가 아닙니다.' },
  ];
  const frames = phases.map((phase, index) => {
    const observedYears = Math.min(index, flows.length);
    const contributions = flows.map(flow => ({ ...flow, futureSegments: flow.futureSegments.map(part => ({ ...part })), presentSegments: flow.presentSegments.map(part => ({ ...part })), observed: flow.year <= observedYears }));
    const observedPresentValue = contributions.filter(flow => flow.observed).reduce((sum, flow) => sum + flow.presentValue, 0);
    const totalSegments = contributions.map(flow => ({
      year: flow.year, label: flow.label, value: flow.observed ? flow.presentValue : 0,
      fraction: (flow.observed ? flow.presentValue : 0) / scale,
    }));
    return { ...phase, index, observedYears, contributions, observedPresentValue, totalSegments,
      predictionOutcome: direction(totalPresentValue - undiscountedTotal),
      totalFraction: observedPresentValue / scale, scale, isComplete: index === phases.length - 1,
      // 정적 과정 표도 동일한 프레임에서 각 시점의 반영액을 읽는다.
      year1Present: contributions[0].observed ? contributions[0].presentValue : null,
      year2Present: contributions[1].observed ? contributions[1].presentValue : null,
      year3Present: contributions[2].observed ? contributions[2].presentValue : null };
  });
  return { input, rate, scale, flows, frames, summary: frames.at(-1), undiscountedTotal, totalPresentValue,
    regularPresentTotal, residualPresentTotal,
    versusZeroRateDirection: direction(totalPresentValue - undiscountedTotal) };
}

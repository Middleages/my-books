// One authored indemnity contract, not a universal insurance policy formula.
// The order is exclusion -> deductible -> insurer rate -> per-claim cap -> annual cap.
// Money is won, including fractional won. No display rounding enters the calculation.
// IEEE-754 conservation identities use a tolerance relative to the original loss/limit,
// including when subtracting near-equal large values leaves a very small remainder.
export const payoutDefaults = Object.freeze({
  loss: 5000000,
  excluded: 1000000,
  deductible: 500000,
  insurerRate: .8,
  perClaimLimit: 2000000,
  annualLimit: 3000000,
  annualUsed: 0,
});

const MAX_MONEY = 1e12;
const MONEY_KEYS = ['loss', 'excluded', 'deductible', 'perClaimLimit', 'annualLimit', 'annualUsed'];
const SEGMENT_LABELS = {
  excluded: '보장 제외',
  deductible: '공제 자기부담',
  coinsurance: '정률 자기부담',
  capExcess: '건별한도 초과',
  annualExcess: '연간한도 초과',
  paid: '보험금',
  unresolved: '아직 계산하지 않은 부분',
};

function assertObject(value, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object.`);
  }
}

function money(value, name) {
  if (!Number.isFinite(value) || value < 0 || value > MAX_MONEY) {
    throw new RangeError(`${name} must be a finite number from 0 to ${MAX_MONEY} won.`);
  }
  return value === 0 ? 0 : value;
}

function normalize(options) {
  assertObject(options, 'Options');
  const params = {};
  for (const key of MONEY_KEYS) {
    const value = Object.hasOwn(options, key) ? options[key] : payoutDefaults[key];
    params[key] = money(value, key);
  }
  const rate = Object.hasOwn(options, 'insurerRate') ? options.insurerRate : payoutDefaults.insurerRate;
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    throw new RangeError('insurerRate must be a finite number from 0 to 1.');
  }
  params.insurerRate = rate === 0 ? 0 : rate;
  // Usage above this contract's annual limit means exhausted, never negative capacity.
  // params exposes this effective usage, not the unbounded requested usage.
  params.annualUsed = Math.min(params.annualUsed, params.annualLimit);
  return params;
}

function makeSegments(loss, amounts) {
  let left = 0;
  return Object.entries(amounts).map(([id, amount]) => {
    const segment = {
      id, label: SEGMENT_LABELS[id], amount,
      fraction: loss === 0 ? 0 : amount / loss,
      // Clamp only a possible accumulated floating-point overhang in the position.
      leftFraction: loss === 0 ? 0 : Math.min(1, left / loss),
    };
    left += amount;
    return segment;
  });
}

export function projectPayout(options = {}) {
  const params = normalize(options);
  return calculatePayout(params, params.annualLimit - params.annualUsed);
}

function calculatePayout(params, annualRemainingBefore) {
  const excluded = Math.min(params.loss, params.excluded);
  const coveredLoss = params.loss - excluded;
  const deductible = Math.min(coveredLoss, params.deductible);
  const rateBase = coveredLoss - deductible;
  const payableBeforeCaps = rateBase * params.insurerRate;
  const coinsurance = rateBase - payableBeforeCaps;
  const payableBeforeAnnual = Math.min(payableBeforeCaps, params.perClaimLimit);
  const capExcess = payableBeforeCaps - payableBeforeAnnual;
  const paid = Math.min(payableBeforeAnnual, annualRemainingBefore);
  const annualExcess = payableBeforeAnnual - paid;
  const remainingBurden = params.loss - paid;
  const annualRemainingAfter = annualRemainingBefore - paid;
  const annualUsedAfter = Math.min(params.annualLimit, params.annualUsed + paid);
  const phases = [
    {
      phase: 'loss', label: '출발 · 총손실',
      detail: '총손실 전체에서 시작합니다. 회색 부분의 지급 여부는 아직 계산하지 않았습니다.',
      unresolved: params.loss,
    },
    {
      phase: 'exclusion', label: '1 · 보장 제외',
      detail: '가상 계약이 보장하지 않는 손실을 먼저 분리합니다. 제외액은 총손실을 넘지 않습니다.',
      unresolved: coveredLoss,
    },
    {
      phase: 'deductible', label: '2 · 공제 자기부담',
      detail: '제외 후 남은 손실에서 공제액을 분리합니다. 공제는 남은 손실까지만 적용합니다.',
      unresolved: rateBase,
    },
    {
      phase: 'coinsurance', label: '3 · 정률 자기부담',
      detail: '공제 후 금액에 보험자 부담률을 적용합니다. 나머지는 정률 자기부담입니다.',
      unresolved: payableBeforeCaps,
    },
    {
      phase: 'per-claim', label: '4 · 건별한도',
      detail: '보험자 부담액에 한 번의 청구 한도를 적용합니다. 연간 잔여한도는 아직 적용하지 않았습니다.',
      unresolved: payableBeforeAnnual,
    },
    {
      phase: 'annual', label: '5 · 연간 잔여한도와 보험금',
      detail: '같은 보험연도에 이미 지급한 금액을 뺀 잔여한도까지만 지급합니다. 손실의 모든 부분이 한 번씩 분리됩니다.',
      unresolved: 0,
    },
  ];
  const frames = phases.map(({ phase, label, detail, unresolved }, index) => {
    const amounts = {
      excluded: index >= 1 ? excluded : 0,
      deductible: index >= 2 ? deductible : 0,
      coinsurance: index >= 3 ? coinsurance : 0,
      capExcess: index >= 4 ? capExcess : 0,
      annualExcess: index >= 5 ? annualExcess : 0,
      paid: index >= 5 ? paid : 0,
      ...(index < 5 ? { unresolved } : {}),
    };
    return {
      index, phase, label, detail, loss: params.loss, unresolved,
      resolvedBurden: params.loss - unresolved - amounts.paid,
      paid: amounts.paid, segments: makeSegments(params.loss, amounts),
    };
  });
  const verdict = params.loss === 0 ? '손실이 없어 보험금과 남는 부담이 모두 0원입니다.'
    : paid === params.loss ? '이 가상 조건에서는 총손실 전부가 보험금으로 충당됩니다.'
      : paid === 0 ? '이 가상 조건에서는 보험금이 0원이며 손실 전부가 본인부담으로 남습니다.'
        : '이 가상 조건에서는 손실 일부가 보험금으로 지급되고 나머지는 본인부담으로 남습니다.';
  return {
    params, frames, segments: frames.at(-1).segments,
    excluded, coveredLoss, deductible, rateBase, coinsurance, payableBeforeCaps,
    capExcess, payableBeforeAnnual, annualExcess, paid, remainingBurden,
    annualRemainingBefore, annualRemainingAfter, annualUsedAfter, verdict,
  };
}

function contractParams(params) {
  const { annualUsed: _annualUsed, ...contract } = params;
  return contract;
}

// Claim submission and playback are separate. Reading/replaying projectPayout never
// commits usage; only submitPayoutClaim adds a claim. Only a new year resets usage.
function totalPaid(claims) {
  // Neumaier summation keeps tiny payments instead of repeatedly adding them to a
  // much larger used limit. The initial remaining capacity is a separate anchor.
  let total = 0, correction = 0;
  for (const claim of claims) {
    const next = total + claim.paid;
    correction += Math.abs(total) >= Math.abs(claim.paid)
      ? (total - next) + claim.paid : (claim.paid - next) + total;
    total = next;
  }
  return total + correction;
}

function annualGeometry(state) {
  const limit = state.params.annualLimit;
  const fraction = amount => limit === 0 ? 0 : amount / limit;
  return {
    ...state,
    annualUsedFraction: fraction(state.annualUsed),
    annualRemainingFraction: fraction(state.annualRemaining),
    annualSegments: state.claims.map((claim, index) => ({
      index, amount: claim.paid, fraction: fraction(claim.paid),
      leftFraction: fraction(Math.max(0, limit - claim.annualRemainingBefore)),
    })),
  };
}

export function createPayoutYear(options = {}) {
  const params = normalize(options);
  return annualGeometry({
    year: 1, params: contractParams(params), initialAnnualUsed: params.annualUsed,
    annualUsed: params.annualUsed,
    annualRemaining: params.annualLimit - params.annualUsed, claims: [],
  });
}

function validateYear(state) {
  assertObject(state, 'Year state');
  if (!Number.isSafeInteger(state.year) || state.year < 1) {
    throw new RangeError('year must be a positive safe integer.');
  }
  if (!Array.isArray(state.claims)) throw new TypeError('claims must be an array.');
  for (const claim of state.claims) {
    assertObject(claim, 'Recorded claim');
    money(claim.paid, 'Recorded payment');
  }
  assertObject(state.params, 'Year params');
  const params = normalize({ ...state.params, annualUsed: state.annualUsed });
  if (params.annualUsed !== state.annualUsed) {
    throw new RangeError('Year state annualUsed must not exceed annualLimit.');
  }
  money(state.annualRemaining, 'annualRemaining');
  money(state.initialAnnualUsed, 'initialAnnualUsed');
  if (state.initialAnnualUsed > params.annualUsed) {
    throw new RangeError('initialAnnualUsed cannot exceed current annualUsed.');
  }
  // This state is a public plain value. Reject inconsistent capacity, allowing only
  // subtraction's machine-scale residue; callers should keep the returned state.
  const tolerance = Number.EPSILON * 8 * Math.max(1, params.annualLimit);
  if (Math.abs(state.annualRemaining + params.annualUsed - params.annualLimit) > tolerance) {
    throw new RangeError('annualRemaining and annualUsed must partition annualLimit.');
  }
  return params;
}

export function previewPayoutClaim(state, options = {}) {
  const previous = validateYear(state);
  assertObject(options, 'Claim options');
  // Changing a claim's conditions never rewrites the annual ledger or its limit.
  for (const key of Object.keys(options)) {
    if (!['loss', 'excluded', 'deductible', 'insurerRate', 'perClaimLimit'].includes(key)) {
      throw new RangeError(`Claim options cannot change ${key}.`);
    }
  }
  const params = normalize({ ...previous, ...options });
  const initialRemaining = params.annualLimit - state.initialAnnualUsed;
  const annualRemainingBefore = Math.max(0, initialRemaining - totalPaid(state.claims));
  const claim = calculatePayout(params, annualRemainingBefore);
  const paidAfter = totalPaid([...state.claims, claim]);
  claim.annualRemainingAfter = Math.max(0, initialRemaining - paidAfter);
  claim.annualUsedAfter = Math.min(params.annualLimit, state.initialAnnualUsed + paidAfter);
  return claim;
}

export function submitPayoutClaim(state, options = {}) {
  const claim = previewPayoutClaim(state, options);
  const params = claim.params;
  return annualGeometry({
    year: state.year, params: contractParams(params), initialAnnualUsed: state.initialAnnualUsed,
    annualUsed: claim.annualUsedAfter, annualRemaining: claim.annualRemainingAfter,
    claims: [...state.claims, claim],
  });
}

export function startNextPayoutYear(state) {
  const params = validateYear(state);
  if (state.year === Number.MAX_SAFE_INTEGER) throw new RangeError('year cannot exceed the safe integer range.');
  return { ...createPayoutYear({ ...params, annualUsed: 0 }), year: state.year + 1 };
}

// Exactly three identical authored claims. Each result retains all six frames.
export function projectPayoutYear(options = {}) {
  const params = normalize(options);
  let state = createPayoutYear(params);
  for (let claim = 0; claim < 3; claim++) state = submitPayoutClaim(state);
  return {
    params, claims: state.claims,
    totalPaid: totalPaid(state.claims),
    initialAnnualUsed: state.initialAnnualUsed,
    annualUsed: state.annualUsed, annualRemaining: state.annualRemaining,
    annualUsedFraction: state.annualUsedFraction, annualRemainingFraction: state.annualRemainingFraction,
    annualSegments: state.annualSegments,
  };
}

// A separate event-conditioned promise, never a slice or limit of the loss above.
export function projectFixedBenefit(options) {
  assertObject(options, 'Fixed-benefit options');
  if (typeof options.eventEligible !== 'boolean') throw new TypeError('eventEligible must be a boolean.');
  const amount = money(options.amount, 'amount');
  const paid = options.eventEligible ? amount : 0;
  return {
    eventEligible: options.eventEligible, amount, paid,
    verdict: options.eventEligible ? '이 가상 사건은 조건을 충족하므로 약정액을 지급합니다.'
      : '이 가상 사건은 조건을 충족하지 않아 정액 보험금이 없습니다.',
  };
}

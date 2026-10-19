// Authored, one-period alternatives. No random sampling and no promise about 100 outcomes.
// Money is calculated in won, including fractional won; only the view rounds for display.
export const expectedLossDefaults = Object.freeze({
  cash: 2000000,
  frequentProbability: 0.2,
  frequentLoss: 1000000,
  severeProbability: 0.01,
  severeLoss: 20000000,
});

const MAX_MONEY = 1e12;
function normalize(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('Options must be an object.');
  }
  const params = { ...expectedLossDefaults, ...options };
  for (const name of ['cash', 'frequentLoss', 'severeLoss']) {
    if (!Number.isFinite(params[name]) || params[name] < 0 || params[name] > MAX_MONEY) {
      throw new RangeError(`${name} must be a finite number from 0 to ${MAX_MONEY} won.`);
    }
    if (params[name] === 0) params[name] = 0;
  }
  for (const name of ['frequentProbability', 'severeProbability']) {
    if (!Number.isFinite(params[name]) || params[name] < 0 || params[name] > 1) {
      throw new RangeError(`${name} must be a finite probability from 0 to 1.`);
    }
    if (params[name] === 0) params[name] = 0;
  }
  return params;
}

export function projectExpectedLoss(options = {}) {
  const params = normalize(options);
  // Both scenarios use this single scale. A zero amount always has a zero width.
  const moneyScale = Math.max(params.cash, params.frequentLoss, params.severeLoss);
  const fraction = amount => moneyScale === 0 ? 0 : amount / moneyScale;
  const scenarios = [
    ['frequent', '작은 손실 사례', params.frequentProbability, params.frequentLoss],
    ['severe', '큰 손실 사례', params.severeProbability, params.severeLoss],
  ].map(([id, label, probability, loss]) => {
    const expectedLoss = probability * loss;
    const outcomes = [false, true].map(eventOccurred => {
      const outcomeProbability = eventOccurred ? probability : 1 - probability;
      const realizedLoss = eventOccurred ? loss : 0;
      const cashUsed = Math.min(params.cash, realizedLoss);
      const cashRemaining = params.cash - cashUsed;
      const shortfall = realizedLoss - cashUsed;
      return {
        id: eventOccurred ? 'present' : 'absent', eventOccurred,
        possible: outcomeProbability > 0, probability: outcomeProbability,
        loss: realizedLoss, cashUsed, cashRemaining, shortfall,
        fractions: {
          loss: fraction(realizedLoss), cashUsed: fraction(cashUsed),
          cashRemaining: fraction(cashRemaining), shortfall: fraction(shortfall),
        },
      };
    });
    return {
      id, label, probability, loss, cash: params.cash, expectedLoss,
      // A partially filled dot preserves non-integer percentages, e.g. 1.25%.
      // The clipping below intersects a probability interval with each dot, not input validation.
      dots: Array.from({ length: 100 }, (_, index) => ({
        id: index + 1, fraction: Math.max(0, Math.min(1, probability * 100 - index)),
      })),
      fractions: { probability, loss: fraction(loss), cash: fraction(params.cash), expectedLoss: fraction(expectedLoss) },
      outcomes,
    };
  });
  const frames = [
    { phase: 'distribution', label: '출발 · 확률과 손실의 크기' },
    { phase: 'absent', label: '사건이 없는 대안 · 손실 0원' },
    { phase: 'present', label: '사건이 있는 대안 · 현금과 부족액' },
  ].map(({ phase, label }, index) => ({
    index, phase, label,
    // These observations restart from the same cash, never accumulate two periods.
    scenarios: scenarios.map(scenario => ({
      ...scenario,
      observation: phase === 'distribution' ? null : scenario.outcomes.find(outcome => outcome.id === phase),
    })),
  }));
  const frequentShortfall = scenarios[0].outcomes[1].shortfall;
  const severeShortfall = scenarios[1].outcomes[1].shortfall;
  return {
    params, moneyScale, scenarios, frames,
    expectedLossEqual: scenarios[0].expectedLoss === scenarios[1].expectedLoss,
    shortfallComparison: frequentShortfall === severeShortfall ? 'same'
      : frequentShortfall > severeShortfall ? 'frequent' : 'severe',
  };
}

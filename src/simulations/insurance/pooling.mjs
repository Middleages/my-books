// A limited teaching pool, NOT an insurer's premium, solvency or payout rules.
// Affected household IDs are authored examples, not random independent observations.
// All payments share the finite pool proportionally; no money is created to fill a gap.
// Fractional won use IEEE-754 numbers. Sum identities are checked within 1e-12 ×
// max(1, participating financial amounts) numerical tolerance, including the original
// claims/paid amounts for a tiny cancellation residual. This never changes decisions or rounds payments.
export const poolingDefaults = Object.freeze({
  households: 20,
  contribution: 100000,
  reserve: 1000000,
  lossPerHousehold: 1000000,
  affectedCount: 2,
});

const MAX_MONEY = 1e12;
function normalize(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('Options must be an object.');
  }
  const params = { ...poolingDefaults, ...options };
  if (!Number.isInteger(params.households) || params.households < 1 || params.households > 100) {
    throw new RangeError('households must be an integer from 1 to 100.');
  }
  if (!Number.isInteger(params.affectedCount) || params.affectedCount < 0 || params.affectedCount > params.households) {
    throw new RangeError('affectedCount must be an integer from 0 to households.');
  }
  for (const name of ['contribution', 'reserve', 'lossPerHousehold']) {
    if (!Number.isFinite(params[name]) || params[name] < 0 || params[name] > MAX_MONEY) {
      throw new RangeError(`${name} must be a finite number from 0 to ${MAX_MONEY} won.`);
    }
    if (params[name] === 0) params[name] = 0;
  }
  return params;
}

export function projectPooling(options = {}) {
  const params = normalize(options);
  const totalContributions = params.households * params.contribution;
  const initialCombinedFunds = totalContributions + params.reserve;
  const totalClaims = params.affectedCount * params.lossPerHousehold;
  const totalPaid = Math.min(initialCombinedFunds, totalClaims);
  // Hold the scale across the authored 2/8-claim comparison. Larger valid inputs extend it.
  const moneyScale = Math.max(8000000, initialCombinedFunds, totalClaims, Math.min(8, params.households) * params.lossPerHousehold);
  const fraction = amount => amount / moneyScale;
  const phases = [
    { phase: 'initial', label: '출발 · 가구별 분담금과 별도 준비금' },
    { phase: 'contributions', label: '모으기 · 가구에서 공동 재원으로' },
    { phase: 'claims', label: '손실 발생 · 총청구액 확인' },
    { phase: 'payments', label: '배분 · 지급액과 남은 부족액' },
  ];
  const frames = phases.map(({ phase, label }, index) => {
    const contributionsCollected = index >= 1 ? totalContributions : 0;
    const notYetContributed = totalContributions - contributionsCollected;
    // available is collected capacity, remaining is the cash left after payments.
    const available = params.reserve + contributionsCollected;
    const currentClaims = index >= 2 ? totalClaims : 0;
    const currentPaid = index >= 3 ? totalPaid : 0;
    const remaining = available - currentPaid;
    const pendingClaims = currentClaims - currentPaid;
    const unfunded = Math.max(0, currentClaims - available);
    let allocated = 0;
    const households = Array.from({ length: params.households }, (_, householdIndex) => {
      const affected = index >= 2 && householdIndex < params.affectedCount;
      const contribution = index >= 1 ? params.contribution : 0;
      const claim = affected ? params.lossPerHousehold : 0;
      let paid = 0;
      if (affected && index >= 3) {
        // Full coverage pays the exact claim in every row, avoiding a residue above the
        // last claim. Underfunded residue is bounded against floating-point overshoot.
        // This is numerical protection, not display rounding or an extra source of funds.
        paid = currentPaid === currentClaims ? claim
          : Math.max(0, Math.min(claim, householdIndex === params.affectedCount - 1
            ? currentPaid - allocated : currentPaid / params.affectedCount));
        allocated += paid;
      }
      const unpaid = claim - paid;
      return {
        id: householdIndex + 1, affected, contribution, claim, paid, unpaid,
        fractions: { contribution: fraction(contribution), claim: fraction(claim), paid: fraction(paid), unpaid: fraction(unpaid) },
        localFractions: {
          paid: params.lossPerHousehold === 0 ? 0 : paid / params.lossPerHousehold,
          unpaid: params.lossPerHousehold === 0 ? 0 : unpaid / params.lossPerHousehold,
        },
      };
    });
    return {
      index, phase, label, households, contributionsCollected, notYetContributed,
      initialCombinedFunds, reserve: params.reserve, available,
      totalClaims: currentClaims, totalPaid: currentPaid, remaining, pendingClaims, unfunded,
      fractions: {
        contributions: fraction(contributionsCollected), reserve: fraction(params.reserve),
        available: fraction(available), claims: fraction(currentClaims), paid: fraction(currentPaid),
        remaining: fraction(remaining), unfunded: fraction(unfunded), pendingClaims: fraction(pendingClaims),
        notYetContributed: fraction(notYetContributed), initialCombinedFunds: fraction(initialCombinedFunds),
      },
    };
  });
  const final = frames.at(-1);
  return {
    params, moneyScale, households: final.households, totalContributions,
    initialReserve: params.reserve, initialCombinedFunds, available: final.available,
    totalClaims, totalPaid, remaining: final.remaining, pendingClaims: final.pendingClaims, unfunded: final.unfunded,
    paymentRatio: totalClaims === 0 ? 1 : totalPaid / totalClaims,
    canCoverAllClaims: totalClaims <= initialCombinedFunds,
    fractions: final.fractions, frames,
  };
}

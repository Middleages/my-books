// Educational fixed nominal rate, monthly interest, end-of-month full scheduled payments.
// Keep fractional won internally; only presentation rounds. No actual payment/arrears simulation.
export const repaymentDefaults = {
  principal: 12000000,
  annualRate: 6,
  months: 24,
};
export const repaymentKinds = ["equalPrincipal", "annuity", "bullet"];
export function projectRepayment(p) {
  if (
    !Number.isFinite(p.principal) ||
    p.principal < 0 ||
    p.principal > 100000000 ||
    !Number.isFinite(p.annualRate) ||
    p.annualRate < 0 ||
    p.annualRate > 30 ||
    !Number.isInteger(p.months) ||
    p.months < 1 ||
    p.months > 600
  )
    throw new RangeError("원금 0~1억원, 명목연율 0~30%, 정수 기간 1~600개월");
  const monthlyRate = p.annualRate / 1200;
  // Algebraically P*r/(1-(1+r)^-n). expm1/log1p avoid cancellation near zero.
  const annuityPayment =
    monthlyRate === 0
      ? p.principal / p.months
      : (p.principal * monthlyRate) /
        -Math.expm1(-p.months * Math.log1p(monthlyRate));
  const paths = {};
  for (const kind of repaymentKinds) {
    const rows = [],
      frames = [];
    let balance = p.principal,
      cumulativePrincipal = 0,
      cumulativeInterest = 0;
    for (let month = 1; month <= p.months; month++) {
      const opening = balance,
        interest = opening * monthlyRate;
      const planned =
        kind === "equalPrincipal"
          ? p.principal / p.months
          : kind === "annuity"
            ? Math.max(0, annuityPayment - interest)
            : 0;
      // Last payment clears the actual remaining principal, never subtracts the original twice.
      const principal =
        month === p.months ? opening : Math.min(opening, planned);
      const closing = month === p.months ? 0 : Math.max(0, opening - principal);
      const payment = principal + interest;
      const beforePrincipal = cumulativePrincipal,
        beforeInterest = cumulativeInterest;
      cumulativePrincipal += principal;
      cumulativeInterest += interest;
      const row = {
        month,
        opening,
        interest,
        principal,
        payment,
        closing,
        cumulativePrincipal,
        cumulativeInterest,
        cumulativePayment: cumulativePrincipal + cumulativeInterest,
      };
      rows.push(row);
      for (let phase = 0; phase < 4; phase++) {
        const paid = phase >= 2;
        const cp = paid ? cumulativePrincipal : beforePrincipal;
        const ci = paid ? cumulativeInterest : beforeInterest;
        frames.push({
          month,
          phase,
          balance: paid ? closing : opening,
          interestDue: phase === 1 ? interest : 0,
          cumulativePrincipal: cp,
          cumulativeInterest: ci,
          cumulativePayment: cp + ci,
        });
      }
      balance = closing;
    }
    paths[kind] = {
      rows,
      frames,
      totalInterest: cumulativeInterest,
      totalPayment: cumulativePrincipal + cumulativeInterest,
    };
  }
  const lowestInterest =
    p.principal === 0 || p.annualRate === 0 || p.months === 1
      ? "same"
      : "equalPrincipal";
  return { monthlyRate, annuityPayment, paths, lowestInterest };
}

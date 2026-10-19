// 별도 가상 서비스 기업. 숫자는 화폐단위이며 실제 기업·회계기간을 나타내지 않는다.
export const financialStatementsDefaults = Object.freeze({ creditSales: 120 });
export const financialStatementsScenario = Object.freeze({
  openingCash: 100, openingLiabilities: 40, openingEquity: 60,
  serviceRevenue: 120, cashCosts: 80, balanceScale: 220,
});

export function financialStatementsFrames(options = {}) {
  const creditSales = options.creditSales === undefined ? financialStatementsDefaults.creditSales : options.creditSales;
  const input = { ...financialStatementsScenario, creditSales };
  if (!Number.isFinite(creditSales) || creditSales < 0 || creditSales > input.serviceRevenue) {
    throw new RangeError('외상액은 0–120단위의 유한한 숫자여야 합니다.');
  }
  const cashSales = input.serviceRevenue - creditSales;
  const phases = [
    { phase: 'opening', label: '당기 초 · 거래 전', sale: false, cost: false, collected: false,
      message: '현금 100 = 부채 40 + 자본 60입니다. 아직 서비스를 제공하지 않아 당기 매출과 이익은 0입니다.' },
    { phase: 'sale', label: '당기 · 서비스 제공 완료', sale: true, cost: false, collected: false,
      message: `서비스 매출 120 중 ${cashSales}는 현금, ${creditSales}는 받을 권리인 매출채권으로 생깁니다. 아직 비용을 반영하기 전인 관찰 단계입니다.` },
    { phase: 'cost', label: '당기 · 현금비용 반영', sale: true, cost: true, collected: false,
      message: `당기 비용 80을 인식하고 현금으로 지급했습니다. 이익은 40, 영업 현금흐름은 ${cashSales - input.cashCosts}입니다.` },
    { phase: 'closing', label: '당기 말 · 장부 확정', sale: true, cost: true, collected: false,
      message: `당기 이익 40은 자본에 남지만 기말 현금은 ${input.openingCash + cashSales - input.cashCosts}입니다. 외상 ${creditSales}는 기말에도 매출채권이며 현금이 아닙니다.` },
    { phase: 'collection', label: '다음 기간 · 외상 전액 회수', sale: true, cost: true, collected: true,
      message: creditSales === 0
        ? '받을 외상이 없으므로 다음 기간 회수액도 0입니다. 새 매출·비용 없이 현금과 자본은 그대로입니다.'
        : `다음 기간에 외상 ${creditSales}를 회수해 매출채권이 같은 금액만큼 현금으로 바뀝니다. 새 서비스가 없으므로 다음 기간 매출과 이익은 0입니다.`,
    },
  ];
  const segment = (kind, label, value) => ({ kind, label, value, fraction: value / input.balanceScale });
  const frames = phases.map(({ phase, label, sale, cost, collected, message }, index) => {
    const cumulativeRevenue = sale ? input.serviceRevenue : 0;
    const cumulativeExpenses = cost ? input.cashCosts : 0;
    const saleCashReceived = sale ? cashSales : 0;
    const collectionReceived = collected ? creditSales : 0;
    const receivables = sale && !collected ? creditSales : 0;
    const cumulativeProfit = cumulativeRevenue - cumulativeExpenses;
    const cumulativeOperatingCashFlow = saleCashReceived + collectionReceived - cumulativeExpenses;
    const cash = input.openingCash + cumulativeOperatingCashFlow;
    const liabilities = input.openingLiabilities;
    const equity = input.openingEquity + cumulativeProfit;
    const periodOpeningCash = collected ? input.openingCash + cashSales - input.cashCosts : input.openingCash;
    const periodOpeningReceivables = collected ? creditSales : 0;
    const periodRevenue = collected ? 0 : cumulativeRevenue;
    const periodExpenses = collected ? 0 : cumulativeExpenses;
    const periodProfit = periodRevenue - periodExpenses;
    const periodOperatingCashFlow = collected ? creditSales : cumulativeOperatingCashFlow;
    const assetSegments = [segment('cash', '현금', cash), segment('receivable', '매출채권', receivables)];
    const fundingSegments = [segment('liability', '부채', liabilities), segment('equity', '자본', equity)];
    return {
      index, phase, label, message, period: collected ? '다음 기간' : '당기',
      cash, receivables, assets: cash + receivables, liabilities, equity,
      periodOpeningCash, periodOpeningReceivables, periodRevenue, periodExpenses, periodProfit,
      periodOperatingCashFlow, periodCashChange: cash - periodOpeningCash,
      periodReceivablesChange: receivables - periodOpeningReceivables,
      cumulativeRevenue, cumulativeExpenses, cumulativeProfit, cumulativeOperatingCashFlow,
      cashChange: cash - input.openingCash, saleCashReceived, collectionReceived,
      saleSplit: {
        total: input.serviceRevenue, cash: cashSales, credit: creditSales,
        cashFraction: cashSales / input.serviceRevenue, creditFraction: creditSales / input.serviceRevenue,
        recognized: sale, collected,
      },
      event: {
        cashIn: phase === 'sale' ? cashSales : phase === 'collection' ? creditSales : 0,
        cashOut: phase === 'cost' ? input.cashCosts : 0,
        revenue: phase === 'sale' ? input.serviceRevenue : 0,
        expense: phase === 'cost' ? input.cashCosts : 0,
        receivablesChange: phase === 'sale' ? creditSales : phase === 'collection' ? -creditSales : 0,
      },
      assetSegments, fundingSegments, balanceScale: input.balanceScale,
      closingCashDirection: cashSales - input.cashCosts > 0 ? 'up' : cashSales - input.cashCosts < 0 ? 'down' : 'same',
    };
  });
  return { input, frames, closing: frames[3], summary: frames[4] };
}

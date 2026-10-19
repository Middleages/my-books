const check = (v, min, max, integer = false) => {
  if (
    typeof v !== "number" ||
    !Number.isFinite(v) ||
    v < min ||
    v > max ||
    (integer && !Number.isInteger(v))
  )
    throw new RangeError("교육용 입력 범위를 확인하세요");
};
const choice = (v, allowed) => {
  if (!allowed.includes(v)) throw new RangeError("알 수 없는 조건");
};
export const policyPhases = [
  "정책 변화 관찰",
  "금융 여건의 여러 경로",
  "계약·노출에 따른 차이",
  "지출·가격 결정에 전달될 조건",
];
export function policyMap(direction = "up", context = "normal", phase = 0) {
  choice(direction, ["up", "down", "same"]);
  choice(context, ["normal", "stress"]);
  check(phase, 0, 3, true);
  const up = direction === "up";
  const channels = [
    {
      id: "interest",
      name: "금리",
      financial: up
        ? "시장·예금·대출금리 상승 압력"
        : "시장·예금·대출금리 하락 압력",
      exposure: "대출 이자·예금 이자·투자 조달비용",
      effect: up
        ? "차입 부담 증가·저축 유인 등으로 소비·투자 억제 요인"
        : "차입 부담 완화 등으로 소비·투자 확대 요인",
      condition: "계약 재산정·가산금리·소득·기대 실질금리를 함께 확인",
    },
    {
      id: "credit",
      name: "신용",
      financial: up
        ? "상환 우려·대출 심사 강화 가능성"
        : "조달 여건·상환 전망 개선 가능성",
      exposure: "가계·기업이 실제로 빌릴 수 있는 조건",
      effect: up
        ? "대출 이용 소비·투자 제약 가능"
        : "신용 이용과 지출 회복 가능",
      condition: "은행 건전성·담보·차주 신용·대출 수요에 좌우",
    },
    {
      id: "assets",
      name: "자산가격",
      financial: up
        ? "미래 수익의 현재가치 하락 압력"
        : "미래 수익의 현재가치 상승 압력",
      exposure: "자산 보유자의 평가액·담보 여력",
      effect: up
        ? "부·담보 감소를 통한 지출 억제 요인"
        : "부·담보 증가를 통한 지출 확대 요인",
      condition: "다른 수익 전망·위험 선호가 같다는 조건, 가격 확정 아님",
    },
    {
      id: "fx",
      name: "환율",
      financial: up
        ? "원화 자산의 상대 수익률 상승 요인"
        : "원화 자산의 상대 수익률 하락 요인",
      exposure: up
        ? "원화 강세·원/달러 하락 압력 가능"
        : "원화 약세·원/달러 상승 압력 가능",
      effect: up
        ? "수입 가격 하락·해외 수요 변화 가능"
        : "수입 가격 상승·해외 수요 변화 가능",
      condition: "해외 금리·예상·위험 선호·계약 통화가 같다는 조건",
    },
    {
      id: "expectations",
      name: "기대",
      financial: up
        ? "물가 안정을 추구하는 정책 신호"
        : "완화 배경과 향후 정책에 대한 신호",
      exposure: "가계·기업의 미래 물가·경기 예상",
      effect: "임금·가격·소비 계획에 영향 가능",
      condition: "정책의 신뢰·설명·기존 예상과의 차이에 좌우",
    },
  ];
  if (direction === "same")
    for (const c of channels) {
      c.financial = "이번 선택의 정책금리 변화는 0";
      if (c.id === "fx")
        c.exposure = "동결만으로 원화 가치의 방향을 정하지 않음";
      c.effect = "다른 여건·정책 설명으로 달라질 수 있어 방향을 정하지 않음";
    }
  if (context === "stress") {
    channels[1].effect = "금리를 내려도 은행은 신용 위험 때문에 신중할 수 있음";
    if (direction !== "down")
      channels[1].effect =
        "은행·차주의 위험이 추가로 작용해 신용 여건의 변화폭은 불확실";
    channels[3].effect =
      "해외 충격·위험 회피도 작용하므로 환율 방향을 확정할 수 없음";
    channels[2].effect =
      "수익 전망·위험 회피도 변하므로 자산가격 방향은 불확실";
  }
  return {
    direction,
    context,
    phase,
    policy:
      direction === "up"
        ? "기준금리 인상"
        : direction === "down"
          ? "기준금리 인하"
          : "기준금리 동결",
    phaseLabel: policyPhases[phase],
    channels,
  };
}
export function policyExposure(
  direction = "up",
  schedule = "staggered",
  month = 0,
) {
  choice(direction, ["up", "down", "same"]);
  choice(schedule, ["staggered", "fixed"]);
  check(month, 0, 12, true);
  const delta = direction === "up" ? 1 : direction === "down" ? -1 : 0;
  const rows = [
    {
      name: "차입 가계",
      principal: 100000000,
      baseRate: 4,
      reset: 3,
      sign: -1,
    },
    { name: "예금 가계", principal: 50000000, baseRate: 3, reset: 1, sign: 1 },
    {
      name: "차입 기업",
      principal: 200000000,
      baseRate: 5,
      reset: 6,
      sign: -1,
    },
  ].map((r) => {
    const resetMonth = schedule === "fixed" ? 13 : r.reset,
      applied = month >= resetMonth,
      newRate = r.baseRate + (applied ? delta : 0),
      baseInterest = (r.principal * r.baseRate) / 100 / 12,
      currentInterest = (r.principal * newRate) / 100 / 12;
    return {
      ...r,
      resetMonth,
      applied,
      newRate,
      baseInterest,
      currentInterest,
      cashDelta: r.sign * (currentInterest - baseInterest) || 0,
    };
  });
  return { month, delta, rows, scale: 200000 };
}
export const fxDefaults = Object.freeze({
  rate: 1400,
  amount: 100,
  fee: 0,
  importUsd: 600,
  invoice: "USD",
  pass: 50,
  lag: 3,
  month: 0,
});
export function quote(rate, unit = "KRW/USD") {
  check(rate, Number.MIN_VALUE, 100000);
  choice(unit, ["KRW/USD"]);
  const inverse = 1 / rate;
  if (!Number.isFinite(inverse))
    throw new RangeError("역수를 표시할 수 없는 환율");
  return { rate, inverse, unit };
}
export function fxComparison(p = fxDefaults) {
  const { rate, amount, fee, importUsd, invoice, pass, lag, month } = p;
  check(rate, 500, 2500);
  check(amount, 0, 500);
  check(fee, 0, 5);
  check(importUsd, 0, 1500);
  choice(invoice, ["USD", "KRW"]);
  check(pass, 0, 100);
  check(lag, 0, 6, true);
  check(month, 0, 6, true);
  const baseRate = 1200,
    baseQuote = quote(baseRate),
    currentQuote = quote(rate),
    pair = (base, current) => ({ base, current, delta: current - base });
  const gross = amount * rate,
    baseGross = amount * baseRate,
    feeWon = (gross * fee) / 100;
  const revenue = pair(1200000, invoice === "USD" ? 1000 * rate : 1200000),
    imports = pair(importUsd * baseRate, importUsd * rate),
    debt = pair(300 * baseRate, 300 * rate),
    margin = pair(
      revenue.base - imports.base - 200000,
      revenue.current - imports.current - 200000,
    );
  const effectivePass = month >= lag ? pass : 0,
    retail = pair(
      baseGross + 30000,
      baseGross + 30000 + ((gross - baseGross) * effectivePass) / 100,
    );
  const scale =
    Math.ceil(
      Math.max(
        revenue.base,
        revenue.current,
        imports.base,
        imports.current,
        debt.base,
        debt.current,
      ) / 100000,
    ) * 100000;
  return {
    baseRate,
    rate,
    baseQuote,
    currentQuote,
    rateChange: (rate / baseRate - 1) * 100,
    inverseChange: (baseRate / rate - 1) * 100,
    purchase: {
      base: baseGross,
      gross,
      fee: feeWon,
      total: gross + feeWon,
      baseTotal: baseGross * (1 + fee / 100),
    },
    firm: { revenue, imports, debt, margin, domestic: 200000, invoice },
    retail: {
      ...retail,
      effectivePass,
      lag,
      month,
      unitImport: pair(baseGross, gross),
      scale: Math.max(baseGross + 30000, gross + 30000),
    },
    scale,
  };
}

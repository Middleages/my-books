import { progressiveTax } from "./taxModel.mjs";
// All amounts below are fictional units, never actual Korean tax computations.
export const MODEL_LIMIT = 1000000;
function amount(n, name = "amount") {
  if (!Number.isFinite(n) || n < 0 || n > MODEL_LIMIT)
    throw new RangeError(name);
  return n;
}
function choice(value, choices) {
  if (!choices.includes(value)) throw new RangeError("Unknown choice");
  return value;
}
export function payroll({
  gross = 300,
  exempt = 20,
  social = 25,
  withheld = 15,
} = {}) {
  [gross, exempt, social, withheld].forEach((n) => amount(n));
  if (exempt > gross || social + withheld > gross)
    throw new RangeError("Deductions exceed payment");
  const net = gross - social - withheld;
  const parts = [
    { id: "net", label: "통장 입금", value: net },
    { id: "social", label: "사회보험 본인부담", value: social },
    { id: "tax", label: "원천징수 세금", value: withheld },
  ];
  return {
    gross,
    exempt,
    taxablePay: gross - exempt,
    social,
    withheld,
    net,
    parts,
    frames: [
      {
        label: "① 지급액 확인",
        cash: gross,
        tax: 0,
        social: 0,
        detail:
          "지급총액과 세법상 총급여는 다릅니다. 비과세 항목은 별도로 분류합니다.",
      },
      {
        label: "② 세금·보험료 분리",
        cash: net,
        tax: withheld,
        social,
        detail:
          "통장으로 가지 않은 돈도 각각의 목적지가 있습니다. 사회보험료를 세금에 합치지 않습니다.",
      },
      {
        label: "③ 통장 입금 대조",
        cash: net,
        tax: withheld,
        social,
        detail:
          "지급총액 = 통장 입금 + 사회보험 본인부담 + 원천징수 세금. 공제는 돈을 빼는 뜻과 과세표준을 줄이는 뜻이 다릅니다.",
      },
    ],
  };
}
export function settlement({
  base = 400,
  deduction = 0,
  credit = 10,
  prepaid = 90,
} = {}) {
  [base, deduction, credit, prepaid].forEach((n) => amount(n));
  const taxableBase = Math.max(0, base - deduction),
    calculated = progressiveTax(taxableBase).tax;
  const usedCredit = Math.min(credit, calculated),
    finalTax = calculated - usedCredit,
    difference = finalTax - prepaid;
  return {
    base,
    deduction,
    usedDeduction: base - taxableBase,
    taxableBase,
    calculated,
    credit,
    usedCredit,
    unusedCredit: credit - usedCredit,
    finalTax,
    prepaid,
    difference,
    refund: Math.max(0, -difference),
    extra: Math.max(0, difference),
    direction: difference < 0 ? "refund" : difference > 0 ? "pay" : "balanced",
    frames: [
      {
        label: "① 계산할 바탕",
        value: taxableBase,
        detail: "공제 후 과세표준입니다. 통장에서 빠져나갈 돈이 아닙니다.",
      },
      {
        label: "② 산출세액",
        value: calculated,
        detail: "02장의 가상 구간별 세율을 적용합니다.",
      },
      {
        label: "③ 결정세액",
        value: finalTax,
        detail:
          "가상 세액공제는 산출세액까지만 적용합니다. 초과액의 환급·이월은 없는 모형입니다.",
      },
      {
        label: "④ 이미 낸 돈과 비교",
        value: difference,
        detail:
          difference < 0
            ? "기납부액이 더 큽니다. 차액을 돌려받는 환급입니다."
            : difference > 0
              ? "결정세액이 더 큽니다. 차액을 추가로 냅니다."
              : "기납부액과 결정세액이 같습니다. 차액이 없습니다.",
      },
    ],
  };
}
export function vatChain({ sale = 300, mode = "taxable" } = {}) {
  amount(sale);
  choice(mode, ["taxable", "zero", "exempt"]);
  if (sale < 200) throw new RangeError("Sale below model minimum");
  const prices = [100, 200, sale],
    rate = 0.1;
  const stages = prices.map((price, i) => {
    const input = i === 0 ? 0 : prices[i - 1] * rate;
    const output = i === 2 && mode !== "taxable" ? 0 : price * rate;
    const credit = i === 2 && mode === "exempt" ? 0 : input;
    return {
      id: i,
      label: ["원재료", "제조", "소매"][i],
      price,
      input,
      output,
      credit,
      remit: output - credit,
      costTax: input - credit,
      consumerPayment: price + output,
    };
  });
  return {
    sale,
    mode,
    rate,
    stages,
    totalRemit: stages.reduce((s, r) => s + r.remit, 0),
    consumerTax: stages[2].output,
    embeddedTax: stages[2].costTax,
    frames: stages.map((r, i) => ({
      label: `${i + 1}단계 · ${r.label}`,
      value: r.remit,
      detail: `매출세액 ${r.output} − 공제 매입세액 ${r.credit} = ${r.remit}. ${r.remit < 0 ? "음수는 모형의 환급 계산이며 실제 환급 요건은 별도입니다." : "받은 세액 전체와 납부 계산액을 구분합니다."}`,
    })),
  };
}
export const investmentKinds = [
  {
    id: "interest",
    label: "예금 이자",
    origin: "원금의 대가",
    event: "이자 지급",
    category: "이자소득 검토",
    question: "거주자 여부·비과세·원천징수 및 종합과세 조건",
  },
  {
    id: "dividend",
    label: "회사 배당",
    origin: "이익 분배",
    event: "배당 지급",
    category: "배당소득 검토",
    question: "배당 종류·국내외 원천·원천징수·합산 대상",
  },
  {
    id: "gain",
    label: "주식 매도",
    origin: "취득과 양도의 차이",
    event: "매도·실현",
    category: "양도소득 등 검토",
    question: "국내외·상장 여부·대주주 요건·손익통산·거래세",
  },
  {
    id: "unrealized",
    label: "보유 주가 상승",
    origin: "평가액 변화",
    event: "아직 매도하지 않음",
    category: "평가와 실현 구분",
    question:
      "상품 구조·과세 사건·계좌 규칙을 확인. 평가이익을 현금 입금으로 세지 않음",
  },
];
export function investmentRoute(id = "interest", account = "ordinary") {
  choice(account, ["ordinary", "special"]);
  const item = investmentKinds.find((r) => r.id === id);
  if (!item) throw new RangeError("Unknown income");
  const nodes = [
    { label: "① 수익의 원천", detail: item.origin },
    { label: "② 사건과 시점", detail: item.event },
    { label: "③ 소득 분류", detail: item.category },
    {
      label: "④ 계좌와 조건",
      detail:
        account === "special"
          ? "특례계좌의 가입·상품·해지 조건을 추가 확인"
          : item.question,
    },
  ];
  return {
    ...item,
    account,
    nodes,
    result: "자료 부족 · 세율과 최종세액은 확정하지 않음",
  };
}
export const accountKinds = [
  {
    id: "ordinary",
    label: "일반계좌",
    checks: ["소득의 종류", "원천징수·신고 조건", "국내외·납세자 조건"],
    detail: "계좌 이름보다 그 안의 소득과 거래를 먼저 봅니다.",
  },
  {
    id: "isa",
    label: "ISA",
    checks: ["가입·유지 요건", "편입상품·손익통산 범위", "만기·중도해지 조건"],
    detail:
      "계좌 안의 손익에 적용하는 특례입니다. 모든 자산이 들어가거나 모든 소득이 무조건 면세되는 뜻은 아닙니다.",
  },
  {
    id: "pension",
    label: "연금계좌",
    checks: [
      "납입 재원·공제 이력",
      "인출 시점·수령 방식",
      "연금수령·연금외수령 구분",
    ],
    detail: "지금 받은 공제와 나중에 돈을 꺼낼 때의 과세를 함께 확인합니다.",
  },
];
export function accountRoute(id = "isa", states = ["yes", "unknown", "yes"]) {
  const item = accountKinds.find((r) => r.id === id);
  if (!item || !Array.isArray(states) || states.length !== 3)
    throw new RangeError("Unknown account");
  [0, 1, 2].forEach((i) => choice(states[i], ["yes", "no", "unknown"]));
  const gates = item.checks.map((label, i) => ({
    label,
    state: states[i],
    symbol: states[i] === "yes" ? "✓" : states[i] === "no" ? "×" : "?",
    status:
      states[i] === "yes"
        ? "자료 확인"
        : states[i] === "no"
          ? "조건 불일치"
          : "미확인",
  }));
  return {
    ...item,
    gates,
    result: states.includes("no")
      ? "조건 불일치 · 일반 규칙·예외·추징 여부 확인"
      : states.includes("unknown")
        ? "미확인 조건이 남음 · 혜택 확정 불가"
        : "자료 세 가지 확인 · 실제 적용연도·세액은 별도 검토",
  };
}
export const housingEvents = [
  {
    id: "buy",
    label: "① 취득",
    time: "집을 얻는 때",
    kind: "취득세 등 · 지방세",
    check: "취득 원인·가격·주택 수·감면 요건",
    symbol: "＋",
  },
  {
    id: "hold",
    label: "② 보유",
    time: "과세 기준일",
    kind: "재산세 · 지방세 / 종합부동산세 · 국세",
    check: "기준일의 소유자·공시가격·과세 대상",
    symbol: "⌂",
  },
  {
    id: "sell",
    label: "③ 양도",
    time: "대가를 받고 넘기는 때",
    kind: "양도소득세 및 지방소득세 등",
    check: "취득·양도 시점과 금액·필요경비·비과세 조건",
    symbol: "−",
  },
];
export function housingRoute(index = 0) {
  if (!Number.isInteger(index) || index < 0 || index > 2)
    throw new RangeError("Unknown stage");
  return {
    events: housingEvents,
    current: housingEvents[index],
    index,
    result:
      "서로 다른 사건·세목입니다. 취득 때 냈다고 보유·양도 단계가 끝나지 않습니다.",
  };
}
export function transferBase({
  kind = "gift",
  value = 400,
  prior = 50,
  deduction = 100,
  confirmed = true,
} = {}) {
  choice(kind, ["gift", "inheritance"]);
  if (typeof confirmed !== "boolean")
    throw new TypeError("confirmed must be boolean");
  [value, prior, deduction].forEach((n) => amount(n));
  if (value + prior > MODEL_LIMIT) throw new RangeError("Combined value");
  const combined = value + prior,
    usedDeduction = Math.min(combined, deduction),
    base = confirmed ? combined - usedDeduction : null;
  return {
    kind,
    value,
    prior,
    deduction,
    combined,
    usedDeduction,
    base,
    scope:
      kind === "gift"
        ? "가상 수증자 한 명의 이전 재산"
        : "가상 상속재산 전체의 출발 묶음",
    result:
      base === null
        ? "평가·합산·공제 조건 미확인: 과세표준 계산 보류"
        : `가정한 과세표준 ${base} 단위. 실제 증여·상속세 계산이 아닙니다.`,
    frames: [
      {
        label: "① 평가",
        value,
        detail: "현재 손에 든 현금이 아니라 평가해야 할 재산부터 확인합니다.",
      },
      {
        label: "② 합산 가정",
        value: combined,
        detail:
          "가상 사례에서는 이전 재산을 함께 더했습니다. 현실의 대상·기간·이미 낸 세금은 별도 확인합니다.",
      },
      {
        label: "③ 공제 가정",
        value: base,
        detail:
          "공제 전 재산과 공제 후 과세표준을 구분합니다. 모르는 조건을 0으로 대신하지 않습니다.",
      },
    ],
  };
}
export function deductionComparison(base = 400, amountOff = 50) {
  amount(base);
  amount(amountOff);
  const plain = settlement({ base, credit: 0, prepaid: 0 }),
    income = settlement({ base, deduction: amountOff, credit: 0, prepaid: 0 }),
    credit = settlement({ base, credit: amountOff, prepaid: 0 });
  return {
    base,
    amountOff,
    rows: [
      { id: "plain", label: "공제 없음", ...plain },
      { id: "income", label: "소득공제", ...income },
      { id: "credit", label: "세액공제", ...credit },
    ].map((r) => ({ ...r, saving: plain.finalTax - r.finalTax })),
  };
}
export function taxTimeline({
  monthly = 8,
  finalTax = 80,
  settleMonth = 14,
} = {}) {
  amount(monthly);
  amount(finalTax);
  if (
    monthly * 12 > MODEL_LIMIT ||
    !Number.isInteger(settleMonth) ||
    settleMonth < 13 ||
    settleMonth > 18
  )
    throw new RangeError("Timeline");
  const prepaid = monthly * 12,
    difference = finalTax - prepaid;
  const frames = Array.from({ length: 19 }, (_, month) => {
    const withheld = month >= 1 && month <= 12 ? monthly : 0;
    const adjustment = month === settleMonth ? difference : 0;
    const cumulative =
      Math.min(month, 12) * monthly + (month >= settleMonth ? difference : 0);
    return {
      month,
      withheld,
      adjustment,
      cumulative,
      label:
        month === 0
          ? "기준 시작"
          : month <= 12
            ? `Y년 ${month}월`
            : `Y+1년 ${month - 12}월`,
      phase:
        month === 0
          ? "시작"
          : month <= 12
            ? "소득 귀속·원천징수"
            : month < settleMonth
              ? "정산·자료 확인 대기"
              : month === settleMonth
                ? "가상 차액 납부·환급"
                : "정산 후",
      detail:
        month === settleMonth
          ? difference < 0
            ? "음수 조정은 돈이 돌아오는 환급입니다."
            : difference > 0
              ? "양수 조정은 추가 납부입니다."
              : "조정할 차액이 없습니다."
          : "신고 또는 자료 확인만으로 현금이 이미 도착했다고 세지 않습니다.",
    };
  });
  return { monthly, finalTax, prepaid, difference, settleMonth, frames };
}
export const taxDocuments = [
  {
    id: "payslip",
    label: "가상 급여명세서",
    context: "Y년 6월 · 국내 가상 고용주 · 단위 1",
    rows: [
      {
        label: "지급총액 300",
        kind: "fact",
        why: "이 가상 문서에 적힌 지급액입니다. 세법상 총급여나 과세표준과 같다는 뜻은 아닙니다.",
      },
      {
        label: "사회보험 25 / 원천징수 세금 15",
        kind: "fact",
        why: "서로 다른 공제 목적지가 적혀 있습니다.",
      },
      {
        label: "매달 이 금액이 같을 것이다",
        kind: "assumption",
        why: "한 달의 명세서만으로 다음 달이나 연간 합계를 확정할 수 없습니다.",
      },
      {
        label: "올해 최종 세금도 15일까?",
        kind: "unknown",
        why: "귀속기간 전체 소득·공제·결정세액이 필요합니다.",
      },
    ],
  },
  {
    id: "settlement",
    label: "가상 정산 결과",
    context: "Y년 귀속 · Y+1년 정산 · 가상 단위",
    rows: [
      {
        label: "결정세액 70 / 기납부세액 90",
        kind: "fact",
        why: "같은 귀속연도·같은 세목의 값이라는 문서 조건을 확인했습니다.",
      },
      {
        label: "차감세액 −20",
        kind: "fact",
        why: "70−90=−20으로 환급 방향입니다. 새 소득 20이 생긴 것이 아닙니다.",
      },
      {
        label: "환급은 다음 달 반드시 입금된다",
        kind: "assumption",
        why: "금액 계산과 실제 지급일은 다른 정보입니다.",
      },
      {
        label: "실제 입금 완료 여부",
        kind: "unknown",
        why: "처리 상태·지급 내역 또는 통장 입금 기록을 별도로 확인해야 합니다.",
      },
    ],
  },
  {
    id: "account",
    label: "가상 계좌 안내",
    context: "가상 상품 설명 · 과세연도 미기재",
    rows: [
      {
        label: "조건 충족 시 혜택 제공",
        kind: "fact",
        why: "문서가 조건부라고 적었다는 사실만 확인됩니다. 개인의 충족 여부는 아닙니다.",
      },
      {
        label: "모든 투자 이익이 세금 0이다",
        kind: "assumption",
        why: "상품·소득·계좌·인출 조건을 생략한 확대 해석입니다.",
      },
      {
        label: "적용연도와 중도해지 조건",
        kind: "unknown",
        why: "법령의 시행일, 계약 조건, 변경 안내를 찾아야 합니다.",
      },
      {
        label: "세금 혜택이면 원금도 보장된다",
        kind: "assumption",
        why: "세제 조건과 투자 손실 위험은 서로 다른 축입니다.",
      },
    ],
  },
];
export function documentReview(id = "payslip") {
  const item = taxDocuments.find((r) => r.id === id);
  if (!item) throw new RangeError("Unknown document");
  return item;
}

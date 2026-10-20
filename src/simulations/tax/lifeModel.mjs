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

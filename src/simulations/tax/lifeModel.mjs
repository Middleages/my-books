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

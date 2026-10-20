export const brackets = [
  { start: 0, end: 100, rate: 0.1 },
  { start: 100, end: 300, rate: 0.2 },
  { start: 300, end: Infinity, rate: 0.3 },
];
export function progressiveTax(amount) {
  if (!Number.isFinite(amount) || amount < 0)
    throw new RangeError("Invalid taxable base");
  const parts = brackets.map((b) => {
    const base = Math.max(0, Math.min(amount, b.end) - b.start);
    return { ...b, base, tax: base * b.rate };
  });
  const tax = parts.reduce((s, p) => s + p.tax, 0);
  return {
    amount,
    parts,
    tax,
    averageRate: amount === 0 ? null : tax / amount,
  };
}
export const events = [
  {
    id: "salary",
    label: "급여 수령",
    from: "고용주",
    to: "가계",
    kind: "소득",
    check: "소득 종류·비과세 요건 확인",
  },
  {
    id: "shopping",
    label: "상품 구매",
    from: "가계",
    to: "판매자",
    kind: "소비",
    check: "과세·면세 거래 여부 확인",
  },
  {
    id: "transfer",
    label: "본인 계좌 이체",
    from: "생활 통장",
    to: "저축 통장",
    kind: "원금 이동",
    check: "새로운 소득과 단순 원금 이동 구분",
  },
  {
    id: "holding",
    label: "주택 보유",
    from: "소유자",
    to: "보유 자산",
    kind: "보유",
    check: "자산·기준일·과세 대상 확인",
  },
  {
    id: "gift",
    label: "재산 증여",
    from: "주는 사람",
    to: "받는 사람",
    kind: "이전",
    check: "재산·관계·평가·공제 조건 확인",
  },
];

// 모든 금액은 정수 만원. 소비 즉시 소모되는 재화·서비스만 다룬다.
export const initialWallet = {
  living: 300,
  reserve: 200,
  other: 500,
  loan: 600,
  card: 0,
  income: 0,
  spending: 0,
  interest: 0,
};
export function totals(w) {
  const cash = w.living + w.reserve,
    assets = cash + w.other,
    debt = w.loan + w.card;
  return { cash, assets, debt, net: assets - debt };
}
export const scenarios = [
  {
    id: "transfer",
    label: "내 계좌 이체",
    steps: ["transfer"],
    paths: [["생활통장", "목적통장"]],
    notes: ["내 돈의 위치만 바뀝니다. 수입도 소비도 아닙니다."],
  },
  {
    id: "card",
    label: "카드 구매 → 결제",
    steps: ["purchase", "cardPayment"],
    paths: [
      ["카드채무", "상점 · 소비"],
      ["생활통장", "카드채무 상환"],
    ],
    notes: [
      "구매: 현금은 그대로, 소비와 카드채무가 늘어납니다.",
      "결제: 이미 기록한 소비를 더하지 않고 현금과 카드채무를 줄입니다.",
    ],
  },
  {
    id: "principal",
    label: "대출 원금 상환",
    steps: ["principal"],
    paths: [["생활통장", "대출채무 상환"]],
    notes: ["현금과 대출채무가 같은 금액만큼 줄어 순자산은 그대로입니다."],
  },
  {
    id: "interest",
    label: "대출 이자 납부",
    steps: ["interest"],
    paths: [["생활통장", "은행 · 이자 비용"]],
    notes: [
      "이자는 빌린 대가입니다. 비용과 현금 유출이 생기지만 대출 원금은 그대로입니다.",
    ],
  },
  {
    id: "borrow",
    label: "대출금 입금",
    steps: ["borrow"],
    paths: [["은행 · 빌린 돈", "생활통장"]],
    notes: ["현금과 대출채무가 함께 늘어납니다. 수입이나 이익은 아닙니다."],
  },
  {
    id: "salary",
    label: "급여 입금",
    steps: ["salary"],
    paths: [["직장 · 세후 급여", "생활통장"]],
    notes: ["가상의 세후 급여입니다. 현금·수입·순자산이 함께 늘어납니다."],
  },
  {
    id: "cashPurchase",
    label: "현금 소비",
    steps: ["cashPurchase"],
    paths: [["생활통장", "상점 · 소비"]],
    notes: ["바로 소모한 서비스의 비용입니다. 현금과 순자산이 줄어듭니다."],
  },
];
export function transact(w, kind, amount) {
  if (!Number.isSafeInteger(amount) || amount < 0)
    throw new RangeError("금액은 0 이상의 정수 만원이어야 합니다.");
  if (
    ![
      "transfer",
      "purchase",
      "cardPayment",
      "principal",
      "interest",
      "borrow",
      "salary",
      "cashPurchase",
    ].includes(kind)
  )
    throw new Error("알 수 없는 거래");
  if (
    [
      "transfer",
      "cardPayment",
      "principal",
      "interest",
      "cashPurchase",
    ].includes(kind) &&
    amount > w.living
  )
    throw new RangeError("생활통장 잔액 부족");
  if (kind === "cardPayment" && amount > w.card)
    throw new RangeError("카드채무 초과");
  if (kind === "principal" && amount > w.loan)
    throw new RangeError("대출채무 초과");
  const n = { ...w };
  if (kind === "transfer") {
    n.living -= amount;
    n.reserve += amount;
  }
  if (kind === "purchase") {
    n.card += amount;
    n.spending += amount;
  }
  if (kind === "cardPayment") {
    n.living -= amount;
    n.card -= amount;
  }
  if (kind === "principal") {
    n.living -= amount;
    n.loan -= amount;
  }
  if (kind === "interest") {
    n.living -= amount;
    n.spending += amount;
    n.interest += amount;
  }
  if (kind === "borrow") {
    n.living += amount;
    n.loan += amount;
  }
  if (kind === "salary") {
    n.living += amount;
    n.income += amount;
  }
  if (kind === "cashPurchase") {
    n.living -= amount;
    n.spending += amount;
  }
  return n;
}
export function transactionFrames(start, id, amount) {
  const s = scenarios.find((s) => s.id === id);
  if (!s) throw new Error("알 수 없는 사례");
  let wallet = { ...start };
  const frames = [
    {
      wallet,
      phase: "before",
      label: "거래 전",
      path: s.paths[0],
      note: "어떤 잔액이 바뀔지 먼저 예측해 보세요.",
    },
  ];
  s.steps.forEach((step, i) => {
    frames.push({
      wallet,
      phase: "moving",
      label: `${i + 1}번째 거래 · 경로 관찰 (미확정)`,
      path: s.paths[i],
      note: s.notes[i],
    });
    wallet = transact(wallet, step, amount);
    frames.push({
      wallet,
      phase: "after",
      label: `${i + 1}번째 거래 확정`,
      path: s.paths[i],
      note: s.notes[i],
    });
  });
  return frames;
}

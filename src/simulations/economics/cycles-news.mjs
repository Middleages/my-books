import { market } from "./foundations.mjs";
// Self-authored quarterly indices, not observations or an estimated macro model.
const a = [100, 106, 112, 108, 108, 108, 110, 114, 118];
const b = [100, 102, 104, 96, 88, 84, 84, 84, 84];
const orders = [100, 104, 98, 94, 92, 93, 95, 97, 99];
const employment = [100, 100, 104, 108, 102, 98, 96, 97, 99];
const finite = (v, min = 0, max = 100000) => {
  if (!Number.isFinite(v) || v < min || v > max)
    throw new RangeError("가상 모형 범위 밖입니다.");
};
export function changeRate(current, base) {
  finite(current);
  finite(base);
  return base === 0 ? null : (current / base - 1) * 100;
}
export function cycleRows() {
  return a.map((v, quarter) => ({
    quarter,
    a: v,
    b: b[quarter],
    output: (v + b[quarter]) / 2,
    orders: orders[quarter],
    employment: employment[quarter],
  }));
}
export function cycleSnapshot(quarter = 6) {
  finite(quarter, 0, 8);
  if (!Number.isInteger(quarter)) throw new RangeError("분기는 정수입니다.");
  const rows = cycleRows(),
    r = rows[quarter],
    previous = quarter ? rows[quarter - 1].output : null,
    peak = Math.max(...rows.slice(0, quarter + 1).map((r) => r.output));
  return {
    ...r,
    previous,
    peak,
    growth: previous === null ? null : changeRate(r.output, previous),
    annualGrowth:
      quarter < 4 ? null : changeRate(r.output, rows[quarter - 4].output),
    employmentGrowth: quarter
      ? changeRate(r.employment, rows[quarter - 1].employment)
      : null,
    fromPeak: changeRate(r.output, peak),
  };
}
export function outputGap(actual = 97, potential = 102) {
  finite(actual, 0, 130);
  finite(potential, Number.MIN_VALUE, 130);
  return {
    actual,
    potential,
    difference: actual - potential,
    gap: (actual / potential - 1) * 100,
  };
}
export const categories = Object.freeze(
  [
    { id: "observation", label: "관측 사실" },
    { id: "assumption", label: "가정" },
    { id: "interpretation", label: "해석" },
    { id: "forecast", label: "전망" },
  ].map(Object.freeze),
);
export const newsIds = Object.freeze(["demand", "cost", "mixed"]);
const categoryReason = {
  observation:
    "자료의 기간·단위·집계 범위가 정해진 관찰입니다. 원인까지 증명하지 않습니다.",
  assumption:
    "설명에 필요한 조건을 일정하다고 놓은 것입니다. 관측으로 확인했는지는 별도입니다.",
  interpretation:
    "자료와 가정을 연결한 설명입니다. 가능한 다른 원인과 함께 검토합니다.",
  forecast:
    "아직 관측하지 않은 미래에 관한 조건부 문장입니다. 실현된 사실과 구분합니다.",
};
const fmt = (v) => v.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
export function newsCase(id = "demand") {
  if (!newsIds.includes(id)) throw new RangeError("알 수 없는 가상 뉴스");
  const base = market(0, 0, 3500),
    current =
      id === "mixed"
        ? null
        : market(id === "demand" ? 40 : 0, id === "cost" ? -40 : 0, 3500),
    cycle = id === "mixed" ? cycleSnapshot(6) : null;
  const demand = id === "demand";
  const claims =
    id === "mixed"
      ? [
          {
            id: "fact",
            category: "observation",
            text: `Q6 전체 생산지수 ${cycle.output}, 전분기 대비 ${fmt(cycle.growth)}%. 고용지수는 ${cycle.employment}로 전분기보다 낮다.`,
          },
          {
            id: "condition",
            category: "assumption",
            text: "두 부문을 기준 가격으로 평가한 같은 크기의 기준 생산에서 출발했다고 놓는다.",
          },
          {
            id: "reading",
            category: "interpretation",
            text: "전체 생산의 반등과 고용·일부 부문의 약세가 함께 있어 체감이 다를 수 있다.",
          },
          {
            id: "future",
            category: "forecast",
            text: "생산 증가가 이어지고 고용 조정도 뒤따른다면 다음 분기 고용이 개선될 수 있다.",
          },
        ]
      : [
          {
            id: "fact",
            category: "observation",
            text: `가상 빵 시장의 하루 가격은 ${fmt(base.equilibrium.price)}→${fmt(current.equilibrium.price)}원/개, 거래량은 ${base.equilibrium.quantity}→${current.equilibrium.quantity}개/일이다.`,
          },
          {
            id: "condition",
            category: "assumption",
            text: demand
              ? "같은 품질이며 공급 조건과 곡선 모양은 변하지 않았다고 놓는다."
              : "같은 품질이며 수요 조건과 곡선 모양은 변하지 않았다고 놓는다.",
          },
          {
            id: "reading",
            category: "interpretation",
            text: demand
              ? "이 조건에서 가격·수량의 동반 상승은 수요 확대와 일치한다."
              : "이 조건에서 가격 상승·수량 감소는 공급 축소와 일치한다.",
          },
          {
            id: "future",
            category: "forecast",
            text: demand
              ? "늘어난 수요가 유지되고 공급 조건이 같다면 이후 가격 압력이 이어질 수 있다."
              : "원가 압력이 완화되고 다른 조건이 같다면 이후 공급 여건이 나아질 수 있다.",
          },
        ];
  const evidence =
    id === "mixed"
      ? [
          {
            id: "sectors",
            label: "부문별 생산·고용·가계 소득",
            role: "범위 확인",
            reason:
              "전체 평균이 어느 부문·가계까지 나타나는지 확인합니다. 평균만으로 개인 소득을 정할 수 없습니다.",
          },
          {
            id: "timing",
            label: "고용의 조사 기간·근로시간·수정치",
            role: "시점·분모 점검",
            reason:
              "다른 기간·구성과 통계 수정의 영향을 구분합니다. 취업자 수와 근로시간도 다른 지표입니다.",
          },
          {
            id: "headline",
            label: "전체 성장률 제목 하나",
            role: "근거 부족",
            reason:
              "이미 본 전체 숫자만 반복합니다. 고용 회복·전 부문 개선을 입증하지 않습니다.",
          },
        ]
      : [
          {
            id: "demand-data",
            label: "주문·방문객·소득 등 수요 자료",
            role: demand ? "해석 보강" : "수요 고정 가정 점검",
            reason: demand
              ? "구매 의향이 늘었는지 확인합니다. 판매액 증가만으로는 가격 효과를 분리할 수 없습니다."
              : "수요도 동시에 변했다면 공급만의 변화라는 설명을 다시 검토해야 합니다.",
          },
          {
            id: "supply-data",
            label: "원재료 가격·가동 중단·공급 능력",
            role: demand ? "공급 고정 가정 점검" : "해석 보강",
            reason: demand
              ? "공급 여건도 바뀌었는지 확인해 수요만의 설명을 점검합니다."
              : "원가·생산 제약의 변화를 확인합니다. 가격 상승만으로 원가가 원인이라고 확정하지 않습니다.",
          },
          {
            id: "headline",
            label: "가격 상승 제목 하나",
            role: "근거 부족",
            reason:
              "수요 확대와 공급 축소 모두 가격을 올릴 수 있어 제목만으로 원인을 가를 수 없습니다.",
          },
        ];
  return {
    id,
    title:
      id === "mixed"
        ? "생산 반등, 고용·체감은 여전히 약세"
        : demand
          ? "빵값과 판매량 동반 상승"
          : "빵값 오르고 판매량 감소",
    base,
    market: current,
    cycle,
    claims: claims.map((c) => ({ ...c, reason: categoryReason[c.category] })),
    evidence,
    counterexample:
      id === "mixed"
        ? "고용이 항상 정확히 한 분기 뒤 회복하는 것은 아닙니다. 생산성·근로시간·산업 구성이나 새 충격에 따라 고용 경로가 달라질 수 있습니다."
        : demand
          ? "공급 여건·품질·조사 대상도 함께 바뀌었다면 수요만 늘었다는 설명은 불충분합니다. 이 직선 모형의 고정 공급 가정을 현실 자료로 확인해야 합니다."
          : "수요 위축이 동시에 있었다면 공급만의 변화로 거래량 감소 전부를 설명하기 어렵습니다. 현재 실험은 수요 고정이라는 조건을 둔 비교입니다.",
  };
}
export function assessNews(id, answers = {}, selected = []) {
  const c = newsCase(id);
  for (const [key, value] of Object.entries(answers))
    if (
      !c.claims.some((r) => r.id === key) ||
      !categories.some((r) => r.id === value)
    )
      throw new RangeError("알 수 없는 문장·분류");
  if (selected.some((v) => !c.evidence.some((e) => e.id === v)))
    throw new RangeError("알 수 없는 확인 자료");
  const feedback = c.claims.map((r) => ({
    id: r.id,
    category: r.category,
    correct: answers[r.id] === r.category,
    reason: r.reason,
  }));
  return {
    correct: feedback.filter((r) => r.correct).length,
    total: feedback.length,
    feedback,
    evidence: c.evidence.filter((e) => selected.includes(e.id)),
  };
}

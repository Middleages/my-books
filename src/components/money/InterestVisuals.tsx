import type { InterestFrame } from "../../simulations/money/interest.mjs";
import type { InterestVisual } from "../../simulations/money/interest-visual.mjs";
import "./interest-visuals.css";
export const interestWon = (n: number) =>
  `${(Math.abs(n) < 1e-8 ? 0 : n).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}원`;
export function InterestPools({
  frame: f,
  kind,
  scale,
  firstInterest = 0,
}: {
  frame: InterestFrame;
  kind: "simple" | "compound";
  scale: number;
  firstInterest?: number;
}) {
  const showCoin = firstInterest > 0 && f.month > 0;
  return (
    <div
      className={`iv-pools iv-${kind}`}
      aria-label={`${kind === "simple" ? "단리" : "복리"} 운용금과 별도 보관금`}
    >
      <div className="iv-vessels">
        <div className="iv-vessel iv-active-pot">
          <div
            className="iv-level"
            style={{ height: `${(f.active / scale) * 100}%` }}
            aria-hidden="true"
          />
          <b>↻ 운용 중</b>
          <strong>{interestWon(f.active)}</strong>
          <small>다음 이자를 만드는 돈</small>
        </div>
        <div className="iv-vessel iv-reserve-pot">
          <div
            className="iv-level"
            style={{ height: `${(f.reserve / scale) * 100}%` }}
            aria-hidden="true"
          />
          <b>별도 보관</b>
          <strong>{interestWon(f.reserve)}</strong>
          <small>내 돈이지만 이자 없음</small>
        </div>
      </div>
      {firstInterest > 0 && (
        <div
          className={`iv-first-interest ${showCoin ? "iv-coin-present" : ""}`}
          aria-hidden="true"
        >
          <span>첫 달 이자</span>
          <b>{interestWon(firstInterest)}</b>
        </div>
      )}
      <p className="iv-total">
        둘 다 내 돈 · 합계 <b>{interestWon(f.total)}</b>
      </p>
    </div>
  );
}
export function InterestCostScene({ scene: s }: { scene: InterestVisual }) {
  const row = (label: string, value: number, style: string) => (
    <div className="iv-cost-row">
      <div>
        <span>{label}</span>
        <b>{interestWon(value)}</b>
      </div>
      <div className="iv-cost-track" aria-hidden="true">
        <i />
        <span
          className={style}
          style={{
            left: `${50 + (Math.min(0, value) / s.costMax) * 48}%`,
            width: `${(Math.abs(value) / s.costMax) * 48}%`,
          }}
        />
      </div>
    </div>
  );
  return (
    <figure
      className="iv-figure iv-cost-scene"
      aria-label="직접 비용과 이후 경로 차이 분해"
    >
      <div className="iv-kicker">02 / 비용은 어디까지 영향을 줄까?</div>
      <h3>직접 낸 비용과 최종 차액은 달라요</h3>
      <p>
        지금 관찰하는 <b>{s.compound.month}개월의 같은 단계</b>에서, 비용 없는
        복리와 현재 복리를 비교합니다.
      </p>
      <div className="iv-cost-totals">
        <span>
          비용 없는 복리 <b>{interestWon(s.free.total)}</b>
        </span>
        <span>
          현재 복리 <b>{interestWon(s.compound.total)}</b>
        </span>
      </div>
      {row("① 직접 차감한 누적 세금·수수료", s.directCost, "iv-direct-cost")}
      {row("② 이후 수익·손실 경로의 차이", s.pathEffect, "iv-path-effect")}
      {row("① + ② = 두 총액의 차이", s.gap, "iv-total-gap")}
      <p className="iv-insight" role="status">
        {s.directCost === 0
          ? "현재까지 차감한 비용이 없습니다. ‘가상 비용 넣기’ 뒤 마지막 월말을 보면 누적 차이를 비교할 수 있어요."
          : s.pathEffect > 1e-7
            ? "빠져나간 돈은 이후 이자도 만들지 못했습니다. 두 총액의 차이를 전부 직접 낸 수수료로 세면 안 됩니다."
            : s.pathEffect < -1e-7
              ? "음수 수익에서는 비용 없는 경로의 더 많은 돈에도 손실이 붙습니다. 경로 차이는 음수가 될 수 있으며, 비용이 이익이라는 뜻은 아닙니다."
              : "이 조건에서는 이후 경로의 차이가 없거나 아직 발생하지 않았습니다."}
      </p>
      <figcaption>
        길이 = 원 단위 금액 · 가운데 점선 = 0 · 왼쪽 음수/오른쪽 양수. 세
        막대·모든 단계는 같은 눈금을 씁니다. ②는 실제로 청구된 비용이 아니라
        ‘총액 차이 − 직접 비용’입니다. 원 단위 독립 반올림으로 합계가 1원 다를
        수 있습니다.
      </figcaption>
    </figure>
  );
}

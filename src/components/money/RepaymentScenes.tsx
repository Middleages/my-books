import { useState } from "react";
import {
  projectRepayment,
  type RepaymentResult,
  type RepaymentKind,
} from "../../simulations/money/repayment.mjs";
import {
  repaymentScene,
  repaymentMilestones,
  type RepaymentScene,
} from "../../simulations/money/repayment-visual.mjs";
import { PaymentBar, won, repaymentLabels } from "./RepaymentVisuals";
import "./repayment-scenes.css";
const phases = ["월초 빚", "이자 계산", "납입 → 두 갈래", "남은 빚 확인"];
export function RepaymentFlow({
  scene: s,
  onPhase,
}: {
  scene: RepaymentScene;
  onPhase: (phase: number) => void;
}) {
  const { row: r, frame: f } = s,
    paid = f.phase >= 2;
  return (
    <figure
      className="rv-scene rv-flow"
      aria-label="납입액의 두 갈래와 원금 감소"
    >
      <div className="rv-kicker">01 / 통장에서 나간 돈은 어디로 갈까요?</div>
      <h3>이자는 비용으로, 원금은 빚을 줄이는 데</h3>
      <div
        className="rv-phase-buttons"
        role="group"
        aria-label="상환 장면 선택"
      >
        {phases.map((p, i) => (
          <button
            key={p}
            aria-pressed={f.phase === i}
            onClick={() => onPhase(i)}
          >
            {i + 1}. {p}
          </button>
        ))}
      </div>
      <div className="rv-payment-source">
        <span>{f.month}개월 · 이달 예정 납입</span>
        <strong>{won(r.payment)}</strong>
        <PaymentBar row={r} scale={Math.max(1, r.payment)} />
      </div>
      <div className={`rv-branches ${paid ? "rv-paid" : ""}`}>
        <section className="rv-principal-route">
          <span className="rv-arrow" aria-hidden="true">
            ↓
          </span>
          <h4>
            원금 상환{" "}
            <span className="rv-route-amount">{won(r.principal)}</span>
          </h4>
          <p>
            {paid
              ? "납입 반영 · 빚에서 빠짐"
              : "납입 예정 · 아직 빚에서 빠지지 않음"}
          </p>
          <span className="rv-route-symbol" aria-hidden="true">
            −
          </span>
          <b>남은 빚을 줄임</b>
        </section>
        <section className="rv-interest-route">
          <span className="rv-arrow" aria-hidden="true">
            ↓
          </span>
          <h4>
            이자 납부 <span className="rv-route-amount">{won(r.interest)}</span>
          </h4>
          <p>
            {paid
              ? "납입 반영 · 이번 달 빌린 비용"
              : "납입 예정 · 이번 달 빌린 비용"}
          </p>
          <span className="rv-receipt" aria-hidden="true">
            이용 비용
          </span>
          <b>원금에서는 빼지 않음</b>
        </section>
      </div>
      <div className="rv-debt-picture">
        <h4>이달 원금 잔액 · 같은 눈금으로 전후 비교</h4>
        <div className="rv-debt-row">
          <span>
            월초 <b>{won(r.opening)}</b>
          </span>
          <div className="rv-debt-track" aria-hidden="true">
            <i
              className="rv-balance"
              style={{ width: `${(r.opening / s.principalScale) * 100}%` }}
            />
          </div>
        </div>
        <div className="rv-debt-row">
          <span>
            현재 단계 <b>{won(f.balance)}</b>
          </span>
          <div className="rv-debt-track" aria-hidden="true">
            <i
              className="rv-balance"
              style={{ width: `${(f.balance / s.principalScale) * 100}%` }}
            />
            <i
              className="rv-cleared"
              style={{
                left: `${(f.balance / s.principalScale) * 100}%`,
                width: `${(s.appliedPrincipal / s.principalScale) * 100}%`,
              }}
            />
          </div>
        </div>
        <p className="rv-legend">
          파랑 실선 = 남은 원금 · 초록 점선 = 이달 갚은 원금 · 빈 부분 = 이전
          달까지 갚은 원금
        </p>
      </div>
      <p className="rv-insight" role="status">
        {paid
          ? `${won(r.payment)}을 내도 빚은 원금 몫 ${won(r.principal)}만 줄어듭니다. ${won(r.opening)} − ${won(r.principal)} = ${won(f.balance)}.`
          : f.phase === 1
            ? `월초 원금으로 이자 ${won(r.interest)}을 계산했습니다. 아직 납입 전이라 원금 잔액은 ${won(f.balance)}입니다.`
            : `아직 이번 달 납입 전입니다. 아래 두 갈래 금액은 예정 내역이며, 현재 빚은 ${won(f.balance)}입니다.`}
      </p>
      <figcaption>
        납입 단계에서 원금을 한 번만 차감하고 마지막 단계는 확인만 합니다. 잔액
        띠 전체 길이 = 최초 원금(0원은 빈 띠). 납입 구성 막대는 그달 납입액을
        100%로 나눈 비율입니다. 화살표·기호 크기는 금액이나 실제 처리 시간을
        뜻하지 않습니다. 월말 예정 전액 납입·비용 제외 가정.
      </figcaption>
    </figure>
  );
}
const primerResult = projectRepayment({
  principal: 3000000,
  annualRate: 12,
  months: 3,
});
export function RepaymentPrimerScene() {
  const [phase, setPhase] = useState(2);
  return (
    <div className="rv-primer">
      <p className="rv-example">
        가상 예시 · 300만원 / 원금균등 3개월 / 명목연율 12% → 월율 1%
      </p>
      <RepaymentFlow
        scene={repaymentScene(primerResult, "equalPrincipal", phase)}
        onPhase={setPhase}
      />
    </div>
  );
}
export function RepaymentRhythms({
  result,
  kind,
}: {
  result: RepaymentResult;
  kind: RepaymentKind;
}) {
  const m = repaymentMilestones(result, kind),
    last = result.paths[kind].rows.length;
  return (
    <figure
      className="rv-scene rv-rhythms"
      aria-label="첫 달과 중간과 마지막 달 납입 비교"
    >
      <div className="rv-kicker">02 / 같은 방식의 시간 차이</div>
      <h3>{repaymentLabels[kind]} · 무엇이 같고 무엇이 바뀔까요?</h3>
      <div className="rv-months">
        {m.rows.map((r) => (
          <section key={r.month}>
            <h4>
              {r.month === 1
                ? "첫 달"
                : r.month === last
                  ? "마지막 달"
                  : "중간"}{" "}
              · {r.month}개월
            </h4>
            <PaymentBar row={r} scale={m.paymentMax} />
            <p>
              납입 후 남은 빚 <b>{won(r.closing)}</b>
            </p>
          </section>
        ))}
      </div>
      <p className="rv-insight">
        {kind === "annuity"
          ? "합친 길이는 같고, 이자가 줄어든 만큼 초록 원금 몫이 커집니다."
          : kind === "equalPrincipal"
            ? "초록 원금 몫은 같고, 빗금 이자가 줄어 합친 길이가 짧아집니다."
            : "만기 전에는 빗금 이자만 냅니다. 마지막에는 초록 원금 전액이 함께 붙습니다."}{" "}
        0금리에서는 빗금 이자가 없고, 1개월이면 비교할 달이 하나입니다.
      </p>
      <figcaption>
        초록 = 원금 · 빗금 = 이자 · 합친 길이 = 납입액. 이 그림의 모든 달은 선택
        방식 전체 기간의 최대 납입액을 100%로 쓰는 같은 원 눈금입니다. 방식·입력
        조건을 바꾸면 눈금도 바뀝니다. 방식 간 금액은 위의 같은 달 비교 카드로
        확인하세요. 정적 전체 표는 모든 달의 값을 제공합니다.
      </figcaption>
    </figure>
  );
}

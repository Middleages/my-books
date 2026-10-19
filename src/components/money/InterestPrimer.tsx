import { useState } from "react";
import { interestPrimerFrames } from "../../simulations/money/interest-visual.mjs";
import { InterestPools, interestWon } from "./InterestVisuals";
const stages = interestPrimerFrames();
const titles = [
  "시작 · 원금만 있음",
  "첫 달 · 같은 1,000원",
  "둘째 달 · 다른 계산 기준",
  "둘째 달 · 이자가 만든 이자",
];
export function InterestPrimer() {
  const [step, setStep] = useState(1),
    f = stages[step];
  const poolMax = Math.max(
    ...stages.flatMap((s) => [
      s.simple.active,
      s.compound.active,
      s.simple.reserve,
    ]),
  );
  return (
    <figure
      className="iv-figure iv-primer"
      aria-label="첫 달 이자의 위치와 다음 이자 비교"
    >
      <div className="iv-kicker">01 / 첫 달 이자를 따라가 보세요</div>
      <h3>옆에 보관할까, 다시 일하게 할까?</h3>
      <p>
        같은 10만원·월 1%·추가 납입과 비용 없음. 초록 동전은 첫 달 이자
        1,000원을 가리킵니다.
      </p>
      <div
        className="iv-step-buttons"
        role="group"
        aria-label="두 달의 이자 관찰 단계"
      >
        {titles.map((title, i) => (
          <button
            key={title}
            aria-pressed={step === i}
            onClick={() => setStep(i)}
          >
            {title}
          </button>
        ))}
      </div>
      <div className="iv-primer-columns">
        {(["simple", "compound"] as const).map((kind) => {
          const a = f[kind];
          return (
            <section key={kind}>
              <h4>
                {kind === "simple"
                  ? "단리 · 이자는 옆 칸으로"
                  : "복리 · 이자도 운용금으로"}
              </h4>
              <InterestPools
                frame={a}
                kind={kind}
                scale={poolMax}
                firstInterest={f.firstInterest}
              />
              {step >= 2 && (
                <p className="iv-basis">
                  둘째 달 계산 기준 <b>{interestWon(a.basis)}</b>
                  <span>
                    × 월 1% →{" "}
                    {interestWon(
                      kind === "simple"
                        ? f.secondSimpleReturn
                        : f.secondCompoundReturn,
                    )}
                  </span>
                </p>
              )}
            </section>
          );
        })}
      </div>
      <p className="iv-insight" role="status">
        {step === 0
          ? "아직 이자가 없습니다. 두 방식 모두 운용 원금 100,000원으로 시작합니다."
          : step === 1
            ? "첫 달 총액은 둘 다 101,000원. 이자 1,000원이 놓인 곳만 다릅니다."
            : step === 2
              ? "단리는 100,000원만, 복리는 첫 달 이자를 합친 101,000원이 다음 이자의 바탕입니다."
              : `둘째 달 이자: 단리 ${interestWon(f.simple.periodReturn)} / 복리 ${interestWon(f.compound.periodReturn)}. 첫 달 이자가 추가로 만든 ${interestWon(f.extraInterest)}이 차이입니다.`}
      </p>
      <button
        className="iv-next"
        disabled={step === 3}
        onClick={() => setStep((n) => Math.min(3, n + 1))}
      >
        다음 장면 →
      </button>
      <figcaption>
        단리 보관금도 총액에 포함합니다. 통 높이는 운용금·보관금의 공통 금액
        눈금을 사용하지만, 초록 동전의 크기는 금액 비례가 아닙니다. 동전은 첫 달
        이자만 추적하며 둘째 달 전체 이자는 수치로 표시합니다. 이동 효과는 보관
        위치의 설명이며 실제 송금·연속 시간의 이자 발생을 재현하지 않습니다.
        정적 단계 버튼으로 같은 관계를 확인할 수 있습니다.
      </figcaption>
    </figure>
  );
}

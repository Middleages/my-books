import { useState } from "react";
import { usePlayback } from "../money/shared";
import {
  rateComparison,
  type RealRate,
} from "../../simulations/economics/prices-rates.mjs";
import { RateSlider, num, pct } from "./PriceLabs";
export function RatesMap() {
  const [focus, F] = useState("credit");
  const notes: Record<string, string> = {
    credit:
      "신용: 상환 불확실성과 담보·보증 등 조건이 달라지면 가산금리와 심사도 달라질 수 있습니다.",
    term: "만기: 돈을 묶는 기간과 미래 금리 예상이 다릅니다. 장기금리가 항상 단기금리보다 높다는 보장은 없습니다.",
    funding:
      "조달·경쟁: 은행이 자금을 마련하는 비용, 운영비용, 경쟁과 우대 조건도 예금·대출금리에 관여합니다.",
  };
  return (
    <section className="eco-lab" aria-label="여러 금리의 연결 지도">
      <h3>한 금리가 모든 계약의 가격표는 아닙니다</h3>
      <div className="eco-rate-network">
        <div className="eco-policy">
          <b>한국은행 기준금리</b>
          <span>통화정책의 기준</span>
        </div>
        <div className="eco-link-label">↓ 단기 자금시장에 영향</div>
        <div className="eco-market">
          <b>시장금리</b>
          <span>콜·채권 등 만기·거래별 가격</span>
        </div>
        <div className="eco-link-label">↓ 조달비용·예상·경쟁 등과 연결</div>
        <div className="eco-rate-branches">
          <div>
            <b>예금금리</b>
            <span>만기·상품·우대 조건</span>
          </div>
          <div>
            <b>대출금리</b>
            <span>계약 지표금리 + 가산 − 우대 등</span>
          </div>
        </div>
      </div>
      <div className="eco-options">
        {[
          ["credit", "신용·담보"],
          ["term", "만기·예상"],
          ["funding", "조달·경쟁"],
        ].map(([v, t]) => (
          <button key={v} aria-pressed={v === focus} onClick={() => F(v)}>
            {t}
          </button>
        ))}
      </div>
      <p aria-live="polite">{notes[focus]}</p>
      <p className="eco-note">
        화살표는 영향 관계이며 일정한 가산폭·즉시·같은 방향의 변화를 보장하지
        않습니다. 시장금리는 정책 예상을 먼저 반영할 수도 있습니다. 기준금리가
        바뀌어도 고정금리 계약의 약정금리가 즉시 바뀌지는 않습니다. 실제
        금리값을 산출하지 않는 관계도입니다.
      </p>
    </section>
  );
}
function RateScene({ r, label }: { r: RealRate; label: string }) {
  return (
    <figure className="eco-real-scene">
      <h4>{label}</h4>
      {[
        { name: "명목 금액 배율", value: r.nominalFactor, kind: 0 },
        { name: "물가 배율", value: r.priceFactor, kind: 1 },
      ].map((t) => (
        <div className="eco-index-row" key={t.name}>
          <span>
            {t.name} · {num(t.value)}배
          </span>
          <div className="eco-stack-track" aria-hidden="true">
            <i
              className={`eco-piece eco-piece-${t.kind}`}
              style={{ width: `${(t.value / 2) * 100}%` }}
            />
            <i className="eco-one-marker" />
          </div>
        </div>
      ))}
      <figcaption>
        같은 눈금 0–2배 · 중앙 점선은 1배. 초록 금액 배율을 보라 빗금 물가
        배율로 나눕니다.
      </figcaption>
      <p className="eco-division">
        {num(r.nominalFactor)} ÷ {num(r.priceFactor)}
        <br />
        <strong>
          {r.exact === null
            ? "정의 불가 (물가 배율 0)"
            : `실질금리 ${pct(r.exact)}`}
        </strong>
      </p>
      <p>
        뺄셈 근사 {pct(r.approx)}
        <br />
        {r.exact === null
          ? "물가 −100%는 이 비교의 분모가 0입니다."
          : `정확식 − 근사 = ${num(r.exact - r.approx!)}%p`}
      </p>
    </figure>
  );
}
export function RealRateLab() {
  const [n, N] = useState(5),
    [e, E] = useState(2),
    [a, A] = useState(8),
    [prediction, P] = useState("");
  const play = usePlayback(2),
    r = rateComparison(n, e, a);
  const reset = () => {
    P("");
    play.rewind();
  };
  const preset = (nn: number, ee: number, aa: number) => {
    N(nn);
    E(ee);
    A(aa);
    reset();
  };
  return (
    <section className="eco-lab" aria-label="사전 사후 실질금리 실험">
      <h3>같은 약정금리, 다른 물가 정보</h3>
      <p>
        가상 1년 약정 명목금리를 고정하고 같은 1년의 기대 물가와 실현 물가를
        비교합니다. 세금·수수료·신용손실·중간 현금흐름은 생략합니다.
      </p>
      <div className="eco-options">
        <button onClick={() => preset(5, 2, 8)}>기대와 실현 엇갈림</button>
        <button onClick={() => preset(50, 25, 25)}>근사 차이 크게 보기</button>
        <button onClick={() => preset(0, -10, -10)}>물가 하락</button>
        <button onClick={() => preset(5, -100, -100)}>−100% 경계</button>
      </div>
      <div className="eco-real-pair">
        <RateScene label="계약 시점 · 사전 비교" r={r.before} />
        <RateScene label="1년 뒤 · 사후 비교" r={r.after} />
      </div>
      <div className="eco-controls">
        <RateSlider
          label="1년 명목금리"
          value={n}
          onChange={(v) => {
            N(v);
            reset();
          }}
        />
        <RateSlider
          label="같은 1년 기대 물가상승률"
          value={e}
          onChange={(v) => {
            E(v);
            reset();
          }}
        />
        <RateSlider
          label="같은 1년 실현 물가상승률"
          value={a}
          onChange={(v) => {
            A(v);
            reset();
          }}
        />
      </div>
      <label className="eco-predict">
        예측 · 기대와 실현 물가가 다르면 사전·사후 값은 반드시 같을까요?
        <select value={prediction} onChange={(ev) => P(ev.target.value)}>
          <option value="">예측 선택</option>
          <option value="no">같다고 할 수 없다</option>
          <option value="yes">반드시 같다</option>
        </select>
      </label>
      {play.controls}
      <button onClick={() => preset(5, 2, 8)}>조건까지 초기화</button>
      <p className="eco-stage" aria-live="polite">
        {
          [
            "① 계약 시점: 기대 물가로 계산한 사전 비교",
            "② 1년 뒤: 실현 물가로 다시 계산",
            "③ 같은 약정 · 두 실질금리 비교",
          ][play.step]
        }
      </p>
      <p>
        사전 {pct(r.before.exact)} / 사후 {pct(r.after.exact)}.{" "}
        {play.step === 0
          ? "오른쪽은 비교를 위해 미리 공개한 가상 실현값이며, 계약 당시 알고 있던 정보가 아닙니다."
          : play.step === 1
            ? "약정 명목금리는 그대로입니다. 달라진 것은 비교에 사용하는 물가 정보입니다."
            : "사전 값은 기대 물가라는 조건이 붙고, 사후 값은 실제 실현 물가로 평가합니다. 어느 값도 내 소득·상환 능력을 예측하지 않습니다."}
      </p>
      {play.step === 2 && prediction && (
        <p role="status">
          {prediction === "no" ? "예측과 같습니다." : "예측과 다릅니다."} 기대가
          빗나가면 두 값도 달라질 수 있습니다. 명목금리 −100%처럼 금액 배율이
          0인 예외, 분모가 0인 경계도 구분해야 합니다.
        </p>
      )}
      <p className="eco-note">
        정확식: [(1 + 명목금리/100) ÷ (1 + 물가상승률/100) − 1] × 100. 근사:
        명목금리 − 물가상승률. 물가 −100%에서는 둘 다 비교값을 제공하지
        않습니다. 근처에서는 정확값이 매우 커질 수 있으며 막대를 잘라 실질금리로
        표현하지 않습니다.
      </p>
      <details>
        <summary>정적 대안 · 정확식과 근사 비교표</summary>
        <div
          className="eco-table"
          tabIndex={0}
          role="region"
          aria-label="실질금리 비교표"
        >
          <table>
            <thead>
              <tr>
                <th>시점</th>
                <th>명목(%)</th>
                <th>물가(%)</th>
                <th>정확 실질(%)</th>
                <th>근사(%)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["사전 · 기대", r.before],
                ["사후 · 실현", r.after],
              ].map(([label, v]) => {
                const t = v as RealRate;
                return (
                  <tr key={label as string}>
                    <th>{label as string}</th>
                    <td>{num(t.nominal)}</td>
                    <td>{num(t.inflation)}</td>
                    <td>{pct(t.exact)}</td>
                    <td>{pct(t.approx)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

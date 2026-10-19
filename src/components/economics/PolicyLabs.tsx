import { useState } from "react";
import { usePlayback } from "../money/shared";
import {
  policyMap,
  policyExposure,
  type Direction,
} from "../../simulations/economics/policy-fx.mjs";
import { num } from "./PriceLabs";
import "./policy-fx.css";
const directions: [Direction, string][] = [
  ["up", "인상"],
  ["down", "인하"],
  ["same", "동결"],
];
export function PolicyMapLab() {
  const [direction, D] = useState<Direction>("up"),
    [context, C] = useState<"normal" | "stress">("normal");
  const play = usePlayback(3),
    r = policyMap(direction, context, play.step);
  return (
    <section className="eco-lab" aria-label="통화정책 전달 경로 실험">
      <h3>하나의 정책, 갈라지는 다섯 경로</h3>
      <div className="eco-options">
        {directions.map(([v, t]) => (
          <button
            key={v}
            aria-pressed={direction === v}
            onClick={() => {
              D(v);
              play.rewind();
            }}
          >
            기준금리 {t}
          </button>
        ))}
      </div>
      <label className="eco-predict">
        다른 조건
        <select
          value={context}
          onChange={(e) => {
            C(e.target.value as typeof context);
            play.rewind();
          }}
        >
          <option value="normal">경로의 기본 조건을 유지한 경우</option>
          <option value="stress">신용 위험·해외 충격이 함께 있는 경우</option>
        </select>
      </label>
      {play.controls}
      <button
        onClick={() => {
          D("up");
          C("normal");
          play.rewind();
        }}
      >
        조건까지 초기화
      </button>
      <p className="eco-stage" aria-live="polite">
        {r.phaseLabel}
      </p>
      <figure className="eco-transmission">
        <div className="eco-policy-origin">
          <b>한국은행 · {r.policy}</b>
          <span>정책 결정·설명·기존 예상과의 차이</span>
        </div>
        <div className="eco-policy-split">
          ↓ 금융 여건에 영향을 줄 여러 가능성
        </div>
        {r.channels.map((c) => (
          <article key={c.id} className={`eco-policy-lane eco-channel-${c.id}`}>
            <h4>{c.name} 경로</h4>
            <ol>
              {[c.financial, c.exposure, c.effect].map((text, i) => (
                <li
                  className={play.step === i + 1 ? "eco-observing" : ""}
                  key={i}
                >
                  <small>
                    {
                      [
                        "① 금융 여건",
                        "② 누구의 노출인가",
                        "③ 지출·가격에 영향",
                      ][i]
                    }
                  </small>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
            <p>{c.condition}</p>
          </article>
        ))}
        <div className="eco-policy-end">
          <b>가계·기업의 지출과 가격 결정 → 생산·물가에 영향</b>
          <span>효과의 크기·시점은 여기서 산출하지 않습니다.</span>
        </div>
        <figcaption>
          색과 경로 이름은 전달 방식, 화살표는 조건부 영향 관계입니다. 세 칸은
          설명의 관찰 순서이며 실제 처리 순서·시간·확률이 아닙니다. 여러 경로는
          동시에 겹치며 되먹임도 있습니다. 모든 경로를 미리 보여 주고 현재 관찰
          칸을 이중선으로 표시합니다.
        </figcaption>
      </figure>
      <p>
        금리 인하는 모든 경로가 인상의 정확한 역순으로 움직인다는 뜻이 아닙니다.
        특히 위험이 커지거나 시장이 이미 정책을 예상했다면 전달 결과가
        달라집니다.
      </p>
      <details>
        <summary>정적 대안 · 경로와 전제 전체 표</summary>
        <div
          className="eco-table"
          tabIndex={0}
          role="region"
          aria-label="정책 경로 표"
        >
          <table>
            <thead>
              <tr>
                <th>경로</th>
                <th>금융 여건</th>
                <th>노출</th>
                <th>가능한 영향</th>
                <th>조건</th>
              </tr>
            </thead>
            <tbody>
              {r.channels.map((c) => (
                <tr key={c.id}>
                  <th>{c.name}</th>
                  <td>{c.financial}</td>
                  <td>{c.exposure}</td>
                  <td>{c.effect}</td>
                  <td>{c.condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
export function SignedCash({
  value,
  max = 200000,
  label,
}: {
  value: number;
  max?: number;
  label: string;
}) {
  return (
    <div className="eco-signed-cash">
      <span>
        {label}{" "}
        <strong>
          {value > 0 ? "+" : ""}
          {num(value)}원
        </strong>
      </span>
      <div className="eco-signed-track" aria-hidden="true">
        <i
          className={value >= 0 ? "eco-cash-positive" : "eco-cash-negative"}
          style={{
            left: value >= 0 ? "50%" : `${50 - (Math.abs(value) / max) * 50}%`,
            width: `${(Math.abs(value) / max) * 50}%`,
          }}
        />
        <b />
      </div>
    </div>
  );
}
const months = [0, 1, 3, 6, 12];
export function PolicyCashLab() {
  const [direction, D] = useState<Direction>("up"),
    [schedule, S] = useState<"staggered" | "fixed">("staggered"),
    [prediction, P] = useState("");
  const play = usePlayback(4),
    r = policyExposure(direction, schedule, months[play.step]);
  const rewind = () => {
    P("");
    play.rewind();
  };
  return (
    <section className="eco-lab" aria-label="정책금리와 계약 시차 실험">
      <h3>같은 변화가 누구의 통장에 언제 반영될까?</h3>
      <p>
        독립된 세 계약의 가상 비교 · 정책 변화가 각 약정금리에 재산정 시점부터{" "}
        {r.delta > 0 ? "+" : ""}
        {r.delta}%p 그대로 반영된다는 가정입니다. 실제 전가폭·소비·성장률의
        추정이 아닙니다.
      </p>
      <div className="eco-options">
        {directions.map(([v, t]) => (
          <button
            key={v}
            aria-pressed={direction === v}
            onClick={() => {
              D(v);
              rewind();
            }}
          >
            {v === "same" ? "변화 없음" : `1%p ${t}`}
          </button>
        ))}
      </div>
      <label className="eco-predict">
        계약 조건
        <select
          value={schedule}
          onChange={(e) => {
            S(e.target.value as typeof schedule);
            rewind();
          }}
        >
          <option value="staggered">서로 다른 시점에 한 번 재산정</option>
          <option value="fixed">관찰 12개월 동안 모두 고정</option>
        </select>
      </label>
      <div className="eco-month-rail" aria-label="가상 관찰 시점">
        {months.map((m, i) => (
          <button
            key={m}
            aria-pressed={play.step === i}
            onClick={() => play.seek(i)}
          >
            {m === 0 ? "변화 직전" : `${m}개월`}
          </button>
        ))}
      </div>
      {play.controls}
      <button
        onClick={() => {
          D("up");
          S("staggered");
          rewind();
        }}
      >
        조건까지 초기화
      </button>
      <p className="eco-stage" aria-live="polite">
        가상 관찰 · {r.month}개월 ·{" "}
        {schedule === "fixed" ? "고정 계약" : "시차 있는 계약"}
      </p>
      <div className="eco-contracts">
        {r.rows.map((row, i) => (
          <article key={row.name} className={`eco-contract eco-contract-${i}`}>
            <div className="eco-contract-role">
              <span aria-hidden="true">{["⌂", "▤", "▥"][i]}</span>
              <b>{row.name}</b>
            </div>
            <p>
              고정 잔액 {num(row.principal)}원<br />
              기존 연율 {row.baseRate}% → 현재 {row.newRate}%
            </p>
            <div className="eco-contract-date">
              {schedule === "fixed"
                ? "12개월 내 재산정 없음"
                : `${row.resetMonth}개월부터 새 금리`}
            </div>
            <div className="eco-cash-direction">
              {row.sign < 0
                ? "본인 → 금융기관 · 이자 지급"
                : "금융기관 → 본인 · 이자 수입"}
            </div>
            <p>
              당월 이자 {num(row.currentInterest)}원<br />
              {row.applied
                ? "약정한 재산정 시점에 도달"
                : "아직 기존 금리 유지"}
            </p>
            <SignedCash
              value={row.cashDelta}
              max={r.scale}
              label="기존 대비 월 현금 변화"
            />
          </article>
        ))}
      </div>
      <p>
        부호 있는 막대 공통 눈금: −200,000원 ← 0 → +200,000원/월. 왼쪽·빗금은
        현금 감소, 오른쪽·실선은 현금 증가입니다. 세 계약을 경제 전체의 합계로
        더하지 않습니다.
      </p>
      <label className="eco-predict">
        예측 · 정책금리 변화 하나만 알면 모두의 당월 이자 변화를 확정할 수
        있나요?
        <select value={prediction} onChange={(e) => P(e.target.value)}>
          <option value="">예측 선택</option>
          <option value="no">계약과 시점을 더 알아야 한다</option>
          <option value="yes">바로 확정할 수 있다</option>
        </select>
      </label>
      {play.step === 4 && (
        <p role="status">
          {prediction
            ? prediction === "no"
              ? "예측과 같습니다."
              : "예측과 다릅니다."
            : "계약 시점과 방향을 비교하세요."}{" "}
          {schedule === "fixed"
            ? "이 사례에서는 12개월 동안 약정금리가 그대로라 직접 이자 변화는 0입니다. 다른 경로까지 멈춘다는 뜻은 아닙니다."
            : direction === "same"
              ? "정책 변화가 0이라 이 가정의 추가 이자 변화도 0입니다. 다른 계약 여건까지 고정이라는 현실 판정은 아닙니다."
              : "금리가 바뀐 계약에서는 예금자의 이자 수입과 차입자의 이자 지급이 서로 다른 현금 방향을 만듭니다. 잔액이 달라 변화 금액도 다릅니다."}
        </p>
      )}
      <p className="eco-note">
        교육용 월 이자 = 고정 잔액 × 연율 ÷ 12. 원금
        상환·복리·일수·세금·수수료·새 차입을 생략하고 이자만 매월 정산한다고
        가정합니다. 예금 잔액도 이자를 더하지 않고 유지합니다. 가상의 재산정
        월은 한국 경제의 평균 시차가 아닙니다.
      </p>
      <details>
        <summary>정적 대안 · 모든 관찰 시점의 현금 변화</summary>
        <div
          className="eco-table"
          tabIndex={0}
          role="region"
          aria-label="계약 시점별 현금 변화 표"
        >
          <table>
            <thead>
              <tr>
                <th>가상 시점</th>
                {r.rows.map((t) => (
                  <th key={t.name}>{t.name}(원/월)</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m}>
                  <th>{m}개월</th>
                  {policyExposure(direction, schedule, m).rows.map((t) => (
                    <td key={t.name}>{num(t.cashDelta)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

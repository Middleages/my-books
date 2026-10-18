import { useState } from "react";
import {
  projectDiversification,
  projectProtection,
  protectionDefaults,
  type ProtectionParams,
} from "../../simulations/money/risk.mjs";
import { usePlayback } from "./shared";
import "./risk.css";
const won = (n: number) =>
  n.toLocaleString("ko-KR", { maximumFractionDigits: 0 }) + "원";
const phases = [
  "같은 출발 자금 배분",
  "보험료 납부",
  "투자 가격 변동",
  "예상 밖 지출 발생",
  "보험금 도착 여부",
  "납기까지 지출 충당",
];
function Bar({
  label,
  parts,
  max,
}: {
  label: string;
  parts: { name: string; value: number }[];
  max: number;
}) {
  return (
    <div className="risk-bar">
      <b>{label}</b>
      <div className="risk-track" aria-hidden="true">
        {parts.map((p, i) => (
          <span
            key={p.name}
            className={"risk-fill risk-fill-" + i}
            style={{ width: (100 * p.value) / max + "%" }}
          />
        ))}
      </div>
      <small>{parts.map((p) => `${p.name} ${won(p.value)}`).join(" · ")}</small>
    </div>
  );
}
function Range({
  label,
  value,
  min = 0,
  max,
  step = 50000,
  onChange,
  percent = false,
}: {
  label: string;
  value: number;
  min?: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  percent?: boolean;
}) {
  return (
    <label className="money-slider">
      <span>
        {label}
        <strong>{percent ? value + "%" : won(value)}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={percent ? `${value}%` : won(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
export function DiversificationLab() {
  const [a, A] = useState(-40),
    [b, B] = useState(0);
  const r = projectDiversification(a, b),
    before = projectDiversification(0, 0);
  return (
    <section className="money-lab" aria-label="집중과 분산 비교">
      <h3>같은 100만원, 다른 담는 방법</h3>
      <p>
        막대 전체 눈금은 모두 0~200만원입니다. 초록 실선은 A, 빗금은 B입니다.
      </p>
      <div className="money-presets">
        {[
          ["A만 하락", -40, 0],
          ["함께 하락", -40, -40],
          ["A만 상승", 40, 0],
          ["변동 없음", 0, 0],
        ].map(([name, x, y]) => (
          <button
            key={name}
            onClick={() => {
              A(Number(x));
              B(Number(y));
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="money-inputs">
        <Range
          label="A 가격 변화"
          min={-100}
          max={100}
          step={5}
          value={a}
          onChange={A}
          percent
        />
        <Range
          label="B 가격 변화"
          min={-100}
          max={100}
          step={5}
          value={b}
          onChange={B}
          percent
        />
      </div>
      <div className="risk-columns">
        {(["concentrated", "diversified"] as const).map((key, i) => (
          <article key={key}>
            <h4>{i ? "A·B 절반씩 분산" : "A에 전부 집중"}</h4>
            {[before[key], r[key]].map((p, j) => (
              <Bar
                key={j}
                label={(j ? "변동 후" : "출발") + " · 합계 " + won(p.total)}
                max={2000000}
                parts={[
                  { name: "A", value: p.a },
                  { name: "B", value: p.b },
                ]}
              />
            ))}
          </article>
        ))}
      </div>
      <p className="money-caption">
        같은 관찰 기간의 가상 가격 충격입니다. 확률·미래 수익 예측이 아니며
        배당·세금·수수료·재투자·차입을 생략합니다. 분산은 공동 하락을 없애지
        않고, 오른 자산 하나에 집중한 경우보다 이익이 작을 수도 있습니다.
      </p>
    </section>
  );
}
export function ProtectionLab() {
  const [p, P] = useState<ProtectionParams>({ ...protectionDefaults });
  const [prediction, predict] = useState("");
  const play = usePlayback(5),
    r = projectProtection(p);
  function change(k: keyof ProtectionParams, v: number | boolean) {
    P({ ...p, [k]: v });
    play.rewind();
    predict("");
  }
  return (
    <section className="money-lab" aria-label="충격과 위험 대비 실험">
      <h3>같은 1,000만원으로 충격을 맞는다면</h3>
      <p>
        양쪽의 처음 현금과 투자액은 같습니다. 보험이 있는 쪽만 현금에서 보험료를
        먼저 냅니다. 조건을 바꾸면 처음 단계로 돌아갑니다.
      </p>
      <div className="money-presets">
        <button
          onClick={() => {
            P({ ...protectionDefaults });
            play.rewind();
            predict("");
          }}
        >
          기본 조건으로 초기화
        </button>
        <button
          onClick={() => {
            P({ ...protectionDefaults, expense: 0, marketReturn: 0 });
            play.rewind();
            predict("");
          }}
        >
          사고도 가격 변동도 없음
        </button>
      </div>
      <div className="money-inputs">
        <Range
          label="처음 비상 현금"
          value={p.reserve}
          min={p.premium}
          max={10000000}
          onChange={(v) => change("reserve", v)}
        />
        <Range
          label="이 기간 보험료"
          value={p.premium}
          max={Math.min(p.reserve, 500000)}
          onChange={(v) => change("premium", v)}
        />
        <Range
          label="투자 가격 변화"
          value={p.marketReturn}
          min={-100}
          max={100}
          step={5}
          percent
          onChange={(v) => change("marketReturn", v)}
        />
        <Range
          label="예상 밖 지출"
          value={p.expense}
          max={20000000}
          onChange={(v) => change("expense", v)}
        />
        <Range
          label="자기부담금"
          value={p.deductible}
          max={20000000}
          onChange={(v) => change("deductible", v)}
        />
        <Range
          label="보험금 한도"
          value={p.limit}
          max={20000000}
          onChange={(v) => change("limit", v)}
        />
      </div>
      <div className="risk-options">
        {(
          [
            ["covered", "이 사건은 보장 대상"],
            ["onTime", "보험금이 납기 전에 도착"],
            ["sellAllowed", "투자자산을 납기 전에 매각 가능"],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={p[key]}
              onChange={(e) => change(key, e.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>
      <p className="money-caption">
        교육용 손해 보전 계약: 보장 대상일 때 보험금 = min(한도, max(0, 지출 −
        자기부담금)). 보험료·한도는 실제 상품 가격 관계가 아닌 독립 가정입니다.
        지급 지연 시 이 관찰 기간에 들어온 돈은 0원입니다.
      </p>
      <fieldset className="money-prediction">
        <legend>
          먼저 예측 · 보험이 있는 쪽은 납기까지 지출을 모두 충당할까요?
        </legend>
        {[
          ["yes", "모두 충당한다"],
          ["no", "부족액이 남는다"],
        ].map(([v, t]) => (
          <label key={v}>
            <input
              type="radio"
              name="risk-prediction"
              checked={prediction === v}
              onChange={() => predict(v)}
            />
            {t}
          </label>
        ))}
      </fieldset>
      {play.controls}
      <ol className="risk-phases">
        {phases.map((s, i) => (
          <li key={s}>
            <button
              aria-current={play.step === i ? "step" : undefined}
              onClick={() => play.seek(i)}
            >
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>
      <p className="money-status" aria-live="polite">
        {phases[play.step]} ·{" "}
        {play.step === 5
          ? "현금을 먼저 쓰고, 허용된 경우 필요한 만큼만 투자자산을 팝니다."
          : "단계 버튼으로 원하는 장면을 바로 볼 수 있습니다."}
      </p>
      <p>
        모든 막대는 0~4,000만원의 공통 눈금입니다. 초록 실선은 현금, 빗금은 투자
        평가액입니다. 아래 지출 막대는 초록이 충당, 빗금이 아직 충당하지 못한
        금액입니다.
      </p>
      <div className="risk-columns">
        {(["uninsured", "insured"] as const).map((key, i) => {
          const path = r[key],
            f = path.frames[play.step];
          return (
            <article key={key}>
              <h4>{i ? "보험 있음" : "보험 없음"}</h4>
              <Bar
                label={"남은 자산 " + won(f.assets)}
                max={40000000}
                parts={[
                  { name: "현금", value: f.cash },
                  { name: "투자 평가액", value: f.investment },
                ]}
              />
              <Bar
                label={"발생한 지출 " + won(f.expenseDue)}
                max={40000000}
                parts={[
                  { name: "충당", value: f.paid },
                  { name: "미충당", value: f.gap },
                ]}
              />
              <dl className="risk-ledger">
                {[
                  ["낸 보험료", f.premium],
                  ["투자 평가손익", f.marketChange],
                  ["도착한 보험금", f.payout],
                  ["현금으로 바꾼 투자액", f.sale],
                ].map(([name, value]) => (
                  <div key={name}>
                    <dt>{name}</dt>
                    <dd>{won(Number(value))}</dd>
                  </div>
                ))}
              </dl>
              {i === 1 && (
                <p>
                  가정상 지급 대상 금액: {won(path.claim)}.{" "}
                  {!p.covered
                    ? "보장 제외로 지급 대상이 아닙니다."
                    : !p.onTime
                      ? "지급 대상이어도 납기 전 현금에 포함하지 않습니다."
                      : "도착 단계에서만 현금에 더합니다."}
                </p>
              )}
            </article>
          );
        })}
      </div>
      {play.step === 5 && (
        <p className="money-answer">
          {prediction
            ? (prediction === "yes") ===
              (r.insured.status === "covered-at-deadline")
              ? "예측과 일치합니다."
              : "예측과 달랐습니다."
            : "다시 보기에서 결과를 예측해 보세요."}{" "}
          보험 있음:{" "}
          {r.insured.status === "deadline-gap"
            ? "납기까지 충당하지 못한 지출이 남습니다."
            : "납기까지 지출을 모두 충당합니다."}{" "}
          남은 자산과 부족액은 함께 읽어야 합니다.
        </p>
      )}
      <details>
        <summary>전체 단계의 수치 표 보기</summary>
        <div className="risk-table-scroll" tabIndex={0} role="region" aria-label="위험 대비 전체 단계 표, 가로 스크롤 가능">
          <table className="money-table">
            <caption>원 단위 · 각 단계 완료 시점</caption>
            <thead>
              <tr>
                <th scope="col">단계·조건</th>
                <th scope="col">현금</th>
                <th scope="col">투자</th>
                <th scope="col">누적 충당</th>
                <th scope="col">미충당</th>
              </tr>
            </thead>
            <tbody>
              {phases.flatMap((name, j) =>
                (["uninsured", "insured"] as const).map((key, i) => {
                  const f = r[key].frames[j];
                  return (
                    <tr key={key + j}>
                      <th scope="row">
                        {name} · {i ? "있음" : "없음"}
                      </th>
                      <td>{won(f.cash)}</td>
                      <td>{won(f.investment)}</td>
                      <td>{won(f.paid)}</td>
                      <td>{won(f.gap)}</td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
      </details>
      <p className="money-caption">
        관찰 순서는 설명용이며 실제 청구 절차를 재현하지 않습니다. 현금
        이자·물가·세금·매매 및 보험 수수료·보험 심사·여러 사건·추가
        소득·대출·연체를 생략합니다. 매각 가능 시 표시 가격에 즉시 필요한 만큼
        팔린다고 가정합니다. 미충당액은 별도 표시하며, 남은 자산을 순자산이라고
        부르지 않습니다. 지급 지연 금액은 자산에도 넣지 않습니다. 계산은
        반올림하지 않고 원 표시에만 반올림하므로 표시 합계에 1원 차이가 날 수
        있습니다.
      </p>
    </section>
  );
}

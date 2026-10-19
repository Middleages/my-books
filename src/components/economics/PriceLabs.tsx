import { useState } from "react";
import { usePlayback } from "../money/shared";
import {
  basket,
  pricePath,
  type Basket,
  type PricePoint,
} from "../../simulations/economics/prices-rates.mjs";
import "./economics.css";
import "./prices-rates.css";
export const num = (v: number) =>
  v.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
export const pct = (v: number | null) =>
  v === null ? "정의 불가 / 비교 자료 없음" : `${num(v)}%`;
export function RateSlider({
  label,
  value,
  min = -100,
  max = 100,
  onChange,
  unit = "%",
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <label className="eco-control">
      <span>
        {label}
        <strong>
          {num(value)}
          {unit}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        aria-valuetext={`${value}${unit}`}
        onChange={(e) => onChange(+e.target.value)}
      />
    </label>
  );
}
function BasketScene({ r }: { r: Basket }) {
  return (
    <figure className="eco-basket-scene">
      <div className="eco-basket-parts">
        {r.items.map((i, k) => (
          <div key={i.name}>
            <b>{k === 0 ? "▦ 식품" : "◇ 서비스"}</b>
            <p>
              기준 지출 비중 {i.weight}%<br />
              품목 가격 변화 {num(i.change)}%
            </p>
            <span>전체 상승률에 {num(i.contribution)}%p</span>
          </div>
        ))}
      </div>
      {[
        { name: "기준 바구니", values: r.items.map((i) => i.baseCost) },
        { name: "같은 수량 · 바뀐 가격", values: r.items.map((i) => i.cost) },
      ].map((row) => (
        <div className="eco-index-row" key={row.name}>
          <b>
            {row.name} · {num(row.values.reduce((s, v) => s + v, 0))}원
          </b>
          <div className="eco-stack-track" aria-hidden="true">
            {row.values.map((v, k) => (
              <i
                className={`eco-piece eco-piece-${k}`}
                key={k}
                style={{ width: `${(v / 20000) * 100}%` }}
              />
            ))}
          </div>
        </div>
      ))}
      <figcaption>
        같은 원 눈금 0–20,000원. 초록 실선 = 식품, 보라 빗금 = 서비스. 기준
        바구니 10,000원을 100으로 놓으면 현재 지수{" "}
        <strong>{num(r.index)}</strong>, 상승률 {num(r.change)}%. 막대는 같은
        수량의 지출액 구성입니다.
      </figcaption>
    </figure>
  );
}
export function BasketLab() {
  const [w, W] = useState(75),
    [f, F] = useState(20),
    [s, S] = useState(0);
  const r = basket(w, f, s);
  return (
    <section className="eco-lab" aria-label="고정 바구니 가중치 실험">
      <h3>같은 20% 상승도 비중에 따라 다릅니다</h3>
      <p>
        가상 두 품목 · 기준 지출 10,000원. 각 조건 안에서 구매 수량을
        고정합니다. 비중 변경은 다른 기준 바구니를 고르는 것입니다.
      </p>
      <BasketScene r={r} />
      <div className="eco-controls">
        <RateSlider
          label="기준 식품 지출 비중"
          value={w}
          min={0}
          onChange={W}
        />
        <RateSlider label="식품 가격 변화" value={f} onChange={F} />
        <RateSlider label="서비스 가격 변화" value={s} onChange={S} />
      </div>
      <button
        onClick={() => {
          W(75);
          F(20);
          S(0);
        }}
      >
        바구니 초기화
      </button>
      <p aria-live="polite">
        지수 {num(r.index)} · 전체 변화 {num(r.change)}%. 식품 기여{" "}
        {num(r.items[0].contribution)}%p + 서비스 기여{" "}
        {num(r.items[1].contribution)}%p.
      </p>
      <p className="eco-note">
        %는 품목 상승률, %p(퍼센트포인트)는 전체 상승률에 더한 몫입니다.
        품질·대체 소비·가중치 개편은 생략했습니다.
      </p>
    </section>
  );
}
const cases = [
  ["base", "기저효과"],
  ["disinflation", "상승 속도 둔화"],
  ["deflation", "가격 하락"],
  ["flat", "가격 불변"],
];
function PathChart({ rows, m }: { rows: PricePoint[]; m: number }) {
  const x = (v: number) => 54 + (v / 14) * 268,
    y = (v: number) => 220 - (v / 130) * 182;
  return (
    <figure className="eco-price-chart">
      <p>세로: 가상 물가지수 · M0=100 / 가로: 가상 월 M0–M14</p>
      <svg
        viewBox="0 0 360 265"
        role="img"
        aria-label={`M${m} 지수 ${num(rows[m].index)}. 실선은 전체 가격 경로, 원은 현재, 사각형은 전년 동월, 삼각형은 전월입니다.`}
      >
        <path d="M54 30V220H330" fill="none" stroke="#62756d" />
        {[0, 50, 100, 130].map((v) => (
          <g key={v}>
            <path d={`M54 ${y(v)}H330`} stroke="#d5dfd8" />
            <text x="47" y={y(v) + 5} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <polyline
          points={rows.map((r) => `${x(r.month)},${y(r.index)}`).join(" ")}
          fill="none"
          stroke="#276749"
          strokeWidth="3"
        />
        {[0, 7, 14].map((v) => (
          <text key={v} x={x(v)} y="247" textAnchor="middle">
            M{v}
          </text>
        ))}
        {m >= 12 && (
          <>
            <path
              d={`M${x(m - 12)} ${y(rows[m - 12].index)}L${x(m)} ${y(rows[m].index)}`}
              stroke="#955524"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
            <rect
              x={x(m - 12) - 6}
              y={y(rows[m - 12].index) - 6}
              width="12"
              height="12"
              fill="#955524"
            />
          </>
        )}
        {m > 0 && (
          <path
            d={`M${x(m - 1)} ${y(rows[m - 1].index) - 9}l-7 13h14Z`}
            fill="#6354a0"
          />
        )}
        <circle
          cx={x(m)}
          cy={y(rows[m].index)}
          r="6"
          fill="white"
          stroke="#276749"
          strokeWidth="3"
        />
      </svg>
      <figcaption>
        초록 실선·원: 가격 수준·현재 / 보라 삼각형: 전월 / 갈색 사각형·점선:
        전년 동월 비교. 전체 경로는 미리 정한 가상 자료이며 미래 예측이
        아닙니다. 눈금은 모든 조건에서 0–130으로 고정합니다.
      </figcaption>
    </figure>
  );
}
export function PricePathLab() {
  const [kind, K] = useState("base"),
    [prediction, P] = useState("");
  const play = usePlayback(2),
    rows = pricePath(kind),
    m = 12 + play.step,
    r = rows[m],
    previous = rows[m - 1],
    year = rows[m - 12];
  const change = (v: string) => {
    K(v);
    P("");
    play.rewind();
  };
  return (
    <section className="eco-lab" aria-label="물가지수와 비교 기간 실험">
      <h3>가격선과 비교 기준을 함께 따라가기</h3>
      <div className="eco-options">
        {cases.map(([v, t]) => (
          <button key={v} aria-pressed={v === kind} onClick={() => change(v)}>
            {t}
          </button>
        ))}
      </div>
      <PathChart rows={rows} m={m} />
      <div className="eco-comparison-pairs">
        <div>
          <b>전월비 · 한 달 간격</b>
          <span>
            M{m - 1} {num(previous.index)} → M{m} {num(r.index)}
          </span>
          <strong>{pct(r.mom)}</strong>
        </div>
        <div>
          <b>전년동월비 · 12개월 간격</b>
          <span>
            M{m - 12} {num(year.index)} → M{m} {num(r.index)}
          </span>
          <strong>{pct(r.yoy)}</strong>
        </div>
      </div>
      <label className="eco-predict">
        예측 · 전년동월비가 낮아지면 지수도 반드시 내려갈까요?
        <select value={prediction} onChange={(e) => P(e.target.value)}>
          <option value="">예측 선택</option>
          <option value="no">그렇지 않다</option>
          <option value="yes">반드시 내려간다</option>
        </select>
      </label>
      {play.controls}
      <button onClick={() => change("base")}>조건까지 초기화</button>
      <p className="eco-stage" aria-live="polite">
        M{m} · 지수 {num(r.index)} · 전월비 {pct(r.mom)} · 전년동월비{" "}
        {pct(r.yoy)}
      </p>
      {(play.step === 2 || (play.step === 1 && kind === "base")) && (
        <p role="status">
          {prediction
            ? prediction === "no"
              ? "예측과 같습니다."
              : "예측과 다릅니다."
            : "가격선과 분모를 비교하세요."}{" "}
          {kind === "base"
            ? "현재 지수는 110 그대로인데 비교 대상이 M0의 100에서 M1의 110으로 바뀌며 연간 상승률이 10%에서 0%로 낮아집니다. 이것이 이 사례의 기저효과입니다."
            : kind === "disinflation"
              ? "M13→M14 지수는 120→122로 오릅니다. 전년동월비는 20%→약 10.91%로 낮아집니다. 양의 상승률 둔화(디스인플레이션)는 가격 하락과 다릅니다."
              : kind === "deflation"
                ? "M14 지수는 120에서 110으로 내려가 전월비가 음수입니다. 그런데 전년동월비는 0%입니다. 어느 기간의 하락인지 꼭 붙여 읽으세요."
                : "가격 수준이 100으로 같고 비교 가능한 상승률은 0%입니다. 낮은 상승률과 낮은 가격 수준은 다른 말입니다."}
        </p>
      )}
      <p className="eco-note">
        변화율 = (현재 지수 ÷ 비교 지수 − 1) × 100. 계절조정 없는 가상 월별
        자료입니다. M0 전월비와 M0–M11 전년동월비는 비교 자료가 없습니다. 한
        달·한 품목의 하락만으로 경제 전체의 지속적 디플레이션을 확정하지
        않습니다.
      </p>
      <details>
        <summary>정적 대안 · 전체 가격 경로와 상승률</summary>
        <div
          className="eco-table"
          tabIndex={0}
          role="region"
          aria-label="가상 월별 지수 표"
        >
          <table>
            <thead>
              <tr>
                <th>가상 월</th>
                <th>지수(M0=100)</th>
                <th>전월비(%)</th>
                <th>전년동월비(%)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.month}>
                  <th>M{t.month}</th>
                  <td>{num(t.index)}</td>
                  <td>{pct(t.mom)}</td>
                  <td>{pct(t.yoy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

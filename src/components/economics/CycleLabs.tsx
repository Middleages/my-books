import { useState } from "react";
import { usePlayback } from "../money/shared";
import {
  cycleRows,
  cycleSnapshot,
  outputGap,
  type CycleRow,
} from "../../simulations/economics/cycles-news.mjs";
import { num, pct, RateSlider } from "./PriceLabs";
import "./cycles-news.css";
const rows = cycleRows();
const x = (q: number) => 40 + q * 32.5,
  y = (v: number) => 176 - (v - 80) * 3.2;
export function CyclePlot({
  quarter = 6,
  field = "output",
  label = "전체 실질 생산",
  color = "#27786c",
}: {
  quarter?: number;
  field?: "output" | "orders" | "employment";
  label?: string;
  color?: string;
}) {
  const current = rows[quarter];
  return (
    <figure className="eco-cycle-plot">
      <div className="eco-axis-title">{label} · Q0=100 지수</div>
      <svg
        viewBox="0 0 320 212"
        role="img"
        aria-label={`${label} Q${quarter} ${current[field]}, 가상 Q0부터 Q8까지의 경로`}
      >
        <path d="M40 40V176H300" fill="none" stroke="#586b70" />
        {[80, 100, 120].map((v) => (
          <g key={v}>
            <path
              d={`M40 ${y(v)}H300`}
              stroke="#d1dce0"
              strokeDasharray={v === 100 ? "4 3" : undefined}
            />
            <text x="34" y={y(v) + 4} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <polyline
          points={rows.map((r) => `${x(r.quarter)},${y(r[field])}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth="3"
        />
        <path
          d={`M${x(quarter)} 40V176`}
          stroke="#5b626a"
          strokeDasharray="2 3"
        />
        {rows.map((r) => (
          <g key={r.quarter}>
            <circle
              cx={x(r.quarter)}
              cy={y(r[field])}
              r={quarter === r.quarter ? 6 : 3}
              fill={quarter === r.quarter ? "#192e34" : "white"}
              stroke={color}
              strokeWidth="2"
            />
            <text x={x(r.quarter)} y="197" textAnchor="middle">
              {r.quarter}
            </text>
          </g>
        ))}
      </svg>
      <figcaption>
        가로축 가상 분기 Q0–Q8, 세로축 지수80–120. 검은 점·세로선=선택 시점.
        전체 경로는 미리 만든 비교 자료이며 선택 시점 이후의 실제 예측이
        아닙니다.
      </figcaption>
    </figure>
  );
}
export function SectorBars({ r }: { r: CycleRow }) {
  return (
    <figure className="eco-sector-scene">
      <h4>같은 기준 생산, 다른 부문 경로</h4>
      {[
        ["전체", r.output],
        ["A부문", r.a],
        ["B부문", r.b],
      ].map(([label, value], i) => (
        <div className={`eco-index-row eco-index-${i}`} key={label}>
          <span>
            {label} · Q{r.quarter} <b>{num(Number(value))}</b>
          </span>
          <div className="eco-index-track">
            <i style={{ width: `${(Number(value) / 130) * 100}%` }} />
            <em style={{ left: `${(100 / 130) * 100}%` }} />
          </div>
        </div>
      ))}
      <figcaption>
        막대 공통0–130, 세로선=각 Q0의100. A·B 기준 생산의 크기가 같아
        전체=(A+B)÷2인 가상 고정가격 사례입니다. 실제 연쇄가격 통계나 개인
        소득의 합산법이 아닙니다.
      </figcaption>
    </figure>
  );
}
function CycleTable() {
  return (
    <details>
      <summary>정적 대안 · Q0–Q8 전체 지표표</summary>
      <div
        className="eco-table"
        tabIndex={0}
        role="region"
        aria-label="가상 경기 전체 지표표"
      >
        <table>
          <thead>
            <tr>
              <th>가상 분기</th>
              <th>생산지수</th>
              <th>전분기비(%)</th>
              <th>전년동기비(%)</th>
              <th>A/B 지수</th>
              <th>주문지수</th>
              <th>고용지수</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => {
              const r = cycleSnapshot(v.quarter);
              return (
                <tr key={r.quarter}>
                  <th>Q{r.quarter}</th>
                  <td>{num(r.output)}</td>
                  <td>{pct(r.growth)}</td>
                  <td>{pct(r.annualGrowth)}</td>
                  <td>
                    {r.a} / {r.b}
                  </td>
                  <td>{r.orders}</td>
                  <td>{r.employment}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}
export function CycleLab() {
  const play = usePlayback(8, 6),
    r = cycleSnapshot(play.step),
    [prediction, P] = useState("");
  return (
    <section
      className="eco-lab eco-cycle-lab"
      aria-label="경기 수준과 증가율 실험"
    >
      <h3>플러스 성장과 낮은 수준을 함께 보기</h3>
      <RateSlider
        label="가상 관찰 분기 Q"
        min={0}
        max={8}
        unit=""
        value={play.step}
        onChange={play.seek}
      />
      <div className="eco-options">
        {[2, 5, 6, 8].map((q) => (
          <button
            key={q}
            aria-pressed={play.step === q}
            onClick={() => play.seek(q)}
          >
            Q{q} 보기
          </button>
        ))}
      </div>
      <label className="eco-predict">
        Q6의 전분기 성장률이 플러스면 과거 정점도 회복했을까요?
        <select value={prediction} onChange={(e) => P(e.target.value)}>
          <option value="">먼저 예측하기</option>
          <option value="no">정점 아래일 수 있습니다</option>
          <option value="yes">반드시 회복했습니다</option>
        </select>
      </label>
      {play.controls}
      <button
        onClick={() => {
          play.seek(6);
          P("");
        }}
      >
        Q6 조건 초기화
      </button>
      <p className="eco-stage" aria-live="polite">
        Q{r.quarter} · 생산 {r.output} · 전분기비 {pct(r.growth)} · 전년동기비{" "}
        {pct(r.annualGrowth)}
      </p>
      <CyclePlot quarter={r.quarter} />
      <div className="eco-level-versus-rate">
        <div>
          <small>수준 · Q0=100</small>
          <b>{r.output}</b>
          <span>이 시점까지 정점 {r.peak}</span>
        </div>
        <div>
          <small>바로 앞 분기와 비교</small>
          <b>{pct(r.growth)}</b>
          <span>
            이전 수준 {r.previous === null ? "비교 자료 없음" : r.previous}
          </span>
        </div>
      </div>
      <p role="status">
        {prediction && r.quarter === 6
          ? prediction === "no"
            ? "예측과 같습니다. "
            : "수준과 변화율을 나누어 보세요. "
          : ""}
        현재까지 정점 대비 {pct(r.fromPeak)}. 플러스 전분기 성장과 정점 미회복은
        함께 나타날 수 있습니다. 한 숫자로 공식 경기 국면을 판정하지 않습니다.
      </p>
      <SectorBars r={r} />
      <CycleTable />
    </section>
  );
}
export function TimingLab() {
  const play = usePlayback(8, 6),
    r = cycleSnapshot(play.step);
  return (
    <section
      className="eco-lab eco-timing-lab"
      aria-label="선행 동행 후행 비교 실험"
    >
      <h3>회전하는 시점이 서로 다릅니다</h3>
      <RateSlider
        label="지표 비교 분기 Q"
        value={play.step}
        min={0}
        max={8}
        unit=""
        onChange={play.seek}
      />
      {play.controls}
      <button onClick={() => play.seek(6)}>Q6 조건 초기화</button>
      <p className="eco-stage" aria-live="polite">
        같은 Q{r.quarter}: 주문 {r.orders} / 생산 {r.output} / 고용{" "}
        {r.employment}
      </p>
      <div className="eco-timing-strips">
        <CyclePlot
          quarter={r.quarter}
          field="orders"
          label="주문 · 선행 예시"
          color="#9c7136"
        />
        <CyclePlot quarter={r.quarter} label="생산 · 동행 기준 예시" />
        <CyclePlot
          quarter={r.quarter}
          field="employment"
          label="고용 · 후행 예시"
          color="#816295"
        />
      </div>
      <p>
        이 가상 경로의 저점은 주문Q4 → 생산Q5 → 고용Q6입니다. 한 분기씩 차이를
        의도적으로 넣었습니다. 실제 주문·고용이 항상 이 간격이나 순서를 따른다는
        통계 결과가 아닙니다. 지표의 경제적 선후와 통계 발표일의 차이도
        구분합니다.
      </p>
      <CycleTable />
    </section>
  );
}
export function PotentialLab() {
  const [potential, P] = useState(102),
    r = outputGap(97, potential);
  return (
    <section
      className="eco-lab eco-potential-lab"
      aria-label="잠재생산 추정과 산출갭 실험"
    >
      <h3>같은 관측값도 추정 기준에 따라 갭이 달라집니다</h3>
      <p>
        위 경로의 Q6 실제 생산지수97을 고정합니다. 잠재생산은 물가 압력을
        지속적으로 높이지 않고 유지할 수 있는 생산 수준이라는 개념이며 직접
        관측되지 않습니다.
      </p>
      <RateSlider
        label="가상 잠재생산 추정값"
        value={potential}
        min={90}
        max={115}
        unit="지수"
        onChange={P}
      />
      <div className="eco-options">
        {[94, 97, 102].map((v) => (
          <button key={v} aria-pressed={potential === v} onClick={() => P(v)}>
            추정 {v}
          </button>
        ))}
      </div>
      <button onClick={() => P(102)}>추정 조건 초기화</button>
      <figure className="eco-potential-scene">
        <div className="eco-gap-ruler">
          <span
            className="eco-gap-actual"
            style={{ left: `${(r.actual / 130) * 100}%` }}
          >
            ● 실제 {r.actual}
          </span>
          <span
            className="eco-gap-estimate"
            style={{ left: `${(r.potential / 130) * 100}%` }}
          >
            △ 추정 {r.potential}
          </span>
          <i
            style={{
              left: `${(Math.min(r.actual, r.potential) / 130) * 100}%`,
              width: `${(Math.abs(r.difference) / 130) * 100}%`,
            }}
          />
        </div>
        <figcaption>
          공통 눈금0–130지수. 위 실선 위치=실제97, 아래 점선 위치=선택한 추정.
          사이 띠 길이=지수 차이의 절댓값. 두 값이 같으면 띠 길이0입니다.
        </figcaption>
      </figure>
      <p role="status">
        산출갭 = (실제 {r.actual} − 추정 {r.potential}) ÷ 추정 {r.potential} ×
        100 = {pct(r.gap)}. 지수 차이 {num(r.difference)}포인트와 갭 비율은
        다릅니다.
      </p>
      <details>
        <summary>정적 대안 · 실제·추정·갭 표</summary>
        <div
          className="eco-table"
          tabIndex={0}
          role="region"
          aria-label="잠재생산과 산출갭 표"
        >
          <table>
            <thead>
              <tr>
                <th>실제 지수</th>
                <th>추정 지수</th>
                <th>차이(포인트)</th>
                <th>산출갭(%)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{r.actual}</td>
                <td>{r.potential}</td>
                <td>{num(r.difference)}</td>
                <td>{pct(r.gap)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
      <p>
        슬라이더는 서로 다른 가상 추정의 선택입니다. 실제 생산이 변한 것도,
        통계적 신뢰구간을 계산한 것도 아닙니다. 이 값으로 물가·금리·경기 국면을
        자동 판정하지 않습니다.
      </p>
    </section>
  );
}

import { useState } from "react";
import {
  projectPurchasingPower,
  inflationDefaults,
  comparePower,
} from "../../simulations/money/inflation.mjs";
import { usePlayback, Prediction } from "./shared";
const won = (n: number) =>
  `${n.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}원`;
const num = (n: number) =>
  n.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
const pct = (n: number) => `${n > 0 ? "+" : ""}${num(n * 100)}%`;
function Control({
  label,
  value,
  min,
  max,
  onChange,
  unit = "%",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <label className="money-slider">
      <span>
        {label}
        <strong>
          {value}
          {unit}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step="1"
        value={value}
        aria-valuetext={`${value}${unit}`}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
function Basket({
  count,
  label,
  unit,
}: {
  count: number;
  label: string;
  unit: number;
}) {
  return (
    <figure className="power-basket">
      <figcaption>
        {label}
        <strong>{num(count)}바구니</strong>
      </figcaption>
      <div className="power-goods" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="power-goods-slot">
            <span
              style={{
                clipPath: `inset(0 ${100 - Math.min(1, Math.max(0, count / unit - i)) * 100}% 0 0)`,
              }}
            >
              <svg viewBox="0 0 32 28">
                <path
                  d="M3 9 H29 L25 25 H7 Z M9 9 L13 2 M23 9 L19 2 M12 11 V23 M20 11 V23"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </span>
          </span>
        ))}
      </div>
      <svg viewBox="0 0 240 55" aria-hidden="true">
        <path
          d="M12 5 L30 45 H210 L228 5 Z M60 5 L72 45 M120 5 V45 M180 5 L168 45"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
      </svg>
      <p>
        채운 기호 1개 = {unit}바구니.
        <br />두 그림·모든 연도에 같은 눈금을 씁니다.
      </p>
    </figure>
  );
}
export function InflationLab() {
  const [p, set] = useState(inflationDefaults),
    [prediction, predict] = useState("");
  const play = usePlayback(p.years),
    frames = projectPurchasingPower(p),
    f = frames[play.step],
    final = frames[p.years];
  const change = (patch: Partial<typeof p>) => {
    play.rewind();
    predict("");
    set({ ...p, ...patch });
  };
  const reset = () => {
    play.rewind();
    predict("");
    set({ ...inflationDefaults });
  };
  const basketUnit = Math.max(
    1,
    Math.ceil(
      Math.max(...frames.flatMap((a) => [a.fixedBaskets, a.baskets])) / 10 - 1e-10,
    ),
  );
  const max = Math.max(100000, ...frames.flatMap((a) => [a.nominal, a.real]));
  const x = (year: number) => 48 + (year / Math.max(1, p.years)) * 302,
    y = (v: number) => 185 - (v / max) * 145;
  const path = (key: "nominal" | "real") =>
    frames.map((a) => `${x(a.year)},${y(a[key])}`).join(" ");
  const verdict = comparePower(f.real, 100000),
    answer = { up: "늘었습니다", same: "같습니다", down: "줄었습니다" }[
      verdict
    ];
  return (
    <section className="money-lab power-lab" aria-label="물가와 구매력 실험">
      <div className="money-lab-heading">
        <span>04 / 돈을 장바구니로 바꾸면</span>
        <h2>10만원의 두 가지 미래</h2>
        <p>
          가상 기준 0년의 10만원과 1만원짜리 장바구니 · 한 단계는 1년입니다.
          가격표와 그림, 그래프의 관찰선이 함께 움직입니다.
        </p>
      </div>
      <div className="power-mode">
        <label className="money-select">
          물가 모델
          <select
            value={p.mode}
            onChange={(e) => change({ mode: e.target.value })}
          >
            <option value="uniform">관찰 · 모든 품목 같은 상승률</option>
            <option value="personal">확장 · 소비 구성이 다른 장바구니</option>
          </select>
        </label>
      </div>
      <div className="power-price-board">
        <h3>
          {f.year === 0 ? "기준 0년" : `${f.year}년 후 연말`} · 같은 구성의
          가격표
        </h3>
        <div className="power-price-tags">
          {f.items.map((i) => (
            <div key={i.id}>
              <svg viewBox="0 0 72 64" aria-hidden="true">
                {i.id === "food" ? (
                  <>
                    <path d="M10 25 H62 L55 58 H17 Z" fill="#ebbb58" />
                    <path d="M18 24 Q8 4 28 8 Q46 -3 51 24" fill="#3f7c67" />
                    <circle cx="39" cy="24" r="13" fill="#bc542e" />
                  </>
                ) : (
                  <>
                    <rect
                      x="18"
                      y="14"
                      width="38"
                      height="44"
                      rx="8"
                      fill="#8bafb8"
                    />
                    <path
                      d="M28 14 V5 H48"
                      fill="none"
                      stroke="#345861"
                      strokeWidth="5"
                    />
                    <path d="M28 36 H46" stroke="white" strokeWidth="5" />
                  </>
                )}
              </svg>
              <b>
                {i.label} × {num(i.quantity)}
              </b>
              <span>
                묶음 단가 {won(i.basePrice)} → <strong>{won(i.price)}</strong>
              </span>
              <small>연 {i.rate}% 가정 · 구성 수량은 0년부터 고정</small>
            </div>
          ))}
        </div>
        <p>
          한 바구니 가격 <strong>{won(f.basketCost)}</strong> · 0년 대비{" "}
          {pct(f.priceFactor - 1)}
          <br />
          <small>
            물가 배율 {num(f.priceFactor)}배 · 분할 가능한 묶음으로 가정합니다.
          </small>
        </p>
      </div>
      <div className="power-baskets">
        <Basket
          unit={basketUnit}
          count={f.fixedBaskets}
          label="① 현금 10만원 그대로"
        />
        <Basket
          unit={basketUnit}
          count={f.baskets}
          label={`② 예금 잔액 ${won(f.nominal)}`}
        />
      </div>
      <p className="money-status" role="status">
        {f.year}년 후 · 예금 잔액 {won(f.nominal)}, 0년 가격으로 환산하면{" "}
        {won(f.real)}. 구매력은 기준 10만원보다 {answer}.
      </p>
      {play.controls}
      <div className="power-year">
        <Control
          label="관찰 시점"
          value={play.step}
          min={0}
          max={p.years}
          unit="년 후"
          onChange={play.seek}
        />
      </div>
      <p className="money-caption">
        그림의 채움과 가격표는 확정된 연말 상태입니다. 재생은 정적 단계를
        순서대로 넘깁니다. 정지하거나 방향키로 원하는 연도를 관찰하세요.
      </p>
      <figure className="money-chart power-chart">
        <figcaption>잔액과 구매력 · 실선: 명목 / 점선: 실질</figcaption>
        <svg
          viewBox="0 0 380 230"
          role="img"
          aria-label={`가로축 0~${p.years}년, 세로축 원. 관찰 ${f.year}년 명목 ${won(f.nominal)}, 실질 ${won(f.real)}. 모든 연도는 아래 표에 있습니다.`}
        >
          {[0, max / 2, max].map((v) => (
            <g key={v}>
              <line x1="48" x2="350" y1={y(v)} y2={y(v)} stroke="#cad5cf" />
              <text x="44" y={y(v) + 4} textAnchor="end">
                {num(v / 10000)}만
              </text>
            </g>
          ))}
          <line
            x1="48"
            x2="350"
            y1={y(100000)}
            y2={y(100000)}
            stroke="#5d6660"
            strokeDasharray="2 4"
          />
          <polyline
            points={path("nominal")}
            fill="none"
            stroke="#176a58"
            strokeWidth="3"
          />
          <polyline
            points={path("real")}
            fill="none"
            stroke="#9b4426"
            strokeWidth="3"
            strokeDasharray="7 4"
          />
          <line
            x1={x(f.year)}
            x2={x(f.year)}
            y1="25"
            y2="185"
            stroke="#303c38"
          />
          <circle cx={x(f.year)} cy={y(f.nominal)} r="5" fill="#176a58" />
          <rect
            x={x(f.year) - 4}
            y={y(f.real) - 4}
            width="8"
            height="8"
            fill="#9b4426"
          />
          <text x="48" y="209">
            0년
          </text>
          <text x="350" y="209" textAnchor="end">
            {p.years}년 후
          </text>
          <text x="198" y="228" textAnchor="middle">
            가로: 기간(년) · 세로: 원(0부터)
          </text>
        </svg>
        <p className="money-caption">
          명목: 그때 통장에 찍힌 원 · 실질: 같은 구매력을 가진 0년 가격의 원.
          회색 가는 점선은 기준 10만원입니다. 전체 경로는 미리 보이며 세로선은
          관찰 시점입니다.
        </p>
      </figure>
      <div className="money-summary">
        <p>
          명목 잔액<strong>{won(f.nominal)}</strong>
          <small>시작 대비 {pct(f.nominal / 100000 - 1)}</small>
        </p>
        <p>
          0년 가격의 실질금액<strong>{won(f.real)}</strong>
          <small>구매력 변화 {pct(f.real / 100000 - 1)}</small>
        </p>
      </div>
      <h3>먼저 예측하고 한 조건씩 바꾸기</h3>
      <p>
        초기화 후 1년을 관찰하세요. 다음에는 수익률을 물가와 같게, 더 높게
        바꾸세요. 확장 모드에서는 같은 예금이라도 식료품 비중이 다른 바구니를
        비교합니다.
      </p>
      <Prediction
        value={prediction}
        onChange={predict}
        question={`${p.years}년 후 예금의 구매력은 0년보다 어떻게 될까요?`}
      />
      <button onClick={() => play.seek(p.years)}>
        예측 결과 확인 · 마지막 연도로
      </button>
      {prediction && play.step === p.years && (
        <p className="money-answer">
          {prediction === comparePower(final.real, 100000)
            ? "예측과 일치합니다."
            : "예측과 다릅니다."}{" "}
          기준 시점 대비 구매력 {pct(final.real / 100000 - 1)}. 잔액을 같은
          기간의 장바구니 가격 배율로 나눠 확인했습니다.
        </p>
      )}
      <div className="money-inputs">
        <Control
          label="총 관찰 기간"
          value={p.years}
          min={1}
          max={20}
          unit="년"
          onChange={(years) => change({ years })}
        />
        <Control
          label="연 명목수익률 · 세전 가정"
          value={p.rate}
          min={-5}
          max={15}
          onChange={(rate) => change({ rate })}
        />
        {p.mode === "uniform" ? (
          <Control
            label="연 물가상승률 · 가정"
            value={p.inflation}
            min={-3}
            max={15}
            onChange={(inflation) => change({ inflation })}
          />
        ) : (
          <>
            <Control
              label="0년 식료품 지출 비중"
              value={p.foodShare}
              min={0}
              max={100}
              onChange={(foodShare) => change({ foodShare })}
            />
            <Control
              label="연 식료품 가격상승률 · 가정"
              value={p.foodInflation}
              min={-3}
              max={15}
              onChange={(foodInflation) => change({ foodInflation })}
            />
            <Control
              label="연 생활용품 가격상승률 · 가정"
              value={p.otherInflation}
              min={-3}
              max={15}
              onChange={(otherInflation) => change({ otherInflation })}
            />
          </>
        )}
      </div>
      <button onClick={reset}>모든 조건 초기화</button>
      {p.mode === "personal" && (
        <p className="money-answer">
          기준 식료품 비중 {p.foodShare}% · 생활용품 {100 - p.foodShare}%. 이
          바구니의 {f.year}년 누적 가격변화 {pct(f.priceFactor - 1)}. 매년
          비중을 재조정하지 않고 최초 수량을 유지합니다. 다른 비중으로 바꿔
          마지막 연도를 다시 확인하세요.
        </p>
      )}
      <details>
        <summary>계산식과 모든 연도 표 · 정적 비교</summary>
        <p>
          명목 잔액 = 100,000 × (1 + 연 명목수익률)ⁿ. 물가 배율 = 해당 연도
          바구니 가격 ÷ 10,000. 실질금액 = 명목 잔액 ÷ 물가 배율. 모든 연율은
          계산할 때 소수로 바꿉니다.
        </p>
        <p>
          관찰 연도 직전 1년의 정확한 실질수익률: (1+r)/(1+π)−1 ={" "}
          {pct(f.realReturn)}. 뺄셈 근사 r−π = {pct(f.approxReturn)}.{" "}
          {f.year === 0
            ? "0년은 아직 기간이 없어 두 값을 0으로 표시합니다."
            : `π는 직전 연도 대비 장바구니 물가 ${pct(f.annualInflation)}입니다.`}{" "}
          근사를 여러 해 누적한 값을 정확한 구매력으로 쓰지 않습니다.
        </p>
        <div className="money-table" tabIndex={0} role="region" aria-label="모든 연도 구매력 비교 표, 가로 스크롤 가능">
          <table>
            <caption>원 · 소수는 표시 때만 반올림 · 실질 기준은 0년</caption>
            <thead>
              <tr>
                <th scope="col">년 후</th>
                <th scope="col">바구니 값</th>
                <th scope="col">명목</th>
                <th scope="col">실질</th>
                <th scope="col">예금 구매량</th>
              </tr>
            </thead>
            <tbody>
              {frames.map((a) => (
                <tr key={a.year}>
                  <th scope="row">{a.year}</th>
                  <td>{won(a.basketCost)}</td>
                  <td>{won(a.nominal)}</td>
                  <td>{won(a.real)}</td>
                  <td>{num(a.baskets)}바구니</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="money-caption">
        자체 가상 장바구니이며 실제 소비자물가지수 산식·공식 통계를 그대로
        재현하지 않습니다. 모든 가격·물가·수익률은 교육용 가정입니다. 최초
        10만원, 추가 입출금 없음, 연말 수익 재투자, 일정 연 수익률을 가정하며
        세금·수수료·상품별 이자 계산·품질 변화·대체 소비를 생략했습니다.
        구매량은 실제 구매를 차감하지 않은 구매 가능량입니다.
      </p>
    </section>
  );
}

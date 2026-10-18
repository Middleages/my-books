import { useState } from "react";
import {
  projectPlan,
  planDefaults,
  planKeys,
  planPhases,
  type PlanParams,
  type PlanKey,
  type PlanFrame,
  type PlanGoal,
  type PlanResult,
} from "../../simulations/money/plan.mjs";
import { usePlayback } from "./shared";
import "./plan.css";
const won = (v: number) =>
  v.toLocaleString("ko-KR", { maximumFractionDigits: 0 }) + "원";
const labels: Record<PlanKey, string> = {
  base: "기본 계획",
  shock: "소득 감소·큰 지출",
  later: "같은 충격·목표 연기",
};
const goalText = (g: PlanGoal) =>
  g.status === "pending"
    ? `${g.month}개월 목표일 전`
    : g.status === "gap"
      ? "현금 부족 이력 · 실행 보류"
      : g.status === "short"
        ? `목표 적립 ${won(g.shortfall)} 부족`
        : "목표 지출 반영";
function Meter({
  label,
  value,
  max,
  kind = "cash",
}: {
  label: string;
  value: number;
  max: number;
  kind?: string;
}) {
  return (
    <div className="plan-meter">
      <span>
        {label} <strong>{won(value)}</strong>
      </span>
      <div aria-hidden="true" className={"plan-track " + kind}>
        <i style={{ width: (100 * Math.abs(value)) / max + "%" }} />
      </div>
      {value < 0 && (
        <small>음수는 실제 잔액이 아닌 계획의 자금 부족입니다.</small>
      )}
    </div>
  );
}
export function PlanPrimer() {
  const r = projectPlan(planDefaults),
    before = r.paths.base.frames[3],
    after = r.paths.base.frames[4];
  return (
    <figure className="plan-primer">
      <figcaption>
        첫 달, 목표 통장으로 옮긴 25만원은 어디에 있을까요?
      </figcaption>
      <div className="plan-primer-grid">
        {[before, after].map((f, i) => (
          <div key={i}>
            <h3>{i ? "이체 후" : "이체 전"}</h3>
            <Meter label="생활 현금" value={f.cash} max={4000000} />
            <Meter
              label="목표 적립금"
              value={f.savings}
              max={4000000}
              kind="saving"
            />
            <p>합계 {won(f.cash + f.savings)}</p>
          </div>
        ))}
      </div>
      <p>
        공통 눈금 0~400만원. 생활 현금 → 목표 적립금으로 이동합니다. 총액은
        그대로이며 소득이나 소비를 새로 만들지 않습니다. 목표 물건을 살 때
        비로소 돈이 나갑니다.
      </p>
    </figure>
  );
}
function Range({
  label,
  value,
  min = 0,
  max,
  step = 50000,
  unit = "원",
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="money-slider">
      <span>
        {label}
        <strong>{unit === "원" ? won(value) : value + unit}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
function Chart({
  r,
  path,
  month,
}: {
  r: PlanResult;
  path: PlanKey;
  month: number;
}) {
  const rows = r.paths[path].rows,
    W = 320,
    H = 230,
    left = 80,
    right = 12,
    top = 28,
    bottom = 45;
  const x = (n: number) => left + (n / 24) * (W - left - right),
    y = (v: number) =>
      top + ((r.chartMax - v) / (r.chartMax - r.chartMin)) * (H - top - bottom);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="plan-chart"
      role="img"
      aria-label={
        labels[path] +
        "의 0~24개월 월말 계획: 현금·목표 적립·예정 부채. 정확한 값은 아래 전체 표."
      }
    >
      <text x={left} y={16}>
        만원 · 월말 계획
      </text>
      {[r.chartMin, 0, r.chartMax]
        .filter((v, i, a) => a.indexOf(v) === i)
        .map((v) => (
          <g key={v}>
            <line
              x1={left}
              x2={W - right}
              y1={y(v)}
              y2={y(v)}
              stroke={v === 0 ? "#46544a" : "#c6d3cb"}
            />
            <text x={left - 5} y={y(v) + 4} textAnchor="end">
              {(v / 10000).toLocaleString("ko-KR")}
            </text>
          </g>
        ))}
      {(["cash", "savings", "debt"] as const).map((key, i) => (
        <polyline
          key={key}
          fill="none"
          stroke={["#176746", "#915811", "#35569b"][i]}
          strokeWidth="2.5"
          strokeDasharray={["", "7 4", "2 4"][i]}
          points={rows.map((f) => `${x(f.month)},${y(f[key])}`).join(" ")}
        />
      ))}
      <line
        x1={x(month)}
        x2={x(month)}
        y1={top}
        y2={H - bottom}
        stroke="#4d5350"
        strokeDasharray="4 3"
      />
      {[0, 6, 12, 18, 24].map((n) => (
        <text key={n} x={x(n)} y={H - 22} textAnchor="middle">
          {n}
        </text>
      ))}
      <text x={W - right} y={H - 2} textAnchor="end">
        개월
      </text>
    </svg>
  );
}
function Scene({ f, p }: { f: PlanFrame; p: PlanParams }) {
  return (
    <div className="plan-scene">
      <div className="plan-in">
        <b>이달 들어옴</b>
        <strong>수입 {won(f.income)}</strong>
      </div>
      <div className="plan-hub">
        <b>생활 현금 계획 잔액</b>
        <strong>{won(f.cash)}</strong>
        <span>
          {f.cash < 0
            ? "자금 부족 · 실제 마이너스 통장 아님"
            : "다음 달로 이어지는 생활 현금"}
        </span>
      </div>
      <div className="plan-out">
        <b>이달 밖으로 나감 ↓</b>
        <span>생활비 {won(f.living)}</span>
        <span>큰 지출 {won(f.extra)}</span>
        <span>대출 이자 {won(f.interest)}</span>
      </div>
      <div className="plan-pocket">
        <b>현금 → 목표 통장</b>
        <span>이달 이동 {won(f.transfer)}</span>
        <Meter
          label="적립 잔액"
          value={f.savings}
          max={Math.max(1, p.goal)}
          kind="saving"
        />
        <span>목표 소비로 나감 {won(f.goalSpent)}</span>
      </div>
      <div className="plan-debt">
        <b>현금 → 대출 원금 상환</b>
        <span>이달 예정 원금 {won(f.principal)}</span>
        <Meter
          label="예정 부채 잔액"
          value={f.debt}
          max={Math.max(1, p.principal)}
          kind="debt"
        />
      </div>
    </div>
  );
}
export function PlanLab() {
  const [p, P] = useState<PlanParams>({ ...planDefaults }),
    [selected, S] = useState<PlanKey>("shock"),
    [prediction, predict] = useState("");
  const play = usePlayback(120),
    r = projectPlan(p),
    f = r.paths[selected].frames[play.step];
  function change(k: keyof PlanParams, value: number) {
    const next = { ...p, [k]: value };
    next.delay = Math.min(next.delay, 24 - next.goalMonth);
    P(next);
    play.rewind();
    predict("");
  }
  const reset = (patch: Partial<PlanParams> = {}) => {
    P({ ...planDefaults, ...patch });
    S("shock");
    play.rewind();
    predict("");
  };
  return (
    <section
      className="money-lab plan-lab"
      aria-label="우리 집 24개월 계획 실험"
    >
      <h3>하나의 예산에서 세 경로 비교하기</h3>
      <p>
        같은 출발 현금·대출·생활비에서 시작합니다. 충격은 6~8개월 수입 감소와
        6개월 큰 지출입니다. 세 번째 경로는 충격을 그대로 두고 목표 날짜만
        늦춥니다.
      </p>
      <div className="money-presets">
        <button onClick={() => reset()}>기본 조건으로 초기화</button>
        <button
          onClick={() => reset({ incomeDrop: 0, extraExpense: 0, delay: 0 })}
        >
          세 경로 동일 조건
        </button>
        <button
          onClick={() => reset({ incomeDrop: 100, extraExpense: 5000000 })}
        >
          큰 충격 비교
        </button>
      </div>
      <div className="money-inputs">
        <Range
          label="월수입"
          value={p.income}
          max={6000000}
          onChange={(v) => change("income", v)}
        />
        <Range
          label="월 생활비"
          value={p.living}
          max={6000000}
          onChange={(v) => change("living", v)}
        />
        <Range
          label="월 목표 적립 상한"
          value={p.monthlySaving}
          max={1000000}
          onChange={(v) => change("monthlySaving", v)}
        />
        <Range
          label="목표 금액"
          value={p.goal}
          max={10000000}
          onChange={(v) => change("goal", v)}
        />
        <Range
          label="기본 목표 시점"
          value={p.goalMonth}
          min={1}
          max={24}
          step={1}
          unit="개월"
          onChange={(v) => change("goalMonth", v)}
        />
        <Range
          label="세 번째 경로의 연기 기간"
          value={p.delay}
          max={24 - p.goalMonth}
          step={1}
          unit="개월"
          onChange={(v) => change("delay", v)}
        />
        <Range
          label="6~8개월 수입 감소율"
          value={p.incomeDrop}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => change("incomeDrop", v)}
        />
        <Range
          label="6개월의 큰 지출"
          value={p.extraExpense}
          max={5000000}
          onChange={(v) => change("extraExpense", v)}
        />
      </div>
      <details>
        <summary>출발 현금과 대출 조건 바꾸기</summary>
        <div className="money-inputs">
          <Range
            label="출발 생활 현금"
            value={p.initialCash}
            max={10000000}
            onChange={(v) => change("initialCash", v)}
          />
          <Range
            label="출발 대출 잔액"
            value={p.principal}
            max={12000000}
            onChange={(v) => change("principal", v)}
          />
          <Range
            label="고정 명목연율"
            value={p.annualRate}
            max={30}
            step={0.5}
            unit="%"
            onChange={(v) => change("annualRate", v)}
          />
          <Range
            label="남은 상환 기간"
            value={p.loanMonths}
            min={1}
            max={24}
            step={1}
            unit="개월"
            onChange={(v) => change("loanMonths", v)}
          />
        </div>
      </details>
      <p className="money-caption">
        원리금균등 · 첫 예정 납입 {won(r.monthlyPayment)}. 월율=명목연율÷12,
        월초 부채 기준 이자·월말 납입입니다. 대출금은 이미 사용한 기존 빚으로,
        출발 현금에 다시 더하지 않습니다. 물가·저축
        이자·투자·세법·보험·수수료·일별 납기·연체·신규 차입·중도상환은
        생략합니다.
      </p>
      <fieldset className="money-prediction">
        <legend>
          먼저 예측 · 충격 경로는 기본 목표일에 목표 지출까지 할까요?
        </legend>
        {[
          ["yes", "계획상 가능"],
          ["no", "부족하거나 보류"],
        ].map(([v, t]) => (
          <label key={v}>
            <input
              type="radio"
              name="plan-prediction"
              checked={prediction === v}
              onChange={() => predict(v)}
            />
            {t}
          </label>
        ))}
      </fieldset>
      <label className="plan-select">
        관찰 경로{" "}
        <select value={selected} onChange={(e) => S(e.target.value as PlanKey)}>
          {planKeys.map((k) => (
            <option key={k} value={k}>
              {labels[k]}
            </option>
          ))}
        </select>
      </label>
      {play.controls}
      <Range
        label="관찰 월 · 선택하면 월말"
        value={f.month}
        max={24}
        step={1}
        unit="개월"
        onChange={(v) => play.seek(v * 5)}
      />
      <div className="money-presets">
        <button onClick={() => play.seek(6 * 5)}>충격 첫 달 월말</button>
        <button onClick={() => play.seek(r.paths[selected].goal.month * 5)}>
          이 경로 목표일
        </button>
        <button onClick={() => play.seek(120)}>24개월 말</button>
      </div>
      <ol className="plan-phases">
        {planPhases.slice(1).map((name, i) => (
          <li key={name}>
            <button
              aria-current={f.phase === i + 1 ? "step" : undefined}
              onClick={() => play.seek((Math.max(1, f.month) - 1) * 5 + i + 1)}
            >
              {i + 1}. {name}
            </button>
          </li>
        ))}
      </ol>
      <p className="money-status" aria-live="polite">
        {labels[selected]} · {f.month}개월 · {planPhases[f.phase]} ·{" "}
        {goalText(f.goal)}
      </p>
      <Scene f={f} p={p} />
      <p className="money-caption">
        이동 막대의 전체는 각각 목표 금액·처음 부채입니다. 이달 수치는 해당
        단계까지 반영한 금액입니다. 목표 적립은 그달 수입에서 생활비·큰
        지출·원리금을 뺀 양수 범위에서만 하며, 초기 현금을 끌어 쓰지 않습니다.
        목표일에는 전액 적립되고 그때까지 현금 부족이 없을 때만 목표 소비를 한
        번 반영합니다.
      </p>
      <h4>24개월 월말 경로 · 세 그림의 같은 눈금</h4>
      <p>
        초록 실선=현금 계획, 갈색 긴 점선=목표 적립금, 파란 짧은 점선=예정 부채.
        세로 회색선은 관찰 월이며, 위 월중 장면과 아래 월말 그래프의 시점은 다를
        수 있습니다. 조건을 바꾸면 세 그림의 눈금이 함께 바뀝니다.
      </p>
      <div className="plan-comparison">
        {planKeys.map((key) => {
          const path = r.paths[key],
            current = path.frames[play.step];
          return (
            <article key={key}>
              <h4>{labels[key]}</h4>
              <Chart r={r} path={key} month={f.month} />
              <p>
                현재 단계 현금 <b>{won(current.cash)}</b>
                <br />
                목표 적립 {won(current.savings)}
                <br />
                예정 부채 {won(current.debt)}
              </p>
              <p className="plan-outcome">
                전체 일정: {goalText(path.goal)}
                <br />
                {path.firstGap === null
                  ? "24개월 월말 현금 부족 없음"
                  : `첫 현금 부족: ${path.firstGap}개월`}
                <br />
                최저 계획 현금 {won(path.minCash)}
              </p>
            </article>
          );
        })}
      </div>
      {play.step >= p.goalMonth * 5 && (
        <p className="money-answer">
          {prediction
            ? (prediction === "yes") ===
              (r.paths.shock.goal.status === "reached")
              ? "예측과 일치합니다."
              : "예측과 달랐습니다."
            : "다시 보기에서 결과를 예측해 보세요."}{" "}
          충격 경로의 목표일 판정: {goalText(r.paths.shock.goal)}. 날짜를
          바꾸어도 이미 생긴 현금 부족은 사라지지 않습니다.
        </p>
      )}
      <p className="money-caption">
        <strong>
          음수 현금은 실제 납부 결과가 아닌 자금 부족을 찾는 조건부 계획입니다.
        </strong>{" "}
        현금이 부족해도 예정 생활비·대출 일정을 산술적으로 이어 그리며, 자동
        대출이나 실제 연체를 만들지 않습니다. 최초 부족 이후 목표 적립·목표
        소비는 보류합니다. 뒤의 잔액이 양수로 돌아와도 과거 부족 판정은
        유지합니다. 실제 실행 가능한 계획으로 고치려면 소득·지출·시점을 바꿔
        처음부터 다시 비교해야 합니다.
      </p>
      <details>
        <summary>세 경로의 전체 월말 표</summary>
        <div className="plan-table-scroll" tabIndex={0} role="region" aria-label="전체 월말 표 가로 스크롤">
          <table className="money-table">
            <caption>
              원 단위 · 0개월 출발과 1~24개월 월말 · 반올림 전 모델로 판정
            </caption>
            <thead>
              <tr>
                {[
                  "월·경로",
                  "수입",
                  "생활비·큰 지출",
                  "원금 / 이자",
                  "목표 이동",
                  "목표 소비",
                  "현금 계획",
                  "목표 잔액",
                  "예정 부채",
                ].map((t) => (
                  <th scope="col" key={t}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.paths.base.rows.flatMap((_, i) =>
                planKeys.map((key) => {
                  const row = r.paths[key].rows[i];
                  return (
                    <tr key={key + i}>
                      <th scope="row">
                        {i} · {labels[key]}
                      </th>
                      <td>{won(row.income)}</td>
                      <td>{won(row.living + row.extra)}</td>
                      <td>
                        {won(row.principal)} / {won(row.interest)}
                      </td>
                      <td>{won(row.transfer)}</td>
                      <td>{won(row.goalSpent)}</td>
                      <td>{won(row.cash)}</td>
                      <td>{won(row.savings)}</td>
                      <td>{won(row.debt)}</td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

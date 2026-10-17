import { useState } from "react";
import {
  budgetDefaults,
  projectBudget,
} from "../../simulations/money/budget.mjs";
import { money, Slider, usePlayback } from "./shared";
export function BudgetLab() {
  const [p, set] = useState(budgetDefaults),
    [prediction, predict] = useState("");
  const play = usePlayback(12),
    r = projectBudget(p),
    selected = r.months[Math.max(0, play.step - 1)];
  const current =
    play.step === 0
      ? { living: p.opening, reserve: 0, total: p.opening }
      : selected;
  const change = (patch: Partial<typeof p>) => {
    play.rewind();
    predict("");
    set({ ...p, ...patch });
  };
  const days = r.months.flatMap((m) => m.days),
    min = Math.min(
      0,
      ...days.map((d) => d.total),
      ...days.map((d) => d.living),
    ),
    max = Math.max(1, p.opening, ...days.map((d) => d.total));
  const x = (i: number) => 55 + (650 * i) / (days.length - 1),
    y = (n: number) => 190 - (150 * (n - min)) / (max - min);
  const points = (key: "total" | "living") =>
    days.map((d, i) => `${x(i)},${y(d[key])}`).join(" ");
  const targetProgress = Math.min(
    100,
    (current.reserve / Math.max(1, p.annual)) * 100,
  );
  return (
    <section className="money-lab" aria-label="예산과 목적별 돈 실험">
      <div className="money-lab-heading">
        <span>03 / 시간 위에 놓은 돈</span>
        <h2>평균으로 남는 돈, 그날도 남아 있을까?</h2>
        <p>
          가상 2027년 · 단위 만원. 월별 타일을 누르면 달력·그래프의 관찰선·목적
          적립이 함께 바뀝니다.
        </p>
      </div>
      <div className="money-summary">
        <p>
          월평균 수지 <strong>{money(r.averageSurplus)}</strong>
          <small>월급 − 생활비 − 연간지출 ÷ 12</small>
        </p>
        <p>
          최초 총현금 부족{" "}
          <strong>
            {r.firstGap ? `${r.firstGap.month}월 ${r.firstGap.day}일` : "없음"}
          </strong>
          <small>
            {r.firstGap
              ? `${money(r.firstGap.amount)} 미충당`
              : "이 가정의 일별 잔액 기준"}
          </small>
        </p>
      </div>
      <figure className="money-chart money-year-chart">
        <figcaption>
          1~12월 일별 계획 잔액 · 실선: 총현금 / 점선: 생활통장
        </figcaption>
        <svg
          viewBox="0 0 740 240"
          role="img"
          aria-label={`일별 잔액 그래프. 최초 총현금 부족 ${r.firstGap ? `${r.firstGap.month}월 ${r.firstGap.day}일` : "없음"}. 아래 표에 월말 수치가 있습니다.`}
        >
          {[min, 0, max]
            .filter((n, i, a) => a.indexOf(n) === i)
            .map((n) => (
              <g key={n}>
                <line x1="55" x2="705" y1={y(n)} y2={y(n)} stroke="#cbd5d1" />
                <text x="48" y={y(n) + 4} textAnchor="end">
                  {n}
                </text>
              </g>
            ))}
          <polyline
            points={points("total")}
            fill="none"
            stroke="#15705f"
            strokeWidth="3"
          />
          <polyline
            points={points("living")}
            fill="none"
            stroke="#a4502e"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          {r.months.map((m, i) => {
            const idx = days.findIndex((d) => d.month === m.month);
            return (
              <text key={i} x={x(idx)} y="218" textAnchor="middle">
                {m.month}월
              </text>
            );
          })}
          {play.step > 0 && (
            <g>
              <line
                x1={x(
                  days.findIndex((d) => d.month === selected.month) +
                    selected.days.length -
                    1,
                )}
                x2={x(
                  days.findIndex((d) => d.month === selected.month) +
                    selected.days.length -
                    1,
                )}
                y1="25"
                y2="195"
                stroke="#263d39"
              />
              <circle
                cx={x(
                  days.findIndex((d) => d.month === selected.month) +
                    selected.days.length -
                    1,
                )}
                cy={y(selected.total)}
                r="5"
                fill="#263d39"
              />
            </g>
          )}
        </svg>
        <p className="money-caption">
          가로축: 2027년 날짜 · 세로축: 만원. 0 아래는 미충당 금액입니다. 목적
          적립을 바꾸면 점선만 변하고 총현금 실선은 같습니다.
        </p>
      </figure>
      <figure className="money-chart money-mobile-chart">
        <figcaption>{selected.month}월 일별 잔액 · 단위: 만원</figcaption>
        <svg
          viewBox="0 0 360 220"
          role="img"
          aria-label={`${selected.month}월 일별 계획 잔액. 실선은 총현금, 점선은 생활통장입니다.`}
        >
          {[min, 0, max]
            .filter((n, i, a) => a.indexOf(n) === i)
            .map((n) => (
              <g key={n}>
                <line x1="48" x2="335" y1={y(n)} y2={y(n)} stroke="#cbd5d1" />
                <text x="42" y={y(n) + 4} textAnchor="end">
                  {n}
                </text>
              </g>
            ))}
          {(["total", "living"] as const).map((key) => (
            <polyline
              key={key}
              points={selected.days
                .map(
                  (d, i) =>
                    `${48 + (287 * i) / (selected.days.length - 1)},${y(d[key])}`,
                )
                .join(" ")}
              fill="none"
              stroke={key === "total" ? "#15705f" : "#a4502e"}
              strokeWidth="2"
              strokeDasharray={key === "living" ? "6 4" : undefined}
            />
          ))}
          {[1, 10, 20, selected.days.length].map((d) => (
            <text
              key={d}
              x={48 + (287 * (d - 1)) / (selected.days.length - 1)}
              y="212"
              textAnchor="middle"
            >
              {d}일
            </text>
          ))}
        </svg>
        <p className="money-caption">
          실선: 총현금 · 점선: 생활통장. 0 아래는 미충당 금액. 월 타일로 다른
          달을 비교하세요. 12개월 수치는 아래 표에서도 읽습니다.
        </p>
      </figure>
      <div className="money-months" aria-label="관찰할 월 선택">
        {r.months.map((m) => (
          <button
            key={m.month}
            aria-pressed={play.step === m.month}
            className={m.days.some((d) => d.total < 0) ? "has-gap" : ""}
            onClick={() => play.seek(m.month)}
          >
            <b>{m.month}월</b>
            <span>{money(m.total)}</span>
            <small>
              {m.days.some((d) => d.total < 0)
                ? "! 총현금 부족"
                : m.month === p.dueMonth
                  ? "비정기 지출"
                  : "월말 잔액"}
            </small>
          </button>
        ))}
      </div>
      <div className="money-budget-scene">
        <section>
          <h3>
            {selected.month}월 지출 달력 {play.step === 0 ? "· 미리 보기" : ""}
          </h3>
          <p>
            {p.payday}일 월급 → 10일 생활비{" "}
            {selected.month === p.dueMonth ? "→ 20일 비정기 지출" : ""}
          </p>
          <div
            className="money-calendar"
            aria-label={`${selected.month}월 달력`}
          >
            {["일", "월", "화", "수", "목", "금", "토"].map((s) => (
              <b key={s}>{s}</b>
            ))}
            {Array.from(
              { length: new Date(2027, selected.month - 1, 1).getDay() },
              (_, i) => (
                <span key={`blank${i}`} />
              ),
            )}
            {selected.days.map((d) => (
              <div key={d.day} className={d.events.length ? "event-day" : ""}>
                <span>{d.day}</span>
                {d.events
                  .filter((e) => e.kind !== "transfer")
                  .map((e) => (
                    <small key={e.label}>
                      {e.kind === "income" ? "+" : "−"}
                      {e.amount}
                    </small>
                  ))}
                {d.total < 0 && <em aria-label="총현금 부족">!</em>}
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3>목적통장 · 연간 지출 준비</h3>
          <div
            className="money-jar"
            role="img"
            aria-label={`목적통장 ${money(current.reserve)}, 목표 지출 ${money(p.annual)}`}
          >
            <div style={{ height: `${targetProgress}%` }} />
            <strong>{money(current.reserve)}</strong>
          </div>
          <p>
            목표 지출 {money(p.annual)}
            <br />
            생활통장 {money(current.living)}
            <br />
            총현금 {money(current.total)}
          </p>
          <p>
            {play.step === 0
              ? "시작일 · 목적통장은 비어 있습니다."
              : `이달 적립 ${money(selected.saved)} · 지출에 사용 ${money(selected.used)}`}
          </p>
        </section>
      </div>
      <p className="money-status" role="status">
        {play.step === 0
          ? "시작 전 · 전체 계획을 미리 볼 수 있습니다."
          : `${selected.month}월 말 · 총현금 ${money(current.total)} · 목적통장 ${money(current.reserve)}`}
      </p>
      {play.controls}
      <fieldset className="money-prediction">
        <legend>
          먼저 예측 · 목적 적립만 늘리면 총현금 부족이 없어질까요?
        </legend>
        {[
          ["yes", "없어진다"],
          ["no", "총현금은 같다"],
        ].map(([v, t]) => (
          <label key={v}>
            <input
              type="radio"
              name="budget-prediction"
              checked={prediction === v}
              onChange={() => predict(v)}
            />
            {t}
          </label>
        ))}
      </fieldset>
      {play.step > 0 && prediction && (
        <p className="money-answer">
          {prediction === "no"
            ? "예측과 일치합니다."
            : "총현금 그래프를 다시 보세요."}{" "}
          목적 적립은 내 통장 사이 이체입니다. 지출할 돈을 구분하지만 새 돈을
          만들지는 않습니다.
        </p>
      )}
      <div className="money-inputs">
        <Slider
          label="시작 총현금"
          value={p.opening}
          max={600}
          onChange={(opening) => change({ opening })}
        />
        <Slider
          label="월 세후 급여"
          value={p.income}
          max={600}
          onChange={(income) => change({ income })}
        />
        <Slider
          label="월 생활비"
          value={p.regular}
          max={500}
          onChange={(regular) => change({ regular })}
        />
        <Slider
          label="연간 비정기 지출"
          value={p.annual}
          max={720}
          step={12}
          onChange={(annual) => change({ annual })}
        />
        <Slider
          label="매월 목적 적립"
          value={p.saving}
          max={120}
          onChange={(saving) => change({ saving })}
        />
        <label className="money-select">
          비정기 출금월
          <select
            value={p.dueMonth}
            onChange={(e) => change({ dueMonth: Number(e.target.value) })}
          >
            {r.months.map((m) => (
              <option key={m.month} value={m.month}>
                {m.month}월 20일
              </option>
            ))}
          </select>
        </label>
        <label className="money-select">
          월급일
          <select
            value={p.payday}
            onChange={(e) => change({ payday: Number(e.target.value) })}
          >
            <option value={5}>매월 5일</option>
            <option value={25}>매월 25일</option>
          </select>
        </label>
      </div>
      <details>
        <summary>선택 월의 실제 이동과 일별 잔액 보기</summary>
        <div className="money-table">
          <table>
            <caption>
              {selected.month}월 · 만원 · 이체는 총현금에 영향 없음
            </caption>
            <thead>
              <tr>
                <th>일</th>
                <th>사건</th>
                <th>생활</th>
                <th>목적</th>
                <th>합계</th>
              </tr>
            </thead>
            <tbody>
              {selected.days
                .filter((d) => d.events.length)
                .map((d) => (
                  <tr key={d.day}>
                    <th>{d.day}일</th>
                    <td>
                      {d.events
                        .map((e) => `${e.label} ${money(e.amount)}`)
                        .join(" / ")}
                    </td>
                    <td>{d.living}</td>
                    <td>{d.reserve}</td>
                    <td>{d.total}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
      <details>
        <summary>12개월 월말 잔액 표</summary>
        <div className="money-table">
          <table>
            <caption>단위: 만원 · 표와 그래프는 같은 일별 모델</caption>
            <thead>
              <tr>
                <th>월</th>
                <th>생활</th>
                <th>목적</th>
                <th>총현금</th>
              </tr>
            </thead>
            <tbody>
              {r.months.map((m) => (
                <tr key={m.month}>
                  <th>{m.month}</th>
                  <td>{m.living}</td>
                  <td>{m.reserve}</td>
                  <td>{m.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="money-caption">
        음수는 계획상 자금 부족이며 실제 마이너스통장이나 자동 대출을 뜻하지
        않습니다. 부족한 뒤의 선은 미충당 지출을 모두 반영한 산술 경로입니다.
        목적통장도 언제든 쓸 수 있는 현금이며 적립은 월급일의 생활통장 양수 잔액
        이내로 제한합니다. 비정기 지출은 목적통장부터 쓰고 나머지는 생활통장에서
        충당합니다. 생활비는 매월 10일 한 번 출금, 세금·금리·휴일 이연·잔액부족
        출금 거절은 생략했습니다.
      </p>
      <button
        onClick={() => {
          play.rewind();
          predict("");
          set(budgetDefaults);
        }}
      >
        모든 조건 초기화
      </button>
    </section>
  );
}

import { useMemo, useState } from "react";
import {
  projectSavings,
  savingsDefaults,
  type SavingsParams,
} from "../../simulations/money/savings.mjs";
import { usePlayback } from "./shared";
import {
  SavingsChart,
  SavingsWallet,
  savingsWon as won,
} from "./SavingsVisuals";
import "./savings.css";
const phaseNames = {
  initial: "시작",
  release: "① 월초 · 묶인 돈 풀림",
  save: "② 월말 · 적립",
  check: "③ 목표일 · 지출 확인",
};
export function SavingsLab() {
  const [p, setP] = useState<SavingsParams>({ ...savingsDefaults });
  const [prediction, setPrediction] = useState("");
  const result = useMemo(() => projectSavings(p), [p]);
  const play = usePlayback(result.frames.length - 1);
  const index = Math.min(play.step, result.frames.length - 1),
    f = result.frames[index];
  const dueIndex = result.frames.findIndex(
    (v) => v.month === p.dueMonth && v.phase === "check",
  );
  const amount = f.released || f.contribution || f.spent;
  const route =
    f.phase === "release"
      ? ["묶인 돈", "사용 가능"]
      : f.phase === "save"
        ? ["매월 적립", "사용 가능"]
        : ["사용 가능", "목표 지출"];
  const choices = { yes: "제때 전액 쓸 수 있다", no: "목표일에는 부족하다" };
  function change(patch: Partial<SavingsParams>) {
    play.rewind();
    setPrediction("");
    setP((prev) => {
      const next = { ...prev, ...patch };
      return { ...next, locked: Math.min(next.initial, next.locked) };
    });
  }
  function range(
    key: keyof SavingsParams,
    label: string,
    max: number,
    step: number,
    unit = "원",
  ) {
    return (
      <label className="money-slider">
        <span>
          {label}
          <strong>
            {p[key].toLocaleString("ko-KR")}
            {unit}
          </strong>
        </span>
        <input
          type="range"
          min="0"
          max={max}
          step={step}
          value={p[key]}
          aria-valuetext={`${p[key]}${unit}`}
          onChange={(e) => change({ [key]: Number(e.target.value) })}
        />
      </label>
    );
  }
  return (
    <section
      className="money-lab savings-lab"
      aria-label="저축과 목표의 시간 실험"
    >
      <div className="money-lab-heading">
        <span>SAVINGS LAB · 0개월 시작 · 원 단위 · 수익률·비용 0</span>
        <h2>돈의 크기와 사용할 날을 함께 보기</h2>
      </div>
      <p>
        처음에는 기본 조건으로 재생하거나 ‘목표일 결과 보기’를 누르세요. 이어
        ‘목표 전에 풀리게’로 바꿔 총액이 같은데 무엇이 달라졌는지 비교합니다.
        조건을 바꾸면 새 계획을 처음부터 계산합니다.
      </p>
      <fieldset className="money-prediction">
        <legend>먼저 예측 · 목표일에 필요한 돈을 전액 쓸 수 있을까요?</legend>
        {Object.entries(choices).map(([v, label]) => (
          <label key={v}>
            <input
              type="radio"
              name="savings-prediction"
              checked={prediction === v}
              onChange={() => setPrediction(v)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <div className="money-presets">
        <button onClick={() => change({ releaseMonth: p.dueMonth })}>
          목표 전에 풀리게
        </button>
        <button
          onClick={() => change({ releaseMonth: Math.min(36, p.dueMonth + 3) })}
        >
          목표 뒤에 풀리게
        </button>
        <button
          onClick={() =>
            change({
              ...savingsDefaults,
              initial: 0,
              locked: 0,
              payment: 100000,
              target: 1000000,
            })
          }
        >
          처음부터 모으기
        </button>
        <button
          onClick={() => {
            play.rewind();
            setPrediction("");
            setP({ ...savingsDefaults });
          }}
        >
          전체 초기화
        </button>
      </div>
      <div className="money-inputs">
        {range("initial", "시작 준비금", 2000000, 100000)}
        {range("locked", "준비금 중 묶인 돈", p.initial, 100000)}
        {range("payment", "매월 말 적립액", 300000, 10000)}
        {range("target", "목표일에 필요한 금액", 3000000, 100000)}
        {range("dueMonth", "목표일", 24, 1, "개월 말")}
        {range("releaseMonth", "묶인 돈이 풀리는 달", 36, 1, "개월 초")}
      </div>
      <p className="money-caption">
        시작 준비금은 사용 가능한 돈과 묶인 돈의 합입니다. 준비금을 줄여 묶인
        돈보다 작아지면 묶인 금액도 함께 줄입니다. 목표액은 목표일의
        명목금액으로 고정합니다. 매월 적립할 재원은 별도로 마련된 가상 조건이며
        가계 전체의 추가 소득을 계산하지 않습니다.
      </p>
      <div className="savings-dates">
        <p>
          <b>지출할 날</b>
          <strong>{p.dueMonth === 0 ? "지금" : `${p.dueMonth}개월 말`}</strong>
          <span>{won(p.target)} 필요</span>
        </p>
        <p>
          <b>묶인 돈을 꺼낼 날</b>
          <strong>
            {p.releaseMonth === 0 ? "지금" : `${p.releaseMonth}개월 초`}
          </strong>
          <span>시작 준비금 중 {won(p.locked)}</span>
        </p>
      </div>
      {play.controls}
      <div className="money-presets">
        <button onClick={() => play.seek(dueIndex)}>목표일 결과 보기</button>
        <button
          onClick={() =>
            play.seek(
              result.frames.findIndex(
                (v) =>
                  v.month === p.releaseMonth &&
                  (v.phase === "release" || v.phase === "initial"),
              ),
            )
          }
        >
          풀리는 시점 보기
        </button>
      </div>
      <label className="money-slider">
        <span>
          관찰 단계
          <strong>
            {f.month}개월 · {phaseNames[f.phase]}
          </strong>
        </span>
        <input
          type="range"
          min="0"
          max={result.frames.length - 1}
          value={index}
          aria-valuetext={`${f.month}개월 ${phaseNames[f.phase]}`}
          onChange={(e) => play.seek(Number(e.target.value))}
        />
      </label>
      <p className="money-status" aria-live="polite">
        {f.month}개월 · {phaseNames[f.phase]} ·{" "}
        {f.phase === "initial"
          ? "아직 월 적립은 없습니다. 풀림이 0개월이면 묶인 돈을 이미 사용할 수 있습니다."
          : f.phase === "release"
            ? f.released > 0
              ? `${won(f.released)}이 사용 가능한 칸으로 이동했습니다. 총액은 그대로입니다.`
              : "이번 달에 풀리는 돈은 없습니다."
            : f.phase === "save"
              ? `${won(f.contribution)} 적립했습니다. 이달 말 목표 지출보다 먼저 넣습니다.`
              : f.month === p.dueMonth
                ? f.due!.success
                  ? `${won(f.spent)} 전액 지출했습니다.`
                  : `${won(f.due!.shortfall)} 부족해 지출하지 않았습니다. 자동 차입하지 않습니다.`
                : "이번 달은 목표일이 아닙니다. 지난 목표일 결과는 이후에도 바뀌지 않습니다."}
      </p>
      <div
        className={`savings-route ${play.playing && amount > 0 ? "is-playing" : ""}`}
        aria-label="이번 단계의 자금 이동"
      >
        <span>{f.phase === "initial" ? "시작 전" : route[0]}</span>
        <div className="savings-route-track">
          <b>{amount > 0 ? `${won(amount)} →` : "이동 없음"}</b>
        </div>
        <span>{f.phase === "initial" ? "아직 이동 없음" : route[1]}</span>
      </div>
      <p className="money-caption">
        화살표는 이번 단계의 이동 방향을 나타냅니다. 길이·이동 속도는 금액이나
        수익률을 뜻하지 않습니다. 재생을 정지하면 이동도 멈추며, 모든 단계는
        정적 설명으로도 읽을 수 있습니다.
      </p>
      <SavingsWallet p={p} frame={f} result={result} />
      {f.due ? (
        <section className="savings-verdict" aria-label="목표일 판정">
          <h3>{p.dueMonth}개월 목표일의 기록</h3>
          <p>
            {prediction
              ? prediction === (f.due.success ? "yes" : "no")
                ? "예측과 일치합니다."
                : "예측과 달랐습니다."
              : "다음 계획에서는 먼저 예측해 보세요."}{" "}
            <b>{choices[f.due.success ? "yes" : "no"]}</b>
          </p>
          <div className="savings-verdict-grid">
            <p>
              지출 직전 총액<b>{won(f.due.totalBefore)}</b>
              <small>
                {f.due.totalEnough ? "총액은 목표 이상" : "총액 자체도 부족"}
              </small>
            </p>
            <p>
              목표일 사용 가능액<b>{won(f.due.availableBefore)}</b>
              <small>묶인 돈 {won(f.due.lockedBefore)} 제외</small>
            </p>
            <p>
              목표일 부족분<b>{won(f.due.shortfall)}</b>
              <small>필요 {won(p.target)} − 사용 가능액, 최소 0</small>
            </p>
          </div>
          <p>
            {f.due.success
              ? "목표 지출 뒤 남은 돈과 지출 직전의 판정 금액을 구분하세요."
              : f.due.totalEnough
                ? "총액이 충분해도 정해진 날 꺼낼 수 없는 돈은 그날의 지출에 쓸 수 없습니다."
                : "이 조건은 꺼낼 시점뿐 아니라 준비한 총액도 부족합니다."}{" "}
            이후 관찰 시점에 잔액이 늘어도 이 목표일 기록을 다시 쓰지 않습니다.
          </p>
        </section>
      ) : (
        <p className="money-answer">
          목표일 전입니다. 현재 잔액만으로 전액 지출 여부를 확정하지 않고,
          목표일에 남아 있는 사용 가능액으로 판정합니다.
        </p>
      )}
      <SavingsChart p={p} result={result} month={f.month} />
      <section className="savings-months" aria-label="월별 시간표">
        {result.rows.map((row) => (
          <button
            key={row.month}
            aria-current={f.month === row.month ? "step" : undefined}
            onClick={() =>
              play.seek(
                Math.max(
                  0,
                  result.frames.findIndex(
                    (v) => v.month === row.month && v.phase === "check",
                  ),
                ),
              )
            }
          >
            <b>{row.month}개월</b>
            <span>
              {row.month === p.dueMonth
                ? "목표일"
                : row.month === p.releaseMonth
                  ? "풀리는 달"
                  : "월말 확인"}
            </span>
            {row.month === p.dueMonth && row.month === p.releaseMonth && (
              <span>월초 풀림도 있음</span>
            )}
          </button>
        ))}
      </section>
      <details>
        <summary>0수익률에서 필요한 월 적립액의 구조</summary>
        <p>
          목표일까지 사용 가능한 시작 준비금은 {won(result.usableInitial)}
          입니다. 총 준비금 중 목표 뒤에 풀릴 돈은 제외합니다.
        </p>
        <p>
          <b>
            {result.requiredMonthly === null
              ? "목표가 지금이므로 앞으로 납입해서 오늘의 부족분을 메울 수 없습니다."
              : `이 가정에서 필요한 월 적립액: 최소 ${won(result.requiredMonthly)} (정수 원으로 올림)`}
          </b>
        </p>
        <p>
          양수 부족분 ÷ 목표일까지 남은 월말 납입 횟수({p.dueMonth}회). 부족분이
          없으면 0원입니다. 이는 현재 가정의 산술 기준이며 월급·생활비·다른
          목표를 고려한 실행 가능성이나 상품 추천이 아닙니다. 적립액뿐 아니라
          필요한 금액·실제로 바꿀 수 있는 기한·돈의 사용 가능 시점을 따로
          검토하세요.
        </p>
      </details>
      <details>
        <summary>전체 월별 정적 표</summary>
        <div
          className="money-table"
          tabIndex={0}
          role="region"
          aria-label="목표 시간표 상세 표, 가로 스크롤 가능"
        >
          <table>
            <caption>
              단위 원 · 월말 납입 후 목표 지출 직전/직후 · 0개월은 시작
            </caption>
            <thead>
              <tr>
                {[
                  "개월",
                  "월초 풀림",
                  "월말 적립",
                  "적립 누계",
                  "지출 전 전체",
                  "지출 전 사용 가능",
                  "지출 전 묶인 돈",
                  "목표 지출",
                  "지출 후 전체",
                ].map((t) => (
                  <th scope="col" key={t}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr
                  key={row.month}
                  aria-current={f.month === row.month ? "true" : undefined}
                >
                  <th scope="row">{row.month}</th>
                  {[
                    row.released,
                    row.contribution,
                    row.added,
                    row.totalBefore,
                    row.availableBefore,
                    row.lockedBefore,
                    row.spent,
                    row.remaining,
                  ].map((n, i) => (
                    <td key={i}>{won(n)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="money-caption">
        교육용 가상 조건: 시작 준비금 중 묶인 돈은 지정한 달 초에 원금 전액이
        풀리며 중도 인출은 불가합니다. 실제 예금·금융상품의 중도해지·매도·결제일
        규칙을 재현하지 않습니다. 이후 적립액은 전부 사용 가능 칸에 넣습니다.
        목표가 0개월이면 월 적립 없이 지금 판정합니다. 다른 달에는 월말 적립 후
        목표액 전액을 한 번만 지출하며, 부족하면 부분 지출·자동 대출·기한 연장을
        하지 않습니다. 목표일 뒤에도 관찰 종료까지 같은 적립을 계속해 시점
        차이를 비교합니다. 수익·손실·세금·수수료·물가·생활비·다른 목표는
        생략했습니다.
      </p>
    </section>
  );
}

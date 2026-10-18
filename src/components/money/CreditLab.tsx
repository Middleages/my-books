import { useMemo, useState } from "react";
import {
  creditDefaults,
  projectCredit,
  type CreditParams,
} from "../../simulations/money/credit.mjs";
import { usePlayback } from "./shared";
import {
  CreditAllocation,
  CreditChart,
  creditStatus,
  creditWon as won,
} from "./CreditVisuals";
import "./credit.css";
const phases = {
  start: "시작 전",
  income: "① 월수입 반영",
  expenses: "② 생활비·기존 납입",
  loan: "③ 새 대출 원금·이자",
  compare: "④ 남은 돈과 예비여유 비교",
};
export function CreditLab() {
  const [p, setP] = useState<CreditParams>({ ...creditDefaults }),
    [prediction, setPrediction] = useState("");
  const r = useMemo(() => projectCredit(p), [p]),
    play = usePlayback(r.baseline.frames.length - 1),
    index = Math.min(play.step, r.baseline.frames.length - 1),
    a = r.baseline.frames[index],
    b = r.changed.frames[index];
  const rowIndex = Math.max(0, a.month - 1),
    rows = [r.baseline.rows[rowIndex], r.changed.rows[rowIndex]];
  const scale = Math.max(
    1,
    ...[...r.baseline.frames, ...r.changed.frames].flatMap((f) => [
      f.income,
      f.totalUse,
    ]),
  );
  const route =
    a.phase === "start"
      ? ["대출 조건", "월 예산 관찰"]
      : a.phase === "income"
        ? ["월수입", "월 예산"]
        : a.phase === "expenses"
          ? ["월 예산", "생활비·기존 납입"]
          : a.phase === "loan"
            ? ["월 예산", "새 원금·이자"]
            : ["남은 현금", "예비여유와 비교"];
  const amount =
    b.phase === "income"
      ? b.income
      : b.phase === "expenses"
        ? b.living + b.existing
        : b.phase === "loan"
          ? b.principal + b.interest
          : 0;
  function change(patch: Partial<CreditParams>) {
    play.rewind();
    setPrediction("");
    setP((prev) => ({ ...prev, ...patch }));
  }
  function control(
    key: keyof CreditParams,
    label: string,
    max: number,
    step: number,
    unit = "원",
    min = 0,
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
          min={min}
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
      className="money-lab credit-lab"
      aria-label="신용과 대출 부담 실험"
    >
      <div className="money-lab-heading">
        <span>CREDIT LAB · 가상 월 예산 · 원 단위</span>
        <h2>빌리는 금액 옆에 매달 남는 돈 놓기</h2>
      </div>
      <p>
        기본 비교는 {p.changeMonth}개월부터 변경 연율을 적용합니다. ‘변경
        직전’과 ‘변경 월 완성’으로 앞뒤를 확인하고, 금리·수입·생활비 중 한
        조건씩 바꿔 보세요. 관찰은 최대 12개월이며 전체 대출 기간의 비용 비교가
        아닙니다.
      </p>
      <fieldset className="money-prediction">
        <legend>
          먼저 예측 · 변경 월에도 정해 둔 예비여유까지 남길 수 있을까요?
        </legend>
        {[
          ["yes", "남길 수 있다"],
          ["no", "예비여유에 못 미친다"],
        ].map(([v, label]) => (
          <label key={v}>
            <input
              type="radio"
              name="credit-prediction"
              checked={prediction === v}
              onChange={() => setPrediction(v)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <div className="money-presets">
        <button
          onClick={() => change({ changedRate: p.annualRate, incomeCut: 0 })}
        >
          동일 조건 비교
        </button>
        <button
          onClick={() =>
            change({
              changedRate: Math.min(30, p.annualRate + 6),
              incomeCut: 0,
            })
          }
        >
          금리만 6%p 높이기
        </button>
        <button
          onClick={() =>
            change({
              changedRate: Math.min(30, p.annualRate + 6),
              incomeCut: 10,
            })
          }
        >
          금리와 수입 감소 함께
        </button>
        <button
          onClick={() => {
            play.rewind();
            setPrediction("");
            setP({ ...creditDefaults });
          }}
        >
          전체 초기화
        </button>
      </div>
      <div className="money-inputs">
        {control("principal", "가상 신규 대출 원금", 30000000, 1000000)}
        {control("months", "상환 기간", 60, 1, "개월", 1)}
        {control("annualRate", "처음 연율", 20, 1, "%")}
        {control("changedRate", "변경 후 연율", 30, 1, "%")}
        {control("changeMonth", "비교 조건 변경 시작", 12, 1, "개월", 1)}
      </div>
      <details>
        <summary>월 예산과 수입 감소 조건 바꾸기</summary>
        <div className="money-inputs">
          {control("income", "세후 월수입", 6000000, 100000)}
          {control("living", "월 생활비", 6000000, 100000)}
          {control("existing", "기존 대출 월 납입액", 2000000, 50000)}
          {control("reserve", "남기려는 월 예비여유", 1000000, 50000)}
          {control("incomeCut", "변경 월부터 수입 감소", 50, 5, "%")}
        </div>
        <p>
          기존 납입액에는 원금·이자가 합쳐져 있다고 가정하며 이번 표에서 다시
          분리하지 않습니다. 예비여유는 아직 쓰지 않고 남겨 두려는 현금으로,
          생활비나 대출 납입에 더해 출금하는 비용이 아닙니다. 변경 시나리오는
          같은 달부터 연율과 수입 감소를 적용합니다. 두 가정을 분리하려면 하나를
          처음 조건과 같게 두세요.
        </p>
      </details>
      <p className="money-caption">
        이자 계산 월율 = 해당 연율 ÷ 12(명목연율). 월초 예정 원금 잔액에 곱하며
        매월 말 예정 원금과 이자를 납입한다고 가정합니다. 새 대출 원금은
        기간으로 균등 분할합니다. 세후 수입을 사용하는 생활 예산이며 법정
        DSR·DTI·심사 한도 계산이 아닙니다. 금리 변화는 가상 조건이며 실제 계약의
        재산정·상한 규칙은 생략했습니다.
      </p>
      {play.controls}
      <div className="money-presets">
        <button
          disabled={p.changeMonth > r.horizon}
          onClick={() => play.seek((p.changeMonth - 1) * 4)}
        >
          변경 직전 월말
        </button>
        <button
          disabled={p.changeMonth > r.horizon}
          onClick={() => play.seek(p.changeMonth * 4)}
        >
          변경 월 완성 보기
        </button>
      </div>
      {p.changeMonth > r.horizon && (
        <p className="money-caption">
          변경 시점이 관찰 기간 밖에 있습니다. 두 경로는 이 기간에서 같으며,
          변경 월로 이동할 수 없습니다.
        </p>
      )}
      <label className="money-slider">
        <span>
          관찰 단계
          <strong>
            {a.month}개월 · {phases[a.phase]}
          </strong>
        </span>
        <input
          type="range"
          min="0"
          max={r.baseline.frames.length - 1}
          value={index}
          aria-valuetext={`${a.month}개월 ${phases[a.phase]}`}
          onChange={(e) => play.seek(Number(e.target.value))}
        />
      </label>
      <p className="money-status" aria-live="polite">
        {a.month}개월 · {phases[a.phase]} ·{" "}
        {a.phase === "start"
          ? "대출 입금은 월수입에 넣지 않습니다. 첫 달 예산부터 관찰합니다."
          : a.phase === "income"
            ? "이달 세후 수입을 반영했습니다."
            : a.phase === "expenses"
              ? "생활비와 기존 대출 납입액을 뺀 중간 상태입니다."
              : a.phase === "loan"
                ? "신규 원금 상환과 이자를 별도로 뺐습니다."
                : "남은 현금에서 남겨 두려는 예비여유를 구분합니다. 판정은 이 가정의 월 예산에 한정됩니다."}
      </p>
      <div
        className={`credit-route ${play.playing && amount > 0 ? "is-playing" : ""}`}
        aria-label="변경 시나리오의 단계 흐름"
      >
        <span>{route[0]}</span>
        <div>
          <b className={amount > 0 ? "credit-flow-amount" : undefined}>
            {amount > 0 ? won(amount) : "현금 이동 없이 비교"}
          </b>
        </div>
        <span>{route[1]}</span>
      </div>
      <p className="credit-caption">
        화살표는 변경 시나리오에서 이번 단계에 반영한 흐름입니다. 방향만 뜻하며
        속도·굵기는 금액이 아닙니다. 음수 현금도 계획 산술값이며 실제
        송금·연체·차입이 실행되지 않습니다.
      </p>
      <div className="credit-comparison">
        <CreditAllocation
          frame={a}
          row={rows[0]}
          scale={scale}
          label="처음 조건 유지"
        />
        <CreditAllocation
          frame={b}
          row={rows[1]}
          scale={scale}
          label="변경 조건 적용"
        />
      </div>
      {a.phase === "compare" && (
        <section className="credit-verdict" aria-label="월 부담 해석">
          <h3>{a.month}개월 · 변경 시나리오 해석</h3>
          <p>
            <b>{creditStatus[rows[1].status]}</b>
          </p>
          <p>
            지출·납입 후 현금 {won(b.cash)} − 남겨 두려는 예비여유{" "}
            {won(p.reserve)} = 추가 여유 {won(b.margin)}.
          </p>
          <p>
            {rows[1].status === "cash-gap"
              ? "이 가정의 월수입만으로 생활비와 예정 납입을 모두 낼 수 없습니다. 보유 현금 등 다른 재원은 계산하지 않았습니다."
              : rows[1].status === "reserve-gap"
                ? "예정한 납입 뒤 현금은 남지만, 스스로 정한 예비여유를 유지하지 못합니다. 이것만으로 실제 연체·지급 불능이라고 판정하지 않습니다."
                : rows[1].status === "no-extra"
                  ? "예비여유를 제외하면 추가로 남는 돈이 없습니다. 다른 지출이나 수입 변동을 감당할 수 있다는 보장은 아닙니다."
                  : "계획한 예비여유를 넘겨 남습니다. 생략한 지출·소득 변동·다른 재원이 있으므로 대출이 안전하거나 적합하다는 승인으로 읽지 마세요."}
          </p>
          {a.month === p.changeMonth && (
            <p>
              {prediction
                ? prediction ===
                  (["room", "no-extra"].includes(rows[1].status) ? "yes" : "no")
                  ? "예측과 일치합니다."
                  : "예측과 달랐습니다. 이자와 월수입의 변화를 따로 보세요."
                : "다음에는 변경 월 결과를 먼저 예측해 보세요."}
            </p>
          )}
          <p className="credit-caption">
            신용점수·담보·대출 승인·법정 한도를 판정하는 결과가 아닙니다.
          </p>
        </section>
      )}
      <CreditChart result={r} month={a.month} changeMonth={p.changeMonth} />
      <div className="credit-months" aria-label="관찰 월 선택">
        {r.baseline.rows.map((row) => (
          <button
            key={row.month}
            aria-pressed={a.month === row.month}
            onClick={() => play.seek(row.month * 4)}
          >
            {row.month}개월{row.month === p.changeMonth ? " · 변경" : ""}
          </button>
        ))}
      </div>
      <p className="money-answer">
        관찰 기간에서 예비여유까지 확보하기에 처음 부족한 월: 처음 조건{" "}
        {r.baseline.firstPlanGap ? `${r.baseline.firstPlanGap}개월` : "없음"},
        변경 조건{" "}
        {r.changed.firstPlanGap ? `${r.changed.firstPlanGap}개월` : "없음"}.
        월수입 자체가 지출·납입에 못 미치는 첫 월: 변경 조건{" "}
        {r.changed.firstCashGap ? `${r.changed.firstCashGap}개월` : "없음"}.
        ‘없음’은 최대 {r.horizon}개월의 이 가정에서만 해당합니다.
      </p>
      <details>
        <summary>월별 계획 비교 표</summary>
        <div
          className="money-table"
          tabIndex={0}
          role="region"
          aria-label="월 부담 비교 표, 가로 스크롤 가능"
        >
          <table>
            <caption>
              단위 원 · 매월 말 예정 납입 후 · 전체 기간 중 처음 {r.horizon}
              개월만 관찰
            </caption>
            <thead>
              <tr>
                {[
                  "월",
                  "조건",
                  "연율",
                  "월수입",
                  "새 원금 상환",
                  "새 이자",
                  "새 원리금",
                  "지출·납입 후 현금",
                  "예비여유 제외 추가 여유",
                  "예정 원금 잔액",
                ].map((t) => (
                  <th scope="col" key={t}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.baseline.rows.flatMap((row, i) =>
                [row, r.changed.rows[i]].map((v, j) => (
                  <tr
                    key={`${v.month}-${j}`}
                    aria-current={a.month === v.month ? "true" : undefined}
                  >
                    <th scope="row">{v.month}</th>
                    <td>{j ? "변경" : "처음"}</td>
                    <td>{v.rate}%</td>
                    {[
                      v.income,
                      v.principal,
                      v.interest,
                      v.payment,
                      v.cash,
                      v.margin,
                      v.closing,
                    ].map((n, k) => (
                      <td key={k}>{won(n)}</td>
                    ))}
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </details>
      <p className="money-caption">
        가상 원금균등 조건으로 신규 원금 ÷ 상환 개월 수를 매달 갚고, 월초 예정
        원금에 해당 월율을 곱합니다. 예정대로 모두 납입한다는 조건의 부담
        비교이며 부족할 때의 실제 상환·연체·잔액 증가를 계산하지 않습니다.
        표시할 때만 원 단위 반올림하므로 합계가 1원 다를 수 있습니다. 세금·각종
        수수료·보험료·거치/만기일시/리볼빙·중도상환·실제
        규제·신용평가·담보·날짜별 일수·보유 현금과 다른 자산은 생략합니다.
        금리·소득 가정은 예측이 아니며 실제 금융정보를 입력하거나 외부 서비스와
        연결하지 않습니다.
      </p>
    </section>
  );
}

import { useMemo, useState } from "react";
import {
  projectRepayment,
  repaymentDefaults,
  repaymentKinds,
  type RepaymentKind,
  type RepaymentParams,
} from "../../simulations/money/repayment.mjs";
import { usePlayback } from "./shared";
import {
  PaymentBar,
  RepaymentLine,
  RepaymentComposition,
  repaymentLabels as labels,
  won,
} from "./RepaymentVisuals";
import { RepaymentFlow, RepaymentRhythms } from "./RepaymentScenes";
import { repaymentScene } from "../../simulations/money/repayment-visual.mjs";
const phases = [
  "① 월초 잔액",
  "② 이자 계산",
  "③ 월말 원리금 납입",
  "④ 남은 원금 확인",
];
export function RepaymentLab() {
  const [p, setP] = useState({ ...repaymentDefaults }),
    [kind, setKind] = useState<RepaymentKind>("annuity"),
    [prediction, setPrediction] = useState("");
  const result = useMemo(() => projectRepayment(p), [p]),
    play = usePlayback(p.months * 4 - 1);
  const index = Math.min(play.step, p.months * 4 - 1),
    path = result.paths[kind],
    f = path.frames[index],
    row = path.rows[f.month - 1];
  const longerMonths = Math.min(600, p.months * 2),
    longer = useMemo(
      () => projectRepayment({ ...p, months: longerMonths }),
      [p, longerMonths],
    );
  const scale = Math.max(
    1,
    ...repaymentKinds.map((k) => result.paths[k].rows[f.month - 1].payment),
  );
  function change(patch: Partial<RepaymentParams>) {
    play.rewind();
    setPrediction("");
    setP((prev) => ({ ...prev, ...patch }));
  }
  function control(
    key: keyof RepaymentParams,
    label: string,
    max: number,
    step: number,
    min = 0,
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
          aria-label={label}
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
      className="money-lab repay-lab"
      data-playing={play.playing}
      aria-label="대출 상환 방식 실험"
    >
      <div className="money-lab-heading">
        <span>REPAYMENT LAB · 가상 조건 · 원 단위</span>
        <h2>같은 빚, 세 가지 갚는 리듬</h2>
      </div>
      <fieldset className="money-prediction">
        <legend>먼저 예측 · 같은 조건에서 전체 이자가 가장 작은 방식은?</legend>
        {[...repaymentKinds, "same"].map((k) => (
          <label key={k}>
            <input
              type="radio"
              name="repayment-prediction"
              checked={prediction === k}
              onChange={() => setPrediction(k)}
            />
            {k === "same" ? "모두 같다" : labels[k as RepaymentKind]}
          </label>
        ))}
      </fieldset>
      <div className="money-inputs">
        {control("principal", "가상 대출 원금", 100000000, 1000000)}
        {control("annualRate", "고정 명목연율", 30, 0.5, 0, "%")}
        {control("months", "상환 기간", 600, 1, 1, "개월")}
      </div>
      <div className="money-presets">
        <button onClick={() => change({ annualRate: 0 })}>0금리 비교</button>
        <button onClick={() => change({ months: 1 })}>1개월 비교</button>
        <button
          onClick={() => {
            play.rewind();
            setP({ ...repaymentDefaults });
            setKind("annuity");
            setPrediction("");
          }}
        >
          전체 초기화
        </button>
      </div>
      <p className="money-caption">
        세 방식 모두 최초 원금·고정 명목연율·기간이 같습니다. 월율 = 연율 ÷ 12 ={" "}
        {(result.monthlyRate * 100).toLocaleString("ko-KR", {
          maximumFractionDigits: 6,
        })}
        %. 월초 남은 원금으로 이자를 계산하고 매월 말 원리금을 전액 납입합니다.
        세금·수수료·실제 일수·거치·중도상환·연체·금리 재산정은 생략합니다.
        30%·600개월은 경계 관찰용이며 실제 상품 조건·법적 허용 범위가 아닙니다.
      </p>
      <label className="repay-select">
        자세히 따라갈 방식{" "}
        <select
          value={kind}
          onChange={(e) => {
            play.seek(index);
            setKind(e.target.value as RepaymentKind);
          }}
        >
          {repaymentKinds.map((k) => (
            <option key={k} value={k}>
              {labels[k]}
            </option>
          ))}
        </select>
      </label>
      {play.controls}
      <div className="money-presets">
        <button onClick={() => play.seek((f.month - 1) * 4 + 3)}>
          이달 월말
        </button>
        <button
          onClick={() => play.seek(Math.max(0, p.months - 2) * 4 + 3)}
          disabled={p.months === 1}
        >
          만기 직전 월말
        </button>
        <button onClick={() => play.seek(p.months * 4 - 1)}>만기 월말</button>
      </div>
      <label className="money-slider">
        <span>
          관찰 월
          <strong>
            {f.month} / {p.months}개월
          </strong>
        </span>
        <input
          type="range"
          aria-label="관찰 월"
          min="1"
          max={p.months}
          step="1"
          value={f.month}
          onChange={(e) => play.seek((Number(e.target.value) - 1) * 4)}
        />
      </label>
      <p className="money-status" aria-live="polite">
        {labels[kind]} · {f.month}개월 · {phases[f.phase]} · 현재 예정 원금 잔액{" "}
        {won(f.balance)}
        {f.phase === 1
          ? ` · 계산된 미납 이자 ${won(f.interestDue)} (원금에 더하지 않음)`
          : ""}
      </p>
      <ol
        className={`repay-steps ${play.playing ? "is-playing" : ""}`}
        aria-label="이달의 계산 과정"
      >
        {[
          ["월초 잔액", won(row.opening)],
          ["이자 계산", `${won(row.opening)} × 월율 = ${won(row.interest)}`],
          [
            "월말 납입",
            `${won(row.principal)} + ${won(row.interest)} = ${won(row.payment)}`,
          ],
          [
            "남은 원금",
            `${won(row.opening)} − ${won(row.principal)} = ${won(row.closing)}`,
          ],
        ].map(([title, value], i) => (
          <li key={title} aria-current={f.phase === i ? "step" : undefined}>
            <b>
              {i + 1}. {title}
            </b>
            <span>{value}</span>
            {f.phase === i && <small>지금 관찰 중</small>}
          </li>
        ))}
      </ol>
      <p className="money-caption">
        네 칸은 이달 예정 계산의 미리보기입니다. 강조된 단계가 현재 시점이며,
        납입은 ③에서 한 번만 반영됩니다. ④는 확인만 합니다. 진행 강조는 금액이나
        실제 처리 속도를 뜻하지 않습니다.
      </p>
      <RepaymentFlow
        scene={repaymentScene(result, kind, index)}
        onPhase={(phase) => play.seek((f.month - 1) * 4 + phase)}
      />
      <div className="repay-cards">
        {repaymentKinds.map((k) => {
          const s = result.paths[k],
            r = s.rows[f.month - 1],
            v = s.frames[index];
          return (
            <section
              key={k}
              aria-label={`${labels[k]} 비교`}
              className={k === kind ? "is-selected" : ""}
            >
              <h3>{labels[k]}</h3>
              <p>{f.month}개월 예정 납입 구성</p>
              <PaymentBar row={r} scale={scale} />
              <p>
                현재 단계 원금 잔액 <b>{won(v.balance)}</b>
              </p>
              <div className="repay-debt" aria-hidden="true">
                <span
                  style={{
                    width: `${p.principal ? (v.balance / p.principal) * 100 : 0}%`,
                  }}
                />
              </div>
              <dl>
                <dt>누적 원금 상환</dt>
                <dd>{won(v.cumulativePrincipal)}</dd>
                <dt>누적 이자 납부</dt>
                <dd>{won(v.cumulativeInterest)}</dd>
                <dt>누적 납입</dt>
                <dd>{won(v.cumulativePayment)}</dd>
              </dl>
              {k === "bullet" && (
                <p className="repay-alert">
                  {f.month < p.months
                    ? "이자를 내도 원금은 그대로 남습니다."
                    : "마지막 달에는 원금 전액과 이자를 함께 냅니다."}{" "}
                  만기 예정 납입 {won(s.rows.at(-1)!.payment)}
                </p>
              )}
            </section>
          );
        })}
      </div>
      <p className="money-caption">
        위 납입 막대는 세 방식에서 같은 길이가 같은 금액이며, 관찰 월이 바뀌면
        눈금도 바뀝니다. 잔액 막대의 전체 길이는 최초 원금입니다. 누적 값은 현재
        단계까지 예정대로 납입한 금액입니다.
      </p>
      <p className="money-answer">
        {kind === "annuity"
          ? "원리금균등: 같은 납입액 안에서 잔액이 줄면 다음 달 이자도 줄고, 원금 몫이 커집니다."
          : kind === "equalPrincipal"
            ? "원금균등: 원금 몫이 같고 잔액에 붙는 이자가 줄어 전체 납입액도 줄어듭니다."
            : "만기일시상환: 만기 전에는 이자만 내고 원금 감소를 미룹니다. 작은 월 납입액이 적은 총비용을 뜻하지 않습니다."}{" "}
        0금리에서는 이자 몫이 0입니다.
      </p>
      <RepaymentRhythms result={result} kind={kind} />
      <RepaymentComposition rows={path.rows} month={f.month} />
      <RepaymentLine result={result} metric="closing" month={f.month} />
      <RepaymentLine
        result={result}
        metric="cumulativeInterest"
        month={f.month}
      />
      <RepaymentLine
        result={result}
        metric="cumulativePayment"
        month={f.month}
      />
      <details>
        <summary>전체 상환 일정 표 · 세 방식의 모든 월</summary>
        <div
          className="money-table"
          tabIndex={0}
          role="region"
          aria-label="전체 상환 일정 표, 가로 스크롤 가능"
        >
          <table>
            <caption>
              월말 전액 납입 후 · 원 단위 표시 반올림 · {p.months}개월 × 세 방식
            </caption>
            <thead>
              <tr>
                {[
                  "월",
                  "방식",
                  "월초 원금",
                  "원금 상환",
                  "이자",
                  "납입 합계",
                  "남은 원금",
                  "누적 원금",
                  "누적 이자",
                  "누적 납입",
                ].map((t) => (
                  <th scope="col" key={t}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.paths.annuity.rows.flatMap((r, i) =>
                repaymentKinds.map((k) => {
                  const v = result.paths[k].rows[i];
                  return (
                    <tr
                      key={`${k}-${i}`}
                      aria-current={r.month === f.month ? "true" : undefined}
                    >
                      <th scope="row">{v.month}</th>
                      <td>{labels[k]}</td>
                      {[
                        v.opening,
                        v.principal,
                        v.interest,
                        v.payment,
                        v.closing,
                        v.cumulativePrincipal,
                        v.cumulativeInterest,
                        v.cumulativePayment,
                      ].map((n, j) => (
                        <td key={j}>{won(n)}</td>
                      ))}
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
      </details>
      <h3>전체 이자를 펼쳐 비교하기</h3>
      <p>
        기간 전체의 결과입니다. 현재 재생 위치와 관계없이 최종 예정 합계를
        보여줍니다.
      </p>
      <div className="repay-total">
        {repaymentKinds.map((k) => (
          <p key={k}>
            {labels[k]}
            <br />
            <b>이자 {won(result.paths[k].totalInterest)}</b>
            <br />총 납입 {won(result.paths[k].totalPayment)}
          </p>
        ))}
      </div>
      <p className="money-answer">
        {prediction
          ? `${prediction === result.lowestInterest ? "예측과 일치합니다." : "예측과 달랐습니다."} `
          : "조건을 바꿀 때는 먼저 예측해 보세요. "}
        {result.lowestInterest === "same"
          ? "이 조건에서는 세 방식의 전체 이자가 같습니다."
          : "같은 양수 원금·금리, 2개월 이상에서는 원금을 더 빨리 줄이는 원금균등의 전체 이자가 가장 작습니다. 이것이 모든 사람에게 적합한 방식이라는 뜻은 아닙니다."}
      </p>
      <h3>기간만 늘리면 어떻게 될까요?</h3>
      <p>
        현재 {p.months}개월과 {longerMonths}개월을 비교합니다. 원금·연율·월말
        납입은 그대로입니다.
        {p.months === 600 ? " 관찰 상한이라 두 기간이 같습니다." : ""}
      </p>
      <div
        className="money-table"
        tabIndex={0}
        role="region"
        aria-label="기간 연장 비교 표"
      >
        <table>
          <thead>
            <tr>
              <th>방식</th>
              <th>첫 달 납입: 현재 → 연장</th>
              <th>전체 이자: 현재 → 연장</th>
            </tr>
          </thead>
          <tbody>
            {repaymentKinds.map((k) => (
              <tr key={k}>
                <th scope="row">{labels[k]}</th>
                <td>
                  {won(result.paths[k].rows[0].payment)} →{" "}
                  {won(longer.paths[k].rows[0].payment)}
                </td>
                <td>
                  {won(result.paths[k].totalInterest)} →{" "}
                  {won(longer.paths[k].totalInterest)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        분할상환은 보통 월 부담을 낮추는 대신 이자를 더 오래 냅니다.
        만기일시상환은 만기 전 월 이자가 줄지 않고 원금 납입일만 뒤로 갑니다.
        0금리·0원금에서는 전체 이자가 늘지 않습니다. 첫 달만 보지 말고 만기와
        전체 일정도 함께 읽으세요.
      </p>
      <p className="money-caption">
        내부 계산은 소수 원을 유지하고 표시만 원 단위 반올림합니다. 표시 항목
        합과 표시 합계가 1원가량 다르거나, 반올림한 월별 값을 더하면 더 큰
        차이가 날 수 있습니다. 마지막 회차에는 남은 원금을 전액 정리합니다. 실제
        납부·연체를 재현하지 않는 조건부 일정이며 모든 회차를 예정대로 전액
        낸다고 가정합니다.
      </p>
    </section>
  );
}

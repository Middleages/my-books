import { useMemo, useState } from "react";
import {
  interestDefaults,
  projectInterest,
  compareInterest,
  type InterestParams,
  type InterestFrame,
} from "../../simulations/money/interest.mjs";
import { usePlayback } from "./shared";
import "./interest.css";
import { interestVisualFrame } from "../../simulations/money/interest-visual.mjs";
import { InterestPools, InterestCostScene } from "./InterestVisuals";
const amount = (n: number) =>
  `${(Object.is(n, -0) ? 0 : n).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}원`;
const percent = (n: number) =>
  `${(n * 100).toLocaleString("ko-KR", { maximumFractionDigits: 4 })}%`;
const names = {
  initial: "시작",
  deposit: "① 월초 납입",
  basis: "② 계산 기준",
  return: "③ 이자·손실",
  cost: "④ 비용 차감",
  close: "⑤ 월말·재투자",
};
function Decomposition({
  frame: f,
  scale,
}: {
  frame: InterestFrame;
  scale: number;
}) {
  const rows: [string, number, string][] = [
    ["최초 원금", f.initial, "#496e9c"],
    ["추가 납입", f.added, "#755ba7"],
    ["누적 수익·손실", f.gross, "#267052"],
    ["누적 비용 차감", -f.cost, "#a54829"],
    ["현재 총액", f.total, "#243f37"],
  ];
  return (
    <figure className="interest-decomposition">
      <div
        className="interest-bars"
        role="img"
        aria-label="최초 원금 더하기 추가 납입 더하기 누적 수익 빼기 누적 비용은 현재 총액. 각 행에 정확한 금액을 표시합니다."
      >
        {rows.map(([label, value, color]) => (
          <div className="interest-bar-row" key={label}>
            <div className="interest-bar-label">
              <span>{label}</span>
              <strong>{amount(value)}</strong>
            </div>
            <div className="interest-bar-track" aria-hidden="true">
              <i />
              <span
                style={{
                  left: `${50 + (Math.min(0, value) / scale) * 45}%`,
                  width: `${(Math.abs(value) / scale) * 45}%`,
                  background: color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <figcaption>
        막대 길이 = 금액, 가운데 선 = 0원. 오른쪽은 더함, 왼쪽은 차감. 두
        방식·모든 단계에 같은 눈금.
      </figcaption>
    </figure>
  );
}
function History({
  paths,
  month,
}: {
  paths: Record<"simple" | "compound" | "free", InterestFrame[]>;
  month: number;
}) {
  const lines: [string, InterestFrame[], string, string][] = [
    ["단리 총액", paths.simple, "#a65c1b", "8 5"],
    ["복리 총액", paths.compound, "#17644b", ""],
    ["비용 없는 복리", paths.free, "#495ca4", "2 5"],
  ];
  const closed = paths.compound.filter(
    (f) => f.phase === "initial" || f.phase === "close",
  );
  const max = Math.max(
    1,
    ...Object.values(paths).flatMap((a) =>
      a.map((f) => Math.max(f.total, f.initial + f.added)),
    ),
  );
  const unit = max >= 100000000 ? 100000000 : max >= 10000 ? 10000 : 1;
  const unitLabel =
    unit === 100000000 ? "억원" : unit === 10000 ? "만원" : "원";
  const maxMonth = closed.at(-1)!.month;
  const x = (n: number) => 54 + (n / Math.max(1, maxMonth)) * 284,
    y = (n: number) => 200 - (n / max) * 162;
  return (
    <figure className="interest-chart">
      <svg
        viewBox="0 0 360 250"
        role="img"
        aria-label={`전체 기간 월말 총액 비교. 가로축 개월, 세로축 ${unitLabel}. 각 월의 정확한 값은 월말 표에서 확인.`}
      >
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1="54"
              x2="338"
              y1={y(max * t)}
              y2={y(max * t)}
              stroke="#d4ded6"
            />
            <text x="48" y={y(max * t) + 4} textAnchor="end">
              {((max * t) / unit).toLocaleString("ko-KR", {
                maximumFractionDigits: 1,
              })}
            </text>
          </g>
        ))}
        <text x="8" y="20">
          {unitLabel}
        </text>
        <path
          d={closed
            .map(
              (f, i) =>
                `${i ? "L" : "M"}${x(f.month)},${y(f.initial + f.added)}`,
            )
            .join(" ")}
          fill="none"
          stroke="#755ba7"
          strokeWidth="5"
          opacity=".4"
        />
        {lines.map(([label, fs, color, dash]) => (
          <path
            key={label}
            d={fs
              .filter((f) => f.phase === "initial" || f.phase === "close")
              .map((f, i) => `${i ? "L" : "M"}${x(f.month)},${y(f.total)}`)
              .join(" ")}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeDasharray={dash}
          />
        ))}
        <line
          x1={x(month)}
          x2={x(month)}
          y1="34"
          y2="204"
          stroke="#4b514b"
          strokeDasharray="4 4"
        />
        {[
          0,
          ...(maxMonth > 1 ? [Math.floor(maxMonth / 2)] : []),
          ...(maxMonth > 0 ? [maxMonth] : []),
        ].map((n) => (
          <text key={n} x={x(n)} y="224" textAnchor="middle">
            {n}
          </text>
        ))}
        <text x="338" y="244" textAnchor="end">
          시작 후 개월
        </text>
      </svg>
      <figcaption>
        <span>━ 초록: 복리</span>
        <span>┄ 갈색: 단리</span>
        <span>·· 파랑: 비용 없는 복리</span>
        <span>굵은 연보라: 납입 누계</span>
        <br />
        0개월 기준 · 세로축 단위 {unitLabel}(금액 범위에 따라 원/만원/억원
        전환). 전체 가정 경로의 월말 값. 세로 점선은 관찰 중인 월이며 단계
        중간값을 월말로 표시하지 않습니다. 선이 겹치면 아래 표로 비교하세요.
      </figcaption>
    </figure>
  );
}
export function InterestLab() {
  const [p, setP] = useState<InterestParams>({ ...interestDefaults });
  const [prediction, setPrediction] = useState("");
  const result = useMemo(() => projectInterest(p), [p]);
  const play = usePlayback(result.paths.compound.length - 1);
  const index = Math.min(play.step, result.paths.compound.length - 1);
  const c = result.paths.compound[index],
    s = result.paths.simple[index],
    free = result.paths.free[index];
  const scene = interestVisualFrame(result, index);
  const scale = Math.max(
    1,
    ...Object.values(result.paths).flatMap((fs) =>
      fs.flatMap((f) => [
        f.initial,
        f.added,
        Math.abs(f.gross),
        f.cost,
        f.total,
      ]),
    ),
  );
  const finalC = result.paths.compound.at(-1)!,
    finalS = result.paths.simple.at(-1)!;
  const labels = {
    more: "복리가 더 많다",
    same: "같다",
    less: "복리가 더 적다",
  };
  function update(patch: Partial<InterestParams>) {
    play.rewind();
    setPrediction("");
    setP((v) => ({ ...v, ...patch }));
  }
  function input(
    key:
      | "initial"
      | "payment"
      | "months"
      | "annualRate"
      | "taxRate"
      | "annualFee"
      | "fixedFee",
    label: string,
    min: number,
    max: number,
    step: number,
    unit: string,
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
          onChange={(e) => update({ [key]: Number(e.target.value) })}
        />
      </label>
    );
  }
  return (
    <section
      className="money-lab interest-lab"
      data-playing={play.playing}
      aria-label="이자와 복리 실험"
    >
      <div className="money-lab-heading">
        <span>INTEREST LAB · 원 단위 · 가상 0개월 시작</span>
        <h2>이자가 다음 이자의 바탕이 될 때</h2>
      </div>
      <p>
        먼저 기본 조건에서 ② → ③ → ④ → ⑤를 따라가 보세요. 다음 달 ②에서 계산
        기준에 무엇이 남았는지 비교합니다. 단리의 총액에는 이자가 붙지 않는 별도
        보관금도 포함합니다.
      </p>
      <fieldset className="money-prediction">
        <legend>먼저 예측 · 마지막 월 총액은?</legend>
        {Object.entries(labels).map(([v, label]) => (
          <label key={v}>
            <input
              type="radio"
              name="interest-prediction"
              checked={prediction === v}
              onChange={() => setPrediction(v)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <div className="money-presets">
        <button onClick={() => update({ ...interestDefaults, payment: 0 })}>
          납입 없이 비교
        </button>
        <button
          onClick={() =>
            update({
              ...interestDefaults,
              taxRate: 20,
              annualFee: 1,
              fixedFee: 100,
            })
          }
        >
          가상 비용 넣기
        </button>
        <button
          onClick={() => {
            play.rewind();
            setPrediction("");
            setP({ ...interestDefaults });
          }}
        >
          전체 초기화
        </button>
      </div>
      <div className="money-inputs">
        {input("initial", "최초 원금", 0, 1000000, 10000, "원")}
        {input("payment", "매월 추가 납입", 0, 100000, 1000, "원")}
        {input("months", "기간", 0, 120, 1, "개월")}
        {input("annualRate", "연율 입력", -100, 120, 1, "%")}
        <label className="money-select">
          연율의 뜻
          <select
            value={p.rateMode}
            onChange={(e) =>
              update({ rateMode: e.target.value as InterestParams["rateMode"] })
            }
          >
            <option value="nominal">명목연율 · 월율 = 연율 ÷ 12</option>
            <option value="effective">유효연율 · 1년 복리 증가율</option>
          </select>
        </label>
        <label className="money-select">
          납입 시점
          <select
            value={p.timing}
            onChange={(e) =>
              update({ timing: e.target.value as InterestParams["timing"] })
            }
          >
            <option value="end">월말 · 비용 차감 뒤 납입</option>
            <option value="start">월초 · 이자 계산 전 납입</option>
          </select>
        </label>
      </div>
      <p className="money-caption">
        실제 계산 월율 {percent(result.monthlyRate)}. 비용·추가 납입 없는 복리의
        유효연율 {percent(result.effectiveAnnual)}. 단리와 복리 모두 같은
        월율·원금·납입 시점·기간을 씁니다.
      </p>
      <details>
        <summary>가상의 세금·수수료 조건 바꾸기</summary>
        <div className="money-inputs">
          {input("taxRate", "양수 월 수익에 가상 세금", 0, 100, 1, "%")}
          {input("annualFee", "차감 후 총액에 연 수수료율", 0, 12, 0.5, "%")}
          {input("fixedFee", "월 고정 수수료", 0, 10000, 100, "원")}
        </div>
        <p>
          매월 수익 반영 → 양수 수익 × {p.taxRate}% 차감 → 남은 총액 × (
          {p.annualFee}% ÷ 12) + {amount(p.fixedFee)} 차감. 수수료는 당시
          총액까지만 받으며 미납 채무를 만들지 않습니다. 단리는 보관금부터,
          부족하면 운용 원금을 차감합니다. 손실 공제·환급은 없습니다. 월말
          납입금은 그달 비용 계산 뒤 들어옵니다. 실제 세법·상품 규칙이 아닙니다.
        </p>
      </details>
      {play.controls}
      <label className="money-slider">
        <span>
          관찰 단계
          <strong>
            {c.month}개월 · {names[c.phase as keyof typeof names]}
          </strong>
        </span>
        <input
          type="range"
          min="0"
          max={result.paths.compound.length - 1}
          value={index}
          aria-valuetext={`${c.month}개월 ${names[c.phase as keyof typeof names]}`}
          onChange={(e) => play.seek(Number(e.target.value))}
        />
      </label>
      <ol className="interest-stages">
        {Object.entries(names)
          .filter(([k]) => k !== "initial")
          .map(([key, label], i) => (
            <li key={key}>
              <button
                aria-current={c.phase === key ? "step" : undefined}
                disabled={p.months === 0}
                onClick={() =>
                  play.seek((Math.max(1, c.month) - 1) * 5 + i + 1)
                }
              >
                {label}
              </button>
            </li>
          ))}
      </ol>
      <p className="money-status" aria-live="polite">
        {c.month}개월 · {names[c.phase as keyof typeof names]} ·{" "}
        {c.phase === "initial"
          ? "아직 납입·수익·비용이 없습니다."
          : c.phase === "deposit"
            ? p.timing === "start"
              ? "이번 달 납입을 운용 원금에 더했습니다."
              : "월말 납입이므로 지금은 기다립니다."
            : c.phase === "basis"
              ? "아래 운용 기준에 월율을 곱할 준비입니다."
              : c.phase === "return"
                ? "월 수익·손실을 반영했습니다. 비용은 아직 차감하지 않았습니다."
                : c.phase === "cost"
                  ? "가상 세금 다음 수수료를 차감했습니다."
                  : "월말 납입을 마쳤습니다. 복리는 남은 운용금 전부, 단리는 이자 보관금을 제외한 원금으로 다음 달을 시작합니다."}
      </p>
      <div className="interest-comparison">
        {[
          ["단리", s],
          ["복리", c],
        ].map(([label, frame]) => {
          const f = frame as InterestFrame;
          return (
            <section key={label as string}>
              <h3>
                {label as string} · 현재 총액 {amount(f.total)}
              </h3>
              <InterestPools
                frame={f}
                kind={label === "단리" ? "simple" : "compound"}
                scale={scene.poolMax}
              />
              <p className="interest-formula">
                이번 달 계산 기준 {amount(f.basis)} × 월율{" "}
                {percent(result.monthlyRate)}
                <br />월 수익·손실 {amount(f.periodReturn)}
                <br />월 가상 세금 {amount(f.periodTax)} · 수수료{" "}
                {amount(f.periodFee)}
              </p>
              <Decomposition frame={f} scale={scale} />
            </section>
          );
        })}
      </div>
      <p className="money-answer">
        복리 총액 {amount(c.total)} = 최초 {amount(c.initial)} + 추가 납입{" "}
        {amount(c.added)} + 누적 수익·손실 {amount(c.gross)} − 누적 비용{" "}
        {amount(c.cost)}. <b>비용 후 순수익은 {amount(c.net)}</b>입니다. 잔액
        증가 전부를 수익으로 세지 마세요.
      </p>
      {index === result.paths.compound.length - 1 && (
        <p className="money-answer">
          {prediction
            ? prediction === compareInterest(finalC.total, finalS.total)
              ? "예측과 일치합니다."
              : "예측과 달랐습니다."
            : "조건을 바꾸기 전 마지막 총액을 예측해 보세요."}{" "}
          결과: {labels[compareInterest(finalC.total, finalS.total)]}. 계산
          기준과 비용을 비교하면 이유를 찾을 수 있습니다.
        </p>
      )}
      <History paths={result.paths} month={c.month} />
      <p>
        같은 관찰 단계의 비용 없는 복리 {amount(free.total)} − 비용 있는 복리{" "}
        {amount(c.total)} = {amount(free.total - c.total)}. 직접 차감한 누적
        비용 {amount(c.cost)}과 이 차이는 다를 수 있습니다. 비용으로 빠진 돈의
        이후 수익·손실 경로도 달라지기 때문입니다.
      </p>
      <InterestCostScene scene={scene} />
      <div className="interest-month-jump">
        <label>
          월말 바로 보기{" "}
          <input
            type="range"
            min="0"
            max={p.months}
            value={c.month}
            aria-valuetext={`${c.month}개월 월말`}
            onChange={(e) => play.seek(Number(e.target.value) * 5)}
          />
        </label>
      </div>
      <details>
        <summary>모든 월말의 비교·구성 표 (정적 대안)</summary>
        <p>
          표와 그래프는 재생을 기다리지 않아도 전체 월말을 보여 줍니다. 표시만
          원 단위 반올림하므로 합계가 1원 다를 수 있습니다.
        </p>
        <div
          className="money-table"
          tabIndex={0}
          role="region"
          aria-label="월말 구성 비교 표, 가로 스크롤 가능"
        >
          <table>
            <caption>
              단위 원 · 복리 구성과 동일 조건 총액 비교 · 시작 0개월
            </caption>
            <thead>
              <tr>
                {[
                  "개월",
                  "최초 원금",
                  "추가 납입 누계",
                  "복리 누적 수익·손실",
                  "복리 누적 세금",
                  "복리 누적 수수료",
                  "복리 비용 후 순수익",
                  "복리 총액",
                  "단리 총액",
                  "비용 없는 복리",
                ].map((t) => (
                  <th scope="col" key={t}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.paths.compound
                .filter((f) => f.phase === "initial" || f.phase === "close")
                .map((f) => {
                  const i = f.month * 5;
                  return (
                    <tr
                      key={f.month}
                      aria-current={f.month === c.month ? "true" : undefined}
                    >
                      <th scope="row">{f.month}</th>
                      {[
                        f.initial,
                        f.added,
                        f.gross,
                        f.tax,
                        f.fee,
                        f.net,
                        f.total,
                        result.paths.simple[i].total,
                        result.paths.free[i].total,
                      ].map((n, j) => (
                        <td key={j}>{amount(n)}</td>
                      ))}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </details>
      <p className="money-caption">
        일정 수익률은 교육용 가정입니다. 실제 투자 수익은 변동하며 보장되지
        않습니다. 음수 월율에서는 손실이 운용금을 줄이며, 단리도 남은 운용
        원금에만 다음 손실을 적용합니다. 따라서 음수 구간은 원래 원금을 계속
        빼는 대출 산식이 아닙니다. 일수·만기·인출·배당·실제 세법·상품
        규칙·물가·환율은 생략합니다. 금액은 반올림 전 계산합니다.
      </p>
    </section>
  );
}

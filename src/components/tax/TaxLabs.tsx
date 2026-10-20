import { useState } from "react";
import { usePlayback } from "../money/shared";
import { events, progressiveTax } from "../../simulations/tax/taxModel.mjs";
import { Bar, fmt, Lab, Prediction, Range, Stage, StaticTable } from "./shared";
export function TaxEventsLab() {
  const [id, setId] = useState("salary"),
    p = usePlayback(2);
  const e = events.find((x) => x.id === id)!;
  const phases = [
    {
      label: "① 누가 무엇을 주는가",
      detail:
        "관계의 출발과 도착을 먼저 찾으세요. 현금이 움직이지 않는 보유 사건도 있습니다.",
    },
    {
      label: "② 어떤 종류의 사건인가",
      detail: `${e.kind}. 같은 금액이라도 사건의 성격이 다르면 과세 질문도 달라집니다.`,
    },
    { label: "③ 무엇을 더 확인할까", detail: e.check },
  ];
  return (
    <Lab
      id="events"
      title="돈의 화살표와 과세 검토 지점"
      note="과세 여부를 단정하지 않는 사건 지도입니다. 화살표는 현금·재산 이동 또는 보유 관계이며 세금 납부 경로가 아닙니다."
    >
      <label>
        생활 속 사건
        <select
          value={id}
          onChange={(event) => {
            setId(event.target.value);
            p.rewind();
          }}
        >
          {events.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label}
            </option>
          ))}
        </select>
      </label>
      {p.controls}
      <button
        onClick={() => {
          setId("salary");
          p.rewind();
        }}
      >
        조건까지 초기화
      </button>
      <figure className={`tax-event-scene ${id}`}>
        <div className="tax-origin">
          <span aria-hidden="true">
            {id === "salary" ? "▤" : id === "holding" ? "○" : "●"}
          </span>
          <strong>{e.from}</strong>
        </div>
        <div className="tax-relation">
          <span className="tax-event-arrow">
            {id === "holding" ? "⊃" : "→"}
          </span>
          <b>{e.kind}</b>
        </div>
        <div className="tax-destination">
          <span aria-hidden="true">{id === "holding" ? "⌂" : "▱"}</span>
          <strong>{e.to}</strong>
        </div>
        <div className="tax-question-gate">
          <b>?</b>
          <span>
            과세 검토
            <br />
            {e.check}
          </span>
        </div>
        <figcaption>
          실선 화살표: 이동 / ⊃: 보유 관계 / 점선 경계와 ?: 추가 요건. 사건의
          존재와 세액 확정은 다릅니다.
        </figcaption>
      </figure>
      <Stage {...phases[p.step]} />
      <Prediction
        question="내 계좌 사이 원금 이체도 그만큼 새 소득일까요?"
        answer={false}
        reason="소유자가 바뀌지 않은 원금 이동입니다. 이자 등 새 소득은 별도 사건으로 봅니다."
      />
      <StaticTable
        title="생활 사건의 비교"
        headers={["사건", "출발", "도착", "분류", "추가 확인"]}
        rows={events.map((x) => [x.label, x.from, x.to, x.kind, x.check])}
      />
    </Lab>
  );
}
export function ProgressiveTaxLab() {
  const [amount, setAmount] = useState(400),
    p = usePlayback(3);
  const r = progressiveTax(amount);
  return (
    <Lab id="progressive" title="과세표준을 겹치지 않는 세 조각으로">
      <p>
        가상 세율: 처음 100에 10%, 다음 200에 20%, 300 초과에 30%. 세 구간 모두
        같은 0–600 단위 눈금입니다. 아래 세액 막대는 별도의 0–180 눈금으로
        표시합니다.
      </p>
      <Range
        label="과세표준"
        value={amount}
        max={600}
        step={1}
        onChange={(n) => {
          setAmount(n);
          p.rewind();
        }}
      />
      <div className="tax-presets">
        {[0, 100, 101, 300, 301, 400, 600].map((n) => (
          <button
            key={n}
            onClick={() => {
              setAmount(n);
              p.rewind();
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <Prediction
        question="과세표준 301이면 전체에 30%를 적용할까요?"
        answer={false}
        reason="300을 넘긴1단위에만30%를 적용합니다. 앞300단위의 세금50은 그대로여서 총50.3입니다."
      />
      {p.controls}
      <button
        onClick={() => {
          setAmount(400);
          p.rewind();
        }}
      >
        조건까지 초기화
      </button>
      <figure className="tax-progressive-scene">
        <h4>과세표준 분할 · 길이 0–600</h4>
        <div
          className="tax-stack tax-base-stack"
          role="img"
          aria-label={`구간별 과세 금액 ${r.parts.map((x) => fmt(x.base)).join(", ")}`}
        >
          {r.parts.map((v, i) => (
            <i
              className={["teal", "blue", "gold"][i]}
              key={i}
              data-base={v.base}
              style={{ width: `${(v.base / 600) * 100}%` }}
            />
          ))}
        </div>
        {r.parts.map((v, i) => (
          <div
            key={i}
            className="tax-bracket-row"
            data-current={p.step === i + 1}
          >
            <Bar
              label={`${i + 1}구간 · ${v.rate * 100}%`}
              value={v.base}
              max={600}
              color={["teal", "blue", "gold"][i]}
            />
            <p>
              {fmt(v.base)} × {v.rate * 100}% = 세액 {fmt(v.tax)}
            </p>
          </div>
        ))}
        <h4>전체 산출세액 · 길이 0–180</h4>
        <Bar label="세액 합계" value={r.tax} max={180} />
        <figcaption>
          청록: 0–100 / 파랑: 100–300 / 금색: 300 초과. 위의 분할 띠는 실제 금액
          비율을 보존하며 빈 부분은 아직 없는 과세표준입니다.
        </figcaption>
      </figure>
      <Stage
        label={`${p.step}/3 구간 관찰`}
        detail={
          p.step === 0
            ? "전체 그림은 처음부터 볼 수 있습니다. 한 단계씩 각 구간을 강조해 보세요."
            : `${p.step}구간의 금액 ${fmt(r.parts[p.step - 1].base)}에만 ${r.parts[p.step - 1].rate * 100}%를 적용합니다.`
        }
      />
      <p className="tax-result">
        전체 세액 {fmt(r.tax)} · 평균세율{" "}
        {r.averageRate === null
          ? "과세표준 0에서 정의되지 않음"
          : `${fmt(r.averageRate * 100)}%`}
        . 추가 1단위에 적용할 세율과 전체 평균은 다릅니다.
      </p>
      <StaticTable
        title="구간별 계산"
        headers={["구간", "해당 과세표준", "세율", "세액"]}
        rows={r.parts.map((v, i) => [
          `${i + 1}`,
          v.base,
          `${v.rate * 100}%`,
          v.tax,
        ])}
      />
    </Lab>
  );
}

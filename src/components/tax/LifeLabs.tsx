import { useState } from "react";
import { usePlayback } from "../money/shared";
import {
  payroll,
  settlement,
} from "../../simulations/tax/lifeModel.mjs";
import { Bar, fmt, Lab, Prediction, Range, Stage, StaticTable } from "./shared";
export function WithholdingLab() {
  const [withheld, setWithheld] = useState(15);
  const r = payroll({ withheld }),
    p = usePlayback(r.frames.length - 1),
    f = r.frames[p.step];
  return (
    <Lab id="withholding" title="한 번의 급여, 세 갈래 목적지">
      <p>
        띠 전체는 지급총액 300입니다. 가로 길이는 금액이며 세 갈래의 합이 항상
        같습니다. 비과세 20은 연간 총급여 계산을 위한 분류이지 통장에서 따로
        사라지는 돈이 아닙니다.
      </p>
      <figure className="tax-pay-scene">
        <div className="tax-employer">▤ 고용주 · 지급총액 {r.gross}</div>
        <div
          className="tax-stack"
          role="img"
          aria-label={`통장 ${r.net}, 사회보험 ${r.social}, 세금 ${r.withheld}, 합계 ${r.gross}`}
        >
          {r.parts.map((part, i) => (
            <i
              className={["teal", "gold", "blue"][i]}
              key={part.id}
              data-value={part.value}
              style={{ width: `${(part.value / r.gross) * 100}%` }}
            />
          ))}
        </div>
        <div className="tax-destinations">
          {r.parts.map((part, i) => (
            <div key={part.id} className={["net", "social", "tax"][i]}>
              <span aria-hidden="true">↓</span>
              <b>{part.label}</b>
              <strong>{fmt(part.value)}</strong>
            </div>
          ))}
        </div>
        <figcaption>
          청록 ▰ 통장 · 금색 ▱ 사회보험 본인부담 · 파랑 ▥ 원천징수 세금. 세율을
          역산하는 그림이 아닙니다. 그림은 선택한 조건의 전체 배분이며, 관찰
          단계는 지급 과정을 따로 보여줍니다.
        </figcaption>
      </figure>
      <Range
        label="미리 떼는 세금"
        value={withheld}
        max={60}
        step={5}
        onChange={(n) => {
          setWithheld(n);
          p.rewind();
        }}
      />
      <Prediction
        question="세금을 더 미리 떼면 최종 세금도 반드시 늘까요?"
        answer={false}
        reason="원천징수는 미리 내는 절차입니다. 귀속기간의 결정세액과 나중에 대조합니다."
      />
      {p.controls}
      <button
        onClick={() => {
          setWithheld(15);
          p.rewind();
        }}
      >
        조건까지 초기화
      </button>
      <Stage {...f} />
      <p className="tax-result">
        지급총액 {r.gross} − 사회보험 {r.social} − 원천징수 {r.withheld} = 통장
        입금 {r.net}. 비과세 {r.exempt}를 제외한 이달 과세대상 지급액은{" "}
        {r.taxablePay}이며 연간 총급여·과세표준은 아닙니다.
      </p>
      <StaticTable
        title="급여 장부"
        headers={["항목", "금액", "역할"]}
        rows={[
          ["지급총액", r.gross, "출발 현금"],
          ["비과세 분류", r.exempt, "출금 아님"],
          ["이달 과세대상 지급액", r.taxablePay, "연간 총급여·과세표준 아님"],
          ...r.parts.map((v) => [v.label, v.value, "목적지"]),
        ]}
      />
    </Lab>
  );
}
export function SettlementLab() {
  const [prepaid, setPrepaid] = useState(90);
  const r = settlement({ prepaid }),
    p = usePlayback(3);
  return (
    <Lab id="settlement" title="최종 세금과 이미 낸 돈의 차이">
      <p>
        두 막대는 같은 0–150 눈금입니다. 원천징수액만 바꾸고 과세표준
        400·세액공제 10은 유지합니다.
      </p>
      <figure className="tax-settlement-scene">
        <Bar label="결정세액" value={r.finalTax} max={150} />
        <Bar label="기납부세액" value={r.prepaid} max={150} color="blue" />
        <div className={`tax-cash-direction ${r.direction}`}>
          <span>납세자</span>
          <b>
            {r.direction === "refund"
              ? "←"
              : r.direction === "pay"
                ? "→"
                : "＝"}
          </b>
          <span>세금 장부</span>
        </div>
        <figcaption>
          {r.direction === "refund"
            ? `환급 ${fmt(r.refund)}`
            : r.direction === "pay"
              ? `추가납부 ${fmt(r.extra)}`
              : "차액 0"}{" "}
          단위. 화살표는 정산 차액의 방향이며 실제 지급 완료를 뜻하지 않습니다.
        </figcaption>
      </figure>
      <Range
        label="기납부세액"
        value={prepaid}
        max={150}
        step={10}
        onChange={(n) => {
          setPrepaid(n);
          p.rewind();
        }}
      />
      <Prediction
        question="환급 20이면 새 소득 20을 번 걸까요?"
        answer={false}
        reason="이미 낸 90 중 최종 부담 70보다 많은 20이 돌아오는 것입니다."
      />
      {p.controls}
      <button
        onClick={() => {
          setPrepaid(90);
          p.rewind();
        }}
      >
        조건까지 초기화
      </button>
      <Stage {...r.frames[p.step]} />
      <p className="tax-result">
        결정세액 {fmt(r.finalTax)} − 기납부액 {fmt(r.prepaid)} = 차감세액{" "}
        {fmt(r.difference)}. 최종 부담은 {fmt(r.finalTax)}로 그대로입니다.
      </p>
      <StaticTable
        title="정산 전 과정"
        headers={["단계", "가상 금액", "뜻"]}
        rows={r.frames.map((f) => [f.label, f.value!, f.detail])}
      />
    </Lab>
  );
}

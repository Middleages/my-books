import { useState } from "react";
import { usePlayback } from "../money/shared";
import {
  payroll,
  settlement,
  vatChain,
  investmentKinds,
  investmentRoute,
  accountKinds,
  accountRoute,
  housingRoute,
  transferBase,
  deductionComparison,
  taxTimeline,
  taxDocuments,
  documentReview,
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
          역산하는 그림이 아닙니다. 아래 전체 배분은 비교용으로 고정되며, 위
          관찰 단계에서 지급 과정을 따로 따라갑니다.
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
export function VatLab() {
  const [sale, setSale] = useState(300),
    [mode, setMode] = useState("taxable");
  const r = vatChain({ sale, mode }),
    p = usePlayback(2);
  return (
    <Lab id="vat" title="받은 세금에서 앞 단계의 세금을 잇기">
      <p>
        화살표는 공급 순서입니다. 각 장부의 파랑 막대는 매출세액, 금색 막대는
        공제 매입세액입니다. 모든 막대 눈금은 0–50 단위입니다.
      </p>
      <figure className="tax-vat-chain">
        {r.stages.map((s, i) => (
          <section
            className="tax-vat-node"
            key={s.id}
            data-current={i === p.step}
          >
            <h4>
              {i + 1}. {s.label}
            </h4>
            <p>공급가액 {fmt(s.price)}</p>
            <Bar label="매출세액" value={s.output} max={50} color="blue" />
            <Bar label="공제 매입" value={s.credit} max={50} color="gold" />
            <p>
              차액 <strong>{fmt(s.remit)}</strong>
            </p>
            {i < 2 && (
              <span className="tax-chain-arrow" aria-hidden="true">
                →
              </span>
            )}
          </section>
        ))}
        <figcaption>
          공급 단계 간 금액은 100 → 200 → {sale}. 첫 공급자의 공제 매입세액은
          0으로 가정합니다. 증빙·공제요건·간이과세·의제매입·가산세는
          생략했습니다.
        </figcaption>
      </figure>
      <div className="tax-controls">
        <Range
          label="최종 공급가액"
          value={sale}
          min={200}
          max={500}
          onChange={(n) => {
            setSale(n);
            p.rewind();
          }}
        />
        <label>
          마지막 단계의 가상 처리
          <select
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              p.rewind();
            }}
          >
            <option value="taxable">과세 · 10% 가정</option>
            <option value="zero">영세율 · 매입세액 공제 가정</option>
            <option value="exempt">면세 · 매입세액 불공제 가정</option>
          </select>
        </label>
      </div>
      <Prediction
        question="영세율과 면세는 매입세액 처리도 같을까요?"
        answer={false}
        reason="이 모형에서는 영세율은 매입세액을 공제하고 면세는 공제하지 않습니다. 현실의 의제매입 등 예외는 별도로 확인합니다."
      />
      {p.controls}
      <button
        onClick={() => {
          setSale(300);
          setMode("taxable");
          p.rewind();
        }}
      >
        조건까지 초기화
      </button>
      <Stage {...r.frames[p.step]} />
      <p className="tax-result">
        세 단계 납부 계산의 합 {fmt(r.totalRemit)} · 마지막 매출세액{" "}
        {fmt(r.consumerTax)} · 마지막 단계 공제 못한 매입세액{" "}
        {fmt(r.embeddedTax)}.{" "}
        {mode === "exempt"
          ? "매출세액 0이어도 앞 단계의 세금이 원가에 남습니다."
          : "매입세액을 이어 공제하므로 같은 세금을 단계마다 더하지 않습니다."}
      </p>
      <StaticTable
        title="공급 단계별 장부"
        headers={[
          "공급자",
          "공급가액",
          "매입세액",
          "매출세액",
          "공제 매입",
          "차액",
          "불공제",
        ]}
        rows={r.stages.map((s) => [
          s.label,
          s.price,
          s.input,
          s.output,
          s.credit,
          s.remit,
          s.costTax,
        ])}
      />
    </Lab>
  );
}
export function InvestmentTaxLab() {
  const [id, setId] = useState("interest"),
    [account, setAccount] = useState("ordinary");
  const r = investmentRoute(id, account),
    p = usePlayback(3);
  return (
    <Lab
      id="investment"
      title="수익의 이름보다 과세 사건 찾기"
      note="분류를 위한 가상 사례입니다. 국내외·상품·납세자·계좌 조건을 확인하지 않고 세율을 적용하지 않습니다."
    >
      <figure className="tax-route-tree">
        <div className="tax-tree-root">{r.label}</div>
        <div className="tax-route-options">
          {investmentKinds.map((k) => (
            <span key={k.id} data-selected={id === k.id}>
              {k.label}
            </span>
          ))}
        </div>
        <ol className="tax-route-steps">
          {r.nodes.map((n, i) => (
            <li key={n.label} data-current={i === p.step}>
              <strong>{n.label}</strong>
              <span>{n.detail}</span>
            </li>
          ))}
        </ol>
        <figcaption>
          갈림길은 분류 기준입니다. 줄 길이·단계 수는 세금 크기나 처리시간을
          뜻하지 않습니다.
        </figcaption>
      </figure>
      <div className="tax-controls">
        <label>
          사건
          <select
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              p.rewind();
            }}
          >
            {investmentKinds.map((i) => (
              <option value={i.id} key={i.id}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          계좌
          <select
            value={account}
            onChange={(e) => {
              setAccount(e.target.value);
              p.rewind();
            }}
          >
            <option value="ordinary">일반계좌</option>
            <option value="special">특례계좌</option>
          </select>
        </label>
      </div>
      <Prediction
        question="배당과 주식 매도차익은 항상 같은 세금 규칙일까요?"
        answer={false}
        reason="소득 유형과 과세 사건이 다릅니다. 상품·계좌·국내외 조건을 추가로 확인합니다."
      />
      {p.controls}
      <button
        onClick={() => {
          setId("interest");
          setAccount("ordinary");
          p.rewind();
        }}
      >
        조건까지 초기화
      </button>
      <p className="tax-result">{r.result}</p>
      <StaticTable
        title="수익 유형과 확인 질문"
        headers={["유형", "사건", "분류", "추가 확인"]}
        rows={investmentKinds.map((k) => [
          k.label,
          k.event,
          k.category,
          k.question,
        ])}
      />
    </Lab>
  );
}
export function TaxAccountsLab() {
  const [id, setId] = useState("isa"),
    [states, setStates] = useState(["yes", "unknown", "yes"]);
  const r = accountRoute(id, states);
  return (
    <Lab
      id="accounts"
      title="계좌의 혜택 앞에 놓인 조건 문"
      note="요건을 읽는 연습입니다. 선택값은 가상의 서류 확인 상태이며 실제 계좌의 적격 판정이 아닙니다."
    >
      <label>
        계좌 유형
        <select
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setStates(["unknown", "unknown", "unknown"]);
          }}
        >
          {accountKinds.map((k) => (
            <option value={k.id} key={k.id}>
              {k.label}
            </option>
          ))}
        </select>
      </label>
      <p>{r.detail}</p>
      <figure className="tax-gate-scene">
        <div className="tax-vault">
          <span aria-hidden="true">▤</span>
          {r.label}
          <small>안의 상품과 수익은 별개</small>
        </div>
        <div className="tax-gates">
          {r.gates.map((g, i) => (
            <label className="tax-gate" data-state={g.state} key={g.label}>
              <span className="tax-gate-symbol" aria-hidden="true">
                {g.symbol}
              </span>
              <strong>{g.label}</strong>
              <select
                aria-label={g.label}
                value={g.state}
                onChange={(e) =>
                  setStates((s) =>
                    s.map((v, j) => (j === i ? e.target.value : v)),
                  )
                }
              >
                <option value="yes">자료 확인</option>
                <option value="unknown">미확인</option>
                <option value="no">조건 불일치</option>
              </select>
            </label>
          ))}
        </div>
        <figcaption>
          ✓는 자료를 확인했다는 뜻일 뿐 세금 0 판정이 아닙니다. ?를 ×와
          구분합니다. 문 하나의 상태가 바뀌면 아래 결론도 달라집니다.
        </figcaption>
      </figure>
      <p className="tax-result" role="status">
        {r.result}
      </p>
      <button
        onClick={() => {
          setId("isa");
          setStates(["yes", "unknown", "yes"]);
        }}
      >
        조건까지 초기화
      </button>
      <Prediction
        question="계좌에 세제혜택이 있으면 원금 손실도 막아줄까요?"
        answer={false}
        reason="세금 규칙과 투자 손익은 별개입니다. 세금만으로 적합한 계좌를 고를 수 없습니다."
      />
      <StaticTable
        title="계좌별 확인 지도"
        headers={["계좌", "첫째 조건", "둘째 조건", "셋째 조건"]}
        rows={accountKinds.map((k) => [k.label, ...k.checks])}
      />
    </Lab>
  );
}
export function HousingTaxLab() {
  const p = usePlayback(2),
    r = housingRoute(p.step);
  return (
    <Lab
      id="housing"
      title="한 집 위에 놓인 세 번의 다른 질문"
      note="취득·보유·양도의 과세 사건 지도입니다. 실제 세율·세액·신고기한을 계산하지 않습니다."
    >
      <p>
        긴 선은 집을 가진 흐름, 점은 확인해야 할 사건입니다. 거리나 금액에
        비례하지 않는 순서도입니다.
      </p>
      <figure className="tax-housing-scene">
        <div className="tax-house" aria-hidden="true">
          ⌂
        </div>
        <ol>
          {r.events.map((e, i) => (
            <li key={e.id} data-current={i === p.step}>
              <button onClick={() => p.seek(i)} aria-pressed={i === p.step}>
                <b>{e.symbol}</b>
                {e.label}
              </button>
              <strong>{e.time}</strong>
              <span>{e.kind}</span>
            </li>
          ))}
        </ol>
        <figcaption>
          주택 매매가격, 보유단계의 평가 기준, 양도차익은 같은 금액이 아닙니다.
        </figcaption>
      </figure>
      {p.controls}
      <Stage label={r.current.label} detail={r.current.check} />
      <p className="tax-result">{r.result}</p>
      <Prediction
        question="양도차익이 없으면 취득세·재산세도 자동으로 0일까요?"
        answer={false}
        reason="서로 다른 사건과 과세표준을 사용합니다. 한 단계의 결론을 다른 세금에 옮기면 안 됩니다."
      />
      <StaticTable
        title="부동산 사건 지도"
        headers={["사건", "시점", "세목", "추가 확인"]}
        rows={r.events.map((e) => [e.label, e.time, e.kind, e.check])}
      />
    </Lab>
  );
}
export function GiftsLab() {
  const [kind, setKind] = useState("gift"),
    [value, setValue] = useState(400),
    [confirmed, setConfirmed] = useState(true);
  const r = transferBase({ kind, value, confirmed }),
    p = usePlayback(2);
  return (
    <Lab id="gifts" title="이전된 재산과 계산할 묶음 구분">
      <figure className="tax-transfer-scene">
        <div className={`tax-estate ${kind}`}>
          <h4>{r.scope}</h4>
          <Bar label="이번 재산" value={r.value} max={650} />
          <Bar label="합산 가정" value={r.prior} max={650} color="blue" />
          <p>
            합계 {fmt(r.combined)} · 공제 가정 {fmt(r.usedDeduction)}
          </p>
        </div>
        <div className="tax-transfer-boundary">
          <span>평가·합산·공제 검토</span>
          <b>↓</b>
          <strong>
            {r.base === null ? "? 미확인" : `과세표준 ${fmt(r.base)}`}
          </strong>
        </div>
        <figcaption>
          막대는 같은 0–650 가상 단위입니다. 증여의 수증자별 계산과 상속재산
          전체의 계산 출발점을 구분합니다. 이 단순 덧셈은 실제 상속인별 세액
          배분을 재현하지 않습니다.
        </figcaption>
      </figure>
      <div className="tax-controls">
        <label>
          이전 사건
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              p.rewind();
            }}
          >
            <option value="gift">생전 증여</option>
            <option value="inheritance">사망으로 상속</option>
          </select>
        </label>
        <Range
          label="새로 평가한 재산"
          value={value}
          max={600}
          onChange={(n) => {
            setValue(n);
            p.rewind();
          }}
        />
        <label>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => {
              setConfirmed(e.target.checked);
              p.rewind();
            }}
          />
          가상 평가·합산·공제 조건을 모두 확인
        </label>
      </div>
      {p.controls}
      <button
        onClick={() => {
          setKind("gift");
          setValue(400);
          setConfirmed(true);
          p.rewind();
        }}
      >
        조건까지 초기화
      </button>
      <Stage {...r.frames[p.step]} />
      <p className="tax-result">{r.result}</p>
      <Prediction
        question="공제보다 재산이 적으면 신고 여부까지 자동으로 끝날까요?"
        answer={false}
        reason="가상 과세표준이 0이라는 계산과 현실의 평가·신고 의무는 다른 질문입니다."
      />
      <StaticTable
        title="이전 재산의 가상 계산"
        headers={["단계", "금액", "경계"]}
        rows={r.frames.map((f) => [
          f.label,
          f.value === null ? "미확인" : f.value!,
          f.detail,
        ])}
      />
    </Lab>
  );
}
export function DeductionsLab() {
  const [base, setBase] = useState(400),
    [off, setOff] = useState(50);
  const r = deductionComparison(base, off);
  return (
    <Lab id="deductions" title="같은 50, 서로 다른 공제 위치">
      <figure className="tax-deduction-scene">
        {r.rows.map((row) => (
          <section key={row.id} className={row.id}>
            <h4>{row.label}</h4>
            <div className="tax-pipeline">
              <span>
                과세표준 <b>{fmt(row.taxableBase)}</b>
              </span>
              <i>↓ 구간별 세율</i>
              <span>
                산출세액 <b>{fmt(row.calculated)}</b>
              </span>
              <i>↓ 세액공제 {fmt(row.usedCredit)}</i>
              <span>
                결정세액 <b>{fmt(row.finalTax)}</b>
              </span>
            </div>
            <Bar
              label="결정세액"
              value={row.finalTax}
              max={140}
              color={row.id === "credit" ? "gold" : "teal"}
            />
            <p>기준보다 감소 {fmt(row.saving)}</p>
          </section>
        ))}
        <figcaption>
          세 행의 결정세액 막대는 0–140 단위 고정 눈금입니다. 소득공제는 위쪽
          바탕, 세액공제는 아래쪽 세액을 줄입니다. 가상 세액공제는 0까지만
          줄이고 초과분 환급·이월은 없습니다.
        </figcaption>
      </figure>
      <div className="tax-controls">
        <Range
          label="공제 전 과세 바탕"
          value={base}
          max={600}
          onChange={setBase}
        />
        <Range label="공제 가정액" value={off} max={150} onChange={setOff} />
      </div>
      <button
        onClick={() => {
          setBase(400);
          setOff(50);
        }}
      >
        조건까지 초기화
      </button>
      <Prediction
        question="소득공제 50이면 세금도 50 줄까요?"
        answer={false}
        reason="50을 뺀 과세표준에 구간별 세율을 다시 적용합니다. 기준400에서는 세금이80에서65로15 줄어듭니다."
      />
      <StaticTable
        title="세 가지 공제 비교"
        headers={[
          "조건",
          "과세표준",
          "산출세액",
          "세액공제 사용",
          "결정세액",
          "감소액",
        ]}
        rows={r.rows.map((x) => [
          x.label,
          x.taxableBase,
          x.calculated,
          x.usedCredit,
          x.finalTax,
          x.saving,
        ])}
      />
    </Lab>
  );
}
export function TaxTimelineLab() {
  const [monthly, setMonthly] = useState(8),
    [month, setMonth] = useState(14);
  const r = taxTimeline({ monthly, settleMonth: month }),
    p = usePlayback(18),
    f = r.frames[p.step];
  return (
    <Lab id="timeline" title="귀속기간과 실제 현금의 시계">
      <figure className="tax-timeline-scene">
        <div className="tax-time-chart">
          <div className="tax-time-axis" aria-hidden="true">
            <span>150</span>
            <span>75</span>
            <span>0</span>
          </div>
          <div className="tax-time-columns">
            {r.frames.map((t) => (
              <button
                key={t.month}
                data-current={t.month === p.step}
                data-adjustment={
                  t.adjustment < 0
                    ? "refund"
                    : t.adjustment > 0
                      ? "pay"
                      : "none"
                }
                onClick={() => p.seek(t.month)}
                aria-label={`${t.label}: 원천징수 ${t.withheld}, 정산 조정 ${t.adjustment}, 누적 세금 현금유출 ${t.cumulative}`}
                aria-pressed={t.month === p.step}
              >
                <i
                  style={{
                    height: `${(t.cumulative / 150) * 100}%`,
                    borderTopWidth: t.cumulative === 0 ? 0 : 2,
                  }}
                />
                <span data-major={t.month % 3 === 0}>{t.month}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="tax-year-bands">
          <span>0: 시작 / 1–12: Y년 귀속</span>
          <span>13–18: Y+1년</span>
        </div>
        <figcaption>
          가로: 경과월 0–18. 세로: 누적 순세금 현금유출 0–150 단위. 누적 막대가
          낮아지는 달은 환급입니다. 파랑은 일반 달, 청록은 환급 달입니다. 주황
          ▼는 관찰 중인 달을 가리키며 금액이 아닙니다. 막대 폭은 금액과
          무관합니다.
        </figcaption>
      </figure>
      <div className="tax-controls">
        <Range
          label="매달 원천징수"
          value={monthly}
          max={12}
          step={1}
          onChange={(n) => {
            setMonthly(n);
            p.rewind();
          }}
        />
        <label>
          가상 정산 현금 시점
          <select
            value={month}
            onChange={(e) => {
              setMonth(Number(e.target.value));
              p.rewind();
            }}
          >
            <option value={14}>Y+1년 2월</option>
            <option value={16}>Y+1년 4월</option>
            <option value={18}>Y+1년 6월</option>
          </select>
        </label>
      </div>
      {p.controls}
      <button
        onClick={() => {
          setMonthly(8);
          setMonth(14);
          p.rewind();
        }}
      >
        조건까지 초기화
      </button>
      <Stage label={`${f.label} · ${f.phase}`} detail={f.detail} />
      <label>
        관찰 시점
        <select value={p.step} onChange={(e) => p.seek(Number(e.target.value))}>
          {r.frames.map((t) => (
            <option key={t.month} value={t.month}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <p className="tax-result">
        현재 누적 순유출 {fmt(f.cumulative)} · 선택한 달의 원천징수{" "}
        {fmt(f.withheld)} · 정산 조정 {fmt(f.adjustment)}. 결정세액은 80으로
        고정, 최종 누적도 80입니다.
      </p>
      <Prediction
        question="환급 계산이 끝났으면 돈도 이미 들어왔을까요?"
        answer={false}
        reason="산출·신고·처리·지급은 다른 사건입니다. 현금 시점을 뒤로 옮겨 대기 중 잔액을 비교하세요."
      />
      <StaticTable
        title="귀속과 현금 전체 시간표"
        headers={["시점", "상태", "원천징수", "정산 조정", "누적 순유출"]}
        rows={r.frames.map((t) => [
          t.label,
          t.phase,
          t.withheld,
          t.adjustment,
          t.cumulative,
        ])}
      />
    </Lab>
  );
}
export function TaxDocumentsLab() {
  const [id, setId] = useState("payslip"),
    [index, setIndex] = useState(0),
    [answer, setAnswer] = useState("");
  const r = documentReview(id),
    row = r.rows[index];
  const labels: Record<string, string> = {
    fact: "● 문서의 사실",
    assumption: "△ 해석·가정",
    unknown: "? 추가 확인",
  };
  return (
    <Lab
      id="documents"
      title="문장마다 근거의 꼬리표 붙이기"
      note="직접 만든 가상 문서입니다. 실제 세금 서식의 복제나 신고 도구가 아니며 개인정보를 입력하지 않습니다."
    >
      <label>
        연습 자료
        <select
          value={id}
          onChange={(e) => {
            setId(e.target.value);
            setIndex(0);
            setAnswer("");
          }}
        >
          {taxDocuments.map((d) => (
            <option value={d.id} key={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </label>
      <figure className="tax-document-scene">
        <div className="tax-paper">
          <h4>{r.label}</h4>
          <p>{r.context}</p>
          {r.rows.map((v, i) => (
            <button
              key={v.label}
              onClick={() => {
                setIndex(i);
                setAnswer("");
              }}
              aria-pressed={index === i}
              data-current={index === i}
            >
              <span>{i + 1}</span>
              {v.label}
            </button>
          ))}
        </div>
        <div className="tax-annotation">
          <h4>선택한 문장 {index + 1}</h4>
          <p>{row.label}</p>
          <fieldset>
            <legend>어느 범주인가요?</legend>
            {Object.entries(labels).map(([key, label]) => (
              <label key={key}>
                <input
                  type="radio"
                  name="tax-evidence"
                  checked={answer === key}
                  onChange={() => setAnswer(key)}
                />
                {label}
              </label>
            ))}
          </fieldset>
          {answer && (
            <p role="status">
              <strong>
                {answer === row.kind ? "맞습니다." : "범위를 다시 보세요."}{" "}
                {labels[row.kind]}
              </strong>{" "}
              {row.why}
            </p>
          )}
        </div>
        <figcaption>
          선택한 줄과 해설이 연결됩니다. ‘문서의 사실’은 실제 납부·입금 완료까지
          보증한다는 뜻이 아닙니다.
        </figcaption>
      </figure>
      <button
        onClick={() => {
          setId("payslip");
          setIndex(0);
          setAnswer("");
        }}
      >
        조건까지 초기화
      </button>
      <StaticTable
        title="문장별 근거와 확인 질문"
        headers={["문장", "분류", "이유"]}
        rows={r.rows.map((v) => [v.label, labels[v.kind], v.why])}
      />
    </Lab>
  );
}

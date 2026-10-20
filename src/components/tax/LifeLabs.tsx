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
              <span aria-hidden="true">{["▰", "▱", "▥"][i]}</span>
              <b>{part.label}</b>
              <strong>{fmt(part.value)}</strong>
            </div>
          ))}
        </div>
        <figcaption>
          띠는 왼쪽부터 청록 ▰ 통장 · 금색 ▱ 사회보험 본인부담 · 파랑 ▥ 원천징수
          세금입니다. 아래 목적지 표시는 범례이며 그 폭은 금액 눈금이 아닙니다.
          세율을 역산하지 않습니다. 전체 배분과 지급 과정의 관찰 단계는
          구분합니다.
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
        question="환급받는 돈은 새로 번 소득일까요?"
        answer={false}
        reason={`환급은 새 소득이 아니라 이미 낸 돈을 최종 부담과 맞추는 정산입니다. 현재 기납부액 ${fmt(r.prepaid)}과 결정세액 ${fmt(r.finalTax)}을 비교하면 ${r.refund > 0 ? `환급 ${fmt(r.refund)}` : r.extra > 0 ? `추가납부 ${fmt(r.extra)}` : "정산 차액 0"}입니다.`}
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
        <p className="tax-route-guide">
          네 경로를 나란히 비교하세요. ●와 파란 경계는 선택한 사건이며, 화살표는
          원천 → 사건 → 분류를 확인하는 순서입니다.
        </p>
        <div className="tax-route-branches">
          {investmentKinds.map((k) => (
            <section
              className="tax-route-branch"
              key={k.id}
              data-kind={k.id}
              data-selected={id === k.id}
            >
              <h4>
                <span aria-hidden="true">{id === k.id ? "●" : "○"}</span>{" "}
                {k.label}
              </h4>
              <ol>
                {investmentRoute(k.id, account)
                  .nodes.slice(0, 3)
                  .map((node, i) => (
                    <li
                      key={node.label}
                      data-current={id === k.id && p.step === i}
                      data-phase={i}
                    >
                      <small>{node.label}</small>
                      <strong>{node.detail}</strong>
                      {i < 2 && (
                        <span className="tax-route-arrow" aria-hidden="true">
                          ↓
                        </span>
                      )}
                    </li>
                  ))}
              </ol>
            </section>
          ))}
        </div>
        <div className="tax-route-account" data-current={p.step === 3}>
          <span className="tax-route-question" aria-hidden="true">
            ?
          </span>
          <div>
            <strong>{r.nodes[3].label}</strong>
            <p>{r.nodes[3].detail}</p>
          </div>
        </div>
        <figcaption>
          각 경로 끝의 소득 분류는 검토 출발점입니다. 선택한 사건도 계좌·납세자
          조건의 점선 경계를 통과해야 합니다. 평가 변화는 지급·실현과 구별하며,
          줄 길이·단계 수는 세금 크기나 처리시간이 아닙니다.
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

import { useState } from "react";
import { usePlayback } from "../money/shared";
import {
  fiscalLedger,
  stabilizer,
} from "../../simulations/economics/trade-fiscal.mjs";
import { RateSlider, num } from "./PriceLabs";
import { Quantity } from "./TradeLabs";
import "./trade-fiscal.css";
export function FiscalLab() {
  const [tax, T] = useState(200),
    [purchase, G] = useState(250),
    [transfer, B] = useState(100),
    [debt, D] = useState(200),
    [prediction, P] = useState("");
  const play = usePlayback(5),
    r = fiscalLedger(tax, purchase, transfer, debt),
    f = r.frames[play.step];
  const accounts = [
    ["가계", f.household],
    ["기업", f.firm],
    ["정부", f.government],
    ["채권 매입자", f.lender],
  ] as const;
  const flows = [
    {
      step: 1,
      label: `채권 매입자 → 정부 · 조달 ${num(r.borrow)}`,
      detail: "현금과 채권을 맞바꿈 · 세입 아님",
    },
    {
      step: 2,
      label: `가계 → 정부 · 세금 ${tax}`,
      detail: "정부의 수입 · 생산물 대가 아님",
    },
    {
      step: 3,
      label: `정부 → 가계 · 이전 ${transfer}`,
      detail: "당장 새 생산의 대가는 아님",
    },
    {
      step: 4,
      label: `정부 → 기업 · 구매 ${purchase}`,
      detail: "반대 방향: 기업 → 정부 새 서비스",
    },
    {
      step: 5,
      label: `정부 → 채권 매입자 · 상환 ${num(r.repay)}`,
      detail: "기존 채무 감소 · 지출 합계에서 제외",
    },
  ];
  return (
    <section className="eco-lab" aria-label="재정 흐름과 채무 장부 실험">
      <h3>같은 정부에서 나가도 돈의 역할은 다릅니다</h3>
      <p>
        가상 한 기간 · 금액 단위. 막대는 현금 잔액, 화살표는 거래 방향입니다.
        채무는 별도의 계약 잔액입니다.
      </p>
      <div className="eco-controls">
        <RateSlider
          label="한 기간 세금"
          value={tax}
          min={0}
          max={300}
          unit="단위"
          onChange={(v) => {
            T(v);
            play.rewind();
          }}
        />
        <RateSlider
          label="한 기간 정부 구매"
          value={purchase}
          min={0}
          max={300}
          unit="단위"
          onChange={(v) => {
            G(v);
            play.rewind();
          }}
        />
        <RateSlider
          label="한 기간 이전지출"
          value={transfer}
          min={0}
          max={300}
          unit="단위"
          onChange={(v) => {
            B(v);
            play.rewind();
          }}
        />
        <RateSlider
          label="시작 채무 잔액"
          value={debt}
          min={0}
          max={600}
          unit="단위"
          onChange={(v) => {
            D(v);
            play.rewind();
          }}
        />
      </div>
      <label className="eco-predict">
        이전지출 자체가 GDP의 정부 구매에 더해질까요?
        <select value={prediction} onChange={(e) => P(e.target.value)}>
          <option value="">먼저 예측하기</option>
          <option value="no">이전 자체는 더하지 않습니다</option>
          <option value="yes">모두 정부 구매에 더합니다</option>
        </select>
      </label>
      {play.controls}
      <button
        onClick={() => {
          T(200);
          G(250);
          B(100);
          D(200);
          P("");
          play.rewind();
        }}
      >
        조건까지 초기화
      </button>
      <p className="eco-stage" aria-live="polite">
        {f.label} · {f.flow}
      </p>
      <figure className="eco-fiscal-scene">
        <div className="eco-cash-accounts">
          {accounts.map(([name, value]) => (
            <article key={name}>
              <h4>{name}</h4>
              <Quantity
                label="현재 현금"
                value={value}
                max={1400}
                kind="cash"
              />
            </article>
          ))}
        </div>
        <ol className="eco-flow-lanes">
          {flows.map((flow) => (
            <li
              className={play.step === flow.step ? "eco-observing" : ""}
              key={flow.step}
            >
              <b>
                {flow.step}. {flow.label}
              </b>
              <span>{flow.detail}</span>
            </li>
          ))}
        </ol>
        <div className="eco-stock-frame">
          <h4>채무 잔액 · 현재 관찰 시점</h4>
          <Quantity
            label="정부가 갚을 원금"
            value={f.debt}
            max={1200}
            kind="debt"
          />
          <p>
            시작 {debt} → 기간 말 {num(r.debt)}. 채권 매입자의 채권 자산과 짝을
            이룹니다.
          </p>
        </div>
        <figcaption>
          현금 공통 눈금 0~1,400 · 합계는 매 단계 2,100. 채무 눈금 0~1,200은
          현금과 별도입니다. 순서는 설명용이며 실제 정부 집행 순서를 재현하지
          않습니다.
        </figcaption>
      </figure>
      <div className="eco-budget-equation">
        <b>기간 수지 {num(r.balance)}</b>
        <span>
          = 세금 {tax} − 구매 {purchase} − 이전 {transfer}
        </span>
        <span>
          부족 재원 {num(r.borrow)} / 상환 {num(r.repay)} / 잔여 현금{" "}
          {num(r.reserve)}
        </span>
      </div>
      <p role="status">
        {play.step >= 4 && prediction
          ? prediction === "no"
            ? "예측과 같습니다. "
            : "생산물의 대가인지 확인하세요. "
          : ""}
        이 모형에서 GDP에 직접 잡히는 정부 구매는 {r.directGDP}. 이전 {transfer}
        은 그 자체로 더하지 않습니다. 이후 가계의 소비와 민간 생산 반응은
        계산하지 않았습니다.
      </p>
      <details>
        <summary>정적 대안 · 모든 단계의 현금·채무 표</summary>
        <div
          className="eco-table"
          tabIndex={0}
          role="region"
          aria-label="재정 단계 장부"
        >
          <table>
            <thead>
              <tr>
                <th>단계</th>
                <th>가계 현금</th>
                <th>기업 현금</th>
                <th>정부 현금</th>
                <th>매입자 현금</th>
                <th>정부 채무</th>
              </tr>
            </thead>
            <tbody>
              {r.frames.map((row) => (
                <tr key={row.label}>
                  <th>{row.label}</th>
                  <td>{num(row.household)}</td>
                  <td>{num(row.firm)}</td>
                  <td>{num(row.government)}</td>
                  <td>{num(row.lender)}</td>
                  <td>{num(row.debt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p>
        폐쇄된 네 주체의 현금 이동입니다. 구매는 전부 국내에서 이번 기간 새로
        생산한 최종 서비스입니다. 이자·통화 발행·해외·자산 매입·평가 변화는
        없습니다. 적자는 채권 발행, 흑자는 기존 원금 상환 후 현금 보유로
        처리합니다.
      </p>
    </section>
  );
}
export function StabilizerLab() {
  const [income, Y] = useState(600),
    [extra, G] = useState(100),
    [lag, L] = useState(3),
    [month, M] = useState(0);
  const play = usePlayback(2),
    r = stabilizer(income, extra, lag, month);
  return (
    <section className="eco-lab" aria-label="자동안정화와 집행 시차 실험">
      <h3>규칙은 그대로인데 완충 작용이 생깁니다</h3>
      <p>
        기준 민간 소득 1,000, 세금 20%, 기본 이전 50. 소득이 1,000보다 낮으면
        감소분의 25%를 급여에 추가하는 가상 규칙입니다. 실제 세율·복지 제도가
        아닙니다.
      </p>
      <div className="eco-controls">
        <RateSlider
          label="현재 민간 소득"
          value={income}
          min={400}
          max={1400}
          unit="단위"
          onChange={(v) => {
            Y(v);
            play.rewind();
          }}
        />
        <RateSlider
          label="추가 구매 편성액"
          value={extra}
          min={0}
          max={200}
          unit="단위"
          onChange={(v) => {
            G(v);
            play.rewind();
          }}
        />
        <RateSlider
          label="추가 구매 집행 시차"
          value={lag}
          min={0}
          max={6}
          unit="개월"
          onChange={(v) => {
            L(v);
            play.rewind();
          }}
        />
        <RateSlider
          label="관찰 시점"
          value={month}
          min={0}
          max={6}
          unit="개월"
          onChange={(v) => {
            M(v);
            play.rewind();
          }}
        />
      </div>
      {play.controls}
      <button
        onClick={() => {
          Y(600);
          G(100);
          L(3);
          M(0);
          play.rewind();
        }}
      >
        조건까지 초기화
      </button>
      <p className="eco-stage" aria-live="polite">
        {r.phases[play.step]}
      </p>
      <figure className="eco-stabilizer-scene">
        <div className="eco-income-comparison">
          <h4>소득과 처분가능소득 · 공통 눈금 0~1,400</h4>
          <Quantity
            label="기준 처분가능소득"
            value={r.baselineDisposable}
            max={1400}
            kind="cash"
          />
          <div className={play.step === 0 ? "eco-observing" : ""}>
            <Quantity label="충격 후 민간 소득" value={r.income} max={1400} />
          </div>
          <Quantity
            label="세금·급여 금액까지 고정하면"
            value={r.fixedDisposable}
            max={1400}
            kind="fixed"
          />
          <Quantity
            label="기존 규칙대로 자동 반응하면"
            value={r.disposable}
            max={1400}
            kind="cash"
          />
          <p className={play.step === 1 ? "eco-observing" : ""}>
            자동 반응 시 세금 {num(r.tax)} / 이전 {num(r.transfer)}
            <br />
            규칙은 고정, 금액은 소득에 따라 변화합니다.
          </p>
        </div>
        <div
          className={`eco-lag-calendar ${play.step === 2 ? "eco-observing" : ""}`}
        >
          <h4>별도 재량 결정 · 추가 정부 구매</h4>
          <ol>
            {Array.from({ length: 7 }, (_, i) => (
              <li className={i === month ? "eco-observing" : ""} key={i}>
                <b>{i}개월</b>
                <span>
                  {i === 0
                    ? "편성 결정"
                    : i < lag
                      ? "집행 대기"
                      : i === lag
                        ? "집행 가능"
                        : "집행 이후"}
                </span>
                {i === lag && <strong>+{extra}</strong>}
              </li>
            ))}
          </ol>
          <p>
            관찰 시점의 추가 집행 {num(r.extraApplied)}.{" "}
            {month < lag
              ? "편성액이 아직 구매로 이어지지 않았습니다."
              : "가정한 집행 시점에 도달했습니다."}
          </p>
        </div>
        <figcaption>
          왼쪽 막대는 서로 다른 비교 조건이며 쌓아 더하지 않습니다. 오른쪽은
          추가 구매의 시차 조건입니다. 달력의 칸들을 합산한 누적 지출이
          아닙니다.
        </figcaption>
      </figure>
      <p role="status">
        금액 고정 비교 대비 처분가능소득 차이 {num(r.cushion)}. 관찰 시점
        조건으로 평가한 가상 한 기간 수지 {num(r.balance)} = 세금 {num(r.tax)} −
        구매 {num(r.purchase)} − 이전 {num(r.transfer)}. 기준 수지는 −100입니다.
      </p>
      <details>
        <summary>정적 대안 · 자동 반응·추가 집행 비교표</summary>
        <div
          className="eco-table"
          tabIndex={0}
          role="region"
          aria-label="안정화 비교표"
        >
          <table>
            <thead>
              <tr>
                <th>조건</th>
                <th>민간 소득</th>
                <th>세금</th>
                <th>이전</th>
                <th>처분가능소득</th>
                <th>정부 구매</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>기준</th>
                <td>1,000</td>
                <td>200</td>
                <td>50</td>
                <td>850</td>
                <td>250</td>
              </tr>
              <tr>
                <th>충격 후 금액 고정 비교</th>
                <td>{income}</td>
                <td>200</td>
                <td>50</td>
                <td>{num(r.fixedDisposable)}</td>
                <td>250</td>
              </tr>
              <tr>
                <th>자동 반응 + 별도 추가 구매 조건</th>
                <td>{income}</td>
                <td>{num(r.tax)}</td>
                <td>{num(r.transfer)}</td>
                <td>{num(r.disposable)}</td>
                <td>
                  {num(r.purchase)} (추가 {num(r.extraApplied)})
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
      <p>
        재생은 설명의 강조 순서만 바꿉니다. 시간은 관찰 시점 슬라이더로 따로
        바꿉니다. 소득은 외생적으로 주어지며 추가 구매가 소득·GDP를 얼마
        늘리는지 추정하지 않습니다. 앞 장부와 다른 사례이고 현금 잔액을 합치지
        않습니다.
      </p>
    </section>
  );
}

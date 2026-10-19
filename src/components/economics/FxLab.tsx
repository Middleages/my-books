import { useState } from "react";
import { usePlayback } from "../money/shared";
import {
  fxComparison,
  fxDefaults,
  type FxInput,
  type FxPair,
} from "../../simulations/economics/policy-fx.mjs";
import { RateSlider, num } from "./PriceLabs";
import { SignedCash } from "./PolicyLabs";
const inverse = (v: number) =>
  v.toLocaleString("ko-KR", { maximumFractionDigits: 6 });
function PairBars({
  pair,
  max,
  label,
}: {
  pair: FxPair;
  max: number;
  label: string;
}) {
  return (
    <div className="eco-fx-pair">
      <b>{label}</b>
      {[
        ["기준", pair.base],
        ["비교", pair.current],
      ].map(([name, v], i) => (
        <div key={name as string}>
          <span>
            {name} {num(v as number)}원
          </span>
          <div className="eco-fx-track" aria-hidden="true">
            <i
              className={i === 0 ? "eco-fx-before" : "eco-fx-after"}
              style={{ width: `${((v as number) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      <span>
        차이 {pair.delta > 0 ? "+" : ""}
        {num(pair.delta)}원
      </span>
    </div>
  );
}
export function FxLab() {
  const [p, P] = useState<FxInput>({ ...fxDefaults }),
    [prediction, S] = useState("");
  const play = usePlayback(2),
    r = fxComparison(p),
    change = (key: keyof FxInput, value: number | string) => {
      P({ ...p, [key]: value });
      S("");
      play.rewind();
    };
  const reset = () => {
    P({ ...fxDefaults });
    S("");
    play.rewind();
  };
  return (
    <section className="eco-lab" aria-label="환율과 생활 실험">
      <h3>달러 가격은 그대로, 원화 가격표만 바꾸기</h3>
      <p>
        자체 가상 사례 · 기준 환율 1 USD = 1,200 KRW. 모든 패널은 아래의 같은
        비교 환율을 읽습니다. 원/달러는 ‘달러 1개를 사는 데 필요한 원’입니다.
      </p>
      <div className="eco-options">
        <button onClick={() => change("rate", 1400)}>
          원/달러 상승 1,400원
        </button>
        <button onClick={() => change("rate", 1000)}>
          원/달러 하락 1,000원
        </button>
        <button onClick={() => change("rate", 1200)}>환율 불변 1,200원</button>
      </div>
      <RateSlider
        label="비교 원/달러 환율"
        value={p.rate}
        min={500}
        max={2500}
        unit="원/USD"
        onChange={(v) => change("rate", v)}
      />
      {play.controls}
      <button onClick={reset}>조건까지 초기화</button>
      <p className="eco-stage" aria-live="polite">
        {
          [
            "① 표시 방향과 환산",
            "② 기업의 대금·원가·잔액",
            "③ 가격 전가와 관찰 시점",
          ][play.step]
        }{" "}
        · 1 USD = {num(r.rate)} KRW · 소매 {p.month}개월
      </p>
      <figure
        className={`eco-fx-quote ${play.step === 0 ? "eco-observing" : ""}`}
      >
        <div className="eco-dollar-note">
          같은 <strong>1 USD</strong>
          <span>달러 1개 · 외화 단위 고정</span>
        </div>
        <div className="eco-fx-arrow">⇄ 교환 비율</div>
        <div className="eco-won-quotes">
          {[
            { label: "기준", q: r.baseQuote },
            { label: "비교", q: r.currentQuote },
          ].map((t) => (
            <div key={t.label}>
              <b>
                {t.label} · {num(t.q.rate)} KRW
              </b>
              <div className="eco-fx-track" aria-hidden="true">
                <i
                  className="eco-fx-after"
                  style={{ width: `${(t.q.rate / 2500) * 100}%` }}
                />
              </div>
              <span>역수: 1 KRW = {inverse(t.q.inverse)} USD</span>
            </div>
          ))}
        </div>
        <figcaption>
          원화 띠 공통 눈금 0–2,500원/USD. 원/달러 변화 {num(r.rateChange)}%,
          역수 변화 {num(r.inverseChange)}%. 상승과 하락의 퍼센트는 단순한 부호
          반전이 아닙니다. 역수는 표시만 반올림합니다.
        </figcaption>
      </figure>
      <div className="eco-controls">
        <RateSlider
          label="같은 상품의 달러 가격"
          min={0}
          max={500}
          value={p.amount}
          unit="USD"
          onChange={(v) => change("amount", v)}
        />
        <RateSlider
          label="가상 환전 비용률"
          min={0}
          max={5}
          value={p.fee}
          onChange={(v) => change("fee", v)}
        />
      </div>
      <div className="eco-conversion-bill">
        <span>
          {num(p.amount)} USD × {num(p.rate)} KRW/USD
        </span>
        <b>= 원화 대금 {num(r.purchase.gross)}원</b>
        <span>+ 가상 비용 {num(r.purchase.fee)}원</span>
        <strong>합계 {num(r.purchase.total)}원</strong>
      </div>
      <p className="eco-note">
        비용은 이 상품 구매의 원화 대금에만 부과하는 가상 비율입니다. 실제
        매매기준율·살 때/팔 때 환율 차이·고정 수수료를 재현하지 않습니다. 아래
        기업·소매 계산에는 이 비용을 적용하지 않습니다.
      </p>
      <h3>같은 환율이 기업의 두 쪽을 바꿉니다</h3>
      <p>
        한 기간의 수출 1,000달러 상당 대금·수입 중간재와 국내 비용 200,000원을
        비교합니다. 수량·외화 단가는 고정하고 계약 통화만 선택합니다.
      </p>
      <div className="eco-controls">
        <label className="eco-predict">
          수출 계약 통화
          <select
            value={p.invoice}
            onChange={(e) => change("invoice", e.target.value)}
          >
            <option value="USD">1,000 USD 대금 고정</option>
            <option value="KRW">1,200,000 KRW 대금 고정</option>
          </select>
        </label>
        <RateSlider
          label="같은 기간 수입 중간재 대금"
          min={0}
          max={1500}
          value={p.importUsd}
          unit="USD"
          onChange={(v) => change("importUsd", v)}
        />
      </div>
      <div
        className={`eco-firm-exposure ${play.step === 1 ? "eco-observing" : ""}`}
      >
        <div className="eco-trade-leg eco-receipt">
          <b>해외 고객 → 기업 · 대금 수취</b>
          <PairBars
            label="수출 대금의 원화 환산"
            pair={r.firm.revenue}
            max={r.scale}
          />
        </div>
        <div className="eco-trade-leg eco-payment">
          <b>기업 → 해외 공급자 · 원가 지급</b>
          <PairBars
            label="수입 중간재의 원화 원가"
            pair={r.firm.imports}
            max={r.scale}
          />
        </div>
      </div>
      <p>
        두 그림 공통 눈금: 0–{num(r.scale)}원/기간. 점선 빈 띠는 기준, 실선
        채움은 비교입니다. 입력 변경 시 두 그림의 공통 상한을 재산정합니다.
      </p>
      <div className="eco-firm-margin">
        <b>대금 − 수입 중간재 − 고정 국내 비용</b>
        <p>
          기준 {num(r.firm.margin.base)}원 → 비교 {num(r.firm.margin.current)}원
        </p>
        <SignedCash
          value={r.firm.margin.delta}
          max={r.scale}
          label="이 부분 차액의 변화"
        />
        <p>
          회계상 전체 이익이 아닙니다. 임금·다른 비용·물량 변화·헤지를 모두
          계산한 값이 아닙니다.
        </p>
      </div>
      <aside className="eco-fx-debt">
        <h4>외화부채는 별도의 잔액 평가입니다</h4>
        <PairBars
          label="같은 300 USD 부채 잔액"
          pair={r.firm.debt}
          max={r.scale}
        />
        <p>
          달러 빚은 300 그대로입니다. 원화 평가액 {num(r.firm.debt.base)} →{" "}
          {num(r.firm.debt.current)}원은 특정 시점 잔액입니다. 위 한 기간
          차액에서 다시 상환 비용처럼 빼지 않습니다. 만기·이자·실제 상환은
          생략했습니다.
        </p>
      </aside>
      <h3>수입 원가 상승이 매장 가격에 바로 다 반영될까요?</h3>
      <p>
        위 상품 하나의 수입 대금과 고정 국내 비용 30,000원으로 만든 별도 소매
        사례입니다. ‘전가 비율’과 ‘반영 월’은 직접 고른 가정이며 실제 추정치가
        아닙니다. 환율은 관찰 기간 동안 비교 수준을 유지한다고 가정합니다.
      </p>
      <div className="eco-controls">
        <RateSlider
          label="원가 변화의 가격 전가 비율"
          min={0}
          max={100}
          value={p.pass}
          onChange={(v) => change("pass", v)}
        />
        <RateSlider
          label="한 번 가격을 바꾸는 시점"
          min={0}
          max={6}
          unit="개월"
          value={p.lag}
          onChange={(v) => change("lag", v)}
        />
        <RateSlider
          label="관찰 시점"
          min={0}
          max={6}
          unit="개월"
          value={p.month}
          onChange={(v) => change("month", v)}
        />
      </div>
      <div
        className={`eco-retail-exposure ${play.step === 2 ? "eco-observing" : ""}`}
      >
        <div>
          <b>해외 단가 → 원화 수입 대금</b>
          <PairBars
            label="상품 수입 대금"
            pair={r.retail.unitImport}
            max={r.retail.scale}
          />
        </div>
        <div className="eco-retail-gate">
          <b>
            {p.month >= p.lag ? "약정한 반영 시점 도달" : "아직 가격 변경 전"}
          </b>
          <span>원가 차이 중 {r.retail.effectivePass}% 반영</span>
          <span>↓ 소매 가격의 가상 조정</span>
        </div>
        <div>
          <PairBars
            label="소매 가격 · 고정 국내 비용 포함"
            pair={r.retail}
            max={r.retail.scale}
          />
        </div>
      </div>
      <p>
        소매 그림 공통 눈금 0–{num(r.retail.scale)}원/개. 반영 전에는 원가가
        달라도 판매 가격은 기준값, 반영 시점부터는 기준 가격 + 원가 차이 × 전가
        비율입니다. 물량·마진 대응은 생략합니다.
      </p>
      <label className="eco-predict">
        예측 · 원/달러 상승만으로 모든 수출기업의 이익 증가를 확정할 수 있나요?
        <select value={prediction} onChange={(e) => S(e.target.value)}>
          <option value="">예측 선택</option>
          <option value="no">수입 원가·계약 등을 더 확인해야 한다</option>
          <option value="yes">항상 이익이 늘어난다</option>
        </select>
      </label>
      {play.step === 2 && (
        <p role="status">
          {prediction
            ? prediction === "no"
              ? "예측과 같습니다."
              : "예측과 다릅니다."
            : "서로 다른 노출을 비교하세요."}{" "}
          대금 환산 차이 {num(r.firm.revenue.delta)}원, 중간재 원가 차이{" "}
          {num(r.firm.imports.delta)}원. 이 둘과 국내 비용만 뺀 부분 차액의
          변화는 {num(r.firm.margin.delta)}원입니다. 실제 전체 이익은 여기서
          확정할 수 없습니다.
        </p>
      )}
      <p className="eco-note">
        단계 재생은 세 패널을 읽는 순서이며 환율의 미래 경로나 실제 월 경과가
        아닙니다. 소매의 시간은 ‘관찰 시점’ 입력으로만 바꿉니다. 원화 표시 명목
        양자환율만 다루고 실효·실질환율, 국가 전체 수출량·물가·무역수지를
        예측하지 않습니다.
      </p>
      <details>
        <summary>정적 대안 · 같은 환율의 전체 비교표</summary>
        <div
          className="eco-table"
          tabIndex={0}
          role="region"
          aria-label="환율 노출 비교표"
        >
          <table>
            <thead>
              <tr>
                <th>구분</th>
                <th>단위·기간</th>
                <th>기준</th>
                <th>비교</th>
                <th>차이</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["수출 대금", "원/기간", r.firm.revenue],
                ["수입 중간재", "원/기간", r.firm.imports],
                ["부분 차액", "원/기간", r.firm.margin],
                ["300 USD 부채", "원/시점 잔액", r.firm.debt],
                ["소매 가격", "원/개", r.retail],
              ].map(([name, unit, value]) => {
                const pair = value as FxPair;
                return (
                  <tr key={name as string}>
                    <th>{name as string}</th>
                    <td>{unit as string}</td>
                    <td>{num(pair.base)}</td>
                    <td>{num(pair.current)}</td>
                    <td>{num(pair.delta)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

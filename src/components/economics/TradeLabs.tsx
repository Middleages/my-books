import { useState } from "react";
import { usePlayback } from "../money/shared";
import {
  exportValue,
  externalAccounts,
  comparativeTrade,
  type Goods,
} from "../../simulations/economics/trade-fiscal.mjs";
import { RateSlider, num } from "./PriceLabs";
import "./trade-fiscal.css";
export function Quantity({
  label,
  value,
  max = 48,
  kind = "bread",
}: {
  label: string;
  value: number;
  max?: number;
  kind?: string;
}) {
  return (
    <div className={`eco-quantity eco-${kind}`}>
      <span>
        {label} <b>{num(value)}</b>
      </span>
      <div className="eco-measure">
        <i style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}
export function ExportLab() {
  const [gross, G] = useState(100),
    [share, S] = useState(40),
    [prediction, P] = useState("");
  const play = usePlayback(2),
    r = exportValue(gross, share);
  return (
    <section className="eco-lab" aria-label="수출 속 부가가치 실험">
      <h3>수출 상자를 열면 두 원산지가 보입니다</h3>
      <p>
        가상 한 기간 · 금액 단위. 띠의 길이는 금액, 보라색은 수입 중간재,
        청록색은 국내 부가가치입니다.
      </p>
      <div className="eco-controls">
        <RateSlider
          label="수출 총액"
          value={gross}
          min={0}
          max={200}
          unit="단위"
          onChange={(v) => {
            G(v);
            play.rewind();
          }}
        />
        <RateSlider
          label="수입 중간재 비중"
          value={share}
          min={0}
          max={100}
          onChange={(v) => {
            S(v);
            play.rewind();
          }}
        />
      </div>
      <label className="eco-predict">
        국내 부가가치를 수출 총액에 다시 더해도 될까요?
        <select value={prediction} onChange={(e) => P(e.target.value)}>
          <option value="">먼저 예측하기</option>
          <option value="no">중복이므로 더하지 않습니다</option>
          <option value="yes">서로 별개이므로 더합니다</option>
        </select>
      </label>
      {play.controls}
      <button
        onClick={() => {
          G(100);
          S(40);
          P("");
          play.rewind();
        }}
      >
        조건까지 초기화
      </button>
      <p className="eco-stage" aria-live="polite">
        {
          [
            "① 수입 중간재를 들여옵니다",
            "② 국내에서 가치를 더합니다",
            "③ 두 부분이 함께 수출됩니다",
          ][play.step]
        }
      </p>
      <figure className="eco-export-scene">
        <div className="eco-export-input">
          해외 중간재 ↓ <b>{num(r.imports)}</b>
        </div>
        <div className="eco-export-box">
          <b>수출품 총액 {num(r.gross)} · 바깥 테두리 안의 합계</b>
          <div
            className="eco-export-track"
            style={{ width: `${(r.gross / 200) * 100}%` }}
          >
            <i className="eco-import-part" style={{ width: `${share}%` }} />
            <i
              className="eco-domestic-part"
              style={{
                width: `${100 - share}%`,
                opacity: play.step >= 1 ? 1 : 0.25,
              }}
            />
          </div>
          <div className="eco-export-labels">
            <span>보라 · 수입분 {num(r.imports)}</span>
            <span>
              청록 · 국내분 {num(r.domestic)}{" "}
              {play.step === 0 ? "(다음 단계에서 더함)" : ""}
            </span>
          </div>
        </div>
        <div className="eco-export-output">
          {play.step === 2
            ? "↓ 해외 구매자에게 판매"
            : "↓ 수출할 완제품의 구성 미리 보기"}
        </div>
        <figcaption>
          띠의 전체 눈금은 200. 0은 띠가 없습니다. 국내분은 수출액의 안쪽
          부분이므로 한 번만 셉니다.
        </figcaption>
      </figure>
      <p role="status">
        {play.step === 2 && prediction
          ? prediction === "no"
            ? "예측과 같습니다. "
            : "다시 경계를 보세요. "
          : ""}
        수출 {num(r.gross)} − 수입 중간재 {num(r.imports)} = 이 생산의 국내
        부가가치 {num(r.domestic)}. 수출 + 국내분 {num(r.wrong)}은 중복
        합계입니다.
      </p>
      <details>
        <summary>정적 대안 · 수출액의 구성표</summary>
        <div
          className="eco-table"
          tabIndex={0}
          role="region"
          aria-label="수출 구성표"
        >
          <table>
            <thead>
              <tr>
                <th>수입 중간재</th>
                <th>국내 부가가치</th>
                <th>수출 총액</th>
                <th>중복한 잘못된 합계</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{num(r.imports)}</td>
                <td>{num(r.domestic)}</td>
                <td>{num(r.gross)}</td>
                <td>{num(r.wrong)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
      <p>
        다른 수입·생산·재고·세금은 없고, 수입 중간재 전부를 같은 기간 이
        수출품에 사용합니다. 국내 부가가치는 기업 순이익만을 뜻하지 않으며 임금
        등도 포함합니다.
      </p>
    </section>
  );
}
export function AccountsLab() {
  const [imports, I] = useState(60),
    [services, S] = useState(-50),
    [borrowing, B] = useState(80);
  const r = externalAccounts(100, imports, services, 5, -10, borrowing);
  const rows = [
    ["상품: 수출 100 − 수입", r.goods],
    ["서비스 순수취", r.services],
    ["본원소득 순수취", r.primary],
    ["이전소득 순수취", r.secondary],
  ] as const;
  return (
    <section className="eco-lab" aria-label="대외 거래의 분류 실험">
      <h3>상품 흑자여도 경상수지는 적자일 수 있습니다</h3>
      <div className="eco-controls">
        <RateSlider
          label="가상 상품 수입"
          value={imports}
          min={0}
          max={200}
          unit="단위"
          onChange={I}
        />
        <RateSlider
          label="서비스 순수취"
          value={services}
          min={-100}
          max={100}
          unit="단위"
          onChange={S}
        />
        <RateSlider
          label="별도 해외 차입"
          value={borrowing}
          min={0}
          max={200}
          unit="단위"
          onChange={B}
        />
      </div>
      <figure className="eco-account-boundaries">
        <div className="eco-current-boundary">
          <h4>경상거래 경계 · 한 기간</h4>
          {rows.map(([label, value]) => (
            <div className="eco-account-row" key={label}>
              <span>{label}</span>
              <b>{num(value)}</b>
              <div className="eco-diverging">
                <i
                  style={{
                    left: `${value < 0 ? 50 + value / 4 : 50}%`,
                    width: `${Math.abs(value) / 4}%`,
                  }}
                />
              </div>
            </div>
          ))}
          <strong>합계 경상수지 {num(r.current)}</strong>
          <small>
            막대 중심 = 0 · 왼쪽 순지급 / 오른쪽 순수취 · 전체 −200~+200
          </small>
        </div>
        <div className="eco-financial-boundary">
          <h4>금융거래 경계 · 별도 사례</h4>
          <div className="eco-finance-arrow">
            해외 채권자 → 국내 차입자
            <br />
            <b>현금 {num(r.borrowing)}</b>
          </div>
          <div className="eco-finance-arrow">
            국내 차입자 → 해외 채권자
            <br />
            갚을 의무 +{num(r.borrowing)}
          </div>
          <p>차입 원금은 상품 수출도 소득도 아닙니다.</p>
        </div>
        <figcaption>
          두 경계는 거래의 종류를 구분합니다. 이 예는 국제수지 전체를 맞춘
          장부가 아니며, 금융계정 잔액이나 순대외자산을 계산하지 않습니다.
        </figcaption>
      </figure>
      <p role="status">
        상품거래 수지 {num(r.goods)}, 경상수지 {num(r.current)}. 차입 슬라이더를
        움직여도 두 수지는 바뀌지 않습니다. 차입에 대응하는 예금 등 다른 금융
        항목은 생략했습니다.
      </p>
      <details>
        <summary>정적 대안 · 대외 거래 분류표</summary>
        <div
          className="eco-table"
          tabIndex={0}
          role="region"
          aria-label="대외 거래 분류표"
        >
          <table>
            <thead>
              <tr>
                <th>항목</th>
                <th>순수취 또는 원금</th>
                <th>경상 합계에 포함?</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([t, v]) => (
                <tr key={t}>
                  <td>{t}</td>
                  <td>{num(v)}</td>
                  <td>포함</td>
                </tr>
              ))}
              <tr>
                <td>차입 원금</td>
                <td>{num(r.borrowing)}</td>
                <td>아니오 · 금융거래</td>
              </tr>
              <tr>
                <th>경상수지</th>
                <td>{num(r.current)}</td>
                <td>위 네 경상 항목의 합</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
export function ComparativeLab() {
  const [bread, B] = useState(9);
  const play = usePlayback(2),
    r = comparativeTrade(bread);
  const states = [r.before, r.production, r.after],
    now = states[play.step];
  return (
    <section className="eco-lab" aria-label="비교우위와 교환 실험">
      <h3>A가 둘 다 잘 만들어도 교환 여지가 있습니다</h3>
      <p>
        각국 노동 12시간 고정. A는 시간당 빵 4개 또는 천 2장, B는 빵 1개 또는 천
        1장입니다. 빵 1개의 기회비용은 A 천 0.5장, B 천 1장입니다. 천 1장은 A 빵
        2개, B 빵 1개입니다.
      </p>
      <RateSlider
        label="천 6장과 맞바꿀 빵"
        value={bread}
        min={6}
        max={18}
        unit="개"
        onChange={(v) => {
          B(v);
          play.rewind();
        }}
      />
      {play.controls}
      <button
        onClick={() => {
          B(9);
          play.rewind();
        }}
      >
        조건까지 초기화
      </button>
      <p className="eco-stage" aria-live="polite">
        {r.phases[play.step]}
      </p>
      <figure className="eco-country-scene">
        {now.map((c: Goods, i) => (
          <article key={c.name}>
            <h4>
              {c.name} ·{" "}
              {["교환 전 보유", "생산 직후", "교환 후 보유"][play.step]}
            </h4>
            <div className="eco-hours">
              {play.step === 0
                ? "빵 6시간 / 천 6시간"
                : i === 0
                  ? "빵 9시간 / 천 3시간"
                  : "빵 0시간 / 천 12시간"}
            </div>
            <Quantity label="빵(개)" value={c.bread} />
            <Quantity label="천(장)" value={c.cloth} kind="cloth" max={24} />
            <small>
              교환 전: 빵 {r.before[i].bread}개 · 천 {r.before[i].cloth}장
            </small>
          </article>
        ))}
        <div className="eco-trade-arrows">
          A → B 빵 {r.bread}개<br />A ← B 천 {r.cloth}장<br />천 1장당 빵{" "}
          {num(r.ratio)}개
        </div>
        <figcaption>
          빵 막대 0~48개, 천 막대 0~24장 · 두 나라에 같은 눈금. 생산 변경 후
          총량 빵 36개·천 18장, 교환은 그 총량을 바꾸지 않습니다.
        </figcaption>
      </figure>
      <p role="status">
        교환 후 A의 빵 변화 {num(r.gains[0])}개, B {num(r.gains[1])}개. 두
        나라의 천은 교환 전과 같습니다.{" "}
        {r.bothGain
          ? "이 조건에서는 양쪽 보유량이 개선됩니다."
          : "이 교환 조건에서는 양쪽 모두 엄격히 개선되지는 않습니다."}
      </p>
      <details>
        <summary>정적 대안 · 생산·교환 비교표</summary>
        <div
          className="eco-table"
          tabIndex={0}
          role="region"
          aria-label="생산 교환표"
        >
          <table>
            <thead>
              <tr>
                <th>국가</th>
                <th>교환 전 빵/천</th>
                <th>변경 생산 빵/천</th>
                <th>교환 후 빵/천</th>
              </tr>
            </thead>
            <tbody>
              {r.after.map((c, i) => (
                <tr key={c.name}>
                  <th>{c.name}</th>
                  <td>
                    {r.before[i].bread} / {r.before[i].cloth}
                  </td>
                  <td>
                    {r.production[i].bread} / {r.production[i].cloth}
                  </td>
                  <td>
                    {c.bread} / {c.cloth}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p>
        이동 가능한 노동·고정 생산성·운송비 0·같은 품질·실행 가능한 교환을
        가정한 자체 사례입니다. 개인별 분배·실업·훈련·환경 비용은 계산하지
        않습니다.
      </p>
    </section>
  );
}

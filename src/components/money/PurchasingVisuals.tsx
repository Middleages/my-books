import { useState, type CSSProperties } from "react";
import {
  projectPurchasingPower,
  inflationDefaults,
} from "../../simulations/money/inflation.mjs";
import { purchasingScene } from "../../simulations/money/purchasing-visual.mjs";
import "./purchasing-visuals.css";

const won = (n: number) =>
  `${n.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}원`;
const number = (n: number) =>
  n.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
type Scene = ReturnType<typeof purchasingScene>;
function GroceryIcon() {
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      <path d="M12 29Q3 7 23 13L29 29" fill="#439775" />
      <path d="M31 30L38 8Q49 8 51 17L45 32" fill="#eba955" />
      <circle cx="30" cy="28" r="10" fill="#cf684a" />
      <path
        d="M6 30H54L47 53H13Z"
        fill="#ebc675"
        stroke="#986b22"
        strokeWidth="2"
      />
      <path
        d="M17 33L20 49M30 33V49M43 33L40 49"
        stroke="#986b22"
        strokeWidth="2"
      />
    </svg>
  );
}
export function BasketAmount({
  tiles,
  unit,
  count,
  label,
}: {
  tiles: number[];
  unit: number;
  count: number;
  label: string;
}) {
  return (
    <figure
      className="pv-baskets"
      aria-label={`${label}, ${number(count)}바구니`}
    >
      <figcaption>
        {label}
        <strong>
          {number(count)}
          <small> 바구니</small>
        </strong>
      </figcaption>
      <div className="pv-groceries" aria-hidden="true">
        {tiles.map((fill, i) => (
          <div className="pv-grocery" key={i}>
            <div className="pv-ghost">
              <GroceryIcon />
            </div>
            <div
              className="pv-filled"
              style={{ "--crop": `${(1 - fill) * 100}%` } as CSSProperties}
            >
              <GroceryIcon />
            </div>
          </div>
        ))}
      </div>
      <p>기호 1개 = {unit}바구니 · 부분 채움도 구매 가능량에 포함</p>
    </figure>
  );
}
const primerFrames = projectPurchasingPower({
  ...inflationDefaults,
  years: 1,
  rate: 0,
  inflation: 5,
});
export function InflationPrimer() {
  const [year, setYear] = useState(1);
  const scene = purchasingScene(primerFrames, year);
  const [before, current] = [primerFrames[0], scene.frame];
  return (
    <figure
      className="pv-figure pv-primer"
      aria-label="같은 지폐와 달라지는 구매량 비교"
    >
      <div className="pv-kicker">01 / 돈은 그대로인데</div>
      <h3>지폐는 한 장도 사라지지 않았어요</h3>
      <p>
        ‘지금의 가격’만 바꿔 보세요. 같은 구성의 한 바구니가 비싸지면, 같은
        10만원으로 담을 수 있는 양이 줄어듭니다.
      </p>
      <div
        className="pv-toggle"
        role="group"
        aria-label="도입 그림의 가격 시점"
      >
        <button aria-pressed={year === 0} onClick={() => setYear(0)}>
          0년 가격
        </button>
        <button aria-pressed={year === 1} onClick={() => setYear(1)}>
          5% 오른 1년 가격
        </button>
      </div>
      <div className="pv-shop-pair">
        {[before, current].map((f, i) => (
          <div className={`pv-shop ${i === 1 ? "pv-shop-now" : ""}`} key={i}>
            <b>{i === 0 ? "비교 기준 · 0년" : `${year}년 · 지금의 가격`}</b>
            <div
              className="pv-notes"
              aria-label="1만원권 10장, 현금 10만원 유지"
            >
              {Array.from({ length: 10 }, (_, n) => (
                <span key={n} aria-hidden="true">
                  1만
                </span>
              ))}
            </div>
            <p className="pv-money-label">
              같은 현금 <strong>{won(scene.base)}</strong>
            </p>
            <div className="pv-price-ticket">
              <span>이 돈으로 살 때 ↓</span>
              <b>한 바구니 {won(f.basketCost)}</b>
            </div>
            <BasketAmount
              label={i === 0 ? "처음 살 수 있던 양" : "지금 살 수 있는 양"}
              tiles={i === 0 ? scene.baselineTiles : scene.cashTiles}
              count={f.fixedBaskets}
              unit={scene.unit}
            />
          </div>
        ))}
      </div>
      <p className="pv-insight" role="status">
        {year === 1
          ? "돈의 액수는 같고, 구매량은 10 → 약 9.52바구니. 통장에서 출금된 돈은 없습니다."
          : "가격이 같으니 두 쪽 모두 10바구니를 살 수 있습니다."}
      </p>
      <figcaption>
        자체 가상 사례 · 이자는 없는 현금 비교 · 바구니의 구성·품질은 동일하며
        나누어 살 수 있다고 가정합니다. 지폐는 금액 단위의 그림이며 실제 현금
        거래를 실행하지 않습니다.
      </figcaption>
    </figure>
  );
}
export function InflationComparison({ scene: s }: { scene: Scene }) {
  const row = (label: string, amount: number, type: string) => (
    <div className="pv-meter-row">
      <div className="pv-meter-label">
        <span>{label}</span>
        <b>{won(amount)}</b>
      </div>
      <div className="pv-meter" aria-hidden="true">
        <span
          className={`pv-meter-fill ${type}`}
          style={{ width: `${(amount / s.scaleMax) * 100}%` }}
        />
        <i style={{ left: `${(s.base / s.scaleMax) * 100}%` }} />
      </div>
    </div>
  );
  return (
    <figure
      className="pv-figure pv-comparison"
      aria-label="같은 양에 필요한 돈과 예금 잔액 비교"
    >
      <div className="pv-kicker">02 / 같은 양을 지키려면</div>
      <h3>처음의 {number(s.goalCount)}바구니, 지금도 살 수 있을까요?</h3>
      <p>
        <b>{s.frame.year}년 후 연말</b> · 처음과 같은 {number(s.goalCount)}
        바구니를 사는 데 필요한 돈과 지금 예금을 비교합니다.
      </p>
      <div className="pv-meters">
        {row(
          `같은 ${number(s.goalCount)}바구니에 필요한 돈`,
          s.targetCost,
          "pv-needed",
        )}
        {row("현재 예금 잔액", s.frame.nominal, "pv-account")}
      </div>
      <div className="pv-meter-legend">
        <span className="pv-needed">주황: 같은 양의 현재 가격</span>
        <span className="pv-account">초록: 현재 예금</span>
        <span>점선: 처음의 10만원</span>
      </div>
      <div className={`pv-gap pv-gap-${s.verdict}`} role="status">
        <strong>
          {s.verdict === "same"
            ? "같은 양을 살 돈이 정확히 있습니다."
            : s.verdict === "down"
              ? `같은 양을 사려면 ${won(-s.gap)}이 더 필요합니다.`
              : `같은 양을 사고도 ${won(s.gap)}이 남습니다.`}
        </strong>
        <span>
          {s.verdict === "down"
            ? "이 차액은 같은 양을 사는 데 부족한 돈이며, 실제 계좌 출금액을 뜻하지 않습니다."
            : s.verdict === "up"
              ? "이 여유는 같은 양을 산다고 가정한 차액이며, 실제 구매를 실행한 것은 아닙니다."
              : "물가와 수익률이 같으면, 잔액이 늘어도 살 수 있는 양은 유지됩니다."}
        </span>
      </div>
      <figcaption>
        두 막대는 같은 원 단위·같은 눈금을 사용합니다. 전체 관찰 기간에 눈금을
        고정하며 조건을 바꾸면 새로 계산합니다. 구매량·실질금액·그래프·표는 같은
        연말 상태를 보여 줍니다.
      </figcaption>
    </figure>
  );
}

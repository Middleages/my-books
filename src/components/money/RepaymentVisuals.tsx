import { useEffect, useState } from "react";
import {
  projectRepayment,
  repaymentDefaults,
  repaymentKinds,
  type RepaymentKind,
  type RepaymentResult,
  type RepaymentRow,
} from "../../simulations/money/repayment.mjs";
import "./repayment.css";
export const repaymentLabels: Record<RepaymentKind, string> = {
  equalPrincipal: "원금균등",
  annuity: "원리금균등",
  bullet: "만기일시상환",
};
export const won = (n: number) =>
  `${n.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}원`;
export function PaymentBar({
  row,
  scale,
}: {
  row: RepaymentRow;
  scale: number;
}) {
  return (
    <div className="repay-payment">
      <div className="repay-stack" aria-hidden="true">
        <span
          className="repay-principal"
          style={{ width: `${(row.principal / scale) * 100}%` }}
        />
        <span
          className="repay-interest"
          style={{ width: `${(row.interest / scale) * 100}%` }}
        />
      </div>
      <p>
        <b>원금 {won(row.principal)}</b> + 이자 {won(row.interest)}
        <br />= 납입 {won(row.payment)}
      </p>
    </div>
  );
}
export function RepaymentPrimer() {
  const r = projectRepayment({
      ...repaymentDefaults,
      principal: 3000000,
      annualRate: 12,
      months: 3,
    }),
    row = r.paths.equalPrincipal.rows[0];
  return (
    <figure className="repay-primer">
      <figcaption>
        <b>300만원을 3개월에 원금균등으로 · 명목연율 12%</b>
      </figcaption>
      <div className="repay-fork">
        <div>
          월초 빚<br />
          <strong>{won(row.opening)}</strong>
        </div>
        <span aria-hidden="true">→</span>
        <div>
          <PaymentBar row={row} scale={row.payment} />
        </div>
        <span aria-hidden="true">→</span>
        <div>
          월말 빚<br />
          <strong>{won(row.closing)}</strong>
        </div>
      </div>
      <p>
        초록 원금은 빚을 줄이고, 빗금 이자는 빌린 비용을 냅니다. 103만원이
        나가도 빚은 100만원만 줄어듭니다.
      </p>
      <p className="money-caption">
        월율 1% × 월초 300만원 = 이자 3만원. 월말 전액 납입 가정, 세금·수수료
        등은 제외합니다. 화살표는 계산 순서이며 금액의 크기가 아닙니다.
      </p>
    </figure>
  );
}
function useChartWidth() {
  const [compact, setCompact] = useState(
    () => window.matchMedia("(max-width:650px)").matches,
  );
  useEffect(() => {
    const q = window.matchMedia("(max-width:650px)");
    const update = () => setCompact(q.matches);
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  return compact ? 320 : 610;
}
const colors = ["#176553", "#3754a0", "#9b4c15"],
  dashes = ["", "9 4", "2 4"];
export function RepaymentLine({
  result,
  metric,
  month,
}: {
  result: RepaymentResult;
  metric: "closing" | "cumulativeInterest" | "cumulativePayment";
  month: number;
}) {
  const width = useChartWidth(),
    end = width - 36,
    plot = end - 74;
  const n = result.paths.annuity.rows.length;
  const title = {
    closing: "남은 원금",
    cumulativeInterest: "누적 이자 납부",
    cumulativePayment: "누적 납입",
  }[metric];
  const initial =
    metric === "closing" ? result.paths.annuity.rows[0].opening : 0;
  const max = Math.max(
    1,
    initial,
    ...repaymentKinds.flatMap((k) =>
      result.paths[k].rows.map((r) => r[metric]),
    ),
  );
  const x = (m: number) => 74 + (m / n) * plot,
    y = (v: number) => 180 - (v / max) * 135;
  return (
    <figure className="repay-chart">
      <figcaption>{title} · 월말 예정 값</figcaption>
      <svg
        viewBox={`0 0 ${width} 220`}
        role="img"
        aria-label={`${title}, 세 방식의 전체 ${n}개월 비교. 정확한 값은 아래 표에 제공.`}
      >
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1="74"
              x2={end}
              y1={y(t * max)}
              y2={y(t * max)}
              stroke="#dce2df"
            />
            <text x="68" y={y(t * max) + 4} textAnchor="end">
              {((t * max) / 10000).toLocaleString("ko-KR", {
                maximumFractionDigits: 1,
              })}
            </text>
          </g>
        ))}
        <text x="8" y="20">
          만원
        </text>
        <line
          x1={x(month)}
          x2={x(month)}
          y1="40"
          y2="180"
          stroke="#555"
          strokeDasharray="3 3"
        />
        {repaymentKinds.map((k, i) => (
          <polyline
            key={k}
            points={[
              [0, initial],
              ...result.paths[k].rows.map((r) => [r.month, r[metric]]),
            ]
              .map(([m, v]) => `${x(m)},${y(v)}`)
              .join(" ")}
            fill="none"
            stroke={colors[i]}
            strokeWidth="3"
            strokeDasharray={dashes[i]}
          />
        ))}
        <text x="74" y="207">
          0개월
        </text>
        <text x={end} y="207" textAnchor="end">
          {n}개월
        </text>
      </svg>
      <p className="repay-legend">━━ 원금균등 · ┄ 원리금균등 · ··· 만기일시</p>
      <p className="money-caption">
        세 방식은 같은 눈금. 선은 월말 점을 이은 것이며 일별 경로가 아닙니다.
        세로 점선은 관찰 월의 월말 위치이며, 현재 단계의 잔액은 위 카드에
        표시합니다. 0금리·0원금·1개월에서는 선이 겹칠 수 있습니다.
      </p>
    </figure>
  );
}
export function RepaymentComposition({
  rows,
  month,
}: {
  rows: RepaymentRow[];
  month: number;
}) {
  const width = useChartWidth(),
    end = width - 36,
    plot = end - 74;
  const max = Math.max(1, ...rows.map((r) => r.payment)),
    n = rows.length;
  return (
    <figure className="repay-chart">
      <figcaption>선택 방식의 월 납입 구성 · 전체 {n}개월</figcaption>
      <svg
        viewBox={`0 0 ${width} 235`}
        role="img"
        aria-label="매월 원금과 이자를 쌓은 막대. 초록 원금, 빗금 이자. 표에서 매월 값 확인 가능."
      >
        <defs>
          <pattern
            id="repay-hatch"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
          >
            <rect width="6" height="6" fill="#f0c97c" />
            <path d="M0 6L6 0" stroke="#976615" />
          </pattern>
        </defs>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1="74"
              x2={end}
              y1={190 - 145 * t}
              y2={190 - 145 * t}
              stroke="#dce2df"
            />
            <text x="68" y={194 - 145 * t} textAnchor="end">
              {((max * t) / 10000).toLocaleString("ko-KR", {
                maximumFractionDigits: 1,
              })}
            </text>
          </g>
        ))}
        <text x="8" y="20">
          만원
        </text>
        {rows.map((r) => {
          const x = 74 + ((r.month - 1) / n) * plot,
            w = (plot / n) * 0.85;
          return (
            <g key={r.month}>
              <rect
                x={x}
                y={190 - (r.principal / max) * 145}
                width={w}
                height={(r.principal / max) * 145}
                fill="#176553"
              />
              <rect
                x={x}
                y={190 - (r.payment / max) * 145}
                width={w}
                height={(r.interest / max) * 145}
                fill="url(#repay-hatch)"
              />
            </g>
          );
        })}
        <line
          x1={74 + ((month - 0.5) / n) * plot}
          x2={74 + ((month - 0.5) / n) * plot}
          y1="35"
          y2="194"
          stroke="#182c29"
          strokeDasharray="3 3"
        />
        <text x="74" y="217">
          1개월
        </text>
        <text x={end} y="217" textAnchor="end">
          {n}개월
        </text>
      </svg>
      <p>초록 = 원금 · 빗금 = 이자 · 합친 높이 = 월 납입액</p>
      <p className="money-caption">
        이 구성 그래프의 세로 눈금은 선택 방식에 맞춰 바뀝니다. 방식 간 크기는
        위의 같은 달 비교 카드 또는 전체 표로 비교하세요. 긴 기간에서는 막대가
        촘촘하므로 월 선택과 표를 함께 사용하세요.
      </p>
    </figure>
  );
}

import {
  creditDefaults,
  projectCredit,
  type CreditFrame,
  type CreditResult,
  type CreditRow,
} from "../../simulations/money/credit.mjs";
import "./credit.css";
export const creditWon = (n: number) =>
  `${(Math.abs(n) < 0.0000001 ? 0 : n).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}원`;
export const creditStatus = {
  room: "정해 둔 예비여유를 넘겨 남음",
  "no-extra": "예비여유를 남기면 추가 여유 0",
  "reserve-gap": "정해 둔 예비여유에 못 미침",
  "cash-gap": "월수입만으로 지출·납입액 부족",
};
const colors = ["#577a9c", "#846297", "#276951", "#a2572a", "#b7a26c"];
export function CreditAllocation({
  frame: f,
  row,
  scale,
  label,
}: {
  frame: CreditFrame;
  row: CreditRow;
  scale: number;
  label: string;
}) {
  const parts: [string, number][] = [
    ["생활비", f.living],
    ["기존 납입", f.existing],
    ["새 대출 원금", f.principal],
    ["새 대출 이자", f.interest],
    ["남기려는 예비여유", f.reserve],
  ];
  return (
    <section className="credit-allocation">
      <h3>
        {label} · {f.month}개월
      </h3>
      <p>
        이달 명목연율 {row.rate}% · 세후 월수입 가정 {creditWon(row.income)}
      </p>
      <figure>
        <figcaption>단계별로 반영한 월 예산 · 길이 = 금액</figcaption>
        <div className="credit-bar-heading">
          <span>월수입</span>
          <b>{creditWon(f.income)}</b>
        </div>
        <div className="credit-stack credit-income">
          <span style={{ width: `${(f.income / scale) * 100}%` }} />
        </div>
        <div className="credit-bar-heading">
          <span>지출·납입 + 남기려는 돈</span>
          <b>{creditWon(f.totalUse)}</b>
        </div>
        <div
          className="credit-stack"
          role="img"
          aria-label={`월수입 ${creditWon(f.income)}, 단계에 반영한 지출·납입과 예비여유 합 ${creditWon(f.totalUse)}. 검은 선은 월수입 기준.`}
        >
          {parts.map(([name, value], i) => (
            <span
              key={name}
              className={i === 4 ? "credit-reserve" : ""}
              style={{
                width: `${(value / scale) * 100}%`,
                backgroundColor: colors[i],
              }}
            />
          ))}
          <i style={{ left: `${(f.income / scale) * 100}%` }} />
        </div>
        <p className="credit-caption">
          검은 선은 월수입 기준, 빗금은 지출이 아닌 예비여유입니다. 막대가 선을
          넘으면 계획한 돈이 월수입보다 많습니다. 두 시나리오·모든 단계의 눈금은
          같습니다.
        </p>
      </figure>
      <dl className="credit-parts">
        {parts.map(([name, value], i) => (
          <div key={name}>
            <dt>
              <i style={{ background: colors[i] }} />
              {name}
            </dt>
            <dd>{creditWon(value)}</dd>
          </div>
        ))}
      </dl>
      <div className="credit-cash">
        <p>
          지출·납입 후 현금 <b>{creditWon(f.cash)}</b>
        </p>
        <p>
          예비여유를 제외한 추가 여유{" "}
          <b>
            {f.phase === "compare"
              ? creditWon(f.margin)
              : "마지막 단계에서 비교"}
          </b>
        </p>
      </div>
      <p className="credit-caption">
        새 대출 예정 원금 잔액 {creditWon(f.scheduledRemaining)} · 모두 예정대로
        상환한다고 가정한 값입니다. 부족한 달의 실제 납부·연체·추가 차입을
        실행한 잔액이 아닙니다.
      </p>
    </section>
  );
}
export function CreditPrimer() {
  const result = projectCredit(creditDefaults),
    month = creditDefaults.changeMonth;
  const a = result.baseline.rows[month - 1],
    b = result.changed.rows[month - 1];
  const scale = Math.max(
    a.payment + creditDefaults.reserve,
    b.payment + creditDefaults.reserve,
    creditDefaults.income - creditDefaults.living - creditDefaults.existing,
  );
  const budget =
    creditDefaults.income - creditDefaults.living - creditDefaults.existing;
  return (
    <figure className="credit-primer">
      <figcaption>
        같은 대출 {creditWon(creditDefaults.principal)}, 달라지는 월 예산
      </figcaption>
      <p>
        세후 수입에서 생활비와 기존 납입을 빼면 {creditWon(budget)}. 여기서 새
        대출을 내고 예비여유 {creditWon(creditDefaults.reserve)}을 남기려
        합니다.
      </p>
      <div className="credit-primer-pair">
        {[
          ["처음 조건 유지", a],
          ["금리가 바뀐 조건", b],
        ].map(([name, item]) => {
          const row = item as CreditRow;
          return (
            <section key={name as string}>
              <h3>{name as string}</h3>
              <p>
                {month}개월 · 연율 {row.rate}%
              </p>
              <div
                className="credit-mini-bar"
                role="img"
                aria-label={`원금 ${creditWon(row.principal)}, 이자 ${creditWon(row.interest)}, 예비여유 ${creditWon(row.reserve)}, 비교할 가용액 ${creditWon(budget)}`}
              >
                <span style={{ width: `${(row.principal / scale) * 100}%` }} />
                <span style={{ width: `${(row.interest / scale) * 100}%` }} />
                <span
                  className="credit-reserve"
                  style={{ width: `${(row.reserve / scale) * 100}%` }}
                />
                <i style={{ left: `${(budget / scale) * 100}%` }} />
              </div>
              <p>
                원금 {creditWon(row.principal)}
                <br />+ 이자 {creditWon(row.interest)}
                <br />+ 남기려는 돈 {creditWon(row.reserve)}
              </p>
              <strong>
                {creditStatus[row.status]}
                <br />
                {creditWon(row.margin)}
              </strong>
            </section>
          );
        })}
      </div>
      <p>
        초록: 원금, 갈색: 이자, 빗금: 남겨둘 돈. 검은 선: 생활비·기존 납입 뒤
        가용액. 두 그림은 같은 눈금이며 실험과 같은 모델을 읽습니다. 대출
        승인·한도를 계산한 그림이 아닙니다.
      </p>
    </figure>
  );
}
export function CreditChart({
  result,
  month,
  changeMonth,
}: {
  result: CreditResult;
  month: number;
  changeMonth: number;
}) {
  const values = [...result.baseline.rows, ...result.changed.rows].map(
    (r) => r.margin,
  );
  const min = Math.min(0, ...values),
    max = Math.max(0, ...values),
    span = Math.max(1, max - min);
  const magnitude = Math.max(Math.abs(min), Math.abs(max)),
    unit = magnitude >= 1e8 ? 1e8 : magnitude >= 1e4 ? 1e4 : 1,
    unitLabel = unit === 1e8 ? "억원" : unit === 1e4 ? "만원" : "원";
  const left = magnitude / unit >= 1000 ? 85 : 54;
  const x = (m: number) =>
      left + ((m - 1) / Math.max(1, result.horizon - 1)) * (332 - left),
    y = (v: number) => 184 - ((v - min) / span) * 144;
  return (
    <figure className="credit-chart">
      <figcaption>전체 관찰 기간의 ‘예비여유를 뺀 추가 여유’ 비교</figcaption>
      <svg
        viewBox="0 0 360 250"
        role="img"
        aria-label={`가로축 개월, 세로축 ${unitLabel}. 실선 처음 조건, 점선 변경 조건. 0 아래는 정해둔 예비여유까지 확보하기에 부족한 계획. 정확한 값은 아래 표 참조.`}
      >
        {[...new Set([min, 0, max])].map((v) => (
          <g key={v}>
            <line
              x1={left}
              x2="332"
              y1={y(v)}
              y2={y(v)}
              stroke={v === 0 ? "#7c8981" : "#d1ddd5"}
            />
            <text x={left - 6} y={y(v) + 4} textAnchor="end">
              {(v / unit).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}
            </text>
          </g>
        ))}
        <text x="6" y="20">
          {unitLabel}
        </text>
        {(
          [
            ["baseline", "#276951", ""],
            ["changed", "#a2572a", "7 4"],
          ] as const
        ).map(([key, color, dash]) => (
          <g key={key}>
            <path
              d={result[key].rows
                .map((r, i) => `${i ? "L" : "M"}${x(r.month)},${y(r.margin)}`)
                .join(" ")}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeDasharray={dash}
            />
            {result.horizon === 1 && (
              <circle
                cx={x(1)}
                cy={y(result[key].rows[0].margin)}
                r="4"
                fill={color}
              />
            )}
          </g>
        ))}
        {changeMonth <= result.horizon && (
          <line
            x1={x(changeMonth)}
            x2={x(changeMonth)}
            y1="34"
            y2="190"
            stroke="#65669c"
            strokeDasharray="3 4"
          />
        )}
        {month > 0 && (
          <line
            x1={x(month)}
            x2={x(month)}
            y1="194"
            y2="205"
            stroke="#243f37"
            strokeWidth="4"
          />
        )}
        {[...new Set([1, Math.ceil(result.horizon / 2), result.horizon])].map(
          (n) => (
            <text key={n} x={x(n)} y="223" textAnchor="middle">
              {n}
            </text>
          ),
        )}
        <text x="332" y="246" textAnchor="end">
          납입 월
        </text>
      </svg>
      <p className="credit-caption">
        실선 초록: 처음 조건 · 점선 갈색: 변경 조건 · 세로 점선: 변경 시작{" "}
        {changeMonth}개월. 세로축은 {unitLabel}(금액 범위에 따라 단위 전환).
        아래 굵은 표시는 관찰 월입니다. 그래프는 각 월 계획의 완성값을 미리
        보여주며 월중 단계의 현금과 다릅니다. 선이 겹치면 표로 구분하세요.
        음수는 실제 연체나 자동 대출을 뜻하지 않습니다.
      </p>
    </figure>
  );
}

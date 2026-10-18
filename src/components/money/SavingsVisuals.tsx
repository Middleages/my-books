import {
  projectSavings,
  savingsDefaults,
  type SavingsFrame,
  type SavingsParams,
  type SavingsResult,
} from "../../simulations/money/savings.mjs";
import "./savings.css";
export const savingsWon = (n: number) => `${n.toLocaleString("ko-KR")}원`;
export function SavingsFunding({
  available,
  locked,
  target,
  scale,
  label,
}: {
  available: number;
  locked: number;
  target: number;
  scale: number;
  label: string;
}) {
  const unit = Math.max(1, scale);
  return (
    <figure className="savings-funding">
      <figcaption>{label}</figcaption>
      <div className="savings-money-labels">
        <span>
          사용 가능 <b>{savingsWon(available)}</b>
        </span>
        <span>
          묶인 돈 <b>{savingsWon(locked)}</b>
        </span>
      </div>
      <div
        className="savings-stack"
        role="img"
        aria-label={`사용 가능 ${savingsWon(available)}, 묶인 돈 ${savingsWon(locked)}, 목표 ${savingsWon(target)}. 막대 길이는 금액.`}
      >
        <span
          className="savings-accessible"
          style={{ width: `${(available / unit) * 100}%` }}
        />
        <span
          className="savings-locked"
          style={{ width: `${(locked / unit) * 100}%` }}
        />
        <i style={{ left: `${(target / unit) * 100}%` }} />
      </div>
      <p>
        검은 기준선: 목표 {savingsWon(target)} · 단색: 사용 가능 · 빗금: 아직
        꺼낼 수 없음
      </p>
    </figure>
  );
}
export function SavingsPrimer() {
  const late = projectSavings(savingsDefaults).due;
  const early = projectSavings({
    ...savingsDefaults,
    releaseMonth: savingsDefaults.dueMonth,
  }).due;
  const scale = Math.max(
    1,
    late.totalBefore,
    early.totalBefore,
    savingsDefaults.target,
  );
  return (
    <figure className="savings-primer">
      <figcaption>
        같은 {savingsWon(late.totalBefore)}인데, {savingsDefaults.dueMonth}개월
        말에 {savingsWon(savingsDefaults.target)}을 쓸 수 있을까요?
      </figcaption>
      <div className="savings-compare">
        <section>
          <h3>{savingsDefaults.releaseMonth}개월 초에 풀리는 돈</h3>
          <SavingsFunding
            available={late.availableBefore}
            locked={late.lockedBefore}
            target={savingsDefaults.target}
            scale={scale}
            label={`${savingsDefaults.dueMonth}개월 말 · 목표 지출 직전`}
          />
          <strong>사용 가능액 {savingsWon(late.shortfall)} 부족</strong>
        </section>
        <section>
          <h3>{savingsDefaults.dueMonth}개월 초에 풀리는 돈</h3>
          <SavingsFunding
            available={early.availableBefore}
            locked={early.lockedBefore}
            target={savingsDefaults.target}
            scale={scale}
            label={`${savingsDefaults.dueMonth}개월 말 · 목표 지출 직전`}
          />
          <strong>전액 지출 가능 · 부족 {savingsWon(early.shortfall)}</strong>
        </section>
      </div>
      <p>
        시작 준비금 {savingsWon(savingsDefaults.initial)} 중{" "}
        {savingsWon(savingsDefaults.locked)}이 묶여 있고, 매월 말{" "}
        {savingsWon(savingsDefaults.payment)}씩 {savingsDefaults.dueMonth}번
        적립했습니다. 두 경우의 총액·납입액·수익률(0%)은 같습니다. 달라진 것은
        꺼낼 수 있는 시점뿐입니다. 두 그림은 같은 눈금이며 실험과 같은 모델을
        사용합니다.
      </p>
    </figure>
  );
}
export function SavingsChart({
  p,
  result,
  month,
}: {
  p: SavingsParams;
  result: SavingsResult;
  month: number;
}) {
  const max = Math.max(1, p.target, ...result.rows.map((r) => r.totalBefore));
  const unit = max >= 100000000 ? 100000000 : max >= 10000 ? 10000 : 1;
  const unitLabel =
    unit === 100000000 ? "억원" : unit === 10000 ? "만원" : "원";
  const x = (m: number) => 52 + (m / result.horizon) * 280,
    y = (v: number) => 185 - (v / max) * 145;
  return (
    <figure className="savings-chart">
      <figcaption>매월 납입 후, 그달 목표 지출 직전의 금액</figcaption>
      <svg
        viewBox="0 0 360 245"
        role="img"
        aria-label={`가로축 개월, 세로축 ${unitLabel}. 실선 사용 가능액, 점선 전체 잔액. 정적 표에 모든 월의 값이 있습니다.`}
      >
        {[0, 0.5, 1].map((n) => (
          <g key={n}>
            <line
              x1="52"
              x2="332"
              y1={y(n * max)}
              y2={y(n * max)}
              stroke="#d1ddd5"
            />
            <text x="46" y={y(n * max) + 4} textAnchor="end">
              {((n * max) / unit).toLocaleString("ko-KR", {
                maximumFractionDigits: 1,
              })}
            </text>
          </g>
        ))}
        <text x="6" y="20">
          {unitLabel}
        </text>
        <path
          d={result.rows
            .map((r, i) => `${i ? "L" : "M"}${x(r.month)},${y(r.totalBefore)}`)
            .join(" ")}
          stroke="#88602a"
          strokeWidth="3"
          strokeDasharray="6 4"
          fill="none"
        />
        <path
          d={result.rows
            .map(
              (r, i) => `${i ? "L" : "M"}${x(r.month)},${y(r.availableBefore)}`,
            )
            .join(" ")}
          stroke="#216750"
          strokeWidth="2.5"
          fill="none"
        />
        <line
          x1={x(p.dueMonth)}
          x2={x(p.dueMonth)}
          y1="32"
          y2="190"
          stroke="#a43e25"
          strokeWidth="2"
        />
        <line
          x1={x(p.releaseMonth)}
          x2={x(p.releaseMonth)}
          y1="32"
          y2="190"
          stroke="#5b62a1"
          strokeDasharray="3 4"
        />
        <circle
          cx={x(p.dueMonth)}
          cy={y(p.target)}
          r="5"
          fill="#fff"
          stroke="#a43e25"
          strokeWidth="2"
        />
        <line
          x1={x(month)}
          x2={x(month)}
          y1="195"
          y2="205"
          stroke="#243f37"
          strokeWidth="5"
        />
        {[0, Math.floor(result.horizon / 2), result.horizon].map((n) => (
          <text key={n} x={x(n)} y="224" textAnchor="middle">
            {n}
          </text>
        ))}
        <text x="332" y="242" textAnchor="end">
          시작 후 개월
        </text>
      </svg>
      <div className="savings-chart-key">
        <span>━ 초록: 사용 가능</span>
        <span>┄ 갈색: 전체</span>
        <span>│ 빨강: 목표 {p.dueMonth}개월</span>
        <span>·· 파랑: 풀림 {p.releaseMonth}개월</span>
        <span>○ 목표액 {savingsWon(p.target)}</span>
      </div>
      <p>
        0개월 시작 · 세로축 {unitLabel}(금액 범위에 따라 전환). 실제 관찰 중인
        월은 아래쪽 굵은 표시입니다. 그래프는 월별 고정 관찰값이며 월중 단계
        중간값과 구분합니다. 선은 관찰 시점끼리 연결하며 월중 경로를 재현하지
        않습니다. 목표를 지급한 경우 다음 달부터 그 지출이 반영되어 선이 내려갈
        수 있습니다. 같은 달 사건은 월초 풀림 → 월말 납입 → 목표 지출
        순서입니다.
      </p>
    </figure>
  );
}
export function SavingsWallet({
  p,
  frame,
  result,
}: {
  p: SavingsParams;
  frame: SavingsFrame;
  result: SavingsResult;
}) {
  const scale = Math.max(1, p.target, ...result.frames.map((f) => f.total));
  return (
    <section className="savings-wallet" aria-label="현재 준비금 구성">
      <h3>지금 남아 있는 돈</h3>
      <SavingsFunding
        available={frame.available}
        locked={frame.locked}
        target={p.target}
        scale={scale}
        label={`${frame.month}개월 · 현재 총액 ${savingsWon(frame.total)}`}
      />
      <p>
        같은 조건의 모든 관찰 단계에 같은 눈금. 이후 목표 지출이 끝나면 검은
        선은 원래 목표액을 나타내는 비교 기준으로 남습니다.
      </p>
      <div className="savings-ledger">
        <p>
          시작 준비금 <b>{savingsWon(p.initial)}</b>
        </p>
        <p>
          + 추가 적립 누계 <b>{savingsWon(frame.added)}</b>
        </p>
        <p>
          − 목표 지출 누계 <b>{savingsWon(frame.paid)}</b>
        </p>
        <p>
          = 현재 총액 <b>{savingsWon(frame.total)}</b>
        </p>
      </div>
    </section>
  );
}

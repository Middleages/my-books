import { totals } from "../../simulations/money/transactions.mjs";
import { money, signed } from "./shared";
type Wallet = {
  living: number;
  reserve: number;
  other: number;
  loan: number;
  card: number;
  income: number;
  spending: number;
  interest: number;
};
export function WalletMap({
  wallet,
  scale = 2000,
}: {
  wallet: Wallet;
  scale?: number;
}) {
  const t = totals(wallet);
  return (
    <figure className="wallet-map">
      <figcaption>돈의 지도 · 같은 길이는 같은 금액 (단위: 만원)</figcaption>
      <div className="wallet-equation">
        <div>
          <small>내가 가진 것</small>
          <strong>자산 {money(t.assets)}</strong>
          <div
            className="wallet-bar"
            style={{ width: `${(100 * t.assets) / scale}%` }}
          >
            <i style={{ flex: wallet.living }} />
            <i style={{ flex: wallet.reserve }} />
            <i style={{ flex: wallet.other }} />
          </div>
          <p>
            생활 {money(wallet.living)}
            <br />
            목적 {money(wallet.reserve)}
            <br />
            다른 자산 {money(wallet.other)}
          </p>
        </div>
        <b aria-hidden="true">−</b>
        <div>
          <small>갚을 의무</small>
          <strong>부채 {money(t.debt)}</strong>
          <div
            className="wallet-bar debt"
            style={{ width: `${(100 * t.debt) / scale}%` }}
          />
          <p>
            대출 {money(wallet.loan)}
            <br />
            카드 {money(wallet.card)}
          </p>
        </div>
        <b aria-hidden="true">=</b>
        <div>
          <small>둘의 차이</small>
          <strong>순자산 {money(t.net)}</strong>
          <div
            className={`wallet-bar net ${t.net < 0 ? "negative" : ""}`}
            style={{ width: `${(100 * Math.abs(t.net)) / scale}%` }}
          />
          <p>
            {t.net < 0
              ? "부채가 자산보다 큽니다. 음수 길이는 부채 초과분의 크기입니다."
              : "빚을 빼고 남는 몫입니다. 별도의 통장은 아닙니다."}
          </p>
        </div>
      </div>
      <p className="money-caption">
        세 막대는 각각 같은 최대 척도를 씁니다. 초록 순자산은 자산에 더하는
        항목이 아닙니다.
      </p>
    </figure>
  );
}
export function WalletTable({
  before,
  after,
}: {
  before: Wallet;
  after: Wallet;
}) {
  const a = totals(before),
    b = totals(after);
  const rows: [string, number, number][] = [
    ["생활통장", before.living, after.living],
    ["목적통장", before.reserve, after.reserve],
    ["총자산", a.assets, b.assets],
    ["대출채무", before.loan, after.loan],
    ["카드채무", before.card, after.card],
    ["순자산", a.net, b.net],
    ["누적 수입", before.income, after.income],
    ["누적 소비·이자 비용", before.spending, after.spending],
  ];
  return (
    <div className="money-table">
      <table>
        <caption>거래 전과 현재 확정 잔액 · 단위: 만원</caption>
        <thead>
          <tr>
            <th>항목</th>
            <th>전</th>
            <th>현재</th>
            <th>변화</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, a, b]) => (
            <tr key={label}>
              <th>{label}</th>
              <td>{a.toLocaleString()}</td>
              <td>{b.toLocaleString()}</td>
              <td>{signed(b - a)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

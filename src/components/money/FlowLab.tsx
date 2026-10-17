import { useState } from "react";
import {
  initialWallet,
  scenarios,
  transactionFrames,
  totals,
} from "../../simulations/money/transactions.mjs";
import {
  money,
  Slider,
  Prediction,
  PredictionResult,
  usePlayback,
} from "./shared";
import { WalletTable } from "./WalletView";
export function FlowLab() {
  const [id, setId] = useState("card"),
    [amount, setAmount] = useState(50),
    [prediction, predict] = useState("");
  const frames = transactionFrames(initialWallet, id, amount),
    play = usePlayback(frames.length - 1),
    f = frames[play.step] ?? frames[0],
    t = totals(f.wallet);
  const change = () => {
    play.rewind();
    predict("");
  };
  return (
    <section className="money-lab" aria-label="돈의 이동 실험">
      <div className="money-lab-heading">
        <span>02 / 돈의 이동 극장</span>
        <h2>통장에서 나갔다고 모두 소비일까?</h2>
        <p>
          화살표는 거래 한 건의 방향입니다. 카드 구매의 화살표는 현금 출금이
          아닌 채무 발생을 뜻합니다.
        </p>
      </div>
      <label className="money-select">
        관찰할 사건
        <select
          value={id}
          onChange={(e) => {
            change();
            setId(e.target.value);
          }}
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <ol className="money-timeline">
        {frames.map((v, i) => (
          <li key={i}>
            <button
              aria-current={play.step === i ? "step" : undefined}
              onClick={() => play.seek(i)}
            >
              {i} · {v.label}
            </button>
          </li>
        ))}
      </ol>
      <div
        className={`money-route ${f.phase === "moving" ? "is-moving" : ""} ${!play.playing ? "is-paused" : ""}`}
      >
        <span>{f.path[0]}</span>
        <div className="money-route-track">
          <b className="money-token">{money(amount)} →</b>
        </div>
        <span>{f.path[1]}</span>
      </div>
      <div className="money-pockets">
        {[
          ["생활통장", f.wallet.living],
          ["목적통장", f.wallet.reserve],
          ["카드채무", f.wallet.card],
          ["대출채무", f.wallet.loan],
        ].map(([name, n]) => (
          <div key={name}>
            <small>{name}</small>
            <strong>{money(Number(n))}</strong>
          </div>
        ))}
      </div>
      <p className="money-status" role="status">
        {f.label} · {f.note}{" "}
        {f.phase === "moving" ? "금액은 다음 확정 단계에서 반영합니다." : ""}
      </p>
      {play.controls}
      <Prediction value={prediction} onChange={predict} />
      <Slider
        label="거래 금액"
        value={amount}
        max={300}
        onChange={(n) => {
          change();
          setAmount(n);
        }}
      />
      {play.step === frames.length - 1 && (
        <PredictionResult
          prediction={prediction}
          delta={t.net - totals(initialWallet).net}
        />
      )}
      <WalletTable before={initialWallet} after={f.wallet} />
      <div className="note">
        <strong>소비 시점과 현금 이동 시점은 다릅니다.</strong>
        <p>
          이 실험은 소비가 발생한 때 비용을 기록합니다. 카드 결제는 채무
          상환입니다. 현금흐름용 가계부에서 결제일 출금을 보더라도 구매 소비와
          합산해 두 번 세지 않습니다.
        </p>
      </div>
      <p className="money-caption">
        사례마다 같은 최초 잔액으로 시작합니다. 즉시 소모되는 서비스·소비재
        구매, 무이자 일시불 카드 전액 결제만 가정합니다. 자산으로 남는
        물건·할부·연체·수수료·세금·미지급 이자는 제외합니다. 이자는 이 단계에서
        발생하고 바로 납부하는 별도 정액 사례이며 실제 금리 계산이 아닙니다.
      </p>
      <button
        onClick={() => {
          change();
          setId("card");
          setAmount(50);
        }}
      >
        모든 조건 초기화
      </button>
    </section>
  );
}

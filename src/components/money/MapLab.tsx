import { useState } from "react";
import {
  initialWallet,
  totals,
  transactionFrames,
} from "../../simulations/money/transactions.mjs";
import {
  money,
  Slider,
  Prediction,
  PredictionResult,
  usePlayback,
} from "./shared";
import { WalletMap, WalletTable } from "./WalletView";
export function MapLab() {
  const [start, setStart] = useState(initialWallet),
    [amount, setAmount] = useState(200),
    [prediction, predict] = useState("");
  const play = usePlayback(2),
    frames = transactionFrames(start, "borrow", amount),
    f = frames[play.step];
  const reset = () => {
    play.rewind();
    predict("");
  };
  return (
    <section className="money-lab" aria-label="돈의 지도 실험">
      <div className="money-lab-heading">
        <span>01 / 직접 보는 돈</span>
        <h2>빌린 돈이 입금되면 부자가 될까?</h2>
        <p>
          막대는 구성과 차이를 나타냅니다. 대출액과 처음의 자산 구성을 바꿀 수
          있습니다.
        </p>
      </div>
      <WalletMap wallet={f.wallet} scale={3000} />
      <div
        className={`money-route ${f.phase === "moving" ? "is-moving" : ""} ${!play.playing ? "is-paused" : ""}`}
      >
        <span>{f.path[0]}</span>
        <div className="money-route-track">
          <b className="money-token">{money(amount)} →</b>
        </div>
        <span>{f.path[1]}</span>
      </div>
      <p className="money-status" role="status">
        {f.label} · {f.note}
      </p>
      {play.controls}
      <Prediction value={prediction} onChange={predict} />
      <Slider
        label="입금될 대출금"
        value={amount}
        max={1000}
        onChange={(v) => {
          reset();
          setAmount(v);
        }}
      />
      <div className="money-presets">
        <button
          onClick={() => {
            reset();
            setStart(initialWallet);
          }}
        >
          기본 가정
        </button>
        <button
          onClick={() => {
            reset();
            setStart({
              ...initialWallet,
              living: 100,
              reserve: 0,
              other: 0,
              loan: 300,
            });
          }}
        >
          부채가 더 큰 가정
        </button>
      </div>
      <Slider
        label="처음의 다른 자산"
        value={start.other}
        max={1000}
        onChange={(v) => {
          reset();
          setStart({ ...start, other: v });
        }}
      />
      {play.step === 2 && (
        <PredictionResult
          prediction={prediction}
          delta={totals(f.wallet).net - totals(start).net}
        />
      )}
      <WalletTable before={start} after={f.wallet} />
      <p className="money-caption">
        다른 자산 슬라이더는 거래가 아니라 시작 가정을 바꿉니다. 차입
        비용·세금·평가 변동은 0으로 두었습니다. 대출 입금은 돈을 벌어들인 사건이
        아닙니다.
      </p>
      <button
        onClick={() => {
          reset();
          setStart(initialWallet);
          setAmount(200);
        }}
      >
        모든 조건 초기화
      </button>
    </section>
  );
}

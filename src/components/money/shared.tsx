import { useEffect, useState } from "react";
export const money = (n: number) =>
  `${n.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}만원`;
export const signed = (n: number) => `${n > 0 ? "+" : ""}${money(n)}`;
export function usePlayback(last: number) {
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    if (step >= last) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(
      () => setStep((n) => Math.min(last, n + 1)),
      1600,
    );
    return () => clearTimeout(id);
  }, [step, playing, last]);
  const rewind = () => {
    setPlaying(false);
    setStep(0);
  };
  return {
    step,
    playing,
    rewind,
    seek: (n: number) => {
      setPlaying(false);
      setStep(n);
    },
    controls: (
      <div className="money-playback" aria-label="과정 제어">
        <button onClick={() => setPlaying((p) => !p)} disabled={step === last}>
          {playing ? "정지" : "재생"}
        </button>
        <button
          onClick={() => {
            setPlaying(false);
            setStep((n) => Math.min(last, n + 1));
          }}
          disabled={step === last}
        >
          한 단계 진행
        </button>
        <button onClick={rewind}>처음부터</button>
        <span>
          {step} / {last} 단계
        </span>
      </div>
    ),
  };
}
export function Slider({
  label,
  value,
  min = 0,
  max,
  step = 10,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="money-slider">
      <span>
        {label}
        <strong>{money(value)}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
export function Prediction({
  value,
  onChange,
  question = "순자산은 어떻게 될까요?",
}: {
  value: string;
  onChange: (v: string) => void;
  question?: string;
}) {
  return (
    <fieldset className="money-prediction">
      <legend>먼저 예측 · {question}</legend>
      {[
        ["up", "늘어난다"],
        ["same", "그대로다"],
        ["down", "줄어든다"],
      ].map(([v, t]) => (
        <label key={v}>
          <input
            type="radio"
            name={question}
            value={v}
            checked={value === v}
            onChange={() => onChange(v)}
          />
          {t}
        </label>
      ))}
    </fieldset>
  );
}
export function PredictionResult({
  prediction,
  delta,
}: {
  prediction: string;
  delta: number;
}) {
  return (
    <p className="money-answer">
      {prediction
        ? prediction === (delta > 0 ? "up" : delta < 0 ? "down" : "same")
          ? "예측과 일치합니다."
          : "예측과 달랐습니다. 바뀐 자산과 부채를 각각 확인해 보세요."
        : "다시 보기에서는 결과를 먼저 예측해 보세요."}{" "}
      순자산 변화: <strong>{signed(delta)}</strong>
    </p>
  );
}
export function Sources({ items }: { items: [string, string][] }) {
  return (
    <section className="sources">
      <h2>근거와 모델의 경계</h2>
      <p>
        확인일: 2026-10-17. 아래 공식 기관의 금융교육 자료에서 원리를
        확인했습니다. 해외 자료의 세법·상품 규칙을 한국에 적용하지 않습니다.
        그림·계산은 이 원리에 따른 자체 가상 사례입니다.
      </p>
      <ul>
        {items.map(([label, url]) => (
          <li key={url}>
            <a href={url} target="_blank" rel="noreferrer">
              {label} ↗
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

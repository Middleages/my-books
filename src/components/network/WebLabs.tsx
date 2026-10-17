import { useState } from "react";
import { requestTrace } from "../../simulations/network/web.mjs";
function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <label>
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}
export function RequestLab() {
  const [scenario, setScenario] = useState("healthy");
  const [path, setPath] = useState("/report");
  const [host, setHost] = useState("app.example.test");
  const [prediction, setPrediction] = useState("");
  const [step, setStep] = useState(0);
  const steps = requestTrace(scenario, path, host);
  const reset = () => {
    setStep(0);
    setPrediction("");
  };
  const last = steps.at(-1)!;
  const result = last.stage === "HTTP 응답" ? "http" : last.stage.toLowerCase();
  return (
    <section className="route-lab" aria-label="HTTP 요청 추적">
      <h2>실험 · 어디까지 도착했을까?</h2>
      <p>
        새 연결로{" "}
        <code>
          {scenario === "tls" ? "https" : "http"}://app.example.test{path}
          ?day=today#summary
        </code>
        를 요청합니다.
      </p>
      <div className="route-controls">
        <Choice
          label="요청 사례"
          value={scenario}
          onChange={(v) => {
            setScenario(v);
            reset();
          }}
          options={[
            ["healthy", "정상 서버"],
            ["dns", "이름 없음"],
            ["refused", "TCP 리스너 없음"],
            ["server", "서버 처리 오류"],
            ["tls", "HTTPS · 신뢰 CA 없음"],
          ]}
        />
        <Choice
          label="요청 경로"
          value={path}
          onChange={(v) => {
            setPath(v);
            reset();
          }}
          options={[
            ["/report", "/report"],
            ["/missing", "/missing"],
          ]}
        />
        <Choice
          label="HTTP Host"
          value={host}
          onChange={(v) => {
            setHost(v);
            reset();
          }}
          options={[
            ["app.example.test", "app.example.test"],
            ["other.example.test", "other.example.test"],
          ]}
        />
      </div>
      <label className="lab-predict">
        마지막으로 관찰할 단계는?
        <select
          aria-label="요청 도착 예측"
          value={prediction}
          disabled={step > 0}
          onChange={(e) => setPrediction(e.target.value)}
        >
          <option value="">단계 선택</option>
          <option value="dns">DNS에서 중단</option>
          <option value="tcp">TCP에서 중단</option>
          <option value="tls">TLS에서 중단</option>
          <option value="http">HTTP 응답 수신</option>
        </select>
      </label>
      <div className="lab-actions">
        <button
          className="primary"
          disabled={!prediction || step === steps.length}
          onClick={() => setStep((v) => v + 1)}
        >
          한 단계 진행
        </button>
        <button className="secondary" onClick={reset}>
          처음부터
        </button>
        <span>
          {step} / {steps.length}단계
        </span>
      </div>
      <div className="route-evidence" aria-live="polite">
        {step === 0 ? (
          <p>예측한 뒤 요청의 길을 한 단계씩 따라가세요.</p>
        ) : (
          <>
            <h3>
              {steps[step - 1].stage} ·{" "}
              {steps[step - 1].ok ? "관찰 완료" : "중단"}
            </h3>
            <pre>{steps[step - 1].known}</pre>
            <p>{steps[step - 1].detail}</p>
            <p>
              <strong>아직 모르는 것:</strong> {steps[step - 1].unknown}
            </p>
            {step === steps.length && (
              <p>
                {prediction === result
                  ? "예측과 일치합니다."
                  : "예측과 달랐습니다."}{" "}
                {result === "http"
                  ? "오류 상태 코드도 HTTP 응답입니다."
                  : "HTTP 응답을 받은 상태가 아닙니다."}
              </p>
            )}
          </>
        )}
      </div>
      <details>
        <summary>지금까지의 기록</summary>
        <ol>
          {steps.slice(0, step).map((s) => (
            <li key={s.stage}>
              {s.stage}: {s.known}
            </li>
          ))}
        </ol>
      </details>
      <p className="model-note">
        교육용 시뮬레이션 · 직접 접속, HTTP/1.1, 새 TCP 연결을 가정합니다. HTTPS
        사례만 TLS 실패 단계를 포함합니다. 실제 요청·캐시·연결
        재사용·HTTP/3·프록시는 재현하지 않습니다. Host 선택은 진단용 독립
        조작이며 일반 브라우저 주소창 동작과 다릅니다.
      </p>
    </section>
  );
}

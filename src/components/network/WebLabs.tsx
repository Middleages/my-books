import { useState } from "react";
import {
  certificatePreset,
  certificateResult,
  environments,
  requestTrace,
} from "../../simulations/network/web.mjs";
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
export function CertificateLab({ advanced = false }: { advanced?: boolean }) {
  const [config, setConfig] = useState(() =>
    certificatePreset(advanced ? "untrusted" : "chain"),
  );
  const [scenario, setScenario] = useState(advanced ? "untrusted" : "chain");
  const [prediction, setPrediction] = useState("");
  const [ran, setRan] = useState(false);
  const change = (patch: Partial<typeof config>) => {
    setConfig((c) => ({ ...c, ...patch }));
    setRan(false);
    setPrediction("");
  };
  const env = config.environment as keyof typeof config.trust;
  const r = certificateResult({ ...config, trusted: config.trust[env] });
  return (
    <section
      className="route-lab"
      aria-label={advanced ? "인증서 진단 실험" : "fullchain 조립 실험"}
    >
      <h2>
        {advanced
          ? "실험 · 실패한 환경에서 하나씩 고치기"
          : "실험 · fullchain을 조립해 보자"}
      </h2>
      <p>
        가상 발급 관계:{" "}
        <strong>Demo Root CA → Demo Issuing CA → 서버 인증서</strong>. 화살표는
        발급·서명 관계입니다. 이름만 같은 인증서를 임의로 붙인다는 뜻이
        아닙니다.
      </p>
      {advanced && (
        <div className="route-controls">
          <Choice
            label="인증서 오류 사례"
            value={scenario}
            onChange={(v) => {
              setScenario(v);
              setConfig(certificatePreset(v));
              setPrediction("");
              setRan(false);
            }}
            options={[
              ["untrusted", "Python에 신뢰 CA 없음"],
              ["chain", "중간 CA 누락"],
              ["name", "도메인 인증서에 IP 접속"],
              ["expired", "인증서 만료"],
              ["future", "유효기간 시작 전"],
              ["sni", "다른 SNI의 인증서"],
              ["multiple", "이름·체인·신뢰 모두 실패"],
              ["healthy", "정상 기준"],
            ]}
          />
          <Choice
            label="접속 대상 이름"
            value={config.target}
            onChange={(v) => change({ target: v })}
            options={[
              ["app.example.test", "app.example.test"],
              ["192.0.2.10", "192.0.2.10 · IP 직접 접속"],
            ]}
          />
          <Choice
            label="TLS SNI"
            value={config.sni}
            onChange={(v) => change({ sni: v })}
            options={[
              ["app", "app.example.test"],
              ["other", "other.example.test"],
            ]}
          />
          <Choice
            label="가상 검증 날짜"
            value={config.date}
            onChange={(v) => change({ date: v })}
            options={[
              ["2026-06-15", "2026-06-15 · 기간 내"],
              ["2025-12-15", "2025-12-15 · 시작 전"],
              ["2027-01-15", "2027-01-15 · 만료 후"],
            ]}
          />
        </div>
      )}
      <div className="certificate-panels">
        <section>
          <h3>서버가 보내는 묶음</h3>
          <p>서버 인증서는 항상 맨 앞에 있습니다.</p>
          <label className="check-control">
            <input
              type="checkbox"
              checked={config.intermediate}
              onChange={(e) => change({ intermediate: e.target.checked })}
            />
            중간 CA 인증서 포함
          </label>
          <label className="check-control">
            <input
              type="checkbox"
              checked={config.rootSent}
              onChange={(e) => change({ rootSent: e.target.checked })}
            />
            루트 CA도 서버에서 전송
          </label>
          <ol className="cert-stack">
            {r.bundle.map((x, i) => (
              <li key={x}>
                <b>
                  {i === 0
                    ? "서버 · leaf"
                    : x.includes("Issuing")
                      ? "중간 CA"
                      : "루트 CA"}
                </b>
                <span>{x}</span>
              </li>
            ))}
          </ol>
          <p className="model-note">
            일반적인 fullchain = leaf + 필요한 중간 CA. 루트는 보통 보내지
            않습니다. 이 묶음에 개인키는 없습니다.
          </p>
        </section>
        <section>
          <h3>클라이언트가 따로 가진 신뢰 목록</h3>
          <Choice
            label="검증 환경"
            value={config.environment}
            onChange={(v) => change({ environment: v })}
            options={Object.entries(environments) as [string, string][]}
          />
          <label className="check-control">
            <input
              type="checkbox"
              checked={config.trust[env]}
              onChange={(e) =>
                change({ trust: { ...config.trust, [env]: e.target.checked } })
              }
            />
            현재 환경에서 Demo Root CA 신뢰
          </label>
          {advanced && (
            <label className="check-control">
              <input
                type="checkbox"
                checked={config.cachedIntermediate}
                onChange={(e) =>
                  change({ cachedIntermediate: e.target.checked })
                }
              />
              중간 CA를 캐시에서 찾을 수 있음
            </label>
          )}
          <p>
            이 예제의 초기 설정: 브라우저·호스트는 이 CA를 신뢰하고,
            Python·컨테이너·프록시는 신뢰하지 않습니다. 실제 제품의 기본값이
            아닙니다.
          </p>
          <p className="model-note">
            체크박스는 가상 상태만 바꿉니다. 실제 신뢰 설정은 검증된 CA와 승인된
            배포 절차가 필요합니다. 캐시 선택은 현재 실행 사례의 가정이며 환경별
            실제 캐시를 재현하지 않습니다.
          </p>
        </section>
      </div>
      {!advanced && (
        <p>
          고정 조건: 접속/SNI app.example.test, SAN DNS:app.example.test, 검증
          날짜 2026-06-15, 유효기간 2026-01-01~12-31(UTC).
        </p>
      )}
      <label className="lab-predict">
        지금 조건이면 검증을 통과할까요?
        <select
          aria-label="인증서 검증 예측"
          value={prediction}
          onChange={(e) => {
            setPrediction(e.target.value);
            setRan(false);
          }}
        >
          <option value="">예측 선택</option>
          <option value="yes">통과</option>
          <option value="no">실패</option>
        </select>
      </label>
      <div className="lab-actions">
        <button
          className="primary"
          disabled={!prediction}
          onClick={() => setRan(true)}
        >
          인증서 검증
        </button>
        <button
          className="secondary"
          onClick={() => {
            setConfig(certificatePreset(scenario));
            setPrediction("");
            setRan(false);
          }}
        >
          사례 초기화
        </button>
      </div>
      <div className="route-evidence" aria-live="polite">
        {ran ? (
          <>
            <h3>
              {r.ok
                ? "검증 통과 · HTTP 요청 가능"
                : "검증 실패 · HTTP 요청 전 중단"}
            </h3>
            <p>
              {(prediction === "yes") === r.ok
                ? "예측과 일치합니다."
                : "예측과 달랐습니다."}
            </p>
            <ul className="validation-list">
              {r.checks.map((c) => (
                <li key={c.id}>
                  <strong>
                    {c.ok ? "✓ 통과" : "× 실패"} · {c.label}
                  </strong>
                  <p>{c.evidence}</p>
                  {!c.ok && (
                    <p>
                      <b>수정할 곳:</b> {c.fix}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <p>
              {r.ok
                ? "이 모델의 네 조건을 만족했습니다. 앱 응답과 사용자 권한은 다음 확인 대상입니다."
                : "실패 항목을 하나씩 수정하고 다시 예측하세요. 한 문제를 해결해도 다른 실패가 남을 수 있습니다."}
            </p>
          </>
        ) : (
          <p>
            묶음과 신뢰 목록을 비교한 뒤 예측하세요. 서버에서 루트를 보내는 것과
            클라이언트가 신뢰하는 것은 다른 선택입니다.
          </p>
        )}
      </div>
      <p className="model-note">
        교육용 시뮬레이션 · 고정된 CA 발급 관계와 정상 서명·개인키 소유 증명,
        중간 CA의 유효성을 가정합니다. 이름은 SAN DNS의 정확한 일치만 다룹니다.
        IP SAN·와일드카드·폐기 확인·교차서명·제약조건·암호 알고리즘·실제 X.509
        파싱은 범위 밖입니다. 날짜는 가상 UTC 날짜이며 실제 검증 순서나 오류
        문구를 재현하지 않습니다.
      </p>
    </section>
  );
}

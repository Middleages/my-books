import { useState } from "react";
import {
  proxyResult,
  dockerResult,
  corsResult,
} from "../../simulations/network/operations.mjs";
type Options = [string, string][];
function Select({
  label,
  value,
  options,
  change,
}: {
  label: string;
  value: string;
  options: Options;
  change: (v: string) => void;
}) {
  return (
    <label>
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => change(e.target.value)}
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
function Toggle({
  label,
  value,
  change,
}: {
  label: string;
  value: boolean;
  change: (v: boolean) => void;
}) {
  return (
    <label className="check-control">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => change(e.target.checked)}
      />
      {label}
    </label>
  );
}
function Run({
  prediction,
  setPrediction,
  run,
  reset,
  options,
}: {
  prediction: string;
  setPrediction: (v: string) => void;
  run: () => void;
  reset: () => void;
  options: Options;
}) {
  return (
    <>
      <Select
        label="결과 예측"
        value={prediction}
        options={[["", "결과를 먼저 예측하세요"], ...options]}
        change={setPrediction}
      />
      <div className="lab-actions">
        <button className="primary" disabled={!prediction} onClick={run}>
          결과 확인
        </button>
        <button className="secondary" onClick={reset}>
          처음부터
        </button>
      </div>
    </>
  );
}
function Verdict({ correct }: { correct: boolean }) {
  return (
    <p className="prediction-result">
      {correct
        ? "예측과 일치합니다."
        : "예측과 달랐습니다. 아래 증거를 비교하세요."}
    </p>
  );
}
export function ProxyLab() {
  const initial = {
    host: "portal",
    path: "/api/items",
    strip: true,
    fault: "none",
    upstreamTls: true,
    trusted: true,
  };
  const [s, set] = useState(initial),
    [prediction, predict] = useState(""),
    [shown, show] = useState(false);
  const change = (patch: Partial<typeof initial>) => {
    set({ ...s, ...patch });
    predict("");
    show(false);
  };
  const r = proxyResult(s);
  return (
    <section
      className="route-lab operations-lab"
      aria-label="리버스 프록시 실험"
    >
      <h2>실험 · 같은 443, 다른 앱</h2>
      <p>
        두 이름은 같은 IP를 가리킵니다. 외부 TLS는 정상이며, API 앱에는 /items만
        있습니다.
      </p>
      <div className="route-controls">
        <Select
          label="도메인"
          value={s.host}
          options={[
            ["portal", "portal.example.test"],
            ["reports", "reports.example.test"],
          ]}
          change={(v) => change({ host: v })}
        />
        <Select
          label="요청 경로"
          value={s.path}
          options={[
            ["/api/items", "/api/items"],
            ["/", "/"],
          ]}
          change={(v) => change({ path: v })}
        />
        <Select
          label="upstream 상태"
          value={s.fault}
          options={[
            ["none", "정상 리스너·응답"],
            ["refused", "리스너 없음"],
            ["timeout", "연결 후 응답 멈춤"],
          ]}
          change={(v) => change({ fault: v })}
        />
      </div>
      <Toggle
        label="/api/ 접두사를 /로 치환"
        value={s.strip}
        change={(v) => change({ strip: v })}
      />
      <Toggle
        label="upstream도 HTTPS 사용"
        value={s.upstreamTls}
        change={(v) => change({ upstreamTls: v })}
      />
      <Toggle
        label="프록시가 upstream CA를 신뢰"
        value={s.trusted}
        change={(v) => change({ trusted: v })}
      />
      <Run
        prediction={prediction}
        setPrediction={predict}
        options={["200", "404", "502", "504"].map((v) => [v, `HTTP ${v}`])}
        run={() => show(true)}
        reset={() => {
          set(initial);
          predict("");
          show(false);
        }}
      />
      {shown && (
        <div className="route-evidence" aria-live="polite">
          <Verdict correct={prediction === r.code} />
          <h3>
            HTTP {r.code} · {r.app}
          </h3>
          <ol>
            {r.steps.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <p>
            <strong>다음 확인:</strong> {r.next}
          </p>
        </div>
      )}
      <p className="lab-limit">
        교육용 시뮬레이션 · 고정된 두 도메인과 prefix 규칙입니다. 실제 Nginx
        설정 파서가 아니며 재시도·캐시·정규식 location은 생략합니다. 오류 코드는
        이 사례의 결과입니다.
      </p>
    </section>
  );
}
export function DockerLab() {
  const initial = {
    placement: "host",
    target: "loopback",
    publish: "loopback",
    bind: "all",
    network: true,
    allowed: true,
  };
  const [s, set] = useState(initial),
    [prediction, predict] = useState(""),
    [shown, show] = useState(false);
  const change = (patch: Partial<typeof initial>) => {
    set({ ...s, ...patch });
    predict("");
    show(false);
  };
  const r = dockerResult(s);
  const targets: Options =
    s.placement === "container"
      ? [
          ["service", "app:8000"],
          ["loopback", "127.0.0.1:8000"],
        ]
      : s.placement === "remote"
        ? [
            ["vm", "192.0.2.20:18001 (앱 VM)"],
            ["loopback", "127.0.0.1:18001"],
          ]
        : [
            ["loopback", "127.0.0.1:18001"],
            ["service", "app:8000"],
          ];
  return (
    <section className="route-lab operations-lab" aria-label="Docker 연결 실험">
      <h2>실험 · 프록시는 어디서 출발할까?</h2>
      <p>
        앱은 bridge 컨테이너 안의 TCP 8000을 사용합니다. 프록시에서 앱까지의 한
        구간을 시험합니다.
      </p>
      <div className="route-controls">
        <Select
          label="프록시 위치"
          value={s.placement}
          options={[
            ["host", "같은 VM의 호스트"],
            ["container", "같은 VM의 컨테이너"],
            ["remote", "다른 VM"],
          ]}
          change={(v) =>
            change({
              placement: v,
              target:
                v === "container"
                  ? "service"
                  : v === "remote"
                    ? "vm"
                    : "loopback",
            })
          }
        />
        <Select
          label="프록시의 접속 대상"
          value={s.target}
          options={targets}
          change={(v) => change({ target: v })}
        />
        <Select
          label="앱 publish"
          value={s.publish}
          options={[
            ["none", "없음"],
            ["loopback", "127.0.0.1:18001 → 8000"],
            ["all", "0.0.0.0:18001 → 8000"],
          ]}
          change={(v) => change({ publish: v })}
        />
        <Select
          label="앱 listen 주소"
          value={s.bind}
          options={[
            ["all", "0.0.0.0:8000"],
            ["loopback", "127.0.0.1:8000"],
          ]}
          change={(v) => change({ bind: v })}
        />
      </div>
      {s.placement === "container" && (
        <Toggle
          label="같은 사용자 정의 bridge 네트워크"
          value={s.network}
          change={(v) => change({ network: v })}
        />
      )}
      {s.placement === "remote" && (
        <Toggle
          label="원격 프록시 출발지의 경로·방화벽 허용"
          value={s.allowed}
          change={(v) => change({ allowed: v })}
        />
      )}
      <Run
        prediction={prediction}
        setPrediction={predict}
        options={[
          ["yes", "앱까지 연결"],
          ["no", "연결 실패"],
        ]}
        run={() => show(true)}
        reset={() => {
          set(initial);
          predict("");
          show(false);
        }}
      />
      {shown && (
        <div className="route-evidence" aria-live="polite">
          <Verdict correct={(prediction === "yes") === r.ok} />
          <h3>{r.ok ? "연결 성공" : "연결 실패"}</h3>
          <p>
            <strong>이 배치의 의도한 경로:</strong> {r.path}
          </p>
          <p>{r.why}</p>
          <p>
            <strong>다음 확인:</strong> {r.next}
          </p>
        </div>
      )}
      <p className="lab-limit">
        교육용 시뮬레이션 · Linux Docker Engine 28 이상, IPv4 사용자 정의
        bridge의 기본 NAT 구성을 가정합니다. 앱 외 리스너는 없고, 표시한 조건 외
        경로는 정상입니다. host network·직접 라우팅·Docker Desktop은 별도
        구성입니다.
      </p>
    </section>
  );
}
export function CorsLab() {
  const initial = {
    target: "cross",
    kind: "get",
    allowOrigin: "none",
    allowPreflight: false,
    credentials: false,
    allowCredentials: false,
  };
  const [s, set] = useState(initial),
    [prediction, predict] = useState(""),
    [shown, show] = useState(false);
  const change = (patch: Partial<typeof initial>) => {
    set({ ...s, ...patch });
    predict("");
    show(false);
  };
  const r = corsResult(s);
  const outcome = !r.sent ? "unsent" : r.readable ? "read" : "blocked";
  return (
    <section
      className="route-lab operations-lab"
      aria-label="브라우저 정책 실험"
    >
      <h2>실험 · 요청은 갔을까, 응답은 읽힐까?</h2>
      <p>
        페이지는 https://portal.example.test입니다. 서버는 도착한 본 요청을 정상
        처리합니다.
      </p>
      <div className="route-controls">
        <Select
          label="API 목적지"
          value={s.target}
          options={[
            ["cross", "다른 origin · HTTPS api.example.test"],
            ["same", "같은 origin · /api/items"],
            ["http", "다른 origin · HTTP api.example.test"],
          ]}
          change={(v) => change({ target: v })}
        />
        <Select
          label="fetch 요청"
          value={s.kind}
          options={[
            ["get", "GET · 추가 헤더 없음"],
            ["json", "POST · application/json"],
          ]}
          change={(v) => change({ kind: v })}
        />
        <Select
          label="서버 Allow-Origin"
          value={s.allowOrigin}
          options={[
            ["none", "없음"],
            ["exact", "https://portal.example.test"],
            ["star", "*"],
          ]}
          change={(v) => change({ allowOrigin: v })}
        />
      </div>
      <Toggle
        label="OPTIONS가 POST·Content-Type을 허용"
        value={s.allowPreflight}
        change={(v) => change({ allowPreflight: v })}
      />
      <Toggle
        label="fetch credentials: include"
        value={s.credentials}
        change={(v) => change({ credentials: v })}
      />
      <Toggle
        label="서버 Allow-Credentials: true"
        value={s.allowCredentials}
        change={(v) => change({ allowCredentials: v })}
      />
      <Run
        prediction={prediction}
        setPrediction={predict}
        options={[
          ["unsent", "본 요청을 보내지 않음"],
          ["blocked", "서버 처리 후 JS 읽기 차단"],
          ["read", "서버 처리 후 JS 읽기 허용"],
        ]}
        run={() => show(true)}
        reset={() => {
          set(initial);
          predict("");
          show(false);
        }}
      />
      {shown && (
        <div className="route-evidence" aria-live="polite">
          <Verdict correct={prediction === outcome} />
          <h3>{r.stage}</h3>
          <div className="operation-facts">
            <p>
              본 요청 전송: <strong>{r.sent ? "예" : "아니요"}</strong>
            </p>
            <p>
              JS 응답 읽기: <strong>{r.readable ? "허용" : "차단"}</strong>
            </p>
          </div>
          <ol>
            {r.steps.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <p>
            <strong>다음 확인:</strong> {r.next}
          </p>
        </div>
      )}
      <p className="lab-limit">
        교육용 시뮬레이션 · 실제 fetch는 하지 않습니다. 캐시 없는 새 요청, 정상
        DNS·TCP·TLS, 동일한 OPTIONS/본 응답 CORS 설정을 가정합니다.
        리다이렉트·쿠키 전송 정책·CSP·서비스 워커·로컬 네트워크 접근 정책은 모델
        밖입니다.
      </p>
    </section>
  );
}

import { useState } from "react";
import {
  httpJourney,
  corsJourney,
} from "../../simulations/network/browser-visual.mjs";
import type {
  HttpState,
  CorsState,
  CorsFrame,
  HttpFrame,
} from "../../simulations/network/browser-visual.mjs";
import { Playback, useFoundationPlayback } from "./FoundationPlayback";
import {
  OperationScene,
  OperationNodeCard,
  ConnectionFields,
} from "./OperationScene";
import { Choice, Switch, Predict } from "./ConnectionVisuals";
import "./operation-visuals.css";
import "./browser-visuals.css";
function JourneyExplanation({
  frame: f,
  index,
}: {
  frame: HttpFrame | CorsFrame;
  index: number;
}) {
  return (
    <div className="ov-explanation" aria-live="polite" aria-atomic="true">
      <h3>
        {index + 1}. {f.title}
      </h3>
      <p>{f.detail}</p>
      {f.connection ? (
        <ConnectionFields connection={f.connection} />
      ) : (
        <p>이 단계에 새 네트워크 메시지 전송 없음</p>
      )}
    </div>
  );
}
const httpInitial: HttpState = {
  scheme: "https",
  scenario: "healthy",
  path: "/report",
  host: "app.example.test",
};
export function HttpVisual() {
  const [s, set] = useState(httpInitial),
    [prediction, predict] = useState("");
  const j = httpJourney(s),
    p = useFoundationPlayback(j.frames.length),
    f = j.frames[p.index];
  const change = (patch: Partial<HttpState>) => {
    p.reset();
    predict("");
    set((x) => ({ ...x, ...patch }));
  };
  const reset = () => {
    p.reset();
    predict("");
    set(httpInitial);
  };
  return (
    <section className="ov-lab bv-lab" aria-label="HTTP 요청 여행 시각 실험">
      <p className="ov-eyebrow">07 · URL → CONNECTION → MESSAGE</p>
      <h2>같은 주소를 단계마다 다르게 읽는다</h2>
      <p>
        선 위 표시는 현재 단계의 정보가 가는 방향입니다. 선 길이·재생 간격은
        실제 시간이나 패킷 수가 아닙니다. 이름 조회 실패와 HTTP 오류 응답을
        비교해 보세요.
      </p>
      <code className="bv-url">{j.url}</code>
      <div className="bv-parts" aria-label="URL 구성과 현재 쓰이는 부분">
        {j.parts.map((part) => (
          <div
            key={part.id}
            className={part.phases.includes(f.phase) ? "bv-highlight" : ""}
          >
            <small>{part.label}</small>
            <code>{part.value}</code>
          </div>
        ))}
      </div>
      <Playback player={p} count={j.frames.length} reset={reset} />
      <ol className="bv-stages" aria-label="요청 진행 순서">
        {j.stages.map((phase) => (
          <li
            key={phase}
            aria-current={f.phase === phase ? "step" : undefined}
            className={f.phase === phase ? "bv-highlight" : ""}
          >
            {phase}
            {f.phase === phase ? " · 현재" : ""}
          </li>
        ))}
      </ol>
      <OperationScene
        frame={f}
        playing={p.playing}
        kind="http"
        edges={[
          ["browser", "resolver"],
          ["browser", "server"],
        ]}
      >
        <div className="ov-boundary bv-browser">
          <b>사용자 PC · 새 연결</b>
          <OperationNodeCard
            node={{
              id: "browser",
              name: "브라우저",
              address: "198.51.100.30",
              zone: "URL 해석 · TLS 검증 · 응답 수신",
            }}
            frame={f}
          >
            <strong>DNS: {f.dns}</strong>
            <strong>TCP: {f.tcp}</strong>
            <strong>TLS: {f.tls}</strong>
            <span>HTTP 요청: {f.requestSent ? "전송됨" : "아직 안 보냄"}</span>
            <span>수신 HTTP 상태: {f.responseCode ?? "없음"}</span>
          </OperationNodeCard>
        </div>
        <div className="bv-services">
          <OperationNodeCard
            node={{
              id: "resolver",
              name: "DNS 리졸버",
              address: "192.0.2.53:53",
              zone: "A 조회 · 이름 → IP",
            }}
            frame={f}
          />
          <OperationNodeCard
            node={{
              id: "server",
              name: "HTTP 서비스",
              address: `192.0.2.10:${j.port}`,
              zone: "TCP 접점 · HTTPS이면 TLS 먼저",
            }}
            frame={f}
          >
            <span>
              URL 이름 / HTTPS의 SNI: <code>{j.sni}</code>
            </span>
            <span>
              HTTP Host 진단값: <code>{j.host}</code>
            </span>
            <span>
              앱 요청 대상: <code>{j.requestTarget}</code>
            </span>
          </OperationNodeCard>
        </div>
      </OperationScene>
      <JourneyExplanation frame={f} index={p.index} />
      <div className="bv-evidence">
        <div>
          <b>여기까지 확인한 것</b>
          <p>{f.known || "URL을 분리했습니다. 연결 결과는 아직 모릅니다."}</p>
        </div>
        <div>
          <b>아직 단정할 수 없는 것</b>
          <p>
            {f.unknown || "DNS·연결·HTTP·업무 성공은 각각 확인해야 합니다."}
          </p>
        </div>
      </div>
      <details>
        <summary>모든 단계 · 움직임 없이 읽기</summary>
        <ol>
          {j.frames.map((frame) => (
            <li key={frame.id}>
              <b>{frame.title}</b>
              <p>{frame.detail}</p>
              {frame.connection && (
                <ConnectionFields connection={frame.connection} />
              )}
              <p>확인한 것: {frame.known || "연결 결과 확인 전"}</p>
              <p>
                아직 단정할 수 없는 것: {frame.unknown || "다음 단계의 결과"}
              </p>
            </li>
          ))}
        </ol>
      </details>
      <div className="ov-controls">
        <Choice
          label="접속 방식"
          value={s.scheme}
          options={[
            ["https", "HTTPS · 443"],
            ["http", "HTTP · 80"],
          ]}
          change={(scheme) =>
            change({
              scheme,
              scenario: s.scenario === "tls" ? "healthy" : s.scenario,
            })
          }
        />
        <Choice
          label="관찰할 상황"
          value={s.scenario}
          options={[
            ["healthy", "정상 경로"],
            ["dns", "DNS 이름 없음"],
            ["refused", "TCP 연결 거부"],
            ...(s.scheme === "https"
              ? ([["tls", "TLS 신뢰 CA 없음"]] as [string, string][])
              : []),
            ["server", "앱 내부 오류 · 500"],
          ]}
          change={(scenario) => change({ scenario })}
        />
        <Choice
          label="URL 경로"
          value={s.path}
          options={[
            ["/report", "/report · 존재"],
            ["/missing", "/missing · 없음"],
          ]}
          change={(path) => change({ path })}
        />
        <Choice
          label="진단 도구의 HTTP Host만 변경"
          value={s.host}
          options={[
            ["app.example.test", "app.example.test"],
            ["other.example.test", "other.example.test · 가상 서버 421"],
          ]}
          change={(host) => change({ host })}
        />
      </div>
      <Predict
        value={prediction}
        change={predict}
        options={[
          ["before", "HTTP 응답 전에 중단"],
          ["response", "HTTP 상태 응답 수신"],
        ]}
        final={p.index === j.frames.length - 1}
        outcome={j.result.outcome}
      />
      <p className="ov-note">
        가정: HTTP/1.1·IPv4·새 TCP 연결 한 개·GET, 정상 반환 경로, DNS
        캐시·프록시·리다이렉트·연결 재사용·QUIC·0-RTT 없음. TCP 연결 준비와 TLS
        협상은 요약합니다. 정상 서명·중간 CA·이름·유효기간을 가정하고 TLS 실패
        사례는 브라우저 신뢰 CA 없음입니다. HTTP Host 변경은 curl 같은 진단
        도구의 독립 설정 예이며 일반 fetch에서 Host를 직접 설정한다는 뜻이
        아닙니다. HTTP에서는 TLS 단계가 없습니다. 예시의 RST·404·421·500은 고정
        원인이며 실제 오류 코드를 원인 하나로 단정하지 않습니다.
      </p>
    </section>
  );
}
const corsInitial: CorsState = {
  target: "cross",
  kind: "get",
  allowOrigin: "none",
  allowPreflight: false,
  credentials: false,
  allowCredentials: false,
  preflightPolicy: "same",
};
function CorsFacts({ frame: f }: { frame: CorsFrame }) {
  return (
    <div className="bv-facts" aria-label="현재 단계의 전송·처리·공유 상태">
      <div>
        <b>OPTIONS 도착</b>
        <strong>{f.optionsArrived ? "예" : "아직 없음"}</strong>
      </div>
      <div>
        <b>본 요청 도착 / 처리</b>
        <strong>
          {f.mainArrived ? "도착" : "아직 없음"} /{" "}
          {f.processed ? "처리됨" : "아직 없음"}
        </strong>
      </div>
      <div>
        <b>브라우저 응답 수신</b>
        <strong>{f.responseArrived ? "예" : "아직 없음"}</strong>
      </div>
      <div>
        <b>JS 응답 읽기</b>
        <strong>{f.readable}</strong>
      </div>
    </div>
  );
}
export function CorsVisual() {
  const [s, set] = useState(corsInitial),
    [prediction, predict] = useState("");
  const j = corsJourney(s),
    p = useFoundationPlayback(j.frames.length),
    f = j.frames[p.index];
  const change = (patch: Partial<CorsState>) => {
    p.reset();
    predict("");
    set((x) => ({ ...x, ...patch }));
  };
  const reset = () => {
    p.reset();
    predict("");
    set(corsInitial);
  };
  return (
    <section className="ov-lab bv-lab" aria-label="브라우저 CORS 시각 실험">
      <p className="ov-eyebrow">12 · SENT ≠ PROCESSED ≠ READABLE</p>
      <h2>API는 처리했는데 JS는 못 읽을 수 있다</h2>
      <p>
        사용자 PC 안의 코드와 브라우저 정책 검사를 나눠 보세요. 점은 현재 정보의
        전달 방향이며 API와의 두 화살표는 요청·응답입니다. 브라우저 내부 선은
        네트워크 연결이 아닙니다.
      </p>
      <div className="bv-origins">
        <div>
          <b>페이지 origin</b>
          <code>{j.pageOrigin}</code>
          <small>https · portal.example.test · 443</small>
        </div>
        <div>
          <b>API URL / origin</b>
          <code>{j.url}</code>
          <small>{j.apiOrigin}</small>
        </div>
      </div>
      <Playback player={p} count={j.frames.length} reset={reset} />
      <OperationScene
        frame={f}
        playing={p.playing}
        kind="cors"
        edges={[
          ["js", "policy"],
          ["policy", "api"],
        ]}
      >
        <div className="ov-boundary bv-client">
          <b>사용자 PC · 브라우저 안의 두 역할</b>
          <OperationNodeCard
            node={{
              id: "js",
              name: "페이지 JavaScript",
              address: j.pageOrigin,
              zone: "fetch 호출 · 응답 사용",
            }}
            frame={f}
          >
            <strong>{f.jsValue}</strong>
          </OperationNodeCard>
          <OperationNodeCard
            node={{
              id: "policy",
              name: "브라우저 정책 검사",
              address: "mixed content / CORS",
              zone: "전송 전 검사 · 응답 공유 검사",
            }}
            frame={f}
          >
            <strong>JS 읽기: {f.readable}</strong>
            <span>
              브라우저의 본 응답 수신: {f.responseArrived ? "예" : "아직 없음"}
            </span>
          </OperationNodeCard>
        </div>
        <div className="ov-boundary bv-api">
          <b>API 서비스 · 브라우저 밖</b>
          <OperationNodeCard
            node={{
              id: "api",
              name:
                s.target === "same"
                  ? "같은 origin의 API 접점"
                  : "다른 origin의 API 접점",
              address: j.endpoint,
              zone: j.apiOrigin,
            }}
            frame={f}
          >
            <span>OPTIONS: {f.optionsArrived ? "도착" : "아직 없음"}</span>
            <strong>
              본 {j.method}: {f.processed ? "서버 처리됨" : "처리 아직 없음"}
            </strong>
            <span>
              {f.processed
                ? "이 모델의 서버는 200 응답을 만듦"
                : "본 요청 도착과 별도로 OPTIONS만 올 수 있음"}
            </span>
          </OperationNodeCard>
        </div>
      </OperationScene>
      <CorsFacts frame={f} />
      <JourneyExplanation frame={f} index={p.index} />
      {f.message && (
        <div className="bv-message">
          <b>현재 메시지 / 정책 값</b>
          <pre>{f.message}</pre>
        </div>
      )}
      <details>
        <summary>모든 단계 · 움직임 없이 읽기</summary>
        <ol>
          {j.frames.map((frame) => (
            <li key={frame.id}>
              <b>{frame.title}</b>
              <p>{frame.detail}</p>
              <CorsFacts frame={frame} />
              {frame.connection && (
                <ConnectionFields connection={frame.connection} />
              )}
              <p>JS가 보는 값: {frame.jsValue}</p>
              {frame.message && (
                <pre className="bv-message">{frame.message}</pre>
              )}
            </li>
          ))}
        </ol>
      </details>
      <div className="ov-controls">
        <Choice
          label="API 목적지"
          value={s.target}
          options={[
            ["cross", "다른 origin · HTTPS"],
            ["same", "같은 origin · /api/items"],
            ["http", "다른 origin · HTTP"],
          ]}
          change={(target) => change({ target })}
        />
        <Choice
          label="fetch 요청"
          value={s.kind}
          options={[
            ["get", "GET · 추가 헤더 없음"],
            ["json", "POST · application/json"],
          ]}
          change={(kind) => change({ kind })}
        />
        <Choice
          label="본 응답 Allow-Origin"
          value={s.allowOrigin}
          options={[
            ["none", "없음"],
            ["exact", "https://portal.example.test"],
            ["star", "*"],
          ]}
          change={(allowOrigin) => change({ allowOrigin })}
        />
        <Choice
          label="OPTIONS의 origin·credentials 정책"
          value={s.preflightPolicy}
          options={[
            ["same", "본 응답과 같은 설정"],
            ["permit", "정확한 origin + Allow-Credentials: true"],
            ["deny", "Allow-Origin 없음"],
          ]}
          change={(preflightPolicy) => change({ preflightPolicy })}
        />
      </div>
      <Switch
        label="OPTIONS가 POST·Content-Type을 허용"
        value={s.allowPreflight}
        change={(allowPreflight) => change({ allowPreflight })}
      />
      <Switch
        label="fetch credentials: include"
        value={s.credentials}
        change={(credentials) => change({ credentials })}
      />
      <Switch
        label="본 응답 Allow-Credentials: true"
        value={s.allowCredentials}
        change={(allowCredentials) => change({ allowCredentials })}
      />
      <Predict
        value={prediction}
        change={predict}
        options={[
          ["unsent", "본 요청 미전송"],
          ["blocked", "서버 처리 후 JS 읽기 차단"],
          ["read", "서버 처리 후 JS 읽기 허용"],
        ]}
        final={p.index === j.frames.length - 1}
        outcome={j.outcome}
      />
      <p className="ov-note">
        교육 모델 · 실제 fetch 없음. 캐시 없는 새 요청, 정상 DNS·TCP·TLS·서버
        200 응답을 가정합니다. 기본 OPTIONS/본 응답 정책은 같지만 따로 바꿔
        비교할 수 있습니다. preflight는 자격 증명을 싣지 않아도 이후 include
        요청의 허용을 확인합니다. include와 * 조합은 실제 쿠키 유무와 관계없이
        차단됩니다. same-origin에서는 CORS를 검사하지 않습니다. 쿠키 전송
        정책·인증·CSRF·CSP·리다이렉트·서비스 워커·HTTP 캐시·로컬 네트워크 접근
        정책·혼합 콘텐츠 자동 업그레이드는 생략합니다. 일반 원격 HTTP API
        fetch만 혼합 콘텐츠 차단으로 다룹니다.
      </p>
    </section>
  );
}

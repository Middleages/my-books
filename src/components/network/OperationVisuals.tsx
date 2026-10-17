import { useState } from "react";
import {
  proxyJourney,
  dockerJourney,
} from "../../simulations/network/operations-visual.mjs";
import type {
  ProxyState,
  DockerState,
} from "../../simulations/network/operations-visual.mjs";
import { Playback, useFoundationPlayback } from "./FoundationPlayback";
import {
  OperationScene,
  OperationNodeCard,
  OperationExplanation,
  OperationStaticFrames,
} from "./OperationScene";
import "./operation-visuals.css";

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
  change: (value: string) => void;
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
  change: (value: boolean) => void;
}) {
  return (
    <label className="ov-toggle">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => change(e.target.checked)}
      />
      {label}
    </label>
  );
}
function Prediction({
  value,
  change,
  options,
  final,
  outcome,
}: {
  value: string;
  change: (v: string) => void;
  options: Options;
  final: boolean;
  outcome: string;
}) {
  return (
    <div className="ov-prediction">
      <Select
        label="결과 예측 (선택)"
        value={value}
        options={[["", "먼저 예측해 보세요"], ...options]}
        change={change}
      />
      {final && value && (
        <p>
          {value === outcome
            ? "예측과 일치합니다."
            : "예측과 달랐습니다. 중단 위치와 조건을 비교하세요."}
        </p>
      )}
    </div>
  );
}
const proxyInitial: ProxyState = {
  host: "portal",
  path: "/api/items",
  strip: true,
  fault: "none",
  upstreamTls: true,
  trusted: true,
  browserTrusted: true,
  sni: "portal",
  authority: "portal",
};
const domains: Options = [
  ["portal", "portal.example.test"],
  ["reports", "reports.example.test"],
];
export function ProxyVisualLab() {
  const [s, set] = useState(proxyInitial),
    [prediction, predict] = useState("");
  const j = proxyJourney(s),
    player = useFoundationPlayback(j.frames.length),
    frame = j.frames[player.index];
  const change = (patch: Partial<ProxyState>) => {
    player.reset();
    predict("");
    set((old) => ({ ...old, ...patch }));
  };
  const reset = () => {
    player.reset();
    predict("");
    set(proxyInitial);
  };
  return (
    <section className="ov-lab" aria-label="리버스 프록시 시각 실험">
      <p className="ov-eyebrow">10 · TWO CONNECTIONS</p>
      <h2>한 입구, 두 연결, 세 앱</h2>
      <p>
        회색 선은 비교할 후보 경로, 초록 선과 점은 현재 구간의 연결·정보
        전달입니다. 현재 단계의 주소와 설명을 함께 읽으세요. 속도는 실제 지연을
        뜻하지 않습니다.
      </p>
      <div className="ov-dns">
        <b>DNS의 주소 안내</b>
        <code>portal.example.test → 192.0.2.10</code>
        <code>reports.example.test → 192.0.2.10</code>
        <span>두 이름 모두 같은 IP:443으로 · 경로와 앱 선택은 프록시에서</span>
      </div>
      <Playback player={player} count={j.frames.length} reset={reset} />
      <OperationScene
        frame={frame}
        playing={player.playing}
        kind="proxy"
        edges={[
          ["user", "proxy"],
          ["proxy", "web"],
          ["proxy", "api"],
          ["proxy", "reports"],
        ]}
      >
        <div className="ov-user-zone">
          <OperationNodeCard
            node={{
              id: "user",
              name: "브라우저",
              address: j.external.src,
              zone: "사용자망 · 외부",
            }}
            frame={frame}
          >
            <code>
              URL {j.domain}
              {s.path}
            </code>
          </OperationNodeCard>
        </div>
        <div className="ov-proxy-zone ov-boundary">
          <small>프록시 VM · 외부 / 내부 경계</small>
          <OperationNodeCard
            node={{
              id: "proxy",
              name: "NGINX · TLS 종료",
              address: "192.0.2.10:443",
              zone: "외부 연결 A의 서버",
            }}
            frame={frame}
          >
            <code>내부 주소 10.0.0.10</code>
            <span>새 연결 B의 클라이언트</span>
          </OperationNodeCard>
          <div className="ov-rule">
            <b>SNI → 인증서</b>
            <code>{j.certificate}</code>
            <b>HTTP Host/authority + path → 앱</b>
            <code>
              {j.authority}
              {s.path}
            </code>
          </div>
        </div>
        <div className="ov-app-zone ov-boundary">
          <small>내부 앱망 · HTTP 분기 뒤 새 연결</small>
          {j.apps.map((n) => (
            <OperationNodeCard key={n.id} node={n} frame={frame}>
              {j.appId === n.id && <strong>현재 조건의 전달 후보</strong>}
            </OperationNodeCard>
          ))}
        </div>
      </OperationScene>
      <OperationExplanation frame={frame} index={player.index} />
      <OperationStaticFrames frames={j.frames} />
      <div className="ov-tls-pair">
        {j.tls.map((t) => (
          <div key={t.name}>
            <b>{t.name}</b>
            <code>{t.certificate}</code>
            <span>신뢰 기준: {t.verifier}</span>
            <strong>{t.state}</strong>
          </div>
        ))}
      </div>
      <p className="ov-note">
        위 두 상자는 현재 설정의 검증 조건 요약입니다. 실제 연결 진행은 아래
        현재 단계에서 관찰합니다. B는 검증 on·올바른 내부 이름/SNI·체인·기간을
        가정합니다.
      </p>
      <div className="ov-controls">
        <Select
          label="URL 도메인"
          value={s.host}
          options={domains}
          change={(host) => change({ host, sni: host, authority: host })}
        />
        <Select
          label="요청 경로"
          value={s.path}
          options={[
            ["/api/items", "/api/items"],
            ["/", "/"],
          ]}
          change={(path) => change({ path })}
        />
        <Select
          label="TLS SNI"
          value={s.sni!}
          options={domains}
          change={(sni) => change({ sni })}
        />
        <Select
          label="HTTP Host/authority"
          value={s.authority!}
          options={domains}
          change={(authority) => change({ authority })}
        />
        <Select
          label="upstream 상태"
          value={s.fault}
          options={[
            ["none", "정상 리스너·응답"],
            ["refused", "리스너 없음"],
            ["timeout", "연결 후 응답 멈춤"],
          ]}
          change={(fault) => change({ fault })}
        />
      </div>
      <Toggle
        label="브라우저가 외부 CA를 신뢰"
        value={s.browserTrusted}
        change={(browserTrusted) => change({ browserTrusted })}
      />
      <Toggle
        label="upstream도 HTTPS 사용"
        value={s.upstreamTls}
        change={(upstreamTls) => change({ upstreamTls })}
      />
      <Toggle
        label="프록시가 upstream CA를 신뢰"
        value={s.trusted}
        change={(trusted) => change({ trusted })}
      />
      <Toggle
        label="/api/ 접두사를 /로 치환 (URI 있음)"
        value={s.strip}
        change={(strip) => change({ strip })}
      />
      {j.comparison[0].applies ? (
        <div className="ov-compare" aria-label="proxy_pass URI 전후 비교">
          {j.comparison.map((c) => (
            <div
              key={String(c.strip)}
              className={c.strip === s.strip ? "ov-selected" : ""}
            >
              <b>
                {c.strip ? "URI 있음 · 끝에 /" : "URI 없음 · 끝에 / 없음"}
                {c.strip === s.strip ? " · 현재 선택" : ""}
              </b>
              <code>{c.config}</code>
              <span>
                수신 <code>{s.path}</code>
              </span>
              <span>
                전달 → <code>{c.uri}</code>
              </span>
              <small>
                {c.applies
                  ? "location /api/의 접두사 치환"
                  : "이 요청은 API location 밖 · URI 치환 비교는 적용하지 않음"}
              </small>
            </div>
          ))}
        </div>
      ) : (
        <p className="ov-note">
          이 요청은 portal의 /api/ location 밖입니다. 경로 {j.uri}를 그대로
          전달하며 아래 본문의 URI 치환 예는 API 분기에만 적용합니다.
        </p>
      )}
      <Prediction
        value={prediction}
        change={predict}
        final={player.index === j.frames.length - 1}
        outcome={j.result.code}
        options={["200", "404", "502", "504", "TLS 중단"].map((c) => [c, c])}
      />
      <p className="ov-note">
        교육 모델 · IPv4/TCP, 외부 TLS 종료, 고정 도메인과 단순 prefix location.
        HTTP Host 변경은 진단용 가상 요청이며 일반 브라우저 UI로 임의 설정하는
        기능이 아닙니다. 신규 연결 두
        개·재시도/캐시/keepalive/정규식/rewrite/변수/인코딩된 URI/쿼리/인증은
        생략합니다. 오류의 원인은 설정한 이 사례 안에서만 판정합니다.
      </p>
    </section>
  );
}
const dockerInitial: DockerState = {
  placement: "host",
  target: "loopback",
  publish: "loopback",
  bind: "all",
  network: true,
  allowed: true,
  expose: true,
};
export function DockerVisualLab() {
  const [s, set] = useState(dockerInitial),
    [prediction, predict] = useState("");
  const j = dockerJourney(s),
    player = useFoundationPlayback(j.frames.length),
    frame = j.frames[player.index];
  const change = (patch: Partial<DockerState>) => {
    player.reset();
    predict("");
    set((old) => ({ ...old, ...patch }));
  };
  const reset = () => {
    player.reset();
    predict("");
    set(dockerInitial);
  };
  const targets: Options =
    s.placement === "container"
      ? [
          ["service", "app:8000"],
          ["loopback", "127.0.0.1:8000"],
        ]
      : s.placement === "remote"
        ? [
            ["vm", "192.0.2.20:18001"],
            ["loopback", "127.0.0.1:18001"],
          ]
        : [
            ["loopback", "127.0.0.1:18001"],
            ["service", "app:8000"],
          ];
  const edges: [string, string][] = [
    ["remote", "host"],
    ["host", "app"],
    ...(s.network ? [["container", "app"] as [string, string]] : []),
    ...(frame.edge?.[0] === frame.edge?.[1] && frame.edge ? [frame.edge] : []),
  ];
  return (
    <section className="ov-lab" aria-label="Docker 네트워크 시각 실험">
      <p className="ov-eyebrow">11 · WHOSE LOCALHOST?</p>
      <h2>경계 안에서 출발지를 찾기</h2>
      <p>
        큰 테두리는 VM, 안쪽 테두리는 호스트와 컨테이너의 네트워크 공간입니다.
        Linux 컨테이너는 VM의 커널을 공유하지만 localhost는 각 공간의
        자신입니다.
      </p>
      <Playback player={player} count={j.frames.length} reset={reset} />
      <OperationScene
        frame={frame}
        playing={player.playing}
        kind="docker"
        edges={edges}
      >
        <div className="ov-remote-zone ov-boundary">
          <small>VM A · 별도 OS</small>
          <OperationNodeCard node={j.nodes[0]} frame={frame} />
        </div>
        <div className="ov-vm-zone ov-boundary">
          <b>VM B · Linux Docker 호스트</b>
          <div className="ov-host-zone">
            <OperationNodeCard node={j.nodes[1]} frame={frame}>
              <code>{j.publish}</code>
            </OperationNodeCard>
          </div>
          <div className="ov-bridge-zone ov-boundary">
            <b>
              {s.network
                ? "Docker 사용자 정의 bridge · web"
                : "서로 다른 Docker bridge"}
            </b>
            <span>
              {s.network
                ? "프록시·앱 모두 web에 연결"
                : "프록시는 다른 bridge · app 이름 해석/직접 연결 없음"}
            </span>
            <div className="ov-containers">
              <div className={!s.network ? "ov-separate ov-boundary" : ""}>
                {!s.network && <small>proxy-net · 별도 bridge</small>}
                <OperationNodeCard node={j.nodes[2]} frame={frame} />
              </div>
              <div className={!s.network ? "ov-separate ov-boundary" : ""}>
                {!s.network && <small>web · 앱 bridge</small>}
                <OperationNodeCard node={j.nodes[3]} frame={frame}>
                  <code>listen {j.bind}</code>
                  <small>{j.expose}</small>
                </OperationNodeCard>
              </div>
            </div>
          </div>
        </div>
      </OperationScene>
      <OperationExplanation frame={frame} index={player.index} />
      <OperationStaticFrames frames={j.frames} />
      <div className="ov-localhost">
        <b>현재 프록시의 localhost = {j.localhostOwner}</b>
        <span>앱의 127.0.0.1은 항상 앱 컨테이너 자신입니다.</span>
      </div>
      <div className="ov-controls">
        <Select
          label="프록시 위치"
          value={s.placement}
          options={[
            ["host", "같은 VM의 호스트"],
            ["container", "같은 VM의 컨테이너"],
            ["remote", "다른 VM"],
          ]}
          change={(placement) =>
            change({
              placement,
              target:
                placement === "container"
                  ? "service"
                  : placement === "remote"
                    ? "vm"
                    : "loopback",
            })
          }
        />
        <Select
          label="프록시의 접속 대상"
          value={s.target}
          options={targets}
          change={(target) => change({ target })}
        />
        <Select
          label="앱 publish"
          value={s.publish}
          options={[
            ["none", "없음"],
            ["loopback", "127.0.0.1:18001 → 8000"],
            ["all", "0.0.0.0:18001 → 8000"],
          ]}
          change={(publish) => change({ publish })}
        />
        <Select
          label="앱 listen 주소"
          value={s.bind}
          options={[
            ["all", "0.0.0.0:8000"],
            ["loopback", "127.0.0.1:8000"],
          ]}
          change={(bind) => change({ bind })}
        />
      </div>
      {s.placement === "container" && (
        <Toggle
          label="같은 사용자 정의 bridge 네트워크"
          value={s.network}
          change={(network) => change({ network })}
        />
      )}
      {s.placement === "remote" && (
        <Toggle
          label="원격 프록시 출발지의 경로·방화벽 허용"
          value={s.allowed}
          change={(allowed) => change({ allowed })}
        />
      )}
      <Toggle
        label="Dockerfile에 EXPOSE 8000 기재"
        value={s.expose}
        change={(expose) => change({ expose })}
      />
      <div className="ov-roles">
        {j.roles.map((r) => (
          <div key={r.title}>
            <b>{r.title}</b>
            <strong>{r.value}</strong>
            <span>{r.detail}</span>
          </div>
        ))}
      </div>
      <p className="ov-note">
        원격 허용 조건은 VM 사이 경로에만 적용합니다. 같은 bridge·호스트의 다른
        정책은 정상이며, EXPOSE는 성공/실패를 바꾸지 않습니다. 0.0.0.0은
        listen/publish 범위이지 접속 목적지 주소가 아닙니다.
      </p>
      <Prediction
        value={prediction}
        change={predict}
        final={player.index === j.frames.length - 1}
        outcome={j.result.ok ? "yes" : "no"}
        options={[
          ["yes", "앱까지 연결"],
          ["no", "연결 실패"],
        ]}
      />
      <p className="ov-note">
        교육 모델 · Linux Docker Engine 28.0.0 이상, IPv4 사용자 정의
        bridge·기본 NAT와 표시한 정책. HTTP /items 구간만 다루며 TLS·인증은
        별도입니다. host network·직접 라우팅·IPv6·rootless·Swarm·Docker
        Desktop·Pod 네트워크 공유는 범위 밖입니다. 28 미만 localhost publish
        예외는 본문을 참고하세요. publish 없는 호스트→컨테이너 IP 직접 접근도
        가능하지만 이 모델은 운영 접점의 publish 경로를 비교합니다.
      </p>
    </section>
  );
}

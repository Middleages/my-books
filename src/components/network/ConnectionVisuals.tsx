import { useState } from "react";
import {
  portJourney,
  dnsJourney,
} from "../../simulations/network/connection-visual.mjs";
import type {
  PortState,
  DnsState,
} from "../../simulations/network/connection-visual.mjs";
import { Playback, useFoundationPlayback } from "./FoundationPlayback";
import {
  OperationScene,
  OperationNodeCard,
  OperationExplanation,
  OperationStaticFrames,
} from "./OperationScene";
import "./operation-visuals.css";
import "./connection-visuals.css";
export function Choice({
  label,
  value,
  options,
  change,
}: {
  label: string;
  value: string | number;
  options: [string, string][];
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
export function Switch({
  label,
  value,
  change,
}: {
  label: string;
  value: boolean;
  change: (v: boolean) => void;
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
export function Predict({
  value,
  change,
  options,
  final,
  outcome,
}: {
  value: string;
  change: (v: string) => void;
  options: [string, string][];
  final: boolean;
  outcome: string;
}) {
  return (
    <div className="ov-prediction">
      <Choice
        label="결과 예측 (선택)"
        value={value}
        options={[["", "예측 없이도 관찰할 수 있습니다"], ...options]}
        change={change}
      />
      {final && value && (
        <p>
          {value === outcome
            ? "✓ 예측과 일치합니다."
            : "예측과 달랐습니다. 현재 구간과 조건을 비교하세요."}
        </p>
      )}
    </div>
  );
}
const portInitial: PortState = {
  observer: "remote",
  bind: "loopback",
  listening: true,
  policy: "allow",
  port: "8000",
};
export function PortVisual() {
  const [s, set] = useState(portInitial),
    [prediction, predict] = useState("");
  const j = portJourney(s),
    p = useFoundationPlayback(j.frames.length),
    f = j.frames[p.index];
  const local = s.observer === "local";
  const change = (patch: Partial<PortState>) => {
    p.reset();
    predict("");
    set((x) => ({ ...x, ...patch }));
  };
  const reset = () => {
    p.reset();
    predict("");
    set(portInitial);
  };
  const client = {
    id: "client",
    name: local ? "VM 안의 접속 프로그램" : "PC A",
    address: j.outbound.src,
    zone: local ? "VM의 같은 network namespace" : "사용자 PC · VM 밖",
  };
  const listener = {
    id: "listener",
    name: "OS의 TCP 리스너 선택",
    address: j.outbound.dst,
    zone: "단일 Linux VM · 네트워크 공간",
  };
  return (
    <section className="ov-lab pv-lab" aria-label="포트와 리스너 시각 실험">
      <p className="ov-eyebrow">04 · LISTEN ≠ ALLOW</p>
      <h2>허용된 길 끝에 앱이 기다릴까?</h2>
      <p>
        선 위를 이동하는 표시는 TCP 연결 준비 메시지입니다. 회색 선은 비교 경로,
        초록은 현재 구간입니다. 연결 준비의 관찰 단계이며 실제 시간 비율은
        아닙니다.
      </p>
      <Playback player={p} count={j.frames.length} reset={reset} />
      <OperationScene
        frame={f}
        playing={p.playing}
        kind={`port-${s.observer}`}
        edges={
          local
            ? [["client", "listener"]]
            : [
                ["client", "gate"],
                ["gate", "listener"],
              ]
        }
      >
        {local ? (
          <div className="ov-boundary pv-local-vm">
            <b>같은 VM 안 · loopback 경로</b>
            <OperationNodeCard node={client} frame={f} />
            <OperationNodeCard node={listener} frame={f} />
          </div>
        ) : (
          <>
            <div>
              <OperationNodeCard node={client} frame={f} />
            </div>
            <div className="ov-boundary pv-port-vm">
              <b>서버 VM · 192.0.2.10</b>
              <OperationNodeCard
                node={{
                  id: "gate",
                  name:
                    s.policy === "allow" ? "원격 TCP 허용" : "원격 TCP DROP",
                  address: "필터 위치 · 주소 변환 없음",
                  zone: "이 모델의 호스트 방화벽",
                }}
                frame={f}
              />
              <OperationNodeCard node={listener} frame={f} />
            </div>
          </>
        )}
      </OperationScene>
      <div className="pv-listeners" aria-label="앱의 현재 listen 설정">
        {j.listeners.map((l) => (
          <div key={l.port}>
            <b>TCP {l.port}</b>
            <code>
              {l.active ? `${l.address}:${l.port}` : "맞는 앱 리스너 없음"}
            </code>
            <strong>{l.active ? "앱이 기다림" : "대기 앱 없음"}</strong>
          </div>
        ))}
      </div>
      <OperationExplanation frame={f} index={p.index} />
      <OperationStaticFrames frames={j.frames} />
      <div className="ov-controls">
        <Choice
          label="관측 위치"
          value={s.observer}
          options={[
            ["remote", "다른 PC → 서버 IP"],
            ["local", "VM 자신 → 127.0.0.1"],
          ]}
          change={(observer) => change({ observer })}
        />
        <Choice
          label="앱 bind 주소"
          value={s.bind}
          options={[
            ["loopback", "127.0.0.1 · 자기 공간만"],
            ["all", "0.0.0.0 · 모든 로컬 IPv4"],
          ]}
          change={(bind) => change({ bind })}
        />
        <Choice
          label="요청 포트"
          value={s.port}
          options={[
            ["8000", "8000"],
            ["8001", "8001"],
          ]}
          change={(port) => change({ port })}
        />
        <Choice
          label="방화벽 정책"
          value={s.policy}
          options={[
            ["allow", "원격 요청 허용"],
            ["drop", "원격 요청 DROP"],
          ]}
          change={(policy) => change({ policy })}
        />
      </div>
      <Switch
        label="TCP 8000 앱 리스너 실행"
        value={s.listening}
        change={(listening) => change({ listening })}
      />
      <Predict
        value={prediction}
        change={predict}
        options={[
          ["yes", "TCP 연결 성공"],
          ["no", "TCP 연결 실패"],
        ]}
        final={p.index === j.frames.length - 1}
        outcome={j.result.ok ? "yes" : "no"}
      />
      <div className="pv-connection-pair">
        <h3>같은 서버 포트, 다른 연결 · 정상 리스너·경로일 때의 별도 예</h3>
        {j.connections.map((c) => (
          <code key={c.src}>
            {c.src} ↔ {c.dst} / {c.protocol}
          </code>
        ))}
        <p>
          이 두 줄은 현재 실험이 성공했다는 판정이 아닙니다. 각 연결의 상대
          주소·임시 포트가 달라 TCP가 구분합니다.
        </p>
      </div>
      <p className="ov-note">
        가정: 단일 Linux VM·IPv4/TCP, 한 리스너, 정상 왕복 경로와 반환 트래픽
        허용. 로컬 경로는 표시한 원격 DROP 규칙 밖입니다. DROP이면 응답 없음,
        맞는 리스너가 없으면 서버 RST라는 고정 사례입니다. 실제 timeout/RST의
        원인을 하나로 단정하지 않습니다. SYN 재전송·accept 큐 포화·동시 연결
        옵션·Docker·TLS·HTTP는 생략합니다.
      </p>
    </section>
  );
}
const dnsInitial: DnsState = {
  browser: false,
  os: false,
  cache: true,
  age: 0,
  record: "exists",
  app: true,
};
export function DnsVisual() {
  const [s, set] = useState(dnsInitial),
    [prediction, predict] = useState("");
  const j = dnsJourney(s),
    p = useFoundationPlayback(j.frames.length),
    f = j.frames[p.index];
  const change = (patch: Partial<DnsState>) => {
    p.reset();
    predict("");
    set((x) => ({ ...x, ...patch }));
  };
  const reset = () => {
    p.reset();
    predict("");
    set(dnsInitial);
  };
  const card = (id: string) => {
    const c = f.caches.find((c) => c.id === id)!;
    return (
      <OperationNodeCard
        node={{
          id,
          name: c.name,
          address: c.address ?? "이전 응답 없음",
          zone:
            id === "resolver" ? "DNS 서버 · 192.0.2.53" : "클라이언트 PC 내부",
        }}
        frame={f}
      >
        <span>
          {c.address
            ? `${c.valid ? "유효" : "만료"} · TTL ${c.remaining}초`
            : "캐시 비어 있음"}
        </span>
      </OperationNodeCard>
    );
  };
  return (
    <section className="ov-lab pv-lab" aria-label="DNS 캐시 시각 실험">
      <p className="ov-eyebrow">05 · WHICH CACHE ANSWERED?</p>
      <h2>이전 주소는 어디에 남았을까?</h2>
      <p>
        권한 A 레코드는 t=0에 바뀌었습니다. 조회는 가까운 유효한 캐시에서
        끝나며, 아래 모든 칸을 항상 방문하지 않습니다. 단계 재생은 DNS 질의와
        로컬 호출의 흐름이며 TTL의 실제 시간 경과가 아닙니다.
      </p>
      <div className="ov-dns">
        <b>질문: app.example.test / A</b>
        <span>권한 서버의 현재 값: {j.authoritative}</span>
        <span>
          관찰 시각 t={s.age}초 · /report·8000은 DNS 질문에 포함되지 않음
        </span>
      </div>
      <Playback player={p} count={j.frames.length} reset={reset} />
      <OperationScene
        frame={f}
        playing={p.playing}
        kind="dns"
        edges={[
          ["browser", "os"],
          ["os", "resolver"],
          ["resolver", "authority"],
        ]}
      >
        <div className="ov-boundary pv-dns-pc">
          <b>클라이언트 PC · 198.51.100.30</b>
          {card("browser")}
          {card("os")}
        </div>
        <div className="ov-boundary pv-dns-servers">
          <b>DNS 서비스 · 로컬 호출과 구분</b>
          {card("resolver")}
          <OperationNodeCard
            node={{
              id: "authority",
              name: "권한 서버",
              address: "198.51.100.53:53",
              zone: "담당 영역의 현재 레코드",
            }}
            frame={f}
          >
            <span>{j.authoritative}</span>
          </OperationNodeCard>
        </div>
      </OperationScene>
      <div className="pv-dns-app">
        <b>이름 조회 결과와 앱 연결은 별도 단계</b>
        <div className="pv-app-route">
          <span>
            브라우저
            <br />
            <code>{f.answer ?? "주소 결과 대기"}</code>
          </span>
          <span className={f.id === "app-connect" ? "pv-app-active" : ""}>
            → TCP →
          </span>
          <span>
            앱 TCP 8000
            <br />
            <code>
              {f.id === "app-connect" ? f.connection?.dst : "아직 앱 연결 전"}
            </code>
          </span>
        </div>
      </div>
      <OperationExplanation frame={f} index={p.index} />
      <OperationStaticFrames frames={j.frames} />
      <div className="ov-controls">
        <Choice
          label="캐시 스냅샷 이후 경과 시간"
          value={s.age}
          options={[0, 20, 30, 40, 59, 60, 120].map((t) => [
            String(t),
            `${t}초`,
          ])}
          change={(age) => change({ age: Number(age) })}
        />
        <Choice
          label="권한 서버 상태"
          value={s.record}
          options={[
            ["exists", "새 A 주소 .20"],
            ["missing", "이름 삭제 · NXDOMAIN"],
          ]}
          change={(record) => change({ record })}
        />
      </div>
      <Switch
        label="브라우저에 이전 응답 있음 (t=0 잔여 TTL 20초)"
        value={s.browser}
        change={(browser) => change({ browser })}
      />
      <Switch
        label="OS에 이전 응답 있음 (t=0 잔여 TTL 40초)"
        value={s.os}
        change={(os) => change({ os })}
      />
      <Switch
        label="리졸버에 이전 응답 있음 (t=0 잔여 TTL 60초)"
        value={s.cache}
        change={(cache) => change({ cache })}
      />
      <Switch
        label="조회된 주소의 앱 TCP 8000 실행"
        value={s.app}
        change={(app) => change({ app })}
      />
      <Predict
        value={prediction}
        change={predict}
        options={[
          ["192.0.2.10", "이전 주소 .10"],
          ["192.0.2.20", "새 주소 .20"],
          ["none", "주소 없음"],
        ]}
        final={p.index === j.frames.length - 1}
        outcome={j.result.address ?? "none"}
      />
      <p className="ov-note">
        교육 모델: IPv4 A 한 개·정상 DNS/UDP 왕복, 브라우저→OS→지정 리졸버
        경로를 가정합니다. 각 캐시의 t=0 잔여 TTL 20/40/60초는 미리 구성한 독립
        스냅샷이며 캐시별 고정 표준 TTL이 아닙니다. 응답 전달 시 경과는 생략하고
        받은 잔여 TTL을 그대로 보존합니다. 구현별 브라우저/OS 캐시
        정책·DoH·hosts·TTL 상하한·음성 캐시·serve-stale·루트/TLD
        탐색·DNSSEC·CNAME·AAAA 선택은 생략합니다. 음성 캐시와 serve-stale 예외는
        본문을 참고하세요.
      </p>
    </section>
  );
}

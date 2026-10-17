import { useState } from "react";
import { hosts } from "../../simulations/network/model.mjs";
import { routeFrames } from "../../simulations/network/foundation-visual.mjs";
import { scenarios } from "../../simulations/network/scenarios";
import { Playback, useFoundationPlayback } from "./FoundationPlayback";
import {
  PathScene,
  PacketFields,
  StaticFrames,
  FrameExplanation,
} from "./FoundationScene";
import "./foundation-visuals.css";

export default function RouteLab({ nat = false }: { nat?: boolean }) {
  const [source, setSource] = useState("a");
  const [destination, setDestination] = useState(nat ? "server" : "peer");
  const [scenario, setScenario] = useState(nat ? "nat" : "routed");
  const [both, setBoth] = useState(true);
  const [prediction, setPrediction] = useState("");
  const r = routeFrames({ source, destination, scenario, both });
  const player = useFoundationPlayback(r.frames.length);
  const f = r.frames[player.index];
  const currentSource = f.source === "b" ? "b" : "a";
  const peer = currentSource === "a" ? "b" : "a";
  const isNat = scenario === "nat" && !r.local;
  const nodes = [
    {
      id: currentSource,
      name: "대화를 시작한 PC " + currentSource.toUpperCase(),
      address: hosts[currentSource].ip + "/24",
      zone: "같은 LAN · 192.168.10.0/24",
    },
    ...(r.local
      ? []
      : [
          {
            id: "router",
            name: "라우터 · 네트워크 경계",
            address:
              scenario === "nat"
                ? "안쪽 192.168.10.1 / 출구 203.0.113.5"
                : "192.168.10.1 / 192.168.20.1",
            zone:
              scenario === "bad-gateway"
                ? "설정 192.168.10.254 · 장비 없음"
                : "기본 게이트웨이 192.168.10.1",
          },
        ]),
    r.local
      ? {
          id: peer,
          name: "상대 PC " + peer.toUpperCase(),
          address: hosts[peer].ip + "/24",
          zone: "같은 LAN · 라우터 경유 없음",
        }
      : {
          id: "server",
          name: "다른 망의 서버",
          address:
            scenario === "nat"
              ? "198.51.100.20 : 8000"
              : "192.168.20.20 : 8000",
          zone:
            scenario === "nat"
              ? "인터넷 쪽 · 중간 홉 생략"
              : "다른 사설망 · 192.168.20.0/24",
        },
  ];
  const change = () => {
    player.reset();
    setPrediction("");
  };
  const correct = r.local
    ? "direct"
    : r.outcome === "blocked"
      ? "blocked"
      : "gateway";
  return (
    <section className="fv-lab" aria-label="라우팅과 NAT 시각 실험">
      <p className="fv-eyebrow">03 · 길 선택과 주소 변환</p>
      <h2>지금 패킷은 어디에, 어떤 주소로 있을까?</h2>
      <p>
        같은 LAN 왕복, NAT 없는 두 사설망, NAPT 출구, 잘못된 게이트웨이를
        비교하세요. 선 위의 ▣는 현재 단계에서 이동한 IP 패킷입니다.
      </p>
      <div className="fv-controls">
        <label>
          출발지
          <select
            aria-label="출발지"
            disabled={both && isNat}
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              change();
            }}
          >
            <option value="a">PC A</option>
            <option value="b">PC B</option>
          </select>
        </label>
        <label>
          목적지
          <select
            aria-label="목적지"
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value);
              change();
            }}
          >
            <option value="peer">같은 망의 다른 PC</option>
            <option value="server">외부 서버</option>
          </select>
        </label>
        <label>
          경로 사례
          <select
            aria-label="경로 사례"
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value);
              change();
            }}
          >
            {scenarios
              .filter((s) => nat || s.id !== "nat")
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
          </select>
        </label>
      </div>
      <p>{scenarios.find((s) => s.id === scenario)?.description}</p>
      {isNat && (
        <>
          <label className="fv-toggle">
            <input
              type="checkbox"
              checked={both}
              onChange={(e) => {
                setBoth(e.target.checked);
                change();
              }}
            />
            두 PC 함께 · A/B 요청 후 B/A 응답
          </label>
          <div className="fv-hosts" aria-label="출구를 공유하는 두 PC">
            {(["a", "b"] as const).map((key) => (
              <div
                key={key}
                className={currentSource === key ? "fv-current" : ""}
              >
                <b>PC {key.toUpperCase()}</b>
                <code>{hosts[key].ip} : 51000</code>
                <span>
                  {currentSource === key
                    ? "● 지금 따라가는 대화"
                    : "별도의 대화"}
                </span>
              </div>
            ))}
          </div>
          <p className="fv-note">
            두 PC는 같은 LAN에서 같은 라우터 출구를 공유합니다. 아래 경로는 현재
            따라가는 PC를 확대합니다. 두 PC 함께 모드에서는 출발지 선택과
            무관하게 A → B 순서로 요청합니다.
          </p>
        </>
      )}
      <PathScene
        nodes={nodes}
        frame={f}
        playing={player.playing}
        frameKey={player.index}
      />
      <Playback
        player={player}
        count={r.frames.length}
        reset={() => {
          setSource("a");
          setDestination(nat ? "server" : "peer");
          setScenario(nat ? "nat" : "routed");
          setBoth(true);
          change();
        }}
      />
      <FrameExplanation
        frame={f}
        index={player.index}
        final={player.index === r.frames.length - 1}
        outcome={r.outcome}
      />
      <div className="fv-comparison" aria-label="현재 구간의 주소 전후 비교">
        <h3>
          {f.change === "source"
            ? "출구에서 요청 출발지 변환"
            : f.change === "destination"
              ? "안쪽으로 보내기 전 응답 목적지 복원"
              : "이 단계에서는 IP·포트 변환 없음"}
        </h3>
        <div className="fv-layer-pair">
          <PacketFields packet={f.before} label="변환 전 / 유지 확인" />
          <PacketFields packet={f.packet} label="변환 후 / 현재" />
        </div>
        <p>
          {f.change
            ? "바뀐 쪽: " +
              (f.change === "source"
                ? "출발지 IP·포트. 목적지는 그대로."
                : "목적지 IP·포트. 출발지는 그대로.")
            : "요청과 응답은 서로 반대 방향의 별도 패킷입니다. 응답 생성 시 주소·포트가 뒤집히는 것은 NAT 변환이 아닙니다."}
        </p>
      </div>
      {nat && (
        <div className="fv-mappings">
          <h3>출구 매핑 · TCP</h3>
          <p>안쪽 주소:포트 ↔ 출구 주소:포트</p>
          {f.mappings.length ? (
            f.mappings.map((m) => (
              <div
                key={m.internalIp}
                className={
                  f.source && m.internalIp === hosts[currentSource].ip
                    ? "fv-current"
                    : ""
                }
              >
                <b>PC {m.internalIp === hosts.a.ip ? "A" : "B"}</b>
                <code>
                  {m.internalIp} : {m.internalPort}
                </code>
                <span>↔</span>
                <code>
                  {m.externalIp} : {m.externalPort}
                </code>
                <small>
                  {f.change === "destination" &&
                  f.before.dport === m.externalPort
                    ? "✓ 이 응답과 일치 · 원래 PC로"
                    : "이 대화의 매핑"}
                </small>
              </div>
            ))
          ) : (
            <p>
              {r.local
                ? "같은 LAN에서는 NAT를 사용하지 않습니다."
                : isNat
                  ? "아직 출구 변환 전 · 만들어진 매핑 없음"
                  : "NAT 없는 경로 · 매핑 없음"}
            </p>
          )}
        </div>
      )}
      <label className="fv-prediction">
        첫 전달 예측
        <select
          aria-label="첫 전달 예측"
          value={prediction}
          onChange={(e) => setPrediction(e.target.value)}
        >
          <option value="">선택 없이도 관찰 가능</option>
          <option value="direct">같은 망에 직접 전달</option>
          <option value="gateway">게이트웨이로 전달</option>
          <option value="blocked">다음 홉을 찾지 못함</option>
        </select>
      </label>
      {prediction && player.index > 0 && (
        <p>
          {prediction === correct
            ? "✓ 예측과 일치합니다."
            : "예측과 다릅니다. 현재 경로와 중단 사유를 확인하세요."}
        </p>
      )}
      <StaticFrames frames={r.frames} />
      <div className="fv-roles">
        <div>
          <b>라우팅</b>
          <p>어느 다음 홉으로 보낼지 고릅니다.</p>
        </div>
        <div>
          <b>NAT / NAPT</b>
          <p>주소를 변환합니다. NAPT는 포트도 매핑합니다.</p>
        </div>
        <div>
          <b>방화벽</b>
          <p>
            정책으로 허용·차단합니다. 이 실험은 정상 트래픽 허용을 가정합니다.
          </p>
        </div>
      </div>
      <p className="fv-note">
        가정: IPv4/TCP, /24 LAN, 정상 링크·서버·반환 경로. 잘못된 게이트웨이는
        .254에 응답할 장비가 없는 고정 사례입니다. ARP·MAC 헤더·TTL·체크섬
        갱신·중간 홉·TCP 연결 설정·손실·매핑 만료는 생략합니다. 두 PC 매핑은 이
        가상 출구가 선택한 서로 다른 포트이며 모든 NAT의 할당 규칙이 아닙니다.
        기존 매핑에 맞는 응답만 다루며 외부 임의 신규 연결 허용을 뜻하지
        않습니다. 문서용 외부 IP로 실제 통신을 하지 않습니다.
      </p>
    </section>
  );
}

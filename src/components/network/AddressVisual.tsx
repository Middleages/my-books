import { useState } from "react";
import { addressFrames } from "../../simulations/network/foundation-visual.mjs";
import { Playback, useFoundationPlayback } from "./FoundationPlayback";
import { PathScene, StaticFrames, FrameExplanation } from "./FoundationScene";
import "./foundation-visuals.css";
export default function AddressVisual() {
  const [prefix, setPrefix] = useState(24);
  const [destination, setDestination] = useState("192.168.10.20");
  const [badGateway, setBadGateway] = useState(false);
  const [prediction, setPrediction] = useState("");
  const r = addressFrames({ prefix, destination, badGateway });
  const player = useFoundationPlayback(r.frames.length);
  const f = r.frames[player.index];
  const change = () => {
    player.reset();
    setPrediction("");
  };
  const nodes = [
    {
      id: "source",
      name: "출발지 · PC A",
      address: r.source + "/" + prefix,
      zone: r.sourceRange,
    },
    ...(!r.local
      ? [
          {
            id: "router",
            name: "네트워크 경계 · 라우터",
            address: badGateway ? "실제 .1 / 설정 .254 · 없음" : "192.168.10.1",
            zone: "다음 홉 · 기본 게이트웨이",
          },
        ]
      : []),
    {
      id: "target",
      name: "목적지 · 상대 PC",
      address: destination + "/" + prefix,
      zone: r.local
        ? "같은 LAN · " + r.destinationRange
        : "다른 LAN · " + r.destinationRange,
    },
  ];
  return (
    <section className="fv-lab" aria-label="prefix와 네트워크 경계 실험">
      <p className="fv-eyebrow">02 · 주소만큼 중요한 범위</p>
      <h2>같은 주소도 prefix에 따라 길이 바뀐다</h2>
      <p>
        출발지는 고정하고 목적지와 prefix를 바꿔 보세요. 위쪽 경계 상자와 아래쪽
        전달 경로가 함께 바뀝니다.
      </p>
      <div className="fv-controls">
        <label>
          두 PC의 prefix
          <select
            aria-label="네트워크 prefix"
            value={prefix}
            onChange={(e) => {
              setPrefix(Number(e.target.value));
              change();
            }}
          >
            <option value={16}>/16 · 앞 16비트</option>
            <option value={24}>/24 · 앞 24비트</option>
            <option value={25}>/25 · 앞 25비트</option>
          </select>
        </label>
        <label>
          목적지 IP
          <select
            aria-label="IP 실험 목적지"
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value);
              change();
            }}
          >
            <option>192.168.10.20</option>
            <option>192.168.10.150</option>
            <option>192.168.20.20</option>
          </select>
        </label>
        <label>
          기본 게이트웨이
          <select
            aria-label="IP 실험 게이트웨이"
            value={String(badGateway)}
            onChange={(e) => {
              setBadGateway(e.target.value === "true");
              change();
            }}
          >
            <option value="false">192.168.10.1 · 정상</option>
            <option value="true">192.168.10.254 · 장비 없음</option>
          </select>
        </label>
      </div>
      <div
        className={`fv-boundaries ${r.local ? "fv-same-lan" : ""}`}
        aria-label="주소와 네트워크 경계 비교"
      >
        <div>
          <small>출발지의 연결 네트워크</small>
          <b>{r.sourceRange}</b>
          <code>
            {r.source}/{prefix}
          </code>
        </div>
        <strong>
          {r.local ? "같은 범위 · 경계 안" : "다른 범위 · 경계를 넘음"}
        </strong>
        <div>
          <small>목적지가 속하는 범위</small>
          <b>{r.destinationRange}</b>
          <code>
            {r.destination}/{prefix}
          </code>
        </div>
      </div>
      <p className="fv-note">
        /16: 192.168.10.10과 192.168.20.20도 같은 범위. /25: 192.168.10.10과
        192.168.10.150도 다른 범위. 아래 지도는 선택한 prefix에 맞게 실제 LAN
        배치도 함께 구성한 가상 사례입니다.
      </p>
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
          setPrefix(24);
          setDestination("192.168.10.20");
          setBadGateway(false);
          change();
        }}
      />
      <FrameExplanation
        frame={f}
        index={player.index}
        final={player.index === r.frames.length - 1}
        outcome={r.outcome}
      />
      <label className="fv-prediction">
        첫 전달 예측
        <select
          aria-label="IP 전달 경로 예측"
          value={prediction}
          onChange={(e) => setPrediction(e.target.value)}
        >
          <option value="">선택 없이도 관찰 가능</option>
          <option value="direct">목적지에 직접</option>
          <option value="gateway">게이트웨이로</option>
          <option value="blocked">설정된 다음 홉에서 중단</option>
        </select>
      </label>
      {prediction && player.index > 0 && (
        <p>
          {prediction ===
          (r.local ? "direct" : r.outcome === "blocked" ? "blocked" : "gateway")
            ? "✓ 예측과 일치합니다."
            : "예측과 다릅니다. 네트워크 경계와 다음 홉을 다시 보세요."}
        </p>
      )}
      <StaticFrames frames={r.frames} />
      <p className="fv-note">
        교육 모델: 단일 IPv4 인터페이스, 연결 네트워크 경로와 기본 경로만
        사용합니다. 더 구체적인 정적 경로·정책 라우팅은 생략합니다. 같은 범위의
        두 PC는 같은 L2 LAN, 서로 다른 범위는 라우터 양쪽 LAN에 놓고 정상 반환
        경로를 가정합니다. 원격 /25의 .150 쪽 라우터는 .129, 원격 /24의
        192.168.20.20 쪽은 192.168.20.1입니다. ARP·VLAN·손실·NAT·방화벽·TCP 연결
        설정은 생략합니다. IP 범위만 같다고 실제 연결까지 보장되는 것은
        아닙니다.
      </p>
    </section>
  );
}

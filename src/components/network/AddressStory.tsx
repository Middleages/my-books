import { useId, useState, type CSSProperties } from "react";
import {
  addressSpace,
  type Frame,
} from "../../simulations/network/foundation-visual.mjs";
import "./address-story.css";

type Space = ReturnType<typeof addressSpace>;
export function AddressPrimer() {
  const [prefix, setPrefix] = useState(24);
  const space = addressSpace({ prefix });
  return (
    <figure
      className="as-figure as-primer"
      aria-label="32비트에서 네트워크와 호스트 부분 나누기"
    >
      <div className="as-kicker">01 / 주소를 펼쳐 보면</div>
      <h3>같은 주소, 다른 경계선</h3>
      <p>
        파란 부분은 네트워크, 보라색 부분은 그 안의 호스트입니다. prefix를
        바꾸면 두 부분의 경계가 움직입니다.
      </p>
      <div
        className="as-prefixes"
        role="group"
        aria-label="주소 그림의 prefix 선택"
      >
        {[16, 24, 25].map((n) => (
          <button
            key={n}
            aria-pressed={prefix === n}
            onClick={() => setPrefix(n)}
          >
            /{n}
          </button>
        ))}
      </div>
      <div className="as-octets">
        {space.source.split(".").map((octet, i) => (
          <div className="as-octet" key={i}>
            <strong>{octet}</strong>
            <small>
              {i * 8 + 1}–{i * 8 + 8}번째 비트
            </small>
            <div
              className="as-bits"
              aria-label={`${i + 1}번째 숫자의 이진수 ${space.bits
                .slice(i * 8, i * 8 + 8)
                .map((b) => b.value)
                .join("")}`}
            >
              {space.bits.slice(i * 8, i * 8 + 8).map((b, j) => (
                <span className={b.network ? "as-net" : "as-host"} key={j}>
                  {b.value}
                </span>
              ))}
            </div>
            <div className="as-bit-roles" aria-hidden="true">
              {space.bits.slice(i * 8, i * 8 + 8).map((b, j) => (
                <i className={b.network ? "as-net" : "as-host"} key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="as-legend">
        <span className="as-net">네트워크 {prefix}비트</span>
        <span className="as-host">호스트 {32 - prefix}비트</span>
      </div>
      <div className="as-bit-result" aria-live="polite">
        <span>
          서브넷 마스크 <b>{space.mask}</b>
        </span>
        <span>
          호스트 비트를 0으로 → <b>{space.sourceRange}</b>
        </span>
      </div>
      <figcaption>
        /25를 누르면 마지막 숫자의 첫 비트까지 파란색이 됩니다. “앞 세 숫자만
        비교”하는 규칙은 /24에서만 쓸 수 있어요.
      </figcaption>
    </figure>
  );
}

export function AddressSpaceDiagram({ space: s }: { space: Space }) {
  return (
    <figure
      className="as-figure as-space"
      aria-label="비례하는 주소 공간과 두 PC의 위치"
    >
      <div className="as-kicker">02 / 경계를 바꾸면</div>
      <h3>PC는 그대로, 같은 동네의 범위가 달라진다</h3>
      <p className="as-window">
        지금 보는 주소 띠: <b>{s.visibleRange}</b> · 총{" "}
        {s.visibleSize.toLocaleString()}개 주소
      </p>
      <div className="as-ruler" data-split={s.blocks.length === 2}>
        <div
          className="as-marker as-source-marker"
          style={{ "--position": `${s.sourcePosition}%` } as CSSProperties}
        >
          <span>A · {s.source}</span>
        </div>
        <div className="as-blocks">
          {s.blocks.map((b) => (
            <div
              key={b.start}
              className={`as-block ${b.containsSource ? "as-source-block" : "as-other-block"}`}
              style={{ flex: b.size }}
            >
              <b aria-label={b.range}>
                <span className="as-range-base">
                  {b.range.slice(0, b.range.lastIndexOf("."))}
                </span>
                <span>{b.range.slice(b.range.lastIndexOf("."))}</span>
              </b>
              <span>{b.size.toLocaleString()}개 주소</span>
              <div className="as-block-ends">
                <span>
                  .
                  {b.first
                    .split(".")
                    .slice(s.prefix === 16 ? 2 : 3)
                    .join(".")}
                </span>
                <span>
                  .
                  {b.last
                    .split(".")
                    .slice(s.prefix === 16 ? 2 : 3)
                    .join(".")}
                </span>
              </div>
            </div>
          ))}
        </div>
        {s.destinationPosition !== null && (
          <div
            className="as-marker as-target-marker"
            style={
              { "--position": `${s.destinationPosition}%` } as CSSProperties
            }
          >
            <span>B · {s.destination}</span>
          </div>
        )}
      </div>
      {s.destinationPosition === null && (
        <p className="as-outside">
          ↗ B · {s.destination}은 이 띠 밖의 {s.destinationRange}에 있습니다.
        </p>
      )}
      <div
        className={`as-verdict ${s.local ? "as-local" : "as-remote"}`}
        aria-live="polite"
      >
        <strong>
          {s.local
            ? "A와 B가 같은 범위 안에 있어요."
            : "A와 B 사이에 네트워크 경계가 있어요."}
        </strong>
        <span>
          {s.local
            ? "이 모델에서는 같은 LAN 안에서 직접 전달합니다."
            : "이 모델에서는 다음 홉인 게이트웨이에 맡깁니다."}
        </span>
      </div>
      <figcaption>
        {s.prefix === 16
          ? "지금은 /16 전체로 축소해 보고 있습니다. /24·/25의 띠보다 256배 넓은 주소 공간입니다."
          : "띠의 폭은 주소 개수에 비례합니다. /24와 /25를 번갈아 선택하면 같은 256개 주소가 .128에서 둘로 갈립니다."}{" "}
        주소 개수에는 네트워크·브로드캐스트 주소도 포함됩니다. A·B의 선이 정확한
        위치이며 라벨은 읽기 쉽게 배치했습니다.
      </figcaption>
    </figure>
  );
}

function Device({
  kind,
  x,
  y,
  active,
}: {
  kind: "source" | "router" | "target";
  x: number;
  y: number;
  active: boolean;
}) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      className={`as-device as-${kind} ${active ? "as-device-current" : ""}`}
    >
      <circle r="47" className="as-device-halo" />
      {kind === "router" ? (
        <>
          <path d="M-34-7 L0-21 34-7 0 7Z" />
          <path d="M-34-7 V15 L0 29 34 15 V-7 M0 7V29" />
          <path d="M-18-4L-5-9M7-2L19-7M-18 8L-5 13M7 13L19 8" />
        </>
      ) : (
        <>
          <rect x="-30" y="-24" width="60" height="40" rx="5" />
          <path d="M-9 16V27H9V16M-20 28H20" />
          <path className="as-screen" d="M-21-15H21V6H-21Z" />
        </>
      )}
    </g>
  );
}
export function AddressPath({
  space: s,
  frame: f,
  index,
  playing,
}: {
  space: Space;
  frame: Frame;
  index: number;
  playing: boolean;
}) {
  const id = useId().replace(/:/g, "");
  function drawing() {
    const a = { x: 120, y: 135 };
    const b = { x: 680, y: 135 };
    const r = { x: 400, y: 135 };
    const from = f.edge?.[0] === "router" ? r : a;
    const to = f.edge?.[1] === "router" ? r : b;
    const travel = {
      "--ax": `${from.x}px`,
      "--ay": `${from.y}px`,
      "--bx": `${to.x}px`,
      "--by": `${to.y}px`,
      animationPlayState: playing ? "running" : "paused",
    } as CSSProperties;
    const blocked = s.outcome === "blocked" && index === s.frames.length - 1;
    const arrowId = id;
    return (
      <svg
        className="as-map-wide"
        viewBox="0 0 800 275"
        role="img"
        aria-label={`${s.local ? "같은 LAN에서 A에서 B로 직접 전달" : "A에서 게이트웨이를 거쳐 다른 LAN의 B로 전달"}. 현재 위치: ${f.node === "source" ? "PC A" : f.node === "router" ? "라우터" : "PC B"}${blocked ? " · 다음 홉이 없어 중단" : ""}`}
      >
        <defs>
          <marker
            id={arrowId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0L10 5L0 10Z" fill="currentColor" />
          </marker>
        </defs>
        {s.local ? (
          <rect
            x="12"
            y="15"
            width={776}
            height={245}
            rx="24"
            className="as-lan-a"
          />
        ) : (
          <>
            <rect
              x="12"
              y="15"
              width={322}
              height={245}
              rx="24"
              className="as-lan-a"
            />
            <rect
              x={466}
              y={15}
              width={322}
              height={245}
              rx="24"
              className="as-lan-b"
            />
          </>
        )}
        <text x={30} y="43" className="as-map-zone">
          {s.sourceRange} · LAN A{s.local ? " = LAN B" : ""}
        </text>
        {!s.local && (
          <text x={485} y={43} className="as-map-zone">
            {s.destinationRange} · LAN B
          </text>
        )}
        <path className="as-road" d={`M${a.x} ${a.y}L${b.x} ${b.y}`} />
        {f.edge && (
          <path
            className="as-route-lit"
            markerEnd={`url(#${arrowId})`}
            d={`M${from.x} ${from.y}L${to.x} ${to.y}`}
          />
        )}
        <Device kind="source" {...a} active={f.node === "source"} />
        {!s.local && (
          <Device kind="router" {...r} active={f.node === "router"} />
        )}
        <Device kind="target" {...b} active={f.node === "target"} />
        <text x={a.x} y={a.y + 62} textAnchor="middle" className="as-map-name">
          PC A · 출발지
        </text>
        <text x={a.x} y={a.y + 82} textAnchor="middle" className="as-map-ip">
          {s.source}
        </text>
        {!s.local && (
          <>
            <text
              x={r.x}
              y={r.y + 62}
              textAnchor="middle"
              className="as-map-name"
            >
              라우터 · 다음 홉
            </text>
            <text
              x={r.x}
              y={r.y + 82}
              textAnchor="middle"
              className="as-map-ip"
            >
              192.168.10.1
            </text>
          </>
        )}
        <text x={b.x} y={b.y + 62} textAnchor="middle" className="as-map-name">
          PC B · 목적지
        </text>
        <text x={b.x} y={b.y + 82} textAnchor="middle" className="as-map-ip">
          {s.destination}
        </text>
        {f.edge && (
          <g
            key={index}
            className={`as-packet ${playing ? "as-packet-moving" : ""}`}
            style={travel}
          >
            <rect x="-24" y="-13" width="48" height="26" rx="6" />
            <text textAnchor="middle" y="5">
              IP
            </text>
          </g>
        )}
        {blocked && (
          <g transform={`translate(${285} ${135})`} className="as-stop">
            <circle r="23" />
            <path d="M-8-8L8 8M8-8L-8 8" />
          </g>
        )}
      </svg>
    );
  }
  const mobileNode = (
    kind: "source" | "router" | "target",
    title: string,
    ip: string,
  ) => (
    <div className={`as-mobile-node as-mobile-${kind}`}>
      <svg viewBox="-55 -55 110 110" aria-hidden="true">
        <Device kind={kind} x={0} y={0} active={f.node === kind} />
      </svg>
      <b>{title}</b>
      <code>{ip}</code>
      {f.node === kind && <small>● 현재 위치</small>}
    </div>
  );
  const mobileLink = (from: string, to: string) => {
    const active = f.edge?.[0] === from && f.edge?.[1] === to;
    return (
      <div
        className={`as-mobile-link ${active ? "as-mobile-active" : ""}`}
        aria-hidden="true"
      >
        {active && (
          <span
            key={index}
            className={`as-mobile-packet ${playing ? "as-mobile-moving" : ""}`}
          >
            IP ↓
          </span>
        )}
        {s.outcome === "blocked" &&
          index === s.frames.length - 1 &&
          from === "source" && (
            <strong className="as-mobile-stop">× 중단</strong>
          )}
      </div>
    );
  };
  return (
    <figure
      className="as-figure as-path"
      aria-label="PC와 라우터 사이의 패킷 전달"
    >
      <div className="as-kicker">03 / 이 주소로 보내려면</div>
      <h3>
        {s.local
          ? "같은 LAN이면 출구를 거치지 않아요"
          : "다른 LAN이면 라우터에게 맡겨요"}
      </h3>
      <div className="as-map">
        {drawing()}
        <div className="as-map-mobile" aria-label="세로로 본 전달 경로">
          <p className="as-mobile-zone">
            {s.sourceRange} · LAN A{s.local ? " = LAN B" : ""}
          </p>
          {mobileNode("source", "PC A · 출발지", s.source)}
          {mobileLink("source", s.local ? "target" : "router")}
          {!s.local && (
            <>
              {mobileNode("router", "라우터 · 다음 홉", "192.168.10.1")}
              {mobileLink("router", "target")}
              <p className="as-mobile-zone">{s.destinationRange} · LAN B</p>
            </>
          )}
          {mobileNode("target", "PC B · 목적지", s.destination)}
        </div>
      </div>
      <div className="as-envelope">
        <span className="as-envelope-icon" aria-hidden="true">
          ↗
        </span>
        <div>
          <small>패킷에 적힌 최종 목적지 · 이동 중에도 유지</small>
          <b>{f.packet.dst}</b>
        </div>
        <span className="as-envelope-next">
          {s.local ? "다음 홉: PC B" : `설정한 다음 홉: ${s.gateway}`}
        </span>
      </div>
      <figcaption>
        초록은 출발 LAN, 보라는 다른 LAN, 주황 장비는 라우터입니다. 잘못된 다음
        홉(.254)을 선택해도 실제 라우터의 주소(.1)는 바뀌지 않습니다. 선은 전달
        경로이며 실제 케이블 개수·거리·속도를 뜻하지 않습니다. 재생하면 패킷이
        이동하고, 정지·단계 진행에서는 도착한 위치를 확인할 수 있습니다.
      </figcaption>
    </figure>
  );
}

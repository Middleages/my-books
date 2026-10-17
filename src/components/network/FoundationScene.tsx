import type {
  Frame,
  Packet,
} from "../../simulations/network/foundation-visual.mjs";
export type SceneNode = {
  id: string;
  name: string;
  address: string;
  zone: string;
};
export function PacketFields({
  packet,
  label,
}: {
  packet: Packet;
  label: string;
}) {
  return (
    <div className="fv-fields">
      <b>
        {label} · {packet.protocol}
      </b>
      <dl>
        <div>
          <dt>출발지 IP : 포트</dt>
          <dd>
            <code>
              {packet.src} : {packet.sport}
            </code>
          </dd>
        </div>
        <div>
          <dt>목적지 IP : 포트</dt>
          <dd>
            <code>
              {packet.dst} : {packet.dport}
            </code>
          </dd>
        </div>
      </dl>
    </div>
  );
}
export function PathScene({
  nodes,
  frame,
  playing,
  frameKey,
}: {
  nodes: SceneNode[];
  frame: Frame;
  playing: boolean;
  frameKey: number;
}) {
  const route = frame.edge;
  return (
    <div className="fv-scene">
      <div className="fv-path" aria-label="실제 전달 경로">
        {nodes.map((n, i) => {
          const next = nodes[i + 1];
          const forward = route?.[0] === n.id && route?.[1] === next?.id;
          const backward = route?.[1] === n.id && route?.[0] === next?.id;
          const active = !!(forward || backward);
          return (
            <div className="fv-path-part" key={n.id}>
              <div
                className={`fv-node ${frame.node === n.id ? "fv-current" : ""}`}
              >
                <small>{n.zone}</small>
                <b>{n.name}</b>
                <code>{n.address}</code>
                <span>{frame.node === n.id ? "● 현재 위치" : "○ 대기"}</span>
              </div>
              {next && (
                <div
                  className={`fv-link ${active ? "fv-active" : ""} ${backward ? "fv-backward" : ""}`}
                >
                  <span className="fv-link-caption">
                    {active ? (backward ? "← 응답" : "요청 →") : "연결 경로"}
                  </span>
                  {active && (
                    <span
                      key={`${frameKey}-${playing}`}
                      className={`fv-traveler ${playing ? "fv-moving" : ""}`}
                      aria-label="이 구간을 이동한 IP 패킷"
                    >
                      ▣ IP
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <PacketFields packet={frame.packet} label="현재 패킷" />
    </div>
  );
}
export function FrameExplanation({
  frame,
  index,
  final,
  outcome,
}: {
  frame: Frame;
  index: number;
  final: boolean;
  outcome: string;
}) {
  return (
    <div className="fv-explanation" aria-live="polite" aria-atomic="true">
      <h3>
        {index + 1}. {frame.title}
      </h3>
      <p>{frame.detail}</p>
      {final && (
        <strong>
          {outcome === "delivered" ? "✓ 전달 완료" : "! 다음 홉에서 중단"}
        </strong>
      )}
    </div>
  );
}
export function StaticFrames({ frames }: { frames: Frame[] }) {
  return (
    <details>
      <summary>모든 단계 · 움직임 없이 읽기</summary>
      <ol>
        {frames.map((f, i) => (
          <li key={i}>
            <b>{f.title}</b>
            <p>{f.detail}</p>
            {f.change && (
              <p>
                변환 전:{" "}
                <code>
                  {f.before.src}:{f.before.sport} → {f.before.dst}:
                  {f.before.dport}
                </code>
              </p>
            )}
            <p>
              <code>
                {f.packet.src}:{f.packet.sport} → {f.packet.dst}:
                {f.packet.dport}
              </code>
            </p>
          </li>
        ))}
      </ol>
    </details>
  );
}

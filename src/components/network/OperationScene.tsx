import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type {
  OperationFrame,
  OperationNode,
  Connection,
} from "../../simulations/network/operations-visual.mjs";

export function ConnectionFields({
  connection,
  label = "현재 구간",
}: {
  connection: Connection | null;
  label?: string;
}) {
  return (
    <div className="ov-fields">
      <b>{label}</b>
      {connection ? (
        <>
          <span>{connection.protocol}</span>
          <dl>
            <div>
              <dt>출발지 주소 : 포트</dt>
              <dd>
                <code>{connection.src}</code>
              </dd>
            </div>
            <div>
              <dt>목적지 주소 : 포트</dt>
              <dd>
                <code>{connection.dst}</code>
              </dd>
            </div>
            <div>
              <dt>요청 경로</dt>
              <dd>
                <code>{connection.path}</code>
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <p>HTTP 연결 전 · DNS 조회를 관찰합니다.</p>
      )}
    </div>
  );
}
export function OperationNodeCard({
  node,
  frame,
  children,
}: {
  node: OperationNode;
  frame: OperationFrame;
  children?: ReactNode;
}) {
  return (
    <div
      className={`ov-node ${frame.node === node.id ? "ov-current" : ""}`}
      data-node={node.id}
    >
      <small>{node.zone}</small>
      <b>{node.name}</b>
      <code>{node.address}</code>
      {children}
      <span>{frame.node === node.id ? "● 현재 관찰 위치" : "○ 연결 접점"}</span>
    </div>
  );
}
// Paths use rendered card positions, so nested VM boundaries and mobile reflow stay aligned.
export function OperationScene({
  frame,
  playing,
  edges,
  children,
  kind,
}: {
  frame: OperationFrame;
  playing: boolean;
  edges: [string, string][];
  children: ReactNode;
  kind: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState<{
    width: number;
    height: number;
    paths: { key: string; d: string; reverse: boolean; active: boolean }[];
  }>({ width: 1, height: 1, paths: [] });
  const edgeKey = JSON.stringify(edges);
  const activeKey = JSON.stringify(frame.edge);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const measure = () => {
      const box = root.getBoundingClientRect();
      const paths = edges.flatMap(([from, to]) => {
        const a = root
          .querySelector<HTMLElement>(`[data-node="${from}"]`)
          ?.getBoundingClientRect();
        const b = root
          .querySelector<HTMLElement>(`[data-node="${to}"]`)
          ?.getBoundingClientRect();
        if (!a || !b) return [];
        let d;
        if (from === to) {
          const x = a.right - box.left - 18,
            y = a.top - box.top + 20;
          d = `M ${x} ${y} c 32 -30 32 54 0 24`;
        } else if (Math.abs(a.top - b.top) < Math.min(a.height, b.height) / 2) {
          const x = a.right - box.left,
            y = a.top - box.top + a.height / 2,
            tx = b.left - box.left,
            ty = b.top - box.top + b.height / 2,
            m = (x + tx) / 2;
          d = `M ${x} ${y} L ${m} ${y} L ${m} ${ty} L ${tx} ${ty}`;
        } else if (a.right < b.left) {
          const x = a.right - box.left,
            y = a.top - box.top + a.height / 2,
            tx = b.left - box.left,
            ty = b.top - box.top + b.height / 2,
            m = (x + tx) / 2;
          d = `M ${x} ${y} L ${m} ${y} L ${m} ${ty} L ${tx} ${ty}`;
        } else if (
          (kind === "proxy" && from === "proxy") ||
          (kind === "docker" && from === "host" && to === "app")
        ) {
          const x = a.left - box.left + a.width / 2,
            y = a.bottom - box.top,
            tx = b.left - box.left,
            ty = b.top - box.top + b.height / 2,
            gutter = Math.max(8, tx - 14),
            m = y + 22;
          d = `M ${x} ${y} L ${x} ${m} L ${gutter} ${m} L ${gutter} ${ty} L ${tx} ${ty}`;
        } else {
          const x = a.left - box.left + a.width / 2,
            y = a.bottom - box.top,
            tx = b.left - box.left + b.width / 2,
            ty = b.top - box.top,
            m = (y + ty) / 2;
          d = `M ${x} ${y} L ${x} ${m} L ${tx} ${m} L ${tx} ${ty}`;
        }
        const active = frame.edge?.[0] === from && frame.edge?.[1] === to;
        const reverse = frame.edge?.[0] === to && frame.edge?.[1] === from;
        return [
          {
            key: `${from}-${to}`,
            d,
            reverse: !!reverse,
            active: !!(active || reverse),
          },
        ];
      });
      const next = { width: box.width, height: box.height, paths };
      setGeometry((old) =>
        JSON.stringify(old) === JSON.stringify(next) ? old : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    root.querySelectorAll("[data-node]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // Serialized keys describe all geometry dependencies without recreating the observer each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edgeKey, activeKey, kind]);
  return (
    <div
      className={`ov-map ov-${kind}`}
      ref={ref}
      aria-label="네트워크 공간과 현재 연결 경로"
    >
      <svg
        className="ov-wires"
        width={geometry.width}
        height={geometry.height}
        aria-hidden="true"
      >
        {geometry.paths.map((p) => (
          <g key={p.key}>
            <path d={p.d} className={p.active ? "ov-active-wire" : "ov-wire"} />
            {p.active && (
              <>
                <circle
                  className="ov-static-dot"
                  cx="0"
                  cy="0"
                  r="6"
                  style={{
                    offsetPath: `path('${p.d}')`,
                    offsetDistance: "50%",
                  }}
                />
                {playing && (
                  <circle
                    key={`${frame.id}-${playing}`}
                    className="ov-moving-dot"
                    r="7"
                  >
                    <animateMotion
                      dur="1.25s"
                      path={p.d}
                      keyPoints={p.reverse ? "1;0" : "0;1"}
                      keyTimes="0;1"
                      calcMode="linear"
                      fill="freeze"
                    />
                  </circle>
                )}
              </>
            )}
          </g>
        ))}
      </svg>
      {children}
    </div>
  );
}
export function OperationExplanation({
  frame,
  index,
}: {
  frame: OperationFrame;
  index: number;
}) {
  return (
    <div className="ov-explanation" aria-live="polite" aria-atomic="true">
      <h3>
        {index + 1}. {frame.title}
      </h3>
      <p>{frame.detail}</p>
      {frame.before && (
        <ConnectionFields connection={frame.before} label="publish 진입 전" />
      )}
      <ConnectionFields connection={frame.connection} />
      {frame.code && <strong className="ov-verdict">{frame.code}</strong>}
    </div>
  );
}
export function OperationStaticFrames({
  frames,
}: {
  frames: OperationFrame[];
}) {
  return (
    <details>
      <summary>모든 단계 · 움직임 없이 읽기</summary>
      <ol>
        {frames.map((f) => (
          <li key={f.id}>
            <b>{f.title}</b>
            <p>{f.detail}</p>
            {f.before && (
              <ConnectionFields connection={f.before} label="publish 진입 전" />
            )}
            <ConnectionFields connection={f.connection} />
          </li>
        ))}
      </ol>
    </details>
  );
}

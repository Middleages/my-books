import { ConnectedScene } from './ConnectedScene';
import { clusterDiagram } from '../../simulations/kubernetes/visual-explanations.mjs';
import { useState } from "react";
import { Playback, useFoundationPlayback } from "../network/FoundationPlayback";
import {
  recoveryFrames,
  clusterFrames,
  accessDecision,
  type RecoveryOptions,
  type AccessOptions,
  type ClusterFrame,
} from "../../simulations/kubernetes/foundation.mjs";
import "./kubernetes.css";
function StaticSteps({
  frames,
}: {
  frames: { title: string; detail: string }[];
}) {
  return (
    <details className="k8-static">
      <summary>모든 단계 · 움직임 없이 읽기</summary>
      <ol>
        {frames.map((f, i) => (
          <li key={i}>
            <strong>{f.title}</strong>
            <p>{f.detail}</p>
          </li>
        ))}
      </ol>
    </details>
  );
}
function Explanation({
  frame,
  index,
}: {
  frame: { title: string; detail: string };
  index: number;
}) {
  return (
    <div className="k8-explanation" role="status" aria-atomic="true">
      <h3>
        {index + 1}. {frame.title}
      </h3>
      <p>{frame.detail}</p>
    </div>
  );
}
export function ImagePrimer() {
  return (
    <figure className="k8-primer">
      <div className="k8-image">
        <span>▧ 이미지</span>
        <strong>study-web v1</strong>
        <small>
          프로그램 + 실행에 필요한 파일
          <br />
          실행 중인 프로세스가 아님
        </small>
      </div>
      <span className="k8-arrow" aria-label="이미지에서 실행">
        →
      </span>
      <div className="k8-instance-group">
        <div>
          ▣ 실행 인스턴스 A<br />
          <small>자기 프로세스 · 쓰기 영역</small>
        </div>
        <div>
          ▣ 실행 인스턴스 B<br />
          <small>자기 프로세스 · 쓰기 영역</small>
        </div>
      </div>
      <figcaption>
        하나의 이미지로 둘을 실행해도, 실행 상태와 변경한 파일이 자동 공유되지는
        않습니다. v1은 학습 라벨입니다.
      </figcaption>
    </figure>
  );
}
export function RecoveryLab() {
  const [mode, setMode] =
    useState<NonNullable<RecoveryOptions["mode"]>>("compose");
  const [failure, setFailure] =
    useState<NonNullable<RecoveryOptions["failure"]>>("app");
  const [replicas, setReplicas] = useState(3);
  const [prediction, setPrediction] = useState("");
  const frames = recoveryFrames({ mode, failure, replicas });
  const player = useFoundationPlayback(frames.length),
    f = frames[player.index];
  const changed = () => {
    player.reset();
    setPrediction("");
  };
  const reset = () => {
    changed();
    setMode("compose");
    setFailure("app");
    setReplicas(3);
  };
  return (
    <section className="k8-lab" aria-label="복구 책임 실험">
      <p className="k8-eyebrow">01 · 직접 비교</p>
      <h2>앱 하나가 멈춤 ≠ VM 전체가 멈춤</h2>
      <p>
        같은 VM 안에서 어디까지 함께 멈추는지 예측해 보세요. 상자 하나는
        컨테이너 한 개입니다.
      </p>
      <div className="k8-controls">
        <label>
          실행 관리
          <select
            value={mode}
            onChange={(e) => {
              changed();
              setMode(e.target.value as typeof mode);
            }}
          >
            <option value="docker">Docker 직접 실행 · 정책 없음</option>
            <option value="compose">Compose · unless-stopped</option>
            <option value="kubernetes">Kubernetes · Always</option>
          </select>
        </label>
        <label>
          실패 범위
          <select
            value={failure}
            onChange={(e) => {
              changed();
              setFailure(e.target.value as typeof failure);
            }}
          >
            <option value="app">앱 하나 비정상 종료</option>
            <option value="vm">단일 VM 전체 종료</option>
          </select>
        </label>
        <label>
          같은 VM의 실행 개수
          <select
            value={replicas}
            onChange={(e) => {
              changed();
              setReplicas(Number(e.target.value));
            }}
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n}개
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="k8-predict">
        예측: 마지막에 실행 중인 컨테이너는?
        <select
          value={prediction}
          onChange={(e) => setPrediction(e.target.value)}
        >
          <option value="">먼저 예상해 보세요</option>
          <option value="all">처음 개수로 회복</option>
          <option value="some">하나 줄어든 상태</option>
          <option value="none">모두 멈춤</option>
        </select>
      </label>
      <div className="k8-recovery-scene">
        <div className="k8-image">
          <span>실행 재료</span>
          <strong>{f.image}</strong>
          <small>이름은 가상 학습 라벨</small>
        </div>
        <div className={`k8-vm ${f.vmUp ? "" : "k8-down"}`}>
          <h3>단일 VM · {f.vmUp ? "켜짐" : "꺼짐"}</h3>
          <div className="k8-agent">
            복구 담당: {f.agent}
            <br />
            <small>
              {f.vmUp ? "실행 가능한 호스트" : "이 VM 안의 관리자도 중단"}
            </small>
          </div>
          <div className="k8-instances">
            {f.instances.map((i) => (
              <div
                key={i.id}
                className={i.running ? "k8-running" : "k8-stopped"}
              >
                <strong>
                  {i.running ? "●" : "×"} 컨테이너 {i.id}
                </strong>
                <span>{i.running ? "실행 중" : "중단"}</span>
                {mode === "kubernetes" && <small>각각 별도 Pod</small>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="k8-caption">
        실행 중 {f.running} / {replicas}개 · 테두리는 VM 장애 범위, ●는 실행 중,
        ×는 중단입니다. 실행 중은 HTTP 준비 완료와 다릅니다.
      </p>
      <Playback player={player} count={frames.length} reset={reset} />
      <Explanation frame={f} index={player.index} />
      {player.index === frames.length - 1 && prediction && (
        <p className="k8-feedback">
          내 예측:{" "}
          {
            { all: "처음 개수로 회복", some: "하나 줄어듦", none: "모두 멈춤" }[
              prediction
            ]
          }{" "}
          · 관찰: {f.running}개 실행. 위의 복구 담당과 VM 상태로 이유를
          확인하세요.
        </p>
      )}
      <p className="k8-assumption">
        교육용 조건: 충분히 실행된 앱의 일회성 비정상 종료, 정상 이미지·여유
        자원·정상 runtime을 가정합니다. 실제 복구 시간·반복 실패·준비 검사·VM
        재부팅은 재현하지 않습니다. 단계 재생은 실제 초 단위 시간이 아닙니다.
      </p>
      <StaticSteps frames={frames} />
    </section>
  );
}
const names: Record<string, string> = {
  operator: "운영자 · kubectl",
  api: "API server",
  controller: "controller",
  scheduler: "scheduler",
  kubelet: "kubelet",
  runtime: "runtime",
  app: "study-web · Pod",
  browser: "웹 사용자",
  entry: "Ingress controller",
};
function Node({
  id,
  detail,
  frame,
}: {
  id: string;
  detail: string;
  frame: ClusterFrame;
}) {
  const active = frame.active.includes(id);
  return (
    <div className={`k8-node ${active ? "k8-active" : ""}`}>
      <small>{active ? "● 이번 단계" : "○ 구성 요소"}</small>
      <strong>{names[id]}</strong>
      <span>{detail}</span>
    </div>
  );
}
export function ClusterLab() {
  const [path, setPath] = useState<"control" | "http">("control");
  const [context, setContext] =
    useState<NonNullable<AccessOptions["context"]>>("lab-user");
  const [namespace, setNamespace] =
    useState<NonNullable<AccessOptions["namespace"]>>("books-lab");
  const [prediction, setPrediction] = useState("");
  const frames = clusterFrames({ path, context, namespace }),
    player = useFoundationPlayback(frames.length),
    f = frames[player.index];
  const changed = () => {
    player.reset();
    setPrediction("");
  };
  const reset = () => {
    changed();
    setPath("control");
    setContext("lab-user");
    setNamespace("books-lab");
  };
  const nodesPermission = accessDecision({
    context,
    namespace,
    action: "nodes",
  });
  return (
    <section className="k8-lab" aria-label="클러스터 경로 실험">
      <p className="k8-eyebrow">02 · 두 경로를 구분하기</p>
      <h2>설정을 보내는 길, 앱을 쓰는 길</h2>
      <div className="k8-controls">
        <label>
          관찰 경로
          <select
            value={path}
            onChange={(e) => {
              changed();
              setPath(e.target.value as typeof path);
            }}
          >
            <option value="control">제어 · 앱 배포 요청</option>
            <option value="http">데이터 · 이미 실행 중인 앱 HTTP</option>
          </select>
        </label>
        <label>
          kubectl context
          <select
            value={context}
            onChange={(e) => {
              changed();
              setContext(e.target.value as typeof context);
            }}
          >
            <option value="lab-user">lab-user · 앱 담당자</option>
            <option value="lab-admin">lab-admin · 클러스터 관리자</option>
            <option value="remote-reader">
              remote-reader · 다른 클러스터 조회자
            </option>
          </select>
        </label>
        <label>
          요청 namespace
          <select
            value={namespace}
            onChange={(e) => {
              changed();
              setNamespace(e.target.value as typeof namespace);
            }}
          >
            <option value="books-lab">books-lab</option>
            <option value="other">other</option>
          </select>
        </label>
      </div>
      <p className="k8-identity">
        kubectl 대상: <strong>{f.access.cluster}</strong> / 신원:{" "}
        <strong>{f.access.user}</strong> / namespace:{" "}
        <strong>{f.access.namespace}</strong>
      </p>
      <label className="k8-predict">
        예측: 이 경로에서 API가 하는 일은?
        <select
          value={prediction}
          onChange={(e) => setPrediction(e.target.value)}
        >
          <option value="">먼저 예상해 보세요</option>
          <option value="check">배포 요청 검사·상태 저장</option>
          <option value="http">HTTP 응답을 앱 대신 전달</option>
          <option value="outside">이 앱 HTTP 경로에 참여하지 않음</option>
        </select>
      </label>
      <Playback player={player} count={frames.length} reset={reset} />
      <div className="k8v-cluster-scene" data-scene="cluster">
        <h3>실습 클러스터 · 단일 VM의 역할 지도</h3>
        <ConnectedScene {...clusterDiagram(f,path)} label={path==='control'?'제어 관계 · API를 중심으로 따로 관찰하고 기록':'HTTP 연결 · API를 지나지 않는 앱 경로'} />
        <p className="k8v-model-note">{path==='control'?'API·controller·scheduler는 control plane, kubelet·runtime·앱은 노드 실행 역할입니다. 이 실습에서는 한 VM에 함께 있으며 위아래 길이는 거리나 시간을 뜻하지 않습니다. HTTP 요청은 별도 경로에서 관찰합니다.':'이미 실행 중인 같은 study-web 앱의 요청 경로입니다. Service는 대상 선택을 요약한 논리적 접점이며 API·scheduler·controller가 HTTP 중계 사슬에 끼지 않습니다.'}</p>
      </div>
      <p className="k8-edge">
        이번 전달:{" "}
        {f.edge ? f.edge.map((id) => names[id]).join(" → ") : "아직 전달 전"}
        {f.outcome === "denied" ? " · 거부됨 (Forbidden)" : ""}
      </p>
      <p className="k8-caption">
        ↔는 API를 통한 관찰·기록 관계입니다. controller → scheduler → kubelet의
        직접 호출 사슬이 아닙니다. ●는 현재 관찰 대상이며 다른 구성 요소가
        꺼졌다는 뜻이 아닙니다.
      </p>

      <Explanation frame={f} index={player.index} />
      {player.index === frames.length - 1 && prediction && (
        <p className="k8-feedback">
          내 예측:{" "}
          {
            {
              check: "배포 요청 검사·상태 저장",
              http: "HTTP 응답을 앱 대신 전달",
              outside: "앱 HTTP 경로에 참여하지 않음",
            }[prediction]
          }{" "}
          · 선택한 경로의 마지막 단계 설명과 비교하세요.
        </p>
      )}
      <div className="k8-permissions">
        <h3>같은 신원으로 무엇을 할 수 있나?</h3>
        <p>
          Deployment 생성: {f.access.allowed ? "허용" : "거부"} · 클러스터 Node
          목록 조회: {nodesPermission.allowed ? "허용" : "거부"}
        </p>
        <p>
          이 실험의 명시적 RBAC 예시입니다. 실제 권한은 Role·Binding 구성에
          달렸으며 namespace 자체는 보안 권한이 아닙니다. HTTP 선택 시 이 표는
          앱의 접근 권한을 판단하지 않습니다.
        </p>
      </div>
      <p className="k8-assumption">
        제어 경로는 성공 가능한 최소 배포의 교육용 관찰 순서입니다. 실제 제어
        루프는 비동기로 반복됩니다. HTTP 경로는 별도로 이미 준비된 앱·진입
        설정을 가정하며, API proxy·port-forward는 다루지 않습니다. 외부 요청의
        DNS·TLS·Service 상세와 리소스 소유 관계는 후속 장 범위입니다.
      </p>
      <StaticSteps frames={frames} />
    </section>
  );
}

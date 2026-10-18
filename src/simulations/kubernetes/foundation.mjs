// Educational observations, not Kubernetes wall-clock timing or an API emulator.
const choose = (value, options) => {
  if (!options.includes(value))
    throw new RangeError(`Unknown choice: ${value}`);
  return value;
};
export const contexts = {
  "lab-user": {
    cluster: "lab-cluster",
    user: "app-editor",
    defaultNamespace: "books-lab",
  },
  "lab-admin": {
    cluster: "lab-cluster",
    user: "cluster-admin",
    defaultNamespace: "books-lab",
  },
  "remote-reader": {
    cluster: "remote-cluster",
    user: "viewer",
    defaultNamespace: "books-lab",
  },
};
export function accessDecision({
  context = "lab-user",
  namespace = "books-lab",
  action = "deploy",
} = {}) {
  choose(context, Object.keys(contexts));
  choose(namespace, ["books-lab", "other"]);
  choose(action, ["deploy", "nodes"]);
  const identity = contexts[context];
  const allowed =
    context === "lab-admin" ||
    (context === "lab-user" &&
      namespace === "books-lab" &&
      action === "deploy");
  return {
    ...identity,
    namespace,
    action,
    allowed,
    reason: allowed
      ? "이 예시의 RBAC 규칙이 요청을 허용합니다."
      : "이 예시의 RBAC 규칙에 해당 작업 권한이 없습니다. namespace 선택은 권한을 추가하지 않습니다.",
  };
}
export function recoveryFrames({
  mode = "compose",
  failure = "app",
  replicas = 3,
} = {}) {
  choose(mode, ["docker", "compose", "kubernetes"]);
  choose(failure, ["app", "vm"]);
  choose(replicas, [1, 2, 3]);
  const agent = {
    docker: "운영자 (재시작 정책 없음)",
    compose: "Docker Engine (unless-stopped)",
    kubernetes: "kubelet + runtime (Always)",
  }[mode];
  const make = (title, detail, running, vmUp, recovered = false) => ({
    title,
    detail,
    running,
    vmUp,
    recovered,
    image: "study-web v1",
    agent,
    instances: Array.from({ length: replicas }, (_, i) => ({
      id: i + 1,
      running: i < running,
    })),
  });
  const first = make(
    "같은 이미지, 여러 실행 인스턴스",
    "이미지는 실행 재료입니다. 각각의 상자는 그 이미지로 실행 중인 컨테이너입니다.",
    replicas,
    true,
  );
  if (failure === "vm")
    return [
      first,
      make(
        "VM 전체가 꺼짐",
        "컨테이너뿐 아니라 같은 VM의 Docker Engine 또는 k3s 제어·실행 구성 요소도 멈췄습니다.",
        0,
        false,
      ),
      make(
        "복제본도 같은 장애 경계 안",
        "남아 있는 다른 노드가 없습니다. replica를 늘렸어도 이 VM이 꺼진 동안 실행할 곳이 없습니다.",
        0,
        false,
      ),
      make(
        "VM 복구는 별도 책임",
        "호스트 복구·대체 환경과 데이터 복원이 필요합니다. 이 실험은 VM을 다시 켜거나 복원하지 않습니다.",
        0,
        false,
      ),
    ];
  return [
    first,
    make(
      "앱 하나가 비정상 종료",
      "VM은 살아 있고, 마지막 컨테이너의 앱 프로세스만 종료됐습니다. 수동 stop이나 컨테이너 삭제는 아닙니다.",
      replicas - 1,
      true,
    ),
    make(
      "정책을 따라 복구 준비",
      mode === "docker"
        ? "이 시나리오는 재시작 정책이 없어 운영자의 조치를 기다립니다."
        : "실행 관리자가 재시작을 시도합니다. 실제 대기·backoff 시간과 반복 실패는 생략했습니다.",
      replicas - 1,
      true,
    ),
    make(
      mode === "docker" ? "운영자 조치가 남음" : "컨테이너가 다시 실행됨",
      mode === "docker"
        ? "docker run에도 재시작 정책을 지정할 수 있습니다. 여기서는 정책 없음과 있음의 차이를 비교했습니다."
        : mode === "compose"
          ? "Compose에 선언한 정책을 Docker Engine이 수행합니다. Compose CLI가 계속 떠 있어야 하는 것은 아닙니다."
          : "여기서는 같은 Pod 안의 컨테이너 재시작입니다. 새 Pod 생성·배치와 구분하며 준비 완료나 HTTP 성공을 뜻하지 않습니다.",
      mode === "docker" ? replicas - 1 : replicas,
      true,
      mode !== "docker",
    ),
  ];
}
export function clusterFrames({
  path = "control",
  context = "lab-user",
  namespace = "books-lab",
} = {}) {
  choose(path, ["control", "http"]);
  const access = accessDecision({ context, namespace });
  const frame = (title, detail, active, edge, outcome = "observing") => ({
    title,
    detail,
    active,
    edge,
    outcome,
    access,
  });
  if (path === "http")
    return [
      frame(
        "웹 사용자의 HTTP 요청",
        "이미 배포되어 준비된 앱과 외부 진입 설정이 있다고 가정합니다. kubectl context는 이 웹 요청의 대상이나 앱 로그인 권한을 바꾸지 않습니다.",
        ["browser"],
        null,
      ),
      frame(
        "외부 진입점",
        "이 예시는 설정된 Ingress controller가 HTTP 요청을 받습니다. DNS·TLS 세부 과정은 생략합니다.",
        ["browser", "entry"],
        ["browser", "entry"],
      ),
      frame(
        "Service 대상 경로로 전달",
        "Service는 논리적 접점입니다. 네트워크 구현을 통해 준비된 Pod의 8080으로 전달하며 독립 Service 프로세스를 뜻하지 않습니다.",
        ["entry", "app"],
        ["entry", "app"],
      ),
      frame(
        "앱이 응답",
        "응답은 연결의 반대 방향으로 돌아갑니다. 일반 웹 요청은 Kubernetes API·controller·scheduler를 경유하지 않습니다.",
        ["app", "entry", "browser"],
        ["app", "entry", "browser"],
        "response",
      ),
    ];
  const start = [
    frame(
      "대상과 신원 선택",
      `context ${context}: ${access.cluster} / ${access.user}. namespace는 ${namespace}입니다.`,
      ["operator"],
      null,
    ),
    frame(
      "API가 요청을 검사",
      access.reason,
      ["operator", "api"],
      ["operator", "api"],
      access.allowed ? "accepted" : "denied",
    ),
  ];
  if (!access.allowed) return start;
  return [
    ...start,
    frame(
      "controller가 원하는 상태를 조정",
      "API에 저장된 Deployment 등의 상태를 보고 필요한 리소스를 API를 통해 만듭니다. controller가 runtime을 직접 호출하는 그림이 아닙니다.",
      ["api", "controller"],
      ["controller", "api"],
    ),
    frame(
      "scheduler가 노드를 선택",
      "아직 배정되지 않은 Pod에 적합한 노드를 선택하고 API에 배정 결과를 기록합니다. 이 예시는 자원이 충분한 단일 노드입니다.",
      ["api", "scheduler"],
      ["scheduler", "api"],
    ),
    frame(
      "kubelet이 배정 상태를 관찰",
      "노드의 kubelet이 API에서 자신에게 배정된 Pod 정보를 관찰합니다. API 응답만으로 앱 실행 완료를 판단할 수 없습니다.",
      ["api", "kubelet"],
      ["api", "kubelet"],
    ),
    frame(
      "runtime이 컨테이너 실행",
      "kubelet이 CRI 인터페이스로 runtime에 실행을 요청합니다. 이미지 가져오기·네트워크·볼륨 준비 실패는 여기서 생략합니다.",
      ["kubelet", "runtime", "app"],
      ["kubelet", "runtime"],
      "running",
    ),
  ];
}

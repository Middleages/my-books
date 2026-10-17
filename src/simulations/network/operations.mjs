// Fixed teaching scenarios; no sockets, Docker commands or browser requests are run.
export function proxyResult({
  host = "portal",
  path = "/api/items",
  strip = true,
  fault = "none",
  upstreamTls = true,
  trusted = true,
} = {}) {
  const app =
    host === "reports"
      ? "보고서 앱"
      : path.startsWith("/api/")
        ? "API 앱"
        : "화면 앱";
  const uri =
    host === "portal" && path.startsWith("/api/") && strip
      ? path.slice(4)
      : path;
  const steps = [
    "외부 TLS 성공 · 브라우저가 프록시 인증서를 검증했습니다.",
    `HTTP 분기 · ${host}.example.test${path} → ${app}`,
    `upstream 요청 경로 · ${uri}`,
  ];
  if (fault === "refused")
    return {
      ok: false,
      code: "502",
      app,
      uri,
      steps: [
        ...steps,
        "upstream TCP 연결 거부 · 이 사례에서는 앱 리스너가 없습니다.",
      ],
      next: "프록시가 실행되는 공간에서 대상 주소·포트와 앱 리스너를 확인합니다.",
    };
  if (upstreamTls && !trusted)
    return {
      ok: false,
      code: "502",
      app,
      uri,
      steps: [
        ...steps,
        "내부 TLS 검증 실패 · 프록시의 CA 신뢰가 없습니다. 앱 HTTP 요청은 전달되지 않았습니다.",
      ],
      next: "프록시의 upstream CA bundle을 확인합니다. 브라우저의 CA를 바꿀 문제가 아닙니다.",
    };
  steps.push(
    upstreamTls
      ? "내부 TLS 성공 · 프록시가 upstream 인증서를 별도로 검증했습니다."
      : "내부 HTTP · 이 구간의 TLS 암호화는 없습니다.",
  );
  if (fault === "timeout")
    return {
      ok: false,
      code: "504",
      app,
      uri,
      steps: [
        ...steps,
        "upstream 응답 대기 시간 초과 · 이 사례에서는 연결 후 응답이 멈췄습니다.",
      ],
      next: "upstream 응답 시간과 프록시 error log를 비교합니다. 시간 초과만으로 방화벽을 단정하지 않습니다.",
    };
  const ok = app !== "API 앱" || uri === "/items";
  return {
    ok,
    code: ok ? "200" : "404",
    app,
    uri,
    steps: [
      ...steps,
      ok
        ? "앱 응답 수신 · 200을 브라우저로 전달합니다."
        : "앱 응답 수신 · API에는 /items만 있어 404를 반환합니다.",
    ],
    next: ok
      ? "외부와 내부 연결을 구분해 기록합니다."
      : "실제 앱 라우트와 proxy_pass의 URI 치환을 비교합니다. 연결 자체는 성공했습니다.",
  };
}
export function dockerResult({
  placement = "host",
  target = "loopback",
  publish = "loopback",
  bind = "all",
  network = true,
  allowed = true,
} = {}) {
  const paths = {
    host: "호스트 Nginx → 호스트 127.0.0.1:18001 → 앱:8000",
    container: "프록시 컨테이너 → app:8000",
    remote: "다른 VM의 프록시 → 앱 VM 192.0.2.20:18001 → 앱:8000",
  };
  const fail = (why, next) => ({
    ok: false,
    path: paths[placement],
    why,
    next,
  });
  if (placement === "container") {
    if (target !== "service")
      return fail(
        "프록시 컨테이너의 localhost는 앱 컨테이너가 아닙니다.",
        "같은 사용자 정의 bridge에 연결하고 app:8000으로 접속합니다.",
      );
    if (!network)
      return fail(
        "공유 네트워크 없음 · 이 모델에서는 app 이름 해석과 직접 연결이 성립하지 않습니다.",
        "프록시와 앱의 Compose networks를 확인합니다.",
      );
  } else {
    if (placement === "remote" && target !== "vm")
      return fail(
        "원격 프록시에서 127.0.0.1은 프록시 VM 자신입니다.",
        "앱 VM의 도달 가능한 주소를 목적지로 사용합니다.",
      );
    if (placement === "host" && target !== "loopback")
      return fail(
        "호스트는 이 모델에서 Docker의 app 서비스 이름을 해석하지 않습니다.",
        "호스트 Nginx에는 127.0.0.1:18001 publish 경로를 사용합니다.",
      );
    if (publish === "none")
      return fail(
        "호스트 18001에 publish된 앱이 없습니다.",
        "이 배치는 host→container 경로를 사용하므로 필요한 주소에 publish합니다.",
      );
    if (placement === "remote" && publish === "loopback")
      return fail(
        "앱 VM의 loopback에만 publish했습니다. 원격 VM에서 도달하지 못합니다.",
        "앱 VM의 도달 가능한 인터페이스에 publish하고 프록시 출발지를 허용합니다.",
      );
    if (placement === "remote" && !allowed)
      return fail(
        "원격 경로의 허용 규칙이 차단합니다.",
        "프록시 출발지와 앱 VM 목적지 포트에 대한 정책을 확인합니다.",
      );
  }
  if (bind === "loopback")
    return fail(
      "앱이 컨테이너 자신의 127.0.0.1:8000에서만 listen합니다.",
      "앱을 컨테이너 인터페이스에서 받도록 설정합니다. IPv4 예: 0.0.0.0:8000.",
    );
  return {
    ok: true,
    path: paths[placement],
    why:
      placement === "container"
        ? "같은 네트워크의 app:8000으로 직접 연결합니다. 앱 publish는 필요하지 않습니다."
        : "publish를 통해 앱의 8000 리스너까지 연결합니다.",
    next:
      publish === "all"
        ? "모든 호스트 IPv4 주소에 publish한 상태입니다. 사용자망에서 직접 접근할 필요가 있는지 별도로 판단하세요."
        : "필요한 연결 경로만 구성했습니다. 사용자 인증과 TLS는 별도 조건입니다.",
  };
}
export function corsResult({
  target = "cross",
  kind = "get",
  allowOrigin = "none",
  allowPreflight = false,
  credentials = false,
  allowCredentials = false,
} = {}) {
  if (target === "http")
    return {
      sent: false,
      readable: false,
      preflight: false,
      stage: "mixed content",
      steps: [
        "HTTPS 페이지에서 일반 HTTP API로 fetch합니다.",
        "브라우저가 혼합 콘텐츠로 차단합니다. API 본 요청을 보내지 않습니다.",
      ],
      next: "API를 HTTPS로 제공하거나 같은 HTTPS origin의 /api 프록시를 사용합니다. CORS 헤더 추가로 해결되지 않습니다.",
    };
  const cross = target === "cross";
  const preflight = cross && kind === "json";
  const originOK =
    allowOrigin === "exact" || (allowOrigin === "star" && !credentials);
  const corsOK = originOK && (!credentials || allowCredentials);
  const steps = [
    cross
      ? "다른 origin · https://api.example.test/items"
      : "같은 origin · https://portal.example.test/api/items",
  ];
  if (preflight) {
    steps.push(
      "OPTIONS 사전 확인 · POST와 Content-Type: application/json을 허용하는지 묻습니다.",
    );
    if (!corsOK || !allowPreflight)
      return {
        sent: false,
        readable: false,
        preflight,
        stage: "preflight 차단",
        steps: [...steps, "사전 확인 실패 · POST 본 요청은 전송하지 않습니다."],
        next: "OPTIONS 응답의 origin·credentials와 허용 메서드·헤더를 확인합니다. OPTIONS는 도착했을 수 있습니다.",
      };
    steps.push("사전 확인 통과 · 본 요청을 보냅니다.");
  }
  steps.push(
    `${kind === "json" ? "POST" : "GET"} 본 요청 도착 · 이 모델의 서버가 처리하고 200으로 응답했습니다.`,
  );
  const readable = !cross || corsOK;
  return {
    sent: true,
    readable,
    preflight,
    stage: readable ? "JS 읽기 허용" : "응답 읽기 차단",
    steps: [
      ...steps,
      readable
        ? "JavaScript가 응답 내용을 읽습니다."
        : "서버 처리는 끝났지만 JavaScript는 응답 내용을 읽지 못합니다.",
    ],
    next: readable
      ? "CORS 통과는 로그인·권한이나 업무 성공을 보장하지 않습니다."
      : "실제 응답의 CORS 헤더를 확인합니다. 재전송 전에 서버 처리 여부를 확인하세요.",
  };
}

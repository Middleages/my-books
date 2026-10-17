import { proxyResult, dockerResult } from "./operations.mjs";

// Observation frames, not a real NGINX/Docker implementation. Verdicts remain in operations.mjs.
export function proxyJourney(options = {}) {
  const s = {
    host: "portal",
    path: "/api/items",
    strip: true,
    fault: "none",
    upstreamTls: true,
    trusted: true,
    browserTrusted: true,
    ...options,
  };
  const authority = s.authority ?? s.host;
  const sni = s.sni ?? s.host;
  const domain = `${s.host}.example.test`;
  const certificate = `${sni}.example.test`;
  const r = proxyResult({ ...s, host: authority });
  const appId =
    r.app === "API 앱" ? "api" : r.app === "화면 앱" ? "web" : "reports";
  const apps = [
    {
      id: "web",
      name: "화면 앱",
      address: `10.0.0.20:${s.upstreamTls ? 8443 : 8000}`,
      zone: "내부 앱 VM · .20",
    },
    {
      id: "api",
      name: "API 앱",
      address: `10.0.0.21:${s.upstreamTls ? 8443 : 8000}`,
      zone: "내부 앱 VM · .21",
    },
    {
      id: "reports",
      name: "보고서 앱",
      address: `10.0.0.22:${s.upstreamTls ? 8443 : 8000}`,
      zone: "내부 앱 VM · .22",
    },
  ];
  const app = apps.find((a) => a.id === appId);
  const external = {
    src: "198.51.100.30:51000",
    dst: "192.0.2.10:443",
    protocol: "HTTPS · TLS A",
    path: s.path,
  };
  const upstream = {
    src: "10.0.0.10:52000",
    dst: app.address,
    protocol: s.upstreamTls ? "HTTPS · TLS B" : "HTTP · TLS 없음",
    path: r.uri,
  };
  const frames = [];
  const add = (id, title, detail, node, edge, connection, extra = {}) =>
    frames.push({ id, title, detail, node, edge, connection, ...extra });
  add(
    "dns",
    "DNS · 이름으로 주소 찾기",
    `${domain} → 192.0.2.10. 두 도메인은 같은 IP를 반환합니다. DNS는 /api/ 경로를 보지 않습니다. DNS 왕복은 아래 HTTP 연결선과 별개이며 생략했습니다.`,
    "user",
    null,
    null,
  );
  add(
    "external-tcp",
    "외부 TCP 연결",
    `브라우저의 임시 포트 51000에서 프록시 443으로 새 연결 A를 만듭니다. 내부 앱에는 아직 연결하지 않았습니다.`,
    "proxy",
    ["user", "proxy"],
    { ...external, protocol: "TCP · 연결 A", path: "아직 HTTP 전송 전" },
  );
  const externalOK = s.browserTrusted && sni === s.host;
  add(
    "external-tls",
    "TLS A · SNI와 외부 인증서",
    `SNI=${certificate}로 선택한 인증서 SAN=${certificate}. 브라우저는 URL 이름 ${domain}와 대조하고 자기 CA로 검증합니다. ${externalOK ? "외부 검증 통과." : !s.browserTrusted ? "브라우저에 신뢰 CA가 없어 중단합니다." : "URL과 인증서 이름이 달라 중단합니다."}`,
    "proxy",
    ["proxy", "user"],
    {
      ...external,
      src: external.dst,
      dst: external.src,
      path: "HTTP 경로는 TLS 안에서 나중에 전송",
    },
  );
  let result = r;
  let origin;
  if (!externalOK) {
    result = {
      ...r,
      ok: false,
      code: "TLS 중단",
      steps: frames.map((frame) => frame.detail),
      next: "브라우저의 접속 이름·SNI 선택 인증서·신뢰 CA를 확인합니다. upstream 설정은 이 실패를 고치지 않습니다.",
    };
    origin = "브라우저 · 외부 TLS";
    frames.at(-1).code = result.code;
  } else {
    add(
      "route",
      "HTTP · Host/authority와 path로 분기",
      `TLS 해독 후 Host/authority=${authority}.example.test, path=${s.path}를 읽어 ${r.app}을 선택합니다. 인증서 선택과는 다른 판단입니다.`,
      "proxy",
      null,
      external,
    );
    add(
      "upstream-tcp",
      "프록시가 새 upstream 연결 B 생성",
      `연결 A를 그대로 앱으로 보내는 것이 아닙니다. 프록시 내부 주소의 임시 포트 52000에서 ${app.address}로 연결 B를 시도합니다.`,
      appId,
      ["proxy", appId],
      { ...upstream, protocol: "TCP · 연결 B", path: "아직 HTTP 전송 전" },
    );
    if (s.fault === "refused") {
      origin = "프록시 · upstream TCP";
      add("refused", "연결 거부를 관찰", r.steps.at(-1), appId, null, {
        ...upstream,
        protocol: "TCP · 연결 거부",
        path: "HTTP 전송 안 됨",
      });
    } else if (s.upstreamTls && !s.trusted) {
      origin = "프록시 · upstream TLS";
      add(
        "upstream-tls",
        "TLS B · 프록시의 별도 검증 실패",
        r.steps.at(-1),
        "proxy",
        [appId, "proxy"],
        {
          ...upstream,
          src: upstream.dst,
          dst: upstream.src,
          path: "HTTP 전송 안 됨",
        },
      );
    } else {
      add(
        "upstream-tls",
        s.upstreamTls ? "TLS B · 독립적인 검증 통과" : "B는 HTTP · TLS 없음",
        s.upstreamTls
          ? "프록시가 내부 이름·체인·유효기간과 프록시 CA 신뢰를 별도로 확인합니다. 브라우저의 CA 신뢰는 이 검증에 전달되지 않습니다."
          : "외부 A는 HTTPS 그대로지만 내부 B는 암호화되지 않은 HTTP입니다.",
        appId,
        null,
        { ...upstream, path: "아직 HTTP 전송 전" },
      );
      add(
        "upstream-http",
        "앱이 받는 요청 경로",
        `GET ${r.uri} · ${authority}.example.test를 Host로 명시 전달하는 모델입니다. API 앱은 /items만 제공합니다.`,
        appId,
        ["proxy", appId],
        upstream,
      );
      origin =
        s.fault === "timeout"
          ? "프록시 · upstream 응답 대기"
          : `${r.app} · HTTP 응답`;
      add(
        "upstream-response",
        s.fault === "timeout" ? "응답 대기 시간 초과" : "앱의 HTTP 응답",
        r.steps.at(-1),
        s.fault === "timeout" ? "proxy" : appId,
        s.fault === "timeout" ? null : [appId, "proxy"],
        { ...upstream, src: upstream.dst, dst: upstream.src },
      );
    }
    add(
      "external-response",
      `브라우저로 HTTP ${r.code} 반환`,
      `${origin}에서 관찰한 이 사례의 결과입니다. ${r.next} 오류 코드 하나로 실제 원인을 단정하지 않습니다.`,
      "user",
      ["proxy", "user"],
      { ...external, src: external.dst, dst: external.src },
      { code: r.code },
    );
  }
  const comparison = [true, false].map((strip) => {
    const c = proxyResult({ ...s, host: authority, strip });
    return {
      strip,
      config: `proxy_pass ${s.upstreamTls ? "https" : "http"}://${app.address}${strip ? "/" : ""};`,
      uri: c.uri,
      applies: authority === "portal" && s.path.startsWith("/api/"),
    };
  });
  return {
    domain,
    authority: `${authority}.example.test`,
    certificate,
    external,
    upstream,
    appId,
    apps,
    uri: r.uri,
    comparison,
    result,
    origin,
    frames,
    tls: [
      {
        name: "A · 브라우저 → 프록시",
        verifier: "브라우저 CA",
        certificate,
        state: externalOK ? "검증 통과" : "검증 실패",
      },
      {
        name: "B · 프록시 → 앱",
        verifier: "프록시 CA",
        certificate: `${appId}.internal.example.test`,
        state: !externalOK
          ? "연결하지 않음"
          : s.fault === "refused"
            ? "TCP 중단"
            : !s.upstreamTls
              ? "HTTP · 검증 없음"
              : s.trusted
                ? "검증 통과"
                : "신뢰 없음",
      },
    ],
  };
}

export function dockerJourney(options = {}) {
  const s = {
    placement: "host",
    target: "loopback",
    publish: "loopback",
    bind: "all",
    network: true,
    allowed: true,
    expose: true,
    ...options,
  };
  const result = dockerResult(s);
  const owner = {
    host: "앱 VM의 호스트",
    container: "프록시 컨테이너",
    remote: "다른 VM의 호스트",
  }[s.placement];
  const start = s.placement;
  const remote = s.placement === "remote";
  const direct = s.placement === "container";
  const service = s.target === "service";
  const source =
    s.target === "loopback"
      ? "127.0.0.1:52000"
      : direct
        ? "172.20.0.2:52000"
        : remote
          ? "192.0.2.10:52000"
          : "127.0.0.1:52000";
  const dest = service
    ? "app:8000"
    : s.target === "vm"
      ? "192.0.2.20:18001"
      : `127.0.0.1:${direct ? 8000 : 18001}`;
  const requested = {
    src: source,
    dst: dest,
    protocol: "HTTP / TCP",
    path: "/items",
  };
  // Destination publish mapping is stable. Exact source after hairpin/userland-proxy depends on implementation.
  const translated = {
    ...requested,
    src: "프록시 출발 · 구현별 NAT/중계 후 주소",
    dst: "172.20.0.3:8000",
  };
  const frames = [];
  const add = (
    id,
    title,
    detail,
    node,
    edge = null,
    connection = null,
    extra = {},
  ) => frames.push({ id, title, detail, node, edge, connection, ...extra });
  add(
    "start",
    "요청 출발 위치",
    `프록시는 ${owner}에서 실행됩니다. 여기서 localhost는 ${owner} 자신입니다. 지금 목적지는 ${dest}입니다.`,
    start,
    null,
    requested,
  );
  const finish = (node, connection) => {
    add(
      "result",
      result.ok ? "앱까지 연결 성공" : "이 위치에서 연결 중단",
      `${result.why} 다음 확인: ${result.next}`,
      node,
      null,
      connection,
      { code: result.ok ? "연결 성공" : "연결 실패" },
    );
  };
  if ((direct && !service) || (remote && s.target !== "vm")) {
    const local = {
      ...requested,
      src: `127.0.0.1:52000`,
      dst: `127.0.0.1:${direct ? 8000 : 18001}`,
    };
    add(
      "own-loopback",
      "자기 loopback으로 돌아감",
      `127.0.0.1은 ${owner} 안에 머뭅니다. 이 모델에는 그 공간의 해당 포트에 앱 리스너가 없습니다.`,
      start,
      [start, start],
      local,
    );
    finish(start, local);
  } else if (
    (direct && !s.network) ||
    (!direct && !remote && s.target !== "loopback")
  ) {
    add("dns", "app 이름을 찾을 수 없음", result.why, start, null, requested);
    finish(start, requested);
  } else if (direct) {
    const internal = { ...requested, dst: "172.20.0.3:8000" };
    add(
      "dns",
      "Docker DNS · app 이름 해석",
      "같은 사용자 정의 bridge의 app → 172.20.0.3. 호스트 publish 목록은 이 경로에 관여하지 않습니다.",
      "container",
      null,
      internal,
    );
    add(
      "connect",
      "bridge 안에서 직접 연결",
      "프록시 컨테이너 인터페이스 → bridge → 앱 컨테이너 인터페이스. 호스트의 18001을 거치지 않습니다.",
      "app",
      ["container", "app"],
      internal,
    );
    add(
      "listen",
      "앱 listen 접점 확인",
      s.bind === "all"
        ? "앱이 0.0.0.0:8000에서 기다려 컨테이너 인터페이스로 온 연결을 받습니다."
        : "연결은 앱 인터페이스에 왔지만 앱은 자기 127.0.0.1:8000에서만 기다립니다. EXPOSE나 publish로 고쳐지지 않습니다.",
      "app",
      null,
      internal,
    );
    finish("app", internal);
  } else {
    add(
      "host-connect",
      remote ? "다른 VM에서 앱 VM으로" : "호스트의 publish 접점으로",
      remote
        ? "VM 사이 경로의 목적지는 앱 VM 192.0.2.20:18001입니다."
        : "이 호스트의 127.0.0.1:18001 접점으로 연결합니다.",
      "host",
      remote ? ["remote", "host"] : null,
      requested,
    );
    if (
      s.publish === "none" ||
      (remote && s.publish === "loopback") ||
      (remote && !s.allowed)
    ) {
      add(
        "host-gate",
        "publish·허용 조건 확인",
        result.why,
        "host",
        null,
        requested,
      );
      finish("host", requested);
    } else {
      add(
        "publish",
        "publish · 호스트 접점 → 컨테이너",
        `${s.publish === "all" ? "0.0.0.0" : "127.0.0.1"}:18001 → 172.20.0.3:8000. 목적지 변환/중계의 논리 경로입니다. 출발지 주소의 세부 변환은 Docker 구현·userland-proxy 등에 따라 달라 고정하지 않습니다.`,
        "app",
        ["host", "app"],
        translated,
        { before: requested },
      );
      add(
        "listen",
        "앱 listen 접점 확인",
        s.bind === "all"
          ? "앱이 컨테이너 인터페이스의 8000 연결을 받습니다."
          : "컨테이너 인터페이스 172.20.0.3:8000에 도착해도 앱이 loopback에만 bind하여 받지 못합니다.",
        "app",
        null,
        translated,
      );
      finish("app", translated);
    }
  }
  return {
    result,
    frames,
    localhostOwner: owner,
    publish:
      s.publish === "none"
        ? "publish 없음"
        : `${s.publish === "all" ? "0.0.0.0" : "127.0.0.1"}:18001 → 8000`,
    bind: s.bind === "all" ? "0.0.0.0:8000" : "127.0.0.1:8000",
    expose: s.expose
      ? "EXPOSE 8000 · 설명 정보"
      : "EXPOSE 없음 · 연결 판정 동일",
    network: s.network,
    nodes: [
      {
        id: "remote",
        name: remote ? "프록시" : "다른 VM",
        address: "192.0.2.10",
        zone: "별도 OS · 호스트 namespace",
      },
      {
        id: "host",
        name:
          s.placement === "host"
            ? "호스트 프록시 / publish 접점"
            : "호스트 publish 접점",
        address: "192.0.2.20 / 127.0.0.1",
        zone: "앱 VM · 호스트 namespace",
      },
      {
        id: "container",
        name: direct ? "프록시 컨테이너" : "컨테이너 예시",
        address: "172.20.0.2 / 127.0.0.1",
        zone: "별도 network namespace",
      },
      {
        id: "app",
        name: "앱 컨테이너",
        address: "172.20.0.3 / 127.0.0.1",
        zone: "별도 network namespace",
      },
    ],
    roles: [
      {
        title: "앱 listen/bind",
        value:
          s.bind === "all"
            ? "모든 컨테이너 IPv4 인터페이스"
            : "컨테이너 자기 loopback만",
        detail: "앱 프로세스가 연결을 받는 위치",
      },
      {
        title: "Docker publish",
        value:
          s.publish === "none"
            ? "없음"
            : s.publish === "all"
              ? "모든 호스트 IPv4 주소"
              : "호스트 loopback만",
        detail: "호스트 접점과 컨테이너 포트 연결",
      },
      {
        title: "경로·방화벽",
        value: s.allowed ? "원격 프록시 허용" : "원격 프록시 차단",
        detail: "원격 경로에만 적용하는 교육 조건",
      },
      {
        title: "EXPOSE",
        value: s.expose ? "8000 포트 정보 있음" : "포트 정보 없음",
        detail: "리스너·publish·방화벽을 만들지 않음",
      },
    ],
  };
}

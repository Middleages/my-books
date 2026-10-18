import { requestTrace, certificateResult } from "./web.mjs";
import { corsResult } from "./operations.mjs";
// Fixed observation frames, not a live browser stack or protocol clock.
const pc = "198.51.100.30:51000";
const dnsPc = "198.51.100.30:53000";
const resolver = "192.0.2.53:53";
const domain = "app.example.test";
const connection = (src, dst, protocol, path, pathLabel = "관찰 내용") => ({
  src,
  dst,
  protocol,
  path,
  pathLabel,
});
const reverse = (c) => ({ ...c, src: c.dst, dst: c.src });
export function httpJourney({
  scheme = "https",
  scenario = "healthy",
  path = "/report",
  host = domain,
} = {}) {
  const secure = scheme === "https",
    port = secure ? 443 : 80;
  const fault = scenario === "tls" && !secure ? "healthy" : scenario;
  const trace = requestTrace(fault, path, host);
  const requestTarget = path + "?day=today";
  const requestMessage = `GET ${requestTarget} HTTP/1.1\nHost: ${host}\nAccept: application/json`;
  const url = `${scheme}://${domain}${requestTarget}#summary`;
  const dns = connection(
    dnsPc,
    resolver,
    "DNS / UDP",
    `${domain} / A`,
    "질문 이름 / 레코드 종류",
  );
  const tcp = connection(pc, `192.0.2.10:${port}`, "TCP", "SYN · 새 연결 시작");
  const frames = [];
  let state = {
    dns: "대기",
    tcp: "대기",
    tls: secure ? "대기" : "사용 안 함",
    requestSent: false,
    responseCode: null,
  };
  const add = (
    id,
    phase,
    title,
    detail,
    node,
    edge,
    c,
    patch = {},
    known = "",
    unknown = "",
  ) => {
    state = { ...state, ...patch };
    frames.push({
      id,
      phase,
      title,
      detail,
      node,
      edge,
      connection: c,
      ...state,
      known,
      unknown,
    });
  };
  add(
    "url",
    "URL",
    "브라우저가 URL을 나눠 읽음",
    "이름·포트·경로의 쓰임이 다릅니다. #summary는 브라우저 안에 남습니다.",
    "browser",
    null,
    null,
  );
  add(
    "dns-query",
    "DNS",
    "이름만 리졸버에 질문",
    "/report·포트·fragment는 A 조회 질문에 포함하지 않습니다.",
    "resolver",
    ["browser", "resolver"],
    dns,
  );
  const d = trace[0];
  add(
    "dns-answer",
    "DNS",
    d.known,
    d.detail,
    "browser",
    ["resolver", "browser"],
    { ...reverse(dns), path: d.known },
    { dns: d.ok ? "주소 얻음" : "실패" },
    d.known,
    d.unknown,
  );
  if (d.ok) {
    add(
      "tcp-start",
      "TCP",
      "해석한 IP와 서비스 포트로 연결",
      "DNS 서버의 53 포트와 앱 서버의 포트는 별개입니다.",
      "server",
      ["browser", "server"],
      tcp,
    );
    const t = trace[1];
    if (t.ok) {
      add(
        "tcp-synack",
        "TCP",
        "서버의 SYN-ACK가 돌아옴",
        "서버가 새 연결 요청에 답합니다. 마지막 ACK는 다음 단계에서 클라이언트가 보냅니다.",
        "browser",
        ["server", "browser"],
        { ...reverse(tcp), path: "SYN-ACK" },
      );
      add(
        "tcp-ack",
        "TCP",
        "마지막 ACK · TCP 연결 준비 완료",
        t.detail,
        "server",
        ["browser", "server"],
        { ...tcp, path: "ACK · 연결 준비 완료" },
        { tcp: "연결됨" },
        `192.0.2.10:${port} 연결 성공`,
        t.unknown,
      );
    } else {
      add(
        "tcp-result",
        "TCP",
        "TCP 연결 거부",
        t.detail,
        "browser",
        ["server", "browser"],
        { ...reverse(tcp), path: "RST · 이 사례의 연결 거부" },
        { tcp: "실패" },
        t.known,
        t.unknown,
      );
    }
    if (t.ok) {
      let tlsOK = true;
      if (secure) {
        add(
          "tls-hello",
          "TLS",
          "SNI로 서비스 이름을 알림",
          `SNI=${domain}. HTTP Host 진단값 ${host}와 별개입니다. 경로는 여기서 보내지 않습니다.`,
          "server",
          ["browser", "server"],
          connection(pc, tcp.dst, "TLS / TCP", `ClientHello · SNI ${domain}`),
        );
        add(
          "tls-certificate",
          "TLS",
          "서버 인증서 목록을 받음",
          "서버는 공개 인증서 정보를 보냅니다. 개인키를 보내는 과정이 아닙니다.",
          "browser",
          ["server", "browser"],
          connection(tcp.dst, pc, "TLS / TCP", `SAN DNS:${domain} · 중간 CA`),
        );
        const cert = certificateResult({ trusted: fault !== "tls" });
        tlsOK = cert.ok;
        add(
          "tls-check",
          "TLS",
          tlsOK ? "브라우저의 인증서 검증 통과" : "브라우저의 인증서 검증 실패",
          tlsOK
            ? "이름·기간·중간 CA·브라우저 신뢰 조건을 통과했다고 가정합니다. TLS 협상도 정상 완료한 뒤 HTTP로 진행합니다."
            : trace.at(-1).detail,
          "browser",
          null,
          connection(
            pc,
            tcp.dst,
            "TLS / TCP",
            cert.checks
              .map((c) => `${c.label}: ${c.ok ? "통과" : "실패"}`)
              .join(" / "),
          ),
          { tls: tlsOK ? "통과" : "실패" },
          tlsOK ? "서버 신원과 보호된 연결" : "신뢰 CA 없음",
          "HTTP 상태 코드·업무 처리 결과",
        );
      }
      if (tlsOK) {
        const req = trace.find((t) => t.stage === "HTTP 요청"),
          res = trace.at(-1);
        add(
          "http-request",
          "HTTP 요청",
          "HTTP 요청이 서버에 도착",
          req.detail,
          "server",
          ["browser", "server"],
          connection(
            pc,
            tcp.dst,
            secure ? "HTTPS / TLS / TCP" : "HTTP / TCP",
            requestTarget,
            "요청 경로 + 질의",
          ),
          { requestSent: true },
          requestMessage,
          req.unknown,
        );
        const code = Number(res.known.slice(5));
        add(
          "http-response",
          "HTTP 응답",
          res.known + " 응답이 브라우저에 도착",
          res.detail,
          "browser",
          ["server", "browser"],
          connection(
            tcp.dst,
            pc,
            secure ? "HTTPS / TLS / TCP" : "HTTP / TCP",
            `HTTP ${code} · ${requestTarget}`,
            "응답 상태 / 대응 요청",
          ),
          { responseCode: code },
          res.known,
          res.unknown,
        );
      }
    }
  }
  const last = frames.at(-1),
    code = last.responseCode;
  return {
    url,
    domain,
    sni: domain,
    port,
    scheme,
    host,
    requestTarget,
    requestMessage,
    frames,
    result: {
      code,
      outcome: code === null ? "before" : "response",
      detail: last.detail,
    },
    parts: [
      { id: "scheme", label: "방식", value: scheme, phases: ["URL", "TLS"] },
      {
        id: "name",
        label: "이름 → DNS·SNI",
        value: domain,
        phases: ["DNS", "TLS"],
      },
      { id: "port", label: "서버 포트", value: String(port), phases: ["TCP"] },
      {
        id: "path",
        label: "경로 + 질의 → HTTP",
        value: requestTarget,
        phases: ["HTTP 요청", "HTTP 응답"],
      },
      {
        id: "fragment",
        label: "브라우저 안에만 남음",
        value: "#summary",
        phases: ["URL"],
      },
    ],
    stages: [
      "DNS",
      "TCP",
      ...(secure ? ["TLS"] : []),
      "HTTP 요청",
      "HTTP 응답",
    ],
  };
}
export function corsJourney({
  target = "cross",
  kind = "get",
  allowOrigin = "none",
  allowPreflight = false,
  credentials = false,
  allowCredentials = false,
  preflightPolicy = "same",
} = {}) {
  const state = {
    target,
    kind,
    allowOrigin,
    allowPreflight,
    credentials,
    allowCredentials,
  };
  // Reuse existing CORS decisions independently for the OPTIONS gate and actual response.
  const preSettings =
    preflightPolicy === "permit"
      ? { allowOrigin: "exact", allowCredentials: true }
      : preflightPolicy === "deny"
        ? { allowOrigin: "none", allowCredentials: false }
        : {};
  const gate = corsResult({ ...state, ...preSettings });
  const actual = gate.sent ? corsResult({ ...state, kind: "get" }) : gate;
  const result = {
    ...actual,
    preflight: gate.preflight,
    steps: [],
  };
  const pageOrigin = "https://portal.example.test";
  const apiOrigin =
    target === "same"
      ? pageOrigin
      : `${target === "http" ? "http" : "https"}://api.example.test`;
  const path = target === "same" ? "/api/items" : "/items";
  const method = kind === "json" ? "POST" : "GET";
  const endpoint =
    target === "same"
      ? "192.0.2.10:443"
      : target === "http"
        ? "192.0.2.20:80"
        : "192.0.2.20:443";
  const frames = [];
  let progress = {
    optionsSent: false,
    optionsArrived: false,
    mainSent: false,
    mainArrived: false,
    processed: false,
    responseArrived: false,
    readable: "대기",
    jsValue: "응답 대기",
  };
  const local = (from, to, label) => ({
    ...connection(from, to, "브라우저 내부의 정보 전달", label),
    sourceLabel: "출발 기능",
    destinationLabel: "도착 기능",
  });
  const headers = (origin, ac) =>
    `Access-Control-Allow-Origin: ${origin === "none" ? "(없음)" : origin === "star" ? "*" : pageOrigin}\nAccess-Control-Allow-Credentials: ${ac ? "true" : "(없음)"}`;
  const pfOrigin = preSettings.allowOrigin ?? allowOrigin,
    pfCredentials = preSettings.allowCredentials ?? allowCredentials;
  const preflightHeaders =
    headers(pfOrigin, pfCredentials) +
    `\nAccess-Control-Allow-Methods: ${allowPreflight ? "POST" : "(없음)"}\nAccess-Control-Allow-Headers: ${allowPreflight ? "Content-Type" : "(없음)"}`;
  const actualHeaders = headers(allowOrigin, allowCredentials);
  const requestHeaders = `${target !== "same" || kind === "json" ? `Origin: ${pageOrigin}` : "같은 origin GET · Origin 헤더 생략"}${kind === "json" ? "\nContent-Type: application/json" : ""}\ncredentials 모드: ${credentials ? "include" : "same-origin"}`;
  const add = (id, title, detail, node, edge, c, patch = {}, message = "") => {
    progress = { ...progress, ...patch };
    frames.push({
      id,
      title,
      detail,
      node,
      edge,
      connection: c,
      ...progress,
      message,
    });
  };
  add(
    "fetch",
    "페이지 코드가 fetch 호출",
    `${pageOrigin}의 코드가 ${apiOrigin}${path}를 요청합니다. 아직 API 본 요청은 전송하지 않았습니다.`,
    "js",
    null,
    null,
  );
  add(
    "policy",
    "브라우저가 origin과 콘텐츠 정책 확인",
    target === "same"
      ? "스킴·호스트·유효 포트가 같습니다. 경로가 달라도 같은 origin입니다."
      : target === "http"
        ? "HTTPS 페이지 → 일반 원격 HTTP API fetch. 이 모델의 혼합 콘텐츠 차단 대상입니다."
        : "호스트가 달라 다른 origin입니다. 같은 IP를 쓰더라도 이 판단은 같습니다.",
    "policy",
    ["js", "policy"],
    local(
      "페이지 JavaScript",
      "브라우저 정책 검사",
      "fetch 호출 / 목적지 검사",
    ),
  );
  if (target === "http") {
    add(
      "mixed-block",
      "혼합 콘텐츠 차단 · API 미전송",
      result.next,
      "policy",
      null,
      null,
      { readable: "차단", jsValue: "TypeError · 상태·본문 비공개" },
    );
  } else {
    if (gate.preflight) {
      add(
        "options-arrive",
        "OPTIONS 사전 확인이 API에 도착",
        "본 POST가 아닙니다. OPTIONS가 도착했어도 앱의 항목 처리 요청이 도착한 것은 아닙니다. 사전 확인에는 자격 증명을 싣지 않습니다.",
        "api",
        ["policy", "api"],
        connection(pc, endpoint, "HTTPS / OPTIONS", path, "사전 확인 경로"),
        { optionsSent: true, optionsArrived: true },
        `OPTIONS ${path}\nOrigin: ${pageOrigin}\nAccess-Control-Request-Method: POST\nAccess-Control-Request-Headers: content-type\n자격 증명 없음`,
      );
      add(
        "options-response",
        "OPTIONS 허용 응답이 브라우저에 도착",
        "HTTP 204 자체만으로 허용되는 것은 아닙니다. origin·credentials와 메서드·헤더 허용을 함께 검사합니다.",
        "policy",
        ["api", "policy"],
        connection(
          endpoint,
          pc,
          "HTTPS / OPTIONS 응답",
          "204 No Content",
          "사전 확인 응답",
        ),
        {},
        preflightHeaders,
      );
      add(
        "preflight-check",
        gate.sent
          ? "사전 확인 통과 · 본 요청은 다음 단계"
          : "사전 확인 실패 · 본 요청 미전송",
        gate.sent
          ? "OPTIONS 허용 조건을 통과했습니다. 이후 본 응답도 별도로 검사합니다."
          : gate.next,
        "policy",
        null,
        null,
        gate.sent
          ? {}
          : { readable: "차단", jsValue: "TypeError · 상태·본문 비공개" },
        preflightHeaders,
      );
    }
    if (result.sent) {
      add(
        "main-arrive",
        `${method} 본 요청 도착 · 서버 처리`,
        target === "same"
          ? "같은 origin 요청입니다. 모델의 API가 정상 처리하고 200 응답을 만듭니다."
          : "이 모델의 API는 본 요청을 정상 처리하고 200 응답을 만듭니다. 아직 JS가 응답을 읽었다는 뜻은 아닙니다.",
        "api",
        ["policy", "api"],
        connection(pc, endpoint, `HTTPS / ${method}`, path, "본 요청 경로"),
        { mainSent: true, mainArrived: true, processed: true },
        `${method} ${path}\n${requestHeaders}`,
      );
      add(
        "main-response",
        "본 응답이 브라우저에 도착",
        target === "same"
          ? "같은 origin의 응답입니다. 브라우저가 JS로 전달할 차례입니다."
          : "서버 처리와 응답 수신은 끝났습니다. 브라우저가 공유 헤더를 검사한 뒤 JS 전달 여부를 결정합니다.",
        "policy",
        ["api", "policy"],
        connection(
          endpoint,
          pc,
          "HTTPS / HTTP 응답",
          "200 OK",
          "서버가 보낸 상태 (JS 공개 전)",
        ),
        { responseArrived: true },
        actualHeaders,
      );
      add(
        "read-check",
        result.stage,
        result.next,
        "policy",
        null,
        null,
        {
          readable: result.readable ? "허용" : "차단",
          jsValue: result.readable
            ? "전달 준비"
            : "TypeError · 상태·본문 비공개",
        },
        target === "same" ? "같은 origin · CORS 검사 불필요" : actualHeaders,
      );
      add(
        "js-result",
        result.readable
          ? "JS에 응답 상태와 본문 전달"
          : "JS에 읽기 실패만 전달",
        result.readable
          ? "모델의 서버 상태 200과 본문을 JS가 읽습니다. 인증·권한·쿠키 전송·업무 성공은 별도 조건입니다."
          : "서버는 처리했지만 JS는 이 CORS 실패 응답의 상태와 본문을 읽지 못합니다. 서버 처리 여부를 확인한 뒤 재시도를 판단합니다.",
        "js",
        ["policy", "js"],
        local(
          "브라우저 정책 검사",
          "페이지 JavaScript",
          result.readable ? "Response · 200 + 본문" : "fetch 거절 · TypeError",
        ),
        {
          jsValue: result.readable
            ? "Response · 200 + 본문"
            : "TypeError · 상태·본문 비공개",
        },
      );
    }
  }
  result.steps = frames.map((f) => `${f.title} · ${f.detail}`);
  return {
    frames,
    result,
    pageOrigin,
    apiOrigin,
    url: apiOrigin + path,
    method,
    endpoint,
    preflightHeaders,
    actualHeaders,
    outcome: !result.sent ? "unsent" : result.readable ? "read" : "blocked",
  };
}

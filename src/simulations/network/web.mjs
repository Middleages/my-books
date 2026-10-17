// Deliberately bounded examples: no X.509 parser, crypto or network access.
export const environments = {
  browser: "브라우저",
  host: "호스트 curl",
  python: "Python Requests",
  container: "컨테이너 앱",
  proxy: "프록시 upstream 클라이언트",
};
export const initialTrust = () => ({
  browser: true,
  host: true,
  python: false,
  container: false,
  proxy: false,
});
export function certificateResult({
  target = "app.example.test",
  sni = "app",
  date = "2026-06-15",
  intermediate = true,
  rootSent = false,
  trusted = true,
  cachedIntermediate = false,
  certificate = null,
}) {
  const name =
    certificate?.name ??
    (sni === "app" ? "app.example.test" : "other.example.test");
  const sans = certificate?.sans ?? [name];
  const issuer = certificate?.issuer ?? "Demo Issuing CA";
  const root = certificate?.root ?? "Demo Root CA";
  const notBefore = certificate?.notBefore ?? "2026-01-01";
  const notAfter = certificate?.notAfter ?? "2026-12-31";
  const checks = [
    {
      id: "name",
      label: "접속 이름과 SAN",
      ok: sans.includes(target),
      evidence: `접속 ${target} / SAN ${sans.map((n) => `DNS:${n}`).join(", ")}`,
      fix: "의도한 서비스 이름으로 접속하거나, 그 이름을 포함한 인증서를 발급·설정합니다. HTTP Host만 바꾸거나 CA를 추가해도 이름 불일치는 남습니다.",
    },
    {
      id: "time",
      label: "유효기간",
      ok: date >= notBefore && date <= notAfter,
      evidence: `가상 시각 ${date} / leaf 유효기간 ${notBefore}~${notAfter} (UTC)`,
      fix: "실제 시계가 맞는지 확인하고, 만료 또는 아직 유효하지 않은 인증서는 적절히 갱신·교체합니다. 검증 통과를 위해 시계를 거짓으로 바꾸지 않습니다.",
    },
    {
      id: "chain",
      label: "중간 CA로 이어지는 경로",
      ok: intermediate || cachedIntermediate,
      evidence: intermediate
        ? `서버가 ${issuer}를 함께 보냄`
        : cachedIntermediate
          ? `${issuer}: 서버에서 누락됐지만 이 클라이언트의 중간 CA 캐시에 있음`
          : `${issuer}를 찾을 수 없음`,
      fix: "서버의 fullchain에 올바른 중간 CA 인증서를 leaf 뒤에 포함합니다. 이 사례에서는 루트만 보내도 중간의 빈칸은 채워지지 않습니다.",
    },
    {
      id: "trust",
      label: "현재 클라이언트의 신뢰 기준",
      ok: trusted,
      evidence: trusted
        ? `이 클라이언트가 ${root}를 신뢰함`
        : `이 클라이언트의 신뢰 목록에 ${root} 없음${rootSent ? " · 서버가 루트를 보내도 신뢰는 생기지 않음" : ""}`,
      fix: "검증된 관리 경로로 받은 CA를 해당 클라이언트가 실제 사용하는 trust store 또는 CA bundle에 설정합니다.",
    },
  ];
  return {
    name,
    checks,
    ok: checks.every((c) => c.ok),
    first: checks.find((c) => !c.ok)?.id ?? "success",
    bundle: [
      name,
      ...(intermediate ? [issuer] : []),
      ...(rootSent ? [root] : []),
    ],
  };
}
export function certificatePreset(id) {
  const base = {
    target: "app.example.test",
    sni: "app",
    date: "2026-06-15",
    intermediate: true,
    rootSent: false,
    cachedIntermediate: false,
    environment: "python",
    trust: initialTrust(),
  };
  if (id === "healthy") return { ...base, environment: "browser" };
  if (id === "name")
    return { ...base, target: "192.0.2.10", environment: "browser" };
  if (id === "expired")
    return { ...base, date: "2027-01-15", environment: "browser" };
  if (id === "future")
    return { ...base, date: "2025-12-15", environment: "browser" };
  if (id === "chain")
    return { ...base, intermediate: false, environment: "browser" };
  if (id === "sni") return { ...base, sni: "other", environment: "browser" };
  if (id === "multiple")
    return { ...base, intermediate: false, target: "192.0.2.10" };
  return base;
}
export function requestTrace(
  scenario,
  path = "/report",
  host = "app.example.test",
) {
  const steps = [
    {
      stage: "DNS",
      ok: scenario !== "dns",
      known:
        scenario === "dns"
          ? "이름 없음 · NXDOMAIN"
          : "app.example.test → 192.0.2.10",
      unknown: "서버 포트와 앱 상태",
      detail:
        scenario === "dns"
          ? "주소를 얻지 못했습니다. TCP와 HTTP는 시작하지 않습니다."
          : "주소를 얻었을 뿐 앱에 연결한 것은 아닙니다.",
    },
  ];
  if (scenario === "dns") return steps;
  steps.push({
    stage: "TCP",
    ok: scenario !== "refused",
    known:
      scenario === "refused"
        ? "TCP 연결 거부"
        : `192.0.2.10:${scenario === "tls" ? 443 : 80} 연결 성공`,
    unknown: "HTTP 응답과 업무 처리 결과",
    detail:
      scenario === "refused"
        ? "이 사례는 리스너가 없는 서버의 RST입니다. 실제로는 명시적인 방화벽 거절 등도 확인합니다."
        : "연결은 준비됐습니다. 아직 요청의 의미를 처리하지 않았습니다.",
  });
  if (scenario === "refused") return steps;
  if (scenario === "tls") {
    steps.push({
      stage: "TLS",
      ok: false,
      known: "인증서 검증 실패 · 신뢰 CA 없음",
      unknown: "HTTP 상태 코드",
      detail:
        "이 사례는 새 HTTPS 연결이며 0-RTT를 쓰지 않습니다. 인증서 검증에 실패했으므로 HTTP 요청을 보내지 않습니다. Host 변경은 이 실패를 고치지 못합니다.",
    });
    return steps;
  }
  steps.push({
    stage: "HTTP 요청",
    ok: true,
    known: `GET ${path}?day=today HTTP/1.1\nHost: ${host}`,
    unknown: "서버의 최종 응답",
    detail:
      "경로와 질의 문자열은 HTTP 요청에 들어갑니다. #summary 같은 fragment는 보내지 않습니다.",
  });
  const code =
    host !== "app.example.test"
      ? 421
      : path === "/missing"
        ? 404
        : scenario === "server"
          ? 500
          : 200;
  steps.push({
    stage: "HTTP 응답",
    ok: true,
    known: `HTTP ${code}`,
    unknown: "사용자가 기대한 업무가 완료됐는지",
    detail:
      code === 200
        ? "요청이 성공했습니다. 여기서는 보고서 데이터를 반환하는 사례입니다."
        : code === 404
          ? "서버가 대상 리소스를 찾지 못했다는 응답입니다. DNS 실패와는 다릅니다."
          : code === 421
            ? "이 가상 서버는 다른 Host를 잘못 향한 요청으로 거절합니다. 실제 서버의 동작은 설정에 따라 다릅니다."
            : "서버가 예상하지 못한 조건으로 요청을 수행하지 못했습니다. 연결을 더 열기보다 서버 로그를 확인할 단서입니다.",
  });
  return steps;
}

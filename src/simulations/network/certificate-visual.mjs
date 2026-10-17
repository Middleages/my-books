import { certificateResult, certificatePreset, environments } from "./web.mjs";

// IDs represent fixed, valid cryptographic issuer relationships, NOT name matching.
export const authorities = {
  "root-a": { id: "root-a", name: "Root CA A", role: "root", issuer: "root-a" },
  "root-b": { id: "root-b", name: "Root CA B", role: "root", issuer: "root-b" },
  "root-c": { id: "root-c", name: "Root CA C", role: "root", issuer: "root-c" },
  "issuing-a": {
    id: "issuing-a",
    name: "Issuing CA A",
    role: "intermediate",
    issuer: "root-a",
  },
  "issuing-b": {
    id: "issuing-b",
    name: "Issuing CA B",
    role: "intermediate",
    issuer: "root-b",
  },
  "issuing-c": {
    id: "issuing-c",
    name: "Issuing CA C",
    role: "intermediate",
    issuer: "root-c",
  },
};
export const servers = {
  app: {
    id: "app",
    name: "app.example.test",
    role: "leaf",
    sans: ["app.example.test"],
    issuer: "issuing-a",
  },
  files: {
    id: "files",
    name: "files.example.test",
    role: "leaf",
    sans: ["files.example.test"],
    issuer: "issuing-b",
  },
  multi: {
    id: "multi",
    name: "여러 SAN 인증서",
    role: "leaf",
    sans: ["app.example.test", "reports.example.test"],
    issuer: "issuing-a",
  },
  other: {
    id: "other",
    name: "other.example.test",
    role: "leaf",
    sans: ["other.example.test"],
    issuer: "issuing-a",
  },
  outside: {
    id: "outside",
    name: "outside.example.test",
    role: "leaf",
    sans: ["outside.example.test"],
    issuer: "issuing-c",
  },
};
export function visualPreset(id = "chain") {
  const old = certificatePreset(id);
  return {
    server: old.sni === "other" ? "other" : "app",
    target: old.target,
    date: old.date,
    intermediate: old.intermediate ? "issuing-a" : "",
    rootSent: old.rootSent,
    environment: old.environment,
    stores: Object.fromEntries(
      Object.entries(old.trust).map(([k, v]) => [k, v ? ["root-a"] : []]),
    ),
    caches: Object.fromEntries(Object.keys(environments).map((k) => [k, []])),
  };
}
export function visualResult(config) {
  const leaf = servers[config.server];
  const issuer = authorities[leaf.issuer];
  const root = authorities[issuer.issuer];
  const sent = [
    leaf,
    ...(config.intermediate ? [authorities[config.intermediate]] : []),
    ...(config.rootSent ? [root] : []),
  ];
  const roots = config.stores[config.environment];
  const cached = config.caches[config.environment].includes(issuer.id);
  const supplied = sent.some((c) => c.id === issuer.id);
  const result = certificateResult({
    target: config.target,
    date: config.date,
    intermediate: supplied,
    cachedIntermediate: cached,
    trusted: roots.includes(root.id),
    rootSent: config.rootSent,
    certificate: {
      name: leaf.name,
      sans: leaf.sans,
      issuer: issuer.name,
      root: root.name,
      notBefore: "2026-01-01",
      notAfter: "2026-12-31",
    },
  });
  return {
    ...result,
    bundle: sent.map((certificate) => certificate.name),
    leaf,
    issuer,
    root,
    sent,
    roots: roots.map((id) => authorities[id]),
    intermediateSource: supplied ? "server" : cached ? "cache" : "missing",
  };
}
export const observationStages = [
  "전체 구도",
  "SNI로 인증서 선택",
  "공개 인증서 목록 수신",
  "발급·신뢰 경로 연결",
  "이름과 기간 확인",
  "종합 판정",
];
export function playbackStep(step, action) {
  if (action === "restart" || action === "change") return 0;
  return Math.max(
    0,
    Math.min(
      observationStages.length - 1,
      step + (action === "previous" ? -1 : 1),
    ),
  );
}

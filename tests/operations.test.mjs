import test from "node:test";
import assert from "node:assert/strict";
import {
  proxyResult,
  dockerResult,
  corsResult,
} from "../src/simulations/network/operations.mjs";
test("domain and prefix route independently; trailing URI changes app resource", () => {
  assert.equal(proxyResult().code, "200");
  assert.equal(proxyResult({ strip: false }).code, "404");
  assert.equal(proxyResult({ strip: false }).uri, "/api/items");
  assert.equal(proxyResult({ host: "reports", strip: true }).app, "보고서 앱");
  assert.equal(proxyResult({ host: "reports", strip: true }).uri, "/api/items");
  assert.equal(proxyResult({ path: "/" }).app, "화면 앱");
});
test("upstream TCP, TLS and response timeout preserve stage order", () => {
  const tls = proxyResult({ trusted: false, fault: "timeout" });
  assert.equal(tls.code, "502");
  assert.match(tls.steps.at(-1), /TLS 검증 실패/);
  assert.equal(proxyResult({ trusted: false, upstreamTls: false }).code, "200");
  assert.match(
    proxyResult({ trusted: false, fault: "refused" }).steps.at(-1),
    /TCP 연결 거부/,
  );
  assert.equal(proxyResult({ fault: "timeout" }).code, "504");
});
test("host proxy uses publish but container loopback bind cannot accept it", () => {
  assert.equal(dockerResult().ok, true);
  assert.equal(dockerResult({ publish: "none" }).ok, false);
  assert.equal(dockerResult({ bind: "loopback" }).ok, false);
});
test("same bridge needs neither publish nor expose; localhost is separate", () => {
  const state = { placement: "container", target: "service", publish: "none" };
  assert.equal(dockerResult(state).ok, true);
  assert.equal(dockerResult({ ...state, network: false }).ok, false);
  assert.equal(dockerResult({ ...state, target: "loopback" }).ok, false);
  assert.equal(dockerResult({ ...state, bind: "loopback" }).ok, false);
});
test("remote proxy needs reachable target, publish and allowed route", () => {
  const state = { placement: "remote", target: "vm", publish: "all" };
  assert.equal(dockerResult(state).ok, true);
  for (const patch of [
    { target: "loopback" },
    { publish: "loopback" },
    { publish: "none" },
    { allowed: false },
  ])
    assert.equal(dockerResult({ ...state, ...patch }).ok, false);
});
test("simple cross origin request can be processed with blocked JS response", () => {
  const r = corsResult();
  assert.equal(r.sent, true);
  assert.equal(r.readable, false);
  assert.equal(r.preflight, false);
  assert.equal(corsResult({ allowOrigin: "exact" }).readable, true);
  assert.equal(corsResult({ allowOrigin: "star" }).readable, true);
});
test("JSON preflight gates main request; origin permission alone insufficient", () => {
  assert.equal(corsResult({ kind: "json", allowOrigin: "exact" }).sent, false);
  assert.equal(corsResult({ kind: "json", allowPreflight: true }).sent, false);
  const r = corsResult({
    kind: "json",
    allowOrigin: "exact",
    allowPreflight: true,
  });
  assert.equal(r.sent, true);
  assert.equal(r.readable, true);
  assert.equal(r.preflight, true);
});
test("include forbids wildcard even with credentials permission, exact origin works", () => {
  assert.equal(
    corsResult({
      credentials: true,
      allowOrigin: "star",
      allowCredentials: true,
    }).readable,
    false,
  );
  assert.equal(
    corsResult({ credentials: true, allowOrigin: "exact" }).readable,
    false,
  );
  assert.equal(
    corsResult({
      credentials: true,
      allowOrigin: "exact",
      allowCredentials: true,
    }).readable,
    true,
  );
  assert.equal(
    corsResult({
      kind: "json",
      credentials: true,
      allowOrigin: "star",
      allowCredentials: true,
      allowPreflight: true,
    }).sent,
    false,
  );
});
test("same origin skips CORS but mixed HTTP is blocked before request regardless of CORS", () => {
  const same = corsResult({ target: "same", kind: "json", credentials: true });
  assert.equal(same.readable, true);
  assert.equal(same.preflight, false);
  const mixed = corsResult({
    target: "http",
    allowOrigin: "exact",
    allowPreflight: true,
    allowCredentials: true,
  });
  assert.equal(mixed.sent, false);
  assert.equal(mixed.stage, "mixed content");
});

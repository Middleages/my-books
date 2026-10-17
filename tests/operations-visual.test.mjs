import test from "node:test";
import assert from "node:assert/strict";
import * as visual from "../src/simulations/network/operations-visual.mjs";
import {
  proxyResult,
  dockerResult,
} from "../src/simulations/network/operations.mjs";

test("proxy frames preserve existing verdict across routing, URI, transport failures", () => {
  assert.equal(typeof visual.proxyJourney, "function");
  for (const host of ["portal", "reports"])
    for (const path of ["/api/items", "/"])
      for (const strip of [true, false])
        for (const fault of ["none", "refused", "timeout"])
          for (const upstreamTls of [true, false])
            for (const trusted of [true, false]) {
              const s = { host, path, strip, fault, upstreamTls, trusted };
              const j = visual.proxyJourney(s);
              assert.equal(j.result.code, proxyResult(s).code);
              assert.equal(j.frames.at(-1).code, j.result.code);
              assert.equal(j.uri, j.result.uri);
            }
});
test("DNS, SNI and HTTP authority are independent; external TLS gates all upstream traffic", () => {
  const normal = visual.proxyJourney();
  const reports = visual.proxyJourney({ host: "reports" });
  assert.equal(normal.external.dst, reports.external.dst);
  assert.notEqual(normal.certificate, reports.certificate);
  const changedHost = visual.proxyJourney({ authority: "reports" });
  assert.equal(changedHost.certificate, normal.certificate);
  assert.equal(changedHost.result.app, "보고서 앱");
  for (const patch of [{ browserTrusted: false }, { sni: "reports" }]) {
    const j = visual.proxyJourney(patch);
    assert.equal(j.result.code, "TLS 중단");
    assert.ok(!j.result.steps.some((step) => step.includes("외부 TLS 성공")));
    assert.ok(
      !j.frames.some(
        (f) =>
          f.edge?.[0] === "proxy" &&
          ["api", "web", "reports"].includes(f.edge[1]),
      ),
    );
  }
});
test("proxy keeps separate tuples and only sends HTTP after successful upstream TLS", () => {
  const j = visual.proxyJourney();
  assert.equal(j.external.src, "198.51.100.30:51000");
  assert.equal(j.external.dst, "192.0.2.10:443");
  assert.equal(j.upstream.src, "10.0.0.10:52000");
  assert.equal(j.upstream.dst, "10.0.0.21:8443");
  assert.equal(j.comparison[0].uri, "/items");
  assert.equal(j.comparison[1].uri, "/api/items");
  const failed = visual.proxyJourney({ trusted: false });
  assert.ok(!failed.frames.some((f) => f.id === "upstream-http"));
  assert.equal(failed.result.code, "502");
  assert.equal(failed.origin, "프록시 · upstream TLS");
  assert.equal(
    visual.proxyJourney({ strip: false }).origin,
    "API 앱 · HTTP 응답",
  );
  assert.equal(
    visual.proxyJourney({ fault: "timeout" }).origin,
    "프록시 · upstream 응답 대기",
  );
});
test("Docker journey verdict matches legacy model for all supported controls", () => {
  assert.equal(typeof visual.dockerJourney, "function");
  for (const placement of ["host", "container", "remote"])
    for (const target of ["loopback", "service", "vm"])
      for (const publish of ["none", "loopback", "all"])
        for (const bind of ["all", "loopback"])
          for (const network of [true, false])
            for (const allowed of [true, false]) {
              const s = { placement, target, publish, bind, network, allowed };
              const j = visual.dockerJourney(s);
              assert.equal(j.result.ok, dockerResult(s).ok);
              assert.equal(
                j.frames.at(-1).code,
                j.result.ok ? "연결 성공" : "연결 실패",
              );
            }
});
test("shared bridge bypasses host publish, EXPOSE changes no reachability", () => {
  const s = { placement: "container", target: "service", publish: "none" };
  const j = visual.dockerJourney(s);
  assert.equal(j.result.ok, true);
  assert.ok(j.frames.some((f) => f.edge?.join("/") === "container/app"));
  assert.ok(!j.frames.some((f) => f.id === "publish"));
  assert.equal(
    j.frames.find((f) => f.id === "connect").connection.dst,
    "172.20.0.3:8000",
  );
  assert.equal(visual.dockerJourney({ ...s, expose: false }).result.ok, true);
  assert.equal(
    visual.dockerJourney({ publish: "none", expose: true }).result.ok,
    false,
  );
});
test("loopback failures stay in correct namespace; publish and app bind fail separately", () => {
  const own = visual.dockerJourney({
    placement: "container",
    target: "loopback",
  });
  assert.equal(own.localhostOwner, "프록시 컨테이너");
  assert.equal(own.frames[0].connection.src, "127.0.0.1:52000");
  const remoteOwn = visual.dockerJourney({
    placement: "remote",
    target: "loopback",
  });
  assert.equal(remoteOwn.frames[0].connection.src, "127.0.0.1:52000");
  assert.equal(own.frames.at(-1).node, "container");
  assert.equal(own.frames.at(-1).connection.dst, "127.0.0.1:8000");
  const bound = visual.dockerJourney({ bind: "loopback" });
  assert.equal(bound.frames.at(-1).node, "app");
  assert.ok(bound.frames.some((f) => f.id === "publish"));
  const remote = visual.dockerJourney({
    placement: "remote",
    target: "vm",
    publish: "loopback",
  });
  assert.equal(remote.frames.at(-1).node, "host");
  assert.ok(!remote.frames.some((f) => f.id === "publish"));
});
test("publish path displays destination translation without inventing exact post-NAT source", () => {
  const j = visual.dockerJourney();
  const f = j.frames.find((f) => f.id === "publish");
  assert.equal(f.before.dst, "127.0.0.1:18001");
  assert.equal(f.connection.dst, "172.20.0.3:8000");
  assert.match(f.connection.src, /구현/);
  const remote = visual.dockerJourney({
    placement: "remote",
    target: "vm",
    publish: "all",
    allowed: false,
  });
  assert.ok(!remote.frames.some((f) => f.id === "publish"));
  assert.match(remote.result.why, /허용 규칙/);
});

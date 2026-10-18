import test from "node:test";
import assert from "node:assert/strict";
import {
  httpJourney,
  corsJourney,
} from "../src/simulations/network/browser-visual.mjs";
import { requestTrace } from "../src/simulations/network/web.mjs";
import { corsResult } from "../src/simulations/network/operations.mjs";
test("HTTP journey preserves legacy verdicts and stops before HTTP on lower-layer failure", () => {
  for (const scenario of ["healthy", "dns", "refused", "tls", "server"])
    for (const path of ["/report", "/missing"])
      for (const host of ["app.example.test", "other.example.test"]) {
        const j = httpJourney({ scenario, path, host });
        const old = requestTrace(scenario, path, host);
        assert.equal(
          j.result.code,
          old.at(-1).stage === "HTTP 응답"
            ? Number(old.at(-1).known.slice(5))
            : null,
        );
        assert.equal(j.frames.at(-1).responseCode, j.result.code);
        if (["dns", "refused", "tls"].includes(scenario))
          assert.ok(j.frames.every((f) => !f.requestSent));
        for (const f of j.frames) if (f.edge) assert.equal(f.node, f.edge[1]);
      }
});
test("URL fields stay in their layers; changing path or diagnostic Host leaves DNS and SNI unchanged", () => {
  const a = httpJourney(),
    b = httpJourney({ path: "/missing", host: "other.example.test" });
  assert.deepEqual(
    a.frames.filter((f) => f.phase === "DNS").map((f) => f.connection),
    b.frames.filter((f) => f.phase === "DNS").map((f) => f.connection),
  );
  assert.equal(b.sni, "app.example.test");
  assert.equal(b.requestTarget, "/missing?day=today");
  assert.ok(b.frames.every((f) => !f.connection?.path.includes("#")));
  assert.equal(
    b.frames.find((f) => f.id === "http-request").connection.dst,
    "192.0.2.10:443",
  );
  assert.match(b.requestMessage, /Host: other.example.test/);
  assert.equal(
    httpJourney({ scheme: "http", scenario: "tls" }).result.code,
    200,
  );
  assert.ok(
    httpJourney({ scheme: "http" }).frames.every((f) => f.phase !== "TLS"),
  );
});
test("HTTPS success includes independent TLS evidence before HTTP, response travels back", () => {
  const j = httpJourney();
  const tls = j.frames.find((f) => f.id === "tls-check");
  assert.equal(tls.tls, "통과");
  assert.equal(tls.requestSent, false);
  assert.equal(j.frames.at(-1).connection.src, "192.0.2.10:443");
  assert.equal(j.frames.at(-1).connection.dst, "198.51.100.30:51000");
  assert.equal(j.result.code, 200);
  assert.equal(j.frames.at(-1).requestSent, true);
});
test("linked CORS policies preserve all existing outcomes", () => {
  for (const target of ["same", "cross", "http"])
    for (const kind of ["get", "json"])
      for (const allowOrigin of ["none", "exact", "star"])
        for (const allowPreflight of [false, true])
          for (const credentials of [false, true])
            for (const allowCredentials of [false, true]) {
              const s = {
                target,
                kind,
                allowOrigin,
                allowPreflight,
                credentials,
                allowCredentials,
              };
              const old = corsResult(s),
                j = corsJourney(s);
              for (const k of ["sent", "readable", "preflight", "stage"])
                assert.equal(j.result[k], old[k], JSON.stringify(s));
              const f = j.frames.at(-1);
              assert.equal(f.mainSent, old.sent);
              assert.equal(f.processed, old.sent);
              assert.equal(f.readable, old.readable ? "허용" : "차단");
              for (const f of j.frames)
                if (f.edge) assert.equal(f.node, f.edge[1]);
            }
});
test("GET can be processed and received by browser without exposing status or body to JS", () => {
  const j = corsJourney();
  const processed = j.frames.find((f) => f.id === "main-arrive");
  assert.equal(processed.processed, true);
  assert.equal(processed.responseArrived, false);
  assert.equal(processed.readable, "대기");
  const response = j.frames.find((f) => f.id === "main-response");
  assert.equal(response.responseArrived, true);
  assert.equal(response.readable, "대기");
  assert.equal(j.frames.at(-1).readable, "차단");
  assert.ok(!j.frames.some((f) => f.optionsSent));
  assert.equal(j.frames.at(-1).jsValue, "TypeError · 상태·본문 비공개");
});
test("preflight response and actual response can disagree in either direction", () => {
  const sent = corsJourney({
    kind: "json",
    preflightPolicy: "permit",
    allowPreflight: true,
    allowOrigin: "none",
  });
  assert.equal(sent.result.sent, true);
  assert.equal(sent.result.readable, false);
  assert.equal(
    sent.frames.find((f) => f.id === "preflight-check").mainSent,
    false,
  );
  const blocked = corsJourney({
    kind: "json",
    preflightPolicy: "deny",
    allowPreflight: true,
    allowOrigin: "exact",
  });
  assert.equal(blocked.result.sent, false);
  assert.ok(blocked.frames.at(-1).optionsArrived);
  assert.equal(blocked.frames.at(-1).processed, false);
});
test("wildcard include is blocked even with no cookies; OPTIONS never carries credentials", () => {
  const j = corsJourney({
    kind: "json",
    credentials: true,
    preflightPolicy: "permit",
    allowPreflight: true,
    allowOrigin: "star",
    allowCredentials: true,
  });
  assert.equal(j.result.sent, true);
  assert.equal(j.result.readable, false);
  assert.match(
    j.frames.find((f) => f.id === "options-arrive").message,
    /資格|자격 증명 없음/,
  );
  assert.equal(
    corsJourney({
      credentials: true,
      allowOrigin: "exact",
      allowCredentials: true,
    }).result.readable,
    true,
  );
});
test("mixed content never sends OPTIONS or main; same origin skips CORS regardless of headers", () => {
  const j = corsJourney({
    target: "http",
    kind: "json",
    preflightPolicy: "permit",
    allowPreflight: true,
    allowOrigin: "exact",
  });
  assert.ok(
    j.frames.every((f) => !f.optionsSent && !f.mainSent && !f.processed),
  );
  assert.equal(j.frames.at(-1).edge, null);
  const same = corsJourney({
    target: "same",
    kind: "json",
    allowOrigin: "none",
  });
  assert.equal(same.result.readable, true);
  assert.ok(same.frames.every((f) => !f.optionsSent));
  assert.equal(same.pageOrigin, same.apiOrigin);
});
test("independent policy explanations preserve POST and never claim a blocked response was read", () => {
  const j = corsJourney({
    kind: "json",
    preflightPolicy: "permit",
    allowPreflight: true,
    allowOrigin: "none",
  });
  assert.ok(
    !j.result.steps.some((s) =>
      s.includes("JavaScript가 응답 내용을 읽습니다."),
    ),
  );
  assert.ok(!j.result.steps.some((s) => s.includes("GET 본 요청")));
  assert.ok(j.result.steps.some((s) => s.includes("POST 본 요청")));
});
test("TCP SYN-ACK and final ACK use opposite directions before HTTP", () => {
  const j = httpJourney();
  assert.equal(j.frames.find((f) => f.id === "tcp-synack").tcp, "대기");
  const ack = j.frames.find((f) => f.id === "tcp-ack");
  assert.equal(ack.connection.src, "198.51.100.30:51000");
  assert.equal(ack.connection.dst, "192.0.2.10:443");
  assert.equal(ack.tcp, "연결됨");
});

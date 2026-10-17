import test from "node:test";
import assert from "node:assert/strict";
import {
  certificateResult,
  certificatePreset,
  requestTrace,
} from "../src/simulations/network/web.mjs";
const run = (id, patch = {}) => {
  const c = { ...certificatePreset(id), ...patch };
  return certificateResult({ ...c, trusted: c.trust[c.environment] });
};
test("fullchain supplies intermediates; a sent root cannot bridge the gap", () => {
  assert.equal(run("chain").first, "chain");
  assert.equal(run("chain", { rootSent: true }).first, "chain");
  assert.equal(run("chain", { intermediate: true }).ok, true);
  assert.deepEqual(run("healthy").bundle, [
    "app.example.test",
    "Demo Issuing CA",
  ]);
});
test("sending a root is not adding a trust anchor", () => {
  assert.equal(run("untrusted", { rootSent: true }).first, "trust");
  const c = certificatePreset("untrusted");
  assert.equal(
    run("untrusted", { trust: { ...c.trust, python: true } }).ok,
    true,
  );
  assert.equal(c.trust.container, false);
});
test("trust cannot fix hostname mismatch or the wrong SNI-selected leaf", () => {
  assert.equal(run("name").first, "name");
  assert.equal(run("name", { target: "app.example.test" }).ok, true);
  assert.equal(run("sni").first, "name");
  assert.equal(run("sni", { sni: "app" }).ok, true);
});
test("expired and not-yet-valid certificates fail independently of trust", () => {
  assert.equal(run("expired").first, "time");
  assert.equal(run("future").first, "time");
  assert.equal(run("expired", { date: "2026-06-15" }).ok, true);
});
test("a cached intermediate can mask an incomplete server chain but not missing trust", () => {
  assert.equal(run("chain", { cachedIntermediate: true }).ok, true);
  assert.equal(
    run("untrusted", { intermediate: false, cachedIntermediate: true }).first,
    "trust",
  );
});
test("multiple failures remain visible when one is corrected", () => {
  const c = certificatePreset("multiple");
  assert.deepEqual(
    run("multiple")
      .checks.filter((c) => !c.ok)
      .map((c) => c.id),
    ["name", "chain", "trust"],
  );
  assert.deepEqual(
    run("multiple", { target: "app.example.test" })
      .checks.filter((c) => !c.ok)
      .map((c) => c.id),
    ["chain", "trust"],
  );
  assert.equal(
    run("multiple", {
      target: "app.example.test",
      intermediate: true,
      trust: { ...c.trust, python: true },
    }).ok,
    true,
  );
});
test("DNS/TCP/TLS failures never reach HTTP and Host cannot repair TLS", () => {
  assert.deepEqual(
    requestTrace("dns").map((s) => s.stage),
    ["DNS"],
  );
  assert.deepEqual(
    requestTrace("refused").map((s) => s.stage),
    ["DNS", "TCP"],
  );
  for (const host of ["app.example.test", "other.example.test"])
    assert.deepEqual(
      requestTrace("tls", "/report", host).map((s) => s.stage),
      ["DNS", "TCP", "TLS"],
    );
});
test("404 and 500 are received HTTP responses; fragment stays client-side", () => {
  for (const [scenario, path, code] of [
    ["healthy", "/report", 200],
    ["healthy", "/missing", 404],
    ["server", "/report", 500],
  ]) {
    const steps = requestTrace(scenario, path);
    assert.equal(steps.at(-1).known, `HTTP ${code}`);
    assert.equal(steps.at(-1).ok, true);
    assert.ok(steps[2].known.includes("?day=today"));
    assert.ok(!steps[2].known.includes("#"));
  }
  assert.equal(
    requestTrace("healthy", "/report", "other.example.test").at(-1).known,
    "HTTP 421",
  );
});

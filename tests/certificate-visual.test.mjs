import test from "node:test";
import assert from "node:assert/strict";
import * as visual from "../src/simulations/network/certificate-visual.mjs";

test("CA A and B authorize only their own issuer paths, with SAN and time still required", () => {
  assert.equal(typeof visual.visualResult, "function");
  const c = visual.visualPreset("healthy");
  for (const [server, roots, ok] of [
    ["app", ["root-a"], true],
    ["files", ["root-a"], false],
    ["files", ["root-a", "root-b"], true],
    ["outside", ["root-a", "root-b"], false],
  ]) {
    const config = {
      ...c,
      server,
      intermediate: visual.servers[server].issuer,
      target: visual.servers[server].sans[0],
      stores: { ...c.stores, browser: roots },
    };
    assert.equal(visual.visualResult(config).ok, ok);
    assert.equal(
      visual.visualResult({ ...config, target: "192.0.2.10" }).checks[0].ok,
      false,
    );
    assert.equal(
      visual.visualResult({ ...config, date: "2027-01-15" }).checks[1].ok,
      false,
    );
  }
});
test("PEM concatenation preserves leaf SAN and server-sent roots do not become trust anchors", () => {
  const c = visual.visualPreset("untrusted");
  const r = visual.visualResult({ ...c, rootSent: true });
  assert.equal(r.ok, false);
  assert.equal(r.checks.find((x) => x.id === "trust").ok, false);
  assert.deepEqual(r.leaf.sans, ["app.example.test"]);
  assert.deepEqual(
    r.sent.map((x) => x.id),
    ["app", "issuing-a", "root-a"],
  );
  const multi = visual.visualResult({
    ...visual.visualPreset("healthy"),
    server: "multi",
    target: "reports.example.test",
  });
  assert.equal(multi.ok, true);
  assert.equal(multi.sent[0].sans.length, 2);
});
test("wrong intermediate cannot substitute for the issuer; local cache fills path but never grants trust", () => {
  const c = visual.visualPreset("chain");
  assert.equal(
    visual.visualResult({ ...c, intermediate: "issuing-b", rootSent: true })
      .checks[2].ok,
    false,
  );
  const cached = { ...c, caches: { ...c.caches, browser: ["issuing-a"] } };
  assert.equal(visual.visualResult(cached).ok, true);
  assert.equal(
    visual.visualResult({
      ...cached,
      stores: { ...cached.stores, browser: [] },
    }).checks[3].ok,
    false,
  );
  assert.equal(
    visual.visualResult({ ...cached, environment: "python" }).checks[2].ok,
    false,
  );
});
test("environment changes are isolated and complex failures survive partial repair", () => {
  const c = visual.visualPreset("multiple");
  assert.deepEqual(
    visual
      .visualResult(c)
      .checks.filter((x) => !x.ok)
      .map((x) => x.id),
    ["name", "chain", "trust"],
  );
  const repaired = {
    ...c,
    target: "app.example.test",
    intermediate: "issuing-a",
    stores: { ...c.stores, python: ["root-a"] },
  };
  assert.equal(visual.visualResult(repaired).ok, true);
  assert.equal(
    visual.visualResult({ ...repaired, environment: "container" }).ok,
    false,
  );
  assert.deepEqual(c.stores.python, []);
});
test("all playback boundaries clamp and config changes reset observation", () => {
  assert.equal(visual.playbackStep(5, "next"), 5);
  assert.equal(visual.playbackStep(0, "previous"), 0);
  assert.equal(visual.playbackStep(3, "restart"), 0);
  assert.equal(visual.playbackStep(3, "change"), 0);
  assert.equal(visual.playbackStep(3, "next"), 4);
});

test("reported sent bundle includes even unrelated certificates without granting an issuer path", () => {
  const r = visual.visualResult({
    ...visual.visualPreset("chain"),
    intermediate: "issuing-b",
  });
  assert.deepEqual(
    r.bundle,
    r.sent.map((c) => c.name),
  );
  assert.equal(r.checks.find((c) => c.id === "chain").ok, false);
});

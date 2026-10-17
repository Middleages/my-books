import test from "node:test";
import assert from "node:assert/strict";
import { serviceResult } from "../src/simulations/network/cluster.mjs";
test("replacement keeps service destination valid but updates Pod endpoint", () => {
  const before = serviceResult(),
    after = serviceResult({ replaced: true });
  assert.equal(before.code, "connected");
  assert.equal(after.code, "connected");
  assert.notEqual(before.ip, after.ip);
  assert.deepEqual(after.endpoints, [after.ip]);
});
test("selector or readiness failure removes ready endpoints", () => {
  for (const s of [
    { selector: "other" },
    { ready: false },
    { selector: "other", targetPort: 9000 },
  ]) {
    const r = serviceResult(s);
    assert.equal(r.code, "no-endpoint");
    assert.deepEqual(r.endpoints, []);
  }
});
test("wrong targetPort retains selected Pod but fails connection", () => {
  const r = serviceResult({ targetPort: 9000 });
  assert.equal(r.code, "wrong-port");
  assert.equal(r.endpoints.length, 1);
  assert.equal(serviceResult({ targetPort: 8000 }).code, "connected");
});

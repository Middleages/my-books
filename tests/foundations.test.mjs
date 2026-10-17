import test from "node:test";
import assert from "node:assert/strict";
import {
  portResult,
  dnsResult,
  transportSteps,
  transferEstimate,
} from "../src/simulations/network/foundations.mjs";
const port = {
  observer: "remote",
  bind: "all",
  listening: true,
  policy: "allow",
  port: "8000",
};
test("remote access needs matching listener; opening firewall cannot create one", () => {
  assert.equal(portResult(port).ok, true);
  for (const change of [
    { bind: "loopback" },
    { listening: false },
    { port: "8001" },
  ])
    assert.equal(portResult({ ...port, ...change }).title, "연결 거부");
  assert.equal(
    portResult({ ...port, policy: "drop" }).title,
    "응답 없음 · 시간 초과",
  );
});
test("local loopback does not traverse the modeled remote firewall", () => {
  const r = portResult({
    ...port,
    observer: "local",
    bind: "loopback",
    policy: "drop",
  });
  assert.equal(r.ok, true);
  assert.equal(r.target, "127.0.0.1");
});
test("DNS uses still-valid old data, including after authoritative name deletion", () => {
  for (const record of ["exists", "missing"]) {
    const r = dnsResult({ cache: true, age: 59, record, app: true });
    assert.equal(r.address, "192.0.2.10");
    assert.equal(r.remaining, 1);
  }
});
test("TTL boundary and absent cache force fresh lookup", () => {
  for (const conditions of [
    { cache: true, age: 60 },
    { cache: false, age: 0 },
  ]) {
    assert.equal(
      dnsResult({ ...conditions, record: "exists", app: true }).address,
      "192.0.2.20",
    );
    assert.equal(
      dnsResult({ ...conditions, record: "missing", app: true }).address,
      null,
    );
  }
});
test("successful DNS does not imply a listening application", () => {
  const r = dnsResult({ cache: false, age: 0, record: "exists", app: false });
  assert.equal(r.address, "192.0.2.20");
  assert.equal(r.connection, "연결 거부");
});
test("a TCP gap blocks contiguous delivery and cumulative ACK until repaired", () => {
  const steps = transportSteps(true);
  assert.deepEqual(
    steps.map((s) => s.ack),
    [101, 101, 101, 301],
  );
  assert.deepEqual(
    steps.map((s) => s.delivered),
    [100, 100, 100, 300],
  );
  assert.equal(steps[2].buffered, 100);
  assert.equal(steps[3].buffered, 0);
  assert.deepEqual(
    transportSteps(false).map((s) => s.ack),
    [101, 201, 301],
  );
});
test("bandwidth changes serialization, not fixed RTT; decimal MB convert to bits", () => {
  assert.deepEqual(transferEstimate(1, 10, 100), {
    serialization: 0.8,
    roundTrip: 0.1,
    total: 0.9,
  });
  const fast = transferEstimate(1, 100, 100);
  assert.equal(fast.serialization, 0.08);
  assert.equal(fast.roundTrip, 0.1);
});

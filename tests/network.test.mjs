import test from "node:test";
import assert from "node:assert/strict";
import {
  sameSubnet,
  traceRoute,
  reverseNat,
} from "../src/simulations/network/model.mjs";

test("subnet decision uses the prefix, not the first three octets", () => {
  assert.equal(sameSubnet("192.168.10.10", "192.168.10.20", 24), true);
  assert.equal(sameSubnet("192.168.10.10", "192.168.11.20", 24), false);
  assert.equal(sameSubnet("192.168.10.10", "192.168.11.20", 16), true);
  assert.equal(sameSubnet("192.168.10.10", "192.168.10.140", 25), false);
  assert.throws(() => sameSubnet("999.1.1.1", "1.1.1.1", 24));
  assert.throws(() => sameSubnet("1.1.1.1", "1.1.1.1", 33));
});
test("local traffic works even with a wrong default gateway and has no NAT", () => {
  const r = traceRoute({
    source: "a",
    destination: "peer",
    scenario: "bad-gateway",
  });
  assert.equal(r.outcome, "delivered");
  assert.deepEqual(
    r.steps.map((s) => s.node),
    ["a", "b", "a"],
  );
  assert.equal(r.mapping, null);
});
test("remote traffic stops before router when configured next hop does not exist", () => {
  const r = traceRoute({
    source: "b",
    destination: "server",
    scenario: "bad-gateway",
  });
  assert.equal(r.outcome, "blocked");
  assert.equal(r.steps.at(-1).node, "b");
  assert.equal(r.steps.at(-1).reason, "gateway-unreachable");
  assert.equal(r.mapping, null);
});
test("routing without NAT preserves addresses on the outgoing and return legs", () => {
  const r = traceRoute({
    source: "a",
    destination: "server",
    scenario: "routed",
  });
  assert.equal(r.outcome, "delivered");
  assert.equal(r.mapping, null);
  assert.equal(r.steps[2].packet.src, "192.168.10.10");
  assert.equal(r.steps.at(-1).packet.dst, "192.168.10.10");
});
test("NAPT replaces outbound source and restores return destination for each PC", () => {
  for (const [source, ip, port] of [
    ["a", "192.168.10.10", 40001],
    ["b", "192.168.10.20", 40002],
  ]) {
    const r = traceRoute({ source, destination: "server", scenario: "nat" });
    assert.equal(r.outcome, "delivered");
    assert.equal(r.steps[2].packet.src, "203.0.113.5");
    assert.equal(r.steps[2].packet.sport, port);
    assert.equal(r.steps.at(-1).packet.dst, ip);
    assert.equal(r.steps.at(-1).packet.dport, 51000);
    assert.equal(
      reverseNat({ ...r.steps[3].packet, dport: 49999 }, r.mapping),
      null,
    );
    assert.equal(
      reverseNat({ ...r.steps[3].packet, protocol: "UDP" }, r.mapping),
      null,
    );
    assert.equal(reverseNat(r.steps[3].packet, null), null);
  }
});

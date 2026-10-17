import test from "node:test";
import assert from "node:assert/strict";
import * as visual from "../src/simulations/network/foundation-visual.mjs";
import { traceRoute, reverseNat } from "../src/simulations/network/model.mjs";

test("TCP loss scene buffers C, retransmits B, then lets the app interpret the complete stream", () => {
  const frames = visual.packetFrames(true);
  const gap = frames.find((f) => f.title.includes("C 도착"));
  assert.equal(gap.delivered, 100);
  assert.deepEqual(gap.received, [true, false, true]);
  assert.equal(gap.complete, false);
  const final = frames.at(-1);
  assert.equal(final.delivered, 300);
  assert.equal(final.complete, true);
  assert.deepEqual(final.received, [true, true, true]);
  assert.ok(frames.some((f) => f.title.includes("재전송")));
  assert.ok(
    !visual.packetFrames(false).some((f) => f.title.includes("재전송")),
  );
});

test("prefix changes the boundary, including same first three octets split by /25", () => {
  assert.equal(
    visual.addressFrames({ prefix: 16, destination: "192.168.20.20" }).local,
    true,
  );
  const remote = visual.addressFrames({
    prefix: 24,
    destination: "192.168.20.20",
  });
  assert.equal(remote.local, false);
  assert.equal(remote.sourceRange, "192.168.10.0/24");
  assert.equal(remote.destinationRange, "192.168.20.0/24");
  assert.equal(
    visual.addressFrames({ prefix: 24, destination: "192.168.10.150" }).local,
    true,
  );
  assert.equal(
    visual.addressFrames({ prefix: 25, destination: "192.168.10.150" }).local,
    false,
  );
});

test("bad gateway affects remote forwarding but not a connected LAN route", () => {
  const local = visual.addressFrames({
    prefix: 24,
    destination: "192.168.10.20",
    badGateway: true,
  });
  assert.equal(local.outcome, "delivered");
  assert.ok(!local.frames.some((f) => f.node === "router"));
  const remote = visual.addressFrames({
    prefix: 24,
    destination: "192.168.20.20",
    badGateway: true,
  });
  assert.equal(remote.outcome, "blocked");
  assert.equal(remote.frames.at(-1).edge, null);
});

test("visual route uses existing verdict and preserves all address fields without NAT", () => {
  for (const destination of ["peer", "server"])
    for (const scenario of ["routed", "nat", "bad-gateway"]) {
      const args = { source: "a", destination, scenario };
      const r = visual.routeFrames(args);
      const original = traceRoute(args);
      assert.equal(r.outcome, original.outcome);
      assert.deepEqual(r.frames.at(-1).packet, original.steps.at(-1).packet);
      if (scenario !== "nat" || destination === "peer") {
        assert.ok(
          r.frames.every(
            (f) => JSON.stringify(f.before) === JSON.stringify(f.packet),
          ),
        );
      }
    }
});

test("two simultaneous NAPT mappings route reversed replies to B then A with explicit translation frames", () => {
  const r = visual.routeFrames({
    source: "a",
    destination: "server",
    scenario: "nat",
    both: true,
  });
  const outbound = r.frames.filter((f) => f.change === "source");
  assert.deepEqual(
    outbound.map((f) => f.packet.sport),
    [40001, 40002],
  );
  assert.deepEqual(
    outbound.map((f) => f.before.sport),
    [51000, 51000],
  );
  const responses = r.frames.filter((f) => f.change === "destination");
  assert.deepEqual(
    responses.map((f) => f.packet.dst),
    ["192.168.10.20", "192.168.10.10"],
  );
  for (const f of responses) {
    const match = f.mappings.find((m) => m.externalPort === f.before.dport);
    assert.deepEqual(reverseNat(f.before, match), f.packet);
    assert.equal(f.before.src, f.packet.src);
    assert.equal(f.before.sport, f.packet.sport);
    assert.equal(f.mappings.length, 2);
  }
  assert.equal(r.frames[0].mappings.length, 0);
  assert.equal(outbound[0].mappings.length, 1);
  assert.equal(outbound[1].mappings.length, 2);
});

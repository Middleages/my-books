import test from "node:test";
import assert from "node:assert/strict";
import * as visual from "../src/simulations/network/foundation-visual.mjs";

test("address strip splits the same 256 addresses at .128 without moving the PCs", () => {
  assert.equal(typeof visual.addressSpace, "function");
  const a = visual.addressSpace({ prefix: 24, destination: "192.168.10.150" });
  const b = visual.addressSpace({ prefix: 25, destination: "192.168.10.150" });
  assert.deepEqual(
    a.blocks.map((x) => [x.first, x.last]),
    [["192.168.10.0", "192.168.10.255"]],
  );
  assert.deepEqual(
    b.blocks.map((x) => [x.first, x.last]),
    [
      ["192.168.10.0", "192.168.10.127"],
      ["192.168.10.128", "192.168.10.255"],
    ],
  );
  assert.equal(a.sourcePosition, b.sourcePosition);
  assert.equal(a.destinationPosition, b.destinationPosition);
  assert.equal(a.local, true);
  assert.equal(b.local, false);
  assert.equal(b.blocks[1].size, 128);
});

test("off-strip destination is never falsely plotted inside the visible /24", () => {
  assert.equal(typeof visual.addressSpace, "function");
  const a = visual.addressSpace({ prefix: 24, destination: "192.168.20.20" });
  assert.equal(a.destinationPosition, null);
  assert.equal(a.local, false);
  const b = visual.addressSpace({ prefix: 16, destination: "192.168.20.20" });
  assert.equal(b.visibleRange, "192.168.0.0/16");
  assert.equal(b.local, true);
  assert.ok(b.destinationPosition > b.sourcePosition);
  assert.equal(b.blocks[0].size, 65536);
});

test("colored bits reconstruct the exact mask and network of each selected prefix", () => {
  assert.equal(typeof visual.addressSpace, "function");
  for (const prefix of [16, 24, 25])
    for (const destination of [
      "192.168.10.20",
      "192.168.10.150",
      "192.168.20.20",
    ]) {
      const a = visual.addressSpace({ prefix, destination });
      assert.equal(a.bits.length, 32);
      assert.equal(a.bits.filter((b) => b.network).length, prefix);
      assert.equal(
        a.maskBits.join(""),
        "1".repeat(prefix) + "0".repeat(32 - prefix),
      );
      assert.equal(
        a.local,
        visual.addressFrames({ prefix, destination }).local,
      );
      assert.equal(
        parseInt(a.networkBits.join(""), 2),
        a.blocks.find((b) => b.containsSource).start,
      );
      assert.equal(
        a.bits.map((b) => b.value).join(""),
        "11000000101010000000101000001010",
      );
      assert.equal(
        a.blocks.reduce((sum, b) => sum + b.size, 0),
        a.visibleSize,
      );
      assert.equal(a.blocks.at(-1).end - a.blocks[0].start + 1, a.visibleSize);
    }
});

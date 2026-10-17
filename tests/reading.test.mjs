import test from "node:test";
import assert from "node:assert/strict";
import { parseRead } from "../src/reading.mjs";
test("keeps legacy computer progress alongside namespaced and future progress", () => {
  assert.deepEqual(
    parseRead(
      '["parallel","memory","network/packets","future/chapter","parallel",5]',
    ),
    ["parallel", "memory", "network/packets", "future/chapter"],
  );
});
test("invalid browser data does not break rendering", () => {
  for (const value of ["broken", "{}", "null", "", null])
    assert.deepEqual(parseRead(value), []);
});

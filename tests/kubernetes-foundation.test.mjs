import test from "node:test";
import assert from "node:assert/strict";
import {
  recoveryFrames,
  clusterFrames,
  accessDecision,
} from "../src/simulations/kubernetes/foundation.mjs";

test("app crash: Docker without policy stays down, Compose policy and Kubernetes recover", () => {
  for (const mode of ["docker", "compose", "kubernetes"]) {
    const f = recoveryFrames({ mode, failure: "app", replicas: 3 });
    assert.equal(f[0].running, 3);
    assert.equal(f[1].running, 2);
    assert.equal(f.at(-1).running, mode === "docker" ? 2 : 3);
    assert.equal(f[1].image, "study-web v1");
  }
});
test("one VM failure takes every instance and its recovery agents down", () => {
  for (const mode of ["docker", "compose", "kubernetes"])
    for (const replicas of [1, 3]) {
      const f = recoveryFrames({ mode, failure: "vm", replicas });
      assert.equal(f.at(-1).running, 0);
      assert.equal(f.at(-1).vmUp, false);
      assert.equal(f.at(-1).recovered, false);
    }
});
test("recovery observation is deterministic and does not mutate settings", () => {
  const s = { mode: "compose", failure: "app", replicas: 1 };
  assert.deepEqual(recoveryFrames(s), recoveryFrames(s));
  assert.equal(recoveryFrames(s).at(-1).running, 1);
  assert.deepEqual(s, { mode: "compose", failure: "app", replicas: 1 });
});
test("namespace selection does not grant permissions; context selects cluster and identity", () => {
  assert.equal(
    accessDecision({
      context: "lab-user",
      namespace: "books-lab",
      action: "deploy",
    }).allowed,
    true,
  );
  assert.equal(
    accessDecision({
      context: "lab-user",
      namespace: "other",
      action: "deploy",
    }).allowed,
    false,
  );
  assert.equal(
    accessDecision({
      context: "lab-user",
      namespace: "books-lab",
      action: "nodes",
    }).allowed,
    false,
  );
  assert.equal(
    accessDecision({
      context: "lab-admin",
      namespace: "other",
      action: "nodes",
    }).allowed,
    true,
  );
  assert.equal(
    accessDecision({
      context: "remote-reader",
      namespace: "books-lab",
      action: "deploy",
    }).allowed,
    false,
  );
  assert.equal(
    accessDecision({
      context: "remote-reader",
      namespace: "books-lab",
      action: "deploy",
    }).cluster,
    "remote-cluster",
  );
});
test("denied API operation never reaches scheduler or runtime", () => {
  const f = clusterFrames({
    path: "control",
    context: "lab-user",
    namespace: "other",
  });
  assert.equal(f.at(-1).outcome, "denied");
  assert.ok(!f.some((x) => x.active.includes("runtime")));
});
test("control flow uses API coordination; HTTP bypasses API and control agents", () => {
  const c = clusterFrames({
    path: "control",
    context: "lab-user",
    namespace: "books-lab",
  });
  assert.ok(c.some((x) => x.active.includes("scheduler")));
  assert.ok(c.some((x) => x.active.includes("kubelet")));
  assert.equal(c.at(-1).outcome, "running");
  const h = clusterFrames({
    path: "http",
    context: "lab-user",
    namespace: "other",
  });
  assert.ok(
    h.every(
      (x) =>
        !x.active.some((id) =>
          ["api", "controller", "scheduler", "kubelet", "runtime"].includes(id),
        ),
    ),
  );
  assert.equal(h.at(-1).outcome, "response");
});
test("model rejects unknown choices instead of depicting invented outcomes", () => {
  assert.throws(() => recoveryFrames({ mode: "magic" }));
  assert.throws(() => recoveryFrames({ replicas: 0 }));
  assert.throws(() => accessDecision({ context: "unknown" }));
});

test('HTTP response preserves the configured ingress return path', () => {
  const frames = clusterFrames({path:'http'});
  assert.deepEqual(frames.at(-1).edge, ['app','entry','browser']);
});

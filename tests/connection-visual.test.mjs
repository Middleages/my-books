import test from "node:test";
import assert from "node:assert/strict";
import * as v from "../src/simulations/network/connection-visual.mjs";
import {
  portResult,
  dnsResult,
  transportSteps,
  transferEstimate,
} from "../src/simulations/network/foundations.mjs";

test("port journey matches all legacy verdicts and does not fake replies for DROP", () => {
  assert.equal(typeof v.portJourney, "function");
  for (const observer of ["local", "remote"])
    for (const bind of ["all", "loopback"])
      for (const listening of [true, false])
        for (const policy of ["allow", "drop"])
          for (const port of ["8000", "8001"]) {
            const s = { observer, bind, listening, policy, port },
              j = v.portJourney(s);
            assert.deepEqual(j.result, portResult(s));
            for (const f of j.frames)
              if (f.edge) assert.equal(f.node, f.edge[1]);
            assert.equal(j.frames.at(-1).code, j.result.title);
            if (observer === "remote" && policy === "drop") {
              assert.ok(
                !j.frames.some((f) =>
                  /SYN-ACK|RST/.test(f.connection?.protocol ?? ""),
                ),
              );
              assert.ok(!j.frames.some((f) => f.id === "listener"));
            }
            if (observer === "local")
              assert.ok(!j.frames.some((f) => f.node === "gate"));
          }
});
test("loopback bind and firewall are separate; established connections share service port", () => {
  const j = v.portJourney({ observer: "remote", bind: "loopback" });
  assert.equal(
    j.frames.find((f) => f.id === "rst").connection.src,
    "192.0.2.10:8000",
  );
  assert.equal(
    v.portJourney({ observer: "local", policy: "drop" }).result.ok,
    true,
  );
  const x = v.portJourney({ bind: "all" }).connections;
  assert.equal(x[0].dst, x[1].dst);
  assert.notEqual(x[0].src, x[1].src);
});
test("DNS resolver-only preserves legacy result, TTL expiry and no app request after NXDOMAIN", () => {
  assert.equal(typeof v.dnsJourney, "function");
  for (const cache of [true, false])
    for (const age of [0, 30, 59, 60, 120])
      for (const record of ["exists", "missing"])
        for (const app of [true, false]) {
          const j = v.dnsJourney({ cache, age, record, app }),
            r = dnsResult({ cache, age, record, app });
          assert.equal(j.result.address, r.address);
          assert.equal(j.result.remaining, r.remaining);
          assert.equal(j.result.connection, r.connection);
          for (const f of j.frames)
            if (f.connection?.protocol === "DNS / UDP")
              assert.equal(f.connection.pathLabel, "질문 이름 / 레코드 종류");
          if (!r.address)
            assert.ok(!j.frames.some((f) => f.id === "app-connect"));
        }
});
test("DNS closest valid cache wins; upper clear cannot flush resolver, downstream TTL is not renewed", () => {
  const b = v.dnsJourney({ browser: true, os: true });
  assert.equal(b.source, "browser");
  assert.equal(b.result.remaining, 20);
  assert.ok(!b.frames.some((f) => f.node === "resolver"));
  const o = v.dnsJourney({ browser: true, os: true, age: 20 });
  assert.equal(o.source, "os");
  assert.equal(o.result.remaining, 20);
  const r = v.dnsJourney({ browser: false, os: false, age: 40 });
  assert.equal(r.source, "resolver");
  assert.equal(r.result.remaining, 20);
  assert.equal(
    r.frames.at(-1).caches.find((x) => x.id === "browser").remaining,
    20,
  );
  assert.equal(
    v.dnsJourney({ browser: true, os: true, age: 60 }).source,
    "authority",
  );
  assert.equal(
    v.dnsJourney({ browser: true, record: "missing" }).result.address,
    "192.0.2.10",
  );
});
test("TCP observation matches legacy in-order/loss receiver states, ACK travels independently", () => {
  assert.equal(typeof v.tcpJourney, "function");
  for (const mode of ["ordered", "loss"]) {
    const j = v.tcpJourney(mode),
      recv = j.frames.filter(
        (f) => f.event === "receive" || f.event === "loss",
      );
    const old = transportSteps(mode === "loss");
    assert.equal(recv.length, old.length);
    recv.forEach((f, i) => {
      assert.equal(f.ack, old[i].ack);
      assert.equal(f.delivered, old[i].delivered);
      assert.equal(f.buffered, old[i].buffered);
    });
    const first = j.frames.find((f) => f.event === "receive");
    assert.equal(first.senderAck, 1);
    assert.equal(first.ack, 101);
    assert.equal(j.frames[j.frames.indexOf(first) + 1].senderAck, 101);
  }
});
test("delayed B can restore order without retransmission; loss waits for RTO, not three duplicate ACKs", () => {
  const reorder = v.tcpJourney("reorder");
  const c = reorder.frames.find(
    (f) => f.chunk === "C" && f.event === "receive",
  );
  assert.equal(c.ack, 101);
  assert.equal(c.buffered, 100);
  assert.ok(!reorder.frames.some((f) => f.event === "timeout"));
  const loss = v.tcpJourney("loss");
  assert.ok(loss.frames.some((f) => f.event === "timeout"));
  assert.equal(loss.frames.at(-1).senderAck, 301);
  assert.equal(loss.frames.at(-1).delivered, 300);
  assert.equal(loss.frames.at(-1).buffered, 0);
});
test("performance lanes use identical seconds scale and preserve estimate, bandwidth never reduces RTT", () => {
  assert.equal(typeof v.performanceJourney, "function");
  for (const mb of [0.01, 1, 10])
    for (const mbps of [10, 100])
      for (const rtt of [10, 100, 300]) {
        const j = v.performanceJourney({ mb, mbps, rtt });
        const r = transferEstimate(mb, mbps, rtt);
        assert.deepEqual(j.current, r);
        assert.equal(j.lanes[0].segments.at(-1).end, r.total);
        assert.equal(j.lanes[1].rtt, rtt / 1000);
        assert.equal(j.lanes[1].serialization, r.serialization / 10);
        assert.equal(j.frames.at(-1).time, j.maxTime);
      }
});

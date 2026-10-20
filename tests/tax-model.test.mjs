import test from "node:test";
import assert from "node:assert/strict";
import { progressiveTax, events } from "../src/simulations/tax/taxModel.mjs";
test("가상 누진세 경계와 합계", () => {
  for (const [amount, tax] of [
    [0, 0],
    [100, 10],
    [300, 50],
    [400, 80],
  ]) {
    const r = progressiveTax(amount);
    assert.equal(r.tax, tax);
    assert.equal(
      r.parts.reduce((s, p) => s + p.base, 0),
      amount,
    );
    assert.equal(
      r.parts.reduce((s, p) => s + p.tax, 0),
      tax,
    );
  }
});
test("평균세율 분모 0과 유효성", () => {
  assert.equal(progressiveTax(0).averageRate, null);
  assert.equal(progressiveTax(400).averageRate, 0.2);
  for (const n of [-1, Infinity, NaN])
    assert.throws(() => progressiveTax(n), RangeError);
});
test("사건 ID 유일", () =>
  assert.equal(new Set(events.map((e) => e.id)).size, events.length));

test("누진 구간은 소수·0·경계 양쪽에서도 합계와 독립식을 보존한다", () => {
  const oracle = (n) =>
    n <= 100 ? n / 10 : n <= 300 ? n / 5 - 10 : n * 0.3 - 40;
  const points = [
    0,
    0.01,
    99.99,
    100,
    100.01,
    299.99,
    300,
    300.01,
    400,
    600,
    1000000,
    Number.MAX_VALUE,
  ];
  const close = (a, b) =>
    assert(Math.abs(a - b) <= 1e-10 * Math.max(1, Math.abs(a), Math.abs(b)));
  for (const n of points) {
    const r = progressiveTax(n);
    close(r.tax, oracle(n));
    close(
      r.parts.reduce((s, p) => s + p.base, 0),
      n,
    );
    assert.deepEqual(progressiveTax(n), r);
    r.parts.forEach((p) => assert(p.base >= 0 && p.tax >= 0));
  }
});
test("세율 경계를 넘는 한 단위는 추가 구간만 바꾸고 이전 금액을 다시 과세하지 않는다", () => {
  for (const [before, after, extra] of [
    [99, 100, 0.1],
    [100, 101, 0.2],
    [299, 300, 0.2],
    [300, 301, 0.3],
  ])
    assert(
      Math.abs(progressiveTax(after).tax - progressiveTax(before).tax - extra) <
        1e-10,
    );
  let previous = 0;
  for (let n = 0; n <= 600; n += 0.25) {
    const r = progressiveTax(n);
    assert(r.tax >= previous);
    assert(r.tax <= n * 0.3);
    previous = r.tax;
  }
});
test("숫자처럼 보이는 잘못된 입력도 과세 바탕으로 받아들이지 않는다", () => {
  for (const n of ["400", "", null, undefined, {}, true])
    assert.throws(() => progressiveTax(n), RangeError);
});
test("생활 사건은 서로 다른 관계와 추가 확인 질문을 보존한다", () => {
  assert.deepEqual(
    events.map((e) => e.id),
    ["salary", "shopping", "transfer", "holding", "gift"],
  );
  for (const e of events)
    for (const key of ["label", "from", "to", "kind", "check"])
      assert.equal(typeof e[key], "string");
  assert.match(events.find((e) => e.id === "transfer").check, /본인|단순/);
});

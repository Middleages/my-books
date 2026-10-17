// Bounded teaching models; no real connections or wall-clock timers.
export function portResult({ observer, bind, listening, policy, port }) {
  const target = observer === "local" ? "127.0.0.1" : "192.0.2.10";
  if (observer === "remote" && policy === "drop")
    return {
      ok: false,
      title: "응답 없음 · 시간 초과",
      detail:
        "이 사례에서는 원격 TCP 요청을 방화벽이 조용히 버립니다. 실제 timeout은 경로·응답 손실 등으로도 발생합니다.",
      target,
    };
  if (
    !listening ||
    port !== "8000" ||
    (observer === "remote" && bind === "loopback")
  )
    return {
      ok: false,
      title: "연결 거부",
      detail:
        "이 사례에서는 목적지 주소:포트에 맞는 TCP 리스너가 없어 서버가 RST로 거절합니다. 실제 거부는 방화벽의 명시적 거절일 수도 있습니다.",
      target,
    };
  return {
    ok: true,
    title: "TCP 연결 성공",
    detail:
      "주소·포트에 맞는 리스너까지 연결됐습니다. HTTP 응답, 로그인, TLS 검증 성공까지 확인한 것은 아닙니다.",
    target,
  };
}
export function dnsResult({ cache, age, record, app }) {
  const cached = cache && age < 60;
  if (!cached && record === "missing")
    return {
      address: null,
      source: "권한 서버 조회",
      remaining: 0,
      connection: "이름 없음 · NXDOMAIN",
      detail:
        "이 가상 이름은 존재하지 않습니다. 주소를 얻지 못했으므로 앱 연결은 시작하지 않습니다.",
    };
  const address = cached ? "192.0.2.10" : "192.0.2.20";
  return {
    address,
    source: cached ? "리졸버 캐시" : "권한 서버 조회",
    remaining: cached ? 60 - age : 60,
    connection: app ? "TCP 연결 성공" : "연결 거부",
    detail: cached
      ? "권한 서버의 변경과 무관하게 아직 유효한 이전 A 레코드를 사용합니다."
      : "새 A 레코드를 얻었습니다. 이름 조회와 앱의 리스닝 상태는 별개의 조건입니다.",
  };
}
export function transportSteps(loss) {
  const start = [
    {
      title: "A 도착 · 바이트 1~100",
      ack: 101,
      delivered: 100,
      buffered: 0,
      detail:
        "빈틈없이 100바이트를 받았습니다. ACK 101은 다음에 필요한 바이트 번호입니다.",
    },
    {
      title: loss ? "B 손실 · 바이트 101~200" : "B 도착 · 바이트 101~200",
      ack: loss ? 101 : 201,
      delivered: loss ? 100 : 200,
      buffered: 0,
      detail: loss
        ? "아직 수신자는 손실과 지연을 구별할 수 없습니다. 빈 구간은 그대로 남습니다."
        : "연속된 데이터가 늘어 ACK도 앞으로 이동합니다.",
    },
    {
      title: "C 도착 · 바이트 201~300",
      ack: loss ? 101 : 301,
      delivered: loss ? 100 : 300,
      buffered: loss ? 100 : 0,
      detail: loss
        ? "뒤쪽 100바이트는 버퍼에 보관하지만 앱에는 앞의 빈 구간을 건너뛰어 전달하지 않습니다."
        : "300바이트가 모두 순서대로 앱에 전달됩니다.",
    },
  ];
  if (loss)
    start.push({
      title: "B 재전송 후 도착",
      ack: 301,
      delivered: 300,
      buffered: 0,
      detail:
        "이 사례는 타임아웃 후 복구합니다. 빈 구간이 채워져 보관한 C까지 전달됩니다. ACK 자체의 손실은 생략했습니다.",
    });
  return start;
}
export function transferEstimate(mb, mbps, rtt) {
  const serialization = (mb * 8) / mbps;
  return {
    serialization,
    roundTrip: rtt / 1000,
    total: serialization + rtt / 1000,
  };
}

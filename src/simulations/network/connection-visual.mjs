import {
  portResult,
  dnsResult,
  transportSteps,
  transferEstimate,
} from "./foundations.mjs";

export function portJourney(options = {}) {
  const s = {
    observer: "remote",
    bind: "loopback",
    listening: true,
    policy: "allow",
    port: "8000",
    ...options,
  };
  const result = portResult(s),
    local = s.observer === "local";
  const outbound = {
    src: local ? "127.0.0.1:51000" : "192.0.2.11:51000",
    dst: `${result.target}:${s.port}`,
    protocol: "TCP · SYN",
    path: "TCP만 관찰 · HTTP 전송 전",
    pathLabel: "관찰 범위",
  };
  const reverse = { ...outbound, src: outbound.dst, dst: outbound.src };
  const frames = [];
  const add = (
    id,
    title,
    detail,
    node,
    edge = null,
    connection = outbound,
    extra = {},
  ) => frames.push({ id, title, detail, node, edge, connection, ...extra });
  add(
    "start",
    "어디서 어느 접점으로?",
    local
      ? "VM 내부 프로그램이 자기 loopback으로 접속합니다. 원격 경로의 방화벽 체크는 이 경로에 적용하지 않습니다."
      : "PC A가 VM의 실제 주소로 접속합니다. 목적지 주소·포트와 프로토콜을 모두 확인합니다.",
    "client",
  );
  if (!local) {
    add(
      "policy",
      "SYN이 방화벽 위치에 도착",
      s.policy === "drop"
        ? "이 사례의 DROP 규칙이 SYN을 버립니다. 앱 리스너까지 도달하지 않습니다."
        : "방화벽이 이 원격 TCP 연결을 허용합니다. 허용은 앱을 실행하거나 listen시키는 동작이 아닙니다.",
      "gate",
      ["client", "gate"],
    );
    if (s.policy === "drop") {
      add(
        "timeout",
        "응답이 없어 기다림 종료",
        result.detail,
        "client",
        null,
        { ...outbound, protocol: "TCP · 응답 없음 (이 사례는 DROP)" },
        { code: result.title },
      );
      return {
        result,
        frames,
        outbound,
        listeners: listenerState(s),
        connections: connectionExamples(),
      };
    }
  }
  add(
    "listener",
    "OS가 주소·TCP 포트에 맞는 리스너를 찾음",
    s.listening
      ? `앱은 ${s.bind === "all" ? "0.0.0.0" : "127.0.0.1"}:8000에서 listen 중입니다. 요청 목적지는 ${outbound.dst}입니다.`
      : "앱 리스너가 중지됐습니다. 프로세스의 존재만으로 원하는 접점의 listen을 보장하지 않습니다.",
    "listener",
    [local ? "client" : "gate", "listener"],
  );
  if (!result.ok) {
    add(
      "rst",
      "이 사례의 서버가 RST로 거부",
      result.detail,
      local ? "client" : "gate",
      ["listener", local ? "client" : "gate"],
      { ...reverse, protocol: "TCP · RST" },
    );
    if (!local)
      add(
        "rst-return",
        "거절 응답이 PC로 돌아옴",
        "허용된 반환 경로를 가정합니다. 실제 연결 거부는 정책의 명시적 거절로도 생길 수 있습니다.",
        "client",
        ["gate", "client"],
        { ...reverse, protocol: "TCP · RST" },
      );
  } else {
    add(
      "synack",
      "서버가 SYN-ACK 응답",
      "주소에 맞는 TCP 리스너가 연결 요청을 받았습니다. 서버가 SYN-ACK로 응답합니다.",
      local ? "client" : "gate",
      ["listener", local ? "client" : "gate"],
      { ...reverse, protocol: "TCP · SYN-ACK" },
    );
    if (!local)
      add(
        "synack-return",
        "SYN-ACK가 PC에 도착",
        "두 끝점의 TCP 연결 준비가 진행됩니다.",
        "client",
        ["gate", "client"],
        { ...reverse, protocol: "TCP · SYN-ACK" },
      );
    add(
      "ack",
      "클라이언트가 ACK 전송",
      "마지막 ACK를 보내고 서버가 받는다고 가정합니다. TCP 연결 성공은 TLS·HTTP·로그인 성공과 다릅니다.",
      local ? "listener" : "gate",
      ["client", local ? "listener" : "gate"],
      { ...outbound, protocol: "TCP · ACK" },
    );
    if (!local)
      add(
        "ack-arrive",
        "ACK가 리스너 쪽 TCP에 도착",
        "같은 서버 포트라도 상대 주소와 포트 조합으로 연결을 구분합니다.",
        "listener",
        ["gate", "listener"],
        { ...outbound, protocol: "TCP · ACK" },
      );
  }
  add(
    "result",
    result.title,
    result.detail,
    result.ok ? "listener" : "client",
    null,
    {
      ...outbound,
      protocol: result.ok ? "TCP · 연결 준비 완료" : "TCP · 연결 거부",
    },
    { code: result.title },
  );
  return {
    result,
    frames,
    outbound,
    listeners: listenerState(s),
    connections: connectionExamples(),
  };
}
function listenerState(s) {
  return [
    {
      port: "8000",
      address: s.bind === "all" ? "0.0.0.0" : "127.0.0.1",
      active: s.listening,
    },
    { port: "8001", address: "—", active: false },
  ];
}
function connectionExamples() {
  return ["192.0.2.11:51000", "192.0.2.12:52000"].map((src) => ({
    src,
    dst: "192.0.2.10:8000",
    protocol: "TCP",
    path: "연결 식별 예 · 리스너·정책이 정상일 때",
  }));
}

export function dnsJourney(options = {}) {
  const s = {
    browser: false,
    os: false,
    cache: true,
    age: 0,
    record: "exists",
    app: true,
    ...options,
  };
  const defs = [
    ["browser", "브라우저 캐시", s.browser, 20],
    ["os", "OS 캐시", s.os, 40],
    ["resolver", "리졸버 캐시", s.cache, 60],
  ];
  let caches = defs.map(([id, name, present, ttl]) => ({
    id,
    name,
    address: present ? "192.0.2.10" : null,
    remaining: present ? Math.max(0, ttl - s.age) : 0,
    valid: !!present && s.age < ttl,
  }));
  const hit = caches.find((c) => c.valid),
    source = hit?.id ?? "authority";
  const legacy = dnsResult({
    cache: !!hit,
    age: hit ? 60 - hit.remaining : s.age,
    record: s.record,
    app: s.app,
  });
  const result = { ...legacy, source: hit?.name ?? "권한 서버 조회" };
  const frames = [];
  const add = (id, title, detail, node, edge = null, connection = null) =>
    frames.push({
      id,
      title,
      detail,
      node,
      edge,
      connection,
      caches: caches.map((c) => ({ ...c })),
      answer: null,
    });
  const localCall = {
    src: "브라우저 해석 기능",
    dst: "OS 해석 기능",
    protocol: "로컬 호출 · DNS 패킷 아님",
    sourceLabel: "출발 해석 기능",
    destinationLabel: "도착 해석 기능",
    pathLabel: "질문 이름 / 레코드 종류",
    path: "app.example.test / A",
  };
  const dnsWire = {
    src: "198.51.100.30:53000",
    dst: "192.0.2.53:53",
    protocol: "DNS / UDP",
    pathLabel: "질문 이름 / 레코드 종류",
    path: "app.example.test / A",
  };
  const authorityWire = {
    src: "192.0.2.53:53001",
    dst: "198.51.100.53:53",
    protocol: "DNS / UDP",
    pathLabel: "질문 이름 / 레코드 종류",
    path: "app.example.test / A",
  };
  add(
    "start",
    "주소 변경 후 새 이름 조회",
    `관찰 시각 t=${s.age}초. t=0에 권한 A 레코드가 ${s.record === "exists" ? "192.0.2.20으로 변경" : "삭제"}됐습니다. 아래 캐시는 변경 직전의 서로 다른 잔여 TTL을 가진 가상 스냅샷입니다.`,
    "browser",
  );
  for (let i = 0; i < defs.length; i++) {
    const [id, name] = defs[i],
      entry = caches[i];
    add(
      `check-${id}`,
      `${name} 확인`,
      entry.valid
        ? `${entry.address}, 남은 TTL ${entry.remaining}초. 여기서 답하므로 더 아래 서버에 묻지 않습니다.`
        : entry.address
          ? "보관한 이전 답은 만료됐습니다. 다음 해석 단계에 묻습니다."
          : "보관한 답이 없습니다. 다음 해석 단계에 묻습니다.",
      id,
      i === 0 ? null : [defs[i - 1][0], id],
      i === 0 ? null : i === 1 ? localCall : dnsWire,
    );
    if (id === source) break;
  }
  if (source === "authority")
    add(
      "authority",
      "권한 서버가 현재 답 제공",
      s.record === "exists"
        ? "새 주소 192.0.2.20과 TTL 60초를 반환합니다. 루트/TLD 위임 정보는 이미 안다고 가정합니다."
        : "이 사례는 이름 자체가 없어 NXDOMAIN을 반환합니다. 연결 timeout이나 NODATA와 다릅니다.",
      "authority",
      ["resolver", "authority"],
      authorityWire,
    );
  const sourceIndex =
    source === "authority" ? 3 : defs.findIndex((d) => d[0] === source);
  for (let i = sourceIndex - 1; i >= 0; i--) {
    if (result.address)
      caches = caches.map((c, n) =>
        n === i
          ? {
              ...c,
              address: result.address,
              remaining: result.remaining,
              valid: true,
            }
          : c,
      );
    const from = sourceIndex === 3 && i === 2 ? "authority" : defs[i + 1]?.[0];
    const wire = i === 2 ? authorityWire : i === 1 ? dnsWire : localCall;
    add(
      `answer-${i}`,
      "위쪽으로 답 전달 · 남은 TTL 보존",
      result.address
        ? `${result.address} · TTL ${result.remaining}초를 ${defs[i][1]}에 전달합니다. 캐시 답을 받았다고 TTL을 새로 60초로 늘리지 않습니다.`
        : "NXDOMAIN을 위쪽에 전달합니다. 음성 캐시를 저장·만료시키는 과정은 이 실험에서 생략합니다.",
      defs[i][0],
      [from, defs[i][0]],
      { ...wire, src: wire.dst, dst: wire.src },
    );
  }
  add(
    "answer",
    "브라우저가 이름 조회 결과를 받음",
    result.address
      ? `주소 ${result.address}를 얻었습니다. 아직 앱 리스너에 연결한 것은 아닙니다.`
      : "주소를 얻지 못해 앱 연결을 시작하지 않습니다.",
    "browser",
  );
  frames.at(-1).answer = result.address ?? "주소 없음";
  if (result.address) {
    add(
      "app-connect",
      "이제 별도의 앱 TCP 연결",
      `${result.address}:8000으로 TCP 연결을 시도합니다. ${result.connection}. 이름 조회 결과와 앱 리스너 상태를 나누어 읽습니다.`,
      "app",
      ["browser", "app"],
      {
        src: "198.51.100.30:51000",
        dst: `${result.address}:8000`,
        protocol: "앱 접속 / TCP",
        path: "DNS 조회와 별개 · HTTP /report 전",
      },
    );
    frames.at(-1).answer = result.address;
  }
  frames.at(-1).code = result.connection;
  return {
    result,
    source,
    frames,
    authoritative: s.record === "exists" ? "192.0.2.20 · TTL 60초" : "NXDOMAIN",
    initialCaches: frames[0].caches,
  };
}

export function tcpJourney(mode = "loss") {
  const loss = mode === "loss",
    reorder = mode === "reorder";
  const frames = [];
  let received = [false, false, false],
    ack = 1,
    senderAck = 1,
    delivered = 0,
    buffered = 0;
  const add = (event, title, detail, chunk = null, reverse = false) =>
    frames.push({
      event,
      title,
      detail,
      chunk,
      reverse,
      received: [...received],
      ack,
      senderAck,
      delivered,
      buffered,
    });
  add(
    "start",
    "이미 연결된 TCP · A/B/C를 보낼 준비",
    "각 구간 100바이트, 첫 데이터 번호 1입니다. 수신 ACK(다음 기대 번호)와 송신자가 실제 확인한 ACK를 분리합니다.",
  );
  const arrive = (chunk, retransmit = false) => {
    const i = ["A", "B", "C"].indexOf(chunk);
    received[i] = true;
    let contiguous = 0;
    while (received[contiguous]) contiguous++;
    delivered = contiguous * 100;
    buffered = received.filter(Boolean).length * 100 - delivered;
    ack = delivered + 1;
    // The legacy receiver observations are reused for ordered/loss cases; reorder adds a delayed-B case.
    if (!reorder) {
      const old = transportSteps(loss);
      const k = chunk === "A" ? 0 : chunk === "C" ? 2 : retransmit ? 3 : 1;
      ({ ack, delivered, buffered } = old[k]);
    }
    add(
      "receive",
      `${chunk}${retransmit ? " 재전송" : ""} 도착 · ${i * 100 + 1}~${(i + 1) * 100}`,
      buffered
        ? `뒤의 ${buffered}바이트는 버퍼에 보관합니다. 앞의 빈칸을 건너뛰어 앱에 제공하지 않습니다.`
        : `앱에 순서대로 제공할 수 있는 범위는 1~${delivered}입니다. 실제 앱의 read 호출 단위는 재현하지 않습니다.`,
      chunk,
    );
    senderAck = ack;
    add(
      "ack",
      `ACK ${ack}가 송신자에 도착`,
      `수신 측의 다음 기대 번호 ${ack}를 송신 측이 이제 확인합니다. ACK 지연·손실은 생략합니다.`,
      null,
      true,
    );
  };
  arrive("A");
  if (reorder) {
    arrive("C");
    arrive("B");
  } else if (loss) {
    add(
      "loss",
      "B 손실 · 수신 상태는 그대로",
      "수신자는 B가 지연됐는지 손실됐는지 아직 모릅니다. 이 순간 새 ACK를 받은 것으로 표시하지 않습니다.",
      "B",
    );
    arrive("C");
    add(
      "timeout",
      "송신자 재전송 타이머 만료",
      "이 작은 사례는 빠른 재전송에 필요한 중복 ACK 수를 만들지 않습니다. RTO 계산·시간값을 재현하지 않고 타임아웃 후 B를 한 번 재전송합니다.",
    );
    arrive("B", true);
  } else {
    arrive("B");
    arrive("C");
  }
  return { frames, prediction: loss || reorder ? 100 : 300, mode };
}

export function performanceJourney({ mb = 1, mbps = 10, rtt = 100 } = {}) {
  const make = (rate, name) => {
    const r = transferEstimate(mb, rate, rtt),
      half = r.roundTrip / 2;
    return {
      name,
      mbps: rate,
      rtt: r.roundTrip,
      serialization: r.serialization,
      total: r.total,
      segments: [
        { name: "작은 요청의 전파", start: 0, end: half, kind: "rtt" },
        {
          name: "응답 데이터 밀어 넣기",
          start: half,
          end: half + r.serialization,
          kind: "data",
        },
        {
          name: "마지막 비트의 반환 전파",
          start: half + r.serialization,
          end: r.total,
          kind: "rtt",
        },
      ],
    };
  };
  const lanes = [make(mbps, "현재 대역폭"), make(mbps * 10, "대역폭만 10배")],
    maxTime = lanes[0].total;
  const times = [
    ...new Set([
      0,
      ...lanes.flatMap((l) => l.segments.map((s) => s.end)),
      ...Array.from({ length: 7 }, (_, i) => (maxTime * (i + 1)) / 8),
      maxTime,
    ]),
  ].sort((a, b) => a - b);
  const frames = times.map((time) => ({
    time,
    title: `t=${time.toFixed(3)}초`,
    detail:
      "두 줄은 같은 시간 눈금입니다. 대역폭은 데이터 직렬화 구간을 줄이지만 이 모델의 왕복 전파 지연은 바꾸지 않습니다.",
    lanes: lanes.map((l) => ({
      done: time >= l.total,
      segments: l.segments.map((s) => ({
        ...s,
        width: ((s.end - s.start) / maxTime) * 100,
        progress: Math.max(
          0,
          Math.min(1, (time - s.start) / (s.end - s.start)),
        ),
      })),
    })),
  }));
  return { current: transferEstimate(mb, mbps, rtt), lanes, frames, maxTime };
}

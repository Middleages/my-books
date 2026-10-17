import { sameSubnet, traceRoute, hosts } from "./model.mjs";
import { transportSteps } from "./foundations.mjs";

// One frame is the sole source for diagram, fields, narration and verdict.
export function packetFrames(loss = true) {
  const empty = {
    delivered: 0,
    buffered: 0,
    ack: 1,
    received: [false, false, false],
    complete: false,
    chunk: null,
  };
  const frames = [
    {
      ...empty,
      title: "앱의 의미 · 사진 또는 메시지",
      detail:
        "보내는 앱이 의미 있는 내용을 전송용 바이트로 표현합니다. 받는 앱은 미리 알려진 길이 300바이트를 읽는 가상 규칙을 사용합니다.",
      phase: "app",
    },
    {
      ...empty,
      title: "전송 데이터 · 300바이트의 흐름",
      detail:
        "TCP에는 사진이라는 단위가 없습니다. 여기서는 전송 데이터를 A·B·C 각 100바이트로 나눠 보여 줍니다.",
      phase: "stream",
    },
    {
      ...empty,
      title: "IP 패킷에 TCP 구간 담기",
      detail:
        "각 TCP 헤더와 데이터 구간을 IP 패킷에 담습니다. A·B·C는 설명용 라벨이고, 순서 번호는 TCP 바이트 위치입니다.",
      phase: "packets",
    },
  ];
  transportSteps(loss).forEach((s, i) => {
    const received = [
      s.delivered >= 100,
      s.delivered >= 200,
      s.delivered >= 300 || s.buffered > 0,
    ];
    frames.push({
      ...s,
      received,
      complete: false,
      chunk: i === 3 ? "B" : ["A", "B", "C"][i],
      phase: "transfer",
      moving: !(loss && i === 1),
    });
  });
  frames.push({
    ...frames.at(-1),
    title: "앱이 전체 내용을 해석",
    detail:
      "TCP가 순서대로 제공한 300바이트를 앱의 길이 규칙으로 읽어 사진이나 메시지로 해석합니다. IP 단편 재조립과 다른 과정입니다.",
    phase: "complete",
    chunk: null,
    moving: false,
    complete: true,
  });
  return frames;
}

function networkRange(ip, prefix) {
  const n = ip.split(".").reduce((a, x) => a * 256 + Number(x), 0);
  const size = 2 ** (32 - prefix);
  const start = Math.floor(n / size) * size;
  return (
    [24, 16, 8, 0]
      .map((shift) => Math.floor(start / 2 ** shift) % 256)
      .join(".") +
    "/" +
    prefix
  );
}
export function addressFrames({
  prefix = 24,
  destination = "192.168.10.20",
  badGateway = false,
} = {}) {
  const source = hosts.a.ip;
  const local = sameSubnet(source, destination, prefix);
  const gateway = badGateway ? "192.168.10.254" : "192.168.10.1";
  const sourceRange = networkRange(source, prefix);
  const destinationRange = networkRange(destination, prefix);
  const outcome = !local && badGateway ? "blocked" : "delivered";
  const packet = {
    protocol: "TCP",
    src: source,
    dst: destination,
    sport: 51000,
    dport: 8000,
  };
  const frame = (node, title, detail, edge = null) => ({
    node,
    title,
    detail,
    edge,
    packet,
    before: packet,
    change: "",
    mappings: [],
  });
  const frames = [
    frame(
      "source",
      "주소와 prefix 비교",
      `${sourceRange}와 ${destinationRange}는 ${local ? "같은" : "다른"} 범위입니다. 연결 경로와 기본 경로만 있는 이 모델에서 ${local ? "목적지에 직접" : "게이트웨이에"} 전달합니다.`,
    ),
  ];
  if (local) {
    frames.push(
      frame(
        "target",
        "같은 LAN에서 직접 전달",
        "스위치/AP를 통해 목적지로 전달합니다. 기본 게이트웨이 설정은 사용하지 않습니다.",
        ["source", "target"],
      ),
    );
  } else if (badGateway) {
    frames.push(
      frame(
        "source",
        "중단 · 설정된 다음 홉이 없음",
        `${gateway}에 응답하는 장비가 없습니다. 올바른 라우터는 192.168.10.1입니다. 목적지 IP를 게이트웨이로 바꾸지는 않습니다.`,
      ),
    );
  } else {
    frames.push(
      frame(
        "router",
        "경계의 게이트웨이로 전달",
        `다음 홉은 ${gateway}입니다. IP 목적지는 ${destination} 그대로입니다.`,
        ["source", "router"],
      ),
    );
    frames.push(
      frame(
        "target",
        "다른 네트워크에 전달",
        "라우터가 다음 경로로 전달합니다. 이 모델은 반환 경로도 설정된 NAT 없는 망입니다.",
        ["router", "target"],
      ),
    );
  }
  return {
    source,
    destination,
    prefix,
    sourceRange,
    destinationRange,
    gateway,
    local,
    outcome,
    frames,
  };
}

export function routeFrames({
  source = "a",
  destination = "peer",
  scenario = "routed",
  both = false,
} = {}) {
  const result = traceRoute({ source, destination, scenario });
  const make = (who) => {
    const r = traceRoute({ source: who, destination, scenario });
    const stages = [];
    const push = (s, edge = null, before = s.packet, change = "") =>
      stages.push({
        ...s,
        edge,
        before,
        change,
        source: who,
        mapping: r.mapping,
      });
    push(r.steps[0]);
    if (r.local || r.outcome === "blocked") {
      r.steps
        .slice(1)
        .forEach((s, i) =>
          push(s, r.local ? [i === 0 ? who : r.steps[1].node, s.node] : null),
        );
    } else {
      push(r.steps[1], [who, "router"]);
      if (r.mapping)
        push(
          {
            ...r.steps[1],
            packet: r.steps[2].packet,
            title: "출구 변환 · 출발지 IP와 포트",
            detail:
              "같은 대화를 구분할 출구 매핑을 만듭니다. 목적지 IP·포트는 유지합니다.",
          },
          null,
          r.steps[1].packet,
          "source",
        );
      push(r.steps[2], ["router", "server"]);
      push(r.steps[3], ["server", "router"]);
      if (r.mapping)
        push(
          {
            ...r.steps[3],
            packet: r.steps[4].packet,
            title: "응답 변환 · 원래 PC를 찾음",
            detail:
              "응답의 목적지 출구 IP·포트를 기존 매핑과 맞춰 원래 PC의 IP·포트로 되돌립니다. 응답 출발지는 서버 그대로입니다.",
          },
          null,
          r.steps[3].packet,
          "destination",
        );
      push(r.steps[4], ["router", who]);
    }
    return stages;
  };
  let frames = make(source);
  if (both && scenario === "nat" && !result.local) {
    const a = make("a"),
      b = make("b");
    frames = [...a.slice(0, 4), ...b.slice(0, 4), ...b.slice(4), ...a.slice(4)];
  }
  const mappings = new Map();
  frames = frames.map((f) => {
    if (f.change === "source") mappings.set(f.source, f.mapping);
    return { ...f, mappings: [...mappings.values()] };
  });
  return { ...result, frames };
}

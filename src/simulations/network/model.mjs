/** Deterministic IPv4 teaching model: one LAN, one router, one remote server.
 * No actual requests, routing discovery, TCP handshake or firewall simulation. */
export const hosts = {
  a: { name: "PC A", ip: "192.168.10.10" },
  b: { name: "PC B", ip: "192.168.10.20" },
};
function ipv4(value) {
  const parts = value.split(".");
  if (
    parts.length !== 4 ||
    parts.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255)
  )
    throw new Error("올바른 IPv4 주소가 필요합니다.");
  return parts.reduce((n, p) => n * 256 + Number(p), 0);
}
export function sameSubnet(a, b, prefix) {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32)
    throw new Error("prefix는 0~32 정수입니다.");
  const size = 2 ** (32 - prefix);
  return Math.floor(ipv4(a) / size) === Math.floor(ipv4(b) / size);
}
export function reverseNat(packet, mapping) {
  if (
    !mapping ||
    packet.protocol !== mapping.protocol ||
    packet.dst !== mapping.externalIp ||
    packet.dport !== mapping.externalPort
  )
    return null;
  return { ...packet, dst: mapping.internalIp, dport: mapping.internalPort };
}
export function traceRoute({
  source = "a",
  destination = "peer",
  scenario = "routed",
} = {}) {
  if (
    !hosts[source] ||
    !["peer", "server"].includes(destination) ||
    !["routed", "nat", "bad-gateway"].includes(scenario)
  )
    throw new Error("지원하지 않는 실험 조건입니다.");
  const peer = source === "a" ? "b" : "a";
  const src = hosts[source].ip;
  const dst =
    destination === "peer"
      ? hosts[peer].ip
      : scenario === "nat"
        ? "198.51.100.20"
        : "192.168.20.20";
  const packet = { protocol: "TCP", src, dst, sport: 51000, dport: 8000 };
  const steps = [];
  const add = (node, title, detail, p = packet, reason = "") =>
    steps.push({ node, title, detail, packet: { ...p }, reason });
  const local = sameSubnet(src, dst, 24);
  add(
    source,
    "목적지와 내 네트워크 비교",
    `${src}/24에서 ${dst}는 ${local ? "같은" : "다른"} 네트워크입니다. ${local ? "상대에게 직접 전달할 경로를 선택합니다." : "기본 게이트웨이를 다음 홉으로 선택합니다."}`,
  );
  const reply = (p) => ({
    ...p,
    src: p.dst,
    dst: p.src,
    sport: p.dport,
    dport: p.sport,
  });
  if (local) {
    add(
      peer,
      "같은 망의 상대에게 전달",
      "같은 LAN의 스위치/AP가 전달을 돕습니다. 라우터의 네트워크 간 전달 기능과 NAT는 사용하지 않습니다.",
    );
    add(
      source,
      "응답 도착",
      "응답도 같은 LAN 안에서 돌아옵니다.",
      reply(packet),
    );
    return { steps, mapping: null, outcome: "delivered", local };
  }
  if (scenario === "bad-gateway") {
    add(
      source,
      "중단 · 다음 홉을 찾지 못함",
      "설정된 192.168.10.254에 응답하는 장비가 이 지도에는 없습니다. 실제 라우터 주소는 192.168.10.1입니다. 목적지 서버에 보내기 전에 멈췄습니다.",
      packet,
      "gateway-unreachable",
    );
    return { steps, mapping: null, outcome: "blocked", local };
  }
  add(
    "router",
    "게이트웨이에 도착",
    "다음 홉은 192.168.10.1이지만 IP 패킷의 목적지는 서버 주소 그대로입니다. 라우터가 이후 경로를 선택합니다.",
  );
  const mapping =
    scenario === "nat"
      ? {
          protocol: "TCP",
          internalIp: src,
          internalPort: 51000,
          externalIp: "203.0.113.5",
          externalPort: source === "a" ? 40001 : 40002,
        }
      : null;
  const outgoing = mapping
    ? { ...packet, src: mapping.externalIp, sport: mapping.externalPort }
    : packet;
  add(
    "server",
    mapping ? "출발지 변환 후 서버 도착" : "주소 변환 없이 서버 도착",
    mapping
      ? "출구에서 출발지 IP와 포트를 바꿨습니다. 서버가 보는 출발지는 출구 주소입니다."
      : "라우터가 다른 사설망으로 전달했습니다. 이 사례는 양쪽 경로가 설정되어 있어 NAT 없이 통신합니다.",
    outgoing,
  );
  const returning = reply(outgoing);
  add(
    "router",
    "응답이 라우터로 돌아옴",
    mapping
      ? "서버는 자신이 본 출발지 주소와 포트로 답합니다. 출구 장비에서 기존 매핑을 찾습니다."
      : "서버 쪽의 반환 경로를 따라 응답이 돌아옵니다. 가는 길뿐 아니라 돌아오는 경로도 필요합니다.",
    returning,
  );
  add(
    source,
    "응답 도착",
    mapping
      ? "기존 매핑을 사용해 목적지를 원래 PC의 주소와 포트로 되돌렸습니다."
      : "목적지 주소를 바꾸지 않고 PC에 전달했습니다.",
    mapping ? reverseNat(returning, mapping) : returning,
  );
  return { steps, mapping, outcome: "delivered", local };
}

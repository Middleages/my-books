export const scenarios = [
  {
    id: "routed",
    label: "다른 사설망 · NAT 없음",
    description:
      "라우터 양쪽에 경로가 있는 두 사설망입니다. 서버 쪽 반환 경로도 설정되어 있습니다.",
  },
  {
    id: "nat",
    label: "인터넷 출구 · IPv4 NAT",
    description:
      "사설망에서 인터넷으로 나가는 출구 사례입니다. 중간 인터넷 라우터는 생략했습니다.",
  },
  {
    id: "bad-gateway",
    label: "잘못된 게이트웨이",
    description:
      "PC의 기본 게이트웨이가 192.168.10.254로 잘못 설정되어 있습니다. 이 주소의 장비는 없습니다.",
  },
];

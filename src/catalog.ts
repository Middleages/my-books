import Parallel from "./content/computer/Parallel";
import Memory from "./content/computer/Memory";
import Packets from "./content/network/Packets";
import Addressing from "./content/network/Addressing";
import Routing from "./content/network/Routing";
import type { ComponentType } from "react";
export type Chapter = {
  id: string;
  bookId: string;
  readId: string;
  number: string;
  title: string;
  heading: string;
  description: string;
  Content: ComponentType;
};
export const chapters: Chapter[] = [
  {
    id: "parallel",
    bookId: "computer",
    readId: "parallel",
    number: "01",
    title: "CPU와 GPU",
    heading: "많은 코어는 언제 빨라질까?",
    description: "병렬화와 직렬 구간이 실행 시간에 미치는 영향을 실험합니다.",
    Content: Parallel,
  },
  {
    id: "memory",
    bookId: "computer",
    readId: "memory",
    number: "02",
    title: "메모리와 데이터 이동",
    heading: "계산보다 옮기는 게 오래 걸린다면?",
    description: "데이터 크기와 대역폭을 바꾸며 전송 시간을 비교합니다.",
    Content: Memory,
  },
  {
    id: "packets",
    bookId: "network",
    readId: "network/packets",
    number: "01",
    title: "연결과 패킷",
    heading: "사진 한 장은 어떻게 건너갈까?",
    description: "연결·클라이언트·서버·패킷의 의미부터 시작합니다.",
    Content: Packets,
  },
  {
    id: "addressing",
    bookId: "network",
    readId: "network/addressing",
    number: "02",
    title: "IP와 같은 네트워크",
    heading: "옆자리 PC에도 출구가 필요할까?",
    description: "주소와 네트워크 범위를 읽고 직접 전달과 출구를 비교합니다.",
    Content: Addressing,
  },
  {
    id: "routing",
    bookId: "network",
    readId: "network/routing",
    number: "03",
    title: "라우터·게이트웨이·NAT",
    heading: "다른 망으로 가고, 다시 돌아오기",
    description: "다음 홉과 주소 변환을 나누어 보고 왕복 경로를 따라갑니다.",
    Content: Routing,
  },
];
export const books = [
  {
    id: "computer",
    title: "컴퓨터의 작동 원리",
    category: "컴퓨터 · 하드웨어",
    cover: "COMPUTER SCIENCE",
    description:
      "CPU와 GPU는 어떻게 다를까? 계산과 데이터 이동을 작은 실험으로 이해합니다.",
    overview: "계산을 나누고 데이터를 옮기는 원리부터 살펴봅니다.",
    future: "",
  },
  {
    id: "network",
    title: "웹 개발자를 위한 네트워크",
    category: "네트워크 · 기초부터 운영까지",
    cover: "NETWORK FUNDAMENTALS",
    description:
      "요청이 지나가는 길을 이해하고 고치기. 패킷과 주소부터 한 단계씩 배웁니다.",
    overview:
      "웹앱을 만들고 서버를 운영하다가 막혔던 네트워크를 기초부터 이해하는 책입니다. 먼저 쉽게 읽고, 필요한 곳에서 예측하고 조작한 뒤, 내 상황에 적용합니다.",
    future:
      "현재 01~03장 공개 · 다음 배치: 포트와 연결 → 이름과 DNS → TCP와 전송 성능. 웹·TLS·Docker·k3s는 이후에 이어집니다.",
  },
];
export const chapterHref = (c: Chapter) => `#/${c.bookId}/${c.id}`;

import MoneyCredit from "./content/money/Credit.mdx";
import MoneySavings from "./content/money/Savings.mdx";
import MoneyInterest from "./content/money/Interest.mdx";
import MoneyInflation from "./content/money/Inflation.mdx";
import MoneyIntro from "./content/money/Intro.mdx";
import MoneyMap from "./content/money/Map.mdx";
import MoneyFlows from "./content/money/Flows.mdx";
import MoneyBudget from "./content/money/Budget.mdx";
import Parallel from "./content/computer/Parallel";
import Memory from "./content/computer/Memory";
import Packets from "./content/network/Packets.mdx";
import Addressing from "./content/network/Addressing.mdx";
import Routing from "./content/network/Routing.mdx";
import Ports from "./content/network/Ports.mdx";
import Dns from "./content/network/Dns.mdx";
import Transport from "./content/network/Transport.mdx";
import Http from "./content/network/Http.mdx";
import Tls from "./content/network/Tls.mdx";
import Verify from "./content/network/Verify.mdx";
import Proxy from "./content/network/Proxy.mdx";
import Docker from "./content/network/Docker.mdx";
import Browser from "./content/network/Browser.mdx";
import ClusterInternal from "./content/network/ClusterInternal.mdx";
import ClusterExternal from "./content/network/ClusterExternal.mdx";
import Diagnosis from "./content/network/Diagnosis.mdx";
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
  {
    id: "ports",
    bookId: "network",
    readId: "network/ports",
    number: "04",
    title: "포트와 연결",
    heading: "같은 서버에서 앱을 어떻게 찾을까?",
    description: "관측 위치를 바꾸며 bind·listen·방화벽을 구분합니다.",
    Content: Ports,
  },
  {
    id: "dns",
    bookId: "network",
    readId: "network/dns",
    number: "05",
    title: "이름과 DNS",
    heading: "이름을 찾았으면 연결도 될까?",
    description: "주소 조회와 캐시, 앱 접속을 분리해서 관찰합니다.",
    Content: Dns,
  },
  {
    id: "transport",
    bookId: "network",
    readId: "network/transport",
    number: "06",
    title: "TCP와 전송 성능",
    heading: "누락을 고치고, 기다림을 이해하기",
    description: "ACK·재전송과 지연·대역폭의 차이를 실험합니다.",
    Content: Transport,
  },
  {
    id: "http",
    bookId: "network",
    readId: "network/http",
    number: "07",
    title: "HTTP 요청의 여행",
    heading: "주소창에서 응답까지, 어디까지 왔을까?",
    description: "URL·메서드·Host·상태 코드를 읽고 요청의 길을 추적합니다.",
    Content: Http,
  },
  {
    id: "tls",
    bookId: "network",
    readId: "network/tls",
    number: "08",
    title: "HTTPS·TLS·인증서",
    heading: "fullchain은 인증서를 합친 것일까?",
    description: "서버 인증서 묶음과 클라이언트의 신뢰 목록을 구분합니다.",
    Content: Tls,
  },
  {
    id: "verify",
    bookId: "network",
    readId: "network/verify",
    number: "09",
    title: "verify 오류 진단",
    heading: "왜 브라우저에서는 되고 Python에서는 실패할까?",
    description: "이름·시간·체인·신뢰를 나누어 실패한 환경에서 확인합니다.",
    Content: Verify,
  },
  {
    id: "proxy",
    bookId: "network",
    readId: "network/proxy",
    number: "10",
    title: "리버스 프록시",
    heading: "같은 443으로 여러 앱을 연결하려면?",
    description: "도메인·경로 분기와 구간별 TLS, upstream 오류를 구분합니다.",
    Content: Proxy,
  },
  {
    id: "docker",
    bookId: "network",
    readId: "network/docker",
    number: "11",
    title: "VM·Docker 네트워크",
    heading: "이 localhost는 누구 자신일까?",
    description:
      "프록시 위치에 따라 listen·publish·방화벽을 나누어 판단합니다.",
    Content: Docker,
  },
  {
    id: "browser",
    bookId: "network",
    readId: "network/browser",
    number: "12",
    title: "브라우저만 실패",
    heading: "요청은 갔는데 왜 응답을 못 읽을까?",
    description: "origin·CORS·preflight·mixed content를 구분합니다.",
    Content: Browser,
  },
  {
    id: "cluster-internal",
    bookId: "network",
    readId: "network/cluster-internal",
    number: "13",
    title: "k3s 내부 연결",
    heading: "Pod가 바뀌어도 같은 이름으로 찾으려면?",
    description: "Pod·Service·port·targetPort만 짧게 연결합니다.",
    Content: ClusterInternal,
  },
  {
    id: "cluster-external",
    bookId: "network",
    readId: "network/cluster-external",
    number: "14",
    title: "k3s 외부 연결",
    heading: "외부 443은 누가 맡을까?",
    description: "Ingress 규칙과 controller, 기존 프록시의 역할을 구분합니다.",
    Content: ClusterExternal,
  },
  {
    id: "diagnosis",
    bookId: "network",
    readId: "network/diagnosis",
    number: "15",
    title: "증거로 고치기",
    heading: "어디까지 확인했는가?",
    description: "네 가지 짧은 사례에서 다음 확인 위치를 고릅니다.",
    Content: Diagnosis,
  },
  {
    id: "map",
    bookId: "money",
    readId: "money/map",
    number: "01",
    title: "우리 집 돈의 지도",
    heading: "우리 집 돈은 어디에 있을까?",
    description:
      "자산·부채·순자산을 그림으로 연결하고 빌린 돈의 의미를 살펴봅니다.",
    Content: MoneyMap,
  },
  {
    id: "flows",
    bookId: "money",
    readId: "money/flows",
    number: "02",
    title: "들어오고 나가는 돈",
    heading: "같은 출금, 다른 이야기",
    description:
      "이체·카드 구매와 결제·대출 원금과 이자를 단계별로 따라갑니다.",
    Content: MoneyFlows,
  },
  {
    id: "budget",
    bookId: "money",
    readId: "money/budget",
    number: "03",
    title: "예산과 목적별 돈",
    heading: "필요한 그날, 돈이 있을까?",
    description:
      "달력과 잔액 그래프를 연결해 비정기 지출과 목적 적립을 실험합니다.",
    Content: MoneyBudget,
  },
  {
    id: "inflation",
    bookId: "money",
    readId: "money/inflation",
    number: "04",
    title: "물가와 구매력",
    heading: "잔액은 늘었는데 살 수 있는 것은 줄어들 수 있을까?",
    description:
      "장바구니 가격과 구매량을 연결해 명목 잔액과 실질 구매력을 비교합니다.",
    Content: MoneyInflation,
  },
  {
    id: "interest",
    bookId: "money",
    readId: "money/interest",
    number: "05",
    title: "이자와 복리",
    heading: "같은 돈, 같은 기간인데 결과는 왜 다를까?",
    description:
      "이자의 재투자와 납입·비용을 단계별로 따라가며 단리와 복리를 비교합니다.",
    Content: MoneyInterest,
  },
  {
    id: "savings",
    bookId: "money",
    readId: "money/savings",
    number: "06",
    title: "저축과 목표의 시간",
    heading: "목표액은 채웠는데 그날 꺼낼 수 없다면?",
    description:
      "목표일과 사용 가능 시점을 타임라인에서 맞추며 금액 부족과 날짜 차이를 구분합니다.",
    Content: MoneySavings,
  },
  {
    id: "credit",
    bookId: "money",
    readId: "money/credit",
    number: "07",
    title: "신용과 대출",
    heading: "빌릴 수 있는 돈과 감당할 돈은 같을까?",
    description:
      "월수입의 배분과 금리·수입 변화에서 납입 뒤 현금과 남길 여유를 비교합니다.",
    Content: MoneyCredit,
  },
];
export const bookCategories = [
  { id: "technology", label: "IT·기술" },
  { id: "money", label: "돈·경제" },
] as const;
export type BookCategory = (typeof bookCategories)[number]["id"];

type Book = {
  categoryId: BookCategory;
  id: string;
  title: string;
  category: string;
  cover: string;
  description: string;
  overview: string;
  future: string;
  Intro?: ComponentType;
};
export const books: Book[] = [
  {
    id: "computer",
    categoryId: "technology",
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
    categoryId: "technology",
    title: "웹 개발자를 위한 네트워크",
    category: "네트워크 · 기초부터 운영까지",
    cover: "NETWORK FUNDAMENTALS",
    description:
      "요청이 지나가는 길을 이해하고 고치기. 패킷과 주소부터 한 단계씩 배웁니다.",
    overview:
      "웹앱을 만들고 서버를 운영하다가 막혔던 네트워크를 기초부터 이해하는 책입니다. 먼저 쉽게 읽고, 필요한 곳에서 예측하고 조작한 뒤, 내 상황에 적용합니다.",
    future:
      "01~15장 공개 · k3s는 네트워크 개념을 연결하는 짧은 입문입니다. 본격적인 클러스터 구축·운영은 별도 쿠버네티스 교재에서 다룹니다.",
  },
  {
    id: "money",
    categoryId: "money",
    title: "돈의 기초와 우리 집 재무",
    category: "돈 · 생활 재무",
    cover: "MONEY & EVERYDAY LIFE",
    description:
      "돈의 지도, 거래의 순간, 지출의 달력. 보고 움직이며 우리 집 재무의 원리를 이해합니다.",
    overview:
      "가상의 가정과 함께 자산·부채·현금흐름을 연결합니다. 그림을 보고 예측한 다음 직접 조건을 바꿔 보세요.",
    future:
      "01~07장 공개 · 상환 방식 비교·투자와 다른 금융 분야는 후속 배치에서 다룹니다.",
    Intro: MoneyIntro,
  },
];
export const chapterHref = (c: Chapter) => `#/${c.bookId}/${c.id}`;

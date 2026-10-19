import BusinessCycles from "./content/economics/BusinessCycles.mdx";
import ReadingNews from "./content/economics/ReadingNews.mdx";
import Trade from "./content/economics/Trade.mdx";
import FiscalPolicy from "./content/economics/FiscalPolicy.mdx";
import MonetaryPolicy from "./content/economics/MonetaryPolicy.mdx";
import ExchangeRates from "./content/economics/ExchangeRates.mdx";
import Prices from "./content/economics/Prices.mdx";
import InterestRates from "./content/economics/InterestRates.mdx";
import Helm from "./content/kubernetes/Helm.mdx";
import Troubleshooting from "./content/kubernetes/Troubleshooting.mdx";
import OutputGrowth from "./content/economics/OutputGrowth.mdx";
import Jobs from "./content/economics/Jobs.mdx";
import EconomicsIntro from "./content/economics/Intro.mdx";
import CircularFlow from "./content/economics/CircularFlow.mdx";
import SupplyDemand from "./content/economics/SupplyDemand.mdx";
import HealthChecks from "./content/kubernetes/HealthChecks.mdx";
import Rollout from "./content/kubernetes/Rollout.mdx";
import Storage from "./content/kubernetes/Storage.mdx";
import Resources from "./content/kubernetes/Resources.mdx";
import IngressTls from "./content/kubernetes/IngressTls.mdx";
import Configuration from "./content/kubernetes/Configuration.mdx";
import MoneyPlan from "./content/money/Plan.mdx";
import MoneyRisk from "./content/money/Risk.mdx";
import DesiredState from "./content/kubernetes/DesiredState.mdx";
import ServiceDiscovery from "./content/kubernetes/ServiceDiscovery.mdx";
import KubernetesIntro from "./content/kubernetes/Intro.mdx";
import WhyKubernetes from "./content/kubernetes/WhyKubernetes.mdx";
import ClusterMap from "./content/kubernetes/ClusterMap.mdx";
import MoneyRepayment from "./content/money/Repayment.mdx";
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
  { id: "circular-flow", bookId: "economics", readId: "economics/circular-flow", number: "01", title: "경제는 서로 연결된 흐름", heading: "내가 쓴 돈은 누구의 소득이 되고, 무엇과 맞바뀔까?", description: "노동·임금·소비·판매의 방향과 흐름·잔액을 나눠 봅니다.", Content: CircularFlow },
  { id: "supply-demand", bookId: "economics", readId: "economics/supply-demand", number: "02", title: "수요·공급과 가격", heading: "가격이 올랐다는 사실만으로 원인을 알 수 있을까?", description: "곡선 위 이동과 곡선 이동, 같은 가격 상승의 다른 수량을 비교합니다.", Content: SupplyDemand },
  { id: "output-growth", bookId: "economics", readId: "economics/output-growth", number: "03", title: "GDP와 성장률", heading: "돈으로 잰 생산이 늘면 실제 생산도 늘었을까?", description: "최종재·부가가치와 명목·실질 성장률을 같은 생산표로 비교합니다.", Content: OutputGrowth },
  { id: "jobs", bookId: "economics", readId: "economics/jobs", number: "04", title: "고용과 실업", heading: "실업률이 낮아지면 일자리가 늘었을까?", description: "인구의 분류 이동과 실업률·고용률의 분모를 비교합니다.", Content: Jobs },
  { id: "prices", bookId: "economics", readId: "economics/prices", number: "05", title: "물가와 인플레이션", heading: "상승률이 낮아지면 가격도 내려갈까?", description: "고정 바구니·비교 기간·기저효과로 가격 수준과 상승률을 구분합니다.", Content: Prices },
  { id: "interest-rates", bookId: "economics", readId: "economics/interest-rates", number: "06", title: "여러 금리와 실질금리", heading: "기준금리와 내 대출금리는 왜 다를까?", description: "금리의 연결과 기대·실현 물가에 따른 정확 실질금리를 비교합니다.", Content: InterestRates },
  { id: "monetary-policy", bookId: "economics", readId: "economics/monetary-policy", number: "07", title: "통화정책의 전달 경로", heading: "금리를 바꾸면 언제 누구에게 전달될까?", description: "다섯 경로와 계약별 시차·현금 방향을 비교합니다.", Content: MonetaryPolicy },
  { id: "exchange-rates", bookId: "economics", readId: "economics/exchange-rates", number: "08", title: "환율과 생활", heading: "원/달러 환율이 오르면 누구에게 어떤 변화가 생길까?", description: "같은 환율로 대금·원가·부채와 가격 전가를 나란히 봅니다.", Content: ExchangeRates },
  { id: "trade", bookId: "economics", readId: "economics/trade", number: "09", title: "무역과 국제 거래", heading: "수출이 늘면 모두의 소득이 늘까?", description: "수출 속 부가가치·대외 수지와 비교우위의 교환 조건을 구분합니다.", Content: Trade },
  { id: "fiscal-policy", bookId: "economics", readId: "economics/fiscal-policy", number: "10", title: "정부의 지출과 재정", heading: "정부 지출과 세금은 어떻게 전달될까?", description: "세금·이전·구매 흐름과 기간 수지·채무 잔액·집행 시차를 봅니다.", Content: FiscalPolicy },
  { id: "business-cycles", bookId: "economics", readId: "economics/business-cycles", number: "11", title: "경기 변동과 엇갈리는 지표", heading: "경제는 좋아지는데 왜 내 체감은 다를까?", description: "수준·증가율·시차·부문 차이와 잠재생산 추정을 구분합니다.", Content: BusinessCycles },
  { id: "reading-news", bookId: "economics", readId: "economics/reading-news", number: "12", title: "경제 뉴스 함께 읽기", heading: "한 기사에서 무엇을 더 확인해야 할까?", description: "세 가상 뉴스의 관측·가정·해석·전망과 확인 자료를 나눕니다.", Content: ReadingNews },
  {
    id: "why-kubernetes",
    bookId: "kubernetes",
    readId: "kubernetes/why-kubernetes",
    number: "01",
    title: "컨테이너 다음에 필요한 것",
    heading: "앱이 늘면 어떤 운영 일이 생길까?",
    description: "실행·복구·업데이트 책임과 단일 VM의 한계를 비교합니다.",
    Content: WhyKubernetes,
  },
  {
    id: "cluster-map",
    bookId: "kubernetes",
    readId: "kubernetes/cluster-map",
    number: "02",
    title: "클러스터의 지도",
    heading: "명령은 누가 받고 앱은 누가 실행할까?",
    description: "제어 경로와 HTTP 경로, context·namespace·권한을 구분합니다.",
    Content: ClusterMap,
  },
  { id: "desired-state", bookId: "kubernetes", readId: "kubernetes/desired-state", number: "03", title: "원하는 상태와 Pod", heading: "하나를 지웠는데 왜 다시 생길까?", description: "소유 관계·UID·개수를 따라 컨테이너 재시작과 Pod 교체를 비교합니다.", Content: DesiredState },
  { id: "service-discovery", bookId: "kubernetes", readId: "kubernetes/service-discovery", number: "04", title: "바뀌는 Pod와 고정된 입구", heading: "새 Pod를 어떻게 찾을까?", description: "selector·ready 대상·포트·DNS를 연결해 새 연결의 경로를 찾습니다.", Content: ServiceDiscovery },
  { id: "ingress-tls", bookId: "kubernetes", readId: "kubernetes/ingress-tls", number: "05", title: "외부 요청과 TLS", heading: "내 도메인은 어디로 들어올까?", description: "외부 입구·host/path·TLS 종료와 기존 NGINX의 공존을 따라갑니다.", Content: IngressTls },
  { id: "configuration", bookId: "kubernetes", readId: "kubernetes/configuration", number: "06", title: "설정과 비밀정보", heading: "이미지를 다시 만들지 않고 바꿀 수 있을까?", description: "환경변수·파일 갱신·앱 재읽기와 Secret의 보호 조건을 비교합니다.", Content: Configuration },
  { id: "storage", bookId: "kubernetes", readId: "kubernetes/storage", number: "07", title: "Pod가 바뀌어도 남을 것", heading: "파일은 어디에 살까?", description: "저장 수명·PVC/PV·노드 디스크와 백업의 경계를 비교합니다.", Content: Storage },
  { id: "resources", bookId: "kubernetes", readId: "kubernetes/resources", number: "08", title: "자원이 모자랄 때", heading: "빈 CPU가 보여도 왜 Pending일까?", description: "requests·실사용량·limits·quota를 나눠 배치와 실행을 관찰합니다.", Content: Resources },


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
  {
    id: "repayment",
    bookId: "money",
    readId: "money/repayment",
    number: "08",
    title: "대출을 갚는 구조",
    heading: "같은 대출, 매달 갚는 모습은 왜 다를까?",
    description:
      "원금·이자를 나누고 세 상환 방식의 월 부담과 전체 일정을 비교합니다.",
    Content: MoneyRepayment,
  },
  {
    id: "risk",
    bookId: "money",
    readId: "money/risk",
    number: "09",
    title: "투자와 위험 대비",
    heading: "돈을 불리는 일과 충격을 견디는 일은 어떻게 다를까?",
    description:
      "집중·분산의 전후와 비상자금·보험의 지출 충당 과정을 비교합니다.",
    Content: MoneyRisk,
  },
  {
    id: "plan",
    bookId: "money",
    readId: "money/plan",
    number: "10",
    title: "우리 집 계획을 연결하기",
    heading: "지금의 선택이 미래의 현금흐름을 어떻게 바꿀까?",
    description: "소득·지출·대출·목표를 연결하고 24개월의 세 경로를 비교합니다.",
    Content: MoneyPlan,
  },
  { id: "health-checks", bookId: "kubernetes", readId: "kubernetes/health-checks", number: "09", title: "살아 있음과 준비됨", heading: "언제 요청을 보내고 다시 시작할까?", description: "시작·생존·준비 검사와 요청 대상·컨테이너 재시작을 구분합니다.", Content: HealthChecks },
  { id: "rollout", bookId: "kubernetes", readId: "kubernetes/rollout", number: "10", title: "교체하면서 배포하기", heading: "새 버전이 준비되지 않으면?", description: "두 ReplicaSet의 교체·자원 부족·준비 실패·명시적 되돌리기를 관찰합니다.", Content: Rollout },
  { id: "helm", bookId: "kubernetes", readId: "kubernetes/helm", number: "11", title: "반복 배포를 묶기", heading: "같은 앱의 설정만 바꾸려면?", description: "chart·values·렌더링·release와 두 revision의 경계를 비교합니다.", Content: Helm },
  { id: "troubleshooting", bookId: "kubernetes", readId: "kubernetes/troubleshooting", number: "12", title: "증거로 고치기", heading: "어디에서 멈췄는가?", description: "증거 카드와 다음 관측을 선택해 실패 구간과 가설을 좁힙니다.", Content: Troubleshooting },
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
  { id: "economics", categoryId: "money", title: "경제 뉴스를 읽는 원리", category: "돈·경제 · 뉴스의 숫자와 조건", cover: "READING THE ECONOMY", description: "같은 가격 상승, 다른 이유. 거래의 흐름과 지표의 조건을 보고 경제 뉴스를 읽습니다.", overview: "금리·물가·환율·경기는 어떻게 연결될까요? 가상 시장을 조작하며 숫자가 말하는 것과 말하지 않는 것을 구분합니다.", future: "소개·01–12장 공개 · 가상 실험으로 경제 뉴스의 원리와 해석 조건을 익힙니다.", Intro: EconomicsIntro },
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
    future: "01~10장 공개 · 경제·투자 등 다른 금융 분야는 후속 교과서에서 다룹니다.",
    Intro: MoneyIntro,
  },
  {
    id: "kubernetes",
    categoryId: "technology",
    title: "웹앱 운영자를 위한 쿠버네티스",
    category: "쿠버네티스 · 실행부터 운영까지",
    cover: "KUBERNETES",
    description:
      "앱은 누가 실행하고, 멈추면 누가 고칠까? 운영의 역할과 경계를 직접 살펴봅니다.",
    overview:
      "작은 웹앱의 실행·연결·설정·데이터를 눈으로 이해하는 쿠버네티스 입문입니다.",
    future:
      "소개·01–12장과 선택 실습 부록 공개 · 실제 클러스터 배포·복원은 실행 미검증입니다.",
    Intro: KubernetesIntro,
  },
];
export const chapterHref = (c: Chapter) => `#/${c.bookId}/${c.id}`;

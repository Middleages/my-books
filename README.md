# my books

직접 실험하며 배우는 개인 인터랙티브 교과서.

React + TypeScript + Vite 기반의 GitHub Pages 정적 웹사이트입니다. 로그인이나 서버 없이 실행되며 읽음 기록은 현재 브라우저의 localStorage에 저장됩니다.

## 작성·개발 지침

새 작업은 루트 [AGENTS.md](AGENTS.md)의 전역 지침과
[콘텐츠 작성 기준](docs/CONTENT-AUTHORING.md), 해당 교과서의 계획·구현 상태를 먼저 확인합니다.
전역 지침은 모든 교과서와 관련 계획·검증 문서에 적용합니다.

## 개발

Node.js 22 이상에서:

```sh
npm ci
npm run dev
npm test
npm run build
```

## 배포

GitHub Settings → Pages → Source를 **GitHub Actions**로 설정합니다. main push 시 테스트와 빌드 후 자동 배포됩니다. PR에서는 빌드만 실행합니다.

배포 주소: https://middleages.github.io/my-books/

프로젝트 하위 경로는 vite.config.ts의 base에서 설정합니다. 해시 라우팅을 사용하므로 챕터 링크를 직접 열거나 새로고침해도 Pages의 404 문제를 피합니다.

## 콘텐츠 구성

- `src/catalog.ts`: bookId/chapterId 기반 책·챕터 목록과 본문 연결
- `src/main.tsx`: 책장·책 소개·읽기 화면
- `src/content/computer/`: 기존 컴퓨터 교과서 2장
- `src/content/network/`: 연결과 패킷 / IP와 같은 네트워크 / 라우터·게이트웨이·NAT / 포트와 연결 / 이름과 DNS / TCP와 전송 성능
- `src/components/network/RouteLab.tsx`: 예측 → 한 단계 진행 → 증거 확인
- `src/simulations/network/`: UI와 분리한 IPv4 경로·NAT 교육 모델과 사례
- `src/components/network/FoundationLabs.tsx`: 포트·DNS·TCP 손실 실험과 전송 시간 계산
- `src/simulations/network/foundations.mjs`: 리스너·캐시 TTL·누적 ACK·전송 시간 판정
- `src/reading.mjs`: 기존 localStorage 키와 컴퓨터 읽음 ID 유지
- `src/Labs.tsx`, `src/models.mjs`: 기존 컴퓨터 실험·계산 모델
- `tests/`: 기존 계산, 서브넷 경계, 로컬/원격 경로, NAT 왕복, 읽음 데이터 호환 검증

기존 `#/computer/parallel`, `#/computer/memory` 링크는 그대로 동작합니다.
책 소개는 `#/computer`, `#/network`, 새 장은 `#/network/packets`,
`#/network/addressing`, `#/network/routing`, `#/network/ports`,
`#/network/dns`, `#/network/transport`입니다. 읽음 기록의 저장 키
`my-books:read:v1`과 기존 `parallel`, `memory` 값은 유지하며 네트워크 장은
`network/packets`처럼 책 이름을 포함합니다. 알 수 없는 기존 문자열도 버리지 않습니다.

네트워크 실험은 실제 요청을 보내지 않는 고정 IPv4 교육 모델입니다. 같은 LAN의
전달, 두 사설망 간 라우팅, 인터넷 출구 NAPT의 왕복, 존재하지 않는 게이트웨이를
비교합니다. 실제 라우팅·방화벽·TCP 엔진이 아니며 가정과 한계를 본문에 표시합니다.

현재 네트워크 01~15장을 공개합니다. 13~14는 짧은 k3s 연결 설명이며 15는 종합 복습입니다.
본격적인 쿠버네티스 설치·Helm·클러스터 운영은 별도 교재에서 다룹니다. 전체 계획은
[NETWORK-TEXTBOOK-PLAN.md](docs/NETWORK-TEXTBOOK-PLAN.md)를 참고하세요.

## 본문 작성 방식

이후 신규 본문은 **MDX**, 실험 UI와 동작은 React/TypeScript로 작성합니다.
기존 04장은 `Ports.mdx`로 시범 전환했고 주소와 읽음 ID는 유지했습니다.
기존 TSX는 대규모 개정 시 점진적으로 전환합니다.
[콘텐츠 작성 기준](docs/CONTENT-AUTHORING.md)을 먼저 읽어 주세요.

07~09 링크: `#/network/http`, `#/network/tls`, `#/network/verify`.
`WebLabs.tsx`는 요청 추적과 fullchain/클라이언트 신뢰 목록 실험을 제공하고,
`simulations/network/web.mjs`는 제한된 교육 모델을 구현합니다. 실제 인증서나 개인키를
입력받거나 TLS 검증을 수행하지 않습니다.

10~12 링크: `#/network/proxy`, `#/network/docker`, `#/network/browser`.
본문은 각각 `Proxy.mdx`, `Docker.mdx`, `Browser.mdx`이며, `OperationsLabs.tsx`와
`simulations/network/operations.mjs`로 분기·연결·브라우저 정책 실험을 분리합니다.
실제 Docker 명령이나 fetch를 실행하지 않는 교육용 시뮬레이션입니다.

13~15 링크: `#/network/cluster-internal`, `#/network/cluster-external`,
`#/network/diagnosis`. `ServiceLab.tsx`와 `simulations/network/cluster.mjs`는
단일 Service의 대상 선택·포트·Pod 교체 후 새 연결만 보여 줍니다.

## 다음 콘텐츠 계획

[돈·경제 교과서 시리즈 제작 계획](docs/MONEY-TEXTBOOK-PLAN.md)에 기본 6권과
회계·확률/의사결정 추가 주제, 첫 권 ‘돈의 기초와 우리 집 재무’의 목차와 배치를 정리했습니다.
소개와 01~10장을 구현했습니다. 첫 권 전체 편집 점검을 완료했으며 다른 권은 후속 배치입니다.

신규 콘텐츠는 인터랙티브 시뮬레이션·설명용 애니메이션·그림을 적극적으로 활용합니다.
핵심 개념의 구조·과정·조건 비교를 시각화하며, 모바일·키보드·정적 단계 대안을 함께 제공합니다.


## 돈 교과서 · 현재 공개 범위

- 소개: `#/money`
- 01 우리 집 돈의 지도: `#/money/map`
- 02 들어오고 나가는 돈: `#/money/flows`
- 03 예산과 목적별 돈: `#/money/budget`
- 04 물가와 구매력: `#/money/inflation`
- 05 이자와 복리: `#/money/interest`
- 06 저축과 목표의 시간: `#/money/savings`
- 07 신용과 대출: `#/money/credit`
- 08 대출을 갚는 구조: `#/money/repayment`
- 09 투자와 위험 대비: `#/money/risk`
- 10 우리 집 계획을 연결하기: `#/money/plan`

`src/content/money/*.mdx`에 본문, `src/components/money/`에 React 실험,
`src/simulations/money/`에 UI 독립 거래·일별 예산 모델이 있습니다.
01~03 금액은 정수 만원, 04~08은 원이며 모두 가상 사례입니다. 원금·이체는 소비로 세지 않고 카드 소비는 구매 때 한 번만 기록합니다.
모든 프레임은 최초 상태에서 계산하여 다시 보기나 단계 이동으로 중복 거래가 생기지 않습니다.

모바일에서는 선택 월의 일별 그래프와 세로 패널을 사용합니다. 재생·정지·단계 진행·초기화,
키보드와 reduced-motion 정적 전환을 지원합니다. 읽음 ID는 `money/map` 등이며 기존 키·ID는 유지합니다.
예산의 음수는 실행된 대출이 아닌 미충당 금액입니다. 공식 근거와 생략 조건은 각 장에 표시했습니다.

04장은 `inflation.mjs`의 연말 프레임으로 가격표·장바구니 수·명목/실질 그래프를 연결합니다.
정확한 비율식과 뺄셈 근사를 구분하며, 고정 수량 가상 장바구니는 공식 CPI 재현이 아닙니다.

05장은 `interest.mjs`의 월별 관찰 프레임으로 단리·복리·비용 없는 복리를 비교합니다.
납입 → 계산 기준 → 수익·손실 → 가상 비용 → 월말·재투자를 단계별로 읽고,
원금·추가 납입·누적 수익·비용의 구성 막대와 월말 그래프·표를 함께 봅니다.
명목연율/유효연율, 월초/월말 납입, 가상 세금·비율/고정 수수료의 적용 시점을 구분합니다.
상세 검증과 남은 범위는 [MONEY-05-VERIFICATION.md](docs/MONEY-05-VERIFICATION.md)를 참고하세요.

06장은 `savings.mjs`의 원 단위·0수익률 모델로 목표일과 사용 가능 시점을 연결합니다.
월초 풀림 → 월말 적립 → 목표 지출 순서, 총액/사용 가능액/묶인 돈의 구성,
목표일 직전 판정과 지출 직후 잔액, 이후에도 유지되는 목표일 기록을 구분합니다.
단일 가상 목표이며 실제 금융상품·개인 금융정보와 연결하지 않습니다.
검증은 [MONEY-06-VERIFICATION.md](docs/MONEY-06-VERIFICATION.md)를 참고하세요.

07장은 `credit.mjs`의 가상 원금균등 조건으로 월수입 → 생활비·기존 납입 →
새 원금·이자 → 남기려는 현금의 관계를 비교합니다. 금리·수입 변화의 앞뒤를
같은 눈금의 구성 막대·월별 추가 여유 그래프·표로 읽습니다. 예비여유 부족과
월수입 자체의 부족을 구분하며, 실제 승인·한도·연체·상환 실행을 계산하지 않습니다.
검증은 [MONEY-07-VERIFICATION.md](docs/MONEY-07-VERIFICATION.md)를 참고하세요.

08장은 `repayment.mjs`의 같은 원금·고정 명목연율·월말 납입 조건으로 원금균등·원리금균등·
만기일시상환의 전체 일정을 비교합니다. 월초 잔액 → 이자 계산 → 원리금 납입 → 남은 원금의
관찰 단계, 원금·이자 구성, 누적 납입·이자, 전체 그래프·표는 같은 모델을 읽습니다.
검증은 [MONEY-08-VERIFICATION.md](docs/MONEY-08-VERIFICATION.md)를 참고하세요.


## 쿠버네티스 교재 · 소개와 01–12

‘웹앱 운영자를 위한 쿠버네티스’는 소개와 01–12장을 구현했습니다.
`#/kubernetes`에서 실행·연결·TLS·설정·저장·자원·상태 검사·롤아웃을 연결하고,
`#/kubernetes/helm`과 `#/kubernetes/troubleshooting`에서 배포 묶음과 증거 기반 진단을 비교합니다.

본문은 `src/content/kubernetes/`, UI는 `src/components/kubernetes/`, 제한된 교육 모델은
`src/simulations/kubernetes/`에 있습니다. 실제 서버·클러스터에 접속하지 않습니다.
[교재 계획](docs/KUBERNETES-TEXTBOOK-PLAN.md),
[실습환경 후보 계약](docs/KUBERNETES-LAB-ENVIRONMENT.md),
[최신 배치 검증·배포 및 미검증 기록](docs/KUBERNETES-BATCH-F-VERIFICATION.md)을 확인하세요.
설치·복구·폐쇄망 선택 실습 부록은 후속 배치 G입니다.

09장은 집중·분산의 전후와 같은 충격에서 비상 현금·보험의 지출 충당 과정을 비교합니다.
보험료·자기부담금·한도·제외·지급 지연을 분리하며 실제 상품 추천은 하지 않습니다.
검증 기록: [MONEY-09-VERIFICATION](docs/MONEY-09-VERIFICATION.md).

10장은 소득·생활비·예정 상환·목표 적립을 24개월의 세 경로로 연결합니다.
검증: [MONEY-10-VERIFICATION](docs/MONEY-10-VERIFICATION.md).
책 전체 점검 결과: [MONEY-BOOK-REVIEW](docs/MONEY-BOOK-REVIEW.md). 당시 작업 지시: [MONEY-REVIEW-SESSION](docs/MONEY-REVIEW-SESSION.md).

## 쿠버네티스 선택 실습 부록

소개·01–12와 [환경과 첫 배포](https://middleages.github.io/my-books/#/kubernetes/lab-first-deployment)·[운영과 복구](https://middleages.github.io/my-books/#/kubernetes/lab-recovery)·[폐쇄망과 공존](https://middleages.github.io/my-books/#/kubernetes/lab-airgap)을 제공한다. [최소 앱·manifest·chart](examples/kubernetes/README.md)는 직접 빌드한 로컬 이미지 경로를 사용한다. YAML 검사·Helm 로컬 렌더와 실제 클러스터 설치/복원 성공은 다르며, 후자는 미실행이다. [G 검증 기록](docs/KUBERNETES-BATCH-G-VERIFICATION.md)을 참조한다.


## 보험과 위험 대비 · 4권

[제작 계획](docs/INSURANCE-TEXTBOOK-PLAN.md)과 [배치별 실행 프롬프트](docs/INSURANCE-SESSION-PROMPTS.md)를 따라 소개·01–10을 `insurance`에 구현했다. 기대손실·공동 재원·계약 역할·지급 조건·중복 보장·납입과 보장·해약환급·청구 시차·설명서 읽기를 자체 가상 사례로 연결한다. 실제 보험료·개인 적정 보장액·상품 추천·건강정보 입력을 제공하지 않는다. A–C의 검증·게시 증거는 [A](docs/INSURANCE-BATCH-A-VERIFICATION.md)·[B](docs/INSURANCE-BATCH-B-VERIFICATION.md)·[C](docs/INSURANCE-BATCH-C-VERIFICATION.md), D의 첫 화면 결함과 수정 재검증은 [D 기록](docs/INSURANCE-BATCH-D-VERIFICATION.md), E 구현·전체 점검과 실제 게시 상태는 [E 기록](docs/INSURANCE-BATCH-E-VERIFICATION.md)과 [전체 점검](docs/INSURANCE-BOOK-REVIEW.md)에서 구분한다.


## 세금의 구조와 생활 · 5권

현재 소개와 01–04장을 등록했습니다. 과세 사건·계산의 바탕·현금 시점·확인 조건을 설명합니다.
금액·세율·정산월은 교육용 가정이며 실제 신고·개인별 세액 계산이나 절세 추천을 하지 않습니다.
전체 계획은 12장이고 A–F마다 검증 후 순차 공개합니다.
[계획](docs/TAX-TEXTBOOK-PLAN.md) · [배치 B 검증](docs/TAX-BATCH-B-VERIFICATION.md)


## 웹앱 개발자를 위한 데이터베이스 · IT 4권

소개와 01–02를 등록했습니다. 작은 가상 상점의 같은 데이터를 사용해 파일의 사본·공유 저장소,
표 사이의 키 관계와 저장 제약을 직접 관찰합니다. 전체 계획은 소개·12장이며 A–F로 두 장씩,
G에서 전체 편집·선택 실습 묶음을 점검합니다. 아직 구현하지 않은 장은 공개 목차에 넣지 않습니다.

브라우저 실험은 PostgreSQL 18 공식 문서를 바탕으로 한 결정적 교육 모델이며 실제 DB 실행이 아닙니다.
실제 SQL·서버 설치·백업/복원은 미실행이고, MSSQL 차이는 해당 장에서 짧게 분리합니다.
[계획](docs/DATABASE-TEXTBOOK-PLAN.md) · [세션 프롬프트](docs/DATABASE-SESSION-PROMPTS.md) · [배치 A 검증·게시 상태](docs/DATABASE-BATCH-A-VERIFICATION.md)

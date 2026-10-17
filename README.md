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
소개와 01~05장을 구현했습니다. 06장 이후와 다른 권은 후속 배치입니다.

신규 콘텐츠는 인터랙티브 시뮬레이션·설명용 애니메이션·그림을 적극적으로 활용합니다.
핵심 개념의 구조·과정·조건 비교를 시각화하며, 모바일·키보드·정적 단계 대안을 함께 제공합니다.


## 돈 교과서 · 배치 A

- 소개: `#/money`
- 01 우리 집 돈의 지도: `#/money/map`
- 02 들어오고 나가는 돈: `#/money/flows`
- 03 예산과 목적별 돈: `#/money/budget`
- 04 물가와 구매력: `#/money/inflation`
- 05 이자와 복리: `#/money/interest`

`src/content/money/*.mdx`에 본문, `src/components/money/`에 React 실험,
`src/simulations/money/`에 UI 독립 거래·일별 예산 모델이 있습니다.
01~03 금액은 정수 만원, 04~05는 원이며 모두 가상 사례입니다. 원금·이체는 소비로 세지 않고 카드 소비는 구매 때 한 번만 기록합니다.
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

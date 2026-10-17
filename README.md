# my books

직접 실험하며 배우는 개인 인터랙티브 교과서.

React + TypeScript + Vite 기반의 GitHub Pages 정적 웹사이트입니다. 로그인이나 서버 없이 실행되며 읽음 기록은 현재 브라우저의 localStorage에 저장됩니다.

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

현재 네트워크 01~06장을 공개합니다. 07~09 HTTP·TLS·verify가 다음 배치이며,
TLS·프록시·Docker·k3s는 후속 범위입니다. 전체 계획은
[NETWORK-TEXTBOOK-PLAN.md](docs/NETWORK-TEXTBOOK-PLAN.md)를 참고하세요.

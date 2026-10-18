# 쿠버네티스 배치 G 검증 기록

2026-10-18 (KST). 기준 main `28b405f`.
범위: 번호 장 추가 없이 세 선택 부록·최소 실습 패키지·01–12 통합 점검.

## 선행 확인과 호환성

AGENTS·작성 기준·홈 구조·계획·세션 G 전체·실습환경·A–F 기록을 읽었다.
F 구현 `9329cbe2239aa2692c2d854b0d97bdeb6ea91628`은 main 조상이며
Actions [39102209042](https://github.com/Middleages/my-books/actions/runs/39102209042)의
head SHA·completed/success를 API에서 재확인했다. 게시 11장의 실제 DOM과 01–12 목차도 확인했다.
경제 B의 최신 문서/모바일 수정 `28b405f`를 기준으로 보존한다.

- 소개에서 `#/kubernetes/lab-first-deployment`, `/lab-recovery`, `/lab-airgap` 연결.
- 부록은 chapters 배열·readId·읽음 분모에 넣지 않는다. 기존 43개 장·12개 Kubernetes ID 유지.
- main.tsx에 부록 찾기·본문·제목·목차 분기만 추가. 읽음 parser/storage key/toggle 로직 무변경.
- 계획 첫머리의 A–D만 완료라는 낡은 요약 수정. A–F 당시 기록을 소급 수정하지 않음.
- F 인수인계의 01 replica와 03 desired state 강조 마커 노출을 명시적 strong으로 수정.
- 다른 교재 본문·홈·표지·전역 CSS는 무변경. 12의 후속 부록 안내와 책 소개·공개 범위만 갱신.

## 제공물·가정·공식 근거

- 세 MDX 부록·AppendixLabs.tsx/appendices.css, UI 독립 recoveryFrames/dependencyMap 모델·타입.
- 복원 모델은 API 기록과 PV 파일 사본·외부 DB 책임 비교이며 실제 복원 엔진 아님.
  원래 token 누락과 PV 사본 누락을 다른 상태로 표현. 파일 복원 조건이어도 앱 성공을 판정하지 않음.
- study-web Python 표준 라이브러리 앱·비루트 Dockerfile·manifest·chart·README·verify.py.
  v1/v2는 직접 build/import하는 로컬 태그. Never 정책과 tar 반입을 명시.
  Docker Hub의 고정 base image index digest 및 amd64 descriptor 조회 성공, pull/build 성공과 구분.
- Helm chart 0.1.0은 단일 release·고정 이름 study-web, 의존 chart/hook/CRD 없음.
  ConfigMap은 envFrom이며 checksum annotation 없음. 값 변경만으로 프로세스 env 갱신을 주장하지 않음.
- SQLite 기본 절차·etcd 대안·PV/외부 DB 분리, 격리된 두 번째 VM의 복원 확인표 제공.
  실습 삭제는 전용 books-lab만, 기존 NGINX/서버/DB 변경·실제 토큰 요청 없음.
- 공식 확인일 2026-10-18. K3s backup-restore·etcd-snapshot·server·airgap·private-registry·requirements·advanced/proxy·cluster-access·networking-services, Kubernetes v1.35 image 정책, Helm template/lint를 대조하고 본문 출처로 연결.
  본문 YAML·CLI 안내를 실제 클러스터 실행 기록으로 해석하지 않도록 표시함.

## 검증 수준별 결과

| 수준 | 실행 결과 | 범위·한계 |
| --- | --- | --- |
| 브라우저 교육 모델 | 신규 5개 및 전체 npm test 252개 통과 | 가상 사례. 실제 cluster API 미연결 |
| 앱 함수 | Python unittest 4개 통과 | escape·v1/v2·ready/live 분리·없는 경로 |
| 앱 프로세스 HTTP | Python 3.12로 실제 listen/요청: root v2/escape 200, live 200, ready 503 | 컨테이너 실행 아님 |
| manifest 정적 검사 | PyYAML 파싱·selector/port/probe/ConfigMap 참조·비루트 설정·v1/v2 렌더 일치 통과 | API schema/admission 검사 아님 |
| Helm 실제 로컬 실행 | v4.3.1+gc0d08d0 lint --strict, template v1(3객체)/v2+Ingress(4객체) 통과 | install/upgrade/rollback 미실행 |
| 본문 SSR | 소개·12장·3부록 16페이지 렌더, 중첩 p·의도치 않은 del·리터럴 ** 없음 | 브라우저 배치/조작 별도 |
| production build | TypeScript·Vite 성공 | 기존 단일 번들 500kB 경고 유지 |
| 실제 클러스터 실습 | **미실행** | Docker/k3s/kubectl 없음·PID1 supervisord·일회용 Linux VM 미제공 |
| 실제 복원 | **미실행** | SQLite/etcd/PV/외부 DB 복원 성공 주장 없음 |
| main·사이트 배포 | a29f628·3072b82 Actions/Pages 성공 | 게시 자산·반응형·조작 확인, 아래 기록 |

Helm tar checksum은 LAB-ENVIRONMENT에 기록. 추출 시 ownership 매핑 오류 후
`tar --no-same-owner`로 재추출하고 버전·lint·render 실행 성공. 바이너리 무결성과 chart 렌더를 구분했다.

## 화면 점검과 남은 제한

Browser skill 사용. 연결 Edge가 제공되어 viewport 기능을 읽었다.
로컬 127.0.0.1:4173 접속은 ERR_CONNECTION_REFUSED라 로컬 화면은 검증하지 못했다.
배포 후 1440/390/320px의 소개·01–12·부록·핵심 조작·읽음 reload·키보드를 확인했다. 구체 범위와 제한은 아래 기록한다.
reduced-motion media 변경·임의 localStorage 쓰기는 현재 Browser API에 없으므로
그 실기와 알 수 없는 ID 브라우저 주입은 미검증이다. reading 모델 회귀·CSS 정적 대안과 구분한다.
Safari·실제 터치·스크린리더 음성·클러스터 실습도 미검증/미실행이다.

## main 통합·배포·실제 게시

구현 커밋·Actions·게시 자산·실측 UI 결과는 아래 두 배포 기록을 기준으로 한다.

## 통합 리뷰 수정

독립 읽기 전용 리뷰에서 같은 이름의 새 VM 복원 시 `/etc/rancher/node/password` 보관 누락을 발견했다.
공식 architecture의 node-password 재등록 조건과 대조해 Important로 판단했다.
SQLite·etcd 안내에 원래 node 디렉터리의 별도 보호된 사본과 시작 전 복원 단계를 추가했다.
server token과 node password를 다른 역할로 설명하고 기본 node-name 재현 가정은 유지한다.
실제 복원 실행 검증을 한 것으로 보고하지 않는다. 빌드 아키텍처도 README와 MDX 모두 linux/amd64로 맞췄다.
기존 43개 readId 순서까지 일치, 쿠버네티스 내부 링크의 chapter/appendix 경로 존재 확인.

리뷰의 두 번째 Important: 복원 VM을 먼저 기동하면 새 TLS/credential과 과거 datastore가 섞일 수 있어,
SQLite 절차를 `INSTALL_K3S_SKIP_START=true`의 미기동 새 VM으로 바꿨다. db/tls/cred가 이미 있으면
중단하는 단일 set -eu 블록과 첫 기동 전 db/token/node identity 반입을 안내한다.
기존 데이터를 지우거나 운영 서버를 시험 대상으로 삼지 않는다.

## 첫 main 반영·실제 게시 확인

- 구현 main `a29f628bf0d1db084c37e75bdca4a3717258df53`.
  로컬 검증 tree와 connector 생성 tree `98a8bc9ec57e9aa81f5f16beef35d1b69f45eb7b` 일치.
  최신 main `28b405f`를 재확인하고 expected SHA·비강제 ref 갱신으로 반영했다.
  터미널 push는 인증 수단이 없어 실패했으며 기존 연결 GitHub API로 반영했다.
- [Actions 39124988786](https://github.com/Middleages/my-books/actions/runs/39124988786) completed/success.
  실제 Pages에서 `index-CcWeb6LR.js`, CSS `index-DkD8yM1s.css` 확인.
- 연결 Edge viewport 1440×1000, 390×844, 320×800: 소개·01–12·3부록 총 16페이지씩 확인.
  1440/390 전 페이지, 320에서는 02를 제외한 15페이지 가로 넘침 없음.
  02의 목표 문장 영문 용어 연결은 320px에서 scrollWidth347을 만들었다.
  학습 목표의 구분자를 자연스러운 띄어쓰기 있는 문장으로 바꿨다. 후속 게시에서 재확인한다.
- 1440에서 16페이지의 의미 있는 본문·h1, 의도치 않은 del/별표 없음.
  390 복구 실험 스크린샷으로 세로 카드·조작·라벨 가독성 확인. 표는 이름 있는 스크롤 영역이다.
- 복구 실험: 원래 token 누락 → API 복원 중단·앱 미확인, PV 사본 누락 → API 기록 복원 조건과 파일 누락 분리.
  조건 변경1/4, Enter 진행·solid focus outline, 이전/다시 보기/초기화, 정지 후 다음 관측까지2/4 유지,
  정상 자동재생4/4에서 끝남과 버튼 disabled, 정적 전체 단계의 동일 상태 설명 확인.
  재생 도중03으로 이동한 뒤 독립 실험 초기 상태 유지. 부록에 읽음 버튼 없음.
- 기존01–06 기본 실험 마지막4/4·6/6·5/5·5/5·7/7·5/5 및 초기화 확인.
  기존07–12는 Enter 한 단계 진행·정적 전체 단계·초기화 smoke 확인.
  모든 입력 조합의 브라우저 전수 시험을 주장하지 않는다. 모델 전수/경계 테스트와 구분한다.
- 03 읽음 표시 → reload 유지 → 테스트 표시 취소. 원래0/12로 되돌림.
  소개의 기존12장·부록링크3개, 홈5권/43장·분야/표지 유지.
- 기존 네트워크13 selector 불일치 → 대상 없음·예측 일치 회귀.
  돈08의 1개월 비교와 돈·경제 분야 키보드 선택 smoke 수행. 다른 교재 전체 재검증은 아님.
- 관찰한 게시 탭의 error/warn 로그 0건. 브라우저 밖 환경 전체의 무오류 보장은 아님.
- SKIP_START는 k3s 고정태그 install.sh에서도 분기 존재를 정적으로 확인했다.
  실제 복원·클러스터 실행은 여전히 미실행이다.

후속 수정은 02의 긴 용어 목록 줄바꿈, 새 터미널에서 k 함수 재정의 안내,
11의 실제 CLI 로컬 렌더와 브라우저 모델/클러스터 미실행 구분 링크다.
A–F의 지정 폭 미검증 기록을 과거 시점에서 고쳐 쓰지 않고 위 G 실측으로 보완한다.
reduced-motion media 에뮬레이션·임의 기존 읽음 ID 브라우저 삽입·Safari·실제 터치·스크린리더 음성은 미검증이다.
정적 전체 단계와 CSS motion 제거 규칙 검토·기존 reading 모델 통과를 해당 실기 통과로 바꾸지 않는다.

## 후속 배포·최종 상태

- 후속 main `3072b820009d7c6d350b29b5d5b90a0eb21698e8`,
  [Actions 39125710877](https://github.com/Middleages/my-books/actions/runs/39125710877) completed/success.
  로컬 검증 tree와 원격 tree `c09e5316e3ab70fdb181b5f2a12f7d14908c898d` 일치.
- 실제 게시 JS `index-Dw-N0KKK.js`, CSS `index-DkD8yM1s.css` 확인.
  02 재로드 후 320px에서 scrollWidth305(스크롤바 제외 client305), viewport320으로 넘침 해소.
  390/1440도 넘침 없음. 320 스크린샷으로 지도 조작부·라벨 가독성 확인.
  따라서 지정 세 폭의 16페이지 점검은 최종 수정 포함 모두 페이지 가로 넘침 없음이다.
  표/코드의 의도된 내부 스크롤은 페이지 가로 넘침과 구분한다.
- 복구 실험 정상 재생 끝에서 next/play disabled 확인, 재생 중03 이동 후
  1/5 상태가 다음 관측에서도 유지됨을 추가 확인했다. 1440 폐쇄망 의존 카드6개 렌더 확인.
  임시 viewport override는 해제했다.
- 최종 텍스트 보완 뒤 npm test 252/252·production build·16페이지 SSR·diff check 재통과.
  최종 본문·패키지의 내용 변경은 위 두 배포에 포함됐다. 이 최종 기록은 문서만 변경한다.

**구현·브라우저 교육 모델/주요 조작·정적 manifest/실제 Helm 로컬 렌더·사이트 배포는 확인 완료.**
**실제 k3s 설치·컨테이너 빌드/실행·클러스터 배포/rollback·SQLite/etcd/PV/외부 DB 복원은 미실행.**
미검증: reduced-motion media 에뮬레이션, 임의 저장 ID 브라우저 주입, Safari·실제 터치·스크린리더 음성.
동일 정보의 정적 단계는 실제 조작 확인했고 CSS motion 규칙/reading 모델은 별도 검사했다.
다음 번호 장은 없다. 실제 VM 실습을 수행할 때 이 기록의 후보 버전·명령·기대 관측을 이어서 채운다.

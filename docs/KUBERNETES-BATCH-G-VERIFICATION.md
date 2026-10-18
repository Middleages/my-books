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
| main·사이트 배포 | 대기 | 아래에 확인된 결과만 후속 기록 |

Helm tar checksum은 LAB-ENVIRONMENT에 기록. 추출 시 ownership 매핑 오류 후
`tar --no-same-owner`로 재추출하고 버전·lint·render 실행 성공. 바이너리 무결성과 chart 렌더를 구분했다.

## 화면 점검과 남은 제한

Browser skill 사용. 연결 Edge가 제공되어 viewport 기능을 읽었다.
로컬 127.0.0.1:4173 접속은 ERR_CONNECTION_REFUSED라 로컬 화면은 검증하지 못했다.
배포 후 1440/390/320px의 소개·01–12·부록·핵심 조작·읽음 reload·키보드를 확인할 예정이다.
reduced-motion media 변경·임의 localStorage 쓰기는 현재 Browser API에 없으므로
그 실기와 알 수 없는 ID 브라우저 주입은 미검증이다. reading 모델 회귀·CSS 정적 대안과 구분한다.
Safari·실제 터치·스크린리더 음성·클러스터 실습도 미검증/미실행이다.

## main 통합·배포·실제 게시

대기. 구현 커밋·Actions·게시 자산·실측 UI 결과를 확인한 뒤 추가 기록한다.

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

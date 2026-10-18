# 쿠버네티스 배치 A 검증 기록

작성일: 2026-10-18 (KST). 범위: 책 소개·01~02만. 기준 원격 main: `7cb537f43ada79e8ef6c7997822edb75cdb4df0b`.

## 구현과 공개 계약

- bookId `kubernetes`, 분야 `technology`, 제목 `웹앱 운영자를 위한 쿠버네티스`.
- 소개 `#/kubernetes`; 01 `#/kubernetes/why-kubernetes`, readId `kubernetes/why-kubernetes`; 02 `#/kubernetes/cluster-map`, readId `kubernetes/cluster-map`.
- 본문 `src/content/kubernetes/{Intro,WhyKubernetes,ClusterMap}.mdx`.
- UI `src/components/kubernetes/FoundationLabs.tsx`, 한정 CSS `kubernetes.css`.
- 모델/타입 `src/simulations/kubernetes/foundation.mjs`, `foundation.d.mts`; 테스트 `tests/kubernetes-foundation.test.mjs`.
- 기존 `useFoundationPlayback`/`Playback` 재사용. 별도 전체 공통 프레임워크나 03 이후 범용 클러스터 엔진을 만들지 않음.
- 이미지/인스턴스 그림, 복구 담당·VM 경계·실행 상자 비교, API 중심 제어 지도와 별도 HTTP 경로, context/namespace/RBAC 예시.
- 자체 SVG 표지. 기존 카드 순서·분야 필터·컴팩트 홈 구조 유지. 기존 main/읽음 파서/저장 키는 변경하지 않음. 돈 01~08과 네트워크 01~15 소스 보존.

## 기술 근거·가정

공식 자료 확인일 2026-10-18. 각 본문의 출처와 `KUBERNETES-LAB-ENVIRONMENT.md` 참조. Kubernetes 개념은 v1.35 문서, 실습 k3s 후보는 v1.35.9+k3s1. 모든 설치·실습 후보는 실행 미검증.

복구 모델은 정상 실행 후 앱 하나의 일회성 비정상 종료 또는 단일 VM 종료다. Compose unless-stopped는 Engine이 수행하며 수동 stop·삭제는 제외한다. Kubernetes 앱 복구는 같은 Pod의 컨테이너 재시작이다. 시간/backoff·반복 실패·준비 검사·노드 복구는 생략한다.
제어 모델은 API를 통한 비동기 관찰/기록을 교육용 순서로 제시한다. HTTP는 별도로 준비된 앱·Ingress/Service 경로를 가정한다. namespace 선택은 권한을 추가하지 않는다. 실제 인증·API 연결이나 임의 사용자 코드 실행 없음.

## 실행 검증

실행 환경: 제공된 Linux 실행 환경, Node v24.19.0, npm offline cache. Actions는 저장소 기존 Node 22 설정을 유지한다.

- `npm ci --offline`: 성공, 155 packages.
- 모델 테스트: 최초 모델 부재 실패 확인 → 구현 후 통과. HTTP 반환 경로의 Ingress 누락을 추가 테스트로 실패 재현 후 보완.
- `npm test`: 통합 전 124개 통과 (기존 116 + 신규 8). 돈 08 통합 후 최종 134개 통과 (기존 126 + 신규 8). production 빌드와 git diff --check 통과.
- `npm run build`: TypeScript와 Vite production 빌드 성공. 기존 전체 콘텐츠 단일 번들 구조에 따른 500 kB 경고 유지; 이번 범위에서 다른 교재 로딩 구조를 개편하지 않음.
- `git diff --check`: 최종 변경 대상으로 실행.
- 코드 검토: 별도 읽기 전용 검토 수행. 타이머 stop/unmount 정리, 설정 변경 시 단계·예측 reset, 짧아진 frame 접근, 스코프 CSS, MDX children 문단 중첩을 점검. HTTP 반환 경로 문자열을 그림의 경로와 일치시킴. 좁은 화면의 비교 표는 키보드 접근 가능한 가로 스크롤 영역으로 한정하고 영문 식별자 줄바꿈을 추가함.

## 화면 검증 환경 제한 (통과 아님)

- Vite preview 시작은 `uv_interface_addresses` 환경 오류로 실패.
- Python 정적 서버 대안도 브라우저에서 localhost `ERR_CONNECTION_REFUSED`로 접근 불가.
- Browser plugin의 js 도구가 노출되지 않아 cloud browser를 사용. 로컬 테스트 대안을 시도했으나 `/tmp/chromium`은 실행 바이너리가 아닌 빈 파일이어서 Playwright launch가 종료됨.
- 따라서 로컬 1440/390/320px 화면·키보드·재생/정지·reduced-motion 실제 조작·localStorage 새로고침·기존 실험 UI 회귀는 아직 미검증. 테스트 스크립트 작성이나 CSS 코드 검토를 실제 화면 통과로 계산하지 않음.
- 배포 후 접근 가능한 실제 Pages에서 수행한 검증은 별도 후속 기록으로 추가한다. 검증할 수 없는 화면 크기·미디어 설정·브라우저 항목은 그대로 미검증으로 남긴다.

## main·배포

Git 직접 clone은 연결 실패해 GitHub connector로 기준 커밋의 전체 파일을 가져와 독립 로컬 브랜치에 스냅샷을 만들었다. 반영 시 원격 main을 다시 확인하고 변경 파일만 기존 tree 위에 적용한다. expected SHA를 검사하는 비강제 ref 갱신으로 병행 변경을 보호한다.

이 문서 작성 시 main 반영·Actions·Pages는 대기 상태다. 구현만으로 배포 성공을 선언하지 않는다. 배포 후 확인된 커밋·Actions·실제 자산은 다음 문서 커밋에 기록한다.

## 다음 범위

B: 03 원하는 상태와 Pod, 04 바뀌는 Pod와 고정된 입구. 먼저 A의 최종 배포와 화면 미검증 항목을 확인·보완한다. 실제 클러스터 설치·기존 서버 변경은 A에서 하지 않았고 설치·복구 실습 전체 완료를 주장하지 않는다.

통합 기준 main: `1f469ebd8b798fd4fc8320893268edc09bb9e72d` (돈 08). 새 모델·본문·UI·문서·테스트를 모두 받아 공통 catalog의 두 추가 영역만 병합했다.


## 배포 후 실제 게시 검증 (2026-10-18)

- 구현 main 커밋: `c34c1afccecfbf1d7df4170f4b07c644634bb616`.
- Actions: https://github.com/Middleages/my-books/actions/runs/39091004875 — build/deploy 모두 success. Node 22의 npm ci/test/build 성공.
- 실제 게시: https://middleages.github.io/my-books/#/kubernetes (소개), `/why-kubernetes`, `/cluster-map`.
- 실제 DOM에서 로드된 JS `/my-books/assets/index-CYXKx_o9.js`를 로컬 통합 production 결과와 대조. CSS는 `index-CMU4ey5S.css`.
- Cloud Chromium 관측 viewport 1363×936 (1440 대체 통과로 계산하지 않음). 소개의 공개 목차 두 개, 홈 IT·기술 3권·전체 4권/27장·돈 8장 유지와 자체 표지 렌더를 확인.
- 02: namespace other에서 Forbidden, lab-admin 전환 후 6단계 runtime 실행, HTTP 4단계의 Pod → Ingress controller → 사용자 응답 경로 확인.
- 01: VM 실패 후 실행 수 0/3, 초기화, Enter 키로 한 단계, 재생/즉시 정지 후 다음 관측에서도 2/4단계 유지, 다시 보기, 설정 변경 시 예측 비움 확인.
- 01 읽음 표시 후 reload에서 유지됨을 확인한 후 테스트 표시를 취소. 기존 알 수 없는 ID 보존은 모델 테스트/소스 검토이며 실제 브라우저 임의 ID 삽입 검증은 미수행.
- 01/02 DOM의 중첩 p 0개, 현재 viewport에서 페이지 가로 넘침 없음. 스크린샷으로 현재 데스크톱 배치 관찰. 앱 출처의 콘솔 오류는 발견하지 못했으나 browser extension의 metadata 전송 오류는 존재(교재 앱 오류와 구분).
- 기존 Service 실험: selector app=other + 대상 없음 예측 → 대상 없음·예측 일치 확인. 돈 08의 본문과 상환 실험 로딩·1개월 비교 버튼 클릭을 smoke 확인(금융 전체 시나리오 재검증 아님).
- 실제 화면에서 Markdown 강조 표시가 문자로 남은 두 용어를 발견해 `<strong>`으로 수정. 이 후속 변경의 자산은 다음 배포 결과를 별도로 확인한다.

남은 검증: 정확한 1440/390/320px, reduced-motion media, 전체 재생 완료·장 전환 중 타이머의 실제 UI 회귀, 임의 읽음 ID를 넣은 브라우저 저장 회귀, 나머지 기존 실험 전체 UI, Safari·터치 기기·스크린리더. 로컬 환경 차단 때문에 이 목록은 통과가 아니며 다음 세션에서 우선 보완한다. 실제 클러스터 실습은 요청대로 미실행.

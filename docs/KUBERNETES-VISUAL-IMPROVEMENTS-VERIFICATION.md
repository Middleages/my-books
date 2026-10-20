# 쿠버네티스 시각 설명 보완 · 검증 기록

2026-10-20 UTC. 기존 소개·01–12·선택 부록의 설명력을 보완한다. 새 책·장·URL을 만들거나 실제 Kubernetes 클러스터를 조작하지 않는다.

## 기준과 현재 상태

- 원 감사 기준 main: `609e6f2cef1c449ee8760f92c98b01ace238d5e1`.
- 병행 보험 E를 보존해 통합한 기준 main: `246167308c050d797d00501fb057e2ea61de51b4`.
- 첫 구현 검증 head: `8cb514b0d5227c5e20e3c372f5b69330afe6bce0`, [draft PR #13](https://github.com/Middleages/my-books/pull/13).
- 첫 head의 전체 Node 테스트 833/833, TypeScript/Vite build 통과. 새 독립 시각 모델 테스트 53개 포함. 500 kB 초과 번들 경고는 기존대로 남는다.
- 로컬 Chromium 실행은 `socket() failed: Operation not permitted`로 차단됐다. 실행하지 못한 로컬 브라우저 검사를 통과로 기록하지 않는다.
- [첫 Actions QA](https://github.com/Middleages/my-books/actions/runs/39355440268)는 production artifact를 그대로 Chromium에서 검사하고 PNG를 저장하는 별도 경로다. 첫 실행은 94 checks 중 38 실패이며, 108 PNG를 저장했다. 320px의 04 목표 문장에서 실제 2px 넘침을 확인했다. 나머지 실패는 select label 정확 일치와 마우스 조작 직후 focus-visible을 가정한 검증 코드 오류였다. 문장을 나누고 검증 코드가 실제 키보드 포커스를 만들도록 수정했으며 재실행으로 확인한다. 체크아웃은 PR merge `4732433decff55956bb1e426fc439d6d87d17053`, tree는 첫 head와 같은 `5d99ea8020cbd8aecefb73557b91b8fc4c8bcad9`다.
- main 통합·Pages 배포·게시 자산 확인은 아직 수행하지 않았다. 이 문서는 통과 예정 항목을 완료로 취급하지 않는다.

## 눈으로 발견할 관계와 모델 근거

| 범위 | 독자가 발견할 관계 | 구현 방식 / 보존한 조건 |
| --- | --- | --- |
| 소개·01 | 이미지와 인스턴스, 관리자 복구와 VM 장애는 다름 | 기존 그림·모델 보존, 01 조작을 장면 앞으로 이동 |
| 02 | 제어 역할은 API를 중심으로 관찰·기록, HTTP는 별도 경로 | `clusterDiagram(frame,path)`의 실제 edge를 DOM 경계 사이 SVG 선으로 연결. 외부 client는 VM 경계 밖. 현재 방향만 굵게 표시 |
| 03 | A가 사라져도 B의 정체성은 이동하지 않음 | `desiredSlots`가 지금까지 본 UID 자리를 유지. 삭제 ghost는 현재 Pod 개수에 넣지 않음 |
| 04 | namespace·selector·ready·포트는 서로 다른 선택 경계 | 정확한 EndpointSlice 선택만 Pod에 연결, 다른 namespace는 선 없음. DNS 실패는 요청 경로에서 ×, EndpointSlice/DNS를 데이터 중계 노드로 그리지 않음 |
| 05 | 외부 TLS 종료와 새 내부 연결은 별개 | `tlsSegments`의 구간 안에 실제 hop을 배치. ServiceLB는 TLS 종료하지 않음. 브라우저/NGINX 검증 주체를 구간에 직접 표시 |
| 06 | API v2·파일 v2·앱 v1은 서로 다른 상태 | 같은 frame의 버전에서 원형 v1/이중선 사각 v2, 미전달/미읽기 경계를 그린다. 이미지·Pod·프로세스 ID는 별도로 유지 |
| 07 | 소멸한 Pod 경계와 남은 PV 파일은 다름 | `storageBoundaries`의 removed는 이전 경계 ghost, unknown은 미관측. 파일 존재·연결·실제 접근을 혼동하지 않음 |
| 08 | requests 제안 2300m와 3000m는 다른 초과량 | CPU 0–3000m, 메모리 0–3072Mi의 고정 축. 수용량 선을 별도로 표시하고 비례 길이를 포화시키지 않음 |
| 09·10 | 준비 대상 제외와 재시작, 두 버전의 자원 몫 | 기존 probe/rollout 모델·Pod 그림 보존. 관찰한 사건 기록 추가, capacity는 frame의 allocatable/request로 계산 |
| 11 | values의 변경 위치, 출력/적용, 두 revision의 차이 | 필드별 연결·dev/prod 고정 비교·같은 관찰 순서의 두 이력. rollback은 보관 manifest 선택, 작업 전 API 기준 비교. template에 live Service를 그리지 않음 |
| 12 | 증거가 확인한 경계만 좁힐 수 있음 | 올바른 관측 이후에만 기존 resource/Service/Ingress 모델 장면을 공개. 나머지는 unknown이며 정상 인증하지 않음 |
| 부록 A | 빌드 PC·VM·호출 PC는 서로 다른 실행 위치 | 실행 위치와 확인 gate의 정적 지도, 실제 설치/배포 미실행 고지 보존 |
| 부록 B | API 기록은 파일 바이트나 외부 DB 사본이 아님 | 보관 재료 → 포함 대상 → 별도 실물 확인. 누락은 끊긴 선, 미확인은 중립 점선 |
| 부록 C | runtime·브라우저·NGINX·앱의 신뢰 목록은 독립 | 반입 재료와 네 호출 주체의 CA·DNS·시각 경계를 실제 연결로 표시. HTTP 직렬 처리 경로로 오해하지 않게 명시 |

`visual-explanations.mjs`는 UI와 독립적인 관찰 투영이며 별도 성공 판정이나 가짜 중간 frame을 만들지 않는다. 진단의 실제 관측 데이터는 `helm-diagnosis.mjs`가 기존 장 모델에서 읽는다. 새 CSS는 Kubernetes 접두어로 제한한다.

## 검증 계약

- 모델: 모든 observed edge 방향, 비례축·경계값·미전달/미읽기·삭제/미관측·namespace 제외·TLS 범위·Helm 이력·진단 evidence gate·백업 포함/누락·신뢰 주체·UID와 probe 이력을 검사한다.
- production/browser: `scripts/kubernetes-browser-qa.cjs`. 1440×1000, 390×844, 320×844에서 소개·12장·3부록을 렌더한다. 키보드 Tab/Enter, 이전/다음·정지·재실행·초기화, 실패 조건, 정적 대안, reduced-motion 390 폭을 별도 검사한다.
- 실제 DOM: SVG 선의 시작/끝이 정확한 node 경계에 붙는지, 다른 node를 가로지르지 않는지, VM 안팎의 포함 관계, 2300:3000 실제 pixel 길이 비율, 2000m 수용량 위치, 페이지 수평 넘침·중첩 문단·콘솔 오류를 검사한다.
- regression: 기존 12개 chapter/readId, 알려지지 않은 읽음 ID, 새로고침·페이지 이동, 기존 insurance/investing browser suites를 보존한다. 다른 책의 병행 suite가 main에 들어오면 matrix·contract test에서 합집합으로 유지한다.
- published mode: LIVE_URL의 entry JS/CSS 파일명과 모든 해당 asset byte hash가 같은 run의 dist와 일치해야 한다. 배포 허가 뒤에만 이 결과를 기록한다.
- 자동 검사는 실제 PNG의 설명력·읽기 쉬움을 판정하지 않는다. 캡처를 직접 연 뒤 별도 시각 검토를 남긴다.

## 독립 리뷰로 수정한 의미 오류

read-only 리뷰에서 DNS 실패 화살표, 현재 API 연결의 양방향 표시, template에서 없는 Service 표시, rollback을 새 렌더로 보이는 제목, 외부 client의 VM 경계를 발견했다. 수정했고 정확한 DOM 회귀 assertion을 추가했다. Helm rollback의 비교 기준도 최초 설치가 아니라 작업 시작 API로 고정했다. 독립 focused run은 106/106 통과했다. 첫 actual-PNG 리뷰는 320px의 04/05/06/07/11/12와 복구·폐쇄망 부록, 390px reduced-final을 확인했다. 내부 registry 상자에 노드 이미지 저장소 설명이 붙어 위치를 혼동시키던 문제를 발견해 원격 저장소와 노드 저장소가 별개라고 수정했다. 테스트 선택 실패로 아직 캡처하지 못한 변경 상태는 다음 실행에서 검증한다. 후속 전체 Node 테스트는 835/835를 통과했다. 이는 최종 전체 브라우저·시각 검토를 대체하지 않는다.

## 공식 관계 재확인

2026-10-20: [ConfigMap 전달·env/subPath](https://kubernetes.io/docs/concepts/configuration/configmap/), [Deployment revision](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/), [K3s datastore와 token](https://docs.k3s.io/datastore/backup-restore), [NGINX upstream TLS 검증](https://docs.nginx.com/nginx/admin-guide/security-controls/securing-http-traffic-upstream/). 기존 버전 계약·실습 패키지·미실행 범위는 변경하지 않는다.

## 두 번째 실제 production 검증

- [run 39357733843](https://github.com/Middleages/my-books/actions/runs/39357733843): build, insurance, investing, kubernetes 모두 성공. PR이므로 deploy/published job은 의도대로 skipped다.
- head `f257819ba8ebbf9009829919dfa970733d79195c`, 실제 PR merge checkout `3ff59afa7a9e3ef0a57a6c7ddf273f9f09e7ca29`, tree `f3594688477b8488be88babbd431224e5e9d3b29`. 이 tree는 보험 harness 수정 main `a514d0c`를 보존 통합한 로컬 tree와 일치한다.
- Kubernetes 94/94 checks, 113 PNG. Chromium 155.0.8059.84. [검증 artifact](https://github.com/Middleages/my-books/actions/runs/39357733843/artifacts/12236201830)의 ZIP SHA-256은 `8b710a85d06760f6d67837ad2df28da55f970583aec2f422f93aa309006be350`으로 다운로드 후 대조했다.
- 1440/390/320에서 모든 route, 실제 node/선 연결, 비포화 비율, 키보드 재생·정지·재실행·초기화, 실제 열린 정적 대안, 390 reduced-motion, 읽음 기록 보존, console 및 텍스트 glyph 넘침 검사 통과. 로컬 main 보존 합본의 전체 Node 테스트는 836/836.
- 실제 PNG에서 API 중심 제어와 별도 HTTP, source/file v2와 앱 v1, 사라진 Pod ghost와 남은 PV, TLS의 별도 실패, Helm 2 / Deployment 1, 진단의 CPU·포트 경계, 누락 PV와 독립 trust store를 확인했다.
- 독립 픽셀 검토에서 남은 작은 표시 문제 2건을 찾았다. VM 진입선이 경계 제목을 통과해 제목을 오른쪽으로 옮겼고, 모바일에서 복구 `?`까지 회전하던 CSS를 방향 화살표만 회전하도록 바꿨다. 선–제목 교차와 물음표 transform 검사를 추가했다. 이 두 수정은 후속 캡처로 확인해야 한다.

### 긴 장면과 조작 거리

두 번째 run의 닫힌 초기 lab 전체 높이(CSS px)는 04: 1440 폭 1743, 390 폭 2944, 320 폭 3171; 05: 1686 / 2378 / 2577이다. 핵심 장면 자체는 04: 785 / 1318 / 1471; 05: 670 / 693 / 778이다. 두 장 모두 재생 조작의 아래 경계에서 핵심 장면 위 경계까지 16px이다. 02도 같은 조작 간격을 확인했다. 원 감사의 1180/393 폭·다른 DPR/스크롤바 관측과 직접적인 감소율로 비교하지 않는다. 모바일에서는 여전히 본문과 조작이 길지만 선택 관계·TLS 구간을 서로 떨어진 설명 카드에서 재조립할 필요가 없도록 묶었다.

## 최종 변경 상태·독립 픽셀 검토

- [run 39364354199](https://github.com/Middleages/my-books/actions/runs/39364354199): Kubernetes production **94/94 checks**, **146 PNG**, Chromium 155.0.8059.84. 여기서 94는 상위 검사 묶음 수이며 한 묶음 안의 환경·실패 사례도 모두 실행했다.
- 검증 head `1cbc9e1ce65f54e48e67ae817fd2028c969f67a1`, 실제 PR merge checkout `c4ef98c2d2c786526f83bedb622110e923974183`, tree `455c0fe3b657711f4b7e800adac1c75ccc9311cc`. 세금·권차 main `da333eb71e2e5c5f00ba70bbddb2f36c1ce50b9f`를 보존한 합본이다. 이 문서의 결과 기록은 검증 뒤 갱신하며 앱 코드는 바꾸지 않는다.
- [최종 캡처 artifact](https://github.com/Middleages/my-books/actions/runs/39364354199/artifacts/12239090992): 다운로드 ZIP SHA-256 `25a1b6761e73b6ae9d2239fc272b724d95eed7dd30e15426912ccb413b551587` 일치. 같은 head의 로컬 전체 Node **850/850**, TypeScript/Vite build 통과. 독립 시각 모델 **55/55** 포함.
- DOM 검사로 VM 라벨–선 비충돌과 물음표의 회전 없음이 확인됐다. env/subPath 미전달, Helm rollback 전후, 진단 8사례 전체, token/PV 누락 캡처를 추가했다. 모델·UI에 성공 상태를 억지로 주입하거나 검사를 건너뛰지 않았다.
- 독립 검토자는 세 폭에서 42 PNG를 직접 열었다: `02-control-edge`, `02-http-response`, `06-env-stale`, `06-subpath-stale`, `11-rollback-before/final`, `12-image/crash/ready/selector/ingress/tls-evidence`, `14-missing-pv/token`. 두 P2의 실제 해결을 확인했으며 추가 결함을 발견하지 않았다.
- 앞선 30 PNG 검토의 TLS 실패·v2 파일/v1 앱·사라진 Pod·config-only revision·CPU/포트 진단·신뢰 경계와 합쳐 핵심 변경 관계를 확인했다. 작성자도 마지막 캡처에서 변경 상태·320px 글자와 경계·질문표를 직접 확인했다. 캡처가 있다는 사실만으로 승인한 것은 아니다.
- exact build asset: `index-BN1Q6eZc.css` SHA-256 `bd98cb6a1fecb053cca147466ea2488294e05ee8ec671b1e944415e2e12bd2a8`, `index-DxCmWCSY.js` SHA-256 `94ca7ec7c8cbb6ced58b079e209f0f523868ecb4dea1ddc6b573c01ec0e8ec87`. production artifact와 브라우저가 받은 bytes를 대조한 값이며, 아직 게시 사이트의 값이라는 뜻은 아니다.

## 통합 준비 상태와 한계

시각 보완과 해당 범위 검증은 통합 준비를 마쳤다. 최종 반영에서는 병행 DB 등 최신 main·workflow의 검사 선택 규칙과 기존 suite를 보존하고, 허가된 게시 창에서만 main/Pages를 갱신한다. 게시 뒤 실제 자산·published QA 결과를 별도로 기록한다. 실제 클러스터 설치·Helm install/upgrade·복원·사내망 연결, 실제 모바일 기기·Safari·스크린리더 음성은 이 작업에서 실행하지 않는다.

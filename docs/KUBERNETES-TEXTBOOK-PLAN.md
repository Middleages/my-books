# 웹앱 운영자를 위한 쿠버네티스 — 교재 계획

작성일: 2026-10-18 (KST). 상태: **배치 A–F 소개·01–12 공개. G 선택 부록·실습 패키지 구현·main 반영·사이트 배포 확인, 통합 점검 보완 중. 실제 클러스터 실습 미실행**.
기획 기준 main: `2b09163`. 실제 구현은 항상 최신 main에서 시작한다.

관련 문서: [전역 지침](../AGENTS.md), [작성 기준](CONTENT-AUTHORING.md), [홈 구조·표지 결정](HOME-INFORMATION-ARCHITECTURE.md), [네트워크 계획](NETWORK-TEXTBOOK-PLAN.md), [세션별 실행 프롬프트](KUBERNETES-SESSION-PROMPTS.md).

## 1. 합의한 목표와 독자

웹앱을 직접 배포하고 운영하는 비전공 성인에게, 작은 앱 하나의 실행·연결·설정·데이터를 설명하고 변경을 배포하며 실패 구간을 찾아볼 수 있는 입문 교재를 제공한다.
Docker로 여러 앱을 운영하다 단일 Linux VM에 k3s를 검토하는 상황을 중심 사례로 삼는다. 특정 회사의 주소·계정·자원 할당에 종속된 설치 매뉴얼로 만들지 않는다.

완독 목표:

> 내 앱의 실행·연결·설정·데이터가 어디에 있는지 설명하고, 작은 변경을 배포하고, 실패한 구간을 찾아볼 수 있다.

컨테이너·이미지를 짧게 복습하고 기존 네트워크 교재의 주소·포트·DNS·TLS·프록시·Docker 설명과 연결한다. 네트워크 13~14의 짧은 k3s 소개와 15장의 진단 범위는 유지한다.
쿠버네티스가 항상 더 좋은 선택이라고 결론 내리지 않는다. Compose의 재시작 정책과 운영 기능도 공정하게 비교하며, 추가 관리 비용을 포함해 도입 이유를 설명한다.

## 2. 범위와 학습 방식

### 포함

- Kubernetes의 공통 원리와 단일 VM k3s에서 관찰할 수 있는 동작.
- 앱 하나씩 전환하기, 기존 호스트 프록시·외부 DB와 함께 쓰기.
- Pod·Deployment·Service·Ingress·설정·스토리지·리소스·probe·롤아웃·Helm·진단.
- namespace·kubeconfig context·최소 권한의 기본, 클러스터 관리자와 한 namespace 사용자 역할의 차이.
- 단일 VM의 장애 한계, 데이터 백업·복구 책임, 버전·이미지·인증서 관리.

### 후속으로 남김

멀티 노드 HA 구축, etcd 쿼럼 운영, 고급 CNI/CSI·분산 스토리지 설치, 서비스 메시, Operator 개발, 복잡한 스케줄링·오토스케일링, GitOps 플랫폼 구축, 대규모 튜닝, 완전한 보안 강화·재해복구 설계. StatefulSet·Job·CronJob·DaemonSet은 역할 비교와 다음 학습 안내만 제공한다.

### 두 학습 경로

1. **브라우저 경로:** 설치 없이 그림·단계 재생·직접 조작으로 전 장을 이해한다. 실제 Kubernetes API에 연결하지 않는다.
2. **선택 실습 경로:** 별도의 일회용 Linux VM에서 최소 YAML과 명령으로 확인한다. 본문은 관측 위치·예상 결과·실패 확인 위치를 함께 제공한다. 실습환경이 없어도 본문은 완결한다.

첫 세션은 환경 선택 안내와 버전 기록 형식을 만든다. 전체 설치·배포·복구 실습 묶음은 G에서 완성한다. 앞선 세션의 명령·YAML은 검증 범위를 표시하며 설치 실습 전체가 완료됐다고 소개하지 않는다.
개발 PC마다 k3s를 설치하도록 요구하지 않는다. 로컬 프로세스/Compose 개발, 원격 실습 클러스터, kind 등 선택지를 역할로 비교하되 재현 실습의 기본 경로는 하나로 고정한다. WSL·Docker Desktop·macOS는 기본 Linux VM과 차이를 명시하고 별도 확인 없이 지원 완료로 쓰지 않는다.

## 3. 기본 사례와 버전 계약

가상의 작은 웹앱 `study-web`을 중심으로 관찰한다. HTTP `/`, `/health/live`, `/health/ready`, 화면에 버전·설정 표시를 기본 기능 후보로 둔다. 정확한 응답·이미지·포트 계약은 A에서 문서화하고 실제 실습 앱은 필요할 때 최소한으로 추가한다.

- 기본 실행 포트 후보: 컨테이너 8080, Service 80 → targetPort 8080. 교육 예시이며 호스트 포트 자동 개방을 뜻하지 않는다.
- 기본 namespace: `books-lab`. 책의 이름과 실제 배포 대상 namespace를 구분한다.
- 이미지 v1/v2 표시는 학습 라벨이다. 실습에서는 실제로 존재하고 확인한 태그/다이제스트를 사용한다. 존재하지 않는 이미지 주소를 배포 가능한 예제로 쓰지 않는다.
- 저장 예제는 별도 `study-data` 단일 replica 사례로 분리한다. 파일 저장 앱을 근거 없이 다중 replica로 늘리지 않는다. 외부 DB 연결은 경계·자격 증명·DNS/TLS를 설명하며 실제 사내 DB에 연결하지 않는다.
- 브라우저 모델 주소는 예시 주소임을 표시한다. 실습 Service/Pod 주소는 관측값으로 확인하며 임의 IP를 실제 고정값처럼 쓰지 않는다.
- Kubernetes와 k3s는 같은 이름의 별개 제품처럼 비교하지 않는다. 공통 API·개념과 배포판의 기본 구성·운영 방식을 구분한다.

A에서 `docs/KUBERNETES-LAB-ENVIRONMENT.md`를 생성한다. OS·아키텍처·k3s 전체 버전·포함 Kubernetes 버전·kubectl·Helm 주요 버전·Ingress controller/차트·runtime·CNI·스토리지·datastore 선택·사용 이미지·확인일을 기록한다. 미실행 항목은 **문서 기준 후보/실행 미검증**으로 구분한다. 실행한 적 없는 조합을 검증 기준 환경이라고 쓰지 않는다.

각 세션은 같은 기준을 유지한다. 변경이 필요하면 이유·영향받는 장·재검증 범위를 먼저 기록한다. `latest`/가변 채널만으로 재현성을 주장하지 않는다. 기획 시점에는 특정 최신 버전 번호를 임의 확정하지 않는다.

## 4. 장별 설계

| 장 / 고정 ID | 제목과 핵심 질문 | 그림·조작의 중심 | 정확성과 완료 기준 |
| --- | --- | --- | --- |
| 01 `why-kubernetes` | 컨테이너 다음에 필요한 것 — 앱이 늘면 어떤 운영 일이 생길까? | 직접 실행·Compose·Kubernetes의 실행/복구/업데이트 책임 지도, 이미지와 실행 인스턴스 구분, 앱 종료와 VM 종료 비교 | Compose도 재시작 가능. 도입의 장점·관리 비용을 함께 설명. 단일 VM에 replica를 늘려도 VM 장애 대비가 되지 않음 |
| 02 `cluster-map` | 클러스터의 지도 — 명령은 누가 받고 앱은 누가 실행할까? | 사용자→API→관측/조정→노드 실행의 흐름, control plane·node·kubelet·runtime 경계, context·namespace·권한 선택 | 명령/제어 경로와 사용자 HTTP 요청 경로 분리. API가 앱 트래픽 중계기가 아님. 한 VM에 역할들이 함께 있을 수 있음 |
| 03 `desired-state` | 원하는 상태와 Pod — 하나를 지웠는데 왜 다시 생길까? | Deployment→ReplicaSet→Pod 소유 관계, desired/current/ready 개수, 삭제·컨테이너 종료·replica 변경·노드 불가 시나리오 | 같은 Pod 안 컨테이너 재시작과 새 UID의 Pod 교체 구분. 복구는 즉시/무조건이 아님. 실제 controller 시간은 생략 표시 |
| 04 `service-discovery` | 바뀌는 Pod와 고정된 입구 — 새 Pod를 어떻게 찾을까? | label selector→EndpointSlice의 ready 대상→Service port/targetPort→Pod 경로, Pod 교체 후 대상 변경, namespace별 DNS | Service가 앱 프로세스/독립 프록시 Pod인 것처럼 그리지 않음. 일반 ClusterIP 기본, headless·특수 publishNotReady 조건은 범위 표시. 네트워크 모델 재사용 검토 |
| 05 `ingress-tls` | 외부 요청과 TLS — 내 도메인은 어디로 들어올까? | 브라우저→선택한 외부 진입→controller→Service→Pod, host/path 분기·TLS 종료, 호스트 NGINX 공존 전후 | Ingress 리소스·controller·ServiceLB를 구분. 기본 k3s 80/443 점유와 기존 프록시 충돌 확인. Ingress 안정 API와 Gateway API의 현재 권고를 함께 안내 |
| 06 `configuration` | 설정과 비밀정보 — 이미지를 다시 만들지 않고 바꿀 수 있을까? | 이미지/ConfigMap/Secret 분리, 환경변수와 마운트 파일의 변경 전달 비교, 실행 중 프로세스가 읽은 값 표시 | base64는 암호화가 아님. Secret 보호는 RBAC·저장 암호화 등 별도 조건. env는 기존 프로세스에 자동 갱신되지 않음; volume 갱신과 앱 재읽기·subPath 예외 구분 |
| 07 `storage` | Pod가 바뀌어도 남을 것 — 파일은 어디에 살까? | writable layer·emptyDir·PVC/PV·노드 디스크 공간, 재시작/Pod 삭제/노드 상실/PVC 삭제 비교 | emptyDir는 컨테이너 재시작과 Pod 교체 결과가 다름. local storage는 노드 의존. PVC 자체가 복제·백업을 보장하지 않음. reclaim 정책별 차이 명시 |
| 08 `resources` | 자원이 모자랄 때 — 빈 CPU가 보여도 왜 Pending일까? | allocatable 대비 requests 예약 배치와 실제 사용량 별도 막대, CPU limit·메모리 압박 비교, namespace quota | request/limit/실사용량 구분. CPU throttling과 메모리 OOM 종료 구분. 메모리 초과 즉시 종료를 일반 법칙으로 만들지 않음. 단일 노드·정해진 scheduler 조건 표시 |
| 09 `health-checks` | 살아 있음과 준비됨 — 언제 요청을 보내고 다시 시작할까? | startup/liveness/readiness 시간선과 실패 횟수, ready 대상 변화·컨테이너 재시작 연결 | readiness 실패 자체는 재시작 명령이 아님. startup 성공 전 probe 관계와 임계값 설명. 외부 DB 장애를 무조건 liveness 실패로 연결하지 않음 |
| 10 `rollout` | 교체하면서 배포하기 — 새 버전이 준비되지 않으면? | old/new ReplicaSet과 ready 수, maxSurge/maxUnavailable 정수부터, 자원 부족/실패 버전/명시적 rollback | 무중단 자동 보장·실패 자동 rollback으로 쓰지 않음. 종료 지연 등 생략 표시. rollback은 DB/PVC/외부 상태 전체 복구가 아님 |
| 11 `helm` | 반복 배포를 묶기 — 같은 앱의 설정만 바꾸려면? | chart+values→렌더링 YAML→release/revision→리소스, 개발/운영 값을 비교하고 template·install·upgrade·rollback 구분 | Helm은 별도 scheduler가 아님. Helm release와 Deployment revision 구분. 버전별 CLI 확인. chart 신뢰·CRD/hooks·데이터 rollback의 한계 짧게 설명 |
| 12 `troubleshooting` | 증거로 고치기 — 어디에서 멈췄는가? | 배포→실행→준비→Service→Ingress의 관측 지도, 증거 카드와 다음 조사 선택, 기존 앱 하나씩 전환 계획 | Pending·ImagePullBackOff·CrashLoopBackOff·ready 대상 없음·TLS 실패 등을 코드 하나로 단정하지 않음. get/describe/events/logs/previous/rollout의 질문 연결 |

장마다 ①학습 목표 ②그림과 쉬운 예 ③과정 재생 ④예측·조작 ⑤실무 관측 ⑥확인 문제·해설 ⑦가정·출처를 갖춘다. 한 장당 핵심 실험 1개를 기본으로 하고, 짧은 비교 그림을 필요한 위치에 추가한다. 분량보다 개념 전달을 기준으로 한다.

## 5. 공통 UI·모델 계약

- 본문: `src/content/kubernetes/*.mdx`; UI: `src/components/kubernetes/`; 모델·타입: `src/simulations/kubernetes/*.mjs`·`.d.mts`; 테스트: 기존 Node 체계.
- bookId `kubernetes`, 분야 `technology`, 책 제목 **웹앱 운영자를 위한 쿠버네티스**. 책 소개 `#/kubernetes`; 장 URL `#/kubernetes/<id>`; readId `kubernetes/<id>`. 위 표의 장 ID를 최초 공개 후 변경하지 않는다.
- 아직 구현하지 않은 장을 catalog에 넣거나 활성 링크로 노출하지 않는다. 개요에서 후속 계획임을 밝힌 일반 텍스트는 가능하다.
- 홈에 주제에 맞는 자체 SVG 표지를 추가한다. 기존 분야 필터·컴팩트 카드·읽음 정렬 규칙을 유지한다.
- A는 기존 네트워크 재생 UI·단계 프레임·모바일 배치를 검토하고 필요한 최소 공통 UI만 만든다. 전체 사이트 공통 프레임워크를 새로 만들지 않는다.
- 그림·이동·주소·개수·판정·단계 해설·정적 표는 동일한 모델 프레임을 읽는다. DOM/React에 별도 성공 로직을 두지 않는다.
- 장면은 결정적으로 재현한다. 임의 시각적 타이밍을 실제 scheduler·probe 시간처럼 소개하지 않는다. 전체 클러스터를 흉내 내는 범용 엔진 대신 장별 제한 모델을 사용한다.
- 재생·정지·이전 단계·한 단계 진행·다시 보기·초기화 제공. 설정 변경 시 단계·예측·진행 상태를 함께 초기화한다. 정지·장 이동 시 타이머·이동 효과 정리.
- 모바일은 경계/연결의 의미를 유지하며 세로 재배치한다. 키보드·reduced-motion·정적 단계 설명으로 같은 내용을 제공한다. 입력 폼·숫자·긴 로그만으로 그림을 대체하지 않는다.
- HTML/MDX 중첩 문단, 포맷터의 JSX 문단 변환, 전역 CSS 간섭을 실제 렌더에서 확인한다. CSS는 교재 접두어로 제한한다.

## 6. 선택 실습·부록의 범위

G에서 다음 세 부록을 책 소개에 연결한다. 본문 12장과 다른 부록임을 표시하고 필요하다면 별도 문서 페이지 구조를 사용한다. chapter 번호·읽음 기록을 임의 재배정하지 않는다.

- **환경과 첫 배포:** 일회용 VM·context/namespace 확인, 설치 버전과 구성, registry/image 접근, 앱 v1 배포·Service·외부 진입·v2 업데이트·rollback·실습 자원 정리. 기존 서비스가 있는 서버에 설치/제거를 자동 실행하지 않는다. 웹 시뮬레이션의 성공을 실제 서버 검증으로 보고하지 않는다.
- **운영과 복구:** manifest·클러스터 datastore/토큰·PV 파일/외부 DB의 백업 대상을 나눠 설명한다. 선택한 SQLite/etcd 구성에 맞춰 공식 절차를 확인한다. 다른 일회용 환경에서 복구 확인하는 절차를 제시하며 실행 여부를 구분한다. 삭제·복원 명령은 영향 범위와 전제 조건을 표시한다.
- **폐쇄망과 기존 환경:** 설치 바이너리·이미지·chart·registry 미러/인증·CA·프록시·DNS·시간 동기화의 의존성 지도, 기존 호스트 NGINX 및 외부 DB 공존. 사내마다 다른 방화벽/CA/권한 조건을 보편적인 한 줄 설정으로 해결된다고 쓰지 않는다. 실제 사내 인증서·토큰·주소를 요구하지 않는다.

본문의 모든 예는 가상 정보로 완결한다. 샘플 Secret을 실제 자격 증명처럼 다루지 않는다. 실습 앱/manifest/chart를 넣으면 `examples/kubernetes/` 아래에 README와 검증 방법·확인 버전을 함께 둔다.

## 7. 세션 순서·인수인계

**A → B → C → D → E → F → G 순서로 한 세션씩 실행한다.** 동일 교재의 다음 세션은 직전 세션의 main 반영·배포 상태를 확인한 뒤 시작한다. 다른 교재 작업은 병행할 수 있으나 공통 파일은 최신 main에서 통합한다.

| 세션 | 범위 | 선행 조건 | 이번 세션의 고유 산출물 |
| --- | --- | --- | --- |
| A | 책 소개·01~02 | 본 계획 | catalog/표지·최소 UI·환경 계약·01~02·검증 기록 |
| B | 03~04 | A | desired state·Service 모델과 시각 UI |
| C | 05~06 | B | 외부 진입·TLS·설정 모델, 호스트 프록시 공존 설명 |
| D | 07~08 | C | 저장 수명·자원 배치 모델 |
| E | 09~10 | D | probe·롤아웃 모델, 기존 ready/자원 의미 연결 |
| F | 11~12 | E | Helm 설명·진단 사례·첫 12장 연결 검토 |
| G | 선택 실습 부록·통합 점검 | F | 실습 묶음·복구/폐쇄망 부록·전체 완료 검증 |

각 세션 시작: 최신 main·작업 트리·선행 코드/검증 문서를 읽는다. 선행 배치가 없으면 다음 장 구현을 강행하지 말고 구체적인 미완료 상태를 알린다. 선행 배포가 실패한 경우 로그와 원인을 확인해 같은 범위의 실패를 해결한 뒤 진행한다. 테스트 환경 차단을 이전 배치 완료 사실로 덮지 않는다.

종료 시 `docs/KUBERNETES-BATCH-<A~G>-VERIFICATION.md`를 남긴다:
기준 main / 구현 파일·공개 ID / 공식 출처·확인일 / 모델 가정 / 검증 명령·결과·실행 환경 / 실제 실습 수행 여부 / main 통합 커밋 / Actions·실제 Pages 자산 / 미검증·남은 문제 / 다음 세션 범위.

검증 문서 자체를 포함한 커밋 SHA는 사전에 알 수 없으므로 임의로 쓰지 않는다. 배포 후 기록이 필요하면 다음 문서 커밋에 확인된 구현 커밋·Actions를 기록하거나 다음 세션이 검증 기록을 보완한다. 구현·배포·실습 실행을 서로 다른 상태로 기록한다.

병행 작업 보호: 작업 전·반영 직전 main을 확인하고 필요한 충돌만 통합한다. catalog는 새 책/해당 장과 공개 범위만 수정한다. 다른 교재 본문·읽음 ID·홈 구조를 되돌리지 않는다. 가능한 한 독립 브랜치/작업 트리를 쓰고 검증한 변경만 반영한다.

## 8. 구현 배치별 완료 기준

1. 장별 핵심 관계·실패/경계값·재실행을 독립 모델 테스트로 확인. `npm test`, `npm run build`, `git diff --check`.
2. production 화면에서 1440·390·320px 확인. 가독성·경로 방향·가로 넘침·HTML 중첩·콘솔 오류 점검.
3. 재생/정지/이전/한 단계/다시 보기/초기화, 설정 변경·장 이동 정리, 키보드·reduced-motion·정적 대안 확인.
4. 홈 분야/표지/진행률·기존 URL·읽음 표시·새로고침·알 수 없는 ID 보존 확인. 변경 영향이 있는 기존 핵심 실험 회귀.
5. YAML·명령은 정적 확인/렌더링/클러스터 실행을 구분한다. Kubernetes 없이 schema나 문자열 검사만 했으면 실제 배포 통과로 쓰지 않는다.
6. 최신 main과 통합한 결과를 검증하고 main 반영·GitHub Actions·실제 Pages 배포 버전을 확인한다. 외부 클러스터 변경은 교재 사이트 배포에 포함되지 않는다.
7. 문서에 현재 공개 범위·구현 결과·미검증 항목을 갱신한다. 다음 배치 내용은 완료로 쓰지 않는다.

문서만 작성하는 현재 기획 작업은 링크·내용·범위·변경 검사 대상이다. 본문 테스트/화면 검증이나 클러스터 실습을 실행한 것으로 보고하지 않는다.

## 9. 공식 근거와 재확인 지점

2026-10-18 기획 조사에서 아래 공식 문서를 확인했다. 이동하는 최신 문서이므로 실제 구현 시 기준 버전에 맞춰 다시 확인하고 각 장의 근거를 추가한다. 이 목록이 모든 API·설치 예제 검증을 대신하지 않는다.

| 공식 자료 | 기획에 반영한 확인점 |
| --- | --- |
| https://kubernetes.io/docs/concepts/workloads/controllers/deployment/ | desired state·롤아웃·revision과 복구 범위 |
| https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/ | Pod 수명·컨테이너 재시작과 교체 구분 |
| https://kubernetes.io/docs/concepts/services-networking/ingress/ | Ingress API는 안정적이나 기능 개발 동결; Gateway API 권고를 후속 연결 |
| https://docs.k3s.io/networking/networking-services | Traefik·ServiceLB·80/443와 호스트 프록시 공존 확인 필요 |
| https://kubernetes.io/docs/concepts/configuration/secret/ | Secret 객체만으로 기밀 보호 전체가 해결되지 않음 |
| https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/ | requests와 limits, CPU throttling·메모리 OOM 구분 |
| https://docs.k3s.io/quick-start | k3s 설치 경로와 kubeconfig 관측의 시작점 |
| https://docs.k3s.io/datastore/backup-restore | datastore별 절차와 서버 토큰의 별도 보관·복원 필요 |
| https://docs.k3s.io/installation/airgap | 폐쇄망 설치에 필요한 별도 아티팩트·이미지 준비 |
| https://helm.sh/docs/topics/charts/ | chart 구성·values·템플릿 관계 |

Ingress를 기존 네트워크 교재와의 연결 및 k3s 사례로 설명하되 유일한 향후 표준이라고 쓰지 않는다. Kubernetes Ingress API와 특정 ingress controller 프로젝트의 유지보수 상태를 혼동하지 않는다. controller 선택·버전은 구현 시 공식 지원 상태로 결정한다.

추가 조사 착수처(현재 전체 검증을 완료했다는 뜻이 아님): Kubernetes Service/EndpointSlice/ConfigMap/Volume/PV/Probe/RBAC 문서, K3s architecture/storage/private registries, Gateway API 및 선택한 controller, Helm 해당 주요 버전 CLI 문서.

## 10. 진행 상태

| 배치 | 구현 | 사이트 검증 | main·배포 | 실습 검증 |
| --- | --- | --- | --- | --- |
| A | 소개·01~02 구현 | 134 테스트·빌드·게시 데스크톱 핵심 조작 통과 / 지정 폭·reduced-motion 미검증 | c34c1af · Actions/Pages 성공 | 미실행 (요청 범위) |
| B | 03~04 구현 | 157 테스트·빌드·게시 데스크톱 주요 조작 통과 / 지정 폭·reduced-motion 미검증 | a8055a6 · Actions/Pages 성공 | 미실행 |
| C | 05~06 구현 | 182 통합 테스트·빌드·게시 데스크톱 핵심 조작 통과 / 지정 폭·reduced-motion 미검증 | f31b692 · Actions/Pages 성공 | 미실행 |
| D | 07~08 구현 | 198 테스트·빌드·게시 핵심 조작 통과 / 지정 폭·reduced-motion 미검증 | dfec0bc · Actions/Pages 성공 | 미실행 |
| E | 09–10 구현 | 214 테스트·빌드·SSR·게시 핵심 조작 통과 / 지정 폭·reduced-motion 미검증 | 2483fc7 · Actions/Pages 성공 | 미실행 |
| F | 11–12 구현 | 237 테스트·빌드·SSR·게시 핵심 조작 통과 / 지정 폭·reduced-motion 미검증 | 9329cbe · Actions/Pages 성공 | Helm·클러스터 미실행 |
| G | 세 부록·앱/manifest/chart 구현 | 252 테스트·앱4개·HTTP·Helm·SSR·지정폭/게시 조작 확인, 02 줄바꿈 후속 보완 | a29f628 · Actions/Pages 성공 | 설치·클러스터·복원 미실행 |

배치 A의 상세 결과·환경 제한·게시 버전은 [배치 A 검증](KUBERNETES-BATCH-A-VERIFICATION.md), 선택 실습 계약은 [실습환경](KUBERNETES-LAB-ENVIRONMENT.md)에 기록한다.

배치 B의 모델·실행 검증·게시 상태는 [배치 B 검증](KUBERNETES-BATCH-B-VERIFICATION.md)에 기록한다.

배치 C의 상세 결과는 [배치 C 검증](KUBERNETES-BATCH-C-VERIFICATION.md)에 기록한다.

배치 D의 상세 결과는 [배치 D 검증](KUBERNETES-BATCH-D-VERIFICATION.md)에 기록한다.

배치 E의 상세 결과는 [배치 E 검증](KUBERNETES-BATCH-E-VERIFICATION.md)에 기록한다.

배치 F의 모델·진단 사례·검증 범위는 [배치 F 검증](KUBERNETES-BATCH-F-VERIFICATION.md)에 기록한다.

배치 G의 브라우저 모델·manifest 정적 검사·Helm 렌더·클러스터 실행·배포는 [배치 G 검증](KUBERNETES-BATCH-G-VERIFICATION.md)에서 구분한다.

# 쿠버네티스 선택 실습환경 계약

작성·공식 문서 확인일: 2026-10-18 (KST). 배치 A.
**모든 클러스터 항목은 문서 기준 후보 / 실행 미검증이다.** 실제 서버를 설치하거나 기존 서버를 변경하지 않았다. 웹 모델 테스트와 사이트 빌드는 클러스터 실습의 대체 증거가 아니다.

## 기본 경로와 버전 기록

브라우저만으로 본문을 학습할 수 있다. 선택 실습 기본 경로는 별도의 일회용 Linux VM 한 대이며 개발 PC마다 k3s를 설치하지 않는다. 로컬 프로세스/Compose 개발을 유지하고 원격 실습환경을 사용할 수 있다. kind는 별도 선택지이며 WSL·Docker Desktop·macOS는 네트워크·경로 차이가 있어 지원 검증 완료로 표시하지 않는다.

| 항목 | 문서 기준 후보 | 실제 관측 |
| --- | --- | --- |
| OS / 아키텍처 | Ubuntu 24.04 LTS / amd64 | 미설치·미관측 |
| k3s 전체 버전 | v1.35.9+k3s1 | 실행 미검증 |
| 포함 Kubernetes | v1.35.9 | 릴리스 표 확인 / 실행 미검증 |
| kubectl | k3s 동봉 kubectl v1.35.9 후보 | 실행 미검증 |
| Helm CLI | 주요 버전 4 후보. 배치 F에서 patch 고정·렌더 검증 | 설치·실행하지 않음 |
| Ingress controller | k3s 동봉 Traefik v3.7.13 후보 | 실행 미검증 |
| Ingress chart | 동봉 패키지 `40.1.5+up40.1.0` (upstream chart 40.1.0) | 태그의 manifest 정적 확인 / 설치 미검증 |
| runtime | containerd v2.2.7-k3s1 후보 | 실행 미검증 |
| CNI | Flannel v0.28.4 / 기본 VXLAN 후보 | 실행 미검증 |
| 스토리지 | local-path-provisioner v0.0.37, 노드 로컬 디스크 | 실행 미검증·백업 아님 |
| datastore | 단일 server 기본 SQLite 후보 (릴리스 표 3.53.4) | 실행 미검증 |
| 실제 사용 이미지 | 없음. study-web은 아래 계약만 정의 | pull/build/deploy 하지 않음 |

K3s 공식 v1.35 릴리스 표와 본문을 확인했다. 릴리스 본문에 표와 다른 일부 내부 의존성 변경이 있어, 위 항목은 실제 패키지·실행 관측으로 확정할 후보이며 검증 환경 선언이 아니다. 설치·재현 단계에 들어가기 전 exact binary, chart, image digest를 기록한다. `latest`나 가변 채널만으로 재현성을 주장하지 않는다. 이 문서는 해당 버전을 모든 운영 서버에 권장하는 업그레이드 지침이 아니다.

## study-web 계약 (가상 앱, 구현 전)

- namespace: `books-lab`; Deployment/Service 이름: `study-web`.
- 컨테이너는 `0.0.0.0:8080`에서 HTTP listen. Service port 80 → targetPort 8080. 호스트 포트를 자동 개방한다는 뜻이 아니다.
- `GET /`: 정상 시 200 HTML, 학습용 버전 라벨과 비밀이 아닌 `APP_MESSAGE` 설정 표시. 실제 비밀정보는 응답에 표시하지 않는다.
- `GET /health/live`: 프로세스가 정상 응답 가능하면 200, 교육용 실패 모드에서는 500. 외부 DB 가용성을 liveness 조건으로 삼지 않는다.
- `GET /health/ready`: 요청을 받을 준비가 된 경우 200, 교육용 미준비 모드에서는 503. 준비 실패 자체가 재시작 명령은 아니다.
- v1/v2는 브라우저 학습 라벨이며 실제 registry 주소나 배포 가능한 태그가 아니다. 아직 앱 소스·이미지·YAML은 제공하지 않는다. 실행 예제 도입 시 `examples/kubernetes/`에 앱·빌드·실제 태그/다이제스트·검증 방법을 함께 추가한다.
- 무상태 웹앱. 저장 사례는 별도 `study-data` 단일 replica로 분리한다. 개인·사내 DB나 실제 인증정보를 요구하지 않는다.
- 브라우저 모델에는 고정 Pod IP를 사용하지 않는다. 실제 Pod·Service 주소는 `kubectl get ... -o wide`의 관측값을 기록한다.

## 실제 실습 전 기록할 항목

관리 터미널과 일회용 VM에서 `uname -m`, OS release, `k3s --version`, `kubectl version`, `helm version`, 현재 context/namespace, 노드 상태, 설치 설정과 이미지 목록을 확인한다. 민감한 kubeconfig·서버 토큰 원문은 문서에 넣지 않는다. 기존 80/443 리스너, registry 접근, CA·DNS·시간 동기화를 점검한다. A에서는 이 명령을 실행하지 않았다.

후속 세션은 이 계약을 이어받는다. 후보 변경 시 이유·영향받는 장·재검증 범위를 기록한다. C는 controller/진입 구성, F는 Helm, G는 설치·배포·복원 묶음의 실제 검증을 책임진다. 실행할 수 없으면 미검증 상태와 독자가 확인할 명령·예상 관측을 남긴다.

## 공식 근거

- https://docs.k3s.io/release-notes/v1.35.X — 버전 표·Traefik chart 변경 주의점
- https://docs.k3s.io/architecture — 단일 server, agent 역할, datastore
- https://docs.k3s.io/quick-start — 설치와 kubeconfig
- https://helm.sh/docs/ — Helm 4 문서 경로; 이번 배치에서 CLI 미사용
- https://v1-35.docs.kubernetes.io/docs/concepts/overview/components/ — 본문 개념 기준

## 배치 C · 외부 진입·설정 계약 보완

2026-10-18, k3s `v1.35.9+k3s1` 태그의 [manifests/traefik.yaml](https://github.com/k3s-io/k3s/blob/v1.35.9+k3s1/manifests/traefik.yaml)을 GitHub에서 읽어 Traefik·CRD 패키지 `40.1.5+up40.1.0`와 image tag `3.7.13`을 확인했다. 다운로드·설치·실행 검증은 아니다. A의 다른 후보는 유지한다.

- 브라우저 가상 외부 주소 `192.0.2.10`, 도메인 `study.example.test`. Ingress는 `/` Exact, `/health` Prefix를 `study-web:80`에 연결. rewrite 없음.
- 기본 경로는 ServiceLB의 외부 443 → controller TLS 종료 → backend HTTP. 기존 호스트 NGINX와의 공존 경로는 외부 443 유지 → controller용 NodePort 30080/30443 예시. 기본 80/443 hostPort 점유를 피하는 별도 설정을 전제하며 설치 기본값이라고 주장하지 않는다. NodePort 도달성·방화벽·노출 범위는 실제 관측 필요.
- 공존 HTTPS 모델은 NGINX upstream 검증 활성화, 검증 이름/SNI/CA의 정상 설정을 전제로 성공·실패를 비교한다. 호스트 프록시 제거·기존 서버 변경은 미실행.
- ConfigMap 이름 후보 `study-web-config`, 일반 키 `APP_MESSAGE`; Secret 문자열은 `demo-only-v1/v2`. 앱 코드·실제 이미지·Secret·YAML 배포는 아직 없음.
- 06의 마지막 단계는 전파 완료 후 새 Pod 생성. 파일 재읽기·동일 Pod 컨테이너 재시작과 구분. 일반 볼륨 갱신과 subPath 예외만 모델링.

## 배치 D · 저장·자원 모델 계약

2026-10-18. 기존 버전 후보를 유지하며 실제 클러스터 실습은 미실행.
- `study-data`는 단일 replica, 정상 node-a의 디스크형 emptyDir와 local-path 디렉터리를 비교. 이미 Bound인 PVC `books-lab/data`와 PV `pv-data`에서 시작한다. 노드·경로·객체 이름은 가상이다.
- local-path-provisioner v0.0.37의 `deploy/local-path-storage.yaml`을 정적으로 확인: `WaitForFirstConsumer`, `reclaimPolicy: Delete`, 디렉터리 setup/teardown. Retain은 삭제 전 해당 PV의 정책을 바꾼 별도 비교 조건이며 기본값이라고 표시하지 않는다. 정적 확인은 설치·삭제 실행이 아니다.
- PVC 사용 중 보호 → 사용 Pod 제거 → PVC 삭제 → 정상 정리 완료를 분리. 노드 접근 불가와 디스크 영구 상실도 별개 사건. PV/PVC 기록·파일 존재·앱의 마운트 연결은 다른 상태다. API가 함께 중단될 수 있는 노드 장애는 마지막 기록 표시.
- 자원 모델: allocatable CPU 2000m/메모리 2048Mi, 기존 실제 사용 100m/256Mi, 새 컨테이너 memory request/limit 256/512Mi, CPU limit 1000m. 실제 서버 추천값이 아니다.
- books-lab의 기존 requests.cpu는 500m 고정. 노드의 추가 기존 요청은 다른 namespace. quota는 requests.cpu만 비교하며 생성 심사 후 scheduler의 requests 적합성을 확인한다. OOM은 관측한 종료 사례이며 초과 즉시 종료 법칙이 아니다.

## 배치 E · probe·롤아웃 관찰 계약

2026-10-18. 기존 버전 후보 유지, 실제 클러스터 미실행.
- study-web의 HTTP 8080 /health/live·/health/ready 계약 사용. 설명용 startupProbe가 live endpoint를 검사하는 예는 초기화 완료 전에는 성공을 반환하지 않는 앱 설계를 전제한다. 실제 앱·이미지 구현은 아직 없음.
- probe 모델은 일반 컨테이너 하나·추가 readiness gate 없음·restartPolicy Always·successThreshold 1, 공통 failureThreshold 1/2/3 비교. 본문 YAML의 검사별 주기는 별도 가상 예이며 UI 재생 속도와 무관하다.
- rollout은 replicas 2, 정수 surge/unavailable, minReadySeconds 0. 08 자원 판정을 재사용하고 Pod당 requests 500m/256Mi, 다른 앱 메모리 512Mi/CPU 500m 또는1000m. quota·이미지·네트워크는 정상 조건.
- v1/v2는 버전 라벨이며 revision 번호가 아니다. 종료 중 Pod·연결 drain·controller 동시성·실제 시간은 생략한다. 명시적 rollback은 Pod template 대상이며 DB/PVC와 외부 설정 객체 내용을 되돌리지 않는다.

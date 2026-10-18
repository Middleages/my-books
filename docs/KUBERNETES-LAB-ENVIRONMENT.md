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
| Ingress chart | 동봉 Traefik chart 40.x 계열; 정확한 패키지 버전은 C에서 고정 | 설치 manifest 미확인 |
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

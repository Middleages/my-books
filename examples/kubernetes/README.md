# study-web 선택 실습 패키지

2026-10-18. 웹 교재의 `books-lab`, `study-web`, HTTP 8080, Service 80→8080 계약.
번호 장은 01–12 그대로이며 세 부록은 책 소개에서 연결한다.

- [환경·설치·첫 배포](https://middleages.github.io/my-books/#/kubernetes/lab-first-deployment)
- [운영·복원 리허설](https://middleages.github.io/my-books/#/kubernetes/lab-recovery)
- [폐쇄망·공존](https://middleages.github.io/my-books/#/kubernetes/lab-airgap)
- [실습 버전 계약](../../docs/KUBERNETES-LAB-ENVIRONMENT.md)
- [배치 G 실제 검증 기록](../../docs/KUBERNETES-BATCH-G-VERIFICATION.md)

## 검증 수준

앱의 실제 로컬 HTTP, Python 테스트, YAML 파싱·객체 간 계약 검사,
Helm **v4.3.1+gc0d08d0**의 lint/template을 실행한다.
**k3s 설치·컨테이너 빌드/실행·API admission·클러스터 배포·실제 복원은 미실행**이다.
`helm template --kube-version 1.35.9`는 서버 스키마/admission 검증이 아니다.
기본 후보는 Ubuntu 24.04 amd64, k3s v1.35.9+k3s1의 SQLite 단일 server다.

## 파일과 앱 동작

- `app/server.py`: Python 표준 라이브러리 HTTP 서버. 런타임 패키지 다운로드 없음.
- `app/Dockerfile`: 비루트 UID 10001, Python 3.13.7-slim-bookworm의 고정 index digest.
  Docker Hub manifest GET 200과 amd64 descriptor를 확인했다. 이미지 pull/build 성공은 별개다.
- `manifests/namespace.yaml`, `app.yaml`, 선택 `ingress.yaml`.
- `chart/`: study-web 0.1.0, release study, 외부 chart·hook·CRD 없음.
- `verify.py`: PyYAML이 있는 도구 환경에서 로컬 파일과 실제 렌더 간 계약 검사.
  클러스터나 외부 서비스에 접속하지 않는다.

`/`는 APP_VERSION과 비밀이 아닌 APP_MESSAGE를 HTML escape해 표시한다.
`/health/live` 200, `/health/ready` 200, 없는 경로 404.
교육용 APP_UNREADY=1이면 ready만 503, APP_FAIL_LIVE=1이면 live만 500이다.
실제 DB·저장 파일·인증정보는 사용하지 않는다. env는 시작 때 읽는 설정이며
ConfigMap 변경만으로 기존 프로세스의 문구가 자동 변경되지 않는다.
startupProbe는 live를 검사한다. 이 최소 앱에는 별도 초기화 작업이 없으며
초기화가 있는 실제 앱은 완료 전 startup 성공을 내지 않도록 설계해야 한다.

## 1. 빌드와 반입 (빌드 PC → 새 VM)

저장소 루트에서 실행한다. Docker가 있는 빌드 PC와 VM은 다를 수 있다.
CPU 아키텍처를 amd64로 맞춘다. 다른 아키텍처에서 만든 이미지는 이 계약과 다르다.

```sh
docker build --platform linux/amd64 --build-arg APP_VERSION=v1 -t study-web:v1 examples/kubernetes/app
docker build --platform linux/amd64 --build-arg APP_VERSION=v2 -t study-web:v2 examples/kubernetes/app
docker image inspect study-web:v1 study-web:v2 --format '{{.Id}}'
docker save -o study-web-images.tar study-web:v1 study-web:v2
sha256sum study-web-images.tar
# tar와 소스를 VM으로 복사하고 해시 비교 후, VM에서
sudo k3s ctr images import study-web-images.tar
sudo k3s crictl images
```

`study-web:v1/v2`는 여기서 **직접 생성한 로컬 태그**이며 공개 registry 이미지가 아니다.
`imagePullPolicy: Never` 때문에 사전 import가 없으면 실행하지 못한다.
`docker.io/library/study-web:v1/v2`로 정규화된 이름을 runtime에서 확인한다.
registry 방식은 검증한 실제 주소/digest와 pull 정책으로 별도 변경한다.

## 2. 대상 확인과 manifest 경로

기존 서비스가 없는 **새 일회용 VM**에만 부록의 고정 버전 설치를 수행한다.
이 README는 사용자 운영 서버를 대상으로 하지 않으며 여기서 설치를 실행하지 않았다.
이후 VM 셸에서:

```sh
k() { sudo k3s kubectl --kubeconfig /etc/rancher/k3s/k3s.yaml "$@"; }
k config current-context
k config view --minify
k get namespace books-lab
# NotFound인 전용 실습 대상만. 기존 namespace면 중단하고 소유자 확인.
k apply -f examples/kubernetes/manifests/namespace.yaml
k apply -f examples/kubernetes/manifests/app.yaml
k rollout status deployment/study-web -n books-lab --timeout=120s
k get pods,svc,endpointslices -n books-lab -o wide
```

Ready Pod, selector app=study-web, ready endpoint와 8080을 기대한다.
실패하면 describe/events/logs/previous로 증거를 얻는다.
requests 100m/64Mi, limits 500m/128Mi는 작은 앱 실습값이다.
08–10의 500m/256Mi는 다른 부하 비교용 모델값이며 운영 권장값이 아니다.

### 실제 Service DNS 요청 (VM의 관리 터미널 → 실행 중인 Pod)

```sh
# k3s가 실제로 만든 Pod 이름 하나를 관측해서 POD_NAME에 설정한 뒤
k exec -n books-lab "$POD_NAME" -c web -- python -c \
  'import urllib.request; print(urllib.request.urlopen("http://study-web.books-lab.svc.cluster.local/").read().decode())'
```

기대: v1 HTML. 이 경로는 Pod → DNS/Service → ready Pod다.
포트 전달은 별도 터널 확인이며 Service 데이터 경로의 대체 검증이 아니다.

```sh
# 별도 VM 터미널에서도 위 k 함수를 정의한 뒤 계속 실행
k port-forward -n books-lab service/study-web 18080:80 --address 127.0.0.1
# 또 다른 VM 터미널에서
curl -f http://127.0.0.1:18080/
curl -f http://127.0.0.1:18080/health/ready
```

### 선택 외부 HTTP·TLS (기존 80/443이 없는 VM만)

```sh
k apply -f examples/kubernetes/manifests/ingress.yaml
k get ingress -n books-lab
# 호출 PC에서 VM_IP에 실제 도달 가능한 VM IP를 지정한 뒤
curl -f --resolve "study.example.test:80:${VM_IP}" http://study.example.test/
```

기본 Traefik/ServiceLB와 방화벽·VM route가 필요하다. 가상 DNS 이름을 실제 공인 DNS로
설정한 것은 아니며 HTTP 성공은 TLS 성공이 아니다. 기존 NGINX가 있으면 기본 설치를 하지 않는다.

TLS를 관측하려면 **VM의 새 임시 작업 폴더**에서 아래 일회용 인증서를 만든다.
실제 자격 증명/사내 인증서를 입력하지 않는다. 키는 공유하거나 Git에 넣지 않는다.
VM에 OpenSSL이 있어야 한다. 아래 명령은 안내이며 제작 환경에서 실행하지 않았다.

```sh
umask 077
openssl req -x509 -newkey rsa:2048 -nodes -days 1 \
  -subj '/CN=study.example.test' -addext 'subjectAltName=DNS:study.example.test' \
  -keyout study-web.key -out study-web.crt
k create secret tls study-web-tls -n books-lab --cert=study-web.crt --key=study-web.key
k patch ingress study-web -n books-lab --type=merge \
  -p '{"spec":{"tls":[{"hosts":["study.example.test"],"secretName":"study-web-tls"}]}}'
# VM 또는 crt만 복사한 호출 PC. 실제 VM_IP를 지정한 뒤
curl -f --cacert study-web.crt --resolve "study.example.test:443:${VM_IP}" https://study.example.test/
```

기대 관측은 이름·유효기간·지정 인증서 신뢰를 만족한 HTTPS 연결과 v1 응답이다.
자기서명 인증서를 이 curl 요청에서만 명시적으로 신뢰하며 공인 CA 또는 브라우저 전체
신뢰 등록이 아니다. `-k`로 검증을 끄지 않는다.

## 3. v2와 명시적 rollback

```sh
k set image deployment/study-web web=study-web:v2 -n books-lab
k rollout status deployment/study-web -n books-lab --timeout=120s
k rollout history deployment/study-web -n books-lab
# 같은 외부 URL 또는 Service DNS 요청으로 v2를 관측한 뒤
k rollout undo deployment/study-web -n books-lab
k rollout status deployment/study-web -n books-lab --timeout=120s
# 같은 URL에서 v1을 재확인
```

port-forward는 Pod 교체로 끊기면 다시 실행한다. rollout 완료는 업무 성공 증거가 아니다.
별도 ConfigMap/DB/PV는 rollback되지 않는다. 파일에는 v1이 남아 다음 apply 때 그 선언을
다시 적용할 수 있으므로 수동 변경과 선언 파일 차이를 기록한다.

## 4. Helm은 대체 실습 경로

manifest 경로의 books-lab을 아래 정리 절차로 삭제하고 NotFound를 확인한 뒤 선택한다.
같은 객체를 두 도구가 동시에 관리하지 않는다. 이미지 tar import는 여전히 필요하다.
VM에 체크섬을 검증한 Helm 4.3.1을 준비하고 해당 VM 전용 kubeconfig만 사용한다.

```sh
# VM 관리 터미널. CLI는 체크섬 검증 후 실행.
h() { sudo env KUBECONFIG=/etc/rancher/k3s/k3s.yaml helm "$@"; }
h version
h lint examples/kubernetes/chart --strict
h template study examples/kubernetes/chart -n books-lab --kube-version 1.35.9
h install study examples/kubernetes/chart -n books-lab --create-namespace --wait --timeout 120s
h upgrade study examples/kubernetes/chart -n books-lab -f examples/kubernetes/chart/values-v2.yaml --wait --timeout 120s
h history study -n books-lab
h rollback study 1 -n books-lab --wait --timeout 120s
h history study -n books-lab
h uninstall study -n books-lab --wait
```

revision 1→2→3과 실제 앱 v1→v2→v1을 따로 관측한다.
chart는 고정 이름 study-web의 단일 release를 전제한다.
ConfigMap checksum annotation이 없어 message 변경만으로 Pod template이 바뀌지 않는다.
`--wait`는 브라우저 업무 확인을 포함하지 않는다. install/upgrade/rollback은 미실행이다.

## 5. 정리와 복원의 경계

```sh
k config current-context
k get all,configmaps,secrets,ingress,pvc -n books-lab
# books-lab 전체가 이번 실습 소유일 때만. 안의 모든 자원을 삭제함.
k delete namespace books-lab --wait=true
k get namespace books-lab
```

NotFound를 확인하고 port-forward는 Ctrl+C로 종료한다. 이번에 만든 키·인증서·tar·이미지는
namespace 삭제로 지워지지 않는다. 본인의 실습 파일만 확인해 정리한다.
기존 서버 제거·기존 PVC 삭제·DB 변경은 하지 않는다.
SQLite/etcd/PV 복원은 위 [운영·복원 리허설] 링크의 별도 VM 절차와 확인표를 사용한다.

## 로컬 검사 재실행

```sh
python3 -m unittest discover -s examples/kubernetes/app -p 'test_*.py'
helm lint examples/kubernetes/chart --strict
helm template study examples/kubernetes/chart -n books-lab --kube-version 1.35.9 > /tmp/study-v1.yaml
helm template study examples/kubernetes/chart -n books-lab --kube-version 1.35.9 -f examples/kubernetes/chart/values-v2.yaml --set ingress.enabled=true > /tmp/study-v2.yaml
python3 examples/kubernetes/verify.py /tmp/study-v1.yaml /tmp/study-v2.yaml
```

PyYAML은 검사 도구 환경의 의존성이며 앱 이미지에는 필요 없다.
검사와 클러스터 실행을 구분해 [검증 기록](../../docs/KUBERNETES-BATCH-G-VERIFICATION.md)에 남긴다.

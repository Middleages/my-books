# 네트워크 교과서 조사·설계안

작성일: 2026-10-17 (KST)
상태: 조사 및 콘텐츠 설계. 이 문서에서는 앱 구현이나 실제 서버 설정을 변경하지 않는다.
가제: **웹 개발자를 위한 네트워크 — 요청의 길을 이해하고 고치기**

## 1. 목표와 대상

웹앱을 개발하고 VM·Docker 서비스를 운영하는 입문자가, 접속 실패를 보고 어느 구간을 확인해야 하는지 판단하도록 돕는다. OSI 계층을 먼저 암기하는 방식 대신 하나의 요청을 반복해서 따라간다. 마지막에는 같은 앱을 k3s로 옮겼을 때 바뀌는 부분을 설명할 수 있어야 한다.

핵심 질문:

- URL의 도메인, IP, 포트, 경로는 각각 누가 사용하는가?
- 방화벽 허용, 프로세스 listen, Docker publish는 어떻게 다른가?
- 443 하나로 여러 웹앱을 서비스하면서 앱별 외부 포트를 줄일 수 있는 이유는?
- SSL verify 실패 시 서버 인증서·체인·클라이언트 신뢰 설정 중 어디를 고쳐야 하는가?
- 호스트에서는 되는데 컨테이너나 Python에서 실패하는 이유는?
- Nginx, Docker 네트워크, k3s Service·Ingress의 역할은 어떻게 연결되는가?

콘텐츠 원칙: 이해에 도움이 되는 곳에만 시각화와 조작을 넣는다. 모든 공식이나 문단에 애니메이션을 강제하지 않는다. 현재 CPU/GPU 교과서는 유지하고 별도 네트워크 책을 추가한다.

## 2. 조사에서 확인한 핵심 구분

### 2.1 앱 포트와 외부 허용 포트

리버스 프록시를 사용해도 백엔드 프로세스가 연결을 받을 주소와 포트는 필요하다. 다만 앱마다 사용자망에 포트를 개방할 필요는 없다. 다음 세 가지는 서로 다르다.

| 구분 | 의미 | 확인할 대상 |
|---|---|---|
| 앱 listen | 프로세스가 자신의 네트워크 공간에서 연결을 받음 | 앱 설정, `ss`, 컨테이너 내부 |
| Docker publish | 호스트 주소:포트에서 컨테이너 포트로 연결을 전달 | Compose ports, docker port |
| 방화벽 허용 | 특정 출발지에서 특정 목적지·프로토콜·포트로 가는 트래픽을 허용 | 네트워크 ACL, 호스트 방화벽 |

예시 주소는 전부 가상이며 실제 회사 주소·서비스명·설정은 공개 저장소에 넣지 않는다.

| 배치 | 접속 경로 예시 | 앱 호스트 포트 판단 |
|---|---|---|
| 같은 VM의 호스트 Nginx + Docker 앱 | 사용자 → VM:443 → 127.0.0.1:18001 → 컨테이너:8000 | loopback에 publish하는 실용적 구성. 18001을 사용자망에 개방할 필요 없음 |
| 같은 Docker 사용자 정의 네트워크의 프록시 + 앱 | 사용자 → 프록시:443 → app:8000 | 앱의 ports 없이 컨테이너 이름으로 연결 가능 |
| 다른 VM의 프록시 + 앱 | 사용자 → 프록시 VM:443 → 앱 VM의 사설 IP:18001 | loopback으로는 원격 접근 불가. 프록시 출발지에서 도달 가능한 주소와 허용 규칙 필요 |

기본 Linux bridge/NAT 구성의 설명이다. host network, direct routing, Docker Desktop은 별도 조건으로 다룬다. `-p 18001:8000`과 `-p 127.0.0.1:18001:8000`의 노출 범위가 다르다. 실제 원격 도달성은 라우팅·방화벽에도 의존한다. Docker 28 미만에는 localhost publish 관련 같은 L2 네트워크 접근 예외가 있으므로 버전 주석을 붙인다. [S1, S2]

**교정할 오해:** “앱에 포트를 썼으니 낭비했다”가 아니라 “외부 접근이 불필요한 앱에 외부 허용 포트를 배정했는가?”를 판단한다. 모든 포트를 무조건 닫거나 publish를 없애는 답을 강요하지 않는다.

### 2.2 도메인 분기의 세 단계

- DNS: 이름을 IP 등 레코드로 해석한다. 일반적인 웹 A/AAAA 조회가 URL 경로나 앱 포트를 분배하는 것은 아니다.
- TLS SNI: HTTPS 연결 설정 중 서버 이름을 전달하여 인증서 선택 등에 사용한다.
- HTTP Host/authority와 path: TLS 종료 후 프록시가 웹앱·경로를 선택할 때 사용한다.

HTTPS에서 Host 헤더만 바꿔도 SNI와 인증서 이름 검증까지 바뀌는 것은 아니다. 학습용 기본 경로는 HTTP/1.1 또는 HTTP/2 over TCP/TLS로 한정하고 HTTP/3·QUIC와 연결 재사용은 확장 노트에 둔다. “모든 요청은 항상 DNS/TCP/TLS부터 새로 시작한다”고 표현하지 않는다. [S3, S4, S10]

### 2.3 인증서는 암호화와 신원 확인을 함께 이해해야 한다

인증서는 공개키와 이름 등의 정보에 발급자가 서명한 것이다. 서버는 인증서에 대응하는 개인키의 소유를 증명하고, 클라이언트는 이름·유효기간·체인·신뢰 기준 등을 검증한다. 실제 애플리케이션 데이터는 협상된 대칭키로 보호한다. TLS 1.3을 “서버 공개키로 세션키를 암호화해서 전송한다”는 구식 RSA 키 교환 그림으로 설명하지 않는다.

서버가 보내는 leaf+intermediate 체인과 클라이언트가 가진 trust anchor를 구분한다. 서버가 임의의 root 인증서를 같이 보냈다는 이유로 클라이언트가 그 root를 신뢰하는 것은 아니다. 개인키는 클라이언트에 배포하지 않는다. [S4, S5, S15]

브라우저·OS curl·Python Requests·컨테이너 앱·프록시 upstream 검증의 신뢰 설정은 같다고 가정하지 않는다. 호스트에서 CA를 설치해도 컨테이너 앱 설정까지 자동 적용되지는 않는다. Requests의 CA bundle 설정과 curl의 설정도 구분한다. [S5, S6, S7]

### 2.4 TLS 연결은 구간별이다

브라우저 → 프록시 HTTPS와 프록시 → 백엔드 HTTPS는 별개의 TLS 연결이다. 각각 클라이언트 역할과 검증 대상이 달라진다. 내부 HTTP 선택은 배치와 보안 정책에 따라 결정하며, VM 간 연결을 무조건 평문으로 제안하지 않는다.

Nginx upstream HTTPS는 `proxy_ssl_verify` 기본값이 off이므로 `proxy_pass https://...`만으로 검증까지 보장된다고 가르치지 않는다. `proxy_ssl_verify`, `proxy_ssl_trusted_certificate`, `proxy_ssl_server_name`, `proxy_ssl_name`의 역할을 함께 다룬다. [S8]

### 2.5 k3s는 네트워크 개념을 없애지 않는다

Pod의 주소·포트, Service의 port/targetPort, ingress controller의 외부 진입점을 구분한다. Ingress는 규칙 리소스이며 실제 트래픽을 처리할 controller가 필요하다. Service는 논리적 접점으로 표현하고, 트래픽이 반드시 독립된 “Service 프로세스”를 지나간다고 그리지 않는다. [S11, S12]

k3s 기본 Traefik LoadBalancer Service는 80/443을 사용하고 ServiceLB는 사용 가능한 hostPort에 의존한다. 기존 호스트 Nginx가 443을 쓰는 VM에서는 진입점의 소유권을 먼저 설계해야 한다. Ingress API는 동결되어 있지만 제거 예정인 것은 아니며, Gateway API를 후속 확장으로 소개한다. 실제 설치 시 k3s 버전과 Traefik chart를 다시 확인한다. [S13]

## 3. 제안 목차

각 장은 10~20분 분량을 목표로 하되 시간은 제작 후 검증한다. 학습 순서는 기초 → HTTPS 진단 → 프록시/컨테이너 → k3s다.

| 장 | 핵심 질문 | 반드시 이해할 개념 | 시각화/실습 |
|---|---|---|---|
| 01 요청의 여행 | 주소를 입력하면 어디로 가나? | URL, DNS, IP, TCP, TLS, HTTP, 응답 | 단계별 요청 추적기; DNS/TCP/TLS/HTTP 실패 위치 선택 |
| 02 주소·포트·경계 | 포트가 열렸다는 건 무슨 뜻인가? | listen, loopback, 0.0.0.0, 출발지, route, firewall | PC/VM/컨테이너 관점을 바꾸며 도달 가능성 예측 |
| 03 HTTP와 도메인 | 같은 IP:443에서 앱은 어떻게 나뉘나? | SNI, Host/authority, path, default server | 두 도메인·한 진입점; 인증서 선택과 HTTP 라우팅 분리 |
| 04 TLS와 인증서 | 누구를 왜 믿는가? | CA, leaf/intermediate/root, SAN, 개인키, 세션키 | 인증서 체인과 클라이언트 신뢰 목록 조립 |
| 05 verify 오류 진단 | 같은 주소가 왜 여기서만 실패하나? | 이름, 시간, 체인, CA bundle, 프록시 | 브라우저/호스트/컨테이너/Python 전환; 실패 원인 찾기 |
| 06 리버스 프록시 | TLS는 어디서 끝나는가? | downstream/upstream, TLS 종료, forwarded headers, 502/504 | 각 구간의 프로토콜과 검증 주체를 바꾸는 지도 |
| 07 Docker 네트워크 | 앱을 외부 포트 없이 연결할 수 있나? | namespace, bridge, ports, expose, service DNS | 호스트 프록시/컨테이너 프록시/원격 VM 세 가지 배치 비교 |
| 08 브라우저만 실패 | curl은 되는데 왜 프론트는 안 되나? | origin, CORS, preflight, mixed content | 서버 응답 성공과 브라우저의 JS 접근 허용을 따로 표시 |
| 09 지연·대역폭·연결 | 느리다는 건 어느 구간이 느린가? | latency, bandwidth, payload, keepalive, timeout | 선택형 도로 비유; 고정 이동시간과 통과량을 별개로 조작 |
| 10 k3s의 내부 연결 | 컨테이너 주소가 바뀌어도 어떻게 찾나? | Pod, Service, selector, EndpointSlice, CoreDNS | Pod 교체/잘못된 selector/targetPort 오류를 구분 |
| 11 k3s 외부 연결 | 443은 누가 맡나? | Traefik, Ingress, ClusterIP/NodePort/LoadBalancer, TLS Secret | 기존 Nginx와 새 진입점의 포트 충돌 및 공존 설계 |
| 12 종합 진단 | 설정을 바꾸기 전에 무엇을 확인할까? | 관측 위치, 구간별 증거, 최소 변경 | DNS·CA·upstream·CORS·Service 장애의 사례별 미션 |

입문 범위에서 제외: BGP 운영, 상세 서브넷 계산 반복, 패킷 헤더 비트 암기, TLS 암호 수학, 서비스 메시, 멀티클러스터 구축. 필요 시 부록으로 확장한다. NAT·서브넷·게이트웨이는 요청 경로를 이해하는 데 필요한 범위로 02/07/10에 배치한다.

## 4. 핵심 인터랙티브 설계

### A. 요청 추적기 — 첫 구현 대상

화면: 위쪽에 URL·요청 출발 위치, 가운데 PC/VM/컨테이너 경계와 경로, 아래 단계별 증거 패널.

조작: `한 단계 진행`, `처음부터`, `정상/실패 사례`, `관측 위치`.

단계: 이름 해석 → 목적지 선택/연결 → TLS 협상·검증 → HTTP 요청 → upstream 연결 → HTTP 응답.

각 단계마다 **현재 아는 정보 / 아직 모르는 정보**를 표시한다. 예를 들어 TCP 연결 성공은 인증서 검증 성공을 뜻하지 않는다. TLS 실패는 HTTP 500을 받은 것과 다르다. DNS 성공은 앱의 정상 동작을 보장하지 않는다.

성공 조건: 사용자가 “프록시까지 도달했지만 upstream 연결에서 실패했다”와 같이 실패 구간과 다음 확인 항목을 고른다. 애니메이션은 일시정지·단계 진행 가능하며 텍스트 모드로 동일 정보를 제공한다.

### B. 인증서 검증 실험실

입력: 접속 이름, 인증서 SAN, 날짜, 제공된 intermediate, 신뢰 root 목록, 실행 환경.

출력: 검증 단계별 성공/실패, 관련 증거, 수정 위치. 복수 원인이 있을 수 있으므로 첫 실패를 해결한 후 다음 실패가 드러날 수 있게 한다.

대표 사례:

| 사례 | 수정할 위치 | 가르칠 포인트 |
|---|---|---|
| 도메인 인증서에 IP로 접속 | 접속 URL/인증서 SAN 설계 | 신뢰 CA 추가만으로 이름 불일치를 해결할 수 없음 |
| 사내 CA가 현재 앱에 없음 | 해당 클라이언트의 신뢰 설정 | 서버 인증서를 무조건 재발급할 문제가 아님 |
| intermediate 누락 | TLS 서버의 체인 제공 설정 | 특정 브라우저 캐시 때문에 다른 환경에서만 드러날 수 있음 |
| 만료/아직 유효하지 않음 | 갱신 또는 실제 시계 오류 확인 | 원인을 확인하지 않고 클라이언트 날짜를 조작하지 않음 |
| 호스트 성공, 컨테이너 실패 | 컨테이너 이미지/앱 CA bundle | trust store 경계를 이해 |
| HTTPS upstream 실패 | 프록시의 upstream 이름·SNI·신뢰 설정 | 브라우저 쪽 인증서와 별개 |

`verify=False`/`-k`는 권장 해결 버튼으로 제공하지 않는다. 심화 설명에서 검증 생략이 무엇을 잃는지 보여준다. 표시하는 오류 문구는 실행 도구와 버전에 따라 달라질 수 있는 예시임을 명시한다.

### C. 포트와 배치 설계 실험실

사용자가 프록시 위치(호스트/같은 Docker 네트워크/다른 VM)를 고르고 앱의 bind와 publish를 조정한다. 세 관측자(사용자 PC, 프록시, 앱 컨테이너)별 연결 가능성을 표시한다.

“외부 포트 사용량 최소화”뿐 아니라 “프록시가 앱에 도달 가능한가”도 검사한다. 다른 VM인데 127.0.0.1로만 publish하면 실패해야 한다. 앱이 컨테이너 안의 loopback에만 bind되면 일반적인 port publish 경로로 접근되지 않는 사례도 포함한다.

설정 변화마다 결과를 예측하게 한 뒤 실행한다. 성공 후 실제 개념과 Compose/Nginx 설정의 대응표를 보여준다. 복잡한 전체 설정 생성기는 후순위다.

### D. k3s 연결 지도

Node·Pod 네트워크 경계를 표시하고 Service 규칙, EndpointSlice 대상, controller 진입점을 구분한다. 앱의 containerPort 선언은 프로세스를 listen시키거나 외부에 공개하는 동작이 아님을 설명한다.

공존 비교: (1) 기존 Nginx를 외부 443 진입점으로 유지하고 명시적으로 노출한 클러스터 진입점으로 전달, (2) Traefik이 외부 443을 소유하도록 이전. 이는 비교 시나리오이며 운영 환경에 바로 적용할 설정은 아니다. 한 VM에서 양쪽이 같은 주소:443을 무조건 공유할 수 있다고 그리지 않는다.

## 5. 진단 도구를 가르치는 방식

명령어 암기보다 “누가, 어디에서, 무엇을 확인하는 명령인가”를 먼저 표시한다. 아래 명령은 작성 예시이며 이 조사에서는 실행하지 않았다. example.test와 192.0.2.10은 예시 이름·주소다.

```sh
# Linux: 현재 위치에서 사용하는 이름 해석 확인
getent ahosts app.example.test

# Linux VM: TCP 리스너 확인 (권한에 따라 프로세스 정보가 제한됨)
ss -ltnp

# Docker 호스트: publish 설정 확인
docker ps --format 'table {{.Names}}\t{{.Ports}}'
docker port app

# HTTP/TLS 관찰: 상세 로그에는 인증정보가 포함될 수 있으므로 공유 전 가림
curl -v --connect-timeout 5 https://app.example.test/

# DNS만 우회하고 URL의 호스트 이름, SNI, 인증서 이름 검증은 유지
curl --resolve app.example.test:443:192.0.2.10 \
  --cacert ./approved-root-ca.pem https://app.example.test/

# TLS 이름 검증과 오류 종료를 명시
openssl s_client -connect 192.0.2.10:443 \
  -servername app.example.test \
  -verify_hostname app.example.test \
  -verify_return_error -CAfile ./approved-root-ca.pem -showcerts </dev/null

# 클러스터 리소스와 실제 대상 확인 (올바른 context/namespace 확인 후)
kubectl get ingress,svc,pods -n demo
kubectl get endpointslices -n demo
```

`--resolve`는 직접 접속 기준 예시다. 사내 HTTP(S)_PROXY가 개입하면 실제 연결 대상·경로가 달라질 수 있으므로 프록시 환경도 확인한다. 정책을 우회하는 옵션을 무조건 붙이지 않는다. 신뢰 CA는 검증된 관리 경로로 받아야 하며, 실패한 서버에서 추출한 인증서를 곧바로 신뢰 root로 설치하지 않는다.

`openssl s_client`의 CONNECTED만으로 검증 성공이라 판단하지 않는다. `-verify_return_error`와 이름 검증 옵션을 명시한다. [S9, S10]

## 6. 실패 표현의 정확성 기준

- DNS 실패, connection refused, timeout, TLS verification, HTTP 404/502/504, CORS는 다른 단계로 표시한다.
- timeout=방화벽, refused=앱 종료처럼 일대일 원인으로 단정하지 않는다. 가능한 원인과 다음 관측을 보여준다.
- CORS는 브라우저 정책이다. 단순 요청은 서버에서 처리된 뒤 JS가 응답을 읽지 못할 수 있고, preflight 실패 시 본 요청을 보내지 않을 수 있다. [S14]
- `0.0.0.0`은 일반적인 서버 bind에서 모든 IPv4 인터페이스를 의미하며 클라이언트의 접속 대상 주소처럼 가르치지 않는다.
- localhost는 실행 주체의 네트워크 공간을 기준으로 설명한다. 같은 Pod 안의 컨테이너는 네트워크 공간을 공유하는 예외를 분명히 한다.
- TLS 인증서 신뢰, 네트워크 접근 허용, 사용자 로그인/권한은 각각 별개다.
- 공개 웹앱 인증서와 k3s API/control-plane 인증서를 같은 것으로 취급하지 않는다.
- 실제 k3s 포트 요구사항은 노드 역할·CNI·HA 여부에 따라 달라진다. 웹 진입 443과 노드 간/관리용 통신은 별도 표로 다룬다. [S16]

## 7. 다음 세션 구현 범위

첫 배치는 전체 12장을 얕게 만드는 대신 **01·02·03의 완성된 본문과 요청 추적기·포트 관점 실험**을 구현한다. TLS는 01의 경로 미리보기와 03의 SNI에서 접하고, 다음 배치 04·05에서 집중한다.

구현 순서:

1. 원격 main 최신 상태와 이 문서를 확인한다.
2. 현재 2개 챕터 전용 구조를 bookId/chapterId 기반 카탈로그와 챕터별 콘텐츠 파일로 분리한다. 기존 링크·읽음 기록을 유지/이관한다.
3. 네트워크 교과서의 개요와 구현 완료된 챕터만 목록에 노출한다. 미작성 내용을 완성된 책으로 표시하지 않는다.
4. 요청 추적기를 정상 사례부터 만들고 3~4개 대표 실패 사례를 추가한다.
5. 포트 실험에 관측 위치, 호스트/컨테이너 경계, loopback/public 바인딩을 넣는다.
6. 계산·판정 로직과 UI를 분리하고 각 사례의 기대 결과를 검증한다.
7. 데스크톱 및 모바일에서 조작·줄바꿈·가로 넘침을 확인한 뒤 배포한다.

권장 파일 구분(제안, 확정 아님):

- `src/content/network/`: 챕터 본문·학습 목표·출처
- `src/simulations/network/model.ts`: 가상 상태/경로 판정
- `src/simulations/network/scenarios.ts`: 정상·실패 사례
- `src/components/network/`: 경로·단계·증거 패널

시각화 구현은 SVG/HTML과 상태 전이를 우선한다. 실제 패킷 캡처나 외부 서버 요청을 요구하지 않아 GitHub Pages만으로 실행 가능하게 한다. 결과 화면에는 “교육용 시뮬레이션”을 표시한다. 실제 네트워크 진단 기능처럼 보이게 만들지 않는다.

## 8. 제작·검증 기준

각 챕터: 실제 질문 → 짧은 설명 → 결과 예측 → 조작 → 원인 해설 → 실제 설정/도구 대응 → 가정·한계 → 확인 문제 → 출처.

- 흰 배경·파란 포인트의 기존 읽기 화면 유지; 복잡한 시각화는 본문 중간에 충분한 폭으로 배치.
- 비유를 쓰면 실제 용어 대응과 생략한 점을 표시. 도로 비유는 차량 수=데이터량, 통과 용량=대역폭으로 사용하되 지연 시간과 혼동하지 않게 설계.
- 드래그만 강제하지 않고 버튼/키보드 대안 제공. 색만으로 성공/실패를 구분하지 않음.
- 모바일에서 큰 토폴로지를 축소해 글자를 못 읽게 하지 않고 단계별 패널로 전환.
- reduced-motion에서는 애니메이션 없이 상태 전이를 제공.
- TLS 검증 판정은 범위를 제한한 교육 모델이며 실제 OpenSSL 검증 엔진을 대체하지 않음. 폐기 확인, name constraints, 교차서명 등의 고급 사례는 별도 범위.
- 기본 단위 테스트: DNS 실패 시 HTTP 단계 미도달, CA 신뢰 추가로 hostname mismatch가 해결되지 않음, 원격 VM에서 loopback 대상 접근 실패, 같은 네트워크의 앱에 불필요한 host publish 없이 접근, Service 대상 없음과 잘못된 포트 구별.
- 기존 컴퓨터 책 링크·읽음 저장·새로고침 동작을 회귀 확인.

## 9. 공식 자료 목록과 사용 범위

확인일: 2026-10-17. 아래 문서들은 지속 갱신되므로 실제 설정 예제를 구현할 때 설치 버전의 문서를 다시 확인한다. 이 설계안은 아래 자료를 참고한 자체 구성 제안이며 원본 책의 목차/설명/그림을 복제하지 않는다.

| ID | 자료 | 사용할 범위 |
|---|---|---|
| S1 | https://docs.docker.com/engine/network/port-publishing/ | publish, bind 주소, 기본 NAT, 버전 예외 |
| S2 | https://docs.docker.com/engine/network/drivers/bridge/ | 사용자 정의 bridge, 컨테이너 연결 |
| S3 | https://nginx.org/en/docs/http/request_processing.html | listen/server_name/Host/location |
| S4 | https://nginx.org/en/docs/http/configuring_https_servers.html | 인증서·개인키, chain, SNI |
| S5 | https://curl.se/docs/sslcerts.html | 클라이언트 검증과 CA store |
| S6 | https://requests.readthedocs.io/en/latest/user/advanced/#ssl-cert-verification | Requests verify, CA bundle, 환경 설정 |
| S7 | https://docs.docker.com/engine/network/ca-certs/ | 호스트와 컨테이너의 CA 구성 |
| S8 | https://nginx.org/en/docs/http/ngx_http_proxy_module.html | upstream TLS와 proxy 헤더 |
| S9 | https://docs.openssl.org/master/man1/openssl-s_client/ | SNI·이름 검증·오류 종료 옵션 |
| S10 | https://curl.se/docs/manpage.html | --resolve, verbose, connect-timeout |
| S11 | https://kubernetes.io/docs/concepts/services-networking/service/ | port/targetPort, Service, EndpointSlice |
| S12 | https://kubernetes.io/docs/concepts/services-networking/ingress/ | Ingress/controller, Gateway API 관계 |
| S13 | https://docs.k3s.io/networking/networking-services | Traefik·ServiceLB·CoreDNS·포트 소유권 |
| S14 | https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS | origin·preflight·브라우저 정책 |
| S15 | https://www.rfc-editor.org/info/rfc9846/ (이전 RFC 8446도 대조) | TLS 1.3의 인증 및 키 교환; 세부 도식 작성 전 해당 절 정독 필요 |
| S16 | https://docs.k3s.io/installation/requirements | 관리/노드 간 포트와 구성별 요구사항 |

현재 실제 회사 네트워크와 서버 설정은 조사하지 않았다. 현재 프록시가 호스트인지 컨테이너인지, VM 간 경로, CA 배포 방식, k3s 설치 버전은 알려진 사실로 단정하지 않는다. 교과서는 여러 배치 선택지를 제공하고 실제 환경 적용은 별도 작업으로 진행한다.

## 10. 다음 세션 시작 문장

> Middleages/my-books의 네트워크 교과서 개발을 이어서 진행하자. 먼저 docs/NETWORK-TEXTBOOK-PLAN.md와 최신 main을 읽어줘. 요청의 경로를 중심으로 01~03장과 요청 추적기·포트 관점 실험부터 구현하자. 기존 컴퓨터 교과서는 유지하고, 비유·애니메이션은 이해에 도움이 되는 곳에만 사용해줘. GitHub Pages 배포와 모바일 검증까지 진행해줘.

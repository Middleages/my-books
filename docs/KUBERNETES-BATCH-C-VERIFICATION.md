# 쿠버네티스 배치 C 검증 기록

작성일: 2026-10-18 (KST). 범위: **05~06만**. 기준 main `7a77239`.

## 선행·범위

AGENTS.md, CONTENT-AUTHORING, HOME-INFORMATION-ARCHITECTURE, 교재 계획·세션 C 전체, LAB-ENVIRONMENT, A·B 검증 기록과 관련 본문·모델·재생 UI를 확인했다.
B 구현 `a8055a683c5a61f2e354f0f4c36b0a302a97971f`, Actions [39092579019](https://github.com/Middleages/my-books/actions/runs/39092579019)는 GitHub REST에서 completed/success 재확인. B의 지정 폭·reduced-motion 미검증을 완료로 바꾸지 않았다.

공개 추가: `#/kubernetes/ingress-tls` (05, readId `kubernetes/ingress-tls`), `#/kubernetes/configuration` (06, readId `kubernetes/configuration`). 소개와 catalog는 01~06만 공개. 기존 30개 장의 id/readId와 읽음 저장 코드는 유지하며 돈 09 포함 병행 작업을 보존한다. 07 이후는 미구현.

## 구현과 모델

- 본문: `IngressTls.mdx`, `Configuration.mdx`.
- UI: `EdgeConfigLabs.tsx`, `edge-config.css`. 기존 FoundationPlayback과 k8 CSS 재사용. 경로는 세로로 배치해 각 구간 라벨·주소·프로토콜을 읽을 수 있게 하고 설정은 API→전달 위치→앱 메모리의 경계로 그린다. 모바일에서 설정 경로가 세로로 재배치된다.
- 모델/타입: `edge-config.mjs`, `edge-config.d.mts`; 테스트 `kubernetes-edge-config.test.mjs`.
- 05: 기본 ServiceLB, 포트 계획 충돌, NGINX 유지 HTTP/HTTPS NodePort, host/path 매칭, 독립 TLS 검증, controller 없음, ready 대상 없음. Service는 논리적 backend 선택이며 실제 프록시 Pod가 아님. controller의 endpoint 직접 연결 가능성을 설명.
- 06: 수정 가능한 ConfigMap/Secret 하나씩, 환경변수·일반 볼륨·subPath, 전파 지연→앱 재읽기→명시적 Pod 교체. 이미지 불변, 기존 프로세스 환경과 앱 메모리 분리. base64 가상 값만 사용.
- 기존 network/operations.mjs의 proxyResult와 certificate-visual.mjs/web.mjs 검토. 외부 TLS가 이미 성공한 proxy 모델과 고정 인증서 도메인은 이번 다중 진입 구성과 달라 원본을 수정하지 않고 제한 모델을 작성. 검증 원칙은 구간별 독립성을 유지한다.
- 주소·인증서 조건·시간 단계는 가상. 실제 암호 검증·클러스터 API 호출·소켓·서버 변경 없음. 실패의 특정 HTTP 코드를 단정하지 않는다.

## 공식 확인·실습

2026-10-18: Kubernetes v1.35 Ingress/ConfigMap/Secret, K3s Networking Services·v1.35 release·Secrets Encryption, Traefik Kubernetes Ingress, NGINX proxy_ssl_verify, Kubernetes Secret good practices 확인. 각 장에 링크·확인일 표시.
K3s 태그 `v1.35.9+k3s1`의 `manifests/traefik.yaml`을 읽어 동봉 차트 패키지 `40.1.5+up40.1.0`, Traefik `3.7.13`을 확인하고 환경 계약을 보완했다. 정적 manifest 확인이며 실제 설치·YAML 배포·클러스터 실습은 **미실행**.

## 실행 검증

Linux / Node v24.19.0 / npm offline cache. `npm ci --offline` 성공.

- 신규 모델 부재로 테스트 실패를 확인한 뒤 구현. 신규 13개 테스트 통과.
- 독립 읽기 전용 리뷰: direct 모드 TLS 관측과 controller 도달 표시가 한 단계 어긋난 Important 발견. 회귀 테스트 실패 확인 후 mode별 도달 단계와 중단 hop을 분리해 수정. no-route에서도 같은 중단 hop 계산으로 controller를 표시. 추가 회귀 포함 **14개 통과**.
- 테스트는 TLS 구간 독립성·미도달 구간·포트 충돌·host/path 경계·ready·controller 실패, env/volume/subPath·재읽기·새 Pod·이미지 불변·가상 base64 복원·재실행 독립성을 확인.
- 전체 `npm test`와 production `npm run build`, `git diff --check`는 최종 통합 후 결과를 아래 기록한다. 단일 번들 500kB 경고는 기존 구조에서 계속 존재하며 이번 범위에서 로딩 구조를 바꾸지 않음.

## 화면 검증 환경

Browser skill을 적용했으나 브라우저 플러그인 js 제어 도구는 노출되지 않음. Python 정적 서버 4173 실행 후 Cloud Browser의 localhost 접속은 `ERR_CONNECTION_REFUSED`. 따라서 로컬 실제 화면 검증은 통과가 아니다. 배포 후 실제 게시 화면을 확인한다.
현재 Cloud Browser 제어 API에 viewport 변경·media emulation·임의 storage 쓰기 기능이 없어 **1440/390/320px, reduced-motion media 실기, 임의 기존 읽음 ID 브라우저 삽입 시험**은 미검증이다. CSS 검토와 기존 reading 모델 테스트는 실기 통과를 대신하지 않는다. Safari·터치·스크린리더도 미검증.

## main·배포·게시

작성 시 대기 중. 확인된 최종 커밋·Actions·자산·조작 결과만 추가 기록한다.

## 다음 배치

D: 07 저장 수명과 08 자원 배치. 이번 C의 배포와 남은 화면 검증 제약을 먼저 확인한다. 실제 스토리지·클러스터 삭제나 기존 서버 변경은 수행하지 않았다.

## 최종 통합·게시 확인

- 최종 전체 `npm test`: **171/171 통과**. `npm run build`: TypeScript·Vite production 성공. `git diff --check` 통과. 기존 30개 readId 보존, 새 ID 두 개만 추가 확인. reading 저장 코드는 무변경.
- main 구현 커밋: `f31b692d9f0fd0d8fe855f04aa18cbb1de9fe80b`. 터미널 push는 인증 수단 부재로 실패해 GitHub connector로 반영. 로컬 검증 tree와 원격 tree `9bfb0e6a04ae9b6fdafa5b815ecc607bccfd4231` 일치. expected SHA + 비강제 갱신으로 병행 변경 보호.
- [Actions 39093669558](https://github.com/Middleages/my-books/actions/runs/39093669558): completed / success. 실제 Pages가 `index-BjMfoNkG.js`를 로드하며 로컬 production 자산과 일치. CSS `index-gUcq0xZn.css`.
- 게시 URL: https://middleages.github.io/my-books/#/kubernetes/ingress-tls , https://middleages.github.io/my-books/#/kubernetes/configuration . 목차 01~06과 순서 확인.
- Cloud Chromium **1363×936**에서 05·06의 DOM 중첩 `p p` 0, 페이지 가로 넘침 없음. 스크린샷으로 TLS 구간 카드·단계 설명·키보드 포커스, 설정 원본/파일/프로세스 경계와 서로 다른 값의 가독성 확인.
- 05: Enter 한 단계 진행, direct TLS 관측 시 controller 도달, NGINX HTTPS NodePort에서 외부 성공/내부 실패와 미도달 backend 확인. 포트 충돌, `/healthier` 불일치, 초기화, 정지 후 단계 유지, 전체 수동 진행 7/7의 재생 disabled 확인. 읽음 표시 → reload → ‘✓ 읽음 · 표시 취소’ 유지 확인 후 테스트 표시 취소. 재생 중 06 이동 후 1/5 초기 상태 유지.
- 06: 일반 볼륨 전파 후 파일 v2/앱 v1, 재읽기 후 앱 v2·같은 Pod 확인. env는 재읽기 후 v1, Pod 교체 후 v2 확인. Secret + subPath는 재읽기 후 demo-only-v1 유지. 전체 단계·값 비교표 펼치기, 조건 변경 시 예측 비움과 1/5 초기화 확인.
- 기존 04: 게시된 새 자산에서 targetPort 9090 → ‘ready 대상은 있지만 그 포트에 앱이 없음’ 회귀 확인. 기존 핵심 프록시·인증서 모델은 전체 자동 테스트에서 통과하며 원본 코드 무변경.
- 지정 폭·reduced-motion media·임의 기존 읽음 ID 브라우저 삽입 시험 등 위의 제한은 그대로 남는다. 실기 범위를 과장하지 않으며 실제 클러스터 실습은 미실행이다.
- 06 추가: 자동 재생이 5/5에서 멈추고 재생·다음 단계 disabled, 시작 시만 읽는 앱의 재읽기 불가 해설 확인. 홈 4권/32장, 컴퓨터 2·네트워크 15·돈 9·쿠버네티스 6장 및 분야 버튼 보존 확인.
- 콘솔 관측에는 chrome-extension metadata 전송 오류가 존재한다. 확인한 로그에서 교재 앱 출처 오류는 발견하지 못했으며, 확장 오류를 앱 오류로 계산하지 않았다.

### 병행 main 추가 통합

최종 기록 반영 직전 돈 10장 구현 `88016c33be0a192f04a6a9f7bc22443020049428`이 main에 추가됨을 확인했다. 그 위로 문서 커밋을 rebase해 전부 보존했고 전체 테스트 **182/182**, production 빌드 성공을 재확인했다. 앱 자산은 통합 결과 `index-sdPawEAJ.js`, `index-CklWS-v3.css`이며 앞의 게시 UI 관측은 C 구현 배포 시점의 자산을 대상으로 한 기록이다. 후속 문서 커밋은 앱 코드를 바꾸지 않는다.

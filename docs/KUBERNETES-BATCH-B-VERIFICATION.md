# 쿠버네티스 배치 B 검증 기록

작성일: 2026-10-18 (KST). 범위: **03~04만**. 기준 main `99915d8fb36953f3d449dafe72ef53d375556fce`.

## 선행 확인과 공개 계약

- AGENTS.md, CONTENT-AUTHORING, HOME-INFORMATION-ARCHITECTURE, KUBERNETES-TEXTBOOK-PLAN, 세션 B 상세 프롬프트, LAB-ENVIRONMENT, 배치 A 검증 및 기존 모델/UI 확인.
- A의 구현 `c34c1af`, 후속 `acc338e30d78a1ce333f78b62cac0326d77a593c`; Actions `39091270495` success를 GitHub API로 재확인. A의 지정 폭·reduced-motion 등 미검증 기록은 유지.
- 공개 추가: `#/kubernetes/desired-state`, readId `kubernetes/desired-state` (03); `#/kubernetes/service-discovery`, readId `kubernetes/service-discovery` (04).
- `DesiredState.mdx`, `ServiceDiscovery.mdx`; `WorkloadLabs.tsx`, `workloads.css`; `workloads.mjs`, `workloads.d.mts`; `kubernetes-workloads.test.mjs`.
- 소개와 catalog의 공개 범위만 01~04로 확장하고 02의 ‘다음 배치’ 안내를 03 링크로 연결. 기존 ID·URL·읽음 저장 키·파서·홈·표지는 유지. 돈 08 포함 기존 27개 장 보존. 통합 시 추가된 돈 09장까지 포함해 공개 총 30개 장.

## 모델과 의사결정

- 03: Deployment → ReplicaSet → Pod 소유 관계, desired/current/ready, Pod 삭제, 컨테이너 재시작, replicas 0~4, 실행 노드 불가, 단일 VM 전체 중단.
- current는 그림의 Pod 객체 수이며 실제 Deployment status 전체 의미를 대신하지 않음. 종료 유예·퇴거 대기·controller/status 반영 시간은 생략.
- 실행 노드 불가 사례는 control plane이 살아 있는 조건으로 분리. VM 전체 중단에서는 API 관측과 조정이 중단되므로 마지막 기록임을 표시. 이 구분을 생략하면 꺼진 VM이 새 Pod를 만드는 것으로 오해할 수 있어 별도 장면을 추가함.
- 04: selector 기반 일반 ClusterIP·TCP/IPv4, Service 80 → targetPort 8080, 앱 listen 8080. EndpointSlice 기록과 ready 전달 후보를 분리. DNS namespace·selector 불일치·준비 실패·targetPort 9090 실패를 구분.
- 기존 네트워크 `cluster.mjs`/`ServiceLab` 재사용 검토: api:8000과 단일 Pod 전용이므로 원본을 변경하지 않고 B 전용 다중 Pod·namespace 모델을 작성. 기존 Playback hook/UI만 재사용.
- IP와 UID는 가상 관측 예시. Pod 교체는 주소/UID를 바꾸고 Service 이름/주소는 유지. 첫 ready 대상 선택은 결정적 교육 규칙이며 실제 분배 순서·기존 연결 이전·무중단 보장 아님.
- headless, publishNotReadyAddresses, terminating/serving 예외, NetworkPolicy·CNI 장애, 상세 probe·외부 진입은 모델 밖. 실제 클러스터와 외부 API에 연결하지 않음.

## 출처와 실습

Kubernetes v1.35 공식 Deployment, ReplicaSet, Pod Lifecycle, Nodes, Service, EndpointSlice, DNS for Services and Pods, Virtual IPs and Service Proxies를 2026-10-18 재확인. 각 본문에 해당 URL과 확인일을 기록함. A의 실습 버전 후보는 변경하지 않음.
본문 kubectl 명령은 읽기 중심 관측 예시이며 **실제 클러스터 실행 미검증**. 앱 이미지·실제 배포 YAML·설치·복구 부록을 추가하지 않았음.

## 실행 검증

제공된 Linux 환경, Node v24.19.0, npm offline cache. Actions는 기존 Node 22 구성 유지.

- `npm ci --offline` 성공.
- 신규 모델 파일 부재로 RED 확인 후 구현: `node --test tests/kubernetes-workloads.test.mjs` 13개 통과.
- Pod UID 교체/재시작 횟수, 스케일 0~4, 불가 노드 Pending, VM의 stale 관측, 프레임 개수 일치, 새 실행 독립성, EndpointSlice 미준비 기록, selector/namespace, DNS·준비·포트 실패 구분, 주소 변경을 검증.
- `npm test`: 147개 통과 (기존 134 + 신규 13).
- `npm run build`: TypeScript·Vite production 성공. 기존 단일 번들 구조의 500kB 경고가 유지됨. 다른 교재 로딩 구조는 이번에 개편하지 않음.
- 기존 catalog id/readId가 모두 남고 새 readId 두 개만 추가됨을 기준 main과 비교. reading.mjs/main 읽음 로직은 무변경. 알 수 없는 읽음 ID는 기존 모델 테스트로 보존 확인.
- `git diff --check` 통과. 최신 main `89ad75f`의 돈 09장을 보존해 rebase하고 catalog import 충돌은 양쪽 추가 항목을 모두 유지. 통합 후 `npm test` **157개 통과**, `npm run build` 성공.

## 독립 코드 리뷰

읽기 전용 reviewer가 모델·본문·UI·호환성을 검토했다. 비기본 selector에서 단계 설명이 카드와 불일치하는 문제를 발견해, 설명이 모델 관측 결과를 포함하도록 수정했다. 먼저 회귀 테스트 실패를 확인한 뒤 수정 후 통과. Service 삭제·재생성 뒤 IP 유지 문장은 안정성 개념을 혼동할 수 있어 중요 설명으로 재분류해 명확히 수정했다. 미해결 코드 리뷰 항목은 없음.

## 화면 검증 제한과 후속 관찰

- Vite preview는 `uv_interface_addresses` 환경 오류로 실패.
- Python 정적 서버 대안은 실행했으나 Cloud Browser에서 127.0.0.1:4173 접근 시 `ERR_CONNECTION_REFUSED`.
- Browser plugin 제어 도구는 노출되지 않았고 Cloud Browser로 실제 게시 UI를 확인할 예정.
- 현재 제공된 브라우저 API에 viewport 크기 변경·media emulation·storage 임의 쓰기 기능이 없으므로 1440/390/320px, reduced-motion media, 임의 기존 ID 삽입 뒤 브라우저 저장 회귀는 아직 미검증. CSS의 모바일 재배치·motion 제거와 파서 테스트를 해당 실기 검증 통과로 계산하지 않음.
- 키보드·재생/정지/초기화·읽음 reload·본문/그림·콘솔·기존 실험 회귀의 실제 게시 결과는 배포 후 아래에 별도 기록.

## 통합·배포

이 기록 작성 시 main 통합·배포·게시 검증은 대기 중. 이후 확인된 커밋·Actions·자산·UI 관찰만 추가한다. 구현과 배포와 실제 클러스터 실습은 별도 상태다.

## 다음 배치

C: 05 외부 요청과 TLS, 06 설정과 비밀정보. 먼저 B의 최종 배포와 남은 화면 검증 항목을 확인한다. B에서 05 이후 장을 노출하거나 구현하지 않음.

## 실제 게시 검증 · 2026-10-18

- 최종 통합 기반: `5c3125caf5a469520fef1128fae453e1d275b976`. 돈 09의 구현·배포 기록까지 보존.
- 구현 main 커밋: `a8055a683c5a61f2e354f0f4c36b0a302a97971f`.
- [GitHub Actions 39092579019](https://github.com/Middleages/my-books/actions/runs/39092579019): completed / success. build·deploy 성공.
- Git push는 터미널 인증 수단 부재로 실패해 GitHub connector를 사용. 검증한 로컬 git tree와 원격 생성 tree `cf7e30e4f259ce6bb8a65a4614a6836f6eb39765`가 동일함을 확인하고 expected SHA + 비강제 갱신으로 main에 반영했다. main 이동 시 새 기준을 확인해 다른 문서 변경을 보존했다.
- 실제 Pages에서 JS `index-CcGAnaA_.js`, CSS `index-DdFMyjBt.css`가 통합 production 출력과 일치.
- 게시 URL: https://middleages.github.io/my-books/#/kubernetes/desired-state 및 https://middleages.github.io/my-books/#/kubernetes/service-discovery . 공개 목차 01~04와 순서 확인.
- Cloud Chromium **1363×936**에서 두 장의 본문·관계 카드·개수·경로·상태·표 렌더를 확인. 각 장 `p p` 0개, 페이지 가로 넘침 없음. 스크린샷으로 Pod/컨테이너 경계, 개수 카드, DNS와 별도 전달 경로의 가독성 확인. 1363px를 1440px 통과로 계산하지 않음.
- 03: Enter로 한 단계 진행, 삭제 후 pod-c UID와 2/2/2 확인; 컨테이너 재시작 후 pod-a UID와 restart 1 확인; replicas 0; 노드 불가에서 대체 Pod Pending; VM 전체 중단의 마지막 관측 경고 확인.
- 03: 초기화·이전 단계·다시 보기·재생/정지 후 다음 관측에서 단계 유지, 전체 재생 후 5/5에서 재생 disabled, 재생 중 04 이동 후 새 실험이 1/5에 유지됨을 확인.
- 03 읽음 표시 → 새로고침 → 읽음 상태 유지 후 테스트 표시를 취소. 홈 0/4 복원 확인. 기존 임의 ID 삽입 시험은 수행하지 않음.
- 04: 교체 중 EndpointSlice 2개/ready 1개, C ready=false·B 전달 주소 확인. 교체 완료, selector 불일치, targetPort 9090, ready 대상 0, other namespace 짧은 이름 실패 후 books-lab 명시 이름으로 복구 확인.
- 04: 조건 변경 시 예측 비움·1/5 초기화, 정적 전체 단계·대상/결과 표 펼치기 확인. 실패 조건에서도 단계 설명과 결과가 일치함.
- 기존 네트워크 13 Service 링크와 selector app=other → ‘대상 없음’ 예측·결과 일치 확인. 기존 모델 코드는 변경하지 않음.
- 홈 4권/30개 챕터, IT 3권/돈 1권, 돈 9장/네트워크 15장/컴퓨터 2장/쿠버네티스 4장 확인. 돈·경제 필터 Enter 조작 확인. 돈 09 최종 충당 단계에서 기본 290만원/580만원 결과 확인(금융 전체 UI 재검증 아님).
- 로그의 오류는 chrome-extension의 metadata 전송 오류이며, 확인한 로그에서 교재 앱 출처 오류는 발견하지 못함. 전 브라우저·전 조건 무오류 보장은 아님.

### 남은 검증과 상태

**03~04 구현·main·Actions·실제 게시 확인 완료.** 지정 **1440/390/320px, reduced-motion media, 임의 기존 읽음 ID의 브라우저 삽입 회귀, Safari/실제 터치/스크린리더 음성**은 제공된 제어 API와 로컬 접근 제한으로 이 세션에서 미검증이다. 모델·CSS 검토와 실제 UI 관측을 구분한다. A의 같은 미검증 항목도 이번에 해소했다고 주장하지 않는다. 실제 클러스터 실습은 미실행.

병행 돈 세션의 후속 문서 `5c483d0`도 보존한다. 이 문서에 기록된 다른 세션의 모바일 회귀는 해당 세션의 증거이며, 여기서 B의 지정 폭 전체를 직접 검증했다는 근거로 대체하지 않았다. 최종 문서 갱신은 앱 실행 자산을 바꾸지 않는다.

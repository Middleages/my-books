# 쿠버네티스 배치 E 검증 기록

작성일: 2026-10-18 (KST). 범위 **09–10만**. 기준 main `0c3480030e78cf610eef9aa882b6b0b88d2709f6`.

## 선행·범위

AGENTS, CONTENT-AUTHORING, HOME-INFORMATION-ARCHITECTURE, 교재 계획·세션 E 전체, LAB-ENVIRONMENT, A–D 검증과 기존 모델·재생 UI 확인. D 후속 `7b937e360f743e900dae4941fcc0cc74f22c0bd4`, Actions [39095231213](https://github.com/Middleages/my-books/actions/runs/39095231213) completed/success를 GitHub API로 재확인했다. 실제 D 게시 08 화면도 관찰했다.

- 09 `#/kubernetes/health-checks`, readId `kubernetes/health-checks`.
- 10 `#/kubernetes/rollout`, readId `kubernetes/rollout`.
- `HealthChecks.mdx`, `Rollout.mdx`; `HealthRolloutLabs.tsx`/`health-rollout.css`; `health-rollout.mjs`/`.d.mts`; `kubernetes-health-rollout.test.mjs`.
- 소개·catalog는 01–10만 공개. 08 마지막 안내만 09/10으로 연결. 기존 ID·읽음 키·읽음 파서·홈·표지와 다른 교재 무변경. 11 이후 미구현.

## 모델·UI 계약과 판단

- probe: startup 성공 전 liveness/readiness 대기, 연속 실패 임계값 1/2/3 비교, 성공 시 실패 횟수 초기화, readiness 제외/회복과 liveness/startup 재시작 분리. 같은 pod-a에 container 번호만 변경. 외부 DB 장애를 liveness에 포함한 경우와 아닌 경우 비교.
- 일반 컨테이너 하나, 추가 readiness gates 없음, restartPolicy=Always, successThreshold=1. 검사·전파가 완료된 관찰 프레임이며 실제 probe 주기·timeout·종료 유예·backoff를 재현하지 않는다. 재시작은 1회까지만 관찰.
- rollout: replicas=2, 정수 maxSurge/maxUnavailable 0/1/2, 둘 다 0은 모델 거절/UI에서 다른 값을 1로 조정해 설명. minReadySeconds=0에서 ready를 available로 사용한다. 초기 목표 v1 → template 변경 v2 → Pending/Running/Ready → 기존 Pod 제거. DB/PVC 상태는 별도 경계.
- 08의 `resourceFrames`를 직접 재사용해 노드 CPU/메모리 requests 적합성을 판단. allocatable 2000m/2048Mi, Pod당 500m/256Mi, 다른 앱 CPU 500m 또는 1000m/메모리512Mi. quota·다른 배치 조건은 정상 가정. 실제 CPU 사용량으로 배치 성공을 판단하지 않는다.
- 명시적 v1 되돌리기 버튼은 마지막 관찰에서 후속 프레임을 추가한다. 자동 rollback 없음. Pod template 복원과 DB/PVC/ConfigMap/Secret 객체 내용 복구를 구분.
- 판단: 비율 입력은 넣지 않고 정수만 구현했다. 입문 범위를 유지하고 비율 반올림을 검증 없이 도입하지 않기 위함. 비율 비교는 이 배치에서 제공하지 않는다.
- 기존 FoundationPlayback 훅과 조작 재사용, 조건 변경 시 단계·재생·예측 초기화. 정지·장 이동 타이머 정리. 동일 프레임으로 카드·횟수·대상·자원 막대·해설 표시. 정적 전체 단계 제공. CSS는 k8e 접두어, 650px 아래 세로 재배치, 기존 reduced-motion 규칙 적용.

## 근거·실습

2026-10-18 Kubernetes v1.35 공식 Probe 개념·임계값, Deployment RollingUpdate/rollback/progress deadline/minReadySeconds, 기존 자원 계약을 확인. Probe 구성 task 페이지는 현재 공식 문서도 대조. 본문에 출처·확인일·실제 시간과 교육 순서의 차이를 표시했다.

YAML은 컨테이너 명세의 설명용 부분이며 전체 Deployment가 아니다. study-web의 /health/live, /health/ready, 8080 계약을 유지하며, startup이 live endpoint를 사용하는 예는 초기화 완료 뒤 성공한다는 앱 조건을 명시. 이미지 v1/v2는 학습 라벨. 실제 클러스터·kubectl·DB·볼륨 변경·이미지 실행은 **미실행**.

## 자동 검증·리뷰

제공 Linux / Node v24.19.0, npm offline cache. npm ci --offline 성공, 기준 198개 테스트 통과.

- 신규 모델 부재 실패 확인 → 구현 후 15개 통과.
- 독립 읽기 전용 리뷰에서 초기 v1 설명인데 목표가 v2인 상태 불일치를 발견. 중요 수정으로 분류, 첫 두 프레임 목표 테스트의 실패(v2 ≠ v1) 확인 → 모델 수정 → 신규 **16개** 통과.
- 리뷰는 48개 전략/시나리오/rollback 조합의 상한·최소 ready·requests·rollback 완료를 확인했고 다른 중요한 문제 없음. 실제 화면 검증과 별개이다.
- 전체 `npm test`: **214/214** 통과. `npm run build`: TypeScript·Vite production 성공. 기존 500kB 번들 경고는 유지.
- Vite SSR + React renderToStaticMarkup으로 두 MDX 렌더. Rollout의 따옴표 강조가 문자로 남는 실패를 관찰해 명시적 strong으로 수정. 두 장 모두 중첩 문단 검사·의도하지 않은 del·리터럴 ** 없음. SSR은 브라우저 배치/조작 검증의 대체가 아니다.
- `git diff --check` 및 기존 catalog readId 보존 검사. 알 수 없는 기존 ID는 기존 reading 모델 테스트로 확인하며 브라우저 삽입과 구분한다.

## 화면 검증 환경과 남은 항목

Browser skill 사용. 연결 브라우저 plugin js 도구는 제공되지 않아 Cloud Browser 사용. Python 정적 서버 4173 실행 후 Cloud Browser의 127.0.0.1 접속은 ERR_CONNECTION_REFUSED.
Cloud Browser API에 viewport 변경·media emulation·임의 localStorage 쓰기 기능이 없다. 따라서 **1440/390/320px·reduced-motion media 실기·알 수 없는 ID 브라우저 주입**은 미검증이다. CSS 검토와 SSR을 실측 통과로 계산하지 않는다. Safari·실제 터치·스크린리더 음성도 미검증.

## main·배포·게시

작성 시 대기 중. 이후 확인한 커밋·Actions·게시 자산·실제 조작만 후속 기록한다. 구현·웹 모델 검증·사이트 배포·실제 클러스터 실습은 서로 다른 상태다.

## 다음 범위

F: 11 Helm, 12 증거 기반 종합 진단. E의 최종 배포 기록과 미검증 환경 제한을 먼저 확인하고, ready·requests·명시적 rollback·외부 데이터 복구 경계를 이어받는다.

## main·배포·실제 게시 확인 (완료)

- 구현 main `2483fc7e7203dc0960de1d563a5fb18e6821d870`. 로컬 검증 tree와 원격 tree `19050c188db0e65a5b1f9b177d40c6268c92244c` 일치. expected SHA를 사용한 비강제 ref 갱신으로 반영했다.
- [Actions 39098731915](https://github.com/Middleages/my-books/actions/runs/39098731915): completed/success. Node 22의 test/build와 Pages deploy 각각 성공.
- 실제 Pages reload의 script `index-DNose7zO.js`가 로컬 production 결과와 일치. CSS `index-BkFH8Alp.css`.
- Cloud Chromium **1363×936** 관측. 09/10 모두 페이지 가로 넘침 없음, 중첩 p 0, 의도하지 않은 del 0, 리터럴 ** 없음. 스크린샷으로 probe 실패 칸·요청 후보 연결·두 ReplicaSet·CPU 요청 막대·포커스 가독성 확인. 지정 폭 통과로 대체하지 않는다.
- 09: Enter 단계 진행, startup 실패 중 다른 검사 대기, readiness 2/2 실패로 요청 대상 0·container-1 재시작0, 회복 후 예측0/관측0 확인. DB 장애 지속 시 생존 의존성 제외는 재시작0, 포함은 container-2/재시작1·여전히 Not Ready 확인.
- 09: 조건 변경 시 1단계 초기화, 다시 보기·재생/정지 확인. startup 실패 임계값1 자동재생은 3/3에서 정지·같은 pod-a의 container-2 확인. 재생 중 10장 이동 후 다음 관측에서도 1/11 유지.
- 10: 초기 목표 v1 → 다음 단계 v2, 정상 마지막 v2 2 ready·v1 0 확인. v2 준비 실패는 v1 2 ready/v2 1 not ready에서 멈춤. 명시적 되돌리기 클릭 직후 이전 프레임 유지 → 다음 단계에 사용자 요청 → v1 2 ready/v2 0으로 완료 확인.
- 10: 노드 requests 여유 없음은 v2 Pending·교체 정지. maxUnavailable=1로 조건 변경 후 교체 완료. 이전 단계, 다시 보기, 재생/즉시 정지 후 다음 관측에서도 1/11 유지, 정적 전체 단계 펼치기 확인.
- 09와 10 각각 읽음 표시 → reload → ‘✓ 읽음 · 표시 취소’ 유지 확인 후 테스트 표시 취소. 알 수 없는 기존 ID 삽입은 실행하지 않았다.
- 기존 08 기본 requests 부족 Pending과 namespace quota 사용 해설 회귀, 기존 04 준비 실패 선택 후 ready 대상0 회귀 확인. 홈 4권/37장, 컴퓨터2·네트워크15·돈10·쿠버네티스10 및 분야 버튼 유지 확인.
- 콘솔 기록에는 chrome-extension metadata 전송 오류가 있었다. 확인한 로그에서 교재 앱 출처 오류는 발견하지 못했으며 확장 오류와 구분한다.

**09–10 구현·main 반영·Actions·실제 게시 핵심 조작 확인 완료.** 지정 1440/390/320px, reduced-motion media 실기, 알 수 없는 ID 브라우저 주입, Safari/터치/스크린리더 및 실제 클러스터는 앞서 적은 대로 미검증/미실행이다.
이 후속 기록 변경은 문서만 바꾸며 앱 자산은 동일하다.

# 쿠버네티스 배치 D 검증 기록

작성일: 2026-10-18 (KST). 범위: **07~08만**. 기준 main `3f07f9fe3d3aa86bd2d92485969751bb98d85825`.

## 선행·범위

AGENTS.md, CONTENT-AUTHORING, HOME-INFORMATION-ARCHITECTURE, 교재 계획·세션 D 전체, LAB-ENVIRONMENT, A~C 검증 기록과 기존 본문·모델·재생 UI 확인.
C 구현 `f31b692d9f0fd0d8fe855f04aa18cbb1de9fe80b`, [Actions 39093669558](https://github.com/Middleages/my-books/actions/runs/39093669558) completed/success를 GitHub REST로 재확인. C 문서의 병행 돈 10장 통합과 미검증 항목도 유지한다.

공개 추가: 07 `#/kubernetes/storage` / readId `kubernetes/storage`, 08 `#/kubernetes/resources` / readId `kubernetes/resources`. 소개·catalog는 01~08만 공개. 09 이후 미구현. 기존 홈·표지·읽음 파서·저장 키 무변경.

## 구현·가정

- `Storage.mdx`, `Resources.mdx`; `DataResourceLabs.tsx`, `data-resources.css`; `storage-resources.mjs`/`.d.mts`; `kubernetes-storage-resources.test.mjs`.
- 기존 FoundationPlayback 훅·조작과 k8 CSS 재사용. 별도 타이머·외부 API 없음. 설정 변경 시 재생·단계·예측 초기화. 정적 전체 단계 설명 제공. 레이아웃은 650px 아래 세로 재배치, reduced-motion에서 효과 제거.
- 저장: writable layer/Pod/emptyDir/PVC/PV/노드 디스크 경계, 컨테이너 재시작·Pod 교체·노드 접근 불가·디스크 영구 상실·PVC 보호/삭제/회수 비교. 단일 replica·노드 local-path·정리 성공 조건, 복제/백업 없음. 객체 참조와 파일·마운트 상태를 분리한다.
- 자원: 생성 전→quota→노드 requests→실사용→throttling/OOM 관측. CPU 2000m/메모리 2048Mi allocatable, requests와 limits·수요·실사용량 별도 막대. 고정 눈금 초과 표기. quota 거절은 Pending과 구분; Pending도 quota 사용. OOM 종료 후 requests는 유지.
- 기존 네트워크 Service 모델은 저장/자원 모델을 제공하지 않으므로 원본 무변경. B의 Pod UID/재시작과 C의 실행 프로세스 경계 개념 유지. 전체 scheduler/cgroup·실제 파일시스템을 재현하지 않는다.

## 공식 근거·실습

2026-10-18 Kubernetes v1.35 Volumes/Persistent Volumes/Resource Management/Resource Quotas/Node Allocatable/Node-pressure Eviction, K3s Storage 및 local-path-provisioner v0.0.37 공식 자료 확인. 본문 링크·확인일과 환경 계약에 기록.
local-path v0.0.37 deploy manifest의 WaitForFirstConsumer/Delete/setup/teardown을 정적 확인했다. 설치·볼륨 삭제·클러스터 삭제·실제 데이터 조작·kubectl 실행은 **미실행**.

## 자동 검증·리뷰

Linux / Node v24.19.0, npm offline cache. `npm ci --offline` 성공. 기준 전체 182개 통과.
신규 모델 부재 실패 확인 후 구현: 15개 통과. 전체 197개 및 production 빌드 성공.
독립 읽기 전용 리뷰에서 삭제 뒤에도 연결 화살표가 남는 표현을 발견했다. 리뷰는 Minor로 분류했으나 작성자는 수명 그림과 모델 일치에 영향을 주는 Important로 판단해 수정: binding/mount 회귀 테스트 실패(기대 bound, 실제 undefined) → 모델 상태·그림 수정 → 신규 16개 및 전체 **198개** 통과. 미해결 리뷰 항목 없음.
`npm run build`: TypeScript·Vite production 성공. 기존 단일 번들의 500kB 경고는 유지. `git diff --check` 통과. 기존 readId 33개 보존, storage/resources 두 개만 추가. 알 수 없는 저장 ID는 기존 reading 모델 테스트로 확인; 브라우저 임의 주입 검증과 구분한다.

## 화면 검증 환경

Browser skill 적용. 브라우저 플러그인 js 제어 도구는 노출되지 않았다. Python 정적 서버 4173을 실행했으나 Cloud Browser의 127.0.0.1 접속은 ERR_CONNECTION_REFUSED.
현재 Cloud Browser API는 viewport 변경·media emulation·임의 storage 쓰기를 제공하지 않는다. **1440/390/320px, reduced-motion media 실기, 임의 저장 ID 브라우저 삽입 회귀는 미검증**이며 CSS 검토·모델 테스트를 실기 통과로 쓰지 않는다. Safari·실제 터치·스크린리더도 미검증. 게시 뒤 가능한 실제 화면·조작·읽음 reload 결과는 아래 기록한다.

## main·배포·게시

작성 시 대기 중. 확인된 커밋·Actions·자산·관측만 후속 기록한다.

## 다음 범위

E: 09 살아 있음과 준비됨, 10 교체하면서 배포하기. D 배포 결과와 화면 검증 제약을 먼저 확인한다. D의 Pending/quota·OOM 후 requests·읽음 ID 의미를 유지한다.

## 반영 직전 병행 작업 통합

main이 돈 교재 전체 점검 `a4438856810c80b22ffbe260e9ba9d320d23619e`로 이동해 첫 expected-SHA 갱신이 반영되지 않았음을 확인했다. 최신 main 위로 rebase하고 해당 본문·UI·전역 CSS·작성 기준을 모두 보존했다. 추가 작성 기준(물결표 취소선·스크롤 표)을 확인했다. 통합 후 전체 **198/198**, production 빌드·diff check 통과. 앱 자산은 `index-CteZwFPH.js`, `index-Bt6budlj.css`.

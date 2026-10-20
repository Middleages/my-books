# 관측 A — 소개·01–02 검증 기록

2026-10-20. 기준 main `05270dda25437a4529186ee0f3036948c352b7fb`, 계획 branch 기준 `15915443af180b473a304fc5433b605c05e0fde5`. **로컬 구현, PR 검증 준비. main/Pages 미반영. 실제 관측 스택 미실행.**

## 범위와 모델

- observability, technology volume5, 소개·signals/pipeline만 등록. 기존 카탈로그·권차·읽음 ID 보존. 자체 장식 SVG 표지 추가.
- 10개 합성 요청: req04/09 실패, req07 900ms, 나머지100ms. 세 신호가 같은 fixture를 읽으며 미수집/null과 관측0·분모0을 구분한다.
- 수집/저장/조회 5단계와 Alloy 수신/Loki 기록/Grafana 조회 실패. backend 기록이 있어도 조회 실패 가능, Loki만 실패해도 다른 경로는 보존.
- 모바일에서는 경로와 화살표 모두 세로 재배치. 정적 단계·예측·키보드·초기화·정지 제공. 실제 제품/프로토콜/디스크/큐/재시도는 구현하지 않는다.

## 로컬 검사와 차단

- 최초 전체 unit은 새 책 registry 미등록으로 scope test1건 실패했다. 등록 후 전체 unit 재실행 통과. 전체961/961 통과. registry의 새 suite test 확장 후 focused17/17 통과.
- TypeScript/Vite production build 통과. 기존 대형 bundle 경고는 남아 있다.
- 로컬 Chromium은 Unix socket 제한으로 시작 실패. 환경 확장 시도도 bwrap read-only mount 오류로 시작하지 못했다. 우회/검사 생략을 통과 처리하지 않는다.
- production CI에서 기존 전체 suite와 새 관측 suite를 실행하고 원본 PNG를 직접 검토할 예정이다. 현재 실제 브라우저/시각 설명력은 미검증이다.

## 후속 게이트

새 registry 첫 등록이므로 변경선택기 수정과 함께 전체 browser suite를 요구한다. 원본 화면·키보드/정지/초기화·동일 모델/경계·분모/읽음 보존을 확인한 뒤에만 게시 담당에게 인계한다. 게시 성공/실제 자산 일치 검사는 직렬 main 창에서 별도 수행한다. 인증은 계획/모델 계약 상태이며 앱은 아직 등록하지 않는다.

GitHub PR 후보 tree 업로드는 관측 A 구현 payload에 대한 명시 공개 승인 부족 사유로 거절됐다. 재시도/우회하지 않았으며 부모에게 구체적 승인 확인을 요청했다. 계획 PR30 반영과는 별개다.

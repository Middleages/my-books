# 관측 A — 소개·01–02 검증 기록

2026-10-20. 기준 main `05270dda25437a4529186ee0f3036948c352b7fb`, 계획 branch 기준 `15915443af180b473a304fc5433b605c05e0fde5`. **PR35 production 후보 검증 중. main/Pages 미반영. 실제 관측 스택 미실행.**

## 범위와 모델

- observability, technology volume5, 소개·signals/pipeline만 등록. 기존 카탈로그·권차·읽음 ID 보존. 자체 장식 SVG 표지 추가.
- 10개 합성 요청: req04/09 실패, req07 900ms, 나머지100ms. 세 신호가 같은 fixture를 읽으며 미수집/null과 관측0·분모0을 구분한다.
- 수집/저장/조회 5단계와 Alloy 수신/Loki 기록/Grafana 조회 실패. backend 기록이 있어도 조회 실패 가능, Loki만 실패해도 다른 경로는 보존.
- 모바일에서는 경로와 화살표 모두 세로 재배치. 정적 단계·예측·키보드·초기화·정지 제공. 실제 제품/프로토콜/디스크/큐/재시도는 구현하지 않는다.

## 로컬 검사와 차단

- 최초 전체 unit은 새 책 registry 미등록으로 scope test1건 실패했다. 등록 후 전체 unit 재실행 통과. 전체961/961 통과. registry의 새 suite test 확장 후 focused17/17 통과.
- TypeScript/Vite production build 통과. 기존 대형 bundle 경고는 남아 있다.
- 로컬 Chromium은 Unix socket 제한으로 시작 실패. 환경 확장 시도도 bwrap read-only mount 오류로 시작하지 못했다. 우회/검사 생략을 통과 처리하지 않는다.
- production CI run `39386742048`의 unit/build 및 관측 browser 통과. Chromium `155.0.8059.39`, 1440/390/320px와 normal/reduced motion, 10개 검사 묶음, 36 PNG, 오류·진단 0건.
- 직접 원본 화면 검토에서 320px 상태 글자 줄바꿈과 조회 실패 시 응답 화살표의 오해 가능성을 발견했다. 모바일 3열 타일과 끊어진 응답 경로 표시로 수정하고 최종 원본 PNG에서 재확인했다. 소개·완료·누락·수집 실패·저장 실패·조회 실패·정적 대안·홈을 검토했다.
- 최종 후보 head `08ba27228efdc36698ee95ef8ae8d092b7e48da1`, source tree `b52b7a4774cd4e79827dbf2a7ddfe71262c9ea29`. PR merge checkout SHA `f10416900baa2d1aef8c8efd86b1750313d0ec4a`도 같은 tree다. 관측 artifact `12248375032`, ZIP SHA256 `4e69830889b54bbb91d22a1bd4f4523495d3a1dd2cf789d29728b8a86e3c4c46`.
- 2026-10-20 07:52:56 UTC: run `39386742048` completed/success. 초기 registry 등록의 넓은 회귀 9개 모두 성공했다.

## 후속 게이트

새 registry 첫 등록이므로 변경선택기 수정과 함께 전체 browser suite를 요구한다. 원본 화면·키보드/정지/초기화·동일 모델/경계·분모/읽음 보존을 확인한 뒤에만 게시 담당에게 인계한다. 게시 성공/실제 자산 일치 검사는 직렬 main 창에서 별도 수행한다. 인증은 계획/모델 계약 상태이며 앱은 아직 등록하지 않는다.

최초 GitHub tree 업로드는 구현 payload의 명시 공개 승인 부족으로 거절됐다. 새 명시 승인 후 미실행 상태를 확인하고 한 번 재시도해 성공했다. PR35에서만 공개했고 main 쓰기는 하지 않았다. 계획 PR30의 5문서는 별도 직렬 창에서 main `05602d24c6946f4e4c1b95f5f926e2e8eb51b316`에 반영됐다.

이 검증 기록 갱신은 로컬에만 보존한다. 실행 중 CI를 취소시키지 않기 위해 새 원격 commit을 만들지 않았다. 넓은 회귀는 완료됐다. 최신 main을 보존하는 직렬 통합과 exact-main/Pages/live 자산 일치 게이트가 필요하다. 인증 본문은 시작하지 않았으며 모델 계약 상태를 유지한다.

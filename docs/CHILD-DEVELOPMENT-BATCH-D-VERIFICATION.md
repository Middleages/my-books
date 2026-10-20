# 육아 D 07–08 구현·검증

2026-10-20. C source/실제 화면 게이트 이후 86bb94c에서 별도 작업트리로 시작. A→B→C→D main 게시 순서 보존.

## 장면 계약
07: 노란 물체의 위치, 보라 그릇의 경계, 초록 가림판의 앞뒤 관계가 바뀐다. 물체가 가려졌다가 다시 보여도 아이가 이해했다고 판정하지 않는다. 세 장면은 독립된 합성 예이며 월령 과제·단계별 훈련이 아니다. 정적 전체 단계와 버튼을 함께 제공한다.
08: 2/4/6/9/12개월의 실제 시간 간격으로 놓인 점 중 하나를 선택하면 같은 원출처 연령의 발췌와 링크가 함께 바뀐다. 영역 필터로 빈 발췌가 나타나도 능력 부재가 아니라 자료 범위의 공백임을 표시한다. 보간·체크박스·점수·실제 아이 입력은 없다.

## 검증 상태
실행 전 계획: 전체 unit/build, 정상 PR CI의 영향 범위 브라우저, 원본 PNG 직접 검토 대기. main/Pages/exact-live는 별도 직렬 게이트다. 미실행을 통과로 기록하지 않는다.

## 완료 결과
- 로컬 unit 1,050개 및 production build 통과. 소스 `7405579c1e8c14c984af632a280ec49d5d3ada02`, tree `2f7d580d64a0ee8b6a8e5cea319f3858322174ae`.
- C 기반 draft PR #47 원격 `aafb7bb3fa95258473a8a95e81a7ef8cab13cc17`은 동일 tree. CI https://github.com/Middleages/my-books/actions/runs/39395565338 성공. build와 영향 범위 book-volumes/child-development production 성공, 다른 7개 suite 미실행, PR deploy/published skipped.
- 보고서 merge SHA `8b51af48f5ee9579e216b37e0b7f12a4d5e6f6b3`, 동일 tree. A–C 포함 97개 검사 통과/실패0, PNG371개, page/console/resource 오류0. Artifact `12251218884`.
- 원본 PNG 직접 검토: 320 hide 1→2, 390 container 1/drop 1, 320 first-year 6 social 빈 발췌, 390 12 all, 1440 4 all. 가림판 앞뒤와 그릇 경계·물체 위치, 비균등 연령 간격과 선택점·원문 링크가 읽히며 320px 잘림 없음.
- source/실제 화면 게이트 완료. main/Pages/exact-live와 임상 감수·K-DST 재사용 확인은 별개 미완료다.


## 최신 여덟 배치 합본 production 확인 — 2026-10-20

[PR72/run39415697607](https://github.com/Middleages/my-books/actions/runs/39415697607), 실제 checkout `8142a5ba33b5ea19e8e1850384afc7ecebb346d9` / tree `943169b8a80ee63cb5d08d3ee58e30d94c447bf5`에서 전체1339 단위/build 및 선택9 production이 성공했다. 이 책은 **97/97 검사·371원본 PNG**, 앱 및 별도 호스트 진단0, clean source다. artifact12261866729 ZIP SHA256 `7351308a1b7805ca2450a3bb5bc6ac5ac933e655f6a0403ac523af2db971840a` 일치. 정확한 공통 JS/CSS 바이트와 선택/생략 범위는 [합본 기록](FOLLOWUP-EIGHT-WAVE-VERIFICATION.md)에 남겼다.

직접 연 새 원본: `320-play-hide-2.png, 1440-play-container-2.png, 320-first-year-2-cognitive.png, 1440-first-year-12-all.png`. 작성자가 네 원본에서 가림·그릇 관계, 원출처 다섯 연령의 간격과 발췌 없음≠능력 없음을 직접 확인했다. 선택 범위에서 새 의미·겹침·잘림 차단점을 찾지 못했다. 모든 371개·모든 정적 표행을 사람이 읽은 것은 아니며 실제 시스템·실기기·스크린리더·임상/금융 판단 검증을 의미하지 않는다. 이 절은 **소스 합본 production** 결과다. 선행 배치의 실제 게시 게이트 이후 main/Pages 및 exact-published 확인은 별도로 수행한다.

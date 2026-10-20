# 육아 3권 A 구현·검증 기록

2026-10-20. 사용자 후속 구현 요청에 따라 별도 작업트리에 소개·01–02를 작성했다. 선행은 첫권 A와 둘째권 A뿐이며 첫권03–12나 둘째권 후속 장은 포함하지 않는다. 현재 부모 분야3권/child-feeding을 고유 등록했다. 실제 최신main 합류는 게시 담당의 후속 창이며 현재main/Pages 미게시다.

## 소스와 모델 경계
- MDX 소개/FeedingMap/Readiness, 독립foundation.mjs+타입,FoundationLabs와 전용CSS.
- 가상의 양 기록은 제시40g, 남음12g 등 월령 없는 계산 예시이다. 권장량·조리법·영양 처방·실제 계량 의무가 아니며 모든 값이 알려졌다고 가정한 예시와 섭취를 모르는 예시를 나눈다. 사라진 양을 자동 섭취로 바꾸지 않고 null과0을 구분한다. 양 보존은 정보 정합성 검사이지 영양 분석이 아니다.
- 음식 이동 그림의◆는 기록 초점 기호이며 음식 조각/크기/질식 안전성 기준이 아니다. 접시·손·입의 관찰은 발달 순서나 먹이는 절차가 아니다.
- 달력 안내와 알려진 관찰/미확인/상담 질문을 분리한다. 어떤 사례도 준비 완료·개인 시작일·위험 점수·영양량을 출력하지 않는다. 조산/의학적 문제는 개별 상담 범위이며 교정연령 자동 변환 없음.
- 실제 아이 데이터 입력·업로드·저장·서버 전송·알레르기 재도전·약물·응급 술기 기능 없음.

## 공식 근거 재확인
2026-10-20 실제 열람:
- CDC 보완식 안내(2026-04-14): 약6개월,4개월 전 도입 비권고,자세·머리/목·먹는 반응/삼킴 준비. 기관 원문의 전 체크항목을 복제하거나 진단 검사로 바꾸지 않았다. 미국 안내를 한국 검진 기준으로 표시하지 않는다.
- WHO 영유아 먹이기(2026-08-04):6개월 보완식의 일반 범위와 배고픔·포만 신호에 반응하는 원칙. 수유 여부에 따른 보호자 점수/개별 건강 예측/통계 위험은 옮기지 않았다.
- CDC 질식 예방(2026-03-11): 식사 자세·보호자 관찰·준비 형태를 양과 별개의 조건으로 이해하는 데 사용했다. 음식의 보편 안전 cm/정량 기준 없음.
- 국내 최신 보관·재가열·분유 수치 지침과 전문 의학/영양 감수는 미확인/미실행으로 남긴다. 해당 후속 장의 수치를 미리 제공하지 않았다.

## 실행 게이트
전체 unit1,051개 통과/실패0, TypeScript/Vite production build 성공. 대형 bundle 경고는 기존 상태로 남아 있다. first registration 전용 child-feeding suite와 전체11 suite 회귀,320/390/850/1440 원본 직접검토는 아직 미실행이다. 로컬 Chromium 환경문제를 재시도하거나 우회하지 않고 정상 독립 PR CI를 사용한다. 소스·화면·main/Pages 게이트를 구분한다.

## 최초 CI와 원본 검토에서 찾은 보강
run39405804034의 전용26검사/53PNG/앱오류0은 통과했다. 그러나 원본850-experience-mouth에서 긴 ‘섭취로 확인한 양’ 라벨이 두 줄이 되어 같은 행의 막대 바닥이 조금 달라짐을 직접 발견했다. 자동검사 통과를 시각 완료로 쓰지 않고 라벨 행 높이를 고정하고 같은 행 막대 기준선 일치 검사를 추가한다.320-meal-unknown,390-meal-empty,1440-meal-known,320-readiness-preterm,390-readiness-posture,1440-readiness-observed,390-home-parenting도 직접 열어 미확인/상담 경계와 권차 보존을 확인했다. 수정본의 최종 소스·화면·전체 회귀는 대기다.

## 수정본 전용 소스·화면 게이트 — 2026-10-20 10:21 UTC

source10bfd420b689d403357e32623e145ce1c975ad04/tree43cfb07440271a470d2a169ff60809344e02b1d3, 실제 checkoutcd478c23e9d25702329304c114c4a461bc43ded7의 tree 일치. run39406529341 build 및 child-feeding26검사·53PNG·page/console/resource 오류0. artifact12257037603 ZIP SHA256 ec8cc80ccf78a6da5366e8a8f6da098f82f2bfa06cd76597a4309b09650378f6.

수정본 원본850-experience-mouth,320-meal-unknown,1440-meal-known,390-readiness-posture를 직접 열어 라벨 줄바꿈 뒤 막대 기준선 정렬·미확인 보존·상담 경계를 재확인했다. 초기8개 원본과 함께 A 전용 소스·실제 화면 게이트를 닫는다. 수정 후 local 전체1,051 unit/build도 성공했다. 전체11-suite 회귀는 현재 진행 중이며 main/Pages/실제 게시와 전문가 감수는 아직 별도 미완료다.

## 최종 전체 회귀 마감 · 2026-10-20 10:40 UTC

CI 39406529341의 build와 production 11 suite(tax, investing, accounting, database, housing, insurance, kubernetes, child-development, child-sleep, book-volumes, child-feeding)가 모두 success로 끝났다. deploy/published는 PR 실행에서 skipped이므로 main/Pages 완료를 뜻하지 않는다. 수정 소스 10bfd420b689d403357e32623e145ce1c975ad04, tree 43cfb07440271a470d2a169ff60809344e02b1d3, 실제 merge checkout cd478c23e9d25702329304c114c4a461bc43ded7을 보존한다. 전용 26검사·53PNG와 앞서 기록한 수정 원본 4개의 직접 검토가 완료됐다. 이로써 A 자체 소스·실제 화면·전체 회귀를 닫고 직렬 게시 창에 인계한다. 의학 전문가 감수는 미실행이다.


## 신규2권 합본의 실제 source 검증 완료

[PR69](https://github.com/Middleages/my-books/pull/69) head `ecf9d67dc5a35876aa6565b8b8cabe4c2c2d79e9`의 실제 checkout `2585e5fb77bfe87876501423026f8d8fd365823c`/tree `0a9636eb65e8514d4ba6abb467c5f0aab603ba1c`, [run39412137368](https://github.com/Middleages/my-books/actions/runs/39412137368)에서 전체1268/build484·14종 production이 성공했다. 먹기 전용26/26·53원본PNG, 오류0이며 수면 안전 보강25e05f1을 포함한 최종 앱이다. 새320/390/850/1440 대표 원본을 작성자·통합 담당자가 직접 확인한 정확한 범위와 ZIP/JS/CSS 증거는 [합본 기록](CHILD-NEW-A-WAVE-VERIFICATION.md)을 따른다. 기존 독립 소스 캡처를 새 합본 캡처로 세지 않았다.

main/Pages·전체14종 실제 게시 검사는 아직 별도 대기이며, 이 결과가 임상·영양 전문가 감수나 실제 아동/제품의 안전성 보증은 아니다. B 이후는 포함하지 않았다.

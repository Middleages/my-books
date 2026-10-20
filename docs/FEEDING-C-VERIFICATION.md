# 먹기 C 05–06 검증 기록

2026-10-20. 먹기 B 마감8b49592 기반 별도 구현. 소개·01–06만 등록하며 다른 책의 카탈로그 행을 수정하지 않는다. 근거와 모델 경계는 FEEDING-C-EVIDENCE.md, FEEDING-C-CONTRACT.md에 기록했다.

- 새 모델3/3 통과: 제시/확인/모름 분리, 강조 불변성, 비변이 프레임, 모든 정보 단계에서 진단·원인·자가 재도전 계획null.
- 브라우저 스크립트 문법과 `git diff --check` 통과.
- 전체 unit/build, 정상 PR CI, 실제 원본 PNG 직접 검토는 진행/대기이며 아직 마감이 아니다.
- 실제 아이 자료 입력·저장·전송 없음. 영양·의학 전문가 감수, 임상 검증, 실제 식품 준비 안전 인증은 미실행이다.
- source·브라우저·main/Pages를 별도 게이트로 유지한다. 후속 통합은 최신 책과 수면 안전 보강을 보존한다.

로컬 검증: 전체 `npm test`1056/1056 통과. `NODE_OPTIONS=--max-old-space-size=2048 npm run build`1회 exit0. 알려진 단위 SSR 개발용 websocket24678 중복 및 build 큰 청크 경고를 별도 보존했다. 실제 앱의 page/console/resource 오류와 직접 시각 검토는 정상 PR CI에서 확인할 예정이다. 추가 로컬 build는 실행하지 않았다.

최초 PR76/run39416563786 build+영향2 production 성공. actual a6c73ce33d74875e8e480f6041834da486faaeb2/tree646b91c0154b128a9a564a33f8178da1238d7e90, clean, 먹기58검사117PNG·page/console/resource 오류0. artifact12261283554 ZIPdc9041f3b5b91566d2cc90fa4a515199396ad8a4144baee3dc343f2659f552af.

원본320-variety-confirmed,1440-variety-highlight,320-allergy-mixed,390-allergy-uncertain,1440-allergy-history를 직접 열었다. 미확인과 진단 경계·응급 안내는 적절하나 desktop 식품군 행의 세로 위치가 날짜별 메모 줄/내용 높이로 달라진다. 날짜 카드에 동일한 메모 공간을 두고 식품군 행을 같은 높이로 정렬하며 자동 좌표 검사를 추가한다. 모바일의 긴 전체 그림과 별개로 첫째/넷째 날 원본을 추가 캡처하여 실제 글자도 직접 검토한다. 보완 후 CI/화면 게이트는 아직 대기다.

## 최종 C source·실제 화면 마감

위 대기 상태는 최초 실행의 이력이다. 2026-10-20 최종 source14ab364edf40941e5970f52e17d8653c3291636e, remote2f2ff77fb50891f44f8c0e69496e02638b7d4e98, treefb2655032a2e54c0e1bac40038af4efbbdeb51c9로 보완했다. PR76/run39417333588의 build와 선택2종(먹기·권차) production 검사가 성공했다. 전체11종 회귀나 main 게시 성공을 의미하지 않는다.

실제 checkout3914811f8cbee06bd2b47bd1b1b0f3ca0677e441의 tree가 위 source와 같고 작업 트리는 clean이다. 먹기58/58검사·133PNG, page/console/resource 오류 및 host 진단0. artifact12261799285의 ZIP SHA256은2925a1b1145b382a8918e3785a20bd65244c73e08fb9795fb749fb15b63a8ec1이다.

최종 원본320-variety-confirmed-day1,390-variety-confirmed-day4,1440-variety-highlight,850-variety-confirmed-day1,320-allergy-uncertain을 직접 열어 검토했다. 첫날 확인/미확인/기록 없음의 구분, 넷째 날 메모 없음 보존, desktop 일곱 날짜의 식품군 행 정렬, 850 및 모바일 글자 가독성을 확인했다. 알레르기 미확인 정보가 원인·진단으로 바뀌지 않으며 119 안내가 기록보다 먼저 보이고 다음 정보 비활성 및 초기화 제어가 잘리지 않는다. 직접 검토한 파일 범위에서 추가 시각 결함을 발견하지 않았다.

C 자체 소스와 실제 production 화면 게이트는 닫았다. main 통합·Pages·실제 게시 회귀는 별도 담당의 순차 창에서 아직 진행 전이다. 전문가 감수 미실행과 실제 아이 자료 금지는 그대로 유지한다.


## 정확한 main d6237bc 실제 게시 마감 — 2026-10-20

[run39431780917](https://github.com/Middleages/my-books/actions/runs/39431780917)의 source `d6237bc2449e0c77894cdabe4f7fab75e6143468`, tree `46848403199c145abfc1d47a1370927a5cd24a1f`에서 전체1390/1390 단위·560 modules build, 선택8종 production과 Pages, 동일 build의 선택8종 published가 모두 성공했다. 이 책의 실제 게시 결과는 **59/59·133원본 PNG**, clean·앱/page/console/resource 오류0이다. 알려진 호스트 기본 `https://middleages.github.io/favicon.ico`의404 한 건은 원래 URL과 함께 별도 진단으로 보존하고 앱 오류를 제외하지 않았다. artifact12269416063 ZIP SHA256 `432ebc4aed5b6951aeca6889b7d03a660f62bb66d9388cc9b2bc208704a7a7d7`를 실제 다운로드와 대조했다. 정확한 JS/CSS 전체 바이트·단일 build 증거는 [합본 기록](FOLLOWUP-SEVEN-WAVE-VERIFICATION.md)의 실제 게시 절을 따른다.

직접 연 대표 5원본 범위: 320-variety-offered-day4,390-variety-confirmed-day1,1440-variety-highlight,320-allergy-uncertain,390-allergy-mixed. 기록 없음과 섭취 미확인·확인의 구별, 식품군 행 정렬,119 도움 안내가 기록보다 앞섬, 원인·확진·자가 재도전 미산출 경계를 확인했고 이 범위에서 새 잘림·겹침·의미 차단점을 발견하지 않았다. native crop은 별도 원본으로 더하지 않았고, 소개 탐색 이미지는 두 선택 제어만을 보여 주므로 소개 전체 검토로 확대하지 않는다. 원본 전수 사람 검토·실기기·스크린리더 음성·실제 외부 서비스/임상 감수의 증거는 아니다.

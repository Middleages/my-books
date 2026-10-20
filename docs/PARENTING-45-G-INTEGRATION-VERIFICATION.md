# 육아 4·5권 G 통합 검증 — 2026-10-20

기준 F local `a4d64e2291fd31172b265008fa7c84e4b6778f79`, remote `a3afc77da8160cec995bef7b02edfbaa4e111f81`, 동일 tree `a8702a7cefd50c09ddc6352cad2d6d2c7c2215d8`. 공개 소스인 감정 G `d82b884cd6e136ced9582fc1aaf8304f4ae9c50b`의 5파일과 안전 G `f9bdd00f4aeaacfee83312f356892016777765d0`의 9파일만 통합한 로컬 후보다.

catalog 전체는 F와 바이트 단위로 동일하게 유지한다. 전체 19권 217장, 감정·안전 각 12장, 기존 217개 readId와 17비대상권 및 공유 인프라를 보존한다. 육아 6권은 포함하지 않는다. 안전 G 검증문서는 기존 공개 blob `211bae74b953982fb3608b5f42e6f564bb8b4712` 그대로이며 이 통합의 실행 기록을 덧붙이지 않는다.

정확 소스·보존 감사 48항목이 통과했다. 기존 selector는 홈·감정·안전 3종을 선택하고 13종을 생략하므로 광역 회귀 통과로 표현하지 않는다.

이 합본의 테스트 입력 tree `295da185320872b13884c2617679f0864b1f9d17`에서 `node --test --test-concurrency=4 tests/*.test.mjs`가 1,542/1,542 통과(fail/cancelled/skipped/todo 0)했고, 이어서 `NODE_OPTIONS=--max-old-space-size=2048 npm run build`가 성공했다. 실행 뒤에는 이 통합문서의 결과 기록만 변경했다.

합본 PR 브라우저·원본 화면·선행 F 게시·최종 영향 3종 회귀·Pages·게시 자산 확인은 별도 대기 중이다. 이 문서는 게시 완료나 임상·전문가 감수·실제 기기 검증을 주장하지 않는다.

# 인증 F/G와 수면 E의 후속 통합 후보

2026-10-20. main `fab953d16092371563f5d1eede54131761cd7123`, tree `1e1183a7cf128998d9bdb5bfb7be7b09700f46df`와 동일한 로컬 기준 tree에서 준비했다. 이 문서는 새 후보의 공개·배포 완료를 의미하지 않는다. 앞선 전체권 파동의 게시 게이트는 [최종 일곱 배치](FINAL-BOOKS-SEVEN-WAVE-VERIFICATION.md)와 별도로 exact-main run39447024303에서 수행 중이다.

## 범위와 보존

- 인증 F11–12: 공개 PR79 head `e284644ac07b41203d0a45455cf89ca0aa1fc26b`, 검증 tree `8b1e052650a0650f86960dd0b9922a0a5c8509c2`의 앱·모델·브라우저 검증기를 보존한다. 로컬 F 마감 문서 `c18b0185b5535dc9f24ec3423966caf625ebb0d4`를 합친다.
- 인증 G: 로컬 `d04b58c6975ad6e8f733b9789f37637801fc307e`의 검증 문서와 examples/authentication 교육용 모델 재생 자료만 추가한다. 실제 SSO·IdP·보안 제품·계정은 연결하지 않았다.
- 수면 E09–10: 공개 PR88 head `d68bf3c9094b569e2037c03deec623e7d486a07a`, tree `a47fdf2539f0a6186f4d19ec9d3376e00113f447`와 같은 해당 책 소스다. 선행 D 마감 문서는 이미 같아 재적용하지 않았다.
- 카탈로그는 인증과 수면의 import·장·책 행만 바꾼다. 다른 책·readId·공유 workflow·검증기 선택 규칙을 보존했다. 전체17권187장. 수면 F/G, 먹기 E 이후 및 신규 육아4–6 등록은 이 후보에 포함하지 않는다.
- 두 책의 소유 본문·컴포넌트·모델·검증기66파일을 각각 위 최종 검증 소스와 바이트 대조했다. 비대상 카탈로그 행과 다른 책의 추적 소스는 그대로다.

## 선행 독립 검증

인증 F run39418615630의 실제 checkout `b54ca72cdb7bf89430381e2f2e294babd4ddef1e`에서 전체1107 unit/build, 인증51검사282PNG, clean/진단0. 대표6원본 직접 검토 기록은 [F 검증](AUTHENTICATION-BATCH-F-VERIFICATION.md)에 있다. G는 앱 변경 없이 순수 모델 CLI만 실행했다. [G 검증](AUTHENTICATION-BATCH-G-VERIFICATION.md)에서 실제 SSO 미실행을 구분한다.

수면 E run39431993841의 전체1059 unit/build, 수면98검사205PNG, 오류0과 직접 원본 검토는 [E 검증](SLEEP-E-VERIFICATION.md)에 있다. 이는 임상 감수나 실제 가족에게 적용한 결과가 아니다.

## 새 합본 게이트

새 로컬 합본에서 `NODE_OPTIONS=--max-old-space-size=2048 node --test --test-concurrency=4 tests/*.test.mjs` 전체1481/1481, 실패·취소·skip0을 통과했다. 동일 소스의 NODE2048 TypeScript/Vite build도 606 modules 변환 후 성공했다. 자산은 index-OGUM6WBm.js 및 index-CzRXHb06.css다. PR Chromium·정확 main production·Pages·published 및 새 대표 원본 검토도 아직 이 후보에서 수행하지 않았다. 기존 선택기가 examples/authentication을 unknown 경로로 처리하면 등록14종 전체를 그대로 검증하고 실제 생략 목록을 남긴다.

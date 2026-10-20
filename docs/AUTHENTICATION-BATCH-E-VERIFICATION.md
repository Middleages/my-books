# 인증 E · 수명·철회와 앱 구조

2026-10-20. 인증 D의 마감 소스를 기반으로09renewal-and-logout·10react-fastapi를 별도 stacked 후보로 구현한다. 모델 계약은 `AUTHENTICATION-BATCH-E-MODEL-CONTRACT.md`다.

access/refresh/app/IdP 수명, 정확한 만료 경계, 회전과 이전 refresh 재사용, 한 번 갱신 실패 뒤 중지, 로컬 logout과 API 철회 정책을 비교한다. API 판정은 다른 서명/주체/객체 검사가 통과했다고 가정한 수명·철회 한정이다. SPA/BFF는 저장 경계·API 경로·남는 XSS/CSRF·운영 책임을 비교하며 안전 점수를 만들지 않는다.

모델6테스트 통과. 전체unit/build·productionbrowser·직접PNG는 아직 대기다. 영향 책01–10와 홈/읽음/권차,1440/390/320,정적/키보드/초기화/normal·reduced motion을 검증한다. 실제 token/계정/세션/IdP/SSO 연결, 실제 공격 요청, 실제 운영 변경은 하지 않았다. main 통합·Pages 게시 검증은 별도다.

## 소스 검증 마감 · 2026-10-20 11:41 UTC

위 대기는 작성 당시 상태다. PR73의 head `fa59bba87dc344c4d430dd96eda992226e3f917c`, tree `56d9fd3bb7fef6887a5d917da1ef7aa062befc18`에서 run `39415948362`의 전체 1,098 unit, TypeScript/Vite build, 인증 production browser 및 권차 검사가 성공했다. 실제 checkout은 `e483b26d55254e10c1fee2fcc2c567829f344017`이며 동일 tree·clean 상태다.

인증 report는 43개 검사·231 PNG·진단/오류 0이다. artifact `12261247826` ZIP SHA-256은 `51d98d1bd91858da4a54ff791f2af70f033645d8b97aaffd7fa3134e773fe94c`다. 1440-lifecycle-rotated, 1440-architecture-bff, 320-lifecycle-concurrent, 390-lifecycle-logout-online, 320-architecture-spa-xss, 390-architecture-bff-csrf 원본을 직접 열었다. 모바일 핵심 도식은 원본 픽셀 분할로 검토했다. 회전 후 발급 6분 시작·11/20분 만료, refresh 철회와 기존 access 시간 유효의 공존, 추가 조회 시 거절, 독립 앱/IdP 수명, BFF/SPA 경계와 남는 위험, 인접 제어·축·텍스트에 선택 범위의 잘림/겹침이 없었다.

01–08 회귀와 키보드·정적 표·초기화·재생/정지·normal/reduced motion·폭 검사는 report로 대조했다. 모든 PNG의 수동 검토를 뜻하지 않는다. 실제 SSO/토큰/서버 실행은 여전히 미실행이며 main 통합·Pages 게시 완료가 아니다.

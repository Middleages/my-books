# 인증 E · 수명·철회와 앱 구조

2026-10-20. 인증 D의 마감 소스를 기반으로09renewal-and-logout·10react-fastapi를 별도 stacked 후보로 구현한다. 모델 계약은 `AUTHENTICATION-BATCH-E-MODEL-CONTRACT.md`다.

access/refresh/app/IdP 수명, 정확한 만료 경계, 회전과 이전 refresh 재사용, 한 번 갱신 실패 뒤 중지, 로컬 logout과 API 철회 정책을 비교한다. API 판정은 다른 서명/주체/객체 검사가 통과했다고 가정한 수명·철회 한정이다. SPA/BFF는 저장 경계·API 경로·남는 XSS/CSRF·운영 책임을 비교하며 안전 점수를 만들지 않는다.

모델6테스트 통과. 전체unit/build·productionbrowser·직접PNG는 아직 대기다. 영향 책01–10와 홈/읽음/권차,1440/390/320,정적/키보드/초기화/normal·reduced motion을 검증한다. 실제 token/계정/세션/IdP/SSO 연결, 실제 공격 요청, 실제 운영 변경은 하지 않았다. main 통합·Pages 게시 검증은 별도다.

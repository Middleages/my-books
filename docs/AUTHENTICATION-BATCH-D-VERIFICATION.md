# 인증 D · SSO 세션과 역할·객체 인가

2026-10-20. 인증 C 소스를 선행 의존으로07sso-and-sessions·08rbac-and-object-access를 별도 후보에 구현한다. 실제 로그인·계정·쿠키·토큰·권한 저장소를 만들거나 변경하지 않는다.

모델 계약은 `AUTHENTICATION-BATCH-D-MODEL-CONTRACT.md`다. SSO는 IdP·A·B 세션을 독립 상태로 유지하고 B의 로그인 왕복과 재입력을 구별한다. 전체 logout 연동이 없는 합성 정책임을 명시한다. IdP가 만료돼 재확인이 필요한 사례는 최종 단계에서 가상 재확인 성공을 가정했다고 표시한다.

인가 모델은 viewer/editor/admin의 역할표와 tenant·소유 조건을 독립 검사한다. 다른 tenant는 admin도 거절하고 unknown 역할/행동도 기본 거절한다. 현재 viewer 정책과 예전 editor claim을 비교하되 현재 서버 조회를 실제 판정으로, claim만 사용한 결과를 점선 반례로 구별한다. UI 메뉴 숨김은 서버 판정을 바꾸지 않는다.

모델6테스트가 세션 범위·재입력·역할×행동×tenant×owner 조합·unknown·오래된 claim을 확인했다. 전체 unit 및 정확한 소스의 build·production browser·직접 원본 PNG 게이트는 아직 미완료다. 영향 책01–08의1440/390/320·정적·키보드·초기화·normal/reduced motion과 book-volumes를 확인한다.

공식 OIDC Session Management·RP-Initiated Logout·OWASP Authorization 자료를2026-10-20 확인했다. 특정 제품의 기본 정책이나 실제 보안 검증 결과로 합성 상태를 제시하지 않는다. main 통합·실제 Pages 게시 완료는 별도 게이트다.

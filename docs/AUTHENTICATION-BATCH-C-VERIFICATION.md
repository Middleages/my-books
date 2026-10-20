# 인증 C · OAuth 위임과 OIDC code 왕복

2026-10-20. 인증 B5358ff7을 선행 의존으로 05oauth-delegation·06oidc-code-flow를 별도 작업 트리에서 구현한다. 공개 source/production 검증과 main 통합·실제 Pages 게시를 구별한다. 실제 계정·비밀번호·토큰·쿠키·SSO 연결 없이 합성 이름표만 사용한다.

OAuth는 네 논리 역할, scope·audience·객체 정책의 독립 검사, 위임 미허용과 앱 로그인 별도 경계를 보여 준다. OIDC는 BFF 구조로 고정하고 브라우저 연결·서버 교환·내부 검증을 다른 선과 설명으로 구별한다. 여섯 단계에서 redirect/state/PKCE/code 재사용/nonce/ID Token 검증의 실패 위치를 독립 비교한다. token 응답 전·후와 앱 세션 생성은 별도 상태다. IdP 사용자 확인과 필요한 BFF 클라이언트 인증은 정상으로 고정하고 생략 범위를 화면에 표시한다.

모델6테스트는 역할·scope·객체·대상·grant, 조기 세션 금지, 각 거래 검증 실패, 정적 재현을 확인했다. 공용 재생기는 기본4단계를 유지하면서 OIDC6단계를 지원하도록 확장했으므로 기존 A/B까지 영향 책 browser 회귀가 필요하다. 1440/390/320, 정적 펼침·키보드·초기화·정지·reduced motion을 검증기에 추가했다. 새 본문과 모형은 RFC6749·RFC7636·RFC9700·OIDC Core 공식 자료를 확인해 작성했다.

현재 로컬 전체 테스트와 빌드를 수행 중이며 production/직접 원본 PNG 게이트는 아직 미완료다. 실제 암호 검증·난수·HTTP·쿠키·키 조회·IdP 설정·운영 보안 검증은 실행하지 않았다.

전체1085 unit tests는 통과했다. 로컬 build는 공용 자원 경합 때문에 TypeScript 단계에서 중단했으므로 성공으로 기록하지 않는다. 완성 소스의 build·production browser·직접 원본 검토는 별도 CI에서 확인한다. 이 기록은 검증 전 후보 상태다.

첫 CI39407347681은 전체1085테스트/build/인증27검사150PNG/오류0 및 book-volumes를 통과했다. 직접1440 OAuth 원본에서 발급 서버의 타원 테두리가 내부 문장에 너무 가까워진 것을 확인해 모서리 둥근 서버 상자로 교정한다. 모바일 scope·객체 거절과 OIDC PKCE·nonce 실패 후 세션 미생성은 명확했지만, 교정 후 최종 원본을 다시 확인할 때까지 소스 게이트는 미완료로 둔다.

## 수정 후 소스 게이트 마감

2026-10-20 run39407882997 completed/success. PR62 head `b404549632f4ee577a56ab0329a67bd43e74ca76`, tree `e792f1a4f8931cb66fce4edf9fd811585ee3c4c7`, 실제 checkout `7946ec0c5527c5d3a6e0ae0210bd2ccd72a8621f`의 tree 일치. 전체1085테스트/build, 인증27검사150PNG·오류0, book-volumes 통과. Chromium155.0.8059.39. artifact12257644279 ZIP SHA256 `8d192e0793644e78eb7c2d9e2a76c3183f199c4fca50d0192caf2062011e9721`.

최종 원본1440-delegation-scope-denied,1440-oidc-normal,320-delegation-object-denied,390-oidc-nonce,320-session-expired,390-tokens-expired를 직접 열어 핵심 영역을 검토했다. 발급 서버 문장이 테두리 안에 들어오고, 모바일 위임 범위/객체 거절 및 nonce 실패 후 세션 미생성이 구별된다. OIDC6단계와 기존A/B4단계 제어가 유지되고 token 원문을 브라우저가 보관하지 않는 선택 구조가 명시된다. 캡처 생성만으로 통과를 판단하지 않았다.

이 마감은 B 선행 소스의 production 검사다. 최신 main 통합·Pages 실제 게시·운영 SSO 검증은 별도이며 이 기록은 해당 완료를 주장하지 않는다.

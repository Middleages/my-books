# 인증 F 검증

2026-10-20. E cef8bd48 마감 후 11 closed-network-trust·12 auth-diagnosis를 구현했다. 순수 모델·계약·MDX·반응형 시각화·브라우저 검증 분기를 추가하고 실제 chapter12 및 future12 범위를 일치시켰다. 기존 URL/readId/storage와 다른 책은 보존한다.

모델7개와 기존수명7개 검사가 통과했다. 전체unit/TypeScript/build·production browser·직접 원본 PNG는 대기다. 별도 장면은 브라우저/BFF 신뢰 경로 분리와 안전한 기록 허용/제외 영역이다. 앞선 tokenFrame/oidcFrame/authorizationFrame을 실제 호출해 진단 예시를 구성한다. 알려지지 않은 gate는 unknown으로 남긴다.

실제 DNS/TLS/키 회전/SSO·토큰·공격·운영 변경은 미실행이며 main 통합/Pages 검증은 별도다. G 전체권 편집·실습 설계는 F 소스 게이트 뒤 진행한다.

## 소스 게이트 마감 · 2026-10-20 12:04 UTC

최초 자동 게이트 통과 뒤 원본 화면에서 의미를 더 분명히 했다. API 경계를 ‘검증·인가’로 구분했고, CA/DNS 실패 뒤 키 설명도 미확인으로 유지했다. 여섯 경계에 순번을 붙였고, state 불일치 기록을 공격 확정인 것처럼 보이지 않도록 reasonCategory를 state-mismatch로 바꿨다. discovery 접근과 JWKS 갱신은 별도 표시다. 해당 회귀 assertion을 추가했다.

최종 PR79 head `e284644ac07b41203d0a45455cf89ca0aa1fc26b`, tree `8b1e052650a0650f86960dd0b9922a0a5c8509c2`, 로컬 f8bc5cd176e99dc4d91b8ffd25f3b73e860f1cec 기준 run `39418615630`은 전체1,107 unit·TypeScript/Vite build·인증 production 및 권차 검사를 통과했다. 실제 checkout `b54ca72cdb7bf89430381e2f2e294babd4ddef1e`는 동일 tree·clean이다.

인증 report는 51검사·282PNG·진단/오류0이다. artifact `12262217275` ZIP SHA-256 `93e85a4adc71bc9c86bdd257be117f226bfe31e368b8e0f66cc9523d4c83fabe`를 확인했다. 최종 원본 1440-trust-ca, 1440-auth-diagnosis-audience, 320-trust-key, 390-trust-clock, 320-auth-diagnosis-csrf, 390-auth-diagnosis-loop를 직접 다시 열었다. 모바일은 원본 픽셀 y1800–3600 분할로 핵심 도식을 읽었다. 독립 신뢰 경로·키/시간 실패·미확인·관측 범주만 남기는 로그·제외 영역·인접 제어가 구분되며 선택 범위의 잘림/겹침이 없었다. 전체 PNG 수동 검토를 뜻하지 않는다.

소개/01–12 ID 순서·13MDX import·상대 링크·각 장 출처/확인 문제를 추가 대조했다. 이전01–10 회귀·정적·키보드·초기화·normal/reduced motion은 자동 report에서 확인했다. 실제 IdP/SSO/키/인증서/계정/네트워크 변경은 미실행이며 main 통합·Pages 완료와 별개다.

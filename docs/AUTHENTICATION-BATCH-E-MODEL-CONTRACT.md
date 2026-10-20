# 인증 E 모델 계약 · 수명과 저장 경계

2026-10-20. 인증 D의 source/production/직접 PNG 게이트를 선행으로09renewal-and-logout·10react-fastapi를 준비한다. 최신 main a2a0177의 공통 지침을 확인하며 병행 변경은 별도 통합 담당자가 보존한다. 실제 자격 증명·쿠키·토큰·계정·네트워크 요청은 만들지 않는다.

## 수명 실험

access A1의 exp5, refresh family의 만료20, 앱 세션 만료15, IdP 세션 만료30을 서로 다른 수명띠로 표시한다. 단위는 가상 분, 허용 clock skew는0이며 now>=exp는 만료다. 그림의 R1/R2는 비밀값이 아닌 상태 ID다. 모든 token의 서명/issuer/audience/객체 권한은 별도 검사를 통과한 합성 가정이며 여기서는 수명·철회 여부만 비교한다.

정상 회전: 시각0,4,5,6,7,11을 따라간다.5에서A1만 만료,6에서 한 번 refresh를 성공해A2(exp11)/R2를 받으며R1은 사용 종료다. 실패 사례에서는6에서 한 번 거절하고 재인증 안내로 멈춘다. 두 탭 사례는 첫 교환 성공 뒤7에서 이전R1 재사용을 감지해 family를 취소하는 엄격 정책이다. 공격자와 동시 탭을 알아맞힌다고 주장하지 않는다. 무조건 재시도·무한 루프를 하지 않는다.

로그아웃 사례는0,1,2,3,5,6분이다.1에서 앱 세션과 refresh family를 지우되 IdP 세션은 유지한다. 기존A1의 수명은5까지 남는다. API 정책을 ‘만료만 확인’과 ‘추가 철회 상태 확인’으로 바꾸면 동일A1의 결과가 달라진다. 서명된 JWT라는 형식 자체가 즉시 철회 조회를 만들어 주지는 않는다. 동시 탭 family취소 뒤A2도 같은 두 정책을 비교한다. 온라인 확인은 교육상 즉시 최신 철회를 반영한다고 가정하며 캐시·전파 지연은 생략한다.

## 구조 실험

SPA public client와 BFF confidential client를 별도 경계 지도로 비교한다. 둘 다 code+PKCE/OIDC 결과 검증·서버 객체 인가는 필요하다. BFF는 browser의HttpOnly session cookie와 서버의access/refresh/client 인증 수단을 나누며 API 요청은 BFF를 거친다. SPA는 browser memory에access가 있고 client secret을 둘 수 없다. 실제 저장 기능은 없으며 localStorage는 읽음 표시만 기존대로 유지한다.

단계는 구조→로그인 책임→API 호출→위험·운영 책임 비교다. XSS 조건에서 BFF는 JS의 직접 token 읽기를 줄여도 같은 origin의 요청 대행 위험이 남고, SPA는 메모리 token도 완전한 방어가 아니다. CSRF 조건에서는 cookie 경계와 서버의 CSRF 방어 책임을 강조하되 실제 브라우저의 전송/성공 판정을 생성하지 않는다. 안전 점수·제품 순위는 만들지 않는다. 두 구조 모두 서버 측 인가를 유지하며, 서버 운영/세션/갱신·보안 검토 책임을 비교한다.

공식 근거(2026-10-20): RFC9700 §4.14, RFC7009, IETF browser-based-apps draft27(확정 RFC가 아닌 진행 문서), FastAPI OAuth2 password JWT tutorial. 튜토리얼을 OIDC SSO 통합 완성본으로 부르지 않으며 password/implicit을 신규 SSO의 기본으로 추천하지 않는다.

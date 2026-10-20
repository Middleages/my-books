# 인증 B · 브라우저 경계와 토큰 신뢰

2026-10-20 작성. 검증된 인증 A의 별도 작업트리에서03 browser-boundaries·04 tokens-and-jwt를 구현한다. A 이후 통합 대상이며 main 직접 쓰기·실제 로그인/쿠키/SSO 실행은 없다.

## 모델과 시각 계약

browserFrame은 이름 붙인8 fixture를 사용한다. 같은 origin·교차 origin 같은 site·교차 site fetch·credentials 기본값·Secure HTTP·Path 불일치·preflight 거절을 구별한다. cookieEligible과 실제 cookieSent, requestSent/serverHandled/jsReadable은 별도 상태다. 단계 전 결과는 null로 남긴다. 기본 CORS 거절은 preflight 없는 GET 처리 뒤 JS 읽기만 실패한다. JSON POST는 OPTIONS 거절 뒤 실제 요청 미전송이다. HttpOnly 직접 읽기는 페이지 host/path/Secure 범위도 맞아야 가능하며 요청 첨부를 바꾸지 않는다.

점선 site·실선 origin 주소 구역, 쿠키 조건 띠, 전송→처리→읽기의 단계선을 분리한다. 같은 origin/site 비교 구역은 주소 비교 도식이지 물리 네트워크 배치가 아니다. 모바일은 축소하지 않고 세로 배치, 정적 모든 사례 결과표를 제공한다.

tokenFrame은 실제 JWT·키·암호 연산 없이8 fixture로 구조 읽기/허용 algorithm/서명/issuer/audience/time/purpose를 구별한다. malformed는 구조 실패 뒤 나머지를 미검사로 남긴다. valid도 자원 인가 완료를 주장하지 않는다. 서명된 JWS 도식에 한정하며 암호화된 JWE·키 회전·clock skew·nbf 등 생략을 명시한다.

## 공식 출처 및 검증 경계

MDN CORS·Set-Cookie, OWASP CSRF, RFC8725, OIDC Core를2026-10-20에 열어 확인했다. 본문 링크 포함. 공개 합성 인물/주소/표식만 있고 실제 credentials 입력·출력·네트워크 요청은 없다.

모델4개 테스트 작성. 전체 unit/build·production browser·직접 원본PNG·main/Pages/live는 각 게이트 결과를 후속 기록한다. 현재 후속 게이트 성공은 아직 주장하지 않는다.

첫 로컬 구현 `515ffa8`에서 전체1079/1079·TypeScript/Vite build·verifier 문법·diff 검사 통과. 인증 A 최종 검증 branch를 기준으로 별도 stacked draft PR을 준비하며 production와 직접 PNG 검토는 아직 대기한다. 이 단계의 성공은 실제 브라우저 쿠키 보안 검증을 뜻하지 않는다.

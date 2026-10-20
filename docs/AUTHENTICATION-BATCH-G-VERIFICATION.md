# 인증 G · 전체권 편집과 선택 실습 설계

2026-10-20. F의 source/production/직접 원본 게이트를 닫은 c18b018에서 독립 작업했다. G는 새 번호 장·앱 코드 변경 없이 이 문서와 선택 CLI 실습 2파일만 추가한다. 최신 main과 기존 공개 게시 순서는 통합 담당이 유지하며 F 이후 순서를 앞당기지 않는다.

## 전체권 대조

- 소개 + 01–12 순서·ID/readId·12개 읽음 분모·future01–12, 13MDX import와 상대 링크, 번호 장의 출처·확인 문제를 대조했다. 소개는 분모 제외다.
- 01–02: 주체 확인과 자원별 인가, 브라우저 표식과 서버 기록·수명·공유 저장소를 분리한다. 버튼 숨김이 서버 검사나 자원 접근을 대신하지 않는다.
- 03–04: origin/site·전송/처리/응답 읽기·HttpOnly와 보안 경계를 분리한다. JWT 읽기와 algorithm/서명/issuer/audience/time/용도 검증이 다르며 ID Token을 API access로 쓰지 않는다.
- 05–06: OAuth 네 역할·scope/audience/객체 정책과 OIDC의 로그인 거래를 구분한다. front/back 경로·state/PKCE/nonce·code 일회 사용·세션 생성 전 검증을 별도 표시한다.
- 07–08: IdP와 앱별 session은 독립이고 local logout이 모든 앱을 끝내지 않는다. RBAC뿐 아니라 tenant/객체와 최신 정책을 확인하며 오래된 claim을 현재 권한으로 단정하지 않는다.
- 09–10: access/refresh/app/IdP의 발급·만료·철회 시간을 분리한다. BFF/SPA의 저장·API 호출 경계와 XSS/CSRF·운영 책임을 구분하며 만능 보안 점수를 만들지 않는다.
- 11–12: 브라우저/BFF의 DNS·CA·discovery와 issuer/키/time/redirect를 별도로 확인한다. API 검증·인가, 한 경계의 증거와 미확인, 안전한 기록과 제외 원문을 분리한다. 실패 범주는 공격자나 근본 원인 확정이 아니다.
- 모든 값은 합성 인물/주소/ID이며 원문 token·credential 입력이나 외부 전송은 없다. 모델과 UI는 같은 상태를 읽으며 실제 암호·SSO 결과를 주장하지 않는다. 현재 허용 clock skew0 등의 교육 가정과 실제 공급자 확인 필요를 본문에 남겼다.

## 선택 실습과 검증

`examples/authentication/replay.mjs`는 기존 lifecycle/trust/diagnosis 모델을 재사용한다. Node v24.19.0에서 logout 두 정책, IdP 잔존, 브라우저/BFF 분리, unknown 키, state-mismatch와 안전한 로그 필드 assertion을 실행해 `synthetic checks passed`를 확인했다. 패키지 설치·네트워크·파일 생성이 없어 실제 정리 대상도 없다. README는 실제 IdP/라이브러리 버전·tag·digest가 미선정·미검증임을 표시하고 별도 실제 실습의 위치·조건·기대 관측·정리 경계를 설계했다.

F의 정확 run39418615630/tree8b1e0526에서 전체1,107unit/build·인증51검사282PNG·권차·직접6원본 검토가 통과했다. G에서 앱/모델/verifier 바이트는 변경하지 않았다. 문서/CLI whitespace와 링크 검사를 통과했다. 이 기록은 넓은 기존 책 회귀나 실제 게시 전체 완료를 대신하지 않는다.

## 남은 공개 게이트

최신 통합 후보에서 넓은 기존 책 회귀, 정확 Pages JS/CSS와 published 검사, 새 실제 원본 검토를 마친 뒤 전체 공개 완료로 기록한다. 이전 게시 검증은 각 정확 소스에만 유효하다. 실제 계정·IdP·라이브러리 연동·키 회전·운영 설정·보안 상호운용성 실습은 여전히 미실행이다.

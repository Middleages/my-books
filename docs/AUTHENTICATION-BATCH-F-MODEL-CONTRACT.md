# 인증 F 모델 계약

2026-10-20. E의 정확 source/production/직접 시각 게이트를 마친 뒤 11–12장만 구현한다. 최신 main358c59bb와 기존 지침을 재확인했으며 E 마감 cef8bd48에서 독립 작업한다.

11: 브라우저→IdP 전면 경로와 BFF→discovery/JWKS 후면 경로를 별도 lane으로 보인다. 같은 IdP라도 브라우저 신뢰는 BFF의 DNS/CA 신뢰를 대체하지 않는다. 고정 issuer https://id.example.test와 내부 연결 위치를 구분한다. 단계0미확인,1브라우저,2서버 접근,3검증. 정상·BFF CA불신·BFF DNS실패·clock오차·새kid/cache갱신실패·redirect불일치·issuer불일치를 선택한다. known키 cache가 있어도 time/issuer 검사는 유지하며 unknown키는 검증 생략 대신 거절한다. 실제 암호/TLS/DNS/OIDC 요청이 아닌 조건표다.

12: 로그인 시작→callback→교환→검증→session→API의 6개 gate와 관측 범위를 구분한다. 단계0증거없음,1요약만,2해당 gate 관측,3안전한 기록과 다음 질문. 만료/audience는 04장 tokenFrame, callback연결은06장 oidcFrame, 권한은08장rbacFrame 판정을 재사용한다. JWKS 불가는11장 trustFrame을 재사용한다. 401/403/redirect반복만으로 원인을 추정하지 않는다. 관측하지 않은 gate는 unknown이고 실행되지 않은 gate도 성공으로 칠하지 않는다. 예시 로그는 allowlist의 가상 correlationId/단계/결과/이유범주만 생성한다. 비밀값 입력/원본토큰/외부 전송 없음. 필드 이름별 제외 구역과 기록 구역을 시각적으로 나누며 실제 민감 원문은 만들지 않는다.

정적 표/키보드/재생·정지·단계·초기화,320/390/1440 및 priorA–E 회귀를 검증한다. source 게이트와 실제main/Pages·실제SSO 실행은 별도다.

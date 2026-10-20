# 인증 A — 소개·01–02 검증 기록

2026-10-20. 기준 최신 main `d76ed55e9969108449124a154c7c67e946068740`에 검증된 관측 A를 보존한 독립 작업트리. **로컬 구현 시작, 공개 PR/실제 게시 미실행.** 관측 B 소스는 섞지 않았다.

## 범위와 장면

technology6 authentication, 소개·identity-and-permission·cookies-and-sessions만 등록. 기존 ID/권차/알 수 없는 읽음 보존. 장식 SVG 표지를 추가했다.

인증과 인가를 두 개의 문으로, 역할과 객체 정책을 인가 문의 별도 검사로 그린다. 가람 editor가 누리 문서를 수정하면 인증 성공/인가 거절. 버튼 숨김은 정책과 무관하다. 동일 issuer와 tenant는 고정이며 다중 tenant 구현을 주장하지 않는다.

쿠키 브라우저 저장소와 서버 세션 저장소를 떨어뜨리고 요청/응답 방향을 구별한다. 쿠키 없음·다른 host·서버 만료599/600 경계·인스턴스별 기록 부재·공유 저장소를 비교한다. 가짜 SIM-SESSION-A 라벨만 사용하며 실제 cookie API/비밀 입력/네트워크 호출이 없다.

## 미실행·후속 게이트

소스 `7a96ca3`에서 결정적 모델4개, 전체 unit1075/1075, TypeScript/Vite build, browser verifier 문법·diff 검사 통과. 최초 scope test는 새 book 정규식 등록 누락으로 실패해 수정했고, MDX import/JSX 사이 빈 줄 누락은 build가 발견해 수정·재검증했다. production browser·직접 PNG 검토는 아직 미실행이다. 최초 registry 등록이므로 넓은 회귀가 필요하다. 실제 로그인·SSO·암호 검증·보안 설정은 실행하지 않는다. 공개와 Pages/live 게이트는 직렬 게시 담당 후속 창에서만 진행한다.

# 인증 D · SSO 세션과 역할·객체 인가

2026-10-20. 인증 C 소스를 선행 의존으로07sso-and-sessions·08rbac-and-object-access를 별도 후보에 구현한다. 실제 로그인·계정·쿠키·토큰·권한 저장소를 만들거나 변경하지 않는다.

모델 계약은 `AUTHENTICATION-BATCH-D-MODEL-CONTRACT.md`다. SSO는 IdP·A·B 세션을 독립 상태로 유지하고 B의 로그인 왕복과 재입력을 구별한다. 전체 logout 연동이 없는 합성 정책임을 명시한다. IdP가 만료돼 재확인이 필요한 사례는 최종 단계에서 가상 재확인 성공을 가정했다고 표시한다.

인가 모델은 viewer/editor/admin의 역할표와 tenant·소유 조건을 독립 검사한다. 다른 tenant는 admin도 거절하고 unknown 역할/행동도 기본 거절한다. 현재 viewer 정책과 예전 editor claim을 비교하되 현재 서버 조회를 실제 판정으로, claim만 사용한 결과를 점선 반례로 구별한다. UI 메뉴 숨김은 서버 판정을 바꾸지 않는다.

모델6테스트가 세션 범위·재입력·역할×행동×tenant×owner 조합·unknown·오래된 claim을 확인했다. 전체 unit 및 정확한 소스의 build·production browser·직접 원본 PNG 게이트는 아직 미완료다. 영향 책01–08의1440/390/320·정적·키보드·초기화·normal/reduced motion과 book-volumes를 확인한다.

공식 OIDC Session Management·RP-Initiated Logout·OWASP Authorization 자료를2026-10-20 확인했다. 특정 제품의 기본 정책이나 실제 보안 검증 결과로 합성 상태를 제시하지 않는다. main 통합·실제 Pages 게시 완료는 별도 게이트다.

첫 CI39410581809 전체1091테스트/build/인증 production을 통과했다. 직접1440 세션·조직 경계,390 낡은 claim,320 세션 유지·소유 허용을 확인했다. 320 정책표의 update가 두 줄로 쪼개져 초보자가 읽기 불편하므로 열 제목을 읽기·수정·삭제로 바꾼다. 동작은 유지하되 최종 원본으로 다시 확인한다.

## 최종 D 소스 게이트

- PR66 최종 head `0cad27191eb5938b3a47a42f05e36ef7de28fc1b`, tree `25d1f523c13bde2071bf5c79ede1ccf9067f7093`. 로컬 소스 commit `6b30db50e156fa2462f43e39a3c1b38069190258`.
- CI [39411158494](https://github.com/Middleages/my-books/actions/runs/39411158494)에서 전체 unit·production build·authentication·book-volumes 성공. 실제 검증 checkout `f69af36fa45aa81f577e8e38a0758053710dae13`은 위 tree와 같고 작업 트리가 깨끗하다.
- 인증 원본 artifact `12259706662`, ZIP SHA256 `08ac728fe18d20b2cba2bf0487a4e4b7e83f7198357adf2c1a4e1cd8e178df72`. production 보고서의 진단은 0이다.
- 2026-10-20 최종 원본 `320-rbac-own-allowed.png`, `1440-sso-logoutA.png`, `390-rbac-stale.png`, `390-tokens-expired.png`의 핵심 화면을 직접 열었다. 긴 원본은 같은 픽셀의 세로 구간으로 나눠 확인했다. 320 권한표 제목이 읽기·수정·삭제로 온전히 보이며 현재 역할/tenant/소유 검사는 claim-only 점선 반례와 분리된다. A 로컬 로그아웃은 A만 지우고 IdP/B 세션은 유지된다. 선행 토큰 만료 거절 화면의 구분도 유지된다.
- 이는 D 후보 소스 검증이다. main 통합 회귀·실제 Pages 게시 검증은 별도이며 아직 이 기록으로 완료를 주장하지 않는다. 실제 IdP·SSO·권한 저장소 연결이나 보안 침투 테스트는 수행하지 않았다.


## 정확한 main d6237bc 실제 게시 마감 — 2026-10-20

[run39431780917](https://github.com/Middleages/my-books/actions/runs/39431780917)의 source `d6237bc2449e0c77894cdabe4f7fab75e6143468`, tree `46848403199c145abfc1d47a1370927a5cd24a1f`에서 전체1390/1390 단위·560 modules build, 선택8종 production과 Pages, 동일 build의 선택8종 published가 모두 성공했다. 이 책의 실제 게시 결과는 **36/36·186원본 PNG**, clean·앱/page/console/resource 오류0이다. 알려진 호스트 기본 `https://middleages.github.io/favicon.ico`의404 한 건은 원래 URL과 함께 별도 진단으로 보존하고 앱 오류를 제외하지 않았다. artifact12269011963 ZIP SHA256 `25a9ab02b2d25d54c4b1aa51e30255bd16beb0cdc617a140475f858abc9b23bd`를 실제 다운로드와 대조했다. 정확한 JS/CSS 전체 바이트·단일 build 증거는 [합본 기록](FOLLOWUP-SEVEN-WAVE-VERIFICATION.md)의 실제 게시 절을 따른다.

직접 연 대표 3원본 범위: 320-rbac-stale,390-rbac-owner-denied의 native y1700–3700와1440-sso-logoutA 전체. 역할/조직/소유권 독립 검사, 과거 claim 반례와 현재 거절, IdP/A/B 세션별 로그아웃 경계를 확인했고 이 범위에서 새 잘림·겹침·의미 차단점을 발견하지 않았다. native crop은 별도 원본으로 더하지 않았고, 소개 탐색 이미지는 두 선택 제어만을 보여 주므로 소개 전체 검토로 확대하지 않는다. 원본 전수 사람 검토·실기기·스크린리더 음성·실제 외부 서비스/임상 감수의 증거는 아니다.

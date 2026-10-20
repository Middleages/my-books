# 인증 교재 선택 실습: 비밀 없는 모형 재현

**실제 로그인·SSO 구현 패키지가 아니다.** 이 폴더는 교재의 순수 모델을 그대로 호출하는 선택 CLI 실습이다. 입력창·비밀번호·token 원문·계정·브라우저 cookie API·외부 요청은 없다.

## 실행과 예상 관측

검토한 저장소 checkout 루트에서 기존 Node.js로 `node examples/authentication/replay.mjs`를 실행한다. 추가 npm 설치는 필요 없다. 모델 버전은 함께 체크아웃한 Git tree와 동일하며 기준 F tree는 `8b1e052650a0650f86960dd0b9922a0a5c8509c2`다. 검증에 쓴 Node 버전은 G 문서에 기록한다.

예상 관측: 앱 logout과 기존 access 만료 정책이 다르고, online 철회 조회에서는 같은 표식이 거절된다. 브라우저 접근 성공은 BFF CA 신뢰를 대신하지 않는다. state 불일치를 공격 원인으로 확정하지 않고, 허용 필드만 있는 가상 증거와 미확인 경계를 남긴다. assertion이 모두 통과하면 `synthetic checks passed`를 출력한다. 실제 암호·쿠키·계정·SSO의 성공이나 보안 인증을 뜻하지 않는다.

실행은 파일·프로세스·계정·DB·volume를 만들지 않으므로 정리 명령이 없다. 출력에는 가상 ID와 교육용 판정만 있다. 다른 프로젝트나 실제 계정을 삭제하지 않는다.

## 이후 실제 통합 실습 설계, 미실행

- 장소: 별도 승인된 비운영 격리 환경과 합성 사용자·자원만 사용한다. 실제 조직 SSO·가족/직원 계정·운영 앱은 연결하지 않는다.
- 버전/tag/digest: IdP 제품, OAuth/OIDC client 라이브러리, FastAPI/React/프록시, 저장소와 배포 이미지의 버전·지원 조합·digest는 **미선정·미검증**이다. 이 폴더는 `latest`나 가짜 digest로 실행 설정을 제공하지 않는다.
- 계약: public SPA인지 confidential BFF인지, redirect URI·issuer·audience·TLS·로그인 거래/state/PKCE/nonce·세션·RBAC/객체·logout/회수 경계를 먼저 명시한다. 실제 credential 생성·접근권한 변경·보안 네트워크 변경은 필요한 별도 승인과 환경 확인을 거친다.
- 기대 검사: 정상 로그인만 아니라 redirect/state/PKCE/nonce·잘못된 용도·만료·키 갱신 실패·권한 부족·session 공유·logout 범위를 시험한다. 각 단계의 실패와 미실행을 구분하고 서버 인가를 반드시 확인한다.
- 안전한 증거: 단계·결과·합성 연결 ID와 제한된 이유 범주만 수집한다. Authorization/Cookie/code/token/client secret/password를 URL·로그·스크린샷에 남기지 않는다. 실제 값은 공개 저장소에 넣지 않는다.
- 복구와 정리: 실습 전용 자원 목록·보존 조건·삭제 가능 범위를 먼저 확인한다. 계정·client·세션·DB·volume 정리는 별도 승인 범위에서만 실행하고, 다른 환경의 자원에 대한 일반 삭제 명령을 제공하지 않는다.

현재 완료: 순수 모형 CLI. 현재 미완료: 실제 라이브러리/IdP 설치·계정·키·SSO 통합·보안/상호운용성 검증. 실제 환경을 확인하기 전에는 이 교재를 그대로 안전한 인증 구현이라고 사용하지 않는다.

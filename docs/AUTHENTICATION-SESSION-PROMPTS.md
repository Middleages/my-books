# 인증·SSO — 배치별 실행 프롬프트

작성일 2026-10-20. **배치별 범위를 보관한 템플릿**이다. A 소개·01–02는 구현·단독 production·직접 화면 검토까지 마쳤으며, 실제 게시 상태는 A 검증 기록을 따른다. A–F 두 장씩, G 통합/선택 실습 설계 순서다. 아래 각 블록은 단독 복사 가능한 미래 요청 템플릿이며 현재 권한을 부여하지 않는다. 원격 게시를 기본 동작으로 포함하지 않는다.

## 배치 A — 소개 및 01 identity-and-permission — 누구인가와 무엇을 할 수 있는가, 02 cookies-and-sessions — 브라우저와 서버가 기억하는 것

```text
Middleages/my-books의 인증·SSO 교재 배치 A를 로컬 구현/검토해줘.
최신 main과 현재 worktree/병행 작업을 확인하고 독립 branch/worktree에서 진행해줘. 과거 SHA에 고정하거나 다른 세션 변경을 되돌리지 마.
AGENTS.md, docs/CONTENT-AUTHORING.md, docs/HOME-INFORMATION-ARCHITECTURE.md, docs/AUTHENTICATION-TEXTBOOK-PLAN.md, docs/AUTHENTICATION-SESSION-PROMPTS.md, 기존 배치 검증 문서와 관련 모델/UI/테스트를 먼저 읽어줘. DB/K8s 강화 시각 기준도 참조해줘.
이번 범위는 소개 및 01 identity-and-permission — 누구인가와 무엇을 할 수 있는가, 02 cookies-and-sessions — 브라우저와 서버가 기억하는 것만이야. 후속 배치/다른 책/전체 framework는 구현하지 마.
첫 배치이므로 공통 fixture/관찰 frame을 확정하고 bookId authentication, technology 분야, 제안 volume 6의 최신 충돌 여부를 확인해줘. 기존 권차는 재번호화하지 마. 소개와 구현한 01–02만 로컬 catalog에 등록하고 후속 장/빈 링크를 노출하지 마. 첫 배치 표지는 직접 작성한 장식 SVG이며 중요한 기술 설명을 장식에 맡기지 마.
고유 장면 identity-and-permission: 사용자→인증 확인→주체→자원/행동 정책의 두 문을 분리한다. 버튼 표시와 서버 판정 경계를 나란히 둔다. 조작은 익명/가람/누리, 조회/수정, 소유자 여부만 바꾼다. 로그인 성공 후 남의 문서 수정 거절이 기본 비교. 모델 계약: decisionFrames: authenticatedSubject, resourceOwner, action, policyDecision. UI 버튼 숨김은 서버 허가가 아니다. 반드시 반례를 포함해줘: 401/403은 설명 단서이지 모든 제품에서 동일 원인을 보장하지 않는다. 내부망이라고 인증·인가가 필요 없어지지 않음. 정적/모바일 대안: 두 문을 세로로 재배치, 정적 주체×행동×자원표.
고유 장면 cookies-and-sessions: 브라우저 쿠키 저장소와 서버 session 저장소를 떨어뜨리고 opaque 식별자 왕복과 서버 조회를 연결한다. 조작은 쿠키 없음/정상/서버 세션 만료·다중 인스턴스 세션 불일치를 비교. cookie scope와 세션 수명을 별도 조작. 모델 계약: sessionFrames: cookiePresent, matchingSession, subject, expiresAt. 실제 비밀은 없고 SIM-SESSION 라벨만 사용. 반드시 반례를 포함해줘: 쿠키=세션이라는 오해. cookie는 운반/저장 방식이고 session은 상태관리 방식; JWT도 cookie로 운반 가능. 정적/모바일 대안: 왕복 정적 4단계+브라우저/서버 현재 상태표; 모바일 두 저장소를 세로.
본문은 MDX, UI는 React/TypeScript, 결정적 순수 모델은 src/simulations/authentication/의 .mjs/.d.mts로 분리해줘. fixture→events→frames를 그림/표/해설/판정이 같이 읽게 하고 unknown을 정상으로 표시하지 마. 날짜·난수·실서비스에 결과를 의존시키지 마.
눈으로 발견할 관계→시각 속성→고정/변경 조건→전후 차이→모델 필드를 먼저 정해줘. 같은 카드 문장 교체·입력폼/결과 숫자로 시각 설명을 대체하지 마. 연결선 끝점·방향·경계·시간축이 실제 모델과 맞아야 해. 한두 번 조작으로 기본 차이가 보이게 해줘.
재생/정지/이전/다음/다시 보기/전체 초기화, 설정 변경시 초기화·타이머 정리를 구현해줘. 모바일 390/320px은 단순 축소 말고 재배치하고 controls·현재 변화가 인접하게 해줘. 키보드·포커스·정적 단계/reduced-motion에서 같은 정보를 전달해줘.
공식 1차 자료를 다시 확인하고 장별 근거/확인일·모델 생략을 남겨줘. 브라우저 모델을 실제 제품/암호 검증으로 소개하지 마. 실제 credential/개인정보/사내주소 입력이나 외부 전송을 추가하지 마. 실제 설치·로그인·운영 변경은 별도 승인과 확인된 환경이 있을 때만 해줘.
검증은 정상/실패/경계/누락/재실행/초기화의 모델 테스트, 전체 npm test와 npm run build, git diff --check를 포함해줘. production 1440/390/320에서 이번 장·영향받은 홈/권차/읽음을 확인하고 초기/분기/실패/끝 PNG를 직접 열어 설명력도 검토해줘. G는 전체권 및 넓은 회귀를 수행해줘. 미실행/실패/환경 차단을 통과로 쓰지 마.
기존 URL·readId·my-books:read:v1·알 수 없는 읽음 ID·홈 책선택 구조를 유지해줘. 소개는 읽음 분모 제외, 실제 구현 장만 등록해줘.
원격 push/PR 생성/main merge/auto-merge/배포는 이 템플릿의 기본 범위가 아니야. 로컬 변경과 docs/AUTHENTICATION-BATCH-A-VERIFICATION.md를 전달하고 멈춰줘. 원격 반영이 별도 명시 승인된 경우에만 최신 main 통합·검증·정확한 Actions/Pages 자산 확인까지 하되 병행 작업 게시 창을 방해하지 마.
인계에는 기준 SHA·파일/IDs·검증 명령/환경/실제 결과·직접 시각 관찰·실습/게시 여부·미검증·다음 범위를 구분해줘. 막히면 정확한 작업/대상/이유와 완료 범위, 거절/승인대기/불확실을 보고해줘.
```

## 배치 B — 03 browser-boundaries — 브라우저의 경계 읽기, 04 tokens-and-jwt — 토큰의 내용과 신뢰

```text
Middleages/my-books의 인증·SSO 교재 배치 B를 로컬 구현/검토해줘.
최신 main과 현재 worktree/병행 작업을 확인하고 독립 branch/worktree에서 진행해줘. 과거 SHA에 고정하거나 다른 세션 변경을 되돌리지 마.
AGENTS.md, docs/CONTENT-AUTHORING.md, docs/HOME-INFORMATION-ARCHITECTURE.md, docs/AUTHENTICATION-TEXTBOOK-PLAN.md, docs/AUTHENTICATION-SESSION-PROMPTS.md, 기존 배치 검증 문서와 관련 모델/UI/테스트를 먼저 읽어줘. DB/K8s 강화 시각 기준도 참조해줘.
이번 범위는 03 browser-boundaries — 브라우저의 경계 읽기, 04 tokens-and-jwt — 토큰의 내용과 신뢰만이야. 후속 배치/다른 책/전체 framework는 구현하지 마.
선행 배치 A의 소스/모델/build/production/직접 시각 검토가 완료됐는지 확인해줘. 미완료면 이유를 알리고 먼저 같은 범위에서 해결해줘. 게시 대기와 검증 실패는 구별하고 승인 없이 게시하지 마.
고유 장면 browser-boundaries: origin·site·cookie domain/path를 서로 다른 경계로 그리고 요청 전송/서버 처리/JS 읽기의 세 결과를 분리한다. 조작은 같은 origin/교차 origin 같은 site/교차 site, Secure·HttpOnly·SameSite·credentials 조건을 선택한 명시적 시나리오로 비교. 모델 계약: browserFrames: cookieEligible, requestSent, serverHandled, jsReadable. 모든 브라우저 정책을 일반 구현하지 않고 fixture 조건을 표기. 반드시 반례를 포함해줘: HttpOnly는 JS 읽기를 막지만 XSS가 인증 요청을 보내는 것까지 막지 않는다. CORS는 인가·CSRF 방어의 대체가 아니다. 정적/모바일 대안: 정적 경계 포함도·전송/처리/읽기 3열; 모바일 축소 없이 구역별 재배치.
고유 장면 tokens-and-jwt: header/payload/signature의 구조와 검증 gate를 분리. 읽기→서명→허용 algorithm→issuer/audience/time/type 확인이 각기 다른 판정임을 보여 준다. 조작은 정상/위조/만료/다른 audience/ID token을 API에 제출한 경우를 비교. 실제 암호 함수 대신 명명한 검증 결과 fixture 사용. 모델 계약: tokenFrames: parseable, signatureValid, allowedAlg, issuerMatch, audienceMatch, timeValid, purpose. 조작 값에서 실토큰을 만들지 않음. 반드시 반례를 포함해줘: 서명은 암호화가 아니며 decode는 verify가 아님. 모든 access token이 JWT인 것도 아니고 JWT만으로 SSO가 되는 것도 아님. 정적/모바일 대안: 정적 검증 checklist와 토큰 용도표; 모바일 gate를 세로로.
본문은 MDX, UI는 React/TypeScript, 결정적 순수 모델은 src/simulations/authentication/의 .mjs/.d.mts로 분리해줘. fixture→events→frames를 그림/표/해설/판정이 같이 읽게 하고 unknown을 정상으로 표시하지 마. 날짜·난수·실서비스에 결과를 의존시키지 마.
눈으로 발견할 관계→시각 속성→고정/변경 조건→전후 차이→모델 필드를 먼저 정해줘. 같은 카드 문장 교체·입력폼/결과 숫자로 시각 설명을 대체하지 마. 연결선 끝점·방향·경계·시간축이 실제 모델과 맞아야 해. 한두 번 조작으로 기본 차이가 보이게 해줘.
재생/정지/이전/다음/다시 보기/전체 초기화, 설정 변경시 초기화·타이머 정리를 구현해줘. 모바일 390/320px은 단순 축소 말고 재배치하고 controls·현재 변화가 인접하게 해줘. 키보드·포커스·정적 단계/reduced-motion에서 같은 정보를 전달해줘.
공식 1차 자료를 다시 확인하고 장별 근거/확인일·모델 생략을 남겨줘. 브라우저 모델을 실제 제품/암호 검증으로 소개하지 마. 실제 credential/개인정보/사내주소 입력이나 외부 전송을 추가하지 마. 실제 설치·로그인·운영 변경은 별도 승인과 확인된 환경이 있을 때만 해줘.
검증은 정상/실패/경계/누락/재실행/초기화의 모델 테스트, 전체 npm test와 npm run build, git diff --check를 포함해줘. production 1440/390/320에서 이번 장·영향받은 홈/권차/읽음을 확인하고 초기/분기/실패/끝 PNG를 직접 열어 설명력도 검토해줘. G는 전체권 및 넓은 회귀를 수행해줘. 미실행/실패/환경 차단을 통과로 쓰지 마.
기존 URL·readId·my-books:read:v1·알 수 없는 읽음 ID·홈 책선택 구조를 유지해줘. 소개는 읽음 분모 제외, 실제 구현 장만 등록해줘.
원격 push/PR 생성/main merge/auto-merge/배포는 이 템플릿의 기본 범위가 아니야. 로컬 변경과 docs/AUTHENTICATION-BATCH-B-VERIFICATION.md를 전달하고 멈춰줘. 원격 반영이 별도 명시 승인된 경우에만 최신 main 통합·검증·정확한 Actions/Pages 자산 확인까지 하되 병행 작업 게시 창을 방해하지 마.
인계에는 기준 SHA·파일/IDs·검증 명령/환경/실제 결과·직접 시각 관찰·실습/게시 여부·미검증·다음 범위를 구분해줘. 막히면 정확한 작업/대상/이유와 완료 범위, 거절/승인대기/불확실을 보고해줘.
```

## 배치 C — 05 oauth-delegation — 비밀번호를 주지 않고 맡기기, 06 oidc-code-flow — 로그인 리다이렉트 따라가기

```text
Middleages/my-books의 인증·SSO 교재 배치 C를 로컬 구현/검토해줘.
최신 main과 현재 worktree/병행 작업을 확인하고 독립 branch/worktree에서 진행해줘. 과거 SHA에 고정하거나 다른 세션 변경을 되돌리지 마.
AGENTS.md, docs/CONTENT-AUTHORING.md, docs/HOME-INFORMATION-ARCHITECTURE.md, docs/AUTHENTICATION-TEXTBOOK-PLAN.md, docs/AUTHENTICATION-SESSION-PROMPTS.md, 기존 배치 검증 문서와 관련 모델/UI/테스트를 먼저 읽어줘. DB/K8s 강화 시각 기준도 참조해줘.
이번 범위는 05 oauth-delegation — 비밀번호를 주지 않고 맡기기, 06 oidc-code-flow — 로그인 리다이렉트 따라가기만이야. 후속 배치/다른 책/전체 framework는 구현하지 마.
선행 배치 B의 소스/모델/build/production/직접 시각 검토가 완료됐는지 확인해줘. 미완료면 이유를 알리고 먼저 같은 범위에서 해결해줘. 게시 대기와 검증 실패는 구별하고 승인 없이 게시하지 마.
고유 장면 oauth-delegation: resource owner/client/authorization server/resource server를 구분하고 허가 범위와 token의 대상 API를 연결한다. 조작은 같은 사용자·앱에서 read scope와 write 요청, 다른 audience를 비교. 인증 사실과 위임된 권한을 다른 띠로 표시. 모델 계약: oauthFrames: client,resource,scope,grant,tokenPurpose. OAuth의 위임과 OIDC 인증 계층을 다음 장에 연결. 반드시 반례를 포함해줘: OAuth access token만 받았다고 사용자를 안전하게 로그인시킨 것이 아님. scope는 앱의 객체 소유권 검사를 대체하지 않음. 정적/모바일 대안: 정적 역할/허가 대상 관계도, 모바일 역할별 세로 lane.
고유 장면 oidc-code-flow: 브라우저/React+FastAPI BFF/IdP의 lane. front-channel code 왕복과 backend token 교환을 다른 선으로 그린다. 비밀은 브라우저 lane에 두지 않음. 조작은 정상 code+PKCE, redirect 불일치, state 불일치, nonce 불일치, code 재사용을 순차 분기. 모델 계약: oidcFrames: transactionId,stateMatch,nonceMatch,pkceMatch,codeUsed,redirectMatch,idTokenChecks. 검증 중 미확인은 성공으로 묶지 않음. 반드시 반례를 포함해줘: code는 access token이 아니며 브라우저 리다이렉트와 서버간 교환은 다른 연결. PKCE/state/nonce 목적을 하나로 합치지 않음. 정적/모바일 대안: 정적 왕복 번호 지도와 단계별 송신자/수신자/데이터표, 모바일 코드 위치 가까이 controls.
본문은 MDX, UI는 React/TypeScript, 결정적 순수 모델은 src/simulations/authentication/의 .mjs/.d.mts로 분리해줘. fixture→events→frames를 그림/표/해설/판정이 같이 읽게 하고 unknown을 정상으로 표시하지 마. 날짜·난수·실서비스에 결과를 의존시키지 마.
눈으로 발견할 관계→시각 속성→고정/변경 조건→전후 차이→모델 필드를 먼저 정해줘. 같은 카드 문장 교체·입력폼/결과 숫자로 시각 설명을 대체하지 마. 연결선 끝점·방향·경계·시간축이 실제 모델과 맞아야 해. 한두 번 조작으로 기본 차이가 보이게 해줘.
재생/정지/이전/다음/다시 보기/전체 초기화, 설정 변경시 초기화·타이머 정리를 구현해줘. 모바일 390/320px은 단순 축소 말고 재배치하고 controls·현재 변화가 인접하게 해줘. 키보드·포커스·정적 단계/reduced-motion에서 같은 정보를 전달해줘.
공식 1차 자료를 다시 확인하고 장별 근거/확인일·모델 생략을 남겨줘. 브라우저 모델을 실제 제품/암호 검증으로 소개하지 마. 실제 credential/개인정보/사내주소 입력이나 외부 전송을 추가하지 마. 실제 설치·로그인·운영 변경은 별도 승인과 확인된 환경이 있을 때만 해줘.
검증은 정상/실패/경계/누락/재실행/초기화의 모델 테스트, 전체 npm test와 npm run build, git diff --check를 포함해줘. production 1440/390/320에서 이번 장·영향받은 홈/권차/읽음을 확인하고 초기/분기/실패/끝 PNG를 직접 열어 설명력도 검토해줘. G는 전체권 및 넓은 회귀를 수행해줘. 미실행/실패/환경 차단을 통과로 쓰지 마.
기존 URL·readId·my-books:read:v1·알 수 없는 읽음 ID·홈 책선택 구조를 유지해줘. 소개는 읽음 분모 제외, 실제 구현 장만 등록해줘.
원격 push/PR 생성/main merge/auto-merge/배포는 이 템플릿의 기본 범위가 아니야. 로컬 변경과 docs/AUTHENTICATION-BATCH-C-VERIFICATION.md를 전달하고 멈춰줘. 원격 반영이 별도 명시 승인된 경우에만 최신 main 통합·검증·정확한 Actions/Pages 자산 확인까지 하되 병행 작업 게시 창을 방해하지 마.
인계에는 기준 SHA·파일/IDs·검증 명령/환경/실제 결과·직접 시각 관찰·실습/게시 여부·미검증·다음 범위를 구분해줘. 막히면 정확한 작업/대상/이유와 완료 범위, 거절/승인대기/불확실을 보고해줘.
```

## 배치 D — 07 sso-and-sessions — 한 번 로그인과 여러 앱의 세션, 08 rbac-and-object-access — 역할과 자원별 권한

```text
Middleages/my-books의 인증·SSO 교재 배치 D를 로컬 구현/검토해줘.
최신 main과 현재 worktree/병행 작업을 확인하고 독립 branch/worktree에서 진행해줘. 과거 SHA에 고정하거나 다른 세션 변경을 되돌리지 마.
AGENTS.md, docs/CONTENT-AUTHORING.md, docs/HOME-INFORMATION-ARCHITECTURE.md, docs/AUTHENTICATION-TEXTBOOK-PLAN.md, docs/AUTHENTICATION-SESSION-PROMPTS.md, 기존 배치 검증 문서와 관련 모델/UI/테스트를 먼저 읽어줘. DB/K8s 강화 시각 기준도 참조해줘.
이번 범위는 07 sso-and-sessions — 한 번 로그인과 여러 앱의 세션, 08 rbac-and-object-access — 역할과 자원별 권한만이야. 후속 배치/다른 책/전체 framework는 구현하지 마.
선행 배치 C의 소스/모델/build/production/직접 시각 검토가 완료됐는지 확인해줘. 미완료면 이유를 알리고 먼저 같은 범위에서 해결해줘. 게시 대기와 검증 실패는 구별하고 승인 없이 게시하지 마.
고유 장면 sso-and-sessions: IdP session과 앱 A/B의 독립 session 저장소를 세 원으로 구별. B의 로그인 왕복은 남고 IdP 재인증 입력만 생략되는 경우를 보여 준다. 조작은 IdP만 로그인/앱A만 로그아웃/IdP 세션 만료/앱B 세션 유지 비교. 모델 계약: ssoFrames: idpSession, appASession, appBSession, prompted. 서로 다른 수명과 logout 범위를 유지. 반드시 반례를 포함해줘: SSO는 같은 cookie를 모든 앱에 복사하는 것이 아님. 한 앱 logout이 모든 앱·기존 token을 즉시 무효화하지 않음. 정적/모바일 대안: 세 세션의 정적 상태표; 모바일 현재 앱과 IdP 경계 강조.
고유 장면 rbac-and-object-access: 역할→허용 action 행렬과 사용자→소유 문서 연결을 교차시킨다. 요청마다 서버의 두 조건을 함께 검사한다. 조작은 viewer/editor/admin과 본인/타인 문서, 역할 변경 후 낡은 claim을 비교. 모델 계약: authorizationFrames: roles, actions, owner, policyVersion, claimVersion. deny by default; 역할과 소유 조건을 분리 테스트. 반드시 반례를 포함해줘: RBAC만으로 tenant/소유권 경계가 해결되지 않음. Kubernetes RBAC와 앱 업무 권한은 같은 권한 저장소가 아님. 정적/모바일 대안: 정적 정책표+허용/거절 이유, 모바일 선택 자원의 관계선 유지.
본문은 MDX, UI는 React/TypeScript, 결정적 순수 모델은 src/simulations/authentication/의 .mjs/.d.mts로 분리해줘. fixture→events→frames를 그림/표/해설/판정이 같이 읽게 하고 unknown을 정상으로 표시하지 마. 날짜·난수·실서비스에 결과를 의존시키지 마.
눈으로 발견할 관계→시각 속성→고정/변경 조건→전후 차이→모델 필드를 먼저 정해줘. 같은 카드 문장 교체·입력폼/결과 숫자로 시각 설명을 대체하지 마. 연결선 끝점·방향·경계·시간축이 실제 모델과 맞아야 해. 한두 번 조작으로 기본 차이가 보이게 해줘.
재생/정지/이전/다음/다시 보기/전체 초기화, 설정 변경시 초기화·타이머 정리를 구현해줘. 모바일 390/320px은 단순 축소 말고 재배치하고 controls·현재 변화가 인접하게 해줘. 키보드·포커스·정적 단계/reduced-motion에서 같은 정보를 전달해줘.
공식 1차 자료를 다시 확인하고 장별 근거/확인일·모델 생략을 남겨줘. 브라우저 모델을 실제 제품/암호 검증으로 소개하지 마. 실제 credential/개인정보/사내주소 입력이나 외부 전송을 추가하지 마. 실제 설치·로그인·운영 변경은 별도 승인과 확인된 환경이 있을 때만 해줘.
검증은 정상/실패/경계/누락/재실행/초기화의 모델 테스트, 전체 npm test와 npm run build, git diff --check를 포함해줘. production 1440/390/320에서 이번 장·영향받은 홈/권차/읽음을 확인하고 초기/분기/실패/끝 PNG를 직접 열어 설명력도 검토해줘. G는 전체권 및 넓은 회귀를 수행해줘. 미실행/실패/환경 차단을 통과로 쓰지 마.
기존 URL·readId·my-books:read:v1·알 수 없는 읽음 ID·홈 책선택 구조를 유지해줘. 소개는 읽음 분모 제외, 실제 구현 장만 등록해줘.
원격 push/PR 생성/main merge/auto-merge/배포는 이 템플릿의 기본 범위가 아니야. 로컬 변경과 docs/AUTHENTICATION-BATCH-D-VERIFICATION.md를 전달하고 멈춰줘. 원격 반영이 별도 명시 승인된 경우에만 최신 main 통합·검증·정확한 Actions/Pages 자산 확인까지 하되 병행 작업 게시 창을 방해하지 마.
인계에는 기준 SHA·파일/IDs·검증 명령/환경/실제 결과·직접 시각 관찰·실습/게시 여부·미검증·다음 범위를 구분해줘. 막히면 정확한 작업/대상/이유와 완료 범위, 거절/승인대기/불확실을 보고해줘.
```

## 배치 E — 09 renewal-and-logout — 만료·갱신·로그아웃, 10 react-fastapi — 작은 팀의 로그인 구조 고르기

```text
Middleages/my-books의 인증·SSO 교재 배치 E를 로컬 구현/검토해줘.
최신 main과 현재 worktree/병행 작업을 확인하고 독립 branch/worktree에서 진행해줘. 과거 SHA에 고정하거나 다른 세션 변경을 되돌리지 마.
AGENTS.md, docs/CONTENT-AUTHORING.md, docs/HOME-INFORMATION-ARCHITECTURE.md, docs/AUTHENTICATION-TEXTBOOK-PLAN.md, docs/AUTHENTICATION-SESSION-PROMPTS.md, 기존 배치 검증 문서와 관련 모델/UI/테스트를 먼저 읽어줘. DB/K8s 강화 시각 기준도 참조해줘.
이번 범위는 09 renewal-and-logout — 만료·갱신·로그아웃, 10 react-fastapi — 작은 팀의 로그인 구조 고르기만이야. 후속 배치/다른 책/전체 framework는 구현하지 마.
선행 배치 D의 소스/모델/build/production/직접 시각 검토가 완료됐는지 확인해줘. 미완료면 이유를 알리고 먼저 같은 범위에서 해결해줘. 게시 대기와 검증 실패는 구별하고 승인 없이 게시하지 마.
고유 장면 renewal-and-logout: access/refresh/app/IdP 세션의 서로 다른 수명띠와 갱신 교환을 배치. 이전 refresh와 새 refresh의 교체를 표시. 조작은 access 만료·refresh 실패·두 탭 동시 갱신·logout 후 기존 token 재사용의 정책 차이를 비교. 모델 계약: lifecycleFrames: now,accessExp,refreshStatus,sessionStatus,revocationPolicy. 만료 경계/허용 clock skew를 명시. 반드시 반례를 포함해줘: JWT는 자체만으로 즉시 철회 기능이 생기지 않음. refresh token rotation/재사용 탐지는 구현 정책을 확인; 무한 갱신 루프 금지. 정적/모바일 대안: 정적 수명띠/사건표, 모바일 현재 시각과 각 유효성 나란히.
고유 장면 react-fastapi: SPA public client와 BFF confidential client를 별개 지도에 그린다. credential 저장 위치·API 호출·CSRF/XSS 경계를 비교한다. 조작은 같은 기능 요구에서 BFF session cookie / SPA code+PKCE를 고르고 노출 경로·운영 책임을 비교. 우열 점수를 임의 생성하지 않음. 모델 계약: architectureFrames: clientType, secretLocations, cookiePolicy, apiBoundary. SPA에 client secret 삽입 금지, server-side 인가 유지. 반드시 반례를 포함해줘: FastAPI password JWT 튜토리얼은 OIDC SSO 통합 완성본이 아니다. 신규 SSO에 password grant/implicit flow를 기본 추천하지 않음. 정적/모바일 대안: 두 방식 정적 전후 지도와 책임표; 모바일 한 구조씩 전환하되 동일 비교 기준 유지.
본문은 MDX, UI는 React/TypeScript, 결정적 순수 모델은 src/simulations/authentication/의 .mjs/.d.mts로 분리해줘. fixture→events→frames를 그림/표/해설/판정이 같이 읽게 하고 unknown을 정상으로 표시하지 마. 날짜·난수·실서비스에 결과를 의존시키지 마.
눈으로 발견할 관계→시각 속성→고정/변경 조건→전후 차이→모델 필드를 먼저 정해줘. 같은 카드 문장 교체·입력폼/결과 숫자로 시각 설명을 대체하지 마. 연결선 끝점·방향·경계·시간축이 실제 모델과 맞아야 해. 한두 번 조작으로 기본 차이가 보이게 해줘.
재생/정지/이전/다음/다시 보기/전체 초기화, 설정 변경시 초기화·타이머 정리를 구현해줘. 모바일 390/320px은 단순 축소 말고 재배치하고 controls·현재 변화가 인접하게 해줘. 키보드·포커스·정적 단계/reduced-motion에서 같은 정보를 전달해줘.
공식 1차 자료를 다시 확인하고 장별 근거/확인일·모델 생략을 남겨줘. 브라우저 모델을 실제 제품/암호 검증으로 소개하지 마. 실제 credential/개인정보/사내주소 입력이나 외부 전송을 추가하지 마. 실제 설치·로그인·운영 변경은 별도 승인과 확인된 환경이 있을 때만 해줘.
검증은 정상/실패/경계/누락/재실행/초기화의 모델 테스트, 전체 npm test와 npm run build, git diff --check를 포함해줘. production 1440/390/320에서 이번 장·영향받은 홈/권차/읽음을 확인하고 초기/분기/실패/끝 PNG를 직접 열어 설명력도 검토해줘. G는 전체권 및 넓은 회귀를 수행해줘. 미실행/실패/환경 차단을 통과로 쓰지 마.
기존 URL·readId·my-books:read:v1·알 수 없는 읽음 ID·홈 책선택 구조를 유지해줘. 소개는 읽음 분모 제외, 실제 구현 장만 등록해줘.
원격 push/PR 생성/main merge/auto-merge/배포는 이 템플릿의 기본 범위가 아니야. 로컬 변경과 docs/AUTHENTICATION-BATCH-E-VERIFICATION.md를 전달하고 멈춰줘. 원격 반영이 별도 명시 승인된 경우에만 최신 main 통합·검증·정확한 Actions/Pages 자산 확인까지 하되 병행 작업 게시 창을 방해하지 마.
인계에는 기준 SHA·파일/IDs·검증 명령/환경/실제 결과·직접 시각 관찰·실습/게시 여부·미검증·다음 범위를 구분해줘. 막히면 정확한 작업/대상/이유와 완료 범위, 거절/승인대기/불확실을 보고해줘.
```

## 배치 F — 11 closed-network-trust — 폐쇄망에서 신뢰 연결하기, 12 auth-diagnosis — 안전한 증거로 로그인 문제 찾기

```text
Middleages/my-books의 인증·SSO 교재 배치 F를 로컬 구현/검토해줘.
최신 main과 현재 worktree/병행 작업을 확인하고 독립 branch/worktree에서 진행해줘. 과거 SHA에 고정하거나 다른 세션 변경을 되돌리지 마.
AGENTS.md, docs/CONTENT-AUTHORING.md, docs/HOME-INFORMATION-ARCHITECTURE.md, docs/AUTHENTICATION-TEXTBOOK-PLAN.md, docs/AUTHENTICATION-SESSION-PROMPTS.md, 기존 배치 검증 문서와 관련 모델/UI/테스트를 먼저 읽어줘. DB/K8s 강화 시각 기준도 참조해줘.
이번 범위는 11 closed-network-trust — 폐쇄망에서 신뢰 연결하기, 12 auth-diagnosis — 안전한 증거로 로그인 문제 찾기만이야. 후속 배치/다른 책/전체 framework는 구현하지 마.
선행 배치 E의 소스/모델/build/production/직접 시각 검토가 완료됐는지 확인해줘. 미완료면 이유를 알리고 먼저 같은 범위에서 해결해줘. 게시 대기와 검증 실패는 구별하고 승인 없이 게시하지 마.
고유 장면 closed-network-trust: 브라우저/앱 서버/IdP의 DNS·TLS trust store·시각·discovery/JWKS 경로를 각각 분리한다. issuer URL과 내부 접속 주소의 의미를 구분. 조작은 브라우저만 CA 신뢰/서버만 DNS 실패/시계오차/새 kid·JWKS 갱신 실패/redirect 불일치를 비교. 모델 계약: trustFrames: observer,issuer,discoveryReachable,jwksCache,keyId,trust,time. 키 cache 실패는 신뢰를 생략하는 이유가 아니다. 반드시 반례를 포함해줘: TLS 검증 끄기·임의 issuer 허용으로 해결하지 않는다. 폐쇄망은 키회전·패키지 보안 갱신·계정 퇴사 처리가 없어지는 환경이 아님. 정적/모바일 대안: 정적 주체별 신뢰·접근성 표, 모바일 연결 주체별 lane.
고유 장면 auth-diagnosis: 로그인 시작→callback→교환→검증→session→API 인가의 증거 지도. 단계·가상 correlation ID·결과만 남기고 비밀 데이터는 차단. 조작은 redirect 반복/invalid audience/만료/권한 부족/JWKS 장애/CSRF 거절 중 관측 선택. 토큰 붙여넣기 입력은 제공하지 않음. 모델 계약: authDiagnosisFrames: observed, reasonCategory, correlationId, redactedFields. 이전 장 판정 재사용, 미확인 gate는 unknown. 반드시 반례를 포함해줘: Authorization/Cookie·code·refresh/access/ID token·client secret·비밀번호를 로그/URL/스크린샷에 남기지 않음. 401만으로 IdP 장애를 확정하지 않음. 정적/모바일 대안: 정적 사건별 안전한 증거표와 다음 확인표; 모바일 실패 경계와 해설을 인접.
본문은 MDX, UI는 React/TypeScript, 결정적 순수 모델은 src/simulations/authentication/의 .mjs/.d.mts로 분리해줘. fixture→events→frames를 그림/표/해설/판정이 같이 읽게 하고 unknown을 정상으로 표시하지 마. 날짜·난수·실서비스에 결과를 의존시키지 마.
눈으로 발견할 관계→시각 속성→고정/변경 조건→전후 차이→모델 필드를 먼저 정해줘. 같은 카드 문장 교체·입력폼/결과 숫자로 시각 설명을 대체하지 마. 연결선 끝점·방향·경계·시간축이 실제 모델과 맞아야 해. 한두 번 조작으로 기본 차이가 보이게 해줘.
재생/정지/이전/다음/다시 보기/전체 초기화, 설정 변경시 초기화·타이머 정리를 구현해줘. 모바일 390/320px은 단순 축소 말고 재배치하고 controls·현재 변화가 인접하게 해줘. 키보드·포커스·정적 단계/reduced-motion에서 같은 정보를 전달해줘.
공식 1차 자료를 다시 확인하고 장별 근거/확인일·모델 생략을 남겨줘. 브라우저 모델을 실제 제품/암호 검증으로 소개하지 마. 실제 credential/개인정보/사내주소 입력이나 외부 전송을 추가하지 마. 실제 설치·로그인·운영 변경은 별도 승인과 확인된 환경이 있을 때만 해줘.
검증은 정상/실패/경계/누락/재실행/초기화의 모델 테스트, 전체 npm test와 npm run build, git diff --check를 포함해줘. production 1440/390/320에서 이번 장·영향받은 홈/권차/읽음을 확인하고 초기/분기/실패/끝 PNG를 직접 열어 설명력도 검토해줘. G는 전체권 및 넓은 회귀를 수행해줘. 미실행/실패/환경 차단을 통과로 쓰지 마.
기존 URL·readId·my-books:read:v1·알 수 없는 읽음 ID·홈 책선택 구조를 유지해줘. 소개는 읽음 분모 제외, 실제 구현 장만 등록해줘.
원격 push/PR 생성/main merge/auto-merge/배포는 이 템플릿의 기본 범위가 아니야. 로컬 변경과 docs/AUTHENTICATION-BATCH-F-VERIFICATION.md를 전달하고 멈춰줘. 원격 반영이 별도 명시 승인된 경우에만 최신 main 통합·검증·정확한 Actions/Pages 자산 확인까지 하되 병행 작업 게시 창을 방해하지 마.
인계에는 기준 SHA·파일/IDs·검증 명령/환경/실제 결과·직접 시각 관찰·실습/게시 여부·미검증·다음 범위를 구분해줘. 막히면 정확한 작업/대상/이유와 완료 범위, 거절/승인대기/불확실을 보고해줘.
```

## 배치 G — 소개·12장 전체 편집/통합 점검 및 선택 실습 패키지 설계

```text
Middleages/my-books의 인증·SSO 교재 배치 G를 로컬 구현/검토해줘.
최신 main과 현재 worktree/병행 작업을 확인하고 독립 branch/worktree에서 진행해줘. 과거 SHA에 고정하거나 다른 세션 변경을 되돌리지 마.
AGENTS.md, docs/CONTENT-AUTHORING.md, docs/HOME-INFORMATION-ARCHITECTURE.md, docs/AUTHENTICATION-TEXTBOOK-PLAN.md, docs/AUTHENTICATION-SESSION-PROMPTS.md, 기존 배치 검증 문서와 관련 모델/UI/테스트를 먼저 읽어줘. DB/K8s 강화 시각 기준도 참조해줘.
이번 범위는 소개·12장 전체 편집/통합 점검 및 선택 실습 패키지 설계만이야. 후속 배치/다른 책/전체 framework는 구현하지 마.
선행 배치 F의 소스/모델/build/production/직접 시각 검토가 완료됐는지 확인해줘. 미완료면 이유를 알리고 먼저 같은 범위에서 해결해줘. 게시 대기와 검증 실패는 구별하고 승인 없이 게시하지 마.
새 번호 장은 추가하지 마. 12장 전체의 용어·상호 링크·역할/시간/신뢰 경계·단위·반례·가정·실제 공개 범위를 대조해줘. examples/authentication/ 후보는 합성 자료만 사용하고 README에 버전/tag/digest·실행 위치·선행 조건·예상 관측·안전한 정리 범위를 적어줘. 실제 환경이 없으면 미실행으로 남기고 설치/운영 연결을 하지 마. 넓은 기존 책 회귀와 전체 편집 기록을 남겨줘.
본문은 MDX, UI는 React/TypeScript, 결정적 순수 모델은 src/simulations/authentication/의 .mjs/.d.mts로 분리해줘. fixture→events→frames를 그림/표/해설/판정이 같이 읽게 하고 unknown을 정상으로 표시하지 마. 날짜·난수·실서비스에 결과를 의존시키지 마.
눈으로 발견할 관계→시각 속성→고정/변경 조건→전후 차이→모델 필드를 먼저 정해줘. 같은 카드 문장 교체·입력폼/결과 숫자로 시각 설명을 대체하지 마. 연결선 끝점·방향·경계·시간축이 실제 모델과 맞아야 해. 한두 번 조작으로 기본 차이가 보이게 해줘.
재생/정지/이전/다음/다시 보기/전체 초기화, 설정 변경시 초기화·타이머 정리를 구현해줘. 모바일 390/320px은 단순 축소 말고 재배치하고 controls·현재 변화가 인접하게 해줘. 키보드·포커스·정적 단계/reduced-motion에서 같은 정보를 전달해줘.
공식 1차 자료를 다시 확인하고 장별 근거/확인일·모델 생략을 남겨줘. 브라우저 모델을 실제 제품/암호 검증으로 소개하지 마. 실제 credential/개인정보/사내주소 입력이나 외부 전송을 추가하지 마. 실제 설치·로그인·운영 변경은 별도 승인과 확인된 환경이 있을 때만 해줘.
검증은 정상/실패/경계/누락/재실행/초기화의 모델 테스트, 전체 npm test와 npm run build, git diff --check를 포함해줘. production 1440/390/320에서 이번 장·영향받은 홈/권차/읽음을 확인하고 초기/분기/실패/끝 PNG를 직접 열어 설명력도 검토해줘. G는 전체권 및 넓은 회귀를 수행해줘. 미실행/실패/환경 차단을 통과로 쓰지 마.
기존 URL·readId·my-books:read:v1·알 수 없는 읽음 ID·홈 책선택 구조를 유지해줘. 소개는 읽음 분모 제외, 실제 구현 장만 등록해줘.
원격 push/PR 생성/main merge/auto-merge/배포는 이 템플릿의 기본 범위가 아니야. 로컬 변경과 docs/AUTHENTICATION-BATCH-G-VERIFICATION.md를 전달하고 멈춰줘. 원격 반영이 별도 명시 승인된 경우에만 최신 main 통합·검증·정확한 Actions/Pages 자산 확인까지 하되 병행 작업 게시 창을 방해하지 마.
인계에는 기준 SHA·파일/IDs·검증 명령/환경/실제 결과·직접 시각 관찰·실습/게시 여부·미검증·다음 범위를 구분해줘. 막히면 정확한 작업/대상/이유와 완료 범위, 거절/승인대기/불확실을 보고해줘.
```

## 후속 승인 · 2026-10-20

계획 반영과 완성된 계획의 구현 시작이 승인됐다. 앞선 미반영 기록은 계획 작성 당시 상태다. 관측 A 소개·01–02부터 별도 작업하고 인증은 계획/모델 계약을 먼저 유지한다. 미래 세 주제는 로드맵만이며 본문 구현 대상이 아니다. 원격 계획 PR은 준비할 수 있지만 main 통합·배포는 담당자의 직렬 게시 창에서만 진행한다. 이 문서 자체가 실제 스택·사내 SSO 연동을 승인하지 않는다.

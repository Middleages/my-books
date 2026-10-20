# 눈으로 이해하는 인증·SSO — 교재 계획

작성일: 2026-10-20 (KST). 기준 main: `7a935e1114a4260181891664fff4a453508784fc`를 fetch 후 확인했다. **계획만 작성, 본문/인증 연동/게시 미실행.**

## 목적·독자·권차

폐쇄망에서 두 사람이 React/FastAPI 서비스를 만들고 SSO를 연결하려는 상황을 중심으로, “어떤 주체가 어떤 증거를 누구에게 내고 어느 경계에서 신뢰/권한을 확인하는가”를 설명한다. 사용자는 IdP 전문가나 암호 구현자가 아니라 작은 웹앱 개발자다. 로그인 화면 작성보다 브라우저 왕복·검증·세션·권한·실패의 경계를 눈으로 이해하게 한다.

기존 IT 컴퓨터1/네트워크2/쿠버네티스3/DB4와 제안 관측5를 보존하고 **IT·기술 6권 제안**이다. 요청의 ‘2·3권’을 기존 네트워크·K8s 교체로 해석하지 않는다. `bookId: authentication`, `categoryId: technology`, `volume: 6`, URL `#/authentication/<id>`, readId `authentication/<id>`를 예약한다. [배치별 실행 프롬프트](AUTHENTICATION-SESSION-PROMPTS.md) 참조.

## 사례·학습 경로·신뢰 계약

가상 앱 A ‘문서함’, 앱 B ‘운영 화면’, 가상 IdP, 합성 사용자 가람(viewer)/누리(editor), 가람 소유 문서 doc-a를 쓴다. 사용자 이름은 표시용이며 안정 식별자는 가상 issuer+subject 조합이다. 동일 email/이름으로 자동 계정 연결하지 않는다. 로그인 transaction, 앱 session, IdP session, access/ID/refresh token은 각각 다른 객체·수명·대상이다.

- 기본 경로는 외부 연결 없는 교육 상태기계다. 실제 로그인/암호검증/서명/보안성을 구현하거나 보증하지 않는다. 토큰 모양의 유효 문자열 대신 SIM-ID/SIM-ACCESS 같은 비밀 아닌 라벨을 쓴다. 실토큰 paste·password/client secret 입력창·외부 JWT 디코더 연결을 만들지 않는다.
- 설계 기준선은 OIDC authorization code+PKCE와 서버 쪽 토큰 취급/BFF session이다. SPA public client 경로도 공정하게 비교하며 BFF가 XSS/CSRF를 자동 제거한다고 말하지 않는다. 특정 IdP 제품이나 사내 SSO 방식은 미확정이다.
- SAML/LDAP/Kerberos는 “환경에서 만날 다른 프로토콜과 담당자에게 확인할 항목”으로 짧게 구별한다. OIDC 미지원 환경에 OIDC 구성을 강요하지 않고 후속 별도 범위로 남긴다. MFA·계정 복구·비밀번호 저장·passkey는 IdP 책임의 경계만 설명하며 직접 구현 강좌는 제외한다.
- 선택 실습은 승인된 일회용 로컬 IdP/test realm과 합성 계정·고정 redirect의 React/FastAPI 앱이다. 제품/버전은 G 준비 시 공식 문서·지원 상태로 선택한다. 사내 IdP client 생성·redirect 등록·realm 변경·계정 권한 수정은 이번 계획/기본 구현 범위 밖이다.
- G의 `examples/authentication/` 후보에는 secret 없는 설정 예시·시작/정리 범위·합성 테스트 시나리오·예상 증거를 담는다. 코드 검토/단위/브라우저 시뮬레이션/실제 TLS 로그인 왕복/보안 검토를 따로 기록한다. 테스트 통과를 보안 인증으로 표현하지 않는다.
- 관측5권과 연결할 때 안전한 사건명/결과/correlation ID만 사용한다. URL query·header·body·exception·브라우저 캡처에 credential이 남지 않도록 redaction을 수집 경계 전에 설계한다. 마스킹만으로 모든 개인정보 위험이 사라진다고 쓰지 않는다.

## 공통 제작·접근성·범위 계약

이 문서는 계획이다. **본문·모델·카탈로그·표지·CI를 구현하지 않았고, 원격 push·PR 생성·main 반영·배포·실제 서비스 설치를 하지 않았다.** 이후 구현과 원격 반영은 별도 요청 범위에서 진행한다. 계획 문서가 미래 행동을 자동 승인하지 않는다.

- 시작 시 최신 main과 독립 worktree 상태를 확인하고 병행 작업을 보존한다. [AGENTS.md](../AGENTS.md), [작성 기준](CONTENT-AUTHORING.md), [홈 정보 구조](HOME-INFORMATION-ARCHITECTURE.md), [DB 계획](DATABASE-TEXTBOOK-PLAN.md), [K8s 계획](KUBERNETES-TEXTBOOK-PLAN.md), [강화 시각 검증](KUBERNETES-VISUAL-IMPROVEMENTS-VERIFICATION.md)을 기준으로 한다.
- 목표 → 그림과 짧은 설명 → 예측 → 조작/관찰 → 이유 → 실제 확인 위치 → 확인 문제와 해설·출처 순서다. 약어보다 일상 질문을 먼저 쓴다. 설치 매뉴얼·도구 목록으로 개념을 대체하지 않는다.
- 장면마다 발견할 관계, 기하/경계/선 의미, 고정 조건, 변경 조건, 전후 차이, 모델 필드를 명시한다. 모든 요소를 같은 카드로 만들거나 단계 제목만 바꾸지 않는다. 3D는 필요 없으며 정확한 2D/SVG·HTML을 우선한다.
- 본문 `src/content/<bookId>/*.mdx`, UI `src/components/<bookId>/`, 순수 모델 `src/simulations/<bookId>/*.mjs`와 `.d.mts`, 기존 Node 테스트로 나눈다. MDX에서 임의 코드·원격 문서를 평가하지 않는다.
- `scenario → events → frames`의 결정적 모델을 그림·표·해설·판정이 함께 읽는다. 실제 데이터가 없는 단계는 unknown이다. 숨은 정답을 UI에 주입하지 않는다. 표시 반올림과 계산을 분리하며 시간·단위·관측 위치를 붙인다.
- 관계선은 실제 끝점과 방향이 보여야 한다. 제어/조회/데이터 이동은 선 종류와 라벨로 구별한다. 사라진 객체는 현재 경계에서 제거하고 이력은 별도 점선 영역에 둔다. 비례축은 초과값을 잘라 차이를 없애지 않는다.
- 재생은 사용자 선택으로만 시작한다. 정지·이전·다음 한 단계·다시 보기·전체 초기화 제공. 조건 변경 시 재생·예측·프레임 초기화, unmount 시 타이머 정리. 움직임 속도는 실제 지연을 뜻하지 않는다.
- 모바일 390/320px에서는 lane을 세로 재배치하고 경계·방향도 함께 바꾼다. SVG 통째 축소 금지. 현재 장면과 조작을 인접하게 둔다. 색뿐 아니라 형태·라벨·선 종류로 구별하고 드래그/hover 전용 조작을 금한다.
- 각 장의 정적 대안은 같은 모델의 시작/핵심 분기/끝 스냅샷과 사건표다. reduced-motion은 이동 없이 현재 위치·전후 차이를 유지한다. 키보드·포커스·읽을 수 있는 결과 문장도 제공한다. 보조 원문 표만 이름 있는 가로 스크롤을 허용한다.
- 최초 구현 시 제안 권차의 중복 여부를 다시 확인한다. 기존 책 권차·URL·chapter/readId·`my-books:read:v1` 및 알 수 없는 읽음 ID는 보존한다. 소개는 읽음 분모에 넣지 않고 실제 구현한 장만 공개한다. 계획 단계에서는 홈 카드나 빈 책을 추가하지 않는다.

## 검증과 완료 판정

A–F는 두 장씩 소스·모델·production·직접 시각 검토까지 순차 진행한다. 선행 검토 통과 뒤 다음 배치 로컬 준비는 가능하지만 승인 없는 게시를 하지 않는다. G는 전체권 통합/편집 점검이다. 실제 실습·공개는 별도의 승인 및 환경이 필요하다.

1. 모델: 정상/실패/경계값/누락/재실행·초기화, 각 장 불변식과 판정 근거를 검사한다. 시간은 고정 fixture와 논리 시계이며 실시간 또는 난수 의존을 금한다.
2. 코드 변경 시 전체 `npm test`, `npm run build`, `git diff --check`. 이번 변경 장과 영향받은 홈·권차·읽음 기능에 브라우저 검사를 집중하고 G에서 넓은 회귀를 실행한다. 필수 실패를 삭제/skip해서 통과시키지 않는다.
3. 실제 production 1440/390/320px의 초기·분기·실패·완료 캡처를 직접 연다. 역할/관계/불변 조건/조작 차이/선 끝점/비례/라벨/controls 근접성을 기능 검사와 별도로 기록한다. reduced-motion·키보드·정지·초기화·새로고침·콘솔·MDX 문단 중첩도 검사한다.
4. 검증 문서에는 기준 SHA·변경 파일/ID·공식 자료 확인일·모델 가정·명령/환경/결과·실제 실습 여부·미검증을 남긴다. 구현 완료, 테스트 통과, 실제 스택 동작, 원격 공개는 서로 다른 상태다. Safari·실기기·스크린리더는 실제 확인하지 않으면 미검증이다.
5. 나중에 게시가 별도 승인되면 최신 main과 병행 변경을 보존 통합하고 정확한 commit의 Actions·Pages URL·게시 JS/CSS byte 일치까지 확인한다. 현재 계획 작성에는 해당하지 않는다.
6. 계획만 바뀐 지금은 파일 경로·링크·목차/배치 대응·권차·범위·`git diff --check`를 검사한다. UI 테스트나 실제 스택 실행을 했다고 쓰지 않는다.

## 목차와 장별 장면 계약

소개는 목표·선행 지식·학습 경로만 안내한다. 아래 12장은 **예약**이며 공개 목록이 아니다.

### 01. 누구인가와 무엇을 할 수 있는가 · `identity-and-permission` · 배치 A

- **핵심 질문/목표:** 로그인한 사람도 왜 거절될까?
- **눈으로 발견할 관계·시각 속성:** 사용자→인증 확인→주체→자원/행동 정책의 두 문을 분리한다. 버튼 표시와 서버 판정 경계를 나란히 둔다.
- **고정 조건/조작/전후 차이:** 익명/가람/누리, 조회/수정, 소유자 여부만 바꾼다. 로그인 성공 후 남의 문서 수정 거절이 기본 비교.
- **공유 모델·검증:** decisionFrames: authenticatedSubject, resourceOwner, action, policyDecision. UI 버튼 숨김은 서버 허가가 아니다.
- **반례·모델 경계:** 401/403은 설명 단서이지 모든 제품에서 동일 원인을 보장하지 않는다. 내부망이라고 인증·인가가 필요 없어지지 않음.
- **모바일·정적 대안:** 두 문을 세로로 재배치, 정적 주체×행동×자원표.
- **확인 문제:** 조작한 조건 하나 때문에 달라진 관계와 아직 알 수 없는 사실을 설명한다. 위 반례의 정답과 이유를 본문에 포함한다.
- **공식 근거:** A01.

### 02. 브라우저와 서버가 기억하는 것 · `cookies-and-sessions` · 배치 A

- **핵심 질문/목표:** 새 요청에서도 서버는 어떻게 나를 알아볼까?
- **눈으로 발견할 관계·시각 속성:** 브라우저 쿠키 저장소와 서버 session 저장소를 떨어뜨리고 opaque 식별자 왕복과 서버 조회를 연결한다.
- **고정 조건/조작/전후 차이:** 쿠키 없음/정상/서버 세션 만료·다중 인스턴스 세션 불일치를 비교. cookie scope와 세션 수명을 별도 조작.
- **공유 모델·검증:** sessionFrames: cookiePresent, matchingSession, subject, expiresAt. 실제 비밀은 없고 SIM-SESSION 라벨만 사용.
- **반례·모델 경계:** 쿠키=세션이라는 오해. cookie는 운반/저장 방식이고 session은 상태관리 방식; JWT도 cookie로 운반 가능.
- **모바일·정적 대안:** 왕복 정적 4단계+브라우저/서버 현재 상태표; 모바일 두 저장소를 세로.
- **확인 문제:** 조작한 조건 하나 때문에 달라진 관계와 아직 알 수 없는 사실을 설명한다. 위 반례의 정답과 이유를 본문에 포함한다.
- **공식 근거:** A02,A03.

### 03. 브라우저의 경계 읽기 · `browser-boundaries` · 배치 B

- **핵심 질문/목표:** 쿠키를 보냈는데 JavaScript가 응답을 못 읽을 수 있을까?
- **눈으로 발견할 관계·시각 속성:** origin·site·cookie domain/path를 서로 다른 경계로 그리고 요청 전송/서버 처리/JS 읽기의 세 결과를 분리한다.
- **고정 조건/조작/전후 차이:** 같은 origin/교차 origin 같은 site/교차 site, Secure·HttpOnly·SameSite·credentials 조건을 선택한 명시적 시나리오로 비교.
- **공유 모델·검증:** browserFrames: cookieEligible, requestSent, serverHandled, jsReadable. 모든 브라우저 정책을 일반 구현하지 않고 fixture 조건을 표기.
- **반례·모델 경계:** HttpOnly는 JS 읽기를 막지만 XSS가 인증 요청을 보내는 것까지 막지 않는다. CORS는 인가·CSRF 방어의 대체가 아니다.
- **모바일·정적 대안:** 정적 경계 포함도·전송/처리/읽기 3열; 모바일 축소 없이 구역별 재배치.
- **확인 문제:** 조작한 조건 하나 때문에 달라진 관계와 아직 알 수 없는 사실을 설명한다. 위 반례의 정답과 이유를 본문에 포함한다.
- **공식 근거:** A03,A04,A11.

### 04. 토큰의 내용과 신뢰 · `tokens-and-jwt` · 배치 B

- **핵심 질문/목표:** JWT 내용을 읽을 수 있으면 믿어도 될까?
- **눈으로 발견할 관계·시각 속성:** header/payload/signature의 구조와 검증 gate를 분리. 읽기→서명→허용 algorithm→issuer/audience/time/type 확인이 각기 다른 판정임을 보여 준다.
- **고정 조건/조작/전후 차이:** 정상/위조/만료/다른 audience/ID token을 API에 제출한 경우를 비교. 실제 암호 함수 대신 명명한 검증 결과 fixture 사용.
- **공유 모델·검증:** tokenFrames: parseable, signatureValid, allowedAlg, issuerMatch, audienceMatch, timeValid, purpose. 조작 값에서 실토큰을 만들지 않음.
- **반례·모델 경계:** 서명은 암호화가 아니며 decode는 verify가 아님. 모든 access token이 JWT인 것도 아니고 JWT만으로 SSO가 되는 것도 아님.
- **모바일·정적 대안:** 정적 검증 checklist와 토큰 용도표; 모바일 gate를 세로로.
- **확인 문제:** 조작한 조건 하나 때문에 달라진 관계와 아직 알 수 없는 사실을 설명한다. 위 반례의 정답과 이유를 본문에 포함한다.
- **공식 근거:** A05,A06.

### 05. 비밀번호를 주지 않고 맡기기 · `oauth-delegation` · 배치 C

- **핵심 질문/목표:** OAuth는 로그인과 어떻게 다를까?
- **눈으로 발견할 관계·시각 속성:** resource owner/client/authorization server/resource server를 구분하고 허가 범위와 token의 대상 API를 연결한다.
- **고정 조건/조작/전후 차이:** 같은 사용자·앱에서 read scope와 write 요청, 다른 audience를 비교. 인증 사실과 위임된 권한을 다른 띠로 표시.
- **공유 모델·검증:** oauthFrames: client,resource,scope,grant,tokenPurpose. OAuth의 위임과 OIDC 인증 계층을 다음 장에 연결.
- **반례·모델 경계:** OAuth access token만 받았다고 사용자를 안전하게 로그인시킨 것이 아님. scope는 앱의 객체 소유권 검사를 대체하지 않음.
- **모바일·정적 대안:** 정적 역할/허가 대상 관계도, 모바일 역할별 세로 lane.
- **확인 문제:** 조작한 조건 하나 때문에 달라진 관계와 아직 알 수 없는 사실을 설명한다. 위 반례의 정답과 이유를 본문에 포함한다.
- **공식 근거:** A06,A07.

### 06. 로그인 리다이렉트 따라가기 · `oidc-code-flow` · 배치 C

- **핵심 질문/목표:** 브라우저가 IdP를 다녀오는 동안 무엇이 어디로 갈까?
- **눈으로 발견할 관계·시각 속성:** 브라우저/React+FastAPI BFF/IdP의 lane. front-channel code 왕복과 backend token 교환을 다른 선으로 그린다. 비밀은 브라우저 lane에 두지 않음.
- **고정 조건/조작/전후 차이:** 정상 code+PKCE, redirect 불일치, state 불일치, nonce 불일치, code 재사용을 순차 분기.
- **공유 모델·검증:** oidcFrames: transactionId,stateMatch,nonceMatch,pkceMatch,codeUsed,redirectMatch,idTokenChecks. 검증 중 미확인은 성공으로 묶지 않음.
- **반례·모델 경계:** code는 access token이 아니며 브라우저 리다이렉트와 서버간 교환은 다른 연결. PKCE/state/nonce 목적을 하나로 합치지 않음.
- **모바일·정적 대안:** 정적 왕복 번호 지도와 단계별 송신자/수신자/데이터표, 모바일 코드 위치 가까이 controls.
- **확인 문제:** 조작한 조건 하나 때문에 달라진 관계와 아직 알 수 없는 사실을 설명한다. 위 반례의 정답과 이유를 본문에 포함한다.
- **공식 근거:** A06,A07.

### 07. 한 번 로그인과 여러 앱의 세션 · `sso-and-sessions` · 배치 D

- **핵심 질문/목표:** 앱 A에 로그인하면 앱 B는 무엇을 재사용할까?
- **눈으로 발견할 관계·시각 속성:** IdP session과 앱 A/B의 독립 session 저장소를 세 원으로 구별. B의 로그인 왕복은 남고 IdP 재인증 입력만 생략되는 경우를 보여 준다.
- **고정 조건/조작/전후 차이:** IdP만 로그인/앱A만 로그아웃/IdP 세션 만료/앱B 세션 유지 비교.
- **공유 모델·검증:** ssoFrames: idpSession, appASession, appBSession, prompted. 서로 다른 수명과 logout 범위를 유지.
- **반례·모델 경계:** SSO는 같은 cookie를 모든 앱에 복사하는 것이 아님. 한 앱 logout이 모든 앱·기존 token을 즉시 무효화하지 않음.
- **모바일·정적 대안:** 세 세션의 정적 상태표; 모바일 현재 앱과 IdP 경계 강조.
- **확인 문제:** 조작한 조건 하나 때문에 달라진 관계와 아직 알 수 없는 사실을 설명한다. 위 반례의 정답과 이유를 본문에 포함한다.
- **공식 근거:** A06,A08,A12.

### 08. 역할과 자원별 권한 · `rbac-and-object-access` · 배치 D

- **핵심 질문/목표:** 관리 메뉴를 숨기면 권한 검사가 끝날까?
- **눈으로 발견할 관계·시각 속성:** 역할→허용 action 행렬과 사용자→소유 문서 연결을 교차시킨다. 요청마다 서버의 두 조건을 함께 검사한다.
- **고정 조건/조작/전후 차이:** viewer/editor/admin과 본인/타인 문서, 역할 변경 후 낡은 claim을 비교.
- **공유 모델·검증:** authorizationFrames: roles, actions, owner, policyVersion, claimVersion. deny by default; 역할과 소유 조건을 분리 테스트.
- **반례·모델 경계:** RBAC만으로 tenant/소유권 경계가 해결되지 않음. Kubernetes RBAC와 앱 업무 권한은 같은 권한 저장소가 아님.
- **모바일·정적 대안:** 정적 정책표+허용/거절 이유, 모바일 선택 자원의 관계선 유지.
- **확인 문제:** 조작한 조건 하나 때문에 달라진 관계와 아직 알 수 없는 사실을 설명한다. 위 반례의 정답과 이유를 본문에 포함한다.
- **공식 근거:** A01.

### 09. 만료·갱신·로그아웃 · `renewal-and-logout` · 배치 E

- **핵심 질문/목표:** 만료 시간을 짧게 하면 안전 문제가 모두 사라질까?
- **눈으로 발견할 관계·시각 속성:** access/refresh/app/IdP 세션의 서로 다른 수명띠와 갱신 교환을 배치. 이전 refresh와 새 refresh의 교체를 표시.
- **고정 조건/조작/전후 차이:** access 만료·refresh 실패·두 탭 동시 갱신·logout 후 기존 token 재사용의 정책 차이를 비교.
- **공유 모델·검증:** lifecycleFrames: now,accessExp,refreshStatus,sessionStatus,revocationPolicy. 만료 경계/허용 clock skew를 명시.
- **반례·모델 경계:** JWT는 자체만으로 즉시 철회 기능이 생기지 않음. refresh token rotation/재사용 탐지는 구현 정책을 확인; 무한 갱신 루프 금지.
- **모바일·정적 대안:** 정적 수명띠/사건표, 모바일 현재 시각과 각 유효성 나란히.
- **확인 문제:** 조작한 조건 하나 때문에 달라진 관계와 아직 알 수 없는 사실을 설명한다. 위 반례의 정답과 이유를 본문에 포함한다.
- **공식 근거:** A02,A07.

### 10. 작은 팀의 로그인 구조 고르기 · `react-fastapi` · 배치 E

- **핵심 질문/목표:** 토큰을 React에 둘까, FastAPI 뒤에 둘까?
- **눈으로 발견할 관계·시각 속성:** SPA public client와 BFF confidential client를 별개 지도에 그린다. credential 저장 위치·API 호출·CSRF/XSS 경계를 비교한다.
- **고정 조건/조작/전후 차이:** 같은 기능 요구에서 BFF session cookie / SPA code+PKCE를 고르고 노출 경로·운영 책임을 비교. 우열 점수를 임의 생성하지 않음.
- **공유 모델·검증:** architectureFrames: clientType, secretLocations, cookiePolicy, apiBoundary. SPA에 client secret 삽입 금지, server-side 인가 유지.
- **반례·모델 경계:** FastAPI password JWT 튜토리얼은 OIDC SSO 통합 완성본이 아니다. 신규 SSO에 password grant/implicit flow를 기본 추천하지 않음.
- **모바일·정적 대안:** 두 방식 정적 전후 지도와 책임표; 모바일 한 구조씩 전환하되 동일 비교 기준 유지.
- **확인 문제:** 조작한 조건 하나 때문에 달라진 관계와 아직 알 수 없는 사실을 설명한다. 위 반례의 정답과 이유를 본문에 포함한다.
- **공식 근거:** A02,A07,A09.

### 11. 폐쇄망에서 신뢰 연결하기 · `closed-network-trust` · 배치 F

- **핵심 질문/목표:** IdP는 보이는데 왜 로그인은 실패할까?
- **눈으로 발견할 관계·시각 속성:** 브라우저/앱 서버/IdP의 DNS·TLS trust store·시각·discovery/JWKS 경로를 각각 분리한다. issuer URL과 내부 접속 주소의 의미를 구분.
- **고정 조건/조작/전후 차이:** 브라우저만 CA 신뢰/서버만 DNS 실패/시계오차/새 kid·JWKS 갱신 실패/redirect 불일치를 비교.
- **공유 모델·검증:** trustFrames: observer,issuer,discoveryReachable,jwksCache,keyId,trust,time. 키 cache 실패는 신뢰를 생략하는 이유가 아니다.
- **반례·모델 경계:** TLS 검증 끄기·임의 issuer 허용으로 해결하지 않는다. 폐쇄망은 키회전·패키지 보안 갱신·계정 퇴사 처리가 없어지는 환경이 아님.
- **모바일·정적 대안:** 정적 주체별 신뢰·접근성 표, 모바일 연결 주체별 lane.
- **확인 문제:** 조작한 조건 하나 때문에 달라진 관계와 아직 알 수 없는 사실을 설명한다. 위 반례의 정답과 이유를 본문에 포함한다.
- **공식 근거:** A05,A08.

### 12. 안전한 증거로 로그인 문제 찾기 · `auth-diagnosis` · 배치 F

- **핵심 질문/목표:** 토큰 원문 없이도 어느 경계가 실패했는지 알 수 있을까?
- **눈으로 발견할 관계·시각 속성:** 로그인 시작→callback→교환→검증→session→API 인가의 증거 지도. 단계·가상 correlation ID·결과만 남기고 비밀 데이터는 차단.
- **고정 조건/조작/전후 차이:** redirect 반복/invalid audience/만료/권한 부족/JWKS 장애/CSRF 거절 중 관측 선택. 토큰 붙여넣기 입력은 제공하지 않음.
- **공유 모델·검증:** authDiagnosisFrames: observed, reasonCategory, correlationId, redactedFields. 이전 장 판정 재사용, 미확인 gate는 unknown.
- **반례·모델 경계:** Authorization/Cookie·code·refresh/access/ID token·client secret·비밀번호를 로그/URL/스크린샷에 남기지 않음. 401만으로 IdP 장애를 확정하지 않음.
- **모바일·정적 대안:** 정적 사건별 안전한 증거표와 다음 확인표; 모바일 실패 경계와 해설을 인접.
- **확인 문제:** 조작한 조건 하나 때문에 달라진 관계와 아직 알 수 없는 사실을 설명한다. 위 반례의 정답과 이유를 본문에 포함한다.
- **공식 근거:** A10,A05.

## 공식 근거와 버전 기록

확인일: **2026-10-20 UTC**. 아래 페이지를 실제 열어 확인했다. 가변 latest 문서는 구현 시 버전별 문서와 지원 상태를 다시 확인한다. 문서 열람은 제품 실행·지원 조합 검증이 아니다. 본 계획의 fixture·시각화·장 구성은 자체 교육 설계다.

- A01: [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) — 요청별 인가·최소 권한·객체 경계.
- A02: [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) — 세션 수명/운반/보호 책임.
- A03: [MDN Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie) — 브라우저 쿠키 속성; 브라우저/버전 조건 재확인.
- A04: [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) — cross-origin credentials 및 JS 접근 제한.
- A05: [RFC 8725 JWT BCP](https://www.rfc-editor.org/rfc/rfc8725.html) — 서명·algorithm·issuer/audience·JWT 유형 검증.
- A06: [OIDC Core 1.0 errata set 2](https://openid.net/specs/openid-connect-core-1_0.html) — OAuth 위 인증 계층·code flow·ID Token 검증; §3.1, §3.1.3.7, §15.
- A07: [RFC 9700 OAuth security BCP](https://www.rfc-editor.org/rfc/rfc9700.html) — code/PKCE·redirect·refresh·구식 흐름의 보안 한계; §2, §4.
- A08: [OIDC Discovery 1.0 errata set 2](https://openid.net/specs/openid-connect-discovery-1_0.html) — issuer·metadata·jwks_uri·검증; §3, §4.
- A09: [FastAPI OAuth2 JWT tutorial](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/) — FastAPI 예제 범위 확인용. SSO architecture 표준이나 완성 구현으로 사용하지 않는다.
- A10: [OWASP Logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) — 남길 사건과 배제할 비밀정보·접근 통제.

실습을 진행한다면 OS/아키텍처·모든 패키지 lockfile·컨테이너 tag/digest·제품 버전·설정 hash·확인일·실제 명령/관측을 기록한다. 아직 선택하지 않은 버전 번호·이미지·실행 성공을 만들어 쓰지 않는다.

- A11: [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) — cookie 인증에서의 CSRF와 방어 경계.
- A12: [OIDC RP-Initiated Logout](https://openid.net/specs/openid-connect-rpinitiated-1_0.html) — RP와 OP의 로그아웃 상호작용; 다른 앱 동시 종료 보장으로 일반화하지 않는다.

## 다음 작업과 현재 검증 범위

현재 산출물은 이 계획과 배치 프롬프트뿐이다. A를 실행하라는 별도 요청 전까지 소스/카탈로그·원격에 반영하지 않는다. 권차는 제안이며 선점 등록이 아니다. 구현 전에 실제 사용 IdP/로그 보관 요구/허용 환경이 필요한 부분만 확인하고 설치 없는 학습 부분은 독립적으로 완결한다.

후속 관심 주제는 [IT 로드맵](IT-FUTURE-TOPICS-ROADMAP.md)에 별도로 기록한다.

## 계획 인계 검사 · 2026-10-20 UTC

작성 출발점은 위 7a935e1이며 인계 직전 원격 main `05270dda25437a4529186ee0f3036948c352b7fb`를 fetch해 카탈로그를 다시 읽었다. 돈 분야 병행 변경이 추가됐지만 IT 기존 1–4권과 관측/인증 미등록 상태는 그대로였다. 이 로컬 트리는 계획 출발점에 유지하며 다른 작업을 통합/변경하지 않았다.

새 문서 5개만 작성했다. 로컬 Markdown 링크 존재, 두 교재 각각 01–12/배치 A–G 대응, 총 14개의 독립 실행 블록, 새 파일을 포함한 whitespace 검사(`git diff --no-index --check /dev/null <file>`)를 통과했다. 기존 tracked 파일 변경은 없다. 본문·UI가 없는 계획 작업이므로 npm/build/브라우저·실제 스택 검증은 실행하지 않았다. 원격 push·PR·main·배포도 실행하지 않았다.

## 후속 승인 · 2026-10-20

계획 반영과 완성된 계획의 구현 시작이 승인됐다. 앞선 미반영 기록은 계획 작성 당시 상태다. 관측 A 소개·01–02부터 별도 작업하고 인증은 계획/모델 계약을 먼저 유지한다. 미래 세 주제는 로드맵만이며 본문 구현 대상이 아니다. 원격 계획 PR은 준비할 수 있지만 main 통합·배포는 담당자의 직렬 게시 창에서만 진행한다. 이 문서 자체가 실제 스택·사내 SSO 연동을 승인하지 않는다.

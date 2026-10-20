# 인증·SSO 교육 모델 계약 후보

2026-10-20. **작성 당시에는 모델 구현·카탈로그 등록 전이었다. 2026-10-20 후속 승인으로 A 소개·01–02의 로컬 모델/UI/본문 구현을 시작했다. 실제 로그인·SSO는 여전히 미실행이다.** 관측 A를 우선하며 이 문서는 인증 구현 전의 데이터/검증 경계만 확정한다. [인증 계획](AUTHENTICATION-TEXTBOOK-PLAN.md)의 예약 ID·배치를 유지한다.

## 공통 fixture

- 가상 issuer `https://id.example.test`, 앱A `https://a.example.test`, 앱B `https://b.example.test`. 실제 주소·DNS·TLS 연결을 실행하지 않는다.
- 주체는 issuer+subject로 식별: subject `sim-garam`/`sim-nuri`, 표시이름 가람/누리. 동일 이름/이메일만으로 계정을 합치지 않는다.
- 자원 `doc-a`, owner `sim-garam`, tenant `sim-team`. viewer는 read, editor는 read/update 역할 후보. 객체 소유/tenant 정책은 역할 정책과 별개 필드다. 관리자 예외는 명시된 시나리오에만 있다.
- 모든 session/token은 `SIM-SESSION-A`, `SIM-ID`, `SIM-ACCESS` 같은 label이며 JWT/실 credential로 쓸 수 없다. 외부 token paste/secret 입력을 제공하지 않는다.
- 고정 논리시계 t=0부터 시작한다. 단위는 초. 수명 비교 후보는 앱session600, access120, refresh600, IdP900초이며 **운영 추천값이 아니다.** 허용 clock skew0을 기본으로 하고 변경 시 입력/판정에 명시한다.

## 상태 계약

인증 사건을 UI 순서와 혼동하지 않도록 `scenario → events → frames`로 정의한다. frame에는 `observedChecks`와 `unknownChecks`, 현재 대상·수명·제출된 증거 label을 넣는다. 판정 전에 보이지 않는 정답을 미리 색칠하지 않는다.

- A01: `identityStatus: anonymous | authenticated`, `subject`, `action`, `resource`, `rolePermission`, `objectPermission`, `decision`. authenticated만으로 allow하지 않는다.
- A02: 브라우저 cookie의 보유/전송 적합성과 서버 session의 존재/만료/주체를 분리. 식별자 전달 성공≠유효 session. 다중 인스턴스 fixture는 session 저장소 공유 여부를 명시.
- OIDC 후속: loginTransaction(state/nonce/PKCE 요청 결합), authorization code의 발급대상/일회성, token 교환, ID token 검증, 앱 session 생성은 다른 사건. 각각 pending/pass/fail/unknown을 갖는다. 서명 계산 자체는 구현하지 않고 검증 결과 fixture임을 가까이 표시.
- 신뢰: issuer 일치, audience, 허용 algorithm/type, 시간, 서명, nonce와 요청 맥락을 개별 gate로 둔다. 어느 하나 실패하면 이후 인증 완료를 만들지 않는다. 요청 흐름마다 적용하는 gate 목록을 명시하며 모든 OAuth 흐름에 동일 nonce 규칙을 일반화하지 않는다.
- 세션/로그아웃: IdP·앱A·앱B session과 access/refresh의 상태를 각각 보존한다. 특정 logout 이벤트가 무엇을 무효화하는지는 시나리오 정책으로 기록하고 전체 로그아웃을 자동 가정하지 않는다.

## 안전한 관측 계약

화면·로그에는 단계명, 합성 correlation ID, 결과 범주, 검사 주체만 남긴다. 비밀번호·cookie 원문·Authorization header·code·token 원문·client secret·개인정보를 저장/내보내지 않는다. 본문 그림에서 말하는 trust boundary는 실제 TLS나 암호 검증 실행 증거가 아니다.

## 구현 시 검증 목록

익명/유효/만료, 역할 허용+객체 거절, 타 tenant, 세션 불일치, cookie 미전송, 잘못된 issuer/audience/type/algorithm, state/nonce/PKCE 불일치, code 재사용, clock 경계, logout 범위, 동시 갱신 시나리오를 결정적으로 테스트한다. 각 장에서 도입하지 않은 gate는 숨겨 성공으로 만들지 말고 해당 장의 생략 가정으로 명시한다.

같은 frame으로 관계선·현재 token 위치·검사 결과·표·해설을 만들고 정적/모바일에서 동일 의미를 검증한다. 실제 IdP·브라우저 cookie 정책·제품 버전·키회전·보안성은 별도 실행 검증이 필요하다. 이 계약은 그 완료를 주장하지 않는다.

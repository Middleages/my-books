# 인증 D 모델 계약 · 여러 앱 세션과 자원별 권한

2026-10-20. 인증 C를 선행 의존으로07sso-and-sessions·08rbac-and-object-access를 준비한다. 실제 인증 제공자·계정·쿠키·token은 만들거나 연결하지 않는다.

## SSO의 세 저장소

IdP·앱A·앱B 세션은 별도 상태다. 동일 쿠키를 복사하는 그림을 쓰지 않고 id.example.test/a.example.test/b.example.test의 경계를 분리한다. 시나리오는 IdP만 로그인, A만 로그아웃, IdP만 만료, 기존 B세션 유지다. 네 단계는 기존 상태 → B방문 또는 A로컬logout → 필요한 IdP거래 확인 → B자체세션 결정이다.

B세션이 없으면 로그인 왕복이 필요하다. IdP세션이 유효한 표본은 사용자 자격증명 재입력만 생략하며 B검증·세션생성을 생략하지 않는다. IdP세션이 없으면 재입력이 필요하다고 표시한다. 입력 화면이나 실제 비밀번호는 만들지 않고, 최종 단계에서는 가상 사용자의 재확인이 성공했다고 명시해 새 세션 상태를 보여 준다. A로컬logout은 A만 지우고 IdP/B는 보존한다. IdP만료 후 이미 유효한 B세션은 이 표본에서 유지된다.

운영의 전체logout·back/front-channel·session monitoring·token취소 정책은 별도 설계다. 이 모형에는 전역logout연동을 켜지 않았다고 분명히 표시한다. 모든 IdP에서 재입력이 항상 생략된다고 일반화하지 않고 정책·추가인증·동의 등이 남을 수 있음을 적는다.

검증: B 직접 방문은 IdP 재확인 없음; B 세션 없음/IdP 유효는 왕복 있음·재입력 없음; IdP 만료와 B 유효는 B 유지; A 로컬 logout 범위; reset은 결정적이다.

## 역할과 객체를 교차 검사

viewer는 같은 tenant 읽기, editor는 같은 tenant 읽기와 본인 수정, admin은 같은 tenant 읽기·수정·삭제를 허용하는 명시적 합성 정책이다. 타 tenant는 admin도 거절한다. 정책표의 역할/action 셀과 선택 문서의 tenant/owner를 별도 문으로 표시한다. 알려지지 않은 역할/action은 기본 거절이다.

역할 변경 시점 반례는 서명·시간이 유효한 오래된 claim과 현재 서버 정책의 버전이 엇갈리는 상황이다. 서버의 현재 권한 조회 결과를 실제 판정으로 쓰고, 낡은 claim만 사용했을 때의 허용을 별도 점선 반례로 표시한다. role 변경만으로 기발급 JWT의 서명이나 claim이 즉시 바뀌지 않는다. API는 요청마다 권한을 검사하며 UI 메뉴 숨김은 정책 결과를 바꾸지 않는다.

검증: role×action×owner×tenant 모든 조합, admin의 tenant 경계, unknown 기본 거절, 현재 viewer 대 과거 editor 수정, UI 숨김 불변. Kubernetes RBAC와 앱 업무 권한 저장소는 별개다. 실제 관리자 권한 변경은 없다.

## 공식 근거

2026-10-20 확인:
- https://openid.net/specs/openid-connect-session-1_0.html
- https://openid.net/specs/openid-connect-rpinitiated-1_0.html
- https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html

역할/action/tenant/owner와 세션 수명은 자체 교육 fixture이며 실제 서비스의 권한 정책을 대신하지 않는다. 원본 스크린샷·전체 unit/build·영향 책 browser 검증 전에는 구현 완료로 표시하지 않는다.

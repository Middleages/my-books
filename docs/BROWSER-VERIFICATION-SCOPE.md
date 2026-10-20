# 변경 범위에 따른 브라우저 검증

적용일: 2026-10-20 KST. 사용자가 반복 검사를 간소화하고 추가·수정한 항목을 중심으로 확인하도록 요청한 뒤의 정책이다. 선택하지 않은 책을 검사 통과로 기록하지 않는다.

## 매번 유지하는 게이트

- `npm ci`, 전체 `npm test`, TypeScript/Vite 전체 빌드를 실행한다.
- 빌드는 한 번만 하며, production과 published 검사는 같은 실행의 `github-pages` artifact를 내려받는다.
- production에서 선택한 모든 suite가 성공해야 main을 Pages에 배포한다. PR은 배포하지 않는다.
- published도 빌드 단계에서 확정한 **같은 suite 목록**을 사용한다. 실제 게시 HTML이 가리키는 자산과 빌드의 JS/CSS 전체 바이트·해시를 확인한다.
- 선택한 책의 기존 verifier는 시나리오·관찰 프레임·키보드·정지·초기화·정적 대안 등 기존 assertion을 그대로 실행한다. 장별 assertion을 잘라 내거나 대기 시간을 줄이지 않는다.
- `book-volumes`는 항상 실행한다. 세 화면 폭에서 전체 책의 표지, 권차, 분야 필터, 읽음 상태, 공개 장 수, 소개 목차와 사이드바의 링크·순서, 가로 넘침을 확인한다. 기존의 읽음·미확인 ID 보존 검사도 유지한다.

## 선택 규칙

`scripts/browser-verification-scope.cjs`는 빌드와 같은 checkout에서 Git 변경 목록을 읽는다.

| 변경 | 브라우저 범위 |
| --- | --- |
| 책 전용 content/components/simulations, 해당 책의 verifier·이름이 명확한 테스트 | 해당 책 + `book-volumes` |
| 카탈로그의 특정 책 import·장 항목·책 소개/공개범위 | 해당 책 + `book-volumes` |
| Library, BookCover, library.css | `book-volumes` + 함께 수정된 책 |
| 문서만 변경 또는 변경 목록이 없음 | `book-volumes` |
| 공통 재생 컨트롤, 전역 CSS, 앱 진입점, 읽음 구현, 패키지/빌드 설정, workflow/선택기/공통 검증 계약 | 사용 가능한 모든 suite |
| 알 수 없는 경로·책, 전용 verifier가 없는 책, 해석 불가능한 카탈로그, 누락된 비교 이력 | 사용 가능한 모든 suite |
| 수동 workflow 실행 | 사용 가능한 모든 suite |

카탈로그는 TypeScript 구문 트리로 읽고 실행하지 않는다. 책별 레코드와 공통 타입·분류·helper를 구분한다. 공통 선언이 바뀌면 전체 범위를 선택한다. suite는 현재 checkout의 등록된 `*-browser-qa.cjs`에서 찾으므로, 아직 합쳐지지 않은 database/kubernetes verifier를 실행하려 하지 않는다. 새 verifier는 등록 목록과 테스트를 함께 갱신해야 한다. `book-volumes`가 없으면 실패하며 빈 matrix는 허용하지 않는다.

PR은 이벤트의 정확한 base SHA와 checkout된 merge revision을 비교한다. push는 `before`와 checkout된 revision을 비교한다. rename은 기존·신규 경로 모두를 반영한다. checkout에 전체 Git 이력을 가져오되 ref를 바꾸지 않는다. 비교할 commit이 없거나 0으로 된 SHA이면 전체 검사를 선택한다.

## 범위와 증거 읽기

Actions 빌드 summary와 `browser-verification-scope/selection.json` artifact에 선택한 suite, 의도적으로 생략한 suite, 이유, 변경 경로, 비교 SHA, source SHA/tree, workflow SHA가 남는다. 각 선택 suite의 기존 `*-browser-local` 및 `*-browser-published` artifact 이름은 유지한다.

`affected` 결과는 전체 책의 브라우저 회귀 통과가 아니다. 전체 단위 테스트 통과, 선택한 책의 브라우저 통과, 전체 책의 공통 목차/권차 smoke 통과를 구분해 보고한다. 이미지 생성만으로 사람이 이미지를 검토했다고 쓰지 않는다.

## 책을 마무리할 때

책 전체를 마무리할 때 또는 공통 회귀를 별도로 확인할 때 GitHub Actions의 **Build and deploy textbook → Run workflow**를 실행한다. 수동 실행은 입력으로 범위를 줄일 수 없고 항상 모든 사용 가능한 suite를 선택한다. main에서 실행하면 기존과 같이 production 성공 후 배포와 published 전체 검증까지 이어진다. 다른 branch의 수동 실행은 전체 production 검증만 하며 배포하지 않는다.

## 검증 범위

선택기 fixture는 insurance/tax/database/kubernetes 등 책별 변경, 복수 책 변경, 카탈로그 장 추가, 공통 helper 변경, 문서만 변경, 이름 변경, 없는 이력, 수동 전체 실행, 등록되지 않은 suite, 비어 있는 matrix를 검사한다. workflow 계약은 동일 matrix 공유, 전체 단위/빌드 유지, 단일 Pages artifact, 기본 checkout revision, 실패 전파, 최소 권한, main 한정 배포를 고정한다.

실제 Actions 실행과 게시 결과는 해당 통합 commit의 검증 기록에 별도로 남긴다. 이 정책 문서 자체는 브라우저 실행 성공이나 시간 단축의 증거가 아니다.

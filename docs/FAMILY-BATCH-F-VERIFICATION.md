# 가족 배치 F 로컬 후보

기준: 가족 A bfb053228be49ce1a512364ca3eceb749618b1ed에 별도 로컬 E 커밋을 이은 후보. 2026-10-21 UTC. 범위: 11 finding-support·12 family-review. 카탈로그·공통 검증기는 통합 담당에게 별도 전달한다.

- 실제 기관이 아닌 가상 지원 창구와 지역·대상·비용·시간·최신 확인의 미확인을 연결했다. 질문을 선택해도 확인 상태나 자격은 바뀌지 않는다.
- 자체 합성 주간의 실행·인계·휴식·재확인 층을 전후 비교한다. 인수 변화는 실행 층에도 반영하고 다른 미확인을 지우지 않는다. 기록 없음과 실제 미실행을 구분한다.
- 빈 인쇄 양식은 고정 질문만 제공하며 화면 입력·사용자 정보 저장·전송 기능이 없다. 인쇄 CSS는 양식이 있는 페이지에만 적용된다.
- F1·F4의 공식 UNICEF 소개를 2026-10-21 재확인했다. 지원 필요성만 참고하며 CFC 패키지의 활동·카드·절차를 사용·각색하지 않는다. F5는 검증되지 않은 서비스 조건 없이 공식 출발점만 링크한다.
- node --test tests/child-family-support-review.test.mjs: 5개 통과.
- 신규 BackupRestLabs.tsx·SupportReviewLabs.tsx 두 파일의 좁은 TypeScript 검사 통과: NODE_OPTIONS=--max-old-space-size=2048, tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --jsx react-jsx --esModuleInterop --skipLibCheck. git diff --check 통과.
- 전체 TypeScript는 E 작성 중 메모리 137 종료하여 재실행하지 않았다. F 통합 후 전체 unit/build·실제 브라우저·인쇄 미리보기·원본 PNG·320/390/850/1440px·키보드·읽음 회귀·원격 PR/CI/main/Pages/live는 직렬 통합 검증 대상으로 남긴다.
- 자동 재생·타이머·가족 점수·행복 지수·아이 결과 예측·진단·서비스 자동 자격 판정 없음. 전문가 감수·현장 평가 미실행.

인쇄 CSS 후속 수정: 숨김 규칙과 동일한 body:has 접두사에 양식 클래스를 더한 표시 규칙으로 구체성 우선순위를 바로잡았다. 코드 선택자 확인만 수행했으며 실제 인쇄 미디어 검증은 통합 담당의 남은 항목이다.

## 직렬 통합 후보 검사
E `e52ed7ddede4680ddb24c2a613d12958424a873b` 위에 F와 인쇄 specificity 수정 후보를 통합했다. 카탈로그는 01–12만 등록한다. 범위 문구 치환 중 보험 소개 범위까지 바뀐 것을 보존 감사와 기존 unit이 발견했고 원문으로 복구했다. 수정된 최종 카탈로그를 B와 비교하면 다른 19권·217장 객체와 A/B 장 객체는 정확히 동일하다. 검사 재실행 결과는 아래에 기록한다.

기존 브라우저 검증기에 4개 폭에서 지원 조건 미확인 보존, 실제 주간 모델의 모든 셀·상태 및 정적 행 일치, 변경 전 고정/한 가지 변경, 키보드·초기화·읽음 보존을 추가했다. 인쇄 버튼은 dialog 없는 stub으로 연결만 확인하고 별도로 print media를 활성화해 전체 화면/양식 PNG, 모든 주요 하위 요소의 computed visibility·display·레이아웃, simulation hidden, 다른 장 인쇄 범위 독립성을 확인하도록 했다. 이는 실행 가능한 검사 코드이며 실제 로컬 브라우저 실행·원본 인쇄 PNG 직접 검토·CI·게시 확인은 미실행이다. 정상 움직임의 전 장 자동재생 없음 검사에도 모두 포함된다.

최종 수정 후 `NODE_OPTIONS=--max-old-space-size=2048 node --test --test-concurrency=4 tests/*.test.mjs`: 1575/1575 통과. 같은 메모리 한도의 `npm run build`: 통과. `node --check scripts/child-family-browser-qa.cjs`·`git diff --check`: 통과. 실제 브라우저·PNG 직접 시각 검토·원격 CI·Pages/live 검증은 미실행 상태로 남긴다.

## 인쇄 여백·빈 페이지 위험 보강
visibility만 숨기던 방식은 본문·주간 simulation의 높이를 남길 수 있었다. 실제 앱의 `#root > .reader > #main-content > .prose > .cf-blank-review` 분기를 확인한 뒤, 인쇄 때만 각 단계의 비양식 형제를 display:none으로 제거하고 양식·조상은 정상 흐름에 유지한다. 모든 규칙은 해당 양식이 있는 페이지에만 적용하며 A4 named page(12mm 여백)를 양식에만 지정한다. 다른 장의 인쇄 설정을 바꾸지 않는다.

정상 CI 검증기는 기존 버튼 stub·하위 요소 visibility 검사를 유지하면서 A4 화면의 양식 높이·문서 높이·비양식 레이아웃 상자 없음, 원본 full-page/양식 PNG, 실제 Chromium A4 PDF의 한 페이지 여부를 검사하도록 보강했다. 다른 장의 lab 표시·레이아웃도 확인한다. 로컬 브라우저 실행 금지에 따라 실제 PDF/PNG 출력과 시각 검토는 아직 수행하지 않았다. 소스 회귀 6/6 및 스크립트 구문·diff 검사 통과. 전체 unit/build는 아래 후속 결과를 따른다.

인쇄 레이아웃 수정 후 `NODE_OPTIONS=--max-old-space-size=2048 node --test --test-concurrency=4 tests/*.test.mjs`: 1576/1576 통과. 동일 메모리 한도의 전체 `npm run build` 통과. 스크립트 구문·diff 검사 통과. 실제 PDF 페이지 수·원본 PNG와 인쇄 화면 시각 검토는 정상 원격 CI에서 실행 후 확인해야 한다.

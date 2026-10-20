# 먹기 D 07–08 검증

2026-10-20. C 마감2fbdb01 기반 별도 브랜치. 최신 origin/main의 AGENTS·콘텐츠·홈 계약을 확인했다. source·정상 PR production·원본 PNG 직접 검토·main 게시를 구분한다. 전체 unit/build 실행 중. 브라우저와 직접 검토는 아직 대기. 전문가 감수 미실행.

로컬 전체 unit1059/1059 통과. 예약/NODE2048 없이 시작한 로컬 build는 완료 전 중단(exit130), 성공으로 세지 않는다. 재실행하지 않고 정상 PR Actions의 전체 build를 사용한다. QA 스크립트 문법·diff 검사 통과. 정상 CI와 직접 PNG 검토는 대기다.

첫 정상 PR87/run39428082282 build·권차 검사는 성공. 먹기 검사는15통과 후 새 select의 exact 접근 이름 불일치로 중단했다. 앱 오류는 없었으며 이 실행은 전체 통과가 아니다. 명시적 aria-label을 추가하고 정상 CI 재검증한다.

두 번째 정상 run39428595683은70통과/4실패. 렌더·도구·기존 회귀는 통과했고 신호 초기화의 focus-visible 검사만 마우스 사용 직후 programmatic focus로 실행되어 실패했다. 기존 검증과 같이 Tab으로 키보드 입력 모드를 먼저 설정하고 focus-visible/Enter/초기화 검사를 유지한다. 테스트를 제거하거나 CSS 판정을 완화하지 않는다.

## 최종 source·직접 화면 마감

source7c9d2e2, remote01299f9fa2490978d806d4a37b542388f95bb25c/treea23630d64ea7777f6e5f6afcd60161eea4f09289. PR87/run39429085447 정상 build와 영향2종 먹기/권차 production 성공. actual078d6a818025abd87c7bac44998fa50a6ef2187b, 동일tree/clean. 먹기74/74검사165PNG, page/console/resource 오류0. artifact12267421607 ZIP SHA25641f3f387e78487368b2b8595263a3db4c076bde483da1e43e1ed87c9bcac4025.

최종 원본320-responsive-missing,1440-responsive-turn,390-tools-컵을 함께 잡기,320-tools-숟가락에 도움,850-tools-손으로 탐색을 직접 열었다. 신호/보호자 반응/다음 미확인 관찰의 순서와 독립된 원인 경계, 도구별 갈래·섭취 확인의 점선 경계, 모바일 재배치·인접 제어·키보드 포커스가 읽히며 잘림·겹침을 발견하지 않았다. 자동 검증은 Tab/focus-visible/Enter 초기화와 정적 대안을 포함한다. 165개 전부 직접 검토했다는 뜻은 아니다.

D source와 실제 production 화면 게이트를 닫았다. main·Pages·전체 등록 suite 최종 넓은 회귀는 통합 담당의 별도 직렬 창이며 아직 이 기록으로 완료 주장하지 않는다. 임상/영양 전문가 감수 미실행.

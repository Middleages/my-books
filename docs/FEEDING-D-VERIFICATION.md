# 먹기 D 07–08 검증

2026-10-20. C 마감2fbdb01 기반 별도 브랜치. 최신 origin/main의 AGENTS·콘텐츠·홈 계약을 확인했다. source·정상 PR production·원본 PNG 직접 검토·main 게시를 구분한다. 전체 unit/build 실행 중. 브라우저와 직접 검토는 아직 대기. 전문가 감수 미실행.

로컬 전체 unit1059/1059 통과. 예약/NODE2048 없이 시작한 로컬 build는 완료 전 중단(exit130), 성공으로 세지 않는다. 재실행하지 않고 정상 PR Actions의 전체 build를 사용한다. QA 스크립트 문법·diff 검사 통과. 정상 CI와 직접 PNG 검토는 대기다.

첫 정상 PR87/run39428082282 build·권차 검사는 성공. 먹기 검사는15통과 후 새 select의 exact 접근 이름 불일치로 중단했다. 앱 오류는 없었으며 이 실행은 전체 통과가 아니다. 명시적 aria-label을 추가하고 정상 CI 재검증한다.

두 번째 정상 run39428595683은70통과/4실패. 렌더·도구·기존 회귀는 통과했고 신호 초기화의 focus-visible 검사만 마우스 사용 직후 programmatic focus로 실행되어 실패했다. 기존 검증과 같이 Tab으로 키보드 입력 모드를 먼저 설정하고 focus-visible/Enter/초기화 검사를 유지한다. 테스트를 제거하거나 CSS 판정을 완화하지 않는다.

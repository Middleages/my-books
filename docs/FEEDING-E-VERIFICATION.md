# 먹기 E 09–10 검증

D마감e73c0e5 후 별도 worktree. source·정상 CI·원본 PNG·main 게시를 분리한다. 전체 unit/build와 영향2 suite는 정상 PR Actions에서 실행하며 로컬 Vite는 실행하지 않는다. 현재 대기, 감수 미실행.

## 2026-10-20 E 복구·직접 검토

첫 run 39431246325는 잘못된 일괄 치환으로 비대상 housing 안내가 01–10으로 바뀌어 실패했다. 해당 한 줄을 D의 01–08 원문으로 복원했다. 수정 원격 head `3891f0bd72c73a2d74c068d6c151388395afdea1`, 로컬 수정 `9c1feac`. catalog blob `851d516ef82b20827cf682082b1f16d038a64d54` 일치. D `e73c0e5` 대비 TypeScript AST의 child-feeding import/장/책을 제외한 partition과 각 partition 원시 바이트 동일을 검사했다.

로컬 `npm test`: 1062 통과/0 실패. 정상 PR89 Actions [39455393147](https://github.com/Middleages/my-books/actions/runs/39455393147): unit/build·child-feeding·book-volumes production success. PR merge checkout `70cd88e4bc8f1676f3884c4cb370c5f20b182c21` feeding report 90 통과/0 실패, 앱 page/console/resource 오류 0. 로컬 Vite는 중복 실행하지 않았다.

원본 PNG 직접 검토: 1440/390 음료 공통기준 화면에서 같은 당류 길이와 다른 칼슘 길이·성분별 눈금이 일치하고, 모바일 시간 띠는 세로로 재배치되어 라벨을 읽을 수 있다. 1440/320 만남 맥락 화면에서 날짜 열/모바일 날짜 세로 배치, 미확인(?)과 관찰된 거부(○)가 구별되며 맥락은 별도 점선 영역이다. 포커스·조작부와 결과 인접, 고정 정적 대안이 확인된다. QA는 320/390/850/1440 렌더·키보드·초기화·정적 대안·읽음 보존을 검사했다. 기존 원본 ZIP을 보존하며 대표 PNG만 추출했다.

CDC/NHS E 세 출처를 2026-10-20 다시 열어 연령·조리 재료/주된 음료 경계·반복 경험의 한계를 재확인했다. 의학/영양 전문가 감수·Safari·실제 터치 기기·스크린리더 음성은 미실행. main 통합·Pages는 담당 부모 작업의 별도 게이트이며 여기서 완료로 주장하지 않는다.

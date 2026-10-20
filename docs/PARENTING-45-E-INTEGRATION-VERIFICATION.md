# 육아 4·5권 E 통합 검증 — 2026-10-20

기준은 D 통합 local `e086fd90d0bb68857f6e754256b7f46f64a24e34`, tree `3424d1cca95c8e5e3ec8a150993ed162ebb783aa`다. 두 권에 각각 09–10장만 더하는 로컬 후보이며, 소개·01–10의 각 10장과 전체 19권 213장을 대상으로 한다. F·G와 육아 6권은 포함하지 않는다.

## 정확 소스와 보존 범위

- 감정 E: local `40fdb90d55a35ad86983bb0e9fd900ea6abd55cc`, tree `97d79c4e5f804e3905f538d7d6baafc6da261415`. D `e8c970aa12188a120621149650c04aed76c06e91` 이후의 transitions-and-routines, playing-together만 추가한다.
- 안전 E: local `af3ccff39bd4d0a15e87806ff4e5f3dd75a90110`, tree `b312c4c6497591c8ecfcae88e360cd75397caf95`. D `285282b824623defa0dfc110c238997d99dc4aba` 이후의 outside-and-preparedness, preparing-for-care만 추가한다.

전용 23파일은 지정한 소스 바이트를 그대로 사용하고, catalog는 두 권의 import·장·책 레코드만 갱신한다. 기존 17권의 원시 레코드·import·AST, 선행 209개 readId와 장 레코드, 공통 선언·category·helper를 보존한다. HOME·전역지침·workflow·selector와 이전 검증 문서는 변경하지 않는다.

## 검사와 아직 남은 게이트

읽기 감사 52항목에서 정확 바이트·등록·보존을 확인했고 기존 selector를 실행해 book-volumes, child-emotions, child-safety의 영향 3종 선택과 비대상 13종 생략을 확인했다. 생략한 suite는 이번 통과가 아니다.

테스트 입력 tree `720037546eaa395b62dbaeff0740a73ee6646aad`에서 `node --test --test-concurrency=4 tests/*.test.mjs` 전체 1,527/1,527 통과(fail/cancelled/skipped/todo 0), 이어서 `NODE_OPTIONS=--max-old-space-size=2048 npm run build`의 TypeScript/Vite 빌드가 성공했다. 단일 순차 실행이며 기존 대형 chunk 안내 외 빌드 오류는 없었다. 실행 뒤 바뀐 것은 이 검증 문서의 결과 기록뿐이다.

소스 E의 기존 개별 게이트와 이 합본의 검증은 별개다. 합본 PR production 3종·원본 PNG 직접 검토, 선행 D 실제 게시 완료 확인, main lease·Pages·published 3종·정확 자산 검증은 아직 대기 중이다. 이 문서는 로컬 후보의 원격 반영이나 게시 완료를 선언하지 않는다. 임상·의료·안전 전문가 감수, 실제 기기·스크린리더 음성·학습 효과 검증은 미실행이다.

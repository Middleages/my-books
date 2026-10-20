# 육아 4·5권 F 통합 검증 — 2026-10-20

기준은 E 통합 local `96b54be6ccb1b5aed91c302a171e175e57e53b92`, remote `f6bdc409f75f710dba1179bd55c66c4e71f6ffd6`(PR113), 동일 tree `aecbb5ecf401555deaf5b7a6d13e22c6eede57da`다. E 실제 게시 게이트는 별도로 확인해야 한다. 두 권에 각각 11–12장만 더하는 로컬 후보이며, 소개·01–12의 각 12장과 전체 19권 217장을 대상으로 한다. G와 육아 6권은 포함하지 않는다. 12장 등록을 최종 전체 검증이나 게시 완료로 간주하지 않는다.

## 정확 소스와 보존 범위

- 감정 F: local `810d3b90d773bb7d3d04f657852f3aa16aa8a1be`, tree `e51d51aff0d1e61e317601e620933300c6ac5f7a`. E `40fdb90d55a35ad86983bb0e9fd900ea6abd55cc` 이후의 repairing-connection, observation-and-support만 추가한다.
- 안전 F: local `f100a318c39887b902f2fc7f26ccb0e075f3e02e`, tree `a459c4bf733be2c8ebb520d6e16bef70915aef8d`. E `af3ccff39bd4d0a15e87806ff4e5f3dd75a90110` 이후의 emergency-boundary, shared-safety-plan만 추가한다.

전용 22파일은 지정한 소스 바이트를 그대로 사용하고, catalog는 두 권의 import·장·책 레코드만 갱신한다. 기존 17권의 원시 레코드·import·AST, 선행 213개 readId와 장 레코드, 공통 선언·category·helper를 보존한다. 보험의 소개·01–10 공개 범위를 포함해 다른 책의 레코드 전체를 유지하며 광범위한 범위 문구 치환은 하지 않는다. HOME·전역지침·workflow·selector와 이전 검증 문서는 변경하지 않는다.

## 검사와 아직 남은 게이트

읽기 감사 53항목에서 정확 바이트·등록·보존과 보험 범위 유지를 확인했고 기존 selector를 실행해 book-volumes, child-emotions, child-safety의 영향 3종 선택과 비대상 13종 생략을 확인했다. 생략한 suite는 이번 통과가 아니다.

테스트 입력 tree `90de3fd97129c50ac9438b3aca76948ad8395700`에서 `node --test --test-concurrency=4 tests/*.test.mjs` 전체 1,533/1,533 통과(fail/cancelled/skipped/todo 0), 이어서 `NODE_OPTIONS=--max-old-space-size=2048 npm run build`의 TypeScript/Vite 빌드가 성공했다. 단일 순차 실행이며 기존 대형 chunk 안내 외 빌드 오류는 없었다. 실행 뒤 바뀐 것은 이 검증 문서의 결과와 확정된 E 원격 기준 기록뿐이다.

소스 F의 기존 개별 게이트와 이 합본의 검증은 별개다. 합본 PR production 3종·원본 PNG 직접 검토, 선행 E 실제 게시 완료 확인, main lease·Pages·published 3종·정확 자산 검증은 아직 대기 중이다. 이 문서는 로컬 후보의 원격 반영이나 게시 완료를 선언하지 않는다. 임상·의료·안전 전문가 감수, 실제 기기·스크린리더 음성·학습 효과 검증은 미실행이다.

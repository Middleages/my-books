# 육아 4·5권 A 통합 검증 — 2026-10-20

## 정확 범위와 보존

기준 공개 main은 `f41e6e6e04c470e3cf920453a01be982ce0c3047`, tree `915c5e5ccbb1773e00d3b002cbecd4f7ed0091c4`다. 기존 17권·193장을 보존하고 다음 공개된 A 소스만 통합한다.

- 감정·관계 4권: PR77 `b3c7140027ed3b754e7aa59c0cfa0a46927fe1db`, tree `fa33529debc35f1f90d6d815b2e65cf5df317a20`. 소개·feelings-and-actions·co-regulation.
- 안전 5권: PR81 `4680b089f2b7c59d0eb92e67722e40e777e2bf86`, tree `b27063d3edade580302fde1e38350df8f9855b99`. 소개·safety-layers·reach-and-movement.

각 권 전용 12파일, 합계 24파일은 해당 공개 소스와 바이트가 같다. 카탈로그 기존 17권의 AST 파티션·원시 등록 줄·공통 선언을 보존하고 두 권만 추가해 19권·197장이다. 각 새 권의 읽음 분모는 2이며 소개는 분모에 넣지 않는다. 기존 URL/readId/저장 키와 미지 읽음 ID를 바꾸지 않는다. HOME 기존 문서 전체를 보존하고 새 A 등록 설명만 덧붙인다. 전역 작성 지침·공통 UI·workflow는 변경하지 않는다.

육아 6권의 소스·등록·업로드는 제외한다. 4·5권 B 이후 장도 이번 등록에 포함하지 않는다. 기존 계획 및 최초 검증 기록은 당시 상태의 이력으로 보존한다.

## 실행 검증과 다음 게이트

통합 전체 단위 테스트는 `node --test --test-concurrency=4 tests/*.test.mjs`로 1,500/1,500 통과했다(fail/cancelled/skipped 0). 기존 검사를 삭제하지 않았다. 신규 suite 두 개를 기존 selector와 테스트의 등록 목록에 합집합으로 더했다. selector 자체 변경은 보수적 full 회귀로 분류되며 16개 전체 suite, omitted 0임을 확인했다. 기존 동적 matrix workflow를 변경하거나 검사를 축소하지 않았다.

`NODE_OPTIONS=--max-old-space-size=2048 npm run build`의 TypeScript/Vite production build도 성공했다. 이후 정확 합본 PR의 production16종과 원본 PNG 직접 검토, main lease 재확인, main16종·Pages·실제 published16종 및 동일 빌드 자산 검증이 필요하다. 아직 이 후보의 PR/main/Pages/live 검증 완료를 주장하지 않는다.

기능 검사와 직접 시각 검토는 별개다. 실제 터치 기기·Safari·스크린리더 음성·사용자 학습효과·의료/발달/안전 전문가 감수는 수행하지 않았다. 교육용 합성 모델이며 실제 아이 데이터 입력·전송·진단·안전 판정·응급 처치를 실행하지 않는다.

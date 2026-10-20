# 육아 E 09–10 구현·검증

2026-10-20. D source/실제 화면 게이트 이후 c9a14ab에서 별도 작업트리로 시작. main/Pages 직렬 창 보존.

09의 12/15/18/24개월, 10의 24/30/36개월 원출처 탐색을 같은 모델로 구성한다. 12/24개월은 동일 객체·발췌를 공유한다. 시각 관계는 실제 연령 간격·선택점·해당 발췌와 원문 연결이며 구간마다 축 범위를 명시한다. 원출처의 빈칸/발췌 범위와 아이 능력을 구분하고 점수·보간·실제 아이 입력은 제공하지 않는다.

실행 전 계획: 전체 unit/build, A–D 회귀와 새 구간의 브라우저 검증, 원본 PNG 직접 검토 대기. 임상 감수·K-DST 재사용 확인과 main/Pages/exact-live는 별개 미완료다.

## 완료 결과
- 로컬 전체 unit1,051개 및 production build 성공. 소스 `a018a8829429872b1760ab6ac444cc2c2fe8e0fe`, tree `a947305e21e9ac7651c245a69582ae575e199015`.
- D 기반 draft PR48, 원격 `6577950a7f09d2794b5836dbb7bc1b5618bb0be7` 동일 tree. CI https://github.com/Middleages/my-books/actions/runs/39396793151 build 및 선택된 production book-volumes/housing/child-development 3suite 성공, 다른6개 미실행. PR deploy/published skipped. 최초 PR 댓글의 2suite 요약은 실제 jobs 확인 직후 정정 댓글로 바로잡았다.
- child-development 보고서 merge SHA `d9c13ed6b100d3a2fbe5938279aa5f726581cfa9`, 동일 tree. A–D 포함117개 검사 통과/실패0, PNG451개, page/console/resource 오류0. Artifact `12251987246`.
- 원본 직접 검토: 320 second-year12 all/24 movement, 390 second-year18 all/third-year24 all, 320 third-year30 all, 1440 third-year36 all, 기존320 first-year6 social. 경계 원문·발췌, 비균등 간격·선택점, 빈 영역 안내와 모바일 줄바꿈에 이상 없음.
- source/실제 화면 게이트 완료. main/Pages/exact-live와 임상 감수·K-DST 재사용 확인은 별개 미완료다.

## 후속 수정 및 재검증 (2026-10-20)
F 전체 회귀에서 광역 문자열 치환 문제를 발견해 E도 재검토했다. E의 주거 공개 장수 문구가 원기준08에서10으로 바뀌었으나 주거 본문은 추가되지 않았다. 첫 CI에서 housing suite가 선택된 이유도 이 무관한 변경이다. 원기준 주거 문구를 복구하고 모든 책의 명시적 공개 장수와 실제 구현 장수를 대조하는 공통 회귀를 추가했다. 기존 PNG 결과는 육아 화면 증거로 보존하지만 E 최종 인계는 수정된 소스의 전체 unit/build·정상 CI 결과가 나올 때까지 보류한다.

## 수정 소스 최종 게이트 완료
수정 로컬ec4e0de / 원격7ffc4220c1eed7e8ecbb32cd71b6e8976dc2d530 / tree0939036534c37efa35952757d326527d8f39d349를 검증했다. 로컬unit1,052개/실패0 및 build 성공. 정상CI39398342024의 build+전체9production suite 모두 성공했다. PR deploy/published는 skipped다. 수정 전용 보고서는mergea96476c3e03310998a090c5be0ddfb2a3ef81813/동일tree,117검사·451PNG·오류0이며 artifact12253790978이다. 수정 원본320 second-year12 all/390 third-year24 all을 다시 직접 열어 경계 자료·배치 보존을 확인했다. 기존 육아 그림·본문 변경 없이 주거 문구를 복구했으며 공통 장수 회귀가 통과했다. E source/실제 화면·넓은 회귀 인계 보류를 해제하되 main/Pages는 별도 미게시다.

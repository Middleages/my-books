# 안전 C 구현 및 검증
2026-10-20. B4dcf8db와 같은 소스의 a90eb5b 위에서 05 water-supervision/06 burn-prevention만 추가. B PR99 정상 CI와 원본 검토를 통과하기 전 후속 공개로 간주하지 않음.

05는 현재 담당 성인과 물 공간 사이의 관찰 연결, 별도 접근 제한 경계를 표시. 인수 응답 전에는 A 담당을 유지하고 응답 뒤에도 관찰을 제거하지 않음.06은 본체 위치와 늘어진 선의 독립된 접근 경로를 표시. 두 경로를 변경해도 실제 안전·온도·화상 판정은 없음. 동일 모델 프레임의 정적 대안, 초기화, 명시적 input label 제공. 자동재생·타이머·실제 개인정보 없음.

근거: NHS Baby and toddler safety (영국 영아·유아, 2026-02-19 검토 표시), https://www.nhs.uk/baby/first-aid-and-safety/safety/baby-and-toddler-safety/ . checkedAt2026-10-20; reviewedScope 목욕 시 성인 지속 관찰/형제자매·목욕의자 한계/사용후 물 관리, 뜨거운 물건·전선 접근 예방. limitations 국내 규정·제품 설치·수심·온도·시간·처치 절차 미채택. sourceIds S4, chapterIds water-supervision/burn-prevention. 국내 최신 물놀이 리플릿 존재는 검색 확인했으나 원문 확인 실패, 국내 검증 완료를 주장하지 않음. 독립 의료·안전 전문가 감수 미실행.

모델 3/3 통과. local e2a5b5d에서 node --test --test-concurrency=4 tests/*.test.mjs 전체 1507/1507 및 NODE_OPTIONS=--max-old-space-size=2048 npm run build 통과. 이후 B의 원본 검토 범례 교정 5530e9c를 동일하게 보존했다. PR CI, 원본 desktop/mobile 그림 검토와 게시 게이트는 아직 대기 중. 로컬 브라우저 socket 차단을 우회하지 않고 정상 PR CI를 사용한다.

# 육아 4권 B: 03–04 구현·검증

2026-10-20. 기준 A b3c7140. 로컬 독립 feat/child-emotions-b. main 통합·공개는 직렬 게시 담당이 A 공개 게이트 이후 수행한다.

## 범위와 시각 계약
- 03 noticing-signals: 실선 관찰 기록과 점선 잠정 해석을 분리한다. 해석 변경은 기록을 지우지 않으며 추가 관찰은 별도 줄로 누적된다. 이유 미확인은 유지한다.
- 04 emotion-language: 안전을 감싼 경계 안에서 대화 카드가 지금/나중 실제 영역을 옮긴다. 참여 가능성은 합성 조건이며 시간·효과를 계산하지 않는다.
- 320/390에서는 영역을 세로로, 큰 화면에서는 나란히 배치한다. 색 외에도 선 종류·이름·위치로 구분하며 자동재생이 없다. 정적 대안도 같은 모델 프레임을 사용한다.
- A의 readId와 모델·UI는 그대로 보존. catalog/소개 공개 범위는 01–04만 등록. 나머지는 계획이다.

## 출처·안전
CDC https://www.cdc.gov/parenting-toddlers/noticing-and-naming/emotion-coaching.html 를 2026-10-20 열람. 2–4세 프로그램 중 24–36개월 범위의 안전, 참여 가능한 대화, 잠정 감정 표현과 수정, 비언어 반응만 참고한다. 원문의 카드·문장을 복제하지 않은 자체 장면이다. 영아에게 언어 코칭 과제를 확대하지 않는다. 긴 보호자 휴식에는 믿을 만한 대체 돌봄이 필요하다는 경계를 유지한다. 실제 개인 정보·감정 점수·진단·고정 진정 시간·강압 전략이 없다. 전문가 감수 미실행.

## 실행 기록
- node --test tests/child-emotions-signals.test.mjs: 4/4 통과. 관찰 불변, 해석 독립, 미확인 유지, 프레임 오염 방지, 대화 위치/안전 불변, 잘못된 입력 거부.
- 전체 unit/build, 원본 PNG 직접 검토, 실제 브라우저·읽음 회귀, PR CI, main/Pages: 대기. 이 문서는 실행 전 게이트를 통과로 기록하지 않는다.

## 로컬 실행 결과
- c92be60 소스에서 TypeScript noEmit와 git diff --check 통과.
- node --test --test-concurrency=4 tests/*.test.mjs: 1,276/1,276 통과.
- NODE_OPTIONS=--max-old-space-size=2048 npm run build: 통과. 번들 크기 안내는 기존 크기 경고이며 런타임 검증을 대신하지 않는다.
- Chromium QA는 실행 전 환경 차단: sandbox의 process singleton socket 권한 오류, escalation도 bwrap read-only 경로 생성 실패. 실행한 브라우저 검사0, PNG0. 이 실패를 통과로 기록하지 않는다. 추가 우회 없이 정상 PR CI의 브라우저 결과와 원본 PNG로 검증 예정.

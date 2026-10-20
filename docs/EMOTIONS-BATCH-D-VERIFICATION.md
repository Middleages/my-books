# 육아 4권 D: 07–08

2026-10-20. C 로컬 a18acb9 위 준비. 기존 source PR을 main 배포로 간주하지 않는다. 07은 환경 요구(소리/접근 거리) 한 요소만 바꾸고 아이의 관찰은 고정. 08은 예고·인계·재회의 위치와 돌봄 주체를 보여 주며 모든 단계에서 돌봄 담당자가 있다. 공간 표시는 실측 거리·소리 크기·안전 인증이 아니다.

Head Start Introduction to Temperament와 Infant Toddler Temperament Tool 개요(출생–3세), AAP How to Ease Your Child’s Separation Anxiety(2026-05-11 표시)를 2026-10-20 실제 열람했다. 기질 검사·유형 점수·애착 평가·분리 적응 완료일·몰래 떠나기·강제 접촉을 구현하지 않는다. 기존 E4 수면자료 대신 분리/재회에 직접 맞는 AAP 자료를 추가했다. 전문가 감수 미실행.

독립 모델3 tests 준비/실행 결과와 전체 unit/build·PR CI·원본 PNG는 아래 후속 실행 기록으로 구분한다. 브라우저 QA는 환경 조건3개, 인계3단계, 초기화·정적·키보드·기존 읽음 회귀를 추가한다. 후속09–12는 등록하지 않는다.

## 로컬 실행
fc8f6dd 기준 독립모델3/3, 전체 node --test --test-concurrency=4 tests/*.test.mjs1510/1510, NODE_OPTIONS=--max-old-space-size=2048 npm run build 통과. C의 원본 검토에서 발견한 모바일 방향 수정을 포함하고07의 모바일 환경간격도 구분한다. PR CI와 D 원본 PNG는 대기. 공개는 C 이후 직렬 게이트를 따른다.

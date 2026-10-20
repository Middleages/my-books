# 먹기 C 05–06 검증 기록

2026-10-20. 먹기 B 마감8b49592 기반 별도 구현. 소개·01–06만 등록하며 다른 책의 카탈로그 행을 수정하지 않는다. 근거와 모델 경계는 FEEDING-C-EVIDENCE.md, FEEDING-C-CONTRACT.md에 기록했다.

- 새 모델3/3 통과: 제시/확인/모름 분리, 강조 불변성, 비변이 프레임, 모든 정보 단계에서 진단·원인·자가 재도전 계획null.
- 브라우저 스크립트 문법과 `git diff --check` 통과.
- 전체 unit/build, 정상 PR CI, 실제 원본 PNG 직접 검토는 진행/대기이며 아직 마감이 아니다.
- 실제 아이 자료 입력·저장·전송 없음. 영양·의학 전문가 감수, 임상 검증, 실제 식품 준비 안전 인증은 미실행이다.
- source·브라우저·main/Pages를 별도 게이트로 유지한다. 후속 통합은 최신 책과 수면 안전 보강을 보존한다.

로컬 검증: 전체 `npm test`1056/1056 통과. `NODE_OPTIONS=--max-old-space-size=2048 npm run build`1회 exit0. 알려진 단위 SSR 개발용 websocket24678 중복 및 build 큰 청크 경고를 별도 보존했다. 실제 앱의 page/console/resource 오류와 직접 시각 검토는 정상 PR CI에서 확인할 예정이다. 추가 로컬 build는 실행하지 않았다.

최초 PR76/run39416563786 build+영향2 production 성공. actual a6c73ce33d74875e8e480f6041834da486faaeb2/tree646b91c0154b128a9a564a33f8178da1238d7e90, clean, 먹기58검사117PNG·page/console/resource 오류0. artifact12261283554 ZIPdc9041f3b5b91566d2cc90fa4a515199396ad8a4144baee3dc343f2659f552af.

원본320-variety-confirmed,1440-variety-highlight,320-allergy-mixed,390-allergy-uncertain,1440-allergy-history를 직접 열었다. 미확인과 진단 경계·응급 안내는 적절하나 desktop 식품군 행의 세로 위치가 날짜별 메모 줄/내용 높이로 달라진다. 날짜 카드에 동일한 메모 공간을 두고 식품군 행을 같은 높이로 정렬하며 자동 좌표 검사를 추가한다. 모바일의 긴 전체 그림과 별개로 첫째/넷째 날 원본을 추가 캡처하여 실제 글자도 직접 검토한다. 보완 후 CI/화면 게이트는 아직 대기다.

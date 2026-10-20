# 수면 C 05–06 검증 기록

2026-10-20. B의 안전 문장 보강을 포함한5be120e 기반 별도 소스다. 소개와01–06장까지만 등록한다. 다른 책의 카탈로그 행은 바꾸지 않는다.

- 전체 `npm test`: 1052/1052 통과. 이후 비변이/고정 시간 창 검사1개를 추가해 새 모델3/3도 별도 통과했다. 최종 전체 개수는 다음 CI에서 다시 확인한다.
- `npx tsc --noEmit`: exit0.
- `node --check scripts/child-sleep-browser-qa.cjs`, `git diff --check`: 통과.
- 알려진 단위 SSR의 개발용 websocket24678 중복 경고는 검사 실패가 아니며 실제 앱 오류 검사는 별도다.
- 제한 production build와 정상 PR CI, 직접 원본 PNG 검토는 대기다. 로컬 브라우저 환경 문제의 우회 실행은 하지 않는다.
- 근거·모델 계약: SLEEP-C-EVIDENCE.md, SLEEP-C-CONTRACT.md. 의학 전문가 감수는 미실행이다.
- source·실제 브라우저·main/Pages 게이트를 분리한다. 이 문서는 게시 완료 증거가 아니다.

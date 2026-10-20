# 수면 C 05–06 검증 기록

2026-10-20. B의 안전 문장 보강을 포함한5be120e 기반 별도 소스다. 소개와01–06장까지만 등록한다. 다른 책의 카탈로그 행은 바꾸지 않는다.

- 전체 `npm test`: 1052/1052 통과. 이후 비변이/고정 시간 창 검사1개를 추가해 새 모델3/3도 별도 통과했다. 최종 전체 개수는 다음 CI에서 다시 확인한다.
- `npx tsc --noEmit`: exit0.
- `node --check scripts/child-sleep-browser-qa.cjs`, `git diff --check`: 통과.
- 알려진 단위 SSR의 개발용 websocket24678 중복 경고는 검사 실패가 아니며 실제 앱 오류 검사는 별도다.
- 제한 production build와 정상 PR CI, 직접 원본 PNG 검토는 대기다. 로컬 브라우저 환경 문제의 우회 실행은 하지 않는다.
- 근거·모델 계약: SLEEP-C-EVIDENCE.md, SLEEP-C-CONTRACT.md. 의학 전문가 감수는 미실행이다.
- source·실제 브라우저·main/Pages 게이트를 분리한다. 이 문서는 게시 완료 증거가 아니다.

## 최초 CI와 원본 검토 후 보완

PR71/run39414110777의 build와 선택2 production(수면·권차)이 성공했다. 실제 checkout17954b6b9312810ec9aff0491cf75c961c464774/tree4771210a829bf9dd4b843bd01afccf8a3fc94f27, clean, 수면66검사·137PNG·오류0. artifact12260633555 ZIP SHA256 f91d1760bab7dfef588824bbb9bcd73cd2630d3fa09a19d3b1c77a18be26261a.

320/850-naps-estimates,1440-naps-static,390-routine-reordered,1440-routine-relay,320-routine-solo 원본을 직접 열었다. 상태·순서 경계는 적절하지만 선택한 날의 테두리 두께가1px 달라 시간 축의 실제 가로 폭이2px 좁아지는 점을 소스와 함께 확인했다. 모든 날 테두리3px를 고정하고 축/날 설명 글자를14px로 보강하며 실제 축 좌표/폭·폰트 검사를 추가한다. 이 보완 소스의 CI/직접 원본은 아직 대기다. 동일 소스의 CI build 성공으로 중복 로컬 build는 생략했다.

## C 소스·실제 화면 마감

보완 소스 local8fe1d20a6b7778cef308c7c6d2c42080678c399a / remote535a82bc1541d2b6902c057e1f3d686a8d01e68f / exact tree47641c62496df5fc6bd4de078413227358cff3e3. PR71/run39414904488은 전체 unit/build와 영향2 production suite가 모두 성공했다. 넓은 전체10-suite 회귀나 main/Pages 성공을 뜻하지 않는다.

실제 checkout fd4b34be2981e276838a461a1cafbe08bfa5ba74, 같은 tree, clean. 수면66검사·137PNG·page/console/resource 오류0. artifact12260866808 ZIP SHA256 dfca0e734b47fb86bf13f1ca195eeff2ea923fbb15ec08dae43d5509537a6362를 직접 대조했다.

새 원본320-naps-estimates,390-naps-static,1440-naps-estimates,850-routine-reordered,320-routine-relay를 직접 열어 보완한 공통 축 정렬과14px 라벨, 추정/미확인 구분, 카드 순서/화살표, 모바일 버튼 및 고정 돌봄 경계를 확인했다. 해당 범위에서 가독성·잘림·관계 오류는 발견하지 않았다. 이전 원본의 상태 검토와 새 원본 검토를 구분했다.

배치 C의 자체 소스·화면 게이트는 닫았다. 실제 main 통합과 배포는 선행 B 뒤 직렬 게시 담당이 최신 다른 책을 보존해 별도로 진행한다. 개인 영양/의료 처방·실제 아이 자료·의학 전문가 감수는 포함하지 않는다.

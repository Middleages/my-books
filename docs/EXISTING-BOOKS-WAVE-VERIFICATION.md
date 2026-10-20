# DB C · 회계 B · 주거 F 통합 검증

작성: 2026-10-20 UTC. 이 문서는 이번 합본에서 새로 실행한 검증만 기록한다. 각 저자의 기존 source 게이트와 새 main·Pages·실제 게시 게이트는 구별한다. 현재 게시 완료 기록이 아니다.

## 통합 범위와 보존

기준 main은 `d76ed55e9969108449124a154c7c67e946068740`이다. 세금 A→F와 주거 E의 실제 게시, DB B와 회계 A, 기존 URL·readId·저장키·알 수 없는 읽음 ID를 보존한다.

- DB C05–06: 공개 source `840b9138877c015d59505e520d2f6fb66ba2a9d5` 및 문서 마감 `915fe5f4b46bf5480902a052f2d4a4fcec8a2590`.
- 회계 B03–04: 공개 source와 B 자체 검증 기록 `d518ea4972ca848990a09327d046dc49e8217ab8`, 동일 로컬 tree의 `8d02598c5d52741102d32809ab610810cc20f8fd`. 선택적 세션 프롬프트·계획 수정은 포함하지 않는다.
- 주거 F11–12: 공개 앱 source `0d4d564155916357c66ff2e642f0404d4d9867a2`와 문서 마감 `ffce4f0658d0397971770897cd57ba4ac51a0bbf`.

각 책의 본문·모델·UI·기존 브라우저 검증기는 위 검증된 작성자 source와 바이트 단위로 같다. 주거 카탈로그의 장 목록은12개였으나 공개 안내 문구만01–10으로 남은 것을 통합 점검에서 발견해01–12로 바로잡았다. 같은 실수를 막도록12개의 연속 번호·안정된 readId·권차6·공개 안내의 일치 테스트를 추가했다. 실제 공개 후보는 세금12·주거12·DB6·회계4장이며, DB D·회계 C와 신규 책 A는 포함하지 않는다.

영향 선택기는 `book-volumes`, `database`, `housing`, `accounting`4개 전체 suite를 선택한다. `insurance`, `investing`, `tax`, `kubernetes`는 이번 영향 검사에서 제외한다. 공통 workflow·범위 선택기·의존성과 기존8개 suite 등록을 변경하지 않는다. 주거 전체권의 최종 넓은 회귀는 확정된 새 main의 정확한 단일 빌드와 게시 자산으로 별도 수행한다.

## 로컬 검증과 남은 게이트

전체 단위 테스트·TypeScript/Vite build의 최종 결과, 새 PR production·직접 화면 검토, 최신 main 보존·Pages·정확한 실제 공개 자산·주거 전체권 넓은 회귀를 각각 실제 완료 뒤 기록한다. 로컬 Chromium은 실행 환경 제한으로 미실행이며 Actions의 실제 Chromium 캡처를 생성·직접 검토한다. 실제 Safari/Firefox·물리 기기·스크린리더 음성·학습효과 연구는 이 게이트에 포함하지 않는다.

### 최종 로컬 결과

2026-10-20 08:33 UTC에 `node --test --test-concurrency=4 tests/*.test.mjs`의 **1134/1134**와 `npm run build`의 TypeScript·Vite **393 modules**를 통과했다. 모든 기존 파일·단언을 실행했으며 CI 명령이나 기본 동시성은 바꾸지 않았다. 최초 새 작업 트리에 의존성 연결이 없어 난 setup 오류는 앱 실패로 보지 않고, package.json/lock 동일성을 확인해 기존 의존성을 연결한 뒤 깨끗한 단일 로그로 전부 재실행했다.

최종 JS `index-DsaNx52x.js` SHA-256 `42e3024c3a64992ebbd360cb3c32b72e80b7d72570ee3bf0103d1e26517bb163`, CSS `index-f58pl4aP.css` `be5043e056f9ded15ecad6ab7db8aeb0a2e1319bcfad3526864c88669613af78`를 기록했다. 아직 이 새 합본의 hosted production·직접 PNG·main/Pages/live 검증은 하지 않았다. 세금 전체권의 최종 고정-source 회귀가 실제로 끝난 뒤4개 문서 마감284a377도 보존했으며 앱에는 영향을 주지 않는다.

## 새 합본 PR production 결과

[PR45](https://github.com/Middleages/my-books/pull/45)의 source `5c70c25c545ee519f6991091ab5751c00dd91741`, tree `d7e679324935ce2765c0c07cf882c1e104611a6c`에 대해 [run39394773420](https://github.com/Middleages/my-books/actions/runs/39394773420)가 전체1134단위 테스트·build와 선택4개 production을 모두 통과했다. 실제 checkout `3bb7e39d5e2dc3898a4bf47c88e540424b5976e5`의 tree가 같은 것을 Git commit API와 권차/회계 결과에서 확인했으며, 네 suite의 sourceSha와 clean 상태도 일치한다.

- DB415/415·원본259PNG, 주거189/189·고유 원본248PNG, 회계101/101·원본102PNG, 권차14/14·원본39PNG. 앱 및 리소스 진단은0이다.
- 실제 scope artifact는 book-volumes·database·housing·accounting을 선택하고 insurance·investing·tax·kubernetes를 의도적으로 제외한다. 이 PR은 Pages나 published를 실행하지 않았고 주거 마지막 전체권 회귀를 대신하지 않는다.
- 권차·회계·주거가 실제 제공 JS `index-DsaNx52x.js` 2955457bytes/SHA-256 `42e3024c3a64992ebbd360cb3c32b72e80b7d72570ee3bf0103d1e26517bb163`, CSS `index-f58pl4aP.css` 356058bytes/`be5043e056f9ded15ecad6ab7db8aeb0a2e1319bcfad3526864c88669613af78`를 같은 build와 대조했다.

| artifact | ID | ZIP SHA-256 |
| --- | --- | --- |
| accounting-browser-local | 12251786272 | `724d55b0f31a8e430fdc2e6efe060bb849bc85f515ff6b57e70ca71bcacd5fce` |
| database-browser-local | 12251697711 | `e2370c311a9f108037e133ce8fa1b7e3036d3a6cc654b3744e88fc468267803d` |
| housing-browser-local | 12251228558 | `890e608fd900f998688b02d184cd93d8c42e2d6cf3809589f03828973260ffec` |
| browser-verification-scope | 12251161708 | `9c481004497c8e1785c71cf201c441706a1074165a1f4c793cd23395abcfd716` |
| github-pages | 12251146753 | `7957b4a5bea149d8f9f6d46f0c93a9249acc77fd9b641af04ced65e24ed2a5e0` |
| book-volumes-browser-local | 12250888537 | `78f69b1c6e65984f7de776f0a2c0889fae16580373a789fa5110729753a9ac54` |

각 ZIP을 내려받아 위 해시와 대조했다. 통합 담당자는 새1440 홈·320 주거 권차·390 읽는 책 우선 화면을 직접 열어 회계4·주거12·DB6·세금12의 읽음 분모와 기존 권차가 유지됨을 확인했다. 또한1440 주거 이사 초기,850 월 충격 초기,320 매매 문서 추가확인 native 상단과1440 DB commit 원본을 직접 보았다.20일 지급 실패/30일 반환 구분,14월 지급 미반영과 공통 현금 눈금,2억원의20/40/140 부분과 예정대출≠입금,세 변경의 공동 확정 경계가 읽혔다.

회계 작성자는 새1440-revenue-advance-step-2,320-revenue-credit-step-2/3,1440-revenue-next-period-step-4,1440-expense-payment-0-step-4,320-expense-payment-40-step-6 원본6장을 직접 보았다. 선입금 의무와 매출0,인도 매출400/수취0,M2 회수의 신규매출0,선급 권리 사용과 지급0/40의 차이가 같은 눈금·날짜/월로 읽히고 잘림이 없었다. 이 기록은 검사한 원본의 범위이며 모든 이미지·모든 표 셀을 수동으로 확인했다는 뜻이 아니다.

DB 작성자는 새320-c05-atomic-item-constraint-error-item-error,390-c05-atomic-success-commit,1440-c06-conditional-update-commit-B-resume,320-c06-snapshot-repeatable-read-complete,320-c06-deadlock-opposite-B-wait-101,390-c06-select-for-update-commit-B-resume 원본6장을 직접 보았다. 실패 후보·취소 이력과 현재 변경 집합의 분리,commit의 세 갈래,UPDATE0과 잠금조회1행의 차이,과거5→5와 현재3,자원→소유자/트랜잭션→대기자원의 순환이 유지되고 잘림·새 회귀가 없었다. native select의 긴 옵션 축약은 아래 관계 그림·설명으로 보완되는 것으로 확인했다.

별도 검토자는 새850-housing-shocks-initial 전체와320 매매 문서 추가확인 native 상단을 직접 확인했다.850의 현금 막대·별도 축·14월 동결,320의 같은2억원을 이루는 계약금2천+중도4천+잔금1.4억원과 예정대출8천만원(실제 입금 미확인),예정일 확인≠실제 입금이 명확했다. 잘림/의미 차단점이 없었으며 native 하단 이후 문서 전체를 검토했다고 확대하지 않는다.

최종 게시 직전, 현재 main d76ed55e를 다시 읽고 PR45 검증 앱·검증기·테스트·workflow와의 차이가0임을 확인했다. 이후의 문서 마감만 추가하며 다른 신규 책/후속 장은 포함하지 않는다. 이제 이 정확한 앱을 main에서 다시 검사한 뒤 Pages·동일 게시 자산·실제 화면 및 주거 전체권의 고정8×2 회귀를 확인한다. 이 절은 아직 그 후속 게이트의 성공 기록은 아니다.

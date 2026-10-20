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


## 정확한 main·Pages·실제 게시 확인 · 2026-10-20

합본 main `47c36cc06fad15d87afd040ac5c259b421714d52`, tree `09766eee17e80d322b382d544b99085f7450916a`를 [Actions39397074938](https://github.com/Middleages/my-books/actions/runs/39397074938)에서 검사했다. 전체1134/1134 단위 테스트와 TypeScript/Vite393 modules build, 선택된 book-volumes·database·housing·accounting production4개, Pages 배포(09:06:30 UTC), 실제 게시4개가 모두 성공했다. 마지막 job까지09:15:45 UTC에 닫혔다. 보험·투자·세금·쿠버네티스 browser4개는 이 영향 범위 실행에서 생략됐으며 통과로 기록하지 않는다. 주거 전체권의 고정8×2 넓은 회귀는 별도 게이트다.

실제 게시 JS `index-DsaNx52x.js`(2,955,457bytes) SHA-256 `42e3024c3a64992ebbd360cb3c32b72e80b7d72570ee3bf0103d1e26517bb163`, CSS `index-f58pl4aP.css`(356,058bytes) `be5043e056f9ded15ecad6ab7db8aeb0a2e1319bcfad3526864c88669613af78`가 같은 build의 전체 바이트와 일치했다. 작업 트리 변경은 없었다. 이 기록은 새로 실행한 합본의 결과이며 이전 단독 PR 기록과 구별한다.

| suite | production / published 검사 | 원본 PNG(각 실행) | published artifact | ZIP SHA-256 |
| --- | --- | --- | --- | --- |
| book-volumes | 14 / 14 | 39 | 12252164208 | `5d6f0022b39e2e3b522f39df9c959846a7e32435f86196f6f9049feb1ec66fde` |
| database | 415 / 416 | 259 | 12254815687 | `06b9a9c5d102a410e7ba0ffa39dd6f4b7a1764b1c19b4aa38db740d6ca4e659a` |
| housing | 189 / 189 | 248 | 12253461905 | `d127126a9208a369d506e0a38ad35ef335e4de1193b3f8ba2794982b49968987` |
| accounting | 101 / 102 | 102 | 12252064689 | `df7701ce5a9fde7aa087b8adfe7f3b2125fdd20c0009d5a525a6aa97df872af8` |

모든 앱 실패·page 오류·미확인 console/resource 오류는0이다. DB·주거·회계 published에는 각각 정확히 `https://middleages.github.io/favicon.ico`의404 한 건이 별도 진단으로 남고, 권차에는 없다. 이 알려진 호스트 기본 아이콘 진단을 앱 자산 실패로 처리하지 않되 ‘모든 콘솔 메시지0’으로 축약하지 않는다. 원본 ZIP은 모두 GitHub digest와 대조했고, 직접 검토용 native crop은 원본 PNG 수에 포함하지 않는다.

실제 게시 원본 직접 검토:
- 통합 담당자는 권차1440-home,320-housing-heading,390-reading-first를 열어11권·107장, 회계4/주거12/DB6/세금12 분모와 고정 권차·읽는 책 우선 순서를 확인했다.
- 주거850-housing-shocks-initial 전체에서14월 동결·현금323.04/248.58와 두 별도 눈금,320-moving-and-shocks-changed에서20일 부족8천만원·30일 반환을 소급 적용하지 않는 경계,320-reading-housing-buy-revealed의native상단0–1700px에서2억원의세 부분과 예정대출8천만원≠실제입금 구별을 확인했다. 정적 표의 모든 가로 열이나 native crop 아래까지 수동 검토했다는 뜻은 아니다.
- 회계 작성자는1440-revenue-advance-step-2,320-revenue-credit-step-2/3,1440-revenue-next-period-step-4,1440-expense-payment-0-step-4,320-expense-payment-40-step-6 원본6개를 열었다. 선입금 의무400/매출0,인도 매출400·원가240,M2회수 신규이익0,지급0의비용80·지급60·의무60,M3부분비용20·누적120이 유지되고 잘림/겹침이 없었다.
- DB 작성자는320-c05-atomic-item-constraint-error-item-error,390-c05-atomic-success-commit,1440-c06-conditional-update-commit-B-resume,320-c06-snapshot-repeatable-read-complete,320-c06-deadlock-opposite-B-wait-101,390-c06-select-for-update-commit-B-resume 원본6개를 열었다. 오류 후보/취소 이력과 현재 저장 경계,세 갈래 확정,UPDATE0/잠금SELECT1,과거5→5와최신3,소유/대기 순환의 방향이 유지됐다. native select 긴 문구는 축약되지만 아래 그림/본문이 보완하며 새 차단점은 없었다.

DB C와 회계 B의 이 배치 공개 게이트를 닫는다. 주거 F는 소개·12장 전체가 실제 게시되고 위 영향 범위 확인은 완료됐으며, 전체권 완료 판정의 마지막8×2 넓은 회귀는 아직 진행 전/별도 기록을 따른다. 실제 기기·Safari/Firefox·스크린리더 음성·학습효과 및 실제 DB/거래/계약 실행은 미검증이다.


## 고정 main 전체권 최종 회귀 완료 · 2026-10-20

[읽기 전용 최종 실행39399756955](https://github.com/Middleages/my-books/actions/runs/39399756955)은 09:42:41 UTC에 build와 production/published 각8suite, 총17job 모두 성공했다. 실제 앱 checkout은 main `47c36cc06fad15d87afd040ac5c259b421714d52`, tree `09766eee17e80d322b382d544b99085f7450916a`로 고정했다. 별도 verify 브랜치의 workflow commit `75020ab7704026b62897060a227f5fce1f91299b`만 사용하고 main workflow·배포 권한·앱 소스를 바꾸지 않았다. 이 검사는 재배포가 아니다. 앞선 main1134/1134 단위·393 modules build/Pages 성공과 함께 판정한다.

단일 build 산출물을 모든16job이 공유하고 각 job 전후 source/tree·clean·main 고정 여부를 확인했다. 전체 JS/CSS bytes를 같은 build와 대조했고 published에서는 실제 Pages 응답 bytes도 일치했다. JS `index-DsaNx52x.js` SHA-256 `42e3024c3a64992ebbd360cb3c32b72e80b7d72570ee3bf0103d1e26517bb163`, CSS `index-f58pl4aP.css` `be5043e056f9ded15ecad6ab7db8aeb0a2e1319bcfad3526864c88669613af78`다. 최종 별도 API 재확인도 main47을 유지했다.

총 **2589개 검사·4430개 고유 원본 PNG(각 job 내부 고유 수의 합)**를 생성했다.16개 ZIP의 GitHub SHA-256 digest와 내부 source/lease/결과를 모두 대조했다. 생략 suite는 없다. 모든 앱 오류·미확인 console/resource 오류는0이다. tax·database·kubernetes·housing·accounting의 published에는 알려진 호스트 루트 favicon404가 각각1건 별도 진단으로 남는다. 이를 전체 콘솔 메시지0으로 바꾸어 쓰지 않는다.

상세 suite별 artifact와 이번 주거13장면 직접 검토 범위는 [F 최종 기록](HOUSING-BATCH-F-VERIFICATION.md)을 따른다. DB C·회계 B의 실제 게시와 주거 전체권의 마지막 넓은 게이트까지 닫았으며 이후 신규 책 등록과 섞어 검증한 것으로 쓰지 않는다.

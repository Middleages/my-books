# 다섯 후속 배치 통합 검증

작성: 2026-10-20 UTC. DB D07–08·회계 C05–06·확률 B03–04·관측 B03–04·육아 발달 B03–04의 독립 검증 소스를 합친 후보다. **아직 main/Pages/실제 게시 완료가 아니다.** 새 네 권 A 합본의 실제 게시 게이트가 닫히기 전에 이 후보를 main에 공개하지 않는다. 인증 B와 이 다섯 책의 더 뒤 배치는 포함하지 않는다.

## 보존 기준과 정확한 범위

새4A의 PR51 검증 앱 tree `97d1a12844afbcddcc90c067000cb14877ee9db6`와 최신 문서 마감을 보존한 로컬 `90e713e` 위에 다음 소스를 통합했다. 각 책의 본문·UI·순수 모델·전용 검증기·테스트는 표의 작성자 소스와 바이트가 같음을 경로별로 확인했다.

| 배치 | 작성자 소스와 문서 마감 기준 |
| --- | --- |
| DB D07–08 | 공개 be3ee2647db82fabccacf5a0b8ce5236fcea1e8a와 문서0e352a156f97a0e90c5c4683109e08b745dff21c |
| 회계 C05–06 | 공개 b9187b44e12d1e44e61946529893df3808b206b2와 동일 파일의 로컬 f1644f690882ae1fcade6323ed783f89b2a9df76 |
| 확률 B03–04 | 공개58842af5e97c257b3e201b14efe5eb4de69c3b74와 로컬17508bf18457e25286a16c34bcbbe02614345467, 검증 문서 전용 마감 |
| 관측 B03–04 | 공개faf007c04597de593d146ba1553522562cb70f73와 문서da24962e4fe18f7a42cf2b918caf1136d68b5d75 |
| 육아 발달 B03–04 | 공개c9650d6의 검증 소스와 로컬2737ac3fe7f99ffcb519268c8abd353dce91e486 문서 마감 |

카탈로그는 책별 import·chapter·book 레코드만 합쳤으며 비대상 책의 레코드는 바꾸지 않았다. 현재 후보의 본문 수는 DB8·회계6·확률4·관측4·발달4·인증2·주거12·세금12다. 선행 게시 상태와 이 후보의 준비 상태를 구분한다. 다른 책의 앱과 공용 표지·분야·권차·URL·readId·저장 키, workflow·package·lockfile·suite 등록/선택기는 그대로다.

## 실제 로컬 검증

로컬 앱 소스 `3e6dac9cb29406920099e98e5ea21e0cf32bb438`, tree `641ebd608749d40010a5b3a89fd8e33eae1403a6`에서 모든 테스트 파일을 유지한 `node --test --test-concurrency=4 tests/*.test.mjs` **1225/1225**, TypeScript·Vite **447 modules** build, `git diff --check`를 통과했다. 그 뒤 이 검증 문서 추가는 앱 바이트를 바꾸지 않는다.

JS `index-C-WWcxzg.js` SHA-256 `825846cd000f3e20dbe9af1003ae406379da5e703d4252c63994eca6199abf93`, CSS `index-DCxMGGOC.css` SHA-256 `d7c9dbb3619fd2e8e0c93706df7c52e01b7fca876299b7125ad431b27aa2eddb`다.

실제 diff의 선택 범위는 **book-volumes, database, accounting, probability, observability, child-development 여섯 suite**다. **insurance, investing, tax, kubernetes, housing, authentication 여섯 suite는 이번 후속 실행에서 의도적으로 미실행**이며 통과로 쓰지 않는다. 선택한 suite의 기존 단언·정적 대안·키보드·reduced-motion·원본 캡처는 줄이지 않는다. 전체 단위/build와 공용 홈·권차는 유지한다.

작성자별 source production·직접 원본 검토는 인계 당시 닫혔지만 이 합본의 실제 production·새 원본 검토는 별도 게이트다. main·Pages·정확한 게시 JS/CSS·published 검사는 선행4A 공개 뒤 조율된 창에서 수행한다. 실기기/스크린리더 음성·실제 금융/DB/관측 시스템·의료 진단은 검증하지 않는다.


## 실제 합본 production·직접 원본 완료

[PR57](https://github.com/Middleages/my-books/pull/57) head `0ea69e85db5b3922c0cf44dfc07b7cb2c7b6d4ee`, 실제 checkout `727aa8080e15008633edcab423dc1e4d8403e2ac`, tree `8c62673b32dce42e8a8e7169ac3246b214caea83`의 [run39403584170](https://github.com/Middleages/my-books/actions/runs/39403584170)이2026-10-20 10:01:34 UTC에 전체1225/1225·447 modules build와 선택6개 production 모두 성공했다. 총1068검사·927원본PNG, 앱/page/console/resource 오류0이다. source가 추가된 다섯 책과 공용 권차만 선택했으며 앞서 명시한 나머지6개는 의도적으로 미실행이다. PR의 deploy/published는 skipped이며 공개 성공을 뜻하지 않는다.

모든6개 ZIP의 GitHub digest와 source/clean·결과를 대조했다. tree 필드가 있는 report는 위 tree와 일치하고 실제 scope artifact도 같은 tree의 선택6/생략6을 보존한다. 생산 서비스의 JS/CSS 전체 bytes/해시는 위 로컬 build 자산과 일치했다.

| suite | 검사 | 원본 PNG | artifact | ZIP SHA-256 |
| --- | --- | --- | --- | --- |
| child-development | 57 | 156 | 12256587498 | `f286d7014a7d899317985f3cec70e142b167b530da159d0b0481da6e944ead5e` |
| database | 511 | 405 | 12256324534 | `38ccbac116233a3347249f264c055796c9603a02b477eabb0c779d4f487ca3f9` |
| observability | 18 | 69 | 12255907854 | `fb96753de33f044119b90c7c040520e4e19faa433586745961a29951609577ef` |
| probability | 268 | 73 | 12255773497 | `1d26080b301d35ddc43977bf14f9b42fa694e7a672309455cd1a482d16f884fc` |
| book-volumes | 14 | 51 | 12255452468 | `242869339c21c893156182a0024449dc4a056b036f9b75a2e1be648668b0df2a` |
| accounting | 200 | 173 | 12255213256 | `9271d89b0e942998ba3a660befed3d3fa6f44b787e71330814f6c9e1e148ad78` |

새 합본 원본의 직접 검토:
- DB 작성자6장:320-d07-pool1-leak-final,1440-d07-pool1-leak-dispatch-0,1440-d07-binding-split-update,320-d07-binding-split-final,1440-d08-nested-loop-true-low-final,320-d08-app-calls. 긴 nested 그림은 원본 해상도 상단도 읽었다. 요청→client→session, SQL 끝난 뒤 미반환과 대기3/열린1/반환0, C1취소와 C2확정4, 평균1.5×loops2=3, DB 반환합3/5와 앱 조립3을 구별했다. 통합 담당자도320-app-calls·1440-budget-3x2·390-binding-split-final 원본에서 단위·설정 상한/실제 연결·분리 client 경계를 확인했다.
- 회계 작성자8장:1440-inventory-single-80-step-4,320-inventory-fifo-60-step-4,1440-inventory-average-60-step-4,1440-working-stock-credit-160-step-6,320-working-stock-paid-160-step-6,320-working-due-before-160-step-6,1440-working-due-after-160-step-4/6. 수량20/80·원가60+240=300,350의 FIFO160/190 대 평균140/210, 외상/지급60,12일 부족10을 말일510으로 지우지 않는 반례와20일 성공150을 확인했다.
- 관측 작성자5장:1440-logs-late,320-logs-duplicate,320-logs-unsafe,320-metrics-gap,1440-metrics-gap. 사건1초/관측5초,4로그=3사건=2요청, 실제 비밀 없이 필드 제외, counter/gauge 모두20초 미정·인접 증가율 미정, 요청 시간의 실험 원본 경계를 확인했다.
- 육아 작성자5장:320-record-no-chance,1440-record-assisted,320-movement-grasp-near-1,1440-movement-release-near-1,320-movement-turn-near-1. 기회 없음/도움 구별, 손과 물체의 접촉·분리·방향 및 실제 크기/발달점수 아님을 확인했다.
- 통합 담당자 확률10장면:320-frequency-records,1440-frequency-theory,320-frequency-zero-observed,320-conditional-selection,1440-conditional-tree,320-conditional-empty,320-frequency-controls,320-conditional-controls,320-conditional-static,320-conditional-tree.3/100관측과가정1%,0관측≠불가능,공통0–100%축,같은10000집합의 네 칸,알림90/288=31.25%,빈조건0/0미정,모바일분기/정적대안을 확인했다. 별도100행 정적 원본은 전체 구조만 열었고100개 행을 하나씩 읽었다고 주장하지 않는다.
- 홈1440 전체와320-home·390-reading-first native상단0–1900px:15권·125장, DB8/회계6/확률4/관측4/육아4·인증2·주거/세금12와 읽는 책 우선 순서·고정 권차를 확인했다.

검토한 원본 범위에서 새 의미·잘림·겹침 차단점을 찾지 못했다. 모든927PNG 또는 모든 표 행·실기기/스크린리더를 수동 검토한 것은 아니다. 이후 실제 main `9c1df885218915bd368744e1420c3c17ce911fd1`의 A 및 주거 전체권 마감 기록을 로컬에 보존 병합했고, 위 검증 앱·모델·검증기·테스트·workflow와 바이트 차이는0이다. 그 A의 실제 게시 게이트를 먼저 닫은 뒤 이 후보의 정확한 main/Pages/게시 자산·대표 화면을 별도로 확인한다. 더 뒤 배치는 포함하지 않는다.


추가 직접 검토와 알려진 편집 한계: 확률 작성자가 같은 PR57의320-frequency-zero-observed,320-frequency-theory,320-conditional-empty,320-conditional-tree,320-conditional-controls,320-conditional-static 원본6개를 다시 열어 관측0/100과 가정p, 양의 꼬리 확률, 빈0÷0, 네 칸의 건수와90/288을 확인했고 이 범위 차단점을 찾지 못했다. DB 작성자는 별도 SSR에서07의 첫 `연결 풀(connection pool)`과08의 `실행계획(plan)` 정의 두 곳의 Markdown 강조 별표가 글자로 남는 편집 문제를 발견했다. 모델·그림·문장 의미가 달라지는 오류는 아니지만 강조 렌더까지 완전하다고 주장하지 않는다. 검증된 이 후보의 앱 바이트를 임의로 바꾸지 않고, 앞 장의 같은 사례와 함께 후속 최종 편집 및 SSR 회귀에서 수정·재검증한다.

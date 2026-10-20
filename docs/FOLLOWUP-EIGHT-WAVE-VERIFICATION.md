# 여덟 후속 배치 통합 검증

2026-10-20 UTC. **로컬 통합·전체 단위/build 완료, 이 합본 production·직접 새 원본·main/Pages/실제 게시 검사는 아직 대기**다. 선행5배치 main358c59bb와 신규 육아2/3 A PR69의 순차 게시 게이트를 먼저 닫는다. 검증된 각 책의 다음 두 장만 포함하며, 한 책의 선행 배치를 건너뛰어 공개하지 않는다.

## 범위와 작성자 검증 소스

| 책·배치 | 정확한 로컬 소스/마감 기준 | 작성자 실행 및 전용 검사 |
| --- | --- | --- |
| DB E09–10 | 3c26844efa2089015a1f2188b530e72acb9e6e7a; 실행2adb6d71751caf3c0f89c6a16e147d81aff3ae35 | PR55/run39409811356,576검사·581PNG |
| 회계 E09–10 | 2e6a962f33bdcc7e2b23c90aac5254f6bf78962a; 공개f429f51817f34f5cf70131cd9813e2b9fb319960 | PR49/run39401427984,332검사·297PNG |
| 확률 D07–08 | 83c07f2e75b31adec9a73cf76d61d6833cc26d63 및 별도 최종 검증 문서 패치; 공개7dc01b77ee37aae4b4905384fd38eb9d706a3e86 | PR61/run39409147669,533검사·182PNG |
| 관측 D07–08 | 40aade18f3b3e0b36c6bf017f6e63740c9166d94; 공개28cc3d74298cf15a5149edcd0d70553590d1ca7b | PR64/run39409788373,34검사·144PNG |
| 인증 C05–06 | b3e4aae173bf3e3731abc938bd4c3c7fc11e1ea7; 공개b404549632f4ee577a56ab0329a67bd43e74ca76 | PR62/run39407882997,27검사·150PNG |
| 육아 발달 D07–08 | c9a14ab0539a075eb8e1dc8876403a3e8b883d1e; 공개aafb7bb3fa95258473a8a95e81a7ef8cab13cc17 | PR47/run39395565338,97검사·371PNG |
| 수면 B03–04 | 5be120e364eb3cbd430462a958fd51b4ac08f146; 공개f96671bd1acf56de30e818cea256dc38b7bac27f | PR65/run39411650452,50검사·109PNG |
| 먹기 B03–04 | 8b49592cf591ede76a2c8fc59b933a94e62ec7b5; 공개3bbf509e895977761213d1f20ce3fe20f10281ea | PR68/run39411916216,42검사·85PNG |

각 작성자의 전용 source/원본 직접 게이트는 인계 때 완료했다. 위 실행의 전체 범위·이전 실패/교정·수동 표본 한계는 각 배치 문서를 따른다. 이 표는 새 합본이나 실제 게시의 성공을 대신하지 않는다. 더 뒤의 DB/회계F, 확률/관측E, 인증D, 발달E, 수면/먹기C는 포함하지 않았다.

## 보존 검증과 두 메타데이터 교정

PR69 앱 source ecf9d67dc5a35876aa6565b8b8cabe4c2c2d79e9의17권·14종 검증기 위에 각 책의 import/chapter/book partition만 합쳤다. 나머지9권의 앱·본문·모델·카탈로그 partition, 모든 기존 권차·URL·readId·저장 키·공통 선언·표지·workflow·package/lockfile·suite 선택기와 공개 장수 검사는 보존했다. 각 책의 공개 본문 장수는 DB10·회계10·확률8·관측8·발달8·인증6·수면4·먹기4이며 총17권155개 본문 장이다.

각 대상의 본문·UI·순수 모델·전용 browser verifier는 위 작성자 소스와 바이트가 같다. 수면은 최신 A 안전 두 문장과 네 폭 렌더/PNG 검사를 보존하는 B 안전 보강판을 사용했다. 실제 아이 기록·인증 비밀·금융계좌·DB/관측 서버 연결을 새로 추가하지 않았다.

첫 전체 단위 검사에서 공통 `catalog-published-count`가 인증C의 실제6장 대비 소개4장 표기를 잡았다. 같은 독립 대조에서 관측D의 실제8장 대비 소개6장도 발견했다. **해당 두 book ID의 future 범위만06/08로 교정**했고 나머지 문구/책/순수 모델/테스트 단언은 변경하지 않았다. 원래 실패(1338통과·1실패)를 보존하며 성공으로 소급하지 않는다. 해당 두 레코드는 작성자 원본과의 명시적인 유일한 메타데이터 차이다. 기존 장수 검사를 완화하지 않고 집중9검사 및 전체를 다시 실행했다.

실제 main358c59bb의 이전 공개 마감과 PR69의 최신 source 마감을 문서로 보존 병합했다. 이미 검증한 앱을 과거 카탈로그나 오래된 공유 파일로 덮어쓰지 않았다. 최초 A와 각 배치의 역사 기록은 현재 상태와 구분한다.

## 로컬 실행과 실제 후속 범위

교정 후 `node --test --test-concurrency=4 tests/*.test.mjs` **1339/1339, 실패·건너뜀0**, `NODE_OPTIONS=--max-old-space-size=2048 npm run build` **524 modules**가 통과했다. 제한 build는11:25:27–11:27:23 UTC에1회 수행했고 기존 대형 bundle 경고는 남는다. 이 기록은 브라우저나 임상 검토를 대신하지 않는다.

- JS `index-DY1jvW9T.js`:3734150bytes, SHA256 `9e74ccf8a326cf2b3b70b19c505cda306ebfe3f18c29aab369bb8ec8cf85c7b7`.
- CSS `index-ButlMfaq.css`:431679bytes, SHA256 `a3ba24be5c8c864c0005db11e581868d4932e712ca46e0bd975d73ef2dca7487`.

PR69 이후 실제 diff의 선택 범위는 **book-volumes,database,accounting,probability,observability,child-development,authentication,child-sleep,child-feeding 9종**이다. **insurance,investing,tax,kubernetes,housing 5종은 의도적 미실행**이며 통과로 세지 않는다. 새 등록이나 공통 실행 인프라 변경은 없다. 선택한 verifier의 모든 기존 단언·모델 관계·정적 대안·키보드·reduced-motion·원본 캡처는 유지한다.

앞으로 이 합본의 실제 production 및 새 원본에서 DB 복구 시간축/라벨, 회계 보고서와 현금 조정, 확률 공동분포/정적 표, 관측 전달과 ACK, 인증 위임/객체 경계, 발달 놀이/출처 연령, 수면 두 과정/참고 구간, 먹기 형태/준비 조건과 모바일 조작을 직접 확인한다. 선행 게시 이후 exact-main 단위/build→선택9 production→Pages→같은 산출물의9 published와 JS/CSS 전체 바이트 대조를 별도로 닫는다. 실제 시스템·실기기·스크린리더 음성·의학/영양 전문가 감수는 미실행으로 남긴다.


## 실제 합본 production·직접 원본 게이트 완료 — 2026-10-20

[PR72](https://github.com/Middleages/my-books/pull/72) head `4b55f32881bc489269b805343f8d49d8ecc3ad92`, actual checkout `8142a5ba33b5ea19e8e1850384afc7ecebb346d9`, tree `943169b8a80ee63cb5d08d3ee58e30d94c447bf5`의 [Actions39415697607](https://github.com/Middleages/my-books/actions/runs/39415697607)에서 **전체1339/1339 단위·524 modules build, 선택9종 production1705검사·1976원본 PNG**가 모두 성공했다. 앱/page/console/resource 및 별도 호스트 진단은0이다. 보험·투자·세금·쿠버네티스·주거5종은 이 실행에서 생략했으며 통과로 세지 않는다. PR의 deploy/published는 skipped다.

모든9 ZIP의 GitHub SHA256 digest와 다운로드 바이트, clean source/결과 및 scope의 정확한 tree·선택9/생략5를 대조했다. DB report는 source SHA를 기록하며 tree는 같은 checkout의 scope와 함께 확인했다. JS `index-DY1jvW9T.js` 3,734,150 bytes·SHA256 `9e74ccf8a326cf2b3b70b19c505cda306ebfe3f18c29aab369bb8ec8cf85c7b7`, CSS `index-ButlMfaq.css` 431,679 bytes·SHA256 `a3ba24be5c8c864c0005db11e581868d4932e712ca46e0bd975d73ef2dca7487`의 전체 바이트/해시는 로컬 최종 빌드와 일치한다.

| suite | 검사 | 원본 PNG | artifact | ZIP SHA256 |
| --- | --- | --- | --- | --- |
| child-sleep | 50 | 109 | 12262130940 | `dcb7dd513f435aeb0a0e3845992dca06900a445f48f1b990fd8f18743d651690` |
| authentication | 27 | 150 | 12262066348 | `b00591ccb0d11b83278605ee21b53bd64dabb081072b888957dbe07bb3e21beb` |
| probability | 533 | 182 | 12261917628 | `dfb2c321032ac70922229bf76b892d5ea01daf44394e9bb9c2d20613b17ce43b` |
| child-development | 97 | 371 | 12261866729 | `7351308a1b7805ca2450a3bb5bc6ac5ac933e655f6a0403ac523af2db971840a` |
| database | 576 | 581 | 12261799256 | `3a3fe21f9dbcf58d03c7a123818e8381b8d6e6aa01d97e6872ad9a1d3055cabb` |
| child-feeding | 42 | 85 | 12261546757 | `d85477f7de466fd274f0f7282990c5c06c449d7748d6ca44e7b2ed1321d81cbe` |
| accounting | 332 | 297 | 12261467604 | `be04c1d23bfb74272a9d9a2137c7ccc6b9ae640ce304152df1b4eedfa7d2bc0c` |
| book-volumes | 14 | 57 | 12261292056 | `268e66438fd5787598c6718fbef6b24fc73657601274adaf0c5dd12718606ec9` |
| observability | 34 | 144 | 12260763269 | `5c9a2e057b31a5483b1e79ed1782fd24fbce68de513ecfa4e623933dfd9cb248` |

### 새 합본 원본 직접 검토

- 회계 E09–10: `320-profit-cash-no-collection-profit-final.png, 1440-profit-cash-full-collection-profit-final.png, 320-statements-base-position.png, 1440-statements-period-mismatch.png`. 통합 담당자가 네 원본 전체를 직접 열었다. 회수0의 영업−310/기말65, 회수400의 영업90/기말465, 0 조정의 0 길이, 1200 공통 눈금의 기초500/기말795 및795=390+405, M1과 일부 M2를 합산하지 않는 기간 경계를 확인했다.
- 확률 D07–08: `320-dependence-static.png, 390-dependence-static.png, 320-dependence-static-end.png, 390-dependence-static-end.png, 320-dependence-losses.png, 320-dependence-mass20.png, 320-association-standardized.png`. 작성자가 일곱 원본을 직접 열었다. 정적표 양 끝의 열 간격, 동일 금액/확률 축, 손실150 비교선과 현금 청구의 구별, 재가중130/120과 원래100/150 보존을 확인했다. 공동 손실·재가중 비교이지 효용 모형이 아니다.
- 관측 D07–08: `1440-delivery-ack-pending.png, 320-delivery-ack-retry.png, 390-instrumentation-duplicate.png`. 작성자가 세 원본의 핵심 영역을 직접 열었다. 저장3과pending3 동시 존재, 재전송6기록≠3고유사건, 실제요청1≠span3 및 모바일 ACK 역방향을 확인했다. 모바일은 원본 y1800–3600 범위도 분할해 읽었다.
- 인증 C05–06: `1440-oidc-nonce.png, 320-delegation-object-denied.png, 390-oidc-normal.png`. 작성자가 세 원본의 핵심 도식을 직접 읽었다. nonce 실패 뒤 세션 미실행, scope 통과≠소유권, front/back 경로와 별도 API 인가를 확인했다. 모바일은 원본 y1800–3600 범위도 분할해 읽었다.
- 육아 발달 D07–08: `320-play-hide-2.png, 1440-play-container-2.png, 320-first-year-2-cognitive.png, 1440-first-year-12-all.png`. 작성자가 네 원본에서 가림·그릇 관계, 원출처 다섯 연령의 간격과 발췌 없음≠능력 없음을 직접 확인했다.
- 육아 수면 B03–04: `320-caregiver-boundary.png, 1440-caregiver-boundary.png, 320-rhythm-rested-day.png, 1440-reference-twelve.png`. 작성자가 네 원본에서 안전 보강 두 문장, 독립된 두 층과12개월 원문 중첩을 직접 확인했다.
- 육아 먹기 B03–04: `320-mealtime-unknown.png, 1440-mealtime-moving.png, 320-preparation-cut.png`. 작성자가 세 원본에서14px 관찰/모름 라벨, 이동 중 식사 회피, 자르기≠부드러움을 직접 확인했다.
- DB E09–10: `1440-e09-uncommitted-page-final.png, 390-e09-sync-after-flush-before-ack-final.png, 320-e09-local-visibility.png, 320-e10-physical-continuous-final.png, 390-e10-missing-wal-final.png, 1440-e10-validation-failure-final.png`. 작성자가 여섯 원본과 긴 모바일 세 개의 native 범위를 직접 확인했다. 저장 버전·확정·응답 불명 및 선택된 새 조회를 구별하고,09:58/10:00 라벨 분리, 연속11/시간차4와 누락7→연속6/시간차9, 복구 뒤 검증 실패의 서비스 미복구 경계를 확인했다.
- 공통 홈3원본:1440-home 전체와320-home/390-reading-first의 native 상단0–2000px.17권·155장, 각 대상 책의 공개 분모와 고정 권차·읽는 책 우선 정렬을 확인했다.320px hero 한 글자 줄바꿈은 기존의 경미한 미관 한계다.

총37개 고유 원본의 위에 명시한 범위를 직접 검토했다. 새 의미·겹침·잘림 차단점을 발견하지 않았지만1976개 모두나 모든 표행·실기기·스크린리더·실제 DB/SSO·임상/개인 금융 판단을 검증했다는 뜻은 아니다. 검토용 native crop은 원본 수에 더하지 않았다.

이후 실제 main `2c2b11d3ba9af855dd4724e91051ea775d94051b`의 이전 파동 마감 문서를 보존 병합했다. PR72 검증 앱/모델/전용 검증기/테스트/workflow/package 바이트는 그대로이며, source 검증 뒤 문서 변경 때문에 이전 source tree를 최종 게시 tree라고 바꿔 쓰지 않는다. 현재 main2c2b의 육아2·3권 A 실제 게시 게이트를 먼저 닫고 이 여덟 배치를 순서대로 공개한다. **이 파동의 main/Pages/실제 게시는 아직 미완료다.**

## 우선 월령 예시를 보존한 PR82 합본 재검증

PR82 head98f1cf8e5a92fa0acb949236d96588add203bd8b, tree91690a1f261377342ec7d8a1e5bed6a61904c067의 [run39422040225](https://github.com/Middleages/my-books/actions/runs/39422040225)은 전체1342 단위·527 modules build와 변경 영향2종(발달·권차)을 성공했다. 실제 checkoutb7df920b1cda3b3157dd29865dba0fe669f7beac은 같은 tree/clean이다. 발달107/107·426원본PNG, 권차14/14·57원본PNG, 앱/호스트 진단0이다. 이 delta 실행에서 나머지12종은 생략했으며 성공으로 세지 않는다. 앞선8배치 자체 합본9종 결과와 구별한다. 실제 main에서는 선행 월령 우선 패치 위에 원래8배치 영향9종을 다시 실행한다.

발달 artifact12264256261 ZIP SHA256 `6a092bb8c2147b43d63d28ccca44bdfa1fe8db53600c4f73e2d486b65e3975dc`, 권차12264526215 ZIP SHA256 `b41bce408cb527fa1d45ca7457074dc2f0547f5bc0975284b047f01a5ea7b0ad`를 실제 다운로드 바이트와 대조했다. scope·단일 Pages build ZIP도 대조했으며 JS `index-D4U0skud.js`3759319bytes SHA256 `eb6769f8f4f5cd4a0e59c154c8772b6db5fed1851bad2eb23eb19e885c3cd714`, CSS `index-A6M_WG3y.css`433985bytes SHA256 `0cc64da5367ebbdc4385f85656add2553d0df982285f68dd073add70c09a2d22` 전체 바이트가 로컬 빌드와 일치했다.

작성자는 새 원본320-age-scenes-2,390-age-scenes-18,320-pointing-request/share,390-age-scenes-between-17,320-play-hide-2,1440-play-container-2,320-first-year-12-all의8개를 직접 열었다.50개 구체 장면의 책 태그·원출처 영역, 요청/관심 공유 선 종점, 비보간 안내와 기존 놀이 물체 관계·인접 제어를 확인했다.17개월 이미지는 안내 문단만이며 양쪽 그룹 동시 렌더는 DOM 검사,13개월은 모델 단위 검사로 구별한다.08은 기존 두 발췌 예시를 유지하며 더 풍부한08–10 연결은 별도 후속 검증 대상이다.

통합 담당자는1440-home 전체와320-home/390-reading-first의 원본 native상단0–2000px를 열어17권155장, 육아 고정1/2/3권·수면/먹기0/4, 읽는 책 우선 뒤 네트워크2/돈1의1/15·1/10 진도를 확인했다. 이11개 고유 원본의 한정 범위에서 새 잘림·겹침·의미 회귀는 없었다. 기존320 hero의 마지막 한 글자 줄바꿈은 경미한 미관 한계다. 전체483원본의 사람 전수 검토·실기기·스크린리더·임상 감수·실제 게시 완료로 확대하지 않는다.


## 정확한 main·Pages·실제 게시 게이트 — 2026-10-20

최종 main `5b257ffccec0199c960a1ec25bec27e81351dc31`, tree `8addcb735c563962876bb6873c3b19d335932895`의 [run39425708305](https://github.com/Middleages/my-books/actions/runs/39425708305)에서 전체1342/1342 단위·527 modules build, 선택9종 production **1715검사·2031원본 PNG**, Pages 배포(13:08:22UTC), 같은9종 published **1723검사·2031원본 PNG**가 순서대로 성공했다. 20개 job이 모두 성공했으며 총3438검사·4062원본 캡처다. 보험·투자·세금·K8s·주거5종은 이 영향 검사에서 생략했다.

모든 ZIP SHA256과 source/clean 상태, scope의 정확한 main/tree·선택9/생략5, 단일 build artifact12266555326을 검증했다. 위 PR82의 JS/CSS 이름·해시·크기를 그대로 유지하고 실제 배포가 제공한 전체 바이트까지 일치했다. 앱/page/console/resource 오류는0이다. 실제 게시에서 권차를 제외한8종에 각각1건 관측된 `https://middleages.github.io/favicon.ico`404만 정확한 호스트 기본 favicon 진단으로 별도 보존했으며, 이를 모든 콘솔 메시지가0이었다고 표현하지 않는다. 앱 경로/다른 URL·status·출처 없는 오류는 제외하지 않았다.

| suite | production 검사 | published 검사 | mode당 원본 PNG | published artifact | published ZIP SHA256 |
| --- | --- | --- | --- | --- | --- |
| database | 576 | 577 | 581 | 12267741621 | `69af5c49328403b344eaae55c2a1ed045b72d80db16ab21fdb442baa34cd82aa` |
| probability | 533 | 534 | 182 | 12267271353 | `33335d33fded96a80c0ed288d58d116104fd3e318f91c4ff625e267ccad2aed1` |
| accounting | 332 | 333 | 297 | 12266892734 | `e6020354d482c9522d4e6e1130761cd29e7bbe052b49aea4e314514adddde0d7` |
| authentication | 27 | 28 | 150 | 12266876825 | `c16f5be9f74a8e20214c124dacf4bc39387ae96f99195daf4a5b8f6e1c6d6413` |
| observability | 34 | 35 | 144 | 12266832063 | `97294448fc6cd6bf2bb683234784c67725068842ea997691a0ea6adac30fc44a` |
| child-development | 107 | 108 | 426 | 12266542713 | `d3dc0b8695f2bab5b72a1eb0a9e4f12d08efd25fa61d5487edbbc7c8b6717620` |
| book-volumes | 14 | 14 | 57 | 12266458670 | `ff33583f30323c90c0d0aa2457b7510fe03c825694834f01f955f350cac44952` |
| child-sleep | 50 | 51 | 109 | 12266392549 | `79e00830a99ee9127d13e77cfa00674097be8a0a3713130a38a6a121a522f2e4` |
| child-feeding | 42 | 43 | 85 | 12266317685 | `b9de0f5c3152a1fffa97b5c4a2248cb70ab17fa4a3da4a9f41593940b5494c0b` |

### 실제 게시 원본 직접 재검토

다음은 실제 main5b 원본의 대표 범위만이며 전체4062캡처를 사람이 전수 검토했다는 뜻은 아니다.

- 발달6:320-first-year-12-all,320-play-hide-2,1440-play-container-2,320-pointing-request/share,320-age-scenes-2. 기존08의 두 발췌와 소개·02의 풍부한 실제 행동 예시를 구별해 확인했다. 후속 PR84의08–10 다섯 영역 보강이 이 게시에 이미 포함됐다고 주장하지 않는다. 같은 물체의 가림/그릇 안팎, 다음 아이 반응 미확인, 요청/관심 공유 종점, 구체 예시·CDC 원출처 영역과 인접 제어가 유지된다.
- 관측3:1440-delivery-ack-pending 전체,320-delivery-ack-retry/390-instrumentation-duplicate의 native y1700–3700. 저장3과pending3,6복사본과3고유사건, 요청1과span3을 별개로 읽을 수 있다. 모바일 ACK 방향과 제어가 유지된다.
- 인증3:1440-oidc-nonce 전체,320-delegation-object-denied/390-oidc-normal의 native y1700–3700. nonce 실패의 세션 미실행, scope통과와객체 소유 거절, 브라우저/서버 왕복과 앱세션 쿠키 경계가 유지된다.
- 수면3:320-caregiver-boundary,390-rhythm-rested-day,1440-reference-twelve. 보호자 취침 전 별도 적합 수면 공간 복귀·소파/푹신한 안락의자 동반수면 회피 두 문장, 독립 리듬 층과12개월 원문 구간 중첩/평균하지 않음이 읽힌다.
- 먹기3:320-mealtime-unknown,1440-mealtime-moving,320-preparation-cut. 관찰 모름을 안전으로 채우지 않고 이동 중 식사 회피, 자르기≠부드러움, 단단함 빗금과 포커스를 확인했다.
- 회계8:1440-statements-base-position,390-statements-full-collection-position,320-profit-cash-no-collection-profit-final,1440-profit-cash-full-collection-profit-final,320-profit-cash-service-paid-profit-final,390-profit-cash-long-life-profit-final,320-profit-cash-depreciation-step,1440-statements-period-mismatch. 작성자가 직접 열어795=390+405/225, 회수400의465와−0없는0, 무회수−310/65·서비스 완납−170/205·48개월상각5/이익70의 조건별 해설, 비현금상각과 기간 혼합 중지를 확인했다.
- 공통 홈3:1440-home 전체와320/390-home native y0–2000.17권155장 및 대상 책의8/6/4 등 정확한 분모와 고정 분야 권차가 유지된다.320 hero 마지막 음절 줄바꿈은 기존 경미한 미관 한계이며 잘림은 아니다.

확률D와DB E의 직접 재검토까지 완료했으며 아래에 범위를 구분한다. 임상/영양 전문가 감수·실기기·스크린리더 음성·실제 DB/SSO/관측 스택 및 개인 금융 판단은 이 교육용 브라우저 검사에 포함하지 않았다. native crop은 원본 캡처 수에 더하지 않는다.

- 확률D7:320/390-dependence-static 및 static-end 네 원본,320-dependence-losses·mass20·association-standardized. 작성자가 정적표 양 끝의 확률/손실/기말 열,150 손실 비교선≠현금 청구, 기대손실40·꼬리20%, 재가중130/120과 원관측100/150을 직접 확인했다.
- DB E6:1440-e09-uncommitted-page-final,390-e09-sync-after-flush-before-ack-final,320-e09-local-visibility,320-e10-physical-continuous-final,390-e10-missing-wal-final,1440-e10-validation-failure-final. 작성자가 여섯 원본과 긴10장 세 원본의 시간축/RTO/읽기 차단 native4구간을 직접 확인했다. 미확정page4/새조회5, WAL20확정복구4/앱응답불명, 근접 가시성 조작, 연속11→시간차4분/누락7→연속6·시간차9분, RTO21>20 및 읽기차단20분 미완료를 구별한다.

총42개 고유 실제 게시 원본의 명시 범위에서 새 의미·겹침·잘림 차단점을 발견하지 않았다. 이 여덟 배치의 main·Pages·실제 게시 게이트를 완료했으며, 후속 장을 아직 게시했다고 기록하지 않는다. 다음 일곱 배치와08–10 구체 예시 연결은 [별도 후보 기록](FOLLOWUP-SEVEN-WAVE-VERIFICATION.md)을 따른다.

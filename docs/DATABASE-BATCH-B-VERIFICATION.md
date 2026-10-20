# DB 배치 B 검증 기록: 조회·JOIN / 인덱스·비용

확인일: 2026-10-20. 이 문서는 계획·구현·실행 검증·게시 상태를 구분한다.

## 범위와 기준

- 기준 공개 통합 main: `0071bff4c992376bea65ad3a12ce86fafbbe98be`. A·쿠버네티스 보완·범위 기반 브라우저 검사·세금 A·보험 최종 기록·권차를 보존한다. 이 문서를 처음 작성한 시점에는 A의 exact-main/Pages 게이트가 진행 중이다.
- 별도 작업 트리/브랜치에서 03 `queries-and-joins`, 04 `indexes-and-costs`와 해당 readId `database/<chapterId>`만 추가한다. DB는 IT·기술 4권이다. 05–12와 선택 실제 DB 실습은 포함하지 않는다.
- 실제 게시 순서는 A→B다. A의 production/직접 화면 검토가 통과해 B를 로컬에서 준비했으며, B의 로컬 코드나 카탈로그를 현재 공개 Pages라고 부르지 않는다.
- 환경: 기존 클라우드 작업 트리, Node 24.19. 전체 모델 테스트와 TypeScript/Vite build는 로컬에서 실행한다. 실제 Chromium은 GitHub Actions production/published 환경에서 검증한다. 로컬 Chromium 환경 실패를 검사 통과로 세지 않는다.

## 구현 모델과 눈으로 발견할 관계

### 03 조회·JOIN

고정 상점 fixture에서 고객 1의 확정 주문 둘(1001·1002)이 항목 셋으로 갈라지는 관계를 원본 주문과 결과행 사이의 선으로 표현한다. 결과 한 행의 정체성은 고객·주문·줄 번호로 고정하고 원본 주문을 복제해 저장한 것처럼 그리지 않는다. COUNT(*)와 COUNT(o.id)는 결과행, DISTINCT는 원본 주문 묶음을 강조한다. 집계 숫자·금액 누적·표시 SQL은 같은 프레임을 사용한다. 원본 항목 표는 별도 열로 그리지 않고, 결과행의 주문 윗칸과 기존 항목 아랫칸으로 출처를 나눈다. 캡션에 이 생략과 새 항목을 저장하지 않는다는 범위를 명시한다.

- 기본값: 결과 3행, 중복 없는 주문 2건, 수량 7개, 당시 단가 기준 36,000원.
- LEFT 고객 3: 보존된 고객 결과 1행, 주문 id NULL, COUNT(*) 1 / COUNT(o.id) 0 / DISTINCT 0 / SUM NULL. NULL 주문이 저장된 것으로 연결하지 않는다.
- INNER 고객 3: GROUP BY 집계행이 없다. SUM NULL인 한 그룹·합계 0인 한 그룹과 구별한다.
- ON/WHERE 작은 실험은 고객·주문 두 표만 사용한다. WHERE에서 제외한 행은 현재 결과 경계 밖의 별도 영역에 남기고 원본 고객까지 삭제하지 않는다.
- 주문 당시 단가를 사용하며 현재 상품 가격 변경이 과거 금액을 바꾸지 않는다. 이 금액을 결제 완료나 회계상 매출로 판정하지 않는다.
- 논리적 쿼리 관찰 순서이며 optimizer·실제 서버 실행 순서를 재현하지 않는다.

### 04 인덱스·비용

합성 주문 2001–2064의 같은 날짜/id를 유지하고 heap 배치만 바꾼다. 인덱스 뿌리 1개·마지막 페이지 4개, 데이터 페이지 8개·각 8슬롯은 교육용 가정이다. 페이지의 위치/방문 채색, 행 id/슬롯, 인덱스 항목→정확한 행 위치의 선, 반환한 행과 중단 근거를 프레임에서 읽는다.

- 좁은 4일: 인덱스 2 + 모인 데이터 1 = 3페이지, 흩어진 데이터 4 = 총 6페이지. 전체 읽기는 8페이지.
- 넓은 32일: 키33의 경계를 확인하는 마지막 페이지도 세므로 인덱스 4 + 데이터 4/8 = 총 8/12페이지.
- 전체 64일: 인덱스 5 + 데이터 8 = 13페이지. 빈 범위: 뿌리와 마지막 페이지 2개, 반환/데이터 페이지 0개.
- selectedEntry가 경계 확인용 키일 수 있다. 반환하지 않은 경계 행으로 실제 heap 접근 선을 만들지 않는다. 완료 후 포인터 선택은 이미 반환한 행의 위치만 바꾸며 접근 개수/조건을 바꾸지 않는다.
- 두 경로 비교는 공통 0–13 이상의 눈금, 한 칸=고유 페이지 1개다. 8과12,13이 같은 길이로 포화되지 않는다. 시간·비용 단위·물리 I/O 횟수라고 부르지 않는다.
- 쓰기 실험은 논리적 레코드와 인덱스 키의 유지 영향이다. 이전/현재 키의 경계를 나눠 L0→L3 위치 변화를 보이며, 실제 tuple 덮어쓰기·중간 공개 상태·WAL·분할·VACUUM을 재현하지 않는다. 인덱스가 없으면 그 경계와 항목도 그리지 않는다.
- 복합 키는 첫16행 표본을 `(customer_id, created_at)`로 정렬한다. 날짜만 조건이면 고객별 3구간, 고객 조건 추가 시 1구간이다. PostgreSQL 18 skip scan 예외를 밝히며 첫 열 조건이 없으면 절대 못 쓴다고 단정하지 않는다.

## 사전 모델·소스 검토

모델 전용 로컬 commit `fec2697`의 쿼리16개·인덱스41개 테스트, 합계57/57이 통과했다. 48개 쿼리 선택 조합과 NULL/빈 입력/당시 가격 불변식, 페이지 사건/고유 집합/경계 방문/일치 반환 id/논리 쓰기/복합 구간을 검증한다. 전체 테스트 개수와 최종 build는 최종 후보에서 다시 기록한다.

독립 소스 검토에서 다음 두 실제 구조 문제와 한 조작 위험을 발견해 수정했다.

1. 모바일 뿌리→아래 leaf와 위 leaf→항목 선, 쓰기→L3 선이 다른 leaf 상자를 지나갔다. 외곽/중앙 gutter를 통해 해당 leaf의 경계로만 연결하도록 바꿨다.
2. WHERE 제외 영역의 aside가 전역 sidebar의 최소 높이를 물려받았다. 교재 범위 CSS에서 `min-height: 0`으로 고쳐 불필요한 한 화면 빈 영역을 방지했다.
3. 완료 후 포인터 선택이 긴 그림 뒤에 있었다. 그림 직전으로 옮겨 조작과 변경 항목을 가까이 두었다. 모바일 긴 쓰기 설명은 두 줄로 나눴다.

4. INSERT에도 이전 키가 제거된다는 문구가 표시됐다. 모델의 이전 키 존재 여부로 분기해 추가와 갱신의 설명을 구별했다.
5. 복합 키의 일치 칩 색에만 의존하지 않도록 모델의 `spans`를 실제 연속 구간 경계로 감쌌다. 경계 안 항목 id와 개수를 모델과 대조한다.

이는 소스 검토/수정 증거다. 아직 보지 않은 PNG의 판독성 합격으로 대체하지 않는다.

## 공식 근거와 실행의 경계

2026-10-20 PostgreSQL 18 공식 문서의 table expressions, aggregates, ORDER BY, indexes introduction/types/multicolumn과 SQL Server clustered/nonclustered 문서를 확인했다. 실제 인용 페이지·확인일은 각 장의 출처에 있다. 서버 설치·version 조회·SQL 실행·인덱스 생성·실행계획·두 세션·백업/복원은 수행하지 않았다. 문서 major18은 실제 설치 버전 증거가 아니다.

## 남은 게이트

- 최종 source의 전체 unit/build/diff·정적 계약.
- B 모델과 실제 DOM/그림/수치 일치, 1440/390/320px 조작·키보드·정적 대안·움직임 감소·오류 검사.
- 실제 PNG에서 행 분기·NULL 경계·인덱스 페이지/슬롯·초과 없는 공통 눈금·키 정체성·조작 근접성 직접 검토.
- 카탈로그 공개4장, 기존 읽음 ID와 알 수 없는 ID, 홈/분야/권차 smoke.
- A의 실제 게시 게이트 이후 최신 main 통합, 부모가 조율한 main 창, 정확한 B main의 Actions/Pages/게시 자산 일치.

검사하지 않은 Safari·실제 모바일 기기·스크린리더·실제 DB를 통과로 기록하지 않는다. 실제 실행 결과가 생기면 아래에 기준 SHA·run·artifact·해시·직접 본 PNG를 덧붙인다.

## 최종 로컬 검증

최종 B 소스에서 전체 `npm test` **962/962**, `npm run build` **329 modules**, `git diff --check`를 통과했다. DB 전용 모델/검증 계약은 **103/103**이며, 그중 browser verifier의 순수 helper/기존 A 보존/진단 계약은 **14/14**다. 이 숫자는 실제 브라우저 assertion 수가 아니다.

확장한 브라우저 스크립트는 기존 A assertion 본문을 보존하고 B의 프레임·SVG 실제 끝점/다른 객체 관통·공통 페이지 눈금·NULL/제외 경계·키 수명·복합 구간을 검사한다. 정상/움직임 감소 설정에서 키보드·포커스·재생/정지·초기화·설정 변경·경로 재진입과 정적 대안을 포함한다. 새 B 의미 장면은 폭별 21개와 모바일 조작 근접성 4개를 캡처하도록 계획했다. 생성·직접 검토 전에는 screenshot 존재나 시각 합격으로 세지 않는다.

favicon 예외도 검증기 안에서 좁혔다. 정확한 공개 base·호스트 루트 favicon URL·실제404 조건만 별도 진단으로 남긴다. 앱 경로/다른 origin·상태/출처 불명 오류와 모든 requestfailed는 실패로 유지한다. 정상 앱 오류를 숨기는 일반적인 favicon 문자열 필터는 사용하지 않는다.

최종 변경 파일과 main 카탈로그 전후를 범위 분류기에 전달한 결과는 `affected`, 선택 `book-volumes, database`, 의도적 미실행 `insurance, investing, tax, kubernetes`였다. 이후 실제 Actions의 selection artifact로 다시 대조한다. 생략한 네 suite를 이 B 실행에서 통과했다고 기록하지 않으며 전체 unit/build는 그대로 유지했다.

## 첫 실제 브라우저 실행에서 발견한 차단과 수정

첫 PR19 head `ca79dce0ff3609a830837cb2f7dc6f458ecfc346`의 [run39370221400](https://github.com/Middleages/my-books/actions/runs/39370221400)은 build·권차14/14를 통과했으나 DB 검사는 새 조작부를 찾는 timeout을 반복했다. 같은 앱 바이트에 첫 실패 즉시 중단·부분 report/PNG 보존만 추가한 [진단 run39372204923](https://github.com/Middleages/my-books/actions/runs/39372204923), source `a6385cd7e6a3ee9a6f1ad853c7d5eb528965dd9b`는 **43통과·1실패·이후 미실행**으로 원인을 좁혔다. 최초 B 시나리오의 `조회할 고객` exact accessible-name select 조작부 탐색이30초 timeout이었다. 생성된 페이지 PNG에서 본문과 실험은 렌더됐지만 이름 기반 조작은 실패했다. 이 부분 실행을 B 통과나 전체 시각 검토로 부르지 않는다.

[진단 artifact12241258742](https://github.com/Middleages/my-books/actions/runs/39372204923/artifacts/12241258742)의 ZIP SHA256 `13272ee3def38a19e01ac9881e1c0cf8f3f06587b9e36a415a13078e52ebd5d5`를 대조했다. 새 B select12개에는 눈에 보이는 label과 동일한 명시적 aria-label을 부여했다. option 문구가 포함된 label 텍스트에 exact-name 탐색을 의존하지 않는다. 소스 계약 테스트는12개 이름의 일치와 기존 exact-name 검사 유지를 확인한다. 실제 수정 UI는 새 Actions에서 다시 검증한다.

검증기 또한 차단성 Playwright TimeoutError가 발생하면 실패를 기록하고 현재 화면을 저장한 뒤 비정상 종료해 같은 없는 조작을 수십 번 기다리지 않도록 바꿨다. 일반 assertion 실패와 구별하고 부분 report의 failed/fatal을 유지한다. 실행하지 않은 나머지를 통과로 세지 않으며 건강한 실행은 기존 전체 assertion을 그대로 수행한다. 임시 진단 workflow는 정상 출판 후보에 포함하지 않는다.

## 접근성 수정과 최신 main 통합 후보

명시적 이름 수정 후 단독 B 후보의 전체 단위 테스트는 **964/964**, build는 **329 modules**를 통과했다. 이후 최신 main `b97dbd4ee78b64118a0e88f9f3f5fd1fd08f6b0d`를 통합했다. 세금03–04·주거 소개/01–02·권차·쿠버네티스의 좁은 공개 진단 수정과 A 공개 완료 기록을 보존했다. 카탈로그는 최신 main의 다른 책을 그대로 두고 DB03–04 두 import/목차와 DB 공개 범위만 추가했다. 공유 workflow·검사 선택기를 되돌리지 않았다.

이 통합 소스의 전체 `npm test`는 **982/982**, `npm run build`는 **340 modules**, `git diff --check`는 통과했다. 이는 로컬 코드·빌드 결과이며 실제 B 브라우저 통과가 아니다. 원래 B 실행의 선택 상자 timeout, 후속 접근성 수정, 최신 통합 실행을 서로 다른 증거로 남긴다. A는 공개 검증을 완료했지만 B는 아직 PR의 production·직접 PNG 검토 및 이후 조율된 main/Pages 게이트를 기다린다.

## 최신 통합의 실제 B 검사와 320px 본문 수정

통합 head `9520feb69c4d22e557b90678750bb191f4e61afc`, tree `ed98fed70422782d1819fecd36093f92a8c54f01`의 [run39375792447](https://github.com/Middleages/my-books/actions/runs/39375792447)은 build·권차14/14를 통과했다. DB는 **299통과·39실패·338검사**, PNG105개, page/console/resource 오류0이었다. 39개 실패는 모두320px의03장 첫 본문 SQL에서 `WHERE … AND …` 한 줄이 code 영역을 길게 만드는 같은 문제였다. 이 전체 실행은 실패이며 통과로 합산하지 않는다. 앞선 exact-name 조작 문제는 재현되지 않았고 모든 인덱스 경로·geometry·수명·키보드/재생 검사는 실행됐다.

[DB artifact12243526892](https://github.com/Middleages/my-books/actions/runs/39375792447/artifacts/12243526892) ZIP SHA256 `056e5246069054eddeb2ef14e6f06e0b21a8474689d5266ea91c4b52926c6bcf`를 대조했다. 정확한 PR merge source는 `6cbc7aa1b9e32ebed790c7c1cd37239b0332bdde`, 깨끗한 checkout이었다. selection artifact12243725553은 DB·권차만 선택하고 보험·투자·세금·쿠버네티스·주거는 의도적 미실행임을 확인했다. 권차 artifact12243028767은14/14·36PNG·오류0이며, 직접 본1440-home과320-database-heading에서 최신 주거/세금 및 DB IT4권·공개4장 표시를 확인했다.

첫 SQL의 AND 앞에 줄바꿈만 추가해 문장 의미를 유지했다. 소스 회귀 검사는 공백을 정규화한 SQL 동일성과 짧은 줄을 확인한다. 실제320px overflow assertion은 완화하지 않으며 새 build·실제 browser/PNG로 수정 결과를 확인한다. 최초 실패로 생성되지 않은320px 조회 최종 PNG는 아직 검토했다고 세지 않는다.

SQL 줄바꿈 수정 후보는 전체983/983 단위 테스트·340 modules build·diff check를 통과했다. 새 실제 브라우저 결과는 아직 대기 중이다.

같은 실패 artifact의 의미 장면25개(1440px6개·390px9개·320px10개)를 독립적으로 직접 검토했다. 주문2→항목3·DISTINCT 묶음·NULL/빈 그룹·ON/WHERE 결과 경계, 정확한 인덱스 포인터·키33 미접근·8/12/13 눈금·L0→L3/인덱스 없음·복합3→1구간에서 추가 차단 결함을 찾지 못했다. 이는 검토한 장면의 결과이며 실패 run 전체나 아직 없는320px 조회 최종 장면의 합격이 아니다.

검토 중 펼친 정적 단계와 정상 motion 설정의 전용 PNG가 없음을 확인했다. 기존 키보드/정지/정적 텍스트 assertion 통과와 직접 픽셀 검토를 혼동하지 않도록, 이번 재실행에는 폭별 펼친 정적 단계와390px 정상 motion의 정지 장면을 추가 캡처한다. 기존 assertion을 줄이거나 생략하지 않는다.

## 338개 실제 검사 통과 뒤 직접 픽셀 검토에서 찾은 설명 잘림

SQL 줄바꿈 수정 head `f3412fd8092b7bbf06aeb346e5fe733c8035ea3f`, tree `fad198a83bd79473e38469a1966e877ab49158fe`의 [run39377149718](https://github.com/Middleages/my-books/actions/runs/39377149718)은 build와 production DB **338/338·135PNG·오류0**, 권차 **14/14·36PNG·오류0**를 통과했다. PR 실행이므로 deploy/published는 의도적으로 건너뛰었으며 게시 증거가 아니다. 실제 깨끗한 merge checkout은 `590e812c0a7c3fffb7273d31e859714b85c34322`이고 source/workflow/tree를 대조했다. DB ZIP artifact12244041947의 SHA256은 `3092652d48d4fc7eb11ec58d0e7d0eeb8a896c89d29dc517b62ad1adc6d59e31`, 권차12244056056은 `e1f38624c759ec9608aa20ce7988e86d6d88d67d3c29ac10d4f8f3cb3acca297`이었다. 선택 범위는 DB·권차이며 보험·투자·세금·쿠버네티스·주거는 미실행이다.

그러나 새320px 최종 조회 PNG와 펼친 정적 대안을 직접·독립 검토하면서, `COUNT(*)·COUNT(o.id)·COUNT(DISTINCT o.id)`를 붙여 쓴 단계 설명이 좁은 문단 경계를 넘어 잘리는 별도 결함을 발견했다. 기존 element/viewport 검사는 문단 상자 자체만 측정해 이 텍스트 줄의 넘침을 잡지 못했다. 따라서 자동338개 통과만으로 소스의 시각 게이트를 닫지 않았다.

하나의 모델 detail 문자열에 쉼표·공백으로 자연스러운 줄바꿈 기회를 주어 현재 단계와 정적 단계에 함께 적용했다. 또한 DB 실험의 설명 문단에만 `overflow-wrap: anywhere`를 적용해 다른 긴 SQL 용어도 공간이 부족할 때 안전하게 감싸도록 했다. 페이지를 가로로 늘리거나 문장을 잘라 숨기지 않으며 정상 단어 경계를 우선한다. 본문 code/pre나 다른 교재의 CSS는 바꾸지 않았다. 브라우저 검사는 각 설명의 실제 Text Range 줄 경계를 해당 문단 경계와 대조하도록 강화했다. 이 검사는 페이지 전체 폭이 정상이어도 글자가 자체 설명 상자를 넘으면 실패하며, 순수 helper 반례 테스트도 추가했다. 행·집계·SQL·시나리오·그림의 계산과 기존 assertion은 바꾸지 않았다. 이 최소 수정의 실제 재검증과 새 PNG 검토는 다음 기록에서 구분한다.

좁은 설명 수정의 단독 로컬 검사는984/984·340 modules build였다. 이어 공개 main `7a935e1114a4260181891664fff4a453508784fc`의 세금01–06·주거01–04를 통합한 후보는 전체 **992/992**, **346 modules build**, diff check를 통과했다. 카탈로그 충돌은 최신 다른 책의 공개 범위를 그대로 보존하고 DB03–04만 추가해 해결했다. 기존 공유 workflow/검사 선택기와 다른 책의 source는 이 main과 동일하다. 추가된320px 긴 토큰 스타일 회귀는 임시 설명 문구로 감싸짐을 확인한 뒤 원문을 복원하며, 모델 시나리오/화면 캡처 전에 복원이 완료되는지 검사한다. 수정 후 실제 browser와 직접 PNG 판독은 아직 다음 실행의 게이트다.

## B 소스 게이트 완료: 최신 실제 브라우저와 직접 시각 검토

최종 구현 head는 `bae858c964f4cbdf797bf7afe2fac874581127a4`, tree `183ee22bfb365b095395c2be41e4e89cbb4d48ff`다. [run39379496049](https://github.com/Middleages/my-books/actions/runs/39379496049)의 build·DB·권차 production job이 모두 성공했다. 실제 checkout/워크플로 source는 PR merge `538926f95513d4e67a9f5b3dfb222fcd03e61e01`이며 같은 tree, 깨끗한 작업 트리를 확인했다. deploy/published는 PR에서 의도적으로 건너뛰었다.

- DB: **339/339**, PNG **135개**, page/console/resource 오류0, fatal 없음. 338개 기존 검사와320px 긴 토큰 스타일 회귀1개이며, 각 B 프레임의 설명과 열린 정적 단계의 실제 줄 경계 assertion도 포함한다. 실행 시간은06:18:23–06:23:28 UTC였다.
- 권차: **14/14**, PNG **36개**, errors0. 홈/분야/읽음 기록·DB IT4권·4장 및 최신 세금6장/주거4장을 확인했다.
- 범위: `book-volumes, database` 선택, 보험·투자·세금·쿠버네티스·주거 browser suite는 의도적 미실행이다. 전체 unit992/992·build는 별도 수행했다.
- [DB artifact12245276226](https://github.com/Middleages/my-books/actions/runs/39379496049/artifacts/12245276226): ZIP SHA256 `f09c0cc19252d05bc4fd77adeccc3d9e44efa3fe651c517f111908b1d260c32e`.
- [권차 artifact12245420127](https://github.com/Middleages/my-books/actions/runs/39379496049/artifacts/12245420127): ZIP SHA256 `bc0ff5346289f85c119ef32ed1b06e17262dc2db682b65e8cc197ba620a90fcb`.
- 범위 artifact12245015623: ZIP SHA256 `549fab4c38785e76a6a3e1d52e56ebe85941264be98435797a5da592c9d2ad36`.
- 실제 제공/로컬 자산: CSS `index-Db9GMpwM.css`,319361바이트, SHA256 `76ccd4f86afb6a19e5094f711005d32cce4f64e15b1254fa89847fcfcff60366`; JS `index-DqcMFyfS.js`,2516591바이트, SHA256 `fd1de9c7ccedbb9e39b4e45c4621eaf778e27fe35a3e60187243268791319e63`. 두 해시를 production 서버·빌드 사이에 대조했다.

새 원본에서 직접 확인한 DB 장면은 `320-b03-fork-count3`, `320-b03-left-null-sum-null`, `320-b03-where-final`, `320-b-queries-reduce-static-open`, `390-b-queries-no-preference-static-open`, `390-b-queries-normal-paused`, `320-b04-wide-third-leaf-boundary33-not-fetched`, `320-b04-all-scattered-final`, `320-b04-write-indexed-key-update-new-L3-final`, `320-files-race-final`의 PNG10개다. 권차의 `1440-home`, `320-database-heading`도 직접 확인했다. COUNT 세 식은 진행 설명·정적 대안 모두 경계 안에서 읽힌다. 2주문→3행, NULL과0, WHERE 제외 경계, 경계 키33의 미접근, 8과13의 다른 길이, 같은 행의 L0→L3 이동과01장의 경쟁 반례가 유지된다. 조작은 각 핵심 장면 위에 있고 정상 motion 정지·움직임 감소·펼친 단계도 판독할 수 있다. 독립 검토도 같은 잘림 해소를 확인했다. PNG135개 전부를 사람이 검토했다고 주장하지 않는다.

이로써 B의 모델/소스/production·직접 시각 게이트를 닫는다. **B의 실제 공개 main·Pages 게이트는 아직 남아 있다.** 다음 C는 별도 작업 트리에서 로컬로 준비할 수 있으나 공개 순서는 A→B→C를 유지한다. 최종 통합 담당은 최신 main의 병행 교재를 보존하고 정확한 통합 source의 영향 검사·배포·게시 자산을 다시 확인한다. 앞선 실패 run과338개 통과 뒤 발견한 시각 결함은 이 기록에 그대로 남기며 성공으로 소급하지 않는다. 실제 DB·SQL·서버·두 세션·백업/복원·실제 기기·스크린리더는 여전히 미검증이다.

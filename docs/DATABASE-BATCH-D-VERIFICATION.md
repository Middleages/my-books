# DB 배치 D 검증 기록: 연결 풀 / 실행계획

확인일: 2026-10-20. **07–08 소스·전체 단위/build·수정 후 실제 production browser·직접 시각 검토를 완료했다. main·Pages 공개는 선행 C 뒤의 직렬 창을 기다린다.**

## 범위와 선행 게이트

- 07 `connections-and-pools`, 08 `explain-and-diagnosis`, stable `database/<id>` readId. IT·기술4권과 기존01–06을 보존한다. E09–10/F11–12/G는 포함하지 않는다.
- 선행 C source840b9138877c015d59505e520d2f6fb66ba2a9d5는 전체1062/build·실제 DB415/415259PNG·권차14/1439PNG와 직접/교차 검토를 통과했고, 마감 문서915fe5f4b46bf5480902a052f2d4a4fcec8a2590에서 D의 별도 작업 트리를 시작했다. C 실제 공개 전에 D를 게시하지 않는다.
- Node24.19·TypeScript/Vite의 기존 클라우드 환경. 로컬 Chromium 환경 제한은 우회하지 않는다. 실제 browser는 Actions로 검증한다. 실제 PostgreSQL·driver·SQL·EXPLAIN·네트워크·version()은 실행하지 않았다.

## 07 모델과 실제 그림 계약

- 요청4개, pool1/2, 동시 도착·FIFO·SQL2tick. 정상 종료는 pool2에서2/2/4/4, pool1에서2/4/6/8이다. 같은 tick에서 SQL 종료→반환→다음 배정을 먼저 처리한다.
- 설정 용량 칸·실제 client·DB session·현재 lease를 별도 ID로 둔다. 정상 반환은 요청→client 소유 선을 없애지만 client→DB session 연결은 idle로 유지한다. 획득 실패에는 client·SQL 결과·ROLLBACK·반환을 만들지 않는다.
- SQL 뒤 앱의 긴 보유/반환 누락은 열린 transaction이나 잠금을 추론하지 않는다. 누락은8tick 유한 관찰에서 대여와 남은 대기를 그대로 남기며 가짜 완료/timeout을 만들지 않는다. 대기·SQL·앱 보유 시간은 겹치지 않는 같은0–12tick 축이다.
- transaction 비교는 한 client 유지 vs 잘못 분리한 호출의 가능한 C1/C2 배정이다. 호출 선의 끝점과 C1의 현재 transaction 경계를 그리며, 반환 자체가 ROLLBACK이라는 설명을 하지 않는다. 연결 손상·정리 실패·COMMIT 결과 불명은 본문에서 구분하되 실제 장애 client 폐기·proxy·timeout은 시뮬레이션하지 않는다.
- 서버 최대12, superuser 예약2+reserved-role 예약2, 기존 다른 연결2, 일반 앱 상한 예산6의 합성 비교다. 앱1/3×풀2/4의 모든 가능한 상한 토큰을 같은 칸 단위로 그려 초과6도 숨기지 않는다. 예약은 진입 문턱이지 역할이 소유한 열린 객체가 아니다. 설정 상한·실제 열린 수·최적 성능은 다르다.

## 08 모델과 실제 그림 계약

- 첫 예는04의 별도64행 fixture이다. 필터를 포함한 scan의64확인/40출력과 Aggregate COUNT의 값40인1출력을 구별한다. 예상4/40 외곽선은 익명 수량이며 미리 맞는 ID를 예언하지 않는다. actual 미관측은null이지0이 아니다.
- 별도 원래 고객1의 주문1001/1002→항목2/1행은 loops2, 평균1.5, 총3행이다. composite row identity와 실행 packet ID를 구별하고 실제 주문→항목 선을 그린다.
- 별도 streaming scan→LIMIT는4후보 확인/2출력에서 멈춘다. 끝까지의 조건 일치10행과 조기 중단2행이 다르다고 통계 오류를 단정하지 않는다. COUNT/Sort 위의 같은 조기 중단을 주장하지 않는다.
- 모든 plan 노드 막대는 실제 같은 행 길이 단위로 그린다. output edge는 자식→부모이며 수량 주석은 선 위의 별도 배경을 가진다. 부모 시간은 자식 포함이며 별도로 정한 합성 시간표다. 실제 actual time 두 수를 공통 시계의 시작/끝 좌표로 쓰지 않는다.
- rows/time은 회당 평균, BUFFERS는 누적이다. 반복 페이지의 사건 토큰과 부모가 포함하는 같은 사건ID를 모델에서 읽고, loops를 다시 곱하거나 부모·자식을 더하지 않는다. shared read는 물리 장치 읽기의 증거로 단정하지 않는다. 앱 호출1/3 비교는 plan loops와 다른 층이다.

## 검사와 미검증 상태

- 최초 모델26/26, C 보존을 포함한 focused32/32, 새 D 소스 계약까지37/37 통과. 최초 TypeScript/Vite build는 성공했다. D 단독 후보의 전체1093/1093(생략0)와374 modules TypeScript/Vite build도 통과했다. 최신 main 통합 뒤 전체 검사/build를 다시 기록한다.
- 기존 A/B/C verifier 시나리오는 보존하고 D만 추가한다. 기존 C 검사 본문의 SHA256을 source regression으로 고정했다. accessible selector preflight, blocking timeout 부분 실패 기록, current entity/관계 끝점/행 단위/시간 단위/visible overflow/노드 글자 경계/long SQL·설명 경계 검사를 추가했다.
- 1440/390/320 reduced-motion, 별도390 normal-motion, 키보드·포커스·재생·정지·reset·route cleanup·새08 읽음과 기존/알 수 없는ID 보존을 실제 Actions에서 확인할 예정이다. 생성 캡처는 별도 직접 검토 전까지 설명력 통과로 세지 않는다.
- 앱 스크립트·source gate·정확한 배포 자산·실제 Pages는 별도 상태로 기록한다. 다른 교재 browser 생략은 통과가 아니며 전체 unit/build는 유지한다.
- 실제 DB·driver·기기·스크린리더·운영 성능·실제 장애 복구는 미검증이다.

## 최신 공개 기준 통합 뒤 로컬 게이트

공개 main `05602d24c6946f4e4c1b95f5f926e2e8eb51b316`을 통합해 세금01–10·주거01–08·회계01–02와 기존 교재·권차·공유 workflow를 보존했다. 이 기준과의 차이는 이미 검증된 C05–06 및 D07–08의 DB 전용 source/검사/문서, DB 카탈로그 항목과 README뿐이다. 다른 책 source와 `.github`·범위 선택기는 동일하다. B 공개 확인은 완료됐지만 C/D 공개는 직렬 창을 기다린다.

- `node --test --test-concurrency=4 tests/*.test.mjs`: **1104/1104**, fail0·skip0. 동시성만4로 제한했고 검사 수나 어설션은 줄이지 않았다.
- `npm run build`: TypeScript와 Vite **380 modules** 성공. 기존 큰 bundle 경고는 남아 있다.
- `git diff --check`: 통과. 실제 선택기 결과는 `book-volumes, database`; 다른6 browser suite는 의도적 미실행이지 통과가 아니다.
- D 실제 Actions browser·직접 PNG 판독·게시 자산은 아직 미검증이다. 로컬 Chromium 제한을 우회하거나 실패를 통과로 세지 않았다.

PR39 생성 직전 main이 `d76ed55e9969108449124a154c7c67e946068740`으로 전진해 최초10533fb 후보는 merge 충돌로 실제 browser를 시작하지 못했다. main을 다시 통합하고 세금01–12·주거01–10, B 실제 게시 마감·공유 문서를 보존했다. 이 통합의 전체 **1128/1128**(fail0·skip0), TypeScript/Vite **388 modules** build 및 diff check가 통과했다. DB 모델·본문·시각·검증기 bytes는 최초 D 후보와 동일하고 충돌은 최신 다른 책 카탈로그와 DB 계획 상태만 조합했다. 실제 browser는 이 새 후보에서 시작하며 이전 로컬 숫자를 새 실제 결과로 소급하지 않는다.


## 첫 실제 production와 직접 검토 뒤 표현 보강

- [PR39 첫 실제 실행39390547607](https://github.com/Middleages/my-books/actions/runs/39390547607)은 head `4c33eb6abeb10401df761148f1aa69714ec58469`, PR merge/workflow source `d3bc04da686f1b01a7980a3087c9a6881b0925a5`, tree `9f38720ccc12769891b38c999254279255b533cc`의 깨끗한 checkout이다. 전체1128·build, DB **511/511·405PNG**, 권차 **14/14·39PNG**가 성공했다. 오류 배열은 모두 비었으며 PR의 배포/게시 job은 의도적으로 실행하지 않았다.
- 선택 scope는 `book-volumes, database`였다. 보험·투자·세금·쿠버네티스·주거·회계 browser는 이 실행에서 생략했으며 통과를 주장하지 않는다. 기존 A–C DB 검사는 유지했다.
- DB artifact12249319408의 ZIP SHA256은 `db65ff60fc10c517d9ae5af7272532c2f9c821d71124fc83ced1b42d4479d7c0`, 권차12249331854는 `f03736ea5a5f88d2a5b698bab044c7250edaf51136a7932231dbaf6a0651953c`으로 다운로드 후 일치했다.
- 320px nested-loop의 원본 해상도 세부 crop에서 평균1.5·loops2·누적3, 두 주문→항목2/1의 분기, 반복 페이지 접근과 부모에 포함된 자식 시간 구간을 읽었다. 320px scan4/40 및 LIMIT10/2의 눈금·출력 방향·장치 I/O를 단정하지 않는 문구도 읽었다. 부모의 독립 검토는 pool1 누락, 3×4 예산, nested-loop 세 원본의 구조를 확인했고 긴 마지막 장면의 세부 판독은 작성자의 원본 crop 검토와 구별했다.
- 첫 실행의 조작·가로 경계는 통과했지만 직접 검토에서 앱 호출 비교의 ‘두 방식 출력3행’은 관측 층이 모호했다. 수정 모델은 같은 fixture에서 각 호출의 반환 ID를 도출한다. JOIN3행과 나눈 호출2+2+1=5행, 앱이 조립한 결과3행을 각각 표시하며 행 합을 전송 바이트로 해석하지 않는다. 모델·소스·실제 렌더 검사에 이 구별을 추가했다.
- 07 DB session의 `사용 중`은 SQL 실행을 뜻하는 것으로 읽히지 않도록 현재 lease의 `대여 중`으로 구체화했다. 연결·lease·SQL 시간의 기존 ID/수량/전환은 바꾸지 않았다.
- 위 두 표현 보강 뒤 실제 browser 재실행과 최종 직접 시각 검토는 별도로 남긴다. 첫 실행의 성공을 수정본의 실제 렌더 성공으로 소급하지 않는다. 실제 DB·driver와 main/Pages 공개는 여전히 미검증이다.


첫 실행에서 직접 연 원본은 DB22장과 권차2장이다. DB 목록은 아래이며 긴 320px plan 세 원본의 세부 crop4개를 원본 해상도로 더 읽었다.405장 모두를 사람이 읽었다는 뜻은 아니다.

- 320: d07-pool2-normal-dispatch-0, d07-pool2-normal-final, d07-pool1-leak-final, d07-binding-split-update, d07-budget-3x4, d08-growth-count-low-scan, d08-nested-loop-true-low-final, d08-limit-true-low-final, d08-app-calls, d08-explain-sql, d07-controls-effect.
- 390: d07-pool1-acquire-failure-dispatch-0, d07-pool2-long-hold-tick-3, d08-growth-count-true-low-final, d-pool-normal-paused, d-connection-binding-reduce-static-open, d-explain-normal-paused, d07-budget-3x2.
- 1440: d07-binding-pinned-final, d08-growth-count-false-low-final, d08-nested-loop-low-inner-1, d08-app-calls.
- 권차: 320-database-heading, 1440-home. 각 항목의 파일명은 `<폭>-<이름>.png`이다.

수정 후 전체1128/1128(fail0·skip0) 단위 검사가 다시 통과했다. TypeScript/Vite388 modules build와 diff check도 통과했다. 수정본의 실제 browser는 뒤의 새 기록으로 확정한다.


## 수정본 최종 source gate — 2026-10-20

- [PR39](https://github.com/Middleages/my-books/pull/39) head **`be3ee2647db82fabccacf5a0b8ce5236fcea1e8a`**, tree **`bdb8a1c778e5d045e119a356e006e05f454e37ca`**. [실제 run39393699945](https://github.com/Middleages/my-books/actions/runs/39393699945)의 PR merge/source/workflow는 **`b84ec401f66b31551f1ecbd92a15e3c0db3bbae1`**, 같은 tree, sourceChanges 빈 문자열이다. 임의의 미래 commit을 검증했다고 쓰지 않는다.
- 전체 **1128/1128**, fail0·skip0와 TypeScript/Vite **388 modules** build, 실제 production DB **511/511·405PNG**, 권차 **14/14·39PNG** 성공. DB 실행은08:30:00–08:41:34 UTC이며 page/console/resource 오류와 별도 host 진단 모두0이다. Chromium155.0.8059.39이다. PR 배포/게시 job은 skipped로서 공개 성공이 아니다.
- 범위 선택 artifact는 `book-volumes, database`이며 다른6 browser suite는 의도적 미실행이다. 전체 단위/build는 생략하지 않았다. 재검증은 기존 검사를 제거하지 않고 앱 조립 행 수·각 호출 반환 ID/행 합·긴 설명의 실제 경계 검사를 더했다.
- DB artifact **12250799201**, ZIP SHA256 **`f43e1ac2d7d12231f5559b5f0ecc103bd7c52a26d6fd90a8d84e54635ad4f509`**; 권차 **12251265410**, SHA256 **`e463652f4936808fda29c3ffa10e12605bd59ca9ed30ddaa6a3b5ec249d880f6`**를 다운로드 후 대조했다. scope12250752259의 SHA256은 `38bdf57cb94da3d681e694c80da3ba25b7c82adfad722770922dabe47b4eea2b`이다.
- production에서 실제 받은 JS/CSS와 build 파일의 bytes/SHA가 각각 일치했다. JS `index-uvqaIUUb.js` 2,927,298 bytes·SHA256 `9adec3023aa2f784870ffa49dfd7a6d3def3e50a47c9e3cd0286236b989f61bd`, CSS `index-C59WPqOM.css`349,746 bytes·SHA256 `3b67a0e8914a94b628e736aad89f527237c7965c79d72ec8a11a518843d915c2`다. 이는 production 로컬 서비스 증거이며 Pages 자산 증거는 아니다.

### 수정 후 실제 픽셀과 설명력

새 원본8장: 320-d08-app-calls, 1440-d08-app-calls, 320-d07-pool1-leak-final, 390-d07-pool2-long-hold-tick-3, 320-d07-controls-effect, 390-d07-binding-split-final, 1440-d07-budget-3x2, 390-d-pool-normal-paused. 추가로 새320-d08-nested-loop-true-low-final 원본의 두 부분을 원본 해상도 crop으로 읽었고, 권차390-database-heading 및320-reading-first도 확인했다. 파일명은 모두 `.png`로 끝난다.

- 각 호출의 반환3/2/2/1행이 해당 호출 칸에 붙고, 앱에서 조립한3행과 DB 반환합3/5행을 별도 문장에서 읽을 수 있다. 320px에서도 문장과 숫자가 잘리지 않는다. 같은 모델의 반환 ID로부터 계산되며 JS/CSS만의 가짜 수량이 아니다.
- SQL 뒤 앱 보유와 대기 요청은 다른 lane/시간 조각이다. DB session의 `대여 중` 라벨은 SQL 실행 여부를 주장하지 않는다. 반환 후 현재 요청 소유 선은 없어져도 실제 연결·session은 idle로 남는다.
- 분리 호출의 C2 경로와 끝점은 C1의 transaction 경계 밖에 있다. ROLLBACK·반환 뒤 확정재고4가 남고 현재 미확정 경계는 사라진다. 호출선은 이력임을 표시한다.
- 예산 그림은 역할별 진입 문턱과 실제 열린 연결을 섞지 않으며, 앞서 본 초과6칸을 포화시키지 않는다. nested-loop의 평균1.5/loops2/총3, 2행·1행 분기, 반복 buffer 사건과 포함 시간 구간도 유지된다.
- 전체405PNG 중 **361개는 첫 실행과 파일 바이트까지 동일**하다. 나머지44개의 생성과 자동 검사는 모두 성공했고, 변경된 표시 유형과 대표 정상/반례를 위 범위로 직접 읽었다.44개 전부 또는405개 전부를 사람이 열었다고 주장하지 않는다. 앞선22원본+4crop 검토와 변경 후 검토를 합쳐 설명력 게이트를 닫는다.

독립 최종 교차 검토에서도 새320-d08-app-calls 원본의 JOIN3 vs 분리2+2+1=5·앱 조립3과 loops/호출 구별, 라벨·줄바꿈을 확인해 차단 문제가 없었다.

**남은 범위:** C 실제 공개 다음 최신 main과 조율된 창에 D를 통합하고 exact-main production→Pages→실제 게시 자산/장 URL·대표 화면을 확인한다. D source gate를 닫았으므로 E09–10은 별도 작업 트리에서 준비할 수 있지만 D 게시 전 E를 공개하지 않는다. 실제 PostgreSQL/driver/SQL·운영 장애·물리 기기·Safari·스크린리더는 실행하지 않았다.

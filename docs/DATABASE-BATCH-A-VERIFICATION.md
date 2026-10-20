# 데이터베이스 배치 A — 구현·검증 기록

기록일: 2026-10-20 (KST). **소개·01–02 구현. 단위 테스트·빌드, DB production browser 124개, 실제 PNG 직접·교차 검토 통과. 보험 verifier 보정 통합 후 전체 PR production matrix도 통과. 최신 main 통합·Pages 게시 대기.** 이 상태를 완료·배포 성공으로 읽지 않는다.

## 범위와 기준

- 최초 기준 main: `609e6f2cef1c449ee8760f92c98b01ace238d5e1`. PR 작성 중 보험 E가 공개되어 `246167308c050d797d00501fb057e2ea61de51b4`를 보존 통합했다. 보험 09·10과 공개 10장 상태를 유지했다.
- 계획 기준: `d9a61f857f090eec1739886ba9bc8f6f56a0cf3b`, [계획 draft PR10](https://github.com/Middleages/my-books/pull/10).
- 구현 branch: `write-database-batch-a`, [draft PR12](https://github.com/Middleages/my-books/pull/12). 다른 교재와 격리한 작업 트리를 사용한다. main 쓰기는 병행 교재의 게시 확인과 조율한 뒤 진행한다.
- `database` / `technology`: 소개, `files-and-database` / `database/files-and-database`, `tables-and-constraints` / `database/tables-and-constraints`만 등록했다. 읽음 분모는 2다. 03 이후는 등록하지 않았다.
- 기존 책·장 ID, URL, 읽음 저장 키 `my-books:read:v1`, 홈의 책 선택 구조를 변경하지 않았다. DB 장식 표지만 추가했다.

## 본문·모델·시각 설계

### 01 파일 다음에 DB를 쓰는 이유

한 장면에서 앱 두 개, 각자의 revision 사본, 공유 저장소, 실제 확정 주문의 역할을 각각 컴퓨터·점선 종이·원통·주문 종이로 구분한다. 모델의 실제 `from`/`to`를 읽는 화살표가 읽기·쓰기의 방향을 표시한다. 진한 현재 동작과 옅은 점선 이력은 범례로 분리한다. 순차·겹친 읽기·파일 잠금·DB 조건부 처리에서 재고와 확정 수량의 불변식을 같은 프레임으로 계산한다.

파일 잠금은 정상 실행의 상호 배제만 설명한다. DB 보호 모드는 조건부 감소 성공과 주문 확정을 하나의 트랜잭션으로 묶는 명시적 가정이다. 파일 자체가 잘못이거나 DB 도입만으로 충돌이 없어진다고 설명하지 않는다. 단계 간격은 실제 처리 시간이 아니다.

### 02 표 사이의 약속

같은 `study-shop` fixture의 실제 FK→PK 선을 그린다. 이름 변경·같은 이름·주문 없는 고객을 바꿔도 키와 관계의 뜻은 보존한다. 좁은 화면은 전체 도해의 단순 축소 대신 선택 고객에 연결된 행을 수직 배치한다.

삽입 후보는 저장 경계 밖에서 검사한다. 통과한 후보는 실제 DOM에서도 경계 안의 새 행으로 옮기고, 거절된 후보는 밖에 남긴다. 후보 FK의 존재 여부·검사 판정·저장 행 수가 같은 모델을 읽는다. 정상·중복 PK·없는 FK·0·NULL·동명이인·항목 없는 주문을 포함한다. NOT NULL을 제거하면 PostgreSQL CHECK의 UNKNOWN이 허용되는 반례와 FK 밖의 업무 규칙을 분리한다.

### 공통 조작과 접근 대안

재생·정지·이전·한 단계·다시 보기·전체 초기화, 예측, 현재 단계, 모든 단계의 정적 읽기를 제공한다. 설정 변경은 재생과 예측을 초기화한다. 조작부는 그림 앞의 현재 변화와 붙여 배치했다. 실제 1440/390/320px 가독성·키보드·포커스·reduced-motion은 아래 실행 증거가 확보된 뒤 판정한다.

## 실행한 검사

- Node 순수 모델 테스트: 신규 32개 통과. fixture의 키·관계·합계, 주문 당시 단가, 파일 경쟁 반례와 보호 경로, NULL/제약 검사, 비변이·결정성·잘못된 옵션 입력을 확인했다.
- 전체 `npm test`: 최초 기준에서 720/720, 보험 E 보존 통합 뒤 812/812 통과했다.
- `npm run build`: 최초 기준의 TypeScript/Vite 296 modules, 보험 E 보존 통합 뒤 304 modules 성공. 기존 단일 번들의 크기 안내는 남아 있다.
- `node --check scripts/database-browser-qa.cjs`, `git diff --check`: 통과.
- 공식 문서 재확인: PostgreSQL 18 Architectural Fundamentals, Transactions/Transaction Isolation, Constraints. 본문에 정확한 링크와 2026-10-20 확인일을 표시했다. 이는 실제 서버 버전 관측이 아니다.

## 로컬 브라우저 실행의 최초 차단 기록

클라우드 작업 환경의 로컬 Chromium은 프로세스 socket 권한 때문에 시작에 실패했다. 승인 실행도 환경 시작 오류로 실행되지 않았다. **이 로컬 시도는 성공한 브라우저 검사 0개·캡처 0개이며 실패를 통과로 세지 않는다.** 해당 실패 결과는 작업 산출물의 실패 보고서로만 남기고 저장소에는 올리지 않는다.

대체 경로는 GitHub Actions의 동일 production artifact를 사용하는 기존 검증 행렬이다. `database-browser-qa.cjs`는 1440/390/320px, 모든 파일 모드/선행 앱의 모든 프레임, 관계 변경, 모든 제약 시나리오/NOT NULL 조합, 정지·다시 보기·설정 변경·장 이동, 키보드, 읽음 기록·알 수 없는 ID, 가로 넘침·MDX·실행 오류, 실제 게시 자산 SHA256 대조를 검증하도록 작성했다. **스크립트가 존재하는 것만으로 실행 결과를 주장하지 않는다.** 생성된 실제 PNG를 열어 의미·선 끝점·라벨·조작부와 변화의 근접성도 별도로 검토한다.

독립 branch에서는 현재 존재하는 `insurance`, `investing`, `database` suite를 유지한다. 통합 시 최신 main의 `tax`·`kubernetes` 등 병행 작업과 해당 계약 테스트·artifact 이름을 합집합으로 보존한다. 이 branch의 오래된 workflow를 최신 main에 덮어쓰지 않는다.

## 미실행·다음 게이트

- 실제 PostgreSQL 설치·연결·SQL·두 세션·백업/복원: 미실행. 브라우저 모델과 혼동하지 않는다.
- DB production browser와 PNG 직접·교차 검토: 아래 보강판 증거에서 완료. 기존 교재 matrix 최종 결과·최신 main 통합·실제 Pages 게시: 대기.
- 실제 터치 기기·Safari·스크린리더: 미검증.
- A 게이트가 열린 상태에서는 B의 본문·카탈로그 등록을 시작하지 않는다. 이후 03 조회와 JOIN, 04 인덱스와 비용을 계획에 맞춰 진행한다.

## 후속 실행 증거

아래는 실제 확인한 branch commit·Actions run·검사 결과·artifact·직접 본 PNG와 수정 사항이다. 이 문서가 담길 미래 commit을 미리 만들어 적지 않는다.


### 첫 production 실행과 직접 화면 검토

[run39355424024](https://github.com/Middleages/my-books/actions/runs/39355424024), head `436b11dfe8c14dd74e951de7d57245498ae127ef` / PR merge `a02fa021445906e28d12b1be82b2e171e303a544`에서 build가 통과했다. DB 실제 Chromium 검사는 87개 통과·1개 실패였고 PNG 30개를 만들었다. 마지막 오류 집계에 URL이 없는 404 한 건이 남았으므로 전체 통과로 판정하지 않았다. 검증 서버의 기본 favicon 요청에 204를 명시하고, 다른 오류는 URL·HTTP 상태까지 기록하도록 보완했다. 실제 콘텐츠의 오류를 광범위하게 무시하지 않는다.

[artifact12234833072](https://github.com/Middleages/my-books/actions/runs/39355424024/artifacts/12234833072)의 내려받은 ZIP SHA256은 `8817cf49b6f19b2ccb3dcbee4b19f7e82c881abb813fecfb3d4eb3ff92ca60fc`로 게시된 artifact digest와 일치했다. 직접 연 파일: `1440-files-race-final.png`, `320-files-race-final.png`, `320-files-database-final.png`, `1440-key-relationships.png`, `320-key-relationships.png`, `390-constraints-normal-true.png`, `320-constraints-null-qty-false.png`, `1440-constraints-missing-fk-true.png`. 교차 검토에서도 390px 관계와 320px 파일/NULL, 1440px 관계를 확인했다.

파일의 사본/공유 값/확정 주문과 NULL 후보의 저장 경계 이동은 분명했다. 그러나 **모바일 관계도의 FK 레일이 한쪽에서 겹쳐 항목→주문의 소속을 찾기 어려웠다.** 모델에 모든 FK가 있고 기능 검사에 통과해도 설명력 게이트를 닫지 않았다. 외래키 종류를 선택해 한 관계씩 펼치고, 좁은 화면의 고객·주문 FK는 왼쪽, 상품 FK는 오른쪽으로 분리한다. 주문 FK는 점선·별도 색과 범례를 함께 사용하며 항목 헤더에 주문과 상품 FK를 모두 표기한다. 두 이름 실험의 조건도 동시에 모순된 표시가 되지 않게 하나씩 선택한다.

보강한 QA는 고객 1/2/3 × FK 세 종류/전체를 모든 폭에서 순회하며 실제 선의 id·양 끝 row key·열 이름을 fixture와 대조한다. SVG 선 시작/끝의 실제 좌표가 해당 행 경계·수직 중앙에 붙는지도 측정한다. 이 보강판의 새 PNG를 보기 전까지 시각 합격은 대기다.


### 보강판 DB browser와 시각 게이트

[run39356353679](https://github.com/Middleages/my-books/actions/runs/39356353679), head `b77eddf6da4ca9bdf9f0a2224204efb0c36b4961` / PR merge `43e1118c22205c16beeb5dd8d53b529a2a54701d`의 DB production job은 **124/124 통과**, page/console/resource 오류 0, PNG 42개였다. 새 FK 종류별 36검사를 포함한다. [artifact12235097162](https://github.com/Middleages/my-books/actions/runs/39356353679/artifacts/12235097162) ZIP SHA256 `b8ed16f24a57f8226ee1c637eaac441ba7b450dc16a59a1dd765dd4a9ca16ddf`를 내려받은 파일과 대조했다.

보강판에서 직접 본 파일은 `320-key-order.png`, `390-key-all.png`, `1440-key-order.png`, `320-key-product.png`, `1440--database.png`, `390--database-files-and-database.png`, `320--database-tables-and-constraints.png`, `320-constraints-empty-order-true.png`다. 긴 전체 페이지는 내용 배치 확인에, 실험별 캡처는 라벨·행·선·후보의 경계 확인에 사용했다. 320px 주문 FK와 390px 전체 FK는 별도 교차 검토에서도 **출발/도착의 소속이 보이고 선 종류가 분리되며 잘림이 없음**을 확인해 해당 모바일 수정 게이트를 통과했다. 파일 경쟁과 NULL 후보 이동의 앞선 승인도 유지한다.

이 결과는 PR production 증거다. 보험·투자 suite의 최종 결과, 세금/권차 등 최신 main과의 통합, 공개 Pages 자산 일치·실제 장 URL 검증은 아직 별도 게이트다. 미검증 브라우저나 실제 DB 실행까지 확대해 해석하지 않는다.


### 기존 보험 검증기 보정의 보존 통합

보강판 PR run의 build·DB·투자 job은 성공했다. 다만 그 snapshot의 보험 검증기는 기존 main `246167308c050d797d00501fb057e2ea61de51b4`에서 이어받은 구판이었다. 보험 E 검증 중 발견된 `[open]` 조건 locator의 클릭 뒤 인덱스 변동 문제는 main `a514d0cb749d766ce19f414f92dedd90fd02bd82`에서 고쳤다. 해당 commit의 검증 스크립트·회귀 테스트·보험 E 기록만 보존 통합했다. 이는 DB 화면의 실패나 DB 모델 수정이 아니며, 보험 검사 범위를 줄이지 않는다. 새 PR snapshot의 전체 matrix 결과는 실행 후 따로 기록한다.

통합 후 전체 `npm test`는 813/813, TypeScript/Vite build는 304 modules로 통과했다. 보정 전후 `dist/assets/index-C01XwLQm.css`와 `index-OpnEYXtt.js`의 SHA256을 대조해 모두 동일함을 확인했다. 앱 자산은 바뀌지 않았으므로 앞서 직접 검토한 DB 그림의 증거는 유지하며, 새 전체 matrix 실행을 대신하지는 않는다.


### 보험 보정 통합 snapshot의 전체 PR 게이트

head `9f290af29a4870aff1c8f70ce46128baa788d6b3`의 [run39358068146](https://github.com/Middleages/my-books/actions/runs/39358068146)은 build·DB·투자·보험 production job이 모두 성공했다. PR 실행이므로 deploy와 published job은 의도대로 skipped다. DB 검사는 다시 124/124, PNG 42개였고 [artifact12236470737](https://github.com/Middleages/my-books/actions/runs/39358068146/artifacts/12236470737)에 보관됐다. 이 artifact의 게시 digest는 `9d39bf7db4cb2a074b193310734844956b8464178b371bde641d2c05e01308e6`이며, 이 기록에서는 새 ZIP을 내려받아 직접 검토했다고 주장하지 않는다. 앱 자산의 동일성 확인과 앞선 직접·교차 시각 검토를 함께 사용한다.

이로써 해당 PR snapshot의 전체 production 게이트는 통과했다. 이후 세금 A·권차 등 최신 main 통합과 해당 공개본의 실제 Pages 검증은 별도로 남아 있다.


### 세금 A·분야별 권차 보존 통합 후보

최신 main `da333eb71e2e5c5f00ba70bbddb2f36c1ce50b9f`의 세금 A와 분야별 권차를 보존 통합했다. catalog·표지 충돌은 두 책을 모두 남기고, DB는 기존 공통 메타데이터의 `technology / volume: 4`를 사용한다. 양쪽 검증 matrix와 계약 테스트는 `insurance, investing, tax, book-volumes, database`를 동일하게 유지한다. 독립 `book-volumes` suite도 제거하지 않았다. DB browser에서도 홈·소개가 `IT·기술 4권`을 표시하는지 추가 확인한다.

보험 담당자가 완성한 문서 전용 `5bdf203fff7b1a1cd84e901a78e6cd997c4fb709`의 보험 최종 검증·전체 점검·계획·프롬프트 네 문서도 내용 그대로 반영한다. 보험 앱·모델·검증 스크립트를 다시 바꾸지 않는다. 이 통합 후보의 test/build·새 PR matrix·직접 화면·실제 main 게시 결과는 실행한 뒤 기록한다.

통합 후보의 전체 `npm test`는 827/827 통과했고 TypeScript/Vite build도 성공했다. QA 스크립트 문법과 `git diff --check`도 통과했다. 세금·권차가 추가된 새 앱 자산이므로 이전 화면 증거만으로 새 레이아웃 검증을 대신하지 않고 PR의 DB·권차 PNG를 다시 직접 검토한다.


### 세금·권차 통합판의 DB·공통 기능 검증

head `ce9f29c2539837f74f894b35dcd76608f60ef66b` / PR merge `70f621aef9f74a9c9746e8614b3b4bb6ad67263a`의 [run39364460734](https://github.com/Middleages/my-books/actions/runs/39364460734)에서 build·DB·세금·권차 production job이 성공했다. 이 확인 시점에 보험·투자 job은 진행 중이므로 전체 matrix 성공이라고 쓰지 않는다. DB는 **124/124·오류 0·42 PNG**, 권차는 **14검사·오류 0·33 PNG**였다.

실제 내려받은 [DB artifact12238922199](https://github.com/Middleages/my-books/actions/runs/39364460734/artifacts/12238922199) ZIP SHA256은 `f94a1c5f858517d457d50a5935465e1f2e004099e1f7bdc65fcb7dcba77e691f`, [권차 artifact12239152628](https://github.com/Middleages/my-books/actions/runs/39364460734/artifacts/12239152628)는 `b26716ce7c8783506ff1087c1963c07e55c5713faba847598a7f7588f3a53907`로 각각 게시 digest와 일치했다. 두 결과의 sourceSha는 위 PR merge, 작업 트리는 깨끗했다.

직접 연 새 PNG는 권차의 `320-database-heading.png`, `390-database-heading.png`, `1440-home.png`, `320-home.png`와 DB의 `320-key-order.png`, `390-key-all.png`, `320-files-race-final.png`, `320-constraints-null-qty-false.png`다. IT4권·돈5권과 공개 9권의 분야/권차가 구별되고, 모바일 관계선의 소속·후보 저장 경계·낡은 사본과 실제 재고가 유지된다. 320px 전체 홈 캡처는 전체 배치 확인용이며 개별 긴 페이지 전체의 작은 글자를 모두 읽었다고 주장하지 않는다. 핵심 관계/제약 장면은 별도 원본 크기로 확인했고 추가 차단 결함은 발견하지 못했다.

2026-10-20 사용자 지시로 이후 보통 배치의 브라우저 범위는 추가·변경 교재와 영향받는 공통 기능에 집중한다. 전체 단위 테스트/build와 실제 게시 자산 일치 확인은 유지하며 책 완성 때 넓은 회귀를 한다. 위 실행은 그 조정 전에 전체 matrix로 시작된 기록으로 그대로 보존한다. 범위 조정을 기존 실패를 통과로 바꾸는 근거로 쓰지 않는다.

### DB A·쿠버네티스 시각 보강·검사 범위 통합 후보

DB A `ce9f29c`를 기준으로 쿠버네티스 PR13 head `1cbc9e1ce65f54e48e67ae817fd2028c969f67a1`과 그 최종 검증 문서 `a995825`, 영향 범위 검사 PR17 `bd9cdb285bde10e7dd5c9c2e76655c0d54215dd0` 및 주거 교재 suite 예약 `a77648f`를 보존 통합했다. 새 주거 본문·세금 B·DB B는 포함하지 않는다. 세금 A·권차·보험 최종 기록은 그대로 유지했다. 쿠버네티스 소스·전용 검사·최종 문서의 바이트가 담당자의 확정본과 같음을 독립 교차 확인했다.

충돌은 두 workflow 계약 파일뿐이었으며, 고정 목록 대신 같은 build 출력으로 production/published 양쪽 matrix를 결정하는 PR17 구조를 채택했다. 현재 실제 발견 목록은 `insurance, investing, tax, book-volumes, database, kubernetes`다. 주거 검증 스크립트가 아직 없으므로 예약된 housing은 실행 목록에 들어가지 않는다. 공유 검증 기반 자체가 바뀐 이 후보는 **사용 가능한 여섯 suite 전체**가 선택되어야 하며, 후속 DB 전용 변경은 DB와 필수 `book-volumes`를 선택한다.

첫 통합 단위 테스트에서 공통 문자열 `소개·01–02장 공개`를 바꾸던 fixture가 세금 대신 DB 항목을 선택하는 오류를 발견했다. 분류기는 올바르게 DB 변경을 식별했고, fixture만 세금의 `id`와 `future` 속성으로 한정해 고쳤다. 필수 assertion을 삭제하거나 검사 범위를 줄이지 않았다. 수정 후 전체 **889/889** 단위 테스트, TypeScript/Vite production build **321 modules**, 별도 선택기/workflow **14/14** 계약과 쿠버네티스 **144/144** 모델·시각 계약을 통과했다. `git diff --check`와 검증 스크립트 문법도 통과했다.

이 항목은 로컬 통합 결과이며 새 후보의 Actions·실제 PNG·main·Pages 게시 성공을 미리 뜻하지 않는다. 새 CSS/JS가 만들어졌으므로 통합 실행의 DB·쿠버네티스·공통 기능 화면을 다시 확인하고, 같은 main의 게시 자산 일치까지 확인한 뒤 A를 닫는다. 환경은 기존과 같은 클라우드 작업 트리 Node 24.19이며 실제 브라우저는 GitHub Actions의 Chromium으로 검증한다. 실제 PostgreSQL/MSSQL 실행은 여전히 하지 않았다.

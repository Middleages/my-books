# 데이터베이스 교재 — 세션별 실행 프롬프트

작성일: 2026-10-20 (KST). [교재 계획](DATABASE-TEXTBOOK-PLAN.md)의 소개·12장을 A–F로 순차 구현하고 G에서 통합 검토한다. 이 파일은 실행 지시의 보관본이며 문서가 존재하는 것만으로 본문·실습·게시가 완료된 것은 아니다.

사용자는 처음 DB 우선 작성을 선택했으며 이후 쿠버네티스 보완도 병행하도록 변경했다. DB 구현 범위는 독립적으로 유지한다. 이 세션에서는 쿠버네티스 본문을 바꾸지 않는다. 각 블록은 **단독으로 복사해 새 세션에서 쓸 수 있는 완전한 프롬프트**다. 공통 지침을 생략하지 않았다.

A → B → C → D → E → F → G를 차례로 사용한다. 선행 구현·단위/build·production/직접 시각 검토가 끝나지 않았으면 그 상태부터 해결한다. 이 소스 검증이 끝나면 선행 게시 대기 중 다음 배치를 별도 로컬 트리에서 준비할 수 있으나, 선행 main·실제 Pages 확인 전에는 다음 배치를 공개하지 않는다. 두 장을 넘어 임의로 후속 범위를 구현하지 않는다. main 반영·배포가 승인된 작업이라도 병행 교재의 게시 확인 중에는 main을 변경하지 않고 통합 순서를 조율한다. 승인 없는 새 실행 세션에서는 draft PR을 완료 지점으로 두고 merge·배포 권한을 추론하지 않는다.

2026-10-20 검사 범위 조정: A–F는 추가·변경한 DB 장과 영향받는 홈·권차·읽음 등 공통 기능에 브라우저 검사를 집중한다. 전체 단위 테스트·빌드는 유지하고 G 전체 완성 때 넓은 브라우저 회귀를 실행한다. 실패한 필수 검사를 숨기지 않는다.

실제 PostgreSQL 실습은 선택 경로다. 합성 DB를 사용하고 실행 환경·범위의 승인을 확인한다. 브라우저 교육 모델·문법 검사·실제 SQL·복구 훈련·사이트 게시를 따로 보고한다.

## 세션 A — 소개·01–02: 파일과 관계의 기초

```text
Middleages/my-books의 『웹앱 개발자를 위한 데이터베이스』 작업을 진행하자.
최신 main과 작업 트리·병행 작업을 확인하고 독립 branch/worktree에서 작업해줘. 과거 SHA를 현재 기준으로 쓰지 말고 다른 세션의 보험·세금·다른 교재 변경을 보존해줘.
다음 문서와 관련 본문·UI·순수 모델·테스트를 먼저 읽어줘.
- AGENTS.md
- docs/CONTENT-AUTHORING.md
- docs/HOME-INFORMATION-ARCHITECTURE.md
- docs/DATABASE-TEXTBOOK-PLAN.md
- docs/DATABASE-SESSION-PROMPTS.md
- 존재하는 docs/DATABASE-LAB-ENVIRONMENT.md와 DATABASE-BATCH-*-VERIFICATION.md
- 네트워크 02 AddressPrimer/AddressSpaceDiagram/AddressPath와 foundation-visual.mjs, 쿠버네티스의 관련 관찰 모델. 기존 표현을 참고하되 주소 띠나 같은 카드 배치를 모든 DB 개념에 복제하지 마.
저장소 .agents/skills에 관련 지침이 있으면 확인해줘. 실제 사용자 컴퓨터나 운영 DB에는 접근하지 말고 승인된 작업 환경을 사용해줘.
선행 배치가 없는 첫 구현이야. DB 계획이 두 문서에만 있는 상태인지 확인하고, 기존 사이트 구조와 같은 방식으로 최소 토대만 추가해줘.
이번 범위는 소개, 01 files-and-database(FilesAndDatabase.mdx), 02 tables-and-constraints(TablesAndConstraints.mdx)야. 03 이후는 본문·catalog에 등록하지 마.

고유 작업:
1. 소개에는 목표·두 학습 경로·PostgreSQL/MSSQL 경계·실제 공개 범위를 설명해줘. 고정 bookId/readId와 IT 분야·자체 SVG 장식 표지를 추가하되 기존 홈을 바꾸지 마.
2. 계획2절의 네 표와 초기 fixture를 모델의 단일 근거로 확정해줘. 고객1 확정 주문2건·항목3행·수량7개·36,000원, 과거 상품 가격 불변, FK/PK/qty/가용재고를 테스트해줘. 기록된 과거 주문을 초기 가용재고에서 다시 빼지 마.
3. 01은 두 앱 lane→같은 revision의 JSON 사본→공유 저장소를 그려줘. 순차·겹친 읽기-쓰기·파일 잠금·DB의 보호 조건을 비교하고, 시작재고1에 주문2개/남은0이 되는 반례를 실제 사본·쓰기 경로로 보여줘. 파일도 올바르게 관리할 수 있고 DB만 도입해도 업무 규칙이 저절로 맞지는 않는다는 경계를 유지해줘.
4. 02는 실제 PK/FK 셀과 1:N 연결, 복합키 경계를 그려줘. 정상·중복PK·없는FK·qty0·qtyNULL·이름중복의 삽입 후보가 왜 들어가거나 거절되는지 보여줘. 이름 변경에도 id 연결이 유지되는 예와 PostgreSQL에서 NOT NULL을 제거하면 CHECK의 UNKNOWN 판정이 허용되어 NULL을 막지 못하는 예가 필요해.
5. 아직 transaction/동시성 엔진을 일반화해 만들지 말고 다음 장 질문으로 연결해줘. 선택 DB 실습의 환경 계약이 필요하면 docs/DATABASE-LAB-ENVIRONMENT.md에 문서기준/후보/실제관측/미검증을 분리해 작성해줘. 설치나 실제 연결은 이 브라우저 배치의 필수 작업이 아니야.
6. 최소 UI/재생/fixture만 만들고 전체 사이트 framework나 다른 책의 표현은 리팩터링하지 마.

공통 구현 계약:
- 본문은 src/content/database/*.mdx, UI는 src/components/database/, 결정적 순수 모델은 src/simulations/database/*.mjs와 필요한 .d.mts, 테스트는 기존 Node 체계를 따라줘. MDX에 상태·계산·임의 SQL 평가를 넣지 마.
- bookId database, categoryId technology, URL #/database/<id>, readId database/<id>를 유지해줘. 구현한 장만 catalog·소개·읽음 분모에 등록해줘. 소개는 번호 장/읽음 분모가 아니야. 홈의 책 선택 구조·분야·기존 표지·my-books:read:v1·알 수 없는 읽음 ID를 보존해줘.
- study-shop의 customers/products/orders/order_items와 명명된 fixture를 재사용해줘. 금액은 정수 원, 수량은 개, 재고는 시나리오 시작 가용량을 기준으로 해줘. 현재 상품 가격과 주문 당시 단가, 주문 확정과 결제/회계 매출을 구분해줘. 실제 개인정보·자격 증명·외부 결제는 없어야 해.
- PostgreSQL 18 공식 문서가 의미의 기준이야. 기획 당시 Current 18/19 RC 문서 구분은 실제 서버 실행 증거가 아니야. 구현 시 공식 근거를 다시 확인하고 장별 출처·확인일을 남겨줘. 실제 version()/psql/OS·이미지digest·driver를 관측하지 않았으면 실행 버전을 검증했다고 쓰지 마. MSSQL 차이는 계획의 짧은 비교 상자만 사용하고 모든 DB 내부를 PostgreSQL처럼 일반화하지 마.
- 학습 목표→그림과 짧은 설명→관찰/예측/조작→왜 그런 결과인지→실제 확인→확인 문제와 이유·출처의 흐름을 지켜줘. SQL 문법/설치 매뉴얼이나 긴 로그로 본문을 채우지 마.

시각 설명력 계약:
- 구현 전에 장면마다 발견할 관계, 그것을 나타낼 형태/위치/크기/경계/선, 유지할 조건, 바꿀 조건, 전후 차이, 모델 필드를 정해줘. 기본 예시는 핵심 차이가 바로 드러나야 해.
- 그림·실제 연결선·행·숫자·표·판정·해설은 같은 모델 frame을 읽어야 해. edge가 모델에 있고 화면에는 A→B 문장만 있는 상태는 관계도 완성이 아니야. 연결선 끝점·방향·객체의 역할을 실제로 보여줘.
- 동일한 카드의 값/문장만 바꾸거나 입력폼+결과카드로 시각 설명을 대신하지 마. 움직임은 실제 순서/이동/누적/상태 전환을 설명할 때만 써줘. 더 많은 animation 자체가 목표는 아니야.
- 삭제/취소/반환된 행·세션·연결의 현재 존재와 경계를 갱신해줘. 과거 객체를 남겨 비교하면 명시적 이력 영역과 관측 시점을 사용해줘. 없는 객체를 현재 경계 안에 그대로 두지 마.
- 비례 그림은 단위·축·같은 비교 눈금이 필요해. 초과량을 잘라 서로 다른 queue/대기/용량이 같은 막대로 보이게 하지 말고 초과 영역 또는 명시적 공통 확장 눈금으로 차이를 보존해줘.
- 과정에는 재생/정지/이전/다음 한 단계/다시 보기/전체 초기화를 제공해줘. 설정 변경은 재생·예측·현재 단계를 초기화하고 이전 입력이 남지 않아야 해. 빠른 반복 클릭·장 이동·unmount에서도 타이머/효과를 정리해줘.
- 조작·현재 단계·핵심 변화가 가까이 보여야 해. 긴 그림 아래 controls를 눌러 바뀐 그림이 viewport 밖으로 사라지지 않게 해줘. 모바일은 축소 대신 재배치하고 키보드/포커스/reduced-motion/정적 단계로 같은 정보를 전달해줘.

검증·인계:
- 불변식뿐 아니라 실패·경계·NULL/빈 결과·재실행 반례도 테스트해줘. 화면 상태/연결선과 모델의 일치도 확인해줘. 전체 npm test, npm run build, git diff --check를 최종 통합 코드에서 실행해줘.
- 실제 production 화면 1440/390/320px에서 조작 전후 캡처를 직접 열어 역할·관계·유지/변화·눈금·정지 화면·controls 근접성을 확인해줘. 기능 테스트 통과와 설명력 검토 결과는 별도로 남겨줘.
- 브라우저 검사는 이번 DB 추가·변경 장과 영향받는 홈·권차·읽음 등 공통 기능에 집중해줘. MDX 문단 중첩/props·가로 넘침·작은 라벨·console/pageerror, 키보드·정지·초기화·reduced-motion·새로고침·알 수 없는 ID를 확인하고, 무관한 책 전체 검사는 G로 남겨도 돼. 전체 단위 테스트·빌드는 유지하고 실패한 필수 검사를 제거하지 마. 실제로 안 본 브라우저·터치·스크린리더를 통과로 쓰지 마.
- 브라우저 모델은 실제 DB 실행이 아니야. 실습 SQL을 제시하면 실행 위치/세션/사전 상태/예상 관측/정리 범위를 붙여줘. 실제 DB 실행은 승인된 일회용 합성 DB에서만, 미실행이면 정확히 표시해줘. 운영 연결·위험 설정·데이터 삭제·원본 덮어쓰기를 진행하지 마.
- 선행 배치의 소스·production·직접 시각 검토를 통과했다면 게시 대기 중 이 배치를 별도 로컬 트리에서 준비할 수 있어. 다만 선행 배치의 실제 main·Pages 확인 전에 다음 배치를 공개하지 말고, 로컬 준비와 게시 완료를 구분해줘.
- 최신 main의 다른 변경을 보존한 draft PR로 정리해줘. main 반영·배포가 현재 작업에 명시적으로 승인돼 있을 때만 조율된 안정 창에서 통합·검증·반영하고 정확한 commit의 Actions와 실제 Pages 자산/장 URL을 확인해줘. 승인되지 않았다면 merge/auto-merge/배포하지 말고 PR 상태를 보고해줘.
- 계획의 상태·실제 공개 범위·이번 검증 문서를 갱신해줘. 기준 commit·변경 파일/IDs·출처·모델 가정·실제 실행 환경/결과·PR/게시 상태·미검증·다음 범위를 남겨줘. 미래 commit SHA나 아직 통과하지 않은 상태를 만들어 쓰지 마.
- 막히면 정확한 작업/대상/이유·완료한 범위·실패/승인대기/불확실 여부를 보고해줘. 성공 여부가 불확실한 외부 변경은 결과부터 확인하고, 다른 세션 변경을 되돌려 우회하지 마.
이번 검증 문서는 docs/DATABASE-BATCH-A-VERIFICATION.md에 남겨줘.
```

## 세션 B — 03–04: 조회와 인덱스

```text
Middleages/my-books의 『웹앱 개발자를 위한 데이터베이스』 작업을 진행하자.
최신 main과 작업 트리·병행 작업을 확인하고 독립 branch/worktree에서 작업해줘. 과거 SHA를 현재 기준으로 쓰지 말고 다른 세션의 보험·세금·다른 교재 변경을 보존해줘.
다음 문서와 관련 본문·UI·순수 모델·테스트를 먼저 읽어줘.
- AGENTS.md
- docs/CONTENT-AUTHORING.md
- docs/HOME-INFORMATION-ARCHITECTURE.md
- docs/DATABASE-TEXTBOOK-PLAN.md
- docs/DATABASE-SESSION-PROMPTS.md
- 존재하는 docs/DATABASE-LAB-ENVIRONMENT.md와 DATABASE-BATCH-*-VERIFICATION.md
- 네트워크 02 AddressPrimer/AddressSpaceDiagram/AddressPath와 foundation-visual.mjs, 쿠버네티스의 관련 관찰 모델. 기존 표현을 참고하되 주소 띠나 같은 카드 배치를 모든 DB 개념에 복제하지 마.
저장소 .agents/skills에 관련 지침이 있으면 확인해줘. 실제 사용자 컴퓨터나 운영 DB에는 접근하지 말고 승인된 작업 환경을 사용해줘.
선행 A의 코드·fixture·시각 검증·main/PR·승인된 게시 상태를 확인해줘. A의 구현·production·직접 시각 검토가 미완료면 먼저 해결해줘. 이것들이 통과하고 게시만 대기 중이면 B를 별도 로컬 트리에서 준비할 수 있지만 A의 실제 main·Pages 확인 전에는 B를 공개하지 마.
이번 범위는 03 queries-and-joins(QueriesAndJoins.mdx), 04 indexes-and-costs(IndexesAndCosts.mdx)만이야.

고유 작업:
1. 03은 원본 행→키 일치 짝→결과행→집계 그룹을 연결해줘. 주문1001이 두 항목으로 fan-out되는 과정과 고객1의 주문2건/항목3행/수량7개/36,000원을 같은 행 provenance로 보여줘.
2. INNER/LEFT·confirmed 조건·COUNT(*)/COUNT(order_id)/COUNT(DISTINCT order_id)를 비교해줘. 주문 없는 고객의 바깥 JOIN 한 행과 주문0건을 구분하고, NULL/빈 SUM/표시용0 변환을 혼동하지 마. 현재 상품 가격을 바꿔도 과거 주문 단가는 유지해야 해.
3. 제한된 query preset과 읽기 가능한 SQL만 제공해줘. 논리적 JOIN/WHERE/GROUP 관찰 순서가 optimizer의 실제 실행 순서라고 설명하지 마. ORDER BY 없는 결과 순서를 보장하지 마.
4. 04는 같은64행/8교육용 데이터 페이지와 별도 B-tree 도식을 연결해줘. 좁은/넓은 조건, 모인/흩어진 row 위치, index 유무, 삽입/인덱스열 갱신의 읽기·쓰기 경로를 비교해줘. 0건이어도 탐색은 발생하고 두 조회 경로의 반환 row id 집합은 같아야 해.
5. 방문 indexPageIds/heapPageIds에서 페이지 강조·수치·표를 계산해줘. 교육용 접근 개수는 planner cost/ms가 아니고8행/페이지는 실제 PostgreSQL 페이지 크기가 아니야. cache·bitmap/index-only 등 생략을 가까이에 표시해줘.
6. 복합키(customer_id,created_at) 범위를 짧게 보여주되 PostgreSQL 18 skip scan을 확인하고 '첫 열 조건 없으면 절대 사용 불가'라는 단정을 피해야 해. MSSQL heap/clustered 비교는 공식 근거를 붙인 짧은 상자로만 넣어줘.
7. catalog/공개 분모는 구현한01–04까지만, transaction과 동시성은 C로 남겨줘.

공통 구현 계약:
- 본문은 src/content/database/*.mdx, UI는 src/components/database/, 결정적 순수 모델은 src/simulations/database/*.mjs와 필요한 .d.mts, 테스트는 기존 Node 체계를 따라줘. MDX에 상태·계산·임의 SQL 평가를 넣지 마.
- bookId database, categoryId technology, URL #/database/<id>, readId database/<id>를 유지해줘. 구현한 장만 catalog·소개·읽음 분모에 등록해줘. 소개는 번호 장/읽음 분모가 아니야. 홈의 책 선택 구조·분야·기존 표지·my-books:read:v1·알 수 없는 읽음 ID를 보존해줘.
- study-shop의 customers/products/orders/order_items와 명명된 fixture를 재사용해줘. 금액은 정수 원, 수량은 개, 재고는 시나리오 시작 가용량을 기준으로 해줘. 현재 상품 가격과 주문 당시 단가, 주문 확정과 결제/회계 매출을 구분해줘. 실제 개인정보·자격 증명·외부 결제는 없어야 해.
- PostgreSQL 18 공식 문서가 의미의 기준이야. 기획 당시 Current 18/19 RC 문서 구분은 실제 서버 실행 증거가 아니야. 구현 시 공식 근거를 다시 확인하고 장별 출처·확인일을 남겨줘. 실제 version()/psql/OS·이미지digest·driver를 관측하지 않았으면 실행 버전을 검증했다고 쓰지 마. MSSQL 차이는 계획의 짧은 비교 상자만 사용하고 모든 DB 내부를 PostgreSQL처럼 일반화하지 마.
- 학습 목표→그림과 짧은 설명→관찰/예측/조작→왜 그런 결과인지→실제 확인→확인 문제와 이유·출처의 흐름을 지켜줘. SQL 문법/설치 매뉴얼이나 긴 로그로 본문을 채우지 마.

시각 설명력 계약:
- 구현 전에 장면마다 발견할 관계, 그것을 나타낼 형태/위치/크기/경계/선, 유지할 조건, 바꿀 조건, 전후 차이, 모델 필드를 정해줘. 기본 예시는 핵심 차이가 바로 드러나야 해.
- 그림·실제 연결선·행·숫자·표·판정·해설은 같은 모델 frame을 읽어야 해. edge가 모델에 있고 화면에는 A→B 문장만 있는 상태는 관계도 완성이 아니야. 연결선 끝점·방향·객체의 역할을 실제로 보여줘.
- 동일한 카드의 값/문장만 바꾸거나 입력폼+결과카드로 시각 설명을 대신하지 마. 움직임은 실제 순서/이동/누적/상태 전환을 설명할 때만 써줘. 더 많은 animation 자체가 목표는 아니야.
- 삭제/취소/반환된 행·세션·연결의 현재 존재와 경계를 갱신해줘. 과거 객체를 남겨 비교하면 명시적 이력 영역과 관측 시점을 사용해줘. 없는 객체를 현재 경계 안에 그대로 두지 마.
- 비례 그림은 단위·축·같은 비교 눈금이 필요해. 초과량을 잘라 서로 다른 queue/대기/용량이 같은 막대로 보이게 하지 말고 초과 영역 또는 명시적 공통 확장 눈금으로 차이를 보존해줘.
- 과정에는 재생/정지/이전/다음 한 단계/다시 보기/전체 초기화를 제공해줘. 설정 변경은 재생·예측·현재 단계를 초기화하고 이전 입력이 남지 않아야 해. 빠른 반복 클릭·장 이동·unmount에서도 타이머/효과를 정리해줘.
- 조작·현재 단계·핵심 변화가 가까이 보여야 해. 긴 그림 아래 controls를 눌러 바뀐 그림이 viewport 밖으로 사라지지 않게 해줘. 모바일은 축소 대신 재배치하고 키보드/포커스/reduced-motion/정적 단계로 같은 정보를 전달해줘.

검증·인계:
- 불변식뿐 아니라 실패·경계·NULL/빈 결과·재실행 반례도 테스트해줘. 화면 상태/연결선과 모델의 일치도 확인해줘. 전체 npm test, npm run build, git diff --check를 최종 통합 코드에서 실행해줘.
- 실제 production 화면 1440/390/320px에서 조작 전후 캡처를 직접 열어 역할·관계·유지/변화·눈금·정지 화면·controls 근접성을 확인해줘. 기능 테스트 통과와 설명력 검토 결과는 별도로 남겨줘.
- 브라우저 검사는 이번 DB 추가·변경 장과 영향받는 홈·권차·읽음 등 공통 기능에 집중해줘. MDX 문단 중첩/props·가로 넘침·작은 라벨·console/pageerror, 키보드·정지·초기화·reduced-motion·새로고침·알 수 없는 ID를 확인하고, 무관한 책 전체 검사는 G로 남겨도 돼. 전체 단위 테스트·빌드는 유지하고 실패한 필수 검사를 제거하지 마. 실제로 안 본 브라우저·터치·스크린리더를 통과로 쓰지 마.
- 브라우저 모델은 실제 DB 실행이 아니야. 실습 SQL을 제시하면 실행 위치/세션/사전 상태/예상 관측/정리 범위를 붙여줘. 실제 DB 실행은 승인된 일회용 합성 DB에서만, 미실행이면 정확히 표시해줘. 운영 연결·위험 설정·데이터 삭제·원본 덮어쓰기를 진행하지 마.
- 선행 배치의 소스·production·직접 시각 검토를 통과했다면 게시 대기 중 이 배치를 별도 로컬 트리에서 준비할 수 있어. 다만 선행 배치의 실제 main·Pages 확인 전에 다음 배치를 공개하지 말고, 로컬 준비와 게시 완료를 구분해줘.
- 최신 main의 다른 변경을 보존한 draft PR로 정리해줘. main 반영·배포가 현재 작업에 명시적으로 승인돼 있을 때만 조율된 안정 창에서 통합·검증·반영하고 정확한 commit의 Actions와 실제 Pages 자산/장 URL을 확인해줘. 승인되지 않았다면 merge/auto-merge/배포하지 말고 PR 상태를 보고해줘.
- 계획의 상태·실제 공개 범위·이번 검증 문서를 갱신해줘. 기준 commit·변경 파일/IDs·출처·모델 가정·실제 실행 환경/결과·PR/게시 상태·미검증·다음 범위를 남겨줘. 미래 commit SHA나 아직 통과하지 않은 상태를 만들어 쓰지 마.
- 막히면 정확한 작업/대상/이유·완료한 범위·실패/승인대기/불확실 여부를 보고해줘. 성공 여부가 불확실한 외부 변경은 결과부터 확인하고, 다른 세션 변경을 되돌려 우회하지 마.
이번 검증 문서는 docs/DATABASE-BATCH-B-VERIFICATION.md에 남겨줘.
```

## 세션 C — 05–06: 트랜잭션과 동시 실행

```text
Middleages/my-books의 『웹앱 개발자를 위한 데이터베이스』 작업을 진행하자.
최신 main과 작업 트리·병행 작업을 확인하고 독립 branch/worktree에서 작업해줘. 과거 SHA를 현재 기준으로 쓰지 말고 다른 세션의 보험·세금·다른 교재 변경을 보존해줘.
다음 문서와 관련 본문·UI·순수 모델·테스트를 먼저 읽어줘.
- AGENTS.md
- docs/CONTENT-AUTHORING.md
- docs/HOME-INFORMATION-ARCHITECTURE.md
- docs/DATABASE-TEXTBOOK-PLAN.md
- docs/DATABASE-SESSION-PROMPTS.md
- 존재하는 docs/DATABASE-LAB-ENVIRONMENT.md와 DATABASE-BATCH-*-VERIFICATION.md
- 네트워크 02 AddressPrimer/AddressSpaceDiagram/AddressPath와 foundation-visual.mjs, 쿠버네티스의 관련 관찰 모델. 기존 표현을 참고하되 주소 띠나 같은 카드 배치를 모든 DB 개념에 복제하지 마.
저장소 .agents/skills에 관련 지침이 있으면 확인해줘. 실제 사용자 컴퓨터나 운영 DB에는 접근하지 말고 승인된 작업 환경을 사용해줘.
선행 B까지의 코드·검증·실제 공개 범위·main/PR·승인된 게시 상태를 확인해줘. 선행 구현이 빠져 있으면 후속 장을 먼저 만들지 마.
이번 범위는 05 transactions(Transactions.mdx), 06 concurrency(Concurrency.mdx)만이야.

고유 작업:
1. 05는 재고5에서2개 예약하는 변경·주문·항목을 transaction 경계로 묶고 작성 session과 다른 session의 보기를 나란히 보여줘. BEGIN→변경→COMMIT/ROLLBACK에서 행과 수량이 함께 바뀌어야 해.
2. 문장별 autocommit/하나의 transaction, 차감 뒤 주문 헤더 INSERT 제약 오류/항목 INSERT 제약 오류/성공을 비교해줘. 앱 중단과 SQL 오류를 섞지 마. 성공은 재고3·새 헤더1·항목수량2, rollback은 재고5·추가0, autocommit 헤더 오류는 재고3·헤더0·항목0, 항목 오류는 재고3·헤더1·항목0이야. orders.status의 confirmed와 COMMIT, 빈 헤더의 스키마 유효성과 업무 완료를 구별해줘. 최신 확정 상태·미확정 변경·과거 성공 조회·실패 block을 분리하고 오류 뒤 SELECT를 성공처럼 그리지 마. 0행 UPDATE는 SQL 오류가 아니야. fixture에 sequence 기본값은 없으므로 별도 이름 있는 교육용 sequence의 nextval 사건을 명시하고, 실제 호출한 할당만 소비하며 rollback으로 되돌리지 않는다고 설명해줘.
3. 미확정 변경 영역은 논리적 visibility 도식이지 물리 임시DB가 아니야. 이메일·외부결제·파일이 DB rollback으로 취소된다고 쓰지 마. COMMIT 응답 유실은 미확정 증거가 아니라는 질문을 남겨줘.
4. 06은 last-item fixture(재고1)의 A/B lane, row version, snapshot, 잠금 소유/대기를 고정 교차 실행표로 보여줘. 둘 다1을 읽고 각각0을 쓰는 절대값 갱신은 BEGIN과CHECK>=0가 있어도 주문2건을 만들 수 있음을 보여줘.
5. 안전 비교는 조건부 감소 WHERE available_qty>=요청량과 affectedRows=1 확인이야. 두 번째가 기다린 뒤 선행 commit의 최신 값에서 조건을 재평가해0행이면 주문을 쓰지 않는 과정을 보여줘. SELECT FOR UPDATE는 같은 transaction에서 잠금을 얻은 뒤 반환된 현재 재고를 다시 확인하고 처리하는 대안으로 비교해줘. 잠금 자체가 업무 검사를 대신하지 않아.
6. 같은 SELECT 사이 다른 session이 commit하는 경우를 Read Committed/Repeatable Read snapshot 경계로 비교해줘. Serializable은 모든 요청을 무조건 성공시키는 기능이 아니며 transaction 전체 재시도를 설명해줘. rollback 잠금 해제와 두 자원 역순 잠금 wait-cycle 반례를 넣되 실제 deadlock 탐지 시간을 예측하지 마.
7. MSSQL READ COMMITTED는 RCSI·제품기본값에 따라 다른 점을 공식문서로 확인해 짧게 분리해줘. PostgreSQL 내부를 모든 DB에 일반화하지 마. 실제 두 session 실행을 안 했다면 schedule 모델 검증으로만 기록해줘.
8. 공개 범위01–06, 연결 풀과 실행계획은 D로 남겨줘.

공통 구현 계약:
- 본문은 src/content/database/*.mdx, UI는 src/components/database/, 결정적 순수 모델은 src/simulations/database/*.mjs와 필요한 .d.mts, 테스트는 기존 Node 체계를 따라줘. MDX에 상태·계산·임의 SQL 평가를 넣지 마.
- bookId database, categoryId technology, URL #/database/<id>, readId database/<id>를 유지해줘. 구현한 장만 catalog·소개·읽음 분모에 등록해줘. 소개는 번호 장/읽음 분모가 아니야. 홈의 책 선택 구조·분야·기존 표지·my-books:read:v1·알 수 없는 읽음 ID를 보존해줘.
- study-shop의 customers/products/orders/order_items와 명명된 fixture를 재사용해줘. 금액은 정수 원, 수량은 개, 재고는 시나리오 시작 가용량을 기준으로 해줘. 현재 상품 가격과 주문 당시 단가, 주문 확정과 결제/회계 매출을 구분해줘. 실제 개인정보·자격 증명·외부 결제는 없어야 해.
- PostgreSQL 18 공식 문서가 의미의 기준이야. 기획 당시 Current 18/19 RC 문서 구분은 실제 서버 실행 증거가 아니야. 구현 시 공식 근거를 다시 확인하고 장별 출처·확인일을 남겨줘. 실제 version()/psql/OS·이미지digest·driver를 관측하지 않았으면 실행 버전을 검증했다고 쓰지 마. MSSQL 차이는 계획의 짧은 비교 상자만 사용하고 모든 DB 내부를 PostgreSQL처럼 일반화하지 마.
- 학습 목표→그림과 짧은 설명→관찰/예측/조작→왜 그런 결과인지→실제 확인→확인 문제와 이유·출처의 흐름을 지켜줘. SQL 문법/설치 매뉴얼이나 긴 로그로 본문을 채우지 마.

시각 설명력 계약:
- 구현 전에 장면마다 발견할 관계, 그것을 나타낼 형태/위치/크기/경계/선, 유지할 조건, 바꿀 조건, 전후 차이, 모델 필드를 정해줘. 기본 예시는 핵심 차이가 바로 드러나야 해.
- 그림·실제 연결선·행·숫자·표·판정·해설은 같은 모델 frame을 읽어야 해. edge가 모델에 있고 화면에는 A→B 문장만 있는 상태는 관계도 완성이 아니야. 연결선 끝점·방향·객체의 역할을 실제로 보여줘.
- 동일한 카드의 값/문장만 바꾸거나 입력폼+결과카드로 시각 설명을 대신하지 마. 움직임은 실제 순서/이동/누적/상태 전환을 설명할 때만 써줘. 더 많은 animation 자체가 목표는 아니야.
- 삭제/취소/반환된 행·세션·연결의 현재 존재와 경계를 갱신해줘. 과거 객체를 남겨 비교하면 명시적 이력 영역과 관측 시점을 사용해줘. 없는 객체를 현재 경계 안에 그대로 두지 마.
- 비례 그림은 단위·축·같은 비교 눈금이 필요해. 초과량을 잘라 서로 다른 queue/대기/용량이 같은 막대로 보이게 하지 말고 초과 영역 또는 명시적 공통 확장 눈금으로 차이를 보존해줘.
- 과정에는 재생/정지/이전/다음 한 단계/다시 보기/전체 초기화를 제공해줘. 설정 변경은 재생·예측·현재 단계를 초기화하고 이전 입력이 남지 않아야 해. 빠른 반복 클릭·장 이동·unmount에서도 타이머/효과를 정리해줘.
- 조작·현재 단계·핵심 변화가 가까이 보여야 해. 긴 그림 아래 controls를 눌러 바뀐 그림이 viewport 밖으로 사라지지 않게 해줘. 모바일은 축소 대신 재배치하고 키보드/포커스/reduced-motion/정적 단계로 같은 정보를 전달해줘.

검증·인계:
- 불변식뿐 아니라 실패·경계·NULL/빈 결과·재실행 반례도 테스트해줘. 화면 상태/연결선과 모델의 일치도 확인해줘. 전체 npm test, npm run build, git diff --check를 최종 통합 코드에서 실행해줘.
- 실제 production 화면 1440/390/320px에서 조작 전후 캡처를 직접 열어 역할·관계·유지/변화·눈금·정지 화면·controls 근접성을 확인해줘. 기능 테스트 통과와 설명력 검토 결과는 별도로 남겨줘.
- 브라우저 검사는 이번 DB 추가·변경 장과 영향받는 홈·권차·읽음 등 공통 기능에 집중해줘. MDX 문단 중첩/props·가로 넘침·작은 라벨·console/pageerror, 키보드·정지·초기화·reduced-motion·새로고침·알 수 없는 ID를 확인하고, 무관한 책 전체 검사는 G로 남겨도 돼. 전체 단위 테스트·빌드는 유지하고 실패한 필수 검사를 제거하지 마. 실제로 안 본 브라우저·터치·스크린리더를 통과로 쓰지 마.
- 브라우저 모델은 실제 DB 실행이 아니야. 실습 SQL을 제시하면 실행 위치/세션/사전 상태/예상 관측/정리 범위를 붙여줘. 실제 DB 실행은 승인된 일회용 합성 DB에서만, 미실행이면 정확히 표시해줘. 운영 연결·위험 설정·데이터 삭제·원본 덮어쓰기를 진행하지 마.
- 선행 배치의 소스·production·직접 시각 검토를 통과했다면 게시 대기 중 이 배치를 별도 로컬 트리에서 준비할 수 있어. 다만 선행 배치의 실제 main·Pages 확인 전에 다음 배치를 공개하지 말고, 로컬 준비와 게시 완료를 구분해줘.
- 최신 main의 다른 변경을 보존한 draft PR로 정리해줘. main 반영·배포가 현재 작업에 명시적으로 승인돼 있을 때만 조율된 안정 창에서 통합·검증·반영하고 정확한 commit의 Actions와 실제 Pages 자산/장 URL을 확인해줘. 승인되지 않았다면 merge/auto-merge/배포하지 말고 PR 상태를 보고해줘.
- 계획의 상태·실제 공개 범위·이번 검증 문서를 갱신해줘. 기준 commit·변경 파일/IDs·출처·모델 가정·실제 실행 환경/결과·PR/게시 상태·미검증·다음 범위를 남겨줘. 미래 commit SHA나 아직 통과하지 않은 상태를 만들어 쓰지 마.
- 막히면 정확한 작업/대상/이유·완료한 범위·실패/승인대기/불확실 여부를 보고해줘. 성공 여부가 불확실한 외부 변경은 결과부터 확인하고, 다른 세션 변경을 되돌려 우회하지 마.
이번 검증 문서는 docs/DATABASE-BATCH-C-VERIFICATION.md에 남겨줘.
```

## 세션 D — 07–08: 연결과 느린 조회 관찰

```text
Middleages/my-books의 『웹앱 개발자를 위한 데이터베이스』 작업을 진행하자.
최신 main과 작업 트리·병행 작업을 확인하고 독립 branch/worktree에서 작업해줘. 과거 SHA를 현재 기준으로 쓰지 말고 다른 세션의 보험·세금·다른 교재 변경을 보존해줘.
다음 문서와 관련 본문·UI·순수 모델·테스트를 먼저 읽어줘.
- AGENTS.md
- docs/CONTENT-AUTHORING.md
- docs/HOME-INFORMATION-ARCHITECTURE.md
- docs/DATABASE-TEXTBOOK-PLAN.md
- docs/DATABASE-SESSION-PROMPTS.md
- 존재하는 docs/DATABASE-LAB-ENVIRONMENT.md와 DATABASE-BATCH-*-VERIFICATION.md
- 네트워크 02 AddressPrimer/AddressSpaceDiagram/AddressPath와 foundation-visual.mjs, 쿠버네티스의 관련 관찰 모델. 기존 표현을 참고하되 주소 띠나 같은 카드 배치를 모든 DB 개념에 복제하지 마.
저장소 .agents/skills에 관련 지침이 있으면 확인해줘. 실제 사용자 컴퓨터나 운영 DB에는 접근하지 말고 승인된 작업 환경을 사용해줘.
선행 C까지의 fixture·트랜잭션·잠금 모델, 검증·main/PR·승인된 게시 상태를 먼저 확인해줘. 같은 connection·잠금·가시성의 의미를 이어가야 해.
이번 범위는 07 connections-and-pools(ConnectionsAndPools.mdx), 08 explain-and-diagnosis(ExplainAndDiagnosis.mdx)만이야.

고유 작업:
1. 07은 HTTP 요청→대기열→번호 있는 pool 슬롯→DB 세션의 실제 연결과 요청 id를 유지해줘. 연결 대기·DB 사용·반환의 시간 구간을 나누고 lock wait는 DB 사용 안에 포함해 중복 합산하지 마.
2. 기본은 동시 요청 4개·pool 2개·각 사용 2교육 단계로 완료 시점 2/2/4/4를 재현해줘. pool 1/2, SQL 종료 뒤 앱의 긴 보유, 반환 누락, 연결 획득 실패를 비교해줘. 연결 상한 칸·실제 client·대여 관계를 분리하고 정상 반환 뒤 idle 연결은 남겨줘. 획득 실패에는 SQL/반환을 꾸미지 마. FIFO·고정 시간은 모델 가정이지 실제 driver의 성능 보장이 아니야.
3. 슬롯당 소유자 1명·사용 중 수<=pool 크기·정상/오류 경로의 반환·한 트랜잭션의 동일 connection을 검증해줘. 앱 replica별 pool 합계와 DB 한도·관리 여유를 보여주되 큰 pool이 잠금·느린 SQL을 해결한다고 쓰지 마.
4. node-postgres의 실제 예는 값 매개변수화, 동일 client의 BEGIN/COMMIT/ROLLBACK, finally 반환을 확인해줘. 임의의 여러 pool.query를 하나의 트랜잭션으로 만들지 마. DB 비밀정보를 브라우저에 넣지 마.
5. 08은 필터를 포함한 scan→aggregate, 별도 nested-loop, 별도 streaming scan→LIMIT의 bounded plan을 그려줘. estimated는 익명 수량 외곽선, actual은 채움으로 같은 행 단위를 써줘. 64확인→scan 예상4/관측40→COUNT 값40인 결과1행, 원래 고객1의 항목2/1행→평균1.5×loops2=3, LIMIT의4확인/2출력/끝까지예상10 반례를 '교육용·서버 출력 아님'으로 표시해줘.
6. cost는 ms가 아니고 actual rows/time은 loops와 함께 읽는다는 점, 부모 시간·BUFFERS를 모두 더하면 중복된다는 점을 설명해줘. BUFFERS는 누적이라 loops를 또 곱하지 마. actual time 두 수는 공통 시계의 시작/끝이 아니므로 포함 시간표는 별도 합성 도해로 표시해줘. 앱 N+1 호출은 plan loops와 다른 lane이야. 최신/낡은 통계 fixture의 비교는 실제 optimizer가 반드시 그 plan을 고른다는 약속이 아니야.
7. EXPLAIN ANALYZE는 실제 실행이야. 기본 실제 관찰은 승인된 합성 DB의 부작용 없는 SELECT로 제한하고 임의 운영 쿼리·변경 SQL을 실행하지 마. rollback이 sequence·외부 부작용까지 모두 취소한다고 보장하지 마. 실제 plan을 수집하면 SQL·data·version·환경과 원출력을 보관해줘.
8. 공개 범위는 01–08이며 WAL·백업은 E로 남겨줘.

공통 구현 계약:
- 본문은 src/content/database/*.mdx, UI는 src/components/database/, 결정적 순수 모델은 src/simulations/database/*.mjs와 필요한 .d.mts, 테스트는 기존 Node 체계를 따라줘. MDX에 상태·계산·임의 SQL 평가를 넣지 마.
- bookId database, categoryId technology, URL #/database/<id>, readId database/<id>를 유지해줘. 구현한 장만 catalog·소개·읽음 분모에 등록해줘. 소개는 번호 장/읽음 분모가 아니야. 홈의 책 선택 구조·분야·기존 표지·my-books:read:v1·알 수 없는 읽음 ID를 보존해줘.
- study-shop의 customers/products/orders/order_items와 명명된 fixture를 재사용해줘. 금액은 정수 원, 수량은 개, 재고는 시나리오 시작 가용량을 기준으로 해줘. 현재 상품 가격과 주문 당시 단가, 주문 확정과 결제/회계 매출을 구분해줘. 실제 개인정보·자격 증명·외부 결제는 없어야 해.
- PostgreSQL 18 공식 문서가 의미의 기준이야. 기획 당시 Current 18/19 RC 문서 구분은 실제 서버 실행 증거가 아니야. 구현 시 공식 근거를 다시 확인하고 장별 출처·확인일을 남겨줘. 실제 version()/psql/OS·이미지digest·driver를 관측하지 않았으면 실행 버전을 검증했다고 쓰지 마. MSSQL 차이는 계획의 짧은 비교 상자만 사용하고 모든 DB 내부를 PostgreSQL처럼 일반화하지 마.
- 학습 목표→그림과 짧은 설명→관찰/예측/조작→왜 그런 결과인지→실제 확인→확인 문제와 이유·출처의 흐름을 지켜줘. SQL 문법/설치 매뉴얼이나 긴 로그로 본문을 채우지 마.

시각 설명력 계약:
- 구현 전에 장면마다 발견할 관계, 그것을 나타낼 형태/위치/크기/경계/선, 유지할 조건, 바꿀 조건, 전후 차이, 모델 필드를 정해줘. 기본 예시는 핵심 차이가 바로 드러나야 해.
- 그림·실제 연결선·행·숫자·표·판정·해설은 같은 모델 frame을 읽어야 해. edge가 모델에 있고 화면에는 A→B 문장만 있는 상태는 관계도 완성이 아니야. 연결선 끝점·방향·객체의 역할을 실제로 보여줘.
- 동일한 카드의 값/문장만 바꾸거나 입력폼+결과카드로 시각 설명을 대신하지 마. 움직임은 실제 순서/이동/누적/상태 전환을 설명할 때만 써줘. 더 많은 animation 자체가 목표는 아니야.
- 삭제/취소/반환된 행·세션·연결의 현재 존재와 경계를 갱신해줘. 과거 객체를 남겨 비교하면 명시적 이력 영역과 관측 시점을 사용해줘. 없는 객체를 현재 경계 안에 그대로 두지 마.
- 비례 그림은 단위·축·같은 비교 눈금이 필요해. 초과량을 잘라 서로 다른 queue/대기/용량이 같은 막대로 보이게 하지 말고 초과 영역 또는 명시적 공통 확장 눈금으로 차이를 보존해줘.
- 과정에는 재생/정지/이전/다음 한 단계/다시 보기/전체 초기화를 제공해줘. 설정 변경은 재생·예측·현재 단계를 초기화하고 이전 입력이 남지 않아야 해. 빠른 반복 클릭·장 이동·unmount에서도 타이머/효과를 정리해줘.
- 조작·현재 단계·핵심 변화가 가까이 보여야 해. 긴 그림 아래 controls를 눌러 바뀐 그림이 viewport 밖으로 사라지지 않게 해줘. 모바일은 축소 대신 재배치하고 키보드/포커스/reduced-motion/정적 단계로 같은 정보를 전달해줘.

검증·인계:
- 불변식뿐 아니라 실패·경계·NULL/빈 결과·재실행 반례도 테스트해줘. 화면 상태/연결선과 모델의 일치도 확인해줘. 전체 npm test, npm run build, git diff --check를 최종 통합 코드에서 실행해줘.
- 실제 production 화면 1440/390/320px에서 조작 전후 캡처를 직접 열어 역할·관계·유지/변화·눈금·정지 화면·controls 근접성을 확인해줘. 기능 테스트 통과와 설명력 검토 결과는 별도로 남겨줘.
- 브라우저 검사는 이번 DB 추가·변경 장과 영향받는 홈·권차·읽음 등 공통 기능에 집중해줘. MDX 문단 중첩/props·가로 넘침·작은 라벨·console/pageerror, 키보드·정지·초기화·reduced-motion·새로고침·알 수 없는 ID를 확인하고, 무관한 책 전체 검사는 G로 남겨도 돼. 전체 단위 테스트·빌드는 유지하고 실패한 필수 검사를 제거하지 마. 실제로 안 본 브라우저·터치·스크린리더를 통과로 쓰지 마.
- 브라우저 모델은 실제 DB 실행이 아니야. 실습 SQL을 제시하면 실행 위치/세션/사전 상태/예상 관측/정리 범위를 붙여줘. 실제 DB 실행은 승인된 일회용 합성 DB에서만, 미실행이면 정확히 표시해줘. 운영 연결·위험 설정·데이터 삭제·원본 덮어쓰기를 진행하지 마.
- 선행 배치의 소스·production·직접 시각 검토를 통과했다면 게시 대기 중 이 배치를 별도 로컬 트리에서 준비할 수 있어. 다만 선행 배치의 실제 main·Pages 확인 전에 다음 배치를 공개하지 말고, 로컬 준비와 게시 완료를 구분해줘.
- 최신 main의 다른 변경을 보존한 draft PR로 정리해줘. main 반영·배포가 현재 작업에 명시적으로 승인돼 있을 때만 조율된 안정 창에서 통합·검증·반영하고 정확한 commit의 Actions와 실제 Pages 자산/장 URL을 확인해줘. 승인되지 않았다면 merge/auto-merge/배포하지 말고 PR 상태를 보고해줘.
- 계획의 상태·실제 공개 범위·이번 검증 문서를 갱신해줘. 기준 commit·변경 파일/IDs·출처·모델 가정·실제 실행 환경/결과·PR/게시 상태·미검증·다음 범위를 남겨줘. 미래 commit SHA나 아직 통과하지 않은 상태를 만들어 쓰지 마.
- 막히면 정확한 작업/대상/이유·완료한 범위·실패/승인대기/불확실 여부를 보고해줘. 성공 여부가 불확실한 외부 변경은 결과부터 확인하고, 다른 세션 변경을 되돌려 우회하지 마.
이번 검증 문서는 docs/DATABASE-BATCH-D-VERIFICATION.md에 남겨줘.
```

## 세션 E — 09–10: 내구성과 복구

```text
Middleages/my-books의 『웹앱 개발자를 위한 데이터베이스』 작업을 진행하자.
최신 main과 작업 트리·병행 작업을 확인하고 독립 branch/worktree에서 작업해줘. 과거 SHA를 현재 기준으로 쓰지 말고 다른 세션의 보험·세금·다른 교재 변경을 보존해줘.
다음 문서와 관련 본문·UI·순수 모델·테스트를 먼저 읽어줘.
- AGENTS.md
- docs/CONTENT-AUTHORING.md
- docs/HOME-INFORMATION-ARCHITECTURE.md
- docs/DATABASE-TEXTBOOK-PLAN.md
- docs/DATABASE-SESSION-PROMPTS.md
- 존재하는 docs/DATABASE-LAB-ENVIRONMENT.md와 DATABASE-BATCH-*-VERIFICATION.md
- 네트워크 02 AddressPrimer/AddressSpaceDiagram/AddressPath와 foundation-visual.mjs, 쿠버네티스의 관련 관찰 모델. 기존 표현을 참고하되 주소 띠나 같은 카드 배치를 모든 DB 개념에 복제하지 마.
저장소 .agents/skills에 관련 지침이 있으면 확인해줘. 실제 사용자 컴퓨터나 운영 DB에는 접근하지 말고 승인된 작업 환경을 사용해줘.
선행 D까지의 트랜잭션·연결·관측 의미, 검증·main/PR·승인된 게시 상태를 확인해줘. 실행하지 않은 DB나 backup/restore를 이미 검증한 것으로 이어받지 마.
이번 범위는 09 durability-and-wal(DurabilityAndWal.mdx), 10 backup-and-restore(BackupAndRestore.mdx)만이야.

고유 작업:
1. 09는 RAM·OS/스토리지 경계, buffer page·WAL record·durable WAL 끝·data page version·commit 상태를 구분해줘. txId·LSN 연결과 WAL-before-data를 눈으로 읽게 하고 LSN을 transaction id나 시간으로 쓰지 마.
2. 변경→WAL 생성→필요 기록 flush→응답→후속 page 반영의 선택된 관찰에서 crash 지점을 비교해줘. 이것이 모든 내부 I/O의 유일한 시간표라는 단정을 피하고 기본 fsync=on·synchronous_commit=on·정상 내구성 장치·복제 없음을 가까이 표시해줘.
3. durable commit+스토리지 생존의 복구 가시성, 응답 유실의 불확실성, 비동기 commit의 최근 변경 손실 가능성, 로컬 디스크 상실을 구분해줘. 위험 설정을 실제 서버에 적용하지 마.
4. 미확정 WAL·페이지도 존재할 수 있으므로 'commit된 SQL만 다시 실행'이라고 그리지 마. 물리 redo와 트랜잭션 가시성을 별도로 표현하고 WAL을 백업·SQL 감사 로그와 같게 쓰지 마.
5. 10은 위쪽 데이터 시점 축(유효 base·연속 WAL·누락·장애·복구 가능 끝), 아래쪽 서비스 복구 소요 축(감지·준비·복원·재생·검증·전환)을 나눠줘. RPO/RTO 목표선을 각각 맞는 축에 두고 하나의 백업 성공 판정으로 합치지 마.
6. 가상 10:15 장애·10:00 base·연속 WAL 10:11은 손실 가능 구간 4분/RPO 목표 5분, 복구 소요 3+4+6+2+5+1=21분/RTO 목표 20분으로 서로 다른 결론을 보여줘. 필수 WAL 중간 누락은 연속 prefix까지만 복구 가능해야 해. 시간·조각은 교육용이며 실제 segment가 분 단위는 아니야.
7. dump snapshot 시점과 파일 완료 시각, logical dump와 physical base+WAL을 구별해줘. 같은 장애에 백업도 소실되거나 복원 후 FK·행 수·금액·앱 읽기가 실패하면 완료가 아니야. live datafile 복사·replica 존재를 검증된 백업으로 쓰지 마.
8. MSSQL recovery model·full/log backup chain은 제품별 비교 상자로 분리해줘. 실제 복원은 별도 승인된 일회용 대상에서만 실행하며 운영 원본을 덮어쓰지 마. 공개 범위는 01–10이며 migration·종합 진단은 F로 남겨줘.

공통 구현 계약:
- 본문은 src/content/database/*.mdx, UI는 src/components/database/, 결정적 순수 모델은 src/simulations/database/*.mjs와 필요한 .d.mts, 테스트는 기존 Node 체계를 따라줘. MDX에 상태·계산·임의 SQL 평가를 넣지 마.
- bookId database, categoryId technology, URL #/database/<id>, readId database/<id>를 유지해줘. 구현한 장만 catalog·소개·읽음 분모에 등록해줘. 소개는 번호 장/읽음 분모가 아니야. 홈의 책 선택 구조·분야·기존 표지·my-books:read:v1·알 수 없는 읽음 ID를 보존해줘.
- study-shop의 customers/products/orders/order_items와 명명된 fixture를 재사용해줘. 금액은 정수 원, 수량은 개, 재고는 시나리오 시작 가용량을 기준으로 해줘. 현재 상품 가격과 주문 당시 단가, 주문 확정과 결제/회계 매출을 구분해줘. 실제 개인정보·자격 증명·외부 결제는 없어야 해.
- PostgreSQL 18 공식 문서가 의미의 기준이야. 기획 당시 Current 18/19 RC 문서 구분은 실제 서버 실행 증거가 아니야. 구현 시 공식 근거를 다시 확인하고 장별 출처·확인일을 남겨줘. 실제 version()/psql/OS·이미지digest·driver를 관측하지 않았으면 실행 버전을 검증했다고 쓰지 마. MSSQL 차이는 계획의 짧은 비교 상자만 사용하고 모든 DB 내부를 PostgreSQL처럼 일반화하지 마.
- 학습 목표→그림과 짧은 설명→관찰/예측/조작→왜 그런 결과인지→실제 확인→확인 문제와 이유·출처의 흐름을 지켜줘. SQL 문법/설치 매뉴얼이나 긴 로그로 본문을 채우지 마.

시각 설명력 계약:
- 구현 전에 장면마다 발견할 관계, 그것을 나타낼 형태/위치/크기/경계/선, 유지할 조건, 바꿀 조건, 전후 차이, 모델 필드를 정해줘. 기본 예시는 핵심 차이가 바로 드러나야 해.
- 그림·실제 연결선·행·숫자·표·판정·해설은 같은 모델 frame을 읽어야 해. edge가 모델에 있고 화면에는 A→B 문장만 있는 상태는 관계도 완성이 아니야. 연결선 끝점·방향·객체의 역할을 실제로 보여줘.
- 동일한 카드의 값/문장만 바꾸거나 입력폼+결과카드로 시각 설명을 대신하지 마. 움직임은 실제 순서/이동/누적/상태 전환을 설명할 때만 써줘. 더 많은 animation 자체가 목표는 아니야.
- 삭제/취소/반환된 행·세션·연결의 현재 존재와 경계를 갱신해줘. 과거 객체를 남겨 비교하면 명시적 이력 영역과 관측 시점을 사용해줘. 없는 객체를 현재 경계 안에 그대로 두지 마.
- 비례 그림은 단위·축·같은 비교 눈금이 필요해. 초과량을 잘라 서로 다른 queue/대기/용량이 같은 막대로 보이게 하지 말고 초과 영역 또는 명시적 공통 확장 눈금으로 차이를 보존해줘.
- 과정에는 재생/정지/이전/다음 한 단계/다시 보기/전체 초기화를 제공해줘. 설정 변경은 재생·예측·현재 단계를 초기화하고 이전 입력이 남지 않아야 해. 빠른 반복 클릭·장 이동·unmount에서도 타이머/효과를 정리해줘.
- 조작·현재 단계·핵심 변화가 가까이 보여야 해. 긴 그림 아래 controls를 눌러 바뀐 그림이 viewport 밖으로 사라지지 않게 해줘. 모바일은 축소 대신 재배치하고 키보드/포커스/reduced-motion/정적 단계로 같은 정보를 전달해줘.

검증·인계:
- 불변식뿐 아니라 실패·경계·NULL/빈 결과·재실행 반례도 테스트해줘. 화면 상태/연결선과 모델의 일치도 확인해줘. 전체 npm test, npm run build, git diff --check를 최종 통합 코드에서 실행해줘.
- 실제 production 화면 1440/390/320px에서 조작 전후 캡처를 직접 열어 역할·관계·유지/변화·눈금·정지 화면·controls 근접성을 확인해줘. 기능 테스트 통과와 설명력 검토 결과는 별도로 남겨줘.
- 브라우저 검사는 이번 DB 추가·변경 장과 영향받는 홈·권차·읽음 등 공통 기능에 집중해줘. MDX 문단 중첩/props·가로 넘침·작은 라벨·console/pageerror, 키보드·정지·초기화·reduced-motion·새로고침·알 수 없는 ID를 확인하고, 무관한 책 전체 검사는 G로 남겨도 돼. 전체 단위 테스트·빌드는 유지하고 실패한 필수 검사를 제거하지 마. 실제로 안 본 브라우저·터치·스크린리더를 통과로 쓰지 마.
- 브라우저 모델은 실제 DB 실행이 아니야. 실습 SQL을 제시하면 실행 위치/세션/사전 상태/예상 관측/정리 범위를 붙여줘. 실제 DB 실행은 승인된 일회용 합성 DB에서만, 미실행이면 정확히 표시해줘. 운영 연결·위험 설정·데이터 삭제·원본 덮어쓰기를 진행하지 마.
- 선행 배치의 소스·production·직접 시각 검토를 통과했다면 게시 대기 중 이 배치를 별도 로컬 트리에서 준비할 수 있어. 다만 선행 배치의 실제 main·Pages 확인 전에 다음 배치를 공개하지 말고, 로컬 준비와 게시 완료를 구분해줘.
- 최신 main의 다른 변경을 보존한 draft PR로 정리해줘. main 반영·배포가 현재 작업에 명시적으로 승인돼 있을 때만 조율된 안정 창에서 통합·검증·반영하고 정확한 commit의 Actions와 실제 Pages 자산/장 URL을 확인해줘. 승인되지 않았다면 merge/auto-merge/배포하지 말고 PR 상태를 보고해줘.
- 계획의 상태·실제 공개 범위·이번 검증 문서를 갱신해줘. 기준 commit·변경 파일/IDs·출처·모델 가정·실제 실행 환경/결과·PR/게시 상태·미검증·다음 범위를 남겨줘. 미래 commit SHA나 아직 통과하지 않은 상태를 만들어 쓰지 마.
- 막히면 정확한 작업/대상/이유·완료한 범위·실패/승인대기/불확실 여부를 보고해줘. 성공 여부가 불확실한 외부 변경은 결과부터 확인하고, 다른 세션 변경을 되돌려 우회하지 마.
이번 검증 문서는 docs/DATABASE-BATCH-E-VERIFICATION.md에 남겨줘.
```

## 세션 F — 11–12: 변경과 종합 진단

```text
Middleages/my-books의 『웹앱 개발자를 위한 데이터베이스』 작업을 진행하자.
최신 main과 작업 트리·병행 작업을 확인하고 독립 branch/worktree에서 작업해줘. 과거 SHA를 현재 기준으로 쓰지 말고 다른 세션의 보험·세금·다른 교재 변경을 보존해줘.
다음 문서와 관련 본문·UI·순수 모델·테스트를 먼저 읽어줘.
- AGENTS.md
- docs/CONTENT-AUTHORING.md
- docs/HOME-INFORMATION-ARCHITECTURE.md
- docs/DATABASE-TEXTBOOK-PLAN.md
- docs/DATABASE-SESSION-PROMPTS.md
- 존재하는 docs/DATABASE-LAB-ENVIRONMENT.md와 DATABASE-BATCH-*-VERIFICATION.md
- 네트워크 02 AddressPrimer/AddressSpaceDiagram/AddressPath와 foundation-visual.mjs, 쿠버네티스의 관련 관찰 모델. 기존 표현을 참고하되 주소 띠나 같은 카드 배치를 모든 DB 개념에 복제하지 마.
저장소 .agents/skills에 관련 지침이 있으면 확인해줘. 실제 사용자 컴퓨터나 운영 DB에는 접근하지 말고 승인된 작업 환경을 사용해줘.
선행 E까지의 스키마·fixture·모델·검증·main/PR·승인된 게시 상태를 확인해줘. 모든 장의 단위·관측 경계·PostgreSQL 버전 의미를 일치시켜줘.
이번 범위는 11 schema-migrations(SchemaMigrations.mdx), 12 database-troubleshooting(DatabaseTroubleshooting.mdx)와 소개·공개 목차의 01–12 일치 확인이야. 새 번호 장은 추가하지 마.

고유 작업:
1. 11은 app v1/v2의 reader·writer와 schema 확장·전환·정리 단계를 연결해줘. products.name을 즉시 rename하면 old 앱이 끊기는 장면과 display_name을 추가해 호환성을 유지하는 장면을 비교해줘. 실제 참조선·행별 backfill·현재 값의 일치가 보여야 해.
2. 확장→호환 앱(구열 읽기·양열 쓰기) 배포→구 단일열 writer 제거→backfill·동등성 검증→새열만 읽고 쓰는 앱 전환→모든 구열 의존 제거→old 열 제거 순서를 구현해줘. 전환기 양열 쓰기는 같은 transaction에서 수행하고 backfill은 오래 읽은 값으로 최신 변경을 덮어쓰지 않아야 해. 이름 수정과 backfill이 겹친 반례, 구버전 앱 잔존, 긴 트랜잭션의 DDL 대기, 중단·재실행을 비교해줘.
3. backfill 100%만으로 최신 값 동등성·앱 호환 완료라고 판정하지 마. 전환기 양열 writer를 포함한 구열 참조자 0, 새 열 채움·값 검증·지원 앱의 읽기/쓰기 성공이 정리 게이트야. lock·rewrite·transaction 가능 범위는 ALTER TABLE·CREATE INDEX 공식 문서로 확인하고 무중단을 보장하지 마. 앱 rollback은 삭제 데이터 복구와 별개야.
4. 12는 요청→pool→session→transaction/lock→plan→durability의 관측 지도를 만들고 기존 모델을 재사용해줘. 증거 id·관측 시각을 선택하면 관련 lane·행·대기·commit 경계가 실제로 강조돼야 해. 카드 객관식만으로 종합 진단을 대신하지 마.
5. 고정 사례는 pool acquire 대기, 긴 트랜잭션의 재고 잠금, estimated 4/actual 40 조회, COMMIT 응답 유실 후 request_key 재시도야. 같은 증상·다른 원인과 한 문제를 수정한 뒤 다른 문제가 남는 복합 사례를 포함해줘.
6. 관측 사실·가설·미확정·다음 안전한 확인을 구분해줘. 같은 key의 같은 payload 확인과 기존 결과 재조회가 필요하며 다른 payload를 중복 성공으로 취급하지 마. 무작정 재시작·session 종료·한도 증가·중복 주문 재실행을 정답으로 만들지 마.
7. pg_stat_activity·wait event·잠금·plan·앱 요청 id의 질문과 관측 권한을 설명하되 실제 로그·개인정보 수집 UI를 만들지 마. 01–12의 용어·공개 ID·출처·모델 경계를 검토하고 설치 매뉴얼·고급 DB 장으로 늘리지 마.
8. 전체 편집·선택 실습 묶음은 G에서 마무리하고 별도 쿠버네티스 보완 작업과 공통 파일·main 쓰기를 조율하고 이 배치에서는 DB만 수정해줘.

공통 구현 계약:
- 본문은 src/content/database/*.mdx, UI는 src/components/database/, 결정적 순수 모델은 src/simulations/database/*.mjs와 필요한 .d.mts, 테스트는 기존 Node 체계를 따라줘. MDX에 상태·계산·임의 SQL 평가를 넣지 마.
- bookId database, categoryId technology, URL #/database/<id>, readId database/<id>를 유지해줘. 구현한 장만 catalog·소개·읽음 분모에 등록해줘. 소개는 번호 장/읽음 분모가 아니야. 홈의 책 선택 구조·분야·기존 표지·my-books:read:v1·알 수 없는 읽음 ID를 보존해줘.
- study-shop의 customers/products/orders/order_items와 명명된 fixture를 재사용해줘. 금액은 정수 원, 수량은 개, 재고는 시나리오 시작 가용량을 기준으로 해줘. 현재 상품 가격과 주문 당시 단가, 주문 확정과 결제/회계 매출을 구분해줘. 실제 개인정보·자격 증명·외부 결제는 없어야 해.
- PostgreSQL 18 공식 문서가 의미의 기준이야. 기획 당시 Current 18/19 RC 문서 구분은 실제 서버 실행 증거가 아니야. 구현 시 공식 근거를 다시 확인하고 장별 출처·확인일을 남겨줘. 실제 version()/psql/OS·이미지digest·driver를 관측하지 않았으면 실행 버전을 검증했다고 쓰지 마. MSSQL 차이는 계획의 짧은 비교 상자만 사용하고 모든 DB 내부를 PostgreSQL처럼 일반화하지 마.
- 학습 목표→그림과 짧은 설명→관찰/예측/조작→왜 그런 결과인지→실제 확인→확인 문제와 이유·출처의 흐름을 지켜줘. SQL 문법/설치 매뉴얼이나 긴 로그로 본문을 채우지 마.

시각 설명력 계약:
- 구현 전에 장면마다 발견할 관계, 그것을 나타낼 형태/위치/크기/경계/선, 유지할 조건, 바꿀 조건, 전후 차이, 모델 필드를 정해줘. 기본 예시는 핵심 차이가 바로 드러나야 해.
- 그림·실제 연결선·행·숫자·표·판정·해설은 같은 모델 frame을 읽어야 해. edge가 모델에 있고 화면에는 A→B 문장만 있는 상태는 관계도 완성이 아니야. 연결선 끝점·방향·객체의 역할을 실제로 보여줘.
- 동일한 카드의 값/문장만 바꾸거나 입력폼+결과카드로 시각 설명을 대신하지 마. 움직임은 실제 순서/이동/누적/상태 전환을 설명할 때만 써줘. 더 많은 animation 자체가 목표는 아니야.
- 삭제/취소/반환된 행·세션·연결의 현재 존재와 경계를 갱신해줘. 과거 객체를 남겨 비교하면 명시적 이력 영역과 관측 시점을 사용해줘. 없는 객체를 현재 경계 안에 그대로 두지 마.
- 비례 그림은 단위·축·같은 비교 눈금이 필요해. 초과량을 잘라 서로 다른 queue/대기/용량이 같은 막대로 보이게 하지 말고 초과 영역 또는 명시적 공통 확장 눈금으로 차이를 보존해줘.
- 과정에는 재생/정지/이전/다음 한 단계/다시 보기/전체 초기화를 제공해줘. 설정 변경은 재생·예측·현재 단계를 초기화하고 이전 입력이 남지 않아야 해. 빠른 반복 클릭·장 이동·unmount에서도 타이머/효과를 정리해줘.
- 조작·현재 단계·핵심 변화가 가까이 보여야 해. 긴 그림 아래 controls를 눌러 바뀐 그림이 viewport 밖으로 사라지지 않게 해줘. 모바일은 축소 대신 재배치하고 키보드/포커스/reduced-motion/정적 단계로 같은 정보를 전달해줘.

검증·인계:
- 불변식뿐 아니라 실패·경계·NULL/빈 결과·재실행 반례도 테스트해줘. 화면 상태/연결선과 모델의 일치도 확인해줘. 전체 npm test, npm run build, git diff --check를 최종 통합 코드에서 실행해줘.
- 실제 production 화면 1440/390/320px에서 조작 전후 캡처를 직접 열어 역할·관계·유지/변화·눈금·정지 화면·controls 근접성을 확인해줘. 기능 테스트 통과와 설명력 검토 결과는 별도로 남겨줘.
- 브라우저 검사는 이번 DB 추가·변경 장과 영향받는 홈·권차·읽음 등 공통 기능에 집중해줘. MDX 문단 중첩/props·가로 넘침·작은 라벨·console/pageerror, 키보드·정지·초기화·reduced-motion·새로고침·알 수 없는 ID를 확인하고, 무관한 책 전체 검사는 G로 남겨도 돼. 전체 단위 테스트·빌드는 유지하고 실패한 필수 검사를 제거하지 마. 실제로 안 본 브라우저·터치·스크린리더를 통과로 쓰지 마.
- 브라우저 모델은 실제 DB 실행이 아니야. 실습 SQL을 제시하면 실행 위치/세션/사전 상태/예상 관측/정리 범위를 붙여줘. 실제 DB 실행은 승인된 일회용 합성 DB에서만, 미실행이면 정확히 표시해줘. 운영 연결·위험 설정·데이터 삭제·원본 덮어쓰기를 진행하지 마.
- 선행 배치의 소스·production·직접 시각 검토를 통과했다면 게시 대기 중 이 배치를 별도 로컬 트리에서 준비할 수 있어. 다만 선행 배치의 실제 main·Pages 확인 전에 다음 배치를 공개하지 말고, 로컬 준비와 게시 완료를 구분해줘.
- 최신 main의 다른 변경을 보존한 draft PR로 정리해줘. main 반영·배포가 현재 작업에 명시적으로 승인돼 있을 때만 조율된 안정 창에서 통합·검증·반영하고 정확한 commit의 Actions와 실제 Pages 자산/장 URL을 확인해줘. 승인되지 않았다면 merge/auto-merge/배포하지 말고 PR 상태를 보고해줘.
- 계획의 상태·실제 공개 범위·이번 검증 문서를 갱신해줘. 기준 commit·변경 파일/IDs·출처·모델 가정·실제 실행 환경/결과·PR/게시 상태·미검증·다음 범위를 남겨줘. 미래 commit SHA나 아직 통과하지 않은 상태를 만들어 쓰지 마.
- 막히면 정확한 작업/대상/이유·완료한 범위·실패/승인대기/불확실 여부를 보고해줘. 성공 여부가 불확실한 외부 변경은 결과부터 확인하고, 다른 세션 변경을 되돌려 우회하지 마.
이번 검증 문서는 docs/DATABASE-BATCH-F-VERIFICATION.md에 남겨줘.
```

## 세션 G — 전체 편집·통합과 선택 실습 묶음

```text
Middleages/my-books의 『웹앱 개발자를 위한 데이터베이스』 작업을 진행하자.
최신 main과 작업 트리·병행 작업을 확인하고 독립 branch/worktree에서 작업해줘. 과거 SHA를 현재 기준으로 쓰지 말고 다른 세션의 보험·세금·다른 교재 변경을 보존해줘.
다음 문서와 관련 본문·UI·순수 모델·테스트를 먼저 읽어줘.
- AGENTS.md
- docs/CONTENT-AUTHORING.md
- docs/HOME-INFORMATION-ARCHITECTURE.md
- docs/DATABASE-TEXTBOOK-PLAN.md
- docs/DATABASE-SESSION-PROMPTS.md
- 존재하는 docs/DATABASE-LAB-ENVIRONMENT.md와 DATABASE-BATCH-*-VERIFICATION.md
- 네트워크 02 AddressPrimer/AddressSpaceDiagram/AddressPath와 foundation-visual.mjs, 쿠버네티스의 관련 관찰 모델. 기존 표현을 참고하되 주소 띠나 같은 카드 배치를 모든 DB 개념에 복제하지 마.
저장소 .agents/skills에 관련 지침이 있으면 확인해줘. 실제 사용자 컴퓨터나 운영 DB에는 접근하지 말고 승인된 작업 환경을 사용해줘.
선행 F까지의 소개·01–12 코드와 검증·main/PR·승인된 게시 상태를 확인해줘. 이번 세션은 새 번호 장을 추가하지 않는 전체 편집·통합 검토야. 실제 PostgreSQL 실습은 환경·범위가 승인된 경우만 실행해줘.

고유 작업:
1. 계획의 12개 핵심 질문이 본문·그림·예측·반례·확인 문제 해설로 이어지는지 전 장을 검토해줘. 같은 fixture·단위·읽음 ID, 예정/공개 범위·출처·문서 버전을 맞추고 발견한 결함만 수정해줘. 다른 교재를 일괄 개편하지 마.
2. 01 사본/쓰기, 02 키 연결, 03 fan-out, 04 방문 페이지, 05 transaction 경계, 06 snapshot/lock, 07 슬롯/대기, 08 plan 흐름, 09 durable/visible, 10 두 복구 축, 11 호환 연결, 12 관측 지도의 전후 차이를 1440/390/320px 실제 화면에서 직접 확인해줘. 관계선이 문장에만 있거나 없는 객체의 경계가 남거나 초과량이 잘리거나 controls와 변화가 떨어진 곳은 보완해줘.
3. 정상/반례·반복 클릭·설정 변경·정지/초기화·장 왕복·키보드·reduced-motion·읽음 저장/알 수 없는 ID·콘솔/MDX·기존 핵심 실험을 회귀 검증해줘. 기능 통과와 설명력 검토를 따로 기록해줘.
4. 선택 실습을 제공한다면 examples/database/에 최소 schema·seed·SELECT 관찰·두 session schedule·복원 검증 README를 정리해줘. psql 하나로 따라갈 기본 경로를 유지하고 앱 connection만 필요할 때 작은 node-postgres 예제로 분리해줘. 문법 사전이나 운영 설치 매뉴얼로 늘리지 마.
5. 실행 버전·OS·이미지 digest·psql·driver·locale/timezone·설정·fixture hash·행 수와 실제 명령 결과를 관측한 경우만 환경 문서에 기록해줘. 사전 상태·실행 세션·기대 관측·실패 확인·일회용 정리 범위를 제공해줘.
6. 허용된 일회용 DB에서 가능하면 fixture 제약/집계, 트랜잭션 실패, 두 connection의 조건부 갱신, EXPLAIN/ANALYZE 구별, 별도 DB에 dump를 복원한 뒤 FK·행 수·주문금액·앱 읽기를 검증해줘. 실제 환경이 없으면 자료와 정적 검증까지만 완성하고 미실행을 명시해줘. physical PITR·crash·MSSQL 설치·운영 서버 변경은 별도 승인 없이 확장하지 마.
7. docs/DATABASE-BOOK-REVIEW.md와 배치 G 검증 문서에 브라우저 모델·SQL 정적 검사·실제 DB·복원 훈련·사이트 게시를 각각 완료/미검증/차단으로 정리해줘. 제공 파일이 있다는 것만으로 실제 복구 통과라고 쓰지 마.
8. DB의 승인된 게시와 잔여 문제까지 최종 보고한 뒤 별도 쿠버네티스 보완 작업과 충돌 없이 통합할 상태를 알려줘. 이번 세션에서 쿠버네티스 본문을 수정하지 마.

공통 구현 계약:
- 본문은 src/content/database/*.mdx, UI는 src/components/database/, 결정적 순수 모델은 src/simulations/database/*.mjs와 필요한 .d.mts, 테스트는 기존 Node 체계를 따라줘. MDX에 상태·계산·임의 SQL 평가를 넣지 마.
- bookId database, categoryId technology, URL #/database/<id>, readId database/<id>를 유지해줘. 구현한 장만 catalog·소개·읽음 분모에 등록해줘. 소개는 번호 장/읽음 분모가 아니야. 홈의 책 선택 구조·분야·기존 표지·my-books:read:v1·알 수 없는 읽음 ID를 보존해줘.
- study-shop의 customers/products/orders/order_items와 명명된 fixture를 재사용해줘. 금액은 정수 원, 수량은 개, 재고는 시나리오 시작 가용량을 기준으로 해줘. 현재 상품 가격과 주문 당시 단가, 주문 확정과 결제/회계 매출을 구분해줘. 실제 개인정보·자격 증명·외부 결제는 없어야 해.
- PostgreSQL 18 공식 문서가 의미의 기준이야. 기획 당시 Current 18/19 RC 문서 구분은 실제 서버 실행 증거가 아니야. 구현 시 공식 근거를 다시 확인하고 장별 출처·확인일을 남겨줘. 실제 version()/psql/OS·이미지digest·driver를 관측하지 않았으면 실행 버전을 검증했다고 쓰지 마. MSSQL 차이는 계획의 짧은 비교 상자만 사용하고 모든 DB 내부를 PostgreSQL처럼 일반화하지 마.
- 학습 목표→그림과 짧은 설명→관찰/예측/조작→왜 그런 결과인지→실제 확인→확인 문제와 이유·출처의 흐름을 지켜줘. SQL 문법/설치 매뉴얼이나 긴 로그로 본문을 채우지 마.

시각 설명력 계약:
- 구현 전에 장면마다 발견할 관계, 그것을 나타낼 형태/위치/크기/경계/선, 유지할 조건, 바꿀 조건, 전후 차이, 모델 필드를 정해줘. 기본 예시는 핵심 차이가 바로 드러나야 해.
- 그림·실제 연결선·행·숫자·표·판정·해설은 같은 모델 frame을 읽어야 해. edge가 모델에 있고 화면에는 A→B 문장만 있는 상태는 관계도 완성이 아니야. 연결선 끝점·방향·객체의 역할을 실제로 보여줘.
- 동일한 카드의 값/문장만 바꾸거나 입력폼+결과카드로 시각 설명을 대신하지 마. 움직임은 실제 순서/이동/누적/상태 전환을 설명할 때만 써줘. 더 많은 animation 자체가 목표는 아니야.
- 삭제/취소/반환된 행·세션·연결의 현재 존재와 경계를 갱신해줘. 과거 객체를 남겨 비교하면 명시적 이력 영역과 관측 시점을 사용해줘. 없는 객체를 현재 경계 안에 그대로 두지 마.
- 비례 그림은 단위·축·같은 비교 눈금이 필요해. 초과량을 잘라 서로 다른 queue/대기/용량이 같은 막대로 보이게 하지 말고 초과 영역 또는 명시적 공통 확장 눈금으로 차이를 보존해줘.
- 과정에는 재생/정지/이전/다음 한 단계/다시 보기/전체 초기화를 제공해줘. 설정 변경은 재생·예측·현재 단계를 초기화하고 이전 입력이 남지 않아야 해. 빠른 반복 클릭·장 이동·unmount에서도 타이머/효과를 정리해줘.
- 조작·현재 단계·핵심 변화가 가까이 보여야 해. 긴 그림 아래 controls를 눌러 바뀐 그림이 viewport 밖으로 사라지지 않게 해줘. 모바일은 축소 대신 재배치하고 키보드/포커스/reduced-motion/정적 단계로 같은 정보를 전달해줘.

검증·인계:
- 불변식뿐 아니라 실패·경계·NULL/빈 결과·재실행 반례도 테스트해줘. 화면 상태/연결선과 모델의 일치도 확인해줘. 전체 npm test, npm run build, git diff --check를 최종 통합 코드에서 실행해줘.
- 실제 production 화면 1440/390/320px에서 조작 전후 캡처를 직접 열어 역할·관계·유지/변화·눈금·정지 화면·controls 근접성을 확인해줘. 기능 테스트 통과와 설명력 검토 결과는 별도로 남겨줘.
- MDX 문단 중첩/props·가로 넘침·작은 라벨·console/pageerror, 키보드·정지·초기화·reduced-motion·읽음 저장/새로고침/알 수 없는 ID, 기존 주요 실험 회귀를 확인해줘. 실제로 안 본 브라우저·터치·스크린리더를 통과로 쓰지 마.
- 브라우저 모델은 실제 DB 실행이 아니야. 실습 SQL을 제시하면 실행 위치/세션/사전 상태/예상 관측/정리 범위를 붙여줘. 실제 DB 실행은 승인된 일회용 합성 DB에서만, 미실행이면 정확히 표시해줘. 운영 연결·위험 설정·데이터 삭제·원본 덮어쓰기를 진행하지 마.
- 선행 배치의 소스·production·직접 시각 검토를 통과했다면 게시 대기 중 이 배치를 별도 로컬 트리에서 준비할 수 있어. 다만 선행 배치의 실제 main·Pages 확인 전에 다음 배치를 공개하지 말고, 로컬 준비와 게시 완료를 구분해줘.
- 최신 main의 다른 변경을 보존한 draft PR로 정리해줘. main 반영·배포가 현재 작업에 명시적으로 승인돼 있을 때만 조율된 안정 창에서 통합·검증·반영하고 정확한 commit의 Actions와 실제 Pages 자산/장 URL을 확인해줘. 승인되지 않았다면 merge/auto-merge/배포하지 말고 PR 상태를 보고해줘.
- 계획의 상태·실제 공개 범위·이번 검증 문서를 갱신해줘. 기준 commit·변경 파일/IDs·출처·모델 가정·실제 실행 환경/결과·PR/게시 상태·미검증·다음 범위를 남겨줘. 미래 commit SHA나 아직 통과하지 않은 상태를 만들어 쓰지 마.
- 막히면 정확한 작업/대상/이유·완료한 범위·실패/승인대기/불확실 여부를 보고해줘. 성공 여부가 불확실한 외부 변경은 결과부터 확인하고, 다른 세션 변경을 되돌려 우회하지 마.
이번 검증 문서는 docs/DATABASE-BATCH-G-VERIFICATION.md에 남겨줘.
```

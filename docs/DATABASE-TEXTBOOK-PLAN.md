# 웹앱 개발자를 위한 데이터베이스 — 교재 계획

작성일·공식 자료 확인일: **2026-10-20 (KST)**. 상태: **A 소개·01–02 구현 및 세금·권차 main 보존 통합 후보 완성. 827개 단위 테스트·빌드·DB production browser 124개·권차 14검사·시각 검토 통과. DB main 반영·게시 게이트 미완료. B–G 미구현. 실제 DB 미실행**.
기획 시 확인한 main: `609e6f2cef1c449ee8760f92c98b01ace238d5e1`. 구현은 이 SHA에 고정하지 않고 항상 최신 main과 병행 작업을 확인한다.

관련 기준: [AGENTS.md](../AGENTS.md), [콘텐츠 작성 기준](CONTENT-AUTHORING.md), [홈 정보 구조](HOME-INFORMATION-ARCHITECTURE.md), [네트워크 계획](NETWORK-TEXTBOOK-PLAN.md), [쿠버네티스 계획](KUBERNETES-TEXTBOOK-PLAN.md), [독립 실행 프롬프트](DATABASE-SESSION-PROMPTS.md).

최초 계획 산출물은 이 문서와 세션 프롬프트 두 파일이며 [draft PR10](https://github.com/Middleages/my-books/pull/10)에 보관한다. 이후 사용자가 전체 DB 교재 구현·GitHub 반영·Pages 게시를 승인했다. 현재 구현 범위와 검증 결과는 [배치 A 검증 기록](DATABASE-BATCH-A-VERIFICATION.md)에 구분한다. 구현한 장만 카탈로그에 등록하며 계획의 PR, 본문 구현, main 반영, 사이트 게시, 실제 DB 실행은 서로 다른 상태다. 최초 DB 우선 순서는 이후 쿠버네티스 병행으로 변경됐으나 DB 작업이 쿠버네티스 본문을 수정하지는 않는다.

## 1. 목표·독자·범위

비전공 성인이 작은 웹앱의 데이터를 직접 다루면서 겪는 질문에서 시작한다. SQL을 많이 암기하거나 설치 절차를 따라 하는 책보다 **데이터가 틀리거나 조회가 느릴 때, 어떤 관계가 깨졌고 어느 증거를 확인해야 하는지 설명하는 책**으로 만든다.

완독 후에는 다음을 할 수 있어야 한다.

- 앱의 데이터와 관계를 표·키·제약조건으로 설명하고, 조회 결과의 한 행이 무엇을 뜻하는지 확인한다.
- 인덱스의 읽기 이득과 쓰기·공간 비용을 구분하고 실행계획에서 추정과 관측을 나눈다.
- 트랜잭션의 원자성, 동시 실행의 충돌, 연결 풀의 대기를 서로 다른 문제로 진단한다.
- COMMIT·디스크 기록·백업·복구를 같은 뜻으로 쓰지 않고 장애 범위와 복구 목표를 확인한다.
- 앱과 스키마가 함께 바뀌는 순서, 실패 뒤 재시도·복원의 경계를 판단한다.

### 포함과 제외

소개와 **12장**을 A–F 여섯 배치로 만든다. SQL은 장의 실험을 이해할 만큼만 도입한다. SELECT/WHERE, 명시적 JOIN, GROUP BY·COUNT·SUM, ORDER BY, INSERT/UPDATE/DELETE, BEGIN/COMMIT/ROLLBACK, 기본 CREATE TABLE/INDEX와 ALTER TABLE을 목적과 함께 익힌다. NULL, 행의 중복, 결과 순서, 매개변수도 필요한 장에서 설명한다.

ORM 비교, SQL 문법 사전, 고급 쿼리 퍼즐, 저장 프로시저·트리거 설계, 세부 B-tree 구현, 범용 SQL 실행기, 샤딩·복제/HA 구축, 분산 트랜잭션, 대규모 튜닝은 제외한다. VACUUM·통계·권한은 증거를 해석하는 데 필요한 정도만 연결하고 별도 장으로 늘리지 않는다.

선행 지식은 웹 요청이 앱 서버에 도달한다는 정도다. 네트워크 교재의 주소·포트·TLS와 쿠버네티스의 실행·스토리지 경계는 필요한 위치에서 기존 공개 장으로만 연결한다. Kubernetes를 배워야 DB를 배울 수 있는 순서로 만들지 않는다.

### 설치 없는 본문, 선택 가능한 실제 관찰

1. **브라우저 경로:** 가상 행·시간·요청을 사용하는 결정적 교육 모델이다. 외부 DB에 접속하지 않으며 브라우저 안에 PostgreSQL을 구현했다고 쓰지 않는다. 이 경로만으로 학습 목표와 확인 문제를 완결한다.
2. **선택 실습 경로:** 일회용 PostgreSQL DB와 고정 fixture로 같은 질문을 관찰한다. psql을 최소 도구로 두고, 앱 연결 예제만 필요할 때 작은 Node.js/node-postgres 예제를 쓴다. 실제 DB·두 세션·복원 대상이 없으면 실행 미검증으로 표시한다.

G는 새 번호 장이 아니라 전체 편집·통합 검토와 선택 실습 묶음을 정리하는 후속 세션이다. 실제 DB 실습은 별도 실행 범위가 승인되고 환경이 있을 때만 한다. 브라우저 구현을 기다리게 하는 필수 설치 과정으로 만들지 않는다.

## 2. 한 권을 관통하는 사례와 데이터 계약

### 가상 상점 `study-shop`

작은 문구·생활용품 상점의 주문 웹앱을 사용한다. 실제 결제·이메일 발송·사용자 개인정보·운영 DB는 없다. 주문 확정은 **이 교육 앱의 재고 예약 약속**이며 결제 성공이나 회계상 매출을 뜻하지 않는다.

다음 스키마와 fixture를 A에서 모델과 선택 SQL의 공통 계약으로 확정한다. 아래는 설계이며 현재 DB가 생성됐다는 뜻은 아니다.

| 테이블 | 핵심 열과 의미 | 기본 제약 |
| --- | --- | --- |
| `customers` | `id`, `display_name` | id PK, 이름 NOT NULL. 이름 자체는 고유 식별자가 아님 |
| `products` | `id`, `name`, `unit_price_won`, `available_qty` | id PK, 가격·가용 수량 NOT NULL 및 0 이상 |
| `orders` | `id`, `customer_id`, `request_key`, `status`, `created_at` | id PK, customer FK, request_key NOT NULL·UNIQUE, status는 confirmed/cancelled |
| `order_items` | `order_id`, `line_no`, `product_id`, `qty`, `unit_price_won` | (order_id, line_no) 복합 PK, order/product FK, qty NOT NULL·양수, 주문 당시 단가 NOT NULL·0 이상 |

- 금액은 정수 원, 수량은 정수 개다. 세금·배송비·할인·실제 결제는 생략한다. 계산은 표시용 반올림 전의 정수로 하고 허용 범위를 검증한다.
- 상품의 현재 가격과 주문 당시 단가는 다른 사실이다. 과거 주문액은 order_items의 단가를 사용한다. 가격 변경이 과거 금액까지 바꾸지 않는다.
- `request_key`는 같은 요청의 재시도를 구분하는 가상 식별자다. UNIQUE만으로 완성된 멱등 API가 되지는 않는다. 12장에서 같은 key의 같은 요청 확인과 결과 재조회까지 연결한다.
- DB가 저장한 행의 화면 순서·삽입 순서를 조회 순서라고 보장하지 않는다. 비교 출력은 명시적 정렬을 사용한다.
- FK는 존재 관계를 지키며, 재고 예약 전체의 업무 규칙을 자동으로 보장하지 않는다. 참조 중인 행 삭제는 기본적으로 막는 예로 시작하고 연쇄 삭제를 기본값으로 쓰지 않는다.

### 작은 기준 fixture

| 구분 | 고정 초기값 |
| --- | --- |
| 고객 | 1 가람, 2 누리, 3 다온 |
| 상품 | 101 머그 12,000원·가용 5개, 102 노트 4,000원·가용 8개, 103 파우치 9,000원·가용 3개 |
| 주문 | 1001 고객1 confirmed/key-1001/2026-01-10T01:00:00Z, 1002 고객1 confirmed/key-1002/2026-01-11T01:00:00Z, 1003 고객2 cancelled/key-1003/2026-01-11T02:00:00Z |
| 주문 항목 | (1001,1,101,1,12000), (1001,2,102,4,4000), (1002,1,102,2,4000), (1003,1,103,1,9000) |
| 기준 관찰 | 고객1 확정 주문 2건, 항목 3행, 수량 7개, 주문금액 36,000원. 고객3은 주문 0건 |

현재 가용 재고는 fixture 시점에 이미 계산된 값이다. 과거 주문을 다시 차감하지 않는다. 실험의 재고 보존식은 **시나리오 시작 가용량 − 이번 시나리오에서 새로 확정된 수량 = 종료 가용량**이며 반품·입고를 넣으면 별도 이벤트로 정의해야 한다.

각 장은 같은 스키마를 유지하되 명명된 fixture 변형을 쓴다. 06장의 마지막 한 개는 `last-item` 변형이고 기본 5개를 몰래 덮어쓰지 않는다. 04·08의 큰 자료는 같은 열 의미를 갖는 고정 생성 규칙·seed·행 수를 기록한다. 브라우저 재생 중 난수를 새로 뽑거나 Date.now()에 따라 결과가 달라지지 않게 한다.

공통 정답: 1001은 28,000원, 1002는 8,000원이다. 상품101 현재 가격만 15,000원으로 바꿔도 기존 확정 주문 총액은 36,000원이다. 취소 주문을 포함하면 무엇을 집계했는지 라벨이 바뀌어야 한다.

## 3. 버전·실행 근거 계약

2026-10-20에 [PostgreSQL 공식 문서 목록](https://www.postgresql.org/docs/)은 **18을 Current**, **19를 RC**로 표시했다. 열어 본 [18 튜토리얼](https://www.postgresql.org/docs/18/tutorial.html)의 문서 머리글은 18.6이었다. 이것은 **문서 관찰**이지 PostgreSQL 18.6 서버·이미지를 실행한 증거가 아니다.

- 기획의 문서 기준은 `/docs/18/`로 고정한다. 19 RC·가변 `/current/`만을 실행 기준으로 삼지 않는다. 구현 시 공식 지원·보안 상태를 다시 확인하되 무심코 주요 버전을 바꾸지 않는다.
- 실제 실습의 minor 버전·배포 패키지/이미지 tag와 digest·OS/아키텍처·psql 버전·실제 `SELECT version()` 결과는 **실행한 후에만** 기록한다. 확인하지 않은 이미지 tag나 서버 버전을 만들어 쓰지 않는다.
- A에서 필요하면 `docs/DATABASE-LAB-ENVIRONMENT.md`를 만든다. 문서 기준/실행 후보/실제 관측/미검증을 별도 열로 나누며 본문 실행의 필수 전제가 아니다.
- 실행 시 DB/schema 이름·timezone·encoding/collation·fixture hash·row count·isolation·fsync/synchronous_commit·connection limit·확인일을 기록한다. 드라이버 예제를 실행하면 Node.js와 pg의 실제 버전·lockfile도 기록한다. 비밀정보는 기록하지 않는다.
- psql 기본 autocommit과 드라이버의 트랜잭션 사용법을 구분한다. 실습 지시마다 세션 A/B, 같은 connection 필요 여부, 실행 전 상태·예상 관측·초기화 범위를 명시한다.
- 선택 실습은 전용 일회용 DB와 합성 자료만 사용한다. 기존 서버 설치·방화벽 개방·기존 DB 삭제·운영 복구·실제 자격 증명 수집은 포함하지 않는다. 커넥션 문자열이나 비밀번호를 사이트에 넣지 않는다.
- 정적 SQL 검토, fixture 계산, 브라우저 모델 테스트, 실제 SQL 실행, 복구 훈련, 사이트 배포를 각각 기록한다. 어느 하나의 통과가 나머지의 통과를 뜻하지 않는다.

## 4. 고정 목차·주소

bookId는 `database`, categoryId는 기존 `technology`, 분야별 권차는 `volume: 4`, 제목은 **웹앱 개발자를 위한 데이터베이스**다. 소개는 `#/database`, 장은 `#/database/<id>`, readId는 `database/<id>`로 예약한다. 소개는 번호 장/읽음 분모에 넣지 않는다. 최초 공개 후 ID를 유지한다.

| 배치·장 | 고정 chapter id / 예정 MDX | 제목 | 독자가 답할 핵심 질문 |
| --- | --- | --- | --- |
| A·01 | `files-and-database` / FilesAndDatabase.mdx | 파일 다음에 데이터베이스 | 파일도 저장하는데 DB는 무엇을 더 맡을까? |
| A·02 | `tables-and-constraints` / TablesAndConstraints.mdx | 표 사이의 약속 | 같은 이름이 아니라 어떤 값으로 관계를 지킬까? |
| B·03 | `queries-and-joins` / QueriesAndJoins.mdx | 원하는 행을 묶어 읽기 | 주문 2건을 연결했는데 왜 3행이 될까? |
| B·04 | `indexes-and-costs` / IndexesAndCosts.mdx | 빨리 찾는 길과 그 비용 | 인덱스가 있어도 전체를 읽는 편이 나을까? |
| C·05 | `transactions` / Transactions.mdx | 함께 성공하거나 함께 취소하기 | 재고만 줄고 주문은 없으면 어떻게 막을까? |
| C·06 | `concurrency` / Concurrency.mdx | 동시에 마지막 한 개를 주문하면 | 트랜잭션 두 개가 각각 성공해도 틀릴 수 있을까? |
| D·07 | `connections-and-pools` / ConnectionsAndPools.mdx | 요청과 DB 연결 사이 | SQL이 빠른데 요청은 왜 기다릴까? |
| D·08 | `explain-and-diagnosis` / ExplainAndDiagnosis.mdx | 실행계획으로 느린 곳 찾기 | 예상한 행 수와 실제 행 수는 어디서 달라졌을까? |
| E·09 | `durability-and-wal` / DurabilityAndWal.mdx | 저장됐다는 말의 경계 | COMMIT 뒤 데이터 페이지가 아직 안 쓰였어도 괜찮을까? |
| E·10 | `backup-and-restore` / BackupAndRestore.mdx | 백업 파일에서 서비스 복구까지 | 어디까지 되살리고 언제 다시 쓸 수 있을까? |
| F·11 | `schema-migrations` / SchemaMigrations.mdx | 서비스 중인 표 바꾸기 | 새 앱과 옛 앱이 함께 있을 때 열을 바꿔도 될까? |
| F·12 | `database-troubleshooting` / DatabaseTroubleshooting.mdx | 증거를 모아 진단하기 | 느림·중복·누락을 어느 경계부터 확인할까? |

A에서 실제 구현한 소개·01–02만 카탈로그와 자체 SVG 장식 표지에 등록한다. 후속 번호는 계획에만 남긴다. 홈은 책 선택, 소개·독서 화면은 장 선택이라는 역할을 유지한다. 새 저장 키·홈 전체 장 목록을 추가하지 않으며 `my-books:read:v1`과 알 수 없는 기존 읽음 ID를 보존한다.

## 5. 설명력이 먼저인 공통 시각 계약

모든 핵심 장면은 구현 전에 다음 여섯 항목을 적는다: **발견할 관계 → 형태·위치·크기·경계·선의 의미 → 유지할 조건 → 바꿀 조건 → 실제 전후 차이 → 그 차이를 만드는 모델 필드**. 첫 화면부터 대상의 역할이 보이고, 기본 비교는 한두 번의 조작으로 핵심 차이가 드러나야 한다.

- 행은 식별 가능한 행으로, PK/FK는 실제 일치 값과 연결선으로, 시간은 라벨 있는 축으로, 점유는 제한된 슬롯으로 표현한다. 모든 개념을 같은 카드+설명 문장으로 바꾸지 않는다.
- 색은 표/세션/확정 여부 같은 의미에 고정한다. 라벨·형태·선 종류를 함께 사용한다. 빨강·초록만으로 정답을 전달하지 않는다.
- 이동은 **무엇이 언제 어떤 경계를 넘는지**를 나타낼 때만 사용한다. 단계 버튼으로 카드 제목이 바뀌는 것은 과정 설명을 완성한 것이 아니다. 관계가 정적일 때는 좋은 정적 그림이 불필요한 애니메이션보다 낫다.
- 그림·선택된 행·행 수·금액·대기 시간·표·해설·성공/실패 판정은 같은 모델 관찰 프레임을 읽는다. UI가 정답이나 중간 상태를 따로 추측하지 않는다. **모델에 edge가 있는 것만으로 통과하지 않는다.** 화면의 실제 선·방향·끝점이 FK 일치, 요청→연결, 잠금 소유/대기, WAL→페이지 등 해당 관계를 읽을 수 있게 해야 한다.
- 삭제/rollback/connection 반환 뒤의 객체와 경계는 현재 존재 여부를 반영한다. 사라진 행이나 끊어진 연결을 현재 대상으로 남기지 않는다. 과거 상태를 남겨 비교하면 명시적인 이력 영역·시점·선 종류로 현재와 구분한다.
- 조작부·현재 단계·핵심 변화가 같은 화면 안 또는 바로 인접한 영역에 보이게 한다. 긴 도해 끝의 재생 버튼으로 포커스/스크롤이 이동해 바뀐 부분이 viewport 밖으로 사라지는 배치를 피한다. 모바일에서도 단계 진행 직후 변화 위치를 확인한다.
- 수량·시간의 비례 표현은 축·단위·공통 눈금을 갖춘다. 도식적 거리·교육 단계·가상 비용은 실제 디스크 위치·네트워크 지연·DB 성능으로 표현하지 않는다. queue/대기/페이지 방문/복구 시간이 눈금을 넘으면 초과분을 분리해 그리거나 명시적인 공통 확장 눈금을 사용한다. 값을 100%에 잘라 서로 다른 초과량이 같은 막대가 되고 숫자만 다른 표현은 불합격이다.
- 입력 폼+결과 카드, 긴 SQL 로그, 예쁜 ERD 한 장으로 핵심 실험을 대체하지 않는다. 정밀 표와 로그는 그림을 검증하는 보조 수단이다.
- 과정 장면은 재생·정지·이전·다음 한 단계·다시 보기·전체 초기화를 제공한다. 초기화는 시나리오·예측·관찰 프레임·선택을 모두 초기값으로 돌린다. 설정 변경 시 재생을 정지하고 초기 프레임부터 재계산한다.
- 모바일 390/320px에서는 패널·시간선을 재배치하고 핵심 행을 읽을 크기로 유지한다. 전체 데스크톱 SVG를 축소하거나 표를 가로 스크롤해야만 관계를 알게 만들지 않는다. 보조 전체 표만 제목 있는 스크롤 영역을 허용한다.
- 키보드로 모든 설정과 단계 이동을 할 수 있고 hover/드래그 전용 조작은 없다. reduced-motion은 동일 프레임의 정적 단계·전후 비교를 제공하며 정보가 줄어들지 않는다.

## 6. 장별 학습·모델 설계

각 장은 목표 → 그림과 짧은 설명 → 관찰·예측·직접 조작 → 결과의 이유 → 실제 확인 → 확인 문제·해설·가정·출처로 구성한다. 아래는 장면 개수를 강제하는 목록이 아니라 **주장과 시각 근거의 계약**이다.

### 01. 파일 다음에 데이터베이스

- **학습 목표:** 저장 매체와 데이터 관리 책임을 분리한다. 파일도 적절한 프로그램·잠금·복구 설계로 관리할 수 있고, DB도 파일/스토리지를 사용함을 설명한다.
- **눈으로 발견할 관계:** 두 앱 프로세스가 같은 JSON의 낡은 재고 1을 읽으면 각각 0을 써서 주문 2개가 남을 수 있다. 관리 책임을 DB에 모으는 것은 도구를 도입하는 일이며 올바른 업무 규칙까지 저절로 생기는 일은 아니다.
- **장면·기하:** 좌측 두 앱 lane, 가운데 읽은 사본, 우측 공유 저장소 경계를 둔다. 같은 revision의 사본이 두 lane으로 갈라지고 마지막 쓰기로 어느 변경이 덮이는지 연결을 보존한다. 비교 화면은 DB 요청 경계와 제약/트랜잭션/조회 책임을 분리한 지도다.
- **전환·조작:** 순차 파일 수정 / 겹친 읽기-쓰기 / 잠금으로 직렬화한 파일 / DB에 업무 규칙을 넣은 경우를 고른다. 읽기→지역 수정→쓰기의 한 단계 진행, 먼저 완료할 요청 선택. DB 배치는 뒤 장에서 배울 보호 조건을 라벨로 표시하고 'DB면 항상 성공' 초록 도장을 찍지 않는다.
- **모델·불변식:** `fileWriteFrames`가 sourceRevision·localCopies·committedOrders·availableQty를 제공한다. 기본 반례는 시작1/확정2/남은0이므로 재고 보존식 실패다. 순차 처리나 보호된 흐름은 확정1/남은0이다. 행 수·사본·판정이 동일 상태에서 나온다.
- **실제 적용·경계:** 작은 설정 파일·읽기 위주 자료와 여러 쓰기 요청의 조건을 비교한다. JSON 자체가 나쁘거나 DB가 모든 동시성을 해결한다고 결론내리지 않는다. 확인 문제는 '파일을 DB로 옮겼지만 둘 다 마지막 재고를 확인하면?'으로 06장을 예고한다.
- **근거:** S01, S02, S07. 동시성의 상세 해결책·설치 명령은 이 장에서 확장하지 않는다.

### 02. 표 사이의 약속

- **학습 목표:** 한 행의 대상, PK/FK, 일대다 관계, NOT NULL/UNIQUE/CHECK의 역할과 업무 규칙의 한계를 구별한다.
- **눈으로 발견할 관계:** 같은 고객 이름이 두 개여도 id로 관계가 유지된다. 존재하지 않는 customer_id는 연결 끝점이 없고, 두 주문 항목은 같은 order_id에 연결될 수 있다.
- **장면·기하:** 기준 네 표를 행 단위로 펼치고 선택한 실제 키 셀끼리 선을 잇는다. 1:N 끝의 개수, (order_id,line_no)의 복합 경계, 참조된 행을 지울 때 끊기는 선을 표시한다. 이름 변경 전후에도 같은 id 선은 유지한다.
- **전환·조작:** 정상 항목 추가 / 중복 PK / 없는 FK / qty=0 / qty=NULL / 이름 중복을 비교한다. 삽입 후보는 '검사 전' 영역에 있으며 거절되면 저장 영역에 들어가지 않는다. 제약을 하나씩 끄는 실험은 명확히 가상 모드로 표시한다.
- **모델·불변식:** `constraintFrames`와 공통 fixture. 저장 후 모든 FK의 대상 존재, PK 고유, NOT NULL, qty>0을 검사한다. PostgreSQL에서 NOT NULL을 제거하고 CHECK만 남겼을 때 UNKNOWN이 허용되는 NULL 반례와 FK는 있으나 주문 항목이 없는 업무 반례를 넣는다. 제약 검사 내부의 실제 수행 순서를 재현한다는 주장은 하지 않는다.
- **실제 적용·경계:** 입력 폼 검증은 편의, DB 제약은 여러 쓰기 경로가 공유하는 최종 경계다. 자동 증가 id는 빈틈 없는 주문 건수도 비밀 토큰도 아니다. 스키마를 그리는 것과 외부 권한 통제는 별개다.
- **근거:** S03, S07. SQL은 각 제약의 짧은 예와 데이터 타입 의미까지만 소개한다.

### 03. 원하는 행을 묶어 읽기

- **학습 목표:** 조회의 한 행이 고객/주문/항목 중 무엇을 나타내는지 먼저 정하고 JOIN·집계·NULL·정렬의 결과를 설명한다.
- **눈으로 발견할 관계:** 주문1001이 두 항목과 연결되면서 두 결과행을 만든다. 고객1의 확정 주문은 2건인데 항목 JOIN 뒤 COUNT(*)는 3행이다. 다온은 LEFT JOIN에서 남지만 주문 id가 없다.
- **장면·기하:** 원본 행을 왼쪽, 키 일치로 만드는 짝을 가운데, 결과행 묶음을 오른쪽에 둔다. 한 주문행이 복제되는 fan-out을 같은 id 띠와 연결선으로 표시한다. GROUP BY는 결과행을 고객 경계로 모으고 금액을 같은 항목 타일에서 누적한다.
- **전환·조작:** 고객 선택, confirmed만/전체, INNER/LEFT, COUNT(*)/COUNT(order_id)/COUNT(DISTINCT order_id)를 비교한다. WHERE 조건을 ON과 WHERE에 옮긴 LEFT JOIN 반례는 작은 별도 예로 분리한다. SQL 전체 자유 입력 대신 제한된 쿼리 선택과 읽기 가능한 SQL을 제공한다.
- **모델·불변식:** `queryFrames`는 원본 id·matchedPairs·resultRows·groups를 보존한다. 기준 2주문/3항목/7개/36,000원과 주문 없는 고객의 COUNT(*)=1·COUNT(order_id)=0을 각각 해당 쿼리 문맥에서 검사한다. 현재 상품 가격을 바꿔도 과거 합계는 불변이다. 빈 집계의 NULL과 화면의 0 변환은 구분한다.
- **실제 적용·경계:** FROM/JOIN→조건→집계→출력은 결과 의미를 이해하는 논리적 관찰 순서이지 물리 실행계획이 아니다. ORDER BY 없는 순서를 보장하지 않는다. 이 차이는 08장에서 다시 확인한다.
- **근거:** S04, S05. 윈도 함수·CTE·전체 문법 사전으로 확장하지 않는다.

### 04. 빨리 찾는 길과 그 비용

- **학습 목표:** 인덱스 항목과 실제 행이 다르고, 선택되는 행 비율·행의 배치·쓰기 변경이 비용을 바꾼다는 것을 설명한다.
- **눈으로 발견할 관계:** 좁은 조건에서는 작은 탐색 경로와 몇 데이터 페이지로 충분하지만 넓은 조건은 인덱스와 많은 데이터 페이지를 함께 만진다. 인덱스 추가는 읽기 이득만이 아니라 변경해야 할 구조를 늘린다.
- **장면·기하:** 교육용 64행/8데이터 페이지를 고정 배열하고, 별도 B-tree 도식의 키→행 위치 선을 연결한다. 만진 페이지를 각각 한 칸으로 채운다. 비교 화면은 같은 데이터와 조건, 같은 눈금으로 scan/index 경로를 나란히 보여준다. 실제 PostgreSQL 페이지 용량·트리 높이를 8행/페이지로 단정하지 않는다.
- **전환·조작:** 적은/많은 일치 행, 모인/흩어진 일치 위치, 인덱스 유무, 신규 삽입·인덱스 열 변경을 비교한다. 복합 인덱스는 (customer_id,created_at)의 정렬 띠로 키 순서가 만드는 범위를 관찰하는 짧은 확장이다.
- **모델·불변식:** `indexFrames`의 실제 방문 indexPageIds·heapPageIds와 비교/쓰기 이벤트에서 비용 표를 계산한다. scan은 데이터8페이지, index는 유일한 방문 인덱스 페이지 수+데이터 페이지 수를 따로 표시한다. 합계는 **교육용 접근 개수**이며 planner cost나 ms가 아니다. 0결과도 탐색 비용이 있고 어떤 경로든 반환 row id 집합은 같아야 한다.
- **실제 적용·경계:** 선택도만으로 항상 빠르다고 판정하지 않는다. cache·bitmap/index-only·MVCC·병렬·통계·실제 I/O는 단순화한다. PostgreSQL 18의 skip scan 때문에 '복합 인덱스 첫 열 조건이 없으면 절대 사용 못 함'이라고 쓰지 않는다. 반환 순서도 ORDER BY 없이 보장하지 않는다.
- **근거:** S06. MSSQL 비교는 heap/clustered/nonclustered 구조 차이만 짧게 두고 PostgreSQL의 PK를 clustered 저장이라고 설명하지 않는다(S15).

### 05. 함께 성공하거나 함께 취소하기

- **학습 목표:** DB 트랜잭션의 경계와 COMMIT/ROLLBACK을 읽고 원자성을 올바른 업무 로직과 구별한다.
- **눈으로 발견할 관계:** 재고5에서 2개 주문할 때 재고 변경·주문·항목은 함께 확정되어야 한다. 각 문장 autocommit은 중간 실패를 되돌리지 못하고 하나의 transaction은 미확정 변경을 취소할 수 있다.
- **장면·기하:** 세 변경을 하나의 점선 transaction 경계로 감싸고 작성 세션의 보기와 다른 세션의 보기를 나란히 둔다. 확정 경계를 넘기 전후에 보이는 행과 재고가 함께 변한다. '미확정 영역'은 논리적 보기이며 DB가 물리적으로 별도 임시 DB를 만든다는 뜻이 아니다.
- **전환·조작:** 단일 transaction/문장별 autocommit, 차감 뒤 주문 헤더 INSERT의 제약 오류·항목 INSERT의 제약 오류·성공을 고른다. 단순 앱 중단과 SQL 오류를 섞지 않는다. BEGIN→조건 확인/갱신→주문/항목→COMMIT 또는 ROLLBACK을 관찰한다. 오류 후 transaction이 실패 상태에 남는 장면도 포함한다.
- **모델·불변식:** `transactionFrames`는 최신 확정 fixture, 유효한 미확정 변경, 세션별 과거 조회 결과, 문장 결과, transaction/block 상태를 분리한다. 오류 뒤 SELECT를 성공한 현재 보기처럼 그리지 않는다. 성공은 가용3·주문 헤더1·항목수량2 추가, rollback은 가용5·추가0이다. autocommit의 헤더 오류는 재고3·헤더0·항목0, 항목 오류는 재고3·헤더1·항목0이다. orders.status의 confirmed는 COMMIT 여부가 아니며, 빈 헤더의 스키마 유효성과 업무 완료를 구별한다. 기존 fixture에는 sequence 기본값이 없으므로 별도 이름 있는 교육용 sequence와 성공한 nextval 사건을 명시한다. 실제 할당한 값만 소비하며 rollback으로 되돌리지 않는다.
- **실제 적용·경계:** SQL이 0행을 갱신한 것은 항상 오류가 아니므로 앱이 affectedRows를 검사해야 한다. 이메일·HTTP 결제·외부 파일은 DB rollback에 포함되지 않는다. COMMIT 응답을 못 받은 경우를 '무조건 rollback됨'으로 단정하지 않고 12장에 연결한다.
- **근거:** S07. 격리 수준 상세와 디스크 복구는 06·09로 남긴다.

### 06. 동시에 마지막 한 개를 주문하면

- **학습 목표:** 읽은 값과 현재 값, 잠금 대기와 실패, 원자성과 격리성을 구분하고 안전한 재시도 단위를 설명한다.
- **눈으로 발견할 관계:** 재고1을 A/B가 모두 읽은 뒤 각자 0을 쓰면 두 주문이 확정될 수 있다. CHECK(재고>=0)와 BEGIN만으로 이 업무 규칙은 충분하지 않다.
- **장면·기하:** A·B 두 세션 lane에 read/write/commit 사건을 같은 교육 단계 축으로 배치하고, row version·읽기 시점·잠금 소유자·대기 화살표를 연결한다. 서로 다른 버전을 보는 이유를 숫자 카드가 아니라 선택된 버전과 snapshot 경계로 표시한다.
- **전환·조작:** 고정된 교차 실행표에서 A/B 다음 동작을 진행한다. 기본 비교는 낡은 절대값 저장 vs 조건부 원자 갱신이다. 후자는 `available_qty >= 요청량` 조건을 포함한 감소와 affectedRows=1 확인 뒤 주문을 쓴다. 두 번째 요청의 대기→선행 commit→조건 재평가→0행을 분명히 보여준다. 대기 중에는 완료된 행 수가 없으며, 재개된 UPDATE는 같은 문장으로서 대상의 새 버전을 재확인한 것이지 전체 snapshot이 새로워진 것이 아니다. SELECT FOR UPDATE 방식은 같은 transaction 안에서 잠금을 얻은 뒤 반환된 현재 재고를 확인하고 주문·차감을 처리하는 대안으로 비교한다. 잠금만 얻으면 업무 검사가 필요 없다는 뜻이 아니다.
- **모델·불변식:** `concurrencyFrames`는 미리 정의된 유효 schedule·row versions·lockOwner·blockedOn·commitStatus를 제공한다. 시작1의 안전한 결과는 확정수량1/남은0이며 음수 검사만 통과한 초과판매는 실패다. rollback으로 풀린 잠금, 서로 반대 순서 두 상품을 잠가 생긴 wait-cycle, 취소/전체 transaction 재시도도 반례로 테스트한다. 교착 상태의 교육용 희생 transaction 선택은 서버 예측이 아니며, abort의 잠금 해제와 이후 ROLLBACK의 실패 block 정리를 구별한다. 같은 숫자0의 A/B 행 버전도 별도 정체성을 유지하고 재시도는 새 transaction id와 새 읽기로 시작한다.
- **격리 보조 장면:** 같은 SELECT 두 번 사이 B가 commit했을 때 PostgreSQL Read Committed와 Repeatable Read의 snapshot 범위를 비교한다. Repeatable Read를 모든 업무 직렬성의 보장으로, Serializable을 '무조건 기다린 뒤 성공'으로 그리지 않는다. 충돌 시 실패와 전체 transaction 재시도가 가능하다. 순서를 정한 교육 schedule은 실제 병렬 스케줄러 예측이 아니다.
- **근거·MSSQL 경계:** S08. MSSQL READ COMMITTED는 RCSI 설정에 따라 읽기 방식이 다르고 SQL Server/Azure SQL의 기본값도 구분한다(S16). PostgreSQL 스냅샷 그림을 모든 제품의 내부 구현으로 일반화하지 않는다.

### 07. 요청과 DB 연결 사이

- **학습 목표:** HTTP 요청·앱 프로세스·풀·DB 세션의 경계를 구분하고 연결 대기와 SQL/잠금 대기를 따로 관찰한다.
- **눈으로 발견할 관계:** pool 크기2에서 요청4개가 오면 두 개는 연결을 빌리고 두 개는 기다린다. connection을 반환하지 않으면 SQL이 끝나도 자리는 풀리지 않는다. 앱 replica가 늘면 DB 연결 총량도 늘 수 있다.
- **장면·기하:** 요청 대기열→번호 있는 pool 슬롯→DB 세션 lane을 잇고 같은 요청 색/번호를 전체 구간에 유지한다. 요청별 시간막대는 acquire wait, DB 사용, 반환을 겹치지 않는 구간으로 분해한다. lock wait는 DB 사용 구간 안에 포함되며 중복 합산하지 않는다.
- **전환·조작:** pool1/2, 요청4개 고정, 각 요청 사용2단계인 기본값과 긴 transaction·반환 누락·연결 실패를 비교한다. 기본 FIFO·동시 도착·순차 query는 교육 모델의 가정이다. 초기 2개가 끝나는 단계에 나머지가 들어가는 모습을 한 단계로 관찰한다.
- **모델·불변식:** `poolFrames`에서 request ownership·idle/inUse·queue·timeouts를 생성한다. 사용중<=pool크기, 한 슬롯에 동시 소유자1, 완료/실패의 정상 경로에서 반환, 한 transaction은 동일 connection을 유지한다. pool2/요청4/사용2단계의 이상적 완료는 2·2·4·4단계다. 실제 지연값이나 최적 pool 크기로 제시하지 않는다.
- **실제 적용·경계:** 모든 앱 인스턴스의 pool 상한 합계와 관리·다른 앱용 연결 여유를 DB 한도와 비교하되 메모리·처리량을 포함한 튜닝 공식으로 쓰지 않는다. finally 반환/오류 처리, 값 매개변수화, 최소 권한, 비밀정보의 서버 보관을 짧게 연결한다. DB 계정정보를 브라우저에 넣지 않는다. 큰 pool이 느린 SQL·잠금을 고치지 않는다.
- **근거:** S09, S10. 실제 driver 예제를 넣으면 pool.query 여러 번을 하나의 transaction처럼 쓰지 않는다. 실제 SQL 실행과 브라우저 모델 시간을 구별한다.

### 08. 실행계획으로 느린 곳 찾기

- **학습 목표:** 실행계획의 부모/자식 관계, 추정 rows와 관측 rows·loops, 비용 단위와 실제 시간을 구분한다.
- **눈으로 발견할 관계:** 아래 scan에서 예상보다 많은 행이 나오면 위 join·aggregate로 전달되는 일도 달라진다. 루트 한 줄만 보거나 모든 노드 시간을 더하면 병목을 잘못 읽는다.
- **장면·기하:** Scan→Filter/Join→Aggregate의 트리를 아래에서 위로 연결하고 행 묶음의 폭/타일 수를 rows에 대응시킨다. 예상은 외곽선, 관측은 채움으로 같은 축에 비교한다. 반복 노드는 loops와 회당 행 수를 별도 라벨로 둔다. 큰 값은 명시적 눈금·확대 상세로 처리하고 임의로 포화시키지 않는다.
- **전환·조작:** 같은 고정 fixture·query에 대해 추정만/관측 포함, 최신/낡은 통계라는 **교육용 plan fixture**, 선택도·N+1 앱 호출 수를 비교한다. N+1은 DB plan 한 트리의 loops와 별도 앱 호출 lane에 놓는다. 짧은 진단 순서는 앱 전체 지연→pool/lock/SQL 구간→plan 증거→변경 후 재측정이다.
- **모델·불변식:** `explainFrames`는 typed plan node와 estimate/actual provenance를 가진다. 예: 단순 scan의 estimatedRows=4·actualRows=40·loops=1은 10배, actualRows=2·loops=10 노드는 총20행 처리 관찰로 표시한다. 실제 EXPLAIN의 회당 평균·반올림과 교육용 정수 모델을 구분한다. 부모 시간은 자식 포함이므로 단순 합산 판정을 하지 않는다.
- **실제 적용·경계:** planner cost는 ms가 아니다. EXPLAIN ANALYZE는 실제 문장을 실행하므로 임의 운영 쿼리·변경 SQL에 권하지 않는다. 기본 실제 예는 합성 DB의 부작용 없는 SELECT만. rollback으로 외부 부작용·sequence까지 모두 취소된다고 안전을 보장하지 않는다. `BUFFERS`는 실제 디스크 읽기량과 동일하지 않고 cache 조건을 기록한다.
- **근거:** S11. 가상 계획은 '교육용, 서버 출력 아님'으로 표시하고 실제 plan JSON/SQL/data/version을 수집한 경우에만 실제 관측으로 소개한다.

### 09. 저장됐다는 말의 경계

- **학습 목표:** 메모리의 변경, durable WAL, 데이터 페이지 반영, commit 상태, 백업을 서로 구분한다.
- **눈으로 발견할 관계:** 데이터 페이지가 모두 갱신되기 전에 commit 관련 WAL이 안전하게 기록되면, 재시작 후 그 기록으로 페이지를 복구할 수 있다. 같은 디스크 상실에는 이 보장이 충분하지 않다.
- **장면·기하:** RAM/OS·스토리지의 경계를 나누고 buffer page·WAL record·durable WAL 끝·data page version을 별도 lane에 둔다. 동일 txId/LSN의 연결선을 유지하며 WAL-before-data의 선후 관계를 표시한다. LSN은 순서 위치이며 경과시간이나 transaction id로 쓰지 않는다.
- **전환·조작:** 변경→WAL 생성→필요 기록 flush→응답→후속 page flush의 선택된 관찰 장면에서 crash 지점을 고른다. 이 순서를 모든 내부 I/O의 유일한 시간표로 단정하지 않는다. 재시작/저장장치 상실, 기본 동기 commit/비동기 commit의 위험 비교를 제공하되 위험 설정을 실제 서버에 적용하지 않는다.
- **모델·불변식:** `walFrames`는 txStatus·durableLogEnd·pageLsn·acknowledged·recoveryVisibleRows를 공유한다. 기본은 fsync=on, synchronous_commit=on, 정상 내구성 장치, 복제 없음. durable commit+스토리지 생존이면 확인된 변경이 복구 후 보인다. 응답 유실은 미commit 증거가 아니다. 비동기 commit은 최근 응답된 변경 손실 가능성을 표시한다.
- **정확성 반례:** 미확정 변경의 WAL/페이지도 기록될 수 있으므로 'commit된 SQL만 재실행' 모델을 만들지 않는다. 물리 redo와 transaction 상태에 따른 가시성을 구별한다. 메모리 소실/로컬 디스크 소실/논리적 잘못된 DELETE는 서로 다른 장애다. WAL은 백업 파일이나 SQL 감사 로그와 같지 않다.
- **근거:** S12. checkpoint·full-page writes·장치 cache는 필요한 전제만 설명하고 스토리지 엔진 구현 강의로 늘리지 않는다.

### 10. 백업 파일에서 서비스 복구까지

- **학습 목표:** 복구 가능한 시점·허용 손실 목표(RPO)와 서비스 복구 시간·허용 중단 목표(RTO)를 구분하고 복원 확인의 이유를 말한다.
- **눈으로 발견할 관계:** 백업+연속 WAL이 덮는 시간과 장애 뒤 재개까지 걸리는 시간은 서로 다른 축이다. 더 최근 WAL 한 조각이 있어도 중간 연결이 끊기면 그 끝까지 복구할 수 없다.
- **장면·기하:** 위는 데이터 시점 축으로 base backup·연속 archive·누락 구간·장애·복구 가능 끝을 표시한다. 아래는 장애 이후 감지/준비/복원/재생/검증/전환의 소요 시간 막대를 표시한다. RPO/RTO 목표선을 각각 올바른 축에 놓는다.
- **전환·조작:** dump만 / base backup+WAL / WAL 중간 누락 / 복사본도 같은 장애에 소실 / 복원 검증 실패를 비교한다. 기본 가상 시간은 장애10:15, 유효 base10:00, 연속 WAL10:11까지로 손실 가능 구간4분이다. 목표 RPO5분과 비교한다. 복구 소요 3+4+6+2+5+1=21분은 목표 RTO20분을 넘는다. 두 목표를 하나의 '백업 성공'으로 합치지 않는다.
- **모델·불변식:** `restoreFrames`는 backup coverage·requiredLogSegments·availableSegments·recoverableThrough·serviceStages를 제공한다. 단순화한 필수 조각7 누락이면 연속 prefix6까지만 복구 가능하다. 예제 시간/조각은 교육용이며 실제 WAL segment 경계가 분 단위라는 뜻이 아니다. 복구 후 fixture FK·row count·주문금액·앱 읽기 검증이 실패하면 완료가 아니다.
- **실제 적용·경계:** dump의 일관된 snapshot 시점과 파일 완료 시각을 분리한다. logical dump와 physical base+WAL 복구를 섞지 않는다. 데이터 파일 live copy나 replica 존재를 백업 완료로 쓰지 않는다. 별도 복원 대상에서 복구해 확인하는 절차를 제시하며 운영 원본을 덮어쓰지 않는다. 검증한 한 사례가 조직의 RPO/RTO 보장이 되지 않는다.
- **근거:** S13, S14. MSSQL 비교는 recovery model·full/log backup chain의 제품별 전제가 있다는 정도로 분리한다(S17). PostgreSQL 명령을 그대로 번역하지 않는다.

### 11. 서비스 중인 표 바꾸기

- **학습 목표:** DB 변경 성공과 앱 호환성을 구별하고 확장→전환→정리 순서·검증·되돌리기 한계를 설명한다.
- **눈으로 발견할 관계:** 앱 v1이 `products.name`을 읽는 동안 그 열을 삭제/rename하면 DB 변경은 성공해도 v1은 실패한다. 새 열이 생겼어도 일부 행만 채워져 있으면 새 읽기는 불완전하다.
- **장면·기하:** app v1/v2 reader·writer와 schema v1/확장/정리 단계의 호환 연결을 시간축에 놓는다. name→display_name 행 단위 backfill 상태를 채움으로 표시하고 같은 상품 id를 유지한다. 여전히 old column을 참조하는 앱 연결이 보이면 삭제 게이트가 닫힌다.
- **전환·조작:** 즉시 rename / 새 nullable열 추가→호환 앱(구열 읽기·양열 쓰기) 배포→구 단일열 writer 제거→backfill·검증→새열만 읽고 쓰는 앱 전환→모든 구열 의존 제거→old열 제거의 경로를 비교한다. backfill 도중 상품 이름 수정, 구버전 앱 하나 남음, 긴 transaction으로 DDL 대기, 중간 실패·재실행을 선택한다. 전환기의 호환 writer는 두 열을 같은 transaction에서 쓴다. 구 단일열 writer가 없는 시점을 확인한 후 backfill/동등성 검증을 수행하고 새 읽기로 전환한다. backfill은 오래 읽은 값을 덮어쓰지 않도록 현재 행을 기준으로 갱신한다. 마지막 열 삭제 전에는 양열 쓰기 자체를 포함한 모든 구열 참조가 없어야 한다.
- **모델·불변식:** `migrationFrames`의 appCapabilities·schemaColumns·rowBackfill·activeWriters·lockWait·validation를 사용한다. 전환 동안 지원 앱의 read/write가 성공, 정리 전 구열을 참조하는 모든 독자/작성자0(전환기 양열 writer 포함), 새열 채움·동등성 검증, 중단 후 재실행의 의미 보존이 게이트다. 100% 채움만으로 최신값 일치나 호환 완료를 판정하지 않는다.
- **실제 적용·경계:** expand/contract는 교육 앱의 한 전략이지 모든 migration의 무중단 보장이 아니다. ALTER TABLE의 lock·scan/rewrite 필요는 명령·버전에 따라 확인한다. DB transaction으로 가능한 DDL과 불가능한 작업(CREATE INDEX CONCURRENTLY 등)을 구별한다. 삭제된 정보·새 데이터 의미를 앱 rollback 하나로 복원할 수 없으며 복구/forward fix 계획을 분리한다.
- **근거:** S18, S08. 특정 migration 도구나 자동 운영 실행은 추가하지 않는다.

### 12. 증거를 모아 진단하기

- **학습 목표:** 관측 사실·가능한 원인·확정할 수 없는 것·다음 안전한 확인을 나누어 설명한다.
- **눈으로 발견할 관계:** 같은 '느림'이 요청 queue, DB lock, plan 처리량의 다른 경계에서 생긴다. 같은 HTTP 실패라도 DB에서 주문이 확정됐는지는 별도 증거가 필요하다.
- **장면·기하:** 요청→pool→session→transaction/lock→plan→durability 경계 지도를 만든다. 증거를 고르면 해당 구간과 관찰 시각/요청 id가 강조된다. 단순 객관식 카드 대신 대기 요청·점유 connection·잠금 화살표·행/commit 상태를 기존 모델에서 재사용한다.
- **고정 사례:** (1) SQL은2단계인데 pool acquire가 길다, (2) 긴 transaction이 재고행을 잠근다, (3) 추정4/관측40으로 조회 일이 늘었다, (4) COMMIT 응답 유실 후 같은 request_key 재시도다. 복합 사례는 한 가지 원인을 고쳐도 다른 경계가 남는 것을 보여준다. 선택 보너스는 백업이 있으나 복원 확인이 없는 사건이다.
- **모델·불변식:** `diagnosisFrames`의 evidenceIds·known/unknown·supportedHypotheses·nextChecks를 관측 지도와 판정에서 공유한다. 단일 증거에 근거한 원인 확정을 막고 결과가 미확정이면 '아직 판단할 수 없음'도 정답이다. 재시도 사례는 같은 key+같은 요청 내용을 확인하고 기존 결과를 재조회하는 계약이다. key만 같고 payload가 다르면 재사용 성공으로 처리하지 않는다.
- **실제 적용·경계:** pg_stat_activity·wait event·잠금·실행계획·앱 request id로 다음 확인을 안내하지만 실제 데이터 수집 UI를 만들지 않는다. 권한에 따라 보이는 정보가 다름을 표시한다. 무작정 connection 한도 증가·session 종료·재시작·백업 덮어쓰기·중복 주문 재실행을 정답 버튼으로 만들지 않는다.
- **근거:** S08–S14, S19. 마지막 문제는 '관측→가설→다음 확인→변경의 위험→변경 후 검증'을 짧게 작성하게 하고 해설에 판단 경계를 포함한다.

## 7. 구현 구조와 공통 모델

- 본문 `src/content/database/*.mdx`, UI `src/components/database/`, 순수 모델/시나리오 `src/simulations/database/*.mjs` 및 `.d.mts`, 테스트는 기존 `tests/*.test.mjs` 체계다. 위 함수명은 책임을 드러내는 후보이며 기존 구현과 일관되게 정리할 수 있다.
- `fixture` 모듈은 행·키·정수 단위·명명된 변형·합계 정의를 소유한다. 장별 모델이 fixture를 복제해 사용하고 shared fixture를 mutate하지 않는다.
- 모델의 frame은 최소 `scenarioId`, `step`, `observationKind`, 관측 대상 id/관계, 상태, 단위 있는 측정값, 근거 있는 판정, `assumptions`를 제공한다. 모든 장에 거대한 범용 DB engine을 만들지는 않는다.
- 시각 도형의 좌표는 UI가 배치할 수 있지만 관계·개수·비교값·허용 동작·이벤트 순서는 모델에서 온다. 동일 입력은 동일 frames를 반환한다. 단계 이동은 replay/recompute하며 같은 변경을 두 번 누적하지 않는다.
- 기존 네트워크 `foundation-visual.mjs`의 addressFrames/주소 관계와 `AddressPrimer`·`AddressSpaceDiagram`·`AddressPath`, 쿠버네티스 `workloads.mjs`의 관찰 프레임·ready/현재 구분을 설계 참고로 읽는다. 네트워크 주소 띠나 Pod 카드 자체를 DB 장 전체에 복제하지 않는다.
- 내용별 장면은 별도 component로 두되 기존 재생 controls를 검토해 필요한 최소만 재사용한다. 전역 학습 프레임워크·라우터·CSS 전체 재작성은 하지 않는다. CSS는 `db-` 등 교재 범위로 제한한다.
- 모델 assertion은 그림의 연결 끝점·표의 합계·판정의 근거까지 확인한다. 모델 계산 테스트만으로 실제 SVG/HTML이 그 값을 표시한다고 보장하지 않으므로 DOM/브라우저 검증을 별도로 둔다.

## 8. MSSQL 비교 상자의 한계

본문은 PostgreSQL 18 의미를 기본으로 한다. MSSQL은 Microsoft SQL Server를 뜻한다고 처음에 풀어 쓰고 제품/버전/설정별 차이를 **4개 정도의 짧은 비교 상자**로 제한한다.

1. 04 인덱스: heap·clustered/nonclustered와 PostgreSQL 설명의 물리 구조를 혼동하지 않기(S15).
2. 06 격리: 같은 READ COMMITTED 이름도 RCSI와 제품 기본값에 따라 읽기 방식이 다르기(S16).
3. 10 복구: SQL Server recovery model과 backup/log chain은 별도 전제가 필요하기(S17).
4. 11/12 관찰: 실행계획·잠금/대기 관측 도구의 이름은 달라도 질문은 재사용할 수 있으며 출력과 SQL 문법은 그대로 호환되지 않기. 구현 시 해당 버전 공식 근거를 추가하지 못하면 이 상자는 생략한다.

MSSQL 실습·운영 설정 변경·두 엔진 성능 경쟁은 범위 밖이다. 모든 DB의 내부구조를 PostgreSQL과 같게 일반화하거나 한 엔진을 더 좋은 선택으로 단정하지 않는다.

## 9. 순차 배치·인수인계·출판 게이트

**A → B → C → D → E → F → G**를 순서대로 진행한다. A–F는 두 장씩, G는 번호 장을 늘리지 않는 편집/선택 실습 정리다. 새 세션의 시작은 최신 main·작업 트리·선행 코드·실제 검증 상태 확인이다. 이전 배치의 구현·단위/build·production 화면/직접 시각 검토가 끝나지 않았으면 이를 먼저 해결한다. 2026-10-20 진행 조정에 따라 이 소스 검증을 통과한 뒤에는 게시 확인을 기다리는 동안 다음 배치를 별도 branch/worktree에서 로컬 준비할 수 있다. 다만 공개는 A→B→C→D→E→F→G 순서이며 선행 배치의 실제 main·Pages 확인 전에 다음 배치를 main에 반영하지 않는다. 로컬 준비와 공개 완료를 구분한다.

| 배치 | 범위 | 고유 산출물/선행 확인 |
| --- | --- | --- |
| A | 소개·01–02 | 스키마/fixture/모델 경계, 최소 UI, 실제 장만 catalog/표지, 필요 시 환경 계약 |
| B | 03–04 | JOIN의 행 provenance, 인덱스 접근 비교, A의 같은 행/키 계약 |
| C | 05–06 | transaction visibility, 고정 동시 schedule/잠금·재시도, B의 집계/재고 불변식 |
| D | 07–08 | pool/요청 lane, 추정·관측 plan, C의 동일 connection·잠금 의미 |
| E | 09–10 | WAL/가시성·복원 범위·RPO/RTO, C의 commit 및 D의 관찰 경계 |
| F | 11–12 | 앱/schema 호환성·증거 진단, 소개·01–12의 용어·목차 일치 |
| G | 전체 통합·선택 실습 묶음 | 기존 장의 최소 보정, 실행 가능한 합성 SQL/README와 검증 상태, 전체 편집 기록 |

배치 검증 문서는 `docs/DATABASE-BATCH-<A~G>-VERIFICATION.md`, 최종 편집은 `docs/DATABASE-BOOK-REVIEW.md`를 예정한다. 선행 main 반영·게시가 요청되어 있었다면 다음 배치를 공개하기 전에 실제 완료도 확인한다. 게시가 승인되지 않았다면 draft PR/검증한 기준 commit 상태를 정확히 적고 승인 대기 중인 출판을 완료로 바꾸지 않는다.

각 세션의 인계 항목:

- 기준 main·작업 branch·변경 파일·공개한 chapter/readId·이전 배치 상태.
- 공식 문서 버전/확인일, fixture·단위·새 불변식·생략 조건.
- 모델/전체 test/build/문서 검사, 실행 환경, 실제 화면·시각 설명력/접근성 결과와 캡처 근거.
- 실제 SQL·두 connection 재현·backup/restore의 수행 여부를 별도로 표시.
- PR/통합 commit/Actions/실제 Pages 확인을 승인 범위에 맞춰 구분하고 미검증·차단·다음 범위를 남김.

다른 교재 작업은 병행할 수 있다. 독립 branch/worktree를 사용하고 공통 catalog·표지·CSS를 바꾸기 직전 최신 main을 통합한다. 보험·세금·다른 책의 변경과 알 수 없는 읽음 ID를 보존한다. 안정된 main으로 게시를 점검하는 다른 세션이 있으면 그 게이트가 닫힐 때까지 main을 변경하지 않는다. draft PR은 허용된 작업의 검토 수단이며 merge·auto-merge·배포 승인이 아니다.

## 10. 구현 이후 검증 기준

### 모델과 기술적 정확성

- 기준 fixture 정답, 빈 결과·NULL·중복·0·경계 수량·존재하지 않는 키·큰 값·서로 다른 실행 순서·중단/다시 실행을 확인한다.
- 안전한 경로의 불변식뿐 아니라 실패하는 반례도 정확히 실패해야 한다. 모든 시나리오가 최종 초록 결과가 되는 모델은 부적합하다.
- 03의 행 fan-out, 04의 같은 result ids/방문 페이지, 05의 visibility, 06의 lock/wait/재시도, 07의 ownership/시간 분해, 08의 estimate/actual/loops, 09의 durable/visible, 10의 coverage/복구시간, 11의 동등성/호환성, 12의 증거 범위를 각각 테스트한다.
- SQL syntax/실제 SQL 결과/실제 optimizer 선택을 구분한다. 조그만 fixture에서 인덱스를 사용하지 않아도 오류로 판정하지 않는다. 실제 query 성능의 고정 ms·항상 동일 plan을 테스트 정답으로 강제하지 않는다.

### 기능 검증과 별도의 설명력 검증

2026-10-20 사용자 지시에 따라 보통 배치의 실제 브라우저 검사는 **추가·변경한 DB 교재와 영향받는 공통 기능**에 집중한다. 전체 `npm test`와 build는 계속 실행하고, 카탈로그/권차 변경은 DB와 홈·분야·권차·읽음 기록을 함께 확인한다. 무관한 보험·투자 본문의 전체 브라우저 검사를 매 배치 필수로 요구하지 않는다. 공유 UI/라우팅/검증 기반의 변경은 실제 영향 범위를 넓혀 검사하며, G 전체 완성 때 넓은 회귀를 실행한다. 이미 실패한 필수 assertion을 삭제하거나 미실행을 통과로 바꾸는 간소화는 아니다. 각 기록에 선택한 suite와 제외한 범위를 남긴다.

1. 변경된 모델 테스트, 전체 `npm test`, `npm run build`, `git diff --check`를 최종 통합 코드에서 실행한다.
2. production 화면 1440·390·320px에서 핵심 장면을 직접 캡처하고 열어 본다. 실제 조작 전후를 같은 조건으로 비교한다.
3. 각 장에서 **첫 화면의 역할, 라벨을 다 읽기 전 보이는 관계, 바뀐 조건과 유지된 대상, 선/숫자/판정 일치, 정지 화면의 설명력**을 적는다. 테스트 개수나 screenshot 존재만으로 시각 검토를 통과시키지 않는다.
4. 재생/정지/이전/다음/초기화, 빠른 반복 클릭·설정 중 변경·장 이동·다시 진입의 타이머 정리, 키보드/포커스/reduced-motion/정적 대안을 확인한다. 모든 접근성 정보를 live region에 매 프레임 쏟아내지 않는다.
5. MDX의 문단 중첩·import·컴포넌트 props, 가로 넘침·작은 글자·비교 그림의 눈금·console/pageerror를 확인한다. Chrome 통과를 Safari/실제 터치/스크린리더 검증으로 대신하지 않는다.
6. 홈의 IT 분야·공개 장 수·목차, 기존 URL/읽음표시/새로고침/알 수 없는 ID 보존 및 영향받은 기존 실험을 회귀 확인한다.
7. main 반영/게시가 명시적으로 승인된 세션만 최신 main 통합→검증→반영→정확한 commit의 Actions→실제 Pages 자산/장 URL을 확인한다. 기록 문서가 포함될 미래 commit SHA를 미리 만들어 적지 않는다.

### 선택 실제 DB 검증

A에서 정한 환경 기록을 사용하고, G에서 제공할 경우 `examples/database/`에 최소 schema/seed/관찰용 SELECT/두 세션 schedule/복원 대상·검증 README를 둔다. 이 경로는 현재 존재하지 않으며 구현 세션에서만 만든다. reset/cleanup은 이름이 확인된 일회용 자원에만 적용하고 원본·운영 DB를 건드리지 않는다.

실제 검증 최소 질문은 (a) fixture 제약·합계, (b) transaction 실패 후 관찰, (c) 두 session의 조건부 재고 갱신, (d) EXPLAIN/ANALYZE의 구별, (e) 별도 DB에 dump를 복원한 뒤 행/금액/관계를 확인하는 것이다. physical PITR·crash 실험은 그 환경이 지원되고 별도 범위가 승인될 때만 확장한다. 파일을 만들거나 명령이 존재하는 것만으로 restore 성공이라고 하지 않는다.

## 11. 공식 근거 목록과 재확인 지점

아래는 **2026-10-20에 확인한 공식 문서**다. 장의 출처에는 실제로 사용한 페이지와 확인일·제품/버전을 붙인다. 이 목록은 실행 증거가 아니며 실제 구현 시 변경된 사실·예제를 재확인한다. 창작한 상점 fixture·교육용 시간·페이지 크기·plan 값은 공식 측정값이 아니다.

| 코드 | 공식 근거 | 계획에 사용한 확인점 |
| --- | --- | --- |
| S01 | [PostgreSQL 문서 목록](https://www.postgresql.org/docs/), [18 Tutorial](https://www.postgresql.org/docs/18/tutorial.html) | Current18/19RC 구분, 18 문서와 실제 실행 버전 분리 |
| S02 | [Architectural Fundamentals](https://www.postgresql.org/docs/18/tutorial-arch.html) | client/server 경계와 저장/관리 역할 |
| S03 | [Constraints](https://www.postgresql.org/docs/18/ddl-constraints.html) | PK/FK/UNIQUE/NOT NULL/CHECK·NULL·표 간 규칙의 한계 |
| S04 | [Table Expressions](https://www.postgresql.org/docs/18/queries-table-expressions.html) | JOIN·LEFT JOIN·조건/집계 결과 의미 |
| S05 | [Aggregate Functions](https://www.postgresql.org/docs/18/functions-aggregate.html), [LIMIT and OFFSET](https://www.postgresql.org/docs/18/queries-limit.html) | COUNT·SUM/빈 결과와 명시적 순서 |
| S06 | [Indexes Introduction](https://www.postgresql.org/docs/18/indexes-intro.html), [Multicolumn Indexes](https://www.postgresql.org/docs/18/indexes-multicolumn.html) | 조회/유지 비용, 복합 키와18 skip scan의 예외 |
| S07 | [Transactions](https://www.postgresql.org/docs/18/tutorial-transactions.html), [Transaction Isolation](https://www.postgresql.org/docs/18/transaction-iso.html), [Sequence functions](https://www.postgresql.org/docs/18/functions-sequence.html), [UPDATE](https://www.postgresql.org/docs/18/sql-update.html) | transaction 경계·autocommit·명시적 sequence 할당/rollback·가시성·갱신 행 수 |
| S08 | [MVCC Introduction](https://www.postgresql.org/docs/18/mvcc-intro.html), [Isolation](https://www.postgresql.org/docs/18/transaction-iso.html), [Explicit Locking](https://www.postgresql.org/docs/18/explicit-locking.html) | snapshot·갱신 조건 재평가·잠금/교착·재시도 |
| S09 | [Connections and Authentication](https://www.postgresql.org/docs/18/runtime-config-connection.html) | 연결 상한·예약 슬롯·설정의 범위 |
| S10 | [node-postgres Pooling](https://node-postgres.com/features/pooling), [Transactions](https://node-postgres.com/features/transactions), [Queries](https://node-postgres.com/features/queries) | 반환·동일 client transaction·값 매개변수화 |
| S11 | [Using EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html), [EXPLAIN](https://www.postgresql.org/docs/18/sql-explain.html), [ANALYZE](https://www.postgresql.org/docs/18/sql-analyze.html) | cost/시간, rows/loops, 실제 실행과 통계 |
| S12 | [WAL Introduction](https://www.postgresql.org/docs/18/wal-intro.html), [WAL Settings](https://www.postgresql.org/docs/18/runtime-config-wal.html) | WAL-before-data·commit 내구성 설정과 장애 범위 |
| S13 | [Backup and Restore](https://www.postgresql.org/docs/18/backup.html), [SQL Dump](https://www.postgresql.org/docs/18/backup-dump.html), [File System Backup](https://www.postgresql.org/docs/18/backup-file.html), [Continuous Archiving/PITR](https://www.postgresql.org/docs/18/continuous-archiving.html) | logical/physical 차이·일관성·연속 WAL·복구 조건 |
| S14 | [Microsoft: Business Continuity, HA and DR](https://learn.microsoft.com/en-us/azure/reliability/concept-business-continuity-high-availability-disaster-recovery) | RPO/RTO 목표와 복구 설계의 구분 |
| S15 | [SQL Server: Clustered and Nonclustered Indexes](https://learn.microsoft.com/en-us/sql/relational-databases/indexes/clustered-and-nonclustered-indexes-described?view=sql-server-ver17) | MSSQL 물리 구조의 비교 범위 |
| S16 | [SQL Server: SET TRANSACTION ISOLATION LEVEL](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-transaction-isolation-level-transact-sql?view=sql-server-ver17) | RCSI 옵션과 SQL Server/Azure SQL 기본값 구분 |
| S17 | [SQL Server: Recovery Models](https://learn.microsoft.com/en-us/sql/relational-databases/backup-restore/recovery-models-sql-server?view=sql-server-ver17), [Restore Sequences](https://learn.microsoft.com/en-us/sql/relational-databases/backup-restore/plan-and-perform-restore-sequences-full-recovery-model?view=sql-server-ver17) | 복구 모델·로그 chain의 제품별 조건 |
| S18 | [ALTER TABLE](https://www.postgresql.org/docs/18/sql-altertable.html), [CREATE INDEX](https://www.postgresql.org/docs/18/sql-createindex.html) | DDL별 lock/검증·transaction block 제한 |
| S19 | [Cumulative Statistics](https://www.postgresql.org/docs/18/monitoring-stats.html) | session 상태·wait event·관측 권한/범위 |

## 12. 현재 상태와 다음 결정

- 기획 완료: 12장의 질문·시각 관계·조작/전환·모델/반례·공식 근거, 고정 식별자·fixture·구조·세션별 인계/검증 계획과 독립 실행 프롬프트.
- A 구현 완료: 소개·01–02 본문, 공통 fixture와 파일 경쟁/관계/제약 모델, 시각 UI, 카탈로그의 공개 2장·표지, 검증 스크립트와 기록. 단위 테스트·빌드, DB production browser 124개와 실제 PNG 직접·교차 검토를 통과했다. 세부 기준 commit·실행 환경·결과는 [배치 A 검증 기록](DATABASE-BATCH-A-VERIFICATION.md)을 따른다.
- A main 반영: `0071bff4c992376bea65ad3a12ce86fafbbe98be`에 DB A·쿠버네티스 보완·범위 기반 검사·세금/보험 최종 기록을 보존 통합했다. 합본 production 여섯 suite와 직접 시각 검토는 통과했으며 해당 exact-main Actions·실제 Pages 게이트는 진행 중이다. main 반영을 게시 검증 완료로 간주하지 않는다.
- B 로컬 구현: 03–04 본문·모델·시각 UI와 공개4장 카탈로그 후보를 별도 브랜치에서 작성했다. 현재 공개본은 A이며 B의 실제 production/시각/게시 게이트는 아직 남아 있다. 세부 상태는 [B 검증 기록](DATABASE-BATCH-B-VERIFICATION.md)을 따른다.
- 미구현: C–F의 05–12 본문·모델·시각 UI와 G 전체 편집/선택 실습 묶음. 아직 없는 장은 카탈로그에 등록하지 않는다.
- 미실행: 실제 PostgreSQL/MSSQL·컨테이너/서버 설치·SQL·두 세션·성능 측정·backup/restore. 브라우저 모델과 실제 DB 실행을 구분한다.
- 최초 기획 문서만의 검사는 경로/링크·목차/ID·수치/시나리오·지침 일관성과 `git diff --check`였다. 이후 A 구현·테스트·시각 검토 결과는 별도 기록이며 과거 문서 검사에서 실행한 것으로 소급하지 않는다.
- 다음 작업: A의 production·시각 검토 통과를 바탕으로 **B: 03 조회·JOIN, 04 인덱스·비용**을 별도 로컬 트리에서 준비하고, A 통합·실제 게시 게이트를 닫은 뒤에만 B를 공개한다. 사용자가 쿠버네티스 보완도 병행하도록 순서를 변경했으므로 DB는 독립 범위를 유지하고 공통 파일·main 쓰기만 조율한다. 실제 운영 DB 연결이나 추가 장을 이 승인에 포함시키지 않는다.

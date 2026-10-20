# 데이터베이스 배치 A — 구현·검증 기록

기록일: 2026-10-20 (KST). **소개·01–02 구현. 단위 테스트·빌드 통과. 실제 브라우저 검증·PNG 직접 검토·main 반영·Pages 게시 대기.** 이 상태를 완료·배포 성공으로 읽지 않는다.

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

## 실제 브라우저 검증의 현재 상태

클라우드 작업 환경의 로컬 Chromium은 프로세스 socket 권한 때문에 시작에 실패했다. 승인 실행도 환경 시작 오류로 실행되지 않았다. **성공한 브라우저 검사 0개·캡처 0개인 실패를 통과로 세지 않는다.** 해당 실패 결과는 작업 산출물의 실패 보고서로만 남기고 저장소에는 올리지 않는다.

대체 경로는 GitHub Actions의 동일 production artifact를 사용하는 기존 검증 행렬이다. `database-browser-qa.cjs`는 1440/390/320px, 모든 파일 모드/선행 앱의 모든 프레임, 관계 변경, 모든 제약 시나리오/NOT NULL 조합, 정지·다시 보기·설정 변경·장 이동, 키보드, 읽음 기록·알 수 없는 ID, 가로 넘침·MDX·실행 오류, 실제 게시 자산 SHA256 대조를 검증하도록 작성했다. **스크립트가 존재하는 것만으로 실행 결과를 주장하지 않는다.** 생성된 실제 PNG를 열어 의미·선 끝점·라벨·조작부와 변화의 근접성도 별도로 검토한다.

독립 branch에서는 현재 존재하는 `insurance`, `investing`, `database` suite를 유지한다. 통합 시 최신 main의 `tax`·`kubernetes` 등 병행 작업과 해당 계약 테스트·artifact 이름을 합집합으로 보존한다. 이 branch의 오래된 workflow를 최신 main에 덮어쓰지 않는다.

## 미실행·다음 게이트

- 실제 PostgreSQL 설치·연결·SQL·두 세션·백업/복원: 미실행. 브라우저 모델과 혼동하지 않는다.
- production browser 결과, PNG 직접 검토, 실제 Pages 게시: 대기.
- 실제 터치 기기·Safari·스크린리더: 미검증.
- A 게이트가 열린 상태에서는 B의 본문·카탈로그 등록을 시작하지 않는다. 이후 03 조회와 JOIN, 04 인덱스와 비용을 계획에 맞춰 진행한다.

## 후속 실행 증거

정확한 branch commit·Actions run·검사 결과·artifact·직접 본 PNG와 수정 사항은 결과가 확인된 뒤 이 절에 추가한다. 이 문서가 담길 미래 commit을 미리 만들어 적지 않는다.

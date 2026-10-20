# DB 배치 C 검증 기록: 트랜잭션 / 동시 실행

확인일: 2026-10-20. 구현·로컬 검사·실제 브라우저·게시를 구별한다.

## 범위와 선행 상태

- 05 `transactions`, 06 `concurrency`와 고정 `database/<chapterId>` readId만 추가한다. DB는 IT·기술 4권이다. 07–12/G는 이 배치에 포함하지 않는다.
- B source `bae858c964f4cbdf797bf7afe2fac874581127a4`의 DB339/339·135PNG와 권차14/14, 직접·독립 픽셀 검토가 닫힌 뒤 별도 작업 트리에서 C를 준비했다. B는 별도 합본의 공개 게이트를 거친다. C를 B보다 먼저 공개하지 않는다.
- 기존 클라우드 환경, Node24.19, TypeScript/Vite. 모델은 PG18 공식 문서를 읽어 작성한 결정적 교육 모델이다. 실제 PostgreSQL·SQL Server·SQL·version()·컨테이너·백업/복원을 실행한 적이 없다. 로컬 Chromium 환경 제한을 우회하지 않으며 실제 브라우저 검증은 Actions에서 수행한다.
- 다른 책의 최신 본문·권차·읽음 상태·공유 범위 분류기를 보존한다. 일반 배치는 DB와 영향받는 권차 smoke를 검사하고, 생략한 다른 책을 통과했다고 쓰지 않는다. 전체 단위 테스트·build·정확한 게시 자산 검사는 유지한다.

## 모델과 그림의 계약

### 05 함께 성공하거나 함께 취소하기

고정 상품101의 재고5에서 요청2를 예약한다. 미확정 유효 변경, 최신 확정 fixture, 거절 후보, 취소 이력, 과거 조회 결과, 명시적 block 상태를 분리한다. 그림은 같은 DB의 논리적 보기이지 별도 물리 DB나 실제 저장 위치가 아니다.

- 단일 transaction 성공: 재고3·새 헤더1·항목수량2. 오류 후 취소: 재고5·추가0.
- 문장별 autocommit 헤더 오류: 재고3·헤더0·항목0. 항목 오류: 재고3·헤더1·항목0. 스키마 규칙 충족과 업무 완료를 별도로 판정한다.
- 성공한 문장과 자동 확정은 하나의 사건이며 사용자가 보낸 가짜 COMMIT을 만들지 않는다. `committedThisStepVersionIds`를 모델이 제공하고, 그림의 확정 사건→정확한 행 버전 연결선도 이를 읽는다.
- 제약 오류 후보는 유효 fixture에 넣지 않는다. 명시적 block이 실패하면 이전 미확정 변경은 현재 경계에서 사라지고 이력에만 남는다. ROLLBACK 전 후속 SELECT는 오류이며 성공한 현재 조회 결과로 꾸미지 않는다.
- 번호1004는 별도 교육용 sequence의 성공한 nextval 사건에서만 소비한다. 기존 fixture의 숨은 identity 기본값을 가정하지 않으며, 취소 뒤 다음1005가 유지된다.
- 기존 주문은 다시 차감하지 않는다. `orders.status='confirmed'`는 상점 업무값이지 COMMIT 표시가 아니며, 이메일·HTTP·응답 유실은 모델 밖이다.

### 06 동시 실행, 읽기 범위, 교착

주 실험은 마지막 재고1·A/B 각1요청이며 세 전략×A확정/취소의 여섯 고정 schedule을 비교한다.

- 낡은 절대값0 쓰기: A0와 B0는 값이 같아도 다른 버전이다. 두 확정 주문이 한 재고를 약속하므로 음수 CHECK와 개별 원자성이 통과해도 업무 불변식은 실패한다.
- 조건부 UPDATE: 대기 문장은 아직 결과가 없다. A확정 뒤 같은 문장이 현재 대상에서 조건을 재확인해 0행 완료하면 앱이 주문을 만들지 않고 거절한다. 전체 statement snapshot 재생성으로 설명하지 않는다.
- SELECT FOR UPDATE: 같은 연결·transaction에서 잠금 뒤 반환 재고를 읽고 확인한다. 반환1행/재고0은 예약 성공이 아니다. A취소 시 A의 변경·잠금이 현재 경계에서 사라지고 B는 원래 재고1로 진행한다.
- 파란 조회 토큰→행 버전 선은 마지막으로 완료된 조회 이력이다. 자원→transaction 소유선, transaction→자원 대기선은 현재 관계이며 행 버전과 자원을 동일시하지 않는다. 객체 삭제·관계 해제는 현재 그림에 실제 반영한다.
- 별도 snapshot 장면은 재고5→B요청2→최신3. RC는 문장마다 범위, RR은 첫 데이터 문장의 범위를 유지한다. 종료된 RR의 두 과거 조회도 같은 snapshot 정체성을 유지하며 회색 이력 경계로 구별한다.
- 두 상품 교착 그림은 방향 있는 네 연결의 실제 고리를 그린다. 교육용 희생B의 abort가 잠금을 풀고, 뒤 ROLLBACK은 실패 block을 정리한다. B2는 새 transaction·새 읽기의 전체 bounded 요청 재시도다. 같은 순서는 이 고리만 예방한다. 이 보조 장면은 주문을 추가하지 않는다.
- PostgreSQL의 설명을 모든 DB 내부 동작으로 일반화하지 않는다. SQL Server/Azure SQL Database의 RCSI 기본 설정 차이를 별도 상자로 밝힌다.

## 로컬·독립 검토 기록

- 순수 모델 helper 기준 `258ae51d150e4c1de5c20844ba061db0fca37d65`(C 작업 트리 cherry-pick `1a49d73`): focused30/30, 전체1022/1022, production build, strict declaration check 통과. 첫 standalone 선언 검사에서 저장소 MDX JSX ambient 범위 오류가 있었고 `--types react`로 대상 선언을 엄격 검사했다. 이를 실제 DB 실행이나 browser 통과로 세지 않는다.
- C 본문·UI 첫 TypeScript/Vite build: 354 modules, 성공. 이후 공개 main `05270dda25437a4529186ee0f3036948c352b7fb`의 세금08·주거06·회계02 및 공유 분류기를 보존 통합하고 전체1062/1062 단위 테스트(동시 실행4 제한, 검사 생략0)와 TypeScript/Vite build를 통과했다. 기존 큰 청크 경고가 남아 있다.
- 독립 소스 검토가 RR 종료 후 공유 snapshot 이력을 문장별 범위로 바꾸던 표시 오류를 발견했다. read.snapshotId와 snapshot.scope에서 과거 공통 경계를 유지하도록 교정했다. 이후 active=false와 공통 경계·동일 범위 라벨을 실제 browser assertion에 포함했다.
- 좌표 검토로 발견한 확정 화살표/제목 교차와 세션 제목/잠금선 교차를 수정했다. 아직 실제 pixels로 확인하기 전인 소스 검토와 구분한다.
- verifier 소스 검토의 SVG innerText 사용, 존재하지 않는 session:writer 캡처 조건을 textContent와 실제 item-error/author-error-read phase로 교정했다. 기존 A/B 시나리오·어설션은 보존하며 C를 추가한다.

## 실제 브라우저 게이트 설계와 현재 상태

**소스·production·직접 시각 검토 완료. main·Pages 게시 확인은 아직 대기 중이다.**

- 1440·390·320px, 각 bounded 시나리오의 모든 프레임을 모델과 대조한다. 정확한 현재/이전 버전·판정·문장 결과, 실제 SVG 끝점과 관계선 장애물, 종료/취소 객체 제거, COMMIT 연결, 공유 snapshot 역사, 교착 cycle와 B2를 검사한다.
- 시작 전 accessible selector 유일성 preflight를 수행하고, blocking timeout은 부분 실패·화면을 남긴 뒤 비정상 종료한다. 미실행 항목을 통과로 세지 않는다.
- 현재 설명·열린 정적 대안의 TextRange가 자기 문단 경계를 넘지 않는지 검사한다. SQL 긴 토큰은 DB 한정 pre-wrap/overflow-wrap으로 줄바꿈한다.
- 모든 새 실험의 키보드·포커스·재생·정지·조건 변경 중 timer 취소·reset·route cleanup, reduced/normal motion을 검사한다. 새06 읽음 ID와 기존/알 수 없는 ID의 reload 보존을 확인한다.
- 캡처 생성과 직접 설명력 검토는 별도 합격문이다. 모델·어설션 통과만으로 실제 모바일 가독성/관계 발견을 통과했다고 하지 않는다.
- exact-main/Pages 및 실제 게시 JS/CSS 일치와 대표 공개 픽셀 검토는 선행 B 게시 이후 별도 통합 창에서 수행한다.

## 미검증

실제 DB·네트워크 연결·서버 잠금·실제 기기·스크린리더·SQL 실행계획·운영 장애 복구는 미검증이다. 브라우저 모델이 실제 서버의 물리 tuple 주소, 모든 잠금 종류, 실제 시간/병렬 스케줄러, 보편적 retry 성공을 재현하지 않는다.


## 실제 production 결과 · 2026-10-20

- [Draft PR33](https://github.com/Middleages/my-books/pull/33) head `840b9138877c015d59505e520d2f6fb66ba2a9d5`, tree `e161d2e1281c95cc27795a3a6d45c0c3a4978c83`. 로컬 검증 commit `1b4317088ef2a939d606feb3ea7d0278f860fbf9`와 같은 tree다. 공개 main `05270dda25437a4529186ee0f3036948c352b7fb`의 다른 교재를 보존하고 B source를 선행 부모로 둔다.
- [Actions39383918047](https://github.com/Middleages/my-books/actions/runs/39383918047): 전체1062개 단위 테스트와 build 성공. 실제 PR merge source/workflow `f2befe527846a4be8923e065875923dd411633b6`, 위 tree와 동일하고 작업 트리는 깨끗하다. DB **415/415**, **259PNG**, page/console/resource 오류 각각0. 권차 **14/14**, **39PNG**, 오류0.
- DB ZIP artifact `12246269948`, 51,401,872bytes, SHA256 `63340774d6327e4c1980d644e4a37909d9c8ec5cb1e422483014d7ffc01a3607`를 내려받아 대조했다. 권차 ZIP `12245759035`, SHA256 `3b136d7591643c828182051e33abc1a274e1576e7c311d8e47b657a9d3d3d23b`도 대조했다. 보고서의 캡처 수와 실제 PNG 파일 수가 같다.
- 선택기는 DB와 book-volumes만 예약했다. 보험·투자·세금·쿠버네티스·주거·회계 browser suite는 이 실행에서 의도적으로 생략됐으며 통과했다고 보고하지 않는다. 다른 책의 단위 테스트는 전체 검사에 포함된다.
- 정확한 production JS `index-CCa7hSwB.js`(2,713,433bytes), SHA256 `c7eccf6f9e7e3ab018160e45c93739f06bbe8335c009015e09d8a2a0d8323308`; CSS `index-jwSqALlG.css`(335,416bytes), SHA256 `595b6bfb83aee6d0f188b049b90d30d126cc843c8b2663ea559d3cffe8b37a6d`. 권차 검사에서 local/served bytes 일치를 확인했다. 이는 production 빌드 증거이지 Pages 게시 확인이 아니다.
- PR 실행의 deploy·Published browser는 예상대로 skipped다. B의 실제 게시 게이트 뒤 최신 main과 통합하고, 직렬 게시 창에서 exact-main/Pages와 실제 자산을 별도로 확인해야 한다.

## 실제 PNG 직접 검토

DB 원본22장과 권차2장을 직접 열었다. 긴 정적 대안 원본4장은 원래 해상도의 부분 캡처8개로 추가 확인했다. 페이지/단계 설명 잘림, 관계선 끝점 혼동, 현재 경계 안의 취소된 객체, 타이머/포커스 표시의 새 결함을 발견하지 않았다. 선택 상자의 긴 네이티브 문구 일부는 좁은 폭에서 줄임 표시되지만 아래 설명·실제 그래프가 같은 조건과 접근 순서를 명시한다.

직접 본 DB 파일:

- 320px 05: `c05-atomic-success-commit`, `c05-atomic-item-constraint-error-item-error`, `c05-atomic-item-constraint-error-author-error-read`, `c05-statement-autocommit-item-constraint-error-final`.
- 320px 06: `c06-unsafe-absolute-commit-final`, `c06-conditional-update-commit-B-wait`, `c06-select-for-update-commit-B-resume`, `c06-snapshot-repeatable-read-complete`, `c06-snapshot-read-committed-A-second-read`, `c06-deadlock-opposite-B-wait-101`, `c06-deadlock-opposite-victim-abort`, `c06-deadlock-opposite-B-rollback`, `c06-deadlock-opposite-B2-begin`, `c06-controls-and-effect`.
- 390px: `c06-conditional-update-rollback-A-rollback`, `c06-conditional-update-commit-B-resume`.
- 1440px: `c05-atomic-success-commit`, `c06-unsafe-absolute-commit-final`.
- 정적 대안: `320-c-transactions-reduce-static-open`, `320-c-deadlocks-reduce-static-open`, `390-c-snapshots-no-preference-static-open`, `390-c-concurrency-no-preference-static-open`.

각 이름의 실제 파일은 폭 접두사와 `.png` 확장자를 가진다. 권차에서는 `1440-home.png`와 `320-database-heading.png`를 확인해 IT·기술4권, DB6장 분모와 기존 표지·순서가 유지됨을 확인했다.

관찰 결과:

1. 하나의 확정 사건에서 세 행으로 향하는 연결과, 오류 후 빈 실패 block/거절 후보/취소 이력의 서로 다른 경계가 보인다. 자동 확정의 재고3·헤더1·항목0은 별도 불완전 업무 판정으로 읽힌다.
2. A0와 B0는 같은 숫자여도 별도 버전이다. 최신 확정 head의 테두리·라벨과 과거 조회 토큰의 실제 목적지가 다르게 보인다. 대기 중 결과 없음, 조건부 갱신0행, 잠금 조회1행/재고0을 구별할 수 있다.
3. RR 종료 후에도 두 과거 조회5→5는 같은 회색 snapshot 이력 경계에 있고, 현재 head 재고3과 분리된다. 독립 교차 검토자가 이 320px 원본과 교착 고리 원본을 추가 확인해 차단 결함이 없음을 확인했다.
4. 소유·대기 방향이 네 모서리를 따라 교착 고리를 만들고, 희생B abort 후 관계선이 제거된다. ROLLBACK 후 B 경계가 사라졌다가 새 B2 경계로 등장한다. 취소된 A의 재고/주문도 현재 경계에서 제거된다.
5. 320px controls-and-effect 원본에서 조작·현재 해설·핵심 버전/관계 변화가 같은 viewport에 들어간다. 네 새 실험의 열린 정적 단계와 normal/reduced-motion 캡처는 읽을 수 있고 포커스가 보인다. 실제 기기·스크린리더나 실제 DB 실행 증거로 확대하지 않는다.

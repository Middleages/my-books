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

**아직 실행 전. 통과 수·PNG 수·게시 완료를 기록하지 않는다.**

- 1440·390·320px, 각 bounded 시나리오의 모든 프레임을 모델과 대조한다. 정확한 현재/이전 버전·판정·문장 결과, 실제 SVG 끝점과 관계선 장애물, 종료/취소 객체 제거, COMMIT 연결, 공유 snapshot 역사, 교착 cycle와 B2를 검사한다.
- 시작 전 accessible selector 유일성 preflight를 수행하고, blocking timeout은 부분 실패·화면을 남긴 뒤 비정상 종료한다. 미실행 항목을 통과로 세지 않는다.
- 현재 설명·열린 정적 대안의 TextRange가 자기 문단 경계를 넘지 않는지 검사한다. SQL 긴 토큰은 DB 한정 pre-wrap/overflow-wrap으로 줄바꿈한다.
- 모든 새 실험의 키보드·포커스·재생·정지·조건 변경 중 timer 취소·reset·route cleanup, reduced/normal motion을 검사한다. 새06 읽음 ID와 기존/알 수 없는 ID의 reload 보존을 확인한다.
- 캡처 생성과 직접 설명력 검토는 별도 합격문이다. 모델·어설션 통과만으로 실제 모바일 가독성/관계 발견을 통과했다고 하지 않는다.
- exact-main/Pages 및 실제 게시 JS/CSS 일치와 대표 공개 픽셀 검토는 선행 B 게시 이후 별도 통합 창에서 수행한다.

## 미검증

실제 DB·네트워크 연결·서버 잠금·실제 기기·스크린리더·SQL 실행계획·운영 장애 복구는 미검증이다. 브라우저 모델이 실제 서버의 물리 tuple 주소, 모든 잠금 종류, 실제 시간/병렬 스케줄러, 보편적 retry 성공을 재현하지 않는다.

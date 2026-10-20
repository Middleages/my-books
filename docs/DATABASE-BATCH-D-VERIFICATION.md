# DB 배치 D 검증 기록: 연결 풀 / 실행계획

확인일: 2026-10-20. **로컬 구현·검증 중. 실제 browser·직접 pixels·게시 완료 전이다.**

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

## 最新 공개 기준 통합 뒤 로컬 게이트

공개 main `05602d24c6946f4e4c1b95f5f926e2e8eb51b316`을 통합해 세금01–10·주거01–08·회계01–02와 기존 교재·권차·공유 workflow를 보존했다. 이 기준과의 차이는 이미 검증된 C05–06 및 D07–08의 DB 전용 source/검사/문서, DB 카탈로그 항목과 README뿐이다. 다른 책 source와 `.github`·범위 선택기는 동일하다. B 공개 확인은 완료됐지만 C/D 공개는 직렬 창을 기다린다.

- `node --test --test-concurrency=4 tests/*.test.mjs`: **1104/1104**, fail0·skip0. 동시성만4로 제한했고 검사 수나 어설션은 줄이지 않았다.
- `npm run build`: TypeScript와 Vite **380 modules** 성공. 기존 큰 bundle 경고는 남아 있다.
- `git diff --check`: 통과. 실제 선택기 결과는 `book-volumes, database`; 다른6 browser suite는 의도적 미실행이지 통과가 아니다.
- D 실제 Actions browser·직접 PNG 판독·게시 자산은 아직 미검증이다. 로컬 Chromium 제한을 우회하거나 실패를 통과로 세지 않았다.

# 데이터베이스 선택 실습의 환경·증거 경계

확인일2026-10-20. [선택 SQL 자료](../examples/database/README.md)와 브라우저 모델은 서로 다른 경로다.

## 실제 확인한 환경

- 작성/정적 검사 환경은 클라우드 Linux 작업 공간이다. 사용자 컴퓨터나 운영 DB를 사용하지 않았다.
- PATH의 `psql`, `postgres`, `pg_dump`, `pg_restore`, `docker`, `podman`은 발견되지 않았다. 서버 설치·새 계정·접속·인증 저장·SQL·dump/restore는 수행하지 않았다.
- 따라서 실제 PostgreSQL engine/psql 버전, 컨테이너 image digest, DB locale/timezone 설정, driver 버전, SQL 반환값·실제 복원 결과는 **미관측**이다. 문서 버전을 실행 버전으로 대신하지 않는다.
- 의미의 기준은 PostgreSQL18 공식 문서다. 확인 시 문서는18을 Current로 표시했고19 RC 안내가 있었지만 이 사실은 설치나 실행 증거가 아니다. 새 실제 실습 때에는 실제 버전을 별도로 관측해야 한다.

## 제공한 것과 제공하지 않은 것

| 경로 | 실제 상태 | 알 수 있는 범위 |
|---|---|---|
| 브라우저 순수 모델 | A–F 각 배치의 실제 검사/시각 기록 참조 | 고정 합성 규칙과 화면·모델의 일치 |
| 선택 SQL 파일 | G 정적 검토·fixture 일치 검사 대상 | 파일 구조/금지 동작 부재/합성 seed 일치. SQL 파서·서버 성공은 아님 |
| PostgreSQL 두 연결·제약·EXPLAIN | 미실행 | 문서의 기대 관측을 실제 결과라고 하지 않음 |
| 논리 dump/별도 대상 복원 | 미실행 | 절차와 검증 기준만 제공. 복원 성공·시간 측정 아님 |
| 실제 앱 역할·driver·서비스 읽기 | 미실행 | 현재 실습 역할의 SQL 읽기 예시와 구별 |
| 물리 crash/PITR·MSSQL·운영 변경 | 범위 밖 | 설치·실행·변경하지 않음 |

fixture 기준은 `src/simulations/database/fixture.mjs`의 CANONICAL_FIXTURE다. 고객3·상품3·주문3·항목4행, 고객1의 확정 주문2/항목3/수량7/36,000원, 가용 재고5·8·3을 사용한다. 04/08의 성장 fixture와09/10의 backup-day fixture를 이 SQL의 서버 결과로 혼합하지 않는다. 실제 seed 파일 SHA256은 G 정적 검사 기록에 남기며 파일 해시가 SQL 실행 증거는 아니다.

## 나중에 실제 실행할 때 남길 항목

승인된 빈 일회용 환경과 정확한 source/target을 확인한 뒤에만 진행한다. 날짜, OS, `version()`·`psql --version`, 실제 사용한 image digest/driver(사용한 경우만), DB locale/timezone/격리·내구성 설정, 파일 해시, 각 명령의 종료 상태·오류 SQLSTATE, 행 수/FK/합계/재고, 별도 앱 읽기 여부를 남긴다. 민감한 접속 문자열·자격 증명은 기록하지 않는다. 실패·미실행 항목을 빈 성공 칸으로 처리하지 않는다.

[전체 편집 기록](DATABASE-BOOK-REVIEW.md) · [G 검증 기록](DATABASE-BATCH-G-VERIFICATION.md)

# 선택 SQL 자료: 그림과 같은 상점을 직접 확인하기

2026-10-20 · PostgreSQL **18** 공식 문서 기준. **작성 환경에서 이 SQL·두 세션·dump/restore는 실행하지 않았다.** 아래 숫자는 합성 fixture에서 계산한 기대 관측이지 실제 서버 출력이 아니다. 본문은 설치 없이 브라우저 모델만으로 완결된다. [환경·미실행 기록](../../docs/DATABASE-LAB-ENVIRONMENT.md)을 먼저 읽는다.

## 0. 어디서 실행하나

승인된 **빈 일회용 PostgreSQL 18 서버**와 그 안의 서로 다른 빈 DB `db_book_source`, `db_book_restore`가 이미 준비된 경우에만 따라간다. 이 자료는 서버 설치, 계정 생성, 접근 권한 변경이나 실제 운영 연결을 수행하지 않는다. DB 이름이 같다는 사실만으로 격리를 증명하지 못하므로 서버 주소·포트·담당자·기존 데이터 없음까지 먼저 확인한다. 운영 원본과 같은 서버를 사용하지 않는다.

- `setup.sql`은 source DB의 `db_book_lab` 스키마와 네 표를 만든다. 기존 스키마가 있으면 실패한다. 반복 실행이 성공하도록 덮어쓰거나 기존 데이터를 지우지 않는다.
- `schema.sql`, `seed.sql`은 setup 안에서만 포함한다. seed는 본문의 CANONICAL_FIXTURE와 같은 고객3·상품3·주문3·항목4행이다. 이름은 모두 합성 자료다.
- 금액 단위는 정수 원, 수량은 개, 시각은 UTC다. 기존 주문은 가용 재고5·8·3에 이미 반영돼 있다. 다시 차감하지 않는다. 양의 id는 이 예의 규칙이지 PostgreSQL 기본키 자체의 의미가 아니다.
- 이 최소 schema는 결제, 외부 이메일, 주문별 필수 항목 수, 운영 멱등성 프로토콜 전체를 구현하지 않는다. request_key UNIQUE 하나가 외부 exactly-once까지 보장하지 않는다.

아래 셸 예는 저장소 루트의 Bash에서 읽는 명령이다. `your_lab_role`은 이미 허용된 전용 역할 이름으로 바꾼다. 비밀번호를 명령·파일·사이트에 넣지 말고 이미 승인된 접속 방식을 사용한다. source/restore 접속 대상을 각각 눈으로 대조한 뒤에만 다음 단계로 간다.

```sh
LAB_ROLE=your_lab_role
psql --version
pg_dump --version
pg_restore --version
psql -X --host=127.0.0.1 --port=5432 --username="$LAB_ROLE" --dbname=db_book_source -c '\conninfo'
psql -X --host=127.0.0.1 --port=5432 --username="$LAB_ROLE" --dbname=db_book_restore -c '\conninfo'
```

서버가 localhost가 아니거나 포트·역할이 다르면 **예시 값을 그대로 실행하지 않고** 승인된 일회용 환경의 값으로 모든 명령을 일치시킨다. 두 연결에서 `SELECT current_database(), current_user, version();`과 `SELECT datcollate, datctype FROM pg_database WHERE datname=current_database();`를 읽어 기록한다. `SHOW TimeZone;`, `SHOW default_transaction_isolation;`, `SHOW fsync;`, `SHOW synchronous_commit;`도 관측값만 남긴다. 버전 번호를 이 문서에서 복사하지 않는다.

## 1. 같은 자료를 만들고 읽기

```sh
psql -X -v ON_ERROR_STOP=1 --host=127.0.0.1 --port=5432 --username="$LAB_ROLE" --dbname=db_book_source -f examples/database/setup.sql
psql -X -v ON_ERROR_STOP=1 --host=127.0.0.1 --port=5432 --username="$LAB_ROLE" --dbname=db_book_source -f examples/database/verify.sql
psql -X -v ON_ERROR_STOP=1 --host=127.0.0.1 --port=5432 --username="$LAB_ROLE" --dbname=db_book_source -f examples/database/queries.sql
```

setup은 구조와 seed를 한 transaction으로 만든다. 오류면 중단하고 원인을 확인한다. 기존 스키마 충돌을 무시하거나 임의 삭제 후 재실행하지 않는다. verify는 수량·관계·금액뿐 아니라 PK4/FK3/UNIQUE1의 존재와 validated 상태도 확인한다. 모든 검사 통과가 schema의 모든 의미나 운영 안전성을 보장하는 것은 아니다.

03장과 연결해 고객1의 확정 주문2건, JOIN 결과3행, 수량7개, 주문 당시 단가의 합36,000원을 구별한다. 고객3은 LEFT JOIN 결과1행이지만 주문 id는NULL이므로 COUNT(o.id)=0, SUM은NULL이다. `queries.sql`의 작은 실제 SELECT는 브라우저04/08의64행 성장 fixture와 다르므로 같은 계획·비용·시간이 나와야 하는 실험이 아니다. EXPLAIN은 예상 구조, EXPLAIN ANALYZE는 이 부작용 없는 SELECT를 **실행**한 관측이다. 임의 운영/변경 쿼리로 바꾸지 않는다.

## 2. 취소와 제약 오류

`rollback.sql`은 상품101의5→4를 같은 세션에서 보고 ROLLBACK 뒤5를 읽는다. 완전한 주문 처리 함수가 아니라 취소 경계의 최소 예다.

```sh
psql -X -v ON_ERROR_STOP=1 --host=127.0.0.1 --port=5432 --username="$LAB_ROLE" --dbname=db_book_source -f examples/database/rollback.sql
psql -X -v ON_ERROR_STOP=1 --host=127.0.0.1 --port=5432 --username="$LAB_ROLE" --dbname=db_book_source -f examples/database/constraint-failure.sql
echo "$?"
```

두 번째 파일은 **의도적 실패**다. 기대는 CHECK 위반SQLSTATE23514와 psql 종료코드3이며, 다른 연결 오류·대상 오류를 성공한 반례로 세지 않는다. ON_ERROR_STOP 때문에 파일 실행이 멈추고 연결이 닫히면서 열린 transaction의 첫 갱신도 취소된다. 새 연결에서 `verify.sql`을 다시 실행해 기준 자료가 남았는지 확인한다. 인터랙티브 세션에서 직접 오류를 냈다면 실패한 transaction을 ROLLBACK으로 끝내야 한다. 이 설명을 sequence 값·외부 부작용까지 모두 되돌아간다는 보장으로 확대하지 않는다.

## 3. 두 세션: 기다림과 완료 행 수

별도 터미널 두 개에서 같은 source에 **인터랙티브 psql**을 연다. `-f session-a.sql`은 파일 종료 시 연결이 닫혀 대기를 관찰할 수 없으므로 사용하지 않는다. 아래 `\i`는 저장소 루트에서 시작한 psql 프롬프트에서 입력한다.

1. 먼저 모든 기존 실습 연결을 닫고 `verify.sql`로 재고5를 확인한다.
2. A에서 `\i examples/database/session-a.sql`. 상품101의5개를 조건부 차감해 반환값0, UPDATE1을 확인한다. 아직 확정하지 않는다.
3. B에서 `\i examples/database/session-b.sql`. 같은 상품의5개를 차감하려 기다린다. **대기 중 결과는0행이 아니라 아직 미완료**다.
4. 60초 안에 A에서 `ROLLBACK;`. B는 풀린 현재 행을 처리해1행·재고0을 반환한다. B에서도 `ROLLBACK;`하고 양쪽 세션을 닫는다.
5. 새 연결의 verify가 다시 재고5를 확인해야 한다. 이 기본 경로는 fixture를 보존한다.

지연/타임아웃은 정상0행과 다르다. lock_timeout60초·statement_timeout90초·idle transaction120초 제한을 설정했으므로 오류나 끊김이 나면 양쪽을 정리하고 기준 상태를 검증한 뒤 재시작한다. 잠금을 길게 유지하거나 다른 연결을 강제 종료하지 않는다.

**선택 반례:** 새 기준 상태에서 다시 시작해4번의 A만 COMMIT으로 바꾸면 B는 Read Committed의 충돌 해소 뒤 조건을 재평가해0행을 반환한다. B는 ROLLBACK한다. 이 갈래의 확정 재고는0으로 바뀌므로 canonical verify가 실패하는 것이 맞다. 주문 기록 없는 최소 갱신 예이며 정상 주문 서비스가 아니다. 이 변경 자료를 아래 기준 dump/restore와 섞지 않는다. 기준 자료가 필요하면 소유자가 확인한 **새 빈 일회용 source**를 마련하고 setup부터 다시 시작한다. 원래 데이터를 임의 UPDATE로 맞추거나 지우지 않는다.

## 4. 별도 대상에 논리 dump 복원하기

모든 실습 transaction이 끝났고 source가 canonical verify를 통과한 상태만 사용한다. restore DB에는 setup을 실행하지 않는다. 전용 서버·restore DB가 비어 있고 source와 다름을 다시 확인한다. 아래는 이 자료로 직접 만든 **신뢰할 수 있는 합성 dump만** 대상이다. dump 복원은 출처가 선택한 코드를 실행할 수 있으므로 낯선 dump를 파일로만 보고 안전하다고 판단하지 않는다.

```sh
RUN_DIR="$(mktemp -d)"
pg_dump --host=127.0.0.1 --port=5432 --username="$LAB_ROLE" --dbname=db_book_source --format=custom --schema=db_book_lab --no-owner --no-acl --file="$RUN_DIR/study-shop.dump"
pg_restore --list "$RUN_DIR/study-shop.dump"
pg_restore --file="$RUN_DIR/inspect.sql" "$RUN_DIR/study-shop.dump"
# inspect.sql을 읽고 source/target과 자료 범위를 재확인한 뒤에만 다음 명령 실행
pg_restore --host=127.0.0.1 --port=5432 --username="$LAB_ROLE" --dbname=db_book_restore --exit-on-error --single-transaction --no-owner --no-acl "$RUN_DIR/study-shop.dump"
psql -X -v ON_ERROR_STOP=1 --host=127.0.0.1 --port=5432 --username="$LAB_ROLE" --dbname=db_book_restore -f examples/database/verify.sql
```

각 명령의 종료 상태를 확인한다. 위 줄들을 오류를 무시하는 자동 파이프라인으로 실행하지 않는다. 복원용 `--clean`·`--create`, trigger 비활성화는 사용하지 않는다. 부분 객체 충돌이나 검증 실패면 멈추고 조사한다. 이 스키마의 자기완결된 FK만 대상으로 하며 임의 스키마의 의존성을 자동 포함한다고 일반화하지 않는다.

복원 뒤 예상은 다시3/3/3/4행·재고5/8/3·확정 금액36,000원·참조 누락0이다. 마지막 SELECT는 **현재 실습 역할**로 앱이 사용할 형태의 데이터를 읽을 뿐, 별도 앱 역할/네트워크/driver/서비스 전환을 검증한 것이 아니다. `--no-owner --no-acl`은 운영 소유권·권한 복구 검증을 의도적으로 제외한다. 실제 앱 읽기와 외부 설정까지 검증하지 않았으므로 이것만으로 RTO 달성이나 서비스 복구 성공을 선언하지 않는다. 논리 dump에 물리 WAL을 이어 붙이지 않으며 crash/PITR·물리 base·MSSQL은 이 선택 자료 범위 밖이다.

## 5. 기록과 정리

실제 수행자가 날짜·명령·exit/SQLSTATE·서버/psql 버전·OS·locale/UTC·관측 행과 금액·fixture 파일 SHA256을 기록한다. 컨테이너나 driver를 썼을 때만 실제 image digest/driver 버전을 더한다. 미사용 값을 만들어 채우지 않는다. 공개 기록에는 주소·역할·로그의 민감 정보를 제거하고 합성 관측만 남긴다.

정리는 모든 transaction을 ROLLBACK하고 `\q`로 연결을 닫는 데서 시작한다. DB·서버·생성 파일 삭제는 소유자와 **이번에 만든 일회용 자원**임을 확인한 별도 절차로 수행한다. 이 자료에는 자동 DROP/삭제 스크립트가 없다. 기존 데이터 삭제·원본 덮어쓰기는 정리 방법이 아니다.

공식 근거 확인일2026-10-20: [psql](https://www.postgresql.org/docs/18/app-psql.html), [제약](https://www.postgresql.org/docs/18/ddl-constraints.html), [Read Committed](https://www.postgresql.org/docs/18/transaction-iso.html), [SQL dump](https://www.postgresql.org/docs/18/backup-dump.html), [pg_restore의 신뢰·트랜잭션·대상 옵션](https://www.postgresql.org/docs/18/app-pgrestore.html). 독자적으로 작성한 최소 자료이며 실제 실행 기록은 아니다.

# 데이터베이스 배치 G: 전체 편집·선택 SQL 검증 기록

2026-10-20. **로컬 작성/검사 중. 실제 G production·전체 브라우저 회귀·main/Pages는 아직 미완료다.** SQL 파일은 정적 자료이며 실제 PostgreSQL·두 연결·dump/restore는 미실행이다.

## 기준과 범위

F 검증 소스 local01df5447/remote5f856be2, tree2530063c의 실제 run39425306762에서1338unit/build·DB644/644·738PNG·권차14/14 및 직접/교차 검토를 닫았다. F 마감 문서 b1632417에서 별도 G worktree를 만들고 최신 main `5b257ffccec0199c960a1ec25bec27e81351dc31`의 E·다른7배치 변경을 merge d16094e로 보존했다. F 공개는 E 뒤이며 G는 F 뒤다. 로컬 G 준비를 게시 완료라고 하지 않는다.

변경은 DB 기존 강조7곳,02의 오래된 미공개 문구,소개 선택 SQL 링크,10의 복사 후 시점 라벨,선택 SQL/환경·전체 검토 문서,이를 검증하는 source/SSR/browser 계약이다. 카탈로그12장·readId·권차4·모델 값은 그대로다. 기존 A–F assertion을 제거하지 않는다.

## 현재 확인

- 초기 focused11/11: 기존 F6계약과 새 G5계약. 신뢰한13MDX의 SSR에서 의도하지 않은 강조 별표/백틱/del/중첩p를 확인하고7개 실제 strong를 검사했다. seed는 CANONICAL_FIXTURE의 모든 열/행과 문자 단위로 맞춘다. 이는 실제 SQL 실행 검사가 아니다.
- 10 copy frame은 적재된 관계가 존재하고 recoveredThrough=null인 상태다. 새 캡션의 source 계약을 검사했으며 실제 glyph 경계·원본 PNG 확인은 다음 G browser 실행에서 수행한다.
- 실제 클라우드 PATH에 psql/postgres/pg_dump/pg_restore/docker/podman이 없어 설치·접속을 시도하지 않았다. PostgreSQL18 공식 문서만 의미의 기준으로 읽었다. 실제 engine/psql 버전은 미관측이다.
- E 게시 원본 별도 검토: main5b257ffc / run39425708305의 published577/577·오류0, 알려진 host-rootfavicon404 한 건 별도 보존을 확인하고09/10 대표6원본+native4crop을 직접 읽어 게시 담당에게 전달했다. 이 결과를 G의 수정된 앱이나 F 게시 통과로 재사용하지 않는다.

- 최신 main5b 보존 상태에서 로컬 전체 `node --test --test-concurrency=4 tests/*.test.mjs`는1382/1382(실패·취소·skip0)를 통과했다. 이후 실제 문단 경계 검사에서 빈 selector가 통과할 가능성을 없애려고 문단 자체의 Range 사각형과 비어 있지 않은 samples를 직접 검사하도록 보강했다. 마지막 고정 소스의 전체unit/TypeScript/build는 focused Actions에서 다시 수행한다.
- 독립 읽기 전용 SQL 검토는13개 seed 행/모든 열의 canonical 일치, setup 원자성·실패 종료, Read Committed의 A취소/B1행 및 A확정/B0행, 별도 빈 복원 대상·no-overwrite·신뢰 경계에서 차단 결함을 찾지 않았다. 실제 SQL 파서/서버를 실행한 리뷰는 아니다. verify는 완전한 모든 행/제약 정의 비교가 아니라 명시한 행 수·합계·재고·참조/제약 개수와 읽기 예시 범위다.
- seed.sql SHA256 `14cd81155dceb05a8d9d7c044451f6958f773dcc2a1a07231a3373f3351b1d19`, fixture.mjs SHA256 `54a50bbefec4b69bb618f1df802bfd3f9cf5c95e4870c8c679b3c502f260147a`. SQL 실행 증거가 아니라 제공 자료의 정체성이다. catalog AST의 DB 외 모든 책과 shared 선언이 최신 main5b와 동일함을 확인했다. G에서 F 순수 모델 변경은 없다.
- source QA는 배포 job 없는 별도 `contents: read` 전용 검증 branch에서 DB/권차2종만 수행한다. 다른12종은 이 실행에서 미검사이며 기존 Pages workflow/selector를 변경하지 않는다. 최종 완성 소스의 전체14종 production/published 회귀는 게시 담당의 통합 후보에서 별도로 반드시 확인한다.

## 남은 게이트

최종 전체unit/build·변경 검사·다른 책 파티션 보존, 실제 DB/권차/책마감 넓은 회귀,12장×3폭 관계의 직접 검토와 영향 본문/복사 단계 새 PNG,조율된 F 다음 main·Pages exact 자산 확인을 남긴다. 실패/미실행은 별도 기록한다. 선택 실습 SQL을 제공했다는 이유만으로 실제 restore·앱 읽기·RPO/RTO 달성을 완료로 쓰지 않는다.

[전체 편집 점검](DATABASE-BOOK-REVIEW.md) · [환경·실행 경계](DATABASE-LAB-ENVIRONMENT.md) · [선택 자료](../examples/database/README.md)

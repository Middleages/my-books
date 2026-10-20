# 데이터베이스 배치 G: 전체 편집·선택 SQL 검증 기록

2026-10-20. **G 소스·focused production·직접 시각 검토 완료. 최종 통합의 전체14종 브라우저 회귀·main/Pages는 아직 미완료다.** SQL 파일은 정적 자료이며 실제 PostgreSQL·두 연결·dump/restore는 미실행이다.

## 기준과 범위

F 검증 소스 local01df5447/remote5f856be2, tree2530063c의 실제 run39425306762에서1338unit/build·DB644/644·738PNG·권차14/14 및 직접/교차 검토를 닫았다. F 마감 문서 b1632417에서 별도 G worktree를 만들고 최신 main `5b257ffccec0199c960a1ec25bec27e81351dc31`의 E·다른7배치 변경을 merge d16094e로 보존했다. F 공개는 E 뒤이며 G는 F 뒤다. 로컬 G 준비를 게시 완료라고 하지 않는다.

변경은 DB 기존 강조7곳,02의 오래된 미공개 문구,소개 선택 SQL 링크,10의 복사 후 시점 라벨,선택 SQL/환경·전체 검토 문서,이를 검증하는 source/SSR/browser 계약이다. 카탈로그12장·readId·권차4·모델 값은 그대로다. 기존 A–F assertion을 제거하지 않는다.

## 현재 확인

- 초기 focused11/11: 기존 F6계약과 새 G5계약. 신뢰한13MDX의 SSR에서 의도하지 않은 강조 별표/백틱/del/중첩p를 확인하고7개 실제 strong를 검사했다. seed는 CANONICAL_FIXTURE의 모든 열/행과 문자 단위로 맞춘다. 이는 실제 SQL 실행 검사가 아니다.
- 10 copy frame은 적재된 관계가 존재하고 recoveredThrough=null인 상태다. 새 캡션의 source 계약과 아래 실제 G browser의 glyph 경계·원본 PNG를 함께 확인했다.
- 실제 클라우드 PATH에 psql/postgres/pg_dump/pg_restore/docker/podman이 없어 설치·접속을 시도하지 않았다. PostgreSQL18 공식 문서만 의미의 기준으로 읽었다. 실제 engine/psql 버전은 미관측이다.
- E 게시 원본 별도 검토: main5b257ffc / run39425708305의 published577/577·오류0, 알려진 host-rootfavicon404 한 건 별도 보존을 확인하고09/10 대표6원본+native4crop을 직접 읽어 게시 담당에게 전달했다. 이 결과를 G의 수정된 앱이나 F 게시 통과로 재사용하지 않는다.

- 최신 main5b 보존 상태에서 로컬 전체 `node --test --test-concurrency=4 tests/*.test.mjs`는1382/1382(실패·취소·skip0)를 통과했다. 이후 실제 문단 경계 검사에서 빈 selector가 통과할 가능성을 없애려고 문단 자체의 Range 사각형과 비어 있지 않은 samples를 직접 검사하도록 보강했다. 마지막 고정 소스의 전체unit/TypeScript/build는 아래 focused Actions에서 다시 통과했다.
- 독립 읽기 전용 SQL 검토는13개 seed 행/모든 열의 canonical 일치, setup 원자성·실패 종료, Read Committed의 A취소/B1행 및 A확정/B0행, 별도 빈 복원 대상·no-overwrite·신뢰 경계에서 차단 결함을 찾지 않았다. 실제 SQL 파서/서버를 실행한 리뷰는 아니다. verify는 완전한 모든 행/제약 정의 비교가 아니라 명시한 행 수·합계·재고·참조/제약 개수와 읽기 예시 범위다.
- seed.sql SHA256 `14cd81155dceb05a8d9d7c044451f6958f773dcc2a1a07231a3373f3351b1d19`, fixture.mjs SHA256 `54a50bbefec4b69bb618f1df802bfd3f9cf5c95e4870c8c679b3c502f260147a`. SQL 실행 증거가 아니라 제공 자료의 정체성이다. catalog AST의 DB 외 모든 책과 shared 선언이 최신 main5b와 동일함을 확인했다. G에서 F 순수 모델 변경은 없다.
- source QA는 배포 job 없는 별도 `contents: read` 전용 검증 branch에서 DB/권차2종만 수행한다. 다른12종은 이 실행에서 미검사이며 기존 Pages workflow/selector를 변경하지 않는다. 최종 완성 소스의 전체14종 production/published 회귀는 게시 담당의 통합 후보에서 별도로 반드시 확인한다.

## 실제 focused 소스 검증

[run39432961184](https://github.com/Middleages/my-books/actions/runs/39432961184), 2026-10-20 13:44–14:02 UTC. 소스 고정 local `d057cdccd4b6ded1516d0ff7e6012ea17072e761`, 공개 source commit `8188496561eeb3a774faf40906f0b1079c85935a`, source tree `cf510777b9b9b3daf45c8db60a7293a5941c0a94`다. 실제 checkout/workflow는 `14c59c852e048db040026cb9455af799b2046bcd`, tree `e65fe87941c52f359f2e879fccb7dafe5122e96a`다. 두 tree 차이는 임시 `.github/workflows/database-g-source-check.yml` 한 파일뿐이다. source23파일 변경에는 이 임시 workflow가 없으며 통합·게시하지 않는다.

- 전체unit **1382/1382**, 실패/취소/skip0; TypeScript/Vite build535 modules 성공. shared asset 크기 경고는 있었지만 오류는 아니다. 같은 build 한 개를 두 browser job이 사용했다.
- DB **665/665·765원본PNG**, 권차 **14/14·57원본PNG**, 둘 다 clean checkout. DB page/console/resource 오류와 별도 진단은 모두0이다. 기존 A–F assertion은 그대로이며 G 실제13route/7strong·문단 Range/복사 시점 SVG 검사를 추가했다.
- DB ZIP artifact12270316104 SHA256 `2df0ae1c3d211793ac351f62fbf71656dafc8384212ad814761763cf059f39df`; 권차 ZIP12269616433 SHA256 `1a0fd92e722fac3e42ac4beb48a30d3dc4785eb7c21fbd73384685ee852988c3`. 다운로드 후 원본 ZIP 해시를 대조했다.
- 실제 served/local exact JS `index-DQWtOcwl.js`3836386bytes SHA256 `06dfe6d5edb703a955f4ae37a632d96050240fc63ca756031e8bff611ab8a3f4`; CSS `index-Bt9QrDPo.css`437613bytes SHA256 `4610360289c9e6c4b4b5518e6bb93c092357fa61aab59cfe45c7919d14fbcb7a`가 일치했다. 이는 source production이며 공개 Pages 자산 증거가 아니다.
- 검사 workflow는 `contents: read`만 가지며 배포 job이 없다. 기존 Pages workflow/selector는 변경하지 않았다. 다른12종 browser suite는 **의도적 미실행이며 통과가 아니다**. examples 경로를 거짓으로 DB-only 분류하지 않았다.

## 직접 픽셀·독립 검토

같은 새 G artifact에서 12장×1440/390/320×두 상태인 **72원본**,08장의 실제 관측 추가6원본, G 강조/선택SQL/복사 시점27원본을 직접 읽었다. 합계 **DB105원본**이며 생성된765개 전부를 사람이 읽었다는 뜻이 아니다. 권차는 `1440-home.png`, `320-database-heading.png`2원본을 별도로 확인했다. 긴 모바일의 일부 글자·선·시간축은 **27개 무리사이즈 native crop**으로 추가 확인했다(01–06 16개,07–12 11개). crop 개수를 원본 수에 더하지 않는다.

아래 stem 각각에 `1440-`, `390-`, `320-`와 `.png`를 붙인72개가 기본 관계 검토 범위다.

|장|두 비교 원본 stem|직접 읽은 관계|
|---|---|---|
|01|files-race-final / files-database-final|과거 사본·현재 저장소와 확정2건/1건|
|02|key-all / key-order|세 FK 끝점·주문 FK 선택선|
|03|b03-fork-count3 / b03-left-null-sum-null|JOIN행3/주문2와 LEFT1행/주문0/NULL합|
|04|b04-narrow-ordered-final / b04-narrow-scattered-final|동일 ID2001–2004와 데이터페이지1/4·총접근3/6|
|05|c05-atomic-item-constraint-error-final / c05-statement-autocommit-item-constraint-error-final|전체취소와 부분확정의 경계·거절 후보·이력|
|06|c06-conditional-update-commit-B-wait / c06-conditional-update-commit-B-resume|B결과미완료와 최신0 재평가 뒤 UPDATE0행|
|07|d07-pool1-leak-final / d07-pool1-normal-final|R1대여선 잔류·대기3 대 소유선 제거·idle연결 유지|
|08|d08-growth-count-false-low-final / d08-nested-loop-false-low-final|부모/자식 행 흐름과 미관측≠0·실행결과 없음|
|09|e09-sync-after-ack-cache-write / e09-sync-after-ack-final|휘발cache 기록 대 내구WAL20·새instance 조회4|
|10|e10-physical-continuous-final / e10-missing-wal-final|연속끝11/6과 시간차4/9·별도서비스21>20|
|11|f11-safe-expand-contract-bridge-update / f11-safe-expand-contract-final|두 열 공존·동시쓰기에서 옛 열 실제 제거·현재참조0|
|12|f12-compound-selected-pool-final / f12-compound-selected-compound-plan|A·R1 대 Q·Q1의 선택실행선과 전체관측 상자 구분|

08의 추가6개는 같은 세 폭의 `d08-growth-count-true-low-final`, `d08-nested-loop-true-low-final`이다. 예상4/관측40과 COUNT출력1, 안쪽 평균1.5×loops2=누적3 및 두 실행의2+1행을 직접 읽었다. 그림의 값/선과 설명이 맞고 새 page overflow나 겹침은 보이지 않았다. 320 SVG 일부 글자는 본문보다 작으므로 이 검토를 실물 기기의 읽기 편의 연구나 접근성 인증으로 확대하지 않는다.

G27개는 각 폭의 `g-definition-files-and-database-1`, `g-definition-tables-and-constraints-1`부터`-4`, `g-definition-connections-and-pools-1`, `g-definition-explain-and-diagnosis-1`, `g-optional-sql-boundary`, `g-recovery-copied-time`이다. 별표가 남지 않는 실제 강조와 문단 줄바꿈, SQL미실행 설명, 대상ID/데이터시점미확정/적재행의 수직분리를 직접 확인했다. 독립 교차 검토도320 복사시점 원본1장의 관계·라벨 범위에서 차단사항이 없었다.

읽기 전용 독립 검토는01–06 36원본과16crop을 맡았고 나머지는 작성자가 확인했다. 코드 검토에서는 A–F 완화 없음, anchored strong locator·부모P·빈 Range 방지·SVG textContent/getBBox 사용을 확인했다. 상단ID와 캡션 간격은 자동 assertion만으로 보증하지 않고 실제 새 PNG로 닫았다. 코드 검토나 이전F 이미지를 새G 픽셀 증거로 대체하지 않았다.

## 남은 게이트

게시 담당이 최신 병행 main을 보존한 **F/G 포함 최종 통합 소스**에서 전체unit/build와 실제 **14종 production/published** 넓은 회귀, exact-main/Pages 자산·공개 URL 및 대표 직접 검토를 닫는다. 앞서 F의 독립 source gate를 통과했고 G가 그 위에서 검증됐으므로 두 소스를 같은 다음 공개 후보에 함께 보존할 수 있지만, 그 전에 책 전체 게시 완료를 선언하지 않는다. 이후 문서 마감이 소스 동작을 바꾸지 않는지도 확인한다.

실제 PostgreSQL 파서/SQL·두세션·dump/restore·앱 역할/서비스 전환은 미실행이다. Safari·실물터치·스크린리더 음성도 미검증이다. 실패/미실행은 별도 기록하며 선택 SQL 제공을 실제 restore·앱 읽기·RPO/RTO 달성으로 보고하지 않는다.

[전체 편집 점검](DATABASE-BOOK-REVIEW.md) · [환경·실행 경계](DATABASE-LAB-ENVIRONMENT.md) · [선택 자료](../examples/database/README.md)

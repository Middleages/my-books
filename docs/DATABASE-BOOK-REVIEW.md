# 『웹앱 개발자를 위한 데이터베이스』 전체 편집 점검

2026-10-20. 소개+12장·IT4권. **G 후보 작성·검사 중이며 전체 최종 통과나 게시 완료 선언이 아니다.** F 소스 검증과 E까지의 실제 게시 증거는 각 배치 문서를 따른다. [G 검증 기록](DATABASE-BATCH-G-VERIFICATION.md)에서 마지막 통합 소스·실제 화면·전체 회귀·게시 결과를 별도로 닫는다.

## 책의 목표와 유지한 구조

SQL 암기보다 데이터의 정합성과 느린 요청의 원인을 설명하는 것이 목표다. 같은 study-shop에서 표→조회→변경→연결→내구/복구→구조 변경→진단으로 질문을 연결한다. 문장은 PostgreSQL18 문서의 의미를 기준으로 하고, 짧은 MSSQL 비교는 해당 제품 차이만 설명한다. 브라우저에서 실제 SQL·DB 서버를 실행한다고 하지 않는다.

| 장 | 눈으로 확인할 관계 | 반례·경계 | 모델/화면 연결 |
|---|---|---|---|
|01 파일과 DB|앱 사본과 공유 저장소, 읽기/쓰기 경로|파일 잠금도 규칙을 지키면 가능; DB 이름만으로 정합성 보장 안 됨|foundation의 사본·revision·확정 주문|
|02 키와 제약|주문→고객, 항목→주문/상품의 세 FK|NOT NULL 없는 CHECK UNKNOWN 수용; 빈 헤더는 FK로 금지 안 됨|같은 fixture의 row key·edge·후보 경계|
|03 조회|주문1건→항목 여러 행의 분기와 집계 단위|COUNT(*)/열/DISTINCT, NULL SUM과 집계행 없음|queryFrames의 원본·pair·group|
|04 인덱스|같은 결과를 향한 index/heap page 방문|넓은 조건·흩어진 배치·유지 비용; 논리 개수≠실제 시간|indexFrames의 경로·고유 페이지·쓰기 구조|
|05 transaction|하나의 확정 경계와 문장별 부분 확정|오류 뒤 과거 조회, 빈 헤더, sequence는 취소되지 않음|transactionFrames의 현재 변경·확정·이력|
|06 동시 실행|조회 버전, 소유 실선/대기 점선|대기 결과 미확정≠0행, snapshot≠최신 확정|동시 실행·snapshot·deadlock frame|
|07 연결 풀|요청 대여·client/session 연결의 서로 다른 수명|SQL 종료≠반환, 상한 합≠실측 연결, 초과량 보존|pool frame·timeline·budget·binding|
|08 실행계획|자식→부모 행 흐름, rows×loops와 호출 단위|COUNT1행/scan40, 평균1.5×2, 앱 조립3≠DB반환5|plan node·counter·appCalls 같은 frame|
|09 내구성|휘발/내구 경계와 복구 후 가시성|저장된 미확정4≠새조회4, 응답 유실≠취소|page/WAL·T1 상태·readResult|
|10 복구|연속 자료 끝의 데이터 시간과 별도 서비스 경과|누락7뒤8–11 사용 불가, RPO 통과/RTO 실패, 권한 거절|recoveryFrame의 dataset·범위·steps·checks|
|11 구조 변경|앱 참조와 현재 열, 행 양열 공존/제거|채움100%≠값 일치, 과거 검증≠현재, DDL대기≠적용|migrationFrame의 역할·열·행·gate·잠금|
|12 종합 진단|같은 실행의 증거 경로와 원본 관계 그림|미관측≠0, A/B/Q 분리, 키 동일/내용 다름 거절|선택 evidence/run와 05–08 원본 frame 재사용|

소개는 읽음 분모에 넣지 않는다. `database/<id>`12개, `technology/volume:4`, 기존 URL·my-books:read:v1·알 수 없는 읽음 ID를 유지한다. 새 번호 장·새 계정/입력 서비스는 만들지 않는다. 다른 책·표지·분야 및 병행 main 변경을 보존한다.

## G에서 발견/수정한 편집 문제

1. 01 DBMS,02 PK/FK/constraint/UNKNOWN(NULL),07 connection pool,08 plan의7개 강조가 실제 trusted MDX SSR에서 별표로 남았다. 명시적 strong 요소로 바꾸고 소개+12 전체 SSR 및 실제 브라우저 strong/문단 경계/본문 캡처를 추가한다. 과거 실험 픽셀 검증을 이 수정의 증거로 대신하지 않는다.
2. 02의 ‘03장 아직 미공개’라는 초기 배치 안내를 실제 구현된03장 링크로 바꾼다. 소개의 선택 실습 ‘예정’ 문구는 실제 제공한 SQL 자료와 미실행 경계로 맞춘다.
3. 10에서 사본 행은 이미 대상에 들어왔지만 recoveredThrough가 없는 copy 단계의 ‘복원 전’ 표시가 적재 전처럼 보일 수 있었다. 대상 ID와 ‘데이터 시점: 미확정’을 두 줄로 분리한다. 데이터·시간 모델은 바꾸지 않는다. G 실제 검사에서 행 존재, 시점null, 글자 경계·아래 행과 비겹침을 함께 대조한다.
4. 최소 [선택 SQL 자료](../examples/database/README.md)를 추가한다. schema·canonical seed·읽기/취소/의도적 제약 오류·두 세션 schedule·논리 복원 검증을 분리한다. 새 DB 설치/운영 접속·계정/권한 변경·자동 삭제는 없다.

## 완료와 미검증을 나누는 기준

- A–F 순수 모델/화면 계약·직접 픽셀은 각 배치 검증 기록에 실제 소스와 실패 이력을 남겼다. G는 동일 시나리오 검사를 제거하지 않고 전 장 편집을 더한다.
- 마지막 G 실제 production에서1440/390/320의12관계와 영향 본문을 직접 확인하고, 키보드/정지/재설정/route cleanup/reduced-motion/읽음/오류 검사를 닫아야 한다. 자동 PNG 생성 수는 사람이 읽은 수가 아니다.
- 책 마감의 넓은 회귀는 당시 실제 사용 가능한 suite 목록과 각각의 결과를 기록한다. 일반 배치에서 의도적으로 생략한 suite를 통과로 합산하지 않는다.
- 선택 SQL의 정적 fixture 일치/구조 검사는 실제 PostgreSQL 파서·실행·성능·두 connection/복원 검증이 아니다. [환경 문서](DATABASE-LAB-ENVIRONMENT.md)에 미관측을 명시한다. 실제 앱 역할과 서비스 전환도 미검증이다.
- Safari·실물 터치 기기·스크린리더 음성 출력은 실제 확인하지 않았으며 통과로 쓰지 않는다. 사이트 exact-main/Pages/게시 자산·실제 URL 확인은 소스 준비와 별도 마지막 단계다.

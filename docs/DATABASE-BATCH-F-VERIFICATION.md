# 데이터베이스 배치 F11–12 검증 기록

작성일2026-10-20. 범위는11 `schema-migrations`,12 `database-troubleshooting`이다. **첫 실제 production browser는 통과했지만 직접 시각 검토에서 실행별 경로 혼합 문제를 발견해 교정 중이다. 최신 수정의 실제 browser·직접 시각·main·Pages 게이트는 아직 완료되지 않았다.** 실제 PostgreSQL·DDL·관측 도구·재시도는 실행하지 않았다.

## 선행과 통합 범위

E는 PR55 head `2adb6d71751caf3c0f89c6a16e147d81aff3ae35`, tree `82013fd09a4f03214b6e6d01551832b1a3d89053`에서 실제 unit1229/build, DB576/576·581PNG, 권차14/14·51PNG와 직접/교차 시각 검토를 완료했다. 마감 문서 `3c26844efa2089015a1f2188b530e72acb9e6e7a`에서 F 별도 작업을 시작했다. 이후 공개 main `358c59bb17f121889afe66fcf06f6bfad770b666`를 보존 통합했다. D의 maina2a0177 실제 게시 마감 문서도 보존했다. 공개는 E 실제 게시 확인 다음이며, 다른 교재의 최신 main·공통 기능·읽음 ID를 보존한다.

## 구현 계약

- 11: 같은 상품101–103과 현재 열 정체성을 사용한다. 즉시 rename은 값을 유지하되 옛 참조를 깨뜨리고, expand–contract는 열 추가·양열 transaction 쓰기·옛 단일 writer 제거·현재 행의 NULL-only 채우기·명시 검증·옛 참조0·제거를 분리한다. 채움100%와 현재 값 동등성, 현재 검사와 과거 검사, 중단과 no-op 재실행을 나눈다. 제거된 열은 현재 schema와 행에서 사라지며, 대기/잠금 획득만으로 아직 새 열을 표시하지 않는다. 행 version은 교육 상태 번호이지 물리 rewrite 측정이 아니다.
- 12: 07의 pool,06의 동시 실행,08의 plan,05의 확정 주문 모델을 직접 재사용한다. 초기에는 관측하지 않은 그림을 노출하지 않고, 증거 ID·실행/요청 ID·원본 step을 함께 표시한다. R1 SQL2와 R2 대기8은 다른 요청이고, UPDATE 대기의 null과 완료0행, 추정4/관측40/COUNT 출력1, 요청 키·내용 대조를 구별한다. 복합 사례의 정상 반환 B는 별도 실행이며 A 이력이나 Q plan을 고치지 않는다.
- 12의 전체 정적 해설은 정답을 포함하는 의도적 공개라고 표시한다. 잠금 그림은 A/B 문장 추적을 함께 제공한 합성 자료이며 A 미확정 값이 B SELECT나 pg_locks에서 나온 값이라고 하지 않는다. 추정 차이는 시간에 따른 실제 일 증가를 증명하지 않는다. 독립 읽기 전용 검토에서 지적한 세 설명 경계를 반영했다.
- F browser 사전 코드 검토에서 상단/그림 옆 단계 조작의 증거 선택 유지 차이를 발견해, 모든 단계 이동·재생 시작·다시 보기에서 새 증거로 돌아가게 통일했다. 과거 증거를 직접 고르면 재생을 멈춘다. 요청 내용 변경은 단계·예측·재생을 초기화한다. 실제 브라우저 회귀에 두 조작부의 동등성·선택 정지·payload 초기화를 추가했고, 공존/채우기 중 세 앱 초점과 전체 gate 숫자도 대조한다. 이는 사전 발견·교정이며 실제 browser 통과 증거는 아니다.
- 기존 PoolScene/PoolTimeline/LastItemScene/PlanScene은 export만 추가해 동일 표현을 재사용한다. 원래 A–E 모델과 시각 장면을 임의 교정하지 않는다. 앞서 알려진 구 장의 Markdown 강조 문제는 별도 G 편집 범위이며 F에서 해결했다고 주장하지 않는다.

## 현재 수행한 검사와 남은 게이트

- 11 순수 모델19/19와12 순수 모델8/8을 통과했다. 각 모델의 deterministic reset·immutable frame·입력 거부·실패 반례를 포함한다.
- F focused33/33(모델27·source 계약5·실제 trusted MDX SSR1)을 통과했다. SSR은 두 본문의 strong·문단·정적 해설 렌더를 확인하며 브라우저 픽셀이나 실제 DB 증거가 아니다. 독립12 모델 검토도8/8을 확인했다.
- 작성 중 첫 전체 검사는1261/1262였다. 최신 main 통합 때 DB 공개 범위 문구를 바꾸며 보험 문구까지 바뀐 비의도적1곳을 기존 보험 계약 검사가 잡았다. 보험은 main의 원문으로 복원했고, DB import·chapter·book record를 제외한 catalog 전체가 main과 같음을 별도로 대조했다. 기존 검사 기대값은 완화하지 않았다. 안정된 통합 소스 `b6075a94c766ee83a25d46bfd90befd858178946`에서 `node --test --test-concurrency=4 tests/*.test.mjs` 전체1324/1324가 통과했다(실패·취소·skip0). 이후12장 재고 설명의 고정 숫자를 원본 payload 값으로 읽도록 바꾸고 집중13개 검사를 다시 통과했다. 최종 고정 소스 검사는 아래에 따로 기록한다.
- 최종 고정 소스 `855708b1bbdf3363c1e5114060dd3a39721af531`, tree `a2808c243d30e69239d0aaa7faff3653cac6d588`에서 전체1324/1324(실패·취소·skip0)와 `NODE_OPTIONS=--max-old-space-size=2048 npm run build`가 통과했다. TypeScript와 Vite487모듈을 모두 실행했다. 큰 단일 bundle 경고는 남아 있지만 build 실패는 아니다. 이 시점의 실제 production browser 결과는 아래 첫 실행 기록에 별도로 남긴다. 작성 중 시작했다 중단한 helper의 전체 검사/build와, 사전 조작 교정을 반영하려 TypeScript 중 중단한 첫 F build의 exit130은 통과로 세지 않는다.
- 실제 browser 계약은1440/390/320의 모든5 migration 시나리오와5 진단 사례(요청 내용2갈래), 각 frame의 열·행·참조/경로 끝점·미관측 경계·같은 모델값을 대조한다. 예측·재생/정지·초기화·이전/다음·근접 조작·키보드·reduced-motion·정적 해설·route 정리와 읽음 보존을 포함한다. 아래 첫 실행은 이 계약을 통과했지만 사람이 발견한 설명 문제까지 해결한 최종 증거는 아니다.
- 기존 E browser block은 SHA256 `a120ba2f42173398acfeef0fd819521a6bf10d868303f3525cb96136c4a5ae7b`로 고정 대조하며 앞선 A–E assertion을 제거하지 않는다. 실제 PNG를 얻은 뒤 사람의 설명력 검토를 별도로 수행한다.

## 후속과 한계

전체 번호 장은12장으로 등록하지만 로컬/PR에서 구현한 범위와 실제 게시 범위를 구분한다. G는 전체 편집·알려진 강조 표시 수정·선택 SQL 묶음·완성 시점의 넓은 회귀를 맡는다. 실물 기기·스크린리더·PostgreSQL 설치 버전·SQL/driver·운영 migration·장애/복구·외부 결제는 미검증이다. 공식 문서 기준은 PostgreSQL18이며 문서 헤더의 새 버전 공지는 설치/실행 증거가 아니다.

## 로컬 자산과 영향 범위

- `index-BvpIbz6q.js`: 3572740bytes, SHA256 `44585ac051c525e6aca841d65dae95653913532fc53d056890d31545563e2504`.
- `index-CXOsTWlq.css`: 410490bytes, SHA256 `0f4a9698cec5e86db68fe072716667810e02ff722dc72008d513e2fd4990dcbd`.
- main358c59bb 대비39개 변경은 DB 전용 소스·검증·문서와 DB catalog/README 범위다. 다른 책의 catalog AST·공유 선언은 동일하며 D 실제 게시 마감 문서도 byte-identical로 보존했다. 영향 선택기는 `book-volumes`, `database`만 선택하고 나머지10suite를 명시적 미검사로 남긴다. 파일별 자격 증명 유사 패턴 검사의 후보 수는0이며 합성 fixture만 사용한다.

## 첫 실제 production과 직접 검토에서 발견한 문제

- PR78 head `c8e42c2b0d95cbfa3d1981f9513dc0f1e0b9d921`, tree `13da4f32b41585111c53b0e0b9d8ef0e5cbac839`, 실제 checkout `7c9c26f1f43baa42bf07e9b91d96a2fa6f0a8335`의 [run39417074031](https://github.com/Middleages/my-books/actions/runs/39417074031)은 전체1324/1324·TypeScript/Vite487모듈, DB641/641·720원본PNG, 권차14/14·51원본PNG를 통과했다. 두 브라우저 보고서는 clean checkout이며 DB의 page/console/resource 오류와 별도 진단 배열도 모두 비었다. PR이므로 deploy/published는 의도된 skip이다.
- DB artifact12262961921 ZIP SHA256 `b7853ca6d15f0a3f968d9f61b647f4347464a86a499491a583c740c2ee25cf5a`, 권차12261594012 ZIP SHA256 `9dbfb7d9c51167d587c62c9f83a012b8712a2cb02116b8748254c1c8c4229a6e`를 다운로드해 대조했다. 영향 선택은 book-volumes/database만이며 다른10종은 미검사이지 통과가 아니다.
- 직접 연 `1440-f12-compound-same-controlled-rerun.png`에서 정상 반환 B 경로와 별도 Q plan 경로가 한 요청의 연속 경로처럼 읽힐 수 있음을 발견했다. 당시 모델의 실행 ID가 정확하고 자동 검사가 통과한 사실로 설명력 문제를 덮지 않는다. 따라서 첫 실행은 최종 시각 통과 또는 게시 증거가 아니다.
- 최소 교정은 누적 관측 상자와 선택 실행의 경로를 분리하는 것이다. A/Q/B의 확인 경로 이력은 모두 보존하되 지도는 선택 증거의 실행에 해당하는 선만 그리고, 지도 제목과 각 선에 실행·요청 ID를 표시한다. 과거 A 증거를 고르면 A 경로로 돌아가며 B 정상 반환이 A나 Q를 고쳤다고 보이지 않는다. Pool 원본 그림의 설명도 현재 남은 요청 대여와 반환 후 남을 수 있는 idle session 연결을 구별하도록 고쳤다.
- 새 순수 모델 검사는 실행별 이력 보존과 서로 다른 요청의 연결 금지를 대조한다. 실제 browser 계약은 모든 증거 선택에서 표시 경로 집합·visible ID·기하학적 양끝·다른 경계 비관통을 검사하고, 복합 사례의 과거 A/Q/B 선택 원본도 추가 캡처한다. 기존 A–E 검사는 제거하지 않았다.
- 이 교정 후 focused14/14와 `node --test --test-concurrency=4 tests/*.test.mjs` 전체1325/1325(실패·취소·skip0)가 통과했다. 새 TypeScript/build와 실제 production·직접 교정 PNG는 다음 Actions에서 확인한다. 이전 build/PNG를 새 앱의 통과 증거로 재사용하지 않는다.

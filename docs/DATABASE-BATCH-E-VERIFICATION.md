# 데이터베이스 배치 E09–10 검증 기록

작성일2026-10-20. 범위는09 `durability-and-wal`,10 `backup-and-restore`이며 실제 PostgreSQL·백업·장애·복구 실험은 실행하지 않았다. 이 문서는 **실제 production 실행과 직접 시각 검토의 교정 기록**이다. E source gate·main·Pages 완료를 뜻하지 않는다.

## 상태와 기준

- 선행 D는 PR39 source `be3ee2647db82fabccacf5a0b8ce5236fcea1e8a`, run39393699945의 source gate와 직접 검토를 완료했다. D 공개 전 E를 main에 게시하지 않는다.
- E는 D source+closing docs `0e352a156f97a0e90c5c4683109e08b745dff21c`에서 별도 작업 트리로 준비한다. 병행 작업은 최신 main 위에 보존한다.
- C는 main47c36cc의 실제 게시416/416·259PNG와 직접6원본 검토를 완료했다. E의 로컬 구현이나 PR은 선행 장의 공개 완료를 대신하지 않는다.
- 모델25검사, DB focused203검사와 전체1194/1194 unit 검사가 로컬 통과했다. `npm run build`의 TypeScript·Vite 빌드도 성공했다. 공식 출처 링크·예측 선택·정적 표 검증·WAL 구간 사이 실제 끝점 연결을 추가한 최종 후보는 DB203/203과 TypeScript·Vite408모듈 빌드로 다시 확인했다. 실제 브라우저·직접 시각 검토는 아래 게이트를 실행한 뒤 정확한 실행 근거로 갱신한다.

## 구현과 불변식

09는 RAM·쓰기 cache·내구 storage의 생존 경계와 instance 정체성을 구분한다. 같은 상품의 v0/v1, WAL10/COMMIT20, pageLSN, 앱의 응답, 복구 후 가시성은 하나의 frame에서 나온다. WAL-before-data, 이미 반영된 page의 중복 redo 방지, 미확정 버전의 존재와 가시성, 응답 불명, 비동기 확정 손실, 로컬 장치 자체의 소실을 별도 반례로 검사한다. 실제 SQL 재실행·스토리지 내부 전체 구현이라고 주장하지 않는다.

10은 동일 상점의 별도 backup-day snapshot과 고정 새 주문6건을 사용한다. 논리 dump의 snapshot09:58와 완료10:00, 유효 physical base와 필요한 bootstrap WAL, 연속 prefix11/중간7누락시6을 구분한다. 복구 데이터 시점 차4/17/9분과 서비스 소요21분은 서로 다른 공통 축으로 그리며 초과분을 자르지 않는다. 새 복구 대상·자료 전달·주문 항목 FK·앱 읽기 경로를 실제 frame에 연결한다. 데이터가 유효해도 앱 권한이 누락되면20분 경과는 완료20분이 아니다. 사본까지 소실되면 모름을0으로 바꾸지 않는다.

로컬 영향 선택은 `[book-volumes, database]`이다. 보험·투자·세금·쿠버네티스·주거·회계의 브라우저 전체 회귀는 이번 배치에서 명시적으로 제외하며, 이들을 통과로 기록하지 않는다. 최신 main47의 해당 교재 소스·검증기와 공유 workflow는 변경하지 않았다.

## 첫 실제 production 실행과 교정

- [PR55](https://github.com/Middleages/my-books/pull/55) head `42b5db0a95472d1fbd2a6521eb5e3b91a70e70f3`, tree `247e76cdbc13864fde671f52189e72830ee60cf2`; [run39401601071](https://github.com/Middleages/my-books/actions/runs/39401601071)의 checkout/source는 `40f04d5cb9401ba0ba2bfa7b962ae85f120f55e0`이며 같은 tree다.
- 해당 실제 build1194/1194 unit·408모듈 통과. book-volumes14/14·39PNG·오류0 통과. `390-database-heading`, `320-reading-first` 원본2개와 긴 원본의 1:1 crop2개에서 DB4권·0/10·카탈로그 순서를 직접 확인했다. 모든39장을 직접 읽었다는 뜻은 아니다.
- DB는 **543/573 통과,30실패**, 원본502PNG를 남겼다. page/console/resource 오류는 모두0이다. artifact12256296653 ZIP SHA256 `d97e1d1b3513a3d4ef37afb357f4e7dbdbcba463336c53c7a2b31f94bbfa8b3a`를 내려받은 파일과 대조했다. 실패를 성공이나 생략으로 바꾸지 않았다.
- 실제 실패는 두 표시 원인이다. 10장 RTO 시간축 범례가150높이 SVG에서 바닥152.2–152.5까지 넘어갔다. 09장의 긴 설정명 출처 링크는320px에서 page scrollWidth352를 만들었다. E 전용 시간축 하단 여백과 두 장의 링크 줄바꿈 스타일로 교정하며 기존 SVG 경계·본문 넘침 assertion은 그대로 유지한다.
- 별도 실제 로컬 MDX SSR에서 WAL·RPO·RTO의 괄호 뒤 한글 조사가 Markdown 강조 구분자와 붙어 `**`가 글자로 남는 문제를 확인했다. 명시적 strong 요소로 고치고 실제 렌더의 강조·문단·확인 문제 검사와 browser의 원문 구분자 부재 검사를 추가했다. SSR 검사는 픽셀·브라우저·DB 실행으로 세지 않는다.
- 첫 실행의 실제09장 원본6개(1440 미확정 최종·cache 쓰기·장치 소실,390 응답 불명 최종·비동기 손실 최종,320 미확정 판정)와320의10장 정적 표 원본을 직접 열었다. 생존 경계·응답/확정·물리 버전/조회 구분은 확인했고, 모바일 가시성 그림이 상단 조작부에서 멀다는 점은 같은 player의 가까운 이전/다음 조작으로 보강한다. 별도 player나 판정은 만들지 않으며 실제 keyboard·단계/정지·장면 근접성 assertion을 추가한다. 이 부분 검토를 E 전체 시각 통과로 확대하지 않는다.
- 위 교정과 같은 player의 근접 조작을 포함한 후보는 전체1196/1196 unit(실패·생략0) 및 TypeScript·Vite408모듈 빌드를 다시 통과했다. 1440 미확정 최종과390 응답 불명 최종의 앞선 원본2개는 독립 교차 검토도 통과했으나, 추가한 근접 조작은 새 실제 캡처에서 검증할 때까지 미완료다.
- 첫 실패 때문에 10장 frame별 검사와 캡처는 전부 완료되지 않았다. 수정 후보는 모든 선택된 시나리오·키보드·정적 단계·관계 geometry를 다시 실행한 뒤 직접 원본을 검토해야 한다. 이 기록 시점의 후속 실제 검사 결과는 아직 없다.

## 두 번째 실제 production 성공과 남은 시각 교정

- 최신 공개 main `9c1df885218915bd368744e1420c3c17ce911fd1`의 병행 교재·공통 selector를 보존해 PR55 head `f147c888910d1a5b288c162188c6cf4e7e47ee1f`, tree `1457c29072f1783aa94a261190091572ae94a18d`로 통합했다. 중간 교정 head47b1ef2는 당시 main과 계획 문서 충돌로 실제 Actions run이 생성되지 않았으며, 이를 검사 통과로 기록하지 않는다.
- [run39406812656](https://github.com/Middleages/my-books/actions/runs/39406812656)의 checkout은 `cd5146c10c24985d0eb138808d91d106b5239fe9`이며 같은 tree다. 실제 전체 unit **1,228/1,228**, 실패·생략0, TypeScript·Vite434모듈 production build 성공이다. 같은 소스의 로컬 전체 unit은 통과했지만 Vite build 한 번은 Killed/exit137로 실패했고, 그 실패를 성공으로 세지 않았다. 실제 Actions build를 별도 증거로 사용한다.
- DB **576/576**, 원본581PNG, page/console/resource 오류0, clean checkout을 확인했다. artifact12257978419 ZIP SHA256 `eaf6dffdca4f2f674773ad3d0488de78113716f6e4ade4da7b504ea006b29db5`를 대조했다. 09의7시나리오와10의5시나리오 모든 frame, 각320/390/1440의 가까운 가시성 조작·키보드·동일 player 정지·기존 A–D 회귀가 실제 실행됐다.
- 권차14/14·51PNG·오류0이다.320 DB4권 라벨과 읽는 중 우선 홈 원본을 직접 확인했다. 실제 영향 선택은 `[book-volumes, database]`이고 나머지10개 available suite는 명시적 미실행이다. 이 실행은 PR production이며 main/Pages 게시 검사는 아니다.
- 제공된 JS `index-z5Bx8sS2.js` SHA256 `dc2a0aa65cc1e1b6eb0c34c83fdef972de3ff9ea2a9dec192a48484dac721592`, CSS `index-BFQjqFh-.css` SHA256 `95ffb320ecf55f01a7bc177b85985645c41dd598aac12f66f426e20c8a2b91d8`는 실제 제공/빌드 파일이 일치했다.
- DB 원본16개를 직접 열고 긴10장 원본3개를 원래 해상도의 crop으로 추가 확인했다.09의 cache 쓰기/장애/미확정/응답 불명/비동기 손실/장치 소실과 새 근접 조작,10의 연속/논리 dump/누락/소실/권한 실패 및 복사/재생을 포함한다. 앞선 출처 줄바꿈과 RTO 범례는 정상이다. 다만10장 데이터 축의 가까운09:58/10:00 라벨이 서로 겹치고, WAL 연결 경로가 기본 fill로 채워지는 표시 문제가 보였다. 자동 검사 성공과 별개로 **E 시각 게이트는 아직 미완료**다.
- 후속 교정은 같은 데이터 축의10:00 라벨만 아래쪽에 분리하고 base 표시 여백을 조절하며, WAL 연속선에 `fill="none"`을 지정한다. 좌표의 분 단위·사건·prefix·복구 판정은 바꾸지 않는다. 실제 SVG 라벨끼리의2px 간격·연속선 computed fill 검사와 source 회귀를 추가한다. 첫 실패의 bounds 검사와 기존576개 검사를 삭제하거나 완화하지 않는다. 수정 소스의 새 실제 원본에서 다시 확인한 뒤에만 완료할 수 있다.
- 이 라벨/선 교정의 로컬 전체 unit은1,229/1,229(실패·생략0), `NODE_OPTIONS=--max-old-space-size=2048 npm run build`의 TypeScript·Vite434모듈 빌드는 성공했다. 실제 후속 browser 결과는 아직 대기 중이다.

직접 본 두 번째 원본 파일(모두 `.png`):

- `320-e09-sources-wrap`, `390-e09-local-visibility`, `320-e09-local-visibility`
- `1440-e09-uncommitted-page-final`, `390-e09-sync-after-flush-before-ack-final`, `320-e09-storage-loss-final`, `320-e09-async-before-flush-final`, `1440-e09-sync-after-ack-cache-write`, `390-e09-sync-after-ack-crash`
- `320-e10-physical-continuous-final`, `390-e10-missing-wal-final`, `1440-e10-validation-failure-final`, `390-e10-logical-dump-final`, `320-e10-same-storage-lost-final`, `390-e10-physical-continuous-replay`, `320-e10-physical-continuous-copy`

## 확인할 실제 브라우저 게이트

- 1440·390·320px, normal/reduced motion, 키보드 포커스·단계·재생/정지·초기화·선택 변경·route 정리·정적 대안.
- 매 scenario의 모든 frame을 모델과 대조하고, 실제 SVG 경로의 출발/도착 경계·관계 정체성·사라진 경계·공통 분 눈금·초과량과 텍스트 경계를 검사한다.
- 본문·그림·표·공통 홈/권차/읽음·미지 readId 보존·오류·정확한 production/published assets.
- 실제 PNG를 열어 cache와 내구 영역, 응답과 확정, 미확정 새 버전과 조회5, 끊긴 WAL, 복사/재생 경로, 별도 대상의 FK, 앱 권한 경계, RPO/RTO와 조작 근접성을 사람이 따로 검토한다.
- 과거 A–D 핵심 assertion을 보존했다. D verifier block의 SHA256은 `34b46c175c313ff02016720a574f99c53c8922a146ba8f73c5451e95f3991972`이며 E source contract가 고정 대조한다.

## 미실행과 경계

로컬 Chromium 환경 문제를 통과로 세지 않는다. 실제 브라우저는 GitHub Actions의 production 빌드로 검증한다. 실물 기기·실제 스크린리더·PostgreSQL 엔진/driver·장치 crash·backup/restore·성능 측정은 미검증이다. 기본은 fsync on, synchronous_commit on, 정상 장치, 복제 없음이며 위험 설정을 실제 서버에 적용하지 않는다. 공식 근거와 확인일은 각 장에 분리했다.

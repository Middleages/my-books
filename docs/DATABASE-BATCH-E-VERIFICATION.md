# 데이터베이스 배치 E09–10 검증 기록

작성일2026-10-20. 범위는09 `durability-and-wal`,10 `backup-and-restore`이며 실제 PostgreSQL·백업·장애·복구 실험은 실행하지 않았다. 이 문서는 **로컬 후보 작성 중 기록**이고 production 브라우저·직접 PNG·main·Pages의 통과 기록이 아니다.

## 상태와 기준

- 선행 D는 PR39 source `be3ee2647db82fabccacf5a0b8ce5236fcea1e8a`, run39393699945의 source gate와 직접 검토를 완료했다. D 공개 전 E를 main에 게시하지 않는다.
- E는 D source+closing docs `0e352a156f97a0e90c5c4683109e08b745dff21c`에서 별도 작업 트리로 준비한다. 병행 작업은 최신 main 위에 보존한다.
- C는 main47c36cc의 실제 게시416/416·259PNG와 직접6원본 검토를 완료했다. E의 로컬 구현이나 PR은 선행 장의 공개 완료를 대신하지 않는다.
- 모델25검사, DB focused203검사와 전체1194/1194 unit 검사가 로컬 통과했다. `npm run build`의 TypeScript·Vite 빌드도 성공했다. 공식 출처 링크·예측 선택·정적 표 검증·WAL 구간 사이 실제 끝점 연결을 추가한 최종 후보는 DB203/203과 TypeScript·Vite408모듈 빌드로 다시 확인했다. 실제 브라우저·직접 시각 검토는 아래 게이트를 실행한 뒤 정확한 실행 근거로 갱신한다.

## 구현과 불변식

09는 RAM·쓰기 cache·내구 storage의 생존 경계와 instance 정체성을 구분한다. 같은 상품의 v0/v1, WAL10/COMMIT20, pageLSN, 앱의 응답, 복구 후 가시성은 하나의 frame에서 나온다. WAL-before-data, 이미 반영된 page의 중복 redo 방지, 미확정 버전의 존재와 가시성, 응답 불명, 비동기 확정 손실, 로컬 장치 자체의 소실을 별도 반례로 검사한다. 실제 SQL 재실행·스토리지 내부 전체 구현이라고 주장하지 않는다.

10은 동일 상점의 별도 backup-day snapshot과 고정 새 주문6건을 사용한다. 논리 dump의 snapshot09:58와 완료10:00, 유효 physical base와 필요한 bootstrap WAL, 연속 prefix11/중간7누락시6을 구분한다. 복구 데이터 시점 차4/17/9분과 서비스 소요21분은 서로 다른 공통 축으로 그리며 초과분을 자르지 않는다. 새 복구 대상·자료 전달·주문 항목 FK·앱 읽기 경로를 실제 frame에 연결한다. 데이터가 유효해도 앱 권한이 누락되면20분 경과는 완료20분이 아니다. 사본까지 소실되면 모름을0으로 바꾸지 않는다.

로컬 영향 선택은 `[book-volumes, database]`이다. 보험·투자·세금·쿠버네티스·주거·회계의 브라우저 전체 회귀는 이번 배치에서 명시적으로 제외하며, 이들을 통과로 기록하지 않는다. 최신 main47의 해당 교재 소스·검증기와 공유 workflow는 변경하지 않았다.

## 확인할 실제 브라우저 게이트

- 1440·390·320px, normal/reduced motion, 키보드 포커스·단계·재생/정지·초기화·선택 변경·route 정리·정적 대안.
- 매 scenario의 모든 frame을 모델과 대조하고, 실제 SVG 경로의 출발/도착 경계·관계 정체성·사라진 경계·공통 분 눈금·초과량과 텍스트 경계를 검사한다.
- 본문·그림·표·공통 홈/권차/읽음·미지 readId 보존·오류·정확한 production/published assets.
- 실제 PNG를 열어 cache와 내구 영역, 응답과 확정, 미확정 새 버전과 조회5, 끊긴 WAL, 복사/재생 경로, 별도 대상의 FK, 앱 권한 경계, RPO/RTO와 조작 근접성을 사람이 따로 검토한다.
- 과거 A–D 핵심 assertion을 보존했다. D verifier block의 SHA256은 `34b46c175c313ff02016720a574f99c53c8922a146ba8f73c5451e95f3991972`이며 E source contract가 고정 대조한다.

## 미실행과 경계

로컬 Chromium 환경 문제를 통과로 세지 않는다. 실제 브라우저는 GitHub Actions의 production 빌드로 검증한다. 실물 기기·실제 스크린리더·PostgreSQL 엔진/driver·장치 crash·backup/restore·성능 측정은 미검증이다. 기본은 fsync on, synchronous_commit on, 정상 장치, 복제 없음이며 위험 설정을 실제 서버에 적용하지 않는다. 공식 근거와 확인일은 각 장에 분리했다.

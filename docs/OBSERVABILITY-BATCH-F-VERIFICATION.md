# 관측 F · 폐쇄망 배치와 증거 진단

2026-10-20. 최신 main358c59bb를 읽고 AGENTS 해시가 기존 지침과 같음을 확인했다. 관측 E 최종 source gate를 선행으로11closed-network·12diagnosis를 별도 stacked 후보로 구현한다. 모델 계약은 `OBSERVABILITY-BATCH-F-MODEL-CONTRACT.md`다.

배치 실험은 앱 성공과 수집/신뢰/저장/조회 경계를 분리한다. instance 교체·volume 소실·CA 불신·시계 오차가 각기 다른 수량을 만들며 실제 보안 검사 우회 선택지는 없다. 진단은 선택한 질문과 인접 경계 두 증거만 공개하고 미확인 노드를 정상이나 원인으로 칠하지 않는다. CPU 한 값·상관관계로 원인을 확정하지 않는다.

새 모델6테스트 통과. 전체unit/build·productionbrowser·직접원본PNG는 아직 대기다.1440/390/320의 영향 책01–12와 홈/읽음/권차·정적/키보드/초기화/normal·reduced motion 및 book-volumes를 검사한다. 전체권 G 마감과 넓은 통합 회귀, 실제 main/Pages 공개 게이트는 별도다. 실제 반입/설치/운영/보안 설정/장애 대응은 실행하지 않았다.

## 소스 게이트 마감 · 2026-10-20 11:48 UTC

최초 CI는 네트워크 책과 Diagnosis import 이름이 겹치는 TypeScript 오류를 발견했다. 관측 binding만 ObservabilityDiagnosis로 구분해 수정했으며 기존 네트워크 binding은 보존했다. 수정 소스 c9e8a0c, PR75 head `c16f632e2ce2448bc2032c963fb7408ccbbf09b5`, tree `3b61d1be6d34a92f7a864893f3017fc664ab960a`의 run `39416564653`은 전체 unit/TypeScript/Vite build·관측 production·권차 검사를 통과했다. 전체 1,170 unit은 최초/로컬 실행에서도 통과했고 변경은 binding 이름뿐이다.

실제 production checkout `ed2fe689e9dc523d17e71e49933eff4d1239d329`의 tree가 위와 같고 clean이다. 관측 report는 50검사·240PNG·진단/오류0. artifact `12261603111` ZIP SHA-256 `8c0776e392ec02cec81fa035350710715417c25bf8d0476fcddeadd3031ee01e`를 확인했다.

직접 연 원본은 1440-deployment-kubernetes, 1440-diagnosis-dbwait, 320-deployment-collector, 390-deployment-volume, 320-diagnosis-cpu, 390-diagnosis-filter다. 모바일은 원본 픽셀 분할로 읽었다. 앱 성공과 수집 중단, Pod 교체와 별도 volume 소실, 기존3+신규2, 미확인 경계, CPU20%의 제한과 DB대기500ms의 원인 미확정, lab/staging 필터 차이가 분리되며 선택 범위의 겹침/잘림이 없었다. 직접6원본 외 자동 회귀의 모든 PNG를 수동 검토했다는 뜻은 아니다.

실제 Compose/Kubernetes/Alloy/Loki/Tempo/Mimir/Grafana 설치·실제 장애 주입·운영 변경은 미실행이다. source 검증 완료이며 main/Pages 검증은 별도다. 이후 G는 새 장 없이 전체권 편집과 선택 실습 설계 경계만 마감한다.

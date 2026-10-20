# 관측 D · 계측과 표본·전달

2026-10-20. 관측 C를 선행 의존으로07instrumentation·08sampling-and-delivery를 별도 후보에서 구현한다. 전체 본문/모델/시각화는 교육용 합성 자료이며 실제 SDK·OTLP·Alloy·저장소·장애 실습은 없다.

`OBSERVABILITY-BATCH-D-MODEL-CONTRACT.md`의 계약을 따른다. 브라우저와 서버 SDK를 별도 프로세스 경계로 표시하고 업무1회와 계측 기록 수를 분리한다. 자동/수동/중복/전파 누락과 resource 변경을 비교한다. 표본10trace와 전달5사건은 독립 실험이며 분모를 섞지 않는다. ACK 유실은 수신됨과 발신자 확인됨을 분리하고, 보존식은 배타적인 pending/acknowledged/dropped 상태로 검사한다. 수신 고유 사건·복사본·시도 횟수는 별도 수량이다.

모델5테스트가 통과했다. 전체 unit 및 build·production·직접 원본 PNG 게이트는 아직 진행 전/중이며 성공으로 기록하지 않는다. 영향 책01–08과 book-volumes를 검증하고, 기존 A/B/C의 스타일 영향도 확인한다. 1440/390/320·정적·키보드·초기화·재생 정지·감소된 움직임을 포함한다. 모바일의 긴 두 실험 사이에 동일 단계 제어를 반복해 변화 가까이서 조작하게 했다.

공식 근거: OpenTelemetry 계측·context propagation·sampling·collector resiliency, 2026-10-20 확인. 제품 기본값·성능값·실운영 권장 설정으로 합성 수치를 제시하지 않는다. main 통합·Pages 게시 완료는 별도 게이트다.

전체1158 unit tests 통과. 마지막 환경 선택 UI와 browser 검증기 연결을 포함한 정확한 소스의 build·production은 별도 draft PR CI에서 확인한다. 공용 자원을 중복 소비하지 않도록 로컬 build는 실행하지 않았다. 이 후보를 아직 게시 완료로 표시하지 않는다.

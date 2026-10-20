# 관측 F 모델 계약 · 배치와 증거 진단

2026-10-20. 관측 E 최종 CI39414523767과 직접 원본 검토를 선행으로11closed-network·12diagnosis를 구현한다. 실제 폐쇄망 반입·설치·네트워크·권한·운영 변경은 실행하지 않는다.

## 배치 모델

Compose와 Kubernetes의 논리 지도를 별도로 그린다. 외부 준비 → 승인된 반입 → 내부 registry/설정·의존성 → runtime → Alloy → 내부 저장소 → Grafana를 구별한다. 컨테이너/Pod의 교체 가능 신원과 stable service 이름, 수집기의 발견 책임, 저장 volume을 따로 표시한다. 두 환경 모두 단일 물리 호스트라는 교육 가정이며 HA를 주장하지 않는다.

네 단계: 기존3기록 → 조건 변화 → 새2사건 생성 → 수집·저장·조회 확인. mode는 정상/수집기 중단/인스턴스 교체/volume 소실/CA 불신/시간 오차. 인스턴스 교체는 service 이름을 보존하고 instance만 변경하며 기존 저장3기록은 지우지 않는다. 이 표본의 발견 설정은 최종 단계에 새 source를 발견한다. volume 소실은 기존3기록만 없애고 빈 새 저장소에 새2기록을 받을 수 있다. 수집 중단·CA 불신은 앱의 합성 응답 성공과 독립이며 새 수집0, 기존 저장3을 유지한다. 시간 오차는 저장5기록을 유지하되 새2기록이 조회 시간창에서 빠진다. 실제 시간 동기화·TLS를 구현한 것은 아니다.

각 node의 상태와 경계별 수량은 동일 frame을 읽는다. pending을 성공0으로 표시하지 않는다. trust 실패에서 우회·인증서 검사 해제 옵션은 제공하지 않는다. registry/CA/DNS/시각/volume/이미지·패키지·chart 버전/복구 자료의 반입 점검은 정적 체크리스트이며 실행 명령이 아니다. DaemonSet/중앙 gateway 배치의 권한·중복 수집 책임을 비교한다.

## 진단 모델

사례 A/B는 응답 지연, C/D는 대시보드 새 기록 없음이라는 시작 증상만 공개한다. request path와 telemetry path를 별도 행에 그리며, 조사하기 전 node는 unknown 점선이다. CPU/API/DB/collector/query 중 질문을 선택하고 네 단계로 증상 → 선택 증거 → 인접 경계 증거 → 현재 지지되는 결론을 읽는다. 선택한 질문마다 둘째 증거를 고정해 결정성을 유지한다. 전체 정답을 첫 그림 색으로 누설하지 않는다.

CPU20%만으로 원인을 확정하지 않는다. API600/DB80은 API 지연과 DB 밖의 설명되지 않은 시간이 있다는 증거이지 CPU 원인 확정이 아니다. API650/DB대기500은 대기가 큰 부분이라는 증거이지 잠금·부하 등의 근본 원인을 확정하지 않는다. collector의 새 수신0과 query0은 수집 경로 조사 필요, 저장5/조회필터staging·실제lab은 필터 불일치 근거다. 서로 다른 관측 경계의 증거를 섞지 않는다. 마지막 단계에서도 보지 않은 경계는 미확인이다. 실제 조치·자동 복구는 실행하지 않는다.

공식 자료(2026-10-20): Docker Compose networking, Kubernetes Persistent Volumes, Grafana Alloy Kubernetes deployment, OpenTelemetry Collector troubleshooting. 표본 수와 시간은 합성 가정이다.

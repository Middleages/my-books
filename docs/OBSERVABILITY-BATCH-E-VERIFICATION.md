# 관측 E · 대시보드와 알림

2026-10-20. 최신 main a2a0177을 읽어 지침과 병행 상태를 확인했다. 관측 D 최종 소스·직접 화면 검토를 선행으로09dashboards·10alerts를 별도 stacked 후보에 구현한다. main 쓰기는 하지 않는다.

모델 계약은 `OBSERVABILITY-BATCH-E-MODEL-CONTRACT.md`. 대시보드는12요청의 동일 시간창·환경·route에서 분자/분모/지연을 계산하고 별도 합성 예약 슬롯 포화도를 표시한다. 빈 결과는 알려진 요청0/오류0이지만 비율은 계산하지 않는다. 누락/조회 오류는 수치를 알 수 없음으로 표시한다. trace/log는 실제 fixture ID가 있을 때만 연결한다.

알림은 직전1분 관측 창,1/2분 평가 간격,0/2분 유지시간을 나눈다. 미평가는 직전 상태를 보존하고 자료 누락은 선택한 교육 정책에 따라 판단 불가·연속 대기 초기화로 처리한다. 통지·담당 확인·복구 성공은 별도 증거이며 이 실습에서는 실행하지 않는다.

모델5테스트 통과. 전체 unit/build·production browser·직접 원본 PNG는 아직 대기다. 실제 제품 설치/쿼리/메시지 전송·운영 변경·main/Pages 공개는 이 소스 게이트와 구분한다. 변경 검증은1440/390/320의 영향 책01–10·홈/읽음·정적·키보드·초기화·normal/reduced motion 및 book-volumes를 포함한다.

첫 CI39412575793에서 전체1163테스트/build·관측42검사195PNG·book-volumes가 성공했다. 직접1440 대시보드/발화,390 빈결과,320 누락/판단불가 원본을 확인했다. 모바일 상관 ID 없음의 물음표가 회전돼 보이는 점과 작은 그래프 축 글자를 발견해, 연결 없음은 평문을 유지하고 모바일 축 글자를 키웠다. 첫 본문 소제목도 페이지 제목과 중복되지 않게 바꾼다. 최종 소스 원본으로 다시 확인할 예정이다.

## 최종 E 소스 게이트

- PR70 최종 head `c3a4aab349be6a257832fc9dbe86f0555ad66cec`, tree `56b65ba7a129994af3e409abeddc505454ff2db8`. 로컬 소스 `1bd0aab5d831a1dfcf4ada049ed3a4b67a9add5a`.
- [CI39413275520](https://github.com/Middleages/my-books/actions/runs/39413275520) 전체 unit/build·관측·book-volumes 성공. 실제 checkout `39834a3208e3559cc6ccb48171bbde6edd8eba33`은 같은 tree, clean이다. 관측42검사195PNG, errors0.
- artifact `12260233123`, ZIP SHA256 `17fe4a4d75cc418c637070a47c8748a1ba8e15053465de58017fcce7699daaa6`.
- 최종 원본 `320-alerts-no-data.png`, `390-dashboard-empty.png`, `390-alerts-missed-spike.png`, `1440-alerts-firing.png`, `1440-dashboard-two.png`, `320-delivery-ack-pending.png` 핵심 구간을 직접 열었다. 긴 원본은 같은 픽셀의 세로 구간으로 나눠 확인했다. 모바일 축 글자가 읽히고, 연결 없음은 회전하지 않는 평문이며, 빈 결과0과 누락·발화·미평가가 분리된다. 기존 D의 저장됐지만 ACK가 없는 큐/수신 저장소 표시도 유지된다.
- 실제 Grafana/Tempo/Loki/Alertmanager 쿼리·알림 전송·복구는 실행하지 않았다. 이 기록은 후보 소스 검증이며 main 통합·실제 Pages 공개 완료는 별도다.

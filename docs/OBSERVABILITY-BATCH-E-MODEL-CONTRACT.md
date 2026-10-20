# 관측 E 모델 계약 · 질문과 대응

2026-10-20. D 선행 소스 이후09dashboards·10alerts를 별도 준비한다. 실제 Grafana 설정·알림 전송·운영 조치는 하지 않는다.

## 09 대시보드

고정12요청을 시각0–6분, 환경lab/staging, route/orders·/health에 배치한다. 화면의 모든 패널은 같은 half-open 시간창 [시작,끝), 같은 환경·route를 사용한다. 현재 시각6분에 창2/6분을 선택한다. 분자(오류 요청)와 분모(해당 요청)를 원본 ID 칩으로 표시하고 요청량·오류율·p95 지연·관측된 busy 슬롯 비율을 계산한다. 지연은 합성 원본 duration에서 nearest-rank로 계산하며 실제 histogram 추정이라고 부르지 않는다. busy 슬롯은 동일 창의 별도 합성 capacity 자료이고 요청 지연만으로 포화도를 추론하지 않는다.

정상/수집 누락/조회 오류/일치 요청 없음 상태를 구별한다. 일치0이면 요청량은0이고 오류율·p95는 분모 없음이다. 누락과 오류에는0을 넣지 않는다. 수집이 일부 빠진 경우 전체 오류율인 척하지 않도록 선택 상태는 이 실험에서 전체 query 자료 unavailable로 처리한다. 정상 데이터의 오류0과 no data는 다르다.

상관 연결은 실제 fixture에 exemplar trace ID와 동일 trace를 가진 log ID가 있는 경우만 만든다. 집계 panel을 클릭한다고 임의 trace/log를 생성하지 않는다. 환경·route·시간창에 맞지 않는 원본은 결과에서 제외하고 선택 조건과 결과 ID를 함께 보여 준다. 네 단계는 조건 선택→질의→결과→있는 상관 연결 확인. 모바일은 같은 창/필터 요약을 패널 가까이 반복한다.

## 10 알림 평가

시각0–5분의 각 평가 직전1분 구간에100요청을 고정하고 오류0/20을 배치한다. 가상 SLO99%의 설명과 오류율1% 초과 조건은 교육용이며 실제 장기 SLO 소진율 알림 설계를 대신하지 않는다. spike/지속/no data, 평가간격1/2분, 유지시간0/2분을 비교한다. SLI 관측창은 각1분, 평가간격은 언제 판단하는지, 유지시간은 얼마나 연속 조건이 유지돼야 firing인지 분리한다.

평가 시점에서 조건true면 since를 시작하고 now-since>=hold일 때 firing한다. false는 inactive로 되돌린다. no data는 unknown으로 표시하고 이 교육 정책에서는 pending 연속성을 끊는다. 이는 모든 Prometheus/Grafana 제품의 기본 no-data 정책이라는 주장이 아니다. 미평가 시점은 직전 alert 상태를 보존하되 ‘현재 미평가’를 붙이고 새 자료로 건강을 확정하지 않는다. no data와 정상0을 혼동하지 않는다.

고정0–5분 축에서 관측 오류율과 실제 평가 마커를 보여 주고, 현재 상태/마지막 평가/연속 시작 시각/담당 역할과 조치 순서를 가까이 둔다. firing은 알림 조건이지 담당자 수신이나 복구 성공이 아니다. 실제 담당자 연락처 대신 가상1차/백업 역할을 쓴다. 원본 지표→필터/누락 확인→사용자 영향→안전한 조치·확인 순서를 정적 문서로 남긴다.

## 공식 근거

2026-10-20 확인:
- https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/
- https://grafana.com/docs/grafana/latest/datasources/tempo/configure-tempo-data-source/
- https://grafana.com/docs/grafana/latest/alerting/fundamentals/alert-rule-evaluation/nodata-and-error-states/

제품 연결 설정과 정책의 상세값은 설치 버전 문서로 다시 확인한다. 데이터·수치·동작은 교육용 fixture이며 실제 Grafana·Alertmanager 호출이나 장애 대응 결과를 주장하지 않는다.

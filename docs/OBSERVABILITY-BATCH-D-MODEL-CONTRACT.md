# 관측 D 모델 계약 · 07 계측, 08 표본과 전달

2026-10-20. C 소스 게이트를 선행 의존으로 분리 준비한다. 이 문서는 구현 계약이며 SDK·collector·저장소 설치 또는 실제 운영 실험의 증거가 아니다.

## 07 instrumentation

고정 업무는 React의 한 주문 요청 → FastAPI HTTP 처리 → 주문 규칙 검증 → 응답이다. 모든 조작에서 업무 요청 수와 결과는 같다. 자동 HTTP 계측만/수동 업무 span 추가/자동 계측 중복/context 전파 누락을 비교한다. 정상 자동계측은 browser HTTP와 server HTTP 두 span, 수동 추가는 validate-order 한 span, 중복 사례는 server HTTP wrapper 하나를 더 기록한다. 같은 request를 두 번 처리한 것으로 해석하지 않는다.

4단계는 업무 시작 전, 요청 및 계측 발생, processor 대기, exporter를 통한 Alloy 수신이다. resource(service.name, deployment.environment.name)는 발생 주체, instrumentation scope는 어느 계측 라이브러리인지 구별한다. 서비스 이름·환경은 제한된 합성 선택지만 제공하고 업무 결과를 바꾸지 않는다. traceparent가 빠지면 서버는 새 trace를 시작하고 업무 요청은 여전히 실행된다.

화면은 업무 경로와 관측 경로를 별도 띠로 배치하고 연결선에는 ‘기록 생성’ 또는 ‘OTLP 전달’을 적는다. SDK/processor/exporter는 앱 프로세스 경계 안에, Alloy는 바깥에 둔다. OTel은 저장 제품이 아니고 OTLP는 전달 규약이라는 설명을 붙인다. 관측 경로의 선은 비즈니스 요청 자체가 지나가는 선이 아니다. 모바일은 같은 관계를 세로 배열하며 색 외 라벨과 경계를 유지한다.

안전 경계: header/body 원문 수집 옵션을 만들지 않는다. 민감정보는 종류 이름만으로 제외를 설명한다. 브라우저의 전파 허용 origin·CORS·TLS·collector 인증은 별도 운영 검토이며 무인증 공개 endpoint를 만들지 않는다. 예시 span 이름도 실제 개인정보를 포함하지 않는다.

검증: 조작마다 업무 요청수 불변, 수동 업무 span의 scope/parent, 중복 span≠중복 업무, 전파 누락의 별도 trace, resource 변경에도 업무/길이 불변. 실제 SDK의 모든 세부 처리를 재현하지 않는다.

## 08 sampling-and-delivery

서로 다른 질문인 표본 선택과 전달 실패를 두 개의 연결된 실험으로 분리한다. 표본 실험은 고정10trace, 오류2개. head의 결정적 mask는3개를 보관하고 오류를 모두 포함한다고 보장하지 않는다. tail 예시는 완료한 오류2개+정상1개를 보관하는 고정 정책이다. 전체 오류율20%와 선택 표본의 오류율을 따로 표시한다. tail은 기다릴 데이터와 메모리가 필요하며 실제 decision wait 이후 늦게 오는 span까지 모두 포착한다고 보장하지 않는다.

전달 실험은 서로 다른 사건5개를 생성하고 큐 용량3/5를 비교한다. 먼저 모두 큐에 넣으며 초과 사건은 drop한다. 다음 단계에서 저장소 중단/복구/응답 유실을 비교한다. 재시도 전송 횟수와 고유 사건 수를 다른 단위로 표시한다. 특히 ACK 유실 시 저장소에는 존재하지만 발신 큐에도 남을 수 있으므로 `generated = queued + delivered + dropped`를 단순한 물리 위치 수로 계산하면 이중 계산된다.

보존식은 각 고유 사건의 배타적인 논리 상태 pending/acknowledged/dropped로 정의해 generated = pending + acknowledged + dropped를 검사한다. 별도 수량으로 receiverUnique, receiverCopies, attempts를 둔다. ‘수신됨’과 ‘송신자가 확인함’을 분리한 ACK 유실 반례에서는 두 위치가 동시에 칠해질 수 있다. retry 뒤 receiverCopies는 늘어날 수 있지만 receiverUnique는 늘지 않는다. 중복 제거 정책은 실제 저장소마다 다르므로 합성 수신기는 기록 복사본을 허용한다고 명시한다.

화면에는 생성 원본5개, 큐의 실제 슬롯, 저장소의 수신 원본/복사본, ACK 화살표를 별도 배치한다. 고유 사건별 정적 표에 논리 상태와 수신 복사본 수를 함께 남긴다. 무한 재시도나 영구 무손실을 주장하지 않는다. timeout/drop 조건, 프로세스 재시작과 WAL은 설명 범위이며 실제 장애를 유발하지 않는다.

## 공식 근거 재확인

2026-10-20 확인:
- https://opentelemetry.io/docs/concepts/instrumentation/
- https://opentelemetry.io/docs/concepts/sampling/
- https://opentelemetry.io/docs/collector/resiliency/

위 자료에서 계측·head/tail 위치·큐 한계·retry/WAL의 한계를 확인했다. 구체적인 사건수·mask·큐 용량·단계·복사본 수는 직접 설계한 교육 fixture이며 공식 성능값이나 운영 권장 설정이 아니다.

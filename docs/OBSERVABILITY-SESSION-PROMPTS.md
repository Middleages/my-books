# 관측·로그·모니터링 — 배치별 실행 프롬프트

작성일 2026-10-20. **배치별 범위를 보관한 템플릿**이다. A 소개·01–02는 구현·단독 production·직접 화면 검토까지 마쳤으며, 실제 게시 상태는 A 검증 기록을 따른다. A–F 두 장씩, G 통합/선택 실습 설계 순서다. 아래 각 블록은 단독 복사 가능한 미래 요청 템플릿이며 현재 권한을 부여하지 않는다. 원격 게시를 기본 동작으로 포함하지 않는다.

## 배치 A — 소개 및 01 signals — 서비스에 무슨 일이 일어났을까?, 02 pipeline — 수집·저장·조회는 다른 일

```text
Middleages/my-books의 관측·로그·모니터링 교재 배치 A를 로컬 구현/검토해줘.
최신 main과 현재 worktree/병행 작업을 확인하고 독립 branch/worktree에서 진행해줘. 과거 SHA에 고정하거나 다른 세션 변경을 되돌리지 마.
AGENTS.md, docs/CONTENT-AUTHORING.md, docs/HOME-INFORMATION-ARCHITECTURE.md, docs/OBSERVABILITY-TEXTBOOK-PLAN.md, docs/OBSERVABILITY-SESSION-PROMPTS.md, 기존 배치 검증 문서와 관련 모델/UI/테스트를 먼저 읽어줘. DB/K8s 강화 시각 기준도 참조해줘.
이번 범위는 소개 및 01 signals — 서비스에 무슨 일이 일어났을까?, 02 pipeline — 수집·저장·조회는 다른 일만이야. 후속 배치/다른 책/전체 framework는 구현하지 마.
첫 배치이므로 공통 fixture/관찰 frame을 확정하고 bookId observability, technology 분야, 제안 volume 5의 최신 충돌 여부를 확인해줘. 기존 권차는 재번호화하지 마. 소개와 구현한 01–02만 로컬 catalog에 등록하고 후속 장/빈 링크를 노출하지 마. 첫 배치 표지는 직접 작성한 장식 SVG이며 중요한 기술 설명을 장식에 맡기지 마.
고유 장면 signals: 요청 원본을 가운데 두고 로그 사건점·지표 집계통·트레이스 시간막대로 갈라지는 세 투영을 그린다. 전체 모집단과 관측 표본 경계를 표시한다. 조작은 동일 10요청 중 오류2·지연1을 고정하고 신호 하나씩 숨긴다. 숫자 요약으로 특정 요청의 이유를 복원할 수 없음이 보인다. 모델 계약: signalFrames: requestIds, eventRefs, aggregates, spanRefs. 오류율 2/10과 로그 건수는 다른 단위다. 반드시 반례를 포함해줘: 로그가 많으면 관측이 완전하다는 반례. 샘플링/수집 누락을 정상 요청으로 취급하지 않는다. 정적/모바일 대안: 세 투영을 세로로 펼치고 같은 요청 강조를 유지; 정적 원본-투영 대응표.
고유 장면 pipeline: 앱/collector/신호별 저장소/조회 화면의 역할을 모양으로 구별한다. 로그→Loki, trace→Tempo, metric→Mimir로 분기하고 Grafana의 조회 왕복은 별도 점선이다. 조작은 기본은 앱→Alloy→각 저장소, Grafana→각 데이터소스. 한 저장소 또는 수집 경로를 끊어 다른 신호는 남게 한다. 모델 계약: pipelineFrames: edges, accepted, queued, persisted, queryable. 수집 수신과 영속 저장·조회 성공을 분리한다. 반드시 반례를 포함해줘: Grafana가 모든 원시 신호를 저장하거나 Alloy가 장기 저장소라는 오해. 필수 전제품 설치가 아님을 명시. 정적/모바일 대안: 좁은 화면은 신호 탭+공통 구성도; 정적 신호별 두 경로.
본문은 MDX, UI는 React/TypeScript, 결정적 순수 모델은 src/simulations/observability/의 .mjs/.d.mts로 분리해줘. fixture→events→frames를 그림/표/해설/판정이 같이 읽게 하고 unknown을 정상으로 표시하지 마. 날짜·난수·실서비스에 결과를 의존시키지 마.
눈으로 발견할 관계→시각 속성→고정/변경 조건→전후 차이→모델 필드를 먼저 정해줘. 같은 카드 문장 교체·입력폼/결과 숫자로 시각 설명을 대체하지 마. 연결선 끝점·방향·경계·시간축이 실제 모델과 맞아야 해. 한두 번 조작으로 기본 차이가 보이게 해줘.
재생/정지/이전/다음/다시 보기/전체 초기화, 설정 변경시 초기화·타이머 정리를 구현해줘. 모바일 390/320px은 단순 축소 말고 재배치하고 controls·현재 변화가 인접하게 해줘. 키보드·포커스·정적 단계/reduced-motion에서 같은 정보를 전달해줘.
공식 1차 자료를 다시 확인하고 장별 근거/확인일·모델 생략을 남겨줘. 브라우저 모델을 실제 제품/암호 검증으로 소개하지 마. 실제 credential/개인정보/사내주소 입력이나 외부 전송을 추가하지 마. 실제 설치·로그인·운영 변경은 별도 승인과 확인된 환경이 있을 때만 해줘.
검증은 정상/실패/경계/누락/재실행/초기화의 모델 테스트, 전체 npm test와 npm run build, git diff --check를 포함해줘. production 1440/390/320에서 이번 장·영향받은 홈/권차/읽음을 확인하고 초기/분기/실패/끝 PNG를 직접 열어 설명력도 검토해줘. G는 전체권 및 넓은 회귀를 수행해줘. 미실행/실패/환경 차단을 통과로 쓰지 마.
기존 URL·readId·my-books:read:v1·알 수 없는 읽음 ID·홈 책선택 구조를 유지해줘. 소개는 읽음 분모 제외, 실제 구현 장만 등록해줘.
원격 push/PR 생성/main merge/auto-merge/배포는 이 템플릿의 기본 범위가 아니야. 로컬 변경과 docs/OBSERVABILITY-BATCH-A-VERIFICATION.md를 전달하고 멈춰줘. 원격 반영이 별도 명시 승인된 경우에만 최신 main 통합·검증·정확한 Actions/Pages 자산 확인까지 하되 병행 작업 게시 창을 방해하지 마.
인계에는 기준 SHA·파일/IDs·검증 명령/환경/실제 결과·직접 시각 관찰·실습/게시 여부·미검증·다음 범위를 구분해줘. 막히면 정확한 작업/대상/이유와 완료 범위, 거절/승인대기/불확실을 보고해줘.
```

## 배치 B — 03 logs — 사건을 읽을 수 있게 남기기, 04 metrics — 숫자로 상태의 변화를 읽기

```text
Middleages/my-books의 관측·로그·모니터링 교재 배치 B를 로컬 구현/검토해줘.
최신 main과 현재 worktree/병행 작업을 확인하고 독립 branch/worktree에서 진행해줘. 과거 SHA에 고정하거나 다른 세션 변경을 되돌리지 마.
AGENTS.md, docs/CONTENT-AUTHORING.md, docs/HOME-INFORMATION-ARCHITECTURE.md, docs/OBSERVABILITY-TEXTBOOK-PLAN.md, docs/OBSERVABILITY-SESSION-PROMPTS.md, 기존 배치 검증 문서와 관련 모델/UI/테스트를 먼저 읽어줘. DB/K8s 강화 시각 기준도 참조해줘.
이번 범위는 03 logs — 사건을 읽을 수 있게 남기기, 04 metrics — 숫자로 상태의 변화를 읽기만이야. 후속 배치/다른 책/전체 framework는 구현하지 마.
선행 배치 A의 소스/모델/build/production/직접 시각 검토가 완료됐는지 확인해줘. 미완료면 이유를 알리고 먼저 같은 범위에서 해결해줘. 게시 대기와 검증 실패는 구별하고 승인 없이 게시하지 마.
고유 장면 logs: 시각·서비스·사건·route·trace_id 필드를 가진 합성 사건띠를 요청 경계와 연결한다. 발생 시각과 수집 시각을 두 축에 둔다. 조작은 지연 도착·중복·로그 레벨 변경·토큰 필드 포함/제거를 비교. allowlist 변환 전후에서 민감값이 수집 경계 전에 사라진다. 모델 계약: logFrames: eventTime, observedTime, eventId, safeFields. 로그 행 수를 요청 수로 세지 않으며 값은 모두 합성이다. 반드시 반례를 포함해줘: 같은 ERROR가 재시도로 두 줄; 성공 로그 부재는 실패 증거가 아님. 스택트레이스에도 비밀정보가 섞일 수 있음. 정적/모바일 대안: 원문은 접기; 필드별 세로 비교와 단계별 정적 안전처리표.
고유 장면 metrics: counter의 계단·재시작 경계, gauge 순간 수위, duration 분포를 별도 축으로 그린다. 100ms/1000ms 요청을 같은 공통 눈금에서 비교한다. 조작은 counter reset·scrape 누락·느린 꼬리·요청0을 바꾼다. 전체 분포와 평균만 남긴 그림을 비교한다. 모델 계약: metricFrames: samples, resetMarkers, bucketCounts, count, sum. rate 근사는 관측 간격 가정을 표시; 분모0은 미정이다. 반드시 반례를 포함해줘: 평균이 낮아도 일부는 느림; p95의 평균은 전체 p95가 아님. 버킷 추정 분위수와 정확한 fixture 분위수를 구분. 정적/모바일 대안: 그래프와 정적 표에 축/초/요청 단위; 모바일 두 그래프 세로 비교.
본문은 MDX, UI는 React/TypeScript, 결정적 순수 모델은 src/simulations/observability/의 .mjs/.d.mts로 분리해줘. fixture→events→frames를 그림/표/해설/판정이 같이 읽게 하고 unknown을 정상으로 표시하지 마. 날짜·난수·실서비스에 결과를 의존시키지 마.
눈으로 발견할 관계→시각 속성→고정/변경 조건→전후 차이→모델 필드를 먼저 정해줘. 같은 카드 문장 교체·입력폼/결과 숫자로 시각 설명을 대체하지 마. 연결선 끝점·방향·경계·시간축이 실제 모델과 맞아야 해. 한두 번 조작으로 기본 차이가 보이게 해줘.
재생/정지/이전/다음/다시 보기/전체 초기화, 설정 변경시 초기화·타이머 정리를 구현해줘. 모바일 390/320px은 단순 축소 말고 재배치하고 controls·현재 변화가 인접하게 해줘. 키보드·포커스·정적 단계/reduced-motion에서 같은 정보를 전달해줘.
공식 1차 자료를 다시 확인하고 장별 근거/확인일·모델 생략을 남겨줘. 브라우저 모델을 실제 제품/암호 검증으로 소개하지 마. 실제 credential/개인정보/사내주소 입력이나 외부 전송을 추가하지 마. 실제 설치·로그인·운영 변경은 별도 승인과 확인된 환경이 있을 때만 해줘.
검증은 정상/실패/경계/누락/재실행/초기화의 모델 테스트, 전체 npm test와 npm run build, git diff --check를 포함해줘. production 1440/390/320에서 이번 장·영향받은 홈/권차/읽음을 확인하고 초기/분기/실패/끝 PNG를 직접 열어 설명력도 검토해줘. G는 전체권 및 넓은 회귀를 수행해줘. 미실행/실패/환경 차단을 통과로 쓰지 마.
기존 URL·readId·my-books:read:v1·알 수 없는 읽음 ID·홈 책선택 구조를 유지해줘. 소개는 읽음 분모 제외, 실제 구현 장만 등록해줘.
원격 push/PR 생성/main merge/auto-merge/배포는 이 템플릿의 기본 범위가 아니야. 로컬 변경과 docs/OBSERVABILITY-BATCH-B-VERIFICATION.md를 전달하고 멈춰줘. 원격 반영이 별도 명시 승인된 경우에만 최신 main 통합·검증·정확한 Actions/Pages 자산 확인까지 하되 병행 작업 게시 창을 방해하지 마.
인계에는 기준 SHA·파일/IDs·검증 명령/환경/실제 결과·직접 시각 관찰·실습/게시 여부·미검증·다음 범위를 구분해줘. 막히면 정확한 작업/대상/이유와 완료 범위, 거절/승인대기/불확실을 보고해줘.
```

## 배치 C — 05 labels — 이름표가 너무 많아질 때, 06 traces — 한 요청의 여행을 따라가기

```text
Middleages/my-books의 관측·로그·모니터링 교재 배치 C를 로컬 구현/검토해줘.
최신 main과 현재 worktree/병행 작업을 확인하고 독립 branch/worktree에서 진행해줘. 과거 SHA에 고정하거나 다른 세션 변경을 되돌리지 마.
AGENTS.md, docs/CONTENT-AUTHORING.md, docs/HOME-INFORMATION-ARCHITECTURE.md, docs/OBSERVABILITY-TEXTBOOK-PLAN.md, docs/OBSERVABILITY-SESSION-PROMPTS.md, 기존 배치 검증 문서와 관련 모델/UI/테스트를 먼저 읽어줘. DB/K8s 강화 시각 기준도 참조해줘.
이번 범위는 05 labels — 이름표가 너무 많아질 때, 06 traces — 한 요청의 여행을 따라가기만이야. 후속 배치/다른 책/전체 framework는 구현하지 마.
선행 배치 B의 소스/모델/build/production/직접 시각 검토가 완료됐는지 확인해줘. 미완료면 이유를 알리고 먼저 같은 범위에서 해결해줘. 게시 대기와 검증 실패는 구별하고 승인 없이 게시하지 마.
고유 장면 labels: service×route×status의 조합 격자를 만들고 실제 관측된 조합만 채운다. 라벨 집합당 series/stream 공간이 갈라짐을 보인다. 조작은 route template / 원본 URL, 낮은 범주 / request_id를 선택한다. 라벨을 추가하기 전후 생긴 구획 수를 같은 눈금으로 비교. 모델 계약: cardinalityFrames: distinctTuples, potentialProduct, observedCount. 곱셈은 모든 조합 존재 시 상한 모델이며 실제 관측 수와 구별. 반드시 반례를 포함해줘: Loki index label과 structured metadata/본문 필드는 같지 않다. trace_id를 무조건 label로 올리지 않으며 바이트 비용을 개수로 단정하지 않음. 정적/모바일 대안: 격자 일부+전체 개수/분포를 세로 표시; 잘라 숨긴 칸 수 표시, 정적 tuple 목록.
고유 장면 traces: 브라우저/프록시/API/DB lane과 공통 ms 축, 부모-자식 span 막대 및 겹치는 시간을 그린다. trace context 이동을 별도 표식으로 표시. 조작은 직렬/병렬 호출·전파 누락·수집 누락을 바꾼다. 100ms와 150ms 자식이 겹치는 예를 첫 화면에 둔다. 모델 계약: traceFrames: start,end,parentId,traceId,received. elapsed=maxEnd-start이며 병렬 span 단순합 금지. 없는 span은 unknown. 반드시 반례를 포함해줘: 트레이스가 없다고 요청이 없었던 것은 아님. 시간 오차/비동기 link는 parent-child 트리만으로 완전히 표현되지 않음. 정적/모바일 대안: 세로 lane에서도 동일 축 비교 유지; 정적 waterfall과 시작/끝/부모표.
본문은 MDX, UI는 React/TypeScript, 결정적 순수 모델은 src/simulations/observability/의 .mjs/.d.mts로 분리해줘. fixture→events→frames를 그림/표/해설/판정이 같이 읽게 하고 unknown을 정상으로 표시하지 마. 날짜·난수·실서비스에 결과를 의존시키지 마.
눈으로 발견할 관계→시각 속성→고정/변경 조건→전후 차이→모델 필드를 먼저 정해줘. 같은 카드 문장 교체·입력폼/결과 숫자로 시각 설명을 대체하지 마. 연결선 끝점·방향·경계·시간축이 실제 모델과 맞아야 해. 한두 번 조작으로 기본 차이가 보이게 해줘.
재생/정지/이전/다음/다시 보기/전체 초기화, 설정 변경시 초기화·타이머 정리를 구현해줘. 모바일 390/320px은 단순 축소 말고 재배치하고 controls·현재 변화가 인접하게 해줘. 키보드·포커스·정적 단계/reduced-motion에서 같은 정보를 전달해줘.
공식 1차 자료를 다시 확인하고 장별 근거/확인일·모델 생략을 남겨줘. 브라우저 모델을 실제 제품/암호 검증으로 소개하지 마. 실제 credential/개인정보/사내주소 입력이나 외부 전송을 추가하지 마. 실제 설치·로그인·운영 변경은 별도 승인과 확인된 환경이 있을 때만 해줘.
검증은 정상/실패/경계/누락/재실행/초기화의 모델 테스트, 전체 npm test와 npm run build, git diff --check를 포함해줘. production 1440/390/320에서 이번 장·영향받은 홈/권차/읽음을 확인하고 초기/분기/실패/끝 PNG를 직접 열어 설명력도 검토해줘. G는 전체권 및 넓은 회귀를 수행해줘. 미실행/실패/환경 차단을 통과로 쓰지 마.
기존 URL·readId·my-books:read:v1·알 수 없는 읽음 ID·홈 책선택 구조를 유지해줘. 소개는 읽음 분모 제외, 실제 구현 장만 등록해줘.
원격 push/PR 생성/main merge/auto-merge/배포는 이 템플릿의 기본 범위가 아니야. 로컬 변경과 docs/OBSERVABILITY-BATCH-C-VERIFICATION.md를 전달하고 멈춰줘. 원격 반영이 별도 명시 승인된 경우에만 최신 main 통합·검증·정확한 Actions/Pages 자산 확인까지 하되 병행 작업 게시 창을 방해하지 마.
인계에는 기준 SHA·파일/IDs·검증 명령/환경/실제 결과·직접 시각 관찰·실습/게시 여부·미검증·다음 범위를 구분해줘. 막히면 정확한 작업/대상/이유와 완료 범위, 거절/승인대기/불확실을 보고해줘.
```

## 배치 D — 07 instrumentation — 앱에 관측 지점을 심기, 08 sampling-and-delivery — 놓친 신호와 늦게 온 신호

```text
Middleages/my-books의 관측·로그·모니터링 교재 배치 D를 로컬 구현/검토해줘.
최신 main과 현재 worktree/병행 작업을 확인하고 독립 branch/worktree에서 진행해줘. 과거 SHA에 고정하거나 다른 세션 변경을 되돌리지 마.
AGENTS.md, docs/CONTENT-AUTHORING.md, docs/HOME-INFORMATION-ARCHITECTURE.md, docs/OBSERVABILITY-TEXTBOOK-PLAN.md, docs/OBSERVABILITY-SESSION-PROMPTS.md, 기존 배치 검증 문서와 관련 모델/UI/테스트를 먼저 읽어줘. DB/K8s 강화 시각 기준도 참조해줘.
이번 범위는 07 instrumentation — 앱에 관측 지점을 심기, 08 sampling-and-delivery — 놓친 신호와 늦게 온 신호만이야. 후속 배치/다른 책/전체 framework는 구현하지 마.
선행 배치 C의 소스/모델/build/production/직접 시각 검토가 완료됐는지 확인해줘. 미완료면 이유를 알리고 먼저 같은 범위에서 해결해줘. 게시 대기와 검증 실패는 구별하고 승인 없이 게시하지 마.
고유 장면 instrumentation: 업무 요청 경로 옆에 SDK→processor→exporter→Alloy 경로를 배치. React 브라우저와 FastAPI 서버 경계를 분리한다. 조작은 자동 HTTP span / 주문 검증 수동 span, 중복 계측, traceparent 전파 차단을 비교. 서비스 이름·환경을 바꿔도 원래 업무 요청을 바꾸지 않는다. 모델 계약: instrumentationFrames: resources, instrumentationScope, spans, propagation. OTel은 저장 제품이 아니며 프로토콜 OTLP와 SDK 역할을 분리한다. 반드시 반례를 포함해줘: 모든 header/body 자동 수집 금지. 브라우저 계측은 전파 허용 origin·CORS·민감정보를 따로 검토; 공개 collector에 무인증 노출하지 않음. 정적/모바일 대안: 업무/관측 경로 전후 그림을 세로로; 정적 계측 책임표.
고유 장면 sampling-and-delivery: 생성→대기열→전송→저장→조회 시간선에 retained/dropped/retry를 구분한다. head 결정과 완료 후 tail 결정 위치가 다름을 보인다. 조작은 고정 10trace 중 보관3, 큐 용량3/생성5, 저장소 중단/복구를 선택. 재시도 중복 가능성을 남긴다. 모델 계약: deliveryFrames: generated=queued+delivered+dropped(고유 사건 기준). 재시도 attempts는 별도 수량; sample mask는 결정적. 반드시 반례를 포함해줘: 샘플링한 trace 오류율을 전체 오류율로 단정하지 않음. retry는 영구 무손실 보장이 아니며 tail 결정에는 대기/자원 비용이 듦. 정적/모바일 대안: 큐 슬롯과 초과 영역을 세로 표현; 정적 사건별 최종 위치표.
본문은 MDX, UI는 React/TypeScript, 결정적 순수 모델은 src/simulations/observability/의 .mjs/.d.mts로 분리해줘. fixture→events→frames를 그림/표/해설/판정이 같이 읽게 하고 unknown을 정상으로 표시하지 마. 날짜·난수·실서비스에 결과를 의존시키지 마.
눈으로 발견할 관계→시각 속성→고정/변경 조건→전후 차이→모델 필드를 먼저 정해줘. 같은 카드 문장 교체·입력폼/결과 숫자로 시각 설명을 대체하지 마. 연결선 끝점·방향·경계·시간축이 실제 모델과 맞아야 해. 한두 번 조작으로 기본 차이가 보이게 해줘.
재생/정지/이전/다음/다시 보기/전체 초기화, 설정 변경시 초기화·타이머 정리를 구현해줘. 모바일 390/320px은 단순 축소 말고 재배치하고 controls·현재 변화가 인접하게 해줘. 키보드·포커스·정적 단계/reduced-motion에서 같은 정보를 전달해줘.
공식 1차 자료를 다시 확인하고 장별 근거/확인일·모델 생략을 남겨줘. 브라우저 모델을 실제 제품/암호 검증으로 소개하지 마. 실제 credential/개인정보/사내주소 입력이나 외부 전송을 추가하지 마. 실제 설치·로그인·운영 변경은 별도 승인과 확인된 환경이 있을 때만 해줘.
검증은 정상/실패/경계/누락/재실행/초기화의 모델 테스트, 전체 npm test와 npm run build, git diff --check를 포함해줘. production 1440/390/320에서 이번 장·영향받은 홈/권차/읽음을 확인하고 초기/분기/실패/끝 PNG를 직접 열어 설명력도 검토해줘. G는 전체권 및 넓은 회귀를 수행해줘. 미실행/실패/환경 차단을 통과로 쓰지 마.
기존 URL·readId·my-books:read:v1·알 수 없는 읽음 ID·홈 책선택 구조를 유지해줘. 소개는 읽음 분모 제외, 실제 구현 장만 등록해줘.
원격 push/PR 생성/main merge/auto-merge/배포는 이 템플릿의 기본 범위가 아니야. 로컬 변경과 docs/OBSERVABILITY-BATCH-D-VERIFICATION.md를 전달하고 멈춰줘. 원격 반영이 별도 명시 승인된 경우에만 최신 main 통합·검증·정확한 Actions/Pages 자산 확인까지 하되 병행 작업 게시 창을 방해하지 마.
인계에는 기준 SHA·파일/IDs·검증 명령/환경/실제 결과·직접 시각 관찰·실습/게시 여부·미검증·다음 범위를 구분해줘. 막히면 정확한 작업/대상/이유와 완료 범위, 거절/승인대기/불확실을 보고해줘.
```

## 배치 E — 09 dashboards — 질문이 있는 화면 만들기, 10 alerts — 알림에서 대응까지

```text
Middleages/my-books의 관측·로그·모니터링 교재 배치 E를 로컬 구현/검토해줘.
최신 main과 현재 worktree/병행 작업을 확인하고 독립 branch/worktree에서 진행해줘. 과거 SHA에 고정하거나 다른 세션 변경을 되돌리지 마.
AGENTS.md, docs/CONTENT-AUTHORING.md, docs/HOME-INFORMATION-ARCHITECTURE.md, docs/OBSERVABILITY-TEXTBOOK-PLAN.md, docs/OBSERVABILITY-SESSION-PROMPTS.md, 기존 배치 검증 문서와 관련 모델/UI/테스트를 먼저 읽어줘. DB/K8s 강화 시각 기준도 참조해줘.
이번 범위는 09 dashboards — 질문이 있는 화면 만들기, 10 alerts — 알림에서 대응까지만이야. 후속 배치/다른 책/전체 framework는 구현하지 마.
선행 배치 D의 소스/모델/build/production/직접 시각 검토가 완료됐는지 확인해줘. 미완료면 이유를 알리고 먼저 같은 범위에서 해결해줘. 게시 대기와 검증 실패는 구별하고 승인 없이 게시하지 마.
고유 장면 dashboards: 동일 요청 fixture에서 요청량·오류율·지연·포화도를 공통 시간창으로 배치하고 metric→trace→log 연결에 실제 상관 ID를 표시한다. 조작은 시간창·환경·route 필터를 한 번에 하나씩 변경. 데이터 없음/0/오류를 서로 다른 상태로 그린다. 모델 계약: dashboardFrames: queryWindow, matchedIds, numerator,denominator,missing. metric exemplar/trace-log 연계는 해당 정보가 있을 때만 연결. 반드시 반례를 포함해줘: Grafana 화면 정상은 앱 정상과 다름. 필터 불일치·시계 오차로 관련 로그를 못 찾을 수 있음. 정적/모바일 대안: 패널 순서 고정 세로 재배치; 정적 분자/분모/기간 요약표.
고유 장면 alerts: SLI 관측 창, 목표선, alert inactive/pending/firing을 시간선으로 연결하고 담당자/조치 문서를 옆에 둔다. 조작은 순간 spike/지속 오류·평가 간격·유지시간·no data를 바꾼다. 가상 SLO 99%는 교육 값임을 표시. 모델 계약: alertFrames: evaluations, conditionSince, state, coverage. pending 시작/해제와 데이터누락을 명시; 영업시간·샘플 부족 가정 표시. 반드시 반례를 포함해줘: 알림 발생은 자동 복구가 아님. 긴 유지시간이 짧은 대형 장애를 숨길 수 있음. 두 사람 팀의 알림 과부하와 우선순위를 함께 다룸. 정적/모바일 대안: 정적 평가시점표/상태 띠; 모바일 상태와 직전 증거를 같은 화면에.
본문은 MDX, UI는 React/TypeScript, 결정적 순수 모델은 src/simulations/observability/의 .mjs/.d.mts로 분리해줘. fixture→events→frames를 그림/표/해설/판정이 같이 읽게 하고 unknown을 정상으로 표시하지 마. 날짜·난수·실서비스에 결과를 의존시키지 마.
눈으로 발견할 관계→시각 속성→고정/변경 조건→전후 차이→모델 필드를 먼저 정해줘. 같은 카드 문장 교체·입력폼/결과 숫자로 시각 설명을 대체하지 마. 연결선 끝점·방향·경계·시간축이 실제 모델과 맞아야 해. 한두 번 조작으로 기본 차이가 보이게 해줘.
재생/정지/이전/다음/다시 보기/전체 초기화, 설정 변경시 초기화·타이머 정리를 구현해줘. 모바일 390/320px은 단순 축소 말고 재배치하고 controls·현재 변화가 인접하게 해줘. 키보드·포커스·정적 단계/reduced-motion에서 같은 정보를 전달해줘.
공식 1차 자료를 다시 확인하고 장별 근거/확인일·모델 생략을 남겨줘. 브라우저 모델을 실제 제품/암호 검증으로 소개하지 마. 실제 credential/개인정보/사내주소 입력이나 외부 전송을 추가하지 마. 실제 설치·로그인·운영 변경은 별도 승인과 확인된 환경이 있을 때만 해줘.
검증은 정상/실패/경계/누락/재실행/초기화의 모델 테스트, 전체 npm test와 npm run build, git diff --check를 포함해줘. production 1440/390/320에서 이번 장·영향받은 홈/권차/읽음을 확인하고 초기/분기/실패/끝 PNG를 직접 열어 설명력도 검토해줘. G는 전체권 및 넓은 회귀를 수행해줘. 미실행/실패/환경 차단을 통과로 쓰지 마.
기존 URL·readId·my-books:read:v1·알 수 없는 읽음 ID·홈 책선택 구조를 유지해줘. 소개는 읽음 분모 제외, 실제 구현 장만 등록해줘.
원격 push/PR 생성/main merge/auto-merge/배포는 이 템플릿의 기본 범위가 아니야. 로컬 변경과 docs/OBSERVABILITY-BATCH-E-VERIFICATION.md를 전달하고 멈춰줘. 원격 반영이 별도 명시 승인된 경우에만 최신 main 통합·검증·정확한 Actions/Pages 자산 확인까지 하되 병행 작업 게시 창을 방해하지 마.
인계에는 기준 SHA·파일/IDs·검증 명령/환경/실제 결과·직접 시각 관찰·실습/게시 여부·미검증·다음 범위를 구분해줘. 막히면 정확한 작업/대상/이유와 완료 범위, 거절/승인대기/불확실을 보고해줘.
```

## 배치 F — 11 closed-network — Compose에서 폐쇄망 Kubernetes로, 12 diagnosis — 증거로 장애 범위 좁히기

```text
Middleages/my-books의 관측·로그·모니터링 교재 배치 F를 로컬 구현/검토해줘.
최신 main과 현재 worktree/병행 작업을 확인하고 독립 branch/worktree에서 진행해줘. 과거 SHA에 고정하거나 다른 세션 변경을 되돌리지 마.
AGENTS.md, docs/CONTENT-AUTHORING.md, docs/HOME-INFORMATION-ARCHITECTURE.md, docs/OBSERVABILITY-TEXTBOOK-PLAN.md, docs/OBSERVABILITY-SESSION-PROMPTS.md, 기존 배치 검증 문서와 관련 모델/UI/테스트를 먼저 읽어줘. DB/K8s 강화 시각 기준도 참조해줘.
이번 범위는 11 closed-network — Compose에서 폐쇄망 Kubernetes로, 12 diagnosis — 증거로 장애 범위 좁히기만이야. 후속 배치/다른 책/전체 framework는 구현하지 마.
선행 배치 E의 소스/모델/build/production/직접 시각 검토가 완료됐는지 확인해줘. 미완료면 이유를 알리고 먼저 같은 범위에서 해결해줘. 게시 대기와 검증 실패는 구별하고 승인 없이 게시하지 마.
고유 장면 closed-network: 개발 PC/반입 매체/사내 registry/VM·Pod/내부 저장소 경계와 runtime·CA·DNS·시각 의존성 지도를 분리한다. Compose 서비스명과 K8s discovery도 비교. 조작은 Pod 교체·수집기 중단·volume 소실·CA 불신·시간 오차를 하나씩 바꾼다. 앱은 살아 있고 수집만 끊긴 경우부터 시작. 모델 계약: deploymentFrames: sourceIdentity, collectorCoverage, persistedVolume, trustChecks. Pod 교체와 보관 데이터 삭제를 동일 사건으로 처리하지 않음. 반드시 반례를 포함해줘: 단일 VM에 여러 제품을 설치해도 HA가 아님. DaemonSet/중앙 gateway는 배치 선택이지 자동 정답이 아니며 중복 수집·RBAC 범위를 확인. 정적/모바일 대안: 환경별 세로 지도와 반입 checklist; 정적 이전 전후 수집/보관 책임표.
고유 장면 diagnosis: 요청 경로와 관측 경로를 겹치지 않게 나란히 두고 조사한 경계만 확정한다. API 지연·DB 대기·collector 중단·쿼리 필터 오류의 증거를 단계 공개. 조작은 질문/관측 위치 선택→새 증거→가설 수정. 관련 없는 CPU 그래프 하나로 원인을 확정하면 이유와 추가 확인을 제시. 모델 계약: diagnosisFrames: observedEvidence, supportedClaims, unknowns. 앞 장 모델 재사용; 증거 열기 전 답을 초록 경로로 누설하지 않음. 반드시 반례를 포함해줘: 상관관계는 원인 확정이 아님. 진단 결과는 다음 확인/완화 선택지이며 실제 운영 변경을 실행하지 않는다. 정적/모바일 대안: 정적 증거 지도+추론표; 모바일은 현재 질문과 새 증거를 인접 배치.
본문은 MDX, UI는 React/TypeScript, 결정적 순수 모델은 src/simulations/observability/의 .mjs/.d.mts로 분리해줘. fixture→events→frames를 그림/표/해설/판정이 같이 읽게 하고 unknown을 정상으로 표시하지 마. 날짜·난수·실서비스에 결과를 의존시키지 마.
눈으로 발견할 관계→시각 속성→고정/변경 조건→전후 차이→모델 필드를 먼저 정해줘. 같은 카드 문장 교체·입력폼/결과 숫자로 시각 설명을 대체하지 마. 연결선 끝점·방향·경계·시간축이 실제 모델과 맞아야 해. 한두 번 조작으로 기본 차이가 보이게 해줘.
재생/정지/이전/다음/다시 보기/전체 초기화, 설정 변경시 초기화·타이머 정리를 구현해줘. 모바일 390/320px은 단순 축소 말고 재배치하고 controls·현재 변화가 인접하게 해줘. 키보드·포커스·정적 단계/reduced-motion에서 같은 정보를 전달해줘.
공식 1차 자료를 다시 확인하고 장별 근거/확인일·모델 생략을 남겨줘. 브라우저 모델을 실제 제품/암호 검증으로 소개하지 마. 실제 credential/개인정보/사내주소 입력이나 외부 전송을 추가하지 마. 실제 설치·로그인·운영 변경은 별도 승인과 확인된 환경이 있을 때만 해줘.
검증은 정상/실패/경계/누락/재실행/초기화의 모델 테스트, 전체 npm test와 npm run build, git diff --check를 포함해줘. production 1440/390/320에서 이번 장·영향받은 홈/권차/읽음을 확인하고 초기/분기/실패/끝 PNG를 직접 열어 설명력도 검토해줘. G는 전체권 및 넓은 회귀를 수행해줘. 미실행/실패/환경 차단을 통과로 쓰지 마.
기존 URL·readId·my-books:read:v1·알 수 없는 읽음 ID·홈 책선택 구조를 유지해줘. 소개는 읽음 분모 제외, 실제 구현 장만 등록해줘.
원격 push/PR 생성/main merge/auto-merge/배포는 이 템플릿의 기본 범위가 아니야. 로컬 변경과 docs/OBSERVABILITY-BATCH-F-VERIFICATION.md를 전달하고 멈춰줘. 원격 반영이 별도 명시 승인된 경우에만 최신 main 통합·검증·정확한 Actions/Pages 자산 확인까지 하되 병행 작업 게시 창을 방해하지 마.
인계에는 기준 SHA·파일/IDs·검증 명령/환경/실제 결과·직접 시각 관찰·실습/게시 여부·미검증·다음 범위를 구분해줘. 막히면 정확한 작업/대상/이유와 완료 범위, 거절/승인대기/불확실을 보고해줘.
```

## 배치 G — 소개·12장 전체 편집/통합 점검 및 선택 실습 패키지 설계

```text
Middleages/my-books의 관측·로그·모니터링 교재 배치 G를 로컬 구현/검토해줘.
최신 main과 현재 worktree/병행 작업을 확인하고 독립 branch/worktree에서 진행해줘. 과거 SHA에 고정하거나 다른 세션 변경을 되돌리지 마.
AGENTS.md, docs/CONTENT-AUTHORING.md, docs/HOME-INFORMATION-ARCHITECTURE.md, docs/OBSERVABILITY-TEXTBOOK-PLAN.md, docs/OBSERVABILITY-SESSION-PROMPTS.md, 기존 배치 검증 문서와 관련 모델/UI/테스트를 먼저 읽어줘. DB/K8s 강화 시각 기준도 참조해줘.
이번 범위는 소개·12장 전체 편집/통합 점검 및 선택 실습 패키지 설계만이야. 후속 배치/다른 책/전체 framework는 구현하지 마.
선행 배치 F의 소스/모델/build/production/직접 시각 검토가 완료됐는지 확인해줘. 미완료면 이유를 알리고 먼저 같은 범위에서 해결해줘. 게시 대기와 검증 실패는 구별하고 승인 없이 게시하지 마.
새 번호 장은 추가하지 마. 12장 전체의 용어·상호 링크·역할/시간/신뢰 경계·단위·반례·가정·실제 공개 범위를 대조해줘. examples/observability/ 후보는 합성 자료만 사용하고 README에 버전/tag/digest·실행 위치·선행 조건·예상 관측·안전한 정리 범위를 적어줘. 실제 환경이 없으면 미실행으로 남기고 설치/운영 연결을 하지 마. 넓은 기존 책 회귀와 전체 편집 기록을 남겨줘.
본문은 MDX, UI는 React/TypeScript, 결정적 순수 모델은 src/simulations/observability/의 .mjs/.d.mts로 분리해줘. fixture→events→frames를 그림/표/해설/판정이 같이 읽게 하고 unknown을 정상으로 표시하지 마. 날짜·난수·실서비스에 결과를 의존시키지 마.
눈으로 발견할 관계→시각 속성→고정/변경 조건→전후 차이→모델 필드를 먼저 정해줘. 같은 카드 문장 교체·입력폼/결과 숫자로 시각 설명을 대체하지 마. 연결선 끝점·방향·경계·시간축이 실제 모델과 맞아야 해. 한두 번 조작으로 기본 차이가 보이게 해줘.
재생/정지/이전/다음/다시 보기/전체 초기화, 설정 변경시 초기화·타이머 정리를 구현해줘. 모바일 390/320px은 단순 축소 말고 재배치하고 controls·현재 변화가 인접하게 해줘. 키보드·포커스·정적 단계/reduced-motion에서 같은 정보를 전달해줘.
공식 1차 자료를 다시 확인하고 장별 근거/확인일·모델 생략을 남겨줘. 브라우저 모델을 실제 제품/암호 검증으로 소개하지 마. 실제 credential/개인정보/사내주소 입력이나 외부 전송을 추가하지 마. 실제 설치·로그인·운영 변경은 별도 승인과 확인된 환경이 있을 때만 해줘.
검증은 정상/실패/경계/누락/재실행/초기화의 모델 테스트, 전체 npm test와 npm run build, git diff --check를 포함해줘. production 1440/390/320에서 이번 장·영향받은 홈/권차/읽음을 확인하고 초기/분기/실패/끝 PNG를 직접 열어 설명력도 검토해줘. G는 전체권 및 넓은 회귀를 수행해줘. 미실행/실패/환경 차단을 통과로 쓰지 마.
기존 URL·readId·my-books:read:v1·알 수 없는 읽음 ID·홈 책선택 구조를 유지해줘. 소개는 읽음 분모 제외, 실제 구현 장만 등록해줘.
원격 push/PR 생성/main merge/auto-merge/배포는 이 템플릿의 기본 범위가 아니야. 로컬 변경과 docs/OBSERVABILITY-BATCH-G-VERIFICATION.md를 전달하고 멈춰줘. 원격 반영이 별도 명시 승인된 경우에만 최신 main 통합·검증·정확한 Actions/Pages 자산 확인까지 하되 병행 작업 게시 창을 방해하지 마.
인계에는 기준 SHA·파일/IDs·검증 명령/환경/실제 결과·직접 시각 관찰·실습/게시 여부·미검증·다음 범위를 구분해줘. 막히면 정확한 작업/대상/이유와 완료 범위, 거절/승인대기/불확실을 보고해줘.
```

## 후속 승인 · 2026-10-20

계획 반영과 완성된 계획의 구현 시작이 승인됐다. 앞선 미반영 기록은 계획 작성 당시 상태다. 관측 A 소개·01–02부터 별도 작업하고 인증은 계획/모델 계약을 먼저 유지한다. 미래 세 주제는 로드맵만이며 본문 구현 대상이 아니다. 원격 계획 PR은 준비할 수 있지만 main 통합·배포는 담당자의 직렬 게시 창에서만 진행한다. 이 문서 자체가 실제 스택·사내 SSO 연동을 승인하지 않는다.

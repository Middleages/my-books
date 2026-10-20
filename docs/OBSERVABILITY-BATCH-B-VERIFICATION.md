# 관측 B — 03 로그·04 지표

2026-10-20. 최신 main `d76ed55e9969108449124a154c7c67e946068740`과 관측 A 소스를 독립 작업트리에 통합했다. **PR42 후보 검증 중, main/Pages 미게시.** 인증은 아직 모델 계약뿐이다.

## 선행과 범위

A PR35 tree `b52b7a4774cd4e79827dbf2a7ddfe71262c9ea29`는 전체 unit/build, production browser 9개 회귀, 직접 원본 PNG 검토 완료. A main/Pages는 직렬 후속 게시 창 대기다. B는 03 logs와04 metrics만 추가하고 기존 ID·권차·읽음 구조를 보존한다.

## 시각 계약

- logs: 같은 사건의 발생 원과 관측 네모를 0–5초 공통 축에 연결. r1/r2 요청 경계·e2 중복·INFO 제외를 구별한다. 허용 목록 전후 필드 비교는 수집 전 제거 경계를 보여주며 실제 비밀값을 만들지 않는다.
- metrics: counter 관측 계단과 gauge 순간 수위를 별도 0–12건 축으로 비교. 재시작 하강 점선, 누락 물음표와 끊긴 선. 요청 12개의 고정 duration fixture에서 단계별 prefix를 읽고 0–1,000ms 공통 길이로 평균과 느린 꼬리를 비교한다.
- 순수 모델의 같은 frame을 그림·텍스트·정적 표가 사용한다. controls 재생/정지/이전/다음/다시보기/전체초기화, 설정 변경 초기화, 모바일 세로 재배치를 제공한다.

## 경계

실제 앱 계측·Alloy 변환·Prometheus/Mimir 수집·PromQL·비밀탐지·SSO는 실행하지 않았다. rate는 두 끝점 근사, p95는 정확한 합성 표본 순위이며 버킷 추정과 다름을 본문/모델에 명시한다. 누락은0이 아니며 허용된 필드도 값 안전성 검토가 별도로 필요하다.

## 검증

소스 commit `688f0f1`에서 전체 unit 1076/1076, TypeScript/Vite build, browser verifier 문법 검사, git diff --check 통과. PR42 head `318ea43b3e041cefbae945cc27c74db673dcf85a`, tree `478d83c7814d092237a0437985d177270ec6538e`에서 run `39393987443` 관측 production browser 통과: Chromium155.0.8059.84, 검사18묶음, 69 PNG, 오류·진단0. artifact `12250234936` ZIP SHA256 `edc281e56e209ee5e77b45100ed440a83013e579265792eb6fd4faf03a310127`. 원본 desktop 초기/지연/완료와 320/390px 중복·필드제거·재시작·누락·느린꼬리·0건·정적표를 직접 열어 역할/동일축/잘림/설명력을 확인했다. 초기 후보 run39393987443의 넓은9개 회귀도 완료/success를 확인했다. 다만 아래에서 발견한 내용일치 문제를 수정한 새 후보는 별도 production 재검증이 필요하다. 이 문서의 구현 상태를 공개 성공이나 실제 스택 실습 성공으로 해석하지 않는다.


## 내용 대조에서 발견한 추가 수정

첫 browser 통과 뒤 모델을 다시 대조해 scrape 누락이 counter만 미정으로 만들고 gauge를 남기는 의미 불일치를 발견했다. 같은20초 scrape에서 두 지표를 모두 null로 만들고 정적표·SVG 물음표·모델 회귀·browser assertion을 함께 고쳤다. 또한 요청별 duration 막대는 수집 누락을 복원한 값이 아니라 교재가 알고 있는 합성 원본임을 그림 가까이에 명시했다. 초기 production 통과가 이 의미 검증을 대신하지 않으며 수정 후 production/직접 PNG를 다시 확인해야 한다.

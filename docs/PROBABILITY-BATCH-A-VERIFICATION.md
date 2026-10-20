# 확률과 금융 의사결정 A — 검증 기록

2026-10-20. 범위: 소개, 01 `averages-and-distributions`, 02 `losses-and-liquidity`. bookId `probability`, money 8권, 읽음 분모2. 기준 계획 PR #31 head `e0f60e84404dbd72fc64118421f2752c658a165c` (main 기반 `05270dda25437a4529186ee0f3036948c352b7fb`).

## 구현과 시각 계약

- 01: 동일 금액축의 가구 점·평균 실선·중앙 점선, 가운데 두 순위, 같은 구간 폭의 건수 막대. 큰 값 한 건과 구간 폭의 효과를 분리한다. 전체 원자료·요약·정적 단계가 같은 모델이다.
- 02: 확률 막대와 금액 막대를 다른 단위로 분리, 확정 유입일/납기, 같은 금액축의 충당·미충당·현금 경계. 날짜 그림은 지출 전 가용액 비교이며 손실 후 연속 잔액표로 오해하지 않게 표시한다. 대안은 누적 손실이 아니다.
- 모바일: 좁은 container에서 세로 비교·5개씩 순위 재배치·세로 날짜, HTML 금액 라벨. 재생·정지·앞뒤·reset과 관련 입력은 실험 안에 인접한다. 사용자가 시작하기 전 자동 재생하지 않고 조건 변경/unmount 때 타이머를 정리한다. reduced-motion은 이동 없이 같은 프레임·정적 표를 제공한다.
- 실제 금융정보·외부 API·난수 추첨·수익 추천 없음. 기존 책의 본문·ID·공개 장 수는 변경하지 않는다.

## 현재 검증 상태 (2026-10-20 08:10 UTC)

PR36의 아래 동일 tree에서 전체 unit1049/1049, TypeScript/Vite build와 production browser9개 suite가 모두 성공했다. 확률83/83·홈14/14와 최종 소스 원본 PNG 직접 검토를 완료했다. 이는 해당 PR 소스의 결과이며 **최신 main 통합·Pages·실제 게시 버전 확인은 별도 대기**다. 독립 동료 리뷰·실제 기기·스크린리더 실행은 수행하지 않았다.

첫 책 등록은 suite/선택기 계약을 추가하므로 넓은 회귀를 모두 실행했다. 후속 책 전용 변경은 해당 책 전체 suite와 book-volumes를 유지한다. 아래 앞부분의 ‘예정/미완료’는 당시 실행 이력이며 현재 상태를 대신하지 않는다.

## 출처와 한계

2026-10-20 NIST 위치/흩어짐/히스토그램 원문과 SEC Investor.gov 유동성 정의를 다시 열람했다. 자체 자료·가정·산술이며 실제 조사·손실률·계약 권리·개인 안전성 판정이 아니다. 실제 기기·Safari/Firefox·스크린리더 음성·독자 학습효과는 별도 실험 전 미검증이다. 브라우저 screenshot 생성은 직접 화면 검토의 대체가 아니다.

### 첫 실행에서 확인한 사실

- 코드 commit `96246ad5066190ce36fb625f1f7f33fbd1285413`, tree `ee95dd777a71f587fe485a2599ab2e9188d091e6`: 전체 `npm test` 960/960, TypeScript/Vite 전체 build 성공. 번들 크기 경고는 남아 있으며 범위 밖의 공통 번들 구조는 바꾸지 않았다.
- 실제 변경 목록과 이전 카탈로그를 넣은 선택기 결과는 `full`: insurance, investing, tax, book-volumes, database, kubernetes, housing, accounting, probability. 선택 결과는 실행 통과가 아니다.
- production 브라우저 첫 시도는 Chromium의 로컬 socket 생성 제한으로 시작 전 실패했다. 허가 요청형 재실행도 격리 실행기 초기화가 읽기 전용 경로에서 실패하여 검증기를 시작하지 못했다. 완료한 브라우저 assertion0·스크린샷0이며 환경 문제를 통과로 처리하지 않았다. 같은 제한을 피하기 위한 다른 실행 경로는 시도하지 않았다.
- 코드 점검에서 날짜 그림의 유입100만원을 총잔액처럼 읽을 위험을 제거하고, 지출 전 가용액 비교임을 명시했다. 큰 지출 입력 변경 뒤 제목도 현재 평균 관계를 따르도록 보정했다. 이 후속 소스는 다시 전체 unit/build로 검증하며, 실제 화면의 가독성은 아직 검토하지 못했다.

### 현재 소스 재검증

- 코드 commit `5017a3eb750814155ba495336b72aca1cb2a745f`, tree `3ff5b20d3fcc8becf88196b0b04040d22cfe48da`: 전체 unit960/960, TypeScript/Vite 전체 build 성공. 별도 핵심 모델/verifier 계약9개도 모두 통과했다. targeted9개는 전체960개의 대체가 아니다.
- 이 뒤의 이 문서 보완은 검증 상태만 기록하며 앱 코드를 바꾸지 않는다. 앱 브라우저·직접 PNG 검토·전체9 suite 실행·PR CI·게시 게이트는 여전히 미완료다.

### 정상 PR CI에서 발견한 결함과 수정

- 공개 승인 뒤 draft PR [#36](https://github.com/Middleages/my-books/pull/36)을 만들었다. 첫 원격 head `c3ebdd6c7cef629cd42c742329e485c8d0fb4898`, tree `939ef9b45cd20d527bfa9bbe90497360d48c84bc`; 로컬 코드와 동일한 tree다. PR의 가상 병합 소스는 `77d3a4700e957b4b491e641332bc530306aba34d`였다. main 쓰기나 Pages 게시를 하지 않았다.
- [CI 39385832013](https://github.com/Middleages/my-books/actions/runs/39385832013)의 build 단계(전체 unit, TypeScript/Vite build 포함)는 성공했다. probability browser는 5개 검사 통과 뒤 6개 실패, 선택자 timeout으로 남은 검사를 중단했다. 이는 실패한 실행이며 전체 browser 통과가 아니다.
- 실패 원인1: 괄호로 끝나는 한국어 용어의 Markdown 강조가 문자 `**`로 노출됐다. `사분위 범위(IQR)`를 명시적인 `<strong>`으로 고쳤고, 세 MDX 문서를 실제 MDX/React 정적 렌더해 원시 강조·취소선이 남지 않는 회귀 검사를 추가했다.
- 실패 원인2: 감싼 label의 선택 항목 텍스트까지 접근성 이름에 포함되어 ‘지출 납기’ exact 선택자가 찾지 못했다. 눈에 보이는 이름과 같은 명시적 aria-label을 네 조건 선택 상자에 연결했다. 테스트를 느슨하게 하거나 검사를 제거하지 않았다.
- 첫 실행 원본 PNG `1440-distribution-first-figure.png`, `1440-distribution-static.png`, `1440--probability-losses-and-liquidity.png`를 직접 열었다. 같은 물리적 금액축·겹친 점의 쌓기·원자료와 가운데 요약은 읽혔다. 확률 그림의 축 범위를 더 즉시 알 수 있도록 각 사례에 0%–100% 축 라벨을 보강했다. 모바일 원본은 timeout으로 생성되지 않아 아직 검토하지 않았다.
- normal-motion 검사도 0 손실 프레임에서 끝내지 않고 작은 손실·큰 손실 및 되감기 뒤 실제 막대 geometry를 검증하도록 확장했다. 후속 전체 unit/build와 새 CI·원본 PNG 검토가 끝나기 전 준비 완료로 보고하지 않는다.
- 이 수정 소스의 전체 `npm test`는 962/962 통과했고, `npm run build`도 성공했다. 알려진 번들 크기 경고는 그대로다. 이 결과는 후속 원격 브라우저 실행 결과와 별개다.

### 자동 통과 뒤 원본 모바일 화면에서 발견한 점 겹침

- 수정 head `b9607b957eed7dd7cefa9bca9b9640bc7bb75214`, tree `a019ad864df42dfe73f94c972be4e137b0c56239`의 [CI 39386718283](https://github.com/Middleages/my-books/actions/runs/39386718283)에서 probability83/83, 오류0, 원본 PNG32개를 얻었다. 이때 직접 연 `320-distribution-median.png`에서 고른 집단의 가까운 금액 점들이 겹치는 설명력 결함을 발견했다. 브라우저 자동 통과를 시각 완료로 취급하지 않았다.
- 점의 금액 가로 위치·10가구 원자료·요약은 유지하고, 같은 세로줄뿐 아니라 가까운 가로 위치도 서로 다른 세로줄 높이에 놓는 고정 lane 배치를 모델에 추가했다. 세로 위치는 겹침 방지용이며 건수·금액·확률의 별도 수치축이 아니라는 설명으로 바꿨다. 같은 금액의 점은 같은 가로 위치에서 한 가구씩 센다.
- 꼬리 집단 입력을 해당 점 그림 바로 위로 옮겨 모바일에서 입력과 바뀌는 대상을 가깝게 연결했다. 예측·단계 제어는 바로 아래에 유지한다. 소개의 수동 안내와 공통 자동 목차 제목 중복도 구분했다.
- 모델에서는 같은 lane의 금액 간격을 검산하고, 실제 브라우저에서는 모든 점 쌍의 화면 중심 거리와 지름을 비교해 겹침이 재발하지 않도록 검사한다. 이후 전체 unit/build·9 suite·원본 화면 재검토가 필요하다.
- 같은 모바일 원본 검토에서 날짜 그림의 금액 단위가 줄 사이로 갈라지는 부분을 확인해 금액 안내의 단어 단위 줄바꿈을 보강하고, 신규 본문의 숫자 앞 띄어쓰기도 정리했다.
- 모바일 시각 보완 소스는 전체 unit963/963와 TypeScript/Vite build를 다시 통과했다. 이전 83개 browser 결과를 이 후속 코드의 결과로 재사용하지 않는다.

### 최신 main 보존 병합

- 계획 PR31의 세 문서는 main `05602d24c6946f4e4c1b95f5f926e2e8eb51b316`에 먼저 반영됐다. A는 그 main을 자기 feature 브랜치에만 병합했다. 카탈로그의 import 삽입 충돌에서 확률 세 import와 주거 두 import를 모두 보존했다. 최신 main 기준 변경은 A 관련21파일이며 다른 교재의 본문·모델·공개 장 수를 바꾸지 않았다.
- 로컬 병합 소스 `2327b7465879136f211229ef4a943c9fc95f4a0a`, tree `61e8969ca9c375ac0901b33fb8e31fbbe2024e36`의 전체 unit1049/1049가 통과했다. 병합 전963개와 최신 main의 추가 검사를 구분한다. 최신 main에 대한 쓰기·배포는 여전히 하지 않았다.
- 같은 병합 소스의 TypeScript/Vite 전체 build도 성공했다. 이후 문서 보완은 실행 사실만 기록하며 앱 코드는 동일하다. 최종 원격 source/tree의 새 browser 실행과 직접 PNG 재검토는 별도로 남긴다.

### 최종 PR 소스의 실제 넓은 검증

- 공개 head `28c50481c4f0e2ad825d07695d9db6f150538a80`, 로컬 HEAD `86387021b39b8dccf260dea484eceeeff197dd9e`, 공통 tree `2e47f729914a24b81829731f2657cdc0b92c4d69`. [CI39388611097](https://github.com/Middleages/my-books/actions/runs/39388611097)의 가상 병합 소스 `23c37b0e74b1ba904f301bb87737ec76f93ad9c7`도 같은 tree다.
- 전체 unit1049/1049·실패0, TypeScript/Vite build 성공. production browser의 insurance, investing, tax, book-volumes, database, kubernetes, housing, accounting, probability **9개 모두 성공**, 생략0. 보험 회귀가 마지막으로 완료될 때까지 실행 중 상태를 성공으로 처리하지 않았다.
- probability83/83·앱/콘솔/리소스 오류0·PNG32개. book-volumes14/14·오류0. production Chromium에서1440/390/320, 중간768/900, normal/reduced-motion을 검사했다. 점 쌍 분리·축 실제 폭·손실 막대 실제 길이·입력/단계 조합·키보드·정지/reset·unmount·정적 표·읽음 새로고침·알 수 없는ID 보존을 포함한다.
- 두 보고서와 로컬 production dist의 자산명이 같고 전체 바이트/해시가 일치했다. JS `index-BxWePgZw.js`: 2,734,480bytes, SHA256 `f20f804d5f4ff3c30aa0d671cd66372ae4524f538196bbb40879538daf7bdcbb`; CSS `index-dammzSQV.css`:342,687bytes, SHA256 `d38e7bf5da4301378a29f348f673ad93123a62aea338ec748c326965761069cb`.
- probability artifact12248412142 ZIP SHA256 `40e289b2dd5f0376537c8005a03980384db2bbf62fc24ba1f7d3b46a61a6ce63`; book-volumes artifact12248388401 ZIP SHA256 `b1fa97f7a0ca05d7b273c36e207d14acf94a9a04401615af02cf834180123dcd`.

### 최종 원본 화면 직접 검토

작성자가 실제 원본 PNG를 직접 열었다. 별도 동료 리뷰는 아니다. 다음은 실제 검토한 파일이며, 생성만 된 나머지 파일까지 검토했다고 하지 않는다.

- 분포: `320-distribution-median.png`, `390-distribution-first-figure.png`, `1440-distribution-median.png`. 10점 구분·가운데 두 순위·공통 금액축·평균/중앙값 차이, 금액 위치를 바꾸지 않은 충돌 방지 세로 배치, 꼬리 그림 바로 위 입력을 확인했다.
- 손실/제어: `320-loss-date-figure.png`, `320-loss-controls.png`, `320-loss-large-figure.png`, `1440-loss-large-figure.png`, `390-normal-motion-large-figure.png`. 미래100만원 제외·200만원 단위 줄바꿈·인접 버튼/예측·0–1700만원 같은 축·충당200+부족1400·현금 경계·색 외 사선 범례를 확인했다.
- 정적/전체: `320-loss-static.png`, `320-distribution-static.png`, `390--probability.png`, `320--probability-losses-and-liquidity.png`, `390--probability-averages-and-distributions.png`. 원자료·요약·전체 대안·단계 설명·본문/그림/해석/출처 흐름과 실제 공개2장을 확인했다.
- 홈: book-volumes의 `320-probability-heading.png`, `390-home.png`. 돈·경제8권, 읽음 분모2와 다른 책/순서를 확인했다.
- 이전 자동 통과가 놓친320px 점 겹침을 수정한 **뒤** 다시 본 화면이다. inspected states에서 핵심 라벨의 잘림·점 겹침이 남지 않았다. 모든 실제 장치/모든 브라우저/독자 학습효과를 검증한 것은 아니다.

### 다음 통합과 게시 게이트

- PR 검증 중 main은 세금F·주거E를 포함하는 `d76ed55e9969108449124a154c7c67e946068740`으로 이동했다. 위 PR 검증은 그 이후 main의 결과가 아니다. 다음 신규책 파동은 그때의 최신 main과 병행 책 변경을 보존하여 직렬 담당자가 통합한다.
- PR의 deploy/published-browser는 skipped이며 게시 성공이 아니다. 통합된 정확한 tree의 전체 unit/build·필수 넓은 suite, Actions/Pages/verify-published와 같은 자산의 실제 게시 바이트/해시·공개2장 대조가 남아 있다.
- 이 최종 기록은 위 검증된 tree 이후의 문서 전용 보완이다. 앱 코드·검증 스크립트는 바꾸지 않는다. 통합 후 기록 자체의 새로운 tree와 이전 앱 검증 근거를 구분한다.

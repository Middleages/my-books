# 확률과 금융 의사결정 D — 검증 기록

2026-10-20. 07 `association-and-causes`, 08 `dependence-and-diversification`과 소개·실제 등록8장만의 후보. 09 이후는 등록하거나 링크하지 않는다.

## 기준과 경계

- C 최종 로컬631affd730a6dd0c9e034f6742d59fb4c372dd2a / 원격af9366499cb2d011c913e33713bc5de8da1be702 / tree556b7cef735fd0ff5ed436193295b859ed5bf685의 내용을 별도 D 작업트리에 보존했다. C 최종 검증 문서는 별도 docs-only 결과로 복사했다. A/B/C 동결 source는 수정하지 않는다.
- D 착수09:17 및 공개 준비09:48 UTC 원격 main 조회는47c36cc06fad15d87afd040ac5c259b421714d52였다. stacked 기준에 없는 새 main 변경을 덮지 않는다. 최종 통합은 최신 main에 D 델타만 보존 적용해야 한다.
- AGENTS·CONTENT-AUTHORING·HOME·MONEY·확률 계획과 기존 A–C 구조를 따랐다. investing/Diversification 본문·순수 모델과 insurance/Pooling 본문을 다시 읽어 네 고정 시나리오/공동 재원 설명을 복제하지 않았다.
- main/Pages는 지정된 직렬 창만 사용하며 A→B→C→D 실제 게시 순서를 지킨다. PR source 검증은 Pages 게시가 아니다. 개인 금융자료·실제 예측·상품/보유 비중 추천은 없다.

## 수학과 시각의 정본

07의 가상 관측 단위는 매장·일200건이며 자동으로 독립인200일을 뜻하지 않는다. 네 칸은 비수기 사용80건×평균80, 미사용20×70, 성수기 사용20×180, 미사용80×170이다. 관측 평균100/150과 원래 계절 구성80:20/20:80을 보존한다. 공통 비수기 가중치0/25/50/75/100%를 적용한 별도 평균은180/170,155/145,130/120,105/95,80/70이다. 원래 기록은 옮기지 않으며 차이10을 인과효과로 표시하지 않는다. 빈 건수 평균은null이다. 관계도는 후보 점선과 미확인 물음표이며 causalEstimate는null이다.

08은 최초1,000단위·한 기간·각각20% 확률로−20% 아니면0%라는 가정이다. 100칸은 실제100회 관측이 아니라 각각1%의 확률 단위다. 공동손실 q0/4/20%에서 각 주변 확률20%를 보존한다. 반반 기대손실40은 같고, 손실>150 확률은q다. 한쪽만 보유하면 기대40·초과확률20%가q와 무관하다. 확률 막대와 금액 막대의 축을 구별하고, 확률0인 결과도 정적 표에서 지우지 않는다.

계획의 ‘현금 경계150’는 의미를 바로잡아 ‘손실 비교선150단위’로 구현했다. 평가 손실을 자동 현금 청구나 파산으로 해석하지 않으며 추가 현금을 만들지 않는다. 별도 비선형 반례는 A[-20,0,20]%,B[10,−20,10]%,각1/3이다. 선형상관0이어도 A0이면 B−20이 확정된다. 상수 변수의 상관은null이다. 세 점은 같은 두 축 범위·물리 눈금으로 표시하고 시간 경로나 연속 곡선을 꾸며 넣지 않는다.

관측·표준화 평균, 확률칸·결합표·손실·기말·질량 막대·판정·정적 표는 같은 순수 모델을 읽는다. 조건 변경은 해당 비교 단계에서 정지하도록 명시하며 재생/단계/다시 보기/전체 초기화, 키보드, reduced-motion과 모든 단계 표를 제공한다. 상관·인과나 독립성을 자동 안전 점수로 바꾸지 않는다.

## 직접 확인한 1차 근거

확인2026-10-20. [NIST 실험/설계 §3.1.3.6](https://www.itl.nist.gov/div898/handbook/ppc/section1/ppc136.htm)에서 상관·인과·제3요인·설계를, [산점도 §1.3.3.26](https://www.itl.nist.gov/div898/handbook/eda/section3/eda33q.htm)에서 선형/비선형 구조와 제3변수 조건화를 확인했다. 원문의 광범위한 ‘causality implies association’ 문장을 무조건적인 인과추론 정리로 옮기지 않는다.

[NIST Dataplot CORRELATION](https://itl.nist.gov/div898/software/dataplot/refman2/auxillar/correlat.htm)의 중심화 곱/표준편차 산식만 사용한다. p-value 검정·실제 예제 자료는 도입하지 않는다. 처음 추측한 corr.htm은 접근할 수 없었고 근거로 세지 않았다. [NIST 독립 사건 정의](https://csrc.nist.gov/glossary/term/statistically_independent_events)는 교집합=주변확률 곱의 수학적 정의만 참고하며 암호 표준의 검증을 금융에 전용하지 않는다.

[SEC Investor.gov 분산 설명](https://www.investor.gov/introduction-investing/getting-started/asset-allocation)의 보유 중복 경계만 확인했다. 자산 배분·재조정 처방·미국 상품/제도·실제 시장 통계를 가져오지 않는다. 모든 계절·공동 사건·세 점 사례와 산술은 자체 작성이며 기관의 실제 연구결과로 쓰지 않는다. 심프슨 현상의 전문 논문을 열람했다거나 경험적 효과를 검증했다고 주장하지 않는다.

## 실제 실행과 남은 검사

- D 순수 모델 첫5/5 성공. 가중평균/빈 분모, 작은 정수 결합표 전수,9개 관계×보유비중 정본, 비선형/상수/큰 수 상관 경계 포함.
- 실제 MDX 렌더·C 모델/등록 보존을 포함한 초기 targeted22/22 성공. 첫 TypeScript noEmit 성공. 이후 D browser 계약을 추가했으므로 이 실행을 최종 전체 결과로 대신하지 않는다.
- 독립 Python Fraction 구현과 관측/표준화/9개 결합분포의 숫자134개를 대조해 최대 차이0을 확인했다. 같은 작성자의 다른 계산 구현이며 독립 동료 검토는 아니다.
- 09:48 UTC 로컬 최종 `npm test` 전체1,099/1,099 성공(실패·건너뜀0), `npm run build`의 TypeScript noEmit·Vite build 성공, `node --check scripts/probability-browser-qa.cjs`와 `git diff --check` 성공. 기존 번들 크기 경고는 남아 있다.
- 정상 production browser·원본 PNG는 아직 미실행이다. 브라우저 검사를 작성한 것과 실행 성공을 구별한다. 로컬 Chromium 환경 제한은 우회하지 않는다.
- D 원격 source 쓰기·PR·main/Pages/live는 아직 시도하지 않았다. 실제 기기·Safari/Firefox·스크린리더 음성·학습효과는 미검증이다.

## 로컬 빌드 자산 정본

- `index-Cl2TrOJ9.js`: 2943746 bytes, SHA256 `14202fc700ce6f7c814cff54be9b05f4c3dfa118657ad8a117e85e6e72ecfd1d`.
- `index-oboS8N2f.css`: 361305 bytes, SHA256 `4bed89f1d7feb8dcf15f0e59e30baa923d5cc995e4f14b2fe6d07e88494f1335`.

이 값은 로컬 빌드의 정본이며, 향후 실제 CI checkout/tree와 브라우저가 읽은 자산을 별도로 대조한다.

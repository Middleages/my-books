# 확률과 금융 의사결정 C — 검증 기록

2026-10-20. 05 `samples-and-variation`, 06 `intervals-and-prediction`, 소개·실제 등록6장만의 후보다. 07 이후는 등록하지 않는다. bookId/categoryId/volume8/readId와 기존 URL·읽음 저장·미지 ID를 보존한다.

## 기준·경계

- B 로컬17508bf18457e25286a16c34bcbbe02614345467/tree067d1472e07dc7e5bffcab485d315da7aba10aa2에서 별도 C 작업트리를 만들었다. 그 B는 A와 main d76ed55e의 세금F·주거E를 보존했다. C 착수 원격 main 조회08:38 UTC도 d76ed55e였다. 09:02 UTC 재조회한 main은 47c36cc06fad15d87afd040ac5c259b421714d52다. C는 최신 main을 대신하는 소스가 아니며 통합 시 최신 병행 변경을 보존해야 한다. A PR36/B PR44는 변경하지 않는다.
- AGENTS·CONTENT-AUTHORING·HOME·MONEY와 C 계획, 기존 probability A/B 본문·모델·UI·테스트를 재검토했다. B의 최종 actual 검증 기록은 문서로만 옮기고 과거 source/tree를 C의 결과처럼 쓰지 않는다.
- main/Pages 쓰기는 지정된 직렬 통합 담당만 한다. A→B→C 실제 게시 순서를 지킨다. C의 draft PR 검증과 실제 main/Pages 게시를 혼동하지 않는다.

## 수학·재현 설계

05는01의 열 가지 값이 각각10번 나타나는 별도100가구이며 ID는 고유하다. 비복원 단순무작위, 낮은 지출 앞쪽 선택, 한 가구 복사를 구별한다. n5/20/80/100과200개의 고정 번호, 행 수·고유 가구 수를 함께 표시한다. 모집단의N분모 표준편차를 이용한 정확 SE는 σ/√n × √((N−n)/(N−1)); 편의 선택·복사에는 null/unavailable이다. n100 전수 평균 오차0, 꼬리 집단 앞80가구 평균10 대 전체20. 200평균 히스토그램은2만원 등폭·0–120만원/0–200개 공통축이며 모든 값·구간 표가 있다. 큰 표본 한 번이 더 멀리 가는 고정 기록을 보존한다.

06은 독립·동일 정규분포·알려진σ의 교육모형이다. 별도 요약 평균5,n25,σ20의 CI반폭7.839855938160215/PI반폭39.97557841243521. n100이면3.9199279690801075/39.3947885330081. 요약값과 생성 기록을 섞지 않는다. 반복 모드는 참평균0·σ20이며 실제 생성 앞n개 평균, 별도101번째 새값을 쓴다. 200반복의 실제 포함 수는 n25/90%180·181, n25/95%190·193, n100/90%177·179, n100/95%186·189(CI·PI 순)다. 결과를90/95%에 맞추지 않았다. σ0의 퇴화한 점 구간을 일반적인95% 포함 설명과 구별한다. 사건0건의 정확 단측95% 상한은 −expm1(log(.05)/n)이며 n100≈.02951304960704. 일반k용 공식이나 사후확률이 아니다.

고정 xoshiro128 star-star1.1의 기존 seed를 변경하지 않았다. C는 표본당1,000uint32 블록을 나눈다. 가구 섞기는 나머지 편향을 피하는 거절 추출을 포함한 Fisher–Yates. 정규값은 sqrt(−2log u)cos(2πv), u=1−word/2^32로 log0을 피한다. 유한 격자·꼬리 절단·의사난수와 이상적 독립 연속모형의 차이를 명시한다. 초기 경계 테스트에서 −0을 발견해 radial0의 표시값을0으로 정규화했다. 실제 수익·손실 분포를 예측하지 않는다.

## 직접 확인한 1차 근거

확인일2026-10-20. [NIST §7.1.4](https://itl.nist.gov/div898/handbook/prc/section1/prc14.htm)의 알려진σ CI와 반복 포함 해석, [§1.3.5.2](https://itl.nist.gov/div898/handbook/eda/section3/eda352.htm)의 추정한s/t와의 구분, [§4.1.3.2](https://itl.nist.gov/div898/handbook/pmd/section1/pmd132.htm)의 새 관측 변동을 열람했다. PI는 독립 새값−표본평균의 분산을 자체 도출했다. [NIST Dataplot](https://itl.nist.gov/div898/software/dataplot/refman2/auxillar/exacbici.htm)의 정확 이항 역산을 확인하고0건 단측식을 직접 풀었다. 원문의 오래된 z 표기 문장을 일반k 공식처럼 옮기지 않았다.

[Statistics Canada의2019 §2 식2.3](https://www150.statcan.gc.ca/n1/pub/12-001-x/2019002/article/00006/02-eng.htm)과 N−1 분모 정의를 한 집단 평균의 N분모 σ로 변환했다. 원문이 이 교재의 특정100가구 예를 발표한 것은 아니다. [Census 표본](https://www.census.gov/programs-surveys/sipp/methodology/sampling-error.html)·[비표본 오차](https://www.census.gov/programs-surveys/sipp/methodology/nonsampling-error.html)의 구분만 사용하고 실제 SIPP 수치·집단별 성향을 옮기지 않는다.

[NIST FEASST v0.25.21 random.cpp](https://github.com/usnistgov/feasst/blob/v0.25.21/plugin/math/src/random.cpp), blob08a2e8fbfaec88f5b97fecfb230627ab4834959a의 standard_normal 변환식을 직접 확인했다. 문서 페이지가0.25.19로 반환된 것과 tagged0.25.21 코드를 구별한다. Box/Muller1958 DOI와 publisher PDF는 접근하지 못해 전문 미열람이다. 원문을 읽었다거나 금융 모형을 검증했다는 주장은 하지 않는다.

## 실제 실행 상태

- npm ci 작업공간 cache 성공. 첫 TypeScript noEmit 성공.
- 초기 모델8개 중 음수0 경계1개가 실패했고 수정 후8/8 성공. 이후 기하·등록 검사를 추가했으므로 이8개를 최종 전체 검증으로 대신하지 않는다.
- 별도 Python uint32/수학/NormalDist 계산과800개 반복의 평균·새값·포함 판정을 비교했다. 판정 전부 일치, 최대 숫자 차이7.105427357601002e-15. 같은 작성자의 독립 계산 구현이며 독립 동료 리뷰가 아니다. 작은4개 모집단의 가능한 모든 조합으로 유한 SE도 대조했다.
- 최종 로컬 검증: targeted 23/23, 전체 `npm test` 1,092/1,092 (실패·skip 0), `npm run build`의 TypeScript/Vite 성공. 실행은 09:03 UTC에 시작해 09:08 UTC 완료를 확인했다. 빌드의 기존 큰 청크 경고는 남아 있다.
- MDX 실제 렌더 검사에서 한국어에 인접한 강조와 물결표 범위가 raw 표기/취소선으로 해석되는 것을 찾아 명시적 strong과 자연어 범위로 수정했다. DOM 기하 계약의 selector도 실제 data-height-fraction 요소를 직접 고르게 했다. 실패한 초기 실행을 최종 통과에 포함하지 않는다.
- production/published browser·원본 PNG는 아직 미실행이다. 구현 코드가 검사를 가진 것만으로 통과라고 쓰지 않는다. 로컬 Chromium 환경 제한은 우회하지 않고 승인된 정상 PR CI를 사용한다.
- 실제 기기·Safari/Firefox·스크린리더 음성·학습효과는 미검증. 원격 C 쓰기·main/Pages 게시도 아직 시도하지 않았다.

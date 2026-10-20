# 확률과 금융 의사결정 B — 검증 기록

2026-10-20. 범위는 03 `frequency-and-probability`, 04 `conditional-evidence`와 기존 소개·실제 등록4장 안내다. bookId `probability`, money8권, readId `probability/<chapterId>`, 저장 키와 알 수 없는 ID는 유지한다. 05 이후는 등록하지 않았다.

## 기준과 통합 경계

- A의 검증된 로컬 HEAD86387021/tree2e47f729를 별도 B worktree로 분리했다. A PR36은 변경하지 않았다.
- 최신 원격 main `d76ed55e9969108449124a154c7c67e946068740` (세금F·주거E)를 B 브랜치에만 보존 병합했다. 로컬 병합commit `e58593b`이며 main 쓰기·게시를 하지 않았다. 카탈로그 import 충돌은 확률3개와 새 주거2개를 모두 보존했다.
- AGENTS/CONTENT-AUTHORING의 최신 main 변경 없음 확인, HOME/MONEY의 세금12장·주거10장 변경과 검증 범위 정책을 재검토했다. 기존 probability01–02/보험 ExpectedLoss와 관련 모델·UI·테스트를 읽었다.
- A의 최종 검증 기록을 문서 전용으로 보완했다. 그 과거 검증 source/tree를 B 소스의 검증 결과처럼 쓰지 않는다. A의 실제 공개 게이트가 끝나기 전 B를 main/Pages에 섞지 않는다.

## 모형·시각 계약

### 03 횟수와 확률

독립·일정 p의 이항분포를 로그영역에서 계산한다. 기대 횟수와 선택한 고정 기록의 정수 건수/비율은 다른 필드다. p=.01,n100의0건 확률은 약.3660323412732295, 기대1건. 초기 기록은3건이며 결과를 맞추도록 seed를 선택하지 않았다. 기록 번호1/2/3은 고정1000개 블록의 앞 n10/100/1000을 읽는다. p0/1에서도 같은 수열을 소비한다.

확률 막대는 같은0–100% 가로축이며0/1/2/3/4/5/6–10/11–20/21–100/101–n의 해당 묶음 확률이다. 구간 폭이 다른 합계 행을 밀도 히스토그램으로 부르지 않는다. 모든 n+1개 확률과 전체 n개 기록은 정적 표에 있다. 가능한 양의 확률이 부동소수점에서 underflow해도 불가능0으로 바꾸지 않고 작은 양수 표시를 유지한다.

기록 그림은 순서 묶음·현재 관측 건수·지연 건수·실제 높이를 같은 frame에서 읽는다. 아직 미관측인 칸은0건 사건으로 세지 않고, 관찰 분모0의 비율은null이다. n10 단계는0→5→10이며 중간 단계가 역행하지 않는다. 고정 1%→2% 비교는 상대+100%/절대+1%p/같은10,000건 기대100→200을 명시한다. 룰렛·자동 추첨·실제 위험 추정은 없다.

### 04 조건을 바꾸어 같은 네 칸 세기

전체10,000건의 같은 가상 집합을 같은 가능성으로 한 건 선택하는 조건이다. 기본 tp90/fn10/fp198/tn9702, 알림288건의90건=31.25%. 오류1,000건일 때900/(900+180)=83.3333%. 정상/오류 조건의 분모와 알림 조건의 분모를 분리한다. 기저율0/1%/10%/100%와 기본/완전/무정보/무알림 모드를 검산한다. 알림분모0은undefined이고, 분모가 있는 오류0%와 구별한다.

전체→실제 상태→알림 여부→선택된 알림 경계가 같은 건수와2×2표를 읽는다. 상자 넓이는 확률이 아니라고 명시하고, 알림 선택 막대만 같은0–100% 축의 비중이다. 모바일은 세로 연결로 재배치하며 색 외●/○·사선·선택 밖 표시를 사용한다. 개인 금융사기/신용/진위 판정은 하지 않는다.

두 실험 모두 직접 조작·이전/다음/재생/정지/replay/reset을 제공하고 조건 변경/unmount 때 재생을 취소한다. 자동 재생하지 않는다. reduced-motion과 정적 모든 자료·설명은 같은 모델 정보를 제공한다.

## 검산과 출처

- xoshiro128 star-star1.1(Blackman/Vigna,2018)의 [저자 공식 next-state 원문](https://prng.di.unimi.it/xoshiro128starstar.c)과 [비암호용 설명](https://prng.di.unimi.it/)을2026-10-20에 열람했다. 공개도메인 고지 확인. 짧은 상태 갱신 규칙만 저자 표시와 함께 이식했고 추가 jump 소스나 외부 실행 파일은 사용하지 않았다.
- 초기 상태 `[0x9e3779b9,0x243f6a88,0xb7e15162,0xdeadbeef]`는 결과를 보기 전에 지정했다. 이 상태와 `[1,2,3,4]`의 첫20출력씩 총40개가 독립 C uint32 계산과 일치한다. 32비트 격자 임계값의 p차이는2^-32 미만이며 이론 p와 구분한다. 재현 가능한 의사난수는 실제 조사나 독립성의 증거가 아니다.
- 별도 Python 정확 정수/Fraction 이항계산25조건·5,580개 PMF행과 대조해 최대 절대 오차1.234429225505096e-14. n0/1/10/100/1000, p0/.01/.02/.9/1을 포함한다. 같은 작성자의 독립 계산 구현이며 별도 동료 리뷰가 아니다.
- [NIST 이항분포 §1.3.6.6.18](https://itl.nist.gov/div898/handbook/eda/section3/eda366i.htm)의 PMF/np/분산과 [독립 시행 정의](https://csrc.nist.gov/glossary/term/Binomial_Distribution)를 확인했다. 실제 지연률의 근거로 쓰지 않는다.
- [NIST §8.1.10](https://www.itl.nist.gov/div898/handbook/apr/section2/apr1a.htm)의 조건을 뒤집는 설명과 [SP800-55v1](https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=958991),2024-12,부록B.1/C.1(인쇄29/32쪽)의 조건부확률 항등식을 확인했다. 핸드북의 오래된 수식 이미지2개는 ITL홈으로 리다이렉트되어 확인하지 못했다. PDF의 조건부 비율만 사용하고 인접 Monte Carlo·금융 주장으로 확장하지 않는다. 건수/분모는 자체 산술로 검산한다.
- 자연빈도의 학습효과 논문 S15는 전문 미열람 상태다. 표현의 학습효과가 입증됐다고 쓰지 않는다.

## 실제 실행 상태

- npm ci: 작업공간 cache로 성공. TypeScript noEmit 성공.
- 집중 unit: 기존A·새 모델·MDX실제 정적 렌더19/19, 이후 B verifier 계약을 추가한 해당 파일5/5. 이 숫자는 전체 unit을 대신하지 않는다.
- 모바일 단계 제어를 건수 나무 바로 아래/선택 결과 바로 위로 옮기고 세로 연결을 보완한 최종 앱 소스 `a6c0fba4081da82defbc124009690b793d933ee5`, tree `969df0fb8adf57a0b15f57742e9a507975e134d8`에서 전체 `npm test`: 1,081/1,081·실패0, TypeScript/Vite build 성공(2026-10-20 08:31 UTC 확인). 첫 실행 결과와 구별한다. 최신 main의 추가 검사와 B 검사8개를 포함한다. 알려진 번들 크기 경고는 남아 있다. 이 뒤의 검증 기록 보완은 문서만 바꾼다.
- 해당 production 산출물: JS `index-C7ZNKPTq.js` 2,850,035 bytes, SHA256 `acb65a846bcda7bc9c674a9739cfa2d39cc1cf8ac810182ce3abf7d4602662c7`; CSS `index-DZdXPmJ-.css` 352,060 bytes, SHA256 `59b36c79330eefac52ebc0958aebb583bb17523b84ac26f2b7deae3d603f8fea`. 아직 원격 browser 산출물과 대조한 것은 아니다.
- A를 포함한 보존 병합 기준에서 B 변경21파일의 선택기는 affected: book-volumes·probability, 의도적 생략7개(insurance/investing/tax/database/kubernetes/housing/accounting)다. 이는 로컬 선택 결과이며 실제 브라우저 실행 결과가 아니다. 최종 원격 CI는 정확한 당시 base로 다시 선택한다.
- production/published browser·원본 PNG: 아직 B를 실행/검토하지 않았다. verifier에 A의 기존 assertion을 유지하고 B의 전체 조건·실제 도형폭/높이·분모/건수·모바일·키보드·재생/정지/reset/unmount·정적1,001행·정밀도·새로고침을 추가했다. 코드에 검사를 적은 것은 통과가 아니다.
- 첫 로컬 Chromium 환경 제한은 그대로 존중하며 다른 실행 경로로 재시도하지 않는다. 승인된 정상 PR CI에서 실제 브라우저 결과를 얻는다. A 실제 게시 전에도 별도 draft PR의 production 검증은 진행할 수 있다. B main/Pages 통합은 A 게시 이후의 직렬 창만 사용한다.
- 원격 B PR/main/Pages는 아직 시도하지 않았다. 실제 기기·Safari/Firefox·스크린리더 음성·학습효과·독립 동료 리뷰는 미검증이다.


## 정확한 PR 소스의 실제 production 검증 완료

2026-10-20 08:47 UTC 확인. Draft [PR44](https://github.com/Middleages/my-books/pull/44)는 A PR36의 고정 브랜치를 base로 한다. 원격 head `58842af5e97c257b3e201b14efe5eb4de69c3b74`, 로컬 head `17508bf18457e25286a16c34bcbbe02614345467`, 동일 tree `067d1472e07dc7e5bffcab485d315da7aba10aa2`. [CI39394565669](https://github.com/Middleages/my-books/actions/runs/39394565669)의 가상 병합 source `03235c29f19eb835f4b32fcd706c9a0a14248e8f`도 같은 tree다.

- 전체 unit1,081/1,081·실패0 및 production build 성공. 위의 최종 로컬 JS/CSS 전체 바이트와 SHA256이 확률·홈 report 모두와 일치한다.
- 실제 affected 선택은 tax·book-volumes·housing·probability 4개이며 모두 성공. A base 이후 이미 게시된 main을 보존한 병합 때문에 세금·주거도 선택됐다. insurance·investing·database·kubernetes·accounting 5개는 의도적 생략이며 이번 B 실행에서 통과했다고 세지 않는다. 로컬 B-only 선택2개와 구별한다.
- 확률268/268, page/console/resource 오류0, 원본PNG73개 생성. 홈14/14·오류0. 범위 선택도 같은 source/tree를 기록한다.
- 작성자가 원본20개를 직접 열었다. 320px 이론·관측0건·자연빈도 나무·알림 비례막대/빈 조건·인접 제어·정적 표,390px 두 전체 장·일반움직임 결과·홈,1440px 이론/나무, A의320px 분포/납기 회귀를 포함한다. 조건부 분모와 색 외 표식, 미관측/0 구별, 읽음0/4, 기존 책을 확인했다. 일부320px 기록의 ‘건’ 단위는 두 줄이지만 잘림은 없었다. 독립 동료·실제기기·스크린리더 음성 검증으로 부르지 않는다.
- 확률 artifact12250759322 ZIP SHA256 `0ea7dcee6a7856dbc4779190828323a828002784277fd062187c52ea75579d75`; 홈 artifact12251316668 `6eb437c85ab30a4976cf0679056b73524828dcfeb8c61770fd428a820242104f`; 선택 artifact12250808373 `17087b343fa15453b50a4314dc86a9512963b98333df1d010d4e04991b46bf8d`.
- PR의 deploy/published jobs는 skipped다. main/Pages/실제 게시 성공이 아니다. A의 실제 게시 게이트 뒤 최신 main을 보존해 B를 직렬 통합하고 해당 새 소스의 검증과 실제 게시 확인을 해야 한다. 이 완료 기록은 검증된 B tree를 동결한 채 문서 전용 handoff로 준비했다.

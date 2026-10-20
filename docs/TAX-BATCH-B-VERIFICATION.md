# 세금 배치 B 검증 기록

작성: 2026-10-20. 상태: 통합 production·직접 그림 검토 완료, 검증기 진단 보강 재검증 중. 이 배치의 main·Pages 게시 전.

전체권을 로컬에서 선행 교차 검증한 뒤 A→B→C→D→E→F 순서로 공개한다. 각 배치에서 공개하는 장만 카탈로그·본문 링크·읽음 분모에 반영하며 선행 게시 게이트가 닫히기 전에 다음 배치를 공개하지 않는다. 현재 기록은 선행 게시를 완료했다고 주장하지 않는다.

범위·설계·공통 모델 경계는 [전체 점검 기록](TAX-BOOK-REVIEW.md)을 따른다. 해당 배치의 실제 테스트·빌드·production 화면·직접 PNG 검토·CI·Pages·자산 비교는 실행 후 아래에 추가한다.

## 후보 범위와 로컬 검증

기준 main은 세금 A·권차 표시 `da333eb71e2e5c5f00ba70bbddb2f36c1ce50b9f`다. B는 03 원천징수·04 연말정산만 추가하고 소개·02의 다음 장 연결·카탈로그의 공개 범위와 읽음 분모를 4로 바꾼다. 05–12는 계획 문구이며 활성 링크·본문·모델 함수로 등록하지 않는다. 기존 책·권차·URL·저장 키를 보존한다.

- 급여 모형은 지급총액=실수령액+사회보험 본인부담+원천징수액을 모든 프레임에서 보존한다. 비과세 분류는 별도 출금이 아니며 이달 과세대상 지급액을 연간 총급여·과세표준으로 부르지 않는다.
- 정산 모형은 결정세액과 기납부액의 차이로 환급·추가납부·0을 구분한다. 과도한 소득공제는 과세표준 0, 가상 세액공제는 산출세액 한도로 제한하고 미사용액을 별도로 남긴다. `기납부+추가납부−환급=결정세액`을 검사한다.
- 두 모형의 0·경계·상한·여러 선납 비율·공제 초과·음수·비유한값·초과 인출·반복 결정성을 검사했다. 기존 가상 누진 구간 검사를 함께 유지한다.
- `npm test`: 799개 통과, 실패 0. TypeScript·Vite production 빌드, `git diff --check`, browser 스크립트 구문 검사를 통과했다. 기존 큰 번들 경고는 남는다.
- 장별 일반 개념의 공식 근거와 2025년 귀속 안내의 적용 범위는 본문 출처 절에 명시했다. 금액·세율·공제는 가정이며 개인별 세액·보험료·신고를 계산하지 않는다.

전체 원고의 사전 직접 화면 검토와 이 B 후보의 production·main·Pages 게이트는 구분한다. 후자는 실제 실행 결과가 확인된 뒤에 추가한다.

## 첫 production 검사와 직접 그림 교정

PR [#15](https://github.com/Middleages/my-books/pull/15)의 head `a011d17c34762e6fea7ac1df72ea0678bf87622a`, 실제 checkout `7ec27dea7a5937cac44ed7635a10315cc605ab62`(변경 없음), [run39364238654](https://github.com/Middleages/my-books/actions/runs/39364238654)의 tax suite는 73/73 검사·콘솔 오류 0·PNG 50개를 기록했다. Chromium155.0.8059.84. [artifact12238407390](https://github.com/Middleages/my-books/actions/runs/39364238654/artifacts/12238407390)의 두 장 데스크톱 초기·320px 변경·390px reduced-motion 표를 직접 열었다.

정산의 공통 눈금·최종70 유지·환급 방향과 정적 표는 읽을 수 있었다. 급여 비례 띠의 값은 맞지만, 데스크톱에서 목적지 카드 위의 균등 간격 화살표가 실제 분할 띠의 다른 구간에서 내려오는 것처럼 보일 여지가 있었다. 자동 수치 통과를 시각 의미 통과로 간주하지 않고 이 부분을 보류했다. 화살표를 목적지별 범례 기호로 바꾸고, 왼쪽부터의 순서와 범례 폭이 금액 눈금이 아님을 명시한다. 브라우저 검사는 지급액·각 구간의 실제 픽셀 폭이 같은 모델의 비례를 따르는지와 잘못된 화살표가 다시 생기지 않는지 추가 확인한다. 수정 후 production·직접 PNG 검토는 다음 실행에서 별도로 기록한다.

## 범례 교정 후 재검증

- head `2200ecc0cba0608405ed5653c82e2b654dcac7dd`, 실제 checkout `7c82d71189ed648bae4755d9236f5d2cce951285`(변경 없음), [run39364775720](https://github.com/Middleages/my-books/actions/runs/39364775720), Chromium155.0.8059.39.
- 로컬 799개 테스트·TypeScript·production 빌드 통과. tax production 73/73 검사·오류 0·PNG 50개. [artifact12238763172](https://github.com/Middleages/my-books/actions/runs/39364775720/artifacts/12238763172).
- 급여 1440px 초기·850px 변경·320px 변경·390px reduced-motion/정적 표를 직접 다시 열었다. 비례 띠·통장215/사회보험25/원천징수60·범례 기호가 연결되고 잘못된 분기 화살표가 없다. 선택 입력은 그림 다음에 있으며 결과 장부와 반복해서 비교할 수 있다. 정산의 데스크톱·모바일·reduced-motion과390px 전체 본문도 확인했다. 공통 눈금·환급 방향·결정70 유지·단계별 표·정답 이유·출처 경계가 읽힌다.
- production CSS `index-BtYRxD5H.css`: SHA-256 `8376b31a6c55b8fe0cf257a4dd0ab6ab08b979ae859e94473100e8ef202a59d5`; JS `index-thD6E3oe.js`: `33a4859f6edee925a41538f1caf63e2805af98b3d1992e826accb71f0b0383bb`. 이는 PR production의 바이트 증거이며 B 게시 증거는 아니다.
- 이후 병행 변경·검증 범위 조정은 최신 main을 보존하여 통합한다. [계획의 2026-10-20 범위 조정](TAX-TEXTBOOK-PLAN.md)을 적용하며, 다른 책 전체 브라우저 회귀를 매 B–E마다 재실행한 것으로 주장하지 않는다. B main/Pages/실제 게시 자산 게이트는 아직 미완료다.

## 최신 main·주거 A와 통합한 다음 후보

DB A·Kubernetes 시각 보강·변경 범위 분류기·세금 A 최종 진단/문서를 포함한 main `0071bff4c992376bea65ad3a12ce86fafbbe98be`를 보존했다. 이번 공개 후보는 세금 B의 03–04와 별도 검증을 마친 주거 A의 소개·01–02를 함께 묶는다. 미래 DB B·세금 C·주거 B는 포함하지 않는다. 주거의 독립 원본은 `6afe8c83801470b88778009edc9a8cfb40e351ba`이며 정확한 production·직접 PNG 증거는 [주거 A 기록](HOUSING-BATCH-A-VERIFICATION.md)을 따른다.

통합 애플리케이션·테스트에서 `npm test` 902개와 TypeScript·Vite 빌드를 통과했다. 이후 병합한 main의 차이는 DB 검증·계획 문서뿐이며 애플리케이션·테스트 바이트는 같음을 확인했다. DB/Kubernetes의 컴포넌트·본문·모델·브라우저 스크립트와 공통 workflow/분류기는 기준 main과 같다. 주거 컴포넌트·본문·모델·검증 스크립트와 표지는 검증된 주거 원본을 유지했다. 충돌한 카탈로그·README·홈 설명만 양쪽 공개 범위를 보존해 합쳤다.

실제 분류기를 정확한 main `0071bff`와 비교해 실행한 결과는 `affected`, 선택 suite는 `tax`, `book-volumes`, `housing`다. 보험·투자·데이터베이스·Kubernetes 전체 브라우저 검사는 이 다음 실행에서 의도적으로 생략되며 통과로 기록하지 않는다. 전체 단위 테스트와 빌드, 모든 책의 공통 목차/권차/읽음 smoke는 유지한다. 통합 PR production, 직접 PNG 재검토와 main·Pages·게시 바이트 게이트는 다음 실제 실행 결과에 기록한다.

## 합본 production 통과와 입력 연동 설명 교정

통합 head `e85d06bb38a36894c84d4f475f0647f5b8dec4c1`, PR checkout `bd8f4e3e28f8ad8004b256d54a457e263227a896`, tree `898b989d8fbe358a3e9594f8b70c025a1d5081d1`의 [run39369042339](https://github.com/Middleages/my-books/actions/runs/39369042339)에서 build와 선택한 세 suite가 모두 통과했다. 실제 selection artifact도 `tax`, `book-volumes`, `housing`만 선택하며 다른 4개 suite를 생략했다고 명시한다.

- tax 73/73 검사·PNG 50개·오류 0, [artifact12240337599](https://github.com/Middleages/my-books/actions/runs/39369042339/artifacts/12240337599).
- housing 46/46 검사·PNG 28개·오류 0, [artifact12240422288](https://github.com/Middleages/my-books/actions/runs/39369042339/artifacts/12240422288). 주거 작성자가 합본의 1440/320 권리 변경, 390 임차 reduced-motion/정적 표, 320 임차 변경, 390 임차 초기 그림을 직접 열어 경로·방향·단계 제어 인접을 재확인했다.
- book-volumes 14/14 검사·PNG 36개·오류 0, [artifact12241180229](https://github.com/Middleages/my-books/actions/runs/39369042339/artifacts/12241180229). 1440/320 전체 홈, 320 주거·세금 권차 제목, 390 읽던 책 우선을 직접 확인했다. 주거 6권·세금 5권·DB IT 4권과 0/2·0/4 읽음 분모가 맞으며 기존 권차는 정렬해도 바뀌지 않는다.

세금 03·04의 1440 초기·320 변경·390 reduced-motion/정적 표를 직접 열었다. 급여의 비례·범례는 맞았다. 정산은 선납액을 150으로 바꾸면 그림·결과·장부가 환급 80으로 바뀌지만, 예측 이유만 최초 예시의 90/20을 유지하는 작은 설명 불일치를 발견했다. 자동 통과를 그대로 게시 판정으로 쓰지 않고 수정한다. 질문을 일반 개념으로 표현하고, 이유의 선납·결정세액·환급/추가납부/0은 현재 동일 모델에서 읽는다. 브라우저 검사도 이유를 펼친 상태에서 선납 0/50/70/90/150을 차례로 바꾸며 현재 값을 대조하도록 보강했다. 변경 후 결과는 다음 실행에 별도로 기록한다.


## 현재 입력 해설 교정 후 합본 production 재검증

head `1a8370d4b9781a444c8e8a56509d6cec72972f97`, PR checkout `95ff3910b458f315efb4d0601828f8407ac9377f`, tree `da7db1385fc596848a652dd27c89319ce475b5b2`의 [run39369634236](https://github.com/Middleages/my-books/actions/runs/39369634236)에서 build와 선택한 세 suite가 모두 통과했다. 로컬 전체 902개 테스트·TypeScript·production 빌드도 통과했다.

- tax 73/73·PNG 50개·오류 0·별도 비애플리케이션 진단 0, [artifact12241031868](https://github.com/Middleages/my-books/actions/runs/39369634236/artifacts/12241031868).
- housing 46/46·PNG 28개·오류 0, [artifact12241270291](https://github.com/Middleages/my-books/actions/runs/39369634236/artifacts/12241270291).
- book-volumes 14/14·PNG 36개·오류 0, [artifact12240499355](https://github.com/Middleages/my-books/actions/runs/39369634236/artifacts/12240499355).

세금 정산 320px 변경·390px reduced-motion/정적 대안을 직접 다시 열어 이유의 선납150·결정70·환급80이 현재 그림·표와 일치함을 확인했다. 주거 320px 임차 변경과 전체 홈도 다시 열어 유지된 배치를 확인했다. 이전 합본의 직접 확인 범위는 앞 절과 같으며 모든 생성 PNG를 사람이 하나씩 검토한 것으로 주장하지 않는다.

정확한 production CSS `index-4noGetxv.css`는 309708바이트, SHA-256 `f1ede4b3df8ad7867d5c441ccc0dd306a81d65b58c54fdb140945a73a20e14f8`; JS `index-BqMq_R2l.js`는 2377701바이트, SHA-256 `2191523fa3e45112528f514631933d35d00da4ad8083b15bdeb9bd596ba71f49`다. 세 suite의 대조 결과와 로컬 산출물이 같았다. 이는 합본 production 증거이며 아직 게시 증거는 아니다.

게시 전에 주거 검증기의 기존 문자열 기반 favicon 제외를 제거한다. 이미 확인한 정확한 호스트 기본 favicon의 URL·404만 별도로 보존하고, 출처가 비었거나 앱 경로·다른 호스트/상태·요청 실패이면 계속 실패시킨다. 일반·reduced-motion 양쪽에서 콘솔 위치와 실제 실패 리소스 URL/status를 남긴다. 이 검증기·회귀 테스트 보강은 앱을 바꾸지 않으며 별도 scoped production 재실행과 동일 앱 바이트를 확인한다.

진단 보강 후 로컬 전체 **905/905 테스트·TypeScript·Vite 빌드**가 통과했다. 재빌드한 CSS/JS의 파일명·바이트 수·위 SHA-256이 모두 같아 앱 산출물이 변하지 않았음을 확인했다. `git diff --check`와 검증기 구문 검사도 통과했다. 새 검증기의 실제 hosted production·published 결과는 별도 게이트로 남긴다.

## 엄격한 진단을 포함한 최종 production 및 게시 전 통합

진단 보강 head `e4c0dfe90b7db204419baceb01e908e80843e8b9`, checkout `1d985a42cb7790845e0713c492bd5bd58a35940f`, tree `7c68b9458917e4c86fc67e0bfba91d5b1f738c54`의 [run39372275782](https://github.com/Middleages/my-books/actions/runs/39372275782)는 build와 선택한 세 production suite를 모두 통과했다. tax 73/73·PNG 50개, housing 46/46·PNG 28개, 권차 14/14·PNG 36개다. 오류 0이며 주거의 console/resource/non-application 진단 배열도 모두 비어 있다. 실제 selector는 tax·book-volumes·housing만 선택했고 나머지 네 suite는 생략으로 남겼다.

[세금 artifact12242166905](https://github.com/Middleages/my-books/actions/runs/39372275782/artifacts/12242166905), [주거 artifact12241712007](https://github.com/Middleages/my-books/actions/runs/39372275782/artifacts/12241712007), [권차 artifact12241846563](https://github.com/Middleages/my-books/actions/runs/39372275782/artifacts/12241846563)의 ZIP SHA-256을 각각 `be051c36b5e94a77184580eeec372b07315be3de85ebe6aef705dab24006356e`, `69ebe151116e5f2371a83d9a4f78d293ee884ec727d12a8cf46be10a51cc963c`, `89a701cf88416284c7f50299a834f4e04b204ed637c115f3afb4f7abee3bff11`로 대조했다. 세 suite의 정확한 앱 자산은 앞 절의 CSS/JS와 같다. 320px 정산 변경, 주거 임차 변경, 전체 홈 원본 PNG를 다시 열어 현재 입력 해설·시간축 제어 인접·권차와 읽음 분모를 확인했다.

다음 게시 통합에는 main `0071bff4c992376bea65ad3a12ce86fafbbe98be`를 그대로 조상으로 보존하고 K8s의 최소 진단/회귀/최종 기록 `3026e4b671e7c098e1a4bd160e453260b6336504`와 DB A의 문서 전용 마감 `17d4f2f28287b759444d3ec42c1808d698efce17`만 추가한다. K8s의 실제 엄격한 focused 94/94 및 원래 run의 실패 구분은 [그 기록](KUBERNETES-VISUAL-IMPROVEMENTS-VERIFICATION.md)을 따른다. DB B·주거 B·세금 C·회계 A는 포함하지 않는다. K8s verifier가 바뀌므로 최종 main 범위에는 Kubernetes도 추가하며, 보험·투자·DB 전체 브라우저 검사는 재실행했다고 주장하지 않는다. 이 최종 main의 CI·Pages·정확한 게시 바이트는 실행 후 별도로 기록한다.

최종 진단/문서 통합 후 전체 **909/909 테스트**, 세금·주거·K8s의 집중 진단 회귀 **9/9**, TypeScript·Vite production 빌드와 `git diff --check`를 통과했다. CSS `f1ede4b3…`, JS `2191523f…`의 전체 SHA-256과 파일 크기가 앞서 검토한 production과 다시 일치했다. 실제 분류기는 `affected`: tax·book-volumes·kubernetes·housing, 생략은 insurance·investing·database로 확인했다. main 반영 뒤 production과 published 결과는 별도다.


## 정확한 main·Pages·실제 게시 완료 — 2026-10-20

main `b97dbd4ee78b64118a0e88f9f3f5fd1fd08f6b0d`, tree `6d5e0496559139986a1c89f7eb753321261eb1f8`의 [run39374566657](https://github.com/Middleages/my-books/actions/runs/39374566657)는 build·선택한 네 production suite·Pages 배포·네 published suite, 총 10개 job이 모두 성공했다. 전체 단위 테스트 909/909와 빌드를 통과한 정확한 통합본이다. 실제 selection은 `affected`, `tax`, `book-volumes`, `kubernetes`, `housing`이며 보험·투자·DB 전체 브라우저 검사는 이번 실행에서 의도적으로 생략했다. 생략을 통과로 해석하지 않는다.

게시 artifact의 sourceSha는 모두 위 main, sourceChanges는 비어 있으며 Chromium155.0.8059.39다.

- tax **73/73 검사·PNG 50개**, [artifact12243366034](https://github.com/Middleages/my-books/actions/runs/39374566657/artifacts/12243366034), ZIP SHA-256 `9daf84f3d82d1a8f07ef4851628b3a9911b996ecf8e9effcad357cc4bbb6b784`.
- housing **46/46·PNG 28개**, [artifact12243091719](https://github.com/Middleages/my-books/actions/runs/39374566657/artifacts/12243091719), ZIP `1337eef124f9ff5c0e3693ee3677d11c0d67b13f9c1e1e887b5ec41dd2701e9e`.
- kubernetes **94/94·PNG 146개**, [artifact12242663256](https://github.com/Middleages/my-books/actions/runs/39374566657/artifacts/12242663256), ZIP `8958bfbcf2c7f00f6f12994175bfdd2d392ad809ee7c1a3e124d926a4cbeacf5`. 같은 main의 production도94/94·PNG146·오류0이다.
- book-volumes **14/14·PNG 36개·오류 0**, [artifact12243121463](https://github.com/Middleages/my-books/actions/runs/39374566657/artifacts/12243121463), ZIP `b88b8b267b6810aabc36fac1ea3bb11aaadac16b65d69aaa087abd9774db05b4`.

세금·주거·Kubernetes 게시 검사는 각각 애플리케이션 오류 0이다. 각 suite에서 정확히 관찰한 `https://middleages.github.io/favicon.ico`의 404 한 건은 비애플리케이션 진단에 URL·문구와 함께 보존했다. 따라서 전체 콘솔 오류가 모두 0이라고 주장하지 않는다. 앱 경로, 미확인 URL, 다른 상태와 요청 실패는 계속 실패 대상이다.

네 게시 suite가 내려받아 대조한 JS `index-BqMq_R2l.js` 2377701바이트의 SHA-256은 `2191523fa3e45112528f514631933d35d00da4ad8083b15bdeb9bd596ba71f49`, CSS `index-4noGetxv.css` 309708바이트는 `f1ede4b3df8ad7867d5c441ccc0dd306a81d65b58c54fdb140945a73a20e14f8`이다. 앞서 직접 검토한 최종 production과 같은 앱 바이트다.

게시 원본 PNG에서 세금03·04 각각의 1440px 초기, 320px 변경, 390px reduced-motion/정적 표를 직접 열었다. 지급액300의215+25+60 분할, 범례 폭과 금액 눈금의 구분, 결정70·선납150·환급80과 현재 입력 이유가 일치했다. 주거01의320px 변경과02의390px reduced-motion/정적 표, Kubernetes의390px desired-state 정적 대안,1440px 전체 홈과320px 세금 소개 헤더도 직접 확인했다. 모바일 경로·반환·원금/월세 눈금, 단계 제어의 인접, UID 교체·Ready2, 고정 권차와 읽음 분모가 유지됐다. 모든 생성 PNG를 사람이 하나씩 본 것으로 주장하지 않는다.

이로써 B03–04와 주거 A의 main·Pages·정확한 게시 자산·해당 화면의 직접 검토를 완료했다. 실제 Safari/Firefox·터치 기기·스크린리더 음성 출력·학습 효과는 미검증이며 C05–06의 후보 검증과 공개는 별도 게이트다.

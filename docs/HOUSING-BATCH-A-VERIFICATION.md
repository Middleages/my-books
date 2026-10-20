# 집과 주거의 경제 A — 구현·검증 기록

작성: 2026-10-20. 기준 main `da333eb71e2e5c5f00ba70bbddb2f36c1ce50b9f`. 계획 PR #16의 후속 구현 후보이며 **게시 완료가 아니다**.

## 범위와 시각 설계

- 소개·01 `housing-rights`·02 `rent-and-deposit`만 등록. `housing` / `money` / 6권, 읽음 분모 2. 기존 모든 ID·분야·권차·저장 키 보존.
- 01: 같은 집을 중심으로 거주자·임대인/매도인·은행을 다른 형태로 배치한다. 현금의 실선/예정 점선, 반환청구권의 역방향 선, 소유/거주 경계, 채무를 연결한다. 단계와 전체 장부는 동일한 `rightsFrames` 결과다. 보증금은 임대인의 금고가 민지 소유인 것처럼 그리지 않고 은행은 소유 지분으로 그리지 않는다.
- 02: 같은 종류끼리 같은 눈금인 보증금/월세 띠, 추가 자기자금/차입의 분해와 별도 지출·기회비용을 연결한다. 6%는 가상 제안 차이이며 법정 전환율이 아니다. 0분모·역방향·둘 다 더 비싼 제안·자금 부족을 숨기지 않는다.
- 모바일에서는 역할과 경로를 세로로 다시 배치한다. 키보드·재생/정지/한 단계/초기화, 정적 표, reduced-motion CSS를 구현했다. 이 최초 구현 기록과 아래의 후속 실제 production·직접 PNG 검토 결과를 구분한다.
- 실제 개인 자료·주소·계좌 입력, 외부 저장/API, 승인액·안전점수·매수 추천 없음.

## 실제 실행

2026-10-20 cloud worktree, Node/npm 기존 프로젝트 의존성 사용:

- `npm test`: **801/801 통과**. housing 단위 6개 포함. 거래/차입/비용 보존, 가상 기본값, 자금 분해·중복비용 금지, 0·역방향·음수 비교율·1원 부족, 비유한/음수 입력, 예약 ID/권차를 검사했다.
- `npm run build`: TypeScript·Vite production 빌드 통과. 기존 대형 bundle 경고는 남아 있으며 이 범위에서 공통 청크 구조를 바꾸지 않았다.
- `scripts/housing-browser-qa.cjs`: 기존 suite의 실행·게시 자산 대조/증거 형식을 따르는 독립 verifier를 추가했다. 기본은 현재 공개 housing 장 전체, `HOUSING_CHAPTERS`는 명시한 장의 변경 검증이며 알 수 없는 ID는 실패한다.
- 로컬 Chromium 실행은 **브라우저 시작 전 실패**: 기본 sandbox의 `socket() Operation not permitted`. 설치된 Chromium의 로컬 dist 검증을 escalated로 시도했으나 실행 환경 `bwrap`의 read-only 경로 생성 오류로 시작 자체가 실패했다. 해당 경로를 읽거나 수정하지 않았고 우회하지 않았다.
- 그러므로 로컬 브라우저 확인 0개·PNG 0개다. 로컬 통과라고 보고하지 않는다. 권한 거절 통보가 아니라 실행 환경 실패다.

## 공식 근거 확인

2026-10-20 직접 읽음: 생활법령 대항력/우선변제권, 차임/보증금 증감청구, HF 일반전세자금보증. 장별 원문 링크·확인일·사용 범위를 기록했다. 법정 전환율·실제 금리/보증료·권리분석·전세자금 승인/안전성을 구현하지 않았다. 가격/금액/4%/3%/6%는 자체 가상 수치다.

## 게이트 상태

- 독립 금융·모델·시각 코드 리뷰와 그 지적사항의 수정·재검토를 완료했다. 구체적인 범위는 아래 절에 기록한다.
- DB/K8s/변경영향 분류기 후보 통합 후 housing production과 직접 PNG 검토를 완료했다. 1440/850/390/320px·핵심 조작·MDX·console·넘침·모델-막대·읽음 보존·키보드·정지/재실행·reduced-motion·정적 표를 확인했다. 이는 아래 정확한 후보에 한정하며 다음 tax B 합본의 production·공통 권차 검사는 별도다.
- parent가 main 통합 순서를 지정한 뒤 정확한 SHA의 Actions/Pages·게시 JS/CSS 바이트·대표 화면을 확인한다. 현재 main에는 housing이 없다.
- 실제 Safari/Firefox·실기기 터치·스크린리더 음성 출력·학습 효과 측정은 미검증이다.

## 독립 소스 검토와 통합 후보 보강

2026-10-20 독립 검토에서 역방향 보증금에 기회비용 차이를 그대로 제시하는 문제, 02 단계가 설명문만 바꾸던 문제, 자기자금 원금 표현, 0대출 관계를 지적받아 수정했다. 역방향은 경제적 차이 `null`/해당 없음, 실제 지급→월세 누적→전액 반환의 12/24/36개월 모델 프레임·그림·정적 표를 추가했다. 모바일 방향과 단계별 지급 항목도 분리했다.

DB/K8s/영향 분류기 후보 `49f7da4b3be7282376c028c10431b6e7973c5ece`를 별도 housing 브랜치에 통합했다. 타 작업을 보존한 후보이며 main에 아직 게시됐다는 뜻이 아니다. 분류기는 housing 파일·검증 스크립트 발견과 production/published의 동적 matrix를 지원한다. 독립 검토자는 housing 변경이 `book-volumes + housing`으로 선택됨을 직접 확인했다. 합본 위 `npm test`는 896/896, housing 모델은 7/7 통과했다. 이 로컬 통과만으로 실제 브라우저 통과를 주장하지 않으며, 후속 Actions 실행은 아래에 구분해 기록한다.


## 실제 production 브라우저와 직접 캡처 검토

PR #16 후보 `e30af9b9b89d855129621818c99b75df15197f60`, Actions run `39366786631`의 PR 병합 checkout `4fc0a4531c291eb67c06e77bfa10f11bddc5e4ca`에서 housing 46개 검사·28개 PNG·오류 0을 확인했다. artifact `12239329453` ZIP SHA-256 `5ccd53b2a560313a92c6077d90789e095bf4b6bd604ed47e800b5c0a64d474f2`를 대조하고 실제 파일을 열었다. 1440/850/390/320px, 정적 표·reduced-motion, 값과 막대 길이·읽음 보존·재생/정지/초기화가 통과했다. 작성자와 독립 검토자가 1440의 소개·권리·임차 장면, 320/390의 권리·반환 경로와 정적 표를 직접 열어 읽기·숫자·역할·방향을 확인했다.

이는 해당 후보의 production 결과이며 실사이트 게시 증거가 아니다. 발견한 경미한 문제인 모바일 권리 경로 안의 가로 화살표 문자를 방향 중립 문구로 바꿨다. 실제 선의 방향·모델·금액은 유지한다. 이 수정의 최신 production 재검증은 다음 결과로 기록한다. 02 재생 버튼과 시간축 사이의 거리는 후속 사용성 점검 항목이며 회계·방향·가독성 차단 문제는 없었다.

02의 단계 버튼이 모바일 시간축에서 멀다는 실제 캡처 의견에 따라 기존 제어 한 벌을 시간축 바로 위로 이동했다. 단일 usePlayback 상태·타이머를 유지하며 버튼과 첫 변화 패널 사이의 실제 거리(260px 미만)를 브라우저 검증에 추가했다. 기존 기록은 이전 후보에 한정하고 변경 후 실제 캡처를 다시 검토한다.


## 모바일 보강 후 production 재검증

2026-10-20 후보 `6afe8c83801470b88778009edc9a8cfb40e351ba`, [Actions run39368111785](https://github.com/Middleages/my-books/actions/runs/39368111785)의 PR checkout `318c423a35ab2ac266bbd07dac27a4168311d26e`에서 housing production 46/46 검사·PNG 28개·console/page 오류 0을 확인했다. [artifact12240665524](https://github.com/Middleages/my-books/actions/runs/39368111785/artifacts/12240665524)의 ZIP SHA-256은 `e33879d0f4c0b1aa0d4ecb6ba5dc2e2f9a5611c7c1482fba9390ef9cb19c15fd`로 대조했다.

작성자가 새 320/390px 권리·임차 시간축 및 1440px 장면을 직접 열어 방향 중립 문구와 단계 버튼–변화 패널의 인접 배치를 확인했다. 실제 거리 260px 미만 검사와 기존 정지·초기화·reduced-motion·읽음·모델 막대 검사를 모두 유지했다.

- JS `index-CHs_M151.js`: SHA-256 `1466ba01797a6b04d7459fa22fdaa0a9c8d09411101c7bea18618bd88f8a5dd3`.
- CSS `index-D053RyVm.css`: SHA-256 `7571660db1b95bb7063a2cd16c9ca9e9568ef4cd298a02142001ee59ab8e6bff`.

이는 housing 단독 변경 후보의 production 증거다. tax B와 함께 통합한 후보의 production·Pages·정확한 게시 자산은 별도로 확인하며, 아직 게시 완료를 주장하지 않는다.


## 세금 B 합본과 엄격한 게시 진단

세금 B와 합친 head `1a8370d4b9781a444c8e8a56509d6cec72972f97`의 [run39369634236](https://github.com/Middleages/my-books/actions/runs/39369634236)에서 housing 46/46·PNG 28개·오류 0을 확인했다. 통합 후보의 정확한 CSS/JS 및 앞 합본의 작성자 직접 그림 검토 범위는 [세금 B 기록](TAX-BATCH-B-VERIFICATION.md)에 남겼다. 주거 앱·본문·모델은 검증된 `6afe8c8`과 같다.

게시 전에 검증기만 보강한다. 콘솔 문구에 favicon이 포함됐다는 이유로 제외하던 규칙을 없애고, 이미 실사이트에서 관찰한 정확한 `https://middleages.github.io/favicon.ico`의 404만 비애플리케이션 진단으로 별도 보존한다. 앱 안의 favicon·다른 URL/호스트/status·출처 없는 오류·요청 실패는 실패로 남는다. 일반·reduced-motion 양쪽에 콘솔 source/line/column와 실패 응답 URL/status·requestfailed 기록을 설치했다. 3개 회귀 테스트로 양성·음성 분류와 이벤트 보존을 확인했다. 새 검증기의 production 재실행 및 실제 Pages 결과는 다음 기록에 구분한다.

엄격한 진단 보강 후 [run39372275782](https://github.com/Middleages/my-books/actions/runs/39372275782)의 정확한 checkout `1d985a42cb7790845e0713c492bd5bd58a35940f`에서 housing 46/46·PNG 28개를 다시 통과했다. errors·consoleDiagnostics·resourceDiagnostics·nonApplicationDiagnostics는 모두 0이며 앱 SHA-256은 이전 합본과 같다. 작성자가 전달한 최소 패치만 적용됐고 320px 임차 변경 원본을 직접 다시 검토했다. artifact와 최종 게시 전 통합 범위는 [세금 B 기록](TAX-BATCH-B-VERIFICATION.md)의 마지막 절에 남긴다. 이 production 통과와 실제 Pages 통과는 구분한다.


## 정확한 main과 실제 게시 완료 — 2026-10-20

세금 B와 함께 main `b97dbd4ee78b64118a0e88f9f3f5fd1fd08f6b0d`(tree `6d5e0496559139986a1c89f7eb753321261eb1f8`)에 통합했다. [run39374566657](https://github.com/Middleages/my-books/actions/runs/39374566657)의 전체10개 job이 성공했다. 전체909/909 단위 테스트·빌드와 선택한 tax·housing·Kubernetes·권차 production 및 실제 게시 검증을 구분해 통과했다. 이번 실행에서 보험·투자·DB 전체 브라우저 회귀를 한 것은 아니다.

housing published는 **46/46 검사·PNG28개·애플리케이션 오류0**이며 sourceSha가 위 main, sourceChanges가 비어 있다. [artifact12243091719](https://github.com/Middleages/my-books/actions/runs/39374566657/artifacts/12243091719)의 ZIP SHA-256은 `1337eef124f9ff5c0e3693ee3677d11c0d67b13f9c1e1e887b5ec41dd2701e9e`다. 정확히 관찰한 호스트 기본 `https://middleages.github.io/favicon.ico`의404 한 건만 URL과 함께 별도 진단으로 남겼으며 전체 콘솔 오류0으로 표현하지 않는다. 미확인·앱 오류는 여전히 실패한다.

게시 JS `index-BqMq_R2l.js` SHA-256 `2191523fa3e45112528f514631933d35d00da4ad8083b15bdeb9bd596ba71f49`, CSS `index-4noGetxv.css` SHA-256 `f1ede4b3df8ad7867d5c441ccc0dd306a81d65b58c54fdb140945a73a20e14f8`는 직접 검토한 합본 production과 같다. 통합 담당자가 게시320px 권리 변경·390px 임차 reduced-motion/정적 표와 홈을 직접 열어 방향 중립 경로·현금/채무·원금/월세의 별도 눈금·24개월 반환·시간축 인접 제어·주거6권 및0/2 읽음 분모를 확인했다. 이전 작성자·독립 검토자의 production 검토는 앞 절대로 유지된다.

A 소개·01–02의 공개 게이트는 완료했다. B 이후는 별도 후보와 순차 공개 게이트를 따르며 실제 기기·Safari·스크린리더 음성 출력은 미검증이다. 합본의 다른 suite와 정확한 검증 범위는 [세금 B 최종 기록](TAX-BATCH-B-VERIFICATION.md)을 따른다.

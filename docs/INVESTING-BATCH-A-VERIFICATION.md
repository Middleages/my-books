# 투자 교재 배치 A · 소개·소유권·총수익

2026-10-19. 시작 main `30b8c4c19a6a1268c799c7dd12271e2b8dd89b91`. 구현 범위는 소개, 01 `ownership`, 02 `total-return`뿐이다. 기존 모든 책·URL·chapter id·readId·`my-books:read:v1`과 알 수 없는 읽음 ID를 보존한다. 03 이후는 예약이며 카탈로그·링크·읽음 분모에 넣지 않는다.

## 선행 상태

최신 main과 깨끗한 작업 트리에서 시작했다. AGENTS·투자 계획/세션 A·돈 계획/전체 점검·경제 계획/배치 F·작성 기준·홈 구조와 관련 본문·모델·테스트를 확인했다. 투자 구현·기존 배치 검증 기록은 없었다. 돈 소개·01–10과 경제 소개·01–12는 소스에 구현되어 있었다. 시작 main의 [Actions 39246318299](https://github.com/Middleages/my-books/actions/runs/39246318299)는 completed/success였다. 기존 production 빌드 자산은 JS `index-BXSqgr7H.js`, CSS `index-42ZORFLa.css`로 경제 F 최종 기록과 일치했다. 실제 Pages HTML을 curl로 가져와 이 두 자산 경로가 현재 게시본과 일치함을 확인했다. HTML/자산 확인은 실제 게시 DOM 브라우저 확인과 구분하며 후자는 아래 실행 결과를 따른다.

## 장면·모델·가정

| 질문 | 눈으로 발견할 관계 | 시각 속성과 같은 모델 |
| --- | --- | --- |
| 주식 매수대금은 누구에게 가는가? | 회사 또는 판매자와 구매자 사이의 반대 흐름 | 건물/사람 형태, 황토 실선 현금·파랑 점선 주식, `ownershipFrames` |
| 지분 비율 감소가 같은 가치 손실인가? | 관찰 10주는 그대로, 전체 1000→1050과 회사 현금 +5000 | 같은10주 단위100→105칸·전후 분모·회사 현금의 같은 눈금 막대, 같은 거래 프레임 |
| 배당으로 공짜 이익이 생기는가? | 회사 −5000 = 관찰 +5 + 기타 +4995, 관찰 95+5=100 | 회사에서 모든 주주로 갈라지는 현금·주식/현금 합계 경계, `totalReturnFrames` |
| 가격수익과 총수익은 같은가? | 기초100·배당락95·별도 가격110, 가격수익10%와 총수익15% | 동일 눈금 가격 기둥·평가액/현금 띠·손익/표, 같은 프레임 |
| 재투자·매도는 자산을 더 만드는가? | 현금으로 주식 매수, 매도는 역방향; 두 번 더하지 않음 | 양방향 거래 경로·현재 자산 경계·평균원가 실현/평가손익 |

01: 가상 기업1000주, 거래하지 않는 관찰 주주10주, 별도 판매자100주, 신규 구매자 현금10000. 신주50주×100단위, 회사 현금10000→15000, 전체1050주, 관찰 지분1%→약0.9524%. 기존 주식 매매는 회사 현금 유입0. 회사의 다른 자산·가치·발행 후 시장가격은 평가하지 않는다.

02: 01과 별도 기업1000주, 관찰1주, 기업 현금10000·관찰 현금0. 주가100·주당 배당5·이론 배당락95. 현금 지급과 배당락의 실제 날짜 차이를 생략한 교육 관찰 단계다. 지급 현금 부족은 거래 불가이며 음수 기업 현금을 만들지 않는다. 별도 총수익 사례는 기초→배당→독자가 선택한 시장가격→그 가격에서 재투자→선택 매도 순서. 외부입출금·비용·세금0, 분수 주식 허용. 재투자 이후 미래 가격 경로는 계산하지 않는다. 시장 거래 상대의 현금 값은 누적 증감이며 잔액이 아니다. 기초 투자액0이면 수익률 null(정의 불가), 가격0이면 재투자 나눗셈을 거부한다.

본문 MDX·UI React/TypeScript·순수 `.mjs`/`.d.mts`를 분리했다. 기존 playback을 재사용한다. 같은 프레임이 그림·수치·표·예측 판정을 제공하며 반올림은 표시만 한다. 자체 장식 SVG 표지를 추가하고 기존 홈 분야/표지는 유지한다. 앱 의존성은 추가하지 않았다.

## 공식 근거

2026-10-19 원문 확인: SEC Investor.gov [Stocks](https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks), [Primary Market](https://www.investor.gov/introduction-investing/investing-basics/glossary/primary-market), [Secondary Market](https://www.investor.gov/introduction-investing/investing-basics/glossary/secondary-market), [Ex-Dividend Dates](https://www.investor.gov/introduction-investing/investing-basics/glossary/ex-dividend-dates-when-are-you-entitled-stock-and); FINRA [Stocks](https://www.finra.org/investors/investing/investment-products/stocks), [Return and Rate of Return](https://syndication.finra.org/content/key-concepts-return-and-rate-return). 적용 범위는 소유권·발행/유통의 수취자·배당/재투자·수익 정의다. 미국 날짜/결제/세법 규칙을 한국 제도로 옮기지 않았다. 실제 통계·상품 추천·실시간 시세·개인정보 연동은 없다.

## 실행 검증과 환경

클라우드 Linux Node24.19.0. 최초 npm ci는 기본 캐시 쓰기 제한으로 실패했으며 `/tmp` 전용 캐시로 다시 설치해 성공했다. 기준 main 전체296테스트·빌드 성공. 신규 모델20개와 카탈로그/읽음2개를 추가해 현재 `npm test`318/318 통과(실패·건너뜀0), `npm run build` TypeScript·MDX·Vite 성공. 기존 500kB 이상 단일 번들 경고는 유지한다. `git diff --check` 통과.

신규 테스트: 모든 단계의 현금·주식 보존, 발행 분모, 배당 전체 지급/수령, 재투자 현금 단일 차감, 실현/평가손익 합계, 0주·0배당·0주가·0기초금액·초과 매도·지급 부족·잘못된 입력·입력 불변·재실행. 가격/배당/재투자/매도 조합72개도 같은 보존식으로 확인한다.

로컬 Chromium은 sandbox의 로컬 socket EPERM으로 시작하지 못했다. 승격 실행도 executor의 읽기 전용 마운트 설정 오류로 실행 전 실패했다. 이를 브라우저 통과로 기록하지 않는다. 공식 headless-shell 다운로드도 실패했다. 사용자 컴퓨터는 사용하지 않았다.

요청된 실제 화면 검증을 위해 기존 Actions build에 범위를 제한한 production Chromium 검사를 추가했다. Playwright1.56.1은 runner 임시 디렉터리에 설치하며 앱 의존성/권한/인증정보는 바꾸지 않는다. 한국어 캡처용 Noto CJK는 Ubuntu 공식 패키지로 설치한다. 캡처·JSON 증거를 artifact로 남기고, Pages 배포 후 동일 production 자산과 실제 게시 DOM을 별도 job으로 대조한다. 실제 실행 결과와 직접 캡처 검토는 아래에 기록했다.

## 브라우저·main·게시 확인 상태

소개·01·02 구현,318테스트·빌드, 실제 Chromium 데스크톱/모바일 viewport 조작·캡처 검토, main 병합, Pages 배포와 실제 게시 자산/DOM 확인을 완료했다. 아래 실행별 증거를 따른다. 실제 모바일 기기 검증은 아니다.

## 미검증 경계

실제 iOS/Android 기기·Safari/Firefox·스크린리더 음성 출력·독자 학습 효과는 미실행이다. Chromium의 모바일 viewport 검증은 실제 기기 검증과 다르다. 실제 회사 가치·배당락 가격·투자수익을 예측/실증한 것은 아니다.

### 최초 CI 실행 · 진행 기록

Draft PR2의 구현 커밋 `8da1d848da7f709639e15f709aa57e478885b14a`에서 [Actions39248923413](https://github.com/Middleages/my-books/actions/runs/39248923413)을 실행했다. 설치·318테스트·빌드는 성공했다. 실제 Chromium45검사 중42통과,3실패였다. 실패는1440/390/320의 총수익 조건 검사에서 option 문구까지 포함하는 래핑 label을 정확한 짧은 문자열로 찾던 QA 선택자였다. 의미 있는 combobox 역할/이름 패턴으로 수정하고 재실행한다. 최초 실패를 제품 통과로 대신 기록하지 않는다.

이 실행에서 소개/두 장의9렌더, 세 폭의 발행/유통·배당0/기본/지급거부,1440/320 재생·정지·키보드·정적 표,390 reduced-motion, 기존11대표 장 조작, 홈6권/돈분야3권/소개10·12·2장, 읽음 새로고침·미확인ID 보존은 통과했다. 가로 넘침·새 본문del/별표/문단 중첩·앱 콘솔/pageerror는 관찰되지 않았다. 총수익의 재투자/매도 조건은 선택자 실패로 이 실행에서 미완료다. 캡처73개와 JSON을 artifact12184463015에 남겼다.

### 캡처 직접 검토에서 발견한 모바일 공통 눈금 문제

선택자 수정 커밋 `578b67147f8d341bd152d0703279eec017b1758c`의 [Actions39249549687](https://github.com/Middleages/my-books/actions/runs/39249549687)은45브라우저 검사 전부 통과했고79캡처를 남겼다. 그러나 실제320px 재투자/매도 캡처를 직접 보니 가격 기둥 아래 설명이1/2/3줄로 달라 전체 열의 하단 정렬이 그래프 밑선을 어긋나게 했다. 자동 기능 통과를 시각 통과로 간주하지 않고 수정했다. 가격값/120px plot/설명 행을 분리해 plot 밑선을 고정하고, 모든 화면·변경 조건에서 실제 DOM 밑선 차이≤1px를 검사하도록 보강했다. 가로 표의 키보드 오른쪽 스크롤도 실행 검사에 추가했다. 수정본 결과는 아래 후속 실행을 따른다.

직접 검토한 첫 두 실행의 캡처:1440/320 소개·전체 페이지 상단/하단에서 제목·목차·선수 연결·출처·읽음 버튼, 홈의6권/돈분야3권과 투자 표지, 발행/유통·신주105칸과 기존100칸·동일한 관찰 주주 칸·회사 현금 막대, 전체 주주 배당 분기와95+5=100 경계, 재투자/매도 후 현금110+평가액5=115를 확인했다.320에서는 흐름이 세로로 바뀌고 화살표 방향도 일치한다. 표는 문서 넘침이 아닌 내부 스크롤이다. 위 가격 밑선 문제 외에 주요 라벨의 잘림·역할/모델 불일치를 관찰하지 않았다.


### 수정본 PR 검증 · main 반영

최종 구현 커밋 `dd8fe0f6315b20288effd321a4d13a5b76b8b517`의 [Actions39250137718](https://github.com/Middleages/my-books/actions/runs/39250137718)은318테스트·빌드·45브라우저 검사 전부 성공했다. artifact12185895442의79캡처와 JSON을 내려받았다. 수정된1440/320 재투자/매도 화면을 직접 다시 보아100·95·110 기둥의 공통 밑선과 라벨 배치를 확인했다.1440/390/320 렌더와 변경 조건의 DOM plot 밑선 차이는0px였다. 모바일 표의 키보드 가로 스크롤도 통과했다.

독립 검토에서 모델의 보존식·가정·본문/시각 대응·범위를 점검했다. [PR2](https://github.com/Middleages/my-books/pull/2)는2026-10-19 main `d308a13f8fb2b7c6574aecc32ee754168de072ea`로 병합했다. 병합 직전 main이 착수 SHA 그대로임을 확인했다.


### main Actions·Pages·실제 게시본 확인

병합 main `d308a13f8fb2b7c6574aecc32ee754168de072ea`의 [Actions39250791710](https://github.com/Middleages/my-books/actions/runs/39250791710)은 build·deploy·verify-published 모두 success다. build에서318테스트·production 빌드·45브라우저 검사를 다시 통과했다. Pages 배포 후2026-10-19 12:19–12:20 UTC 실제 공개 사이트에서46검사를 모두 통과했다. 게시 HTML HTTP200과 JS `index-OtiE_cWI.js`·CSS `index-BGd1AXy5.css`가 이 run의 배포 artifact와 정확히 같았다. 별도 curl HTML 확인에서도 같은 자산을 확인했다.

공개 검사는1440/390/320 소개·두 장, 조건 변경·그림/표 모델 일치·예측·재생/정지·키보드·reduced-motion·정적 표·기존11대표 장·홈과 읽음 기록 회귀를 다시 실행했다. artifact12185816755(`investing-browser-published`)의 JSON과79PNG를 내려받았고 실제 게시320 목차/본문과390 재투자/매도 장면을 직접 열어 검토했다. 앞서 검토한 production 화면과 같은 배치·눈금·라벨이었다. 앱 console/pageerror0. 브라우저가 별도로 요청한 기존 사이트 루트 `/favicon.ico`의404 한 건은 비앱 자원 오류로 JSON에 남겼으며 숨기지 않았다.

공개 경로: [소개](https://middleages.github.io/my-books/#/investing), [01 소유권](https://middleages.github.io/my-books/#/investing/ownership), [02 가격·배당·총수익](https://middleages.github.io/my-books/#/investing/total-return). 03 이후는 공개하지 않았다. 이 기록을 마감하는 후속 문서 전용 커밋은 위 검증 코드/자산을 바꾸지 않으며, 자체 Actions/배포 결과도 별도로 확인한다.


## F 전체 편집 점검에서의 후속 보강 · 2026-10-19

위 A 실행 수치와 당시 공개 범위는 역사 기록으로 유지한다. F 통합에서는 소개·카탈로그를 최종 12장에 맞추고 A 모델의 표현 불가능한 극소 입력만 보강한다. 양수 거래가 부동소수점 정밀도에서 필수 현금/주식 이동을 전혀 만들지 못하면 소유권 모형은 장부를 그대로 두고 거래를 거부한다. 양수 기초 투자액이 0으로 underflow하거나 계산 수익률이 비유한 값이면 총수익 모형은 입력 범위 오류를 알린다. 임의의 최소 가격/수량을 두지 않으며 표현 가능한 극소 입력·분수 매매·0가격 이전은 유지한다. 0수량/0대금의 설명은 실제 변화에 맞추고 양수 이동만 화살표로 강조한다. 후속 테스트·실제 브라우저·게시 결과는 [F 검증](INVESTING-BATCH-F-VERIFICATION.md)을 따르며 A 당시의 318개 테스트 수를 소급 변경하지 않는다.

F 전체 점검은 최종 500테스트·production160/게시161검사, 1440/390/320 실제 화면과 A의 0수량/0대금 보강을 통과했다. main `f65e334`의 Pages 게시 자산 일치와 전체 workflow success를 확인했으며, 생성 캡처/직접 검토 수와 세부 경계는 F 기록을 따른다.

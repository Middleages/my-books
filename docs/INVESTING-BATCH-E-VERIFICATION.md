# 투자 배치 E 검증 기록

작업일: 2026-10-19. 시작 main: `15f69af07c4aacb88b6525a8c84085ca028b6ebf`.
범위: 09 비용과 환율 뒤의 수익(`costs-fx`)·10 자산배분과 재조정(`allocation-rebalancing`). 기존 책·분야·표지·URL·readId·`my-books:read:v1`과 알 수 없는 읽음 ID를 보존한다. 11·12는 예약 상태로 남긴다.

## 선행 상태

최신 origin/main fetch와 깨끗한 시작 작업 트리를 확인했다. AGENTS·작성 기준·홈 구조·투자 계획/전체 세션 프롬프트·돈 계획/전체 점검·경제 계획/F 기록·투자 A–D 검증과 관련 소스를 읽었다. 선행 D 구현 `d0796c74c87e098a1652e577b42e82c197db45b3`의 [Actions 39269944371](https://github.com/Middleages/my-books/actions/runs/39269944371)는 completed/success다. 실제 Pages HTML도 다시 받아 JS `index-DHBYyoQ9.js`·CSS `index-CQKoJMVh.css`가 D 기록과 같음을 확인했다. D 최종 기록 main `15f69af`의 [Actions 39272271692](https://github.com/Middleages/my-books/actions/runs/39272271692)도 build·deploy·verify-published까지 success로 종료했다. 이는 선행 HTML/Actions 확인이며 E 새 화면 검증이 아니다.

## 장면과 모델 경계

09는 가상의 한 차례 매수·매도에서 외화 가격과 원화 환율의 곱을 읽는다. USD 100→110과 KRW/USD 1,200→1,320은 원화 120,000→145,200, 비용 전 21%이며 두 10%의 단순합 20%와 다르다. 총예산 B에 매수 비용이 포함돼 있을 때 매수대금은 B/(1+f), 비용은 B−매수대금이다. 매도 비용은 매도대금에서 한 번 차감한다. 환전·매매·운용 비용을 구분하고 이미 순자산에 반영된 운용비용을 다시 빼지 않는다. 현행 세율·세액 계산은 없다.

10은 같은 최초 1,000을 가상 주식 600/채권 400으로 나눈 뒤 가격 변화와 비중 이동을 본다. 주식 +20%·채권 0%는 720/400·전체 1,120·주식 약 64.2857%다. 목표 60/40으로 돌아가는 매도 48→현금 48→매수 48의 최종값은 672/448이다. 거래비용·세금 0, 분수 수량 허용의 제한된 모형이며 추천 비중·수익 우월·손실 방지를 판정하지 않는다. 추가 입금은 투자수익이 아닌 외부 흐름이다.

## 검증 진행 상태

09·10의 설명 우선 본문, 모델, 단계별 시각화, 결과, 정적 장부와 카탈로그 연결을 구현했다. 공식 SEC Investor.gov의 International Investing·Understanding Fees·ETF·Asset Allocation·What is Risk·Bonds를 저자와 독립 검토자가 실제 열람했다. 확인일과 미국 자료의 적용 범위는 본문에 기록했다.

- `npm test`: 465개 통과, 실패·건너뜀 0. E 신규 44개 포함.
- `npm run build`: TypeScript와 Vite production build 성공(245 modules). 기존 500 kB 초과 청크 경고는 남아 있다.
- `node --check scripts/investing-browser-qa.cjs`·`git diff --check`: 통과.
- 독립 소스·모델·MDX SSR 검토: 현재 차단 결함 없음. 두 장의 원시 `**`·`del`·중첩 문단 없음. 이는 실제 브라우저 검증의 대체물이 아니다.
- 10장의 UI 입력 169,781조합에서 실행 가능한 재조정의 목표 도달과 총액 보존을 테스트한다. 검토자는 추가로 최소·100·2,000·최대 예산의 679,124조합을 검사했다.

검토 중 극소 양수 예산의 underflow, 매매 수량에 표현되지 않는 극소 거래, 작은 목표금액에서의 부동소수점 오판, 0폭 자산 막대의 테두리, 원시 강조 별표, 프리셋과 native range 격자 불일치를 발견해 수정했다. 예산은 0 또는 0.01 이상으로 제한하고 0가격 자산의 양의 목표액은 거래 전 차단한다. 총액 기준 허용오차는 산술 확인에만 사용하고 실제 매매대금·예측 판정과 구분한다. 1% 주식·−10%/−95% 가격 경로의 거짓 실패 문구를 회귀 테스트와 브라우저 검사에 추가했다.

브라우저 검사기는 앞선 A–D 검사에 E의 모델/결과/정적 표/실제 칠해진 막대·면적·비중선/현금 이동/0·최대·손실·동일비중 조건을 추가했다. 게시 자산은 이름뿐 아니라 다운로드한 정확한 바이트와 SHA-256까지 빌드 산출물과 대조한다. 검사 작성만으로 실행 통과를 주장하지 않는다. 실제 화면·main 병합·배포·게시 검증의 실행 결과는 아래에 구분한다.

로컬 Chromium의 선행 socket EPERM 제약 때문에 중복 재시도하지 않는다. 실제 브라우저 검사는 기존 GitHub Actions Ubuntu·Google Chrome·Playwright 환경에서 수행하고 JSON/PNG를 내려받아 직접 검토한다.

## 실제 Chromium·독립 화면 검토와 병합

[PR #6](https://github.com/Middleages/my-books/pull/6)은 draft로 열어 검사 결과와 독립 검토를 확인한 뒤 ready로 전환하고, 예상 head `6ae5779c02c3df602419c5e66fa940dfee509fdf`를 지정해 squash 병합했다. main 구현 커밋은 `cbbf6d16e5602c2c0720f1dbcf0b3aed94dbd545`다. 마지막 main fetch에서 다른 변경이 없음을 확인했으며 원격 tree SHA와 로컬 `git write-tree`도 일치했다.

- 최초 [PR run 39274790868](https://github.com/Middleages/my-books/actions/runs/39274790868): 132검사 중129통과·3실패,482 PNG. 세 실패는 재조정 후 채권 값 `448.00000000000006`을 `448`과 엄격 동등 비교한 검사기 문제였다. 실제 산술·표시·모델 테스트의 허용 범위와 일치하도록 이 fractional 값에 절대오차 `1e-9`를 사용했다. 정수 기본 총액1,120과 매매대금48, 문자열·상태·ID 판정은 느슨하게 바꾸지 않았다.
- 수정 후 [PR run 39276181179](https://github.com/Middleages/my-books/actions/runs/39276181179): **132/132 통과**, **554 PNG 생성**, application console/page errors **0/0**. 실제 실행 시각은 2026-10-19 15:14:57–15:22:13 UTC다.
- Ubuntu의 Google Chrome·Playwright1.56.1·Noto CJK를 사용해 **1440·390·320px**에서 production 산출물을 검사했다. 09와10은 각각12조건을 세 폭에서 검사한다. 모든 조건에서 단계별 모델 값, 결과 문장, 원화/외화 현금과 자산, 정적 표, 실제 칠해진 길이·면적·목표선 위치를 대조했다.
- 실제 재생·정지·처음부터·조건 초기화, 자동 재생 없음, 키보드 슬라이더·Tab/Enter·focus 표시·표의 가로 스크롤, 예측의 맞음/틀림, reduced-motion 및 정적 대안을 실행했다. MDX 원시별표·`del`·중첩 문단·미등록 내부 링크·페이지 가로 넘침도 검사했다.
- 돈10장·경제12장·투자10장 카탈로그와 기존 A–D 검사, 다른 분야 대표 화면·조작을 유지했다. 새10개 readId를 표시·새로고침한 뒤10장만 해제했을 때 나머지 기록과 `unknown-future/id`·`parallel`·`money/map`이 그대로 남는 것을 확인했다.

작성자와 독립 검토자가 내려받은 실제 PNG에서 대표 장면을 직접 열었다. 554장을 전부 육안 검사했다는 뜻은 아니다. 주요 직접 검토는 다음과 같다.

- 09: 데스크톱·390·320px의21%면적과 작은 모서리1%, 비용2%매수/매도 분기와 수량 감소,0예산/정의 불가, 가격·환율 상쇄, 같은 눈금 최종액, 본문·출처·장말 링크.
- 10:600/400→720/400의 같은 수량/눈금, 데스크톱·모바일48현금 이전,672/448 최종값,0가격 거래 차단과0총액 비중 정의 불가,1%·−10%/−95%작은 목표의 올바른 성공 문구, 최대 조건의437.5/1,312.5/1,750과 정적 장부. 모바일 화살표의 세로 배치와 잘리지 않는 라벨도 확인했다.
- 독립 검토 최종 판단: 남은 차단 결함 없음. 실제 기기·다른 브라우저·음성 읽기 승인을 뜻하지 않는다.

## main 배포와 실제 게시 버전

[main run 39277937642](https://github.com/Middleages/my-books/actions/runs/39277937642)의 실제 build·배포·게시 검사 증거를 확인했다. API의 전체 run 상태는2026-10-19 16:13 UTC에도 종료로 표시되지 않았으므로 **전체 workflow terminal-success는 아직 미확인**이다. 이 불확실성과 아래 실제 완료 로그·산출물을 구분한다.

- main production: **132/132**,554 PNG, application console/page errors0/0. JSON 종료15:32:50 UTC, build 로그의 최종 정리15:32:56 UTC.
- Pages deploy 로그: 구현 SHA `cbbf6d16e5602c2c0720f1dbcf0b3aed94dbd545`의 배포 성공을15:53:51 UTC에 기록했다.
- 실제 Pages 검사: **133/133**,554 PNG, application console/page errors **0/0**. JSON 실행15:54:26–16:01:35 UTC, artifact 업로드·정리16:01:41 UTC. 유일한 비앱 리소스 오류는 기존 `https://middleages.github.io/favicon.ico`의404 한 건이며 앱 오류와 분리했다.
- 게시 artifact의 `published-assets-match-dist`는 HTML 파일명, HTTP200, 정확한 파일 바이트와 SHA-256까지 배포 산출물과 대조했다. 작성자도 별도로 실제 HTML·두 자산을 다운로드해 로컬 production 파일과 `cmp`·SHA-256 일치를 확인했다.

| 게시 자산 | 바이트 | SHA-256 |
| --- | ---: | --- |
| `index-ChodNn1Q.js` | 1,763,377 | `efcc113ee8f80ca7e7531f7c10646b716de0b328339581e144ab46d1901e640e` |
| `index-DmmzNh4Q.css` | 182,005 | `4ca3dd0f08b9e3f0db82e9294c7cbb9089f917ad9d44e7ce27e7591276904fc0` |

게시 검사는 PR과 같은 전체 검사이며 작성자는 게시 PNG에서320px21%면적,320px48현금 이동,390px비중 이동 장면을 다시 열어 읽음·배치를 확인했다. 독립 육안 검토는 앞서 동일한 앱 자산의 PR 캡처로 수행했다. 게시 PNG 전부나 실물 휴대기기를 직접 봤다고 주장하지 않는다.

이 실행에서는 API 상태가 실제 산출물/로그보다 늦게 반영됐다. build 완료 뒤에도 running, deploy 성공 뒤에도 waiting으로 보였고 job 조회에는 일시적 timeout도 있었다. 로그 시각과 실제 게시 바이트를 확인하며 기다렸고 실행 취소·임의 재실행·배포 승인 우회는 하지 않았다. 16:13 UTC에는 전체 run queued, deploy in_progress였지만 deploy의 모든 단계는 success였다. 실제 게시 완료 증거를 근거로 상태 문서를 갱신하고 F 집필에 인계하되 원 run과 이 문서 커밋의 자동 workflow 상태는 계속 별도로 관찰한다. 문서 커밋 자체의 자동 실행은 이 기록 작성 시점에는 미실행이며 통과로 주장하지 않는다.

## 다음 배치 인계

F만 미구현이다. `catalog.ts`의 investing 책 `future` 안내에 D 당시 ‘소개·01–08장 공개’가 남은 작은 메타데이터 불일치는 후속 사전 검토에서 발견했다. 실제 카탈로그10개 경로·읽음 분모·소개 본문은01–10으로 일치하며, F 통합에서 전체12장 문구로 바로잡기로 인계했다. 이 누락을 E에서 이미 고쳤다고 기록하지 않는다.

수치 회귀 작성 시 fractional 산술은 명시한 절대/상대 허용오차로 비교한다. 예: `abs(actual−expected) <= tolerance * max(1, abs(expected))`. 정확한 정수 회계·상태/undefined·문자열·읽음ID는 그대로 엄격 비교하며, 그림은 실제 칠해진 길이/위치를 모델과1px 이내로 확인한다. 작은 목표금액의 사후 확인은 전체 포트폴리오 산술 규모를 고려하되 이 허용오차로 예산 초과 거래를 승인하지 않는다.

## 미검증 경계

실제 iOS/Android 기기·Safari/Firefox·스크린리더 음성 출력·독자 학습 효과는 미실행이다. Chromium 모바일 viewport와 실제 기기를 구분한다. 모델은 실제 시세·투자 적합성·개인 적정 비중을 추정하지 않으며 계좌·개인정보·실시간 API 연동을 하지 않는다.

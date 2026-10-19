# 투자 배치 F · 과거 성과·투자 설명 읽기·전체 점검

작업일: 2026-10-19. 시작 main: `5793a1bab7fecf2f9d137f57d812b9daa3310f05`.
범위: 11 `performance-history`, 12 `reading-investments`, 소개·01–12 전체 편집·통합 회귀. 기존 책·URL·chapter id·readId·`my-books:read:v1`·알 수 없는 읽음 ID를 보존한다.

## 선행 상태와 실행 구분

E의 실제 Pages 배포 로그와 게시 검사 133/133·정확한 JS/CSS 바이트를 확인하고, 그 상태를 기록한 위 main과 깨끗한 작업 트리를 인계받았다. E 전체 Actions terminal 상태가 산출물보다 늦게 반영되는 불확실성은 [E 기록](INVESTING-BATCH-E-VERIFICATION.md)에 그대로 남긴다. 배포 완료 증거를 근거로 F 구현에 착수했으며 착수 당시 미확인 메타데이터를 소급 성공으로 바꾸지 않는다. 이후 E 구현 run39277937642가16:22:47 UTC 갱신에서 `completed/success`로 확정된 것을 별도로 확인했다.

AGENTS·전체 투자 세션 프롬프트·투자 계획·작성 기준·홈 정보구조·돈/경제 계획과 검증·투자 A–E 및 기존 본문·모델·테스트를 읽었다. 두 장의 집필과 독립 전체 검토를 분리하고 카탈로그·검사기·문서 통합은 별도로 확인한다.

## 구현한 학습 관계

- 11: 두 경로 `[100,150,75,100]`, `[100,95,90,100]`의 종점 수익률 0%와 최대낙폭 50%/10%. 해당 시점까지의 정점만 사용한다. 손실 50%의 회복은 100%, 손실 100%의 백분율 회복은 정의 불가다. +50%/−50% 산술평균 0%와 누적 −25%를 구분한다.
- 최대 세 고정 가상 규칙의 선택 이전/이후 구간을 분리한다. 각 창의 시작값 100은 별도 정규화이며 연속 잔액으로 더하지 않는다. 미래 자료 미리 보기와 이후 성과를 보고 재선택하기는 독립 검토가 아님을 표시한다. 실제 백테스트 엔진·추천·성공 확률은 없다.
- 12: 세 자체 가상 주식·일반 채권·일반 ETF 설명서의 권리/약속, 기초자산, 가격/수익 기준, 비용, 유동성, 손실 조건, 추정과 누락 정보를 읽는다. 근거 선택마다 이유와 반례를 설명하며 상품 적합성이나 개인별 선택을 판정하지 않는다.
- 전체 편집: FX 교차항을 실제 환율 변화율이 아닌 처음 원금 대비 추가 금액·수익률 기여 %p로 명확히 한다. 일반 채권의 가상 수량을 펀드의 ‘좌’와 구분한다. 공개 안내의 오래된 08장 표기를 최종 12장으로 맞춘다. A 극소 입력의 표현 불가능한 거래/비유한 수익률을 좁게 차단한다.

## 로컬·독립 검증

본문·모델·UI·카탈로그와 검사기를 구현했다. 현재 로컬 `npm test` 500/500(실패·건너뜀0), TypeScript·Vite production build(253 modules), QA 문법·diff whitespace 검사를 통과했다. 기존 500kB 초과 단일 번들 경고는 유지한다. 독립 검토는 13개 MDX의 메모리 내 SSR, 65개 내부 링크/69개 실제 경로, 기존·신규 모델과 UI·CSS를 확인했다. 추가로 5,000개 가상 경로의 이전 정점/최대낙폭, 101개 손실률과 6개 고정 규칙 창을 대조했다.

검토에서 추정의 시점과 미래 현금의 시점을 구분하도록 12장 분류를 ‘추정·평가’로 정리했고, 11장의 최대낙폭 정의 문장을 명확히 했다. 0수량/0대금 발행·유통의 설명과 양수 이동 강조도 실제 장부에 맞췄다. 이후 실제 Chromium·독립 화면 검토·PR·main 반영을 완료했으며 아래 실행 증거를 따른다. 검사 작성이나 SSR만으로 브라우저 통과를 주장하지 않는다.

수치 비교는 분수 계산에 한해 명시적 절대오차와 상대오차를 함께 제한한다. 브라우저의 신규 `assertClose` 기본은 `abs(actual−expected) ≤ 1e−9 + 1e−12×abs(expected)`다. 정수 회계·ID·문자열·판정·정의 불가 상태는 엄격 비교한다. 실제 칠해진 길이·위치와 모델은 별도 1px 기하 기준으로 확인하며, 허용오차를 금융 거래 승인 규칙으로 쓰지 않는다.

로컬 Chromium의 기존 socket EPERM 제약 때문에 중복 시도하지 않는다. 기존 GitHub Actions의 실제 Google Chrome·Playwright1.56.1·Noto CJK 환경으로 production/게시 검사를 실행하고 실제 JSON/PNG를 내려받는다. 생성한 PNG 수와 직접 열어 본 대표 이미지 수를 구분한다.

## PR의 실제 Chromium·독립 시각 검토

구현 head `868048faaba8da126794be46f96cac162d75cb54`의 [PR7](https://github.com/Middleages/my-books/pull/7)과 [run39286051856](https://github.com/Middleages/my-books/actions/runs/39286051856)을 확인했다. 실제 production Chromium 실행은 2026-10-19 16:31:33.053–16:38:50.715 UTC이며 **160/160 검사 통과, PNG 680개 생성, 앱 console/page error 0**이다. artifact `12204305675`(183,301,037 bytes)의 실제 JSON과 PNG를 내려받았다. build job의 테스트·빌드·브라우저 단계와 run 전체가 최종 `completed/success`다. PR의 deploy/verify-published는 의도적으로 skipped이며 게시 성공으로 세지 않는다.

검사 범위는 1440/390/320의 소개와 12장, 신규 네 실험의 경로·현재/최대낙폭·회복·복리·자료 창·문장 분류·자료 선택, 모든 기존 투자 실험의 변경 조건·그림/표/모델 대응, 1440/320의 키보드·재생·정지·한 단계·초기화, 390 reduced-motion·정적 표다. 실제 칠해진 선/면적/띠와 모델·공통 축·모바일 재배치·문서 넘침·레이블·MDX를 검사한다. 홈 6권/돈 분야 3권, 기존 11개 대표 장 조작, 돈10/경제12/투자12장 수, 새로고침 후 읽음 저장과 알 수 없는 ID 보존도 통과했다.

독립 검토자는 **32개 서로 다른 PNG를 직접 열어** 신규 네 실험의 세 폭, 주식/채권/ETF 구조, 0·단일 관측 경로, A의 0수량, E 수정 설명과 소개를 확인했다. 통합 담당자는 별도로 **22개 서로 다른 원본 캡처**를 확인했다. 긴 화면은 원본 크기의 부분 보기도 열어 확인했으며, 8개의 부분/원본 크기 보기를 추가 생성 화면으로 세지 않았다. 두 검토자의 집합은 겹치므로 54개의 서로 다른 화면으로 합산하지 않는다. 680개 생성은 전부 수동 검토했다는 뜻이 아니다.

관찰 결과: 같은 종점의 50%/10% 최대낙폭, 이전 정점만 쓰는 선, 100% 손실의 정의 불가, 분리된 과거/이후 창, 미래 누출·재선택 경고, 주식 1% 지분·채권 미래 약속·ETF 60/40 노출, %p와 채권 ‘개’ 표기가 모델과 맞는다. 좁은 폭에서는 관계를 세로로 재배치하고 주요 설명이 줄바꿈된다. 네이티브 select의 긴 선택 문구 일부는 320px에서 축약되지만 동일한 결론을 피드백 본문에서 완전히 읽을 수 있다. 큰 정적 표는 문서 넘침 없이 내부 가로 스크롤과 키보드 대안을 유지한다. 출시 차단 문제는 발견하지 않았다.

### 독립 검토자가 직접 연 PR PNG 32개

아래는 artifact 안의 정확한 파일명이다.

```text
1440--investing-performance-history-1-paths.png
390--investing-performance-history-1-paths.png
320--investing-performance-history-1-paths.png
1440--investing-performance-history-2-loss-50.png
390--investing-performance-history-2-loss-100.png
320--investing-performance-history-2-loss-0.png
1440--investing-performance-history-3-held.png
390--investing-performance-history-3-future-leak.png
320--investing-performance-history-3-reselection.png
1440--investing-reading-investments-1-stock-classified.png
390--investing-reading-investments-1-bond-classified.png
320--investing-reading-investments-1-etf-classified.png
1440--investing-reading-investments-1-stock-structure.png
390--investing-reading-investments-1-bond-structure.png
320--investing-reading-investments-1-etf-structure.png
1440--investing-ownership-1-issuance-zero.png
390--investing-ownership-1-secondary-zero.png
320--investing-ownership-1-issuance-zero.png
1440--investing-costs-fx-1-default-21.png
390--investing-costs-fx-1-default-21.png
320--investing-costs-fx-1-default-21.png
1440--investing-costs-fx-1-multiplicative-area-primer.png
390--investing-costs-fx-1-multiplicative-area-primer.png
320--investing-costs-fx-1-multiplicative-area-primer.png
1440--investing-allocation-rebalancing-1-budget-1000-weight-60-stock--40-bond--10.png
390--investing-allocation-rebalancing-1-budget-1000-weight-60-stock--40-bond--10.png
320--investing-allocation-rebalancing-1-budget-1000-weight-60-stock--40-bond--10.png
1440--investing-full.png
390--investing-full.png
320--investing-full.png
320--investing-performance-history-1-zero.png
390--investing-performance-history-1-single.png
```

## main·Pages·실제 게시 확인 완료

E 최종 문서 commit `5793a1b`의 [run39284020750](https://github.com/Middleages/my-books/actions/runs/39284020750)은 build/deploy/verify-published 전체 `completed/success`로 확정됐다(updated 16:44:32 UTC). E 게시 검사와 겹쳐 페이지를 바꾸지 않도록 이 종료를 확인한 뒤 F를 병합했다.

PR7을 main `f65e3345aebb8fcf9709ed12dce7ea7e1cf9c726`으로 병합했다. 병합 직전 main은 시작 SHA 그대로였고, 병합 후 tree `cffbecb3ea6aeda542b27681741adff31214232b`는 검토한 PR tree와 정확히 같다. [main run39288565949](https://github.com/Middleages/my-books/actions/runs/39288565949)의 build와 Pages deploy는 `completed/success`다. main production 검사도 16:48:44.991–16:56:08.462 UTC에 160/160 통과·680 PNG 생성·앱 오류0이었다. 실제 artifact `12205750311`(183,301,046 bytes)의 JSON/PNG와 Pages artifact `12204543026`을 내려받았다.

17:01 UTC의 별도 HTTP 요청에서 공개 HTML이 F의 JS/CSS를 가리키고, 공개 자산을 내려받아 main Pages artifact와 `cmp`로 바이트까지 일치함을 확인했다. 이 자산 대조와 별도로 아래 포괄적인 게시 Chromium 검사를 완료했다.

| 게시 자산 | bytes | SHA-256 |
| --- | ---: | --- |
| `index-zixf_S2x.js` | 1,864,076 | `717f804afc8baa5180b9e5a2ca562d959695fcb9ef82b322c1c5215648e137e5` |
| `index-CMeCovMO.css` | 193,754 | `a28e60acc84c9a415aacea5cce98803b07060062108b1b32f8c1c7ea0f438d65` |

### 실제 게시 Chromium과 종료 상태

게시 실행은 **2026-10-19 16:57:00.164–17:06:25.686 UTC, 161/161 통과·680 PNG 생성·앱 console/page error 0**이다. `published-assets-match-dist`가 HTTP200·정확한 파일명·바이트·SHA-256을 대조하고 나머지 160검사는 production과 같은 전체 범위를 실제 공개 사이트에서 다시 실행했다. artifact `12205752172`(183,301,475 bytes)의 JSON과 PNG를 직접 내려받았다. 브라우저가 별도로 요청한 기존 사이트 루트 `/favicon.ico`의404 한 건은 비앱 자원 오류로 JSON에 남겼다. 숨기거나 앱 오류로 합치지 않았다.

main run39288565949는 build·deploy·verify-published 모두 성공했고 17:06:38 UTC 갱신에서 전체 `completed/success`로 확정됐다. deploy job은 16:56:22–16:56:32 UTC에 완료됐다.

통합 담당자가 실제 게시 PNG 네 개를 직접 열어 PR 화면과 같은 축·면적·모바일 재배치·값·설명을 확인했다: `320--investing-performance-history-1-paths.png`, `1440--investing-performance-history-2-loss-50.png`, `390--investing-performance-history-3-future-leak.png`, `320--investing-reading-investments-1-etf-structure.png`. 독립 검토자도 아래 여덟 게시 PNG를 직접 열어 네 신규 실험과 세 폭, 소개·0수량을 다시 확인했으며 출시 차단 문제를 발견하지 않았다. 두 검토자의 집합은 겹치므로 12개 서로 다른 화면으로 합산하지 않는다. production/게시의 680개 생성 수를 직접 열어 본 수로 쓰지 않는다.

독립 게시 직접 검토 목록(8개):

```text
1440--investing-performance-history-1-paths.png
320--investing-performance-history-2-loss-100.png
390--investing-performance-history-3-future-leak.png
1440--investing-reading-investments-1-stock-structure.png
390--investing-reading-investments-1-bond-structure.png
320--investing-reading-investments-1-etf-structure.png
320--investing-full.png
390--investing-ownership-1-secondary-zero.png
```

공개 경로: [책 소개](https://middleages.github.io/my-books/#/investing), [11 과거 성과와 손실 경로](https://middleages.github.io/my-books/#/investing/performance-history), [12 투자 설명 함께 읽기](https://middleages.github.io/my-books/#/investing/reading-investments). 소개·01–12를 모두 공개하며 안정 ID·기존 책·읽음 기록을 유지한다.

이 결과를 마감하는 후속 커밋은 계획·검증·전체 점검·시리즈/홈 안내 문서만 바꾸며 앱·모델·검사기·워크플로·빌드 자산을 바꾸지 않는다. 문서 링크·현재/역사 상태·수치·변경 검사를 독립 확인하고 자동 Actions 실행의 최종 상태를 별도로 확인한다. 문서만을 위해 로컬 UI 검사를 불필요하게 반복하지 않으며 그 자동 실행이 끝나기 전 성공을 미리 적지 않는다.

## 미검증 경계

실물 iOS/Android 기기·Safari/Firefox·스크린리더 음성 출력·독자 학습 효과는 미실행이다. Chromium 모바일 viewport는 실제 기기 검증이 아니다. 실제 시세·회사 가치·미래 수익·투자 적합성을 실증하거나 계좌·개인 금융정보·인증정보·실시간 API와 연결하지 않는다.

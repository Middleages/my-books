# 보험 배치 C · 05–06 검증

작성일: 2026-10-20 KST. 기준 main `cefdf5f8eeb277a86f783aa5ab2f973644a75a3c`(B 실제 게시·독립 화면 검토 완료). 범위:05 coverage-conditions·06 overlap. 구현과 실행·게시 증거를 구분한다.

## 설계와 범위

05는 계약 효력일0, 담보 보장개시 전0–29일, 감액30–89일, 정상90–364일, 종료365일의 가상 조건을 사건일과 함께 읽는다. 청구일은 별도 표시하며 보장 사건·제외·날짜를 다른 관문으로 확인한다. 자료 미확인은 확정0원이나 자동 거절로 바꾸지 않는다. 실제 건강정보·가입 심사·법률 판단을 수행하지 않는다.

06은 하나의 대상손실을 두 실손계약이 나누어 채우는 관계를 보여준다. 대상손실300만원·적격 남은한도300/300만원에서는 자체 가상 배분식으로150/150만원이다. 대상 밖 손실과 한도 부족은 남겨 두며 정액100/200만원 약속은 각 사건 조건과 별도 줄에 둔다. 실제 약관의 비례배분식을 보편적으로 재현하지 않는다.

## 검증 상태

현재 구현과 테스트를 준비하는 단계다. 단위·SSR·실제 브라우저·독립 검토·게시 결과는 실행 이후 아래에 기록한다. 실제 실행하지 않은 항목을 통과로 쓰지 않는다.

## 기존 Actions 안의 병렬 검증 설계

C부터 보험과 기존 투자/교재 회귀를 별도 runner의 병렬 job으로 실행한다. 각 job은 같은 build의 github-pages artifact를 내려받으며 파일·서버 포트를 공유하지 않는다. Node22·Playwright1.56.1·기존 Chrome·Noto 글꼴, 검사 스크립트·뷰포트·상호작용·증거 artifact를 유지한다. production 양쪽이 성공해야 deploy가 실행되고, 게시 양쪽도 성공해야 전체 게시 검증이 완료된다. 하나의 실패를 성공으로 취급하거나 검사를 줄이지 않는다. 기존 서비스와 권한 범위를 유지하며 독립 검토와 실제 Actions 결과로 의존성을 확인한다.

실물 기기·Safari/Firefox·스크린리더 음성·학습효과·개별 계약 적합성은 미검증이다.

## 구현·독립 검토 과정

05·06의 MDX, 순수 모델/타입, 반응형 날짜 축·관문·단일 손실 분해·별도 정액 연결, 정적 표와 키보드 조작을 구현했다. 소개·카탈로그에는 구현한 여섯 장만 등록했다. 기존 읽음 ID·미확인 ID 보존 및 일곱 MDX의 실제 SSR 렌더·내부 링크 검사를 부모 실행에서 통과했다.

독립 검토 중 매우 큰 한도와 극소 한도가 함께 있을 때, 잔차를 작은 계약에 배정하면 그 계약 한도를 넘을 수 있음을 발견했다. 작은 몫을 직접 비례 계산하고 큰 몫에만 부동소수 잔차를 두며 각 계약의 정확한 상한을 지키도록 수정했다. 양방향 극단값 회귀를 추가했다. 독립 고정 난수200,000사례에서 각 계약 지급≤자기 한도, 비음수, 전 프레임 손실 보존, 비례식과의 일치를 확인했다. 비율 상대오차 최댓값은 약4.44e−16이었다. 날짜·조건 조합8,712사례도 별도 검토를 통과했다.

0% 한도 막대의 테두리가4px 폭을 만들 수 있는 CSS도 게시 전에 수정했다. 가로 테두리 폭을 제거하고 위아래 점선만 사용해 0원과 실제 폭이 일치하게 했다. 실제 브라우저 verifier는 외곽선과 채움의 가로 위치·폭을 모델 값과 비교한다. 정적 코드 검토만으로 실제 화면 복구를 주장하지 않는다.

CI 변경은 독립 검토자가 의존성·동일 artifact·격리된 runner·기존 브라우저 환경·권한·실패 증거 업로드를 읽고 승인했다. 새 구조 테스트7개를 독립 실행했고, 구현자는 위험한 변형12개가 테스트에서 거부되는 것도 확인했다. 설치된 PyYAML로 YAML 구문을 읽었다. 실제 새 job 의존성과 양쪽 검사 결과는 이번 Actions 실행에서 확인한다.

공식 근거는 생활법령의 가입 시 확인사항·지급 면책·보험금 지급·무효와 해지(본문 기준2026-09-15), 손해보험협회 FAQ17쪽, 금융위2022-12-27의 개인·단체실손 안내 원문을 확인했다. 작성자와 독립 검토자가 실제 페이지를 읽었으며, 날짜·배분식은 자체 가상 계약으로 구분했다. 과거 중지·재개 조건이나 미래 시행 예정 제도를 현재 전체 계약에 적용하지 않는다. 정확 URL·확인일은 각 MDX에 있다.

## 게시 전 실행 결과

- 전체 `npm test`:628/628 통과, 실패·건너뜀0. 기존571개에 C모델44개·UI/SSR6개·CI구조7개를 추가했다. 독립 검토자가 전체를 직접 실행했다.
- `npm run build`: TypeScript/Vite 성공,280modules. 기존 대형 번들 안내만 남는다.
- `git diff --check`, 보험 browser verifier의 `node --check`, 여섯 장·일곱 MDX source audit 통과. verifier의 정적 셀 생성기와 실제 SSR 표를 대조해05의14행·06의16행이 일치함을 확인했다.
- C browser 검사는 기존54개를 보존하며 총82개를 준비했다. 날짜/조건17사례와 실손/정액14사례를1440/390/320/850px에서 모델·도형과 비교하고, 실제 키보드·단계·정지·초기화·정적표·reduced-motion를 검사한다. 성공시 예상403PNG이며 아직 생성·직접검토 완료 수가 아니다.

현 단계는 코드·본문·로컬 실행·독립 소스 검토 완료다. 새 병렬 Actions의 실제 production·게시 브라우저, 대표 PNG 직접 검토, main/Pages 최종상태와 자산 바이트 일치는 아래 후속 증거로 기록한다. 로컬 브라우저의 기존 환경권한 제한을 우회하지 않는다.

최신 main 통합: 게시 직전 병행 세금 계획 PR#8이 `ff16ea7063c9f44b0c37a24d3b245458e085a50a`에 먼저 병합되어 이전 기대 SHA로의 갱신은 반영되지 않았다. 새 main의 TAX 계획·프롬프트 두 파일을 원문 그대로 보존하고 그 위에 C 변경을 재구성했다. 병행 변경은 문서 두 개뿐이며 앱·모델·테스트·워크플로 충돌은 없었다. 강제 갱신을 사용하지 않는다.

## 실제 production·게시 게이트 완료

2026-10-20 UTC/KST, main `1ff04e672cb10f0b25d118f78069860d4f139359` / tree `8dc9a98dba3c8ae3cc4df99b4a85e79071056476`의 [run39343057214](https://github.com/Middleages/my-books/actions/runs/39343057214)이 00:07:59 UTC에 최종 success로 끝났다. build·production 보험/투자 두 job·Pages deploy·published 보험/투자 두 job 모두 success다. 병렬 검증에서 한 쪽의 결과로 다른 쪽을 대신하지 않았다.

게시 보험 artifact `12230593513`을 다운로드해 `results.json`을 직접 읽었다. Chromium `155.0.8059.39`, mode published, source/workflow SHA가 위 커밋과 일치하고 sourceChanges는 빈 값이다. 82/82 검사 통과, 403PNG 생성, 앱 콘솔·페이지·리소스 오류0이다. 소개·01–06의 MDX/링크·화면, 모델/실제 도형, 1440/390/320/850px, 키보드·정지·초기화·정적표·reduced-motion, 기존 읽음/미확인 ID 보존을 포함한다. PNG 생성 수는 직접 검토 수가 아니다.

게시 HTML에 연결된 JS/CSS는 정확한 build artifact와 전체 바이트 및 SHA-256이 일치했다.

| 게시 자산 | 바이트 | SHA-256 |
| --- | ---: | --- |
| index-C_9qgmoC.js | 2,036,011 | 8851f536263f3ab39c4105ef7b094b27e38de61fb03e8bacb10e5f4fa9fccd11 |
| index-DbQH4In0.css | 235,483 | 779e9eb463410ef7bfdfb83ecdb3b2f83e3438efde35e6efe4ca110134e4bbc8 |

조정자가 직접 연 게시 장면 네 개:
- `1440--insurance-coverage-conditions-initial-scene-1.png`
- `320--insurance-coverage-conditions-1-coverage-start-day-30-half-benefit-scene.png`
- `1440--insurance-overlap-1-unequal-caps-one-to-three-shares-scene.png`
- `320--insurance-overlap-1-two-caps-leave-a-visible-gap-scene.png`

05에서 사건일/청구일은 분리된 행의 같은 날짜 눈금을 읽고, 30일 경계의 50% 지급과 관문 판단이 일치했다. 06의 한 손실 띠에서 A/B 75/225만원 비율과 미보전 공백을 읽을 수 있고, 정액 약속은 손실 밖의 별도 영역에 남는다. 모바일은 라벨·관문·정액 경로를 재배치하며 긴 표만 이름 있는 내부 스크롤에 둔다. 정지·키보드·재생 성공은 실제 브라우저 assertions의 근거이며 정적 PNG만으로 주장하지 않는다.

이 사후 증거는 D 변경에 함께 기록한다. 사용자 컴퓨터는 사용하지 않았으며 새 cloud workspace의 로컬 Chromium도 socket 권한 제한으로 실행되지 않아, 기존 지원 경로인 Actions Chromium 증거를 검토했다. 실제 기기·Safari/Firefox·스크린리더 음성·현실 계약의 적합성은 미검증이다.

독립 게시 화면 검토도 통과했다. 검토자는 아래 원본 PNG10개와 320px 핵심 그림·reduced-motion 정적표의 원본 해상도 영역을 직접 확인했다. 확정/미확인 관문, 겹치는 날짜의 별도 행, 손실0일 때 채움0, 양쪽 제외의 미보전 손실과 별도 정액 약속, 모바일 아래쪽 화살표와 라벨에서 차단할 결함을 발견하지 못했다. 표의 잘린 오른쪽 열은 의도된 이름 있는 내부 스크롤 영역이며 실제 전체표 접근성 검사는 위 브라우저 결과로 확인한다.

- `1440--insurance-coverage-conditions-1-first-full-day-90-scene.png`
- `1440--insurance-overlap-1-equal-caps-share-one-loss-scene.png`
- `850-coverage-conditions-initial-scene.png`
- `850-overlap-two-caps-leave-a-visible-gap-scene.png`
- `390--insurance-coverage-conditions-1-same-day-event-and-claim-use-separate-markers-scene.png`
- `320--insurance-coverage-conditions-1-unconfirmed-information-is-unresolved-scene.png`
- `390--insurance-overlap-1-both-ineligible-with-visible-loss-scene.png`
- `320--insurance-overlap-1-zero-loss-zero-painted-partition-fixed-promises-separate-scene.png`
- `390-coverage-conditions-reduced-motion-static.png`
- `390-overlap-reduced-motion-static.png`

C 게이트를 닫은 뒤 D07–08을 진행한다. 이 결과는 당시 C 판의 근거이며 이후 D/E 검증을 대신하지 않는다.

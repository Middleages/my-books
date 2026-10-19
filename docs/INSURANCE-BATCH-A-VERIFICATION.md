# 보험 배치 A · 소개와 01–02 검증

작성일: 2026-10-20 KST. 기준 main `caf65032d45e0ced4b0149800bd0efc1c888c0f1` (계획 반영). 범위: 소개·01 expected-loss·02 pooling. 이 기록의 구현/실행/게시 상태를 구분한다.

## 구현과 학습 설계

- 01: 확률100개 점·같은 기대손실20만원과 손실100/2,000만원의 공통 눈금, 현금200만원 경계를 나란히 본다. 결과 전/사건 없는 대안/사건 발생 대안은 같은 출발 상태에서 계산하며 연속 손실로 누적하지 않는다. 확률0/100에서는 불가능한 대안임을 표시한다.
- 02:20가구의 분담금→공동 재원→피해 가구의 지급 흐름과 총청구 띠를 연결한다. 분담금200만원+별도준비금100만원, 피해2가구는 지급200/남음100만원.8가구는 지급300/미충당500만원. 이미 청구되었으나 아직 안 나간 지급액과 재원 자체의 부족을 분리한다.
- 초기/지급 전/지급 후 장면·숫자·정적 표는 순수 모델의 같은 프레임을 사용한다. 화살표는 이동 방향, 비례 띠는 금액, 집/번개/사선/직접 라벨은 역할과 상태를 표현한다.
- 새 bookId insurance, money 분야, 장2개만 공개. 기존6권·URL/readId·저장키와 알 수 없는 읽음ID를 보존했다. 소개와 SVG 장식 표지를 추가했다. 이후8장 예약 ID는 공개하지 않았다.

## 모델·사실·출처의 경계

금액은 원으로 계산하고 만원으로 표시한다. 확률·손실·현금·분담금·피해 가구는 자체 가상 데이터다.100개 점은 미래100번의 결과 보장이 아니며2/8가구 사례는 독립성 검증이나 현실 발생률 추정이 아니다. 준비금은 이 모형의 별도 출발 재원이며 실제 보험회사 회계상 책임준비금/자본 규제가 아니다. 부족할 때의 비례배분은 교육모형 규칙으로, 실제 보험자가 임의로 약정 보험금을 삭감해도 된다는 뜻이 아니다.

NAIC의2005년판 A Regulator’s Introduction to the Insurance Industry와 How Does Insurance Work? 원문에서 기대손실·공동 부담·보장 사건·보험료·청구 구조를 확인했다. 원문 링크/절·확인일은 각 MDX에 있다. 외국 제도를 한국의 현행 계약규칙으로 쓰지 않는다. 실제 상품가격·건강정보·가입·계약변경·추천은 없다.

## 실행 검증

환경: 독립 Linux cloud checkout, Node24.19.0. `npm ci` 성공(최초 offline은 캐시누락으로 실패했으므로 일반 레지스트리 설치로 완료). 로컬 Chromium은 이전 세션에서 환경권한으로 실행 불가가 확인되어 지원되는 GitHub Actions Chromium 경로로 검증한다. 실제 브라우저 실행 없이 통과를 주장하지 않는다.

- `npm test`:530/530 통과, 실패/건너뜀0. 새 모델28개+카탈로그2개와 기존500개. 기대값·확률0/1·현금/손실0·유한범위·표시반올림·공동재원/가구 지급 합·무피해·공통충격·재현/입력불변을 포함한다.
- 부동소수 지급은 모든 가구에서 지급≤청구, 미지급≥0을 유지하고 총합 잔차는 모델에 명시한 machine-scale 허용오차로 검증한다. 0.1원·다수가구·큰 금액도 테스트한다.
- `npm run build`: TypeScript/Vite 성공,264modules. 기존 단일 번들500kB 초과 안내는 남는다.
- `git diff --check`: 통과.
- 기존 투자 browser verifier의 홈 권수·돈 분야 목록만 현재 카탈로그에서 유도하도록 갱신했다. 기존 투자 계산/조작 검사를 제거하지 않았다.
- 보험 전용 verifier는 현재 공개된 장만 탐색하고1440/390/320, 모델/도형 비율·예측·재생/정지/한 단계/초기화·입력 변경·키보드·정적표·reduced-motion·MDX/링크·읽음/미확인ID·실제 자산 바이트/해시를 검사한다. 스크립트의 존재는 실행 통과가 아니다.

## 독립 검토·실제 화면·게시

계획 독립 검토에서05의 계약 효력일/담보개시일 구분과10의 설명서 관계도 설계를 보강했다. B–E 공식원문 추가 확인에서 공적/직장/개인의 비배타성, 특약의 제한 기능, 재가입/건강심사의 구별, 해지 전 사건의 청구권, 필요시 추가서류 경로를 계획에 반영했다.

A 코드 독립 검토는 승인되었다. 검토자가 전체530테스트·빌드를 따로 실행했고, 모델별10,000개 고정 난수 사례에서 모든 프레임의 보존/유한값/지급한도/비음수를 검사했다(최대 상대오차2.41e−15). 비활성 화살표의 텍스트까지 흐려지는 CSS를 화살표 선에만 적용하도록 수정하고, 사이드바와 겹칠 수 있는 태블릿 폭에서 공동재원 그림을1000px 이하 세로 배치로 바꿨다. 이후530테스트·빌드를 다시 통과했다. 실제850px 검사도 verifier에 추가했다. Actions production/게시 브라우저·실제 PNG 직접검토·main/Pages 최종상태는 아직 진행 중이다. 아래에 확인된 결과만 추후 추가한다. 실제 iOS/Android·Safari/Firefox·스크린리더 음성·학습효과는 미검증이며 모바일 viewport 검사와 혼동하지 않는다.


### 첫 Actions 검사에서 잡은 표시 결함

main `d38eb905abff1e0c7e516cb208d7e02b1bb05e21`의 [run39328678199](https://github.com/Middleages/my-books/actions/runs/39328678199)은 기존 투자 production160검사를 통과했으나 보험31검사 중7개가 같은 원시 Markdown 강조 문법으로 실패했다(24통과,57PNG 생성). 01의 `확률 전체100%` 뒤 조사와 맞물린 강조 별표가 실제 DOM에 남은 문제다. 02의 모든 조건/도형검사·850px배치·읽음회귀·앱콘솔은 통과했지만01조건검사는 DOM검사에서 조기 종료되어 계산/도형 통과로 주장하지 않는다. Pages deploy/게시검사는 실행되지 않았다.

해당 강조를 명시적strong으로 바꾸고 보험 MDX전체를 Vite SSR/React로 실제 렌더해 원시별표·취소선·문단중첩·미공개링크를 검사하는 회귀 테스트를 추가했다. 새보험 브라우저검사를 기존전체회귀보다 앞에 놓아 다음 결함을 빨리 발견하도록 했으며 기존검사를 삭제/축소하지 않았다. 수정판의 실제결과는 후속기록에서 구분한다.

수정판 로컬 검증: `npm test`531/531, `npm run build`264modules, `git diff --check` 통과. 새SSR렌더테스트는3개MDX를 실제렌더했다.320px의 작은 확률범례가 ‘있음’을 음절별로 나누지 않도록 keep-all을 보강했다. 최초 실패판에서 실제본 대표이미지는 별도 검토 기록이며 새판 최종승인을 대신하지 않는다.

### 수정판의 실제 production·Pages 결과

2026-10-20 KST, main `97ba4fd7dddfa0e908ed53bf0b802bc78ffbe39d` / tree `869cbb3a9a6bf0237a6619deb9d98a9786ae54ba`에서 [run39330869887](https://github.com/Middleages/my-books/actions/runs/39330869887)의 build·deploy·verify-published가 모두 success로 끝났다. Actions Node22에서 단위531개·빌드 성공, 실제 Chromium155.0.8059.39에서 보험31/31과 기존 전체 회귀160/160을 production/게시 각각 통과했다. 앱 콘솔·페이지·리소스 오류는0이었다. 독립 검토자도 수정 HEAD의 전체531테스트를 다시 통과했다.

보험 production artifact12223709604와 published artifact12226340480은 각각83PNG를 생성했다. 처음 실패판의57PNG·수정판83PNG·직접 연 이미지 수를 혼동하지 않는다. 수정 production에서는 독립 검토자가13PNG를 직접 열어1440/390/320의 동일 기대손실 그림, 확률0/100, 손실/현금0과 최대조건, 본문 강조 수정, 정적표·reduced-motion 가독성을 확인했다. 주요 파일: `1440--insurance-expected-loss-1-default-equal-expected-loss-scene.png`, `390--insurance-expected-loss-1-default-equal-expected-loss-scene.png`, `320--insurance-expected-loss-1-default-equal-expected-loss-scene.png`, `320--insurance-expected-loss-1-maximum-controls-equal-cash-loss-scene.png`, `320--insurance-expected-loss-1-zero-cash-zero-severe-loss-scene.png`, `320--insurance-expected-loss-full.png`, `390-expected-loss-reduced-motion-static.png`, `320--insurance-expected-loss-1-static-table.png`.

게시 results.json은 mode published, source/workflow SHA97ba4fd, sourceChanges 빈 값, 공개경로 소개·01·02만을 기록했다. [게시 교재](https://middleages.github.io/my-books/#/insurance)의 index가 가리키는 파일명뿐 아니라 두 자산의 전체 바이트와 SHA-256이 실제 배포 artifact와 같았다.

| 게시 자산 | 바이트 | artifact와 게시가 일치하는 SHA-256 |
| --- | ---: | --- |
| index-BdNQvw9P.js | 1,918,807 | 4a29e2f2b1aa2c0f4071271da55c58fe9e082b72745dfca2d661ba28981e0713 |
| index-DUN4tgyK.css | 210,975 | 036025ad10e6e6d2b0790f1b9029926123deb2b2076a782a679283cb6bb9eaf1 |

게시 화면에서는1440 공통충격 장면,390 기대손실 장면,320 확률 점/현금 경계,390 세로 공동재원 흐름의 실제 PNG를 직접 확인했다.20개/1개 채운 점, 같은 기대손실20만원과 서로 다른 손실 길이,300만원 지급/500만원 미충당이 그림에서 읽혔다. 모바일은 흐름 방향을 세로로 바꾸고 표만 이름·포커스가 있는 가로 스크롤 영역에 둔다. 정지/단계/입력변경/반복실행/reduced-motion의 동작은 실제 브라우저 assertion 결과이며 정지된 PNG만으로 주장하지 않는다. 최종 독립 게시 화면 검토 결과는 아래에 별도 기록한다.

독립 게시 검토 최종 승인: 2026-10-20 KST. 검토자는 게시 PNG13개를 직접 열고3개MDX 및 JS/CSS 해시를 별도 재계산했다. 새 전체531테스트·빌드·diff 검사도 통과했다. 직접 검토한 게시 파일은 다음과 같다.

- `1440--insurance-full.png`
- `1440--insurance-expected-loss-1-default-equal-expected-loss-scene.png`
- `390--insurance-expected-loss-1-default-equal-expected-loss-scene.png`
- `320--insurance-expected-loss-1-default-equal-expected-loss-scene.png`
- `320--insurance-expected-loss-full.png`
- `1440--insurance-expected-loss-1-static-table.png`
- `390-expected-loss-reduced-motion-static.png`
- `1440--insurance-pooling-1-common-shock-default-scene.png`
- `390--insurance-pooling-1-individual-default-scene.png`
- `320--insurance-pooling-1-common-shock-default-scene.png`
- `320--insurance-pooling-1-static-table.png`
- `390-pooling-reduced-motion-static.png`
- `850-pooling-common-final-scene.png`

A 게이트 완료 뒤 B03–04를 시작한다. 이 사후 검증 기록은 B 변경과 함께 반영해 문서만의 반복 배포를 만들지 않는다. 위 SHA·자산은 A 검증 시점의 정확한 버전이며 이후 배치 자산과 혼동하지 않는다.

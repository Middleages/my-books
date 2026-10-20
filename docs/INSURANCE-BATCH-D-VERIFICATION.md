# 보험 배치 D · 07–08 검증

작성일: 2026-10-20 KST. 기준 main `1ff04e672cb10f0b25d118f78069860d4f139359`. C의 Actions/게시 82검사·실제 자산 일치·대표 화면 검토 후 진행한다. 범위:07 timelines·08 surrender. 구현·로컬 실행·독립 검토·실제 브라우저·main/게시 상태를 구분한다.

## 시각 설계·모델의 범위

07은 공통 0–12년 눈금의 납입·보장·갱신 행을 사용한다. A는 연초0–4년 각10만원을 내지만 보장은 [0,10)이다. B는 별도 가상계약이며 2년 주기의 연보험료12/14/17/20/24만원과 갱신을 중단했을 때 남는 공백을 비교한다. 예시 요율을 실제 갱신 전망으로 제시하지 않는다.

08은 동일 A의 연초 예정 납입 직후를 기준으로, 직접 주어진 경과연도0–9의 환급표와 누적보험료를 동일 금액 눈금에 둔다. 표의 점 사이를 보간하지 않는다. 해지 경계 이후 새 사건의 보장 종료와 그 전에 발생한 사건의 청구권 판단을 구분한다. 연도10은 보장종료 후 만기보험금0원이라는 별도 행이며 해약환급금으로 표시하지 않는다.

개별 보험의 유지/해지·가입 추천, 실제 건강정보·금융자료·요율 추정·법률 판단은 범위 밖이다. 철회·취소·해지·만기의 차이는 확인 문서 중심으로 설명하고 현재 법정 기한 숫자를 실험 규칙으로 만들지 않는다.

## 실행 기록

구현과 검증 진행 중이다. 실제 실행 전 항목을 통과로 기록하지 않는다. 전체 단위/SSR·빌드·diff, 독립 검토, Actions production/게시 Chromium과 자산 바이트/해시·대표 캡처 직접 검토 결과를 이어 기록한다.

환경: cloud Linux/Node24.19.0, 저장소 의존성은 npm ci --cache /tmp/my-books-npm-cache로 설치했다. 로컬 Chromium은 socket 권한 제한으로 실행되지 않아 이를 우회하지 않고 기존 Actions의 지원되는 Chromium을 사용한다. 실제 기기·Safari/Firefox·스크린리더 음성·학습효과는 미검증이다.

## 게시 전 모델·본문·정적 렌더 검증

07·08의 MDX/React·CSS/순수모델·타입·전용테스트와 공개 카탈로그/소개를 구현했다. 같은 시간/금액 눈금의 도형과 정적 전체표가 동일 모델에서 나온다. 08의 환급 원표는 열 개의 독립적인 해지 사례와 별도 만기 행이며 보간하지 않는다. 기존 C 이하 내용과 세금 계획 PR#8의 두 문서는 보존했다.

- 전체 `npm test`:687/687 통과, 실패·건너뜀0. 기존628개에07모델26개·08모델25개·D UI/SSR8개를 추가했다. 조정자·독립 검토자 모두 실행했다.
- 독립 고정 전수검사963개 통과:07의13년×5개 갱신 선택에서390관계·5합계·20잘못된 입력,08의11개 종료시점×12연도에서473관계·11재현·29잘못된 입력, 문구/종료상태35회귀를 확인했다.
- 직접 SSR6렌더와 정적표24행 모델 대조, 별도D SSR8테스트에서 연도0/5 개요와 실험·전체표·지급/해약/만기 명칭·미공개링크·raw Markdown/문단 중첩을 확인했다.
- `node --check scripts/insurance-browser-qa.cjs`, `git diff --check` 통과. 실제 browser 검사는 기존82개를 보존하고110개를 준비했다. 1440/390/320·850에서 연도/중단 경계, 비례 도형, 초기화·키보드·정적표, reduced-motion의 모든 연도 프레임과 같은 표를 비교한다. 110개는 준비한 검사 수이며 실제 실행 결과가 아니다.

독립 검토에서 발견한 표현 두 가지를 게시 전에 바로잡았다. B가 이미 갱신을 중단한 경우10년 관찰도 원래 중단 상태를 유지하고,10년 경계의 라벨은 A 종료·B 갱신 유지시 종료로 구분했다.08은4년 마지막 납입 직후부터 남은 예정 보험료가0이므로 해지로 추가 보험료를 절약한다는 문구를 쓰지 않는다. 그때 해지해도 사라지는 새 사건의 보장은 별도로 남겨 둔다. 누적보험료를 이루는 같은10만원 칸의 가로 테두리 폭도 동일하게 맞췄다.

공식 원문은 각 MDX에2026-10-20 KST 확인일과 정확한 URL을 적었다. 생활법령의 보험가입 전/시 확인사항·중도해지·철회/취소 설명(본문 기준2026-09-15), 금융위2021-06-29 제4세대 실손 자료의 재가입 반례,2020-11-18 무/저해약환급금 자료를 확인했다. 과거 자료의 특정 상품 조건·주기·기한을 현재 모든 계약에 적용하지 않는다. 실험의 모든 수치와 표는 자체 가상 정의다.

최종 게시 전 `npm run build`는 TypeScript/Vite288modules로 성공했다. 번들 크기 경고는 기존 구조의 안내이며 오류가 아니다. 마지막 CSS/문구 수정 뒤 전체687테스트·빌드·diff·브라우저 스크립트 문법검사를 재실행했다. 새 QA검사와 스크립트 자체도 독립 검토했다. 실제110개 browser 검사와 Pages 게시·PNG 직접검토는 이후 Actions 결과로 구분한다.

## 첫 실제 화면 검증에서 발견한 축 라벨 결함

main `83de852e45bed0c2dc6404984e34e34cc6df569e` / tree `d17383abb1731615f9404c0c24509fa7991c80fb`의 [run39348103042](https://github.com/Middleages/my-books/actions/runs/39348103042)에서 build, production 보험110/110·기존교재 회귀, Pages deploy가 성공했다. 보험 production artifact12232397328은503PNG를 생성했고 콘솔·페이지·리소스 오류는0이었다. 게시 재검사는 진행 중이었으므로 당시 전체run 최종성공이라고 기록하지 않는다.

조정자와 독립 화면 검토자가 실제 PNG를 직접 열어07 시간축의 끝값12가 '1'과'2'로 줄바꿈되는 표시 결함을 찾았다. 대표 파일은 `1440--insurance-timelines-1-stop-4-boundary-scene.png`, `1440--insurance-timelines-1-year-5-payment-ended-coverage-continues.png`, `390--insurance-timelines-initial-scene-1.png`다. 850px에도 같은 결함이 있었다. 모델의 끝값과 위치는 맞지만, 숫자가 한 값으로 읽혀야 하므로 자동검사110개 통과만으로 시각 게이트를 닫지 않았다.

원인은 절대 위치의 오른쪽 끝 라벨이 좁게 계산되면서 상위 overflow-wrap:anywhere를 상속한 것이다. 숫자 축 라벨의 줄바꿈을 금지하고 고유 너비를 보존하며, 실제 DOM에서 각 숫자 라벨 요소의 실제 높이와 줄 높이, 좌우 경계를 대조해 한 줄이고 축 영역 안에 있는지 확인하는 회귀검사를 추가한다. 수정판의 실제production/게시 성공과 PNG 검토는 아래 후속 증거로 별도 기록한다.

수정 전 production의 독립 검토자는13개 PNG를 직접 열어1440/390/320/850·정적표·reduced-motion에서 추가 차단 결함이 없음을 확인했다. 환급금의0/14/20/28만원과 별도 만기0원, 첫 보험료와 종료 경계,5년 납입완료와 보장 유지의 관계를 모델과 대조했다. 최종 승인은 수정된 축 라벨의 새 실제 캡처를 확인한 뒤 내린다.

수정판 게시 전 전체688/688테스트·TypeScript/Vite288modules·diff·QA구문검사 통과. 독립 검토자도60개 관련테스트·전체688개·963모델검사·빌드를 별도로 통과했다. 새1개는 숫자 라벨의 고유너비/줄바꿈 금지/양끝 안쪽 정렬을 보존하는 회귀다. 기존 browser110개 안에 실제 라벨 높이/줄높이·축 안쪽 경계 검사를 강화했으며 검사 수를 줄이지 않았다. 소스 승인과 실제 화면 복구 승인은 구분한다.

## 첫 게시 버전의 자동 검사와 수정판 후속 실행

첫 D [run39348103042](https://github.com/Middleages/my-books/actions/runs/39348103042)는2026-10-20T01:01:46Z에6개 job 모두 success로 종료했다. 게시 보험 artifact12232872268의 실제 Chromium155.0.8059.39 검사는110/110,503PNG 생성, 콘솔·페이지·리소스 오류0, source/workflow SHA83de852와 깨끗한 tree가 일치했다. 아래 게시 asset은 production dist와 바이트와 SHA-256이 같았다. 이는 배포 일치 증거이며 이미 발견한 숫자 줄바꿈을 시각 합격으로 바꾸지 않는다.

- CSS `index-BsZ55u6t.css`:246758bytes, SHA-256 `f354d58a1ef9f353875f75066b138fd098bf40486c3f994921f9d3c78a8b9fe5`.
- JS `index-ZfJiRvSM.js`:2104934bytes, SHA-256 `b8081008087814527977592f182d1fc952dab03200c686331ede2f8b72baed4a`.

수정판 main은 `609e6f2cef1c449ee8760f92c98b01ace238d5e1` / tree `b80b134e09347f75a770e9987b24af3d0d24abad`이다. [run39351304469](https://github.com/Middleages/my-books/actions/runs/39351304469)가2026-10-20T01:03:46Z에 시작했다. 이 문단 작성 시점에는 실행 중이며 수정된 실제production/게시 캡처와 최종 성공을 아직 확인하지 않았다. E는 별도 로컬 작성만 진행하고 수정판 D 게이트 후에 게시한다.

수정판 production 보험 artifact12233811922를 직접 읽었다. source/workflow SHA609e6f2, treeb80b134e, sourceChanges 빈 값, Chromium155.0.8059.39,110/110 통과와503PNG 생성, 콘솔·페이지·리소스 오류0을 확인했다(완료2026-10-20T01:19:42.656Z). 조정자는1440/390/320의 `--insurance-timelines-initial-scene-1.png`와 `850-timelines-year-5-payment-ended-coverage-continues.png`를 원본 크기로 직접 열었다. 모든 대상 폭에서 끝값12가 한 줄이고 축 안쪽에 있으며,5년 관찰에서 A 납입0·누적50만원·보장유지와 B 연납17만원·누적86만원의 관계가 맞았다. 이 시점에 Pages deploy는 성공했지만 게시 재검사는 아직 실행 중이다.

수정판의 독립 화면 검토도 통과했다. 직접 본5개는 `1440--insurance-timelines-1-year-5-payment-ended-coverage-continues.png`, `390--insurance-timelines-1-stop-2-boundary-scene.png`, `320--insurance-timelines-1-stop-8-boundary-scene.png`, `850-timelines-year-5-payment-ended-coverage-continues.png`, `390-timelines-reduced-motion-static.png`이다.320px와 reduced-motion 원본 해상도 부분도 대조했다. 끝값12의 한 줄·축 안쪽 위치·캡션 비겹침, 기존 납입/보장/갱신 도형의 의미를 확인했고 새 결함은 발견하지 않았다. 원본503개 모두를 사람이 직접 검토한 것은 아니다.

## 수정판 최종 게시 게이트 · 완료

[run39351304469](https://github.com/Middleages/my-books/actions/runs/39351304469)는2026-10-20T01:36:28Z에6개 job 모두 성공으로 끝났다. 게시 artifact12233689251은110/110검사·503PNG·오류0이며 source/workflow SHA609e6f2와 깨끗한 treeb80b134e가 일치했다. 게시JS/CSS와 production dist의 바이트·SHA-256이 정확히 같았다.

- CSS `index-Cyq6pxbw.css`:246834bytes, SHA-256 `bd1c5faa8df48504f8c5f52729fb566910523d13098988911667ac36ea18b2fe`.
- JS `index-DM12vt9N.js`:2104934bytes, SHA-256 `b8081008087814527977592f182d1fc952dab03200c686331ede2f8b72baed4a`.

조정자는 게시 원본 `1440--insurance-timelines-1-year-5-payment-ended-coverage-continues.png`와 `390--insurance-timelines-1-stop-2-boundary-scene.png`를 직접 열어 한 줄 끝값12와 보장/갱신 경계를 다시 확인했다. 앞서 직접 본 production의1440/390/320 초기 장면과850년5 장면은 해당 게시PNG와 파일 바이트도 동일했다. D의 알려진 시각 결함은 해소됐으며 이 게이트를 닫은 뒤 E를 main에 통합한다.

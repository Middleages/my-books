# 세금 배치 C 검증 기록

작성: 2026-10-20. 상태: 로컬 구현·검증 중, 이 배치의 main·Pages 게시 전.

전체권을 로컬에서 선행 교차 검증한 뒤 A→B→C→D→E→F 순서로 공개한다. 각 배치에서 공개하는 장만 카탈로그·본문 링크·읽음 분모에 반영하며 선행 게시 게이트가 닫히기 전에 다음 배치를 공개하지 않는다. 현재 기록은 선행 게시를 완료했다고 주장하지 않는다.

범위·설계·공통 모델 경계는 [전체 점검 기록](TAX-BOOK-REVIEW.md)을 따른다. 해당 배치의 실제 테스트·빌드·production 화면·직접 PNG 검토·CI·Pages·자산 비교는 실행 후 아래에 추가한다.

## C의 선행 로컬 검증 — B 게시와 별도

B 후보 `15a175777dd00f7f11e01f1a273454f844cf3c12`를 기준으로 C의 05 부가가치세·06 투자에서 만나는 세금을 독립 작업 트리에 준비했다. 이 기준에는 동시 진행 중인 DB·Kubernetes 통합이 아직 없으므로 아래 수치는 최종 통합본의 검증 개수나 C 게시 증거가 아니다. C를 공개할 때는 먼저 완료된 B와 최신 main을 보존해 통합하고 해당 production·published 검사를 다시 기록한다.

- 공개 후보는 소개·01–06, 읽음 분모 6이다. 07–12는 계획 문구이며 활성 링크·본문·후속 모델 함수로 등록하지 않는다.
- 05는 공급가액·별도 세액·대금을 나누고, 세 단계의 매출세액−공제 매입세액 연결을 같은 눈금으로 보여 준다. 영세율은 마지막 공제 20·계산 −20을, 면세는 마지막 공제 0·원가 잔류 20을 남긴다. 실제 환급 지급이나 거래의 법적 적격 판정이 아니다.
- 06은 예금 이자·회사 배당·주식 매도·평가 변화의 원천→사건→분류를 동시에 비교한다. 일반/특례계좌 선택에도 자료 부족을 정상 결과로 유지하며 세율·최종 세액을 만들어 내지 않는다.
- VAT의 200 하한·소수·100만 상한, 앞 두 단계 불변, 프레임/장부 일치, 세액 연결 합계, 영세율/면세의 소수 금액 비교, 음수·비유한값·숫자 문자열·null 거부와 재실행 결정성을 검사했다. 투자 4유형×2계좌는 원천·사건·분류·조건 노드의 정확한 연결과 최종세액 미확정을 검사한다.
- `npm test`: 804개 통과, 실패 0. `npm run build`: TypeScript·Vite 통과. `git diff --check` 통과. 기존 큰 번들 경고는 남는다.
- 장별 국세청 근거, 확인일과 가상 10%·증빙/공제 가정·간이과세/의제매입/안분 생략 범위는 본문에 표시했다. 전체 원고의 앞선 06 직접 화면 점검은 [전체 점검 기록](TAX-BOOK-REVIEW.md)에 있으며, C 최종 통합본의 직접 PNG 검토를 대신하지 않는다.

이 후보의 hosted production·최신 main 통합·Pages 게시·정확한 게시 자산 대조는 아직 실행하지 않았다. 사용자 요청에 따른 변경 범위 중심 게이트를 유지하며, 실행하지 않은 다른 책의 전체 브라우저 검사를 통과로 표시하지 않는다.

## DB A·주거 A 통합 후보 위의 두 번째 로컬 점검

세금 B·주거 A 후보와 DB A·Kubernetes 보강을 보존한 로컬 기준 `61c38bfac9ad5ce0bfd5b8e7edfaae0063239835` 위에 C만 준비했다. 기준은 원격 PR15 head `e4c0dfe90b7db204419baceb01e908e80843e8b9`와 같은 tree `7c68b9458917e4c86fc67e0bfba91d5b1f738c54`지만 이 시점의 B 게시 게이트는 아직 닫히지 않았다. 따라서 이 절도 C 공개 증거가 아니다.

- `npm test` **908/908**, TypeScript·Vite production 빌드, `git diff --check` 통과. 기존 큰 번들 경고는 유지된다.
- 앞서 교정한 04의 현재 입력 기반 예측 해설과 브라우저 검사를 보존했다. C의 네 병렬 원천 경로·모바일 두 열 배치·분류 노드 모델 대조를 포함한다.
- DB·Kubernetes·주거의 앱/본문/모델, 주거의 엄격한 진단 보강, 공통 변경 분류기/workflow를 바꾸지 않았다. 카탈로그와 공유 문서는 세금 05–06의 범위만 갱신했다.
- C의 hosted production·직접 PNG·최신 main·Pages·실사이트 바이트 게이트는 아직 실행하지 않았다. B 공개가 끝난 뒤 그 정확한 main과 병행 변경·최종 문서를 먼저 보존한다.

## 정확한 B main 위의 C 단독 공개 후보

세금 B·주거 A 및 DB/K8s 마감이 통합된 실제 main `b97dbd4ee78b64118a0e88f9f3f5fd1fd08f6b0d`를 직접 조상으로 하는 새 후보를 만들었다. 앞선 로컬 C 변경만 적용했고 미래 DB B·주거 B·회계 A는 포함하지 않는다. 이 시점에는 B의 정확한 게시 게이트가 실행 중이므로 C를 main에 반영하지 않는다.

모델·본문·장면은 앞 로컬 점검의 05–06과 같으며 07 이후의 활성 링크/본문/모델 함수는 추가하지 않는다. 공통 workflow·분류기, 다른 책의 앱과 엄격한 진단을 보존했다. C의 전체 단위·빌드와 tax + book-volumes의 실제 production·직접 PNG 결과는 이후 실행에서 기록한다. 아직 C의 main·Pages 완료가 아니다.

정확한 main 위에서 전체 **912/912 테스트**, TypeScript·Vite production 빌드, `git diff --check`를 통과했다. 실제 분류기는 `affected`, 선택 `tax`·`book-volumes`, 생략 `insurance`·`investing`·`database`·`kubernetes`·`housing`이다. 공유 목차/권차/읽음 smoke와 세금 전체 현재 공개 후보의 검사·정확한 자산 대조를 유지하며, 생략한 책의 전체 검사를 통과로 기록하지 않는다.

## C 단독 production·직접 화면 확인 — 2026-10-20

PR[#24](https://github.com/Middleages/my-books/pull/24)의 head `1e2428079584394d5029656b643bab26b61ed01f`, 실제 checkout `8d6b77471857beef0a9a366d4f3faaed062cbd16`, tree `462c6f14cb4591aeaf0f087e7f1f6337d790da45`의 [run39374924217](https://github.com/Middleages/my-books/actions/runs/39374924217)는 build와 선택한 production suite를 모두 통과했다. 로컬 전체912/912 테스트·TypeScript·Vite 빌드가 통과한 후보이며 아직 main에 게시하지 않았다.

- tax **101/101 검사·PNG72개·오류0**, [artifact12243575145](https://github.com/Middleages/my-books/actions/runs/39374924217/artifacts/12243575145), ZIP SHA-256 `8f5ddb8e2771ab287e7aeccefc93b4f5379c34e44f8be516cd13311aa3ad3b20`.
- book-volumes **14/14·PNG36개·오류0**, [artifact12242618676](https://github.com/Middleages/my-books/actions/runs/39374924217/artifacts/12242618676), ZIP `c1715e4cb65d0ca4bd20d212c2929bfb5365981d0104c2a7f9d9465038c05f57`.
- 실제 selector는 tax·book-volumes만 선택하며 보험·투자·DB·Kubernetes·주거 전체 브라우저를 생략했다고 명시했다. sourceChanges는 비어 있다.
- JS `index-BYmpZ36y.js`2399313바이트 SHA-256 `a45cc410a68b873f7d32e6b9123f6704bd3abee96dc646294f2488647d1ab719`, CSS `index-DJ9ACMu0.css`310316바이트 `3402991bf592da41e9a44a248f3f3983e84aac4a8de3528865ca5c27ebab8012`가 두 suite의 실제 served asset과 일치했다.

05·06 각각1440px 초기,320px 변경,390px reduced-motion/정적 표 원본6장을 직접 열었다. 공급 단계의 가로/세로 연결 방향과 같은0–50 눈금, 마지막 면세의매출0·공제0·공제 못한매입20, 공급가액500을 현재 장부와 대조했다. 투자4경로의 원천→사건→분류가 대응하고 선택한 평가 변화·특례계좌의 추가 조건 경계가 연결된다. 이 그림이 실제 세율이나 최종세액을 확정하지 않는다는 경계, 키보드 정적 표 포커스, 두 열 모바일 줄바꿈이 읽힌다. 모든72장을 직접 열었다고 주장하지 않는다.

B와 주거 A의 정확한 게시 게이트는 이후 b97dbd4에서 닫혔으며 [B 최종 기록](TAX-BATCH-B-VERIFICATION.md)에 구분했다. 다음 합본은 이 완료 상태를 보존해 주거 B 등 준비된 해당 배치만 추가하고 전체 unit/build·영향 범위 production·main·Pages·실제 게시 자산을 다시 검증한다.

## 주거 B와 다음 공개 후보 통합

B·주거 A 공개가 완료된 main b97dbd4를 보존하고, 주거 B의 검증된 remote `c07f4c71787197d1f520df67bc434c311580caf5`와 같은 tree `2ce0ce4a50410f8b15a482d375ef78d5726b2a5d`의 로컬 변경을 통합했다. 주거 최종 production·직접 화면 증거와 앞 배치의 공개 마감 문서도 포함했다. DB B·회계 A·세금 D·주거 C는 포함하지 않는다.

통합 후 전체 **917/917 테스트·TypeScript·Vite production 빌드**가 통과했다. 각 책의 본문·장면·모델·브라우저 시나리오는 위에서 직접 확인한 해당 후보와 동일함을 git diff로 확인했다. 실제 분류기는 `affected`, tax·book-volumes·housing만 선택하고 보험·투자·DB·Kubernetes는 생략했다. 통합 담당자가 주거 B의1440px 계약 변경·320px 회수 변경 원본도 열어 입력 인접·계약과근거의 구분·미도착 보증금과 남은 대출을 확인했다. 이 합본의 hosted production과 게시 검증은 별도 결과로 기록한다.

## 합본 production과 최종 직접 확인

최종 head `7a935e1114a4260181891664fff4a453508784fc`, 실제 checkout `329a5a11770f0a3de81e039d34700f313eb4b918`, tree `4cd6040e28794066df62579b12d9e79e1dbbdbb1`의 [run39376752669](https://github.com/Middleages/my-books/actions/runs/39376752669)는 build와 선택한 세 production suite를 모두 통과했다. 정확한 selection artifact도 tax·book-volumes·housing만 선택했다. 모든 sourceChanges는 비어 있으며 애플리케이션·콘솔·별도 비애플리케이션 진단은0이다.

- tax101/101·PNG72, [artifact12243965812](https://github.com/Middleages/my-books/actions/runs/39376752669/artifacts/12243965812), ZIP SHA-256 `21b4cfc6666cc248372a8a94b3aa89ec63e6fb66c704d73813edfb51b5de6724`.
- housing74/74·고유PNG54, [artifact12243651929](https://github.com/Middleages/my-books/actions/runs/39376752669/artifacts/12243651929), ZIP `7a7de83089651718feb5114cf8a6d24929b306bcc24d26c8e778ace3176e0bff`.
- book-volumes14/14·PNG36, [artifact12244135111](https://github.com/Middleages/my-books/actions/runs/39376752669/artifacts/12244135111), ZIP `ec045b75e92e3703822138335b396d1fac0d265993e539a1f6161f0f7efc0c86`.

세 suite가 받은 JS `index-CR1dI7lf.js`2436611바이트 SHA-256 `0fedae87f50fee38a10b7ea884563fffabcf52de963d54c1eb9c1d153618ac46`, CSS `index-DhQLFKJf.css`313484바이트 `a46285276e0428b85e7a402d53be8873789556031fdf3f0da391c37fc3ec4175`가 같은 production 산출물과 일치했다.

합본 원본에서 세금05의320px 변경·06의390px reduced/static와1440px 홈을 직접 다시 열었다. 앞 단독 후보에서 확인한 두 장의 desktop/320/390 그림은 소스 동일성을 유지하며, 합본에서도 면세 매입불공제20·평가/실현 구분·특례계좌 확인 경계와 세금0/6·주거0/4 읽음 분모가 맞았다. 주거 작성자도 합본1440px 계약 변경·320px 계약 초기·320px 회수 변경 세 원본을 직접 열어 계약 근거와 재확인 경계·현금1.1억원/미현금화3천만원/기관 입금0을 재확인했다. 새 시각 차단 문제는 없었다.

이후 정확한 검증 head를 main에 반영했다. exact-main [run39377349867](https://github.com/Middleages/my-books/actions/runs/39377349867)의 Pages·게시 자산·실제 PNG는 아직 별도 확인 중이며 아래 최종 기록 없이 완료로 읽지 않는다.


## 정확한 main·Pages·실제 게시 완료 — 2026-10-20

main `7a935e1114a4260181891664fff4a453508784fc`, tree `4cd6040e28794066df62579b12d9e79e1dbbdbb1`의 [run39377349867](https://github.com/Middleages/my-books/actions/runs/39377349867)는 build·세 production suite·Pages 배포·세 published suite, 총8개 job이 모두 성공했다. 실제 main의 selection은 `affected`, tax·book-volumes·housing이며 보험·투자·DB·Kubernetes는 의도적으로 미실행이다. 전체917/917 단위 테스트·빌드 통과와 해당 브라우저 범위를 구분한다.

- published tax **101/101·PNG72**, [artifact12243957421](https://github.com/Middleages/my-books/actions/runs/39377349867/artifacts/12243957421), ZIP SHA-256 `f9aed90864bf12583f3c5aeaf3819f0454493f4133ddd3978ddc4bb44eadebbc`.
- published housing **74/74·고유PNG54**, [artifact12244077027](https://github.com/Middleages/my-books/actions/runs/39377349867/artifacts/12244077027), ZIP `1b332fb7a3a643624b161e1c71ca87d0fd573437e5f1393eacb10c32a8ca53aa`.
- published book-volumes **14/14·PNG36·오류0**, [artifact12244446103](https://github.com/Middleages/my-books/actions/runs/39377349867/artifacts/12244446103), ZIP `1e102f4689bdd99d77f24bb1633f18690793650547fd220d34ad5b376bfbb762`.

모든 게시 결과의 sourceSha는 위 main, sourceChanges는 비어 있고 Chromium155.0.8059.39다. tax·housing 각각 애플리케이션 오류0이며 정확히 관찰한 `https://middleages.github.io/favicon.ico`의404 한 건만 출처와 함께 비애플리케이션 진단에 보존했다. 전체 콘솔 오류0 또는 미확인 오류를 무시한 것으로 표현하지 않는다.

실제 게시 JS `index-CR1dI7lf.js`2436611바이트 SHA-256 `0fedae87f50fee38a10b7ea884563fffabcf52de963d54c1eb9c1d153618ac46`, CSS `index-DhQLFKJf.css`313484바이트 `a46285276e0428b85e7a402d53be8873789556031fdf3f0da391c37fc3ec4175`가 직접 검토한 최종 production과 정확히 같았다. 각 suite가 원격 파일을 직접 내려받아 로컬 dist와 대조했다.

통합 담당자는 게시05·06의1440px 초기 두 장,05의320px 변경,06의390px reduced-motion/정적 표,1440px 홈과320px 세금 권차 헤더를 직접 열었다. 공급단계의 공제 연결·면세 원가 잔류20, 투자4경로와 계좌 조건, 현재 선택·정적 표·고정 권차와0/6·0/4 읽음 분모가 유지된다. 주거 작성자는 게시320px 계약 변경 원본 및390px 회수 변경의1200–2800px 원본 해상도 구간을 직접 열어 문서 재확인·인접 제어·두 보증 경로·60일 임대인1.1억원 도착/기관0을 확인했다. 모든 생성 PNG 전수를 사람이 검토했다고 주장하지 않는다.

C05–06 및 주거B03–04의 공개 게이트를 완료했다. D07–08과 후속 주거·DB·회계 후보는 이 완료 상태와 최신 main을 보존한 별도 공개 게이트를 따른다. 실제 기기·Safari/Firefox·스크린리더 음성 출력·학습 효과는 여전히 미검증이다.

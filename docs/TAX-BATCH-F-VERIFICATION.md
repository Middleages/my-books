# 세금 배치 F 검증 기록

작성: 2026-10-20. 상태: main d76ed55e의 production·Pages·실제 게시 자산·직접 화면 검토 완료. 최종8개 suite production/published 넓은 회귀까지 완료. 이전 절의 게시 전 문구는 당시 기록이다.

전체권을 로컬에서 선행 교차 검증한 뒤 A→B→C→D→E→F 순서로 공개한다. 각 배치에서 공개하는 장만 카탈로그·본문 링크·읽음 분모에 반영하며 선행 게시 게이트가 닫히기 전에 다음 배치를 공개하지 않는다. 이 문단은 초기의 순차 공개 계약이며 최종 실제 완료 근거는 마지막 절에 기록한다.

범위·설계·공통 모델 경계는 [전체 점검 기록](TAX-BOOK-REVIEW.md)을 따른다. 해당 배치의 실제 테스트·빌드·production 화면·직접 PNG 검토·CI·Pages·자산 비교는 실행 후 아래에 추가한다.

## F의 선행 로컬 검증 — 전체 원고와 게시의 구분

E의 독립 준비 후보 `7a323acc24315b784ad9d0874b6f0fe22b18aec3` 위에 11 세금의 시간표·12 세금 자료 읽기와 전체 교차 모델 검사를 준비했다. 소개·01–12가 모두 등록되고 읽음 분모는 12다. 실제 게시가 앞선 A→E 게이트를 건너뛰었다는 뜻이 아니며, 이 작업 트리에는 이후 병행 DB·Kubernetes·주거 변경이 아직 통합되지 않았다.

- 11은 Y년 귀속 세금의 월별 선납·한 번의 정산·누적 현금 순유출을 0–18개월 공통 축으로 연결한다. 가상 정산월을 옮겨도 최종 누적액은 최종 세금과 같으며 대기 중 현금 시점만 달라진다. Y+1의 새 소득·원천징수를 생략했음을 그림 가까이에 표시한다. 가상 월은 실제 신고기한이나 지급 보장이 아니다.
- 12는 가상 급여 명세·정산 안내·투자 안내의 원문 줄과 사실/가정/미확인 주석을 직접 연결한다. 서로 다른 문서를 골라도 해당 원문의 분류·설명·정적 표가 같은 모델을 읽는다. 실제 문서 업로드·개인 자료·외부 전송·신고 판정은 없다.
- 전체 모델 검사에는 별도의 폐쇄형 참조식을 사용하는 고정 seed `0x54415826`의 5,000회 정산·공제·월별 현금 보존 비교, 경계 바로 전후 소수와 매우 큰 유한 누진 과표, 81계좌 조건 조합, 소수 VAT의 과세/영세율/면세 차이를 포함한다. 전체 19프레임의 원천징수·정산·누적액을 각각 대조하며 미확인과 0을 구분한다.
- 현재 모델값을 읽도록 고친 04·10 예측 설명도 포함한 `npm test` 815개와 TypeScript·Vite production 빌드가 통과했다. `git diff --check` 통과. 기존 큰 번들 경고는 남는다.
- 전 장의 학습 목표→짧은 설명/그림→예측·조작→해석·적용→이유 있는 확인 문제→공식 근거·모델 경계를 보존했다. 전체 원고의 독립 소스 검토와 앞선 12장 직접 PNG 점검은 [전체 점검 기록](TAX-BOOK-REVIEW.md)에 있다. 현재 후보의 새 브라우저 실행·사용자 학습효과 측정으로 대체해 주장하지 않는다.

F 차례에는 먼저 최신 main과 A–E의 완료 증거를 보존해 통합한다. 전체 단위/빌드, 실제 F production·모든 관련 장의 직접 화면 검토, 공통 권차·읽음, main·Pages·정확한 게시 JS/CSS 대조를 수행한다. 사용자가 중간 배치의 검사를 변경 범위 중심으로 줄이도록 허용했어도 **마지막 전체권 브라우저 회귀는 별도 실행**한다. 수동 workflow 실행 도구가 없으면 명시적인 최종 소스 전용 검증 branch/workflow를 사용하되 범위를 속이기 위한 앱 변경이나 검사 축소는 하지 않는다. 그 실행·소스·자산·실제 화면 증거가 닫히기 전 전체권 게시 완료로 기록하지 않는다.

## 병행 교재와 엄격한 진단을 보존한 전체권 로컬 사전 점검

DB A·Kubernetes 보강/최종 진단·주거 A·세금 B 마감 후보를 보존한 E 로컬 기준 `8e8f97c3ac1081d524ee9061b870bf18d5848332` 위에 소개·01–12 전체를 준비했다. 이 시점에는 B부터의 공개가 아직 대기 중이며, 로컬 전체권이 준비됐다는 사실을 B–F의 게시 완료로 표시하지 않는다.

- 전체 **923/923 테스트**, TypeScript·Vite production 빌드와 `git diff --check`를 통과했다. 기존 큰 번들 경고는 남는다. 다른 책의 공개 범위·앱·본문·모델·검증기·저장 키는 보존했다.
- F는 11의 19개 시간 프레임에서 동일 귀속기간의 발생·선납·정산·현금 차이를 구분하고, 12는 가상 문서의 사실/가정/미확인을 명확히 분류한다. 두 장의 정적 대안과 관찰 제어를 모델 프레임과 연결했다.
- 독립 oracle 4개는 고정 seed `0x54415826`의 5000개 가상 사례, 계좌 조건 81조합, 소수 VAT 연결, 큰 유한값의 누진 계산 등을 검사한다. 다른 장의 보존식·경계·미확정·0·재실행 테스트도 유지한다.
- 이 통합 전체권의 production·실제 PNG 직접 검토와 최종 넓은 기존 책 브라우저 회귀, 순차 main/Pages·정확한 게시 자산은 아직 실행 전이다. 후속 공개 때 최신 main과 각 선행 완료 기록을 먼저 보존하며, 이전 전체 원고 캡처를 이번 최종 통합본의 실행으로 대체하지 않는다.

## C 공개 이후 D 합본을 보존한 F 전체권 사전 점검

실제 공개 main `7a935e1114a4260181891664fff4a453508784fc`와 D 합본 tree `12efd3b6a97b31c3d7dea9370da719a2682fc93f`를 보존한 E 로컬 source `2fe491f` 위의 F source `0a03f6e`에서 전체 **960/960 테스트**, TypeScript·Vite production 빌드와 변경 검사를 통과했다. 로컬 명령은 `node --test --test-concurrency=4 tests/*.test.mjs`로 모든 파일·단언을 유지하고 동시 실행 수만 제한했다. CI 및 저장소 기본 명령은 그대로다.

소개·01–12와 독립 oracle 4개, 고정 seed 5000사례·81계좌 상태·소수 VAT·큰 유한 누진 계산을 유지한다. 다른 교재의 소스·권차·읽음 ID·엄격한 진단을 보존했다. 현재 D는 PR production 단계이며 E/F의 main·Pages는 아직 게시하지 않았다. 전체권이 로컬에서 통과한 것과 최종 브라우저·실제 공개 검증은 별개다. F 차례의 최신 main 재통합, 전체권 실제 화면과 넓은 브라우저 회귀, 정확한 게시 자산 확인을 완료한 뒤 최종 상태를 갱신한다.

## 주거 D·DB B와 E 표시 보강을 보존한 F 사전 점검

E 다음 합본 source `733b517ae6c1ad55a40e281eb43954dc1029740b`의 tree `412eb486c6fdd7ac6dbf8a8f80d27a336483093a`와 같은 로컬 기준 위에 F11–12만 추가했다. 주거08·DB04·회계02의 기존 범위, 세금10의 현재 공제액 제목과 입력 인접 비교 막대, 모든 엄격 진단을 보존했다. 회계B나 다른 후속 장은 넣지 않았다. 새 로컬 전체 **1044/1044 테스트**와 TypeScript·Vite production 빌드가 통과했다. 동시 실행 수4의 로컬 명령을 사용했으며 전체 파일·단언과 CI 기본 명령은 유지했다.

이 시점에 현재 main05270dda의 D 공개 게이트와 다음 E production은 진행 중이다. F의 순차 main·Pages와 마지막 넓은 브라우저 회귀는 아직 완료하지 않았다. F의 새 실제 production·직접 원본 검토를 선행 준비하더라도 E 공개 게이트와 최신 main 보존 통합을 건너뛰지 않는다.

## E 의존 최종 두 장의 실제 production·직접 화면 검사

PR29 head `ba890cfc63ca79810e5d09f8eadbe5aa6a6d50e9`, tree `9eb5847b7972dfec5bd638b3fcca082acae6b070`를 대상으로 [Actions run39382866647](https://github.com/Middleages/my-books/actions/runs/39382866647)의 checkout `2c6ca7eefbc918ffaa5d2bc493b3541dee1c047a`에서 실제 Chromium 검사를 실행했다. checkout tree가 같고 작업 트리가 깨끗하다. build와 선택된 tax·book-volumes job이 모두 성공했다. 선택 기록은 tax·book-volumes만 실행하고 insurance·investing·database·kubernetes·housing·accounting은 이번 실행에서 의도적으로 생략했다고 명시한다. 마지막 넓은 회귀를 수행했다는 뜻은 아니다.

- tax **182/182**, 원본 PNG **138장**, 앱 오류·console 진단 모두0. 전12장의 일반/reduced-motion·모델과 기하·라벨·정지/초기화·실제 Tab 포커스·정적 표·읽음 보존 검사가 유지됐다. 권차 **14/14**, 원본 PNG39장, 오류0이다.
- tax artifact `12245957502`, ZIP SHA-256 `913079012dde93d11c5ba31ccd6f302f7638b988405ea36f5f76e1a909f178ec`; 권차 artifact `12246346080`, ZIP `4197a9e35124f34704a1117b4aebcc65490f9eddc8a629b6ac7871d889b3c855`. 다운로드한 원본과 해시를 확인했다. 선택 artifact `12246456468`도 해시 `c44cd04ecc79a77dafb0157faaa30f5bd6de8b10666a578ee43c99d1e4abbbcc`와 일치한다.
- 실제 제공 자산은 JS `index-D4n5xMWf.js` 2,719,860bytes, SHA-256 `0d472f92bbc043fef2f20034cb34199e9e97fc1ba1c459f6bf34d265329e23dd`; CSS `index-Bie4L1S5.css` 334,620bytes, `24fc92aa0f54d60117d2196f5a8bcf48a88b29355a5f60e4078b24c3f00a3a7c`로 두 suite 모두 원래 build와 일치했다.
- 작성자는11·12의1440px 초기,320px 변경,390px reduced-motion 정적 대안 원본6장과1440px 홈을 직접 열었다.11의0–150 공통 눈금·0–18개월 구간·현재 관찰 표시, 환급 후 누적144→80과 현금 조정−64,12의 문장 선택과 인접 분류·해설, 사실/가정/추가확인의 구분을 확인했다. 모바일에서 수직 문서→해설 관계가 유지되고 라벨/제어 겹침이나 잘림 차단점은 없었다. 정적 표는 키보드로 접근하는 가로 스크롤 영역이며 모든 열을 한 번에 볼 수 있다는 뜻은 아니다. 홈의 세금5권·읽음12와 다른 책의 공개 분모가 맞다. 모든138PNG나 모든 표 셀을 수동으로 읽었다고 주장하지 않는다.

이 기록은 E에 의존한 **게시 전 production 증거**다. D/E의 선행 공개, F 최신 main 통합·production 및 Pages·동일 게시 자산·마지막8개 suite의 넓은 production/published 회귀가 닫히기 전 전체권 게시 완료로 표시하지 않는다. 실제 Safari/Firefox·물리 기기·스크린리더 음성·사용자 학습효과 검증은 포함하지 않았다.

독립 검토자도 위 실행의1440px 시간표 초기·320px 문서 변경 원본2장을 직접 열었다. Y/Y+1 경계와 환급 하락, 시작 시점의 미도착 현금, 선택 문장4와 가정 표시·원금 보장 오독 해설의 연결에 의미/가독성 차단점이 없음을 확인했다. 검토 범위는 이 두 원본으로 한정한다.

## 주거 E와 합친 다음 파동 로컬 검증

검증된 F 원고와 주거 E source `443ed137880fb816b93ea082e117575fa0c72a7e` 및 문서 마감본을 합쳤다. 주거 앱·모델·검증기는 해당 source와 같고, 세금12·주거10·DB4·회계2의 공개 후보 범위를 보존한다. 별도 승인된 확률8·관측5·인증6·홈서버 후보는 계획 문서만 포함하고 새 책을 카탈로그에 등록하지 않는다. 전체 **1061/1061 테스트**와 TypeScript·Vite build를 통과했다. 로컬 동시 실행 수4에서 모든 파일·단언을 유지했다. 새 합본의 실제 production과 정확한 게시 버전은 다음 별도 게이트이며 앞선 단독 F 실행과 구별한다.

## 주거 E 합본의 실제 production 게이트

PR29의 새 head `df0b68f361da90f9a0d0c7dd4d037e332916c77a`, tree `262a9d477235c5d5d00de915a14a220b5afe3806`에 대해 [run39384781174](https://github.com/Middleages/my-books/actions/runs/39384781174)의 checkout `2f05a0d27eaf587c87c66fc1ce92bf1b244e6a0b`가 같은 tree·clean임을 확인했다. 전체1061테스트·build 및 선택된 tax·housing·book-volumes가 모두 성공했다. 세금 **182/182·원본138PNG**, 주거 **160/160·고유 원본160PNG**(capture호출169), 권차 **14/14·39PNG**이며 앱 오류0이다. 보험·투자·DB·Kubernetes·회계는 이 affected 실행에서 의도적으로 제외됐고 마지막 넓은 회귀를 대신하지 않는다.

세금 artifact12247221011 ZIP SHA-256 `6d6c3606666bd912ed55d33f1b3538123b99c929f30d1033a6597908cbb41064`, 주거12246529193 `47287a9c79a18962703b1ce54e9248ab490e3bdae106fbfffb3c4b76de60de9c`, 권차12247255295 `49a0497355a09c272f1f55620b1f3f167aad9b67b4eb9677b0ea27cd0b4ef5e9`, 범위12246867431 `1822d704a8314a581a479241d3b4ad8f625e9d3047bcd30436934cb36dd74556`를 다운로드 원본과 대조했다. 실제 제공 JS `index-DyxQeQd2.js` 2,769,564bytes SHA-256 `b017248f59b8a9f59a0d21ec352066fd20097fb3059785676cf36be4f6d7f74c`, CSS `index-sYxM-qHK.css` 339,563bytes `b370b942359b5a14defc7a9012531c85c6854223b37ca56b51c4bdf72e151723`가 단일 build와 일치했다.

작성자는 새 합본11·12의1440초기·320변경·390정적 원본6장을 다시 열어 시간표의 누적액/환급/관찰 표시와 문서의 선택/분류/해설 관계가 유지됨을 확인했다. 주거 작성자는 새320 rent-or-buy-local-price·320 market-mix changed·1440 shortage 원본의 핵심 영역을 직접 확인했다.24개월 공통 비교와 집2억4,000만원·빚7,455.95만원, 자체110과 거래평균의 차이,39개월 마지막 반영·40개월 부족의 동결 및 정산 미완료가 명확했다. 검토용 native crop은 원본 PNG수에 더하지 않는다. 이 새 합본의 직접 검토 범위에서 차단점은 없었다.

현재 main05270dda의 D live와 그다음 E 게시 순서를 유지한다. 이 기록은 F main·Pages나8개 전체 suite의 최종production/published 회귀 완료가 아니다. 최종회귀는 확정F main을 고정 checkout한 읽기 전용 별도 branch에서 동일 build를 사용해8개 production과8개 published를 각각 실행하고, 실행 전후 main 고정·정확한 게시 자산을 확인한다. 배포 권한·deploy job이나 main용 workflow는 변경하지 않는다.


## F 게시 직전 최신 main 보존 점검

E의 실제 공개 main05602d24와 세금E·주거D·DB B 마감 문서를 보존했다. PR29 df0b68f의 본문·모델·UI·검증기·테스트·workflow와 최종 후보의 차이는0이며, 전체1061/1061 단위 테스트·TypeScript/Vite build·diff 검사를 다시 통과했다. 생성된 JS `index-DyxQeQd2.js` SHA-256 `b017248f59b8a9f59a0d21ec352066fd20097fb3059785676cf36be4f6d7f74c`, CSS `index-sYxM-qHK.css` `b370b942359b5a14defc7a9012531c85c6854223b37ca56b51c4bdf72e151723`는 PR29 production과 동일하다. 최종 범위 분류기는 tax·book-volumes·housing3개를 선택했고 DB·회계·보험·투자·Kubernetes5개는 이번 영향 검사에서 의도적으로 생략한다. 이후 고정된 F source의 별도 읽기 전용 전체8개 suite production/published 검사에서는 생략 없이 다시 검증한다. 이 절은 게시 직전 검증이며 아직 그 이후 main/Pages/live/전체 회귀의 완료 증거가 아니다.


## F 실제 main·Pages·공개 화면 게이트

main `d76ed55e9969108449124a154c7c67e946068740`, tree `2d361e04d653c1c541fe2e345aa0973baaf271c3`의 [run39389395940](https://github.com/Middleages/my-books/actions/runs/39389395940)는 전체1061단위 테스트·build, tax·housing·book-volumes3개 production, Pages,3개 published의8개 job을 모두 통과했다. Pages는2026-10-20 07:58:33 UTC에 게시됐다. 공개 세금182/182·원본138PNG, 주거160/160·고유160PNG, 권차14/14·39PNG이며 sourceChanges는 빈 값이다. 세금·주거의 정확한 호스트 기본 favicon404 한 건씩을 별도 진단에 보존했고 앱/page/resource 오류는0이다.

- main build artifact12249012321 ZIP SHA-256 `87593e6fa62ee34bf55c82912c9ff7683eae3e00076609b99d444dfc7fbee2b4`, 공개 세금12248729604 `44fdfacf94246cc47d2a2a9438faa634c5aa3b4acb007303ffefe49e0b5b8bc6`, 주거12250020001 `7ed7c9ab80f458a2c9d2c01ddb3b8c4fcfe776528b6731b3a480b4cdf482980b`, 권차12249455761 `161b2d72b88c1bc94fcce4725c18f255df7835a00cebe6797fa10a375324eb23`를 내려받아 일치 확인했다.
- main build 및3개 공개 suite가 JS `index-DyxQeQd2.js`(2769564 bytes, SHA-256 `b017248f59b8a9f59a0d21ec352066fd20097fb3059785676cf36be4f6d7f74c`), CSS `index-sYxM-qHK.css`(339563 bytes, `b370b942359b5a14defc7a9012531c85c6854223b37ca56b51c4bdf72e151723`)의 정확한 동일 바이트를 증명했다.
- 작성자는 새 공개11·12 각각1440 초기·320 변경·390 reduced-static6원본과320 시간표 native 상단,1440 홈·세금 권차를 직접 열었다.11의 Y/Y+1 및0–18개월, 누적 순유출0–150,144에서18개월 환급64 뒤80으로 줄어드는 막대·현재값·정적 표가 일치했다.12의 사실/해석·가정/추가 확인은 기호와 선택선으로 구별되고 선택4의 세제 혜택≠원금 보장 설명이 연결됐다. 홈은 세금12·주거10·DB4·회계2의 실제 읽음 분모를 유지했다. 넓은 정적 표의 모든 열을 모바일 한 화면에서 읽었다고 주장하지 않는다.
- 주거 담당자는 새 공개1440-rent-or-buy-shortage 전체,320-market-mix-changed0–2100px,390-housing-supply-reduced-static 전체를 직접 보았다.39개월 마지막 원장·40개월 부족·60개월 정산 미완료, 변화 바구니 우선·평균36,666.67와 고정구성110, 같은100호의 단계 보존·인접 제어·준공과 실제 입주의 차이가 읽혔다. 검사한 범위에 차단점이 없다.

세금 소개·01–12의 A→F 순차 게시를 마쳤다. 여기서는 영향 밖5개 suite를 의도적으로 생략했으므로 아직 최종 넓은 회귀 완료는 아니다. 별도 읽기 전용 branch의 [run39391228232](https://github.com/Middleages/my-books/actions/runs/39391228232)가 실제 main d76ed55e/tree2d361e04를 고정 checkout하고, 단일 빌드를 기존8개 suite의 production/published16개 검사에 공급한다. 배포 권한·main workflow 변경은 없으며 각 job 전후 main 고정과 정확한 자산을 확인한다. 완료 결과는 아래에 실제 실행 뒤 추가한다.


## 최종 전체권 넓은 회귀 — 실제 고정 source에서 완료

[읽기 전용 run39391228232](https://github.com/Middleages/my-books/actions/runs/39391228232)는 2026-10-20 08:31:44 UTC에 **17/17 job 성공**으로 종료했다. workflow를 담은 별도 branch commit은 `786f7fceb3f074c7dd2e89b8803a6baee590b1d0`이며, 실행 앱은 매번 실제 공개 main **`d76ed55e9969108449124a154c7c67e946068740`**, tree **`2d361e04d653c1c541fe2e345aa0973baaf271c3`**를 고정 checkout했다. 두 SHA를 혼동하지 않는다. main workflow·배포 권한·앱은 바꾸지 않았다.

전체 **1061/1061 단위 테스트·build**의 한 산출물을 아래16개 job에 공급했다. 각 job은 시작·종료 시 clean source와 고정 main을 확인했다. production은 같은 build, published는 그 build와 실제 게시 JS/CSS의 정확한 바이트 일치를 확인했다. 최종08:34 UTC의 별도 main 읽기도 d76ed55e였다. 따라서 이 gate 동안 다른 게시 버전으로 결과가 섞이지 않았다.

| 기존 suite | production 검사 | published 검사 | 각 모드 원본 PNG |
| --- | ---: | ---: | ---: |
| insurance | 138/138 | 138/138 | 603 |
| investing | 160/160 | 161/161 | 680 |
| tax | 182/182 | 182/182 | 138 |
| book-volumes | 14/14 | 14/14 | 39 |
| database | 339/339 | 340/340 | 135 |
| kubernetes | 94/94 | 94/94 | 146 |
| housing | 160/160 | 160/160 | 160 |
| accounting | 65/65 | 66/66 | 34 |

합계 **2307개 검사와 원본3870PNG**다. PNG 생성 수는 직접 읽은 수가 아니다. 각 결과의 앱/page/console/resource 실패 배열은 비어 있다. 세금·DB·Kubernetes·주거의 published에서 알려진 정확한 호스트 루트 favicon404가 각각1건 별도 보존됐다. 이를 전체 브라우저 진단0이라고 표현하지 않는다.

### 정확한 artifact 및 자산

모든 ZIP을 직접 내려받아 Actions가 선언한 SHA-256과 일치하는지 확인하고, 압축 원본의 결과·before/after source 증명을 읽었다. 검토용 crop은 원본 PNG 수에 더하지 않았다.

| artifact | ID | ZIP SHA-256 |
| --- | --- | --- |
| tax-final-production-insurance | 12250582286 | `89609bf78c7d4d8c1c1f2578b7c6d2d044bcd9ee6eeb5d0339364dde650a4a1e` |
| tax-final-published-kubernetes | 12250420766 | `ba088cc5ef1ca6ef43fbc5a7ba7addd25d7e3270a6f2948925ac43dbabc6530a` |
| tax-final-published-insurance | 12250269423 | `6801e516314b1cd9a7bc65a97b404d45e4d722e7514ce4095810e9d64249898c` |
| tax-final-source | 12250205475 | `4620c7eb48f42a7e01fefeaa57c097d048bd2c63c2bacb2517e51216a1c4e23f` |
| tax-final-published-investing | 12250182297 | `488cc643c5a97692eba6a2a968aeff982d423b2d9c27bc40f591149657f1043e` |
| tax-final-published-housing | 12250116750 | `a802393a1e616475ac204f983dd8b94607cabd445a9879d6f576078dc33e64d2` |
| tax-final-production-database | 12250096781 | `a7fb52d797fb841c8837825d42a29b5b2aa0605590db1c2d890d46fe6efa2e5b` |
| tax-final-production-housing | 12250056955 | `9f71ce3f392cfc1f43dc6e0da982ddcb737825104fac983d3357fe9302ffaee0` |
| tax-final-production-investing | 12250002449 | `e4e5bc13931ac2f5196e16422a652709b4bf62607ff60228b59878e4651f63de` |
| tax-final-built-dist | 12249951063 | `4af3be216a08b2ba266d5f08a6a4b7a0cde93d51a10412fcf454441d47edd45b` |
| tax-final-production-tax | 12249796955 | `db8809247f96d3404f1e668e73114e96a17f13457f2d4005f5f3c789b7e3ed7d` |
| tax-final-published-book-volumes | 12249736870 | `f571ee8d74a2a4adb48ed6e3c0c6937492f3edd7a425d88927654ca1db7057ff` |
| tax-final-published-accounting | 12249547985 | `4fa01a2fd73638ea195523e9836d5f859cecba9b25a2cf4ba73acb30718a25e0` |
| tax-final-production-accounting | 12249542938 | `af317a662903abfbfac8e0e973c8a448119bf84ca5c62657ca158539c0bb1d7c` |
| tax-final-published-database | 12249528891 | `584cf9b31b340cd6da6591950d6fed7c4ef319f9c32f209194083532f06120f2` |
| tax-final-production-kubernetes | 12249372693 | `517be84bf4588bf54324bb1e39f09c3f595e0481c67e161d3859bcc2907644c7` |
| tax-final-published-tax | 12249214057 | `8b24b8a4bd7f17336ad30a6525812cfb8056a6feb34022264b77e8a8c635d1f8` |
| tax-final-production-book-volumes | 12249198833 | `812365ea50440b284a99847c3237bb4c356d9e356d6cbc4167fea4c71804cdfd` |

16개 job의 공통 JS는 `index-DyxQeQd2.js`,2769564bytes, SHA-256 `b017248f59b8a9f59a0d21ec352066fd20097fb3059785676cf36be4f6d7f74c`이고 CSS는 `index-sYxM-qHK.css`,339563bytes, `b370b942359b5a14defc7a9012531c85c6854223b37ca56b51c4bdf72e151723`다.

### 마지막 직접 시각 검토와 한계

새 published의 세금 소개와01–12를 포함하는14원본을 직접 열었다.1440 초기 화면은 사건 경계·400의 구간 분해/80세액·급여300의260/25/15 분리·VAT 공급 장부·계좌의 조건 문·350의 이전 과세 바탕·80/65/30 공제 비교·0–18개월 시간표를,320 변경 및390 reduced/static은0과 미정의·환급70/150/80·투자 분류·주택의 세 사건·문장4와 가정 해설을 확인했다. 공통 눈금·단위·현재 입력과 결과·인접 제어·정적 대안이 유지되고 검사한 영역에서 의미/가독성 차단점이 없었다.

다른 책은 새 공개 원본에서 Kubernetes320 HTTP응답, 회계320 복식3단계, DB320 COUNT분기, 주거390 공급 정적 대안, 투자320 외상매출120의 회수 및 native범위, 보험320 5년 납입 종료/10년 보장 장면 및 native상단을 직접 확인했다. 각각 경로 방향·현금410+설비240·COUNT의 다른 기준·같은100호 단계·새 매출 없는 회수·납입 종료와 보장 종료의 차이가 읽혔다. 앞선 각 배치의 직접·독립 검토 증거도 보존했다. 원본3870장 전체나 모든 표 셀을 수동으로 읽었다고 주장하지 않는다.

**세금5권 소개·12장의 구현, A→F 순차 main·Pages 게시, 공식 출처/가상 모델 경계, 단위·브라우저·정확 게시 자산·대표 화면 직접 검토와 마지막 넓은 회귀를 완료했다.** 실제 Safari/Firefox·물리 기기·스크린리더 음성·학습효과 연구는 미실행이다. 실제 법률 적용·개인 세액·절세 적격 판정 또는 신고 도구로 보증하지 않는다.

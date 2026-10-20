# 육아 2·3권 A 신규 등록 합본 검증

2026-10-20. 육아 2권 《잠과 생활 리듬》과 3권 《먹는 법을 배우는 시간》의 소개·01–02만 추가한 합본이다. **아래 앞부분은 단계별 당시 기록이며, 최신 A main·Pages·전체14종 실제 게시 완료는 마지막 절을 따른다.** 선행 PR57과 PR63의 각 exact-main/live 게이트 뒤에만 게시한다. 두 책 B 이후와 첫권의 미래 장을 섞지 않는다.

## 정확한 범위와 보존

- 수면 A 검증 source: PR56 `842dcd2d17650569de8506e7e42718bcbe1c4ab9`, tree `b8d9c326`. 작성자의 run39403796489에서 최초10 production suite·전용26검사/49PNG와 직접8원본 게이트가 닫혔다. 인계 문서까지의 로컬 `89aa8b293ff4f018e24016478ede35a3c99eb659`를 보존했다.
- 먹기 A 검증 source: PR60 `10bfd420b689d403357e32623e145ce1c975ad04`, tree `43cfb07440271a470d2a169ff60809344e02b1d3`. run39406529341에서 최초11 production suite·전용26검사/53PNG와 수정 후 직접4원본 게이트가 닫혔다. 인계 문서까지의 로컬 `be8eefcf1e53d1ad3f6492ead2b68d616851cfc6`를 보존했다.
- 선행 PR63의 검증 source `f9ca8065ecff294b4f903a23935ba2cfe7ac7b45`, tree `4637e434d6b082becac26e3dc229c4f873388b98`와 그 문서 마감 `e11be48`을 시작점으로 삼았다. 첫권6·DB8·회계8·확률6·관측6·인증4·세금/주거12 등 기존 모든 카탈로그 partition과 공통 선언이 바이트/구조상 동일함을 검증했다. 기존15권의 chapter ID·readId·권차·읽음 저장을 바꾸지 않았다.
- 먹기 A의 본문·모델·컴포넌트·전용 verifier·테스트는 위 작성자 source와 같다. 수면 A는 아래 안전 보강25e05f1의 본문2문장과 렌더 assertion/PNG 추가만 구분해서 적용했으며 모델·컴포넌트·단위 테스트·카탈로그 partition은 원래 A와 같다. 수면의 실제 Tab 키보드 모드 검사, 먹기의850px 라벨 높이4.5em 및 막대 기준선 회귀를 보존했다. 표지는 새 두 분기만 더하고 기존 분기를 그대로 유지했다.
- 기존12개 suite를 삭제하지 않고 `child-sleep`, `child-feeding`을 더해14개를 명시 등록했다. `catalog-published-count`의 책별 연속 공개 prefix 검사도 보존했다. 총17권·139장으로 새 두 권은 각각 실제2장뿐이다.

## 교육 모델과 실제 근거의 경계

실제 아이 기록·사진·체중·건강정보 입력이나 업로드·외부 전송을 연결하지 않는다. 수면 모델은 침대 시간과 확인 수면·미확인을 구분하고, 첫돌 전 영아의 방/별도 수면 표면 경계를 설명한다. 먹기 모델은 제시/탐색/확인 섭취/흘림/미확인과 일반 연령 안내/개별 관찰/상담 질문을 구분한다. 정상 점수·개인 시작일·안전 확률·수면/영양 처방·임의 수유 중단·약물/응급 술기를 제공하지 않는다.

통합 검토에서도2026-10-20 [질병관리청 영아돌연사증후군](https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5467), [AAP 안전 수면 안내](https://www.healthychildren.org/English/ages-stages/baby/sleep/pages/a-parents-guide-to-safe-sleep.aspx), [CDC 보완식 시작 안내](https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html), [WHO 영유아 먹이기](https://www.who.int/news-room/fact-sheets/detail/infant-and-young-child-feeding)의 관련 원문을 읽었다. 본문이 일반 안내를 개인의 판정·한국 제품 인증·의료 전문가 감수로 바꾸지 않는지 대조했다. 저작물 전체나 기관 삽화를 복제하지 않았다. 임상·영양 전문가 감수, 실제 아동의 결과나 제품 안전성 검증은 미실행이다.

## 로컬·후속 게이트

전체1268/1268 단위 테스트를 동시성4로 실행해 생략 없이 통과했다. 새 등록의 공통 분류기 변경 때문에 실제 선택은 **14개 전체 production**이며 생략은 없다. 선택한 verifier의 단언·원본 캡처·정적 대안·키보드·reduced-motion을 줄이지 않는다. main workflow 배포 권한이나 명령은 바꾸지 않았다. 로컬 build와 합본의 실제 source/직접 원본 결과는 아래에 별도로 기록한다.

작성자별 기존 캡처가 새 합본 화면을 대신하지 않는다. 이 후보에서 두 책과 공용 홈을 실제로 다시 캡처해 핵심 관계·모바일 제어·원본 막대 기준선을 직접 확인해야 한다. 실제 Safari/Firefox·물리 기기·스크린리더 음성·의학적 안전성을 실행 테스트로 보증하지 않는다. 마지막 main/Pages와 전체14 published 및 정확한 JS/CSS 대조는 앞선 배치 게시 이후의 별도 게이트다.


로컬 build 후속: 2026-10-20 전체1268/1268 통과 뒤 `NODE_OPTIONS=--max-old-space-size=2048 npm run build`가484 modules로 한 번에 성공했다. 기존 대형 bundle 경고는 남아 있다. 같은 source에 실제 main `a2a017730aed91c416e8ba6535c62580a6646bf4`의 새4권 A 게시 마감 문서를 보존 병합했으며 앱/모델/검증기 바이트는 바뀌지 않았다. 새2권의 실제 합본 QA·직접 원본·게시 상태는 여전히 미완료다.

- `index-8riXVrno.css`: 409780bytes, SHA-256 `a10b9af0369d046f3d47fbcbbed326ac44cc8011eb5900814a5f15e5d837fcf0`.
- `index-Vxf9SJDJ.js`: 3469179bytes, SHA-256 `5c50ecb4d21bc1ac99de8c6d17a9a9ed2b899c9a3fedb436466b196c39237420`.


## 독립 읽기 검토 후 안전 실천 보강

추가 읽기 전용 검토는 임상 감수가 아니다. 기존 원고가 위험 행동을 허용하는 오류는 없었으나, 보호자가 잠들기 전 수유/달래기 뒤 영아를 별도 적합한 수면 공간으로 옮기는 것과 소파·푹신한 안락의자에서 영아와 함께 잠들지 않는 실천을 수면02의 첫돌 전 범위에 더 명시하도록 권고했다. 작성자의 최소 커밋 `25e05f1f01f41cc772c2cbf80e267aa1d6257c61`을 그대로 적용했다. 근거는 기존 KDCA 생활습관 관리6와 AAP 방 공유 절이며 모델·카탈로그 변경은0이다. 이 보강은 앞선 작성자 A 앱 바이트와 다른 실제 본문 delta로 기록한다.

전용 verifier는 기존 검사 하나도 제거하지 않고320/390/850/1440에서 새 문단의 실제 렌더·넘침 검사·`caregiver-boundary` 원본 캡처를 더했다. 보강 후 전체 unit/build와 이 합본14 production 및 새 문단 직접 원본을 다시 확인하기 전 완료로 쓰지 않는다. 이전 build 자산은 위에 역사로 남기고 최종 보강 자산은 아래에 별도로 기록한다.


안전 보강 후2026-10-20 전체1268/1268 단위와484 modules production build를 다시 통과했다. 수면 실행 소스는 작성자25e05f1과, 먹기는 be8eefcf와 동일하며 새로운 임의 모델 변경은 없다. 최종 보강 자산:
- `index-8riXVrno.css`: 409780bytes, SHA-256 `a10b9af0369d046f3d47fbcbbed326ac44cc8011eb5900814a5f15e5d837fcf0`.
- `index-nWgtlK9n.js`: 3469492bytes, SHA-256 `73057201aacf30c4108391cdcf189f7efe8637b8e83ca83491cd6fb82ef83b9b`.

이 결과는 로컬 단위/build이며 실제 합본14 production과 새 안전 문단 원본·main/Pages 게이트를 대신하지 않는다.


## 실제 합본 production·직접 원본 완료 — 2026-10-20

[PR69](https://github.com/Middleages/my-books/pull/69) head `ecf9d67dc5a35876aa6565b8b8cabe4c2c2d79e9`, 실제 checkout `2585e5fb77bfe87876501423026f8d8fd365823c`, tree `0a9636eb65e8514d4ba6abb467c5f0aab603ba1c`의 [run39412137368](https://github.com/Middleages/my-books/actions/runs/39412137368)이 전체1268/1268·484 modules build와 **14개 전체 production suite**를 성공했다. 마지막 보험 job 종료는11:23:57 UTC다. 합계2179검사·3183원본PNG, 앱·별도 호스트 진단0이다. PR의 deploy/published는 skipped이며 실제 공개 완료를 뜻하지 않는다.

모든14개 ZIP과 scope·단일 Pages build artifact의 GitHub SHA256을 다운로드 바이트와 대조했다. source를 기록하는13개 report는 위 checkout과 일치하고 clean이며, 투자 report는 자체 source 필드가 없어 해당 job118592575076의 실제 checkout 로그와 동일 github-pages artifact12259363211 다운로드/압축 해제 로그를 함께 확인했다. scope는 같은 source/tree에 전체14·생략0을 기록한다. single build ZIP SHA256 `c79520a836de459473cffe99009779c72591f95e857184b4bd847089017ac5b8`의 tar 내부 JS/CSS 전체 바이트는 위 최종 보강 로컬 자산과 같다. 홈·세금·주거·쿠버네티스의 실제 서비스 자산 해시와 각 새 책 report의 dist 자산 해시도 일치했다. 모든 report에 동일한 자산 필드가 있다고 주장하지 않는다.

| suite | 검사 | 원본 PNG | artifact | ZIP SHA256 |
| --- | --- | --- | --- | --- |
| insurance | 138 | 603 | 12260731630 | `f19fd04856034acbe43011e3b5a5ccddc0bab140063118e63684bfe7e1c0e4ed` |
| database | 511 | 405 | 12260562687 | `1575e76b4b60320364bd0487fa396514227e61e36182af99861a4262dd89b79b` |
| tax | 182 | 138 | 12260531146 | `76b0090d4e648167ea8af59cd7b7d8a0a41b782f33eae2928a6ec2eb58cbb3af` |
| child-feeding | 26 | 53 | 12260116101 | `604903d6e3c68419877f012bdabae071ea45262ebcad22c7e25248194f07eeea` |
| kubernetes | 94 | 146 | 12260106373 | `6155e48ae96753e00d4a34aa85227d1122da2c747f64b1120dce051181d8d103` |
| child-sleep | 30 | 53 | 12260036272 | `87f83d65b0e8055aa4eae2768e71f8702131647ff682744f35d992e89957aa72` |
| investing | 160 | 680 | 12259962637 | `ffadaef08f9ac8321ac7393d93ec235bfc92419a8c616c8cc27c3383710c151f` |
| child-development | 77 | 241 | 12259906526 | `551d71dd986ffa6d36a15a386ec48394e438dd369563a18b128125c7a8a06ac1` |
| authentication | 19 | 105 | 12259836597 | `0a3edbee07f25f805c8ec258fada9e65a0211807869637fb52719e777ee07ae0` |
| accounting | 251 | 229 | 12259807218 | `eb849864d881b50ae86eb42273ac918d552539cb869c66a7b9513e0611478f42` |
| book-volumes | 14 | 57 | 12259741609 | `6de0cfd774ab5eacc8f806910c21130da3227c16c06af54f407932c699ad9b62` |
| housing | 189 | 248 | 12259644022 | `d84f3148c916e856a7f3fcbe8f4b48141e40239f35f520412c33f1374120940a` |
| probability | 462 | 123 | 12259528679 | `11e5c13695100fdc00b2ef6758cadcf3390e03517d37de3eaa1d64edb1467099` |
| observability | 26 | 102 | 12259213722 | `74a9d0986b6bf6aaa7fee64bf467861cef9885093d56c64a8a7ca8c0835e0f5f` |

### 새 합본의 직접 시각 검토

- 작성자8원본: 수면320/390/1440-caregiver-boundary,390-space-position,320-record-conflict; 먹기850-experience-mouth,320-meal-unknown,390-readiness-preterm. 새 안전 두 문장이 잘림 없이 읽히며 별도 수면 표면·상충/미확인 기록이 보존된다. 먹기 막대의 공통 기준선·미확인≠0·남은18g≠확인 섭취와 조산 사례의 개별 상담 경계를 확인했다.
- 통합 담당자5원본:1440-home 전체,320-home 및390-reading-first의 native상단0–2000px,850-experience-mouth 전체,320-space-room 전체.17권139장·육아 권차1/2/3과 새 두 권의 분모2, 읽는 책 우선 정렬과 기존 고정 권차가 보존된다.850px 미확인 막대들이 같은 기준선을 쓰며 입에 넣기≠삼킴/안전,320px 같은 방≠같은 침대·별도 영아 표면과 바로 눕힘 그림을 읽었다.

검토한 서로 다른12개 원본의 명시한 범위에서 의미·잘림·겹침 차단점을 찾지 못했다. 작성자/통합 담당자가 공통으로 본850 먹기 원본은 중복해서 원본 수에 더하지 않는다. 기존320 홈 hero의 한 글자 줄바꿈은 경미한 미관 한계로 남는다.3183개 전부·모든 표행·실제 기기/스크린리더·의학/영양 전문가 감수를 수행했다는 뜻은 아니다. 새 본문은 일반 교육이며 개인의 안전/발달/영양 판정이 아니다.

이후 실제 main358c59bb의 이전 배치 게시 마감 문서를 보존 병합했고 앱·모델·테스트·검증기·workflow 바이트는 위 PR69와 같다. 이 합본의 main/Pages·14종 실제 게시 자산·대표 화면은 선행5배치의 live 게이트 뒤에 수행한다. A만 포함하고 B 이후는 별도 후보로 유지한다.

## 정확한 main·Pages·전체14종 실제 게시 마감

실제 main `2c2b11d3ba9af855dd4724e91051ea775d94051b`, tree `0d6e66c955c8ae8c90195cf0f193be65a81661e4`의 [run39417253750](https://github.com/Middleages/my-books/actions/runs/39417253750)이 build·전체14 production·Pages·전체14 published, 총30개 job을 모두 성공했다. 전체1268/1268 단위·484 modules build가 성공했고 Pages job 완료는 `2026-10-20T12:09:35Z`다. production 2179검사/3183원본PNG, published 2188검사/3183원본PNG로 총4367검사·6366원본PNG다. 생략 suite는 없다. 두 책은 소개·01–02까지만 공개하며 후속 B는 포함하지 않는다.

28개 browser ZIP과 scope·단일 Pages build ZIP의 GitHub SHA256을 실제 다운로드 바이트와 대조했다. source 필드가 있는13종 report의 정확한 main과 clean 상태, 기록된 sourceTree를 확인했다. 투자 report에는 source 필드가 없어 각 실제 job118609509266/118618787162의 checkout `2c2b11d3ba9af855dd4724e91051ea775d94051b`와 같은 build artifact12262190163 다운로드 성공 로그를 함께 확인했다. build ZIP SHA256은 `5066f49ab77646e58bb86918ea54a3f334ef215aa3f8121dbd62c172a5da9436`이며 tar의 JS/CSS 전체 바이트가 앞서 검증한 로컬·PR69 최종 자산과 같다. 실제 게시 홈의 두 자산 전체 바이트·해시 비교도 성공했다.

- JS `index-nWgtlK9n.js`: 3469492bytes, SHA256 `73057201aacf30c4108391cdcf189f7efe8637b8e83ca83491cd6fb82ef83b9b`.
- CSS `index-8riXVrno.css`: 409780bytes, SHA256 `a10b9af0369d046f3d47fbcbbed326ac44cc8011eb5900814a5f15e5d837fcf0`.

| suite | production / published 검사 | production / published 원본 PNG | 게시 artifact | 게시 ZIP SHA256 |
| --- | --- | --- | --- | --- |
| insurance | 138 / 138 | 603 / 603 | 12264996431 | `1d91269c0058b7a0736a92813485d242cfe3d5a1d3a1707eb33069ba5636033b` |
| investing | 160 / 161 | 680 / 680 | 12262814394 | `00adfb471bd9f37fa206f431728cf58c75eb832bd8eac312491199a4e38c72b0` |
| tax | 182 / 182 | 138 / 138 | 12262558413 | `ffe25bea3d4540ef6f0229836970550bbeb38ff352cc679efaca7228c4c506d2` |
| book-volumes | 14 / 14 | 57 / 57 | 12262574300 | `300c8cb9796eafb76bbdf945a44ed314c5cd7be567115c2768481b6e131d33fd` |
| database | 511 / 512 | 405 / 405 | 12262624753 | `bc60e9cb3e318d4a353fcb02b8b1d52e338d4c14fc33677d2c4bedcb46517d06` |
| kubernetes | 94 / 94 | 146 / 146 | 12263563211 | `3e1a6841dba165c8dfcd88ed44e610f2f44a52c182275e1f7de3233fa558bfc3` |
| housing | 189 / 189 | 248 / 248 | 12262873888 | `5c526c4aa6a764c44817253cc5ced5693c66dc29b0f4f2a74fbc1de6ef7eb73f` |
| accounting | 251 / 252 | 229 / 229 | 12263463399 | `cfc54f004defab5e5ebe2c1680a16ce0426065fac6f07080b72da96921c496b5` |
| probability | 462 / 463 | 123 / 123 | 12263677556 | `bd221942590a46810330bd0b20f179ed48c80a02f354aef42f94ebe534f6458a` |
| observability | 26 / 27 | 102 / 102 | 12263478338 | `7fcfdbc0a94b0fc3c98abda01e2f989e86f1b83a580269d20845468bcaf8721d` |
| child-development | 77 / 78 | 241 / 241 | 12263527712 | `ccfce2031b8beefbaca4757a198bb880c8db2470001fd5fe86853ede89eed0e0` |
| authentication | 19 / 20 | 105 / 105 | 12262574124 | `0b78550e7aee5070044104d9c416d2c5ececf4080757db13731cc008aed9bfe3` |
| child-sleep | 30 / 31 | 53 / 53 | 12262918728 | `cff19e1344229a292260ca397738b0e8323354e57463590fedddcfc71ef8cc88` |
| child-feeding | 26 / 27 | 53 / 53 | 12263701439 | `7aee1840c706b092e54ecff37bfe067f6e778693b21dfaf40a9a4f971642bcbc` |

앱 page/console/resource 오류는0이며 production 별도 진단도0이다. published의 child-feeding, probability, kubernetes, child-development, observability, accounting, child-sleep, housing, investing, database, authentication, tax에 기록된 알려진 `https://middleages.github.io/favicon.ico`의404는 출처·페이지·메시지를 확인해 별도로 보존했다. 모든 호스트 진단이0이라고 쓰지 않으며, 앱 경로·다른 호스트·미확인 출처·다른 상태는 제외하지 않았다.

### 실제 게시 원본의 직접 검토

작성자가 수면320/390/1440-caregiver-boundary와 먹기850-experience-mouth·320-meal-unknown·390-readiness-preterm의6원본을 직접 열었다. 안전 실천 두 문장,850 공통 막대 기준선,320 섭취 미확인≠0 및 행선지 미확인18g, 조산 사례의 개별 상담 경계를 확인했다. 통합 담당자는1440-home 전체와320-home·390-reading-first 원본의 native상단0–2000px를 직접 열어17권139장·육아1/2/3권·새 책0/2와 읽는 책 우선 이동 뒤 고정 권차/진도를 확인했다.

서로 다른9개 원본의 위 범위에서 새 의미·잘림·겹침 차단점은 없었다. 기존320px 홈 hero의 마지막 한 글자 줄바꿈은 경미한 미관 한계다. 전체 원본 전수 사람 검토·실제 기기·스크린리더 음성·의학/영양 전문가 감수·개인 아동/제품의 안전성 검증을 뜻하지 않는다. 이 정확한 A 게시 게이트를 닫고, 후속 장은 각 배치의 별도 검증과 순차 공개를 따른다.

# 두 번째 다섯 후속 배치 통합 검증

2026-10-20 UTC. 회계 D07–08·확률 C05–06·육아 발달 C05–06·인증 B03–04·관측 C05–06을 합친 후보의 작성 당시 기록이다. **실제 main/Pages 완료 결과는 마지막 절에 있다.** 새4A 실제 게시, 이어지는 다섯 후속 배치의 실제 게시를 먼저 닫은 뒤에만 이 후보를 main/Pages에 반영한다. DB E·확률 D·육아 다음 권과 다른 더 뒤 배치는 포함하지 않는다.

## 보존과 범위

실제 main `9c1df885218915bd368744e1420c3c17ce911fd1`의 모든 소스·마감 기록과, PR57의 검증 앱 및 새 검증 기록을 보존한 로컬 `fdb6f459e799e7f8e50b4683c34dd53655aef24d` 위에서 통합했다. 이후 PR57의 확률 교차 검토와 알려진 DB 강조 렌더 한계도 문서로 보존했다. 이 순서는 선행 두 파동의 공개 완료를 주장하지 않는다.

| 추가 배치 | 보존한 작성자 소스·마감 |
| --- | --- |
| 회계 D07–08 | 공개9237a74cc1c8339883435f27e20020d8775cb190 / 로컬5e36ab17545df0863cc39c920a00b54333c83fe4 |
| 확률 C05–06 | 공개af9366499cb2d011c913e33713bc5de8da1be702 / 로컬631affd730a6dd0c9e034f6742d59fb4c372dd2a 및 검증 문서 전용 마감 |
| 육아 발달 C05–06 | 공개26f16d287dbb34c43172223075a4ed3840f68b42 / 로컬86bb94cb1817dada43827d5648591e65ee7b6005 |
| 관측 C05–06 | 공개c83bc647867f30ae211a206403e3c256d63f85ef / 문서8cf947be347a14e7022607543abfba1c694dee36 |
| 인증 B03–04 | 공개f59e523165b8e0bef5053ab4f99a0cca8c65855a / 문서5358ff7e0ba796e21087928195e8cde36d8ed6c5 |

다섯 책의 본문·컴포넌트·순수 모델·전용 브라우저 검증기·테스트가 작성자 소스와 바이트 단위로 동일함을 확인했다. 카탈로그는 책별 import·chapter·book 레코드만 통합하고, 구조적 파싱으로 공용 선언과 비대상 책 레코드가 이전 합본과 같음을 검증했다. workflow·suite 등록/선택기·package·lockfile·공통 표지/홈은 변경하지 않았다. 기존 ID·readId·권차·저장 키와 미지 읽음 ID를 보존한다.

후보는15권·135개 본문이며 대상 책 읽음 분모는 회계8·확률6·발달6·인증4·관측6이다. 비대상 DB8·주거12·세금12와 나머지 책의 범위를 그대로 둔다.

## 영향 범위와 실행 구분

diff 분류기의 선택은 book-volumes·accounting·probability·child-development·authentication·observability **6개 suite**다. insurance·investing·tax·database·kubernetes·housing **6개 suite는 의도적으로 미실행**이며 통과로 기록하지 않는다. 선택된 각 suite의 기존 단언·키보드·reduced-motion·정적 대안·원본 캡처 범위는 줄이지 않는다. 전체 unit/build와 공용 홈/권차는 계속 검사한다.

이 통합의 전체 단위 검사는 모든 파일을 유지한 `node --test --test-concurrency=4 tests/*.test.mjs`로관측 C 추가 뒤1259/1259 통과했다. 앞선 네 배치 후보는1255/1255 뒤 Vite467모듈 변환에서 프로세스가 Killed로 끝났으며 빌드 성공으로 기록하지 않는다. 현재 다섯 배치는 다른 무거운 빌드를 직렬화하고 `NODE_OPTIONS=--max-old-space-size=2048 npm run build`로 한 번 재검증해 TypeScript·Vite472모듈 build를 통과했다. 이 제약은 로컬 프로세스에만 적용했으며 package/workflow 기본값을 바꾸지 않았다.  이 로컬 기록 당시 합본 production·새 원본 직접 검토·main/Pages·published 게이트는 미실행이었다. 이후 source 게이트의 실제 결과는 아래에 구분해 남긴다. 작성자별 source 검증을 합본의 실제 브라우저 성공으로 대신하지 않는다.

금융 예측·실제 DB/인증 시스템·실제 아이 진단을 검증하지 않는다. 실기기/스크린리더 음성·임상 감수의 증거도 없다. 검증된 구체적 화면 범위만 기록하며 모든 캡처/정적 표를 수동 검토했다고 확대하지 않는다.


로컬 검증 앱 소스는 `e0f918c352000ee0ae92ddca2a0384b62362f951`다. 그 뒤 이 기록 추가는 실행 바이트를 바꾸지 않는다. 산출물은 다음과 같다.
- `index-DKODbtgK.js`, 3429586 bytes, SHA-256 `7e0931a3924a4aed1d16974f2889349cc9fc17ad24857603fc602d7802f6c6a7`.
- `index-QmcLr7Yc.css`, 404022 bytes, SHA-256 `c790afef6f9b247780d4b02ae98ad173da299a9dbba989487ddf0979304c1122`.


## 실제 합본 production 및 직접 검토 완료

[PR63](https://github.com/Middleages/my-books/pull/63) head `f9ca8065ecff294b4f903a23935ba2cfe7ac7b45`, 실제 checkout `899e10a39f4511c6205ebcc3a02b2c95d7d3ec1d`, tree `4637e434d6b082becac26e3dc229c4f873388b98`의 [run39407941449](https://github.com/Middleages/my-books/actions/runs/39407941449)이2026-10-20 10:32:44 UTC completed/success로 끝났다. 전체1259/1259·472모듈 build와 실제 선택6 production이 모두 성공했다. 합계849체크 항목·851원본PNG, 앱/page/console/resource 오류0이다. 앞서 명시한6개 생략 suite는 이번 실행에서 통과한 것이 아니다. PR의 deploy/published는 skipped이며 실제 공개 게이트가 아니다.

모든6 ZIP의 GitHub SHA-256 digest와 clean source/tree, 결과를 대조했고 scope artifact의 선택6/생략6도 확인했다. JS/CSS 전체 바이트·해시는 위 로컬 산출물과 일치했다.

| suite | 체크 항목 | 원본PNG | artifact | ZIP SHA-256 |
| --- | --- | --- | --- | --- |
| accounting | 251 | 229 | 12258785339 | `e8dbf80298846480d66186bc0f29486aa635bd26f24cbe0fed9194fab6a11917` |
| probability | 462 | 123 | 12258083425 | `5c9d1b64bd687adf7901651e5bff1bda1373d62c2059334fd0c1cfb23f569ed4` |
| book-volumes | 14 | 51 | 12257734208 | `05249e24a33804f835291204e7b5035c203e444e7f22d62fe59b116f92a65ee6` |
| child-development | 77 | 241 | 12257244740 | `87920a43a82e0ff587ec16fa35321ee30b62d31bd66a551fe9d023a7bc652a8f` |
| authentication | 19 | 105 | 12257124547 | `5eec56e588a5b916277878596cfe72da0eac81e37539ca74522c46ddb5e27f38` |
| observability | 26 | 102 | 12256834955 | `162eecac73dd44ca0b084e1968417007cb829948fe71984c243bbe9a2c8c3163` |

원본 직접 검토 범위:
- 회계 작성자9개:1440-equipment-24-0-M1-step-2,320-equipment-48-24-M3-step-52,320-equipment-24-24-M3-step-2,1440-equipment-24-24-M3-step-4,1440-financing-loan-step-1,320-financing-capital-step-1,1440-financing-settlement-step-1,320-financing-settlement-step-2/3.650→410 단 한 번 취득 지급, M3 전 상각0/이후9, 누계216+잔존24=240, 이자5/원금20/배당10의 서로 다른 기록과 최종795=390+405·현금225를 확인했다. 이전 컨테이너 배경 충돌 재발과 모바일 잘림을 찾지 못했다.
- 확률 작성자7개:320-sampling-biased/copied,320-interval-summary-sigma20/sigma0,320-interval-zero-events,320-interval-controls,320-sampling-controls. 편의 선택의 SE 적용 불가,100행/1가구, 같은 축의 CI/PI와σ0 한 점,0건 상한의 조건·분모와 모바일 제어를 확인했다.
- 관측 작성자4개:1440-traces-parallel,320-traces-missing,390-traces-propagation,1440-signals-complete. 공통 시간축, 미관측≠0, 별도T-B와 A100/900ms 막대 배치를 확인했다. 통합 담당자도1440-traces-parallel의 native0–1900px를 열어30ms에 함께 시작하는100/150ms 자식과200ms 부모,0–300ms 눈금·인접 제어를 독립 확인했다.
- 인증 작성자3개:320-boundaries-blocked,390-boundaries-preflight,390-tokens-expired. 제어 인접, 전송/처리/읽기 분리와 만료 판정 문이 유지된다.
- 육아 작성자4개:320-communication-gesture-redirect,1440-communication-sound-follow,320-interaction-break-2,390-interaction-unclear-2. 아이→공과 보호자→책의 다른 점선 종점, 보호자→아이 응답 방향, 쉬기/종료와 모름 상태를 확인했다.
- 통합 담당자 홈1440 전체와320-home/390-reading-first native상단0–2100px:15권·135장과 각 책 분모, 읽는 책 우선/고정 권차·모바일 필터를 확인했다. 기존320 hero의 마지막 한 글자 줄바꿈은 동일한 경미한 편집 상태다.

검토한 실제 원본 범위에서 차단할 의미·가독성 회귀를 찾지 못했다. 모든851PNG, 모든 표 행, crop 밖의 본문을 수동으로 읽었다고 확대하지 않는다. 이 결과는 source production이며 **main·Pages·정확한 published 자산·실제 게시 대표 화면은 선행 새4A 및 PR57 공개 뒤 별도 게이트**로 남아 있다.


## 실제 main·Pages·게시 게이트 완료 — 2026-10-20

main `358c59bb17f121889afe66fcf06f6bfad770b666`, tree `c2a9066158300ea67b72f85b65179f46ec0a5f43`의 [Actions 39414373357](https://github.com/Middleages/my-books/actions/runs/39414373357)에서 전체 **1259/1259 단위 검사·472 modules build**, 선택 6종 production **849검사·851원본 PNG**, Pages 배포(11:28:22 UTC), 선택 6종 published **854검사·851원본 PNG**가 모두 성공했다. 합계 **1703검사·1702원본 PNG**다. 보험·투자·세금·DB·쿠버네티스·주거 6종은 이 파동에서 생략했으며 통과로 세지 않는다. 선택된 검사 자체의 범위와 단언은 줄이지 않았다.

모든 12 ZIP의 GitHub SHA-256 digest를 다운로드 바이트와 대조했고, 각 report의 정확한 source·tree·clean·결과 및 scope의 선택 6/생략 6을 확인했다. 실제 게시 JS `index-DKODbtgK.js` 3,429,586 bytes·SHA256 `7e0931a3924a4aed1d16974f2889349cc9fc17ad24857603fc602d7802f6c6a7`, CSS `index-QmcLr7Yc.css` 404,022 bytes·SHA256 `c790afef6f9b247780d4b02ae98ad173da299a9dbba989487ddf0979304c1122`의 전체 바이트·해시가 빌드와 일치한다. PR63의 검증 앱과도 동일하다.

앱/page/console/resource 실패는 0이다. 홈을 제외한 게시 5종의 정확한 호스트 루트 `https://middleages.github.io/favicon.ico` 404 각 한 건은 별도 진단으로 보존했다. 이 비앱 진단까지 0이라고 쓰지 않으며, 다른 출처·상태·앱 자산 오류는 계속 실패 조건이다.

| suite | 게시 검사 | 원본 PNG | artifact | ZIP SHA256 |
| --- | --- | --- | --- | --- |
| accounting | 252 | 229 | 12262026224 | `05df24721c8e5d79a9c9df2e7e6e8f99970c44e081c55eaee062ca9d7c3ec658` |
| authentication | 20 | 105 | 12262000465 | `23e766cec055b91f19aa6a003cf05060a97a78733295da2cace55ac3295b3dff` |
| probability | 463 | 123 | 12261636683 | `5d7b435ed41eadfcf931ac283fd0c3a8fa5e72074da0079866a551190ebf0828` |
| observability | 27 | 102 | 12261081827 | `5b021233b93d3d37ec27d78b7d139f8cb9691f25e73f8af55ede83fca4de9183` |
| book-volumes | 14 | 51 | 12260932081 | `bb218f32811ed1e5bc62584fcd4ee8d39474eadb5bfc93ad1897926acbb309e0` |
| child-development | 78 | 241 | 12260644957 | `db8badc16644752b94665053844fd9576baf510f7ccfbdb7f99c8c59dd2a4a41` |

### 실제 게시 원본 직접 검토

- 회계 D07–08: `1440-equipment-24-0-M1-step-2.png, 320-equipment-48-24-M3-step-52.png, 1440-financing-loan-step-1.png, 320-financing-settlement-step-3.png`. 통합 담당자가 네 원본 전체를 직접 열었다. 취득 현금 650→410의 한 번 지급과 현금 없는 M1 상각 10, 48개월 누계 216+잔존 24=취득원가 240, M1/M2 배분 0, 차입 50의 매출·이익 0, 최종 현금 225와 자산 795=부채 390+자본 405를 확인했다. 모바일 방향·라벨·인접 제어가 유지되고 이전 컨테이너 배경 충돌은 재발하지 않았다.
- 확률 C05–06: `320-sampling-biased.png, 320-sampling-copied.png, 320-interval-summary-sigma20.png, 320-interval-summary-sigma0.png, 320-interval-zero-events.png, 320-interval-controls.png, 320-sampling-controls.png`. 작성자가 요청한 320px 원본 7개를 직접 재검토했다. 분모와 적용하지 않음, CI/PI 공통 축, σ0 점, 관측0의 조건부 상한, 인접 제어가 명료했고 선택 범위에서 차단점을 찾지 못했다. source·tree·clean 및 463/463, 앱 오류0과 별도 favicon404 한 건, PR63과 일치하는 JS/CSS 해시도 확인했다.
- 관측 C05–06: `1440-traces-parallel.png, 320-traces-missing.png, 390-traces-propagation.png`. 작성자가 세 원본의 핵심 도식을 직접 열었고 모바일은 원본 픽셀 y1800–3600 구간도 분할 확인했다. 공통 0–300ms 축, 병렬 200≠250, 미관측≠0과 별도 T-B 루트가 명확하며 선택 범위에서 잘림·겹침·색 의미 회귀가 없다.
- 인증 B03–04: `320-boundaries-blocked.png, 390-boundaries-preflight.png, 390-tokens-expired.png`. 작성자가 세 원본의 핵심 도식과 모바일 원본 픽셀 y1800–3600 구간을 직접 확인했다. 전송·처리·읽기의 구별, preflight 뒤 실제 POST 미전송, now=exp 거절과 인접 제어를 확인했으며 선택 범위에 새 시각 회귀가 없다.
- 육아 발달 C05–06: `320-communication-gesture-redirect.png, 1440-communication-sound-follow.png, 320-interaction-break-2.png, 390-interaction-unclear-2.png`. 작성자가 네 원본을 직접 재검토했다. 관심선의 아이→공/보호자→책 구별, 보호자 신호 방향, 쉬기 기호와 놀이 중단, 미확정 뜻을 모름으로 남기는 경계가 유지된다. 모바일 글자·제어 잘림과 겹침을 찾지 못했다.
- 홈 3원본: `1440-home.png` 전체, `320-home.png` 및 `390-reading-first.png`의 native 상단 0–2000px. 15권·135장과 회계 8·확률 6·관측 6·발달 6·인증 4 분모, 고정 권차와 읽는 책 우선 정렬을 확인했다. 320px hero의 마지막 한 글자 줄바꿈은 기존의 경미한 미관 한계다.

이 **24개 고유 게시 원본**의 명시한 범위에서 새 차단점을 찾지 못했다. 851개 전체·모든 표행·실제 기기/스크린리더·개인 금융/의료 판단·실제 인증 시스템 검증을 뜻하지 않는다. 원본은 보존했고 검토용 native crop은 원본 PNG 수에 더하지 않았다. main은 게시 검사와 직접 확인 동안 위 SHA로 고정됐다.

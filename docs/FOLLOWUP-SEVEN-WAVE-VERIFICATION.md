# 일곱 후속 배치와 월령 장면 연결: 통합 검증

2026-10-20. 직전8배치의 정확한 main5b257ffc가 실제 게시 게이트를 진행하는 동안 준비한 별도 후보다. 선행 배치 게시 완료 전에 이 후보를 main/Pages로 공개하지 않는다. 이 문서 첫 작성 단계는 로컬 통합·단위·빌드 완료였으며, 후속 source 검증은 아래 절에 구분한다. main·Pages·published와 회계 전체권 넓은 회귀는 아직 별도 게이트다.

## 범위와 보존

- 회계 F11–12: 검증된 source c728b03, 최종 기록 eddad12. 앞선 E까지의 실제 게시 이후 공개한다.
- 확률 E09–10: bd2140ff 및 전용 최종 문서 패치. D 이후 순서다.
- 관측 E09–10: d3c459c1 및 최종 기록07746ff. 자기 카탈로그 공개 범위10장 보정을 보존한다.
- 인증 D07–08:6b30db50 및 최종 기록1f6ac0d. 이미 구현한08장과 자기 공개 범위 문구를 일치시켰다.
- 발달 E09–10: 수정된 d9e2a40 계열과 PR83 source2649a820/최종4772d0d의08–10 구체 행동 예시 연결을 포함한다. 이미 게시된 소개·02의50장면 탐색과 같은 모델 파일을 읽는다. 책의 다섯 읽기 태그와 CDC 원출처 영역은 별도로 표시한다.
- 수면 C05–06:8fe1d20a/최종5aea0bda. 기존 안전 실천 문장 두 개를 보존한다.
- 먹기 C05–06:14ab364e/최종2fbdb017. 섭취 미확인·알레르기 진단 경계와 응급 안내를 보존한다.

카탈로그17권169장이다. 대상7권 외 모든 책의 본문·컴포넌트·모델·전용 검증기와 공통 workflow/package/표지/분류기 바이트를 직전 통합 기준과 대조했다. 여섯 대상 책은 인계된 검증 소스와 동일하며, 발달은 PR83의08–10 소스에 앞서 게시한 소개·02 탐색과 두 검증 시나리오를 합쳤다. 각 실제 장 번호·readId와 알 수 없는 기존 읽음 ID 보존 검사를 유지한다. 다른 책의 카탈로그 문구를 넓게 치환하지 않는다.

## 로컬 통합 확인

전체1390/1390 단위 테스트와 TypeScript/Vite560 modules build가 성공했다. 로컬은 테스트 동시성4와 NODE2048 한 회로 실행했으며, 브라우저 실행은 이 결과에 포함하지 않는다. git diff whitespace와 비대상 source/catalog partition·기존14 suite 합집합 보존을 확인했다. 예상 선택은 권차 및7대상 책의8종, 생략6종은 보험·투자·세금·DB·K8s·주거다. 생략은 성공이 아니다.

직전 실제 main의 앱과 섞어 검증했다고 주장하지 않으며, 이 새로운 합본 tree의 production·원본 직접 검토가 다음 게이트다. 특히 새08–10 월령 카드의 구체 예시·책 태그·원출처 영역, 이전 소개·02의 탐색과 요청/관심 공유 차이를 함께 재검토한다. 회계 전체권의 최종 넓은 회귀는 최신 등록14 suite와 같은 단일 build의 production/published를 안정된 최종 main에서 별도로 수행한다. 실제 DB·SSO·의학/영양 전문가 감수·실기기·스크린리더 음성은 미실행이다.


## PR84 실제 production 결과 — 2026-10-20

[PR84](https://github.com/Middleages/my-books/pull/84) head `0c1834348b7ae188c5b1cd0db9ea1ea070dd22b4`, actual checkout `3e6706f96732d21eaeb290cdd80776a5f23bcf2f`, tree `118b3e99ba127c7bfb026ae9f7fa978a40f993be`의 [run39426457857](https://github.com/Middleages/my-books/actions/runs/39426457857)에서 전체1390/1390 단위·560 modules build와 선택8종 production **1446검사·1866원본 PNG**가 성공했다. source는 clean이며 앱/page/console/resource와 별도 호스트 진단은0이다. 보험·투자·세금·DB·K8s·주거6종은 이 변경 영향 실행에서 생략했고 성공으로 세지 않는다. PR의 deploy/published는 skipped다.

모든 ZIP의 GitHub SHA256 digest, scope의 정확한 checkout/tree·선택/생략 집합, 단일 Pages build artifact12266890267을 대조했다. JS `index-BKIwsubM.js`3964984 bytes·SHA256 `252a31cf4e602b6dc059c91d68dc095495d55acef130d9f2b72134ad8a0d2a22`, CSS `index-uje8qbF8.css`454418 bytes·SHA256 `7f6273588e2633cde871a18cdf2cada473b516bba25e07f2a489c391a5d8e210`의 전체 바이트가 최종 로컬 build와 일치했다.

| suite | 검사 | 원본 PNG | artifact | ZIP SHA256 |
| --- | --- | --- | --- | --- |
| probability | 595 | 259 | 12267145780 | `0e11bdf1fa01a39920bd02cf7e0a799bdf2db428d69d0b9371129ac327c4d8d6` |
| observability | 42 | 195 | 12266850672 | `f915279e3f3b727401bcb51ecefd6b1bf2a9586e0f470a6d73c28e419d55d9cd` |
| child-sleep | 66 | 137 | 12266566061 | `ada53eee3bc3b8c728dd3b960bb5da17961f5c7e519636d23725fc84d9dba5db` |
| book-volumes | 14 | 57 | 12266416771 | `c4c942325090d52b726e5fd65e09b64561b028cf9c1a5f5e45438fe2711775af` |
| authentication | 35 | 186 | 12266252218 | `f180639a2e251681e735535a63d07e2250890163503cd24f85b085761f876f6f` |
| child-feeding | 58 | 133 | 12266147083 | `8d3cf97e9b19322b16ad3a9e434e381a9989a9e435f689d9bdc93b09bb2d1525` |
| accounting | 509 | 413 | 12266073671 | `8ac70f684570285221c826204423c75f4489a38e7692ddacd528088185d5b038` |
| child-development | 127 | 486 | 12265793246 | `6306fc42df4dd023e338751e4f940c7d83f0cccb3b89b438f8827a4c607b5455` |

### 새로운 합본의 대표 원본 직접 검토 완료

- 발달9:320-first-year-card-6-body/hands,320-second-year-card-15-language/18-social,320-third-year-card-36-body/hands,320-intro-age-entry,1440-first-year-2-all,1440-third-year-30-all. 통합 담당자가 모두 직접 열었다. 책의 다섯 범주와 CDC 원출처 영역 병기,15개월 요청/18개월 관심 공유, 깨어서 지켜보는 바닥 놀이의 뒤집기와 수면자세 변경 금지, 포크 경험과 실제 섭취/곁에서의 안전 관찰을 구별한다. 모든 영역의 다섯 구체 장면, 실제 근거 시점 간격과 비보간/비채점 안내가 읽힌다. intro 이미지는 두 선택 제어만이며 소개 전체 검토로 확대하지 않는다.
- 관측4:320-dashboard-no-correlation,390-dashboard-missing,320-alerts-missed-spike의 native y1700–3700 및1440-alerts-no-data 전체. 누락≠0, 연결 없음, 평가 사이 spike를 놓침≠영향 없음, 관찰·평가·연속 조건의 차이와 인접 제어를 직접 확인했다.
- 인증3:320-rbac-stale,390-rbac-owner-denied native y1700–3700와1440-sso-logoutA 전체. 역할/조직/소유권 독립 검사, 과거 claim을 따른 반례와 현재 판정, A 로컬 로그아웃과 IdP/B 세션의 별개 경계를 직접 확인했다.
- 회계8:1440-ratios-no-collection-loan40-composition,320-ratios-base-loan280-margin,1440-cvp-price5-quantity46,320-cvp-price3-quantity45,1440-documents-missing-cost-connection-final,320-documents-missing-cost-cost-final,1440-documents-base-dividend-final,320-documents-mixed-cost-final. 작성자가 직접 열어 같은565/150과현금225/65, 만기280의390분모·마진160=90+70과 수정 이자 설명,46개230−228=2와 작고 분리된 표식, 단가3 평행선/−90, 원가 누락의 등식1035와 수불240/60 충돌, 배당 근거 부족·범위 혼합 중지를 확인했다.
- 확률6:320-selection-comparison-unknown,320-selection-flow,320-selection-controls,390-validation-locked,320-validation-reused,320-validation-static-end. 작성자가 전체10개 미상≠0와 존속8개3.75%,10=8+2, 잠긴 보류값과 공개 후 새 독립 검증 아님, 인접 모바일 제어 및 정적표 끝의 보류12/원자료 열을 직접 확인했다.
- 수면4:320-naps-estimates,320-naps-static,390-routine-relay,1440-routine-reordered. 후속 담당자가 직접 열어 확인70/50분과 추정 빗금·기록없음≠0, 동일08–20축, 안전공간·필요수유·불편돌봄의 고정 경계 및 인접 제어를 확인했다.
- 먹기5:320-variety-offered-day4,390-variety-confirmed-day1,1440-variety-highlight,320-allergy-uncertain,390-allergy-mixed. 후속 담당자가 직접 열어 메모/기록없음과 섭취 미확인 구별, 식품군 행 정렬,119 안내 우선과 원인·확진·자가 재도전 산출 없음 경계를 확인했다.
- 홈3:1440-home 전체와320/390-home native y0–2000. 통합 담당자가17권169장과 고정 분야 권차·정확한 장수 분모를 확인했다.320 hero 마지막 한 음절 줄바꿈은 기존 경미한 미관 한계다.

총42개 고유 원본의 위 범위를 직접 확인해 새 의미·잘림·겹침 차단점을 발견하지 않았다.1866개 원본 전수 사람 검토·모든 표행 확인·실기기·스크린리더 음성·실제 DB/SSO·임상 감수라는 뜻은 아니다. native crop은 원본 수에 더하지 않았다. 검증 뒤 추가된 직전 main5b 게시 마감과 이 결과 기록은 문서 전용이며 검증 앱/모델/전용 검증기/테스트/workflow/package 바이트는 그대로다.

선행 main5b의 여덟 배치는 실제 게시/직접 검토를 완료했다. 이 후보는 이제 exact-main 영향8종 production→Pages→동일 산출물8종 published로 이어간다. 회계F는 그 게이트 후에도 **게시 확인 완료·전체권 마감 회귀 대기**로 구분한다. 이어지는 준비된 기존 교재 후속 파동까지 순차 게시한 뒤, 새 책 등록 전 안정된 동일 main의 최신14종 전체 production/published를 한 번 묶어 회계와 함께 최종권 마감을 검증한다. 최종 넓은 회귀를 삭제한 것이 아니며 미실행 상태를 성공으로 기록하지 않는다.


## Exact-main·Pages·published 최종 결과 — 2026-10-20

main `d6237bc2449e0c77894cdabe4f7fab75e6143468`, tree `46848403199c145abfc1d47a1370927a5cd24a1f`의 [run39431780917](https://github.com/Middleages/my-books/actions/runs/39431780917)에서 전체1390/1390 단위·560 modules build와 선택8종 production **1446검사·1866원본 PNG**, Pages 배포(13:45:28 UTC), 선택8종 published **1453검사·1866원본 PNG**가 모두 성공했다. 총18개 job이 성공이며 양환경 합계2899검사·3732원본이다. 보험·투자·세금·DB·K8s·주거6종은 이번 영향 실행에서 생략했으며 통과로 세지 않는다. 공개 범위는17권169장으로 이전 장수/권차/readId를 보존한다.

GitHub ZIP SHA256, scope의 정확한 source/tree·선택/생략 집합, source clean, 단일 Pages build artifact12267733700를 대조했다. 모든 앱/page/console/resource 오류는0이며 published7책의 호스트 기본 favicon404 각1건만 원래 URL과 함께 별도로 보존했다(홈0). `index-BKIwsubM.js`3964984bytes·SHA256 `252a31cf4e602b6dc059c91d68dc095495d55acef130d9f2b72134ad8a0d2a22`, `index-uje8qbF8.css`454418bytes·SHA256 `7f6273588e2633cde871a18cdf2cada473b516bba25e07f2a489c391a5d8e210` 전체 바이트가 main build/PR84 검증/실제 게시에서 일치한다. 게시 확인 전후 실제 main이 이 SHA로 고정됐음을 다시 읽었다.

| suite | production / published 검사 | 각 원본 PNG | published artifact | ZIP SHA256 |
| --- | --- | --- | --- | --- |
| book-volumes | 14 / 14 | 57 | 12269331529 | `1947bf5adb3c36461d2ab20cda7ba5bd6076586d126a58cf2fcccdc31554e5bc` |
| accounting | 509 / 510 | 413 | 12269182600 | `f3d859046409eb087e23502deb2c53cdf9ee0b8b995a8c83f6c018513f11eeb0` |
| probability | 595 / 596 | 259 | 12269202592 | `d3940dd97d4bb3ae43d8ad7905d0b6f779f12ee748a539c1c65a7c03b09822ef` |
| observability | 42 / 43 | 195 | 12269006959 | `3cd71dc822975e6cefd2bf1a8220139d9bcabdd127535eb704b7d746b19466e2` |
| child-development | 127 / 128 | 486 | 12269950134 | `97773cfee2dd3ad875ccfa92b06b5c8774be956cf8270cde4ee3f20e800e4e96` |
| authentication | 35 / 36 | 186 | 12269011963 | `25a9ab02b2d25d54c4b1aa51e30255bd16beb0cdc617a140475f858abc9b23bd` |
| child-sleep | 66 / 67 | 137 | 12268991953 | `3bbd06d223a1abe18a705cacc2141f635ca3b3cb41f291354f4cda140cdcb687` |
| child-feeding | 58 / 59 | 133 | 12269416063 | `432ebc4aed5b6951aeca6889b7d03a660f62bb66d9388cc9b2bc208704a7a7d7` |

새 실제 게시 PNG에서도 앞 절과 같은 대표42개 범위를 직접 다시 열었다. 통합 담당자는 발달9·관측4·인증3·홈3 및 먹기5, 회계 작성자는8, 확률 작성자는6, 수면 후속 담당자는4개를 확인했다. 모바일은 명시한 native 범위만, 소개 탐색은 두 선택 제어만, 홈1440은 전체/320·390은 상단0–2000px 범위다. 책 태그/원출처 영역과 구체 행동 예시, 관측 누락/평가, 인가/세션 경계, 회계/확률 계산·판단, 수면 고정 돌봄과 먹기119 우선/진단 불가가 보존됐고 새 차단점을 발견하지 않았다.320px 홈 hero 및 일부 먹기 단어의 기존 줄바꿈은 읽을 수 있는 경미한 편집 한계이며 내용 잘림은 아니다.3732원본 전수 사람 검토나 임상/외부 서비스 운영 검증으로 확대하지 않는다.

이 일곱 배치의 실제 공개 게이트는 완료했다. 회계는 **소개+12장 게시 확인 완료·전체권 마감 회귀 대기**로 구분한다. 다음 준비된 기존 교재7배치와 검증 완료된 DB G를 포함하는 안정된 최종 합본에서 실제 등록14종 production+published가 모두 실행되고 동일 source·단일 build·전후 main 고정·직접 원본 조건을 충족하면 그 실행으로 여러 완결권의 넓은 회귀를 함께 마감한다. 그 전까지 새 육아4–6 등록을 섞지 않으며, 아직 실행하지 않은 최종 결과를 완료로 쓰지 않는다. 실제 DB/SSO/관측 제품 스택·임상 감수·실기기·스크린리더 음성은 미실행이다.

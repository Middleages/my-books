# 월령 예시 보강 후속:08–10 연결

2026-10-20. E의 원래 마감d9e2a40 기반 별도 수정이다. 공개 소개/02 우선 패치 PR80과 분리하여08–10을 먼저 공개하지 않는다. 이 후속을 최신 main에 통합할 때 PR80의 소개/02 진입과 모델·검증을 반드시 보존한다. 이 로컬 E 기반 트리에는 최신 다른 책이 없으므로 카탈로그 전체나 소개/02를 덮어쓰는 원본으로 사용하지 않는다.

PR80 최종0cae080의 age-scenes.mjs/d.mts를 바이트 그대로 재사용한다. 새 임의 기준이나 행동은 추가하지 않는다. 기존08–10 age-examples는 같은50개 장면의 어댑터가 되고, 각 원출처 시점에서 몸·손·말·인지놀이·관계 다섯 태그와 원출처 실제 영역, 일상 장면·관찰 포인트를 제공한다. ‘소수 예만’ 때문에 생긴 빈 영역을 없앤다.12/24개월 경계는 같은 원문과 장면이며 중복 채점하지 않는다.

08의 빈 발췌 질문을 책 태그와 CDC 영역의 차이 질문으로 바꾸고,09의15개월 요청과18개월 관심 공유 목적 차이를 구체적으로 설명하며,10의 소수 발췌/빈 목록 전제를 정리한다. 원문 대량 복제·진단·선별 응답 입력·개인 아이 자료·능력 보간·행동 훈련 처방은 없다. 정확성 독립 검토는 PR80의 동일50장면에 수행됐고 임상 감수는 아니다.

새/기존 관련 모델4/4 및 브라우저 스크립트 문법·diff 공백 검사 통과. 전체 단위/build·정상 PR CI·08–10 실제 원본 직접 검토는 아직 대기다. 우선 패치의 화면 검증을 이 후속의 화면 성공으로 대체하지 않는다.

로컬 후속: 전체1053/1053 unit와 NODE2048 제한 build1회가 exit0으로 통과했다. 기존 큰 청크 경고는 보존했다. 카탈로그·소개·02와 다른 책 변경0. 공유 모델 SHA256: age-scenes.mjs 7bf765debb4c295de4914e3f05c2ed4fde873fcb89a5cf386f6f1721f509f9b4, d.mts b437805380143d3989b1677795cc9780b7f5a5d438fad95c6c497a3f299322ad. [PR80](https://github.com/Middleages/my-books/pull/80)의 원본과 같다. 정상 후속 PR·실제08–10 화면은 아직 대기다.

최초 PR83/run39422211704 build+선택2종 production 성공: actual875a68690d8bc62df737cc461a770161298688ed/tree6980d60590101e0b516332847820230cbee0fd4e/clean,117검사401PNG·진단0. artifact12264222004 ZIPc4051b310ded65dbf63a918d9ee3dc83d6a69f53894edba9b6629b4d47a41f48. 직접320-first-year-6-all,1440-first-year-2-all 원본에서 ‘모든 영역’ 카드에 책 태그가 보이지 않고 원출처 영역만 보이는 표현상의 부족을 발견했다. 각 카드에 책의 몸/손/말/놀이/관계 태그를 추가하고 일상 장면은 그대로 유지한다. 자동 텍스트 대조와 모바일 단독 카드 원본도 추가하며 보완 뒤 실제 화면 게이트는 대기다. 이 보완은 PR80의 소개/02에 영향을 주지 않는다.

## 최종 보완 검증 마감 (2026-10-20 12:43 UTC)

위의 ‘대기’는 당시 상태이며 아래 새 소스의 검증으로 대체한다. 소스 2649a820a548691f88220dfd12a59c446eb8abb9, 원격 2bc568132c3adc22a5d45972425c6341b3ce49ca, 동일 tree35421b010fa2e33e810654a6b6fbead9d00cd092. [PR83](https://github.com/Middleages/my-books/pull/83)의 [run39423084185](https://github.com/Middleages/my-books/actions/runs/39423084185)는 전체 unit/build와 선택한 book-volumes·child-development production 모두 성공했다. 다른 suite 전체 회귀나 main/Pages 게시 성공을 뜻하지 않는다.

실제 checkout8f47015e8b755607e9c48780ed72a94851220a88/tree35421b010fa2e33e810654a6b6fbead9d00cd092/clean. 발달117/117검사·431PNG, page/console/resource/host 진단 각0. artifact12264412332, ZIP SHA256 20de1f77001d2e29ff7a8491f42314af7f684b02bbeacdde87efdcf22e056bcb 확인.

직접 연 원본8개: 320-first-year-card-6-body, 320-first-year-card-6-hands, 320-second-year-card-15-language, 390-second-year-card-18-social, 320-third-year-card-36-body, 320-third-year-card-36-hands, 1440-first-year-2-all, 1440-third-year-30-all. 새 책 태그·원출처 영역이 함께 읽히며, 모바일 줄바꿈/잘림 문제 없음. 6개월 손 뻗기에는 원출처 인지 영역을 그대로 표시했고, 깨어 있는 바닥 놀이와 수면 자세 변경을 구분했다. 15개월 요청과18개월 관심 공유 목적, 36개월 일부 옷 스스로 입기·포크 사용, 2/30개월 전체 다섯 장면과 관찰 포인트를 확인했다.431개 전체를 사람이 직접 봤다는 뜻은 아니다.

게시 인계: PR80 최소 소개/02 패치 우선, PR82에서 그 패치와 D 보존, 그 뒤 E에 이 연결 보강을 통합한다. 이 오래된 E 기반 전체 트리로 최신 카탈로그나 다른 책을 덮어쓰지 않는다. 통합 후 새 정확 소스 검증 및 main/Pages/live 게이트는 게시 담당의 별도 작업이다.


## 연결 보강 실제 게시

2026-10-20 main `d6237bc2449e0c77894cdabe4f7fab75e6143468`/Pages에서 소개·02의 기존50장면 모델과08–10의 풍부한 예시 연결이 같은 소스로 게시됐다. 실제 published128/128·486PNG, 대표9개 범위 직접 검토와 정확 자산 대조를 닫았다. 자세한 source/tree/run/ZIP과 범위는 [E 게시 기록](CHILD-DEVELOPMENT-BATCH-E-VERIFICATION.md) 및 [합본 결과](FOLLOWUP-SEVEN-WAVE-VERIFICATION.md)를 따른다. 여전히 매달 진단 기준이나 원출처 전체 목록을 제공한다는 뜻은 아니며, 실제10시점의50개 자체 일상 장면과 원출처 분류를 구별한다.

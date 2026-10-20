# 육아·발달 C 05–06 구현 및 검증

2026-10-20. B source/실제 화면 게이트 완료 후 로컬 `2737ac3`에서 별도 작업트리로 시작했다. A→B→C 게시 순서와 최신 main의 병행 작업을 보존하며 main/Pages에 직접 쓰지 않는다.

## 장면 계약
- 05: 아이·보호자는 서로 다른 색/위치의 인물, 관심 대상은 공·책 형태, 관심 연결은 점선, 기록된 신호 방향은 화살표다. 같은 몸짓에서 보호자가 같은 공을 보는 경우와 다른 책을 제시하는 경우의 선 종점이 바뀐다. 말소리·몸짓·미관찰은 별개 통로이고 다음 반응이 기록되지 않았다는 사실은 항상 보존한다. 기다림이 언어를 반드시 끌어낸다고 예측하지 않는다.
- 06: 주고받는 신호는 화살표가 아이→보호자→아이로 방향을 바꾼다. 쉬어 갈 신호에는 다음 단계에서 일시정지 기호가 나타나고 자극을 이어 가지 않는다. 뜻이 불분명한 신호에서는 응답 소리를 만들어내지 않는다. 세 장면의 전체 문장은 정적 비교로 항상 읽을 수 있다.
- 단어 수·눈맞춤 시간·양육 점수·진단·실제 아이 기록은 없다. 자동재생 없이 버튼·키보드·초기화·정적 정보로 같은 관계를 제공한다. 원출처 연령을 전 연령 정상 기준으로 확대하지 않는다.

## 근거
2026-10-20 CDC 영아 보호자 안내, CDC 2개월 신호·응답 안내, AAP·ASHA 다언어 문답 원문 확인. 링크와 적용 한계는 각 장에 있다. AAP·ASHA 문답은 2025-11-20 업데이트이며 다언어 사용 자체가 장애 원인이라는 주장을 배제하는 근거로만 사용한다. 원문의 단어 수·미국 평가 서비스는 한국 기준으로 재사용하지 않는다. 임상 감수·K-DST 현행판/재사용 확인은 여전히 미완료다.

## 검증 상태
실행 전 계획: 로컬 전체 unit/build 및 정상 draft PR CI를 준비한다. A/B 회귀를 보존하며 모든 통로×반응×단계, 관심선·신호 방향, 휴식/모름 상태, 정적 정보·키보드·초기화, 5개 폭 원본 PNG를 검사한다. 실행 전에는 통과로 표시하지 않는다. 실제 게시 및 exact-live는 별도 직렬 게이트다.

## 완료 결과
- 로컬 전체 unit 1,048개 통과, production build 통과. 소스 커밋 `026ff59`, 트리 `b22c0d168d56727059e98135b89487ca19afe2b0`.
- Draft PR #43은 B 브랜치를 기반으로 하며 원격 소스 `26f16d287dbb34c43172223075a4ed3840f68b42`의 트리가 위 로컬 트리와 같다.
- 정상 CI https://github.com/Middleages/my-books/actions/runs/39394524551 에서 build와 영향 범위 book-volumes/child-development production 브라우저 성공. 다른 7개 suite는 영향 범위 밖으로 미실행이다. PR이므로 배포와 published 검사는 skipped이며 게시 성공으로 해석하지 않는다.
- 브라우저 보고서: merge SHA `8b707bd8d108a81dcf8b514982bff41e5d3bdafd`, 동일 sourceTree, 77개 통과/실패 0, 241 PNG, page/console/resource 오류 0. Artifact `12251705837`.
- 원본 PNG 직접 검토: 320 communication gesture-follow/quiet-follow, 390 gesture-redirect, 390 interaction break 0→1, 1440 engage 1, 320 unclear 2. 작은 화면에서도 제어·본문·그림이 잘리지 않으며 동일 대상/다른 대상의 점선 종점, 신호 방향, 일시정지, 모름 상태가 구별된다.
- source/실제 화면 게이트 완료. 임상 감수와 K-DST 원문 재사용 확인, main 통합·Pages·exact-live는 별개 미완료 상태다.


## 최신 합본의 실제 게시 완료 — 2026-10-20

main `358c59bb17f121889afe66fcf06f6bfad770b666` / tree `c2a9066158300ea67b72f85b65179f46ec0a5f43`, [run 39414373357](https://github.com/Middleages/my-books/actions/runs/39414373357)의 전체 1259 단위·build, 선택 6종 production→Pages→published가 성공했다. 이 책의 실제 게시 **78/78 검사·241원본 PNG**, 앱 오류 0이다. 정확한 host-root favicon 404 한 건만 별도 진단으로 보존했다. artifact 12260644957 ZIP SHA256 `db8badc16644752b94665053844fd9576baf510f7ccfbdb7f99c8c59dd2a4a41` 일치. 실제 JS/CSS 전체 바이트·해시는 [합본 게시 기록](FOLLOWUP-SECOND-FIVE-WAVE-VERIFICATION.md)의 정확한 main 빌드와 같고 source 변경은 없다.

직접 연 게시 원본: `320-communication-gesture-redirect.png, 1440-communication-sound-follow.png, 320-interaction-break-2.png, 390-interaction-unclear-2.png`. 작성자가 네 원본을 직접 재검토했다. 관심선의 아이→공/보호자→책 구별, 보호자 신호 방향, 쉬기 기호와 놀이 중단, 미확정 뜻을 모름으로 남기는 경계가 유지된다. 모바일 글자·제어 잘림과 겹침을 찾지 못했다. 검토한 범위에 새 의미·잘림·겹침 차단점을 찾지 못했다. 모든 241개를 사람이 읽었거나 실기기·스크린리더·실제 금융/시스템/임상 검증을 했다는 의미는 아니다. 앞선 미게시 상태는 작성 당시 기록이며 이 절이 해당 배치의 main/Pages 완료 상태다. 후속 배치는 별도 검증과 순차 게시를 유지한다.

# 육아·발달 B 03–04 구현 및 검증

2026-10-20. A의 로컬 최종 기록 커밋 `a288e90`에서 별도 작업트리로 시작했다. 최신 원격 main `d76ed55e`의 병행 세금·주거 변경은 건드리지 않는다. A production 9-suite 및 원본 화면 게이트는 닫혔지만 A/B main·Pages 게시는 아직 대기다.

## 구현과 설명 설계
- 03 `observe-not-label`: 독자는 관찰 행동과 맥락의 차이를 발견한다. 손·물체·닫힌 상자·정보 없는 점선 장면·보호자의 보라색 팔을 다른 형태로 표현한다. 상황·기회·행동·도움 네 항목은 같은 모델에서 단계적으로 펼친다. 관찰하지 못함/기회 없음/모름을 구분하며 도움받아 잡기를 독립적 손 뻗기로 바꾸지 않는다.
- 04 `movement-and-hands`: 독자는 손과 물체의 접촉·분리, 몸의 방향 변화가 다른 관찰임을 본다. 손·물체 좌표와 몸 회전은 모델을 읽는다. 손 뻗기의 이동은 고정하고 물체 위치만 바꿔 이번 그림에서 닿음/닿지 않음의 맥락을 설명한다. 거리·크기는 실제 단위·능력 범위가 아니다.
- 네 움직임은 독립된 합성 사례로, 특정 연령의 발달 순서·필수 과제·검사표가 아니다. 장난감 추천·자세 훈련·재활 처방·실제 아이 입력은 없다. 정적 장면 비교이므로 자동재생·타이머 없이 버튼, 단계 이동, 초기화, 전체 기록/전후 읽기를 제공한다.
- 기존 A 및 다른 책의 readId·권차를 보존한다. 01–04 순서로 목차에 등록하며 책 소개 공개 범위만 확장한다.

## 공식 근거
2026-10-20 원문 확인:
- CDC [관찰·선별](https://www.cdc.gov/act-early/about/developmental-monitoring-and-screening.html): 우려를 공유하는 일상 관찰 역할.
- CDC [4개월 자료](https://www.cdc.gov/act-early/milestones/4-months.html), 2026-05-15: 안전한 물체 탐색과 진료에 공유할 맥락. 월령별 체크 항목을 새 검사로 복제하지 않는다.
- CDC [영아 0–1세 보호자 안내](https://www.cdc.gov/child-development/positive-parenting-tips/infants.html), 2026-02-20: 깨어 편안할 때 놀이, 피로·보챔을 보고 휴식, 삼킬 수 있는 작은 물체 피하기. 원문의 적용 연령을 보존하며 36개월까지의 진단 규칙으로 확대하지 않는다.
- AAP [안전한 장난감 고르기](https://www.healthychildren.org/English/safety-prevention/at-home/Pages/How-to-Buy-Safe-Toys.aspx), 2024-12-19 업데이트: 연령·경고·설명서, 작은 부품·전지·자석, 파손 안전. 미국 인증을 한국 인증으로 바꾸어 쓰지 않는다.
K-DST 현행판·라이선스·임상 감수 미확인 상태는 변함없다. 장별 출처와 한계를 공개했다.

## 검증 상태
- 초기 준비 상태 기록: 로컬 전체 unit/build 진행 중이었으며 최종 결과는 아래 실행 완료 절을 따른다. 모델은 5개 기록 사례×4단계의 네 상태·도움 보존, 4개 움직임×2위치×2단계의 좌표·조건, 잘못된 입력·초기화 결정성을 검사한다.
- 기존 육아 suite를 확장해 A를 보존하고 B 모든 기록 사례/움직임의 모델·DOM 좌표, 정적 대안·키보드·초기화·5개 폭·원본 PNG를 검사하도록 준비했다.
- 초기 준비 시점에는 브라우저 실행·원본 PNG 직접 검토 미완료였으며 최종 결과는 아래에 별도 기록했다. 로컬 제한을 우회하지 않고 정상 draft PR CI를 사용한다.
- 게시 상태: 별도 직렬 창 대기. A 게시 전 B main 공개 금지, PR 검사와 실제 게시를 구분한다.

## 실행 완료 및 원본 검토

Draft [PR #41](https://github.com/Middleages/my-books/pull/41)는 검증된 A 브랜치를 base로 한다. 원격 head `c9650d6af9c36372816e899a252cdbefe35af344`, CI merge `c9bd3d5c9a9ba99ae08e400ad3572c4e79a19714`, tree `45f7122cae2c00de818c9d21b9df25dfff5c4ae8`는 로컬 소스 `a95564f`의 tree와 같다.

[CI run 39393346374](https://github.com/Middleages/my-books/actions/runs/39393346374)에서 lockfile 설치·unit/build와 affected 2-suite(육아, book-volumes)가 모두 success다. 육아는 A 회귀를 포함해 57개 통과/실패 0, PNG 156개, page/console/resource 오류 0. 다른 7개 suite는 이 B 차이의 영향 범위에서 의도적으로 미실행이며 통과라고 주장하지 않는다. A의 첫 카테고리 9-suite 결과는 별도 기록이다. 로컬 전체 unit 1045개와 build도 통과했다. `git diff --check`, verifier 구문 검사 통과.

직접 연 원본 PNG(확장자 .png): `320-record-no-chance`, `390-record-assisted`, `1440-record-unknown`, `320-movement-reach-far-1`, `390-movement-grasp-near-1`, `390-movement-reach-near-0`, `390-movement-reach-near-1`, `390-movement-release-near-1`, `320-movement-turn-near-1`, `390--child-development-movement-and-hands`.

관찰 장면에서 닫힌 상자·정보 없는 점선·보호자 보라색 팔이 서로 다르게 보이며 맥락 네 항목을 모바일에서는 세로로 읽는다. 손 뻗기 전후는 물체를 유지하고 손 위치가 변하며, 먼 위치에서는 간격이 남는다. 잡기와 놓기는 접촉/분리로 드러나고 방향 변화는 독립된 그림이다. 조작부는 그림 바로 앞, 결과는 바로 뒤에 놓이며 가로 잘림 없이 범례·안전 경고·출처를 읽을 수 있다. 회전 그림은 자세 지침이 아니라 명시된 개념 삽화다.

B의 소스·실제 화면 게이트는 완료했다. A→B main/Pages 순차 게시와 exact-live 검증은 아직 대기이며 이 PR 실행의 deploy/published는 정상 skipped다. 임상 감수나 안전 효과에 대한 실증 검증을 소프트웨어 검사로 대신하지 않는다.

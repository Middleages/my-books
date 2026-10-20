# 수면 B 03–04 구현·검증 기록

2026-10-20. 별도 작업트리 `write/child-sleep-b-20261020`. A 최종 로컬 문서 89aa8b2를 선행으로 보존한다. 3권 소스·첫권 후속 장은 포함하지 않는다. 최신 main 통합은 게시 담당자의 직렬 창에서 기존 등록 합집합을 보존한다.

## 범위
- 03 수면 압력과 환경 신호: 독립된 정성 방향/환경 두 층, 키보드 조작, 초기화, 정적 설명. 개인 입면 시각 예측 없음.
- 04 24시간 합성 구성과 별도 출처 탐색: 밤/낮 동일 총량 비교, 낮 미확인 보존, AASM 2016 원문 연령군과 12개월 겹침, 4개월 미만 수치 권고 없음. 사례와 연령을 결합한 개인 판정 없음.
- 실제 아이 자료, 저장·전송·새 외부 기능 없음. 의학 전문가 감수 미실행.

## 현재 게이트
- 새 모델 단위 검사 3개와 전체 unit 1050개 성공. NODE_OPTIONS=--max-old-space-size=2048 전체 build 1회가 10:36 UTC에 exit 0으로 완료됐다. 큰 번들 크기 안내만 남았다. 다른 책/장/분류 113개 행의 변경 없음도 직접 비교했다.
- 전용 브라우저 검사는 네 폭 320/390/850/1440, 두 과정의 모든 조합, 같은 총량·미확인, 다섯 연령 경계, 그림의 고정 눈금, 초기화·키보드·원본 PNG를 추가했다. 아직 실행하지 않았고 PNG 직접 검토도 미실행이다.
- 로컬 Chromium 차단은 재시도하지 않으며 정상 PR CI로 검증한다.
- 원격 PR 미생성. main/Pages 미게시. 소스/실제 화면/게시 게이트를 혼동하지 않는다.

## B 최초 게이트와 안전 문장 전파 후 재검증 마감

최초 B source626d003e/treecd0724ce의 CI39409504965는 build+선택2 suite(child-sleep,book-volumes) 성공,46검사105PNG오류0이었다. 네 폭 원본8개를 직접 확인한 뒤, 독립 검토에 따라 A02의 보호자 취침 전 별도 표면 복귀/소파·안락의자 동반 수면 회피 두 문장을 별도 보강했다.

B 보강 소스는 로컬 ad26d34ceef57e63b8856faa3068799e9fa4cd4d, 원격 f96671bd1acf56de30e818cea256dc38b7bac27f, 동일 tree7c9a5c3883c12c3f78b634ce5e6bf66bba9ad7b8이다. PR65 CI39411650452의 build+선택2 production suite가 모두 성공했다. 전용50검사109PNG, page/console/resource 오류0. 실제 checkout7ec8b541e7eb83e70f1c6bd9cd84db26a5f6e6ba/동일tree/clean을 확인했다. 전체10 suite 검증으로 과장하지 않는다.

Artifact12259237971 ZIP SHA2566d805ecf8a9b12bc29b76c69f13e70d95d967103e74ce68873229234cf7ab894. 보강 후 원본320-caregiver-boundary.png,390-caregiver-boundary.png,1440-caregiver-boundary.png,390-reference-twelve.png를 직접 열어 새2문장의 줄바꿈·가독성과 기존 참고 띠 보존을 확인했다. A 합본의 정확한 렌더는 합본 원본에서 별도로 확인한다. main/Pages는 아직 직렬 게시 게이트이며 완료로 표시하지 않는다.


## 최신 여덟 배치 합본 production 확인 — 2026-10-20

[PR72/run39415697607](https://github.com/Middleages/my-books/actions/runs/39415697607), 실제 checkout `8142a5ba33b5ea19e8e1850384afc7ecebb346d9` / tree `943169b8a80ee63cb5d08d3ee58e30d94c447bf5`에서 전체1339 단위/build 및 선택9 production이 성공했다. 이 책은 **50/50 검사·109원본 PNG**, 앱 및 별도 호스트 진단0, clean source다. artifact12262130940 ZIP SHA256 `dcb7dd513f435aeb0a0e3845992dca06900a445f48f1b990fd8f18743d651690` 일치. 정확한 공통 JS/CSS 바이트와 선택/생략 범위는 [합본 기록](FOLLOWUP-EIGHT-WAVE-VERIFICATION.md)에 남겼다.

직접 연 새 원본: `320-caregiver-boundary.png, 1440-caregiver-boundary.png, 320-rhythm-rested-day.png, 1440-reference-twelve.png`. 작성자가 네 원본에서 안전 보강 두 문장, 독립된 두 층과12개월 원문 중첩을 직접 확인했다. 선택 범위에서 새 의미·겹침·잘림 차단점을 찾지 못했다. 모든 109개·모든 정적 표행을 사람이 읽은 것은 아니며 실제 시스템·실기기·스크린리더·임상/금융 판단 검증을 의미하지 않는다. 이 절은 **소스 합본 production** 결과다. 선행 배치의 실제 게시 게이트 이후 main/Pages 및 exact-published 확인은 별도로 수행한다.


## 최신 합본 실제 게시 완료 — 2026-10-20

정확한 main `5b257ffccec0199c960a1ec25bec27e81351dc31`, tree `8addcb735c563962876bb6873c3b19d335932895`의 [run39425708305](https://github.com/Middleages/my-books/actions/runs/39425708305)에서 전체1342단위·build, 선택9종 production→Pages(13:08:22UTC)→같은9종 published를 완료했다. 이 책 실제 게시 보고서는 **51/51검사·109원본PNG**, clean source·앱/page/console/resource 오류0이다. 정확한 호스트 루트 favicon404 한 건만 별도 진단으로 남겼다. 실제 제공된 JS/CSS 전체 바이트는 같은 단일 build 및 앞선 합본 production과 일치한다.

published artifact12266392549, ZIP SHA256 `79e00830a99ee9127d13e77cfa00674097be8a0a3713130a38a6a121a522f2e4`를 실제 다운로드와 대조했다. 이 책의 대표 원본을 직접 열어 확인한 정확한 파일/범위, 전체 선택9/생략5, 자산 해시와 다른 책의 순서는 [합본 최종 기록](FOLLOWUP-EIGHT-WAVE-VERIFICATION.md#정확한-mainpages실제-게시-게이트--2026-10-20)에 보존했다. 원본 전수 사람 검토·실기기·실제 서비스·임상 감수와 후속 배치 게시를 이 결과로 대신하지 않는다.

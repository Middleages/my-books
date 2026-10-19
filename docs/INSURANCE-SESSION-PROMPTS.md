# 보험 교재 배치별 실행 프롬프트

작성일: 2026-10-20 KST. 상태: **A 소개·01–02와 B03–04 검증·게시 완료. C05–06 구현·로컬 검증 완료, 실제 화면·게시 검증 준비. D–E 미구현**. 계획 문서 작성은 구현·실행·게시 완료가 아니다. 한 배치의 실제 게시 게이트를 닫은 후 다음 배치를 진행한다.

각 블록은 [제작 계획](INSURANCE-TEXTBOOK-PLAN.md)의 해당 배치 상세·고정 수치·모델 가정·공식 근거·공통 검증 전체를 포함하는 지시다. 최신 main과 직전 검증 기록을 읽고 병행 작업을 보존한다.

## 세션 A

```text
Middleages/my-books 돈·경제4권 ‘보험과 위험 대비’ 배치 A를 구현하자.
범위: 소개·01 같은 평균, 다른 충격·02 보험은 위험을 어떻게 나눌까.
먼저 최신 main의 AGENTS.md, docs/CONTENT-AUTHORING.md, HOME-INFORMATION-ARCHITECTURE.md, MONEY-TEXTBOOK-PLAN.md/MONEY-BOOK-REVIEW.md, ECONOMICS-TEXTBOOK-PLAN.md/ECONOMICS-BATCH-F-VERIFICATION.md, INVESTING-TEXTBOOK-PLAN.md/INVESTING-BOOK-REVIEW.md, INSURANCE-TEXTBOOK-PLAN.md/INSURANCE-SESSION-PROMPTS.md와 기존 보험 배치 검증 기록·본문·UI·모델·테스트를 읽어줘. 저장소 .agents/skills가 있으면 관련 SKILL.md도 확인해줘.
계획의 배치 A 상세 전체를 구현해줘. 본문은 MDX, UI는 React/TypeScript, 계산·판정·시간/관찰 프레임은 순수 .mjs와 .d.mts. 고정 ID·readId·money 분야를 지키고 미구현 장은 카탈로그/링크/읽음 분모에 넣지 마. 기존 책·URL·localStorage 키와 알 수 없는 읽음ID를 보존해줘.
그림/짧은 설명→관찰→예측/직접조작→해석/적용→이유 있는 확인 문제·공식 출처를 설계하고 폼/숫자카드만으로 시각 설명을 대신하지 마. 동일 모델이 그림·표·숫자·판정을 공급하게 해줘.
가상 확률/계약/보험료/환급표·원리·현행 제도·예정 변경을 구분하고 장별 공식 원문 확인일을 남겨줘. 2026-11 예정사항을 현재 시행으로 쓰지 마. 실제 건강/금융정보·견적·가입/해지·개인 맞춤 추천을 추가하지 마. 돈 생성·실손 이중 지급·보험금 약속을 이미 도착한 현금으로 처리하지 마.
0/한도/제외/확률·일자 경계·반복 청구·리셋·반올림·큰 유한값·동일 입력 재현·프레임 보존을 테스트하고 npm test, npm run build, git diff --check를 실행해줘.
독립 검토 후 실제 production과 게시 Chromium1440/390/320 화면·대표 PNG 직접 검토, 의미 있는 도형/라벨·넘침·앱 콘솔·키보드/포커스·재생/정지/단계/초기화·reduced-motion/정적 대안을 검사해줘. MDX 별표/del/문단중첩·내부링크·기존 책 실험·홈/표지·읽음/새로고침 회귀도 확인해줘.
배포 직전 최신 main을 다시 확인하고 다른 세션 변경을 보존하며 통합해줘. main 반영→Actions build/Pages deploy/verify-published 최종 성공→실제 게시 asset 바이트/해시 및 본문 확인까지 책임지고 완료해줘. 미실행/차단을 통과로 쓰지 말고 검증 문서에 기준SHA·명령/환경·실제 결과·직접 본 이미지·한계를 적어줘.
검증 문서: docs/INSURANCE-BATCH-A-VERIFICATION.md. 현재 공개 범위·계획/소개/카탈로그 상태를 맞추고 이후 배치는 이번 배치 검증 후 별도로 실행해줘.
```

## 세션 B

```text
Middleages/my-books 돈·경제4권 ‘보험과 위험 대비’ 배치 B를 구현하자.
범위: 03 보험 계약의 지도·04 보험금은 어떻게 정해질까.
먼저 최신 main의 AGENTS.md, docs/CONTENT-AUTHORING.md, HOME-INFORMATION-ARCHITECTURE.md, MONEY-TEXTBOOK-PLAN.md/MONEY-BOOK-REVIEW.md, ECONOMICS-TEXTBOOK-PLAN.md/ECONOMICS-BATCH-F-VERIFICATION.md, INVESTING-TEXTBOOK-PLAN.md/INVESTING-BOOK-REVIEW.md, INSURANCE-TEXTBOOK-PLAN.md/INSURANCE-SESSION-PROMPTS.md와 기존 보험 배치 검증 기록·본문·UI·모델·테스트를 읽어줘. 저장소 .agents/skills가 있으면 관련 SKILL.md도 확인해줘.
계획의 배치 B 상세 전체를 구현해줘. 본문은 MDX, UI는 React/TypeScript, 계산·판정·시간/관찰 프레임은 순수 .mjs와 .d.mts. 고정 ID·readId·money 분야를 지키고 미구현 장은 카탈로그/링크/읽음 분모에 넣지 마. 기존 책·URL·localStorage 키와 알 수 없는 읽음ID를 보존해줘.
그림/짧은 설명→관찰→예측/직접조작→해석/적용→이유 있는 확인 문제·공식 출처를 설계하고 폼/숫자카드만으로 시각 설명을 대신하지 마. 동일 모델이 그림·표·숫자·판정을 공급하게 해줘.
가상 확률/계약/보험료/환급표·원리·현행 제도·예정 변경을 구분하고 장별 공식 원문 확인일을 남겨줘. 2026-11 예정사항을 현재 시행으로 쓰지 마. 실제 건강/금융정보·견적·가입/해지·개인 맞춤 추천을 추가하지 마. 돈 생성·실손 이중 지급·보험금 약속을 이미 도착한 현금으로 처리하지 마.
0/한도/제외/확률·일자 경계·반복 청구·리셋·반올림·큰 유한값·동일 입력 재현·프레임 보존을 테스트하고 npm test, npm run build, git diff --check를 실행해줘.
독립 검토 후 실제 production과 게시 Chromium1440/390/320 화면·대표 PNG 직접 검토, 의미 있는 도형/라벨·넘침·앱 콘솔·키보드/포커스·재생/정지/단계/초기화·reduced-motion/정적 대안을 검사해줘. MDX 별표/del/문단중첩·내부링크·기존 책 실험·홈/표지·읽음/새로고침 회귀도 확인해줘.
배포 직전 최신 main을 다시 확인하고 다른 세션 변경을 보존하며 통합해줘. main 반영→Actions build/Pages deploy/verify-published 최종 성공→실제 게시 asset 바이트/해시 및 본문 확인까지 책임지고 완료해줘. 미실행/차단을 통과로 쓰지 말고 검증 문서에 기준SHA·명령/환경·실제 결과·직접 본 이미지·한계를 적어줘.
검증 문서: docs/INSURANCE-BATCH-B-VERIFICATION.md. 현재 공개 범위·계획/소개/카탈로그 상태를 맞추고 이후 배치는 이번 배치 검증 후 별도로 실행해줘.
```

## 세션 C

```text
Middleages/my-books 돈·경제4권 ‘보험과 위험 대비’ 배치 C를 구현하자.
범위: 05 보장되는 사건과 빠지는 조건·06 보험이 겹치면 두 번 받을까.
먼저 최신 main의 AGENTS.md, docs/CONTENT-AUTHORING.md, HOME-INFORMATION-ARCHITECTURE.md, MONEY-TEXTBOOK-PLAN.md/MONEY-BOOK-REVIEW.md, ECONOMICS-TEXTBOOK-PLAN.md/ECONOMICS-BATCH-F-VERIFICATION.md, INVESTING-TEXTBOOK-PLAN.md/INVESTING-BOOK-REVIEW.md, INSURANCE-TEXTBOOK-PLAN.md/INSURANCE-SESSION-PROMPTS.md와 기존 보험 배치 검증 기록·본문·UI·모델·테스트를 읽어줘. 저장소 .agents/skills가 있으면 관련 SKILL.md도 확인해줘.
계획의 배치 C 상세 전체를 구현해줘. 본문은 MDX, UI는 React/TypeScript, 계산·판정·시간/관찰 프레임은 순수 .mjs와 .d.mts. 고정 ID·readId·money 분야를 지키고 미구현 장은 카탈로그/링크/읽음 분모에 넣지 마. 기존 책·URL·localStorage 키와 알 수 없는 읽음ID를 보존해줘.
그림/짧은 설명→관찰→예측/직접조작→해석/적용→이유 있는 확인 문제·공식 출처를 설계하고 폼/숫자카드만으로 시각 설명을 대신하지 마. 동일 모델이 그림·표·숫자·판정을 공급하게 해줘.
가상 확률/계약/보험료/환급표·원리·현행 제도·예정 변경을 구분하고 장별 공식 원문 확인일을 남겨줘. 2026-11 예정사항을 현재 시행으로 쓰지 마. 실제 건강/금융정보·견적·가입/해지·개인 맞춤 추천을 추가하지 마. 돈 생성·실손 이중 지급·보험금 약속을 이미 도착한 현금으로 처리하지 마.
0/한도/제외/확률·일자 경계·반복 청구·리셋·반올림·큰 유한값·동일 입력 재현·프레임 보존을 테스트하고 npm test, npm run build, git diff --check를 실행해줘.
독립 검토 후 실제 production과 게시 Chromium1440/390/320 화면·대표 PNG 직접 검토, 의미 있는 도형/라벨·넘침·앱 콘솔·키보드/포커스·재생/정지/단계/초기화·reduced-motion/정적 대안을 검사해줘. MDX 별표/del/문단중첩·내부링크·기존 책 실험·홈/표지·읽음/새로고침 회귀도 확인해줘.
배포 직전 최신 main을 다시 확인하고 다른 세션 변경을 보존하며 통합해줘. main 반영→Actions build/Pages deploy/verify-published 최종 성공→실제 게시 asset 바이트/해시 및 본문 확인까지 책임지고 완료해줘. 미실행/차단을 통과로 쓰지 말고 검증 문서에 기준SHA·명령/환경·실제 결과·직접 본 이미지·한계를 적어줘.
검증 문서: docs/INSURANCE-BATCH-C-VERIFICATION.md. 현재 공개 범위·계획/소개/카탈로그 상태를 맞추고 이후 배치는 이번 배치 검증 후 별도로 실행해줘.
```

## 세션 D

```text
Middleages/my-books 돈·경제4권 ‘보험과 위험 대비’ 배치 D를 구현하자.
범위: 07 보험료와 보장의 시간표·08 해지하면 돌려받는 돈.
먼저 최신 main의 AGENTS.md, docs/CONTENT-AUTHORING.md, HOME-INFORMATION-ARCHITECTURE.md, MONEY-TEXTBOOK-PLAN.md/MONEY-BOOK-REVIEW.md, ECONOMICS-TEXTBOOK-PLAN.md/ECONOMICS-BATCH-F-VERIFICATION.md, INVESTING-TEXTBOOK-PLAN.md/INVESTING-BOOK-REVIEW.md, INSURANCE-TEXTBOOK-PLAN.md/INSURANCE-SESSION-PROMPTS.md와 기존 보험 배치 검증 기록·본문·UI·모델·테스트를 읽어줘. 저장소 .agents/skills가 있으면 관련 SKILL.md도 확인해줘.
계획의 배치 D 상세 전체를 구현해줘. 본문은 MDX, UI는 React/TypeScript, 계산·판정·시간/관찰 프레임은 순수 .mjs와 .d.mts. 고정 ID·readId·money 분야를 지키고 미구현 장은 카탈로그/링크/읽음 분모에 넣지 마. 기존 책·URL·localStorage 키와 알 수 없는 읽음ID를 보존해줘.
그림/짧은 설명→관찰→예측/직접조작→해석/적용→이유 있는 확인 문제·공식 출처를 설계하고 폼/숫자카드만으로 시각 설명을 대신하지 마. 동일 모델이 그림·표·숫자·판정을 공급하게 해줘.
가상 확률/계약/보험료/환급표·원리·현행 제도·예정 변경을 구분하고 장별 공식 원문 확인일을 남겨줘. 2026-11 예정사항을 현재 시행으로 쓰지 마. 실제 건강/금융정보·견적·가입/해지·개인 맞춤 추천을 추가하지 마. 돈 생성·실손 이중 지급·보험금 약속을 이미 도착한 현금으로 처리하지 마.
0/한도/제외/확률·일자 경계·반복 청구·리셋·반올림·큰 유한값·동일 입력 재현·프레임 보존을 테스트하고 npm test, npm run build, git diff --check를 실행해줘.
독립 검토 후 실제 production과 게시 Chromium1440/390/320 화면·대표 PNG 직접 검토, 의미 있는 도형/라벨·넘침·앱 콘솔·키보드/포커스·재생/정지/단계/초기화·reduced-motion/정적 대안을 검사해줘. MDX 별표/del/문단중첩·내부링크·기존 책 실험·홈/표지·읽음/새로고침 회귀도 확인해줘.
배포 직전 최신 main을 다시 확인하고 다른 세션 변경을 보존하며 통합해줘. main 반영→Actions build/Pages deploy/verify-published 최종 성공→실제 게시 asset 바이트/해시 및 본문 확인까지 책임지고 완료해줘. 미실행/차단을 통과로 쓰지 말고 검증 문서에 기준SHA·명령/환경·실제 결과·직접 본 이미지·한계를 적어줘.
검증 문서: docs/INSURANCE-BATCH-D-VERIFICATION.md. 현재 공개 범위·계획/소개/카탈로그 상태를 맞추고 이후 배치는 이번 배치 검증 후 별도로 실행해줘.
```

## 세션 E

```text
Middleages/my-books 돈·경제4권 ‘보험과 위험 대비’ 배치 E를 구현하자.
범위: 09 사고부터 보험금 도착까지·10 보험 설명 함께 읽기와 소개·01–10 전체 편집 점검.
먼저 최신 main의 AGENTS.md, docs/CONTENT-AUTHORING.md, HOME-INFORMATION-ARCHITECTURE.md, MONEY-TEXTBOOK-PLAN.md/MONEY-BOOK-REVIEW.md, ECONOMICS-TEXTBOOK-PLAN.md/ECONOMICS-BATCH-F-VERIFICATION.md, INVESTING-TEXTBOOK-PLAN.md/INVESTING-BOOK-REVIEW.md, INSURANCE-TEXTBOOK-PLAN.md/INSURANCE-SESSION-PROMPTS.md와 기존 보험 배치 검증 기록·본문·UI·모델·테스트를 읽어줘. 저장소 .agents/skills가 있으면 관련 SKILL.md도 확인해줘.
계획의 배치 E 상세 전체를 구현해줘. 본문은 MDX, UI는 React/TypeScript, 계산·판정·시간/관찰 프레임은 순수 .mjs와 .d.mts. 고정 ID·readId·money 분야를 지키고 미구현 장은 카탈로그/링크/읽음 분모에 넣지 마. 기존 책·URL·localStorage 키와 알 수 없는 읽음ID를 보존해줘.
그림/짧은 설명→관찰→예측/직접조작→해석/적용→이유 있는 확인 문제·공식 출처를 설계하고 폼/숫자카드만으로 시각 설명을 대신하지 마. 동일 모델이 그림·표·숫자·판정을 공급하게 해줘.
가상 확률/계약/보험료/환급표·원리·현행 제도·예정 변경을 구분하고 장별 공식 원문 확인일을 남겨줘. 2026-11 예정사항을 현재 시행으로 쓰지 마. 실제 건강/금융정보·견적·가입/해지·개인 맞춤 추천을 추가하지 마. 돈 생성·실손 이중 지급·보험금 약속을 이미 도착한 현금으로 처리하지 마.
0/한도/제외/확률·일자 경계·반복 청구·리셋·반올림·큰 유한값·동일 입력 재현·프레임 보존을 테스트하고 npm test, npm run build, git diff --check를 실행해줘.
독립 검토 후 실제 production과 게시 Chromium1440/390/320 화면·대표 PNG 직접 검토, 의미 있는 도형/라벨·넘침·앱 콘솔·키보드/포커스·재생/정지/단계/초기화·reduced-motion/정적 대안을 검사해줘. MDX 별표/del/문단중첩·내부링크·기존 책 실험·홈/표지·읽음/새로고침 회귀도 확인해줘.
배포 직전 최신 main을 다시 확인하고 다른 세션 변경을 보존하며 통합해줘. main 반영→Actions build/Pages deploy/verify-published 최종 성공→실제 게시 asset 바이트/해시 및 본문 확인까지 책임지고 완료해줘. 미실행/차단을 통과로 쓰지 말고 검증 문서에 기준SHA·명령/환경·실제 결과·직접 본 이미지·한계를 적어줘.
검증 문서: docs/INSURANCE-BATCH-E-VERIFICATION.md. 현재 공개 범위·계획/소개/카탈로그 상태를 맞추고 이후 배치는 이번 배치 검증 후 별도로 실행해줘.
```

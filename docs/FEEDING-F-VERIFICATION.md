# 먹기 F11–12 검증

E 소스·문서42a52d6에서 진행. 범위는11–12 및 먹기 QA/문서이며 다른 책 카탈로그는 보존한다. 원격 정상 PR CI·원본 PNG 직접검토·main/Pages는 별도 게이트다. 현재 소스 검증 진행 중이며 미실행을 통과로 기록하지 않는다.

## 정상 PR와 직접 검토 중 발견·수정

로컬 원배치1235f2a unit1065/0 및 build2048 통과. 소개 정합성df9d50f 추가. 최신 main 통합은 비대상 카탈로그의 TypeScript AST 및 원시 바이트를 비교해 보존했다.

첫 정상 PR94 run39459577789는 unit1475/build·book-volumes는 통과했지만, 위생 선택 상자의 접근성 이름에 option 글자가 함께 포함되어 exact-label 조작이 실패했다. 전체 화면 통과로 세지 않았다. aria-label 수정5126833을 적용했다. 이어 main이66a41ee로 이동해 충돌을 해소하고 먹기만 다시 적용했다.

수정 head1be8cfb8의 정상 run39460599433은 unit1487/0·build·feeding/book-volumes 통과. PR merge checkout36262deb5c8314d47067a50810b397000f35ab05, tree5e9b1802f0adb0b87c017684d4d7e0233d8f1f79. feeding106checks/0fail, 앱 page/console/resource 오류0. 320/390/850/1440 렌더·키보드·초기화·정적 대안·읽음 보존을 검사했다.

직접 원본 검토에서1440 위생 경계와320 미확인 이력,390 제공 이력은 읽기 가능했고, 가족 보드는1440/390/320/850에서 실선 사실→점선 질문과 빈 양식을 구분할 수 있었다. 다만850 위생 흐름이4개의 좁은 열로 남아 긴 줄바꿈이 생겼다. 기능 성공과 별개로 개선이 필요해771f3ff에서651–1000px를2열로 수정했다. 최종 head5db476893e2d8844cef8f771df3e9f9c9765e517 run39461244043을 별도 검증 중이다.

로컬 Chromium은 Unix socket sandbox 제한으로 시작 실패하여 화면 성공으로 세지 않았다. 의학/영양 전문가 감수, Safari, 실제 터치 기기, 스크린리더 음성, 물리 인쇄 결과는 미실행. main/Pages/최종 넓은 회귀는 부모 통합 담당의 별도 게이트다.

## 최종 소스·직접 화면 게이트 통과

[PR94](https://github.com/Middleages/my-books/pull/94) head `5db476893e2d8844cef8f771df3e9f9c9765e517`, [정상 Actions 39461244043](https://github.com/Middleages/my-books/actions/runs/39461244043): unit1487/0, build5.95s, child-feeding와 book-volumes production 성공. PR merge checkout `a4aaf36c99bd76b4f3e68f6d05b5e8d6a7a22453`, tree `4f5a634e4ce988e5f090cdb5d13b1599aa5c259f`. feeding report106 통과/0실패, 앱 page/console/resource 오류0.

최종850 원본에서 위생 경계가2열로 재배치되어 제목과 설명의 과도한 줄바꿈이 해소됨을 직접 확인했다. 1440 원본4열, 390/320 세로 흐름, 별도 미제공/먹던 접시 경계와 안전 판정 없음 문구가 유지된다. 가족 보드의 사실은 실선/●, 질문은 점선/?로 구별되며 질문 펼침 전후 사실은 바뀌지 않는다. 키보드 포커스가 선명하고 결과/정적 대안/빈 양식이 잘리지 않는다. 변경하지 않은 폭은 이전 원본 검토와 최종1440·320 재확인을 함께 사용했다. 최종 ZIP 전체와 대표 원본을 보존했다. artifact ID12283531147, ZIP SHA256 `5f2bf7aa3a88211ff70dadb8ee0f1f65b81458992a38a891dac3d5b659c27709`.

소스와 영향 범위 화면은 통과했지만 최신 main 통합·넓은 전체 책 회귀·Pages 게시 검증은 이 PR의 완료 범위가 아니다.

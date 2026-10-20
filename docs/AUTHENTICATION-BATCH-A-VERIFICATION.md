# 인증 A — 소개·01–02 검증 기록

2026-10-20. 기준 최신 main `d76ed55e9969108449124a154c7c67e946068740`에 검증된 관측 A를 보존한 독립 작업트리. **작성 당시 로컬 구현 시작. 현재 PR46 후보 검증 중이며 main/Pages는 미게시.** 관측 B 소스는 섞지 않았다.

## 범위와 장면

technology6 authentication, 소개·identity-and-permission·cookies-and-sessions만 등록. 기존 ID/권차/알 수 없는 읽음 보존. 장식 SVG 표지를 추가했다.

인증과 인가를 두 개의 문으로, 역할과 객체 정책을 인가 문의 별도 검사로 그린다. 가람 editor가 누리 문서를 수정하면 인증 성공/인가 거절. 버튼 숨김은 정책과 무관하다. 동일 issuer와 tenant는 고정이며 다중 tenant 구현을 주장하지 않는다.

쿠키 브라우저 저장소와 서버 세션 저장소를 떨어뜨리고 요청/응답 방향을 구별한다. 쿠키 없음·다른 host·서버 만료599/600 경계·인스턴스별 기록 부재·공유 저장소를 비교한다. 가짜 SIM-SESSION-A 라벨만 사용하며 실제 cookie API/비밀 입력/네트워크 호출이 없다.

## 미실행·후속 게이트

소스 `7a96ca3`에서 결정적 모델4개, 전체 unit1075/1075, TypeScript/Vite build, browser verifier 문법·diff 검사 통과. 최초 scope test는 새 book 정규식 등록 누락으로 실패해 수정했고, MDX import/JSX 사이 빈 줄 누락은 build가 발견해 수정·재검증했다. production browser·직접 PNG 검토는 아직 미실행이다. 최초 registry 등록이므로 넓은 회귀가 필요하다. 실제 로그인·SSO·암호 검증·보안 설정은 실행하지 않는다. 공개와 Pages/live 게이트는 직렬 게시 담당 후속 창에서만 진행한다.

## Production와 직접 화면 검토 후속 · 2026-10-20

첫 production 통과 캡처에서 320/390px 왕복 칸의 글자 단위 줄바꿈과 전송 완료 색의 의미가 모호한 부분을 직접 발견했다. 모바일 왕복 칸을 세로 전체 폭으로 재배치하고 요청/응답 진행을 파랑으로, 실제 인증 판정은 서버 검사 문구로 구별하는 범례를 추가했다. 수정 뒤 전체1075/1075와 build를 다시 통과했다.

최종 후보 PR46 head `4031b79492eaa0cc66563c82f22539c4fb5798ad`, source tree `e9ce388bdf2d3ed9f8084d2c44f48bb4f56032de`, run `39395892602`. 인증 production browser는 Chromium155.0.8059.39에서11개 검사묶음·45 PNG·오류/진단0으로 통과했다. 1440/390/320px·normal/reduced motion·키보드·초기화·읽음 보존을 검사했다. artifact `12252360273` ZIP SHA256 `faa3c0c272faefd4fe0e9b4bb9ef239781668117749490ef716b4d415270430f`.

최종 원본 desktop 초기/유효/거절, 모바일 만료/서버 기록 없음/다른 host와 소개를 직접 열어 왕복 방향·두 저장소·불확정 판정·모바일 재배치·라벨을 확인했다. 수정 전에는 지적한 두 문제가 있었으며 최종 캡처에서 해소됐다. 최초 등록 전체10개 browser 회귀는 아직 진행 중이므로 전체 통과 판정은 보류한다. main/Pages/live 자산 일치와 실기기 Safari·스크린리더는 미검증이다. 문서 후속 기록은 실행 중 CI를 취소하지 않도록 로컬에만 둔다.

## 최종 회귀 및 신규4A 합본 표본 검토

2026-10-20 09:12 UTC에 run `39395892602`의 completed/success를 확인했다. 전체 unit/build와 최초 등록의 넓은10개 browser suite가 모두 성공했다. 최종 인증 소스는 앞서 적은 `4031b794…`/tree `e9ce388b…` 그대로다.

신규4A 통합 후보 PR51 head `dd1bdf10693076b4ced3b0af7e763c1386f30e97`, 실제 checkout `4c68a53cfcf7e5f8f56dba587ebf0abf56e96d1a`/tree `97d1a12844afbcddcc90c067000cb14877ee9db6`의 인증 report도11개 검사·오류0을 확인했다. 원본 `1440-session-valid.png`, `320-session-expired.png`, `390-identity-denied.png`를 직접 열어 두 저장소·요청/응답 방향·만료/인가 거절·320px 줄바꿈이 유지됨을 확인했다. 이는 표본의 통합 시각 검토이며 통합 전체12-suite와 main/Pages/live 성공을 대신하지 않는다. 실제 로그인/SSO와 실기기 접근성은 미실행이다.


## A 정확한 게시 완료 · 2026-10-20

새4권 합본의 actual main `9c1df885218915bd368744e1420c3c17ce911fd1`, tree `5eaa478898fc3a7b4cab4bac2a54b13d584367ba`에서 [run39404076837](https://github.com/Middleages/my-books/actions/runs/39404076837)의 전체1166 단위/build·12 production·Pages·12 published가 모두 성공했다. 배포10:17:30 UTC, 전체 workflow 성공10:41:27 UTC, 최종 자산 검사 동안 main은 고정됐다. 인증 자체 production11 / published12 검사, 각각 원본45PNG, 앱 오류0이다. published의 정확한 host-root favicon4041건은 별도 진단으로 보존했다.

작성자가 실제 게시 원본 `320-session-expired,390-identity-denied`를 직접 열어 앞서 검증한 의미관계·모바일 라벨과 조작부의 회귀가 없음을 해당 범위에서 확인했다. 전체 PNG나 실제기기/스크린리더·실제 시스템/개인 결과 검증으로 확대하지 않는다. 전체 ZIP digest·정확 JS/CSS·다른 suite·직접 검토 한계는 [새4권 합본 최종 기록](NEW-BOOKS-A-WAVE-VERIFICATION.md#정확한-mainpages실제-게시-게이트-완료--2026-10-20)에 남겼다. A 소개·01–02만 이 source에 포함되며 후속 배치 공개는 별도 순서를 따른다.

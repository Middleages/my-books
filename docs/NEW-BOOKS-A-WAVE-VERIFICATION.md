# 확률·관측·인증·육아 A 등록 합본 검증

작성:2026-10-20 UTC. 새4권의 소개·01–02만 통합한 후보이며 **아직 main/Pages/실제 게시 완료가 아니다**. 선행 main47c36cc의 DB C·회계 B·주거 F와 주거 전체권 고정 회귀가 닫히기 전 이 후보를 게시하지 않는다.

## 정확한 source와 범위

기준 main `47c36cc06fad15d87afd040ac5c259b421714d52`, tree `09766eee17e80d322b382d544b99085f7450916a`와 세금 전체권 최종 기록을 보존했다. DB6·회계4·주거12·세금12 및 다른 기존 책의 앱·모델·검증기·URL·readId·읽음 저장 키는 바꾸지 않았다. 후속 B 이상은 포함하지 않는다.

| 신규 A | 검증된 공개 source | 보존한 문서 마감 |
| --- | --- | --- |
| 돈·경제8 확률 | 28c50481c4f0e2ad825d07695d9db6f150538a80 | 같은 tree의 로컬86387021와 A 문서 전용 인계 패치 |
| IT·기술5 관측 | 08ba27228efdc36698ee95ef8ae8d092b7e48da1 | 로컬fed41cad6256d45f16b35d3f04e0daf23b31f8fd |
| IT·기술6 인증 | 4031b79492eaa0cc66563c82f22539c4fb5798ad | 로컬d4df22e 앱과7c460b0·3a39fc5 문서 |
| 육아·발달1 발달 | 5ff29e5a1713f7133887c6dd973484be5b9e1ddd | 같은 tree의 로컬6908194 앱과a288e90 문서 |

네 책의 본문·모델·UI·전용 verifier는 각각 위 검증된 작성자 앱과 바이트가 같다. 카탈로그에는 네 책과 실제2장씩만 추가하고, 자체 장식 표지4개를 조건 분기에 합쳤다. 육아·발달 분야 추가는 기존 IT·기술/돈·경제 분야·권차를 재번호화하지 않는다. 실제 로그인/SSO·관측 스택·금융 계좌나 아이 개인정보 입력을 연결하지 않으며 교육용 합성 사례만 사용한다. 의료 전문가 감수·표준 선별검사·진단 도구로 보증하지 않는다.

## 검사 범위와 로컬 결과

원래8개 suite와 probability·observability·child-development·authentication을 합쳐 **12개**를 명시 등록했다. 실제 파일 목록과 등록 목록의 정확한 일치, 네 새 책의 국소 변경이 해당 전체 suite+공용 권차 검사를 선택함을 회귀로 확인했다. 공용 registry와 새 분야 추가가 있으므로 이번 첫 통합은12개 전체 production을 실행하며 생략은 없다. main workflow의 배포 권한·명령은 변경하지 않았다.

로컬 전체 **1166/1166 단위 테스트**, TypeScript·Vite **419 modules** build를 통과했다. 동시성4로 모든 테스트 파일·단언을 유지했다. 그 후 최신 main 보존 병합과 상태 문서 마감은 실행 바이트를 바꾸지 않았다. JS `index-m8-UeYgD.js` SHA-256 `271f27b53eb04b82ab9abc9d50757e7fd4218cacaf758042e2cb343dc098a164`, CSS `index-BlLHmdyO.css` `86419bc7431be863fd32e7b093b9aca027f4b4ee3474f93aaa54a9fda9ce46be`다.

각 작성자의 A source 전용 production·직접 원본 게이트는 통과했다. 인증 A의 최초10suite 중 타책 넓은 검사는 인계 당시 일부 진행 중이므로 전체 성공으로 쓰지 않는다. 이 새 합본의12suite와 직접 원본·최신 main·Pages·정확 게시 자산 검사는 별도 수행하며 아래에 실제 결과만 남긴다. 실제 Safari/Firefox·물리 기기·스크린리더 음성·학습효과 검증은 미실행이다.


## 합본 production·직접 원본 게이트 완료 · 2026-10-20

[PR51](https://github.com/Middleages/my-books/pull/51) head `dd1bdf10693076b4ced3b0af7e763c1386f30e97`, 실제 PR checkout `4c68a53cfcf7e5f8f56dba587ebf0abf56e96d1a`, tree `97d1a12844afbcddcc90c067000cb14877ee9db6`에서 [Actions39398480331](https://github.com/Middleages/my-books/actions/runs/39398480331)이 09:31:03 UTC에 build와12개 production suite 모두 성공했다. 전체1166/1166 단위·419 modules build, 총1434개 검사·2381개 원본 PNG다. 생략 suite는 없다. PR의 deploy/published는 의도대로 skipped이며 실제 게시 성공을 뜻하지 않는다.

모든12 원본 ZIP을 GitHub digest와 대조했고, 각 report의 검사 성공·앱/page/console/resource 오류0을 확인했다. source/tree 필드가 있는 report는 위 checkout/tree·clean과 일치한다. 옛 investing report에는 source/tree 필드가 없으므로 그 필드를 읽었다고 주장하지 않으며, 같은 workflow의 고정 checkout·단일 build 산출물과 job 기록으로 연결한다. 등록 scope artifact도12개/생략0과 같은 tree를 확인했다. production에서 받은 JS3,071,867bytes·CSS375,378bytes의 전체 바이트/해시가 위 build와 일치했다.

| suite | 검사 | 원본 PNG | artifact | ZIP SHA-256 |
| --- | --- | --- | --- | --- |
| database | 415 | 259 | 12255071037 | `2e3862e289d19349e38540ea904b00d2288367fdfcb973ad11a5542e45041960` |
| investing | 160 | 680 | 12254956104 | `79adcf529eb58580cb1c524ec7e1565648b21812c862374523d3ef42e1838fee` |
| housing | 189 | 248 | 12254865964 | `584c013c19666942830c6056e2185982259814fe6eeac0cdd612fa2e24e3d453` |
| probability | 83 | 32 | 12254600146 | `9b4884db166f04c955eb279c082db835e8e3b9da4d1ab333d5b09350ba5b2687` |
| accounting | 101 | 102 | 12254500300 | `45b19ca972229debbafdcf0952ac697f6a0c1789c5fd7e688ec6610fcd133f87` |
| insurance | 138 | 603 | 12254234006 | `ae8bf77a96c4548123762dc38b439b34f9e91808c49659d61acd640d977f7c69` |
| authentication | 11 | 45 | 12253940053 | `ca3a10cfc020650e5d22495d6c1e2c464b943a1ca21a3122305b6f2de7a836ab` |
| book-volumes | 14 | 51 | 12253541313 | `b3a8c37fb9b9aa98bd71ef6da51319358276366392c401f1cdb0d3b2998b0921` |
| observability | 10 | 36 | 12253221935 | `8a5ff4660226db4b843cfe169f6a3ed5a68fd23ef4e60c3711fa84fcccc55c3b` |
| kubernetes | 94 | 146 | 12253077374 | `f33f63b4fd7294db8cf9c16bdec3621819fde21e999f3bfa77737a4cec2e879c` |
| tax | 182 | 138 | 12253022584 | `dbd37d8fec1b393048958ac15e006e1f76a7b3968b986a0cb785fb1f99d464b0` |
| child-development | 37 | 41 | 12252309635 | `43d5cb580216b6e22aa775b66fe921ecbce0bf6ae3c2faef6c154beaf9ec7aa7` |

새 합본 원본의 직접 검토 범위:
- 통합 담당자:1440-home 전체,320-home과390-reading-first native 상단0–1800px,320-session-expired native1000–2600px,1440-pipeline-complete native 상단0–1700px.15권·115장, 기존 권차와 읽는 책 우선 순서, 모바일 분야4개 필터, 서버/브라우저 경계와 세 신호 수집/저장/조회 경로를 확인했다.
- 관측/인증 작성자:1440-signals-initial,320-signals-missing,390-pipeline-query,1440-session-valid,320-session-expired,390-identity-denied의6원본. 누락≠0, 조회 응답 실패, 인증과 객체 인가, 만료와 전송 중 표시,320px 세로 왕복을 확인했다.
- 육아 작성자:320-observation-2,390-age-before-due,1440-age-initial,390--child-development의4원본. 네 관찰 상태·기회/모름 구별, 예정일 전 음수·시간 기준·13개월의12/15 원출처 탐색 경계와 소개01–02 범위를 확인했다.
- 확률 작성자:320-distribution-median,320-loss-large-figure,320-loss-date-figure,320-loss-controls,320-distribution-static 및 권차320-probability-heading,320-home의7원본. 두 집단10점·중앙 순위·공통 축,200충당+1400부족,15일 현금200과30일100 제외, 인접 제어·정적 대안·돈8권/읽음0/2를 확인했다.

위 실제 표본 범위에서 새 차단 시각 회귀를 찾지 못했다. 모든 원본 또는 정적 표의 모든 열을 사람이 읽었다는 뜻은 아니다. 의료 전문가 감수나 실제 계정/시스템 검증으로 확대하지 않는다. 인증 A의 앞서 진행 중이던 단독10suite도 뒤에 성공했으며 그 별도 기록을 보존했다.

선행 주거 전체권은 실제 main47 고정8×2 실행39399756955에서 전부 성공했고 마지막 자산·main lease·직접13장면 확인까지 닫혔다. 이 4A 후보에는 그 후의 검증 문서 마감만 더하며 production을 통과한 앱·모델·검증기·테스트·workflow는 바꾸지 않는다. 다음 정확한 main12개 production→Pages→12개 published와 실제 게시 원본은 아직 별도 게이트다. 후속5배치 PR57 앱은 이 공개 범위에 섞지 않는다.

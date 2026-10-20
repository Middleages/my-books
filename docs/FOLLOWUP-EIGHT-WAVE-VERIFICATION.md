# 여덟 후속 배치 통합 검증

2026-10-20 UTC. **로컬 통합·전체 단위/build 완료, 이 합본 production·직접 새 원본·main/Pages/실제 게시 검사는 아직 대기**다. 선행5배치 main358c59bb와 신규 육아2/3 A PR69의 순차 게시 게이트를 먼저 닫는다. 검증된 각 책의 다음 두 장만 포함하며, 한 책의 선행 배치를 건너뛰어 공개하지 않는다.

## 범위와 작성자 검증 소스

| 책·배치 | 정확한 로컬 소스/마감 기준 | 작성자 실행 및 전용 검사 |
| --- | --- | --- |
| DB E09–10 | 3c26844efa2089015a1f2188b530e72acb9e6e7a; 실행2adb6d71751caf3c0f89c6a16e147d81aff3ae35 | PR55/run39409811356,576검사·581PNG |
| 회계 E09–10 | 2e6a962f33bdcc7e2b23c90aac5254f6bf78962a; 공개f429f51817f34f5cf70131cd9813e2b9fb319960 | PR49/run39401427984,332검사·297PNG |
| 확률 D07–08 | 83c07f2e75b31adec9a73cf76d61d6833cc26d63 및 별도 최종 검증 문서 패치; 공개7dc01b77ee37aae4b4905384fd38eb9d706a3e86 | PR61/run39409147669,533검사·182PNG |
| 관측 D07–08 | 40aade18f3b3e0b36c6bf017f6e63740c9166d94; 공개28cc3d74298cf15a5149edcd0d70553590d1ca7b | PR64/run39409788373,34검사·144PNG |
| 인증 C05–06 | b3e4aae173bf3e3731abc938bd4c3c7fc11e1ea7; 공개b404549632f4ee577a56ab0329a67bd43e74ca76 | PR62/run39407882997,27검사·150PNG |
| 육아 발달 D07–08 | c9a14ab0539a075eb8e1dc8876403a3e8b883d1e; 공개aafb7bb3fa95258473a8a95e81a7ef8cab13cc17 | PR47/run39395565338,97검사·371PNG |
| 수면 B03–04 | 5be120e364eb3cbd430462a958fd51b4ac08f146; 공개f96671bd1acf56de30e818cea256dc38b7bac27f | PR65/run39411650452,50검사·109PNG |
| 먹기 B03–04 | 8b49592cf591ede76a2c8fc59b933a94e62ec7b5; 공개3bbf509e895977761213d1f20ce3fe20f10281ea | PR68/run39411916216,42검사·85PNG |

각 작성자의 전용 source/원본 직접 게이트는 인계 때 완료했다. 위 실행의 전체 범위·이전 실패/교정·수동 표본 한계는 각 배치 문서를 따른다. 이 표는 새 합본이나 실제 게시의 성공을 대신하지 않는다. 더 뒤의 DB/회계F, 확률/관측E, 인증D, 발달E, 수면/먹기C는 포함하지 않았다.

## 보존 검증과 두 메타데이터 교정

PR69 앱 source ecf9d67dc5a35876aa6565b8b8cabe4c2c2d79e9의17권·14종 검증기 위에 각 책의 import/chapter/book partition만 합쳤다. 나머지9권의 앱·본문·모델·카탈로그 partition, 모든 기존 권차·URL·readId·저장 키·공통 선언·표지·workflow·package/lockfile·suite 선택기와 공개 장수 검사는 보존했다. 각 책의 공개 본문 장수는 DB10·회계10·확률8·관측8·발달8·인증6·수면4·먹기4이며 총17권155개 본문 장이다.

각 대상의 본문·UI·순수 모델·전용 browser verifier는 위 작성자 소스와 바이트가 같다. 수면은 최신 A 안전 두 문장과 네 폭 렌더/PNG 검사를 보존하는 B 안전 보강판을 사용했다. 실제 아이 기록·인증 비밀·금융계좌·DB/관측 서버 연결을 새로 추가하지 않았다.

첫 전체 단위 검사에서 공통 `catalog-published-count`가 인증C의 실제6장 대비 소개4장 표기를 잡았다. 같은 독립 대조에서 관측D의 실제8장 대비 소개6장도 발견했다. **해당 두 book ID의 future 범위만06/08로 교정**했고 나머지 문구/책/순수 모델/테스트 단언은 변경하지 않았다. 원래 실패(1338통과·1실패)를 보존하며 성공으로 소급하지 않는다. 해당 두 레코드는 작성자 원본과의 명시적인 유일한 메타데이터 차이다. 기존 장수 검사를 완화하지 않고 집중9검사 및 전체를 다시 실행했다.

실제 main358c59bb의 이전 공개 마감과 PR69의 최신 source 마감을 문서로 보존 병합했다. 이미 검증한 앱을 과거 카탈로그나 오래된 공유 파일로 덮어쓰지 않았다. 최초 A와 각 배치의 역사 기록은 현재 상태와 구분한다.

## 로컬 실행과 실제 후속 범위

교정 후 `node --test --test-concurrency=4 tests/*.test.mjs` **1339/1339, 실패·건너뜀0**, `NODE_OPTIONS=--max-old-space-size=2048 npm run build` **524 modules**가 통과했다. 제한 build는11:25:27–11:27:23 UTC에1회 수행했고 기존 대형 bundle 경고는 남는다. 이 기록은 브라우저나 임상 검토를 대신하지 않는다.

- JS `index-DY1jvW9T.js`:3734150bytes, SHA256 `9e74ccf8a326cf2b3b70b19c505cda306ebfe3f18c29aab369bb8ec8cf85c7b7`.
- CSS `index-ButlMfaq.css`:431679bytes, SHA256 `a3ba24be5c8c864c0005db11e581868d4932e712ca46e0bd975d73ef2dca7487`.

PR69 이후 실제 diff의 선택 범위는 **book-volumes,database,accounting,probability,observability,child-development,authentication,child-sleep,child-feeding 9종**이다. **insurance,investing,tax,kubernetes,housing 5종은 의도적 미실행**이며 통과로 세지 않는다. 새 등록이나 공통 실행 인프라 변경은 없다. 선택한 verifier의 모든 기존 단언·모델 관계·정적 대안·키보드·reduced-motion·원본 캡처는 유지한다.

앞으로 이 합본의 실제 production 및 새 원본에서 DB 복구 시간축/라벨, 회계 보고서와 현금 조정, 확률 공동분포/정적 표, 관측 전달과 ACK, 인증 위임/객체 경계, 발달 놀이/출처 연령, 수면 두 과정/참고 구간, 먹기 형태/준비 조건과 모바일 조작을 직접 확인한다. 선행 게시 이후 exact-main 단위/build→선택9 production→Pages→같은 산출물의9 published와 JS/CSS 전체 바이트 대조를 별도로 닫는다. 실제 시스템·실기기·스크린리더 음성·의학/영양 전문가 감수는 미실행으로 남긴다.

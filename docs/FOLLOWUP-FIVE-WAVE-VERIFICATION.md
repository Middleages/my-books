# 다섯 후속 배치 통합 검증

작성: 2026-10-20 UTC. DB D07–08·회계 C05–06·확률 B03–04·관측 B03–04·육아 발달 B03–04의 독립 검증 소스를 합친 후보다. **아직 main/Pages/실제 게시 완료가 아니다.** 새 네 권 A 합본의 실제 게시 게이트가 닫히기 전에 이 후보를 main에 공개하지 않는다. 인증 B와 이 다섯 책의 더 뒤 배치는 포함하지 않는다.

## 보존 기준과 정확한 범위

새4A의 PR51 검증 앱 tree `97d1a12844afbcddcc90c067000cb14877ee9db6`와 최신 문서 마감을 보존한 로컬 `90e713e` 위에 다음 소스를 통합했다. 각 책의 본문·UI·순수 모델·전용 검증기·테스트는 표의 작성자 소스와 바이트가 같음을 경로별로 확인했다.

| 배치 | 작성자 소스와 문서 마감 기준 |
| --- | --- |
| DB D07–08 | 공개 be3ee2647db82fabccacf5a0b8ce5236fcea1e8a와 문서0e352a156f97a0e90c5c4683109e08b745dff21c |
| 회계 C05–06 | 공개 b9187b44e12d1e44e61946529893df3808b206b2와 동일 파일의 로컬 f1644f690882ae1fcade6323ed783f89b2a9df76 |
| 확률 B03–04 | 공개58842af5e97c257b3e201b14efe5eb4de69c3b74와 로컬17508bf18457e25286a16c34bcbbe02614345467, 검증 문서 전용 마감 |
| 관측 B03–04 | 공개faf007c04597de593d146ba1553522562cb70f73와 문서da24962e4fe18f7a42cf2b918caf1136d68b5d75 |
| 육아 발달 B03–04 | 공개c9650d6의 검증 소스와 로컬2737ac3fe7f99ffcb519268c8abd353dce91e486 문서 마감 |

카탈로그는 책별 import·chapter·book 레코드만 합쳤으며 비대상 책의 레코드는 바꾸지 않았다. 현재 후보의 본문 수는 DB8·회계6·확률4·관측4·발달4·인증2·주거12·세금12다. 선행 게시 상태와 이 후보의 준비 상태를 구분한다. 다른 책의 앱과 공용 표지·분야·권차·URL·readId·저장 키, workflow·package·lockfile·suite 등록/선택기는 그대로다.

## 실제 로컬 검증

로컬 앱 소스 `3e6dac9cb29406920099e98e5ea21e0cf32bb438`, tree `641ebd608749d40010a5b3a89fd8e33eae1403a6`에서 모든 테스트 파일을 유지한 `node --test --test-concurrency=4 tests/*.test.mjs` **1225/1225**, TypeScript·Vite **447 modules** build, `git diff --check`를 통과했다. 그 뒤 이 검증 문서 추가는 앱 바이트를 바꾸지 않는다.

JS `index-C-WWcxzg.js` SHA-256 `825846cd000f3e20dbe9af1003ae406379da5e703d4252c63994eca6199abf93`, CSS `index-DCxMGGOC.css` SHA-256 `d7c9dbb3619fd2e8e0c93706df7c52e01b7fca876299b7125ad431b27aa2eddb`다.

실제 diff의 선택 범위는 **book-volumes, database, accounting, probability, observability, child-development 여섯 suite**다. **insurance, investing, tax, kubernetes, housing, authentication 여섯 suite는 이번 후속 실행에서 의도적으로 미실행**이며 통과로 쓰지 않는다. 선택한 suite의 기존 단언·정적 대안·키보드·reduced-motion·원본 캡처는 줄이지 않는다. 전체 단위/build와 공용 홈·권차는 유지한다.

작성자별 source production·직접 원본 검토는 인계 당시 닫혔지만 이 합본의 실제 production·새 원본 검토는 별도 게이트다. main·Pages·정확한 게시 JS/CSS·published 검사는 선행4A 공개 뒤 조율된 창에서 수행한다. 실기기/스크린리더 음성·실제 금융/DB/관측 시스템·의료 진단은 검증하지 않는다.

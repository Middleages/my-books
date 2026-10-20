# DB C · 회계 B · 주거 F 통합 검증

작성: 2026-10-20 UTC. 이 문서는 이번 합본에서 새로 실행한 검증만 기록한다. 각 저자의 기존 source 게이트와 새 main·Pages·실제 게시 게이트는 구별한다. 현재 게시 완료 기록이 아니다.

## 통합 범위와 보존

기준 main은 `d76ed55e9969108449124a154c7c67e946068740`이다. 세금 A→F와 주거 E의 실제 게시, DB B와 회계 A, 기존 URL·readId·저장키·알 수 없는 읽음 ID를 보존한다.

- DB C05–06: 공개 source `840b9138877c015d59505e520d2f6fb66ba2a9d5` 및 문서 마감 `915fe5f4b46bf5480902a052f2d4a4fcec8a2590`.
- 회계 B03–04: 공개 source와 B 자체 검증 기록 `d518ea4972ca848990a09327d046dc49e8217ab8`, 동일 로컬 tree의 `8d02598c5d52741102d32809ab610810cc20f8fd`. 선택적 세션 프롬프트·계획 수정은 포함하지 않는다.
- 주거 F11–12: 공개 앱 source `0d4d564155916357c66ff2e642f0404d4d9867a2`와 문서 마감 `ffce4f0658d0397971770897cd57ba4ac51a0bbf`.

각 책의 본문·모델·UI·기존 브라우저 검증기는 위 검증된 작성자 source와 바이트 단위로 같다. 주거 카탈로그의 장 목록은12개였으나 공개 안내 문구만01–10으로 남은 것을 통합 점검에서 발견해01–12로 바로잡았다. 같은 실수를 막도록12개의 연속 번호·안정된 readId·권차6·공개 안내의 일치 테스트를 추가했다. 실제 공개 후보는 세금12·주거12·DB6·회계4장이며, DB D·회계 C와 신규 책 A는 포함하지 않는다.

영향 선택기는 `book-volumes`, `database`, `housing`, `accounting`4개 전체 suite를 선택한다. `insurance`, `investing`, `tax`, `kubernetes`는 이번 영향 검사에서 제외한다. 공통 workflow·범위 선택기·의존성과 기존8개 suite 등록을 변경하지 않는다. 주거 전체권의 최종 넓은 회귀는 확정된 새 main의 정확한 단일 빌드와 게시 자산으로 별도 수행한다.

## 로컬 검증과 남은 게이트

전체 단위 테스트·TypeScript/Vite build의 최종 결과, 새 PR production·직접 화면 검토, 최신 main 보존·Pages·정확한 실제 공개 자산·주거 전체권 넓은 회귀를 각각 실제 완료 뒤 기록한다. 로컬 Chromium은 실행 환경 제한으로 미실행이며 Actions의 실제 Chromium 캡처를 생성·직접 검토한다. 실제 Safari/Firefox·물리 기기·스크린리더 음성·학습효과 연구는 이 게이트에 포함하지 않는다.

### 최종 로컬 결과

2026-10-20 08:33 UTC에 `node --test --test-concurrency=4 tests/*.test.mjs`의 **1134/1134**와 `npm run build`의 TypeScript·Vite **393 modules**를 통과했다. 모든 기존 파일·단언을 실행했으며 CI 명령이나 기본 동시성은 바꾸지 않았다. 최초 새 작업 트리에 의존성 연결이 없어 난 setup 오류는 앱 실패로 보지 않고, package.json/lock 동일성을 확인해 기존 의존성을 연결한 뒤 깨끗한 단일 로그로 전부 재실행했다.

최종 JS `index-DsaNx52x.js` SHA-256 `42e3024c3a64992ebbd360cb3c32b72e80b7d72570ee3bf0103d1e26517bb163`, CSS `index-f58pl4aP.css` `be5043e056f9ded15ecad6ab7db8aeb0a2e1319bcfad3526864c88669613af78`를 기록했다. 아직 이 새 합본의 hosted production·직접 PNG·main/Pages/live 검증은 하지 않았다. 세금 전체권의 최종 고정-source 회귀가 실제로 끝난 뒤4개 문서 마감284a377도 보존했으며 앱에는 영향을 주지 않는다.

# 세금 배치 A 검증 기록

작성: 2026-10-20. 최종 A 범위: 소개·01–02·권차 표시를 main에 통합하고 Pages 게시·정확한 자산·직접 화면을 확인했다. 원래 main run의 tax 콘솔 판정 실패와 동일 앱 바이트의 집중 재검증을 아래에서 분리한다.

전체권을 로컬에서 선행 교차 검증한 뒤 A→B→C→D→E→F 순서로 공개한다. 각 배치에서 공개하는 장만 카탈로그·본문 링크·읽음 분모에 반영하며 선행 게시 게이트가 닫히기 전에 다음 배치를 공개하지 않는다. 아래 실행 기록이 있는 배치만 게시 완료로 판단한다.

범위·설계·공통 모델 경계는 [전체 점검 기록](TAX-BOOK-REVIEW.md)을 따른다. 해당 배치의 실제 테스트·빌드·production 화면·직접 PNG 검토·CI·Pages·자산 비교는 실행 후 아래에 추가한다.

## 독립 후보의 실행 기록

보험 E `246167308c050d797d00501fb057e2ea61de51b4`를 통합하고 분야별 권차 표시를 함께 검증한다. 세금 공개 후보는 소개·01–02뿐이며 후속 장 링크는 계획 문구로 남긴다. 전체 원고의 별도 review 브랜치는 게시 후보가 아니다.

- 로컬 `npm test`: 794개 통과, 실패 0. 보험 E의 기존 테스트와 권차 표시·세금의 모델/카탈로그 검사를 포함한다.
- `npm run build`: TypeScript와 Vite production 빌드 통과. 기존 큰 번들 경고가 남는다.
- `git diff --check`, 두 browser 스크립트의 구문 검사 통과.
- 실제 브라우저 검사는 PR Actions의 동일 build artifact에서 실행한다. 아직 이 후보의 production·직접 PNG·main·Pages 게이트를 통과한 것으로 기록하지 않는다.

## Production 화면 검증과 직접 검토

- PR [#14](https://github.com/Middleages/my-books/pull/14)의 head `00b63d68b64ea19aec540f0e4fd0082f5b72747d`, 실제 checkout `0d75865db3695aeecab936c5d3dc076dddbf25bb`(변경 파일 없음), run [39356028903](https://github.com/Middleages/my-books/actions/runs/39356028903).
- tax suite: 45개 검사 통과, 0개 실패, 콘솔 오류 0. 1440·850·390·320px, 경계값·같은 모델의 막대/구간 치수·키보드 Tab/방향키·포커스·재생/정지/초기화·reduced-motion·정적 표·기존 링크와 읽음 기록을 검사했다.
- [tax-browser-local artifact](https://github.com/Middleages/my-books/actions/runs/39356028903/artifacts/12235276166): PNG 28개와 results.json. 직접 초기/변경 장면, 전체 본문, 중간폭과 모바일, reduced-motion의 표/포커스를 열었다. 출발·도착은 가로에서 세로로 재배치되고, 구간 띠와 세 구간 막대의 물리적 눈금이 일치한다. 400→0에서 빈 띠·0세액·정의되지 않는 평균세율이 함께 드러난다. 본문은 그림 앞의 정의와 뒤의 관찰·이유·생활 적용·정답 이유·공식 출처를 유지한다.
- 정확한 production 자산: CSS `index-BtYRxD5H.css` SHA-256 `8376b31a6c55b8fe0cf257a4dd0ab6ab08b979ae859e94473100e8ef202a59d5`; JS `index-_fa7X2o7.js` SHA-256 `c8a3b16d5761af00c7288331dd612bc151ebfc7543f879c31fc80f6278858357`. 이는 PR의 로컬 production artifact와 제공 바이트 일치 증거이며 Pages 게시 증거는 아니다.
- 권차 suite는 14개 검사와 30개 직접 PNG 검토를 통과했으며 [별도 기록](BOOK-VOLUMES-VERIFICATION.md)에 있다. 실제 browser: Chromium155.0.8059.39, GitHub Actions Ubuntu. 다른 production 회귀 suite와 main/Pages 게이트는 별도 완료 확인 전이다.

## Main·Pages·실제 게시 검증

- PR #14는 `da333eb71e2e5c5f00ba70bbddb2f36c1ce50b9f`로 main에 반영됐다. tree `9bd8c6ff7170406efa13a121e5e6895055ba770e`. 보험 verifier 수정 a514d0c를 보존했고 로컬 795개 테스트·빌드가 통과했다. 소개·01–02만 공개했고 후속 장·읽음 분모를 조기 공개하지 않았다.
- 정확한 main [run39363793456](https://github.com/Middleages/my-books/actions/runs/39363793456): build와 production 네 suite가 성공하고 [Pages 배포 job118442300758](https://github.com/Middleages/my-books/actions/runs/39363793456/job/118442300758)이 성공했다. 배포 대상은 [세금 소개](https://middleages.github.io/my-books/#/tax)다.
- main tax production:45/45검사,0오류,PNG28개. [artifact12238228288](https://github.com/Middleages/my-books/actions/runs/39363793456/artifacts/12238228288). 게시 tax의 첫 실행도45개 상호작용/자산 검사는 모두 통과했지만, 출처 URL을 저장하지 않은 콘솔 판정에서404 한 건으로 실패했다. [게시 artifact12238474111](https://github.com/Middleages/my-books/actions/runs/39363793456/artifacts/12238474111). 이 원래 job 또는 전체 run을 모두 성공했다고 바꾸어 기록하지 않는다.

### 404의 확인과 동일 앱의 집중 재검증

추정으로 오류를 숨기지 않고 앱 소스를 바꾸지 않은 별도 읽기 전용 진단을 실행했다. [run39366292008](https://github.com/Middleages/my-books/actions/runs/39366292008), 소스 `0c7e089ed712cac5f69ac147d2eea8e0b9457fb1`, [artifact12239636200](https://github.com/Middleages/my-books/actions/runs/39366292008/artifacts/12239636200)은 유일한 콘솔 오류의 정확한 출처가 `https://middleages.github.io/favicon.ico`의404임을 기록했다. 앱 index는 아이콘을 선언하지 않고 검증한 JS/CSS만 불러온다. 이는 브라우저가 호스트 루트에서 자동으로 요청한 기본 아이콘이며 교재의 누락 자산이 아니다.

기존의 ‘메시지 문자열에 favicon이 포함되는가’ 검사를 없애고, 확인한 origin·경로·404 메시지만 `nonApplicationDiagnostics`에 **그대로 보존**한다. 다른 origin·앱 내부 경로·알 수 없는 출처·다른 상태·favicon을 단순 언급한 앱 오류는 모두 실패로 남기는 두 회귀 테스트를 추가했다.

- 집중 게시 [run39366690173](https://github.com/Middleages/my-books/actions/runs/39366690173) 성공. 진단 소스 `b62580b0d454808e2140556d4b40faa00b2dedea`, checkout 변경 없음, Chromium155.0.8059.39. [artifact12239358768](https://github.com/Middleages/my-books/actions/runs/39366690173/artifacts/12239358768).
- 기존45개 검사를 하나도 빼지 않고45/45통과,PNG28개. 애플리케이션/알 수 없는 오류0, 확인한 호스트 기본 아이콘404 진단1건은 별도 기록했다. ‘모든 브라우저 오류0’이라고 주장하지 않는다.
- 정확한 게시 자산은 원래 main production과 이름·바이트·SHA-256이 일치한다. CSS `index-BtYRxD5H.css`(280988bytes): `8376b31a6c55b8fe0cf257a4dd0ab6ab08b979ae859e94473100e8ef202a59d5`; JS `index-_fa7X2o7.js`(2233531bytes): `c8a3b16d5761af00c7288331dd612bc151ebfc7543f879c31fc80f6278858357`. 진단 브랜치의 workflow·verifier만 달라졌고 앱 배포는 다시 하지 않았다.
- 게시 데스크톱 사건 지도·320px 구간 변경·390px reduced-motion/정적 표를 직접 열어 화살표/보유 관계,0값·평균세율 미정의,표의 키보드 포커스와 잘림 없는 본문을 재확인했다. 권차의 production/게시14개 검사와 직접 PNG는 [권차 기록](BOOK-VOLUMES-VERIFICATION.md)에 있다.

2026-10-20 사용자의 검증 범위 조정에 따라 이 verifier-only 문제는 동일 게시 앱의 집중 재검증으로 닫았다. 기존 main run의 다른 책 전체 회귀와 이 A 교재의 게시 완료를 혼동하지 않는다. Safari·Firefox·실제 모바일 기기·스크린리더 음성·학습효과는 미검증이다.

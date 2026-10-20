# 세금 배치 A 검증 기록

작성: 2026-10-20. 상태: 로컬 구현·검증 중, 이 배치의 main·Pages 게시 전.

전체권을 로컬에서 선행 교차 검증한 뒤 A→B→C→D→E→F 순서로 공개한다. 각 배치에서 공개하는 장만 카탈로그·본문 링크·읽음 분모에 반영하며 선행 게시 게이트가 닫히기 전에 다음 배치를 공개하지 않는다. 현재 기록은 선행 게시를 완료했다고 주장하지 않는다.

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

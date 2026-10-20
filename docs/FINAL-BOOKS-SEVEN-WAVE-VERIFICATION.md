# 완결권을 포함한 후속 일곱 배치 통합 검증

2026-10-20. **최신 공개 소스 위의 통합 후보다. 아래 독립 소스 검증과 새 합본·main·Pages 결과를 구분한다. 아직 이 후보의 전체14종 또는 실제 게시 성공을 뜻하지 않는다.**

## 선행 게시와 이번 범위

기준 main은 `d6237bc2449e0c77894cdabe4f7fab75e6143468`, tree `46848403199c145abfc1d47a1370927a5cd24a1f`다. [직전 일곱 배치 기록](FOLLOWUP-SEVEN-WAVE-VERIFICATION.md)의 전체1390 단위/build, 영향8종 production·Pages·published, 정확 자산과 대표42원본 검토가 끝났다. 이번 후보는 그 기록과 공개된 월령 탐색·50개 구체 행동 장면·08–10 연결 보강을 보존한다.

| 책 | 추가 범위 | 독립 실제 source gate | 이번 최종 공개 장수 |
| --- | --- | --- | --- |
| DB | F11–12 + G 편집·선택 SQL 자료 | F run39425306762 644검사, G run39432961184 665검사·765PNG 및 DB105원본 직접 검토 | 12 |
| 확률 | F11–12 + 전체권 검토 | run39424466165 672검사·357PNG, 최종 표시 보강 원본 직접 검토 | 12 |
| 관측 | F11–12 + G 모델 CLI·전체권 검토 | run39416564653 50검사·240PNG, 대표6원본 직접 검토; G 앱 불변 | 12 |
| 인증 | E09–10 | run39415948362 43검사·231PNG, 대표6원본 직접 검토 | 10 |
| 발달 | F11–12 + 빈 인쇄 양식·전체권 검토 | run39399724356 142검사·556PNG; 최신 rich 월령 본문/그림/검증기와 보존 결합 | 12 |
| 수면 | D07–08 | run39427396855 82검사·165PNG, 대표 원본 직접 검토 | 8 |
| 먹기 | D07–08 | run39429085447 74검사·165PNG, 대표5원본 직접 검토 | 8 |

이 표는 각 독립 소스의 과거 검증이며 합본 결과로 세지 않는다. 전체 사이트는17권183장이다. 회계F는 직전 main에서 소개+12장 게시 확인을 마쳤고, 이 최종 전체 회귀가 끝나기 전에는 전체권 마감 회귀 대기 상태다. 인증F·수면E 이후·먹기E 이후·신규 육아4–6 등록은 이 후보에 포함하지 않는다.

## 보존·통합 증명

- DB·확률·관측·인증·수면·먹기의 본문/컴포넌트/모델/전용 검증기는 각각 인계된 최종 검증 소스와 바이트 동일하다. DB G의 임시 focused workflow는 제외했다. 실제 SQL·두 세션·백업/복구는 실행하지 않았다.
- 발달11·12의 새 소스는 검증 F와 동일하다. 최신 소개/02/08–10·50장면 모델을 보존하고 F의 CSS/브라우저 assertion을 합집합으로 추가했다. 같은 월령 모델을 별도 복제하지 않는다. 빈 관찰 양식도 검증된 원본과 동일하며 실제 아이 입력이나 서버 전송 기능이 아니다.
- 카탈로그는 대상7개 book의 imports/장/행만 갱신했다. 다른10권과 shared 정의·권차·readId는 그대로이며 등록된14종 목록과 기존 workflow/package/BookCover를 변경하지 않았다.
- 각 independent source의 GitHub 공개 commit/tree를 직접 읽어 로컬 정본과 대조했다. 재사용 blob과 새 합본 문서·카탈로그/발달 합집합 변경을 구분한다. 타책의 미게시 후속 전체 tree로 덮어쓰지 않았다.
- 최초 로컬 통합 preflight의1453통과/3실패는 새 worktree 의존성 링크가 빠진 두 렌더 test file과 빠진 빈 양식 파일을 발견한 기록이다. 기존 신뢰 의존성 링크·검증 원본 양식을 복원한 뒤 집중12/12를 통과했다. 실패를 성공으로 소급하지 않고 최종 전체 단위/build를 다시 검사한다.

## 실제 선택 범위와 마감 조건

기존 보수적 분류기는 `examples/database/*`와 `examples/observability/*` 자료를 보고 **14종 전체**를 선택한다. 분류기를 좁히거나 임시 경로로 속이지 않는다. 선택은 insurance, investing, tax, book-volumes, database, kubernetes, housing, accounting, probability, observability, child-development, authentication, child-sleep, child-feeding이며 생략은0이다.

새 합본 PR의 전체 단위/build·14종 production·새 대표 원본 직접 검토를 먼저 확인한다. 그 뒤 main의 정확한 단일 build로14종 production→Pages→14종 published를 확인한다. main 전후 고정, source/tree·clean, 모든 실행 결과, HTML 및 전체 JS/CSS 바이트와 해시가 일치하고 변경 장면·전체권 대표 원본까지 읽은 경우 이 같은 실행으로 DB·확률·관측·발달 및 직전 회계의 최종 넓은 회귀를 함께 마감할 수 있다. 동일 최종 source의 실제14×2를 다시 중복 실행할 필요는 없지만, 아직 실행되지 않은 검사나 생략을 성공으로 세지 않는다.

PNG는 API digest와 원본 ZIP을 보존하고 직접 읽을 대표 파일만 선택 추출한다. native crop은 원본 개수에 더하지 않는다. 앱 오류와 정확히 알려진 호스트 기본 favicon404의 별도 진단을 혼합하지 않는다. 실기기·스크린리더 음성·임상 감수·실제 DB/SSO/관측 제품 스택·개인 세무/투자 상담은 이 검증에 포함하지 않는다.

## 최종 로컬 합본 사전 검증

2026-10-20 14:17–14:25 UTC에 `NODE_OPTIONS=--max-old-space-size=2048 node --test --test-concurrency=4 tests/*.test.mjs` 전체 **1469/1469**, 실패·취소·skip0과 같은 메모리 한도의 `npm run build` TypeScript/Vite **597 modules**를 통과했다. Vite의 큰 공통 번들 경고는 남아 있으며 오류로 숨기거나 최적화 완료로 주장하지 않는다. 상대 링크·diff 검사,7책별 검증 앱 바이트/비대상 partition 보존, 관측 순수 모델 CLI도 통과했다.

- `index-C6a9U6nC.js` 4200545bytes · SHA256 `d76b797f15b9d1457fb9126ef6c758fa76bb127db3a528f34b539d939defb089`
- `index-mnfpKsn1.css` 471964bytes · SHA256 `1b2f2554e634e5705973c578c45908be8868ec727db3c5069cc787ea53e43778`

이는 로컬 production 산출물 기준이며 실제 Chromium PR 검증 및 main/Pages/published는 아직 실행 전이다. 최종 게시 때 이 자산 또는 이후 명시적으로 재검증한 자산과 정확히 대조한다.

# 육아 4·5권 C 통합 검증 — 2026-10-20

기준은 B 통합 local `c0367405b421d3deb4dd28515c3d45b415eb5763`, tree `a4df4f1dec2cf984a59ae9dd1de1c011710165f9`다. 두 권에 각각 05–06장만 더하는 로컬 후보이며, 소개·01–06의 각 6장과 전체 19권 205장을 대상으로 한다. D 이후와 육아 6권은 포함하지 않는다.

## 정확 소스와 보존 범위

- 감정 C: local `a93f81eb1b38abddcf50763e5ddebfed5980cf89`, tree `9643f5d986a1fc583eadfc7cda7ddc879e8bd115`. B `61c44db4c44d4ba553de7faf402c7b14f3c664aa` 이후의 gentle-boundaries, intense-emotions만 추가한다.
- 안전 C: local `58b5a7419872f81cc6c6540029c3f47112661b81`, tree `54b7e5da66715466c9ff2fc86ee1907d46435cf6`. B `5530e9c6c8506884a2fc186946ed656148b55c29` 이후의 water-supervision, burn-prevention만 추가한다.

전용 22파일은 지정한 소스 바이트를 그대로 사용하고, catalog는 두 권의 import·장·책 레코드만 갱신한다. 기존 17권의 원시 레코드·import·AST, 선행 201개 readId와 장 레코드, 공통 선언·category·helper를 보존한다. HOME·전역지침·workflow·selector와 이전 검증 문서는 변경하지 않는다.

## 검사와 아직 남은 게이트

읽기 감사 51항목에서 정확 바이트·등록·보존을 확인했고 기존 selector를 실행해 book-volumes, child-emotions, child-safety의 영향 3종 선택과 비대상 13종 생략을 확인했다. 생략한 suite는 이번 통과가 아니다.

테스트 입력 tree `f05cd1fe760dd9c3057902d9c281211f0e54adf3`에서 `node --test --test-concurrency=4 tests/*.test.mjs` 전체 1,514/1,514 통과(fail/cancelled/skipped/todo 0), 이어서 `NODE_OPTIONS=--max-old-space-size=2048 npm run build`의 TypeScript/Vite 빌드가 성공했다. 단일 순차 실행이며 기존 대형 chunk 안내 외 빌드 오류는 없었다. 실행 뒤 바뀐 것은 이 검증 문서의 결과 기록뿐이다.

소스 C의 기존 개별 게이트와 이 합본의 검증은 별개다. 합본 PR production 3종·원본 PNG 직접 검토, 선행 B 실제 게시 완료 확인, main lease·Pages·published 3종·정확 자산 검증은 아직 대기 중이다. 이 문서는 로컬 후보의 원격 반영이나 게시 완료를 선언하지 않는다. 임상·의료·안전 전문가 감수, 실제 기기·스크린리더 음성·학습 효과 검증은 미실행이다.

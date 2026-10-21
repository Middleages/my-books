# Family batch D: local candidate verification

Date: 2026-10-21 (UTC). Base: `bfb053228be49ce1a512364ca3eceb749618b1ed` (family A). Scope: 07 `before-new-sibling`, 08 `living-with-sibling` only. This record does not assert publication or final acceptance.

## Source and content boundary

Independently opened F3 directly on 2026-10-21: https://www.healthychildren.org/English/ages-stages/prenatal/Pages/Preparing-Your-Family-for-a-New-Baby.aspx . Its current title is *Preparing Your Older Child for a New Baby: How to Help Siblings Adjust* and displayed update is 2026-02-10. Read its 1–2-year and 2–4-year sections; narrow the latter to 2–3. Only family changes, explanations, adult attention and individual time inform the chapters. No 5+ guidance, infant handling instructions, jealousy cure, adaptation deadline, diagnosis or prediction. Source metadata is in `sibling.mjs`. Scenarios/geometry are original. No actual personal data, external state mutation or messaging.

## Visual design

07 asks which connections change before/after arrival. Fixed pre-arrival adult/child map and post-arrival map use stable positions; adult circles and child/baby shapes have distinct borders. Adult-to-child lines change when an explicitly synthetic support acceptance is chosen. Age changes explanations but not acceptance. Two panels become vertically stacked on narrow screens. Time and place explanations come from the same scene as the connections.

08 asks which adult connects to each need. The single-adult fork is compared with a two-adult crossing connection. Both child needs remain in either state; the accompanying need-to-adult chains preserve that invariant. No child-to-baby responsibility edge exists. The diagram does not claim simultaneous task completion, separate rooms, required support availability or time/affection proportions.

All visible labels are HTML, not shrinking SVG text. Drawing height is fixed and labels remain 14px at narrow widths. SVG holds relation lines only; their textual equivalent is adjacent and also in an expandable alternative. Select/buttons use native keyboard behavior and explicit focus styles. There is no animation, autoplay or timer. Reset restores age and option. Facts, hypotheses, unknowns and source IDs are explicit in the model.

## Local checks

- `node --test tests/child-family-sibling.test.mjs`: 5 passed, 0 failed. Age boundary, source date, fixed before-map, pending/accepted connection, both child needs, adult-only responsibility, deterministic reset and mutation isolation.
- `npm test`: 1552 passed, 0 failed (full A-base suite plus D; log retained by the integrator).
- `./node_modules/.bin/tsc --noEmit`: completed exit 0; started before the later resource restriction. No full TypeScript or build was started after that restriction.
- Narrow final component check: `NODE_OPTIONS=--max-old-space-size=2048 ./node_modules/.bin/tsc --noEmit --strict --skipLibCheck --target ES2022 --lib ES2022,DOM,DOM.Iterable --module ESNext --moduleResolution Bundler --jsx react-jsx src/components/child-family/SiblingLabs.tsx`: exit 0.
- `git diff --check`: passed.
- Shared `family.css`, catalog, Intro, plan status, sources overview and browser verifier are deliberately unchanged to avoid clobbering B/C integration.
- No heavy build or browser executed by this worker, as assigned. No remote writes. Browser interaction, 320/390/850/1440 rendering, original PNG review, keyboard focus, reduced-motion, MDX build/render, reading-state regression, source PR, main, Actions, Pages and exact live-byte checks remain for the serial integrator.
- Independent expert review and real-world usability/effectiveness evaluation are not performed.

## Integration

Add dedicated MDX imports and chapters 07/08 after B/C. Update introduction/public scope to the implemented sequence only. Scratch catalog/browser snippets are supplied separately to the parent, not committed as active verifier code. The production verifier must test changed path geometry, unchanged paths on age-only change, both needs, static equivalence, reset, unknowns and original PNGs; retain earlier A/B/C and other-book regressions. A test pass does not substitute for visual explanation review.

## 직렬 통합 후보 검사 (2026-10-21)
C 통합 후보 `fb06df9325536076461fc846553de071cc97c9bb` 위에 D를 통합하고 소개·카탈로그를 01–08로 맞췄다. `NODE_OPTIONS=--max-old-space-size=2048 node --test --test-concurrency=4 tests/*.test.mjs`: 1564/1564 통과. 같은 메모리 한도의 전체 `npm run build`: 통과. 브라우저 스크립트 구문·diff 검사 통과. 나이별 실제 설명 변경/역할 기하 불변, 역할 분담 후 아이 필요 보존/정적 문장 일치, 모든 장 읽음 표시·취소·다시 읽음 및 이전 ID 보존 검사를 추가했다. 로컬 브라우저·원본 PNG·CI·Pages·live 검증은 아직 미실행이다.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import diagnostics from '../scripts/probability-browser-diagnostics.cjs';
const source = readFileSync(new URL('../scripts/probability-browser-qa.cjs', import.meta.url), 'utf8');
test('probability verifier records exact source/assets and full responsive interaction coverage', () => {
  for (const fragment of ['sourceSha', 'sourceTree', 'sourceChanges', 'sha256', '[1440,390,320]', '[768,900]', "reducedMotion:'reduce'", "reducedMotion:'no-preference'", 'assertDistribution', 'assertLoss', 'unknown/keep', 'pageErrors', 'consoleErrors', 'resourceErrors', 'static alternative', 'setting changes cancel playback', 'same dist', 'PNGs require a separate direct visual review']) {
    if (fragment === 'same dist') assert(source.includes('exact published HTML and full asset bytes match this dist'));
    else assert(source.includes(fragment), fragment);
  }
  assert(!source.includes('assertBars('));
});
test('only the exact known published host favicon404 is separated; unknown and app failures remain errors', () => {
  const base = 'https://middleages.github.io/my-books/';
  assert.equal(diagnostics.classifyDiagnostic({ type: 'response', url: 'https://middleages.github.io/favicon.ico', status: 404 }, base).kind, 'host-default-favicon-404');
  for (const entry of [{ type: 'response', url: base + 'favicon.ico', status: 404 }, { type: 'response', url: base + 'assets/a.js', status: 404 }, { type: 'console', message: 'Failed to load resource: the server responded with a status of 404' }, { type: 'response', url: 'https://middleages.github.io/favicon.ico', status: 500 }]) assert.equal(diagnostics.classifyDiagnostic(entry, base).kind, 'application');
});

test('probability MDX renders Korean emphasis without raw delimiters', async () => {
  const { evaluate } = await import('@mdx-js/mdx');
  const runtime = await import('react/jsx-runtime');
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { default: remarkGfm } = await import('remark-gfm');
  for (const file of ['Intro', 'AveragesDistributions', 'LossesLiquidity', 'FrequencyProbability', 'ConditionalEvidence', 'SamplesVariation', 'IntervalsPrediction', 'AssociationCauses', 'DependenceDiversification','SelectionSurvivors','SearchValidation']) {
    const mdx = readFileSync(new URL(`../src/content/probability/${file}.mdx`, import.meta.url), 'utf8').replace(/^import .+;\n/gm, '');
    const { default: Content } = await evaluate(mdx, { ...runtime, remarkPlugins: [remarkGfm] });
    const html = renderToStaticMarkup(createElement(Content, { components: { Check: () => null, ProbabilityPrimer: () => null, DistributionLab: () => null, LossLiquidityLab: () => null, FrequencyLab: () => null, ConditionalLab: () => null, SamplingLab: () => null, IntervalLab: () => null, AssociationLab: () => null, DependenceLab: () => null, SelectionLab: () => null, SearchValidationLab: () => null } }));
    assert(!html.includes('**'), file);
    assert(!html.includes('<del>'), file);
    if (file === 'AveragesDistributions') assert(html.includes('<strong>사분위 범위(IQR)</strong>'));
  }
});

test('all financial case selectors have stable accessible names matching their visible labels', () => {
  const component = readFileSync(new URL('../src/components/probability/FoundationLabs.tsx', import.meta.url), 'utf8');
  for (const label of ['꼬리 집단의 큰 지출 한 건', '같은 폭의 지출 구간', '처음 준비한 현금', '지출 납기']) assert(component.includes(`<select aria-label="${label}"`), label);
});

test('B verifier retains A assertions and validates actual frequency/count geometry and zero-denominator alternatives',()=>{for(const fragment of ['assertDistribution','assertLoss','assertFrequency','assertConditional','all prefix frames','preserves cells and chosen denominator','full static n1000','B route unmount','B normal motion','recordSeen','data-selected-denominator'])assert(source.includes(fragment),fragment);const ui=readFileSync(new URL('../src/components/probability/EvidenceLabs.tsx',import.meta.url),'utf8');for(const label of ['모형의 전체 건수','모형의 1건당 지연 확률','고정 가상 기록 번호','전체 중 실제 오류','가상 알림 규칙'])assert(ui.includes('aria-label="'+label+'"'),label);assert(ui.includes('0÷0'));assert(ui.includes('0.0001% 미만 · 0 아님'));assert(!ui.includes('Math.random'));});
test('C verifier keeps previous contracts and compares rendered sampling and interval geometry',()=>{for(const fragment of['assertSampling','assertIntervals','identity and mean geometry','exact targets and geometry','C route unmount','C normal motion','data-theoretical-se','data-coverage-kind','data-height-fraction'])assert(source.includes(fragment),fragment);const ui=readFileSync(new URL('../src/components/probability/SamplingLabs.tsx',import.meta.url),'utf8');for(const label of['가상 가구 모집단','기록을 고르는 방식','한 표본의 기록 수','고정 표본 번호','구간 자료의 종류','구간의 표본 크기','구간의 명목 수준','알려진 모집단 표준편차','고정 구간 기록 번호'])assert(ui.includes('aria-label="'+label+'"'),label);assert(!ui.includes('Math.random'));assert(ui.includes('적용하지 않음'));assert(ui.includes('새 결과는 이 표본에 포함하지 않음'));});
test('D verifier retains A-C checks and validates weighted bars, probability cells, and nonlinear geometry',()=>{for(const fragment of['assertAssociation','assertDependence','assertNativeOptionsFit','unchanged observations and real weighted geometry','fixed marginals and monetary geometry','D route unmount','D normal motion','data-causal-estimate','data-probability-cell','data-nonlinear-index','Static table text must not overlap another cell','Keyboard must move the static table','dependence-static-end'])assert(source.includes(fragment),fragment);const ui=readFileSync(new URL('../src/components/probability/RelationsLabs.tsx',import.meta.url),'utf8');for(const label of['평균과 인과효과 예측','비교용 비수기 비중','둘 다 손실 날 확률 가정','기대손실과 공동 손실 예측','A 최초 보유 비중','비선형 반례의 A 결과'])assert(ui.includes('aria-label="'+label+'"'),label);assert(!ui.includes('Math.random'));assert(ui.includes('납부 의무나 파산 기준')||ui.includes('지출 실패나 법적 파산'));assert(ui.includes('인과효과: 판정 불가'));});
test('E verifier checks cohort membership, missing values, all noise records and sticky held-out history',()=>{for(const fragment of['assertSelection','assertValidation','preserved denominator and amount geometry','future values masked','manual lock-reveal protocol','reusing seen holdout','E route unmount','E normal motion','data-cohort-fraction','data-return-width','data-noise-period','data-holdout-seen','validation-static-end'])assert(source.includes(fragment),fragment);const ui=readFileSync(new URL('../src/components/probability/SelectionLabs.tsx',import.meta.url),'utf8');for(const label of['성과에 포함할 목록','종료 회수액의 정보','존속자 평균 예측','처음 비교한 후보 수','후보 기록의 관계','최종 후보 선택 기준','선택과 보류 성과 예측'])assert(ui.includes('aria-label="'+label+'"'),label);assert(ui.includes('holdoutSeenInPage'));assert(ui.includes('95% 신뢰구간 아님'));assert(!ui.includes('Math.random'));});

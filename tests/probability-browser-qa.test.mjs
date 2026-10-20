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
  for (const file of ['Intro', 'AveragesDistributions', 'LossesLiquidity', 'FrequencyProbability', 'ConditionalEvidence']) {
    const mdx = readFileSync(new URL(`../src/content/probability/${file}.mdx`, import.meta.url), 'utf8').replace(/^import .+;\n/gm, '');
    const { default: Content } = await evaluate(mdx, { ...runtime, remarkPlugins: [remarkGfm] });
    const html = renderToStaticMarkup(createElement(Content, { components: { Check: () => null, ProbabilityPrimer: () => null, DistributionLab: () => null, LossLiquidityLab: () => null, FrequencyLab: () => null, ConditionalLab: () => null } }));
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

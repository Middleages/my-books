import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { pathsModel } from '../src/simulations/probability/paths.mjs';
import { decisionsModel } from '../src/simulations/probability/decisions.mjs';

// Only hook state/effects are supplied by this harness. The real TSX, models,
// formatter and static tables render unchanged. This proves text at every
// authored state, not browser layout, event handling or timer behavior.
let server, ui, hooks;
before(async () => {
  const id = 'virtual:probability-render-state';
  server = await createServer({ appType: 'custom', logLevel: 'error', server: { middlewareMode: true, watch: null }, optimizeDeps: { noDiscovery: true, entries: [] }, plugins: [{
    name: 'probability-state-render-harness', enforce: 'pre',
    resolveId(source) { if (source === id) return '\0' + id; },
    load(source) { if (source === '\0' + id) return `let states=[],index=0; export function configure(values){states=values;index=0;} export function consumed(){return index;} export function useState(){if(index>=states.length)throw Error('Unexpected hook state');return [states[index++],()=>{}];} export function useMemo(fn){return fn();} export function useEffect(){}`; },
    transform(code, source) { if (/\/src\/components\/probability\/(DecisionLabs|shared)\.tsx$/.test(source)) return code.replace(/from ['"]react['"]/g, `from '${id}'`); },
  }] });
  ui = await server.ssrLoadModule('/src/components/probability/DecisionLabs.tsx');
  hooks = await server.ssrLoadModule(id);
});
after(async () => { await server?.close(); });
function render(name, params, step) {
  hooks.configure([params, '', step, false]);
  const html = renderToStaticMarkup(createElement(ui[name]));
  assert.equal(hooks.consumed(), 4);
  assert(!html.includes('NaN'));
  assert(!/<td\b[^>]*>-0<\/td>/.test(html), 'Static numeric zero must not have a minus sign');
  const text = html.replace(/<[^>]*>/g, '');
  assert(!text.includes('실제 지출 -0단위'), 'Visible payment text must not negate zero');
  return { html, text };
}
test('F actual TSX text: all45 path states preserve exact payment labels and zero/null distinctions', () => {
  for (const withdrawal of [0, 30, 40]) for (const periods of [2, 4, 6]) for (let step = 0; step < 5; step++) {
    const params = { withdrawal, periods }, model = pathsModel(params), { html, text } = render('PathsLab', params, step);
    const actual = text.match(/실제 지출 [\d,.]+단위/g) ?? [];
    const expected = model.comparison.flatMap(p => p.stages.filter(s => s.index <= step && s.kind === 'payment').map(s => `실제 지출 ${Math.abs(s.applied).toLocaleString('ko-KR', { maximumFractionDigits: 4 })}단위`));
    assert.deepEqual(actual, expected, JSON.stringify({ params, step }));
    assert.equal((html.match(/data-static-ensemble=/g) ?? []).length, 2 ** periods);
    assert.equal((html.match(/data-path-status="pending"/g) ?? []).length, (4 - step) * 2);
    if (withdrawal === 40 && step === 4) { assert(text.includes('부족 20단위 · 지급 전 중단')); assert(text.includes('실제 지출 0단위')); }
  }
});
test('F actual TSX text: all96 decision states preserve known8, zero cost and unknown probability/cash', () => {
  const cases = [
    { probability: 'narrow', p: .05, cash: 20, deadline: 'confirmed' }, { probability: 'narrow', p: .08, cash: 8, deadline: 'confirmed' },
    { probability: 'narrow', p: .2, cash: 0, deadline: 'confirmed' }, { probability: 'wide', p: 0, cash: 100, deadline: 'confirmed' },
    { probability: 'wide', p: 1, cash: 20, deadline: 'confirmed' }, { probability: 'unknown', p: .08, cash: 20, deadline: 'confirmed' },
    { probability: 'narrow', p: .08, cash: 20, deadline: 'unconfirmed' }, { probability: 'unknown', p: .08, cash: 0, deadline: 'unconfirmed' },
  ];
  for (const claim of ['loss', 'alarm', 'performance']) for (const state of cases) for (let step = 0; step < 4; step++) {
    const params = { ...state, claim }, model = decisionsModel(params), { html, text } = render('DecisionsLab', params, step);
    assert(!text.includes('-0단위'));
    assert.equal((html.match(/data-static-cost=/g) ?? []).length, 4);
    if (step >= 1) for (const choice of model.costs.choices) assert(html.includes(`data-expected-cost="${choice.expected ?? 'unknown'}"`));
    if (state.probability === 'unknown' && step >= 1) { assert(text.includes('기대비용 8단위')); assert(text.includes('기대비용 확정 불가')); assert(text.includes('기대비용 순위: 확정 불가')); }
    if (state.deadline === 'unconfirmed' && step >= 2) assert.equal((text.match(/시점 미확인 · 부족액 확정 불가/g) ?? []).length, 4);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { projectPayout } from '../src/simulations/insurance/payout.mjs';

test('insurance B SSR keeps overview distinct and payout static columns aligned across all six frames', async () => {
  const server=await createServer({server:{middlewareMode:true,watch:null},appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]}});
  try {
    const {PayoutLab,PayoutOverview}=await server.ssrLoadModule('/src/components/insurance/PayoutLab.tsx');
    const overview=renderToStaticMarkup(createElement(PayoutOverview));
    assert(!/class="[^"]*\binsurance-lab\b/.test(overview));
    assert.match(overview,/data-payout-segment="paid" data-amount="2000000"/);
    const html=renderToStaticMarkup(createElement(PayoutLab));
    assert.equal((html.match(/class="insurance-result(?: warning)?\s*"/g)||[]).length,1);
    const table=html.match(/<table><caption>금액은 만원[\s\S]*?<\/table>/)?.[0];
    assert(table,'full frame table is present without playback');
    assert.equal((table.match(/<thead>[\s\S]*?<\/thead>/)[0].match(/<th>/g)||[]).length,9);
    const rows=[...table.matchAll(/<tr data-static-payout="([^"]+)">([\s\S]*?)<\/tr>/g)];
    const result=projectPayout();
    assert.equal(rows.length,result.frames.length);
    rows.forEach((row,index)=>{
      assert.equal(row[1],result.frames[index].phase);
      assert.equal((row[2].match(/<(?:th|td)>/g)||[]).length,9,`${row[1]} has the same columns including unresolved`);
      const values=[...row[2].matchAll(/<td>([^<]*)<\/td>/g)].map(cell=>Number(cell[1].replaceAll(',','')));
      const expected=result.frames[0].segments.map(segment=>(result.frames[index].segments.find(item=>item.id===segment.id)?.amount??0)/10000);
      assert.deepEqual(values,[...expected,result.params.loss/10000]);
    });
    assert.match(html,/data-payout-annual-used="true" data-value="0"/);
    assert.match(html,/data-payout-fixed-lane="true"/);
  } finally {await server.close();}
});

test('insurance contract SSR shows grouped roles and neutral prediction feedback before the final frame', async () => {
  const server=await createServer({server:{middlewareMode:true,watch:null},appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]}});
  try {
    const {ContractMapLab}=await server.ssrLoadModule('/src/components/insurance/ContractMapLab.tsx');
    const html=renderToStaticMarkup(createElement(ContractMapLab));
    assert.equal((html.match(/data-contract-person="person-/g)||[]).length,3);
    assert.equal((html.match(/data-contract-role="/g)||[]).length,3);
    assert.match(html,/data-contract-edge="premium" data-from="person-1" data-to="insurer"/);
    assert.match(html,/data-contract-edge="payout" data-from="insurer" data-to="person-3"/);
    const feedback=html.match(/<p class="insurance-result"[^>]*>(.*?)<\/p>/)?.[1];
    assert(feedback);assert.match(feedback,/예측을 고른 뒤/);assert(!feedback.includes('보험수익자가 다릅니다'));
    assert.equal((html.match(/data-contract-event="/g)||[]).length,4);
    assert.equal((html.match(/data-contract-source="/g)||[]).length,3);
  } finally {await server.close();}
});


test('reader content track can shrink below open static-table min-content at the 850px sidebar breakpoint', () => {
  const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
  const base=css.match(/\.reader\s*\{([^}]+)\}/)?.[1];
  assert(base,'base reader layout exists');
  assert.match(base,/grid-template-columns:\s*250px\s+minmax\(0,\s*1fr\)/);
  const intermediate=css.match(/@media\s*\(max-width:\s*850px\)\s*\{\s*\.reader\s*\{([^}]+)\}/)?.[1];
  assert(intermediate,'tablet sidebar breakpoint exists');
  assert.match(intermediate,/grid-template-columns:\s*200px\s+minmax\(0,\s*1fr\)/,
    'A bare 1fr has an auto minimum: opened nowrap tables must scroll inside their region, not widen the page.');
  const insurance=readFileSync(new URL('../src/components/insurance/insurance.css',import.meta.url),'utf8');
  assert.match(insurance,/\.insurance-table\s*\{[^}]*overflow:auto/,'table content remains accessible by scrolling');
  assert(!/overflow(?:-x)?:\s*(?:hidden|clip)/.test(intermediate),'do not mask intrinsic overflow by clipping');
});

test('uncertain insured reference keeps a dashed non-money stroke and the existing question overlay', () => {
  const css=readFileSync(new URL('../src/components/insurance/contract-map.css',import.meta.url),'utf8');
  const uncertain=css.match(/\.contract-edge\.unconfirmed i\{([^}]+)\}/);
  const reference=css.match(/\.contract-edge\.reference\.unconfirmed i\{([^}]+)\}/);
  assert(uncertain && reference);
  assert.match(uncertain[1],/background:linear-gradient/,'uncertain money edges retain broken solid strokes');
  assert.match(reference[1],/background:none/,'the non-money reference must not inherit the solid gradient');
  assert.match(reference[1],/border-top:2px dashed currentColor/);
  assert.match(css,/\.contract-edge\.reference\.unconfirmed\.active i\{border-top-width:4px\}/,'active reference highlight preserves the dashed style');
  assert.match(css,/\.contract-edge\.unconfirmed i:before\{content:'\?'/,'uncertainty remains marked by a visible question overlay');
});

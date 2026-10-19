import test from 'node:test';
import assert from 'node:assert/strict';
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

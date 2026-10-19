import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { projectConditions, conditionsBoundaryCases } from '../src/simulations/insurance/conditions.mjs';
import { projectOverlap, overlapScenarios } from '../src/simulations/insurance/overlap.mjs';
const won=v=>v===null?'미정':`${(v/10000).toLocaleString('ko-KR',{maximumFractionDigits:2})}만원`;
const text=html=>html.replace(/<[^>]*>/g,'');
const cells=row=>[...row.matchAll(/<(?:td|th)>([\s\S]*?)<\/(?:td|th)>/g)].map(m=>text(m[1]));
async function render(module,name){const server=await createServer({server:{middlewareMode:true,watch:null},appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]}});try{const m=await server.ssrLoadModule(module);return renderToStaticMarkup(createElement(m[name]));}finally{await server.close();}}

test('conditions SSR keeps all timeline geometry and neutral initial frame from the pure model',async()=>{
  const html=await render('/src/components/insurance/CoverageConditionsLab.tsx','CoverageConditionsLab'),r=projectConditions();
  assert.match(html,/data-insurance-lab="coverage-conditions"/);assert.match(html,/data-insurance-stage="reference"/);assert.match(html,/data-conditions-status="pending"/);assert.match(html,/data-conditions-paid="true" data-value="unresolved">미정/);
  for(const m of r.timeline.markers)assert(html.includes(`data-conditions-marker="${m.id}" data-day="${m.day}" data-fraction="${m.fraction}"`));
  for(const p of r.timeline.periods)assert(html.includes(`data-conditions-period="${p.id}" data-start="${p.start}" data-end="${p.end}" data-fraction="${p.fraction}"`));
  assert.equal((html.match(/data-conditions-gate="[^"]+" data-state="pending"/g)||[]).length,4);
  assert.equal((html.match(/aria-current="step"/g)||[]).length,1);
  const feedback=html.match(/<p class="insurance-result[^"]*"[^>]*>([\s\S]*?)<\/p>/)?.[1];assert.match(feedback,/관찰 중인 금액은 미정/);assert(!feedback.includes('대기기간입니다'));
});
test('conditions SSR full step table and exact boundary table use corresponding model rows',async()=>{
  const html=await render('/src/components/insurance/CoverageConditionsLab.tsx','CoverageConditionsLab');
  const r=projectConditions(),rows=[...html.matchAll(/<tr data-static-conditions="([^"]+)">([\s\S]*?)<\/tr>/g)];assert.equal(rows.length,r.frames.length);
  rows.forEach((row,i)=>{const c=cells(row[2]),f=r.frames[i];assert.equal(row[1],f.phase);assert.equal(c.length,7);assert.equal(c[0],f.label);assert.equal(c[5],f.statusLabel);assert.equal(c[6],won(f.benefit));});
  const boundaries=[...html.matchAll(/<tr data-conditions-boundary-row="([^"]+)">([\s\S]*?)<\/tr>/g)],expected=conditionsBoundaryCases();assert.equal(boundaries.length,expected.length);
  boundaries.forEach((row,i)=>{const c=cells(row[2]),b=expected[i];assert.equal(Number(row[1]),b.params.eventDay);assert.deepEqual(c,[`${b.params.eventDay}일`,'400일',b.statusLabel,`${b.rate*100}%`,won(b.benefit)]);});
  assert.equal((html.match(/role="region" aria-label="[^"]+" tabindex="0"/g)||[]).length,2);
});
test('overlap SSR has one loss region, staged null amounts, and separate conditional promise lanes',async()=>{
  const html=await render('/src/components/insurance/OverlapLab.tsx','OverlapLab'),r=projectOverlap();
  assert.equal((html.match(/data-overlap-lossbar="true"/g)||[]).length,1);assert.equal((html.match(/data-overlap-fixed-lane="/g)||[]).length,2);
  for(const id of ['a','b','total'])assert(html.includes(`data-overlap-paid-${id}="true" data-value="unresolved">미정`));
  for(const id of ['a','b','total'])assert(html.includes(`data-overlap-fixed-${id}="true" data-value="unresolved">미정`));
  const bar=html.match(/<div class="overlap-lossbar"[\s\S]*?<\/div>/)?.[0];assert(bar);assert(!bar.includes('fixed'));
  for(const s of r.frames[0].segments)assert(bar.includes(`data-overlap-segment="${s.id}" data-amount="${s.amount}" data-fraction="${s.fraction}" data-left="${s.leftFraction}"`));
  assert.equal((html.match(/aria-current="step"/g)||[]).length,1);assert.match(html,/예측을 고른 뒤 한 손실/);
});
test('overlap SSR all stage and scenario cells agree with model-derived partitions',async()=>{
  const html=await render('/src/components/insurance/OverlapLab.tsx','OverlapLab'),r=projectOverlap();
  const rows=[...html.matchAll(/<tr data-static-overlap="([^"]+)">([\s\S]*?)<\/tr>/g)];assert.equal(rows.length,5);
  rows.forEach((row,i)=>{const f=r.frames[i];assert.equal(row[1],f.phase);assert.deepEqual(cells(row[2]),[f.label,...f.segments.map(s=>won(s.amount)),won(f.totalPaid),won(f.fixedTotal)]);});
  const cases=[...html.matchAll(/<tr data-overlap-scenario="([^"]+)">([\s\S]*?)<\/tr>/g)],expected=overlapScenarios();assert.equal(cases.length,expected.length);cases.forEach((row,i)=>{const {label,result:s}=expected[i];assert.deepEqual(cells(row[2]),[label,...[s.params.grossLoss,s.outside,s.eligibleLoss,s.eligibleCapA,s.eligibleCapB,s.paidA,s.paidB,s.totalPaid,s.gap].map(won)]);});
  assert.equal((html.match(/role="region" aria-label="[^"]+" tabindex="0"/g)||[]).length,3);
});
test('C MDX raw render has goals, source dates, reasoned checks and no malformed paragraphs',async()=>{
  for(const name of ['CoverageConditions','Overlap']){
    const html=await render(`/src/content/insurance/${name}.mdx`,'default');assert.match(html,/learning-goals/);assert.match(html,/2026-10-20/);assert(!html.includes('**'));assert(!/<p[^>]*>\s*<p\b/.test(html));assert(!/<del\b/.test(html));assert(!/href="#\/insurance\/(timelines|surrender|claims|reading-insurance)/.test(html));assert(html.length>10000);
  }
});
test('C styling preserves zero-width capacities, patterned semantics and no-motion alternative',()=>{
  const overlap=readFileSync(new URL('../src/components/insurance/overlap.css',import.meta.url),'utf8');assert.match(overlap,/\.overlap-cap-outline\{[^}]*border-inline:0/);assert.match(overlap,/\.overlap-part\.b[^}]*repeating-linear-gradient/);assert.match(overlap,/\.overlap-part\.gap[^}]*radial-gradient/);assert.match(overlap,/@media\(prefers-reduced-motion:reduce\)/);assert.match(overlap,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  const conditions=readFileSync(new URL('../src/components/insurance/coverage-conditions.css',import.meta.url),'utf8');assert.match(conditions,/\.conditions-gate\[data-state=unknown\]\{[^}]*dashed/);assert.match(conditions,/@media\(prefers-reduced-motion:reduce\)/);assert.match(conditions,/\.conditions-marker\{[^}]*width:0/);
});

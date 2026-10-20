import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {createServer} from 'vite';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {revenueFrames,expenseFrames} from '../src/simulations/accounting/timing.mjs';
import {inventoryFrames,workingCapitalFrames} from '../src/simulations/accounting/operations.mjs';
test('accounting MDX renders valid text and only implemented accounting routes',async()=>{
 const server=await createServer({server:{middlewareMode:true,watch:null},appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]}});
 try{const catalog=readFileSync(new URL('../src/catalog.ts',import.meta.url),'utf8');const known=new Set(['#/accounting',...[...catalog.matchAll(/id: "([^"]+)", bookId: "accounting"/g)].map(m=>'#/accounting/'+m[1])]);
 for(const file of readdirSync(new URL('../src/content/accounting/',import.meta.url)).filter(f=>f.endsWith('.mdx'))){const {default:Content}=await server.ssrLoadModule('/src/content/accounting/'+file);const html=renderToStaticMarkup(createElement(Content));assert(!html.includes('**'),file);assert(!/<del[ >]/.test(html),file);assert(!/<p\b[^>]*>\s*<p\b/.test(html),file);for(const m of html.matchAll(/href="(#\/accounting[^"?]*)"/g))assert(known.has(m[1]),`${file}: ${m[1]}`);}
 }finally{await server.close();}
});
test('accounting C static alternatives keep the same complete ledger and named controls',async()=>{
 const server=await createServer({server:{middlewareMode:true,watch:null},appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]}});
 try{
  const {InventoryAndCostLab,WorkingCapitalLab}=await server.ssrLoadModule('/src/components/accounting/OperationsLabs.tsx');
  for(const [Component,frames] of [[InventoryAndCostLab,inventoryFrames()],[WorkingCapitalLab,workingCapitalFrames()]]){
   const html=renderToStaticMarkup(createElement(Component));
   assert.equal((html.match(/<li data-static-index=/g)??[]).length,frames.length);
   assert.equal((html.match(/<select aria-label=/g)??[]).length,3);
   assert(!html.includes('class="ac-feedback"'));
   for(const f of frames){assert(html.includes(`자산 ${f.assets.toLocaleString('ko-KR')} = 부채 ${f.liabilities.toLocaleString('ko-KR')} + 자본 ${f.equity.toLocaleString('ko-KR')}`));assert(html.includes(f.title));}
   assert(!/<p\b[^>]*>\s*<p\b/.test(html));assert(!html.includes('**'));
  }
 }finally{await server.close();}
});
test('accounting B static reading keeps period results distinct from cumulative balances',async()=>{
 const server=await createServer({server:{middlewareMode:true,watch:null},appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]}});
 try{const {RevenueAndCashLab,ExpensesAndTimingLab}=await server.ssrLoadModule('/src/components/accounting/TimingLabs.tsx');
 for(const [Component,frames] of [[RevenueAndCashLab,revenueFrames()],[ExpensesAndTimingLab,expenseFrames()]]){const html=renderToStaticMarkup(createElement(Component));const entries=[...html.matchAll(/<li data-static-index="(\d+)" data-period="([^"]+)" data-period-profit="([^"]+)" data-period-expenses="([^"]+)" data-cumulative-expenses="([^"]+)" data-exercise-cash="([^"]+)"/g)];assert.equal(entries.length,frames.length);for(const [i,row] of entries.entries()){const f=frames[i];assert.deepEqual(row.slice(1),[f.index,f.period,f.periodResult.profit,f.periodResult.expenses,f.expenses,f.exerciseCash].map(String));}assert.equal((html.match(/<select aria-label=/g)??[]).length,2);assert(!html.includes('class="ac-feedback"'));}
 }finally{await server.close();}
});
test('accounting D SSR preserves complete static equipment and financing frames',async()=>{const server=await createServer({server:{middlewareMode:true,watch:null},appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]}});try{const {EquipmentAndDepreciationLab,FinancingAndEquityLab}=await server.ssrLoadModule('/src/components/accounting/CapitalLabs.tsx');const model=await import('../src/simulations/accounting/capital.mjs');for(const [Component,frames,inputs] of [[EquipmentAndDepreciationLab,model.equipmentFrames(),5],[FinancingAndEquityLab,model.financingFrames(),2]]){const html=renderToStaticMarkup(createElement(Component));assert.equal((html.match(/<li data-static-index=/g)??[]).length,frames.length);assert.equal((html.match(/<select aria-label=/g)??[]).length,inputs);for(const f of frames)assert(html.includes(f.title));assert(!/<p\b[^>]*>\s*<p\b/.test(html));assert(!html.includes('**'));assert(!html.includes('class="ac-feedback"'));}}finally{await server.close();}});
test('accounting E SSR keeps report connections, complete static bridge and real source traces',async()=>{const server=await createServer({server:{middlewareMode:true,watch:null},appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]}});try{const {ConnectedStatementsLab,ProfitToCashLab}=await server.ssrLoadModule('/src/components/accounting/ReportLabs.tsx');const m=await import('../src/simulations/accounting/reports.mjs');for(const [Component,count] of [[ConnectedStatementsLab,4],[ProfitToCashLab,m.profitCashFrames().length]]){const html=renderToStaticMarkup(createElement(Component));assert.equal((html.match(/<li data-static-index=/g)??[]).length,count);assert.equal((html.match(/<select aria-label=/g)??[]).length,3);assert(!html.includes('class="ac-feedback"'));assert(!/<p\b[^>]*>\s*<p\b/.test(html));assert(html.includes('225'));assert(html.includes('-150'));}const h=renderToStaticMarkup(createElement(ConnectedStatementsLab));assert.equal((h.match(/aria-pressed=/g)??[]).length,15);assert(h.includes('data-source-id="T06"'));assert(h.includes('data-impact-cash="0"'));assert(h.includes('data-impact-profit="160"'));assert(h.includes('M1 기초'));assert(h.includes('M1 기말'));}finally{await server.close();}});

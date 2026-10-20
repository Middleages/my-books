import test from 'node:test';
import assert from 'node:assert/strict';
import {costMethods,inventoryCost,inventoryFrames,workingModes,workingCapitalFrames} from '../src/simulations/accounting/operations.mjs';
import {operatingBridge,companyFrames} from '../src/simulations/accounting/company-case.mjs';

function invariant(f){
 assert.equal(f.assets,f.liabilities+f.equity);assert(f.balanced);assert(f.balances.cash>=0);
 assert.equal(f.cashChange,Object.values(f.cashFlows).reduce((a,b)=>a+b,0));
 assert.equal(operatingBridge(f).at(-1).after,f.cashFlows.operating);
 assert.equal(f.exerciseCash,f.receiptTotal-f.paymentTotal);
 assert.equal(new Set(f.appliedIds).size,f.appliedIds.length);
}
test('inventory purchase is an asset and payment never repeats cost of sales',()=>{
 const f=inventoryFrames();assert.deepEqual(f.map(x=>x.balances.inventory),[0,300,60,60,60]);assert.deepEqual(f.map(x=>x.balances.cogs),[0,0,240,240,240]);assert.deepEqual(f.map(x=>x.balances.cash),[350,350,350,510,300]);assert.deepEqual(f.map(x=>x.profit),[0,0,160,160,160]);assert.equal(f[1].balances.payable,300);assert.equal(f[4].balances.payable,90);
 assert.deepEqual(f[2].event.rows.map(x=>x.account),['receivable','revenue','cogs','inventory']);
 for(const x of f)invariant(x);
});
test('both C default excerpts reach the exact canonical T08 balances',()=>{
 const canonical=companyFrames()[8];
 for(const f of [inventoryFrames().at(-1),workingCapitalFrames().at(-1)]){
  assert.deepEqual(f.balances,canonical.balances);
  assert.deepEqual(f.cashFlows,canonical.cashFlows);
  for(const key of ['assets','liabilities','equity','revenue','expenses','profit','cashChange'])assert.equal(f[key],canonical[key]);
 }
});
test('inventory allocations conserve all integer quantities and costs for all three methods',()=>{
 for(const method of costMethods)for(let q=0;q<=100;q++){
  const c=inventoryCost(q,method),expected=method==='single'?3*q:method==='average'?3.5*q:3*Math.min(q,50)+4*Math.max(q-50,0);
  assert.equal(c.costOfSales,expected);assert.equal(c.costOfSales+c.endingCost,c.totalCost);assert.equal(c.remainingQuantity+q,100);assert.equal(c.allocations.reduce((s,a)=>s+a.quantity,0),q);
  const frames=inventoryFrames({soldQuantity:q,method});
  for(const f of frames){invariant(f);assert.equal(f.tokens.reduce((s,t)=>s+t.sold,0),f.soldQuantity);assert.equal(f.tokens.reduce((s,t)=>s+t.remaining,0),f.remainingQuantity);assert.equal(f.remainingQuantity+f.soldQuantity,f.purchasedQuantity);assert.equal(f.balances.inventory+f.balances.cogs,f.availableCost);}
  assert.equal(frames.at(-1).profit,5*q-expected);
 }
});
test('FIFO versus period weighted average changes allocation, not same-case cash or quantity',()=>{
 const fifo=inventoryFrames({soldQuantity:60,method:'fifo'}).at(-1),avg=inventoryFrames({soldQuantity:60,method:'average'}).at(-1);
 assert.equal(fifo.balances.cogs,190);assert.equal(fifo.balances.inventory,160);assert.equal(avg.balances.cogs,210);assert.equal(avg.balances.inventory,140);
 assert.equal(fifo.profit,110);assert.equal(avg.profit,90);assert.equal(fifo.balances.cash,avg.balances.cash);assert.equal(fifo.balances.receivable,avg.balances.receivable);assert.deepEqual(fifo.tokens,avg.tokens);
});
test('inventory rejects overselling and non-finite/unsupported input without changing another run',()=>{
 for(const q of [-1,101,0.5,NaN,Infinity,'80',null])assert.throws(()=>inventoryFrames({soldQuantity:q}));
 for(const method of ['lifo','',null])assert.throws(()=>inventoryFrames({method}));
 const a=inventoryFrames();a.at(-1).entries[0].rows[0].amount=999;a.at(-1).tokens[0].sold=999;a.at(-1).cost.layers[0].quantity=999;a.at(-1).cost.allocations[0].amount=999;assert.deepEqual(inventoryFrames(),inventoryFrames());assert.equal(inventoryFrames().at(-1).tokens[0].sold,10);assert.equal(a[0].cost.layers[0].quantity,100);assert.equal(a[0].cost.allocations[0].amount,240);
});
test('collection changes cash and receivables, not the sales excerpt profit',()=>{
 for(const [collection,cash,ar] of [[0,140,400],[160,300,240],[400,540,0]]){
  const f=workingCapitalFrames({collection}).at(-1);assert.equal(f.balances.cash,cash);assert.equal(f.balances.receivable,ar);assert.equal(f.profit,160);assert.equal(f.owc,ar+60-90);
 }
});
test('additional stock on credit and cash settlement have different working-capital effects',()=>{
 const basic=workingCapitalFrames().at(-1),credit=workingCapitalFrames({mode:'stock-credit'}).at(-1),paid=workingCapitalFrames({mode:'stock-paid'}).at(-1);
 assert.equal(basic.balances.cash,300);assert.equal(basic.owc,210);
 assert.equal(credit.balances.inventory-basic.balances.inventory,60);assert.equal(credit.balances.payable-basic.balances.payable,60);assert.equal(credit.balances.cash,basic.balances.cash);assert.equal(credit.owc,basic.owc);
 assert.equal(paid.balances.cash,240);assert.equal(paid.owc,270);assert.equal(paid.balances.payable,90);assert.equal(paid.profit,160);
});
test('a failed due-day payment remains unposted after later cash arrives',()=>{
 const f=workingCapitalFrames({mode:'due-before'}),blocked=f.find(x=>x.attempted?.status==='blocked'),final=f.at(-1);
 assert.deepEqual(blocked.attempted,{id:'W-pay',day:12,required:360,available:350,shortage:10,status:'blocked'});
 assert.equal(blocked.balances.cash,350);assert.equal(blocked.balances.payable,360);assert(!blocked.appliedIds.includes('W-pay'));assert(!blocked.entries.some(e=>e.id==='W-pay'));
 assert.equal(final.balances.cash,510);assert.equal(final.balances.payable,360);assert.equal(final.profit,160);assert.equal(final.paymentTotal,0);assert.equal(final.owc,0);assert.equal(final.exerciseCash,160);assert.deepEqual(final.attempts,[blocked.attempted]);assert(!final.appliedIds.includes('W-pay'));
 assert.deepEqual(f[3].attempts,[]);assert.equal(f[3].balances.cash,350);
 const late=workingCapitalFrames({mode:'due-after'}).at(-1);assert.equal(late.balances.cash,150);assert.equal(late.balances.payable,0);assert.equal(late.attempts[0].status,'paid');assert.equal(late.owc,360);assert.equal(late.exerciseCash,-200);
});
test('all working-capital scenarios reconcile the same ledger at every actual frame',()=>{
 for(const mode of workingModes)for(const collection of [0,160,400]){
  const frames=workingCapitalFrames({mode,collection});assert.equal(frames.length,7);
  for(const f of frames){invariant(f);assert.equal(f.bridgeCash,f.exerciseCash);assert.equal(f.owc,f.balances.receivable+f.balances.inventory-f.balances.payable);assert.equal(f.history.at(-1).cash,f.balances.cash);assert.equal(f.history.at(-1).day,f.day);assert(f.history.every((p,i,a)=>i===0||p.day>=a[i-1].day));assert.equal(f.attempts.filter(a=>a.status==='paid').length,f.appliedIds.includes('W-pay')?1:0);}
  assert.deepEqual(workingCapitalFrames({mode,collection}),frames);
 }
 const lateEmpty=workingCapitalFrames({mode:'due-after',collection:0}).at(-1);assert.equal(lateEmpty.attempts[0].shortage,10);assert.equal(lateEmpty.balances.cash,350);
});
test('working-capital invalid inputs, snapshots and failure metadata are isolated',()=>{
 for(const mode of ['',null,'automatic-loan'])assert.throws(()=>workingCapitalFrames({mode}));
 for(const collection of [-1,1,401,Infinity,NaN,'160',null])assert.throws(()=>workingCapitalFrames({collection}));
 const f=workingCapitalFrames({mode:'due-before'});f.at(-1).attempts[0].shortage=999;f.at(-1).history[0].cash=999;
 assert.equal(f[4].attempts[0].shortage,10);assert.equal(f[0].history[0].cash,350);assert.equal(workingCapitalFrames({mode:'due-before'}).at(-1).attempts[0].shortage,10);
});

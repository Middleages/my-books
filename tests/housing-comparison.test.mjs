import test from 'node:test';
import assert from 'node:assert/strict';
import {housingComparison as compare} from '../src/simulations/housing/comparison.mjs';
const near=(a,b,e=.00001)=>assert(Math.abs(a-b)<e,`${a} != ${b}`);
test('housing comparison: shared fixture and principal is not expense',()=>{
 const r=compare(),{rent,jeonse,buy}=r.paths;
 assert.deepEqual([rent.initialUse,jeonse.initialUse,buy.initialUse],[21e6,121e6,125e6]);
 near(rent.pvCost,17.8e6);near(jeonse.pvCost,2.8e6);near(buy.pvCost,17794339.590440914);
 near(rent.terminalCash,161e6);near(jeonse.terminalCash,176e6);near(buy.terminalCash,161005660.40955907);
 for(const p of Object.values(r.paths)){for(const x of p.planned.slice(1))near(x.out,x.principal+x.interest+x.rent+x.maintenance+x.annualCost);near(p.frames.at(-1).spent,p.plannedExpense)}
 near(jeonse.netSettlement,120e6);near(jeonse.planned.slice(1).reduce((s,r)=>s+r.principal,0),0);
 near(buy.loan-buy.beforeSettlement.debt,buy.planned.reduce((s,r)=>s+r.principal,0));
});
test('housing comparison: same-period PV and successful terminal cash differences are equivalent',()=>{
 for(const months of [0,1,12,24,60,239,240,241,360])for(const annualReturn of [0,3])for(const priceChange of [-1,-.2,0,.2])for(const transactionCosts of [false,true]){
  const r=compare({months,annualReturn,priceChange,transactionCosts,startCash:500e6});const ps=Object.values(r.paths);
  for(const p of ps){assert(p.settled);assert.equal(p.failure,null);for(const f of p.frames){assert(f.cash>=0);if(f.phase!=='settlement')near(f.netWorth,500e6+f.funding+f.returns-f.spent+(p.kind==='buy'?f.asset-p.price:0));}}
  for(const a of ps)for(const b of ps)near(a.terminalCash-b.terminalCash,-(a.pvCost-b.pvCost)*r.factor,.0001);
 }
 const r=compare({annualReturn:3});near(r.monthlyReturn,(1.03)**(1/12)-1,1e-14);near(r.paths.buy.pvCost,24347431.474849865);
});
test('housing comparison: T0, zero amounts and transaction toggle do not remove running costs',()=>{
 for(const transactionCosts of [true,false]){const r=compare({months:0,priceChange:.2,transactionCosts});for(const p of Object.values(r.paths)){assert.equal(p.planned.length,1);assert.equal(p.frames.at(-1).funding,0);near(p.pvCost,transactionCosts?(p.kind==='buy'?8e6:1e6):0)}}
 const r=compare({rentDeposit:0,jeonseDeposit:0,jeonseLoan:0,buyPrice:0,buyLoan:0,transactionCosts:false});
 assert.equal(r.paths.rent.price,0);assert.equal(r.paths.buy.beforeSettlement.debt,0);near(r.paths.buy.plannedExpense,3.6e6);near(r.paths.jeonse.plannedExpense,.2e6);
});
test('housing comparison: initial and monthly failure never invent borrowing, later funding or completed assets',()=>{
 const failed=compare({startCash:0,annualReturn:3});for(const p of Object.values(failed.paths)){assert.equal(p.terminalCash,null);assert.equal(p.failure.kind,'initial-shortage');for(const f of p.frames)assert.deepEqual([f.cash,f.asset,f.debt,f.spent,f.funding,f.returns],[0,0,0,0,0,0])}
 const r=compare({months:60,monthlyFunding:0,annualReturn:3});assert(r.paths.buy.failure);const p=r.paths.buy;assert.equal(p.failure.kind,'monthly-shortage');const at=p.frames[p.failure.month];assert(at.cash>=0);assert.equal(at.paid,false);assert.equal(at.paidMonths,p.failure.month-1);assert.equal(at.debt,p.planned[at.paidMonths].debt);
 for(const f of p.frames.slice(p.failure.month+1)){for(const k of ['cash','asset','debt','spent','funding','returns','paidMonths'])assert.equal(f[k],at[k]);assert.deepEqual(f.failure,p.failure)}
 assert.equal(p.terminalCash,null);assert(Number.isFinite(p.pvCost));
});
test('housing comparison: settlement can require cash, cannot repair an earlier failure or assume completion',()=>{
 const funded=compare({startCash:250e6,priceChange:-1}).paths.buy;assert(funded.netSettlement<0);assert(funded.settled);assert(funded.terminalCash>=0);near(funded.terminalCash,funded.beforeSettlement.cash+funded.netSettlement);
 const shortage=compare({priceChange:-1}).paths.buy;assert.equal(shortage.failure.kind,'settlement-shortage');assert.equal(shortage.terminalCash,null);near(shortage.failure.gap,-(shortage.beforeSettlement.cash+shortage.netSettlement));assert.equal(shortage.frames.at(-1).debt,shortage.beforeSettlement.debt);assert.equal(shortage.frames.at(-1).spent,shortage.beforeSettlement.spent);
 for(const p of Object.values(compare({settlement:'unknown'}).paths)){assert.equal(p.terminalCash,null);assert.equal(p.failure.kind,'settlement-unconfirmed');assert.equal(p.frames.at(-1).cash,p.beforeSettlement.cash)}
 const early=compare({months:60,monthlyFunding:0,priceChange:1}).paths.buy;assert.equal(early.failure.kind,'monthly-shortage');assert.equal(early.terminalCash,null);
});
test('housing comparison: maturity boundary stops payments and preserves outstanding principal once',()=>{
 for(const months of [239,240,241]){const p=compare({months,startCash:500e6}).paths.buy;near(p.loan,p.planned.reduce((s,r)=>s+r.principal,0)+p.beforeSettlement.debt);if(months>=240)assert.equal(p.beforeSettlement.debt,0);if(months===241){assert.equal(p.planned[241].principal,0);assert.equal(p.planned[241].interest,0);assert.equal(p.planned[241].out,100000)}}
});
test('housing comparison: one-won payment shortage, repeatability and invalid inputs',()=>{
 const r=compare({months:1}),p=r.paths.buy;const out=p.planned[1].out;
 const f=compare({months:1,startCash:p.initialUse+out-1,monthlyFunding:0}).paths.buy;assert.equal(f.failure.month,1);near(f.failure.gap,1);
 assert.deepEqual(compare(),compare());for(const input of [{months:-1},{months:1.5},{annualReturn:NaN},{priceChange:-1.1},{buyLoan:101e6},{jeonseLoan:150e6},{settlement:'maybe'},{transactionCosts:0}])assert.throws(()=>compare(input),RangeError);
});

test('housing comparison: exact fractional-interest funding passes while one won short still fails',()=>{
 for(const [months,startCash] of [[3,121200000],[24,122800000]]){const exact=compare({months,startCash,monthlyFunding:0}).paths.jeonse;assert(exact.settled);assert.equal(exact.failure,null);near(exact.beforeSettlement.cash,0);near(exact.terminalCash,120e6);const short=compare({months,startCash:startCash-1,monthlyFunding:0}).paths.jeonse;assert.equal(short.failure.kind,'monthly-shortage');near(short.failure.gap,1);assert.equal(short.terminalCash,null)}
});

test('housing comparison: accumulated q3 terminal equality is not a fictional funding failure',()=>{
 for(const months of [12,24,60,120,240,360])for(const priceChange of [-1,-.2,0,.2]){
  const input={months,annualReturn:3,monthlyFunding:0,priceChange};const planned=compare(input).paths.buy,pv=planned.pvCost;if(pv<125e6||planned.netSettlement>0)continue;
  const r=compare({...input,startCash:pv}),p=r.paths.buy;assert(r.numericalTolerance<=.01);assert(p.settled,JSON.stringify({months,priceChange,failure:p.failure}));near(p.terminalCash,0,.001);
  const short=compare({...input,startCash:pv-1}).paths.buy;assert.equal(short.terminalCash,null);assert(short.failure.gap>.99);
 }
});

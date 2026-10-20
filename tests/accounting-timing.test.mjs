import test from 'node:test';
import assert from 'node:assert/strict';
import {operatingBridge} from '../src/simulations/accounting/company-case.mjs';
import {revenueFrames,revenueModes,expenseFrames} from '../src/simulations/accounting/timing.mjs';
for(const mode of revenueModes)test(`accounting ${mode} recognizes control once, not orders or collections`,()=>{
 const f=revenueFrames({mode});assert.equal(f.length,5);assert.deepEqual(f.map(x=>x.revenue),[0,0,0,400,400]);assert.deepEqual(f.map(x=>x.profit),[0,0,0,160,160]);assert.deepEqual(f.map(x=>x.balances.inventory),[300,300,300,60,60]);for(const x of f){assert.equal(x.balanced,true);assert.equal(x.assets,x.liabilities+x.equity);assert.equal(x.exerciseCash,x.receiptTotal);assert.equal(x.balances.cash,350+x.receiptTotal);}
 assert.equal(f[0].assets,950);assert.equal(f[0].liabilities,600);assert.equal(f[0].equity,350);assert.deepEqual(f[0].balances,f[1].balances);
 if(mode==='advance'){assert.equal(f[2].balances.contractLiability,400);assert.equal(f[2].balances.cash,750);assert.equal(f[3].balances.contractLiability,0);assert.equal(f[4].balances.receivable,0);assert.deepEqual(f[3].balances,f[4].balances);}
 else{assert.equal(f[3].balances.receivable,400);assert.equal(f[3].balances.cash,350);assert.equal(f[4].balances.receivable,mode==='credit'?240:0);assert.equal(f[4].periodResult.revenue,mode==='credit'?400:0);assert.equal(f[4].periodResult.profit,mode==='credit'?160:0);}
 assert.deepEqual(revenueFrames({mode}),f);
});
for(const payment of [0,40,60])test(`accounting prepaid rights and accrued services with payment ${payment}`,()=>{
 const f=expenseFrames({payment});assert.equal(f.length,7);assert.deepEqual(f.map(x=>x.exerciseExpenses),[0,0,60,60,80,100,120]);assert.deepEqual(f.map(x=>x.balances.prepaid),[0,60,60,60,40,20,0]);assert.deepEqual(f.map(x=>x.exerciseCash),[0,-60,-60,-60-payment,-60-payment,-60-payment,-60-payment]);assert.equal(f[4].balances.accrued,60-payment);assert.equal(f[4].periodResult.expenses,80);assert.equal(f[5].periodResult.expenses,20);assert.equal(f[6].periodResult.expenses,20);assert.equal(f[5].periodResult.cashChange,0);assert.equal(f[6].periodResult.cashChange,0);
 for(const x of f){assert(x.balanced);assert.equal(x.prepaidSegments.reduce((s,p)=>s+(p.recognized&&!p.used?p.amount:0),0),x.balances.prepaid);assert.equal(x.serviceReceived-x.servicePaid,x.balances.accrued);}
 assert.deepEqual(expenseFrames({payment}),f);
});
test('accounting timing scenarios reject unsupported conditions and do not alias other calls',()=>{for(const mode of ['',null,'sale'])assert.throws(()=>revenueFrames({mode}));for(const payment of [-1,1,61,Infinity,NaN,'40'])assert.throws(()=>expenseFrames({payment}));const a=revenueFrames();a[4].entries[0].rows[0].amount=999;assert.equal(revenueFrames()[4].entries[0].rows[0].amount,50);});

test('accounting bridge also reconciles advance-receipt obligations and expense excerpts',()=>{for(const f of [...revenueModes.flatMap(mode=>revenueFrames({mode})),...expenseFrames()])assert.equal(operatingBridge(f).at(-1).after,f.cashFlows.operating);});

test('accounting partial collection leaves a visible open-ended 240 claim, not a false settlement',()=>{for(const mode of revenueModes){const frames=revenueFrames({mode});for(const f of frames){const parts=f.timeline.claimSegments;if(f.transferred)assert.equal(parts.filter(s=>!s.settled).reduce((sum,s)=>sum+s.amount,0),f.balances.receivable);if(mode==='credit'){const open=parts.find(s=>s.id==='outstanding-part');assert.equal(open.amount,240);assert.equal(open.endDay,null);assert.equal(open.settled,false);assert.equal(open.displayEndDay,40);assert.equal(open.observedEndDay,Math.max(10,f.elapsedDay));}}}const final=revenueFrames().at(-1);assert.equal(final.timeline.claimSegments[0].settled,true);assert.equal(final.timeline.claimSegments[1].settled,false);});

test('accounting advance obligation is a distinct interval and settles only on delivery',()=>{for(const f of revenueFrames({mode:'advance'})){const o=f.timeline.obligationSegment;assert.equal(o.startDay,5);assert.equal(o.endDay,10);assert.equal(o.amount,400);assert.equal(o.recognized&&!o.settled?o.amount:0,f.balances.contractLiability);}assert.equal(revenueFrames()[4].timeline.obligationSegment,null);});

test('accounting expense payment display uses canonical positive zero and exact outflows',()=>{for(const payment of [0,40,60])for(const f of expenseFrames({payment})){assert.equal(Object.is(f.paymentTotal,-0),false);assert(f.paymentTotal>=0);assert.equal(f.paymentTotal+f.exerciseCash,0);const cashRows=f.entries.slice(3).flatMap(e=>e.rows).filter(r=>r.account==='cash');assert(cashRows.every(r=>r.side==='credit'));assert.equal(cashRows.reduce((sum,r)=>sum+r.amount,0),f.paymentTotal);assert.equal(Number(String(f.paymentTotal/120)),f.paymentTotal/120);}assert.equal(expenseFrames()[0].paymentTotal,0);assert.equal(expenseFrames()[4].paymentTotal,100);});

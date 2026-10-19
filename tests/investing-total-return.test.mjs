import test from 'node:test';
import assert from 'node:assert/strict';
import { totalReturnDefaults, totalReturnFrames } from '../src/simulations/investing/total-return.mjs';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function conserve(r) {
 for(const f of r.frames) {
  close(f.cashTotal,r.frames[0].cashTotal); close(f.shares+f.otherShares,f.totalShares);
  close(f.wealth,f.cash+f.stockValue); close(f.totalGain,f.realizedGain+f.unrealizedGain+f.dividendsReceived);
  assert.ok(f.cash>=0 && f.companyCash>=0 && f.shares>=0 && f.otherShares>=0);
 }
}
test('default dividend moves 5000 company cash to investor 5 and other shareholders 4995',()=>{
 const r=totalReturnFrames(); conserve(r); const f=r.frames[1];
 assert.equal(f.companyCash,5000); assert.equal(f.cash,5); assert.equal(f.otherShareholdersCash,4995);
 assert.equal(f.totalDividendPaid,5000); assert.equal(f.stockValue,95); assert.equal(f.wealth,100);
 assert.equal(f.totalReturn,0); assert.equal(f.priceReturn,-.05); assert.equal(f.wealthDirection,'same');
 assert.equal(f.cashFlows.reduce((s,x)=>s+x.amount,0),5000);
});
test('price return, dividend and total return remain distinct in separate ending-price scenario',()=>{
 const r=totalReturnFrames({endPrice:110}); conserve(r);
 close(r.summary.priceReturn,.1); close(r.summary.totalReturn,.15);
 assert.equal(r.summary.unrealizedGain,10); assert.equal(r.summary.realizedGain,0); assert.equal(r.summary.cash,5);
});
test('reinvestment spends dividend cash exactly once and conserves total wealth',()=>{
 const r=totalReturnFrames({reinvest:true}); conserve(r);
 close(r.summary.shares,100/95); assert.equal(r.summary.cash,0); close(r.summary.wealth,100);
 assert.equal(r.summary.costBasis,105); assert.equal(r.summary.reinvestedCash,5);
 assert.equal(r.summary.dividendsReceived,5); close(r.summary.totalGain,0);
});
test('sale splits realized and unrealized gains using average cost without counting proceeds as profit',()=>{
 const r=totalReturnFrames({endPrice:110,sellShares:.5}); conserve(r);
 assert.equal(r.summary.realizedGain,5); assert.equal(r.summary.unrealizedGain,5);
 assert.equal(r.summary.saleProceeds,55); assert.equal(r.summary.cash,60); assert.equal(r.summary.totalGain,15);
 const all=totalReturnFrames({endPrice:110,sellShares:1}); conserve(all); assert.equal(all.summary.unrealizedGain,0);
});
test('sale after reinvestment retains dividend once and disposes proportional basis',()=>{
 const r=totalReturnFrames({reinvest:true,sellShares:1}); conserve(r);
 close(r.summary.realizedGain,-4.75); close(r.summary.unrealizedGain,-.25); close(r.summary.totalGain,0);
});
test('overselling and company cash shortfall are rejected without a negative balance',()=>{
 const r=totalReturnFrames({sellShares:2}); conserve(r); assert.equal(r.summary.status,'rejected'); assert.equal(r.summary.shares,1);
 const failed=totalReturnFrames({companyCash:4999}); conserve(failed);
 assert.equal(failed.frames[1].status,'rejected'); assert.equal(failed.summary.cash,0); assert.equal(failed.summary.companyCash,4999);
 assert.equal(failed.summary.price,100); assert.equal(failed.summary.totalDividendPaid,0);
});
test('zero dividend and zero holdings do not create cash or a return denominator',()=>{
 const zero=totalReturnFrames({dividendPerShare:0}); conserve(zero); assert.equal(zero.summary.price,100); assert.equal(zero.summary.totalReturn,0);
 const noShares=totalReturnFrames({investorShares:0}); conserve(noShares); assert.equal(noShares.summary.totalReturn,null); assert.equal(noShares.summary.cash,0);
 const none=totalReturnFrames({totalShares:0,investorShares:0,initialPrice:0,dividendPerShare:0}); conserve(none); assert.equal(none.summary.priceReturn,null);
});
test('price zero supports complete loss and blocks undefined reinvestment',()=>{
 const r=totalReturnFrames({endPrice:0,reinvest:true}); conserve(r); assert.equal(r.frames[3].status,'rejected'); assert.equal(r.summary.cash,5); close(r.summary.totalReturn,-.95);
 const zero=totalReturnFrames({initialPrice:0,dividendPerShare:0}); conserve(zero); assert.equal(zero.summary.totalReturn,null);
});
test('dividend exceeding initial price is outside model and no payment occurs',()=>{
 const r=totalReturnFrames({dividendPerShare:101,companyCash:200000}); conserve(r); assert.equal(r.frames[1].status,'rejected'); assert.equal(r.summary.price,100);
});
test('unavailable counterparty shares prevent reinvestment without creating shares',()=>{
 const r=totalReturnFrames({totalShares:1,reinvest:true}); conserve(r); assert.equal(r.frames[3].status,'rejected'); assert.equal(r.summary.shares,1); assert.equal(r.summary.cash,5);
});
test('bad input is rejected and frozen input supports deterministic replay',()=>{
 for(const p of [{initialPrice:-1},{endPrice:NaN},{sellShares:Infinity},{totalShares:0},{reinvest:'yes'}]) assert.throws(()=>totalReturnFrames(p),RangeError);
 const p=Object.freeze({...totalReturnDefaults,reinvest:true,sellShares:.5}); const copy=structuredClone(p);
 assert.deepEqual(totalReturnFrames(p),totalReturnFrames(p)); assert.deepEqual(p,copy);
 const r=totalReturnFrames(p); r.summary.cash=999; assert.equal(r.frames[0].cash,0);
});
test('all parameter combinations maintain cash/share and return decompositions',()=>{
 for(const investorShares of [0,1,10]) for(const dividendPerShare of [0,5,100]) for(const endPrice of [0,80,100,150]) for(const reinvest of [false,true]) {
   conserve(totalReturnFrames({investorShares,dividendPerShare,endPrice,reinvest,sellShares:investorShares/2,companyCash:100000}));
 }
});

test('underflowed positive investment and non-finite derived returns are explicitly rejected', () => {
 for (const input of [
  {initialPrice:Number.MIN_VALUE,investorShares:.5,dividendPerShare:0,endPrice:0},
  {initialPrice:Number.MIN_VALUE,dividendPerShare:0,endPrice:100},
  {initialPrice:Number.MIN_VALUE,investorShares:0,dividendPerShare:0,endPrice:100},
 ]) assert.throws(() => totalReturnFrames(input), RangeError);
});
test('tiny representable return ratios retain a finite result without an arbitrary minimum input', () => {
 const r=totalReturnFrames({initialPrice:1e-300,dividendPerShare:0,endPrice:2e-300});
 assert.equal(r.summary.priceReturn,1); assert.equal(r.summary.totalReturn,1);
 for (const frame of r.frames) for (const value of Object.values(frame)) if (typeof value === 'number') assert(Number.isFinite(value));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {purchaseFrames,purchaseTimings,mortgageMeasures} from '../src/simulations/housing/purchase.mjs';
import {projectRepayment} from '../src/simulations/money/repayment.mjs';
const close=(a,b)=>assert(Math.abs(a-b)<1e-5,`${a} != ${b}`);
test('purchase price parts, cash sources and cost ledger conserve every frame',()=>{
  for(const timing of purchaseTimings) for(const startCash of [0,1,20e6,60e6,124999999,125e6,150e6,205e6,300e6]) for(const loan of [0,80e6]) for(const cost of [0,1,5e6]) {
    const fs=purchaseFrames({timing,startCash,loan,cost});
    for(const f of fs) {
      close(f.deposit+f.middle+f.balance,f.price);
      close(f.cash+f.paidPrice+f.spentCost,startCash+f.debt);
      close(f.cash+f.advance+f.home-f.debt,startCash-f.spentCost);
      assert(f.cash>=0&&f.debt>=0&&f.spentCost<=cost);
      if(f.completed) {close(f.home,f.price);assert.equal(f.advance,0);}
      else assert.equal(f.home,0);
    }
    assert.deepEqual(fs,purchaseFrames({timing,startCash,loan,cost}));
  }
  const end=purchaseFrames().at(-1);
  assert.deepEqual([end.cash,end.home,end.debt,end.spentCost,end.bookDifference],[25e6,200e6,80e6,5e6,145e6]);
});
test('missed date is preserved; a later planned loan cannot auto-cure failure',()=>{
  for(const timing of ['after','nextDay']) {
    const fs=purchaseFrames({timing}),failed=fs[4];
    assert.equal(failed.failure.day,60);assert.equal(failed.failure.minimumGap,55e6);
    assert.deepEqual([fs[5].cash,fs[5].debt,fs[5].advance,fs[5].home],[90e6,0,60e6,0]);
    assert.deepEqual(fs[5].failure,failed.failure);
  }
  const initial=purchaseFrames({startCash:19999999});
  assert.equal(initial[1].failure.minimumGap,1);assert.equal(initial.at(-1).debt,0);
  const lateFailure=purchaseFrames({startCash:124999999}).at(-1);
  assert.equal(lateFailure.failure.minimumGap,1);
  assert.deepEqual([lateFailure.cash,lateFailure.advance,lateFailure.debt,lateFailure.home,lateFailure.spentCost],[144999999,60e6,80e6,0,0]);
});
test('unknown ordering is neither approval nor blanket failure',()=>{
  const unknown=purchaseFrames({timing:'unknown'}).at(-1);
  assert.equal(unknown.failure.kind,'unknown-order');assert.equal(unknown.failure.minimumGap,0);assert.equal(unknown.failure.gapBeforeArrival,55e6);
  const certainlyShort=purchaseFrames({timing:'unknown',startCash:124999999}).at(-1);
  assert.equal(certainlyShort.failure.kind,'shortage');assert.equal(certainlyShort.failure.minimumGap,1);
  const independent=purchaseFrames({timing:'unknown',startCash:205e6}).at(-1);
  assert.equal(independent.failure,null);assert.equal(independent.completed,true);
  assert.deepEqual([independent.cash,independent.debt,independent.unconfirmedLoan],[0,0,80e6]);
  const noLoan=purchaseFrames({timing:'unknown',startCash:205e6,loan:0}).at(-1);
  assert.equal(noLoan.unconfirmedLoan,0);assert.equal(noLoan.completed,true);
  const zero=purchaseFrames({price:0,startCash:0,loan:0,cost:0}).at(-1);
  assert.equal(zero.completed,true);assert.equal(zero.bookDifference,0);
});
test('mortgage stock, annual screening and monthly budget are independent bases',()=>{
  const a=mortgageMeasures(),app=mortgageMeasures({appraisal:150e6}),s=mortgageMeasures({stress:5}),t=mortgageMeasures({takeHome:2e6});
  close(a.ltv,.4);assert.equal(app.ltv,80/150);
  assert.equal(app.screenAnnual,a.screenAnnual);assert.equal(app.remaining,a.remaining);
  assert(s.screenAnnual>a.screenAnnual);assert.equal(s.payment,a.payment);assert.equal(s.remaining,a.remaining);
  assert.equal(t.ltv,a.ltv);assert.equal(t.annualRatio,a.annualRatio);close(t.remaining,a.remaining-1e6);
  assert.equal(a.approval,null);
  close(a.monthlyOut+a.remaining,a.takeHome);
  for(const f of a.frames) close(f.out+f.remaining,a.takeHome);
  const goal=mortgageMeasures({monthlyGoal:500000});assert.equal(goal.remaining,a.remaining);assert.equal(goal.payment,a.payment);
});
test('annual basis sums twelve scheduled months without multiplying short-term principal',()=>{
  for(const months of [1,6,12,13,240]) for(const annualRate of [0,4,28]) for(const stress of [0,2]) {
    const r=mortgageMeasures({months,annualRate,stress});
    const rows=projectRepayment({principal:80e6,annualRate:annualRate+stress,months}).paths.annuity.rows;
    close(r.screenAnnual,rows.slice(0,12).reduce((n,x)=>n+x.payment,0)+2.4e6);
  }
  const one=mortgageMeasures({months:1,stress:0,existingMonthly:0});close(one.actualAnnual,80e6+80e6*.04/12);
  const zero=mortgageMeasures({principal:0,existingMonthly:0,annualIncome:0,appraisal:0});
  assert.equal(zero.payment,0);assert.equal(zero.screenAnnual,0);assert.equal(zero.annualRatio,null);assert.equal(zero.ltv,null);
  const shortage=mortgageMeasures({takeHome:0});assert(shortage.monthlyShortage>0);assert.equal(shortage.goalGap,shortage.monthlyGoal);
});
test('purchase and mortgage invalid values do not become plausible numeric results',()=>{
  for(const bad of [-1,NaN,Infinity,1e11]) {
    for(const key of ['price','startCash','loan','cost']) assert.throws(()=>purchaseFrames({[key]:bad}));
    for(const key of ['principal','appraisal','annualIncome','takeHome','living','existingMonthly','monthlyGoal','annualRate','stress']) assert.throws(()=>mortgageMeasures({[key]:bad}));
  }
  assert.throws(()=>purchaseFrames({timing:'approved'}));
  for(const months of [0,1.5,601]) assert.throws(()=>mortgageMeasures({months}));
  assert.throws(()=>mortgageMeasures({annualRate:30,stress:2}));
  assert.throws(()=>mortgageMeasures({principal:100000001}));
});

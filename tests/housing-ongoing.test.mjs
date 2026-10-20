import test from 'node:test';
import assert from 'node:assert/strict';
import {projectRepayment} from '../src/simulations/money/repayment.mjs';
import {mortgagePaths,externalCostFrames,ownReserveFrames} from '../src/simulations/housing/ongoing.mjs';
const near=(a,b)=>assert(Math.abs(a-b)<1e-5,`${a} != ${b}`);

test('housing fixed planned path exactly reuses money repayment and reset uses month12 closing',()=>{
  const r=mortgagePaths(),money=projectRepayment({principal:80e6,annualRate:4,months:240}).paths.annuity;
  r.paths.fixed.rows.slice(1).forEach((v,i)=>{assert.equal(v.closing,money.rows[i].closing);assert.equal(v.regularPayment,money.rows[i].payment)});
  const boundary=r.paths.reset.rows[12],next=r.paths.reset.rows[13];
  assert.equal(next.opening,boundary.closing);assert.equal(next.rate,7);assert(next.repriced);
  const recalc=projectRepayment({principal:boundary.closing,annualRate:7,months:228}).paths.annuity.rows[0];
  assert.equal(next.regularPayment,recalc.payment);
  assert(r.paths.reset.rows[24].closing>0);assert.equal(r.paths.reset.rows[240].closing,0);
});
test('housing prepayment caps actual principal, charges one fee, and preserves each row',()=>{
  for(const months of [1,12,13,24,240]) for(const principal of [0,1,80e6]) for(const prepayment of [0,10e6,100e6]) for(const annualRate of [0,4]) {
    const r=mortgagePaths({months,principal,prepayment,annualRate,resetRate:annualRate===0?0:7});
    for(const path of Object.values(r.paths)) {
      for(const row of path.rows) {
        near(row.cumulativePrincipal+row.closing,principal);
        near(row.cumulativePayment,row.cumulativePrincipal+row.cumulativeInterest+row.cumulativeFees);
        near(row.opening-row.regularPrincipal-row.extra,row.closing);
        assert(row.closing>=0);assert(row.extra<=row.afterRegular);near(row.fee,row.extra*.01);
        if(row.month!==12) assert.equal(row.extra,0);
      }
      assert.equal(path.rows.at(-1).closing,0);
      if(months<=12) {assert.equal(path.totalFees,0);assert(path.rows.every(v=>!v.repriced));}
    }
  }
});
test('housing full early repayment has no future payment, fee or reset effect',()=>{
  const r=mortgagePaths({prepayment:100e6});
  for(const path of Object.values(r.paths)) {
    const row=path.rows[12];assert.equal(row.extra,row.afterRegular);assert.equal(row.closing,0);
    near(row.fee,row.extra*.01);assert(row.fee<1e6);
    for(const v of path.rows.slice(13)) {assert.equal(v.totalPayment,0);assert.equal(v.closing,0);assert.equal(v.repriced,false)}
  }
  assert.deepEqual(mortgagePaths(),mortgagePaths());
});
test('housing external levy cash and reimbursement claim stay separate, including zero/unknown',()=>{
  for(const levy of [0,20000]) for(const refund of ['waiting','assumed']) {
    const frames=externalCostFrames({levy,refund});
    for(const f of frames) {assert.equal(f.paidOut,f.servicePaid+f.levyPaid);assert.equal(f.claim+f.refundCash,f.levyPaid);assert.equal(f.cash+f.claim,2100000-f.servicePaid)}
    assert.equal(frames[12].refundCash,0);assert.equal(frames[13].months,12);
    if(levy===0) assert(frames.every(f=>f.refundStatus==='no-target'));
  }
  const f=externalCostFrames({documentation:'unknown'}).at(-1);
  assert.equal(f.claim,null);assert.equal(f.unclassified,240000);assert.equal(f.cash,60000);assert.equal(f.refundCash,0);
  assert.throws(()=>externalCostFrames({documentation:'unknown',refund:'assumed'}),RangeError);
});
test('housing own reserve transfer creates no money or expense and exact month12 funds repair once',()=>{
  const saved=ownReserveFrames(),unsaved=ownReserveFrames({reserveTransfer:0});
  for(let i=0;i<saved.length;i++) {
    const f=saved[i];assert.equal(f.wallet+f.reserve,f.startCash+f.funding-f.spent);
    assert.equal(f.totalCash,unsaved[i].totalCash);assert.equal(f.spent,unsaved[i].spent);
  }
  assert.equal(saved[11].reserve,1100000);assert.equal(saved[12].paidFromReserve,1200000);assert.equal(saved[12].spent,1200000);assert.equal(saved[12].totalCash,0);
  assert.equal(unsaved[12].paidFromWallet,1200000);
});
test('housing failed or unknown repair is not retried when later funding arrives; zero is no payment',()=>{
  for(const reserveTransfer of [0,100000]) {
    const f=ownReserveFrames({repairMonth:6,reserveTransfer});
    assert.deepEqual(f[6].failure,{month:6,kind:'shortage',gap:600000});
    assert.deepEqual(f[12].failure,f[6].failure);assert.equal(f[12].spent,0);assert.equal(f[12].totalCash,1200000);assert.equal(f[12].status,'unpaid');
  }
  const unknown=ownReserveFrames({responsibility:'unknown'}).at(-1);assert.equal(unknown.spent,0);assert.equal(unknown.status,'unconfirmed');
  const zero=ownReserveFrames({repairCost:0,responsibility:'unknown'}).at(-1);assert.equal(zero.status,'no-payment');assert.equal(zero.failure,null);
  const noFunding=ownReserveFrames({monthlyFunding:0}).at(-1);assert.equal(noFunding.reserve,0);assert.equal(noFunding.failure.gap,1200000);
  assert.deepEqual(ownReserveFrames(),ownReserveFrames());
});
test('housing ongoing models reject invalid input rather than producing legal or numeric conclusions',()=>{
  for(const x of [NaN,Infinity,-1]) {
    assert.throws(()=>mortgagePaths({prepayment:x}),RangeError);
    assert.throws(()=>externalCostFrames({levy:x}),RangeError);
    assert.throws(()=>ownReserveFrames({monthlyFunding:x}),RangeError);
  }
  assert.throws(()=>mortgagePaths({principal:100e6+1}),RangeError);
  assert.throws(()=>externalCostFrames({startCash:0}),RangeError);
  for(const repairMonth of [0,13,1.5]) assert.throws(()=>ownReserveFrames({repairMonth}),RangeError);
});

test('outside funding is an explicit frame flow, never an internal-transfer gain',()=>{for(const monthlyFunding of [0,100000]) {const f=ownReserveFrames({monthlyFunding,reserveTransfer:0});assert.equal(f[0].incoming,0);for(let m=1;m<=12;m++){assert.equal(f[m].incoming,monthlyFunding);assert.equal(f[m].funding-f[m-1].funding,f[m].incoming);}}});

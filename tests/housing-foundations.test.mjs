import test from 'node:test';
import assert from 'node:assert/strict';
import {rightsFrames, rentComparison, housingModes, rentalTimeline} from '../src/simulations/housing/foundations.mjs';
import {readFileSync} from 'node:fs';
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('housing rights: loan and exchange preserve wealth, fees reduce it once',()=>{
 for(const o of housingModes) for(const fee of [false,true]) {
  const r=rightsFrames(o.id,fee);
  r.states.forEach(s=>{near(s.cash+s.claim+s.home-s.debt,s.netWorth);near(s.netWorth+s.expense,150e6);assert(s.cash>=0);});
  assert.equal(r.states[1].cash,150e6+o.loan);
  assert.equal(r.states[2].claim,o.id==='buy'?0:o.payment);
  assert.equal(r.states[2].home,o.id==='buy'?o.payment:0);
  assert.equal(r.states[3].debt,o.loan);
  assert.deepEqual(rightsFrames(o.id,fee),r);
 }
 assert.equal(rightsFrames('buy',true).states[3].cash,25e6);
 assert.equal(rightsFrames('jeonse',true).states[3].cash,29e6);
 assert.throws(()=>rightsFrames('unknown'),RangeError);
});
test('housing offers: default difference is 6%, not a legal conversion calculation',()=>{
 const r=rentComparison(); assert.equal(r.additional,40e6); assert.equal(r.rentSaving,200000); near(r.annualizedOffer,.06);
 assert.equal(r.monthlyInterest,0); assert.equal(r.monthlyOpportunity,100000); assert.equal(r.monthlyEconomicDifference,100000);
 assert.match(r.rateReason,/法|법정/);
});
test('housing sources: each additional won has exactly one source and cost basis',()=>{
 for(const loanShare of [0,.25,.5,1]) {
  const r=rentComparison({loanShare}); near(r.ownAdditional+r.financed,r.additional);
  near(r.monthlyInterest,r.financed*.04/12); near(r.monthlyOpportunity,r.ownAdditional*.03/12);
  near(r.monthlyEconomicDifference,r.rentSaving-r.monthlyInterest-r.monthlyOpportunity);
 }
 const r=rentComparison({loanShare:1});assert.equal(r.monthlyOpportunity,0);
});
test('housing zero, reverse, negative offer difference and funding failures remain explicit',()=>{
 assert.equal(rentComparison({depositB:20e6}).annualizedOffer,null);
 const reverse=rentComparison({depositB:10e6,rentB:800000});assert.equal(reverse.annualizedOffer,null);assert.equal(reverse.financed,0);assert.equal(reverse.ownAdditional,0);assert.equal(reverse.monthlyEconomicDifference,null);
 assert.equal(rentComparison({rentB:800000}).annualizedOffer,-.03);
 assert.equal(rentComparison({available:0}).shortageA,20e6);
 assert.equal(rentComparison({available:60e6-1}).shortageB,1);
 assert.equal(rentComparison({available:20e6,loanShare:1}).shortageB,0);
 assert.equal(rentComparison({loanRate:0,opportunityRate:0}).monthlyEconomicDifference,200000);
});
test('housing invalid nonfinite, negative and share inputs cannot produce a plausible result',()=>{
 for(const key of ['depositB','rentB','loanShare','loanRate','opportunityRate','available']) for(const bad of [NaN,Infinity,-1]) assert.throws(()=>rentComparison({[key]:bad}),RangeError);
 for(const key of ['loanShare','loanRate','opportunityRate']) assert.throws(()=>rentComparison({[key]:1.01}),RangeError);
});
test('housing public IDs preserve volume 6 and intro outside chapter denominator',()=>{
 const s=readFileSync(new URL('../src/catalog.ts',import.meta.url),'utf8');
 assert.match(s,/id: "housing", categoryId: "money", volume: 6/);
 for(const id of ['housing-rights','rent-and-deposit'])assert(s.includes(`readId: "housing/${id}"`));
 assert(!s.includes('readId: "housing/intro"'));
});

test('housing rental timeline separates principal return from consumed rent',()=>{
 for(const deposit of [0,20e6,60e6])for(const rent of [0,500000,700000])for(const months of [1,12,24,36]){
  const fs=rentalTimeline({deposit,rent,months});
  fs.forEach(f=>near(f.netOut-f.claim,f.rentExpense));
  assert.equal(fs[3].claim,0);assert.equal(fs[3].refund,deposit);near(fs[3].netOut,rent*months);
  assert.deepEqual(fs,rentalTimeline({deposit,rent,months}));
 }
 for(const months of [0,1.5,121,NaN])assert.throws(()=>rentalTimeline({months}),RangeError);
});

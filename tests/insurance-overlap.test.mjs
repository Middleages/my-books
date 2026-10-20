import test from 'node:test';
import assert from 'node:assert/strict';
import { overlapDefaults, projectOverlap, overlapScenarios } from '../src/simulations/insurance/overlap.mjs';
const sum=items=>items.reduce((a,b)=>a+b,0);
const close=(a,b,scale=Math.max(1,Math.abs(b)))=>assert(Math.abs(a-b)<=16*Number.EPSILON*scale,`${a} != ${b} (scale ${scale})`);
function check(r){
  const scale=Math.max(1,r.params.grossLoss,r.capSum);
  assert(r.paidA>=0&&r.paidA<=r.eligibleCapA);assert(r.paidB>=0&&r.paidB<=r.eligibleCapB);
  assert(r.totalPaid>=0&&r.totalPaid<=r.eligibleLoss);assert(r.gap>=0);assert(r.outside>=0);
  close(r.paidA+r.paidB,r.totalPaid,scale);close(r.outside+r.eligibleLoss,r.params.grossLoss,scale);close(r.totalPaid+r.remainingBurden,r.params.grossLoss,scale);
  for(const [amount,cap]of [[r.paidA,r.eligibleCapA],[r.paidB,r.eligibleCapB]]){const expected=r.capSum===0?0:r.totalPaid*(cap/r.capSum);close(amount,expected,Math.max(Number.MIN_VALUE,Math.abs(expected),Math.abs(amount)));}
  for(const frame of r.frames){close(sum(frame.segments.map(s=>s.amount)),r.params.grossLoss,scale);let left=0;for(const s of frame.segments){assert(Number.isFinite(s.amount)&&s.amount>=0);assert(s.fraction>=0&&s.fraction<=1);close(s.leftFraction*r.params.grossLoss,left,scale);close(s.fraction*r.params.grossLoss,s.amount,scale);left+=s.amount;}close(sum(frame.segments.map(s=>s.fraction)),r.params.grossLoss===0?0:1);}
}
test('fictional equal caps allocate 1.5m each within one 3m loss and fixed promises remain separate',()=>{
  const r=projectOverlap();assert.deepEqual(r.params,overlapDefaults);assert.equal(r.eligibleLoss,3000000);assert.equal(r.capSum,6000000);assert.equal(r.paidA,1500000);assert.equal(r.paidB,1500000);assert.equal(r.totalPaid,3000000);assert.equal(r.fixedTotal,3000000);assert.deepEqual(r.segments.map(s=>s.id),['a','b','gap','outside','unresolved']);assert.equal(sum(r.segments.map(s=>s.amount)),3000000);check(r);
});
test('unequal 1m/3m caps allocate the 3m loss as 0.75m/2.25m',()=>{const r=projectOverlap({capA:1000000});assert.equal(r.paidA,750000);assert.equal(r.paidB,2250000);check(r);});
test('a lone eligible contract pays only up to its own remaining cap',()=>{
  for(const side of ['A','B']){const r=projectOverlap({eligibleA:side==='A',eligibleB:side==='B',capA:1000000,capB:1000000});assert.equal(r.paidA,side==='A'?1000000:0);assert.equal(r.paidB,side==='B'?1000000:0);assert.equal(r.gap,2000000);check(r);}
});
test('both excluded contracts yield zero paid while the entire actual loss remains',()=>{const r=projectOverlap({eligibleA:false,eligibleB:false});assert.equal(r.capSum,0);assert.equal(r.totalPaid,0);assert.equal(r.gap,3000000);assert.equal(r.remainingBurden,3000000);check(r);});
test('zero eligible caps avoid division by zero and preserve finite segments',()=>{
  for(const params of [{capA:0,capB:0},{capA:0,eligibleB:false},{eligibleA:false,capB:0}]){const r=projectOverlap(params);assert.equal(r.totalPaid,0);check(r);}
});
test('outside loss and cap gap are distinct parts of a single gross loss',()=>{
  const r=projectOverlap({grossLoss:5000000,excludedLoss:1000000,capA:1000000,capB:1000000});assert.equal(r.eligibleLoss,4000000);assert.equal(r.outside,1000000);assert.equal(r.gap,2000000);assert.equal(r.remainingBurden,3000000);check(r);
});
test('outside loss is clamped to gross loss, never a negative eligible region',()=>{const r=projectOverlap({excludedLoss:5000000});assert.equal(r.params.excludedLoss,5000000);assert.equal(r.outside,3000000);assert.equal(r.eligibleLoss,0);assert.equal(r.totalPaid,0);assert.equal(r.gap,0);check(r);});
test('zero loss has no invented area and does not suppress unrelated conditional fixed promises',()=>{const r=projectOverlap({grossLoss:0});assert.equal(r.totalPaid,0);assert.equal(r.remainingBurden,0);assert.equal(r.fixedTotal,3000000);r.frames.forEach(f=>f.segments.forEach(s=>assert.equal(s.fraction,0)));check(r);});
for(const [fixedA,fixedB,total] of [[true,true,3000000],[true,false,1000000],[false,true,2000000],[false,false,0]])test(`fixed promise conditions ${fixedA}/${fixedB} remain independent`,()=>{const r=projectOverlap({fixedA,fixedB});assert.equal(r.fixedTotal,total);assert.equal(r.fixed[0].paid,fixedA?1000000:0);assert.equal(r.fixed[1].paid,fixedB?2000000:0);assert.deepEqual(r.segments,projectOverlap().segments);check(r);});
test('all five frames match the staged numeric reveal and final identity',()=>{
  const r=projectOverlap({excludedLoss:1000000,capA:500000,capB:500000});assert.deepEqual(r.frames.map(f=>f.phase),['loss','region','eligibility','allocation','fixed']);
  for(const f of r.frames){assert.equal(f.eligibleLoss,f.index>=1?r.eligibleLoss:null);assert.equal(f.totalPaid,f.index>=3?r.totalPaid:null);assert.equal(f.paidA,f.index>=3?r.paidA:null);assert.equal(f.paidB,f.index>=3?r.paidB:null);assert.equal(f.fixedTotal,f.index===4?r.fixedTotal:null);assert.equal(f.verdict,f.index===4?r.verdict:null);f.capacities.forEach(c=>assert.equal(c.observed,f.index>=2));}
  assert.deepEqual(r.frames.at(-1).segments,r.segments);assert.deepEqual(r.frames.at(-1).fixed,r.fixed);check(r);
});
test('tiny cap is not inflated or erased by subtractive cancellation in either contract position',()=>{
  for(const tiny of [0.00007,1e-10,1e-30])for(const grossLoss of [1e12,.1])for(const swap of [false,true]){
    const capA=swap?tiny:1e12,capB=swap?1e12:tiny,r=projectOverlap({grossLoss,capA,capB});check(r);
    const paid=swap?r.paidA:r.paidB;assert(paid>0);assert(paid<=tiny);close(paid,r.totalPaid*(tiny/r.capSum),paid);
  }
});
test('zero, fractional won, near-full caps and largest finite supported amounts stay conservative',()=>{
  for(const options of [{grossLoss:1,capA:1,capB:2},{grossLoss:1/3,capA:2/3,capB:1/7},{grossLoss:1e12,excludedLoss:1e12-.01,capA:1e12,capB:1e12},{grossLoss:1e12,capA:1e12,capB:1e12},{grossLoss:.3,capA:.1,capB:.2},{grossLoss:1e-100,capA:1e12,capB:1e-90}])check(projectOverlap(options));
});
test('deterministic varied inputs preserve per-contract exact caps and the common loss',()=>{
  let seed=16423;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<2000;i++){const amount=()=>random()*10**Math.floor(random()*24-12);check(projectOverlap({grossLoss:amount(),excludedLoss:amount(),capA:amount(),capB:amount(),eligibleA:random()>.2,eligibleB:random()>.2,fixedA:random()>.5,fixedB:random()>.5}));}
});
test('fixed comparison rows are exact same-model results, not separate display formulas',()=>{const scenarios=overlapScenarios();assert.equal(scenarios.length,7);for(const {result}of scenarios){assert.deepEqual(projectOverlap(result.params),result);check(result);}});
test('overlap rejects malformed or nonfinite inputs rather than silently converting money',()=>{
  for(const options of [null,[],1,'yes'])assert.throws(()=>projectOverlap(options),TypeError);
  for(const key of['grossLoss','excludedLoss','capA','capB'])for(const value of [NaN,Infinity,-Infinity,-1,1e12+1,'300',null,undefined])assert.throws(()=>projectOverlap({[key]:value}),RangeError);
  for(const key of['eligibleA','eligibleB','fixedA','fixedB'])for(const value of [0,1,'yes',null,undefined])assert.throws(()=>projectOverlap({[key]:value}),TypeError);
});
test('repeated overlap runs and reset defaults are deterministic without mutable shared frames',()=>{const params=Object.freeze({grossLoss:1234567,capA:234567,capB:765432});const a=projectOverlap(params),b=projectOverlap(params);assert.deepEqual(a,b);assert.deepEqual(projectOverlap(overlapDefaults),projectOverlap());a.frames[0].segments[0].amount=999;assert.equal(a.frames[1].segments[0].amount,0);assert.notEqual(projectOverlap(params).segments[0].amount,999);});

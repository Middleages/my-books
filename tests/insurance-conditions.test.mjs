import test from 'node:test';
import assert from 'node:assert/strict';
import { conditionsDefaults, conditionsBoundaries, projectConditions, conditionsBoundaryCases } from '../src/simulations/insurance/conditions.mjs';
const close=(a,b,scale=Math.max(1,Math.abs(b)))=>assert(Math.abs(a-b)<=16*Number.EPSILON*scale,`${a} != ${b}`);
function checkResult(r){
  const t=r.timeline;
  close(t.periods.reduce((sum,p)=>sum+p.fraction,0),1);
  t.periods.forEach(p=>{assert(p.end>=p.start);close(p.leftFraction,(p.start-t.min)/(t.max-t.min));close(p.fraction,(p.end-p.start)/(t.max-t.min));});
  for(const m of t.markers){if(m.day===null)assert.equal(m.fraction,null);else{assert(m.fraction>=0&&m.fraction<=1);close(m.fraction,(m.day-t.min)/(t.max-t.min));}}
  assert.equal(r.frames.length,6);
  for(const f of r.frames.slice(0,-1)){assert.equal(f.benefit,null);assert.equal(f.rate,null);assert.equal(f.status,'pending');assert.equal(f.verdict,null);}
  const last=r.frames.at(-1);assert.equal(last.benefit,r.benefit);assert.equal(last.rate,r.rate);assert.equal(last.status,r.status);assert.equal(last.verdict,r.verdict);
  assert.deepEqual(last.gates,r.gates);
  assert(r.benefit===null||(r.benefit>=0&&r.benefit<=r.params.baseBenefit));
}

test('conditions defaults keep effectiveness, benefit start, full start and exclusive end separate',()=>{
  const r=projectConditions();assert.deepEqual(r.params,conditionsDefaults);assert.deepEqual(r.boundaries,conditionsBoundaries);
  assert.deepEqual(r.boundaries,{effective:0,benefitStart:30,fullStart:90,endExclusive:365});
  assert.equal(r.params.eventDay,29);assert.equal(r.params.claimDay,100);assert.equal(r.status,'waiting');assert.equal(r.benefit,0);
  assert.deepEqual(r.frames.map(f=>f.phase),['reference','chronology','event','exclusion','date','decision']);checkResult(r);
});
for(const [eventDay,status,rate]of[[-1,'outside',0],[0,'waiting',0],[29,'waiting',0],[30,'reduced',.5],[89,'reduced',.5],[90,'full',1],[364,'full',1],[365,'outside',0],[400,'outside',0]])test(`conditions exact boundary event ${eventDay} gives ${status}`,()=>{const r=projectConditions({eventDay,claimDay:430});assert.equal(r.status,status);assert.equal(r.rate,rate);assert.equal(r.benefit,2000000*rate);checkResult(r);});

test('claim date never substitutes for the event date, including claims after coverage end',()=>{
  for(const eventDay of [29,30,89,90,364]){
    const a=projectConditions({eventDay,claimDay:eventDay}),b=projectConditions({eventDay,claimDay:430});
    assert.equal(a.status,b.status);assert.equal(a.benefit,b.benefit);assert.equal(a.timeline.markers[0].fraction,b.timeline.markers[0].fraction);
  }
});
test('impossible chronology is explicit, unpaid is not inferred, and exact same-day is allowed',()=>{
  const r=projectConditions({eventDay:90,claimDay:89});assert.equal(r.status,'invalid');assert.equal(r.benefit,null);assert.equal(r.rate,null);assert.equal(r.gates[0].state,'invalid');assert.match(r.verdict,/거절 판정이 아닙니다/);checkResult(r);
  assert.equal(projectConditions({eventDay:90,claimDay:90}).benefit,2000000);
});
for(const patch of[{eventDay:null},{claimDay:null},{coveredEvent:null},{exclusionApplies:null},{informationKnown:false}])test(`conditions unknown ${Object.keys(patch)[0]} stays unresolved`,()=>{
  const r=projectConditions({eventDay:90,...patch});assert.equal(r.status,'unresolved');assert.equal(r.rate,null);assert.equal(r.benefit,null);assert.match(r.verdict,/0원이나 자동 거절/);checkResult(r);
});
test('unknown information is retained even alongside a known exclusion or waiting date',()=>{
  for(const options of [{eventDay:29,exclusionApplies:null},{eventDay:90,coveredEvent:false,informationKnown:false},{eventDay:90,exclusionApplies:true,coveredEvent:null}]){const r=projectConditions(options);assert.equal(r.status,'unresolved');assert.equal(r.benefit,null);}
});
test('covered-event and exclusion gates are independent of the event-date gate',()=>{
  const notCovered=projectConditions({eventDay:90,coveredEvent:false});assert.equal(notCovered.status,'not-covered');assert.equal(notCovered.benefit,0);assert.equal(notCovered.gates[1].state,'fail');assert.equal(notCovered.gates[3].state,'pass');
  const excluded=projectConditions({eventDay:90,exclusionApplies:true});assert.equal(excluded.status,'excluded');assert.equal(excluded.benefit,0);assert.equal(excluded.gates[1].state,'pass');assert.equal(excluded.gates[2].state,'fail');
});
test('gates reveal exactly one independent question per observation frame',()=>{
  const r=projectConditions({eventDay:90,exclusionApplies:null});for(let index=0;index<r.frames.length;index++)r.frames[index].gates.forEach((g,i)=>assert.equal(g.state,index>=i+1?r.gates[i].state:'pending'));
});
test('null dates have no invented marker location and large dates expand the common axis',()=>{
  for(const options of[{eventDay:null},{claimDay:null},{eventDay:-100000,claimDay:100000}])checkResult(projectConditions(options));
  const r=projectConditions({eventDay:-100000,claimDay:100000});assert.equal(r.timeline.min,-100000);assert.equal(r.timeline.max,100000);assert.equal(r.timeline.markers[0].fraction,0);assert.equal(r.timeline.markers[1].fraction,1);
});
test('zero, fractional and large finite promised amounts preserve the exact date rate',()=>{
  for(const baseBenefit of [0,.01,1/3,2000000,1e12])for(const eventDay of[29,30,89,90,364,365]){const r=projectConditions({eventDay,claimDay:400,baseBenefit});assert.equal(r.benefit,baseBenefit*r.rate);checkResult(r);}
});
test('boundary static alternatives are generated from the same model with claim day 400',()=>{
  const rows=conditionsBoundaryCases();assert.deepEqual(rows.map(r=>r.params.eventDay),[-1,0,29,30,89,90,364,365]);for(const r of rows){assert.equal(r.params.claimDay,400);assert.deepEqual(r,projectConditions({eventDay:r.params.eventDay,claimDay:400}));}
});
test('conditions model rejects malformed inputs rather than coercing facts or dates',()=>{
  for(const value of [null,[],3,'date'])assert.throws(()=>projectConditions(value),TypeError);
  for(const key of['eventDay','claimDay'])for(const value of[NaN,Infinity,-Infinity,100001,-100001,.5,'90',undefined])assert.throws(()=>projectConditions({[key]:value}),RangeError);
  for(const key of ['coveredEvent','exclusionApplies'])for(const value of [0,1,'yes',undefined])assert.throws(()=>projectConditions({[key]:value}),TypeError);
  for(const value of [null,0,'true',undefined])assert.throws(()=>projectConditions({informationKnown:value}),TypeError);
  for(const value of [NaN,Infinity,-1,1e12+1,'200'])assert.throws(()=>projectConditions({baseBenefit:value}),RangeError);
});
test('conditions repeated runs are deterministic, do not mutate options, and own frame arrays',()=>{
  const options=Object.freeze({eventDay:30,claimDay:400,exclusionApplies:false});const a=projectConditions(options),b=projectConditions(options);assert.deepEqual(a,b);assert.deepEqual(projectConditions(),projectConditions(conditionsDefaults));a.frames[0].gates[0].label='changed';assert.notEqual(a.frames[1].gates[0].label,'changed');assert.notEqual(projectConditions(options).gates[0].label,'changed');
});

import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {adjustmentFrame} from '../src/simulations/child-family/adjustment.mjs';
import {agreementFrame} from '../src/simulations/child-family/agreements.mjs';
test('observation context shares one order and never fills unknown from a switch alone',()=>{
 for(let day=0;day<3;day++)for(const shared of [false,true]){const f=adjustmentFrame(day,shared);assert.deepEqual(f.slots.map(s=>s.context),['등원','돌봄 중','재회']);assert.equal(f.slots[1].known,shared&&day!==1);assert.equal(f.slots[0].known,true);assert.equal(f.slots[2].known,true);assert.deepEqual(f.links.map(l=>l.connected),[shared&&day!==1,shared&&day!==1]);assert.equal(f.observedFacts.length,f.slots.filter(s=>s.known).length);assert(f.unknowns.includes('이후의 적응 경과'));assert(!('score' in f));assert(!('successDays' in f));}
});
test('sharing teacher observation preserves home facts and interpretation distinction',()=>{for(let day=0;day<3;day++){const a=adjustmentFrame(day),b=adjustmentFrame(day,true);assert.deepEqual(a.slots[0],b.slots[0]);assert.deepEqual(a.slots[2],b.slots[2]);assert.deepEqual(a.hypotheses,b.hypotheses);assert(!b.observedFacts.includes(b.hypotheses[0]));}});
test('agreement preference moves nodes but never changes fixed boundary or rule status',()=>{for(const answer of [false,true]){const a=agreementFrame('separate',answer),b=agreementFrame('shared',answer);assert.equal(a.choices.length,2);assert.equal(b.choices.length,1);assert.deepEqual(a.choices.map(c=>c.lane),['A','B']);assert.equal(b.choices[0].lane,'shared');assert.equal(a.boundary,b.boundary);assert.deepEqual(a.rule,b.rule);assert.equal(a.agreement,b.agreement);assert(a.unknowns.includes('두 성인의 실제 동의'));assert(b.unknowns.includes('실제 기관의 규칙'));}});
test('institution answer changes only relevant evidence without fabricating consent',()=>{const a=agreementFrame(),b=agreementFrame('separate',true);assert.equal(a.rule.known,false);assert.equal(b.rule.known,true);assert.deepEqual(a.choices,b.choices);assert.deepEqual(a.hypotheses,b.hypotheses);assert.equal(b.observedFacts.length,1);assert.equal(a.observedFacts.length,0);assert.equal(b.agreement,a.agreement);});
test('both frames provide common contract and deterministic fresh reset',()=>{for(const make of [adjustmentFrame,agreementFrame]){const original=make(),other=make();for(const key of ['scenarioId','ageBand','sourceIds','observedFacts','hypotheses','unknowns','step','selectedOption'])assert(key in original);other.unknowns.push('mutation');assert.deepEqual(make(),original);}});
test('invalid observations and flags reject rather than coerce real inputs',()=>{for(const day of [-1,3,0.5,NaN,null,'0'])assert.throws(()=>adjustmentFrame(day),RangeError);for(const flag of [0,1,null,'yes']){assert.throws(()=>adjustmentFrame(0,flag),RangeError);assert.throws(()=>agreementFrame('shared',flag),RangeError);}for(const option of ['',null,'actual'])assert.throws(()=>agreementFrame(option),RangeError);});

test('C select accessible names remain independent of option text',()=>{
 for(const [file,label] of [['AdjustmentLab.tsx','가상 기록 선택'],['AgreementsLab.tsx','인사 방식 제안']]){
  const source=readFileSync(new URL('../src/components/child-family/'+file,import.meta.url),'utf8');
  assert(source.includes('<select aria-label="'+label+'"'));
 }
});

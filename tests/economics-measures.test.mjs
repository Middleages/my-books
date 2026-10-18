import test from 'node:test';
import assert from 'node:assert/strict';
import { output, growth, production, jobs, jobFrames, transactions } from '../src/simulations/economics/measures.mjs';
const base={quantity:100,price:10};
test('최종재와 부가가치 합 일치, 중간재 중복은 제외',()=>{
 const r=production(base);assert.equal(r.nominal,1000);assert.equal(r.gross,1900);
 assert.deepEqual(r.stages.map(s=>s.valueAdded),[400,100,500]);
 assert.equal(r.stages.reduce((n,s)=>n+s.valueAdded,0),r.nominal);
});
test('가격만·수량만·둘 다 변경에서 명목과 실질 구분',()=>{
 const price=output(base,{quantity:100,price:12});assert.equal(price.nominalGrowth,20);assert.equal(price.realGrowth,0);
 const quantity=output(base,{quantity:120,price:10});assert.equal(quantity.realGrowth,20);
 const both=output(base,{quantity:120,price:12});assert.equal(both.current.nominal,1440);assert.equal(both.current.real,1200);assert.equal(both.nominalGrowth,44);
});
test('0기준은 정의 불가, 감소는 음수, 성장과 수준 구분',()=>{
 assert.equal(growth(0,0),null);assert.equal(growth(100,0),null);assert.equal(growth(0,100),-100);
 assert.equal(output({quantity:0,price:10},base).realGrowth,null);
 assert.equal(output(base,{quantity:80,price:10}).realGrowth,-20);
});
test('생산 범위 경계·보존·재실행·입력 불변',()=>{
 for(const quantity of [0,1,100,200])for(const price of [0,1,10,20]){
 const p={quantity,price},r=output(base,p);assert.equal(r.current.stages.reduce((n,s)=>n+s.valueAdded,0),r.current.nominal);assert.deepEqual(output(base,p),r);assert.deepEqual(p,{quantity,price});
 }
});
test('GDP 제외 거래와 새 서비스 구분',()=>{
 assert.equal(transactions.find(t=>t.id==='used').included,false);assert.equal(transactions.find(t=>t.id==='stock').included,false);assert.equal(transactions.find(t=>t.id==='transfer').included,false);assert.equal(transactions.find(t=>t.id==='fee').included,true);
});
test('구직 중단은 취업 증가 없이 실업률 하락, 고용률 불변',()=>{
 const fs=jobFrames({employed:60,unemployed:10,inactive:30},'stop',5),a=fs[0],b=fs.at(-1);
 assert.equal(a.unemploymentRate,100/7);assert.equal(b.unemployed,5);assert.equal(b.inactive,35);assert.equal(b.employmentRate,60);assert.ok(b.unemploymentRate<a.unemploymentRate);
 for(const f of fs)assert.equal(f.population,100);
});
test('취업·해고·구직 시작 이동, 부족 인원은 이동하지 않음',()=>{
 const p={employed:60,unemployed:10,inactive:30};
 assert.equal(jobFrames(p,'hire',10).at(-1).employed,70);
 assert.equal(jobFrames(p,'lose',5).at(-1).unemployed,15);
 assert.equal(jobFrames(p,'search',5).at(-1).labourForce,75);
 const r=jobFrames(p,'hire',20).at(-1);assert.equal(r.moved,10);assert.equal(r.unfilled,10);assert.equal(r.employed,70);
 assert.deepEqual(jobFrames(p,'stop',5),jobFrames(p,'stop',5));assert.deepEqual(p,{employed:60,unemployed:10,inactive:30});
});
test('고용 분모 0과 극단값',()=>{
 const empty=jobs({employed:0,unemployed:0,inactive:0});assert.equal(empty.employmentRate,null);assert.equal(empty.unemploymentRate,null);
 const inactive=jobs({employed:0,unemployed:0,inactive:100});assert.equal(inactive.employmentRate,0);assert.equal(inactive.unemploymentRate,null);
 assert.equal(jobs({employed:0,unemployed:100,inactive:0}).unemploymentRate,100);
 assert.equal(jobs({employed:100,unemployed:0,inactive:0}).employmentRate,100);
});
test('비유한·음수·분수 인원·범위 밖·알 수 없는 이동 거부',()=>{
 for(const x of [-1,NaN,Infinity,201])assert.throws(()=>production({quantity:x,price:10}),RangeError);
 assert.throws(()=>production({quantity:1,price:21}),RangeError);
 for(const x of [-1,0.5,NaN,Infinity,101])assert.throws(()=>jobs({employed:x,unemployed:0,inactive:0}),RangeError);
 assert.throws(()=>jobFrames({employed:1,unemployed:1,inactive:1},'bogus',1),RangeError);
 assert.throws(()=>jobFrames({employed:1,unemployed:1,inactive:1},'hire',-1),RangeError);
});
test('0명 이동에서는 감소했다고 해설하지 않는다',()=>{
 const r=jobFrames({employed:60,unemployed:10,inactive:30},'stop',0).at(-1);
 assert.match(r.explanation,/변하지/);assert.doesNotMatch(r.explanation,/줄어/);
 assert.match(jobFrames({employed:60,unemployed:10,inactive:30},'stop',5).at(-1).explanation,/줄어/);
});

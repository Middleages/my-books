import test from 'node:test';
import assert from 'node:assert/strict';
import {RECOVERY_CASES,RECOVERY_EVENTS,recoveryFrames,recoverySnapshot,recoveryMeasures} from '../src/simulations/database/recovery.mjs';
import {CANONICAL_FIXTURE,validateFixture} from '../src/simulations/database/fixture.mjs';
const baseline=structuredClone(CANONICAL_FIXTURE);
const frozen=v=>{if(v&&typeof v==='object'){assert(Object.isFrozen(v));Object.values(v).forEach(frozen);}};
for(const scenario of RECOVERY_CASES)test(`${scenario}: deterministic recovery frames with service and data gates`,()=>{
 const fs=recoveryFrames({scenario});frozen(fs);assert.deepEqual(fs,recoveryFrames({scenario}));assert(fs.at(-1).finished);
 for(const f of fs){assert.equal(f.elapsed,f.steps.reduce((n,s)=>n+s.duration,0));assert(f.steps.every((s,i)=>s.start===(i?f.steps[i-1].end:0)&&s.end-s.start===s.duration));
  if(f.dataset){assert(validateFixture(f.dataset).valid);assert.deepEqual(f.measures,recoveryMeasures(f.dataset));}
  if(f.serviceUp){assert.equal(f.phase,'switch');assert(f.checks.every(c=>c.passed));assert.equal(f.target.state,'serving');assert.equal(f.recoveryDuration,f.elapsed);}
  else{assert.equal(f.recoveryDuration,null);assert.equal(f.rtoWithinTarget,null);}
  if(f.rpoWithinTarget!==null)assert(f.checks.filter(c=>c.id!=='app-read').every(c=>c.passed));
  assert.equal(new Set(f.appliedIds).size,f.appliedIds.length);
 }
 assert.deepEqual(CANONICAL_FIXTURE,baseline);
});
test('RPO4<=5 and RTO21>20 are different axes and verdicts',()=>{
 const f=recoveryFrames().at(-1);assert.equal(f.recoverableThrough,11);assert.equal(f.recoveredThrough,11);assert.equal(f.lossWindow,4);assert.equal(f.rpoWithinTarget,true);assert.equal(f.elapsed,21);assert.equal(f.rtoWithinTarget,false);assert.equal(f.serviceUp,true);assert.deepEqual(f.unavailableEventIds,['event:6']);assert.deepEqual(f.steps.map(s=>s.duration),[3,4,6,2,5,1]);
 assert.equal(f.measures.orderCount,8);assert.equal(f.measures.itemCount,9);assert.equal(f.measures.confirmedAmountWon,96000);assert.deepEqual(f.measures.stocks.map(s=>s.qty),[0,8,3]);
});
test('dump snapshot09:58 differs from completion10:00 and cannot replay WAL',()=>{
 const fs=recoveryFrames({scenario:'logical-dump'}),f=fs.at(-1);assert.equal(f.backup.snapshotMinute,-2);assert.equal(f.backup.completedMinute,0);assert.equal(f.lossWindow,17);assert.equal(f.rpoWithinTarget,false);assert.equal(f.recoveredThrough,-2);assert.equal(f.appliedIds.length,0);assert(f.segments.every(s=>!s.available));assert.equal(fs.find(f=>f.phase==='copy').dataset,null);assert.deepEqual(f.dataset,CANONICAL_FIXTURE);assert.equal(f.measures.confirmedAmountWon,36000);assert.equal(f.steps[2].label,'logical 데이터 적재');
});
test('missing interval7 blocks later8..11 despite their existence',()=>{
 const f=recoveryFrames({scenario:'missing-wal'}).at(-1);assert.equal(f.segments[6].available,false);assert(f.segments.slice(7).every(s=>s.available));assert.equal(f.recoverableThrough,6);assert.equal(f.lossWindow,9);assert.equal(f.rpoWithinTarget,false);assert.deepEqual(f.appliedIds,['event:1','event:2','event:3']);assert.equal(f.measures.confirmedAmountWon,72000);assert.deepEqual(f.measures.stocks.map(s=>s.qty),[2,8,3]);
 const replay=recoveryFrames({scenario:'missing-wal'}).find(f=>f.phase==='replay');assert.equal(replay.flows.length,6);assert(!replay.flows.some(f=>f.from==='wal-interval:8'));
});
test('same-storage loss cannot fabricate zero RPO or data counts or service success',()=>{
 const f=recoveryFrames({scenario:'same-storage-lost'}).at(-1);for(const k of ['recoverableThrough','recoveredThrough','lossWindow','target','dataset','measures','recoveryDuration','rpoWithinTarget','rtoWithinTarget'])assert.equal(f[k],null,k);assert.equal(f.backup.survives,false);assert.equal(f.serviceUp,false);assert.equal(f.elapsed,3);assert.equal(f.steps[0].status,'blocked');
});
test('data validity with failed app permission is not recovery completion at20minutes',()=>{
 const f=recoveryFrames({scenario:'validation-failure'}).at(-1);assert.equal(f.elapsed,20);assert.equal(f.finished,true);assert.equal(f.serviceUp,false);assert.equal(f.rpoWithinTarget,true);assert.equal(f.recoveryDuration,null);assert.equal(f.rtoWithinTarget,null);assert.equal(f.target.state,'validation-blocked');assert(f.checks.slice(0,-1).every(c=>c.passed));assert.equal(f.checks.at(-1).id,'app-read');assert.equal(f.checks.at(-1).passed,false);assert(!f.steps.some(s=>s.id==='switch'));
});
test('single fixture applies only new events; integer money and known missing identities',()=>{
 assert.deepEqual(recoverySnapshot(-2),CANONICAL_FIXTURE);assert.equal(RECOVERY_EVENTS.length,6);const m=recoveryMeasures(recoverySnapshot(15));assert.equal(m.orderCount,9);assert.equal(m.itemCount,10);assert.equal(m.confirmedAmountWon,100000);assert.deepEqual(m.stocks.map(s=>s.qty),[0,7,3]);
 assert(!m.rowIds.includes('orders:undefined'));for(const n of [-3,16,1.5,NaN,'11',null])assert.throws(()=>recoverySnapshot(n));
 for(const x of [null,[],4,{scenario:null},{scenario:'x'},{target:15}])assert.throws(()=>recoveryFrames(x));assert.throws(()=>recoveryMeasures({}));
});
test('rendered relation and aggregate transfer proof have exact dataset/edge provenance',()=>{
 for(const scenario of RECOVERY_CASES)for(const f of recoveryFrames({scenario})){
  if(f.relationProof){const p=f.relationProof,item=f.dataset.order_items.find(i=>i.order_id===p.orderId&&i.product_id===p.productId);assert(item);assert.equal(item.qty,p.qty);assert.equal(f.dataset.products.find(x=>x.id===p.productId).available_qty,p.stock);assert.equal(p.orderKey,`orders:${p.orderId}`);assert.equal(p.itemKey,`order_items:${p.orderId}:1`);}
  else assert.equal(f.dataset,null);
  const transfers=f.flows.filter(e=>e.from!=='app-reader');
  if(transfers.length){assert.deepEqual(f.transfer.sourceIds,transfers.map(e=>e.from));assert(transfers.every(e=>e.to===f.transfer.targetId));assert.equal(f.transfer.targetId,f.target.id);if(f.transfer.sourceGroup==='wal-prefix')assert.equal(f.transfer.sourceIds.length,f.recoverableThrough);}
  else assert.equal(f.transfer,null);
 }
});

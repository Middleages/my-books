import test from 'node:test';
import assert from 'node:assert/strict';
import {DURABILITY_CASES,WAL_RECORDS,durabilityFrames} from '../src/simulations/database/durability.mjs';
import {CANONICAL_FIXTURE} from '../src/simulations/database/fixture.mjs';
const baseline=structuredClone(CANONICAL_FIXTURE);
const frozen=v=>{if(v&&typeof v==='object'){assert(Object.isFrozen(v));Object.values(v).forEach(frozen);}};
for(const scenario of DURABILITY_CASES)test(`${scenario}: deterministic immutable states, page/log ordering and current instance lifetimes`,()=>{
 const fs=durabilityFrames({scenario});assert.deepEqual(fs,durabilityFrames({scenario}));frozen(fs);assert(fs.at(-1).finished);
 for(const f of fs){if(f.storage){assert(f.storage.page.lsn<=f.storage.durableEnd);assert.equal(f.storage.durableEnd,f.storage.walRecords.at(-1)?.endLsn??0);assert(f.storage.walRecords.every(r=>r.endLsn<=f.storage.durableEnd));}
  if(f.phase==='crash'){assert.equal(f.ram,null);assert.equal(f.osCache,null);assert.equal(f.server,'offline');assert.equal(f.readResult,null);}
  if(f.ram){assert.equal(new Set(f.ram.page.versions.map(v=>v.id)).size,f.ram.page.versions.length);assert(f.ram.page.versions.every(v=>v.rowId==='products:101'));}
  if(f.readResult){assert.equal(f.phase,'read');assert(f.ram.page.versions.some(v=>v.id===f.readResult.versionId&&v.qty===f.readResult.qty));}
 }
 assert.deepEqual(CANONICAL_FIXTURE,baseline);
});
test('cache write is not durable WAL; synchronous response waits for flush',()=>{
 for(const scenario of ['sync-before-flush','sync-after-flush-before-ack','sync-after-ack']){const fs=durabilityFrames({scenario}),cache=fs.find(f=>f.phase==='cache-write');assert.deepEqual(cache.osCache.walIds,['wal:10','wal:20']);assert.equal(cache.storage.durableEnd,0);assert.equal(cache.acknowledged,false);for(const f of fs.filter(f=>f.acknowledged&&f.storage))assert.equal(f.storage.durableEnd,20);}
 assert.equal(durabilityFrames({scenario:'sync-before-flush'}).at(-1).readResult.qty,5);
});
test('durable commit recovers new stock even with data page0 and without app response',()=>{
 const fs=durabilityFrames({scenario:'sync-after-flush-before-ack'}),crash=fs.find(f=>f.phase==='crash'),end=fs.at(-1);
 assert.equal(crash.storage.page.lsn,0);assert.equal(crash.storage.durableEnd,20);assert.equal(end.readResult.qty,4);assert.equal(end.acknowledged,false);assert.equal(end.appOutcome,'unknown');assert.equal(end.transactionStatus,'recovered-committed');assert.equal(end.ram.id,'ram:boot2');assert.notEqual(end.ram.id,fs[0].ram.id);
});
test('uncommitted physical new tuple survives yet old tuple remains visible; redo is idempotent',()=>{
 const fs=durabilityFrames({scenario:'uncommitted-page'}),written=fs.find(f=>f.phase==='page-write'),end=fs.at(-1);
 assert.equal(written.storage.page.lsn,10);assert.equal(written.storage.durableEnd,10);assert.deepEqual(written.storage.page.versions.map(v=>v.qty),[5,4]);assert(!written.storage.walRecords.some(r=>r.kind==='commit'));
 assert.equal(end.replaySkipped,true);assert.deepEqual(end.ram.page.versions.map(v=>v.qty),[5,4]);assert.equal(end.readResult.versionId,'products:101:v0');assert.equal(end.readResult.qty,5);assert.equal(end.appOutcome,'no-commit-request');assert.equal(end.transactionStatus,'recovered-not-committed');
});
test('async success can precede lost recent change, while flushed async result survives',()=>{
 const lost=durabilityFrames({scenario:'async-before-flush'}).at(-1),kept=durabilityFrames({scenario:'async-after-flush'}).at(-1);
 assert.equal(lost.acknowledged,true);assert.equal(lost.appOutcome,'success-received');assert.equal(lost.readResult.qty,5);assert.equal(lost.storage.durableEnd,0);assert.equal(kept.readResult.qty,4);assert.equal(kept.storage.durableEnd,20);
});
test('storage loss has no zero-stock or fabricated recovered state',()=>{
 const end=durabilityFrames({scenario:'storage-loss'}).at(-1);assert.equal(end.phase,'blocked');assert.equal(end.storage,null);assert.equal(end.ram,null);assert.equal(end.osCache,null);assert.equal(end.readResult,null);assert.equal(end.acknowledged,true);assert.equal(end.finished,true);
});
test('record identities, page vs tx targets, and malformed inputs remain distinct',()=>{
 assert.deepEqual(WAL_RECORDS.map(r=>[r.id,r.txId,r.endLsn,r.pageId]),[['wal:10','T1',10,'P1'],['wal:20','T1',20,null]]);
 for(const x of [null,[],3,{scenario:null},{scenario:'x'},{crash:1}])assert.throws(()=>durabilityFrames(x));
});

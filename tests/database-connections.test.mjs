import test from 'node:test';
import assert from 'node:assert/strict';
import {POOL_SIZES,POOL_SCENARIOS,poolFrames,bindingFrames,connectionBudget} from '../src/simulations/database/connections.mjs';
const frozen=v=>{if(v&&typeof v==='object'){assert(Object.isFrozen(v));Object.values(v).forEach(frozen);}};
for(const size of POOL_SIZES)for(const scenario of POOL_SCENARIOS)test(`pool ${size}/${scenario}: ownership, lifecycle, accounting and replay`,()=>{
 const frames=poolFrames({size,scenario});assert.deepEqual(frames,poolFrames({size,scenario}));frozen(frames);
 for(const f of frames){
  assert(f.invariants.capacity&&f.invariants.uniqueOwners&&f.invariants.noPhantomClient);assert.equal(f.slots.length,size);
  assert.equal(f.queue.length,f.metrics.queued);assert.equal(f.leases.length,f.metrics.inUse);assert.equal(f.clients.length,f.metrics.openConnections);
  for(const c of f.clients){const leases=f.leases.filter(l=>l.clientId===c.id);assert.equal(leases.length,c.ownerRequestId===null?0:1);if(leases.length)assert.equal(leases[0].requestId,c.ownerRequestId);}
  for(const e of f.edges){if(e.kind==='lease')assert(f.leases.some(l=>l.id===e.leaseId));assert(e.kind==='lease'?f.requests.some(r=>r.id===e.from&&r.leaseId===e.leaseId)&&f.clients.some(c=>c.id===e.to):f.clients.some(c=>c.id===e.from&&c.sessionId===e.to));}
  for(const r of f.requests){const seg=f.segments.filter(s=>s.requestId===r.id);assert(seg.every(s=>s.end>s.start&&s.end<=f.tick));for(let i=1;i<seg.length;i++)assert(seg[i-1].end<=seg[i].start);
   if(r.status!=='acquire-error')assert.equal(seg.reduce((s,x)=>s+x.end-x.start,0),r.completedAt??f.tick);
   if(r.status==='completed')assert(!f.leases.some(l=>l.requestId===r.id));}
 }
 assert.equal(frames.at(-1).finished,true);
});
test('normal completion2/2/4/4 versus2/4/6/8; idle connections survive released leases',()=>{
 assert.deepEqual(poolFrames().at(-1).requests.map(r=>r.completedAt),[2,2,4,4]);
 assert.deepEqual(poolFrames({size:1}).at(-1).requests.map(r=>r.completedAt),[2,4,6,8]);
 const f=poolFrames().at(-1);assert.equal(f.leases.length,0);assert.equal(f.clients.length,2);assert.equal(f.metrics.idle,2);assert.equal(f.leaseHistory.length,4);
 assert.equal(poolFrames()[0].clients.length,0);assert.equal(poolFrames()[0].slots.length,2);
});
test('SQL ends before app-held release; leak retains real lease not invented eventual outcome',()=>{
 const f=poolFrames({scenario:'long-hold'}).find(f=>f.tick===3);assert.equal(f.requests[0].sqlEndedAt,2);assert.equal(f.requests[0].status,'app-held');assert.equal(f.requests[0].completedAt,null);
 const leak=poolFrames({size:1,scenario:'leak'}).at(-1);assert.equal(leak.tick,8);assert.equal(leak.phase,'observation-end');assert.equal(leak.metrics.queued,3);assert.equal(leak.metrics.completed,0);assert.equal(leak.leases.length,1);assert.equal(leak.requests[0].completedAt,null);
 const parallel=poolFrames({scenario:'leak'}).at(-1);assert.equal(parallel.metrics.completed,3);assert.equal(parallel.metrics.inUse,1);
});
test('acquisition failure creates no client/lease, no phantom SQL, no erroneous release',()=>{
 for(const size of POOL_SIZES){const frames=poolFrames({size,scenario:'acquire-failure'}),f=frames.at(-1),r=f.requests[0];assert.equal(r.status,'acquire-error');assert.equal(r.acquiredAt,null);assert.equal(r.sqlEndedAt,null);assert.equal(r.clientId,null);assert.equal(r.leaseId,null);assert(!f.leaseHistory.some(l=>l.requestId==='R1'));assert.equal(f.metrics.completed,3);assert.equal(f.metrics.failed,1);}
});
test('pinned and possible split binding preserve connection-specific transaction boundaries',()=>{
 const a=bindingFrames(),b=bindingFrames({mode:'split'});frozen(a);frozen(b);
 assert(a.flatMap(f=>f.calls).every(c=>c.clientId==='C1'));assert.equal(a.at(-1).committedStock,5);
 assert.equal(b.find(f=>f.phase==='update').calls.at(-1).clientId,'C2');assert.equal(b.at(-1).committedStock,4);
 for(const f of [...a,...b])for(const e of f.edges)assert(f.calls.some(c=>c.id===e.from&&c.clientId===e.to));
 assert.equal(a.at(-1).activeTransactionClientId,null);assert.equal(b.at(-1).activeTransactionClientId,null);
});
test('server-wide maximum budget and non-saturating overflow conserve all potential tokens',()=>{
 for(const instances of [1,3])for(const poolMax of [2,4]){const b=connectionBudget({instances,poolMax});frozen(b);assert.equal(b.appBudget,6);assert.equal(b.ordinaryThreshold,8);assert.equal(b.privilegedThreshold,10);assert.equal(b.tokens.length,instances*poolMax);assert.equal(b.tokens.filter(t=>t.exceedsOrdinaryBudget).length,b.excess);assert.equal(b.fits,b.excess===0);}
 assert.equal(connectionBudget({instances:3,poolMax:4}).excess,6);
});
test('bounded invalid choices rejected',()=>{
 for(const options of [null,[],{size:0},{size:3},{scenario:'unknown'},{timeout:0}])assert.throws(()=>poolFrames(options));
 assert.throws(()=>bindingFrames({mode:'magic'}));assert.throws(()=>connectionBudget({instances:2}));assert.throws(()=>connectionBudget({poolMax:0}));
});

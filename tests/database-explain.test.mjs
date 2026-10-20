import test from 'node:test';
import assert from 'node:assert/strict';
import {EXPLAIN_CASES,explainFrames,appCallComparison} from '../src/simulations/database/explain.mjs';
import {CANONICAL_FIXTURE} from '../src/simulations/database/fixture.mjs';
const baseline=structuredClone(CANONICAL_FIXTURE);
const frozen=v=>{if(v&&typeof v==='object'){assert(Object.isFrozen(v));Object.values(v).forEach(frozen);}};
for(const example of EXPLAIN_CASES)for(const observed of [true,false])test(`${example}/${observed}: immutable plan nodes, packets, estimates and observed boundaries`,()=>{
 const fs=explainFrames({example,observed});assert.deepEqual(fs,explainFrames({example,observed}));frozen(fs);
 for(const f of fs){assert(f.nodes.some(n=>n.id===f.rootId));for(const e of f.edges){assert(f.nodes.some(n=>n.id===e.from));assert(f.nodes.find(n=>n.id===e.to).children.includes(e.from));}
  for(const n of f.nodes){if(n.actualRows===null){assert.equal(n.loops,null);assert.equal(n.totalEmitted,null);assert.equal(n.buffers,null);}else{assert.equal(n.actualRows*n.loops,n.totalEmitted);assert.equal(n.emittedIds.length,n.totalEmitted);assert(n.buffers.hit>=0&&n.buffers.read>=0);assert.equal(n.bufferAccesses.length,n.buffers.hit+n.buffers.read);}}
  for(const p of f.packets){assert(f.nodes.some(n=>n.id===p.nodeId));assert(p.inputIds.every(id=>f.sourceRows.some(r=>r.id===id)||f.packets.some(q=>q.outputIds.includes(id))));}
  if(!observed){assert.equal(f.result,null);assert.equal(f.intervals.length,0);assert.equal(f.packets.length,0);assert(f.nodes.every(n=>n.actualRows===null));}
 }
 assert.equal(fs.at(-1).finished,true);assert.deepEqual(CANONICAL_FIXTURE,baseline);
});
test('64visited ->40emitted ->one COUNT result; estimates have no invented matching identities',()=>{
 for(const estimate of ['low','aligned']){const f=explainFrames({estimate}).at(-1),scan=f.nodes.find(n=>n.id==='scan'),root=f.nodes.find(n=>n.id==='aggregate');assert.equal(scan.estimatedRows,estimate==='low'?4:40);assert.equal(scan.visitedIds.length,64);assert.equal(scan.totalEmitted,40);assert.equal(root.totalEmitted,1);assert.deepEqual(f.result,{rows:1,countValue:40});assert.deepEqual(scan.emittedIds,Array.from({length:40},(_,i)=>`orders:${2001+i}`));assert.deepEqual(root.buffers,scan.buffers);}
});
test('canonical inner packets2/1 give average1.5×loops2=3, not four or app calls',()=>{
 const f=explainFrames({example:'nested-loop'}).at(-1),inner=f.nodes.find(n=>n.id==='inner'),join=f.nodes.find(n=>n.id==='join');
 assert.deepEqual(f.packets.map(p=>p.outputIds.length),[2,1]);assert.equal(inner.actualRows,1.5);assert.equal(inner.loops,2);assert.equal(inner.totalEmitted,3);assert.equal(join.totalEmitted,3);
 assert.deepEqual(inner.buffers,{hit:3,read:1});assert.equal(inner.bufferAccesses.length,4);assert.equal(new Set(inner.bufferAccesses.map(a=>a.pageId)).size,2);assert(inner.bufferAccesses.every(a=>join.bufferAccesses.some(b=>b.id===a.id)));assert.deepEqual(join.buffers,{hit:4,read:1});
 assert.deepEqual(f.packets.map(p=>p.id),['packet:inner:1','packet:inner:2']);assert.deepEqual(join.emittedIds,['joined:1001:1','joined:1001:2','joined:1002:1']);
});
test('LIMIT parent early stop is not a stale-statistics verdict or two candidates',()=>{
 const f=explainFrames({example:'limit'}).at(-1),scan=f.nodes.find(n=>n.id==='scan');assert.equal(scan.estimatedRows,10);assert.equal(scan.actualRows,2);assert.equal(scan.visitedIds.length,4);assert.equal(f.sourceRows.filter(r=>r.matches).length,10);assert.deepEqual(scan.emittedIds,['orders:2002','orders:2004']);assert.equal(f.stopProof.possibleFullOutputs,10);
 assert.equal(f.nodes[0].label,'Limit · 2행에서 중단');assert(!f.nodes.some(n=>/Aggregate|Sort/.test(n.label)));
});
test('schematic inclusive parent times are not summed or printed startup/total coordinates',()=>{
 for(const example of EXPLAIN_CASES){const f=explainFrames({example}).at(-1),parent=f.intervals.find(i=>i.nodeId===f.rootId);for(const child of f.intervals.filter(i=>i.nodeId!==f.rootId))assert(child.start>=parent.start&&child.end<=parent.end);}
 const f=explainFrames().at(-1),root=f.nodes[0],interval=f.intervals[0];assert.equal(root.actualStartupMs,8.2);assert.equal(interval.start,0);assert.equal(interval.end,10);
});
test('N+1 is separate app-call count1+2 not inner node loops',()=>{
 const c=appCallComparison();frozen(c);assert.equal(c.oneQuery.length,1);assert.equal(c.nPlusOne.length,3);assert.equal(c.applicationRows,3);assert.deepEqual(c.totalReturnedRows,{oneQuery:3,nPlusOne:5});assert.deepEqual(c.oneQuery.map(c=>c.outputIds.length),[3]);assert.deepEqual(c.nPlusOne.map(c=>c.outputIds.length),[2,2,1]);assert.deepEqual(c.oneQuery[0].outputIds,['joined:1001:1','joined:1001:2','joined:1002:1']);assert.deepEqual(c.nPlusOne.slice(1).map(c=>c.orderIds),[[1001],[1002]]);
});
test('invalid input is not normalized into a valid educational result',()=>{
 for(const bad of [null,[],{example:'magic'},{observed:0},{estimate:'real'},{sql:'DROP'}])assert.throws(()=>explainFrames(bad));
});

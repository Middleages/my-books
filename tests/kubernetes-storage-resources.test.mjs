import test from 'node:test';
import assert from 'node:assert/strict';
import { storageFrames, resourceFrames } from '../src/simulations/kubernetes/storage-resources.mjs';
const store=o=>storageFrames(o).at(-1);
const resource=o=>resourceFrames(o).at(-1);
test('container restart loses writable file but retains emptyDir and PVC with same Pod',()=>{
 const a=storageFrames()[0],b=store({event:'restart'});
 assert.equal(b.pod,a.pod);assert.notEqual(b.container,a.container);
 assert.deepEqual(b.files.map(x=>x.state),['lost','present','present']);
});
test('new Pod loses both ephemeral files but reuses same bound PVC',()=>{
 const b=store({event:'replace'});assert.equal(b.pod,'pod-b');assert.equal(b.pv,'Bound');
 assert.deepEqual(b.files.map(x=>x.state),['lost','lost','present']);assert.equal(b.readable,true);
});
test('offline node means unavailable not proof of erased disk',()=>{
 const b=store({event:'offline'});assert.ok(b.files.every(x=>x.state==='unavailable'));assert.equal(b.readable,false);assert.equal(b.pv,'Bound · 마지막 기록');
});
test('permanent disk loss destroys all local copies irrespective of Retain',()=>{
 for(const reclaim of ['Delete','Retain']) assert.ok(store({event:'disk-loss',reclaim}).files.every(x=>x.state==='lost'));
});
test('PVC deletion is deferred while Pod uses it; after removal Delete cleans data',()=>{
 const fs=storageFrames({event:'delete-pvc',reclaim:'Delete'});
 assert.equal(fs[1].pvc,'Terminating · 사용 중 보호');assert.equal(fs[1].files[2].state,'present');
 assert.equal(fs.at(-1).pvc,'삭제됨');assert.equal(fs.at(-1).pv,'삭제됨');assert.equal(fs.at(-1).files[2].state,'lost');
});
test('Retain leaves Released PV and data but no automatic app connection',()=>{
 const b=store({event:'delete-pvc',reclaim:'Retain'});assert.equal(b.pv,'Released');assert.equal(b.files[2].state,'present');assert.equal(b.readable,false);assert.equal(b.pod,'없음');
});
test('frames and runs do not share mutable file state',()=>{
 const fs=storageFrames();fs[0].files[2].state='lost';assert.equal(fs[1].files[2].state,'present');assert.equal(storageFrames()[0].files[2].state,'present');
});
test('idle CPU does not make requests fit',()=>{
 const b=resource({existingCpu:1800,requestCpu:500});assert.equal(b.outcome,'pending');assert.equal(b.node.cpu.used,100);assert.equal(b.node.cpu.assigned,1800);assert.equal(b.node.cpu.proposed,2300);assert.equal(b.quota.used,1000);
});
test('exact allocatable and quota equality fits',()=>{
 const b=resource({existingCpu:1500,requestCpu:500,quotaCpu:1000});assert.equal(b.outcome,'running');assert.equal(b.node.cpu.assigned,2000);assert.equal(b.quota.used,1000);
});
test('namespace quota rejection happens before any new Pod or scheduling',()=>{
 const fs=resourceFrames({existingCpu:500,requestCpu:500,quotaCpu:750});
 assert.equal(fs[0].outcome,'draft');assert.equal(fs[1].outcome,'rejected');assert.equal(fs.at(-1).node.cpu.assigned,500);assert.equal(fs.at(-1).quota.used,500);assert.equal(fs.at(-1).cpu.actual,0);
});
test('memory request may block scheduling independently of CPU',()=>{
 const b=resource({existingCpu:500,existingMemory:1900});assert.equal(b.outcome,'pending');assert.match(b.reason,/메모리/);assert.equal(b.node.memory.proposed,2156);
});
test('CPU limit throttles demand without OOM or restart',()=>{
 const b=resource({existingCpu:500,load:'cpu'});assert.equal(b.outcome,'throttled');assert.equal(b.cpu.demand,1500);assert.equal(b.cpu.actual,1000);assert.equal(b.memory.oom,false);
});
test('memory demand above limit does not itself declare instantaneous termination',()=>{
 const fs=resourceFrames({existingCpu:500,load:'memory'});
 assert.equal(fs[3].outcome,'pressure');assert.equal(fs[3].memory.oom,false);assert.equal(fs[3].memory.demand,768);
 assert.equal(fs[4].outcome,'oom');assert.equal(fs[4].memory.oom,true);assert.equal(fs[4].memory.actual,0);
 assert.equal(fs[4].node.memory.assigned,768);
});
test('not admitted or scheduled workloads never consume runtime resources',()=>{
 for(const load of ['normal','cpu','memory']) for(const o of [{quotaCpu:750},{existingCpu:1900}]){
  const b=resource({...o,load});assert.equal(b.cpu.actual,0);assert.equal(b.memory.oom,false);
 }
});
test('request inputs are bounded and independent resource runs start fresh',()=>{
 assert.throws(()=>resource({requestCpu:1500}),RangeError);assert.throws(()=>resource({existingCpu:NaN}),RangeError);
 const a=resourceFrames();a[0].node.cpu.used=999;assert.equal(resourceFrames()[0].node.cpu.used,100);
});
test('storage diagram distinguishes binding, mount removal, and unknown runtime state',()=>{
 assert.equal(storageFrames()[0].binding,'bound');assert.equal(storageFrames()[0].mount,'mounted');
 assert.equal(storageFrames({event:'replace'})[1].mount,'unmounted');
 const deleted=store({event:'delete-pvc',reclaim:'Retain'});assert.equal(deleted.binding,'none');assert.equal(deleted.mount,'unmounted');
 const offline=store({event:'offline'});assert.equal(offline.binding,'last-known');assert.equal(offline.mount,'unknown');
});

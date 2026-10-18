import test from 'node:test';
import assert from 'node:assert/strict';
import { probeFrames, rolloutFrames } from '../src/simulations/kubernetes/health-rollout.mjs';

test('startup suppresses liveness/readiness until success',()=>{
 const fs=probeFrames(); const waiting=fs.filter(f=>f.startup.status==='실패');
 assert.ok(waiting.length);for(const f of waiting){assert.equal(f.liveness.status,'대기');assert.equal(f.readiness.status,'대기');assert.equal(f.ready,false);}
 assert.ok(fs.some(f=>f.startup.status==='성공'));
});
test('readiness failures remove target without restarting container',()=>{
 const fs=probeFrames({scenario:'readiness',threshold:2});
 const failed=fs.find(f=>f.readiness.failures===2);assert.equal(failed.ready,false);assert.deepEqual(failed.targets,[]);
 assert.ok(fs.every(f=>f.restarts===0));assert.equal(fs.at(-1).ready,true);
});
test('below readiness threshold the previous ready state persists',()=>{
 const f=probeFrames({scenario:'readiness',threshold:3}).find(f=>f.readiness.failures===1);
 assert.equal(f.ready,true);assert.deepEqual(f.targets,['pod-a']);
});
test('liveness failure threshold precedes same-Pod restart and startup repeats',()=>{
 const fs=probeFrames({scenario:'liveness',threshold:2});
 assert.ok(fs.some(f=>f.liveness.failures===1&&f.restarts===0));
 const i=fs.findIndex(f=>f.restarts===1);assert.ok(i>0);assert.equal(fs[i].pod,'pod-a');assert.equal(fs[i].container,'container-2');assert.equal(fs[i].ready,false);
 assert.ok(fs.slice(i+1).some(f=>f.startup.status==='성공'));
});
test('startup timeout restarts without running the other probes',()=>{
 const fs=probeFrames({scenario:'startup-timeout',threshold:3});
 assert.ok(fs.some(f=>f.startup.failures===3));assert.equal(fs.at(-1).restarts,1);
 assert.ok(fs.every(f=>f.liveness.status==='대기'&&f.readiness.status==='대기'));
});
test('external DB dependency in liveness causes restart while DB stays down',()=>{
 const safe=probeFrames({scenario:'db',dbInLiveness:false}),bad=probeFrames({scenario:'db',dbInLiveness:true});
 assert.equal(safe.at(-1).restarts,0);assert.equal(bad.at(-1).restarts,1);
 for(const fs of [safe,bad]){assert.equal(fs.at(-1).dbUp,false);assert.equal(fs.at(-1).ready,false);}
});
test('probe frames deterministic and failure counters reset on success',()=>{
 assert.deepEqual(probeFrames(),probeFrames());const last=probeFrames({scenario:'readiness'}).at(-1);
 assert.equal(last.readiness.failures,0);assert.equal(last.readiness.status,'성공');
});
test('normal rollout converges to two ready v2 Pods',()=>{
 const fs=rolloutFrames(),f=fs.at(-1);assert.equal(f.result,'complete');assert.equal(f.old.count,0);assert.equal(f.new.ready,2);
 assert.ok(fs.some(f=>f.old.count>0&&f.new.count>0));
});
test('all integer strategies respect surge and availability in healthy model',()=>{
 for(const surge of [0,1,2])for(const unavailable of [0,1,2]){
  if(surge+unavailable===0)continue;
  const fs=rolloutFrames({surge,unavailable});for(const f of fs){assert.ok(f.pods.length<=2+surge);assert.ok(f.ready>=2-unavailable);assert.equal(f.targets.length,f.ready);}
  assert.equal(fs.at(-1).result,'complete');
 }
});
test('zero surge and zero unavailable rejected',()=>{assert.throws(()=>rolloutFrames({surge:0,unavailable:0}),RangeError)});
test('failed v2 readiness stalls and never silently rolls back',()=>{
 const f=rolloutFrames({scenario:'bad-ready'}).at(-1);assert.equal(f.result,'stalled');assert.equal(f.target,'v2');assert.equal(f.old.ready,2);assert.equal(f.new.ready,0);
});
test('full node creates Pending surge; freeing one old slot permits progress',()=>{
 const blocked=rolloutFrames({scenario:'capacity',unavailable:0});assert.equal(blocked.at(-1).result,'stalled');assert.ok(blocked.some(f=>f.pods.some(p=>p.state==='Pending')));
 const recovered=rolloutFrames({scenario:'capacity',unavailable:1});assert.equal(recovered.at(-1).result,'complete');
});
test('explicit rollback restores v1 without reverting external state',()=>{
 const fs=rolloutFrames({scenario:'bad-ready',rollback:true}),f=fs.at(-1);
 assert.ok(fs.some(f=>f.result==='rollback-requested'));assert.equal(f.result,'complete');assert.equal(f.target,'v1');assert.equal(f.old.ready,2);assert.equal(f.new.count,0);
 assert.ok(fs.every(f=>f.externalState==='DB/PVC 변경은 별도 상태'));
});
test('scheduled CPU requests track assigned pods, not Pending or CPU usage',()=>{
 for(const f of rolloutFrames({scenario:'capacity',unavailable:1})){
  assert.equal(f.assignedCpu,f.backgroundCpu+f.pods.filter(p=>p.state!=='Pending').length*500);assert.ok(f.assignedCpu<=2000);
 }
});
test('rollout is deterministic and rejects unsupported values',()=>{
 assert.deepEqual(rolloutFrames(),rolloutFrames());assert.throws(()=>rolloutFrames({surge:-1}),RangeError);assert.throws(()=>probeFrames({threshold:0}),RangeError);
});
test('template change changes desired version only after initial v1 frame',()=>{
 const fs=rolloutFrames();assert.equal(fs[0].target,'v1');assert.equal(fs[1].target,'v2');assert.deepEqual(fs[0].pods,fs[1].pods);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { helmFrames, diagnosisFrames, diagnosticCases, observations } from '../src/simulations/kubernetes/helm-diagnosis.mjs';
const last = a => a.at(-1);
test('template only renders without release or live resources',()=>{
 const fs=helmFrames({operation:'template',environment:'prod'});
 assert.match(last(fs).yaml,/replicas: 2/);
 for(const f of fs){assert.equal(f.live,null);assert.deepEqual(f.history,[]);assert.equal(f.deploymentRevision,null);}
});
test('install separates rendering from API application and controller observation',()=>{
 const fs=helmFrames({operation:'install'});
 assert.equal(fs[1].live,null);
 assert.equal(fs[2].live.replicas,1);
 assert.equal(fs[2].deploymentRevision,null);
 assert.equal(last(fs).deploymentRevision,1);
 assert.equal(last(fs).history.at(-1).revision,1);
 assert.equal(last(fs).ready,'미관측');
});
test('replicas and ConfigMap upgrades increment Helm history but not Pod template revision',()=>{
 for(const change of ['replicas','config']){
 const fs=helmFrames({operation:'upgrade',change});
 assert.equal(fs[0].history.length,1);
 assert.equal(last(fs).history.at(-1).revision,2);
 assert.equal(last(fs).deploymentRevision,1);
 assert.equal(last(fs).live.image,'v1');
 assert.equal(last(fs).live[change==='replicas'?'replicas':'message'],change==='replicas'?2:'새 안내');
 }
});
test('image upgrade changes Pod template; rollback is new Helm revision not time travel',()=>{
 assert.equal(last(helmFrames({operation:'upgrade',change:'image'})).deploymentRevision,2);
 const fs=helmFrames({operation:'rollback',change:'image'});
 assert.equal(fs[0].live.image,'v2');
 assert.equal(last(fs).live.image,'v1');
 assert.equal(last(fs).history.at(-1).revision,3);
 assert.equal(last(fs).deploymentRevision,3);
 assert.equal(last(fs).history[0].revision,1);
 assert.equal(last(fs).externalState,fs[0].externalState);
});
test('rollback config does not invent a new Deployment revision',()=>{
 const f=last(helmFrames({operation:'rollback',change:'config'}));
 assert.equal(f.deploymentRevision,1);assert.equal(f.live.message,'개발 안내');
});
test('environments render distinct values under one chart and port contract',()=>{
 const dev=last(helmFrames({environment:'dev'})),prod=last(helmFrames({environment:'prod'}));
 assert.equal(dev.chart,prod.chart); assert.equal(dev.target.replicas,1);assert.equal(prod.target.replicas,2);
 for(const f of [dev,prod]){assert.match(f.yaml,/port: 80/);assert.match(f.yaml,/targetPort: 8080/);}
});
test('frames and runs have independent mutable snapshots',()=>{
 const fs=helmFrames({operation:'upgrade'});fs[0].live.image='changed';
 assert.equal(fs[1].live.image,'v1');assert.equal(helmFrames({operation:'upgrade'})[0].live.image,'v1');
});
test('invalid model options are rejected',()=>{
 assert.throws(()=>helmFrames({operation:'exec'}),RangeError);
 assert.throws(()=>helmFrames({environment:'shell'}),RangeError);
 assert.throws(()=>diagnosisFrames({scenario:'unknown'}),RangeError);
 assert.throws(()=>diagnosisFrames({observation:'shell'}),RangeError);
});
test('each case starts with a symptom, not a hidden diagnosis',()=>{
 for(const c of diagnosticCases){const f=diagnosisFrames({scenario:c.id})[0];
 assert.equal(f.conclusion,null);assert.equal(f.evidence,null);assert.ok(f.zones.every(z=>z.state==='unknown'));
 }
});
test('a matched observation reveals bounded evidence, explanation and next verification',()=>{
 for(const c of diagnosticCases){
 const fs=diagnosisFrames({scenario:c.id,observation:c.best});
 assert.equal(fs[1].conclusion,null);assert.ok(fs[1].evidence);
 const f=last(fs);assert.equal(f.matched,true);assert.ok(f.conclusion);assert.ok(f.next);assert.ok(f.zones.some(z=>z.state==='focus'));
 assert.equal(f.command,observations.find(o=>o.id===c.best).command);
 }
});
test('irrelevant evidence never confirms the hidden root cause',()=>{
 for(const c of diagnosticCases){const f=last(diagnosisFrames({scenario:c.id,observation:'rollout'}));
 assert.equal(f.matched,false);assert.equal(f.conclusion,null);assert.ok(f.zones.every(z=>z.state==='unknown'));
 assert.match(f.detail,/확정할 수 없/);
 }
});
test('Pending distinguishes requests from measured CPU use',()=>{
 const f=last(diagnosisFrames({scenario:'pending',observation:'events'}));
 assert.match(f.evidence,/1800m.*500m.*2000m/);assert.match(f.evidence,/100m/);assert.match(f.conclusion,/requests/);
});
test('selector, readiness and targetPort have different evidence and conclusions',()=>{
 const fs=['selector','ready','port'].map(s=>last(diagnosisFrames({scenario:s,observation:'service'})));
 assert.match(fs[0].evidence,/app=other/);assert.match(fs[1].evidence,/ready=false/);assert.match(fs[2].evidence,/9090.*8080/);
 assert.equal(new Set(fs.map(f=>f.conclusion)).size,3);
});
test('TLS failure is before HTTP and independent from route mismatch',()=>{
 const tls=last(diagnosisFrames({scenario:'tls',observation:'tls'}));
 const route=last(diagnosisFrames({scenario:'ingress',observation:'ingress'}));
 assert.match(tls.conclusion,/TLS/);assert.match(tls.evidence,/SAN/);assert.match(route.evidence,/Host/);
 assert.notEqual(tls.conclusion,route.conclusion);
});
test('previous logs and pull events support different failure hypotheses',()=>{
 assert.match(last(diagnosisFrames({scenario:'crash',observation:'previous'})).evidence,/APP_MESSAGE/);
 assert.match(last(diagnosisFrames({scenario:'image',observation:'events'})).evidence,/manifest unknown/);
});
test('previous deployed release stays deployed while upgrade or rollback is pending',()=>{
 for(const operation of ['upgrade','rollback']){
  const fs=helmFrames({operation});
  assert.equal(fs[2].history.at(-2).status,'deployed');
  assert.equal(last(fs).history.at(-2).status,'superseded');
 }
});
test('first install explains initial creation and static summaries preserve numeric evidence',()=>{
 assert.match(last(helmFrames({operation:'install'})).detail,/처음 생성/);
 for(const operation of ['template','install','upgrade','rollback'])for(const f of helmFrames({operation,change:'image'})){
  assert.match(f.summary,new RegExp(`Deployment revision ${f.deploymentRevision??'미관측/없음'}`));
  assert.ok(f.summary.includes(`목표 ${f.target.replicas}개 · ${f.target.image} · ${f.target.message}`));
  assert.ok(f.summary.includes(`Helm revision ${f.history.at(-1)?.revision??'없음'}`));
 }
});

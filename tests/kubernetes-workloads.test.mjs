import test from 'node:test';
import assert from 'node:assert/strict';
import { desiredFrames, serviceFrames } from '../src/simulations/kubernetes/workloads.mjs';

test('Pod deletion creates a new UID while desired count stays two', () => {
 const f = desiredFrames({event:'delete'});
 assert.equal(f[1].current, 1);
 assert.equal(f[2].current, 2);
 assert.equal(f[2].ready, 1);
 assert.equal(f.at(-1).ready, 2);
 assert.notEqual(f[0].pods[0].uid, f.at(-1).pods[0].uid);
 assert.ok(f.every(x => x.desired === 2 && x.pods.every(p => p.owner === x.replicaSet)));
});
test('container restart retains UID and increases restart count without new Pod', () => {
 const f = desiredFrames({event:'restart'});
 assert.ok(f.every(x=>x.current===2));
 assert.equal(f[1].ready, 1);
 assert.equal(f[0].pods[0].uid,f.at(-1).pods[0].uid);
 assert.equal(f.at(-1).pods[0].restarts,1);
 assert.equal(f[3].ready,1);
});
test('scale includes zero and four, changes intent before observations converge', () => {
 for (const target of [0,1,2,3,4]) {
  const f=desiredFrames({event:'scale',target});
  assert.equal(f[1].desired,target); assert.equal(f[1].current,2);
  assert.equal(f.at(-1).current,target); assert.equal(f.at(-1).ready,target);
 }
});
test('unavailable node cannot run replacement Pods, unlike deleting a Pod on a healthy node',()=>{
 const f=desiredFrames({event:'node'});
 assert.equal(f[2].ready,0); assert.equal(f[2].current,2);
 assert.equal(f.at(-1).ready,0); assert.equal(f.at(-1).current,2);
 assert.ok(f.at(-1).pods.every(p=>p.state==='Pending' && p.node===null));
 assert.equal(f.at(-1).controlUp,true);
});
test('whole VM loss freezes control and marks counts as last observation',()=>{
 const f=desiredFrames({event:'vm'}).at(-1);
 assert.equal(f.controlUp,false); assert.equal(f.observation,'stale');
 assert.equal(f.pods[0].uid,'pod-a');
});
test('desired frames count exactly the displayed objects and are fresh on replay',()=>{
 for(const event of ['delete','restart','scale','node','vm']) for(const f of desiredFrames({event})) {
  assert.equal(f.current,f.pods.length); assert.equal(f.ready,f.pods.filter(p=>p.ready).length);
 }
 const f=desiredFrames(); f[0].pods[0].ready=false;
 assert.equal(desiredFrames()[0].ready,2);
 assert.throws(()=>desiredFrames({event:'scale',target:-1}),RangeError);
 assert.throws(()=>desiredFrames({event:'scale',target:2.5}),RangeError);
});
test('Service replacement updates Pod address and UID but preserves DNS and VIP',()=>{
 const f=serviceFrames();
 assert.equal(f[0].service.clusterIP,f.at(-1).service.clusterIP);
 assert.equal(f[0].dns.name,f.at(-1).dns.name);
 assert.notEqual(f[0].pods[0].ip,f.at(-1).pods[0].ip);
 assert.notEqual(f[0].pods[0].uid,f.at(-1).pods[0].uid);
 assert.equal(f.at(-1).result.code,'connected');
 assert.equal(f.at(-1).result.destination,'10.42.0.23:8080');
});
test('EndpointSlice includes selected unready Pod but eligible routing excludes it',()=>{
 const f=serviceFrames()[2];
 assert.equal(f.endpoints.length,2); assert.equal(f.eligible.length,1);
 assert.equal(f.endpoints[0].ready,false);
 assert.equal(f.result.destination,'10.42.0.13:8080');
 assert.ok(f.endpoints.every(e=>e.namespace==='books-lab'));
});
test('selector mismatch, no ready endpoints, wrong port, DNS failure remain distinct',()=>{
 for(const [opts,code,selected,ready] of [
  [{selector:'other'},'selector-mismatch',0,0],
  [{ready:false},'not-ready',2,0],
  [{targetPort:9090},'wrong-port',2,2],
  [{clientNamespace:'other'},'dns-miss',2,2],
 ]) {
  const f=serviceFrames(opts).at(-1);
  assert.equal(f.result.code,code); assert.equal(f.endpoints.length,selected); assert.equal(f.eligible.length,ready);
 }
});
test('qualified namespace DNS resolves across namespaces, selector stays scoped to Service',()=>{
 for(const query of ['study-web.books-lab','study-web.books-lab.svc.cluster.local']) {
  const f=serviceFrames({clientNamespace:'other',query}).at(-1);
  assert.equal(f.dns.found,true); assert.equal(f.result.code,'connected');
  assert.ok(!f.endpoints.some(e=>e.uid==='pod-other'));
 }
});
test('DNS still resolves with zero ready endpoints and port configuration does not alter readiness',()=>{
 const empty=serviceFrames({ready:false}).at(-1);
 assert.equal(empty.dns.found,true); assert.equal(empty.eligible.length,0);
 const wrong=serviceFrames({targetPort:9090}).at(-1);
 assert.equal(wrong.eligible.length,2); assert.equal(wrong.service.port,80);
 assert.equal(wrong.result.destination,'10.42.0.23:9090');
});
test('Service scenario replay deterministic and endpoint state independent across frames',()=>{
 assert.deepEqual(serviceFrames(),serviceFrames());
 const f=serviceFrames();f[2].pods[0].ready=true;
 assert.equal(f[2].endpoints[0].ready,false);
 assert.equal(serviceFrames()[2].pods[0].ready,false);
});
test('Service step narration follows selector and observed failure, including static alternatives',()=>{
 const f=serviceFrames({selector:'other'});
 assert.ok(f[0].detail.includes('app=other'));
 assert.ok(f[2].detail.includes('선택되지'));
 for(const opts of [{selector:'other'},{targetPort:9090},{ready:false},{clientNamespace:'other'},{}]) {
  for(const frame of serviceFrames(opts)) assert.ok(frame.detail.includes(frame.result.reason));
 }
});

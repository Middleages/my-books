import test from 'node:test';
import assert from 'node:assert/strict';
import { ingressFrames, configurationFrames, secretEncoding } from '../src/simulations/kubernetes/edge-config.mjs';
const last = o => ingressFrames(o).at(-1);
test('default route terminates TLS at controller then reaches HTTP Pod via Service',()=>{
 const f=last(); assert.equal(f.outcome,'success'); assert.equal(f.outer.terminator,'Ingress controller');
 assert.equal(f.service.port,80); assert.equal(f.service.targetPort,8080);
 assert.equal(f.hops.at(-1).protocol,'HTTP'); assert.equal(f.hops.at(-1).address,'10.42.0.21:8080');
});
test('existing NGINX and default ServiceLB conflict stops before request',()=>{
 const f=last({mode:'conflict'}); assert.equal(f.outcome,'port-conflict'); assert.ok(f.hops.every(h=>h.status!=='done'));
});
test('coexistence uses different NodePort and TLS legs validate independently',()=>{
 let f=last({mode:'host-tls',innerValid:false}); assert.equal(f.outer.status,'passed'); assert.equal(f.inner.status,'failed'); assert.equal(f.outcome,'inner-tls');
 assert.ok(f.hops.some(h=>h.address==='192.0.2.10:30443'));
 f=last({mode:'host-tls',outerValid:false}); assert.equal(f.outer.status,'failed'); assert.equal(f.inner.status,'pending');
 assert.equal(last({mode:'host-http',innerValid:false}).outcome,'success');
});
test('HTTP Host and path routing are separate from certificate validity',()=>{
 assert.equal(last({host:'other.example.test'}).outcome,'no-route');
 assert.equal(last({path:'/missing'}).outcome,'no-route');
 assert.equal(last({path:'/health/ready'}).outcome,'success');
 assert.equal(last({path:'/healthier'}).outcome,'no-route');
});
test('missing controller and unready Service stop at different boundaries',()=>{
 assert.equal(last({controller:false}).outcome,'no-controller');
 assert.equal(last({ready:false}).outcome,'no-endpoint');
});
test('only reached hops complete and new runs do not share state',()=>{
 for(const mode of ['direct','host-http','host-tls','conflict']){
  const fs=ingressFrames({mode}); assert.equal(fs[0].outer.status,'pending');
  assert.ok(fs.every(f=>f.hops.length===fs[0].hops.length));
 }
 const f=ingressFrames();f[0].hops[0].address='changed';assert.notEqual(ingressFrames()[0].hops[0].address,'changed');
});
test('environment stays old after source update and reread, replacement refreshes it',()=>{
 const f=configurationFrames({delivery:'env'});
 assert.equal(f[1].source,'안녕하세요 v2');assert.equal(f[2].delivered,'안녕하세요 v1');assert.equal(f[3].app,'안녕하세요 v1');
 assert.equal(f[4].app,'안녕하세요 v2'); assert.notEqual(f[0].pod,f[4].pod);
});
test('normal volume update is delayed, reread changes app without replacing Pod',()=>{
 const f=configurationFrames({delivery:'volume'});
 assert.equal(f[1].delivered,'안녕하세요 v1'); assert.equal(f[2].delivered,'안녕하세요 v2');assert.equal(f[2].app,'안녕하세요 v1');
 assert.equal(f[3].app,'안녕하세요 v2');assert.equal(f[3].pod,f[0].pod);
});
test('startup-only app does not reread changed file until replaced',()=>{
 const f=configurationFrames({delivery:'volume',reload:false}); assert.equal(f[3].app,'안녕하세요 v1'); assert.equal(f[4].app,'안녕하세요 v2');
});
test('subPath never projects updates into existing mount',()=>{
 const f=configurationFrames({delivery:'subpath'});assert.equal(f[2].delivered,'안녕하세요 v1');assert.equal(f[3].app,'안녕하세요 v1');assert.equal(f[4].app,'안녕하세요 v2');
});
test('Secret follows same propagation contract while image is constant',()=>{
 for(const delivery of ['env','volume','subpath']){
  const fs=configurationFrames({delivery,kind:'Secret'});assert.ok(fs.every(f=>f.image==='study-web · v1'));
  assert.equal(fs.at(-1).app,'demo-only-v2');assert.equal(fs[0].source,'demo-only-v1');
 }
});
test('base64 representation decodes without key and is not encryption',()=>{
 assert.equal(Buffer.from(secretEncoding.encoded,'base64').toString(),secretEncoding.plain);
 assert.equal(secretEncoding.encrypted,false);
});
test('configuration replay starts from old value and frames are independent',()=>{
 const fs=configurationFrames();fs[0].app='changed';assert.equal(configurationFrames()[0].app,'안녕하세요 v1');assert.equal(fs[1].app,'안녕하세요 v1');
});
test('direct TLS is observed at controller, ServiceLB never terminates TLS',()=>{
 const f=ingressFrames()[1];assert.equal(f.outer.status,'passed');assert.equal(f.hops[2].status,'done');
 const failed=last({outerValid:false});assert.equal(failed.hops[1].status,'done');assert.equal(failed.hops[2].status,'blocked');assert.equal(failed.hops[3].status,'pending');
});

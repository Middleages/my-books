import assert from 'node:assert/strict';
import {lifecycleFrame} from '../../src/simulations/authentication/lifecycle.mjs';
import {trustFrame,authDiagnosisFrame} from '../../src/simulations/authentication/operations.mjs';
const offline=lifecycleFrame(2,{mode:'logout',policy:'expiry'}),online=lifecycleFrame(2,{mode:'logout',policy:'online'});
assert.equal(offline.apiAllowed,true);assert.equal(online.apiAllowed,false);assert.equal(online.idpStatus,'active');
const trust=trustFrame(3,'ca');assert.equal(trust.browserReachable,true);assert.equal(trust.serverReachable,false);assert.equal(trust.gates.find(g=>g.id==='key').status,'unknown');assert.equal(trust.tlsBypass,false);
const diagnosis=authDiagnosisFrame(3,'csrf');assert.equal(diagnosis.log.reasonCategory,'state-mismatch');assert.equal(diagnosis.gates.filter(g=>g.status==='unknown').length,5);assert.deepEqual(Object.keys(diagnosis.log),['correlationId','stage','result','reasonCategory']);
console.log(JSON.stringify({model:'synthetic-only',logout:{expiryPolicy:offline.apiAllowed,onlinePolicy:online.apiAllowed,idp:online.idpStatus},trust:{browser:trust.browserReachable,bff:trust.serverReachable,key:'unknown'},safeEvidence:diagnosis.log,unknown:diagnosis.gates.filter(g=>g.status==='unknown').map(g=>g.id)},null,2));
console.log('synthetic checks passed');

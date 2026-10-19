import test from 'node:test';
import assert from 'node:assert/strict';
import { contractDefaults, projectContractMap } from '../src/simulations/insurance/contracts.mjs';

test('insurance contract defaults have three fictional adult people and three distinct roles', () => {
 const r=projectContractMap(); assert.equal(r.people.length,3); assert.equal(r.people.flatMap(p=>p.roles).length,3); assert.equal(r.samePayerAndBeneficiary,false); assert.equal(r.includedCount,2);
});
test('one fictional person can hold all three roles without three people or duplicate money edges', () => {
 const r=projectContractMap({preset:'same'}); assert.equal(r.people.length,1); assert.equal(r.people[0].roles.length,3); assert.equal(r.edges.length,3); assert.equal(r.samePayerAndBeneficiary,true); assert.equal(r.edges[0].from,r.edges[2].to);
});
test('premium and conditional payout have opposite directed endpoints and insured is not money', () => {
 for(const preset of ['separate','same','employer']) { const r=projectContractMap({preset}); assert.equal(r.edges[0].to,'insurer'); assert.equal(r.edges[2].from,'insurer'); assert.equal(r.edges[1].kind,'reference'); assert.notEqual(r.edges[0].from,'insurer'); }
});
test('employer role groups worker and beneficiary while job exit leaves connections unconfirmed', () => {
 const r=projectContractMap({preset:'employer',employed:false}); assert.equal(r.people.length,2); assert.equal(r.people[0].kind,'company'); assert.equal(r.edges.find(e=>e.id==='insured').connected,false); assert.equal(r.edges.find(e=>e.id==='payout').connected,false); assert.match(r.frames[3].detail,/確認|확인/);
});
test('job exit cannot erase independent personal-contract connections', () => {
 assert(projectContractMap({employed:false}).edges.every(e=>e.connected));
});
test('addition and restrictive riders move the exact event across boundaries independently', () => {
 for(const addRider of [true,false]) for(const restrictRider of [true,false]) { const r=projectContractMap({addRider,restrictRider}); assert.equal(r.events.find(e=>e.id==='C').region,addRider?'rider':'outside'); assert.equal(r.events.find(e=>e.id==='B').region,restrictRider?'outside':'base'); assert.equal(r.includedCount,2+Number(addRider)-Number(restrictRider)); assert.equal(new Set(r.events.map(e=>e.id)).size,4); assert(!r.events.find(e=>e.id==='D').included); }
});
test('public, work and personal sources coexist, not three mutually exclusive membership classes', () => {
 const r=projectContractMap(); assert.equal(r.sources.length,3); assert.match(r.sources[0].detail,/직장가입자/); assert.match(r.sources[1].detail,/별개/); assert.match(r.sources[2].detail,/함께/);
});
test('every contract frame shares model people, events, sources and keeps all labelled edges visible', () => {
 const r=projectContractMap({preset:'same',addRider:true,restrictRider:true}); assert.equal(r.frames.length,4); for(const f of r.frames){assert.deepEqual(f.people,r.people);assert.deepEqual(f.events,r.events);assert.deepEqual(f.sources,r.sources);assert.equal(f.edges.length,3);assert(f.edges.every(e=>e.label&&e.detail));} assert.equal(r.frames[0].edges.filter(e=>e.active).length,0); assert.equal(r.frames[3].edges.filter(e=>e.active).length,1);
});
test('contract replay is deterministic and never changes passed settings', () => {
 const options={...contractDefaults,preset:'employer',employed:false}; const before=structuredClone(options); assert.deepEqual(projectContractMap(options),projectContractMap(options)); assert.deepEqual(options,before);
});
test('contract model rejects unknown presets, personal data fields cannot select people, and booleans are strict', () => {
 for(const x of [null,1,[],false]) assert.throws(()=>projectContractMap(x)); assert.throws(()=>projectContractMap({preset:'user'})); for(const key of ['addRider','restrictRider','employed']) for(const val of ['true',1,null,undefined]) assert.throws(()=>projectContractMap({[key]:val})); assert.equal(projectContractMap({name:'UNUSED'}).people[0].name,'가상 민서');
});

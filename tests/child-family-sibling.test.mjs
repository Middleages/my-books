import test from 'node:test';
import assert from 'node:assert/strict';
import { beforeSiblingFrame, livingSiblingFrame, siblingAges, siblingSource } from '../src/simulations/child-family/sibling.mjs';

test('sibling source retains reviewed ages, scope and source date',()=>{
 assert.deepEqual(siblingAges,['1–2세','2–3세']); assert.equal(siblingSource.updatedAt,'2026-02-10');assert.equal(siblingSource.checkedAt,'2026-10-21');assert.equal(siblingSource.chapterIds.length,2);
});
test('before sibling preserves pre-arrival comparison while changing adult connections',()=>{
 const pending=beforeSiblingFrame();const shared=beforeSiblingFrame('1–2세','shared');
 assert.deepEqual(pending.scenes[0],shared.scenes[0]);assert.equal(pending.scenes[0].nodes.some(n=>n.id==='baby'),false);
 assert.equal(pending.scenes[1].edges.find(e=>e.to==='older').status,'지원 확인 전');
 assert.equal(shared.scenes[1].edges.find(e=>e.to==='older').from,'b');assert.equal(shared.scenes[1].edges.find(e=>e.to==='baby').from,'a');
 assert.ok(shared.unknowns.length);assert.equal(shared.step,1);
});
test('age changes explanation, not an automatic support acceptance',()=>{
 for(const make of [beforeSiblingFrame,livingSiblingFrame]){
 const young=make('1–2세');const older=make('2–3세');assert.notEqual(young.explanation,older.explanation);assert.deepEqual(young.scenes,older.scenes);assert.deepEqual(young.unknowns,older.unknowns);
 }
});
test('both needs remain, and only an adult is responsible in every scenario',()=>{
 for(const age of siblingAges)for(const option of ['pending','together','shared'])for(const make of [beforeSiblingFrame,livingSiblingFrame]){
 const frame=make(age,option);for(const scene of frame.scenes)for(const edge of scene.edges){assert.equal(scene.nodes.find(n=>n.id===edge.from)?.kind,'adult');assert.ok(scene.nodes.find(n=>n.id===edge.to));}
 assert.ok(frame.observedFacts.length);assert.ok(frame.hypotheses.length);assert.ok(frame.unknowns.length);assert.deepEqual(frame.sourceIds,['F3']);
 }
 const alone=livingSiblingFrame();const shared=livingSiblingFrame('1–2세','shared');assert.deepEqual(alone.needs.map(n=>n.need),shared.needs.map(n=>n.need));assert.equal(alone.needs[0].owner,'성인 A');assert.equal(shared.needs[0].owner,'성인 B');assert.equal(shared.needs[1].owner,'성인 A');
});
test('reset/default frames are deterministic and isolated from mutations',()=>{
 const first=beforeSiblingFrame();first.scenes[0].nodes[0].label='mutated';assert.equal(beforeSiblingFrame().scenes[0].nodes[0].label,'성인 A');
 for(const make of [beforeSiblingFrame,livingSiblingFrame]){assert.deepEqual(make('invalid','invalid'),make());assert.deepEqual(make(),make());}
});

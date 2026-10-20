import test from 'node:test';import assert from 'node:assert/strict';import{placeFrame,careFrame}from'../src/simulations/child-safety/preparation.mjs';
test('place information phase does not certify route or transfer duty',()=>{for(const stage of ['before','onsite'])for(const changed of [false,true]){const f=placeFrame(stage,changed);assert.equal(f.nodes.length,3);assert(f.unknowns[0].includes('미확인'));if(changed)assert(f.nodes[1].state.includes('다시 인수'));assert(!('evacuationRoute'in f));}});
test('care sorting preserves facts uncertainty and hypotheses without diagnosis',()=>{const a=careFrame(),b=careFrame(true);for(const key of ['observedFacts','hypotheses','unknowns','questions'])assert.deepEqual(a[key],b[key]);assert.equal(a.sorted,false);assert.equal(b.sorted,true);assert(!('urgency'in b));assert.deepEqual(careFrame(),a);});
test('preparation invalid input rejected',()=>{assert.throws(()=>placeFrame('escape'),RangeError);assert.throws(()=>careFrame('true'),RangeError);});

test('observing ongoing crying does not establish onset time',()=>{const f=careFrame(true);assert(f.observedFacts[0].includes('울고 있는'));assert(f.unknowns[0].includes('시작 시각'));});

import test from 'node:test';
import assert from 'node:assert/strict';
import {boundaryFrame,careFrame,moveStep} from '../src/simulations/child-emotions/foundation.mjs';
test('interpretation never changes observed action or its boundary',()=>{for(const action of ['throw','put']){const a=boundaryFrame(0,action);for(const emotion of [0,1,2]){const f=boundaryFrame(emotion,action);assert.equal(f.observed,a.observed);assert.equal(f.boundary,a.boundary);assert.equal(f.safePath,action==='put');assert.match(f.unknown,/모릅니다/);}}});
test('care frames preserve unknown outcome and do not infer clinical response',()=>{for(let step=0;step<3;step++){const f=careFrame(step);assert.equal(f.outcome,'진정 여부: 미확인');assert.equal(f.step,step);assert.match(f.age,/5개월/);}assert.match(boundaryFrame().age,/30개월/);});
test('bounded step motion and immutable fresh frames',()=>{assert.equal(moveStep(0,-1),0);assert.equal(moveStep(2,1),2);assert.equal(moveStep(0,1),1);const a=careFrame();a.response='mutated';assert.notEqual(careFrame().response,'mutated');assert.deepEqual(careFrame(0),careFrame(0));});
test('invalid input rejected rather than quietly scoring a child',()=>{for(const x of [-1,3,NaN,1.5]){assert.throws(()=>boundaryFrame(x),RangeError);assert.throws(()=>careFrame(x),RangeError);}assert.throws(()=>boundaryFrame(0,'unknown'),RangeError);assert.throws(()=>moveStep(0,2),RangeError);});

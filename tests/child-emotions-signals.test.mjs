import test from 'node:test';import assert from 'node:assert/strict';
import {signalFrame,languageFrame} from '../src/simulations/child-emotions/signals.mjs';
test('observation survives every hypothesis and new evidence does not confirm a cause',()=>{for(let i=0;i<3;i++){const a=signalFrame(i),b=signalFrame(i,true);assert.equal(a.facts[0],b.facts[0]);assert.equal(b.facts.length,2);assert.equal(a.unknown,b.unknown);assert.deepEqual(a.facts,signalFrame(0).facts);}});
test('new frames and reset do not retain mutations',()=>{const f=signalFrame();f.facts.push('mutation');assert.equal(signalFrame().facts.length,1);assert.deepEqual(signalFrame(),signalFrame());});
test('conversation moves but safety and unknown stay',()=>{const a=languageFrame(),b=languageFrame(true);assert.equal(a.zone,'later');assert.equal(b.zone,'now');assert.equal(a.safety,b.safety);assert.equal(a.unknown,b.unknown);assert.equal(a.conversation,b.conversation);});
test('invalid states fail explicitly',()=>{for(const x of [-1,3,NaN,1.5,'0'])assert.throws(()=>signalFrame(x),RangeError);for(const x of [0,null,'true']){assert.throws(()=>signalFrame(0,x),RangeError);assert.throws(()=>languageFrame(x),RangeError);}});

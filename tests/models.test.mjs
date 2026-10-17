import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parallelTime,transferTime} from '../src/models.mjs';
test('serial work is unaffected by processor count',()=>assert.equal(parallelTime(0,32),10));
test('one processor matches baseline',()=>assert.equal(parallelTime(.9,1),10));
test('fully parallel work scales ideally',()=>assert.equal(parallelTime(1,8),1.25));
test('90 percent example respects serial bottleneck',()=>{assert.ok(Math.abs(parallelTime(.9,8)-2.125)<1e-10);assert.ok(parallelTime(.9,32)>1)});
test('transfer units are decimal MB, GB/s and milliseconds',()=>{assert.equal(transferTime(1000,16),62.5);assert.equal(transferTime(2000,32),62.5)});

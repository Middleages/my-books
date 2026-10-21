import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('D select accessible names remain independent of options',()=>{
 const s0=readFileSync(new URL('../src/components/child-family/SiblingLabs.tsx',import.meta.url),'utf8');
 assert(s0.includes('<select aria-label="기존 아이 연령"'));
});

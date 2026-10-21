import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('F select accessible names remain independent of options',()=>{
 const s0=readFileSync(new URL('../src/components/child-family/SupportReviewLabs.tsx',import.meta.url),'utf8');
 assert(s0.includes('<select aria-label="가상 주간의 한 가지 변경"'));
});

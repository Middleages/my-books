import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/components/accounting/FoundationLabs.tsx',import.meta.url),'utf8');
test('accounting select names match visible labels without concatenating option text',()=>{
 for(const label of ['돈이 들어온 이유','비교할 금액 · 가상단위','먼저 예상하기','설비 취득의 결과 예측'])assert(source.includes(`${label}<select aria-label="${label}"`));
 assert.equal((source.match(/<select /g)??[]).length,4);
});

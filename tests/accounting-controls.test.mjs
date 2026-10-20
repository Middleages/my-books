import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/components/accounting/FoundationLabs.tsx',import.meta.url),'utf8');
test('accounting select names match visible labels without concatenating option text',()=>{
 for(const label of ['돈이 들어온 이유','비교할 금액 · 가상단위','먼저 예상하기','설비 취득의 결과 예측'])assert(source.includes(`${label}<select aria-label="${label}"`));
 assert.equal((source.match(/<select /g)??[]).length,4);
});
test('accounting operations controls have unique explicit accessible names',()=>{
 const source=readFileSync(new URL('../src/components/accounting/OperationsLabs.tsx',import.meta.url),'utf8');
 for(const label of ['매입 조건과 원가 배분','인도할 수량','매입대금을 나중에 내면 원가는','매입과 지급 조건','15일 회수액','말일 현금만 알면 납기 성공도 알까'])assert(source.includes(`${label}<select aria-label="${label}"`));
 assert.equal((source.match(/<select /g)??[]).length,6);
});

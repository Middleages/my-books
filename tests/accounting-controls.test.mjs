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
test('accounting capital controls use explicit unique accessible names',()=>{const s=readFileSync(new URL('../src/components/accounting/CapitalLabs.tsx',import.meta.url),'utf8');for(const label of ['추정 사용기간','잔존가치 가정','사용 가능한 월초','상각만 달라지면 현금은','관찰 시점','자금 사건 묶음','현금 지급은 모두 비용일까'])assert(s.includes(`${label}<select aria-label="${label}"`));assert.equal((s.match(/<select /g)??[]).length,7);});

test('accounting D lab containers cannot reuse a balance-segment color class',()=>{const ui=readFileSync(new URL('../src/components/accounting/CapitalLabs.tsx',import.meta.url),'utf8'),css=readFileSync(new URL('../src/components/accounting/capital.css',import.meta.url),'utf8');assert.equal((ui.match(/className="ac-lab ac-capital-lab"/g)??[]).length,2);assert(!ui.includes('className="ac-lab ac-capital"'));assert(!/\.ac-capital(?=[{ :])/.test(css));assert(css.includes('.ac-month-cell{font-size:.875rem}'));});
test('accounting E report controls have explicit unique accessible names and isolated classes',()=>{const s=readFileSync(new URL('../src/components/accounting/ReportLabs.tsx',import.meta.url),'utf8');for(const label of ['보고서의 거래 조건','비교할 보고 범위','기말 현금은 이익과 같을까','현금 다리의 거래 조건','조정 다리의 출발점','상각을 더하면 현금이 생길까'])assert(s.includes(`${label}<select aria-label="${label}"`));assert.equal((s.match(/<select /g)??[]).length,6);assert.equal((s.match(/className="ac-lab ac-report-lab"/g)??[]).length,2);assert(!s.includes('className="ac-lab ac-capital"'));});

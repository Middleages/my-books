import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('E select accessible names remain independent of options',()=>{
 const s0=readFileSync(new URL('../src/components/child-family/BackupRestLabs.tsx',import.meta.url),'utf8');
 assert(s0.includes('<select aria-label="부재한 성인"'));
 assert(s0.includes('<select aria-label="C의 응답 상태"'));
 assert(s0.includes('<select aria-label="C에게 요청할 범위"'));
 assert(s0.includes('<select aria-label="성인 A의 희망 휴식"'));
});

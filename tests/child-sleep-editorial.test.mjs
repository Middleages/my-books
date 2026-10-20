import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
const root=new URL('../src/content/child-sleep/',import.meta.url);
test('all thirteen sleep pages explicitly disclose unperformed clinical review',()=>{
 const pages=readdirSync(root).filter(name=>name.endsWith('.mdx'));
 assert.equal(pages.length,13);
 for(const page of pages){const text=readFileSync(new URL(page,root),'utf8');assert.match(text,/감수[^\n]*(?:미실행|아직 받지 않았습니다)/,page);}
});
test('disrupted days retains the verified official KDCA source path',()=>{
 const text=readFileSync(new URL('DisruptedDays.mdx',root),'utf8');
 assert(text.includes('https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5467'));
});

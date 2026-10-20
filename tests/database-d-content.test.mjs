import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const pool=read('src/components/database/ConnectionLabs.tsx'),explain=read('src/components/database/ExplainLab.tsx'),poolBody=read('src/content/database/ConnectionsAndPools.mdx'),planBody=read('src/content/database/ExplainAndDiagnosis.mdx'),qa=read('scripts/database-browser-qa.cjs');
test('D chapters exist with stable identities, earlier C preserved, later E/F retain stable implemented identities',()=>{
 const c=read('src/catalog.ts');
 for(const [id,number,component]of[['connections-and-pools','07','DatabaseConnections'],['explain-and-diagnosis','08','DatabaseExplain']]){
  assert(c.includes(`id: "${id}", bookId: "database", readId: "database/${id}", number: "${number}"`));assert(c.includes(`Content: ${component}`));
 }
 assert.match(c,/id: "database", categoryId: "technology", volume: 4/);assert.match(c,/소개·01–12장 공개/);
 for(const id of ['schema-migrations','database-troubleshooting'])assert(c.includes(`id: "${id}", bookId: "database"`));
});
test('D body separates lease, SQL, unknown commit, server-wide capacity and plan units',()=>{
 for(const token of ['같은 client','pool.query','획득 자체가 실패','release(true)','응답을 받지 못한','최소 권한','열린 트랜잭션','예약 진입','node-postgres'])assert(poolBody.includes(token),token);
 for(const token of ['결과1행','평균1.5','loops','미관측','LIMIT','공통 시계','운영체제 cache','물리 디스크','계측 자체의 부하','PostgreSQL18','일회용 합성 DB'])assert(planBody.includes(token),token);
 for(const body of[poolBody,planBody]){assert(body.includes('learning-goals'));assert(body.includes('<Check question='));assert(body.includes('<DbGlossary'));assert(body.includes('<DbSource>'));}
 assert(poolBody.indexOf('const client = await pool.connect();')<poolBody.indexOf('  try {'));
 assert(poolBody.includes('client.release(discard)'));assert(poolBody.includes('commitSent = true'));
});
test('D scenes read exact model identity, ownership and non-saturated quantities',()=>{
 for(const token of ['f.slots','f.clients','f.requests','f.edges','f.segments','f.tokens','f.excess','f.activeTransactionClientId'])assert(pool.includes(token));
 for(const token of ['f.nodes','f.edges','f.packets','n.bufferAccesses','f.intervals','f.result','f.stopProof','f.scaleMax'])assert(explain.includes(token));
 assert(explain.includes('barWidth=nw-20'));assert(!explain.includes('Math.min(100'));assert(!pool.includes('Math.min(100'));
 assert(!/Math\.random|Date\.now|fetch\(/.test(pool+explain));
 assert(pool.includes('data-binding-client-line'));assert(explain.includes('data-packet-edge'));
 assert(pool.includes("c.ownerRequestId?'대여 중':'idle'"));assert(!pool.includes("?'사용 중'"));
 for(const token of ['c.outputIds.length','f.applicationRows','f.totalReturnedRows.oneQuery','f.totalReturnedRows.nPlusOne','앱이 조립한'])assert(explain.includes(token),token);
});
test('D source keeps accessible names and scoped long-code wrapping',()=>{
 for(const label of ['한 앱의 풀 상한','연결 사용과 반환','경로를 강조할 요청','transaction의 연결 배정','앱 인스턴스 수','인스턴스별 풀 최대'])assert(pool.includes(`aria-label="${label}"`));
 for(const label of ['실행계획의 고정 예','관측하는 범위','64행 예의 예상','자세히 볼 plan 노드'])assert(explain.includes(`aria-label="${label}"`));
 const pc=read('src/components/database/connections.css'),ec=read('src/components/database/explain.css');assert(pc.includes('.db-server-example'));assert(pc.includes('white-space:pre-wrap'));assert(ec.includes('white-space:pre-wrap'));
});
test('D browser contract is additive with all C logic byte preserved and exact geometry checks',()=>{
 execFileSync(process.execPath,['--check',new URL('../scripts/database-browser-qa.cjs',import.meta.url).pathname]);
 const start=qa.indexOf('async function assertReservationFacts('),end=qa.indexOf('// D: exact ownership');
 assert.equal(createHash('sha256').update(qa.slice(start,end)).digest('hex'),'4f4848f527f02e99372bd0df81ba66f58a9fcb0917e274ecdbe20f27243c5aad');
 for(const name of ['assertPoolFrame','assertBindingFrame','assertBudgetFrame','assertExplainFrame','exerciseDPlayback','runBatchD'])assert(qa.includes(`async function ${name}(`));
 for(const token of ['D explicit selector preflight','actual geometric unit','Node text leaves its own box','data-time-segment','data-demand-token','data-buffer-access','D08 reading persistence','await runBatchD(page,width,connectionModel,explainModel)'])assert(qa.includes(token),token);
 assert(qa.includes('await runBatchC(page,width,transactionModel,concurrencyModel)'));assert(qa.includes('no browser runtime errors'));
});

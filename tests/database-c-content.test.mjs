import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { transactionFrames, TRANSACTION_MODES, TRANSACTION_OUTCOMES } from '../src/simulations/database/transactions.mjs';
import { concurrencyFrames, snapshotFrames, deadlockFrames, CONCURRENCY_STRATEGIES, FIRST_OUTCOMES, SNAPSHOT_ISOLATIONS, DEADLOCK_ORDERS } from '../src/simulations/database/concurrency.mjs';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const tx=read('src/components/database/TransactionLabs.tsx'),con=read('src/components/database/ConcurrencyLabs.tsx'),shared=read('src/components/database/TransactionShared.tsx'),css=read('src/components/database/transactions.css'),qa=read('scripts/database-browser-qa.cjs');
const txBody=read('src/content/database/Transactions.mdx'),conBody=read('src/content/database/Concurrency.mdx');

test('C catalog exposes exactly implemented chapters with stable DB identities and volume4',()=>{
  const catalog=read('src/catalog.ts');for(const[id,number,component]of[['transactions','05','DatabaseTransactions'],['concurrency','06','DatabaseConcurrency']]){
    assert(catalog.includes(`id: "${id}", bookId: "database", readId: "database/${id}", number: "${number}"`));assert(catalog.includes(`Content: ${component}`));
  }
  assert.match(catalog,/id: "database", categoryId: "technology", volume: 4/);assert.match(catalog,/소개·01–06장 공개/);
  for(const id of ['connections-and-pools','explain-and-diagnosis','durability-and-wal','backup-and-restore','schema-migrations','database-troubleshooting'])assert(!catalog.includes(`id: "${id}", bookId: "database"`));
});
test('C writing keeps SQL success, business success and history in distinct boundaries',()=>{
  for(const token of ["status = 'confirmed'",'nextval','번호 배정','0행','외부 HTTP','COMMIT 응답','savepoint'])assert(txBody.includes(token),token);
  for(const token of ['같은 연결·같은 트랜잭션','문장 전체의 snapshot','갱신 행 수','반환 행 수','첫 데이터 문장','Azure SQL Database','B2','희생','일반 SELECT'])assert(conBody.includes(token),token);
  for(const body of[txBody,conBody]){assert(body.includes('learning-goals'));assert(body.includes('<Check question='));assert(body.includes('<DbGlossary'));assert(body.includes('<DbSource>'));assert(body.includes('https://www.postgresql.org/docs/18/'));}
});
test('C UI reads explicit model lifecycle and commit projections, not event-name guesses',()=>{
  assert(tx.includes('f.committedThisStepVersionIds'));assert(!tx.includes("kind.includes('commit')"));
  for(const token of ['committedVersionIds','activeChanges','discardedChanges','rejectedCandidate','sequence.allocations','blockStatus'])assert(tx.includes(token));
  for(const token of ['ownershipEdges','waitEdges','currentVersionIds','currentHeadVersionId','readObservations','versionIds','retryTxId','hasCycle'])assert(con.includes(token));
  assert(con.includes("t.blockStatus !== 'idle'"));assert(con.includes("v.state !== 'discarded'"));assert(shared.includes("s.status === 'waiting' ? '대기 · 완료 결과 없음'"));
  assert(!/Math\.random|Date\.now|fetch\(/.test(tx+con+shared));
  assert(shared.includes("head ? '확정·최신'"));assert(con.includes('head={f.currentHeadVersionId===v.id}'));assert(css.includes('[data-latest-head] .db-version-box'));
});
test('RR historical reads retain one transaction-snapshot group after its live scope closes',()=>{
  const frames=snapshotFrames({isolation:'repeatable-read'}),last=frames.at(-1),reads=last.readObservations.filter(o=>o.sessionId==='session:A');
  assert.equal(last.retainedSnapshotId,null);assert.equal(reads.length,2);assert.equal(reads[0].snapshotId,reads[1].snapshotId);
  const group=last.snapshots.find(s=>s.sessionId==='session:A'&&s.scope==='transaction'&&reads.some(o=>o.snapshotId===s.id));assert(group);
  assert(con.includes("const sharedSnapshot=f.snapshots.find(s=>s.sessionId==='session:A'&&s.scope==='transaction'"));
  assert(con.includes("sharedSnapshot?'같은 범위'"));assert(con.includes('같은 snapshot의 과거 조회 이력'));assert(css.includes('[data-snapshot-active=false]'));
  assert(qa.includes("assert.equal(await svg.locator('[data-shared-snapshot]').count(),shared?1:0)"));
});
test('bounded model scenes fit the declared version/transaction geometry without hidden extra endpoints',()=>{
  for(const mode of TRANSACTION_MODES)for(const outcome of TRANSACTION_OUTCOMES)for(const f of transactionFrames({mode,outcome})){
    for(const table of ['products','orders','order_items'])assert(f.activeChanges.filter(c=>c.table===table).length<=1);
    assert(f.committedThisStepVersionIds.every(id=>f.committedVersionIds.includes(id)));
  }
  for(const strategy of CONCURRENCY_STRATEGIES)for(const firstOutcome of FIRST_OUTCOMES)for(const f of concurrencyFrames({strategy,firstOutcome})){
    assert(f.versions.filter(v=>v.table==='products'&&v.state!=='discarded').length<=3);
    assert(f.readObservations.every(o=>o.versionIds.every(id=>f.versions.some(v=>v.id===id&&v.state!=='discarded'))));
  }
  for(const isolation of SNAPSHOT_ISOLATIONS)for(const f of snapshotFrames({isolation}))assert(f.versions.filter(v=>v.table==='products'&&v.state!=='discarded').length<=2);
  for(const order of DEADLOCK_ORDERS)for(const f of deadlockFrames({order})){
    const shown=f.transactions.filter(t=>t.blockStatus!=='idle');assert(shown.length<=2);
    for(const e of [...f.ownershipEdges,...f.waitEdges])assert(shown.some(t=>t.id===e.txId));
  }
});
test('C verifier is additive and checks each frame, real geometry, current entities, wrapped text and unique names',()=>{
  execFileSync(process.execPath,['--check',new URL('../scripts/database-browser-qa.cjs',import.meta.url).pathname]);
  for(const name of ['assertTransactionFrame','assertLastItemFrame','assertSnapshotFrame','assertDeadlockFrame','exerciseCPlayback','runBatchC'])assert(qa.includes(`async function ${name}(`));
  for(const token of ['C accessible selectors are unique before scenarios','await runBatchC(page,width,transactionModel,concurrencyModel)','f.committedThisStepVersionIds.map','data-retry-to','sourceSide:','targetSide:','avoidSelector:','[data-current-record]','C06 reading preserves old and unknown IDs'])assert(qa.includes(token),token);
  assert(qa.includes("await assertExplanationBounds(lab,'.db-static li p')"));assert(qa.includes('no browser runtime errors'));
  const start=qa.indexOf('    for(const route of knownRoutes.slice(1))'),end=qa.indexOf('    await runBatchB(');
  assert.equal(createHash('sha256').update(qa.slice(start,end)).digest('hex'),'7d8ecc3b8d56c4b46e83c7dfd5fa1bfd52c25eef3595423862526d801966c828');
  assert(css.includes('white-space:pre-wrap!important'));assert(css.includes('overflow-wrap:anywhere'));
  for(const label of ['확정하는 단위','요청의 진행 결과'])assert(tx.includes(`aria-label="${label}"`));
  for(const label of ['예약을 확인하는 방법','A의 마지막 처리','A의 읽기 격리 수준','두 상품에 접근하는 순서'])assert(con.includes(`aria-label="${label}"`));
});

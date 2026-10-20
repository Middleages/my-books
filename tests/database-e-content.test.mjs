import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const wal=read('src/components/database/DurabilityLab.tsx'),restore=read('src/components/database/RecoveryLab.tsx'),body9=read('src/content/database/DurabilityAndWal.mdx'),body10=read('src/content/database/BackupAndRestore.mdx'),qa=read('scripts/database-browser-qa.cjs');
test('E adds stable09/10 read identities and volume4; F stable identities remain present',()=>{
 const catalog=read('src/catalog.ts');for(const[id,number,component]of[['durability-and-wal','09','DatabaseDurability'],['backup-and-restore','10','DatabaseRecovery']]){assert(catalog.includes(`id: "${id}", bookId: "database", readId: "database/${id}", number: "${number}"`));assert(catalog.includes(`Content: ${component}`));}
 assert.match(catalog,/id: "database", categoryId: "technology", volume: 4/);assert.match(catalog,/소개·01–12장 공개/);for(const id of['schema-migrations','database-troubleshooting'])assert(catalog.includes(`id: "${id}", bookId: "database"`));
});
test('E texts distinguish physical presence, visibility, uncertain response, recovery coverage and service objectives',()=>{
 for(const token of['휘발성','pageLSN','성공을 받지 못했지만','물리적으로 존재함 ≠ 지금 조회에 보임','synchronous_commit=off','fsync=off','최근 확정 변경 손실','전체 페이지 이미지','실제 PostgreSQL 서버를 실행'])assert(body9.includes(token),token);
 for(const token of['snapshot','파일 완료 시각','그 기간에 필요한 WAL','4분','21분','10:06','모름은0이 아닙니다','앱 읽기','권한 누락','96,000원','손실 건수·금액을 알 수 없습니다','recovery model','실제 백업 생성·복원'])assert(body10.includes(token),token);
 for(const body of[body9,body10]){assert(body.includes('learning-goals'));assert(body.includes('<Check question='));assert(body.includes('<DbGlossary'));assert(body.includes('<DbSource>'));assert(body.includes('https://www.postgresql.org/docs/18/'));}
});
test('E drawing consumes model identities, causal edges and unsaturated common time units',()=>{
 for(const token of['f.ram','f.storage','f.osCache','f.flows.filter','f.readResult','data-ram-instance','data-physical-version','data-status-flow','data-visibility-flow'])assert(wal.includes(token),token);
 for(const token of['f.transfer','transfer.sourceIds','f.relationProof','f.segments','f.recoveredThrough','f.recoveryDuration','f.steps','f.checks','data-wal-continuity','data-read-permission-gate','data-recovery-transfer'])assert(restore.includes(token),token);
 assert(restore.includes('(f.lossWindow??0)*unit'));assert(restore.includes('s.duration*unit'));assert(!/Math\.min\(100|Math\.random|Date\.now|fetch\(/.test(wal+restore));assert(restore.includes('시간 축에서 다음 단계'));assert(restore.includes('<DbPrediction value={prediction}'));assert(restore.includes("setPrediction('')"));assert(wal.includes('aria-label="장애 관찰 시나리오"'));assert(restore.includes('aria-label="복구 자료와 실패 조건"'));assert(read('src/components/database/recovery.css').includes('overflow-wrap:anywhere'));
});
test('E browser assertions add actual text/geometry/lifecycle coverage without changing prior D tests',()=>{
 execFileSync(process.execPath,['--check',new URL('../scripts/database-browser-qa.cjs',import.meta.url).pathname]);const start=qa.indexOf('// D: exact ownership'),end=qa.indexOf('// E: storage survival');assert.equal(createHash('sha256').update(qa.slice(start,end)).digest('hex'),'34b46c175c313ff02016720a574f99c53c8922a146ba8f73c5451e95f3991972');
 for(const name of['assertESvgText','assertDurabilityFrame','assertRecoveryFrame','exerciseEPlayback','runBatchE'])assert(qa.includes(`async function ${name}(`));for(const token of['E explicit named selector preflight','E SVG label leaves scene','RPO loss intervals preserve a common geometric minute','RTO overflow must extend beyond goal, never saturate','data-read-permission-gate','await runBatchE(page,width,walModel,recoveryModel)','E10 reading preserves previous and unknown IDs'])assert(qa.includes(token),token);
 assert(qa.includes('assert.deepEqual(report.resourceErrors,[])'));assert(qa.includes('assert.deepEqual(report.consoleErrors,[])'));assert(qa.includes('assert.deepEqual(report.pageErrors,[])'));
});
test('E keeps source links breakable and clock legend inside a padded scene without weakening browser bounds',()=>{
 for(const body of[body9,body10])assert.equal(body.match(/className="prose db-e-prose"/g)?.length,2);
 assert.match(read('src/components/database/recovery.css'),/\.db-e-prose a\{overflow-wrap:anywhere;word-break:normal;white-space:normal\}/);
 assert.match(restore,/viewBox="0 0 280 170" role="img" aria-label="장애 이후/);
 assert.match(restore,/<text x="8" y="156" className="db-svg-small">길이 = 경과 분/);
 assert(qa.includes("assertExplanationBounds(page,'.db-e-prose .sources li')"));
 assert(wal.includes('onStep={player.go}'));assert(wal.includes('가시성 그림에서 다음 단계'));assert(qa.includes('E09 local visibility keyboard controls share one frame and pause'));
 assert(qa.includes('s.bottom<=s.height+2'));assert(qa.includes('E rendered MDX must not retain literal emphasis markers'));
});

test('E recovery time labels keep both nearby timestamps and use stroke-only continuity edges',()=>{
 const component=readFileSync(new URL('../src/components/database/RecoveryLab.tsx',import.meta.url),'utf8');
 const qa=readFileSync(new URL('../scripts/database-browser-qa.cjs',import.meta.url),'utf8');
 assert(component.includes('data-recovery-tick={t}'));assert(component.includes('y={t===0?"69":"37"}'));
 assert(component.includes('data-backup-duration x={x(-2)} y="82"'));assert(component.includes('data-dump-snapshot cx={x(-2)} cy="91"'));
 assert(/data-wal-continuity[^\n]+fill="none"/.test(component));
 assert(qa.includes('Recovery time labels must not overlap'));assert(qa.includes("getComputedStyle(e).fill"));
});

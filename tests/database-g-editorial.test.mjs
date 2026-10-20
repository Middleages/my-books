import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CANONICAL_FIXTURE, TABLE_COLUMNS, summarizeCustomer } from '../src/simulations/database/fixture.mjs';
import { recoveryFrames } from '../src/simulations/database/recovery.mjs';
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const terms = {
  FilesAndDatabase: ['데이터베이스 관리 시스템(DBMS)'],
  TablesAndConstraints: ['기본키(PK, primary key)', '외래키(FK, foreign key)', '제약조건(constraint)', 'UNKNOWN(NULL)'],
  ConnectionsAndPools: ['연결 풀(connection pool)'],
  ExplainAndDiagnosis: ['실행계획(plan)'],
};
test('G all thirteen trusted database MDX files render without literal emphasis or malformed prose', async () => {
  const files = readdirSync(new URL('../src/content/database/', import.meta.url)).filter(f => f.endsWith('.mdx'));
  assert.equal(files.length, 13);
  const server = await createServer({server:{middlewareMode:true,watch:null},appType:'custom',logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]}});
  try {
    for (const file of files) {
      const {default: Content} = await server.ssrLoadModule(`/src/content/database/${file}`);
      const html = renderToStaticMarkup(createElement(Content));
      assert(!html.includes('**'), file);
      assert(!html.includes('`'), file);
      assert(!/<del[ >]/.test(html), file);
      assert(!/<p\b[^>]*>\s*<p\b/.test(html), file);
      assert(!html.includes('아직 공개하지 않았습니다'), file);
      if (file !== 'Intro.mdx') {
        assert(html.includes('learning-goals'), file);
        assert(html.includes('<summary>'), file);
        assert(html.includes('https://www.postgresql.org/docs/18/'), file);
      }
      for (const term of terms[file.replace('.mdx', '')] ?? []) assert(html.includes(`<strong>${term}</strong>`), term);
    }
  } finally { await server.close(); }
});
test('G optional seed is exactly the canonical synthetic fixture, not a separate truth source', () => {
  const literal = v => typeof v === 'number' ? String(v) : `'${v.replaceAll("'", "''")}'`;
  const blocks = Object.entries(CANONICAL_FIXTURE).map(([table, rows]) =>
    `INSERT INTO db_book_lab.${table} (${TABLE_COLUMNS[table].join(', ')}) VALUES\n${rows.map(r => '  (' + TABLE_COLUMNS[table].map(c => literal(r[c])).join(', ') + ')').join(',\n')};`);
  const seed = read('examples/database/seed.sql');
  assert.equal(seed.replace(/^--.*\n/gm, '').trim(), blocks.join('\n\n'));
  assert.deepEqual(summarizeCustomer(), {orderCount:2,itemCount:3,totalQty:7,totalWon:36000,orderIds:[1001,1002]});
  assert.equal(createHash('sha256').update(seed).digest('hex').length, 64);
});
test('G optional SQL contracts preserve disposal boundaries and keep failure distinct from success', () => {
  const schema = read('examples/database/schema.sql');
  assert.equal((schema.match(/REFERENCES db_book_lab\./g) ?? []).length, 3);
  assert.equal((schema.match(/PRIMARY KEY/g) ?? []).length, 5); // four declarations + one explanatory comment
  assert(schema.includes('PRIMARY KEY (order_id, line_no)'));
  assert(schema.includes('qty integer NOT NULL CHECK (qty > 0)'));
  const setup = read('examples/database/setup.sql');
  for (const text of ["current_database() <> 'db_book_source'",'BEGIN;','\\ir schema.sql','\\ir seed.sql','COMMIT;']) assert(setup.includes(text), text);
  const sqlFiles = readdirSync(new URL('../examples/database/', import.meta.url)).filter(f => f.endsWith('.sql'));
  for (const file of sqlFiles) {
    const executable = read(`examples/database/${file}`).replace(/^--.*$/gm, '');
    assert(!/\b(DROP|TRUNCATE|ALTER\s+ROLE|CREATE\s+ROLE)\b/i.test(executable), file);
    assert(!/IF NOT EXISTS/i.test(executable), file);
  }
  for (const file of ['queries.sql', 'verify.sql']) assert(read(`examples/database/${file}`).includes('BEGIN READ ONLY;'));
  for (const file of ['rollback.sql', 'constraint-failure.sql','session-a.sql','session-b.sql']) {
    const sql = read(`examples/database/${file}`);
    assert(sql.includes("current_database() <> 'db_book_source'"), file);
    assert(sql.includes('\\set ON_ERROR_STOP on'), file);
  }
  assert(read('examples/database/constraint-failure.sql').includes('SQLSTATE 23514'));
  for(const file of ['session-a.sql','session-b.sql']) assert(read(`examples/database/${file}`).includes('BEGIN ISOLATION LEVEL READ COMMITTED;'));
  const doc = read('examples/database/README.md');
  for (const text of ['실행하지 않았다','빈 일회용','SQLSTATE23514','종료코드3','60초','별도 앱 역할','--single-transaction','--exit-on-error','--no-owner --no-acl','원래 데이터를 임의 UPDATE로 맞추거나 지우지 않는다']) assert(doc.includes(text), text);
  assert(read('docs/DATABASE-LAB-ENVIRONMENT.md').includes('미관측'));
});
test('G copied recovery rows do not retain a misleading before-copy label', () => {
  const f = recoveryFrames({scenario:'physical-continuous'}).find(f => f.phase === 'copy');
  assert(f.target && f.relationProof);
  assert.equal(f.recoveredThrough, null);
  const ui = read('src/components/database/RecoveryLab.tsx');
  assert(ui.includes('data-recovery-data-time'));
  assert(ui.includes("데이터 시점: {f.recoveredThrough===null?'미확정'"));
  assert(!ui.includes("f.recoveredThrough===null?'복원 전'"));
});
test('G browser verifier retains A–F and adds actual emphasis, copied-state and boundary proof', () => {
  const qa = read('scripts/database-browser-qa.cjs');
  for (const text of ['async function runBatchG','G all chapters actual prose','G rendered strong definitions','G copied rows with undetermined data time','await runBatchF(','await runBatchG(','text.getBBox()','data-recovery-data-time']) assert(qa.includes(text), text);
  assert(read('src/content/database/Intro.mdx').includes('https://github.com/Middleages/my-books/tree/main/examples/database'));
  assert(read('src/content/database/TablesAndConstraints.mdx').includes('#/database/queries-and-joins'));
});

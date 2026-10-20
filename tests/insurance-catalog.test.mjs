import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseRead } from '../src/reading.mjs';
const catalog = readFileSync(new URL('../src/catalog.ts', import.meta.url), 'utf8');
const published = ['expected-loss', 'pooling', 'contract-map', 'payout', 'coverage-conditions', 'overlap', 'timelines', 'surrender', 'claims', 'reading-insurance'];
test('insurance publishes only implemented stable chapter identities', () => {
  const ids = [...catalog.matchAll(/id: "([^"]+)", bookId: "insurance", readId: "([^"]+)"/g)].map(m => [m[1], m[2]]);
  assert.deepEqual(ids, published.map(id => [id, `insurance/${id}`]));
  assert.match(catalog, /id: "insurance", categoryId: "money"/);
  assert.match(catalog, /소개·01–10장 공개/);
});
test('insurance retains existing and unknown read identities', () => {
  const ids = ['parallel', 'money/map', 'economics/reading-news', 'investing/reading-investments', 'future/unknown', ...published.map(id => `insurance/${id}`)];
  assert.deepEqual(parseRead(JSON.stringify(ids)), ids);
});

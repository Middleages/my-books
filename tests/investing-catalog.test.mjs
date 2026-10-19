import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseRead } from '../src/reading.mjs';
const catalog = readFileSync(new URL('../src/catalog.ts', import.meta.url), 'utf8');
test('investing batch A publishes exactly its planned chapter identities', () => {
  const ids = [...catalog.matchAll(/id: "([^"]+)", bookId: "investing", readId: "([^"]+)"/g)].map(m => [m[1], m[2]]);
  assert.deepEqual(ids, [['ownership', 'investing/ownership'], ['total-return', 'investing/total-return']]);
  assert.match(catalog, /id: "investing", categoryId: "money"/);
});
test('investing read markers preserve all legacy and unknown stored identities', () => {
  const marks = ['parallel', 'money/map', 'economics/reading-news', 'future/kept', 'investing/ownership', 'investing/total-return'];
  assert.deepEqual(parseRead(JSON.stringify(marks)), marks);
});

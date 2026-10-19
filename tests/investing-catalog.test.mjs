import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseRead } from '../src/reading.mjs';
const catalog = readFileSync(new URL('../src/catalog.ts', import.meta.url), 'utf8');
test('investing batch D publishes exactly its planned chapter identities', () => {
  const ids = [...catalog.matchAll(/id: "([^"]+)", bookId: "investing", readId: "([^"]+)"/g)].map(m => [m[1], m[2]]);
  assert.deepEqual(ids, [['ownership', 'investing/ownership'], ['total-return', 'investing/total-return'], ['orders', 'investing/orders'], ['financial-statements', 'investing/financial-statements'], ['valuation', 'investing/valuation'], ['bonds', 'investing/bonds'], ['diversification', 'investing/diversification'], ['funds-etfs', 'investing/funds-etfs']]);
  assert.match(catalog, /id: "investing", categoryId: "money"/);
});
test('investing read markers preserve all legacy and unknown stored identities', () => {
  const marks = ['parallel', 'money/map', 'economics/reading-news', 'future/kept', 'investing/ownership', 'investing/total-return', 'investing/orders', 'investing/financial-statements', 'investing/valuation', 'investing/bonds', 'investing/diversification', 'investing/funds-etfs'];
  assert.deepEqual(parseRead(JSON.stringify(marks)), marks);
});

test('investing batch D keeps exact titles and reserves unfinished E/F routes', () => {
  assert.match(catalog, /id: "diversification", bookId: "investing", readId: "investing\/diversification", number: "07", title: "분산과 함께 움직이는 위험"/);
  assert.match(catalog, /id: "funds-etfs", bookId: "investing", readId: "investing\/funds-etfs", number: "08", title: "펀드·ETF와 그 안의 자산"/);
  for (const reserved of ['costs-fx', 'allocation-rebalancing', 'performance-history', 'reading-investments']) {
    assert(!catalog.includes(`id: "${reserved}"`), `Unimplemented ${reserved} was published`);
  }
});

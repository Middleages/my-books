import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseRead } from '../src/reading.mjs';
const catalog = readFileSync(new URL('../src/catalog.ts', import.meta.url), 'utf8');
test('investing final batch publishes exactly all twelve planned chapter identities', () => {
  const ids = [...catalog.matchAll(/id: "([^"]+)", bookId: "investing", readId: "([^"]+)"/g)].map(m => [m[1], m[2]]);
  assert.deepEqual(ids, [['ownership', 'investing/ownership'], ['total-return', 'investing/total-return'], ['orders', 'investing/orders'], ['financial-statements', 'investing/financial-statements'], ['valuation', 'investing/valuation'], ['bonds', 'investing/bonds'], ['diversification', 'investing/diversification'], ['funds-etfs', 'investing/funds-etfs'], ['costs-fx', 'investing/costs-fx'], ['allocation-rebalancing', 'investing/allocation-rebalancing'], ['performance-history', 'investing/performance-history'], ['reading-investments', 'investing/reading-investments']]);
  assert.match(catalog, /id: "investing", categoryId: "money"/);
});
test('investing read markers preserve all legacy and unknown stored identities', () => {
  const marks = ['parallel', 'money/map', 'economics/reading-news', 'future/kept', 'investing/ownership', 'investing/total-return', 'investing/orders', 'investing/financial-statements', 'investing/valuation', 'investing/bonds', 'investing/diversification', 'investing/funds-etfs', 'investing/costs-fx', 'investing/allocation-rebalancing', 'investing/performance-history', 'investing/reading-investments'];
  assert.deepEqual(parseRead(JSON.stringify(marks)), marks);
});

test('investing final batch keeps exact titles and truthful public chapter count', () => {
  assert.match(catalog, /id: "diversification", bookId: "investing", readId: "investing\/diversification", number: "07", title: "분산과 함께 움직이는 위험"/);
  assert.match(catalog, /id: "funds-etfs", bookId: "investing", readId: "investing\/funds-etfs", number: "08", title: "펀드·ETF와 그 안의 자산"/);
  assert.match(catalog, /id: "costs-fx", bookId: "investing", readId: "investing\/costs-fx", number: "09", title: "비용과 환율 뒤의 수익"/);
  assert.match(catalog, /id: "allocation-rebalancing", bookId: "investing", readId: "investing\/allocation-rebalancing", number: "10", title: "자산배분과 재조정"/);
  assert.match(catalog, /id: "performance-history", bookId: "investing", readId: "investing\/performance-history", number: "11", title: "과거 성과와 손실 경로"/);
  assert.match(catalog, /id: "reading-investments", bookId: "investing", readId: "investing\/reading-investments", number: "12", title: "투자 설명 함께 읽기"/);
  assert.match(catalog, /future: "소개·01–12장 공개 · 권리와 현금흐름부터 과거 성과와 투자 설명 읽기까지 살펴봅니다\."/);
  assert(!catalog.includes('비용·환율과 자산배분 등은 후속 집필 예정'));
  const intro = readFileSync(new URL('../src/content/investing/Intro.mdx', import.meta.url), 'utf8');
  assert.equal([...intro.matchAll(/\[\d{2} [^\]]+\]\(#\/investing\/[^)]+\)/g)].length, 12);
  assert.match(intro, /열두 장/);
});

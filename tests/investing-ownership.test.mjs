import test from 'node:test';
import assert from 'node:assert/strict';
import { ownershipDefaults, ownershipFrames } from '../src/simulations/investing/ownership.mjs';
const close = (a,b) => assert.ok(Math.abs(a-b) < 1e-8, `${a} != ${b}`);
function conserve(result) {
  for (const f of result.frames) {
    close(f.cashTotal, result.frames[0].cashTotal);
    close(f.investorShares + f.buyerShares + f.sellerShares + f.otherShares, f.totalShares);
    assert.ok(f.companyCash >= 0 && f.buyerCash >= 0 && f.sellerCash >= 0);
  }
}
test('issuance adds 50 shares and 5000 company cash while incumbent keeps 10 shares', () => {
 const r = ownershipFrames(); conserve(r);
 assert.equal(r.summary.totalShares,1050); assert.equal(r.summary.companyCashChange,5000);
 assert.equal(r.summary.investorShares,10); assert.equal(r.frames[0].ownershipPercent,1);
 close(r.summary.ownershipPercent,100/105); assert.equal(r.summary.cashFlow.to,'company');
 assert.equal(r.summary.shareFlow.from,'company'); assert.equal(r.frames[1].companyCash,10000);
 assert.match(r.summary.message,/가치 손실을 확정할 수 없습니다/);
});
test('secondary trading transfers existing shares and cash between investors only', () => {
 const r = ownershipFrames({mode:'secondary'}); conserve(r);
 assert.equal(r.summary.totalShares,1000); assert.equal(r.summary.companyCashChange,0);
 assert.equal(r.summary.buyerShares,50); assert.equal(r.summary.sellerShares,50);
 assert.equal(r.summary.sellerCash,5000); assert.equal(r.summary.cashFlow.to,'seller');
 assert.equal(r.summary.ownershipPercent,1);
});
test('insufficient buyer cash and selling unowned shares leave all balances unchanged', () => {
 for(const p of [{buyerCash:4999},{mode:'secondary',quantity:101}]) {
   const r=ownershipFrames(p); conserve(r); assert.equal(r.summary.status,'rejected');
   assert.equal(r.summary.issuedShares,0); assert.equal(r.summary.buyerShares,0); assert.equal(r.summary.cashFlow,null);
 }
});
test('zero shares, price and quantity remain well-defined; zero denominator is null', () => {
 const r=ownershipFrames({existingShares:0,investorShares:0,sellerShares:0,quantity:0}); conserve(r);
 assert.equal(r.summary.ownershipRatio,null);
 const free=ownershipFrames({price:0}); conserve(free); assert.equal(free.summary.companyCashChange,0); assert.equal(free.summary.issuedShares,50);
});
test('bad numeric inputs and inconsistent ownership are rejected', () => {
 for(const p of [{quantity:-1},{price:NaN},{buyerCash:Infinity},{mode:'bad'},{existingShares:10}]) assert.throws(()=>ownershipFrames(p),RangeError);
});
test('ownership inputs and earlier frames are not mutated and replay is deterministic', () => {
 const p=Object.freeze({...ownershipDefaults}); const first=ownershipFrames(p); const copy=structuredClone(first);
 assert.deepEqual(ownershipFrames(p),first); assert.deepEqual(first,copy);
 first.summary.buyerCash=0; assert.equal(first.frames[0].buyerCash,10000); assert.equal(p.buyerCash,10000);
});
test('ownership tiles preserve a fixed share unit and expose the enlarged denominator', () => {
 const r=ownershipFrames();
 assert.equal(r.frames[0].shareTileUnit,10); assert.equal(r.summary.shareTileUnit,10);
 assert.equal(r.frames[0].shareTiles.length,100); assert.equal(r.summary.shareTiles.length,105);
 assert.deepEqual(r.summary.shareTiles[0],{kind:'observer',shares:10,fraction:1});
 assert.equal(r.summary.shareTiles.filter(t=>t.kind==='issued').length,5);
 for(const f of r.frames) close(f.shareTiles.reduce((s,t)=>s+t.shares,0),f.totalShares);
});
test('fractional tiles conserve all shares and huge inputs keep bounded arrays with a shared unit',()=>{
 for(const options of [{investorShares:7,quantity:13.5},{existingShares:1e12,quantity:1e12,buyerCash:1e12,price:0},{existingShares:0,investorShares:0,sellerShares:0,quantity:0}]) {
  const r=ownershipFrames(options);
  for(const f of r.frames) {
   assert.equal(f.shareTileUnit,r.summary.shareTileUnit); assert.ok(f.shareTiles.length<=201);
   const sum=f.shareTiles.reduce((s,t)=>s+t.shares,0);
   assert.ok(Math.abs(sum-f.totalShares)<=Math.max(1e-8,f.totalShares*1e-14));
   for(const t of f.shareTiles) assert.ok(t.fraction>0 && t.fraction<=1);
  }
 }
 const partial=ownershipFrames({investorShares:7}).frames[0].shareTiles[0];
 assert.equal(partial.fraction,.7); assert.equal(partial.shares,7);
});

test('unrepresentable positive ownership events reject atomically rather than invent cash or shares', () => {
 const cases = [{quantity:Number.MIN_VALUE,price:0},{mode:'secondary',quantity:Number.MIN_VALUE,price:0},{quantity:.5,price:Number.MIN_VALUE},{mode:'secondary',quantity:1,price:Number.MIN_VALUE},{quantity:1,price:1e-8,buyerCash:1e-8,companyCash:1e12}];
 for (const input of cases) {
  const r = ownershipFrames(input), first = r.frames[0], last = r.summary;
  assert.equal(last.status,'rejected'); assert.equal(last.cashFlow,null); assert.equal(last.shareFlow,null);
  for (const key of ['companyCash','buyerCash','sellerCash','totalShares','investorShares','buyerShares','sellerShares','otherShares']) assert.equal(last[key], first[key]);
  assert.match(last.message,/계산 정밀도/);
 }
});
test('representable fractional, free and extremely small ownership transfers remain supported', () => {
 for (const mode of ['issuance','secondary']) for (const values of [{quantity:13.5,price:.1},{quantity:13.5,price:0},{quantity:0}]) {
  const r=ownershipFrames({mode,...values}); conserve(r); assert.equal(r.summary.status,'completed');
 }
 for (const values of [{quantity:1e-300,price:1},{quantity:1,price:1e-300}]) {
  const r=ownershipFrames({existingShares:0,investorShares:0,sellerShares:0,companyCash:0,buyerCash:1e-300,...values});
  assert.equal(r.summary.status,'completed'); assert.equal(r.summary.buyerShares,values.quantity);
  assert.equal(r.summary.companyCash,1e-300); assert.equal(r.summary.buyerCash,0);
 }
});
test('zero quantity and free transfers explain unchanged cash without claiming a paid movement', () => {
 for (const mode of ['issuance','secondary']) {
  const zero=ownershipFrames({mode,quantity:0});
  assert.equal(zero.summary.message,'거래 수량이 0주이므로 주식과 현금은 그대로입니다.');
  assert.equal(zero.summary.companyCashChange,0); assert.equal(zero.summary.buyerShares,0); assert.equal(zero.summary.cashFlow.amount,0);
  const free=ownershipFrames({mode,price:0});
  assert.equal(free.summary.message,mode==='issuance' ? '대금 0의 가상 신주 이전입니다. 전체 주식 수는 늘고 회사 현금은 그대로입니다.' : '기존 주식만 투자자 사이로 이전합니다. 대금은 0이며 회사 현금은 그대로입니다.');
  assert.equal(free.summary.companyCashChange,0); assert.equal(free.summary.buyerShares,50); assert.equal(free.summary.cashFlow.amount,0);
 }
});

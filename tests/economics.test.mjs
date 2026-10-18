import test from 'node:test';
import assert from 'node:assert/strict';
import { flowFrames, market, compareMarkets } from '../src/simulations/economics/foundations.mjs';

test('노동과 임금, 재화와 대금은 한 거래의 반대 방향이며 현금 보존', () => {
  const fs=flowFrames({hours:10,wanted:40});
  assert.equal(fs.length,5);
  assert.equal(fs[1].wages,100000);
  assert.equal(fs[1].householdCash,300000);
  assert.equal(fs[2].produced,50);
  assert.equal(fs[3].sold,40);
  assert.equal(fs[3].revenue,80000);
  assert.equal(fs[4].householdCash,220000);
  for(const f of fs){assert.equal(f.householdCash+f.firmCash,1200000);assert.equal(f.produced,f.inventory+f.sold);}
  assert.deepEqual({...fs[3],phase:4},fs[4]);
});
test('생산 없음·재고 부족·전량 구매·최댓값과 반복 실행',()=>{
  for(const hours of [0,1,10,20])for(const wanted of [0,1,40,100]){
    const p={hours,wanted},fs=flowFrames(p),f=fs.at(-1);
    assert.equal(f.sold,Math.min(wanted,hours*5));
    assert.equal(f.unfilled,wanted-f.sold);
    assert.ok(f.householdCash>=0 && f.firmCash>=0);
    assert.deepEqual(fs,flowFrames(p));
    assert.deepEqual(p,{hours,wanted});
  }
});
test('수요 증가와 공급 감소는 같은 가격 상승·반대 수량',()=>{
  const b=market(0,0,3500),d=market(40,0,3500),s=market(0,-40,3500);
  assert.equal(b.equilibrium.price,3500); assert.equal(b.equilibrium.quantity,50);
  assert.equal(d.equilibrium.price,4500);assert.equal(d.equilibrium.quantity,70);
  assert.equal(s.equilibrium.price,4500);assert.equal(s.equilibrium.quantity,30);
  assert.equal(compareMarkets(d,b).quantity,'up');assert.equal(compareMarkets(s,b).quantity,'down');
});
test('가격만 변경하면 곡선과 균형 불변·곡선 위 점만 이동',()=>{
  const a=market(0,0,2000),b=market(0,0,5000);
  assert.deepEqual(a.curves,b.curves);assert.deepEqual(a.equilibrium,b.equilibrium);
  assert.ok(a.demand>b.demand);assert.ok(a.supply<b.supply);
  assert.equal(a.gap,a.demand-a.supply);
  assert.equal(a.demand,80);assert.equal(a.supply,20);
});
test('동시 이동·경계·정확 교점·차트 범위·재실행',()=>{
  const both=market(40,-40,3500);assert.equal(both.equilibrium.price,5500);assert.equal(both.equilibrium.quantity,50);
  for(const d of [0,1,20,40])for(const s of [-40,-1,0])for(const p of [1000,3500,6000]){
    const r=market(d,s,p),e=market(d,s,r.equilibrium.price);
    assert.equal(e.demand,e.supply);assert.equal(e.demand,e.equilibrium.quantity);
    assert.deepEqual(r,market(d,s,p));
    for(const curve of Object.values(r.curves))for(const point of curve){assert.ok(point.q>=0&&point.q<=160);assert.ok(point.p>=0&&point.p<=8000);}
  }
});
test('잘못된 값·비유한 값·소수 노동·모형 밖 입력 거부',()=>{
  for(const p of [{hours:-1,wanted:2},{hours:21,wanted:2},{hours:1.5,wanted:1},{hours:NaN,wanted:1},{hours:1,wanted:101},{hours:1,wanted:Infinity}])assert.throws(()=>flowFrames(p),RangeError);
  for(const p of [[NaN,0,3500],[41,0,3500],[0,-41,3500],[0,1,3500],[0,0,999],[0,0,8001]])assert.throws(()=>market(...p),RangeError);
});

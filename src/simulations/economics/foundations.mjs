// 가상 교육 모형. 원·시간·개; 거래는 관찰 프레임에서 한 번만 반영한다.
const range=(v,min,max,integer=false)=>{if(!Number.isFinite(v)||v<min||v>max||(integer&&!Number.isInteger(v)))throw new RangeError('교육 모형의 입력 범위 밖입니다.');};
export const flowDefaults=Object.freeze({hours:10,wanted:40});
export const flowPhases=['출발 잔액','노동 제공 · 임금 지급','빵 생산','빵 인도 · 대금 지급','한 달 결산'];
export function flowFrames({hours,wanted}){
  range(hours,0,20,true);range(wanted,0,100,true);
  let householdCash=200000,firmCash=1000000,wages=0,produced=0,sold=0,revenue=0,labour=0;
  const frames=[];
  const snap=phase=>frames.push({phase,householdCash,firmCash,wages,produced,sold,revenue,labour,inventory:produced-sold,unfilled:phase>=3?wanted-sold:0});
  snap(0);labour=hours;wages=hours*10000;householdCash+=wages;firmCash-=wages;snap(1);
  produced=hours*5;snap(2);
  sold=Math.min(wanted,produced,Math.floor(householdCash/2000));revenue=sold*2000;householdCash-=revenue;firmCash+=revenue;snap(3);snap(4);
  return frames;
}
// Qd=max(0,120+d-P/50), Qs=max(0,-20+s+P/50).
// d in [0,40], s in [-40,0]: 内部 교점이 항상 양수인 교육 범위.
export function market(d,s,price){
  range(d,0,40);range(s,-40,0);range(price,1000,8000);
  const demandAt=p=>Math.max(0,120+d-p/50),supplyAt=p=>Math.max(0,-20+s+p/50);
  const ep=3500+25*(d-s),eq=50+(d+s)/2;
  const prices=Array.from({length:161},(_,i)=>i*50);
  return {d,s,price,demand:demandAt(price),supply:supplyAt(price),gap:demandAt(price)-supplyAt(price),equilibrium:{price:ep,quantity:eq},curves:{demand:prices.map(p=>({p,q:demandAt(p)})),supply:prices.map(p=>({p,q:supplyAt(p)}))}};
}
const direction=x=>Math.abs(x)<1e-9?'same':x>0?'up':'down';
export function compareMarkets(current,base){return {price:direction(current.equilibrium.price-base.equilibrium.price),quantity:direction(current.equilibrium.quantity-base.equilibrium.quantity)};}

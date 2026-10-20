import {createLedger,post,snapshot,debit as d,credit as c} from './business-ledger.mjs';
import {companyEvents} from './company-case.mjs';

const prefix=()=>companyEvents().slice(0,4).reduce((s,e)=>post(s,e),createLedger());
const event=(id,day,label,rows,cashFlow)=>({id,day,period:'M1',label,rows,...(cashFlow?{cashFlow}:{})});
export const costMethods=Object.freeze(['single','fifo','average']);
export const costLabels=Object.freeze({single:'기본 · 100개를 원가3에 매입',fifo:'확장 · 두 원가층, 선입선출',average:'확장 · 두 원가층, 기간 가중평균'});
export function inventoryCost(soldQuantity=80,method='single'){
 if(!Number.isInteger(soldQuantity)||soldQuantity<0||soldQuantity>100)throw new RangeError('판매 수량은 보유한 0–100개여야 합니다.');
 if(!costMethods.includes(method))throw new RangeError('원가 배분 방법을 확인하세요.');
 const layers=method==='single'?[{quantity:100,unitCost:3}]:[{quantity:50,unitCost:3},{quantity:50,unitCost:4}];
 const totalCost=layers.reduce((sum,l)=>sum+l.quantity*l.unitCost,0);
 let remaining=soldQuantity;
 const allocations=method==='average'
  ?[{quantity:soldQuantity,unitCost:totalCost/100,amount:soldQuantity*totalCost/100}]
  :layers.map(l=>{const quantity=Math.min(remaining,l.quantity);remaining-=quantity;return{quantity,unitCost:l.unitCost,amount:quantity*l.unitCost};});
 const costOfSales=allocations.reduce((sum,a)=>sum+a.amount,0);
 return{method,soldQuantity,purchasedQuantity:100,remainingQuantity:100-soldQuantity,layers,allocations,totalCost,costOfSales,endingCost:totalCost-costOfSales,sales:soldQuantity*5};
}
export function inventoryFrames({soldQuantity=80,method='single'}={}){
 const cost=inventoryCost(soldQuantity,method);
 let state=prefix();const baseline=snapshot(state),frames=[];
 const add=(title,detail,day,e=null)=>{
  if(e)state=post(state,e);
  const s=snapshot(state),purchased=state.appliedIds.includes('I-buy'),delivered=state.appliedIds.includes('I-sell');
  // Tokens encode quantity only, never a claim about which physical cost layer left first.
  const tokens=Array.from({length:10},(_,i)=>{const quantity=10,sold=purchased&&delivered?Math.min(quantity,Math.max(0,soldQuantity-i*10)):0;return{id:i,quantity,remaining:purchased?quantity-sold:0,sold,planned:!purchased};});
  frames.push({...s,index:frames.length,title,detail,day,event:e,method,cost:{...cost,layers:cost.layers.map(l=>({...l})),allocations:cost.allocations.map(a=>({...a}))},purchased,delivered,tokens,
   purchasedQuantity:purchased?100:0,remainingQuantity:purchased?100-(delivered?soldQuantity:0):0,soldQuantity:delivered?soldQuantity:0,
   availableCost:purchased?cost.totalCost:0,exerciseCash:s.balances.cash-baseline.balances.cash,receiptTotal:state.appliedIds.includes('I-collect')?Math.min(160,cost.sales):0,paymentTotal:state.appliedIds.includes('I-pay')?210:0});
 };
 add('T01–T04 뒤 · 아직 재고 매입 전','현금350·선급60·설비240에서 시작합니다. 이번 발췌에는 아직 재고도 판매도 없습니다.',1);
 add('외상 매입 · 비용이 아니라 재고',method==='single'?'100개×원가3=300을 외상으로 매입합니다. 재고와 매입채무가300씩 늘고 현금·비용은 그대로입니다.':'확장 사례: 먼저50개×3, 그다음50개×4를 매입한 총원가350입니다. 두 매입을 합쳐 기록하며 기본 사례의300과 다른 조건입니다.',3,event('I-buy',3,'상품100개 외상 매입',[d('inventory',cost.totalCost),c('payable',cost.totalCost)]));
 add('인도 · 수량과 원가가 함께 나감',`${soldQuantity}개를 개당5에 인도합니다. 매출${cost.sales}와 매출원가${cost.costOfSales}를 한 사건으로 기록합니다. 남은 수량${cost.remainingQuantity}개와 남은 장부원가${cost.endingCost}를 구분하세요.`,10,event('I-sell',10,'상품 인도 및 매출·원가 인식',[d('receivable',cost.sales),c('revenue',cost.sales),d('cogs',cost.costOfSales),c('inventory',cost.costOfSales)]));
 add('기존 채권 회수 · 원가는 그대로',`판매대금 중${Math.min(160,cost.sales)}를 회수합니다. 매출채권을 현금으로 바꿀 뿐 매출원가를 다시 기록하지 않습니다.`,15,event('I-collect',15,'기존 외상대금 회수',[d('cash',Math.min(160,cost.sales)),c('receivable',Math.min(160,cost.sales))],'operating'));
 add('매입채무210 지급 · 원가는 그대로','기존 매입채무 중210을 지급합니다. 지급했다고 아직 팔지 않은 상품까지 비용으로 바뀌지는 않습니다.',20,event('I-pay',20,'기존 매입채무210 지급',[d('payable',210),c('cash',210)],'operating'));
 return frames;
}

export const workingModes=Object.freeze(['base','stock-credit','stock-paid','due-before','due-after']);
export const workingLabels=Object.freeze({base:'기본 · 100개 매입, 210 지급','stock-credit':'추가20개 외상 · 지급은210','stock-paid':'추가20개 외상 · 60도 더 지급','due-before':'추가20개 · 전액 납기12일','due-after':'추가20개 · 전액 납기20일'});
export const narrowWorkingCapital=s=>s.balances.receivable+s.balances.inventory-s.balances.payable;
export function workingCapitalFrames({mode='base',collection=160}={}){
 if(!workingModes.includes(mode)||![0,160,400].includes(collection))throw new RangeError('운전자금 비교 조건을 확인하세요.');
 let state=prefix();const baseline=snapshot(state),frames=[],attempts=[];
 const extra=mode!=='base',dueDay=mode==='due-before'?12:20,payment=mode.startsWith('due-')?360:mode==='stock-paid'?270:210;
 const add=(title,detail,day,e=null,paymentAttempt=false)=>{
  let attempted=null;
  if(e&&paymentAttempt){
   const available=state.balances.cash,required=e.rows.reduce((sum,r)=>sum+(r.account==='cash'?(r.side==='credit'?r.amount:-r.amount):0),0);
   attempted={id:e.id,day,required,available,shortage:Math.max(0,required-available),status:required>available?'blocked':'paid'};
   attempts.push(attempted);
   if(attempted.status==='paid')state=post(state,e);
  }else if(e)state=post(state,e);
  const s=snapshot(state),owc=narrowWorkingCapital(s),owcChange=owc-narrowWorkingCapital(baseline),exerciseProfit=s.profit-baseline.profit,exerciseCash=s.balances.cash-baseline.balances.cash;
  frames.push({...s,index:frames.length,title,detail,day,event:e,mode,collection,extra,dueDay,payment,attempted:attempted?{...attempted}:null,attempts:attempts.map(a=>({...a})),owc,owcChange,exerciseProfit,exerciseCash,bridgeCash:exerciseProfit-owcChange,
   receiptTotal:state.appliedIds.includes('W-collect')?collection:0,paymentTotal:attempts.filter(a=>a.status==='paid').reduce((sum,a)=>sum+a.required,0),
   history:[...frames.map(f=>({day:f.day,cash:f.balances.cash})),{day,cash:s.balances.cash}]});
 };
 add('T01–T04 뒤 · 영업 발췌 시작','현금350에서 시작합니다. 이후 상품 매입·판매·수금·매입대금 지급만 봅니다. 전체 M1 결산의 이익65·현금225와는 다른 범위입니다.',1);
 add('T05 · 100개 외상 매입','재고300과 매입채무300이 함께 생깁니다. 아직 현금은 나가지 않았고 이익도 없습니다.',3,companyEvents()[4]);
 add(extra?'추가20개 외상 매입':'추가 매입 없이 같은 조건 유지',extra?'추가 재고60과 매입채무60이 함께 늘어납니다. 이 단계의 현금 변화는0입니다.':'매입 수량100개를 그대로 유지합니다. 다음 단계에서80개를 팝니다.',7,extra?event('W-extra',7,'추가 상품20개 외상 매입',[d('inventory',60),c('payable',60)]):null);
 add('T06 · 80개 인도','매출400−매출원가240=발췌 이익160입니다. 현금이 아니라 받을 권리400이 생겼습니다.',10,companyEvents()[5]);
 const collect=()=>add('T07 · 기존 외상대금 회수',`기존 매출채권 중${collection}를 회수합니다. 회수는 새 이익이 아니며, 앞서 지급 실패가 있었다면 그 납기 기록을 지우지 않습니다.`,15,event('W-collect',15,'외상대금 회수',[d('cash',collection),c('receivable',collection)],'operating'));
 const pay=()=>add(`M1 ${dueDay}일 · 매입대금${payment} 지급 시도`,'지급 직전 실제 현금과 필요한 금액을 비교합니다. 전액이 부족하면 이번 전액 지급은 실행하지 않습니다. 자동 차입·부분 지급·나중 자동 재시도는 하지 않습니다.',dueDay,event('W-pay',dueDay,'매입대금 지급 시도',[d('payable',payment),c('cash',payment)],'operating'),true);
 if(dueDay<15){pay();collect();}else{collect();pay();}
 add('M1 말 · 잔액과 지난 납기를 함께 읽기','이후 거래를 덧붙이지 않은 발췌입니다. 말일 현금이 많아도 과거 납기 부족이 사라지는 것은 아닙니다. 실패한 지급과 남은 채무를 함께 확인하세요.',30);
 return frames;
}

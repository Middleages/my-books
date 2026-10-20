import {createLedger,post,snapshot,periodSummary,debit as d,credit as c} from './business-ledger.mjs';
import {companyEvents} from './company-case.mjs';
const finite=n=>typeof n==='number'&&Number.isFinite(n);
export function depreciationSchedule({cost=240,residual=0,lifeMonths=24,availableMonth=1}={}){
 if(!finite(cost)||cost<0||!finite(residual)||residual<0||residual>cost||!Number.isInteger(lifeMonths)||lifeMonths<1||lifeMonths>120||!Number.isInteger(availableMonth)||availableMonth<1||availableMonth>12)throw new RangeError('취득원가·잔존가치·사용개월·사용가능 월을 확인하세요.');
 const depreciable=cost-residual,monthly=depreciable/lifeMonths,months=availableMonth+lifeMonths;
 let accumulated=0;const rows=[];
 for(let month=1;month<=months;month++){const used=Math.min(lifeMonths,Math.max(0,month-availableMonth+1)),next=used===lifeMonths?depreciable:monthly*used,amount=next-accumulated;accumulated=next;rows.push({month,used,amount,accumulated,net:cost-accumulated,unallocated:depreciable-accumulated,residual});}
 return{cost,residual,lifeMonths,availableMonth,depreciable,monthly,months,rows};
}
export function equipmentFrames(options={}){
 const schedule=depreciationSchedule(options);let state=createLedger();for(const e of companyEvents().slice(0,2))state=post(state,e);
 const baseline=snapshot(state),frames=[];
 const add=(title,detail,event,month,purchased)=>{const f=snapshot(state);frames.push({...f,index:frames.length,title,detail,event,month,purchased,schedule:{...schedule,rows:schedule.rows.map(r=>({...r}))},periodResult:periodSummary(state,`M${month}`),expenseThisMonth:month?schedule.rows[month-1].amount:0,exerciseCash:f.balances.cash-baseline.balances.cash,purchasePayment:baseline.balances.cash-f.balances.cash,exerciseProfit:f.profit-baseline.profit,unallocated:purchased?schedule.depreciable-f.balances.depreciationAccumulated:0,residualHeld:purchased?schedule.residual:0});};
 add('취득 직전 · T01–T02 뒤','출자·차입 뒤 현금650입니다. 이 발췌는 다음 설비 취득과 사용만 관찰합니다.',null,0,false);
 const buy={id:'E-buy',period:'M1',day:1,label:'관리용 설비 현금취득',rows:[d('equipment',schedule.cost),c('cash',schedule.cost)],cashFlow:'investing'};state=post(state,buy);add('M1 1일 · 설비 취득',`현금${schedule.cost}을 한 번 지급하고 같은 취득원가의 설비를 기록합니다. 감가상각은 아직 반영하지 않았습니다.`,buy,0,true);
 for(const row of schedule.rows){const event={id:`E-dep-${row.month}`,period:`M${row.month}`,day:30,label:`M${row.month} 감가상각`,rows:[d('depreciationExpense',row.amount),c('depreciationAccumulated',row.amount)]};state=post(state,event);add(`M${row.month} 말 · 사용 원가 배분`,row.month<schedule.availableMonth?'아직 사용 가능한 상태가 아니므로 이 달 상각은0입니다. 취득 때 낸 현금은 되돌아오지 않습니다.':row.used===schedule.lifeMonths&&row.amount===0?'상각대상을 모두 배분했습니다. 다음 달 비용을 더 만들거나 잔존가치를 자동 처분하지 않습니다.':`이 달 배분액${row.amount}을 비용과 누계액에 함께 기록합니다. 이 전표에는 현금이 없습니다.`,event,row.month,true);}
 return frames;
}
export const financingModes=Object.freeze(['capital','loan','settlement']);
export const financingLabels=Object.freeze({capital:'같은50 유입 · 소유주 출자',loan:'같은50 유입 · 은행 차입',settlement:'정본 월말 · 이자·원금·배당'});
export function financingFrames(mode='settlement'){
 if(!financingModes.includes(mode))throw new RangeError('자금 사건 조건을 확인하세요.');
 let state=createLedger();if(mode==='settlement')for(const e of companyEvents().slice(0,12))state=post(state,e);
 const baseline=snapshot(state),frames=[];
 const add=(event,route,title,detail,before)=>{const f=snapshot(state),cashDelta=f.balances.cash-before.balances.cash;frames.push({...f,index:frames.length,event,route,title,detail,mode,before:{...before,balances:{...before.balances}},flowAmount:Math.abs(cashDelta),flowDirection:cashDelta>0?'in':cashDelta<0?'out':'none',exerciseCash:f.balances.cash-baseline.balances.cash,impact:{cash:cashDelta,profit:f.profit-before.profit,loan:f.balances.loan-before.balances.loan,capital:f.balances.capital-before.balances.capital,retained:f.retainedEarnings-before.retainedEarnings}});};
 add(null,'none',mode==='settlement'?'T12 뒤 · 세 지급 직전':'M1 기초 · 같은50 유입 비교',mode==='settlement'?'공통 원장 T01–T12를 반영한 현금260·이익70에서 이어 갑니다. 앞선 비용·채권·재고를 삭제하지 않습니다.':'기초 현금500·차입200·납입자본300에서 출자50 또는 차입50만 비교합니다. 정본의 추가차입100과 다른 발췌입니다.',baseline);
 const selected=mode==='settlement'?companyEvents().slice(12).map((e,i)=>({e,route:['bank-interest','bank-principal','owner-dividend'][i],detail:['이자5는 당기 금융비용입니다. 현금과 이익이5 줄지만 차입 원금은 그대로입니다.','원금20 상환은 현금과 차입금을 함께 줄입니다. 비용을 다시 만들지 않습니다.','배당10은 소유주 분배입니다. 현금과 이익잉여금이 줄지만 당기 이익65는 그대로입니다.'][i]})):[{e:{id:`F-${mode}`,period:'M1',day:1,label:mode==='capital'?'소유주 출자50':'은행 차입50',rows:[d('cash',50),c(mode==='capital'?'capital':'loan',50)],cashFlow:'financing'},route:mode==='capital'?'owner-in':'bank-in',detail:mode==='capital'?'현금50과 납입자본50이 함께 늘었습니다. 상품을 판 것이 아니므로 매출·이익은0입니다.':'현금50과 상환 의무50이 함께 늘었습니다. 매출·이익은0이고 납입자본도 그대로입니다.'}];
 for(const {e,route,detail} of selected){const before=snapshot(state);state=post(state,e);add(e,route,e.label,detail,before);}return frames;
}

import {companyFrames,operatingBridge} from './company-case.mjs';
import {post,periodSummary,debit as d,credit as c,businessAccounts} from './business-ledger.mjs';
const definitions={base:['정본 · 회수160',{}], 'no-collection':['회수0 · 매출은 그대로',{collection:0}], 'full-collection':['회수400 · 매출은 그대로',{collection:400}], 'stock-credit':['추가20개 외상 매입',{purchaseQuantity:120}], 'stock-paid':['추가20개 매입·60 추가 지급',{purchaseQuantity:120,supplierPayment:270}], 'service-paid':['서비스대금60 전액 지급',{servicePayment:60}], 'long-life':['설비 사용48개월 가정',{lifeMonths:48}]};
export const reportScenarios=Object.freeze(Object.keys(definitions));
export const reportLabels=Object.freeze(Object.fromEntries(Object.entries(definitions).map(([k,v])=>[k,v[0]])));
const sum=rows=>rows.reduce((a,r)=>a+r.amount,0);
function bridge(items){let running=0;return items.map(item=>{const before=running;running+=item.amount;return{...item,before,after:running};});}
export function bridgeGeometry(row,min=-500,max=500){if(!Number.isFinite(min)||!Number.isFinite(max)||min>=max||![row.before,row.after,row.amount].every(Number.isFinite)||Math.abs(row.after-row.before-row.amount)>1e-9||Math.min(row.before,row.after)<min||Math.max(row.before,row.after)>max)throw new RangeError('다리의 값과 고정 눈금을 확인하세요.');const x=n=>(n-min)/(max-min);return{left:x(Math.min(row.before,row.after)),width:Math.abs(row.amount)/(max-min),start:x(row.before),end:x(row.after),zero:min<=0&&max>=0?x(0):null,direction:row.amount>0?'right':row.amount<0?'left':'none'};}
function parts(s){const b=s.balances;return{assets:[['cash','현금',b.cash],['receivable','매출채권',b.receivable],['inventory','재고',b.inventory],['prepaid','선급 서비스',b.prepaid],['netEquipment','순설비',s.netEquipment]],claims:[['loan','차입금',b.loan],['payable','매입채무',b.payable],['accrued','미지급비용',b.accrued],['contractLiability','선입금 의무',b.contractLiability],['capital','납입자본',b.capital],['retained','이익잉여금',s.retainedEarnings]]};}
export function reportModel(scenario='base'){
 if(!Object.hasOwn(definitions,scenario))throw new RangeError('정의한 보고 시나리오를 고르세요.');
 const frames=companyFrames(definitions[scenario][1]),opening=frames[0],closing=frames.at(-1),b=closing.balances;
 const income=bridge([{id:'revenue',label:'매출',amount:closing.revenue},{id:'cogs',label:'매출원가',amount:-b.cogs},{id:'service',label:'기간 서비스비용',amount:-b.serviceExpense},{id:'prepaid',label:'선급 서비스 사용',amount:-b.prepaidExpense},{id:'depreciation',label:'감가상각',amount:-b.depreciationExpense},{id:'interest',label:'이자비용',amount:-b.interestExpense}]);
 const equity=bridge([{id:'opening-equity',label:'M1 기초 자본',amount:opening.equity},{id:'capital-in',label:'소유주 출자',amount:b.capital-opening.balances.capital},{id:'profit',label:'M1 모형 이익',amount:closing.profit},{id:'dividends',label:'소유주 배당',amount:-b.dividends}]);
 const cash=bridge([{id:'opening-cash',label:'M1 기초 현금',amount:opening.balances.cash},{id:'financing',label:'재무 현금흐름',amount:closing.cashFlows.financing},{id:'investing',label:'투자 현금흐름',amount:closing.cashFlows.investing},{id:'operating',label:'영업 현금흐름',amount:closing.cashFlows.operating}]);
 const direct=closing.entries.filter(e=>e.cashFlow==='operating').map(e=>({id:e.id,label:e.label,amount:e.rows.filter(r=>r.account==='cash').reduce((n,r)=>n+(r.side==='debit'?r.amount:-r.amount),0)}));
 return{scenario,label:reportLabels[scenario],company:'작은책상',period:'M1',unit:'가상단위',opening,closing,openingParts:parts(opening),closingParts:parts(closing),income,equity,cash,direct,directTotal:sum(direct),sourceEntries:closing.entries.map(e=>({...e,rows:e.rows.map(r=>({...r,label:businessAccounts[r.account].label})),impact:{cash:frames[Number(e.id.slice(1))].balances.cash-frames[Number(e.id.slice(1))-1].balances.cash,profit:frames[Number(e.id.slice(1))].profit-frames[Number(e.id.slice(1))-1].profit,equity:frames[Number(e.id.slice(1))].equity-frames[Number(e.id.slice(1))-1].equity}})),reconciled:income.at(-1).after===closing.profit&&equity.at(-1).after===closing.equity&&cash.at(-1).after===b.cash&&sum(direct)===closing.cashFlows.operating};
}
export function statementFrames(scenario='base'){
 const r=reportModel(scenario),s=r.closing;
 return [
  ['position','시점의 두 잔액을 나란히',`M1 기초 자산${r.opening.assets}, 기말 자산${s.assets}입니다. 각각 같은 시점의 부채+자본과 맞춥니다. 기초와 기말을 더하지 않습니다.`],
  ['income','한 달의 매출에서 이익까지',`매출${s.revenue}에서 비용${s.expenses}를 빼면 모형 이익${s.profit}입니다. 세금을 생략했으며 현금 수입·지출 표가 아닙니다.`],
  ['equity','이익이 자본의 변화로 이어집니다',`기초 자본300 + 출자50 + M1 이익${s.profit} − 배당10 = 기말 자본${s.equity}. 이익잉여금${s.retainedEarnings}은 별도 통장 잔액이 아닙니다.`],
  ['cash','현금흐름이 현금 잔액을 잇습니다',`기초 현금500 + 영업${s.cashFlows.operating} + 투자${s.cashFlows.investing} + 재무${s.cashFlows.financing} = 기말 현금${s.balances.cash}. 현금 변화${s.cashChange}와 이익${s.profit}은 다릅니다.`],
 ].map(([kind,title,detail],index)=>({index,kind,title,detail,report:structuredClone(r)}));
}
const adjustmentText={profit:['모형 이익에서 시작','매출과 비용으로 계산한 이익입니다. 현금 잔액이나 현금 유입액이 아닙니다.'], 'operating-profit':['영업이익에서 시작','이자비용을 빼기 전이므로 지급이자 분류 조정을 또 더하지 않습니다.'],depreciation:['비현금 상각을 되돌림','이미 이익을 줄인 상각은 이번 달 현금 지급이 아닙니다. 더하는 것은 현금 창출이 아니라 이익의 비현금 차감 제거입니다.'],'interest-classification':['지급이자의 재무 분류 조정','이익에서는 비용5를 뺐지만 지급5는 이 책에서 재무 현금흐름입니다. 영업에서 빼지 않도록 되돌리며 재무 지급은 그대로 남습니다.'],receivable:['매출채권 증가를 차감','매출로 기록했지만 아직 받지 않은 부분입니다. 회수액만 바꾸면 매출은 같고 이 조정이 바뀝니다.'],inventory:['재고 증가를 차감','매입 중 아직 팔리지 않은 원가입니다. 외상 매입 의무 증가는 뒤의 매입채무 조정과 함께 읽습니다.'],prepaid:['선급 서비스 증가를 차감','먼저 지급한60 중 당기 비용20을 제외한40은 기말 자산입니다. 이익보다 현금이 먼저 나갔습니다.'],payable:['매입채무 증가를 가산','매입했지만 아직 지급하지 않은 부분입니다. 재고 증가와 서로 연결해 이중 차감을 피합니다.'],accrued:['미지급비용 증가를 가산','비용은 기록했지만 아직 지급하지 않은 부분입니다. 전액 지급하면 이 조정은0입니다.'],'contract-liability':['선입금 의무 증가 확인','이 정본에는 고객 선입금이 없어0입니다. 0 조정은 길이0으로 남고 현금을 만들지 않습니다.']};
export function profitCashFrames(scenario='base',basis='profit'){
 if(!['profit','operating'].includes(basis))throw new RangeError('이익 출발점을 확인하세요.');
 const r=reportModel(scenario);let items=operatingBridge(r.closing);
 if(basis==='operating')items=[{id:'operating-profit',amount:r.closing.operatingProfit},...items.slice(1).filter(i=>i.id!=='interest-classification')];
 const rows=bridge(items.map(i=>({id:i.id,amount:i.amount,label:adjustmentText[i.id][0],detail:adjustmentText[i.id][1]})));
 return rows.map((row,index)=>({index,basis,scenario,title:row.label,detail:row.detail,current:{...row},rows:rows.map((item,i)=>({...item,observed:i<=index,geometry:bridgeGeometry(item)})),report:structuredClone(r),result:row.after,complete:index===rows.length-1,reconciled:rows.at(-1).after===r.directTotal}));
}
export function scopeComparison(mode='same'){
 if(!['same','mixed'].includes(mode))throw new RangeError('비교 범위를 확인하세요.');const r=reportModel();if(mode==='same')return{mode,compatible:true,incomePeriod:'M1 전체',cashPeriod:'M1 전체',profit:r.closing.profit,cashFlow:r.closing.cashFlows.operating,reconciliation:r.closing.cashFlows.operating};
 let state=r.closing;for(const event of [{id:'M2-receipt',period:'M2',label:'M2 일부 회수240',rows:[d('cash',240),c('receivable',240)],cashFlow:'operating'},{id:'M2-payable',period:'M2',label:'M2 일부 매입대금90 지급',rows:[d('payable',90),c('cash',90)],cashFlow:'operating'},{id:'M2-accrued',period:'M2',label:'M2 일부 서비스대금20 지급',rows:[d('accrued',20),c('cash',20)],cashFlow:'operating'}])state=post(state,event);
 const partial=periodSummary(state,'M2');return{mode,compatible:false,incomePeriod:'M1 전체',cashPeriod:'M2 일부 회수·지급만',profit:r.closing.profit,cashFlow:partial.cashFlows.operating,partialProfit:partial.profit,endingCash:state.balances.cash,reconciliation:null};
}

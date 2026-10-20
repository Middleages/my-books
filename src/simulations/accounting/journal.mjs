// One posting engine for selected-account exercises and the full fictional case.
// Equality tolerance never authorizes an unfunded payment; UI controls use fixed units.
export const equationTolerance=1e-9;
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const copyEntries=entries=>entries.map(entry=>({...entry,rows:entry.rows.map(row=>({...row}))}));
const flowKinds=['operating','investing','financing','unclassified'];
export function createJournalEngine(accounts,defaultOpening){
 const keys=Object.keys(accounts),change=row=>(accounts[row.account].normal===row.side?1:-1)*row.amount;
 const totalKind=(balances,kind)=>keys.filter(key=>accounts[key].kind===kind).reduce((sum,key)=>sum+balances[key]*(accounts[key].contra?-1:1),0);
 function cashFlows(entries){const result=Object.fromEntries(flowKinds.map(kind=>[kind,0]));for(const entry of entries)result[entry.cashFlow??'unclassified']+=entry.rows.filter(row=>row.account==='cash').reduce((sum,row)=>sum+change(row),0);return result;}
 function snapshot(state){
  const balances={...state.balances},revenue=totalKind(balances,'revenue'),expenses=totalKind(balances,'expense'),profit=revenue-expenses;
  const assets=totalKind(balances,'asset'),liabilities=totalKind(balances,'liability'),equity=totalKind(balances,'equity')+profit-totalKind(balances,'distribution');
  return{balances,assets,liabilities,equity,revenue,expenses,profit,balanced:Math.abs(assets-liabilities-equity)<equationTolerance,cashChange:balances.cash-state.openingCash,openingCash:state.openingCash,openingBalances:{...state.openingBalances},cashFlows:cashFlows(state.entries),entries:copyEntries(state.entries),appliedIds:[...state.appliedIds]};
 }
 function createLedger(opening=defaultOpening){
  if(!opening||typeof opening!=='object'||Array.isArray(opening)||Object.keys(opening).some(key=>!Object.hasOwn(accounts,key)))throw new RangeError('정의한 계정만 사용할 수 있습니다.');
  const balances=Object.fromEntries(keys.map(key=>[key,opening[key]??0]));
  if(Object.values(balances).some(value=>!finite(value)))throw new RangeError('잔액은 유한한 숫자여야 합니다.');
  if(keys.some(key=>accounts[key].kind!=='equity'&&balances[key]<0))throw new RangeError('이 모형의 자산·의무·기간 계정은 음수가 될 수 없습니다.');
  const state={balances,openingCash:balances.cash,openingBalances:{...balances},entries:[],appliedIds:[]};
  if(!snapshot(state).balanced)throw new RangeError('기초 자산과 부채·자본이 맞아야 합니다.');return state;
 }
 function post(state,event){
  if(!event||typeof event.id!=='string'||!event.id||!Array.isArray(event.rows)||event.rows.length<2)throw new TypeError('사건 ID와 두 줄 이상의 기록이 필요합니다.');
  if(state.appliedIds.includes(event.id))throw new RangeError('같은 사건을 다시 반영할 수 없습니다.');
  if(event.cashFlow!==undefined&&!flowKinds.includes(event.cashFlow))throw new RangeError('현금흐름 분류를 확인하세요.');
  const rows=event.rows.map(row=>({...row}));
  for(const row of rows)if(typeof row.account!=='string'||!Object.hasOwn(accounts,row.account)||!['debit','credit'].includes(row.side)||!finite(row.amount)||row.amount<0)throw new RangeError('계정·차변/대변·비음수 금액을 확인하세요.');
  const total=side=>rows.filter(row=>row.side===side).reduce((sum,row)=>sum+row.amount,0);
  if(Math.abs(total('debit')-total('credit'))>=equationTolerance)throw new RangeError('차변과 대변 합계가 다릅니다.');
  const next={balances:{...state.balances},openingCash:state.openingCash,openingBalances:{...state.openingBalances},entries:[...copyEntries(state.entries),{...event,rows}],appliedIds:[...state.appliedIds,event.id]};
  for(const row of rows)next.balances[row.account]+=change(row);
  if(next.balances.cash<0)throw new RangeError('현금 부족: 지급은 실행하지 않았습니다.');
  if(keys.some(key=>accounts[key].kind!=='equity'&&next.balances[key]<0))throw new RangeError('보유한 자산·의무·기간 잔액보다 많이 없앨 수 없습니다.');
  if(Object.values(next.balances).some(value=>!finite(value))||!snapshot(next).balanced)throw new RangeError('장부 관계가 맞지 않습니다.');return next;
 }
 function periodSummary(state,period){
  const entries=state.entries.filter(entry=>entry.period===period),movements=Object.fromEntries(keys.map(key=>[key,0]));
  for(const entry of entries)for(const row of entry.rows)movements[row.account]+=change(row);
  const revenue=totalKind(movements,'revenue'),expenses=totalKind(movements,'expense');
  return{period,revenue,expenses,profit:revenue-expenses,cashChange:movements.cash,cashFlows:cashFlows(entries),movements,entryIds:entries.map(entry=>entry.id)};
 }
 return{accounts,createLedger,post,snapshot,periodSummary};
}

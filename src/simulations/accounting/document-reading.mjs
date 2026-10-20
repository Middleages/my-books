import {companyEvents,companyFrames,operatingBridge} from './company-case.mjs';
import {createLedger,post,snapshot,periodSummary,debit as d,credit as c} from './business-ledger.mjs';

export const packetKeys=Object.freeze(['base','next-month','missing-cost','capital-revenue','mixed']);
export const packetLabels=Object.freeze({base:'정상 정본 · 그래도 확인 범위는 제한', 'next-month':'기존 매출대금은 다음 달 회수', 'missing-cost':'의도적 오류 · 판매 원가 누락', 'capital-revenue':'의도적 오류 · 출자를 매출로', mixed:'범위 반례 · 다른 회사의 M2 자료'});
export const claimKeys=Object.freeze(['revenue','cost','cash-period','capital','connection','dividend']);
export const claimLabels=Object.freeze({revenue:'매출과 인도 자료가 맞는가',cost:'남은 재고와 판매 원가가 맞는가','cash-period':'입금은 어느 기간의 현금인가',capital:'소유주 출자는 수익이 아닌가',connection:'등식과 현금 연결이 맞는가',dividend:'현금 잔액만으로 배당 가능할까'});
const required={revenue:['scope','delivery','statements'],cost:['scope','inventory','delivery','statements'],'cash-period':['scope','bank','statements'],capital:['scope','funding','statements'],connection:['scope','statements','bank'],dividend:['scope','bank','funding','legal']};
const row=(label,value)=>({label,value});
function cashAmount(event){return event.rows.filter(r=>r.account==='cash').reduce((n,r)=>n+(r.side==='debit'?r.amount:-r.amount),0);}
function amount(event,account,side){return event.rows.filter(r=>r.account===account&&(!side||r.side===side)).reduce((n,r)=>n+r.amount,0);}
export function documentPacket(key='base'){
 if(!packetKeys.includes(key))throw new RangeError('정의한 가상 문서 묶음을 고르세요.');
 const options=key==='next-month'?{collection:0}:{},original=companyEvents(options),facts=companyFrames(options).at(-1);
 const events=structuredClone(original);
 if(key==='missing-cost')events.find(e=>e.id==='T06').rows=events.find(e=>e.id==='T06').rows.filter(r=>!['cogs','inventory'].includes(r.account));
 if(key==='capital-revenue'){const e=events.find(e=>e.id==='T01');e.rows=[d('cash',50),c('revenue',50)];e.cashFlow='operating';e.label='의도적 오분류: 출자50을 매출로 기록';}
 let state=createLedger();for(const event of events)state=post(state,event);const closing=snapshot(state);
 const get=id=>original.find(e=>e.id===id),sale=amount(get('T06'),'revenue'),purchases=amount(get('T05'),'inventory'),cost=amount(get('T06'),'cogs'),unitCost=3,unitPrice=5;
 const nextReceipt=key==='next-month'?{id:'M2-receipt',period:'M2',day:5,label:'M1 외상대금400 회수만 추가한 M2 일부 기록',rows:[d('cash',sale),c('receivable',sale)],cashFlow:'operating'}:null;
 const afterReceipt=nextReceipt?snapshot(post(closing,nextReceipt)):null,partial=afterReceipt?periodSummary(afterReceipt,'M2'):null;
 const cashRows=original.filter(e=>e.rows.some(r=>r.account==='cash')).map(e=>({id:e.id,period:e.period,day:e.day,amount:cashAmount(e),classification:e.cashFlow,label:e.label}));
 if(nextReceipt)cashRows.push({id:nextReceipt.id,period:'M2',day:5,amount:cashAmount(nextReceipt),classification:'operating',label:nextReceipt.label});
 const canonicalScope={company:'작은책상',period:'M1',unit:'가상단위',boundary:'단일 회사'};
 const receivedScope=key==='mixed'?{company:'다른가게',period:'M2 일부',unit:'다른 가상단위',boundary:'연결 범위 미확인'}:{...canonicalScope};
 const documents=[
  {id:'scope',title:'D1 · 표지와 보고 범위',kind:'observed',available:true,rows:[row('기준 회사·기간·단위·범위',Object.values(canonicalScope).join(' / ')),row('대조 자료의 범위',Object.values(receivedScope).join(' / '))]},
  {id:'delivery',title:'D2 · 주문·인도 확인',kind:'observed',available:true,rows:[row('인도',`M1 ${get('T06').day}일 · ${sale/unitPrice}개 × ${unitPrice} = ${sale}`),row('인식 가정','단일 상품 통제가 인도 때 이전, 계약·회수 가능성 요건 충족 가정'),row('인도 자료 금액',sale)]},
  {id:'inventory',title:'D3 · 매입과 재고 수불',kind:'observed',available:true,rows:[row('매입',`${purchases/unitCost}개 × ${unitCost} = ${purchases}`),row('인도 수량',cost/unitCost),row('남은 수량',(purchases-cost)/unitCost),row('정해진 단가로 계산한 판매 원가',cost),row('정해진 단가로 계산한 남은 원가',purchases-cost)]},
  {id:'bank',title:'D4 · 날짜가 있는 입출금',kind:'observed',available:true,rows:cashRows.map(e=>row(`${e.id} · ${e.period} ${e.day}일 · ${e.label}`,e.amount))},
  {id:'equipment',title:'D5 · 설비·상각 주석',kind:'assumption',available:true,rows:[row('취득 지급',amount(get('T03'),'equipment')),row('월 상각',amount(get('T12'),'depreciationExpense')),row('사용기간·잔존가치','24개월·0, M1 초 사용 가능이라는 교육 가정'),row('M1 순설비',facts.netEquipment)]},
  {id:'funding',title:'D6 · 출자와 차입 조건',kind:'observed',available:true,rows:[row('소유주 추가 출자',amount(get('T01'),'capital')),row('기초 납입자본',facts.openingBalances.capital),row('기말 차입 원금',facts.balances.loan),row('만기 가정','원금280 중40이 보고일 뒤12개월 안,240은 이후. 분류 요건 충족 가정'),row('출자 계약의 성격','상품 판매 대금이 아니라 소유주의 납입') ]},
  {id:'statements',title:'D7 · 이 묶음의 보고서 요약',kind:'calculated',available:true,rows:[row('M1 매출',closing.revenue),row('M1 매출원가',closing.balances.cogs),row('M1 모형 이익',closing.profit),row('M1 말 재고',closing.balances.inventory),row('M1 말 현금',closing.balances.cash),row('M1 말 납입자본',closing.balances.capital),row('자산 / 부채 / 자본',`${closing.assets} / ${closing.liabilities} / ${closing.equity}`),row('영업 / 투자 / 재무 현금',`${closing.cashFlows.operating} / ${closing.cashFlows.investing} / ${closing.cashFlows.financing}`)]},
  {id:'legal',title:'D8 · 법적 배당 근거',kind:'unverified',available:false,rows:[row('제공 여부','제공하지 않음'),row('정본 처리','배당10의 적법한 절차 완료는 원장 작성의 명시한 가정일 뿐 이 자료로 증명하지 않음'),row('더 확인할 것','적용 법률·배당 재원·결의·약정·지급 여력 등 실제 근거')]},
 ];
 const expected={revenue:sale,cost,inventory:purchases-cost,capital:facts.balances.capital,receipt:cashAmount(get('T07')),operating:facts.cashFlows.operating};
 const bridge=operatingBridge(closing),direct=closing.entries.filter(e=>e.cashFlow==='operating').reduce((n,e)=>n+cashAmount(e),0);
 return {key,label:packetLabels[key],intentionalError:['missing-cost','capital-revenue'].includes(key),scopeMismatch:key==='mixed',canonicalScope,receivedScope,closing,facts,documents,cashRows,expected,bridge,direct,balanced:closing.balanced,bridgeMatches:bridge.at(-1).after===direct,cashMatches:closing.openingCash+closing.cashFlows.operating+closing.cashFlows.investing+closing.cashFlows.financing===closing.balances.cash,nextPeriod:partial?{period:'M2 일부 회수만',profit:partial.profit,cashFlow:partial.cashFlows.operating,cash:afterReceipt.balances.cash}:null};
}
export function claimEvidence(packetKey='base',claim='cost',opened=[]){
 if(!claimKeys.includes(claim)||!Array.isArray(opened))throw new RangeError('주장과 열린 문서를 확인하세요.');
 const packet=documentPacket(packetKey),ids=required[claim];
 if(opened.some(id=>!packet.documents.some(d=>d.id===id)))throw new RangeError('존재하는 문서만 열 수 있습니다.');
 const seen=new Set(opened),allRead=ids.every(id=>seen.has(id)),scopeRead=seen.has('scope'),s=packet.closing,e=packet.expected;
 const checks=claim==='revenue'?[row('인도 자료의 매출',e.revenue),row('보고서의 매출',s.revenue)]:claim==='cost'?[row('수불 자료의 판매 원가',e.cost),row('보고서의 매출원가',s.balances.cogs),row('수불 자료의 남은 원가',e.inventory),row('보고서의 남은 재고',s.balances.inventory)]:claim==='capital'?[row('출자 근거의 기말 납입자본',e.capital),row('보고서의 납입자본',s.balances.capital)]:claim==='cash-period'?[row('날짜를 맞춘 M1 고객 회수',e.receipt),row('M1 보고서의 영업 현금',s.cashFlows.operating),...(packet.nextPeriod?[row('M2 일부 고객 회수',packet.nextPeriod.cashFlow),row('M2 일부 기록의 새 이익',packet.nextPeriod.profit)]:[])]:claim==='connection'?[row('자산',s.assets),row('부채+자본',s.liabilities+s.equity),row('직접 영업 현금',packet.direct),row('간접 조정 끝',packet.bridge.at(-1).after),row('기말 현금',s.balances.cash)]:[row('기말 현금',s.balances.cash),row('배당 법적 근거','미제공')];
 let matches=claim==='revenue'?e.revenue===s.revenue:claim==='cost'?e.cost===s.balances.cogs&&e.inventory===s.balances.inventory:claim==='capital'?e.capital===s.balances.capital:claim==='cash-period'?e.operating===s.cashFlows.operating:claim==='connection'?packet.balanced&&packet.bridgeMatches&&packet.cashMatches:false;
 let status=!allRead?'unread':claim==='dividend'?'insufficient':matches?'matches':'contradiction';
 if(scopeRead&&packet.scopeMismatch)status='scope-mismatch';
 const detail=status==='unread'?'관련 자료를 아직 모두 열지 않았습니다. 숫자를 맞춘 결과를 미리 정답으로 채우지 않습니다.':status==='scope-mismatch'?'회사·기간·단위·범위가 달라 대조 계산을 멈춥니다. 먼저 같은 범위의 자료를 구해야 합니다.':status==='insufficient'?'현금과 출자 자료가 있어도 법적 배당 가능성을 결정할 근거는 없습니다. 정본의 가정은 확인된 증거가 아닙니다.':status==='contradiction'?'제공한 가상 자료와 이 보고서의 금액/분류가 충돌합니다. 이 묶음의 의도적 오류를 찾은 것이며 실제 회사의 사기 판정이 아닙니다.':claim==='connection'?'이 묶음의 등식과 현금 연결은 맞습니다. 원가 누락이나 출자 오분류도 이 검사를 통과하므로 거래의 완전성·의미 정확성을 증명하지는 못합니다.':claim==='cash-period'&&packet.nextPeriod?'M1 회수는0이고400은 M2 일부 회수입니다. M2 입금을 M1에 추가하지 않습니다. M2 새 이익0은 이 회수만의 값이지 M2 전체 결산이 아닙니다.':'이 주장에 필요한 제공 자료와 계산이 일치합니다. 실제 계약 요건·문서 진위·회수 가능성 등 자료 밖의 사실까지 확인한 것은 아닙니다.';
 return {packet,claim,label:claimLabels[claim],required:ids,opened:[...seen],status,allRead,checks:allRead&&!packet.scopeMismatch?checks:[],matches:allRead&&!packet.scopeMismatch&&claim!=='dividend'?matches:null,detail,links:ids.map(id=>({id,opened:seen.has(id),available:packet.documents.find(d=>d.id===id).available,document:packet.documents.find(d=>d.id===id)}))};
}
export function evidenceFrames(packetKey='base',claim='cost'){
 if(!claimKeys.includes(claim))throw new RangeError('정의한 주장을 고르세요.');
 return Array.from({length:required[claim].length+1},(_,index)=>({index,...claimEvidence(packetKey,claim,required[claim].slice(0,index))}));
}

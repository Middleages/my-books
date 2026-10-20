import {createLedger,post,snapshot,periodSummary,debit as d,credit as c} from './business-ledger.mjs';
import {companyEvents} from './company-case.mjs';
export const revenueModes=Object.freeze(['credit','advance','next-period']);
export const revenueLabels=Object.freeze({credit:'인도 뒤 일부 회수',advance:'인도 전에 전액 입금', 'next-period':'다음 달에 전액 회수'});
function claimSegments(mode,day){
 const parts=mode==='advance'?[]:mode==='credit'?[{id:'collected-part',amount:160,endDay:15},{id:'outstanding-part',amount:240,endDay:null}]:[{id:'whole-receivable',amount:400,endDay:35}];let offsetAmount=0;return parts.map(p=>{const result={...p,offsetAmount,startDay:10,displayEndDay:p.endDay??40,observedEndDay:Math.max(10,Math.min(day,p.endDay??day)),settled:p.endDay!==null&&day>=p.endDay};offsetAmount+=p.amount;return result;});
}
const prefix=count=>companyEvents().slice(0,count).reduce((state,event)=>post(state,event),createLedger());
function frame(state,baseline,metadata){const s=snapshot(state);return{...s,...metadata,periodResult:periodSummary(state,metadata.period),exerciseCash:s.balances.cash-baseline.balances.cash,exerciseExpenses:s.expenses-baseline.expenses};}
export function revenueFrames({mode='credit'}={}){
 if(!revenueModes.includes(mode))throw new RangeError('판매 시나리오를 확인하세요.');
 let state=prefix(5);const baseline=snapshot(state),frames=[],receiptDay=mode==='advance'?5:mode==='credit'?15:35,receiptAmount=mode==='credit'?160:400;
 const add=(title,detail,day,period,event=null)=>{if(event)state=post(state,event);frames.push(frame(state,baseline,{index:frames.length,title,detail,elapsedDay:day,period,event,mode,transferred:state.appliedIds.some(id=>['T06','R-delivery-advance'].includes(id)),soldQuantity:80,timeline:{duration:40,deliveryDay:10,receiptDay,receiptAmount,claimSegments:claimSegments(mode,day),obligationSegment:mode==='advance'?{amount:400,startDay:5,endDay:10,observedEndDay:Math.max(5,Math.min(day,10)),recognized:state.appliedIds.includes('R-advance'),settled:state.appliedIds.includes('R-delivery-advance')}:null},receiptTotal:snapshot(state).balances.cash-baseline.balances.cash}));};
 add('M1 · 판매 계약 전','T01–T05 뒤의 같은 장부입니다. 현금350·재고300을 포함해 자산950=부채600+자본350입니다. 아직 매출은 없습니다.',3,'M1');
 add('주문과 계약 · 아직 인도 전','회수 가능성 등 계약 요건을 충족한 단일 상품 계약이라고 가정합니다. 주문만 받았다고 상품 통제를 넘긴 것은 아닙니다.',5,'M1');
 add(mode==='advance'?'먼저 받은400 · 아직 매출 아님':'아직 입금도 인도도 없음',mode==='advance'?'현금400과 고객에게 상품을 넘겨야 할 계약부채400이 함께 생깁니다. 매출과 이익은0입니다.':'계약만으로 현금·매출채권·매출을 늘리지 않습니다. 이 예의 받을 권리는 인도 때 무조건적 권리가 됩니다.',5,'M1',mode==='advance'?{id:'R-advance',period:'M1',day:5,label:'상품 인도 전 고객 선입금400',cashFlow:'operating',rows:[d('cash',400),c('contractLiability',400)]}:null);
 const delivery=mode==='advance'?{id:'R-delivery-advance',period:'M1',day:10,label:'상품 통제 이전 및 계약부채 해소',rows:[d('contractLiability',400),c('revenue',400),d('cogs',240),c('inventory',240)]}:companyEvents()[5];
 add('인도 · 통제 이전','같은80개를 개당5에 인도합니다. 매출400과 팔린 상품의 원가240을 한 사건에 함께 기록합니다. 이 발췌의 이익은160입니다.',10,'M1',delivery);
 const late=mode==='next-period',amount=late?400:160;
 add(mode==='advance'?'이미 받은 대금 · 추가 기록 없음':late?'M2 · 기존 외상대금400 회수':'M1 · 기존 외상대금160 회수',mode==='advance'?'현금은 인도 전에 이미 받았습니다. 매출은 인도 때 한 번만 기록합니다.':late?'현금400이 늘고 매출채권400이 없어집니다. M2의 이 발췌 매출·이익은0이며 M1에 기록한 매출400을 다시 세지 않습니다.':'현금160이 늘고 매출채권은400에서240으로 줄어듭니다. 회수 시 새 매출과 새 이익은0입니다.',late?35:15,late?'M2':'M1',mode==='advance'?null:{id:late?'R-collect-M2':'T07',period:late?'M2':'M1',day:late?5:15,label:`기존 외상대금${amount} 회수`,cashFlow:'operating',rows:[d('cash',amount),c('receivable',amount)]});
 return frames;
}
export function expenseFrames({payment=40}={}){
 if(![0,40,60].includes(payment))throw new RangeError('서비스 지급 금액을 확인하세요.');
 let state=prefix(3);const baseline=snapshot(state),frames=[];
 const add=(title,detail,period,event=null,monthsUsed=0)=>{if(event)state=post(state,event);frames.push(frame(state,baseline,{index:frames.length,title,detail,period,event,monthsUsed,payment,prepaidSegments:[1,2,3].map(month=>({month,amount:20,recognized:state.appliedIds.includes('T04'),used:month<=monthsUsed})),serviceReceived:snapshot(state).balances.serviceExpense,servicePaid:payment&&(state.appliedIds.includes('T10'))?payment:0}));};
 add('T01–T03 뒤 · 비용 발췌 시작','현금410·설비240에서 시작합니다. 아래에서는 T04·T09–T11과 선급 서비스의 다음 달 사용만 골라 기록합니다. 판매·재고·감가상각 등은 제외한 발췌이지 M1 전체 결산이 아닙니다.','M1');
 add('T04 · 서비스 세 달치60 선지급','M1–M3에 균등하게 제공받을 권리60입니다. 지금 현금60을 냈지만 아직 사용 전이므로 이 시점의 비용은0입니다.','M1',companyEvents()[3]);
 add('T09 · 별도 당기 서비스60 제공받음','판매·관리에 쓰인 별도 서비스를 전부 제공받았습니다. 아직 돈을 안 냈어도 비용60과 지급할 의무60을 기록합니다.','M1',companyEvents()[8]);
 add(`T10 · 서비스 대금${payment} 지급`,'기록해 둔 의무를 현금으로 갚는 단계입니다. 지급액을 바꿔도 이미 제공받은 서비스 비용60은 바뀌지 않습니다.','M1',{...companyEvents()[9],label:`서비스 대금${payment} 지급`,rows:[d('accrued',payment),c('cash',payment)]});
 add('T11 · M1 말 선급 서비스20 사용','세 달의 권리 중 한 달분20이 비용이 됩니다. 기본 지급40에서 발췌 비용80, 현금 지급100, 선급 권리40, 미지급 의무20입니다.','M1',companyEvents()[10],1);
 for(const month of [2,3])add(`M${month} · 다음 한 달분20 사용`,'다음 달 서비스 사용만 이어 본 부분 사례입니다. 다른 판매·비용·현금거래를 모두0이라고 가정한 실제 월 결산이 아닙니다. 이 달 새 비용은20, 이 사용 사건의 현금 변화는0입니다.',`M${month}`,{id:`P-use-M${month}`,period:`M${month}`,day:30,label:`M${month} 선급 서비스 사용20`,rows:[d('prepaidExpense',20),c('prepaid',20)]},month);
 return frames;
}

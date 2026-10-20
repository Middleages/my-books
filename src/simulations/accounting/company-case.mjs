import {createLedger,post,snapshot,debit as d,credit as c} from './business-ledger.mjs';
// Canonical fictional M1, not a professional filing. Paid interest/dividends are financing.
export function companyEvents({collection=160,purchaseQuantity=100,supplierPayment=210,servicePayment=40,lifeMonths=24}={}){
 for(const [value,allowed,name] of [[collection,[0,160,400],'회수'],[purchaseQuantity,[100,120],'매입수량'],[supplierPayment,[210,270],'매입 지급'],[servicePayment,[40,60],'서비스 지급'],[lifeMonths,[24,48],'사용 개월']])if(!allowed.includes(value))throw new RangeError(`${name} 조건을 확인하세요.`);
 const event=(id,day,label,rows,cashFlow)=>({id,period:'M1',day,label,rows,...(cashFlow?{cashFlow}:{})});
 return[
  event('T01',1,'추가 출자50',[d('cash',50),c('capital',50)],'financing'),
  event('T02',1,'차입100',[d('cash',100),c('loan',100)],'financing'),
  event('T03',1,'판매·관리 설비 현금취득240',[d('equipment',240),c('cash',240)],'investing'),
  event('T04',1,'M1–M3 서비스 선지급60',[d('prepaid',60),c('cash',60)],'operating'),
  event('T05',3,`상품${purchaseQuantity}개 외상 매입`,[d('inventory',purchaseQuantity*3),c('payable',purchaseQuantity*3)]),
  event('T06',10,'80개 인도와 매출·원가 동시 인식',[d('receivable',400),c('revenue',400),d('cogs',240),c('inventory',240)]),
  event('T07',15,`기존 외상대금${collection} 회수`,[d('cash',collection),c('receivable',collection)],'operating'),
  event('T08',20,`매입대금${supplierPayment} 지급`,[d('payable',supplierPayment),c('cash',supplierPayment)],'operating'),
  event('T09',25,'당기 제공받은 서비스60 인식',[d('serviceExpense',60),c('accrued',60)]),
  event('T10',26,`미지급 서비스대금${servicePayment} 지급`,[d('accrued',servicePayment),c('cash',servicePayment)],'operating'),
  event('T11',30,'선급 서비스의 M1 사용분20',[d('prepaidExpense',20),c('prepaid',20)]),
  event('T12',30,'설비 M1 정액 감가상각',[d('depreciationExpense',240/lifeMonths),c('depreciationAccumulated',240/lifeMonths)]),
  event('T13',30,'계약상 당기이자5 인식·지급',[d('interestExpense',5),c('cash',5)],'financing'),
  event('T14',30,'차입 원금20 상환',[d('loan',20),c('cash',20)],'financing'),
  event('T15',30,'배당10 지급',[d('dividends',10),c('cash',10)],'financing'),
 ];
}
export function companyFrames(options={}){
 let state=createLedger();const frames=[{index:0,event:null,title:'M1 기초',...snapshot(state)}];
 for(const event of companyEvents(options)){state=post(state,event);frames.push({index:frames.length,event,title:event.label,...snapshot(state)});}return frames;
}
export function operatingBridge(frame){const b=frame.balances,o=frame.openingBalances;const items=[{id:'profit',amount:frame.profit},{id:'depreciation',amount:b.depreciationExpense},{id:'interest-classification',amount:b.interestExpense},{id:'receivable',amount:-(b.receivable-o.receivable)},{id:'inventory',amount:-(b.inventory-o.inventory)},{id:'prepaid',amount:-(b.prepaid-o.prepaid)},{id:'payable',amount:b.payable-o.payable},{id:'accrued',amount:b.accrued-o.accrued},{id:'contract-liability',amount:b.contractLiability-o.contractLiability}];let running=0;return items.map(item=>{const before=running;running+=item.amount;return{...item,before,after:running};});}

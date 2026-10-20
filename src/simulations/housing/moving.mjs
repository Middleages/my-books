import {mortgagePaths} from './ongoing.mjs';
const whole=(n,k,max=1e9)=>{if(!Number.isSafeInteger(n)||n<0||n>max)throw new RangeError(k)};
export const movingDefaults={cash:10e6,oldDeposit:100e6,newDeposit:90e6,receipt:100e6,receiptDay:30,dueDay:20,order:'receipt-first',confirmed:true};
// Evidence ledger, not a legal termination/priority model. An unconfirmed receipt never becomes cash.
export function movingFrames(input={}){
 const p={...movingDefaults,...input};for(const k of ['cash','oldDeposit','newDeposit','receipt'])whole(p[k],k);for(const k of ['receiptDay','dueDay'])whole(p[k],k,45);
 if(p.receipt>p.oldDeposit||!['receipt-first','payment-first'].includes(p.order)||typeof p.confirmed!=='boolean')throw new RangeError('receipt/order');
 let cash=p.cash,oldClaim=p.oldDeposit,newClaim=0,received=0,paid=0,decision=null;
 const events=[{kind:'receipt',day:p.receiptDay},{kind:'due',day:p.dueDay}].sort((a,b)=>a.day-b.day||(a.kind===(p.order==='receipt-first'?'receipt':'due')?-1:1));
 const frames=[];const record=(day,event,arrival=0,payment=0)=>frames.push({...p,step:frames.length,day,event,arrival,payment,cash,oldClaim,newClaim,received,paid,decision,total:cash+oldClaim+newClaim});
 record(0,'start');
 for(const e of events){let arrival=0,payment=0;
  if(e.kind==='receipt'&&p.confirmed){arrival=p.receipt;received+=arrival;cash+=arrival;oldClaim-=arrival}
  if(e.kind==='due'){
   const possiblyBeforeDue=p.receiptDay<p.dueDay||(p.receiptDay===p.dueDay&&p.order==='receipt-first');
   const potential=!p.confirmed&&possiblyBeforeDue?p.receipt:0;
   const knownGap=Math.max(0,p.newDeposit-cash),minimumGap=Math.max(0,p.newDeposit-cash-potential);
   const status=p.newDeposit===0?'no-payment':knownGap===0?'paid':potential>0?(minimumGap>0?'minimum-shortage':'arrival-unknown'):'shortage';
   decision={status,day:e.day,beforeCash:cash,knownGap,minimumGap,exactGap:potential>0&&knownGap>0?null:knownGap,potential};
   if(status==='paid'){payment=p.newDeposit;paid+=payment;cash-=payment;newClaim+=payment}
  }
  record(e.day,e.kind,arrival,payment);
 }
 record(45,'observe');return frames;
}
export const movingPresets={late:{},early:{receiptDay:15},before:{receiptDay:20},after:{receiptDay:20,order:'payment-first'},partial:{receipt:80e6,receiptDay:15},oneWon:{receipt:79999999,receiptDay:15},unknown:{receiptDay:20,confirmed:false},unknownAfter:{receiptDay:20,confirmed:false,order:'payment-first'},unknownShort:{receiptDay:20,receipt:70e6,confirmed:false}};
export const shockDefaults={mode:'joint',cash:2e6,funding:1200000,service:100000,repair:3e6};
// Three contractual months after the existing month12 closing balance. No prepayment or fee.
export function shockFrames(input={}){
 const p={...shockDefaults,...input};if(!['baseline','rate','income','repair','joint'].includes(p.mode))throw new RangeError('mode');for(const k of ['cash','funding','service','repair'])whole(p[k],k);
 const paths=mortgagePaths(),rows=paths.paths[p.mode==='rate'||p.mode==='joint'?'reset':'fixed'].rows;
 const openingDebt=rows[12].closing;let cash=p.cash,debt=openingDebt,funding=0,paidInterest=0,paidService=0,paidRepair=0,paidPrincipal=0,failure=null;
 const frames=[];const record=(month,incoming=0,planned=null,paid=false)=>frames.push({...p,month,step:frames.length,openingDebt,cash,debt,funding,paidInterest,paidService,paidRepair,paidPrincipal,failure,incoming,planned,paid,net:cash-debt});
 record(12);
 for(let month=13;month<=15;month++){
  const r=rows[month],repair=(p.mode==='repair'||p.mode==='joint')&&month===14?p.repair:0;
  const planned={principal:r.regularPrincipal,interest:r.interest,service:p.service,repair,total:r.regularPayment+p.service+repair,closing:r.closing,rate:r.rate};
  let incoming=0,paid=false;
  if(!failure){incoming=(p.mode==='income'||p.mode==='joint')&&month>=14?0:p.funding;cash+=incoming;funding+=incoming;
   if(cash+1e-6<planned.total)failure={month,gap:planned.total-cash};
   else{cash-=planned.total;if(Math.abs(cash)<1e-6)cash=0;debt=r.closing;paidPrincipal+=r.regularPrincipal;paidInterest+=r.interest;paidService+=p.service;paidRepair+=repair;paid=true}
  }
  record(month,incoming,planned,paid);
 }
 return frames;
}
export function housingEquity({home=200e6,debt=80e6,change=-.2}={}){
 whole(home,'home');whole(debt,'debt');if(!Number.isFinite(change)||change< -1||change>1)throw new RangeError('change');
 const initial=home-debt,currentHome=home*(1+change),current=currentHome-debt;
 return {home,debt,change,initial,currentHome,current,delta:current-initial,equityRate:initial>0?(current-initial)/initial:null};
}

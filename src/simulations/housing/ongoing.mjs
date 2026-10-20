import { projectRepayment } from '../money/repayment.mjs';
const nonnegative = (n, name, max=1e9) => {
  if (!Number.isFinite(n) || n < 0 || n > max) throw new RangeError(name);
};
const integer = (n, name, min, max) => {
  if (!Number.isInteger(n) || n < min || n > max) throw new RangeError(name);
};

export const mortgagePathDefaults = { principal:80e6, annualRate:4, resetRate:7, months:240, prepayment:0, feeRate:1 };
// Planned payments under ONE fictional contract, not an approval or actual-payment ledger.
// Month12 regular payment -> extra principal -> cash fee; reprice the remaining term at13.
export function mortgagePaths(input={}) {
  const p={...mortgagePathDefaults,...input};
  nonnegative(p.resetRate,'resetRate',30);
  nonnegative(p.prepayment,'prepayment',100e6);
  nonnegative(p.feeRate,'feeRate',5);
  const original=projectRepayment({principal:p.principal,annualRate:p.annualRate,months:p.months});
  const paths={};
  for(const mode of ['fixed','reset']) {
    let schedule=original.paths.annuity.rows, segmentStart=1, balance=p.principal;
    let cumulativePrincipal=0,cumulativeInterest=0,cumulativeFees=0,rate=p.annualRate;
    const rows=[{month:0,rate,opening:balance,regularPrincipal:0,interest:0,regularPayment:0,afterRegular:balance,extra:0,fee:0,totalPayment:0,closing:balance,cumulativePrincipal:0,cumulativeInterest:0,cumulativeFees:0,cumulativePayment:0,repriced:false}];
    for(let month=1;month<=p.months;month++) {
      const repriced=month===13 && balance>0 && (mode==='reset'||rows.at(-1).extra>0);
      if(month===13 && (mode==='reset'||rows.at(-1).extra>0)) {
        rate=mode==='reset'?p.resetRate:p.annualRate;
        schedule=projectRepayment({principal:balance,annualRate:rate,months:p.months-month+1}).paths.annuity.rows;
        segmentStart=month;
      }
      const scheduled=schedule[month-segmentStart];
      const opening=balance, regularPrincipal=scheduled.principal,interest=scheduled.interest;
      const afterRegular=scheduled.closing;
      const extra=month===12?Math.min(p.prepayment,afterRegular):0;
      const fee=extra*p.feeRate/100,closing=Math.max(0,afterRegular-extra);
      const regularPayment=regularPrincipal+interest,totalPayment=regularPayment+extra+fee;
      cumulativePrincipal+=regularPrincipal+extra;cumulativeInterest+=interest;cumulativeFees+=fee;
      rows.push({month,rate,opening,regularPrincipal,interest,regularPayment,afterRegular,extra,fee,totalPayment,closing,cumulativePrincipal,cumulativeInterest,cumulativeFees,cumulativePayment:cumulativePrincipal+cumulativeInterest+cumulativeFees,repriced});
      balance=closing;
    }
    paths[mode]={rows,totalInterest:cumulativeInterest,totalFees:cumulativeFees,totalPayment:cumulativePrincipal+cumulativeInterest+cumulativeFees};
  }
  return {...p,paths,bullet:original.paths.bullet,assumedPrepaymentMonth:12,assumedResetMonth:13};
}

export const externalCostDefaults={startCash:2100000,service:150000,levy:20000,documentation:'confirmed',refund:'waiting'};
// A covered condominium and documented tenant advance are explicit fictional assumptions.
// Unknown classification is a record of past cash out, NEVER an asset/claim inferred by this model.
export function externalCostFrames(input={}) {
  const p={...externalCostDefaults,...input};
  for(const k of ['startCash','service','levy']) nonnegative(p[k],k);
  if(!['confirmed','unknown'].includes(p.documentation)||!['waiting','assumed'].includes(p.refund)) throw new RangeError('documentation/refund');
  if(p.documentation==='unknown'&&p.refund==='assumed') throw new RangeError('unconfirmed classification cannot imply an assumed reimbursement');
  if(p.startCash<12*(p.service+p.levy)) throw new RangeError('fixture requires funded monthly cash payments');
  return Array.from({length:14},(_,step)=>{
    const months=Math.min(step,12),servicePaid=months*p.service,levyPaid=months*p.levy;
    const refundCash=step===13&&p.refund==='assumed'?levyPaid:0;
    const claim=p.documentation==='confirmed'?levyPaid-refundCash:null;
    return {...p,step,months,servicePaid,levyPaid,refundCash,claim,unclassified:p.documentation==='unknown'?levyPaid:0,cash:p.startCash-servicePaid-levyPaid+refundCash,paidOut:servicePaid+levyPaid,refundStatus:levyPaid===0?'no-target':p.documentation==='unknown'?'unknown':refundCash>0?'arrived':'waiting'};
  });
}

export const ownReserveDefaults={startCash:0,monthlyFunding:100000,reserveTransfer:100000,repairCost:1200000,repairMonth:12,responsibility:'assumed'};
// New available household funding -> own-account transfer -> proposed repair payment.
// Failed/unconfirmed repair is NOT a debt, performed work or an automatically retried payment.
export function ownReserveFrames(input={}) {
  const p={...ownReserveDefaults,...input};
  for(const k of ['startCash','monthlyFunding','reserveTransfer','repairCost']) nonnegative(p[k],k);
  integer(p.repairMonth,'repairMonth',1,12);
  if(!['assumed','unknown'].includes(p.responsibility)) throw new RangeError('responsibility');
  let wallet=p.startCash,reserve=0,funding=0,spent=0,failure=null,status='not-due';
  const frames=[];
  const record=(month,transferred=0,paidFromReserve=0,paidFromWallet=0)=>frames.push({...p,month,incoming:month>0?p.monthlyFunding:0,wallet,reserve,funding,spent,transferred,paidFromReserve,paidFromWallet,totalCash:wallet+reserve,failure,status});
  record(0);
  for(let month=1;month<=12;month++) {
    wallet+=p.monthlyFunding;funding+=p.monthlyFunding;
    const transferred=Math.min(wallet,p.reserveTransfer);wallet-=transferred;reserve+=transferred;
    let paidFromReserve=0,paidFromWallet=0;
    if(month===p.repairMonth) {
      if(p.repairCost===0) status='no-payment';
      else if(p.responsibility==='unknown') {status='unconfirmed';failure={month,kind:'unconfirmed',gap:null};}
      else if(wallet+reserve<p.repairCost) {status='unpaid';failure={month,kind:'shortage',gap:p.repairCost-wallet-reserve};}
      else {paidFromReserve=Math.min(reserve,p.repairCost);paidFromWallet=p.repairCost-paidFromReserve;reserve-=paidFromReserve;wallet-=paidFromWallet;spent=p.repairCost;status='paid';}
    }
    record(month,transferred,paidFromReserve,paidFromWallet);
  }
  return frames;
}

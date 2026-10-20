import { projectRepayment } from '../money/repayment.mjs';
const finite=(n,k,min=0,max=1e9)=>{if(!Number.isFinite(n)||n<min||n>max)throw new RangeError(k)};
// Arithmetic tolerance only, far below one won; never round displayed values for decisions.
const canPay=(cash,due,tolerance)=>due-cash<=tolerance;
export const comparisonDefaults={months:24,startCash:150e6,monthlyFunding:1.2e6,annualReturn:0,priceChange:0,transactionCosts:true,settlement:'assumed',rentDeposit:20e6,rent:700000,jeonseDeposit:140e6,jeonseLoan:20e6,buyPrice:200e6,buyLoan:80e6,loanRate:4,loanMonths:240};
// All amounts are fictional. Planned PV and a funded hypothetical cash ledger are separate.
// A failed whole payment bundle is not an overdraft, performed housing service or new arrears debt.
export function housingComparison(input={}) {
  const p={...comparisonDefaults,...input};
  for(const k of ['startCash','monthlyFunding','rentDeposit','rent','jeonseDeposit','jeonseLoan','buyPrice','buyLoan'])finite(p[k],k);
  finite(p.annualReturn,'annualReturn',0,10);finite(p.priceChange,'priceChange',-1,1);finite(p.loanRate,'loanRate',0,30);
  if(!Number.isInteger(p.months)||p.months<0||p.months>360)throw new RangeError('months');
  if(!Number.isInteger(p.loanMonths)||p.loanMonths<1||p.loanMonths>360)throw new RangeError('loanMonths');
  if(p.buyLoan>100e6||p.buyLoan>p.buyPrice||p.jeonseLoan>p.jeonseDeposit)throw new RangeError('loan');
  if(typeof p.transactionCosts!=='boolean'||!['assumed','unknown'].includes(p.settlement))throw new RangeError('conditions');
  const d=Math.expm1(Math.log1p(p.annualReturn/100)/12),factor=(1+d)**p.months;
  const loanRows=projectRepayment({principal:p.buyLoan,annualRate:p.loanRate,months:p.loanMonths}).paths.annuity.rows;
  // Bound accumulated floating-point operations, not a won-level payment concession.
  // A 0.01-won cap preserves every genuine one-won shortage throughout the domain.
  const numericalTolerance=Math.min(.01,Math.max(1e-6,Math.max(p.startCash+p.monthlyFunding*p.months,p.buyPrice,p.jeonseDeposit)*factor*Number.EPSILON*(p.months+2)*16));
  const paths={};
  for(const kind of ['rent','jeonse','buy']) {
    const price=kind==='rent'?p.rentDeposit:kind==='jeonse'?p.jeonseDeposit:p.buyPrice;
    const loan=kind==='rent'?0:kind==='jeonse'?p.jeonseLoan:p.buyLoan;
    const entryFee=p.transactionCosts?(kind==='buy'?5e6:1e6):0,disposalFee=p.transactionCosts&&kind==='buy'?3e6:0;
    const initialUse=price-loan+entryFee;
    const assetAt=month=>kind==='buy'&&p.months>0?price*(1+p.priceChange*month/p.months):price;
    const planned=[{month:0,out:0,principal:0,interest:0,rent:0,maintenance:0,annualCost:0,debt:loan,asset:price,cumulativeExpense:entryFee}];
    let plannedExpense=entryFee;
    for(let month=1;month<=p.months;month++) {
      const r=kind==='buy'?loanRows[month-1]:null;
      const principal=r?.principal??0,interest=kind==='jeonse'?loan*p.loanRate/1200:r?.interest??0;
      const rent=kind==='rent'?p.rent:0,maintenance=kind==='buy'?100000:0;
      const annualCost=month%12===0?(kind==='buy'?600000:kind==='jeonse'?100000:0):0;
      const out=principal+interest+rent+maintenance+annualCost;
      plannedExpense+=interest+rent+maintenance+annualCost;
      planned.push({month,out,principal,interest,rent,maintenance,annualCost,debt:kind==='buy'?(r?.closing??0):loan,asset:assetAt(month),cumulativeExpense:plannedExpense});
    }
    const end=planned.at(-1),netSettlement=end.asset-end.debt-disposalFee;
    const pvCost=initialUse+planned.slice(1).reduce((s,r)=>s+r.out/(1+d)**r.month,0)-netSettlement/factor;
    let cash=p.startCash,asset=0,debt=0,spent=0,funding=0,returns=0,paidMonths=0,failure=null;
    const frames=[];
    const record=(step,month,phase,extra={})=>frames.push({step,month,phase,cash,asset,debt,spent,funding,returns,paidMonths,failure,netWorth:cash+asset-debt,...extra});
    if(!canPay(cash,initialUse,numericalTolerance))failure={kind:'initial-shortage',month:0,gap:initialUse-cash};
    else {cash=Math.max(0,cash-initialUse);asset=price;debt=loan;spent=entryFee;}
    record(0,0,'entry',{paid:!failure,out:failure?0:initialUse});
    for(let month=1;month<=p.months;month++) {
      let paid=false,out=0;
      if(!failure) {
        const earned=cash*d;cash+=earned+p.monthlyFunding;returns+=earned;funding+=p.monthlyFunding;
        const r=planned[month];
        if(!canPay(cash,r.out,numericalTolerance))failure={kind:'monthly-shortage',month,gap:r.out-cash};
        else {cash=Math.max(0,cash-r.out);asset=r.asset;debt=r.debt;spent=r.cumulativeExpense;paidMonths=month;paid=true;out=r.out;}
      }
      record(month,month,'monthly',{paid,out});
    }
    const beforeSettlement={cash,asset,debt,spent};
    let terminalCash=null,settled=false;
    if(!failure) {
      if(p.settlement==='unknown')failure={kind:'settlement-unconfirmed',month:p.months,gap:null};
      else if(!canPay(cash,-netSettlement,numericalTolerance))failure={kind:'settlement-shortage',month:p.months,gap:-(cash+netSettlement)};
      else {cash=Math.max(0,cash+netSettlement);asset=0;debt=0;spent+=disposalFee;terminalCash=cash;settled=true;}
    }
    record(p.months+1,p.months,'settlement',{paid:settled,out:settled?disposalFee:0});
    paths[kind]={kind,price,loan,entryFee,disposalFee,initialUse,planned,netSettlement,pvCost,plannedExpense:plannedExpense+disposalFee,frames,beforeSettlement,terminalCash,settled,failure};
  }
  return {...p,monthlyReturn:d,factor,numericalTolerance,paths};
}

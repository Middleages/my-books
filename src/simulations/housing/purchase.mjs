import { projectRepayment } from '../money/repayment.mjs';
// Fictional payment schedule. No title transfer, loan approval, damages or recovery valuation.
const bounded = (n, name, max=1e10) => {
  if(!Number.isFinite(n)||n<0||n>max) throw new RangeError(name);
  return n;
};
export const purchaseTimings = ['before','after','nextDay','unknown'];
export function purchaseFrames({price=200e6,startCash=150e6,loan=80e6,cost=5e6,timing='before'}={}) {
  for(const [name,n] of Object.entries({price,startCash,loan,cost})) bounded(n,name);
  if(!purchaseTimings.includes(timing)) throw new RangeError('timing');
  const deposit=price*.1, middle=price*.2, balance=price-deposit-middle;
  let cash=startCash,debt=0,paidPrice=0,spentCost=0,home=0,completed=false,failure=null;
  const frames=[];
  const record=(step,day,label,action,paid=0,borrowed=0)=>frames.push({step,day,label,action,price,startCash,loan,cost,timing,deposit,middle,balance,cash,debt,paidPrice,advance:completed?0:paidPrice,spentCost,home,completed,failure,paid,borrowed,unconfirmedLoan:timing==='unknown'?loan:0,bookDifference:cash+(completed?home:paidPrice)-debt});
  const pay=(required,day,kind)=>{
    if(failure) return false;
    if(cash<required) {
      const potential=kind==='closing'&&timing==='unknown'?loan:0;
      failure={day,kind:potential>0&&cash+potential>=required?'unknown-order':'shortage',required,knownCash:cash,gapBeforeArrival:required-cash,minimumGap:Math.max(0,required-cash-potential)};
      return false;
    }
    cash-=required; return true;
  };
  record(0,-1,'지급 전','start');
  if(pay(deposit,0,'deposit')) paidPrice+=deposit;
  record(1,0,'계약금','price',failure?0:deposit);
  if(pay(middle,30,'middle')) paidPrice+=middle;
  record(2,30,'중도금','price',failure?0:middle);
  let borrowed=0;
  if(!failure&&timing==='before') {cash+=loan;debt+=loan;borrowed=loan;}
  record(3,60,'잔금 직전 자금','funding',0,borrowed);
  // Closing price and nonrecoverable fees are ONE atomic teaching bundle.
  // Previously paid amounts and an executed loan remain when this bundle cannot be paid.
  const ok=pay(balance+cost,60,'closing');
  if(ok) {paidPrice+=balance;spentCost+=cost;home=price;completed=true;}
  record(4,60,'잔금·별도비용 묶음','closing',ok?balance+cost:0);
  borrowed=0;
  if(!failure&&['after','nextDay'].includes(timing)) {cash+=loan;debt+=loan;borrowed=loan;}
  record(5,timing==='nextDay'?61:60,borrowed>0?'가정한 후속 대출 실행':failure?'중단 뒤 예정 미실행':timing==='unknown'?'미확인 대출 미반영':'추가 실행 없음','later',0,borrowed);
  return frames;
}

export const mortgageDefaults={principal:80e6,appraisal:200e6,annualIncome:48e6,takeHome:3e6,living:2e6,existingMonthly:200000,monthlyGoal:200000,annualRate:4,stress:2,months:240};
export function mortgageMeasures(input={}) {
  const p={...mortgageDefaults,...input};
  for(const key of ['principal','appraisal','annualIncome','takeHome','living','existingMonthly','monthlyGoal']) bounded(p[key],key);
  bounded(p.annualRate,'annualRate',30);bounded(p.stress,'stress',30);
  if(p.annualRate+p.stress>30) throw new RangeError('combined screening rate exceeds 30% model cap');
  const actual=projectRepayment({principal:p.principal,annualRate:p.annualRate,months:p.months}).paths.annuity;
  const screen=projectRepayment({principal:p.principal,annualRate:p.annualRate+p.stress,months:p.months}).paths.annuity;
  const payment=actual.rows[0].payment;
  // Existing debt is separately assumed constant for 12 months. Not Korean recognized debt rules.
  const actualAnnual=actual.rows.slice(0,12).reduce((n,r)=>n+r.payment,0)+p.existingMonthly*12;
  const screenMonths=Array.from({length:12},(_,i)=>(screen.rows[i]?.payment??0)+p.existingMonthly);
  const screenAnnual=screenMonths.reduce((n,nth)=>n+nth,0);
  const monthlyOut=p.living+p.existingMonthly+payment,remaining=p.takeHome-monthlyOut;
  // goalGap excludes the separate spending deficit: unmet monthly surplus target, not total extra funding.
  const monthlyShortage=Math.max(0,-remaining),goalGap=Math.max(0,p.monthlyGoal-Math.max(0,remaining));
  const frames=[0,p.living,p.living+p.existingMonthly,monthlyOut].map((out,step)=>({step,out,remaining:p.takeHome-out}));
  return {...p,payment,actualAnnual,screenAnnual,screenMonths,ltv:p.appraisal===0?null:p.principal/p.appraisal,annualRatio:p.annualIncome===0?null:screenAnnual/p.annualIncome,monthlyOut,remaining,monthlyShortage,goalGap,frames,approval:null};
}

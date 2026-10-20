export type PurchaseTiming='before'|'after'|'nextDay'|'unknown';
export type PurchaseFailure={day:number;kind:'unknown-order'|'shortage';required:number;knownCash:number;gapBeforeArrival:number;minimumGap:number};
export type PurchaseParams={price?:number;startCash?:number;loan?:number;cost?:number;timing?:PurchaseTiming};
export type PurchaseFrame={step:number;day:number;label:string;action:string;price:number;startCash:number;loan:number;cost:number;timing:PurchaseTiming;deposit:number;middle:number;balance:number;cash:number;debt:number;paidPrice:number;advance:number;spentCost:number;home:number;completed:boolean;failure:PurchaseFailure|null;paid:number;borrowed:number;unconfirmedLoan:number;bookDifference:number};
export const purchaseTimings:PurchaseTiming[];
export function purchaseFrames(p?:PurchaseParams):PurchaseFrame[];
export type MortgageParams={principal:number;appraisal:number;annualIncome:number;takeHome:number;living:number;existingMonthly:number;monthlyGoal:number;annualRate:number;stress:number;months:number};
export const mortgageDefaults:MortgageParams;
/** goalGap: unmet monthly surplus target excluding monthlyShortage, not total additional funding. payment: first-month scheduled payment. */
export type MortgageMeasures=MortgageParams&{payment:number;actualAnnual:number;screenAnnual:number;screenMonths:number[];ltv:number|null;annualRatio:number|null;monthlyOut:number;remaining:number;monthlyShortage:number;goalGap:number;frames:{step:number;out:number;remaining:number}[];approval:null};
export function mortgageMeasures(p?:Partial<MortgageParams>):MortgageMeasures;

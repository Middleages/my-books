import {createJournalEngine} from './journal.mjs';
const define=(label,kind,normal,extra={})=>Object.freeze({label,kind,normal,...extra});
export const businessAccounts=Object.freeze({
 cash:define('현금','asset','debit'),receivable:define('매출채권','asset','debit'),inventory:define('재고','asset','debit'),prepaid:define('선급 서비스','asset','debit'),equipment:define('설비 취득원가','asset','debit'),depreciationAccumulated:define('감가상각누계액','asset','credit',{contra:true}),
 payable:define('매입채무','liability','credit'),accrued:define('미지급 서비스비용','liability','credit'),loan:define('차입금','liability','credit'),contractLiability:define('고객 선입금 의무','liability','credit'),
 capital:define('납입자본','equity','credit'),retained:define('이월 이익잉여금','equity','credit'),revenue:define('매출','revenue','credit'),cogs:define('매출원가','expense','debit'),serviceExpense:define('기간 서비스비용','expense','debit'),prepaidExpense:define('선급 서비스 사용비용','expense','debit'),depreciationExpense:define('감가상각비','expense','debit'),interestExpense:define('이자비용','expense','debit'),dividends:define('배당','distribution','debit'),
});
const engine=createJournalEngine(businessAccounts,{cash:500,loan:200,capital:300});
export const {createLedger,post,periodSummary}=engine;
export function snapshot(state){const result=engine.snapshot(state),b=result.balances;return{...result,grossProfit:result.revenue-b.cogs,operatingProfit:result.profit+b.interestExpense,netEquipment:b.equipment-b.depreciationAccumulated,retainedEarnings:b.retained+result.profit-b.dividends};}
export const debit=(account,amount)=>({account,side:'debit',amount});
export const credit=(account,amount)=>({account,side:'credit',amount});

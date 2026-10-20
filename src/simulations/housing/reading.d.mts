export type HousingPackKind='rent'|'jeonse'|'buy';
export type HousingPack={kind:HousingPackKind;title:string;lines:string[][];unknown:string[];reveal:string;revealed:boolean;deposit?:number;rent?:number;management?:number;plannedLoan?:number;price?:number;parts?:number[];knownMonthlySubtotal:number|null;actualCash:null;actualLoan:null;eligibility:null;legalPriority:null;complete:false;guaranteePurpose:'bank-loan'|'unknown';loanDateStatement:'before-day60-payment'|'unknown'};
export function readHousingPack(kind?:HousingPackKind,revealed?:boolean):HousingPack;

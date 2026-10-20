import {reportModel,reportScenarios} from './reports.mjs';

// Analysis definitions are explicit teaching choices, not IFRS-mandated ratios.
export function ratio(numerator,denominator){
 if(![numerator,denominator].every(Number.isFinite))throw new RangeError('유한한 분자와 분모를 확인하세요.');
 return {numerator,denominator,defined:denominator!==0,value:denominator===0?null:numerator/denominator,positiveBase:denominator>0,reason:denominator===0?'0으로 나누는 비율은 정의되지 않습니다.':denominator<0?'산술값은 있지만 양의 기준금액 대비라는 보통의 해석을 적용하지 않습니다.':'같은 범위의 양의 분모로 나눈 값입니다.'};
}
export const analysisScenarios=Object.freeze([...reportScenarios]);
export const currentLoanChoices=Object.freeze([0,40,280]);
export function analysisModel({scenario='base',currentLoan=40,scope='same'}={}){
 if(!currentLoanChoices.includes(currentLoan)||!['same','mixed'].includes(scope))throw new RangeError('만기와 비교 범위를 확인하세요.');
 const report=reportModel(scenario),s=report.closing,b=s.balances;
 const assets=[{id:'cash',label:'현금',value:b.cash},{id:'receivable',label:'매출채권',value:b.receivable},{id:'inventory',label:'재고',value:b.inventory},{id:'prepaid',label:'선급 서비스',value:b.prepaid}];
 const liabilities=[{id:'payable',label:'매입채무',value:b.payable},{id:'accrued',label:'미지급비용',value:b.accrued},{id:'loan',label:'차입금 유동분',value:currentLoan}];
 const sum=xs=>xs.reduce((n,x)=>n+x.value,0),currentAssets=sum(assets),currentLiabilities=sum(liabilities);
 const compatible=scope==='same',otherOperating=b.serviceExpense+b.prepaidExpense+b.depreciationExpense;
 return {scenario,currentLoan,scope,compatible,report,assets,liabilities,currentAssets,currentLiabilities,currentRatio:compatible?ratio(currentAssets,currentLiabilities):null,cash:b.cash,totalLoan:b.loan,noncurrentLoan:b.loan-currentLoan,totalLiabilities:s.liabilities,scale:800,margins:{revenue:s.revenue,cost:b.cogs,otherOperating,operating:s.operatingProfit,gross:s.grossProfit,grossRatio:compatible?ratio(s.grossProfit,s.revenue):null,operatingRatio:compatible?ratio(s.operatingProfit,s.revenue):null},scopeReason:compatible?'작은책상 · M1 말 잔액 / M1 전체 성과 · 가상단위 · 단일 회사':'M1 성과와 M2 일부 자료는 같은 기간이 아닙니다. 분자·분모를 섞은 비율은 계산하지 않습니다.'};
}
export function analysisFrames(options={}){
 const model=analysisModel(options);
 return [
  ['composition','같은 몫 안의 다른 자산','회수만 바꾸면 현금과 채권의 구성은 달라지지만 유동자산 합과 유동비율은 같습니다. 즉시 쓸 수 있는 현금과 회수가 필요한 권리를 구별하세요.'],
  ['maturity','만기 분류는 현금 지급이 아닙니다','차입금 총액280은 그대로입니다. 보고일 뒤12개월 내 상환분 가정을 바꾸면 유동/비유동 구성과 비율 분모가 바뀝니다. 지금 돈을 낸 사건이 아닙니다.'],
  ['margin','총이익 안에 영업비용과 영업이익이 있습니다','매출총이익은 매출에서 팔린 상품 원가를 뺀 값입니다. 여기서 다른 영업비용을 빼면 영업이익입니다. 두 이익을 서로 다른 조각처럼 더하지 않습니다.'],
 ].map(([kind,title,detail],index)=>({index,kind,title,detail,model:structuredClone(model)}));
}
export const ratioExamples=Object.freeze({
 loss:{label:'손실 / 양의 매출',numerator:-20,denominator:100,unit:'별도 산술 예 · 이익/매출',note:'−20%는 손실을 나타냅니다. 음수 분자라는 이유로 계산 불가가 되지 않습니다.'},
 zero:{label:'분모0',numerator:10,denominator:0,unit:'별도 산술 예 · 분모가 없는 비율',note:'∞나0%로 표시하지 않습니다. 원래 금액10과0 및 계산 불가 이유를 읽습니다.'},
 negative:{label:'음수 자본 기준',numerator:10,denominator:-50,unit:'별도 산술 예 · 이익/자본',note:'10/−50=−20%라는 산술값은 있습니다. 이를 양의 자본 대비 성과나 안전성의 순위로 읽지 않습니다. 정본 작은책상의 자본은405입니다.'},
});
export function ratioExample(key='zero'){
 if(!Object.hasOwn(ratioExamples,key))throw new RangeError('정의한 분모 반례를 고르세요.');
 const example=ratioExamples[key];return {key,...example,ratio:ratio(example.numerator,example.denominator)};
}
export function breakEven({quantity=45,price=5}={}){
 if(!Number.isInteger(quantity)||quantity<0||quantity>80||![3,5].includes(price))throw new RangeError('별도 계획의 수량0–80과 가격3/5를 확인하세요.');
 const variable=3,fixed=90,contribution=price-variable,revenue=price*quantity,cost=variable*quantity+fixed,profit=revenue-cost,point=contribution>0?fixed/contribution:null;
 const position=(q,money)=>({x:q/80,y:1-money/450});
 return {quantity,price,variable,fixed,contribution,revenue,cost,profit,breakEven:point,finitePositive:point!==null&&point>0,xMax:80,yMax:450,revenueLine:[position(0,0),position(80,price*80)],costLine:[position(0,fixed),position(80,variable*80+fixed)],revenuePoint:position(quantity,revenue),costPoint:position(quantity,cost),intersection:point===null?null:position(point,price*point)};
}

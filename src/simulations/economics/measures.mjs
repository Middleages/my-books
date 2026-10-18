// 자체 가상 사례. 생산은 원/년, 인구는 15세 이상 조사대상자(명).
const range=(v,max,integer=false)=>{if(!Number.isFinite(v)||v<0||v>max||(integer&&!Number.isInteger(v)))throw new RangeError('교육 모형의 입력 범위 밖입니다.');};
export const productionDefaults=Object.freeze({quantity:100,price:10});
export function growth(current,base){range(current,100000);range(base,100000);return base===0?null:(current-base)/base*100;}
export function production({quantity,price}){
 range(quantity,200,true);range(price,20);
 const prices=[price*.4,price*.5,price];
 const stages=prices.map((p,i)=>({name:['밀 농가','제분소','빵집'][i],price:p,quantity,output:p*quantity,input:i?prices[i-1]*quantity:0,valueAdded:p*quantity-(i?prices[i-1]*quantity:0)}));
 return {quantity,price,stages,nominal:quantity*price,real:quantity*10,gross:stages.reduce((s,r)=>s+r.output,0)};
}
export function output(base,current){
 const b=production(base),c=production(current);
 return {base:b,current:c,nominalGrowth:growth(c.nominal,b.nominal),realGrowth:growth(c.real,b.real),realDirection:c.real>b.real?'up':c.real<b.real?'down':'same'};
}
export const transactions=Object.freeze([
 {id:'bread',label:'올해 국내에서 만든 빵을 최종 소비자가 구매',included:true,reason:'올해의 최종 생산물입니다. 생산에 들어간 밀·밀가루 가격은 다시 더하지 않습니다.'},
 {id:'used',label:'작년에 생산한 중고 자전거 자체의 거래대금',included:false,reason:'올해 새로 생산한 자전거가 아닙니다. 소유권만 바뀐 대금은 올해 생산에 다시 더하지 않습니다.'},
 {id:'stock',label:'이미 발행된 주식의 매매대금',included:false,reason:'금융자산의 소유권 이전입니다. 주식 가격 상승도 당기 생산과 다릅니다.'},
 {id:'transfer',label:'정부가 가계에 지급한 현금 지원금 자체',included:false,reason:'생산물의 대가가 아닌 이전지출입니다. 이후 구매한 새 생산물은 해당 생산에서 셉니다.'},
 {id:'fee',label:'올해 국내에서 제공한 중고 거래 중개 서비스 수수료',included:true,reason:'중고 물건 자체와 달리 중개 서비스는 올해 새로 제공한 생산입니다.'},
]);
export const jobsDefaults=Object.freeze({employed:60,unemployed:10,inactive:30});
export const jobActions=Object.freeze([
 {id:'stop',label:'구직 중단',from:'unemployed',to:'inactive',description:'취업하지 않았고, 최근 4주 적극적 구직 요건을 더 이상 충족하지 않는 상태로 바뀝니다.'},
 {id:'hire',label:'구직자의 취업',from:'unemployed',to:'employed',description:'실업자가 새 일자리를 얻어 취업자로 바뀝니다.'},
 {id:'lose',label:'실직 후 구직',from:'employed',to:'unemployed',description:'취업자가 일을 잃고 적극적 구직·즉시 취업 가능 요건을 충족합니다.'},
 {id:'search',label:'구직 시작',from:'inactive',to:'unemployed',description:'일하지 않던 사람이 적극적 구직·즉시 취업 가능 요건을 충족합니다.'},
]);
export function jobs(p){
 for(const k of ['employed','unemployed','inactive'])range(p[k],100,true);
 const {employed,unemployed,inactive}=p,labourForce=employed+unemployed,population=labourForce+inactive;
 return {employed,unemployed,inactive,labourForce,population,unemploymentRate:labourForce?unemployed*100/labourForce:null,employmentRate:population?employed*100/population:null,participationRate:population?labourForce*100/population:null};
}
export function jobFrames(p,action,count){
 const initial=jobs(p);range(count,100,true);const a=jobActions.find(a=>a.id===action);if(!a)throw new RangeError('알 수 없는 이동');
 const moved=Math.min(p[a.from],count),next={...p,[a.from]:p[a.from]-moved,[a.to]:p[a.to]+moved};
 // 같은 집단의 전후 비교: 중간 단계는 설명 강조이지 가상의 일별 인구가 아니다.
 const after=jobs(next);return [initial,initial,after,after].map((r,phase)=>({...r,phase,moved:phase>=2?moved:0,unfilled:phase>=2?count-moved:0,explanation:moved===0?'이동한 사람이 없어 인원과 지표가 변하지 않습니다.':action==='stop'?'구직 중단은 취업 증가가 아닙니다. 실업자와 경제활동인구가 함께 줄어듭니다.':'이동 전후 인원과 두 비율의 분모를 함께 비교하세요.',employmentDirection:after.employed>initial.employed?'up':after.employed<initial.employed?'down':'same'}));
}

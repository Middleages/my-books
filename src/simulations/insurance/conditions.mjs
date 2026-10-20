// Entirely fictional benefit: dates are integer days from contract effectiveness.
// Contract [0,365), waiting [0,30), half benefit [30,90), full [90,365).
// Claim day is a separate observation, never substituted for the insured event day.
export const conditionsDefaults = Object.freeze({ eventDay:29, claimDay:100, coveredEvent:true, exclusionApplies:false, informationKnown:true, baseBenefit:2000000 });
export const conditionsBoundaries = Object.freeze({ effective:0, benefitStart:30, fullStart:90, endExclusive:365 });
const labels = {waiting:'대기기간',outside:'기간 밖', 'not-covered':'보장 사건 아님',excluded:'제외 조건 적용',reduced:'50% 감액',full:'정상 100%',unresolved:'확인 필요',invalid:'날짜 순서 오류'};
function normalize(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Options must be an object.');
  const p={...conditionsDefaults,...options};
  for(const key of ['eventDay','claimDay']) if(p[key] !== null && (!Number.isInteger(p[key]) || Math.abs(p[key])>100000)) throw new RangeError(`${key} must be an integer day within ±100000, or null.`);
  for(const key of ['coveredEvent','exclusionApplies']) if(p[key]!==null && typeof p[key]!=='boolean') throw new TypeError(`${key} must be boolean or null.`);
  if(typeof p.informationKnown!=='boolean') throw new TypeError('informationKnown must be boolean.');
  if(!Number.isFinite(p.baseBenefit)||p.baseBenefit<0||p.baseBenefit>1e12) throw new RangeError('baseBenefit must be finite within 0..1e12 won.');
  return p;
}
function dateStatus(day) {
  if(day===null) return {status:'unresolved',rate:null};
  if(day<0||day>=365) return {status:'outside',rate:0};
  if(day<30) return {status:'waiting',rate:0};
  if(day<90) return {status:'reduced',rate:.5};
  return {status:'full',rate:1};
}
function timeline(p) {
  const min=Math.min(-30,p.eventDay??0,p.claimDay??0),max=Math.max(430,p.eventDay??0,p.claimDay??0),span=max-min;
  const position=day=>(day-min)/span;
  const periods=[['before','효력 발생 전',min,0,null],['waiting','대기 · 보장개시 전',0,30,0],['reduced','감액 · 50%',30,90,.5],['normal','정상 · 100%',90,365,1],['ended','종료 후',365,max,null]].map(([id,label,start,end,rate])=>({id,label,start,end,rate,leftFraction:position(start),fraction:(end-start)/span}));
  const boundaries=[['effective','계약 효력 발생',0],['benefit','담보 보장개시',30],['full','정상 지급 시작',90],['end','보장 종료 · 이 날 제외',365]].map(([id,label,day])=>({id,label,day,fraction:position(day)}));
  const markers=[['event','◆ 사건일',p.eventDay],['claim','● 청구일',p.claimDay]].map(([id,label,day])=>({id,label,day,fraction:day===null?null:position(day)}));
  return {min,max,periods,boundaries,markers,contract:{start:0,end:365,leftFraction:position(0),fraction:365/span}};
}
export function projectConditions(options={}) {
  const params=normalize(options),p=params,date=dateStatus(p.eventDay);
  const invalid=p.eventDay!==null&&p.claimDay!==null&&p.claimDay<p.eventDay;
  const unknown=p.eventDay===null||p.claimDay===null||p.coveredEvent===null||p.exclusionApplies===null||!p.informationKnown;
  let status=invalid?'invalid':unknown?'unresolved':!p.coveredEvent?'not-covered':p.exclusionApplies?'excluded':date.status;
  const rate=status==='invalid'||status==='unresolved'?null:status==='reduced'?.5:status==='full'?1:0;
  const benefit=rate===null?null:p.baseBenefit*rate;
  const gates=[
    {id:'chronology',label:'날짜 순서·자료',state:invalid?'invalid':p.eventDay===null||p.claimDay===null||!p.informationKnown?'unknown':'pass',detail:invalid?'청구일이 사건일보다 앞섭니다. 날짜를 확인해야 하며 유효한 청구 결과를 만들지 않습니다.':!p.informationKnown?'사실·문서가 아직 확인되지 않았습니다. 다른 조건을 알아도 최종 금액은 미정입니다.':p.eventDay===null||p.claimDay===null?'날짜가 빠져 있습니다. 모르는 날짜를 0일로 채우지 않습니다.':'청구일이 사건일과 같거나 뒤입니다. 청구일 자체의 기한·심사는 이 모형 밖입니다.'},
    {id:'event',label:'보장 사건',state:p.coveredEvent===null?'unknown':p.coveredEvent?'pass':'fail',detail:p.coveredEvent===null?'약정 사건에 해당하는지 확인이 필요합니다.':p.coveredEvent?'이 가상 담보가 정한 사건이라고 가정합니다.':'이 가상 담보가 정한 보장 사건이 아닙니다.'},
    {id:'exclusion',label:'제외 조건',state:p.exclusionApplies===null?'unknown':p.exclusionApplies?'fail':'pass',detail:p.exclusionApplies===null?'해당 제외 조항의 적용 여부가 미확인입니다.':p.exclusionApplies?'가상 제외 조건이 적용됩니다.':'가상 제외 조건은 적용되지 않습니다.'},
    {id:'date',label:'사건일·지급 비율',state:date.rate===null?'unknown':date.rate===0?'fail':date.rate===.5?'reduced':'pass',detail:date.status==='unresolved'?'사건일을 확인해야 날짜 구간을 정할 수 있습니다.':date.status==='outside'?'사건일이 계약 효력 전 또는 종료일 365일 이후입니다.':date.status==='waiting'?'사건일이 0–29일입니다. 계약은 유효하지만 이 담보의 보장은 아직 시작되지 않았습니다.':date.status==='reduced'?'사건일이 30–89일입니다. 다른 조건까지 충족하면 약정액의 50%입니다.':'사건일이 90–364일입니다. 다른 조건까지 충족하면 약정액의 100%입니다.'},
  ];
  const verdict=status==='invalid'?'날짜 순서가 모순되어 계산을 보류합니다. 지급 거절 판정이 아닙니다.':status==='unresolved'?'정보가 부족해 지급대상 여부와 금액을 미정으로 남깁니다. 0원이나 자동 거절을 뜻하지 않습니다.':`이 가상 조건의 결과는 ${labels[status]}입니다. ${rate===0?'이 모형의 해당 담보 지급대상액은 0원입니다.':`약정액의 ${rate*100}%가 지급대상입니다.`} 실제 지급결정이나 입금 확인은 아닙니다.`;
  const phases=[['reference','두 날짜를 나란히','사건일은 보장 구간을 고르고, 청구일은 청구한 때를 표시합니다. 아래 관문은 설명을 위한 관찰 순서입니다.'],...gates.map(g=>[g.id,g.label,g.detail]),['decision','조건 함께 해석',verdict]];
  const frames=phases.map(([phase,label,detail],index)=>({index,phase,label,detail,gates:gates.map((gate,i)=>({...gate,state:index>=i+1?gate.state:'pending',detail:index>=i+1?gate.detail:'아직 살펴보지 않은 관문입니다.'})),status:index===5?status:'pending',statusLabel:index===5?labels[status]:'관찰 중',rate:index===5?rate:null,benefit:index===5?benefit:null,verdict:index===5?verdict:null}));
  return {params,boundaries:{...conditionsBoundaries},timeline:timeline(p),gates,dateStatus:date.status,status,statusLabel:labels[status],rate,benefit,verdict,frames};
}
export function conditionsBoundaryCases() {
  return [-1,0,29,30,89,90,364,365].map(eventDay=>projectConditions({eventDay,claimDay:400}));
}

// FICTIONAL allocation rule, not a universal Korean insurance adjustment formula.
// All amounts are won; fractions are kept unrounded. Two contracts share ONE loss.
export const overlapDefaults=Object.freeze({grossLoss:3000000,excludedLoss:0,capA:3000000,capB:3000000,eligibleA:true,eligibleB:true,fixedA:true,fixedB:true});
function normalize(options){
  if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('Options must be an object.');
  const p={...overlapDefaults,...options};
  for(const key of ['grossLoss','excludedLoss','capA','capB'])if(!Number.isFinite(p[key])||p[key]<0||p[key]>1e12)throw new RangeError(`${key} must be finite within 0..1e12 won.`);
  for(const key of ['eligibleA','eligibleB','fixedA','fixedB'])if(typeof p[key]!=='boolean')throw new TypeError(`${key} must be boolean.`);
  return p;
}
const labels={a:'실손 A의 몫',b:'실손 B의 몫',gap:'대상손실 중 미보전',outside:'공통 대상 밖 손실',unresolved:'아직 배분하지 않은 부분'};
function segments(grossLoss,amounts){let left=0;return Object.entries(amounts).map(([id,amount])=>{const item={id,label:labels[id],amount,leftFraction:grossLoss===0?0:Math.min(1,left/grossLoss),fraction:grossLoss===0?0:amount/grossLoss};left+=amount;return item;});}
export function projectOverlap(options={}) {
  const params=normalize(options),p=params,outside=Math.min(p.grossLoss,p.excludedLoss),eligibleLoss=p.grossLoss-outside;
  const eligibleCapA=p.eligibleA?p.capA:0,eligibleCapB=p.eligibleB?p.capB:0,capSum=eligibleCapA+eligibleCapB,totalPaid=Math.min(eligibleLoss,capSum);
  // Evaluate the smaller proportional share directly, so subtractive cancellation
  // cannot inflate or erase a tiny cap. Only the larger share receives the residual.
  // Cap bounds are exact; full-partition identities allow IEEE-754 scale tolerance.
  let paidA=0,paidB=0;
  if(capSum>0&&totalPaid===capSum){paidA=eligibleCapA;paidB=eligibleCapB;}
  else if(capSum>0&&eligibleCapA<=eligibleCapB){paidA=Math.min(eligibleCapA,totalPaid*(eligibleCapA/capSum));paidB=Math.min(eligibleCapB,totalPaid-paidA);}
  else if(capSum>0){paidB=Math.min(eligibleCapB,totalPaid*(eligibleCapB/capSum));paidA=Math.min(eligibleCapA,totalPaid-paidB);}
  const gap=eligibleLoss-totalPaid,remainingBurden=outside+gap;
  const fixed=[{id:'a',label:'정액 A',eligible:p.fixedA,promise:1000000,paid:p.fixedA?1000000:0},{id:'b',label:'정액 B',eligible:p.fixedB,promise:2000000,paid:p.fixedB?2000000:0}];
  const fixedTotal=fixed.reduce((sum,item)=>sum+item.paid,0);
  const capacityScale=Math.max(1,p.grossLoss,p.capA,p.capB);
  const capacities=[{id:'a',label:'실손 A',eligible:p.eligibleA,cap:p.capA,eligibleCap:eligibleCapA,capFraction:p.capA/capacityScale,eligibleFraction:eligibleCapA/capacityScale},{id:'b',label:'실손 B',eligible:p.eligibleB,cap:p.capB,eligibleCap:eligibleCapB,capFraction:p.capB/capacityScale,eligibleFraction:eligibleCapB/capacityScale}];
  const verdict=capSum===0?'적격인 남은 한도가 0원이므로 실손 지급대상액은 0원입니다. 손실이 없어졌다는 뜻은 아닙니다.':gap>0?'두 실손의 남은 한도를 합쳐도 대상손실을 다 채우지 못합니다. 한도 부족분과 대상 밖 손실은 남습니다.':outside>0?'두 실손은 공통 대상손실까지만 채웁니다. 대상 밖 손실은 그대로 남습니다.':'두 실손의 지급대상액을 합쳐도 같은 대상손실을 넘지 않습니다. 계약 수가 손실을 두 배로 만들지는 않습니다.';
  const phases=[['loss','한 번의 총손실','먼저 한 손실의 크기를 잡습니다. 두 계약이라고 손실 띠를 두 개 만들지 않습니다.'],['region','공통 대상손실의 경계','대상 밖 금액을 분리합니다. 아직 배분하지 않은 대상손실과 실제 보장 공백을 구별합니다.'],['eligibility','각 계약의 적격 한도','적격인 계약의 남은 한도만 배분에 참여합니다. 계약이 있어도 이 사건이 제외되면 적격 한도는 0원입니다.'],['allocation','두 몫을 한 손실에 배분','가상 비례식으로 같은 대상손실을 나눕니다. 칠해지지 않은 한도 부족분도 남겨 둡니다.'],['fixed','정액 약속은 별도 확인','정액 두 약속은 각각의 지급조건을 확인합니다. 이 돈을 실손 손실 띠에 덧칠하지 않습니다.']];
  const frames=phases.map(([phase,label,detail],index)=>({index,phase,label,detail,grossLoss:p.grossLoss,eligibleLoss:index>=1?eligibleLoss:null,outside:index>=1?outside:null,paidA:index>=3?paidA:null,paidB:index>=3?paidB:null,totalPaid:index>=3?totalPaid:null,gap:index>=3?gap:null,remainingBurden:index>=3?remainingBurden:null,segments:segments(p.grossLoss,index===0?{a:0,b:0,gap:0,outside:0,unresolved:p.grossLoss}:index<3?{a:0,b:0,gap:0,outside,unresolved:eligibleLoss}:{a:paidA,b:paidB,gap,outside,unresolved:0}),capacities:capacities.map(c=>({...c,observed:index>=2})),fixed:fixed.map(item=>({...item,paid:index===4?item.paid:null})),fixedTotal:index===4?fixedTotal:null,verdict:index===4?verdict:null}));
  return {params,outside,eligibleLoss,eligibleCapA,eligibleCapB,capSum,capacityScale,capacities,paidA,paidB,totalPaid,gap,remainingBurden,fixed,fixedTotal,verdict,frames,segments:frames.at(-1).segments};
}
export function overlapScenarios(){return [
  ['같은 한도',{}],['한도 100 / 300만원',{capA:1000000}],['A만 적격',{eligibleB:false}],['양쪽 제외',{eligibleA:false,eligibleB:false}],['대상 밖 100만원',{excludedLoss:1000000}],['한도 합계 200만원',{capA:1000000,capB:1000000}],['손실 0원',{grossLoss:0}],
].map(([label,options])=>({label,result:projectOverlap(options)}));}

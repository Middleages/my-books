/** Independent discussion map, not clinical guidance, institution policy or a family score. */
export function agreementFrame(option='separate',answer=false){
 if(!['separate','shared'].includes(option)||typeof answer!=='boolean')throw new RangeError('Invalid agreement example');
 const choices=option==='shared'?[{owner:'성인 A·B',label:'같은 인사말을 제안',lane:'shared'}]:[{owner:'성인 A',label:'짧게 말로 인사',lane:'A'},{owner:'성인 B',label:'손을 흔들며 인사',lane:'B'}];
 const rule={known:answer,label:answer?'가상 기관 답변: 인사 장소는 현관':'기관의 인사 장소 규칙: 미확인',question:'인사는 어디에서 하며 누가 안내하나요?'};
 return {scenarioId:'synthetic-greeting',ageBand:'0–36개월 아이를 돌보는 성인',sourceIds:['F1'],step:answer?1:0,selectedOption:option,observedFacts:answer?[rule.label]:[],hypotheses:['인사 방식이 다르면 돌봄의 질도 다를 것이라는 해석 · 근거 없음'],unknowns:['두 성인의 실제 동의','실제 기관의 규칙',...(answer?[]:['가상 기관의 인사 장소'])],boundary:'고정 경계: 안전 조건은 취향의 절충 대상이 아님',choices,rule,agreement:'방식은 제안일 뿐 · 동의나 실행은 확인되지 않음',summary:option==='shared'?'두 제안이 가운데로 모였지만 안전 경계와 기관 확인 질문은 그대로입니다.':'두 방식이 서로 다른 위치에 있어도 안전 경계는 같습니다. 방식의 차이는 우열이 아닙니다.'};
}

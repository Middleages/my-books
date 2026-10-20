/** Information provenance, not evacuation or clinical triage. Synthetic only. */
export function placeFrame(stage='before',changed=false){
 if(!['before','onsite'].includes(stage)||typeof changed!=='boolean')throw new RangeError('Unknown scene');
 const onsite=stage==='onsite';return {scenarioId:'visit-preparation',ageBand:'0–36개월 보호자',sourceIds:['E1'],observedFacts:[onsite?'방문 뒤 현장 안내를 다시 살피는 장면입니다.':'방문 전에 전달받은 안내를 읽는 장면입니다.'],hypotheses:[],unknowns:['실제 건물·연기·출입 조건과 피난 가능성은 미확인입니다.'],step:onsite?1:0,selectedOption:stage,stage,changed,nodes:[{id:'entry',label:'출입 안내',state:onsite?'현장 재확인':'사전 정보'},{id:'adult',label:'돌봄 담당',state:changed?'담당 변경 · 다시 인수':'사전 약속 · 인수 확인 필요'},{id:'help',label:'도움 연락',state:onsite?'현장 안내와 대조':'연락 방법 사전 확인'}],explanation:'안내를 읽은 것과 현재 조건이 맞는 것은 다릅니다. 선은 정보 연결이며 실제 피난 동선이 아닙니다.'};
}
const facts=['놀이 중 울고 있는 것을 보았습니다.','이전에 보던 모습과 달라 상담하려 합니다.'];
export function careFrame(sorted=false){if(typeof sorted!=='boolean')throw new RangeError('Unknown scene');return{scenarioId:'care-information',ageBand:'0–36개월 보호자',sourceIds:['E2'],observedFacts:[...facts],hypotheses:['특정 병 때문일 것 같다는 보호자의 추측'],unknowns:['시작 시각을 직접 보지 못했습니다.','원인과 진료 판단은 미확인입니다.'],step:sorted?1:0,selectedOption:sorted?'sorted':'mixed',sorted,questions:['어떤 변화를 더 관찰해 전달하면 좋을까요?','상태가 달라지면 누구에게 어떻게 도움을 구하나요?'],explanation:'분류는 정보를 읽기 쉽게 할 뿐 응급도·진단·진료 필요성을 판정하지 않습니다.'};}

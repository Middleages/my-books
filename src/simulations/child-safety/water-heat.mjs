/** Synthetic relational prevention only. Never safe depth, time or burn severity. */
export function waterFrame(handoff='request',access='open'){
 if(!['request','accepted'].includes(handoff)||!['open','separated'].includes(access))throw new RangeError('Unknown scene');
 const accepted=handoff==='accepted';return{scenarioId:'water-handoff',ageBand:'0–36개월 보호자',sourceIds:['S4'],observedFacts:[accepted?'다음 성인이 맡는다고 응답한 가상 장면입니다.':'이전 성인이 부탁했지만 응답은 아직 없습니다.'],hypotheses:[],unknowns:['실제 현장의 관찰 지속·수환경·제품 적합성은 미확인입니다.'],step:accepted?1:0,selectedOption:handoff,handoff,access,accepted,observer:accepted?'성인 B':'성인 A',explanation:accepted?'인수 응답과 담당 전환을 확인합니다. 물 주변의 직접 관찰은 계속됩니다.':'부탁했다는 말만으로 담당이 넘어가지 않습니다. 기존 담당이 계속 관찰합니다.',accessLabel:access==='open'?'물로 이어지는 접근선':'접근 제한을 별도 검토하는 장면',remaining:'접근 제한과 성인 관찰은 서로 대신하지 않습니다.'};
}
export function heatFrame(object='edge',cord='hanging'){
 if(!['edge','back'].includes(object)||!['hanging','away'].includes(cord))throw new RangeError('Unknown scene');
 return{scenarioId:'heat-contact-path',ageBand:'0–36개월 보호자',sourceIds:['S4'],observedFacts:[object==='edge'?'뜨거운 물건이 조리대 가장자리에 있습니다.':'물건을 가장자리에서 안쪽으로 옮긴 예시입니다.',cord==='hanging'?'연결선이 가장자리 아래로 늘어져 있습니다.':'연결선의 늘어진 부분을 제외한 예시입니다.'],hypotheses:[],unknowns:['실제 닿을 수 있는 범위·기기 설치조건·다른 경로는 미확인입니다.'],step:object==='back'&&cord==='away'?1:0,selectedOption:`${object}/${cord}`,object,cord,touch:object==='edge',pull:cord==='hanging',explanation:object==='back'&&cord==='hanging'?'본체 위치만 바뀌어도 당길 수 있는 선의 연결은 남습니다.':'본체와 연결선의 위치를 각각 살핍니다. 두 선택이 모두 바뀌어도 안전 보증은 아닙니다.'};
}

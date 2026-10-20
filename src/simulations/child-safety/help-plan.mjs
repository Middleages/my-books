/** Educational categories only; no actual reporting, diagnosis or personal input. */
export function helpFrame(topic='location') {
 const topics={location:{title:'위치 정보',example:'가상 장소의 위치를 설명할 단서',limit:'주소를 모르면 모른다고 말하고 현장 단서를 전달하는 범주입니다.'},observation:{title:'관찰한 상태',example:'실제로 보거나 들은 변화와 발생 경위',limit:'관찰을 진단명으로 바꾸거나 책에서 응급도를 판정하지 않습니다.'},contact:{title:'연락 가능성',example:'신고자와 다시 연락할 수 있는 정보',limit:'실제 이름·번호를 이 화면에 입력하지 않습니다.'}};
 if(!Object.hasOwn(topics,topic))throw new RangeError('Unknown topic');
 return {scenarioId:'emergency-book-boundary',ageBand:'0–36개월 보호자',sourceIds:['F1','F2'],observedFacts:[`가상 학습에서 ${topics[topic].title} 범주를 읽고 있습니다.`],hypotheses:[],unknowns:['실제 현장·환자 상태·신고 여부는 이 책이 알 수 없습니다.'],step:Object.keys(topics).indexOf(topic),selectedOption:topic,topic,...topics[topic],connected:false,notice:'학습 조작은 신고가 아닙니다. 이 화면은 어떤 기관에도 연결하지 않습니다.',boundary:'실제 긴급 상황에서는 책을 멈추고 즉시 119 등 전문 도움을 요청합니다. 항목을 다 읽을 필요가 없습니다.'};
}
export function sharedPlanFrame(owner='A',accepted=false) {
 if(!['A','B'].includes(owner)||typeof accepted!=='boolean')throw new RangeError('Unknown handoff');
 const rows=[{id:'floor',place:'놀이 공간',fact:'성인 A가 물건 위치를 살핀 과거 기록',state:'과거 확인 기록',mark:'○'},{id:'storage',place:'보관 공간',fact:'제품·잠금 상태를 아직 살피지 못함',state:'미확인',mark:'?'},{id:'water',place:'물 사용 공간',fact:'앞선 기록 뒤 사용 조건이 바뀜',state:'재확인 필요',mark:'↻'}];
 return {scenarioId:'shared-safety-handoff',ageBand:'0–36개월 보호자',sourceIds:['F1','F2','S4'],observedFacts:rows.map(r=>`${r.place}: ${r.fact}`),hypotheses:[],unknowns:['실제 가정의 현재 상태와 관찰 지속은 미확인입니다.'],step:accepted?1:0,selectedOption:`${owner}/${accepted}`,owner,accepted,rows,handoff:accepted?`성인 ${owner}의 가상 인수 응답을 읽었습니다.`:`성인 ${owner}에게 맡기려 하지만 인수 응답은 아직 없습니다.`,explanation:'담당 변경이나 응답은 환경을 점검한 사실을 새로 만들지 않습니다. 이전 기록·미확인·재확인 필요를 그대로 남깁니다.'};
}

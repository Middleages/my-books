/** Synthetic information relationships, not a toxicity or installation assessment. */
export function poisonFrame(label='unknown',storage='shared') {
 if(!['original','unknown'].includes(label)||!['shared','locked'].includes(storage))throw new RangeError('Unknown scene');
 return {scenarioId:'poison-storage',ageBand:'0–36개월 보호자',sourceIds:['D1','D2'],observedFacts:[label==='original'?'원래 용기와 표시가 함께 있는 가상 제품입니다.':'용기 표시와 내용물의 연결을 확인하지 못했습니다.',storage==='locked'?'음료 공간과 분리된 잠금 보관 예시입니다.':'음료와 같은 공간에 용기가 놓여 있습니다.'],hypotheses:[],unknowns:['실제 내용물·노출 여부·제품별 보관조건은 미확인입니다.'],step:storage==='locked'?1:0,selectedOption:`${label}/${storage}`,label,storage,identified:label==='original',separated:storage==='locked',explanation:label==='unknown'&&storage==='locked'?'보관 자리를 바꿔도 모르는 내용물이 확인되지는 않습니다.':'표시는 정보의 연결, 보관은 접근의 분리입니다. 한쪽이 다른 쪽을 대신하지 않습니다.',question:label==='unknown'?'내용물 정보를 어디에서 확인할 수 있나요? 모르면 모른다고 전달합니다.':'제품 표시의 보관조건을 실제 환경에서도 지키는지 확인할 필요가 있습니다.'};
}
export function travelFrame(seat='missing',vehicle='missing',child='missing') {
 const values=[seat,vehicle,child];if(values.some(x=>!['missing','read'].includes(x)))throw new RangeError('Unknown scene');
 const nodes=[{id:'seat',title:'제품 설명서',detail:'정확한 모델의 사용조건',state:seat},{id:'vehicle',title:'차량 설명서',detail:'해당 차량의 설치조건',state:vehicle},{id:'child',title:'아이 조건',detail:'제품 조건과 비교할 정보',state:child}];
 return {scenarioId:'travel-information',ageBand:'0–36개월 보호자',sourceIds:['D3'],observedFacts:nodes.map(x=>`${x.title}: ${x.state==='read'?'가상 자료 읽음':'자료 미확인'}`),hypotheses:[],unknowns:['실제 제품·차량·아이의 조합과 설치·탑승 상태는 미확인입니다.'],step:values.every(x=>x==='read')?1:0,selectedOption:values.join('/'),seat,vehicle,child,nodes,explanation:values.every(x=>x==='read')?'세 자료를 읽어도 실제 적합성·설치 확인은 별도입니다. 출발 허가나 안전 인증이 아닙니다.':'하나의 자료로 다른 자료의 빈칸을 채우지 않습니다. 미확인 연결은 점선으로 남깁니다.'};
}

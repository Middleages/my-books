export const consultationTopics=[
{id:'sleep',label:'수면 관찰',fact:'합성 일지에는 확인한 수면 구간과 추정 구간이 섞여 있습니다.',unknown:'하루 전체 수면은 미확정입니다.',question:'확인한 기록과 추정은 어떻게 나누어 전달할까요?'},
{id:'day',label:'낮의 모습',fact:'합성 메모에 평소보다 졸려 보인 날이 적혀 있습니다.',unknown:'이 변화의 원인은 기록으로 알 수 없습니다.',question:'평소와 달랐던 모습과 시점을 함께 이야기할까요?'},
{id:'breathing',label:'밤의 호흡 관찰',fact:'합성 메모에 코고는 소리가 있었다고 적혀 있습니다.',unknown:'호흡 상태를 직접 확인했는지는 메모에 없습니다.',question:'반복되는 코골이와 호흡 우려를 진료 담당자에게 어떻게 설명할까요?'},
{id:'concern',label:'보호자의 우려',fact:'합성 가족은 밤마다 관찰하기가 버겁다고 적었습니다.',unknown:'가능한 지원과 진료 계획은 아직 정하지 않았습니다.',question:'부담과 지원이 필요한 점도 함께 상의할까요?'}
];
export function consultationFrame(focus='breathing'){const selected=consultationTopics.find(t=>t.id===focus)||consultationTopics[2];return {focus:selected.id,topics:consultationTopics.map(t=>({...t,selected:t.id===selected.id})),summary:consultationTopics.map(t=>`${t.label}: ${t.fact} ${t.unknown}`),diagnosis:null,diseaseProbability:null,reassurance:null,urgencyScore:null};}
export const weekCases=[
{id:'partial',label:'기록이 빠진 합성 주간',days:['확인·추정 구분 메모','돌봄 교대 메모',null,'일정 변화 메모',null,'지원 질문 메모',null]},
{id:'noted',label:'매일 메모는 있는 합성 주간',days:['확인·추정 구분 메모','돌봄 교대 메모','호흡 우려 메모','일정 변화 메모','낮의 모습 메모','지원 질문 메모','미확정 질문 메모']}
];
export const planLayers=[{id:'safety',label:'유지할 안전·돌봄',text:'영아의 별도 적합 수면 공간과 필요한 수유·돌봄을 유지합니다. 급한 도움을 기록 뒤로 미루지 않습니다.'},{id:'observe',label:'관찰할 질문',text:'본 사실과 추정, 모르는 점을 구분해 전달할 수 있나요?'},{id:'change',label:'작게 살펴볼 생활 흐름',text:'가족이 가능한 차분한 활동 순서 하나를 이야기합니다. 수면 효과를 약속하거나 필요한 돌봄을 줄이지 않습니다.'},{id:'support',label:'확인할 돌봄 지원',text:'누가 언제 가능한지 확인하고, 지원 미확보를 숨기지 않습니다.'}];
export function weekFrame(id='partial',focus='observe'){const c=weekCases.find(c=>c.id===id)||weekCases[0],selected=planLayers.find(l=>l.id===focus)||planLayers[1];return {week:{...c,days:[...c.days]},missingDays:c.days.filter(x=>x===null).length,focus:selected.id,layers:planLayers.map(l=>({...l,selected:l.id===selected.id})),sleepTotal:null,improvement:null,safetyPassed:null,completionScore:null};}

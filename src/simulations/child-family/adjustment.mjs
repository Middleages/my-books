/** Synthetic observations only. Connections mean shared context, never adaptation progress. */
const contexts=['등원','돌봄 중','재회'];
const records=[
 ['보호자 관찰: 문 앞에서 울며 손을 잡음','교사 설명: 그림책을 함께 본 장면이 있었음','보호자 관찰: 만나서 안아 달라고 함'],
 ['보호자 관찰: 문 앞에서 손을 잡음',null,'보호자 관찰: 돌아가는 길에 주변을 가리킴'],
 ['보호자 관찰: 문 앞에서 울음','교사 설명: 놀이에 다가갔다가 곁으로 돌아옴','보호자 관찰: 만나서 손을 잡음']
];
export function adjustmentFrame(day=0,shared=false){
 if(!Number.isInteger(day)||day<0||day>2||typeof shared!=='boolean')throw new RangeError('Invalid synthetic observation');
 const slots=contexts.map((context,i)=>{const text=(i===1&&!shared)?null:records[day][i];return {id:i,context,known:text!==null,text:text??'기록 없음 · 확인할 내용',source:i===1?'교사':'보호자'};});
 const links=slots.slice(0,-1).map((s,i)=>({from:i,to:i+1,connected:s.known&&slots[i+1].known}));
 const unknowns=slots.filter(s=>!s.known).map(s=>s.context+'의 구체적인 상황');
 unknowns.push('관찰하지 않은 시간의 경험','이후의 적응 경과');
 return {scenarioId:'synthetic-childcare',ageBand:'0–36개월 보호자용 · 특정 월령의 예측 아님',sourceIds:['F2'],step:day,selectedOption:shared?'교사 기록 함께 보기':'가정 기록만 보기',dayLabel:['가상 기록 A','가상 기록 B','가상 기록 C'][day],slots,links,observedFacts:slots.filter(s=>s.known).map(s=>s.text),hypotheses:['등원 장면만 보고 하루 전체가 힘들었다고 생각함 · 확인되지 않은 해석'],unknowns,question:slots[1].known?'그 장면의 앞뒤에는 어떤 상황이 있었나요?':'돌봄 중 어떤 장면을 관찰했는지 함께 확인할 수 있나요?',summary:slots[1].known?'교사의 설명이 연결되어도 하루 전체나 적응 완료를 알 수는 없습니다.':'등원과 재회 사이의 빈칸은 잘 지냈음도 힘들었음도 뜻하지 않습니다.'};
}

/** Original fictional inquiry/review examples, not service listings or a family assessment. */
const fields=[['region','지역','가상 햇살 지역이라는 안내만 있음'],['target','대상','대상 연령·보호자 조건 미기재'],['cost','비용','비용·추가 부담 미기재'],['hours','시간','운영시간·예약 가능 시간 미기재'],['current','최신 확인','공식 최신 안내·확인일 미기재']];
export function supportFrame(selected='hours'){
 if(!fields.some(f=>f[0]===selected))throw new RangeError('Unknown support question');
 const conditions=fields.map(([id,label,note])=>({id,label,note,status:'미확인',selected:id===selected}));
 return {scenarioId:'support-fiction',ageBand:'0–36개월 보호자의 확인 질문',sourceIds:['F1','F5'],observedFacts:['가상 안내문에 이름만 있는 창구'],hypotheses:[],unknowns:conditions.map(c=>c.label),step:'inquiry',selectedOption:selected,need:'돌봄 공백을 상의할 곳 찾기',service:'가상 햇살 지원 창구 · 실제 기관 아님',conditions,question:`${conditions.find(c=>c.selected).label}: 공식 안내 또는 담당 창구에서 무엇을 확인해야 할까요?`,result:'질문 선택은 정보 확인이나 이용 자격 확정이 아닙니다.'};
}
export function reviewFrame(change='none'){
 if(!['none','handover','rest'].includes(change))throw new RangeError('Unknown review change');
 const days=['월','화','수','목','금'];
 const rows=[{id:'care',label:'실행',cells:days.map(day=>({day,text:'성인 A 돌봄',state:'known'}))},{id:'handover',label:'인계',cells:days.map((day,i)=>({day,text:i===2?(change==='handover'?'성인 B 인수 확인':'인수 답변 미확인'):'성인 A 유지',state:i===2&&change!=='handover'?'unknown':'known'}))},{id:'rest',label:'휴식',cells:days.map((day,i)=>({day,text:i===3?(change==='rest'?'A 휴식 / B 인수 확인':'A 휴식 희망 / 담당 A'):'휴식 기록 없음',state:i===3&&change==='rest'?'rest':'unknown'}))},{id:'unknown',label:'재확인',cells:days.map((day,i)=>({day,text:i===2?'다음 인계 조건':i===3?'다음 휴식의 돌봄':'기록 밖 정보 미확인',state:'unknown'}))}];
 // A confirmed Wednesday handover and Thursday rest alter the execution layer too.
 if(change==='handover')rows[0].cells[2].text='성인 B 돌봄';
 if(change==='rest')rows[0].cells[3].text='성인 B 돌봄';
 return {scenarioId:'review-fiction',ageBand:'0–36개월 돌봄 팀',sourceIds:['F1','F4'],observedFacts:['가상 주간 일부 기록'],hypotheses:[],unknowns:['기록 밖의 돌봄·휴식·개인 사정'],step:'compare',selectedOption:change,days,rows,question:change==='handover'?'다음 인계의 시간·권한·정보도 확인했나요?':change==='rest'?'다음 휴식에도 돌봄 인수 연결이 있나요?':'수요일 인수 답변을 누구와 확인할까요?',result:change==='none'?'변경 전: 미확인과 희망을 그대로 남김':'선택한 한 장면만 변경 · 다른 미확인은 그대로'};
}
export const blankReviewRows=['필요했던 돌봄과 시간','맡기로 한 성인과 확인할 역할','전달한 내용 / 인수 확인 여부','희망 휴식 / 그동안의 돌봄 연결','아직 모르는 조건과 확인할 질문','다음 주 바꿔 볼 한 가지'];

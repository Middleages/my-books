export const routineSource={source:'NHS Helping your baby to sleep',version:'페이지 검토 2025-01-28',country:'영국',checkedAt:'2026-10-20',targetPopulation:'아기를 돌보는 보호자 일반 안내',limitations:'개인 낮잠 전환일·입면 시각·효과를 예측하지 않음'};
export const napWindow={start:480,end:1200};
export const napDays=[
{id:'first',label:'첫째 날',context:'익숙한 일정의 합성 기록',opportunity:[[570,660],[840,900]],confirmed:[[590,630],[850,880]],estimated:[]},
{id:'second',label:'둘째 날',context:'메모가 불완전한 합성 기록',opportunity:[[570,660],[840,900]],confirmed:[],estimated:[[850,875]]},
{id:'third',label:'셋째 날',context:'일정이 달라진 합성 기록',opportunity:null,confirmed:[[840,890]],estimated:[]}
];
export function napTime(minute){return `${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;}
export function napFrame(id,includeEstimates=false){const d=napDays.find(x=>x.id===id)||napDays[0];return {...d,opportunity:d.opportunity?.map(x=>[...x])??null,confirmed:d.confirmed.map(x=>[...x]),estimated:includeEstimates?d.estimated.map(x=>[...x]):[],hasEstimate:d.estimated.length>0,confirmedMinutes:d.confirmed.reduce((n,[a,b])=>n+b-a,0),hasConfirmed:d.confirmed.length>0,transitionDate:null,window:{...napWindow}};}
export const routineCards=[{id:'story',label:'차분한 이야기',explanation:'조용한 이야기나 읽기처럼 진정되는 활동을 떠올립니다.'},{id:'space',label:'잠자리 준비',explanation:'잠자리 준비를 살피는 순서입니다. 영아 안전 원칙을 바꾸는 선택은 아닙니다.'},{id:'care',label:'돌봄 역할 확인',explanation:'지금 필요한 돌봄을 누가 맡는지 분명하게 합니다.'}];
export const families=[{id:'solo',label:'한 사람이 돌보는 합성 장면',order:['space','story','care'],care:'지금 돌보는 사람이 필요한 돌봄과 도움 요청 경로를 확인합니다.'},{id:'relay',label:'교대하는 합성 장면',order:['care','space','story'],care:'교대하는 사람이 현재 상황과 맡을 돌봄을 서로 확인합니다.'}];
export function routineFrame(familyId,order){const family=families.find(x=>x.id===familyId)||families[0];const valid=Array.isArray(order)&&order.length===3&&new Set(order).size===3&&order.every(id=>routineCards.some(c=>c.id===id));const ids=valid?[...order]:[...family.order];return {family:{...family,order:[...family.order]},order:ids,cards:ids.map(id=>({...routineCards.find(c=>c.id===id)})),sleepOnset:null,score:null,source:{...routineSource}};}
export function moveRoutineCard(order,id,delta){const current=routineFrame('solo',order).order;const i=current.indexOf(id),j=i+delta;if(i<0||![-1,1].includes(delta)||j<0||j>=current.length)return current;[current[i],current[j]]=[current[j],current[i]];return current;}

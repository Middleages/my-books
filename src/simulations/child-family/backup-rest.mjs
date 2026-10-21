/** Synthetic planning only; no actual assignment, safety or clinical assessment. */
const times=['16–17시','17–18시','18–19시'];
const meta=(id,step,selectedOption)=>({scenarioId:id,ageBand:'0–36개월 돌봄 팀',sourceIds:['F1','F4'],observedFacts:['합성 일정만 표시'],hypotheses:[],unknowns:['실제 인계 권한·환경·이용 가능성'],step,selectedOption});
export function backupFrame(absent='B',stage='candidate',range='partial'){
 if(!['A','B'].includes(absent)||!['candidate','contact','accepted'].includes(stage)||!['partial','full'].includes(range))throw new RangeError('Unknown backup condition');
 const cells=times.map((time,i)=>{const original=i===0?'A':'B';const gap=original===absent;const covered=gap&&stage==='accepted'&&(range==='full'||i===1);return {time,original,owner:gap?(covered?'C':null):original,status:gap?(covered?'수락한 범위':'돌봄 공백'):'기존 담당',gap:gap&&!covered};});
 return {...meta('backup',stage,absent),absent,stage,range,cells,route:[{label:'후보 성인 C',active:true},{label:'연락한 예제',active:stage!=='candidate'},{label:'시간 범위 수락',active:stage==='accepted'}],gapTimes:cells.filter(c=>c.gap).map(c=>c.time),result:cells.some(c=>c.gap)?'남은 돌봄 공백을 다시 확인':'예제의 시간 담당 연결됨 · 실제 인계 완료 아님'};
}
export function restFrame(slot=1,accepted=false,handedOver=false){
 if(!Number.isInteger(slot)||slot<0||slot>2||typeof accepted!=='boolean'||typeof handedOver!=='boolean')throw new RangeError('Unknown rest condition');
 const covered=accepted&&handedOver;
 const cells=times.map((time,i)=>({time,requested:i===slot,adult:i===slot&&covered?'B':'A',activity:i===slot?(covered?'휴식 구간':'휴식 희망 · 돌봄 담당 유지'):'돌봄',status:i===slot?(covered?'성인 B 인수 확인':'성인 B 인수 미확인'):'성인 A 담당'}));
 return {...meta('rest',handedOver?'handover':accepted?'accepted':'request',String(slot)),slot,accepted,handedOver,covered,cells,result:covered?'예제에서 휴식 구간과 성인 B 돌봄이 연결됨':'희망만으로 담당을 비우지 않음',unknowns:['실제 안전한 인수 조건·휴식의 질·건강 상태']};
}

export const signals = ['logs','metrics','traces'];
export const requests = Object.freeze(Array.from({length:10},(_,i)=>Object.freeze({id:`req-${String(i+1).padStart(2,'0')}`,status:[3,8].includes(i)?500:200,durationMs:i===6?900:100,traceId:`trace-${i+1}`})));
export function signalFrame(step=0,hidden='none') {
 const count=[0,4,8,10][Math.max(0,Math.min(3,Math.trunc(step)))];
 const seen=requests.slice(0,count), errors=seen.filter(r=>r.status===500).length;
 return {step:Math.max(0,Math.min(3,Math.trunc(step))),seen,total:count,errors,errorRate:count?errors/count:null,logs:hidden==='logs'?null:seen.map(r=>({requestId:r.id,message:r.status===500?'요청 실패':'요청 완료'})),metrics:hidden==='metrics'?null:{count,errors},traces:hidden==='traces'?null:seen.map(r=>({requestId:r.id,traceId:r.traceId,durationMs:r.durationMs})),hidden};
}
export const stages=['앱에서 발생','Alloy 수신','저장소 기록','조회 요청','조회 응답'];
export function pipelineFrame(step=0,failure='none') {
 const phase=Math.max(0,Math.min(4,Math.trunc(step)));
 return {step:phase,stage:stages[phase],failure,paths:signals.map(signal=>{
 const accepted=phase>=1&&failure!=='collector';
 const persisted=phase>=2&&accepted&&!(failure==='loki'&&signal==='logs');
 const queried=phase>=3;
 const queryable=phase>=4&&persisted&&failure!=='query';
 const status=phase<1?'미전송':!accepted?'수집 실패':phase<2?'수신됨':!persisted?'저장 실패':phase<4?'저장됨':queryable?'조회됨':'조회 실패';
 return {signal,backend:{logs:'Loki',metrics:'Mimir',traces:'Tempo'}[signal],accepted,persisted,queried,queryable,status};
 })};
}

// Synthetic, deterministic teaching fixtures. No real log/credential input.
const clamp = n => Math.max(0, Math.min(3, Math.trunc(Number(n) || 0)));
export function logFrame(step = 0, mode = 'normal', level = 'all') {
  const events = [
    {eventId:'e1', requestId:'r1', eventTime:0, observedTime:1, severity:'INFO', event:'started'},
    {eventId:'e2', requestId:'r1', eventTime:1, observedTime:mode==='late'?5:2, severity:'ERROR', event:'save_failed'},
    {eventId:'e3', requestId:'r2', eventTime:2, observedTime:3, severity:'INFO', event:'saved'},
  ].map(e=>({...e, service:'notes-api', route:'/notes/:id', trace_id:`demo-${e.requestId}`}));
  if(mode==='duplicate') events.push({...events[1],observedTime:4});
  const time=[0,2,3,5][clamp(step)];
  const generated=events.filter(e=>e.eventTime<=time);
  const visible=generated.filter(e=>e.observedTime<=time && (level==='all'||e.severity==='ERROR'));
  const safeFields=['eventId','requestId','eventTime','observedTime','severity','event','service','route','trace_id'];
  return {time, events, visible, generated, uniqueEvents:new Set(visible.map(e=>e.eventId)).size,
    requestIds:[...new Set(visible.map(e=>e.requestId))], safeFields,
    inputFields:mode==='unsafe'?[...safeFields,'authorization','freeText']:safeFields,
    removedFields:mode==='unsafe'?['authorization','freeText']:[],
    safeRecords:visible.map(e=>Object.fromEntries(safeFields.map(k=>[k,e[k]])))};
}
export function metricFrame(step=0, mode='normal') {
  const time=[0,10,20,30], raw=mode==='reset'?[0,4,1,5]:[0,4,8,12];
  const n=clamp(step)+1;
  const samples=time.slice(0,n).map((t,i)=>({time:t,counter:mode==='gap'&&i===2?null:mode==='zero'?0:raw[i],gauge:mode==='gap'&&i===2?null:mode==='zero'?0:[0,3,1,2][i]}));
  const intervals=samples.slice(1).map((s,i)=>{const previous=samples[i];return {from:previous.time,to:s.time,reset:s.counter!==null&&previous.counter!==null&&s.counter<previous.counter,rate:s.counter===null||previous.counter===null?null:(s.counter<previous.counter?s.counter:s.counter-previous.counter)/(s.time-previous.time)};});
  const count=mode==='zero'?0:clamp(step)*4;
  const durations=Array.from({length:count},(_,i)=>mode==='tail'&&i>=10?1000:100);
  const sum=durations.reduce((a,b)=>a+b,0),sorted=[...durations].sort((a,b)=>a-b);
  const bucketCounts=[100,500,1000].map(upper=>({upper,count:durations.filter(x=>x<=upper).length}));
  return {samples,intervals,count,sum,durations,bucketCounts,mean:count?sum/count:null,p95:count?sorted[Math.ceil(count*.95)-1]:null,resetMarkers:intervals.filter(x=>x.reset).map(x=>x.to)};
}

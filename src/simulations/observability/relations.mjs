const phase=n=>Math.max(0,Math.min(3,Math.trunc(Number(n)||0)));
const raw=[['api','orders','a',200],['api','orders','b',200],['api','orders','c',500],['worker','orders','a',200],['api','users','u',200],['worker','orders','b',200],['api','orders','d',200],['api','users','v',500],['worker','users','u',200],['api','users','u',200],['worker','users','v',200],['api','orders','c',500]];
export const labelEvents=Object.freeze(raw.map(([service,kind,item,status],i)=>Object.freeze({id:`r${i+1}`,service,route:`/${kind}/:id`,url:`/${kind}/${item}`,status})));
function groups(events,mode){const map=new Map();for(const e of events){const labels={service:e.service,route:mode==='raw'?e.url:e.route,status:e.status,...(mode==='request'?{request_id:e.id}:{})};const key=JSON.stringify(labels);if(!map.has(key))map.set(key,{key,labels,events:[]});map.get(key).events.push(e.id);}return [...map.values()];}
export function cardinalityFrame(step=0,mode='template'){
 const s=phase(step),events=labelEvents.slice(0,[0,4,8,12][s]);const all=groups(labelEvents,mode),observed=groups(events,mode),baseline=groups(events,'template');
 const keys=Object.keys(all[0].labels),domains=keys.map(key=>({key,values:[...new Set(all.map(g=>g.labels[key]))]}));
 return {step:s,mode,events,groups:observed,baseline,observedCount:observed.length,potentialProduct:domains.reduce((n,d)=>n*d.values.length,1),domains,totalEvents:labelEvents.length,baselinePotential:8};
}
export function traceFrame(step=0,mode='parallel'){
 const s=phase(step),serial=mode==='serial',rootEnd=serial?300:200,now=[0,50,150,300][s];
 const fixture=[{id:'browser',name:'브라우저',start:0,end:rootEnd,parentId:null,traceId:'T-A'}, {id:'proxy',name:'프록시',start:10,end:rootEnd-10,parentId:'browser',traceId:'T-A'}, {id:'api',name:'API',start:20,end:rootEnd-20,parentId:'proxy',traceId:'T-A'}, {id:'db-a',name:'DB 조회 A',start:30,end:130,parentId:'api',traceId:'T-A'}, {id:'db-b',name:'DB 조회 B',start:serial?130:30,end:serial?280:180,parentId:mode==='propagation'?null:'api',traceId:mode==='propagation'?'T-B':'T-A'}];
 const spans=fixture.map(x=>({...x,received:!(mode==='missing'&&x.id==='db-b')&&now>=x.end}));const received=spans.filter(x=>x.received),root=received.find(x=>x.id==='browser');
 return {step:s,mode,now,spans,received,elapsed:root?root.end-root.start:null,childDurationSum:received.filter(x=>x.id.startsWith('db-')&&x.parentId==='api'&&x.traceId==='T-A').reduce((n,x)=>n+x.end-x.start,0),childrenComplete:received.filter(x=>x.id.startsWith('db-')&&x.parentId==='api'&&x.traceId==='T-A').length===2,rootEnd,axisMax:300};
}

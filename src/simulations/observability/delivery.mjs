const stepOf=n=>Math.max(0,Math.min(3,Math.trunc(Number(n)||0)));
export function instrumentationFrame(step=0,{mode='auto',service='orders-api',environment='lab'}={}){
 const s=stepOf(step),trace=mode==='propagation'?'T-server':'T-browser';
 const all=[{id:'browser',name:'HTTP request',trace:'T-browser',parent:null,scope:'browser-http',kind:'automatic'},{id:'server',name:'HTTP server',trace,parent:mode==='propagation'?null:'browser',scope:'fastapi-http',kind:'automatic'}];
 if(mode==='manual')all.push({id:'validate',name:'validate-order',trace,parent:'server',scope:'orders-business',kind:'manual'});
 if(mode==='duplicate')all.push({id:'server-copy',name:'HTTP server duplicate wrapper',trace,parent:'server',scope:'second-http-wrapper',kind:'duplicate'});
 return{step:s,mode,service,environment,businessRequests:s?1:0,businessResult:s>=2?'accepted':'pending',spans:s?all:[],resource:{'service.name':service,'deployment.environment.name':environment},stage:s===0?'not-started':s===1?'recorded':s===2?'processor':'collector',collectorReceived:s===3?all.length:0};
}
export const sampleFixture=Object.freeze(Array.from({length:10},(_,i)=>Object.freeze({id:i+1,error:[4,9].includes(i+1)})));
export function samplingFrame(step=0,mode='head'){
 const s=stepOf(step),ids=mode==='tail'?[1,4,9]:[1,2,3],decisionReady=mode==='head'?s>=1:s>=2;
 const items=sampleFixture.map(x=>({...x,outcomeKnown:s>=2,status:!s?'not-started':!decisionReady?'waiting':ids.includes(x.id)?'retained':'dropped'}));
 const selected=decisionReady?items.filter(x=>x.status==='retained'):[],selectedErrors=s>=2?selected.filter(x=>x.error).length:null;
 return{step:s,mode,items,decisionReady,retained:selected.length,dropped:decisionReady?10-selected.length:0,waiting:s&&!decisionReady?10:0,totalErrors:s>=2?2:null,selectedErrors,selectedErrorRate:selectedErrors===null||!selected.length?null:selectedErrors/selected.length,totalErrorRate:s>=2?.2:null};
}
export function deliveryFrame(step=0,{capacity=3,mode='recovery'}={}){
 const s=stepOf(step),cap=capacity===5?5:3,generated=s?5:0;let attempts=0;
 const items=Array.from({length:generated},(_,i)=>{const id=i+1;if(id>cap)return{id,state:'dropped',copies:0,reason:'queue-full'};
  let state='pending',copies=0;
  if(s>=2){attempts++;if(mode==='ack-loss')copies=1;}
  if(s>=3){attempts++;if(mode==='timeout'){state='dropped';return{id,state,copies,reason:'retry-limit'};}copies++;state='acknowledged';}
  return{id,state,copies,reason:state==='pending'?(s>=2?'retry-wait':'queued'):'acknowledged'};});
 const pending=items.filter(x=>x.state==='pending').length,acknowledged=items.filter(x=>x.state==='acknowledged').length,dropped=items.filter(x=>x.state==='dropped').length;
 return{step:s,capacity:cap,mode,generated,items,pending,acknowledged,dropped,attempts,receiverUnique:items.filter(x=>x.copies>0).length,receiverCopies:items.reduce((n,x)=>n+x.copies,0),conserved:generated===pending+acknowledged+dropped};
}

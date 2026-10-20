// View projections only: every status/value comes from the chapter observation frame.
// These diagrams do not execute commands, forecast timings, or certify unobserved systems.
export function resourceAxis(resource, unit) {
 const maximum = unit === 'm' ? 3000 : 3072;
 if ([resource.assigned,resource.proposed,resource.used,resource.allocatable].some(x=>x<0||x>maximum)) throw new RangeError('자원 비교축 범위 밖');
 return {maximum,capacity:resource.allocatable,capacityPercent:resource.allocatable/maximum*100,
  bars:['assigned','proposed','used'].map(key=>({key,value:resource[key],percent:resource[key]/maximum*100}))};
}
export function configurationFlow(f) {
 const token=value=>({value,version:value.endsWith('v2')?2:1});
 const source=token(f.source),delivered=token(f.delivered),app=token(f.app);
 return {source,delivered,app,deliveryCurrent:source.version===delivered.version,readCurrent:delivered.version===app.version,
  old:{version:1,label:'최초 값 v1'},pod:f.pod,process:f.process,image:f.image};
}
export function storageBoundaries(f) {
 return {pod:f.pod==='없음'||f.pod==='교체 중'?'removed':f.pod.includes('마지막 기록')?'unknown':'present',
 container:f.container==='없음'||f.container==='재시작 대기'?'removed':f.container==='관측 불가'?'unknown':'present',mount:f.mount};
}
export function clusterDiagram(f,path) {
 const controlNodes=[
  {id:'operator',label:'운영자 · kubectl',detail:'명세 요청',row:1,col:1,kind:'client'},
  {id:'api',label:'API server',detail:'요청 검사 · 상태 저장',row:2,col:1,span:3,kind:'api'},
  {id:'controller',label:'controller',detail:'관찰 · 필요한 객체 기록',row:2,col:2,kind:'controller'},
  {id:'scheduler',label:'scheduler',detail:'Pod의 노드 배정 기록',row:3,col:2,kind:'controller'},
  {id:'kubelet',label:'kubelet',detail:'배정 상태 관찰 · 실행 관리',row:4,col:2,kind:'process'},
  {id:'runtime',label:'runtime',detail:'CRI 요청으로 컨테이너 실행',row:5,col:2,kind:'process'},
  {id:'app',label:'study-web Pod',detail:'앱 컨테이너 :8080',row:6,col:2,kind:'pod'},
 ];
 const httpNodes=[{id:'browser',label:'웹 사용자',detail:'앱 HTTP 요청',row:1,col:1,kind:'client'},
  {id:'entry',label:'Ingress controller',detail:'외부 진입 · Service 대상 선택',row:2,col:1,kind:'process'},
  {id:'app',label:'study-web Pod',detail:'Service :80 → targetPort :8080',row:3,col:1,kind:'pod'}];
 const pairs=path==='http'?[['browser','entry'],['entry','app']]:[['operator','api'],['controller','api'],['scheduler','api'],['api','kubelet'],['kubelet','runtime'],['runtime','app']];
 const activePairs=(f.edge??[]).slice(1).map((id,i)=>[f.edge[i],id]);
 return {nodes:(path==='http'?httpNodes:controlNodes).map(n=>({...n,active:f.active.includes(n.id)})),
  edges:pairs.map(([from,to])=>{const active=activePairs.find(([a,b])=>a===from&&b===to||a===to&&b===from);return {id:`${from}-${to}`,from:active?.[0]??from,to:active?.[1]??to,active:!!active,bidirectional:path==='control'&&['controller','scheduler','api'].includes(from)&&to==='api',label:path==='http'?'HTTP 연결':'제어 관계'};}),
  columns:path==='http'?1:2,denied:f.outcome==='denied'};
}
export function helmFieldLinks(f) {
 const names=[['replicas','Deployment.spec.replicas','Pod 개수'],['image','Deployment.spec.template → image','Pod template'],['message','ConfigMap.data.APP_MESSAGE','별도 설정 객체']];
 const original=f.before;
 return names.map(([key,destination,scope])=>({key,destination,scope,target:f.target[key],before:original?.[key]??null,live:f.live?.[key]??null,rendered:!!f.yaml,changed:!!original&&original[key]!==f.target[key]}));
}
export function helmRevisionTracks(frames,index) {
 return frames.slice(0,index+1).map((f,i)=>({step:i+1,title:f.title,helm:f.history.at(-1)?.revision??null,deployment:f.deploymentRevision,phase:f.phase}));
}
export function recoveryCoverage(scenario,f) {
 return [{id:'api',material:'datastore + 원래 token',available:scenario!=='no-token',target:'API 객체 · PVC 연결 기록',state:f.api,contents:['명세','연결 기록'],excluded:'PV의 파일 바이트는 포함하지 않음'},
 {id:'pv',material:'PV 파일의 별도 사본',available:scenario!=='no-pv',target:'디스크의 파일 바이트',state:f.pv,contents:['메모 A','앱 파일'],excluded:'API·마운트·권한은 별도 확인'},
 {id:'db',material:'외부 DB의 별도 백업',available:null,target:'외부 DB',state:f.externalDb,contents:['외부 DB 데이터'],excluded:'위 두 백업의 복원 범위 밖'}];
}
export function airgapTrustPaths() {
 return [
 {id:'registry',caller:'노드 runtime',target:'내부 registry',trust:'노드 runtime의 registry CA',checks:['노드 DNS','노드 시각','인증 · mirror · proxy'],purpose:'이미지 pull',after:'이미지를 제공하는 원격 저장소 · 실행 노드 저장소와 별개'},
 {id:'browser',caller:'사용자 브라우저',target:'호스트 NGINX',trust:'브라우저 trust store',checks:['사용자 기기 DNS','사용자 기기 시각','요청 이름 · 인증서 SAN'],purpose:'외부 HTTPS',after:'NGINX가 내부 controller로 별도 연결'},
 {id:'proxy',caller:'호스트 NGINX',target:'Ingress controller',trust:'NGINX의 upstream CA',checks:['NGINX의 이름 조회','NGINX 호스트 시각','upstream 검증 · SNI'],purpose:'내부 HTTPS를 선택한 경우',after:'HTTP를 선택하면 이 구간 TLS는 없음'},
 {id:'database',caller:'Pod 안의 앱',target:'외부 DB',trust:'앱의 trust store',checks:['Pod DNS','앱이 보는 시각','라우팅 · 방화벽 · DB 권한'],purpose:'DB TLS 연결',after:'이미지 pull 성공과 독립'},
 ];
}
export function serviceDiagram(f) {
 const nodes=[{id:'service',label:`Service ${f.service.name}`,detail:`namespace ${f.service.namespace} · app=${f.service.selector}`,row:1,col:1,span:f.pods.length,kind:'api'}];
 const edges=[];
 f.pods.forEach((p,i)=>{const selected=f.endpoints.some(e=>e.uid===p.uid),eligible=f.eligible.some(e=>e.uid===p.uid);
  nodes.push({id:p.uid,label:p.uid,detail:`${p.namespace} · app=${p.label} · ${p.ip} · listen :${p.listenPort} · ${selected?(eligible?'✓ ready · 전달 후보':'○ ready=false · 전달 제외'):'× 선택 범위 밖'}`,row:i+1,col:2,kind:p.namespace!==f.service.namespace?'outside':'pod',active:p.uid===f.result.selectedUid});
  if(selected)edges.push({id:`service-${p.uid}`,from:'service',to:p.uid,label:'selector가 선택한 주소 기록',active:eligible});
 });
 return {nodes,edges,columns:2};
}
export function tlsSegments(f) {
 const proxy=f.mode==='host-http'||f.mode==='host-tls';
 return proxy?[
  {id:'outer',label:'외부 TLS',verifier:'브라우저가 NGINX 인증서 검증',terminator:f.outer.terminator,status:f.outer.status,hops:f.hops.slice(0,2),encrypted:true},
  {id:'inner',label:f.mode==='host-tls'?'별도 내부 TLS':'새 HTTP 연결',verifier:f.mode==='host-tls'?'NGINX가 controller 인증서 검증':'NGINX → NodePort · TLS 없음',terminator:f.inner.terminator,status:f.inner.status,hops:f.hops.slice(2,3),encrypted:f.mode==='host-tls'},
  {id:'backend',label:'내부 HTTP',verifier:'controller → ready 대상 앱',terminator:'TLS 없음',status:'none',hops:f.hops.slice(3),encrypted:false},
 ]:[
  {id:'outer',label:'외부 TLS',verifier:'브라우저가 controller 인증서 검증',terminator:f.outer.terminator,status:f.outer.status,hops:f.hops.slice(0,3),encrypted:true},
  {id:'backend',label:'내부 HTTP',verifier:'controller → ready 대상 앱',terminator:'TLS 없음',status:'none',hops:f.hops.slice(3),encrypted:false},
 ];
}
export function desiredSlots(frames,index) {
 const seen=[...new Set(frames.slice(0,index+1).flatMap(f=>f.pods.map(p=>p.uid)))];
 return seen.map(uid=>({uid,pod:frames[index].pods.find(p=>p.uid===uid)??null}));
}
export function probeEvents(frames,index) {
 return frames.slice(0,index+1).map((f,i)=>({step:i+1,title:f.title,ready:f.ready,restarts:f.restarts,targets:f.targets.length,container:f.container}));
}

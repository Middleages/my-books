// Deterministic teaching observations, not Kubernetes controller timing or a cluster emulator.
const rs = 'study-web-rs1';
const pod = (uid, ready = true, state = 'Running') => ({uid, owner:rs, ready, state, restarts:0, node:state==='Pending'?null:'node-1'});
const copy = x => structuredClone(x);
export function desiredFrames({event='delete',target=3}={}) {
 if(!['delete','restart','scale','node','vm'].includes(event)) throw new RangeError('Unknown event');
 if(!Number.isInteger(target)||target<0||target>4) throw new RangeError('Replicas must be an integer from 0 to 4');
 let pods=[pod('pod-a'),pod('pod-b')], desired=2, controlUp=true, nodeUp=true, observation='current';
 const frames=[];
 const push=(title,detail)=>frames.push({title,detail,desired,current:pods.length,ready:pods.filter(p=>p.ready).length,pods:copy(pods),deployment:'study-web',replicaSet:rs,controlUp,nodeUp,observation});
 push('처음에는 둘 모두 준비됨','Deployment의 replicas=2. ReplicaSet이 관리하는 Pod 두 개가 Running이며 Ready입니다.');
 if(event==='delete') {
  pods=pods.slice(1);push('Pod A 삭제가 반영됨','Pod A는 사라졌지만 원하는 개수는 여전히 2입니다. 삭제 요청·종료 유예가 끝난 뒤를 관찰합니다.');
  pods=[pod('pod-c',false,'Pending'),...pods];push('ReplicaSet이 부족한 하나를 생성','새 Pod C는 UID가 다릅니다. API 객체가 생긴 것과 실행 준비가 된 것은 다릅니다.');
  pods[0].state='Running';pods[0].node='node-1';push('새 컨테이너 실행, 준비는 아직','노드 배정과 이미지 준비가 성공했다고 가정합니다. Running이어도 Ready는 아닐 수 있습니다.');
  pods[0].ready=true;push('다시 둘이 준비됨','Ready가 된 새 Pod C가 자리를 채웠습니다. Pod A를 되살리거나 같은 UID로 옮긴 것이 아닙니다.');
 } else if(event==='restart') {
  pods[0].ready=false;pods[0].state='재시작 대기';push('Pod A 안의 컨테이너 종료','Pod A 객체와 UID는 남아 있습니다. 실제 컨테이너 상태와 Pod phase는 다른 개념이며 여기서는 컨테이너 관측 상태를 요약합니다.');
  pods[0].restarts=1;pods[0].state='시작 중';push('kubelet이 컨테이너를 다시 시작','restartPolicy=Always, 정상 노드·runtime·이미지를 가정합니다. 새 Pod를 만드는 동작이 아닙니다.');
  pods[0].state='Running';push('실행됨, 아직 준비 중','UID는 pod-a 그대로, 재시작 횟수만 1입니다. readiness 성공 전까지 준비 수는 하나입니다.');
  pods[0].ready=true;push('같은 Pod가 다시 준비됨','일회성 오류가 해소됐다는 가정입니다. 반복 실패·backoff·원인 해결까지 자동 보장하지 않습니다.');
 } else if(event==='scale') {
  desired=target;push('원하는 개수를 변경','Deployment에 요청한 개수가 먼저 바뀝니다. 화면의 현재 Pod 수가 동시에 바뀌는 것은 아닙니다.');
  pods=pods.slice(0,target);
  while(pods.length<target) pods.push(pod(`pod-new-${pods.length+1}`,false,'Pending'));
  push('ReplicaSet이 개수 차이를 조정','늘릴 때 새 UID의 Pod를 만들고, 줄일 때 일부 Pod를 제거합니다. 종료 완료를 가정하며 제거 순서는 교육용 선택입니다.');
  pods.forEach(p=>{p.state='Running';p.node='node-1';});push('배정된 컨테이너 실행','자원이 충분하고 실행에 성공한 경우입니다. 추가된 Pod는 아직 준비되지 않았을 수 있습니다.');
  pods.forEach(p=>p.ready=true);push('요청한 개수로 수렴',target===0?'replicas=0이므로 유지할 Pod가 없습니다. Pod를 지운 것과 원하는 수를 0으로 바꾼 것은 다릅니다.':'모든 실행·준비 조건이 충족된 경우입니다. replicas 요청만으로 성공을 보장하지 않습니다.');
 } else if(event==='node') {
  nodeUp=false;observation='stale';push('실행 노드와 통신 끊김','이 장면은 control plane은 살아 있고 실행 노드만 불가한 조건입니다. 장애 직후 API의 Ready 기록은 이전 관측일 수 있습니다.');
  observation='current';pods.forEach(p=>{p.ready=false;p.state='노드 관측 불가';});push('장애가 감지됨','이 모델은 노드 장애가 반영돼 Ready 대상에서 제외된 이후를 보여 줍니다. Pod 객체가 남아 있어도 앱을 사용할 수 있다는 뜻은 아닙니다.');
  pods=[];push('퇴거와 제거가 처리된 뒤','충분한 대기 후 기존 Pod 제거까지 처리된 사례만 요약합니다. 실제 지연·toleration·종료 정책에 따라 다르며 강제 삭제 안내가 아닙니다.');
  pods=[pod('pod-c',false,'Pending'),pod('pod-d',false,'Pending')];push('대체 Pod도 실행할 곳이 없음','사용 가능한 실행 노드가 없어 새 Pod가 Pending에 남습니다. 원하는 개수 2가 준비된 개수 2를 보장하지 않습니다.');
 } else {
  controlUp=false;nodeUp=false;observation='stale';
  push('단일 VM 전체 종료','control plane과 실행 역할이 함께 멈췄습니다. 아래 수치는 장애 직전 마지막 관측이며 현재 실행 수가 아닙니다.');
  push('API 새 관측 없음','API에 접근할 수 없으므로 현재 상태를 조회하거나 새 요청을 반영할 수 없습니다.');
  push('조정 루프도 중단','이 VM 안의 controller는 새 Pod를 만들 수 없습니다. replicas를 늘려 둔 것만으로 VM 장애를 버티지 못합니다.');
  push('VM·제어 영역 복구가 먼저','이 화면에 남은 Pod 카드는 마지막 기록입니다. 실제 실행을 확인한 값으로 읽으면 안 됩니다.');
 }
 return frames;
}
const servicePod=(uid,ip,ready=true,namespace='books-lab')=>({uid,ip,ready,namespace,label:'study-web',listenPort:8080});
function serviceObservation(pods,{selector,targetPort,clientNamespace,query}) {
 const namespace='books-lab';
 const name=query==='study-web'?`study-web.${clientNamespace}.svc.cluster.local`:query==='study-web.books-lab'?'study-web.books-lab.svc.cluster.local':query;
 const found=name==='study-web.books-lab.svc.cluster.local';
 const service={name:'study-web',namespace,selector,port:80,targetPort,clusterIP:'10.43.0.80'};
 const endpoints=pods.filter(p=>p.namespace===namespace && p.label===selector).map(p=>({...p,port:targetPort}));
 const eligible=endpoints.filter(p=>p.ready);
 // First eligible is a deterministic illustration, NOT a Kubernetes load-balancing guarantee.
 const selected=eligible[0];
 const destination=found&&selected?`${selected.ip}:${targetPort}`:null;
 let code,reason,next;
 if(!found) {code='dns-miss';reason='이 이름의 Service를 찾지 못함';next='호출 Pod의 namespace와 조회 이름을 확인하세요. 이 예의 other에는 같은 이름의 Service가 없습니다.';}
 else if(!endpoints.length) {code='selector-mismatch';reason='selector와 같은 namespace의 Pod 라벨이 불일치';next='Service selector, Pod label, namespace를 대조하세요.';}
 else if(!eligible.length) {code='not-ready';reason='선택된 Pod는 있지만 ready 대상 0개';next='EndpointSlice의 ready와 Pod 준비 상태를 확인하세요.';}
 else if(targetPort!==selected.listenPort) {code='wrong-port';reason='ready 대상은 있지만 그 포트에 앱이 없음';next='targetPort와 앱의 실제 listen 포트를 대조하세요. Service 설정은 앱의 포트를 바꾸지 않습니다.';}
 else {code='connected';reason='새 연결이 준비된 앱 포트에 도달';next='기존 연결이 새 Pod로 이동하거나 모든 HTTP 업무가 성공한다는 보장은 아닙니다.';}
 return {service,dns:{name,found,address:found?service.clusterIP:null},endpoints,eligible,result:{code,reason,next,destination,selectedUid:found&&selected?selected.uid:null}};
}
export function serviceFrames({selector='study-web',targetPort=8080,ready=true,clientNamespace='books-lab',query='study-web'}={}) {
 const options={selector,targetPort,clientNamespace,query};
 const a=servicePod('pod-a','10.42.0.12',ready), b=servicePod('pod-b','10.42.0.13',ready), other=servicePod('pod-other','10.42.1.9',true,'other');
 const states=[
  ['교체 전 · Pod A와 B',`Service는 books-lab에서 app=${selector} 라벨을 찾습니다. 다른 namespace의 같은 라벨은 선택하지 않습니다.`,[a,b,other]],
  ['Pod A 제거가 반영됨','EndpointSlice와 전달 규칙이 갱신된 뒤의 관찰입니다. B가 남아 있어도 selector·준비·DNS·포트 조건에 따라 연결 결과는 다릅니다.',[b,other]],
  ['새 Pod C · 아직 준비 중',selector==='study-web'?'새 UID·예시 IP를 가진 C는 선택됐지만 ready=false입니다. EndpointSlice에 기록된 것과 전달 가능한 것은 다릅니다.':'새 UID·예시 IP를 가진 C도 selector와 라벨이 달라 선택되지 않습니다. 따라서 EndpointSlice에 C의 주소가 기록되지 않습니다.',[servicePod('pod-c','10.42.0.23',false),b,other]],
  ['준비 상태 갱신','C의 준비 결과까지 반영합니다. 준비 조건을 실패로 선택했다면 C와 B 모두 전달 대상에서 빠집니다.',[servicePod('pod-c','10.42.0.23',ready),b,other]],
  ['Service 이름으로 새 연결','DNS → Service 주소·port → ready 대상의 targetPort를 차례로 점검합니다. 기존 연결의 이전을 재현하지 않습니다.',[servicePod('pod-c','10.42.0.23',ready),b,other]],
 ];
 return states.map(([title,detail,pods])=>{
  const observation=serviceObservation(pods,options);
  return {title,detail:`${detail} 이 상태의 새 연결 관찰: ${observation.result.reason}.`,pods:copy(pods),clientNamespace,query,...observation};
 });
}

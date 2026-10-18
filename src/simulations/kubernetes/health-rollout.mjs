import { resourceFrames } from './storage-resources.mjs';
const clone = value => structuredClone(value);
const targets = pods => pods.filter(p => p.ready).map(p => p.uid);
function integer(value, min, max) { if (!Number.isInteger(value) || value < min || value > max) throw new RangeError('교육 모델 입력 범위 밖'); }

// Observation sequence, NOT a wall clock or a kubelet scheduling implementation.
export function probeFrames({scenario='readiness', threshold=2, dbInLiveness=false}={}) {
 integer(threshold,1,3);
 if(!['readiness','liveness','startup-timeout','db'].includes(scenario)) throw new RangeError('Unknown scenario');
 const frames=[];
 let ready=false,restarts=0,dbUp=true,container='container-1';
 const makeProbe=()=>({status:'대기',failures:0,threshold});
 let startup=makeProbe(),liveness=makeProbe(),readiness=makeProbe();
 const push=(title,detail)=>frames.push({title,detail,tick:frames.length,pod:'pod-a',container,restarts,ready,dbUp,targets:targets([{uid:'pod-a',ready}]),startup:clone(startup),liveness:clone(liveness),readiness:clone(readiness)});
 const sample=(probe,ok)=>{probe.status=ok?'성공':'실패';probe.failures=ok?0:probe.failures+1;};
 const restart=()=>{
  restarts++;container=`container-${restarts+1}`;ready=false;
  startup=makeProbe();liveness=makeProbe();readiness=makeProbe();
  push('같은 Pod에서 새 컨테이너 시작','restartPolicy=Always, 정상 runtime·이미지와 종료 완료를 가정합니다. Pod UID는 pod-a 그대로입니다. 새 컨테이너에서는 startup부터 다시 검사합니다. 종료 유예·backoff의 실제 시간은 생략합니다.');
 };
 push('컨테이너 실행 · 아직 준비 전','startup 검사가 시작되기 전입니다. 일반 컨테이너 하나와 readiness probe를 사용하므로 아직 ready 대상이 아닙니다.');
 const startupFailures=scenario==='startup-timeout'?threshold:Math.min(1,threshold-1);
 for(let i=0;i<startupFailures;i++){
  sample(startup,false);push('startup 실패 관측',`시작 검사 연속 실패 ${startup.failures}/${threshold}. liveness와 readiness는 아직 실행하지 않습니다.${startup.failures===threshold?' 실패 임계값에 도달해 컨테이너 종료·재시작 대상이 됩니다.':''}`);
 }
 if(scenario==='startup-timeout'){restart();return frames;}
 sample(startup,true);push('startup 성공','시작 검사는 이 컨테이너에서 끝났습니다. 이후 liveness와 readiness 검사를 허용합니다. startup 성공만으로 요청을 보낼 준비까지 판정하지 않습니다.');
 sample(liveness,true);sample(readiness,true);ready=true;
 push('생존·준비 검사 성공','앱의 준비 검사도 성공했습니다. ready 상태와 전달 규칙 반영이 완료된 관찰에서 Service의 새 요청 대상은 pod-a입니다.');
 if(scenario==='db')dbUp=false;
 for(let i=0;i<threshold;i++){
  const liveOk=scenario!=='liveness'&&!(scenario==='db'&&dbInLiveness);
  sample(liveness,liveOk);sample(readiness,false);
  if(readiness.failures>=threshold)ready=false;
  push(scenario==='db'?'외부 DB 응답 없음':'실패 횟수 관찰',`readiness 연속 실패 ${readiness.failures}/${threshold}, liveness 연속 실패 ${liveness.failures}/${threshold}. ${ready?'아직 준비 실패 임계값 전이므로 이전 Ready 판정을 유지합니다.':'준비 실패 판정으로 새 요청의 ready 대상에서 제외됩니다.'} ${liveness.failures>=threshold?'생존 검사도 임계값에 도달해 컨테이너 재시작 대상입니다.':'readiness 실패 자체는 재시작 명령이 아닙니다.'}`);
 }
 if(liveness.failures>=threshold){
  restart();sample(startup,true);push('재시작 후 startup 성공','새 컨테이너의 시작은 끝났습니다. 외부 의존성 복구와는 다른 관찰입니다.');
  sample(liveness,!(scenario==='db'&&dbInLiveness));sample(readiness,scenario!=='db');ready=scenario!=='db';
  push('재시작 뒤 다시 관측',scenario==='db'?'DB는 여전히 중단돼 준비 실패입니다. 컨테이너를 재시작해도 DB를 복구하지 못하며 같은 검사가 계속되면 재시작이 반복될 수 있습니다.':'일회성 앱 멈춤이 해소된 사례입니다. 생존·준비 검사 성공 후 요청 대상에 다시 포함됩니다. 재시작만으로 모든 장애 해결을 보장하지 않습니다.');
 } else if(scenario==='readiness'){
  sample(liveness,true);sample(readiness,true);ready=true;
  push('준비 회복 · 재시작 없음','successThreshold=1이므로 한 번의 준비 성공으로 다시 Ready입니다. 연속 실패 횟수는 0이 되고 같은 컨테이너가 요청 대상에 복귀합니다.');
 }else push('앱은 유지 · DB 복구 대기','외부 DB 장애가 계속됩니다. 앱 자체 생존 검사는 성공하며 재시작 없이 준비되지 않은 상태로 기다립니다. DB와 연결 경로를 별도로 조사해야 합니다.');
 return frames;
}

export function rolloutFrames({scenario='normal',surge=1,unavailable=0,rollback=false}={}) {
 integer(surge,0,2);integer(unavailable,0,2);
 if(surge+unavailable===0)throw new RangeError('두 값이 동시에 0일 수 없습니다.');
 if(!['normal','bad-ready','capacity'].includes(scenario))throw new RangeError('Unknown scenario');
 const desired=2,backgroundCpu=scenario==='capacity'?1000:500,minReady=desired-unavailable;
 let target='v1',serial=2,pods=[{uid:'v1-1',version:'v1',ready:true,state:'Running'},{uid:'v1-2',version:'v1',ready:true,state:'Running'}];
 const frames=[];
 const assignedCpu=()=>backgroundCpu+pods.filter(p=>p.state!=='Pending').length*500;
 const group=version=>({count:pods.filter(p=>p.version===version).length,ready:pods.filter(p=>p.version===version&&p.ready).length});
 const push=(title,detail,result='progress')=>frames.push({title,detail,result,target,desired,surge,unavailable,minReady,backgroundCpu,assignedCpu:assignedCpu(),allocatableCpu:2000,podRequestCpu:500,pods:clone(pods),old:group('v1'),new:group('v2'),ready:targets(pods).length,targets:targets(pods),externalState:'DB/PVC 변경은 별도 상태'});
 push('v1 두 개로 서비스 중','Deployment의 목표 replicas는 2입니다. v1 ReplicaSet의 두 Pod가 모두 준비됐습니다.');
 target='v2';
 push('Pod template을 v2로 변경','이후 두 ReplicaSet의 개수를 조정합니다. v1/v2는 학습 라벨이며 실제 이미지 태그나 Deployment revision 번호가 아닙니다.');
 const converge=()=>{
  for(let step=0;step<40;step++){
   const wanted=pods.filter(p=>p.version===target),other=pods.filter(p=>p.version!==target);
   if(wanted.length===desired&&wanted.every(p=>p.ready)&&!other.length){push('목표 버전 교체 완료',`${target} 두 Pod가 준비됐습니다. 이전 버전 Pod는 없지만 ReplicaSet 이력 객체가 반드시 삭제됐다는 뜻은 아닙니다. 요청 전체 성공·DB 복구는 별도입니다.`,'complete');return;}
   const pending=wanted.find(p=>p.state==='Pending');
   if(pending){
    // Reuse chapter 08 CPU+memory requests gate; quota/other predicates are assumed normal.
    const fit=resourceFrames({existingCpu:assignedCpu(),requestCpu:500,existingMemory:512+pods.filter(p=>p.state!=='Pending').length*256}).at(-1);
    if(fit.outcome==='running'){pending.state='Running';push('새 Pod에 노드 배정 · 실행','08장과 같이 배치된 requests에 500m/256Mi를 더해 심사했습니다. 컨테이너 실행과 Ready는 별개입니다.');continue;}
   }
   const running=wanted.find(p=>p.state==='Running'&&!p.ready&&!p.checked);
   if(running){running.checked=true;running.ready=!(target==='v2'&&scenario==='bad-ready');push(running.ready?'새 버전 준비 성공':'새 버전 준비 실패',running.ready?'readiness 성공, minReadySeconds=0 조건으로 교체에 사용할 준비 수가 늘어납니다.':'Running이지만 ready=false입니다. readiness 실패 자체로 재시작하거나 v1으로 자동 되돌리지 않습니다.');continue;}
   // Prefer removal of an unhealthy old target during explicit rollback.
   const removable=other.find(p=>!p.ready)|| (targets(pods).length>minReady?other[0]:undefined);
   if(removable){pods=pods.filter(p=>p!==removable);push('기존 목표 밖의 Pod 하나 제거',`${removable.uid}의 종료 완료를 관찰합니다. 준비된 Pod 제거는 최소 ${minReady}개를 남길 수 있을 때만 진행합니다. 노드 requests 몫도 이 시점에 해제됐다고 가정합니다.`);continue;}
   if(wanted.length<desired&&pods.length<desired+surge){const uid=`${target}-${++serial}`;pods.push({uid,version:target,ready:false,state:'Pending'});push('ReplicaSet이 새 Pod 생성',`${uid}가 생성됐습니다. 전체 ${pods.length}/${desired+surge}개. Pending은 노드 requests 배정 전이며 아직 요청 대상이 아닙니다.`);continue;}
   push('교체 진행 멈춤',pending?'새 Pod가 Pending입니다. 낮은 실사용량이 requests 빈자리를 만들지는 않습니다. 기존 Pod를 더 줄일 여유도 현재 정책에 없습니다.':'새 버전이 준비되지 않아 정책 안에서 더 교체할 수 없습니다. 실제 progressDeadlineSeconds 초과는 상태 보고이며 자동 rollback 명령이 아닙니다.','stalled');return;
  }
  throw new Error('Rollout observation did not converge');
 };
 converge();
 if(rollback){target='v1';push('사용자가 v1 template 복원을 요청','명시적 rollback입니다. 이전 Pod를 되살리는 것이 아니라 이전 template의 ReplicaSet을 다시 조정합니다. DB/PVC·외부 설정 데이터는 이 동작으로 복원하지 않습니다.','rollback-requested');converge();}
 return frames;
}

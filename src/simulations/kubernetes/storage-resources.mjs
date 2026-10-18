// Deterministic teaching observations. No cluster calls, scheduler or cgroup emulation.
export function storageFrames({event='restart',reclaim='Delete'}={}) {
 const labels=['writable layer','emptyDir · 디스크형','PVC로 연결한 local-path 데이터'];
 const paths=['/app/note.txt','/scratch/note.txt','/data/note.txt'];
 const titles=['세 곳에 같은 메모 저장','사건 발생','수명 경계 처리','남은 데이터와 접근 확인'];
 return titles.map((title,i)=>{
  let pod='pod-a',container='container-1',pvc='Bound',pv='Bound',node='node-a · 정상',readable=true;
  let states=['present','present','present'];
  let detail='서로 다른 세 경로에 메모 A를 썼습니다. PVC/PV는 연결 정보이고 실제 바이트는 node-a 디스크에 있습니다.';
  if(i>0){
   if(event==='restart'){
    container=i===1?'재시작 대기':'container-2';states[0]='lost';readable=i>1;
    detail=i===1?'컨테이너가 종료됐습니다. 새 컨테이너의 쓰기 계층으로 이전 메모를 가져오지 않습니다.': '같은 pod-a 안에 새 컨테이너가 실행됩니다. emptyDir와 PVC의 메모 A는 남고 writable layer의 메모는 없습니다.';
   }else if(event==='replace'){
    pod=i===1?'교체 중':'pod-b';container=i===1?'없음':'container-2';states=['lost','lost','present'];readable=i>1;
    detail=i===1?'이전 Pod를 제거했습니다. emptyDir 수명도 끝났습니다. PVC는 삭제하지 않습니다.':'같은 정상 노드에서 새 pod-b가 기존 PVC를 다시 마운트했습니다. /data의 메모 A만 이어집니다. 새 emptyDir와 쓰기 계층은 비어 있습니다.';
   }else if(event==='offline'||event==='disk-loss'){
    const lost=event==='disk-loss';states=Array(3).fill(lost?'lost':'unavailable');readable=false;node=lost?'node-a · 디스크 영구 상실':'node-a · 접근 불가';pod='pod-a · 마지막 기록';container='관측 불가';pvc=pv='Bound · 마지막 기록';
    detail=lost?'노드의 실제 디스크가 영구 상실된 조건입니다. 같은 디스크의 세 복사본 모두 복구할 수 없습니다. API의 Bound 기록이나 Retain 정책은 데이터를 복제하지 않습니다.':'노드에 접근할 수 없습니다. 읽을 수 없다는 사실만으로 디스크 데이터가 지워졌다고 단정하지 않습니다. 단일 VM에서는 API도 멈출 수 있어 객체는 마지막 기록으로 표시합니다. 노드 복구·백업을 별도로 확인해야 합니다.';
   }else if(event==='delete-pvc'){
    if(i===1){pvc='Terminating · 사용 중 보호';detail='PVC 삭제를 요청했지만 사용하는 Pod가 있어 보호됩니다. 이 단계에서 PVC 데이터가 즉시 삭제됐다고 표시하지 않습니다.';}
    else {pod='없음';container='없음';pvc='삭제됨';readable=false;states=['lost','lost','present'];pv='Released';
     detail='사용하던 Pod를 먼저 제거하고 PVC 삭제가 완료된 뒤의 관찰입니다. 파일 접근 경로는 끊겼습니다.';
     if(i===3&&reclaim==='Delete'){pv='삭제됨';states[2]='lost';detail='Delete 정책과 정상 provisioner 정리가 완료된 조건입니다. PV와 해당 디렉터리의 메모 A가 제거됩니다. 삭제 요청 즉시 완료되는 것으로 해석하지 마세요.';}
     if(i===3&&reclaim==='Retain')detail='Retain 정책으로 PV는 Released, 디스크의 메모 A는 남습니다. 새 PVC를 같은 이름으로 만든다고 자동 복구되지 않습니다. 관리자의 확인·재연결 절차가 필요합니다.';
    }
   }
  }
  const binding=pvc==='삭제됨'?'none':pvc.includes('마지막 기록')?'last-known':'bound';
  const mount=container==='관측 불가'?'unknown':readable?'mounted':'unmounted';
  return {title,detail,event,reclaim,pod,container,pvc,pv,node,readable,binding,mount,files:labels.map((label,n)=>({label,path:paths[n],state:states[n],value:states[n]==='present'?'메모 A':states[n]==='lost'?'기존 메모 없음':'존재 여부 관측 불가'}))};
 });
}
function bounded(value,min,max){if(!Number.isFinite(value)||value<min||value>max)throw new RangeError('교육 모델 입력 범위 밖');return value;}
export function resourceFrames({existingCpu=1800,requestCpu=500,existingMemory=512,quotaCpu=4000,load='normal'}={}) {
 bounded(existingCpu,500,2000);bounded(requestCpu,100,1000);bounded(existingMemory,512,2048);bounded(quotaCpu,500,4000);
 const cpuTotal=existingCpu+requestCpu,memTotal=existingMemory+256;
 const admitted=500+requestCpu<=quotaCpu, fits=cpuTotal<=2000&&memTotal<=2048;
 const reason=!admitted?'namespace requests.cpu quota 초과':!fits?(cpuTotal>2000?'노드 CPU requests 부족':'노드 메모리 requests 부족'):'배치 가능';
 const titles=['명세와 빈 공간을 따로 보기','namespace quota 심사','노드에 requests로 배치','실행 중 부하 관찰','관측 결과와 다음 확인'];
 return titles.map((title,i)=>{
  const scheduled=i>=2&&admitted&&fits;
  const running=i>=3&&scheduled;
  const oom=running&&load==='memory'&&i===4;
  const cpuDemand=running?(load==='cpu'?1500:300):0;
  const memoryDemand=running?(load==='memory'?768:128):0;
  const actualCpu=running&&!oom?Math.min(cpuDemand,1000):0;
  // Example measured working set during pressure, not a formula for kernel accounting.
  const actualMemory=running&&!oom?(load==='memory'?500:128):0;
  const outcome=i===0?'draft':!admitted?'rejected':i===1?'accepted':!fits?'pending':i===2?'scheduled':oom?'oom':load==='memory'?'pressure':load==='cpu'?'throttled':'running';
  const detail={draft:'파란 막대는 배치된 기존 앱의 requests, 초록 막대는 실제 사용량입니다. 새 앱의 requests가 들어갈 자리를 예상하세요. CPU 1000m = 1 CPU입니다.',accepted:'books-lab의 기존 requests.cpu 500m에 새 요청을 더해 quota 안에 들어왔습니다. 아직 노드 배치에 성공한 것은 아닙니다.',rejected:`${reason}. Pod 생성 요청이 거절됩니다. Pending Pod가 생성된 상황과 다릅니다. 노드에 여유가 있어도 별개입니다.`,pending:`${reason}. 생성된 Pod는 Pending입니다. 낮은 실제 사용량을 보고 requests 대신 빈자리를 계산하지 않습니다. 이 Pending Pod도 namespace quota를 사용합니다.`,scheduled:'CPU·메모리 requests가 모두 allocatable에 들어와 노드에 배치됐습니다. 여기서는 이미지·마운트·다른 시작 조건이 정상이라고 가정합니다.',running:'가상 관측에서 CPU 300m와 메모리 128Mi를 사용합니다. requests는 배치 기준이고 limits·실사용량과 같은 숫자일 필요가 없습니다.',throttled:'CPU 수요 1500m가 limit 1000m를 넘습니다. 충분한 노드 CPU 여유를 전제로 1000m까지 실행 기회를 받고 나머지는 기다립니다. CPU limit 초과만으로 OOM 종료시키지 않습니다.',pressure:'메모리 768Mi를 요구하는 상황입니다. 현재 관측 사용량은 500Mi, limit은 512Mi입니다. 수요와 실제 할당은 다릅니다. 이 단계는 압박 관측이며 초과 요구만으로 즉시 종료를 확정하지 않습니다.',oom:'이 시나리오는 다음 관측에서 커널 OOM 종료가 확인된 사례를 선택했습니다. 종료 직후 사용량은 0으로 표시하지만 Pod의 requests 배치 몫은 남습니다. 실제 종료 시점·재시작 시간은 재현하지 않습니다.'}[outcome];
  return {title,detail,outcome,reason,load,node:{cpu:{allocatable:2000,assigned:existingCpu+(scheduled?requestCpu:0),proposed:cpuTotal,used:100+actualCpu},memory:{allocatable:2048,assigned:existingMemory+(scheduled?256:0),proposed:memTotal,used:256+actualMemory}},quota:{limit:quotaCpu,before:500,proposed:500+requestCpu,used:500+(i>=1&&admitted?requestCpu:0)},cpu:{request:requestCpu,limit:1000,demand:cpuDemand,actual:actualCpu},memory:{request:256,limit:512,demand:memoryDemand,actual:actualMemory,oom}};
 });
}

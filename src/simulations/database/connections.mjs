// Fixed, synthetic direct-driver schedules. No real pool, SQL or wall clock runs.
const frozen = value => { if (value && typeof value === 'object') { Object.freeze(value); for (const child of Object.values(value)) frozen(child); } return value; };
const copy = value => JSON.parse(JSON.stringify(value));
const validateOptions=(options,keys)=>{if(!options||typeof options!=='object'||Array.isArray(options)||Object.getPrototypeOf(options)!==Object.prototype)throw new TypeError('Options must be a plain object');if(Object.keys(options).some(k=>!keys.includes(k)))throw new RangeError('Unknown option');return options;};

const choice = (value, values, label) => { if (!values.includes(value)) throw new RangeError(`Unknown ${label}: ${value}`); return value; };
export const POOL_SIZES = frozen([1, 2]);
export const POOL_SCENARIOS = frozen(['normal', 'long-hold', 'leak', 'acquire-failure']);
export const BINDING_MODES = frozen(['pinned', 'split']);
export const CAPACITY_INSTANCES = frozen([1, 3]);
export const CAPACITY_MAXIMA = frozen([2, 4]);

export function poolFrames(input={}) {
  const {size=2,scenario='normal'}=validateOptions(input,['size','scenario']);
  choice(size, POOL_SIZES, 'pool size'); choice(scenario, POOL_SCENARIOS, 'pool scenario');
  const requests = [1,2,3,4].map(n => ({ id: `R${n}`, arrival: 0, status: 'queued', acquiredAt: null, sqlEndedAt: null, completedAt: null, clientId: null, leaseId: null, error: null }));
  const slots = Array.from({length:size},(_,i)=>({id:`P${i+1}`,clientId:null}));
  const clients = [], leases = [], leaseHistory = [], frames = [];
  let tick = 0, leaseSerial = 0;
  const horizon = scenario === 'leak' ? 8 : 12;
  function emit(phase, title, detail, events = []) {
    const queue = requests.filter(r=>r.status==='queued').map(r=>r.id);
    const segments = requests.flatMap(r => {
      const result = [], waitEnd = r.acquiredAt ?? (r.status === 'acquire-error' ? r.completedAt : tick);
      if (waitEnd > 0) result.push({id:`${r.id}:acquire`,requestId:r.id,kind:'acquireWait',start:0,end:waitEnd});
      if (r.acquiredAt !== null && tick > r.acquiredAt) result.push({id:`${r.id}:sql`,requestId:r.id,kind:'dbWork',start:r.acquiredAt,end:Math.min(tick,r.acquiredAt+2)});
      if (r.sqlEndedAt !== null && (r.completedAt ?? tick) > r.sqlEndedAt) result.push({id:`${r.id}:held`,requestId:r.id,kind:'appHeld',start:r.sqlEndedAt,end:r.completedAt ?? tick});
      return result;
    });
    const edges = [
      ...leases.map(l=>({id:`${l.id}:owns`,kind:'lease',from:l.requestId,to:l.clientId,leaseId:l.id})),
      ...clients.map(c=>({id:`${c.id}:session`,kind:'session',from:c.id,to:c.sessionId,leaseId:leases.find(l=>l.clientId===c.id)?.id??null}))
    ];
    frames.push(copy({
      step:frames.length,tick,phase,title,detail,size,scenario,horizon,requests,slots,clients,leases,leaseHistory,queue,segments,edges,events,
      metrics:{queued:queue.length,inUse:leases.length,idle:clients.filter(c=>c.ownerRequestId===null).length,openConnections:clients.length,completed:requests.filter(r=>r.status==='completed').length,failed:requests.filter(r=>r.status==='acquire-error').length},
      invariants:{capacity:leases.length<=size,uniqueOwners:new Set(leases.map(l=>l.clientId)).size===leases.length,noPhantomClient:requests.filter(r=>r.status==='acquire-error').every(r=>r.clientId===null&&r.leaseId===null)},
      finished:phase==='complete'||phase==='observation-end',
      assumptions:['direct node-postgres to PostgreSQL','all four requests arrive at tick0','FIFO in this model','SQL work is2 fictional ticks','negligible connection setup','no idle eviction or network proxy']
    }));
  }
  function dispatch() {
    const events=[];
    for(const slot of slots) {
      let c=clients.find(c=>c.id===slot.clientId);
      if(c?.ownerRequestId) continue;
      const r=requests.find(r=>r.status==='queued'); if(!r) break;
      if(scenario==='acquire-failure'&&r.id==='R1') {
        r.status='acquire-error';r.error='synthetic-acquire-failure';r.completedAt=tick;
        events.push({kind:'acquire-failure',requestId:r.id,clientId:null});
        // Failure creates no client or lease; the next request can try this capacity.
        const retry=dispatch();return [...events,...retry];
      }
      if(!c) {c={id:`C${slot.id.slice(1)}`,sessionId:`S${slot.id.slice(1)}`,slotId:slot.id,ownerRequestId:null};clients.push(c);slot.clientId=c.id;}
      r.status='db-work';r.acquiredAt=tick;r.clientId=c.id;r.leaseId=`L${++leaseSerial}`;c.ownerRequestId=r.id;
      leases.push({id:r.leaseId,requestId:r.id,clientId:c.id,startedAt:tick});
      events.push({kind:'acquire',requestId:r.id,clientId:c.id,leaseId:r.leaseId});
    }
    return events;
  }
  emit('arrive','요청4개, 아직 연결을 빌리기 전','점선 요청은 연결 대기입니다. 빈 용량 칸은 설정 상한이지 이미 열린 연결이 아닙니다.');
  let events=dispatch();
  emit('dispatch',`연결 ${leases.length}개 대여`,scenario==='acquire-failure'?'R1은 연결 획득에 실패했습니다. 사용할 client나 SQL 결과가 없고 ROLLBACK·반환도 하지 않습니다.':'요청→현재 client→DB 세션 선이 생깁니다. 이 작은 모델은 연결 생성 시간을 생략합니다.',events);
  for(tick=1;tick<=horizon;tick++) {
    events=[];
    for(const r of requests) {
      if(r.status==='db-work'&&tick===r.acquiredAt+2) {
        r.sqlEndedAt=tick;
        if(r.id==='R1'&&['long-hold','leak'].includes(scenario)) {
          r.status='app-held';events.push({kind:'sql-end-still-held',requestId:r.id,clientId:r.clientId});
        } else release(r,events);
      } else if(r.status==='app-held'&&scenario==='long-hold'&&tick===6) release(r,events);
    }
    events.push(...dispatch());
    const done=requests.every(r=>['completed','acquire-error'].includes(r.status));
    const ended=scenario==='leak'&&tick===horizon;
    emit(done?'complete':ended?'observation-end':'tick',done?'요청 처리와 연결 반환 완료':ended?'유한 관찰 종료 · 반환 누락은 남음':`${tick}교육 tick의 경계`,
      done?'요청의 소유 선은 사라졌지만 정상 반환된 client와 DB 세션은 idle로 재사용할 수 있습니다. pool 상한과 현재 열린 연결은 다른 수입니다.':
      ended?'R1의 SQL은 끝났지만 client 대여를 반환하지 않았습니다. 아직 기다리는 요청을 성공이나 시간 초과로 꾸미지 않습니다.':
      '이 경계에서는 SQL 종료·정상 반환을 먼저 처리하고 빈 client를 FIFO 요청에 넘깁니다. 파란 대기·초록 SQL·노란 앱 보유 시간은 겹치지 않습니다.',events);
    if(done||ended)break;
  }
  function release(r,events) {
    const index=leases.findIndex(l=>l.id===r.leaseId),lease=leases[index];
    if(index<0)throw new Error('Cannot release an unowned lease');
    leases.splice(index,1);leaseHistory.push({...lease,releasedAt:tick});
    clients.find(c=>c.id===r.clientId).ownerRequestId=null;
    r.status='completed';r.completedAt=tick;
    events.push({kind:'release',requestId:r.id,clientId:r.clientId,leaseId:r.leaseId});
    r.leaseId=null;
  }
  return frozen(frames);
}

export function bindingFrames(input={}) {
  const {mode='pinned'}=validateOptions(input,['mode']);
  choice(mode,BINDING_MODES,'binding mode');
  const schedule = mode==='pinned' ? [
    ['acquire','C1','연결 하나를 빌림','한 요청이 C1을 끝까지 유지합니다.'],
    ['begin','C1','C1: BEGIN','명시적 transaction은 C1 세션 안에서 시작합니다.'],
    ['update','C1','C1: 재고5 → 4, 미확정','같은 C1에서 수정했습니다. 아직 확정 재고는5입니다.'],
    ['rollback','C1','C1: ROLLBACK','같은 transaction의 재고 변경이 취소돼 확정 재고5를 유지합니다.'],
    ['release','C1','정리 후 정상 반환','transaction이 끝난 건강한 client만 반환합니다. 반환 자체가 ROLLBACK은 아닙니다.']
  ] : [
    ['acquire','C1','pool.query가 C1 선택','잘못 분리한 호출의 가능한 배정 예입니다. 매번 다른 client가 된다는 보장은 아닙니다.'],
    ['begin','C1','C1: BEGIN 뒤 호출 반환','BEGIN은 C1에만 적용됩니다. pool.query 반환이 열린 transaction을 자동 정리하지 않습니다.'],
    ['update','C2','다음 호출은 C2: 자동 확정','가능한 C2 배정에서는 별도 문장이 재고4를 확정합니다. C1의 transaction과 다른 경계입니다.'],
    ['rollback','C1','C1: ROLLBACK, 재고4는 남음','C1을 취소해도 C2가 이미 확정한 변경은 되돌릴 수 없습니다.'],
    ['release','C1','호출을 나눈 결과','이 예에서는 재고4가 남습니다. 실제 호출 배정이나 오류 결과를 보편적으로 예측하지 않습니다.']
  ];
  let stock=5,active=null;
  const calls=[],frames=[];
  for(const [kind,clientId,title,detail] of schedule) {
    const id=`call:${calls.length+1}`;
    if(kind==='begin')active='C1';
    if(kind==='update'&&mode==='split')stock=4;
    if(kind==='rollback')active=null;
    calls.push({id,kind,clientId,sessionId:clientId==='C1'?'S1':'S2'});
    frames.push({step:frames.length,mode,title,detail,phase:kind,calls:copy(calls),activeTransactionClientId:active,committedStock:stock,pendingStock:mode==='pinned'&&active&&kind==='update'?4:null,edges:calls.map(c=>({id:`${c.id}:binding`,from:c.id,to:c.clientId})),finished:kind==='release'});
  }
  return frozen(frames);
}

export function connectionBudget(input={}) {
  const {instances=1,poolMax=2}=validateOptions(input,['instances','poolMax']);
  choice(instances,CAPACITY_INSTANCES,'instances');choice(poolMax,CAPACITY_MAXIMA,'pool maximum');
  const serverMax=12,superuserReserve=2,reservedRoleReserve=2,otherConnections=2;
  const ordinaryThreshold=serverMax-superuserReserve-reservedRoleReserve;
  const appBudget=ordinaryThreshold-otherConnections,configuredDemand=instances*poolMax;
  return frozen({instances,poolMax,serverMax,superuserReserve,reservedRoleReserve,otherConnections,ordinaryThreshold,privilegedThreshold:serverMax-superuserReserve,appBudget,configuredDemand,excess:Math.max(0,configuredDemand-appBudget),fits:configuredDemand<=appBudget,
    tokens:Array.from({length:configuredDemand},(_,i)=>({id:`app:${Math.floor(i/poolMax)+1}:${i%poolMax+1}`,instance:Math.floor(i/poolMax)+1,ordinal:i+1,exceedsOrdinaryBudget:i>=appBudget})),
    title:'열린 연결 수가 아닌 설정 상한의 비교',detail:'서버 전체 최대12에서 예약 진입 여유4와 기존 다른 연결2를 남기면 이 앱의 일반 역할 상한 예산은6입니다. 예약 수는 역할 소유의 연결 객체가 아니라 신규 진입 문턱입니다.'});
}

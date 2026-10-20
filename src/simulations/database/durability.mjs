// Fixed synthetic schedules, not a PostgreSQL engine or actual storage test.
import {CANONICAL_FIXTURE} from './fixture.mjs';
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const copy=v=>structuredClone(v);
const initialQty=CANONICAL_FIXTURE.products.find(p=>p.id===101).available_qty;
export const DURABILITY_CASES=freeze(['sync-before-flush','sync-after-flush-before-ack','sync-after-ack','uncommitted-page','async-before-flush','async-after-flush','storage-loss']);
export const WAL_RECORDS=freeze([
 {id:'wal:10',txId:'T1',endLsn:10,kind:'change',pageId:'P1',versionId:'products:101:v1',qty:initialQty-1},
 {id:'wal:20',txId:'T1',endLsn:20,kind:'commit',pageId:null,versionId:null,qty:null}
]);
const oldVersion=()=>({id:'products:101:v0',rowId:'products:101',qty:initialQty,createdBy:'T0',retiredBy:null});
const changedPage=()=>({id:'P1',lsn:10,versions:[{...oldVersion(),retiredBy:'T1'},{id:'products:101:v1',rowId:'products:101',qty:initialQty-1,createdBy:'T1',retiredBy:null}]});
const initialPage=()=>({id:'P1',lsn:0,versions:[oldVersion()]});
function input(options){if(options===null||typeof options!=='object'||Array.isArray(options)||![Object.prototype,null].includes(Object.getPrototypeOf(options)))throw new TypeError('Use plain options');if(Object.keys(options).some(k=>k!=='scenario'))throw new RangeError('Unknown option');const scenario=options.scenario===undefined?'sync-after-ack':options.scenario;if(!DURABILITY_CASES.includes(scenario))throw new RangeError('Unknown durability case');return scenario;}
export function durabilityFrames(options={}){
 const scenario=input(options),mode=scenario.startsWith('async-')?'async':'sync',frames=[];
 let ram={id:'ram:boot1',page:initialPage(),walRecords:[]},osCache={id:'cache:boot1',walIds:[]},storage={id:'storage:1',durableEnd:0,walRecords:[],page:initialPage()};
 let transactionStatus='not-started',commitRequested=false,acknowledged=false,server='online',crashed=false,readResult=null,replaySkipped=false;
 const flow=(from,to,label,recordId=null)=>({id:`${from}->${to}`,from,to,label,recordId});
 function emit(phase,title,detail,flows=[],finished=false){
  frames.push(copy({step:frames.length,scenario,mode,phase,title,detail,ram,osCache,storage,transactionStatus,commitRequested,acknowledged,server,readResult,replaySkipped,flows,finished,
   rowId:'products:101',txId:'T1',appRequestId:'request:reserve-101',appOutcome:acknowledged?'success-received':crashed?(commitRequested?'unknown':'no-commit-request'):'pending',
   assumptions:['fsync on; honest durable storage; no replication','OS/device volatile write cache is a schematic boundary','LSN10/20 are order markers, not time or byte sizes','page writes, checkpoint, full-page images and device internals simplified','not SQL replay and not an actual crash experiment']}));
 }
 emit('initial','같은 상품, 서로 다른 저장 위치','상품101의 시작 재고는5개입니다. RAM의 buffer page와 저장 장치의 data page는 같은 P1의 다른 사본입니다.');
 ram.page=changedPage();ram.walRecords=[WAL_RECORDS[0]];transactionStatus='uncommitted';
 emit('change','T1 변경과 WAL10','P1에는 이전 버전5와 T1의 새 버전4가 함께 있습니다. 물리 버전이 있다는 사실은 다른 독자가4를 볼 수 있다는 뜻이 아닙니다.',[flow('ram-page','ram-wal','변경 기록','wal:10')]);
 if(scenario!=='uncommitted-page'){
  commitRequested=true;ram.walRecords=[...WAL_RECORDS];transactionStatus=mode==='async'?'logical-commit-volatile':'awaiting-durability';
  emit('commit-record','T1 COMMIT 기록20 생성','commit 레코드가 휘발 영역에 생겼습니다. 이 단계만으로 장애 뒤 남는다고 판단하지 않습니다.');
 }
 osCache.walIds=ram.walRecords.map(r=>r.id);
 emit('cache-write','write와 내구화는 다름','WAL을 OS·장치의 휘발성 쓰기 cache에 보낸 관찰입니다. 여기의 사본은 전원·OS 장애 때 잃을 수 있어 아직 durable 끝은0입니다.',[flow('ram-wal','os-wal','write')]);
 function acknowledge(){acknowledged=true;emit('ack','앱이 성공 응답을 받음',mode==='async'?'비동기 모드의 앱 응답입니다. 아직 내구화되지 않은 최근 변경은 장애 때 사라질 수 있습니다.':'이 기본 동기 모드에서는 commit20의 내구화 뒤에 성공을 응답합니다. 데이터 페이지 자체는 아직0일 수 있습니다.',[flow('ram-wal','app','응답')]);}
 function flush(){storage.walRecords=ram.walRecords.map(copy);storage.durableEnd=storage.walRecords.at(-1).endLsn;if(commitRequested)transactionStatus='durable-commit';emit('flush','WAL 내구화 완료',`정상 장치의 동기화 완료를 관찰했습니다. durable WAL 끝은${storage.durableEnd}입니다. data page가 아직0이어도 이 기록으로 redo할 수 있습니다.`,[flow('os-wal','disk-wal','동기화 완료')]);}
 if(mode==='async')acknowledge();
 if(!['sync-before-flush','async-before-flush'].includes(scenario))flush();
 if(scenario==='uncommitted-page'){
  if(storage.durableEnd<ram.page.lsn)throw new Error('WAL-before-data invariant');
  storage.page=copy(ram.page);
  emit('page-write','미확정 페이지도 먼저 저장될 수 있음','변경 WAL10이 먼저 내구화됐으므로 pageLSN10인 P1을 쓸 수 있습니다. COMMIT20은 없고 T1은 아직 미확정입니다.',[flow('ram-page','disk-page','page 쓰기')]);
 }
 if(['sync-after-ack','storage-loss'].includes(scenario))acknowledge();
 ram=null;osCache=null;server='offline';crashed=true;transactionStatus='recovery-undecided';
 if(scenario==='storage-loss')storage=null;
 emit('crash',scenario==='storage-loss'?'로컬 저장 장치까지 소실':'휘발 영역이 사라진 장애',scenario==='storage-loss'?'RAM뿐 아니라 이 로컬 data page와 WAL도 없어졌습니다. 같은 장치 안의 WAL은 별도 백업이 아닙니다.':'기존 RAM·쓰기 cache instance가 없어졌습니다. 앱이 받은 응답과 남아 있는 저장 장치는 따로 확인합니다.');
 if(!storage){emit('blocked','남은 복사본 없이 자동 복구 불가','이 모델에는 별도 백업이 없습니다. 복구 결과를 재고0이나 성공으로 만들지 않습니다. 다음 장에서 살아남은 복사본을 따로 따집니다.',[],true);return freeze(frames);}
 ram={id:'ram:boot2',page:copy(storage.page),walRecords:[]};osCache={id:'cache:boot2',walIds:[]};server='recovering';
 emit('restart','새 instance가 생존 페이지를 읽음','새 RAM instance는 예전 RAM이 아닙니다. 저장된 페이지를 읽었지만 새 transaction의 가시성 판정은 아직 끝나지 않았습니다.',[flow('disk-page','ram-page','페이지 읽기')]);
 const change=storage.walRecords.find(r=>r.kind==='change');
 if(change){replaySkipped=ram.page.lsn>=change.endLsn;if(!replaySkipped)ram.page=changedPage();}
 emit('redo-data','물리 redo와 commit 판정은 다름',!change?'생존한 변경 WAL이 없어 초기 페이지5를 유지합니다.':replaySkipped?'pageLSN10에 변경이 이미 반영되어 같은 버전을 중복해서 만들지 않습니다. 페이지에는 새 버전4도 남지만 commit 여부는 별도입니다.':'WAL10의 페이지 변경을 redo해 이전5와 새4의 버전을 복원합니다. SQL문을 다시 실행하거나 commit된 SQL만 골라 실행한 것이 아닙니다.',change?[flow('disk-wal','ram-page',replaySkipped?'이미 반영':'redo','wal:10')]:[]);
 const committed=storage.walRecords.some(r=>r.kind==='commit');transactionStatus=committed?'recovered-committed':'recovered-not-committed';
 emit('redo-status','생존 COMMIT 기록으로 T1 판정',committed?'내구화된 COMMIT20이 있으므로 T1은 복구 뒤 확정된 transaction입니다. 앱의 응답 수신 여부와는 다른 질문입니다.':'생존한 COMMIT 기록이 없으므로 T1의 새 버전은 확정 결과로 보이지 않습니다. 물리 새 버전을 지워 과거 페이지로 되감는 그림이 아닙니다.',[flow('disk-wal','tx-status',committed?'COMMIT20 있음':'COMMIT 없음',committed?'wal:20':null)]);
 server='online';const visible=ram.page.versions.find(v=>committed?v.createdBy==='T1':v.createdBy==='T0');
 readResult={rowId:visible.rowId,versionId:visible.id,qty:visible.qty};
 emit('read','복구 뒤 새 조회',`새 독자가 보는 재고는${visible.qty}개입니다. `+(acknowledged&&mode==='async'&&!committed?'비동기 성공 응답 뒤에도 최근 변경이 사라진 반례이며, 이는 상태 불일관성과 다른 손실입니다.':!acknowledged&&committed?'앱은 응답을 받지 못했지만 DB에는 확정 결과가 남았습니다. 무작정 새 주문으로 재시도하지 않습니다.':'남은 WAL·페이지와 T1의 확정 여부를 함께 읽은 결과입니다.'),[flow('ram-page','reader','버전 후보'),flow('tx-status','reader','가시성 판정')],true);
 return freeze(frames);
}

// Synthetic recovery coverage and service restoration, not actual backup files.
import {CANONICAL_FIXTURE,validateFixture,rowKey} from './fixture.mjs';
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const copy=v=>structuredClone(v);
export const RECOVERY_CASES=freeze(['physical-continuous','logical-dump','missing-wal','same-storage-lost','validation-failure']);
export const RECOVERY_EVENTS=freeze([1,3,6,8,11,13].map((minute,i)=>({id:`event:${i+1}`,minute,orderId:2001+i,productId:i<5?101:102,qty:1,requestKey:`backup-day-${i+1}`})));
export const RESTORE_PHASES=freeze([{id:'prepare',label:'감지·별도 대상 준비',duration:3},{id:'copy',label:'사본 가져오기',duration:4},{id:'replay',label:'데이터 복원',duration:6},{id:'start',label:'DB 시작',duration:2},{id:'validate',label:'데이터·앱 읽기 검증',duration:5},{id:'switch',label:'서비스 전환',duration:1}]);
function input(o){if(o===null||typeof o!=='object'||Array.isArray(o)||![Object.prototype,null].includes(Object.getPrototypeOf(o)))throw new TypeError('Use plain options');if(Object.keys(o).some(k=>k!=='scenario'))throw new RangeError('Unknown option');const s=o.scenario===undefined?'physical-continuous':o.scenario;if(!RECOVERY_CASES.includes(s))throw new RangeError('Unknown recovery case');return s;}
function addEvent(data,e){const product=data.products.find(p=>p.id===e.productId);product.available_qty-=e.qty;data.orders.push({id:e.orderId,customer_id:1,request_key:e.requestKey,status:'confirmed',created_at:`2026-01-12T10:${String(e.minute).padStart(2,'0')}:00Z`});data.order_items.push({order_id:e.orderId,line_no:1,product_id:e.productId,qty:e.qty,unit_price_won:product.unit_price_won});}
export function recoverySnapshot(minute){if(!Number.isInteger(minute)||minute< -2||minute>15)throw new RangeError('Minute must be integer -2..15');const data=copy(CANONICAL_FIXTURE);for(const e of RECOVERY_EVENTS.filter(e=>e.minute<=minute))addEvent(data,e);return freeze(data);}
export function recoveryMeasures(data){
 if(!validateFixture(data).valid)throw new TypeError('Invalid recovery fixture');
 const confirmed=new Set(data.orders.filter(o=>o.status==='confirmed').map(o=>o.id));
 return freeze({orderCount:data.orders.length,itemCount:data.order_items.length,confirmedAmountWon:data.order_items.filter(i=>confirmed.has(i.order_id)).reduce((n,i)=>n+i.qty*i.unit_price_won,0),stocks:data.products.map(p=>({rowId:rowKey('products',p),qty:p.available_qty})),rowIds:Object.entries(data).flatMap(([table,rows])=>rows.map(r=>rowKey(table,r)))});
}
export function recoveryFrames(options={}){
 const scenario=input(options),logical=scenario==='logical-dump',lost=scenario==='same-storage-lost',frames=[];
 const segments=Array.from({length:11},(_,i)=>({id:`wal-interval:${i+1}`,start:i,end:i+1,available:!lost&&scenario!=='logical-dump'&&!(scenario==='missing-wal'&&i===6)}));
 let prefix=0;for(const s of segments){if(!s.available)break;prefix=s.end;}
 const recoverableThrough=lost?null:logical?-2:prefix,lossWindow=recoverableThrough===null?null:15-recoverableThrough;
 const backup={id:logical?'dump:1':'base:1',kind:logical?'logical':'physical',location:lost?'same-storage':'separate-storage',survives:!lost,snapshotMinute:logical?-2:null,startMinute:-2,completedMinute:0,bootstrapWalComplete:!logical&&!lost};
 let elapsed=0,target=null,dataset=null,appliedIds=[],steps=[],checks=[],serviceUp=false,recoveredThrough=null;
 const expected=recoverableThrough===null?null:recoverySnapshot(recoverableThrough),expectedMeasures=expected?recoveryMeasures(expected):null;
 function emit(phase,title,detail,flows=[],finished=false){
  const measures=dataset?recoveryMeasures(dataset):null,dataVerified=checks.length>0&&checks.filter(c=>c.id!=='app-read').every(c=>c.passed);
  const selectedOrder=dataset?.orders.filter(o=>o.id>=2000).at(-1)??dataset?.orders[0],item=selectedOrder?dataset.order_items.find(i=>i.order_id===selectedOrder.id):null,product=item?dataset.products.find(p=>p.id===item.product_id):null;
  const transferFlows=flows.filter(e=>e.from!=='app-reader');
  const transfer=transferFlows.length?{sourceGroup:phase==='replay'&&!logical?'wal-prefix':backup.id,sourceIds:transferFlows.map(e=>e.from),targetId:target.id,label:phase==='replay'&&!logical?`연속${transferFlows.length}구간 재생`:transferFlows[0].label}:null;
  const relationProof=selectedOrder&&item&&product?{orderKey:rowKey('orders',selectedOrder),orderId:selectedOrder.id,itemKey:rowKey('order_items',item),productKey:rowKey('products',product),productId:product.id,qty:item.qty,stock:product.available_qty}:null;
  frames.push(copy({step:frames.length,scenario,phase,title,detail,finished,fixtureId:'study-shop:backup-day',failureMinute:15,rpoTargetMinutes:5,rtoTargetMinutes:20,backup,segments,events:RECOVERY_EVENTS,
   recoverableThrough,recoveredThrough,lossWindow,rpoWithinTarget:dataVerified?lossWindow<=5:null,elapsed,recoveryDuration:serviceUp?elapsed:null,rtoWithinTarget:serviceUp?elapsed<=20:null,
   target,dataset,measures,expectedMeasures,relationProof,transfer,appliedIds,steps,checks,serviceUp,flows,
   unavailableEventIds:recoverableThrough===null?null:RECOVERY_EVENTS.filter(e=>e.minute>recoverableThrough).map(e=>e.id),
   assumptions:['times/durations and WAL intervals are synthetic, not segment files','valid physical base includes all required bootstrap WAL','original orders already reflected in starting stock','restoration uses a separate target; original is never overwritten','RPO/RTO are objectives, not backup-job success labels']}));
 }
 emit('inventory','장애 뒤 남은 사본부터 확인','10:15 원본 저장 장치가 소실된 고정 예입니다. 원본과 다른 곳에 둔 유효 사본·연속 자료가 있는지 확인하며, 아직 복원 완료로 세지 않습니다.');
 if(lost){elapsed=3;steps=[{...RESTORE_PHASES[0],start:0,end:3,status:'blocked'}];emit('blocked','같은 장애에 사본도 소실','원본과 같은 장치의 base와 WAL이 모두 없어졌습니다. 복구 가능한 시점·실제 복구 소요는 모름이며, 데이터0이나 RPO0으로 표시하지 않습니다.',[],true);return freeze(frames);}
 for(const phase of RESTORE_PHASES){
  const start=elapsed;elapsed+=phase.duration;steps.push({...phase,label:phase.id==='replay'?(logical?'logical 데이터 적재':'연속 WAL 재생'):phase.label,start,end:elapsed,status:'done'});
  let title='',detail='',flows=[];
  if(phase.id==='prepare'){
   target={id:'restore-target:1',state:'prepared',appReadAllowed:scenario!=='validation-failure'};title='원본과 다른 대상 준비';detail='복구 대상 restore-target:1을 새로 준비했습니다. 아직 데이터가 없고 서비스 경로도 열지 않았습니다.';
  }else if(phase.id==='copy'){
   if(!logical)dataset=copy(CANONICAL_FIXTURE);target.state=logical?'dump-file-ready':'base-copied';title='사본 파일을 가져옴';detail=logical?'09:58 snapshot의 dump 파일은10:00에 완성됐습니다. 완료 시각이 데이터 시점은 아니며 아직 DB에 적재하지 않았습니다.':'09:58–10:00 유효 base와 그 기간에 필요한 WAL이 모두 확보됐다는 전제입니다. 이후 자료를 재생하기 전에는 서비스로 전환하지 않습니다.';flows=[{id:'copy',from:backup.id,to:target.id,label:'별도 대상에 복사'}];
  }else if(phase.id==='replay'){
   if(logical)dataset=copy(CANONICAL_FIXTURE);else for(const e of RECOVERY_EVENTS.filter(e=>e.minute<=recoverableThrough)){addEvent(dataset,e);appliedIds.push(e.id);}
   target.state='data-restored';recoveredThrough=recoverableThrough;title=logical?'dump snapshot을 적재':'연속 prefix까지만 재생';detail=logical?'논리 dump의 데이터 시점은09:58입니다. 이 dump에 WAL을 이어 붙이지 않습니다.':scenario==='missing-wal'?'7구간 자료가 없어6까지의 연속 prefix만 사용합니다.8–11이 있어도 끊긴 부분을 건너뛰지 않습니다.':'10:11까지 연속 자료를 재생했습니다.10:13 주문은 이 사본 범위에 들어 있지 않습니다.';flows=logical?[{id:'load',from:backup.id,to:target.id,label:'논리 적재'}]:segments.filter(s=>s.end<=prefix).map(s=>({id:`replay:${s.id}`,from:s.id,to:target.id,label:'재생'}));
  }else if(phase.id==='start'){
   target.state='db-online';title='DB가 켜져도 서비스 완료는 아님';detail='새 DB는 시작됐지만 주문·항목 관계, 예상 행과 금액·재고, 앱의 읽기 경로를 아직 확인하지 않았습니다.';
  }else if(phase.id==='validate'){
   const actual=recoveryMeasures(dataset),constraints=validateFixture(dataset);
   checks=[{id:'relations',label:'PK·FK·제약',passed:constraints.valid,expected:'유효한 관계',actual:constraints.valid?'유효한 관계':'위반'},
    {id:'rows',label:'주문·항목 수',passed:actual.orderCount===expectedMeasures.orderCount&&actual.itemCount===expectedMeasures.itemCount,expected:`${expectedMeasures.orderCount}/${expectedMeasures.itemCount}`,actual:`${actual.orderCount}/${actual.itemCount}`},
    {id:'amount-stock',label:'확정 주문금액·재고',passed:actual.confirmedAmountWon===expectedMeasures.confirmedAmountWon&&JSON.stringify(actual.stocks)===JSON.stringify(expectedMeasures.stocks),expected:`${expectedMeasures.confirmedAmountWon}원`,actual:`${actual.confirmedAmountWon}원`},
    {id:'app-read',label:'앱의 읽기 권한',passed:target.appReadAllowed,expected:'읽기 허용',actual:target.appReadAllowed?'읽기 허용':'권한 누락'}];
   target.state=checks.every(c=>c.passed)?'validated':'validation-blocked';title=target.appReadAllowed?'복구 데이터와 앱 경로 검증':'데이터는 맞아도 앱 읽기가 막힘';detail=target.appReadAllowed?'해당 복구 시점의 예상 데이터와 대조했고 앱 읽기도 허용됩니다. 이제 전환할 수 있습니다.':'고정 반례는 새 대상의 앱 읽기 권한 누락입니다. 정상 WAL 복구가 임의로 FK를 깨뜨린다는 뜻이 아닙니다.20분이 지났어도 서비스 미복구이며 남은 소요는 모릅니다.';flows=[{id:'app-validation',from:'app-reader',to:target.id,label:target.appReadAllowed?'읽기 확인':'권한 거절'}];
   if(!target.appReadAllowed){steps.at(-1).status='blocked';emit(phase.id,title,detail,flows,true);return freeze(frames);}
  }else{
   serviceUp=true;target.state='serving';title='데이터 시점과 서비스 복구를 따로 판정';detail=`서비스가 다시 열린 소요는${elapsed}분으로 RTO20분을 넘습니다. 복구 데이터의 시간 차${lossWindow}분과 RPO5분 비교는 별도입니다.`;flows=[{id:'service-switch',from:'app-reader',to:target.id,label:'검증 뒤 전환'}];
  }
  emit(phase.id,title,detail,flows,phase.id==='switch');
 }
 return freeze(frames);
}

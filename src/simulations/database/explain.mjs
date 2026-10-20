import { createIndexFixture } from './indexes.mjs';
import { CANONICAL_FIXTURE, rowKey } from './fixture.mjs';
const freeze = v => { if(v&&typeof v==='object') {Object.values(v).forEach(freeze);Object.freeze(v);}return v; };
const copy = v=>JSON.parse(JSON.stringify(v));
export const EXPLAIN_CASES=freeze(['growth-count','nested-loop','limit']);
export const EXPLAIN_ESTIMATES=freeze(['low','aligned']);
function options(options) {
  if(!options||typeof options!=='object'||Array.isArray(options)||Object.getPrototypeOf(options)!==Object.prototype)throw new TypeError('Options must be an object');
  if(Object.keys(options).some(k=>!['example','observed','estimate'].includes(k)))throw new RangeError('Unknown option');
  const {example='growth-count',observed=true,estimate='low'}=options;
  if(!EXPLAIN_CASES.includes(example)||!EXPLAIN_ESTIMATES.includes(estimate)||typeof observed!=='boolean')throw new RangeError('Invalid explain option');
  return {example,observed,estimate};
}
const node=(id,label,estimatedRows,cost,children=[])=>({id,label,estimatedRows,cost,children,actualRows:null,loops:null,totalEmitted:null,emittedIds:[],visitedIds:[],buffers:null,actualStartupMs:null,actualTotalMs:null,bufferAccesses:[]});
function observe(n,{outputs,visited=[],loops=1,buffers,startup,total,accesses=null}) {
  n.actualRows=outputs.length/loops;n.loops=loops;n.totalEmitted=outputs.length;n.emittedIds=outputs;n.visitedIds=visited;
  n.bufferAccesses=accesses??[...Array.from({length:buffers.hit},(_,i)=>({id:`${n.id}:hit:${i}`,pageId:`${n.id}:page:${i}`,kind:'hit'})),...Array.from({length:buffers.read},(_,i)=>({id:`${n.id}:read:${i}`,pageId:`${n.id}:page:${buffers.hit+i}`,kind:'read'}))];
  n.buffers={hit:n.bufferAccesses.filter(a=>a.kind==='hit').length,read:n.bufferAccesses.filter(a=>a.kind==='read').length};n.actualStartupMs=startup;n.actualTotalMs=total;
}
export function explainFrames(input={}) {
  const {example,observed,estimate}=options(input);
  const growth=createIndexFixture('ordered'),canonical=CANONICAL_FIXTURE;
  let nodes,sourceRows,sql,rootId,scaleMax,fixtureId;
  const frames=[],packets=[],events=[],intervals=[];
  if(example==='growth-count') {
    nodes=[node('aggregate','Aggregate · COUNT',1,70,['scan']),node('scan','Seq Scan · Filter 포함',estimate==='low'?4:40,64)];
    sourceRows=growth.rows.map(r=>({id:`orders:${r.id}`,label:String(r.id),matches:r.day<=40}));rootId='aggregate';scaleMax=64;fixtureId='chapter04-growth64';
    sql="SELECT COUNT(*)\nFROM synthetic_orders\nWHERE created_at < TIMESTAMPTZ\n  '2026-02-10T00:00:00Z';";
  } else if(example==='nested-loop') {
    nodes=[node('join','Nested Loop',3,8,['outer','inner']),node('outer','주문 Scan',2,2),node('inner','항목 Lookup',1.5,3)];
    sourceRows=[...canonical.orders.filter(r=>r.customer_id===1&&r.status==='confirmed').map(r=>({id:rowKey('orders',r),label:`주문 ${r.id}`,matches:true})),...canonical.order_items.filter(r=>[1001,1002].includes(r.order_id)).map(r=>({id:rowKey('order_items',r),label:`항목 ${r.order_id},${r.line_no}`,matches:true}))];
    rootId='join';scaleMax=4;fixtureId='canonical-customer1';
    sql="SELECT o.id, i.line_no\nFROM orders AS o JOIN order_items AS i\n  ON i.order_id = o.id\nWHERE o.customer_id = 1\n  AND o.status = 'confirmed';";
  } else {
    nodes=[node('limit','Limit · 2행에서 중단',2,4,['scan']),node('scan','Seq Scan · Filter 포함',10,64)];
    sourceRows=growth.rows.map(r=>({id:`orders:${r.id}`,label:String(r.id),matches:r.id<=2020&&r.id%2===0}));rootId='limit';scaleMax=10;fixtureId='chapter04-growth64';
    sql="SELECT id FROM synthetic_orders\nWHERE id <= 2020 AND id % 2 = 0\nLIMIT 2;";
  }
  const edges=nodes.flatMap(n=>n.children.map(id=>({id:`${id}->${n.id}`,from:id,to:n.id})));
  const selected=id=>nodes.find(n=>n.id===id);
  function emit(phase,title,detail,activeNodeId=null,finished=false) {
    frames.push(copy({step:frames.length,example,observed,estimate,phase,title,detail,fixtureId,sql,nodes,rootId,edges,sourceRows,packets,events,intervals,scaleMax,activeNodeId,finished,
      result:phase==='complete'&&observed?{rows:selected(rootId).totalEmitted,countValue:example==='growth-count'?40:null}:null,
      stopProof:example==='limit'&&selected('scan').actualRows!==null?{reason:'parent-limit-satisfied',visited:4,emitted:2,possibleFullOutputs:10}:null,
      provenance:'authored synthetic plan; not server output',assumptions:['count estimates have no predicted row identities','cost is arbitrary planner-style units, not milliseconds','timing strip is separately authored inclusive schematic','BUFFERS is cumulative, non-distinct, includes child activity','not an optimizer or real EXPLAIN execution']}));
  }
  emit('estimate','먼저 예상만 읽기',observed?'외곽선은 예상 출력 행 수입니다. 관측 전 actual은0이 아니라 아직 모름입니다.':'EXPLAIN만의 관측 범위입니다. 실행하지 않은 actual·loops·BUFFERS는 알 수 없으며0으로 채우지 않습니다.',null,!observed);
  if(!observed)return freeze(frames);
  if(example==='growth-count') {
    const matching=sourceRows.filter(r=>r.matches).map(r=>r.id);
    observe(selected('scan'),{outputs:matching,visited:sourceRows.map(r=>r.id),buffers:{hit:6,read:2},startup:.1,total:8});
    packets.push({id:'packet:scan:1',nodeId:'scan',execution:1,inputIds:sourceRows.map(r=>r.id),outputIds:matching});
    events.push({id:'scan:finish',nodeId:'scan',packetId:'packet:scan:1'});
    emit('scan','64행 확인 → 40행 출력',`필터를 포함한 scan의 예상${selected('scan').estimatedRows}행과 모델 관측40행을 비교합니다. 검사한64행·출력40행·COUNT 결과1행은 다른 수입니다.`,'scan');
    observe(selected('aggregate'),{outputs:['result:count'],visited:matching,buffers:{hit:6,read:2},startup:8.2,total:10,accesses:selected('scan').bufferAccesses});
    packets.push({id:'packet:aggregate:1',nodeId:'aggregate',execution:1,inputIds:matching,outputIds:['result:count']});
    intervals.push({id:'interval:aggregate',nodeId:'aggregate',start:0,end:10},{id:'interval:scan',nodeId:'scan',start:0,end:8});
    emit('aggregate','COUNT는 값40인 결과1행','합계 노드는 아래40행을 받아 숫자40이 담긴1행을 돌려줍니다. 루트의 rows1을 읽은 원본 행 수1로 해석하면 안 됩니다.','aggregate');
  } else if(example==='nested-loop') {
    const orderIds=sourceRows.filter(r=>r.id.startsWith('orders:')).map(r=>r.id);
    observe(selected('outer'),{outputs:orderIds,visited:['orders:1001','orders:1002','orders:1003'],buffers:{hit:1,read:0},startup:.1,total:1});
    emit('outer','바깥 주문2행','주문1001과1002가 안쪽 항목 조회를 각각 한 번씩 시작하게 합니다.','outer');
    const allOutputs=[];
    for(const [i,orderId] of [1001,1002].entries()) {
      const items=canonical.order_items.filter(r=>r.order_id===orderId);
      const outputIds=items.map(r=>`joined:${orderId}:${r.line_no}`);allOutputs.push(...outputIds);
      packets.push({id:`packet:inner:${i+1}`,nodeId:'inner',execution:i+1,inputIds:[`orders:${orderId}`,...items.map(r=>rowKey('order_items',r))],outputIds});
      observe(selected('inner'),{outputs:allOutputs,visited:packets.flatMap(p=>p.inputIds.filter(id=>id.startsWith('order_items:'))),loops:i+1,buffers:{hit:i===0?1:3,read:1},startup:.1,total:i===0?2:1.5,accesses:[{id:'lookup:1:index',pageId:'items:indexP0',kind:'hit'},{id:'lookup:1:heap',pageId:'items:heapP0',kind:'read'},...(i===1?[{id:'lookup:2:index',pageId:'items:indexP0',kind:'hit'},{id:'lookup:2:heap',pageId:'items:heapP0',kind:'hit'}]:[])]});
      emit(`inner-${i+1}`,`안쪽 실행${i+1}: ${outputIds.length}행`,i===0?'주문1001의 항목2행이 첫 packet입니다. packet 실행 ID와 저장된 항목의 복합키를 따로 둡니다.':'두 번째는 주문1002의 항목1행입니다. 총3행 ÷ loops2 = 회당 평균1.5행입니다. 서로 다른 저장 행3개가 두 실행 묶음에 속합니다.','inner');
    }
    observe(selected('join'),{outputs:allOutputs,visited:orderIds,buffers:{hit:4,read:1},startup:.2,total:5,accesses:[...selected('outer').bufferAccesses,...selected('inner').bufferAccesses]});
    intervals.push({id:'interval:join',nodeId:'join',start:0,end:5},{id:'interval:outer',nodeId:'outer',start:0,end:1},{id:'interval:inner:1',nodeId:'inner',start:1,end:3},{id:'interval:inner:2',nodeId:'inner',start:3,end:4});
    emit('join','한 plan 안의 loops2, 결과3행','안쪽 actual rows1.5는 회당 평균이고 loops2를 함께 읽습니다. BUFFERS hit3/read1은 이미 누적값이므로 loops를 다시 곱하지 않습니다.','join');
  } else {
    const visited=sourceRows.slice(0,4).map(r=>r.id),outputs=sourceRows.slice(0,4).filter(r=>r.matches).map(r=>r.id);
    observe(selected('scan'),{outputs,visited,buffers:{hit:0,read:1},startup:.2,total:.8});
    packets.push({id:'packet:limit-input',nodeId:'scan',execution:1,inputIds:visited,outputIds:outputs});
    emit('limited-scan','4행 확인 → 일치2행','이 교육용 순서에서는2001–2004를 확인해2002·2004를 내보냅니다. 부모가2행을 받으면 scan 전체를 끝까지 읽지 않습니다.','scan');
    observe(selected('limit'),{outputs,visited:outputs,buffers:{hit:0,read:1},startup:.2,total:1,accesses:selected('scan').bufferAccesses});
    intervals.push({id:'interval:limit',nodeId:'limit',start:0,end:1},{id:'interval:scan',nodeId:'scan',start:0,end:.8});
    emit('limit','예상10, 실제2: 부모가 멈춘 반례','끝까지 읽는다면 조건에 맞는 행은10개입니다. 여기서는 LIMIT가2행에서 멈췄으므로 이 차이만으로 통계가 틀렸다고 할 수 없습니다.','limit');
  }
  emit('complete','관측한 범위와 모르는 것을 구분','이 숫자는 저자가 정한 모델 관측입니다. 실제 plan은 SQL·데이터·버전·cache·앱의 연결 대기와 함께 수집하고, 같은 조건에서 바뀐 결과를 비교해야 합니다.',rootId,true);
  return freeze(frames);
}

export function appCallComparison() {
  const orders=CANONICAL_FIXTURE.orders.filter(o=>o.customer_id===1&&o.status==='confirmed');
  const items=CANONICAL_FIXTURE.order_items.filter(i=>orders.some(o=>o.id===i.order_id));
  const oneQuery=[{id:'call:join',label:'주문·항목 JOIN',orderIds:orders.map(o=>o.id),outputIds:items.map(i=>`joined:${i.order_id}:${i.line_no}`)}];
  const nPlusOne=[{id:'call:orders',label:'주문 목록',orderIds:orders.map(o=>o.id),outputIds:orders.map(o=>rowKey('orders',o))},...orders.map(o=>({id:`call:items:${o.id}`,label:`주문${o.id} 항목`,orderIds:[o.id],outputIds:items.filter(i=>i.order_id===o.id).map(i=>rowKey('order_items',i))}))];
  return freeze({oneQuery,nPlusOne,applicationRows:items.length,totalReturnedRows:{oneQuery:oneQuery.reduce((n,c)=>n+c.outputIds.length,0),nPlusOne:nPlusOne.reduce((n,c)=>n+c.outputIds.length,0)},
    detail:'한 앱 요청의 DB 호출1회와3회를 비교합니다. 각 호출은 별도 실행입니다. 한 plan 노드의 loops2와 같은 카운터가 아닙니다.'});
}

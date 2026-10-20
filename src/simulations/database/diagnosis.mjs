import {poolFrames} from './connections.mjs';
import {concurrencyFrames} from './concurrency.mjs';
import {explainFrames} from './explain.mjs';
import {transactionFrames} from './transactions.mjs';
export const DIAGNOSIS_SCENARIOS=Object.freeze(['pool-wait','row-lock','plan-estimate','commit-unknown','compound']);
export const RETRY_PAYLOADS=Object.freeze(['same','different']);
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){for(const v of Object.values(o))freeze(v);Object.freeze(o);}return o;};
export const DIAGNOSIS_BOUNDARIES=freeze([{id:'request',label:'앱 요청'},{id:'pool',label:'연결 대여'},{id:'session',label:'DB 세션'},{id:'lock',label:'트랜잭션·잠금'},{id:'plan',label:'실행계획'},{id:'commit',label:'확정·재조회'}]);
const assumptions=Object.freeze(['실제 관측 도구나 DB가 아니라 앞선 장의 결정적 모델을 재사용합니다. 숫자는 합성 교육 tick·행 수이며 실제 지연이 아닙니다.','각 증거의 실행 ID·요청 ID·원본 단계가 다르면 시간을 합산하지 않습니다. 관측하지 않은 경계는0이 아닌 미확인입니다.','그림의 잠금은 설명용 상품 자원 관계이며 pg_locks의 실제 행별 출력이라고 주장하지 않습니다.','안전한 다음 확인을 고르는 연습입니다. 운영 세션 종료·상한 변경·SQL 재실행·결제는 수행하지 않습니다.']);
export function diagnosisFrames(options={}){
 if(options===null||typeof options!=='object'||Array.isArray(options)||![Object.prototype,null].includes(Object.getPrototypeOf(options)))throw new TypeError('Diagnosis options must be plain');
 if(Reflect.ownKeys(options).some(k=>!['scenario','payload'].includes(k)))throw new RangeError('Unknown diagnosis option');
 const {scenario='pool-wait',payload='same'}=options;
 if(!DIAGNOSIS_SCENARIOS.includes(scenario)||!RETRY_PAYLOADS.includes(payload))throw new RangeError('Unknown diagnosis scenario or retry payload');
 const frames=[],evidence=[];let links=[],hypotheses=[],nextChecks=[],unknown=['pool','session','lock','plan','commit'];
 const push=(phase,title,detail,{add,known=[],reach=[],supported=[],checks=[],verdict='insufficient'}={})=>{
  if(add)evidence.push(add);unknown=unknown.filter(x=>!known.includes(x));links=reach.length?reach:links;hypotheses=supported;nextChecks=checks;
  frames.push(freeze({scenario,payload,step:frames.length,phase,title,detail,observationKind:'evidence-limited-diagnosis',evidence:[...evidence],activeEvidenceId:add?.id??evidence.at(-1)?.id??null,unknownBoundaries:[...unknown],executionLinks:structuredClone(links),supportedHypotheses:[...hypotheses],nextChecks:[...nextChecks],verdict,finished:false,assumptions}));
 };
 const ev=(id,label,boundary,runId,requestId,sourceKind,source)=>freeze({id,label,boundary,runId,requestId,sourceKind,sourceStep:source.step,observedAt:`${runId} / 원본 ${source.step+1}단계`,source});
 const edges=(runId,requestId,nodes)=>nodes.slice(1).map((to,i)=>({id:`${runId}:${requestId}:${nodes[i]}:${to}`,runId,requestId,from:nodes[i],to}));
 if(scenario==='pool-wait'||scenario==='compound'){
  const all=poolFrames({size:1,scenario:'leak'}),at2=all.find(f=>f.tick===2),last=all.at(-1);
  push('symptom','요청이 느리다는 사실부터','실행 A의 R2 응답이 늦습니다. 아직 SQL이 느린지, DB에 도달했는지 알 수 없습니다.',{checks:['R2의 연결 획득 시점과 SQL 시작 여부를 확인합니다.']});
  push('pool-observed','R2는 아직 DB 세션이 없습니다','2tick 관찰: R1 SQL은 끝났지만 client를 보유하고, R2는 연결 대기입니다. 이 한 시점만으로 영구적인 반환 누락을 확정하지 않습니다.',{add:ev('pool-early','A · 2tick 대여 관측','pool','A','R2 / 보유자 R1','pool',at2),known:['pool','session'],reach:edges('A','R1',['request','pool','session']),supported:['R2의 현재 대기 위치는 SQL 실행 전 연결 획득입니다.'],checks:['대여 ID와 반환 이력을 이어 확인하고 R1의 정리 경로를 점검합니다.']});
  push('holder-observed','SQL 종료와 대여 반환은 다릅니다','8tick까지 R1의 같은 대여가 남고 반환 이력은0입니다. R1 SQL2tick과 R2 획득 대기8tick은 서로 다른 요청이므로 합산하지 않습니다.',{add:ev('pool-final','A · 8tick 반환 이력','pool','A','R2 / 보유자 R1','pool',last),known:['pool','session'],supported:['이 고정 실행의 R2 대기는 R1 대여가 반환되지 않아 생겼습니다.'],checks:['성공·예외 경로의 finally 반환과 transaction 정리를 따로 검토합니다.','열린 연결 수만으로 DB lock이나 서버 과부하를 단정하지 않습니다.'],verdict:'supported'});
  if(scenario==='compound'){
   const plan=explainFrames({example:'growth-count',observed:true,estimate:'low'}).at(-1);
   push('second-request','Q1은 예상보다 많은 행을 냈습니다','Q1은 별도 실행 Q에서 수집한 계획입니다. 예상4행과 scan 관측40행이 다릅니다. R2의 대기 시간을 Q1의 처리량에 붙이지 않습니다.',{add:ev('compound-plan','Q · Q1 계획 관측','plan','Q','Q1','plan',plan),known:['plan'],reach:[...links,...edges('Q','Q1',['session','plan'])],supported:['실행 A의 반환 누락과 실행 Q의 행 수 과소추정은 별도 증거입니다.'],checks:['반환 경로 교정은 별도 재실험으로 확인하고, Q1의 조건·통계·접근 경로는 별도로 확인합니다.'],verdict:'multiple'});
   const normal=poolFrames({size:1,scenario:'normal'}).at(-1);
   push('controlled-rerun','새 실행 B에서는 반환됐지만','반환 경로를 다르게 둔 별도 교육 실행 B에서는4요청이 완료됩니다. 실행 A가 중간부터 저절로 회복한 그림이 아닙니다. Q1의 계획 증거는 그대로 남습니다.',{add:ev('pool-rerun','B · 별도 정상 반환 실행','pool','B','R1–R4','pool',normal),known:['pool','session'],reach:[...links,...edges('B','R2',['request','pool','session'])],supported:['새 실행 B의 반환 이력은 정상입니다.','Q의 계획 과소추정은 이 교정으로 해결됐다는 증거가 없습니다.'],checks:['Q1을 같은 입력·조건으로 다시 관측하고 변경 전후 행 수·일·부작용을 비교합니다.'],verdict:'partial'});
  }
 }else if(scenario==='row-lock'){
  const all=concurrencyFrames({strategy:'conditional-update',firstOutcome:'commit'}),wait=all.find(f=>f.phase==='B-wait'),resume=all.find(f=>f.phase==='B-resume');
  push('symptom','세션 B가 응답을 기다립니다','SQL을 보냈다는 사실만 있습니다. 아직 CPU 작업인지 잠금 대기인지 구분할 수 없습니다.',{checks:['request ID와 DB session을 연결하고 wait event·막는 transaction을 확인합니다.']});
  push('lock-observed','B → 상품101 → A의 대기 관계','A/B의 문장 추적과 잠금 관계를 함께 확인한 합성 자료입니다. B는 A를 기다리고 영향 행 수는 아직 모름입니다. A의 미확정 값은 B의 조회 결과나 pg_locks의 값이 아닙니다.',{add:ev('lock-wait','L · A/B 문장과 잠금 추적','lock','L','B','lock',wait),known:['session','lock'],reach:edges('L','B',['session','lock']),supported:['B는 이 충돌 자원의 소유자 A를 기다립니다.'],checks:['A의 시작 시점·업무 의도·취소 영향을 확인하고 정상 종료 경로를 점검합니다.','이 그림은 pg_locks에 product_id 행이 그대로 나온다는 뜻이 아닙니다.'],verdict:'supported'});
  push('lock-resumed','A 확정 뒤 조건을 다시 확인합니다','A가 정상 확정한 다음 B의 조건부 UPDATE는 최신 재고0에서0행을 반환합니다. 앞선 대기 중 모름과 이제 완료된0행을 구별하세요.',{add:ev('lock-result','L · B 재평가 결과','lock','L','B','lock',resume),known:['session','lock'],supported:['대기가 끝난 뒤에야 B의0행 결과를 확인했습니다.'],checks:['앱이0행을 주문 실패로 처리하고 새 주문을 만들지 않는지 검증합니다.'],verdict:'supported'});
 }else if(scenario==='plan-estimate'){
  const estimated=explainFrames({example:'growth-count',observed:false,estimate:'low'}).at(-1),observed=explainFrames({example:'growth-count',observed:true,estimate:'low'}).at(-1);
  push('symptom','조회가 느리다는 제보만 있습니다','행이 늘었을 수 있지만 아직 원인은 미확인입니다. 예상 plan을 실제 실행 결과로 바꾸어 읽지 않습니다.',{checks:['같은 쿼리·값·자료 규모를 확인하고 실제 실행 관측의 위험을 검토합니다.']});
  push('estimated','예상4행은 관측4행이 아닙니다','EXPLAIN만으로는 actual rows와 loops가 없습니다. cost도 밀리초가 아닙니다.',{add:ev('plan-estimate','Q · 예상 plan만 확인','plan','Q','Q1','plan',estimated),known:['plan'],checks:['허용된 환경에서 실제 관측을 얻고 행 수·loops·buffers를 함께 읽습니다.']});
  push('actual','같은 scan에서 예상4와 관측40','실제 관측을 모델링한 단계에서 scan40행과 COUNT 결과1행을 구분합니다. 과소추정은 근거가 있지만 인덱스 추가나 통계 갱신의 효과까지 확정하지는 못합니다.',{add:ev('plan-actual','Q · 관측한 plan','plan','Q','Q1','plan',observed),known:['session','plan'],reach:edges('Q','Q1',['session','plan']),supported:['scan의 예상4행과 관측40행 사이에10배 차이가 있습니다.'],checks:['선택 조건·데이터 분포·통계 최신성과 접근 경로를 확인합니다.','변경 뒤 같은 조건의 결과·일·쓰기 비용을 다시 비교합니다.'],verdict:'supported'});
 }else{
  const tx=transactionFrames({mode:'atomic',outcome:'success'}).at(-1),order=tx.committedFixture.orders.find(o=>o.id===1004),items=tx.committedFixture.order_items.filter(i=>i.order_id===order.id),product=tx.committedFixture.products.find(p=>p.id===101),storedPayload={customerId:order.customer_id,productId:items[0].product_id,qty:items[0].qty},retryPayload={...storedPayload,qty:payload==='same'?storedPayload.qty:storedPayload.qty+1};
  const lookup={step:0,phase:'lookup',requestKey:order.request_key,order,items,product,storedPayload,retryPayload,payloadMatches:JSON.stringify(storedPayload)===JSON.stringify(retryPayload),sourceScenario:tx.scenarioId,sourceStep:tx.step,insertedOrders:0,decision:'not-yet'};
  push('unknown','COMMIT 응답을 받지 못했습니다','앱 응답이 불명일 뿐 DB 확정 여부는 아직 모릅니다. 새 요청 키로 주문을 다시 넣지 않습니다.',{checks:['원래 request_key와 요청 내용을 보존하고 같은 업무 결과를 재조회합니다.']});
  push('lookup','같은 키의 확정 결과를 찾았습니다','05장의 확정 주문1004와 항목1행·수량2, 최신 재고3을 재조회하는 합성 예입니다. 응답 유실은 별도의 앱 관측이며 이 조회 전에는 그 결과를 드러내지 않았습니다.',{add:ev('commit-lookup','T · key-1004 결과 재조회','commit','T','order-request-1004','lookup',lookup),known:['commit'],reach:edges('T','order-request-1004',['request','commit']),supported:['원래 키로 확정 주문이 존재하는 증거를 얻었습니다.'],checks:['재시도 payload가 저장된 고객·상품·수량과 같은지 비교합니다.'],verdict:'supported'});
  const match=lookup.payloadMatches;
  push('retry-decision',match?'같은 요청에는 기존 결과만 반환':'같은 키라도 다른 내용은 거절',match?'같은 키와 같은 고객·상품·수량을 확인했습니다. 새 주문을 넣거나 재고를 또 차감하지 않고 기존1004를 반환합니다.':'재시도 수량3은 저장된 수량2와 다릅니다. 키 충돌을 성공으로 취급하거나 기존 주문을 덮어쓰지 않습니다.',{add:ev('commit-decision','T · 요청 내용 대조','commit','T','order-request-1004','lookup',{...lookup,step:1,phase:'decision',decision:match?'return-existing':'reject-payload'}),known:['commit'],supported:[match?'동일 업무 결과 재사용; 추가 주문0·추가 재고 차감0.':'payload 불일치; 기존 주문은 보존하고 추가 주문0.'],checks:['조회 결과가 없는 경우도 원래 요청이 아직 진행 중일 수 있습니다. 별도의 동시성·유일성 계약을 확인합니다.','이 좁은 계약은 외부 결제·이메일까지 exactly-once를 보장하지 않습니다.'],verdict:match?'existing-result':'payload-conflict'});
 }
 return freeze(frames.map((f,i)=>({...f,finished:i===frames.length-1})));
}

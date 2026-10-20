import {useState} from 'react';
import {useFoundationPlayback} from '../network/FoundationPlayback';
import {costMethods,costLabels,inventoryFrames,workingModes,workingLabels,workingCapitalFrames,type CostMethod,type InventoryFrame,type WorkingMode,type WorkingFrame,type OperationsFrame} from '../../simulations/accounting/operations.mjs';
import './accounting.css';
import './operations.css';

const fmt=(n:number)=>n.toLocaleString('ko-KR');
function Controls({player,count,reset}:{player:ReturnType<typeof useFoundationPlayback>;count:number;reset:()=>void}){
 return <div className="ac-playback" role="group" aria-label="재고와 운전자금 관찰 단계">
  <button onClick={()=>player.setPlaying(!player.playing)} disabled={!player.playing&&player.index===count-1}>{player.playing?'정지':'재생'}</button>
  <button onClick={()=>player.go(-1)} disabled={player.index===0}>이전 단계</button>
  <button onClick={()=>player.go(1)} disabled={player.index===count-1}>다음 단계</button>
  <button onClick={player.reset}>다시 보기</button><button onClick={reset}>전체 초기화</button><span className="ac-step">{player.index+1} / {count}단계</span>
 </div>;
}
function StaticOperations({frames}:{frames:OperationsFrame[]}){
 return <details className="ac-static"><summary>모든 단계 · 움직임 없이 읽기</summary><ol>{frames.map(f=><li key={f.index} data-static-index={f.index}>
  <strong>M1 {f.day}일 · {f.title}</strong><p>{f.detail}</p>
  <p>현금 {fmt(f.balances.cash)} · 매출채권 {fmt(f.balances.receivable)} · 재고 {fmt(f.balances.inventory)} · 매입채무 {fmt(f.balances.payable)}. 발췌 이익 {fmt(f.profit)} · 발췌 현금 변화 {fmt(f.exerciseCash)}.</p>
  <p>자산 {fmt(f.assets)} = 부채 {fmt(f.liabilities)} + 자본 {fmt(f.equity)}.</p>
  {'attempts' in f&&(f as WorkingFrame).attempts.map(a=><p key={a.id}>M1 {a.day}일 지급 {a.status==='blocked'?'미실행':'완료'}: 필요 {a.required}, 직전 현금 {a.available}, 부족 {a.shortage}. 이후 입금과 별개인 당시 기록입니다.</p>)}
 </li>)}</ol></details>;
}
function InventoryScene({frame:f}:{frame:InventoryFrame}){
 return <figure className="ac-figure ac-inventory-scene">
  <div className="ac-stock-locations">
   <div className="ac-stock-zone" data-stock-zone="remaining"><h3>회사 창고</h3><p>{f.purchased?`남은 ${f.remainingQuantity}개`:'매입 예정100개'}</p>
    <div className="ac-parcels">{f.tokens.filter(t=>t.planned||t.remaining>0).map(t=><span key={t.id} data-parcel={t.id} data-quantity={t.planned?0:t.remaining} className={`ac-parcel ${t.planned?'is-planned':''}`}><b>{t.planned?'예정':t.remaining}</b>{!t.planned&&<small>개</small>}</span>)}</div>
   </div>
   <div className="ac-stock-direction" aria-hidden="true">→</div>
   <div className="ac-stock-zone is-delivered" data-stock-zone="sold"><h3>고객에게 인도</h3><p>누적 {f.soldQuantity}개</p><div className="ac-parcels">{f.tokens.filter(t=>t.sold>0).map(t=><span key={t.id} className="ac-parcel is-sold" data-parcel={t.id} data-quantity={t.sold}><b>{t.sold}</b><small>개</small></span>)}</div>{!f.soldQuantity&&<p className="ac-note">아직 인도한 상품 없음</p>}</div>
  </div>
  <figcaption>묶음 하나는10개입니다. 창고 경계를 넘어간 수량을 봅니다. 묶음의 위치·색은 실제 개별 상품이나 먼저 들어온 원가층을 식별하지 않습니다.</figcaption>
  <h3>같은 가용원가, 남은 자산과 팔린 비용</h3>
  <div className="ac-cost-track" aria-hidden="true" data-cost-scale={f.cost.totalCost}>
   <span className="ac-cost-remaining" style={{width:`${f.balances.inventory/f.cost.totalCost*100}%`}} data-cost-part="inventory" data-value={f.balances.inventory}/>
   <span className="ac-cost-sold" style={{width:`${f.balances.cogs/f.cost.totalCost*100}%`}} data-cost-part="cogs" data-value={f.balances.cogs}/>
  </div>
  <p>남은 재고원가 {fmt(f.balances.inventory)} + 매출원가 {fmt(f.balances.cogs)} = 지금까지 매입한 원가 {fmt(f.availableCost)}</p>
  <p className="ac-scale">초록 실선은 재고 자산, 갈색 사선은 팔린 원가입니다. 전체 폭 {f.cost.totalCost}가상단위. 기본300과 확장350은 눈금이 다르며, 확장의 두 배분법끼리는350으로 같습니다. 판매가격은 이 띠에 더하지 않습니다.</p>
 </figure>;
}
export function InventoryAndCostLab(){
 const [method,setMethod]=useState<CostMethod>('single'),[quantity,setQuantity]=useState(80),[prediction,setPrediction]=useState('');
 const frames=inventoryFrames({soldQuantity:quantity,method}),player=useFoundationPlayback(frames.length),f=frames[player.index];
 const reset=()=>{player.reset();setMethod('single');setQuantity(80);setPrediction('');};
 return <section className="ac-lab ac-operations" data-ac-lab="inventory" aria-label="재고 수량과 원가 배분 실험">
  <p className="ac-eyebrow">05 · 산 상품과 팔린 원가</p><h2>창고에 남은 상품까지 비용일까요?</h2>
  <p>T01–T04 뒤 현금350에서 상품 거래만 발췌합니다. 기본은100개×원가3, 판매가격은 개당5입니다. 확장은50개×3 뒤50개×4라는 다른 매입 조건입니다.</p>
  <div className="ac-controls">
   <label>매입 조건과 원가 배분<select aria-label="매입 조건과 원가 배분" value={method} onChange={e=>{player.reset();setPrediction('');setMethod(e.target.value as CostMethod);}}>{costMethods.map(m=><option value={m} key={m}>{costLabels[m]}</option>)}</select></label>
   <label>인도할 수량<select aria-label="인도할 수량" value={quantity} onChange={e=>{player.reset();setPrediction('');setQuantity(Number(e.target.value));}}>{[0,60,80,100].map(q=><option key={q} value={q}>{q}개</option>)}</select></label>
   <label>매입대금을 나중에 내면 원가는<select aria-label="매입대금을 나중에 내면 원가는" value={prediction} onChange={e=>setPrediction(e.target.value)}><option value="">먼저 예상해 보세요</option><option value="same">팔린 수량·배분법이 같으면 같다</option><option value="paid">낸 돈만큼 늘어난다</option></select></label>
  </div>
  <Controls player={player} count={frames.length} reset={reset}/><div className="ac-current" role="status" aria-live="polite"><strong>{f.title}</strong><p>{f.detail}</p></div>
  <InventoryScene frame={f}/>
  {method!=='single'&&<div className="ac-allocation"><h3>물건의 이동이 아니라 원가의 배분</h3><p>가용원가350 = 50개×3 + 50개×4. {method==='average'?'기간 평균 단위원가 = 350÷100 = 3.5.':'선입선출은 먼저 취득한 원가부터 팔린 수량에 배분합니다.'}</p><p>선택한 {quantity}개 인도 시 매출원가: {f.cost.allocations.filter(a=>a.quantity>0).map(a=>`${a.quantity}개×${a.unitCost}`).join(' + ')||'0개'} = {f.cost.costOfSales}. 남은 원가 {f.cost.endingCost}.</p><p className="ac-note">이 계산은 선택한 판매의 배분표이며 아직 인도 전이면 현재 비용은0입니다. 배분법이 실제 물건의 출고 순서를 증명하지 않습니다. 같은 매입·판매에서 선입선출과 평균을 비교하세요.</p></div>}
  <div className="ac-result" data-inventory={f.balances.inventory} data-cogs={f.balances.cogs} data-profit={f.profit} data-cash={f.balances.cash} data-quantity={f.remainingQuantity}><p>발췌 매출 {fmt(f.revenue)} − 매출원가 {fmt(f.balances.cogs)} = 이익 {fmt(f.profit)}</p><p>현재 현금 {fmt(f.balances.cash)} · 누적 회수 {fmt(f.receiptTotal)} · 누적 지급 {fmt(f.paymentTotal)}</p></div>
  {player.index===frames.length-1&&prediction&&<p className="ac-feedback" role="status">{prediction==='same'?'예측과 같습니다.':'지급액과 매출원가는 다릅니다.'} 회수·지급은 현금과 채권·채무를 바꾸며, 같은 판매의 원가를 다시 만들지 않습니다.</p>}
  <StaticOperations frames={frames}/><p className="ac-note">완성품 상인의 단순 사례입니다. 운송·반품·재고 손상·세금·제조원가·중간 추가 매입을 생략했고 순실현가능가치가 원가보다 낮지 않다고 가정합니다. 평균은 이 기간에 판매 전 매입한 전량의 평균이며 모든 평균법 운영을 재현하지 않습니다. 기본 이익160은 M1 전체 이익65가 아닙니다.</p>
 </section>;
}
function WorkingScene({frame:f}:{frame:WorkingFrame}){
 return <figure className="ac-figure">
  <h3>받을 돈과 상품, 아직 안 낸 매입대금</h3>
  <div className="ac-owc-row"><strong>매출채권 + 재고</strong><div className="ac-owc-track" aria-hidden="true"><span className="ac-owc-receivable" data-owc-part="receivable" style={{width:`${f.balances.receivable/800*100}%`}}/><span className="ac-cost-remaining" data-owc-part="inventory" style={{width:`${f.balances.inventory/800*100}%`}}/></div><p>채권 {f.balances.receivable} + 재고 {f.balances.inventory}</p></div>
  <div className="ac-owc-row"><strong>빼는 항목: 매입채무</strong><div className="ac-owc-track" aria-hidden="true"><span className="ac-owc-payable" data-owc-part="payable" style={{width:`${f.balances.payable/800*100}%`}}/></div><p>공급자에게 아직 지급하지 않은 {f.balances.payable}</p></div>
  <figcaption>두 띠 전체 폭은 모두800가상단위입니다. 보라 사선은 받을 돈, 초록은 남은 상품, 노랑 세로무늬는 아직 낼 돈입니다. 매입채무는 현금 자체가 아니라 지급을 아직 하지 않은 의무입니다.</figcaption>
  <p className="ac-owc-equation">이 발췌의 좁은 영업운전자금 = {f.balances.receivable} + {f.balances.inventory} − {f.balances.payable} = <strong>{f.owc}</strong></p>
  <p className="ac-note">여기서만 채권+재고−매입채무로 좁혀 부릅니다. 유동자산−유동부채라는 일반 순운전자금이나 선급·미지급까지 포함한 분석과 같지 않습니다.</p>
 </figure>;
}
function LiquidityScene({frame:f}:{frame:WorkingFrame}){
 const failed=f.attempts.find(a=>a.status==='blocked');
 return <figure className="ac-figure"><h3>현금의 크기와 실제 사건 순서</h3><p className="ac-note">각 행은 관찰 단계입니다. 행 사이 간격은 일수 비례가 아니며 날짜를 함께 읽으세요. 모든 현금 막대는 전체 폭800입니다.</p>
  <div className="ac-cash-history">{f.history.map((p,i)=>{const failure=f.attempts.find(a=>a.day===p.day&&a.status==='blocked');return <div className="ac-cash-history-row" key={i} data-history-index={i} data-day={p.day} data-cash={p.cash}><span>M1 {p.day}일</span><div className="ac-history-track" aria-hidden="true"><span style={{width:`${p.cash/800*100}%`}}/></div><b>{p.cash}</b>{failure&&<strong className="ac-missed">× 당시 전액 지급 미실행 · 부족 {failure.shortage}</strong>}</div>;})}</div>
  {f.attempts.map(a=><div key={a.id} className={`ac-payment-attempt ${a.status==='blocked'?'is-blocked':''}`} data-attempt-status={a.status} data-shortage={a.shortage}>
   <strong>M1 {a.day}일 당시: {a.status==='blocked'?'전액 지급 미실행':'지급 완료'}</strong><p>필요 {a.required} · 직전 현금 {a.available} · 부족 {a.shortage}</p>
   <div className="ac-due-track" aria-hidden="true"><span className="ac-due-covered" style={{width:`${Math.min(a.available,a.required)/a.required*100}%`}}/><span className="ac-due-short" style={{width:`${a.shortage/a.required*100}%`}}/></div>
   <p className="ac-note">이 띠의 전체 폭은 당시 지급 필요액{a.required}입니다. 초록은 충당 가능한 부분, 빨강 사선은 부족분입니다. 위 현금800 눈금과 다릅니다.</p>
  </div>)}
  {failed&&<p className="ac-feedback">뒤에 현금이 들어와도 M1 {failed.day}일의 부족{failed.shortage}은 남은 기록입니다. 이 실험은 재시도를 하지 않아 매입채무{f.balances.payable}도 남습니다.</p>}
  {!f.attempts.length&&<p>지급 예정: M1 {f.dueDay}일 {f.payment}. 회수 예정: M1 15일 {f.collection}. 아직 지급 시도 전입니다.</p>}
 </figure>;
}
export function WorkingCapitalLab(){
 const [mode,setMode]=useState<WorkingMode>('base'),[collection,setCollection]=useState(160),[prediction,setPrediction]=useState('');
 const frames=workingCapitalFrames({mode,collection}),player=useFoundationPlayback(frames.length),f=frames[player.index];
 const reset=()=>{player.reset();setMode('base');setCollection(160);setPrediction('');};
 return <section className="ac-lab ac-operations" data-ac-lab="working-capital" aria-label="운전자금과 지급일 현금 실험"><p className="ac-eyebrow">06 · 이익과 지급 능력</p><h2>잘 팔았는데 왜 낼 돈이 부족할까요?</h2><p>같은 회사의 T01–T04 뒤 현금350에서 매입·판매·수금·지급만 봅니다. 80개 판매의 이익160은 모든 조건에서 같지만 채권·재고·지급일은 다릅니다.</p>
  <div className="ac-controls"><label>매입과 지급 조건<select aria-label="매입과 지급 조건" value={mode} onChange={e=>{player.reset();setPrediction('');setMode(e.target.value as WorkingMode);}}>{workingModes.map(m=><option key={m} value={m}>{workingLabels[m]}</option>)}</select></label><label>15일 회수액<select aria-label="15일 회수액" value={collection} onChange={e=>{player.reset();setPrediction('');setCollection(Number(e.target.value));}}>{[0,160,400].map(n=><option key={n} value={n}>{n}가상단위</option>)}</select></label><label>말일 현금만 알면 납기 성공도 알까<select aria-label="말일 현금만 알면 납기 성공도 알까" value={prediction} onChange={e=>setPrediction(e.target.value)}><option value="">먼저 예상해 보세요</option><option value="no">아니다, 당시 현금과 날짜도 필요하다</option><option value="yes">그렇다, 말일에 돈이 있으면 된다</option></select></label></div>
  <Controls player={player} count={frames.length} reset={reset}/><div className="ac-current" role="status" aria-live="polite"><strong>{f.title}</strong><p>{f.detail}</p></div><WorkingScene frame={f}/><LiquidityScene frame={f}/>
  <div className="ac-result" data-profit={f.exerciseProfit} data-cash={f.balances.cash} data-owc={f.owc} data-exercise-cash={f.exerciseCash} data-payable={f.balances.payable} data-failed={f.attempts.some(a=>a.status==='blocked')}><p>발췌 이익 {f.exerciseProfit} − 좁은 운전자금 증가 {f.owcChange} = 발췌 영업현금 변화 {f.bridgeCash}</p><p>기초현금350 + 발췌 현금 변화 {f.exerciseCash} = 현재 현금 {f.balances.cash}</p></div>
  {player.index===frames.length-1&&prediction&&<p className="ac-feedback" role="status">{prediction==='no'?'예측과 같습니다.':'말일 현금만으로 과거 납기 성공을 판단할 수 없습니다.'} 추가20개·12일 전액 납기·15일160 회수를 선택해 비교하세요. 전액 지급이 실패하면 채무도 남습니다.</p>}
  <StaticOperations frames={frames}/><p className="ac-note">발췌 기초의 채권·재고·매입채무는0이고 이 발췌에는 다른 영업 조정이 없어 위 짧은 다리가 성립합니다. 전체 M1 현금흐름표 공식이 아닙니다. 연체 비용·법적 효과·공급 중단·신용평가·차입 가능성을 계산하거나 유리한 계약을 추천하지 않습니다. 실제 지급 조건 변경은 상대방과의 계약을 확인해야 합니다.</p>
 </section>;
}

import {useMemo,useState} from 'react';
import {explainFrames,appCallComparison,type ExplainCase,type ExplainEstimate,type ExplainFrame,type PlanNode} from '../../simulations/database/explain.mjs';
import {DbPlayback,DbCurrent,DbSteps,useDbPlayback} from './LabShared';
import './explain.css';
const cases:Record<ExplainCase,string>={'growth-count':'64행 scan과 COUNT','nested-loop':'두 주문의 반복 항목 조회','limit':'LIMIT가 먼저 멈춘 경우'};
function PlanScene({frame:f,mobile,selected}:{frame:ExplainFrame;mobile:boolean;selected:string}) {
 const w=mobile?280:720,root=f.nodes.find(n=>n.id===f.rootId)!,children=f.nodes.filter(n=>n.id!==f.rootId),nw=mobile?(children.length===2?130:184):250,rw=mobile?190:300;
 const pos=(id:string)=>id===f.rootId?{x:(w-rw)/2,y:28,w:rw}:{x:children.length===1?(w-nw)/2:(id===children[0].id?4:w-nw-4),y:238,w:nw};
 const marker=`plan-${mobile}`;
 function drawNode(n:PlanNode) {const p=pos(n.id),barWidth=nw-20;return <g key={n.id} data-plan-node={n.id} data-node-selected={selected===n.id} data-estimated={n.estimatedRows} data-actual={n.actualRows??'unknown'} data-loops={n.loops??'unknown'}>
  <rect x={p.x} y={p.y} width={p.w} height="130" rx="8" className="db-plan-node"/>
  <text x={p.x+10} y={p.y+21} className="db-svg-title">{n.label.split(' · ')[0]}</text>{n.label.includes(' · ')&&<text x={p.x+10} y={p.y+39} className="db-svg-small">{n.label.split(' · ')[1]}</text>}
  <rect data-row-bar="estimate" data-value={n.estimatedRows} x={p.x+10} y={p.y+50} width={n.estimatedRows/f.scaleMax*barWidth} height="10" fill="none" stroke="#658199" strokeWidth="2" strokeDasharray="3 2"/>
  {n.actualRows!==null&&<rect data-row-bar="actual" data-value={n.actualRows} x={p.x+10} y={p.y+71} width={n.actualRows/f.scaleMax*barWidth} height="10" fill="#478b71"/>}
  <text x={p.x+10} y={p.y+102} className="db-svg-small">예상{n.estimatedRows} · 관측{n.actualRows??'모름'}</text>
  <text x={p.x+10} y={p.y+120} className="db-svg-small">{n.loops===null?'loops 미관측':`loops ${n.loops} · 총${n.totalEmitted}행`}</text>
 </g>;}
 return <svg viewBox={`0 0 ${w} 410`} role="img" aria-label="자식에서 부모로 전달되는 행 수와 같은 눈금의 예상 관측 비교">
 <defs><marker id={marker} markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#467a93"/></marker></defs>
 {f.edges.map((e,i)=>{const a=pos(e.from),b=pos(e.to),endX=b.x+b.w*(children.length===1?.5:i===0?.25:.75),output=f.nodes.find(n=>n.id===e.from)!.totalEmitted;return <g key={e.id}><path data-plan-edge={e.id} data-from={e.from} data-to={e.to} d={`M${a.x+a.w/2} ${a.y} V205 H${endX} V${b.y+130}`} fill="none" stroke="#467a93" strokeWidth="2.5" markerEnd={`url(#${marker})`}/><rect x={a.x+a.w/2-40} y="172" width="80" height="24" rx="5" fill="#f5f9fc" stroke="#c5d6e0"/><text x={a.x+a.w/2} y="189" textAnchor="middle" className="db-svg-small">{output===null?'출력 미관측':`출력 ${output}행`}</text></g>;})}
 {drawNode(root)}{children.map(drawNode)}
 <text x="5" y="394" className="db-svg-small">각 막대의 전폭 = {f.scaleMax}행 · 회당 행 수</text>
 </svg>;
}
function PacketScene({frame:f}:{frame:ExplainFrame}) {
 if(f.example!=='nested-loop')return null;
 return <figure className="db-figure"><svg viewBox="0 0 280 300" role="img" aria-label="첫 반복2행과 다음 반복1행의 실제 항목 연결">
 <defs><marker id="db-packet-arrow" markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#74669b"/></marker></defs>
 <text x="5" y="18" className="db-svg-title">실행 묶음과 복합키</text>
 {!f.packets.length&&<text x="5" y="55" className="db-svg-small">아직 안쪽 실행 결과가 없습니다.</text>}
 {f.packets.map((p,i)=>{const y=44+i*135,order=p.inputIds.find(id=>id.startsWith('orders:'))!;return <g key={p.id} data-plan-packet={p.id}><rect x="3" y={y-10} width="274" height="123" rx="8" fill="#f6f2fc" stroke="#aa9ac3" strokeDasharray="4 3"/><text x="9" y={y+7} className="db-svg-small">안쪽 실행{p.execution} · 출력{p.outputIds.length}행</text><g data-packet-order={order}><rect x="9" y={y+30} width="77" height="48" rx="5" fill="white" stroke="#718b9e"/><text x="47" y={y+49} textAnchor="middle" className="db-svg-small">주문</text><text x="47" y={y+67} textAnchor="middle" className="db-svg-title">{order.split(':')[1]}</text></g>{p.outputIds.map((id,j)=>{const ty=y+24+j*45;return <g key={id}><path data-packet-edge={id} data-from={order} data-to={id} d={`M86 ${y+54} H${103+j*12} V${ty+18} H149`} fill="none" stroke="#74669b" strokeWidth="2" markerEnd="url(#db-packet-arrow)"/><rect x="149" y={ty} width="119" height="36" rx="4" fill="white" stroke="#8877ac"/><text x="208" y={ty+23} textAnchor="middle" className="db-svg-small">항목 {id.slice(7).replace(':',',')}</text></g>;})}</g>;})}
 </svg><figcaption>같은 안쪽 노드를 두 번 실행해2행과1행이 나옵니다. 총3행 ÷ loops2 = 정확한 모델 평균1.5행입니다. packet ID는 실행 묶음이고 항목 복합키는 저장 행의 정체성입니다.</figcaption></figure>;
}
function InclusiveTimes({frame:f}:{frame:ExplainFrame}) {
 const max=f.intervals.length?Math.max(...f.intervals.map(i=>i.end)):10;
 return <figure className="db-figure"><svg viewBox={`0 0 280 ${70+f.intervals.length*34}`} role="img" aria-label="부모 안에 포함된 자식의 합성 시간 구간">
 <text x="5" y="17" className="db-svg-small">별도로 정한 합성 시간 · ms</text>
 {!f.intervals.length&&<text x="5" y="48" className="db-svg-small">이 단계에서 시간은 아직 미관측</text>}
 {f.intervals.map((i,j)=><g key={i.id} data-inclusive-interval={i.id}><text x="5" y={47+j*34} className="db-svg-small">{i.nodeId}{i.id.startsWith('interval:inner:')?` ${i.id.split(':').at(-1)}`:''}</text><rect x={85+i.start/max*185} y={31+j*34} width={(i.end-i.start)/max*185} height="23" fill={i.nodeId===f.rootId?'#d7e7f3':'#83b39e'} stroke="#597f91"/><text x={86+i.start/max*185} y={47+j*34} className="db-svg-small">{i.start}–{i.end}</text></g>)}
 </svg><figcaption>자식 구간이 부모 구간 안에 있습니다. 더하면 중복입니다. 실제 EXPLAIN의 actual time 두 수는 시작/총 소요시간의 회당 평균이지 이 그림의 공통 시계 시작·끝 좌표가 아닙니다.</figcaption></figure>;
}
export function ExplainLab() {
 const[example,setExample]=useState<ExplainCase>('growth-count'),[observed,setObserved]=useState(true),[estimate,setEstimate]=useState<ExplainEstimate>('low'),[selected,setSelected]=useState('');
 const frames=useMemo(()=>explainFrames({example,observed,estimate}),[example,observed,estimate]),player=useDbPlayback(frames.length),f=frames[player.index],id=selected||f.activeNodeId||f.rootId,n=f.nodes.find(n=>n.id===id)??f.nodes[0];
 const reset=()=>{player.reset();setExample('growth-count');setObserved(true);setEstimate('low');setSelected('');};
 return <section className="db-lab" data-db-lab="explain"><p className="db-eyebrow">08 · 합성 plan, 실제 서버 출력 아님</p><h2>같은 rows 숫자가 같은 것을 셀까요?</h2><p>자식에서 부모로 올라가는 행, 예상한 수, 실행해서 관측한 수를 나눕니다. 입력행을 세는 COUNT도 결과로는 숫자 하나가 든1행을 반환합니다.</p><div className="db-controls">
 <label>실행계획의 고정 예<select aria-label="실행계획의 고정 예" value={example} onChange={e=>{player.reset();setExample(e.target.value as ExplainCase);setSelected('');}}>{Object.entries(cases).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
 <label>관측하는 범위<select aria-label="관측하는 범위" value={String(observed)} onChange={e=>{player.reset();setObserved(e.target.value==='true');}}><option value="true">예상과 모델 실행 관측</option><option value="false">예상만 · 실행 관측 없음</option></select></label>
 <label>64행 예의 예상<select aria-label="64행 예의 예상" value={estimate} disabled={example!=='growth-count'} onChange={e=>{player.reset();setEstimate(e.target.value as ExplainEstimate);}}><option value="low">낮은 예상4행</option><option value="aligned">맞춘 예상40행</option></select></label>
 <label>자세히 볼 plan 노드<select aria-label="자세히 볼 plan 노드" value={n.id} onChange={e=>setSelected(e.target.value)}>{f.nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}</select></label></div>
 <DbPlayback player={player} count={frames.length} reset={reset}/><DbCurrent frame={f}/>
 <figure className="db-figure"><div className="db-desktop"><PlanScene frame={f} mobile={false} selected={n.id}/></div><div className="db-mobile"><PlanScene frame={f} mobile selected={n.id}/></div><figcaption>점선 외곽은 예상, 초록 채움은 모델 관측입니다. 예상은 익명 수량이지 미리 알아낸 행 id가 아닙니다. 값마다 같은0–{f.scaleMax}행 눈금을 쓰며4와40을 같은 길이로 자르지 않습니다.</figcaption></figure>
 {f.result&&<p className="db-plan-result" data-result-rows={f.result.rows} data-count-value={f.result.countValue??'none'}>최종 출력 {f.result.rows}행{f.result.countValue!==null?` · 그 한 행의 COUNT 값 ${f.result.countValue}`:''}</p>}
 <section className="db-plan-detail" data-selected-plan-node={n.id}><h3>{n.label}에서 읽는 단위</h3><dl><div><dt>예상 출력/회</dt><dd data-plan-measure="estimatedRows">{n.estimatedRows}행</dd></div><div><dt>관측 출력/회</dt><dd data-plan-measure="actualRows">{n.actualRows??'미관측'}</dd></div><div><dt>실행 횟수 loops</dt><dd data-plan-measure="loops">{n.loops??'미관측'}</dd></div><div><dt>누적 출력</dt><dd data-plan-measure="totalEmitted">{n.totalEmitted??'미관측'}</dd></div></dl><p>합성 cost {n.cost}: 시간 단위 아님. actual startup/total {n.actualTotalMs===null?'미관측':`${n.actualStartupMs} / ${n.actualTotalMs}ms·회당`}.</p><p data-plan-buffers>BUFFERS {n.buffers?`hit ${n.buffers.hit} / read ${n.buffers.read} · 모든 loops의 누적 접근`:'미관측'}. 부모는 자식 활동을 포함하므로 합치지 않습니다. read는 PostgreSQL 공유 버퍼 밖에서 가져온 것으로, 물리 장치 읽기의 직접 증거가 아닙니다.</p>{n.bufferAccesses.length>0&&<div className="db-buffer-accesses" aria-label="반복을 포함한 버퍼 접근 토큰">{n.bufferAccesses.map(a=><span key={a.id} data-buffer-access={a.id} data-page-id={a.pageId}>{a.pageId}<small>{a.kind}</small></span>)}</div>}<p>토큰은 접근 사건입니다. 같은 페이지 이름이 반복되면 같은 페이지를 다시 접근한 것입니다. 부모를 고르면 자식의 같은 사건 ID를 포함합니다.</p></section>
 <PacketScene frame={f}/><InclusiveTimes frame={f}/>
 {f.stopProof&&<p className="db-limit-proof" data-limit-visited={f.stopProof.visited}>LIMIT의 중단 증거: {f.stopProof.visited}행 확인, {f.stopProof.emitted}행 출력에서 부모 요구 충족. 끝까지의 일치 행 수는{f.stopProof.possibleFullOutputs}입니다. 적은 actual을 통계 오류의 증거로 단정하지 않습니다.</p>}
 <details className="db-static"><summary>선택한 노드의 실제 모델 행 ID</summary><p>fixture: {f.fixtureId}. 예상 행에는 ID를 부여하지 않습니다.</p><p>확인한 입력: {n.actualRows===null?'미관측':n.visitedIds.join(', ')||'없음'}</p><p>내보낸 출력: {n.actualRows===null?'미관측':n.emittedIds.join(', ')||'없음'}</p></details>
 <details className="db-static"><summary>실행하지 않는 SQL 예시</summary><pre className="db-plan-sql"><code>{f.sql}</code></pre></details>
 <p className="db-model-note">별도64행 성장 fixture와 고객1의 원래 주문2건은 서로 다른 예입니다. 필터는 scan에 붙인 조건이며 독립 PostgreSQL Filter 노드를 만든 것이 아닙니다. 시간·비용·buffer 값은 저자가 정한 합성 관측이고 실제 optimizer·cache·driver 실행을 재현하지 않습니다.</p><DbSteps frames={frames}/></section>;
}
export function AppCallComparison() {
 const f=appCallComparison();
 return <section className="db-lab" data-db-lab="app-calls"><p className="db-eyebrow">08 · plan 밖의 앱 요청</p><h2>loops2와 DB 호출3회는 다릅니다</h2><p>{f.detail}</p><div className="db-app-call-comparison">{[['JOIN 한 번',f.oneQuery],['주문 목록 뒤 항목별 호출',f.nPlusOne]].map(([label,calls])=><div className="db-app-call-lane" key={String(label)}><strong>{String(label)}</strong><span className="db-app-request">앱 요청1개</span><div className="db-app-call-flow">{(calls as typeof f.oneQuery).map(c=><div key={c.id} data-app-call={c.id}><span aria-hidden="true">↓</span><span>{c.label}<small data-app-call-rows={c.outputIds.length}>별도 DB 호출 · 반환{c.outputIds.length}행</small></span></div>)}</div></div>)}</div><p data-app-assembled-rows={f.applicationRows}>앱이 조립한 주문·항목 결과는 두 방식 모두{f.applicationRows}행입니다. 그러나 DB 호출이 돌려준 행의 합은 JOIN {f.totalReturnedRows.oneQuery}행, 나눈 호출 {f.totalReturnedRows.nPlusOne}행입니다. 주문 목록과 항목 행을 받은 뒤 앱에서 연결하기 때문입니다.</p><p>이 합은 전송 바이트나 저장 행 수가 아닙니다. 호출을 줄여도 모든 상황에서 더 빠르다는 보장은 없습니다. 앱 지연·반환량·DB 작업을 함께 측정합니다.</p></section>;
}

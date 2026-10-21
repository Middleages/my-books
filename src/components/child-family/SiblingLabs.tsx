import { useId, useState } from 'react';
import { beforeSiblingFrame, livingSiblingFrame, siblingAges, type SiblingFrame, type SiblingScene } from '../../simulations/child-family/sibling.mjs';
import './sibling.css';

function ConnectionMap({scene}:{scene:SiblingScene}) {
 return <figure className="sibling-map"><figcaption>{scene.title}</figcaption>
  <div className="sibling-drawing" aria-hidden="true">
   <svg viewBox="0 0 100 100" preserveAspectRatio="none">
    {scene.edges.map(e=>{const a=scene.nodes.find(n=>n.id===e.from)!;const b=scene.nodes.find(n=>n.id===e.to)!;return <path key={e.from+e.to} d={`M ${a.x} ${a.y+8} L ${b.x} ${b.y-8}`} className={e.status==='지원 확인 전'?'sibling-pending':''} />;})}
   </svg>
   {scene.nodes.map(n=><span key={n.id} className={`sibling-node sibling-${n.kind}`} style={{left:`${n.x}%`,top:`${n.y}%`}}>{n.label}</span>)}
  </div>
  <p>{scene.space}</p>
  <ul className="sibling-connections">{scene.edges.map(e=><li key={e.from+e.to}>{scene.nodes.find(n=>n.id===e.from)?.label} → {scene.nodes.find(n=>n.id===e.to)?.label}: {e.label} · {e.status}</li>)}</ul>
  <p className="sibling-time">함께하는 시간: {scene.time}</p>
 </figure>;
}
function StaticAlternative({frame}:{frame:SiblingFrame}) {
 return <details className="sibling-static"><summary>같은 장면을 글로 읽기</summary>
  {frame.scenes.map(scene=><section key={scene.id}><h4>{scene.title}</h4><p>{scene.space}</p><ul>{scene.nodes.map(n=><li key={n.id}>{n.label}: {n.detail}</li>)}{scene.edges.map(e=><li key={e.from+e.to}>{scene.nodes.find(n=>n.id===e.from)?.label} → {scene.nodes.find(n=>n.id===e.to)?.label}: {e.label} · {e.status}</li>)}</ul><p>함께하는 시간: {scene.time}</p></section>)}
  {frame.needs?.map(n=><p key={n.id}>{n.label}: {n.need} → {n.owner}: {n.action}</p>)}
  <p>{frame.explanation}</p><p>{frame.adultPreparation}</p><p>{frame.limit}</p>
 </details>;
}
function SiblingLab({before}:{before:boolean}) {
 const id=useId(); const [age,setAge]=useState('1–2세');const [option,setOption]=useState(before?'pending':'together');
 const frame=before?beforeSiblingFrame(age,option):livingSiblingFrame(age,option);
 return <section className="sibling-lab" aria-labelledby={id} data-sibling-lab={before?'before':'living'}>
  <h3 id={id}>{before?'전후 생활 연결 지도':'두 필요를 잇는 성인 연결'}</h3>
  <p>{before?'예측해 보세요. 설명을 바꾸는 것과 돌봄 담당을 준비하는 것은 같은 변화일까요?':'예측해 보세요. 지원 성인이 참여하면 아이의 필요가 없어질까요, 성인의 연결이 달라질까요?'}</p>
  <div className="sibling-controls"><label>기존 아이 연령 <select aria-label="기존 아이 연령" value={age} onChange={e=>setAge(e.target.value)}>{siblingAges.map(a=><option key={a}>{a}</option>)}</select></label>
   <button type="button" aria-pressed={option!=='shared'} onClick={()=>setOption(before?'pending':'together')}>{before?'지원 확인 전':'한 성인에게 모인 필요'}</button>
   <button type="button" aria-pressed={option==='shared'} onClick={()=>setOption('shared')}>{before?'지원 역할 수락 예':'지원 성인과 나누는 예'}</button>
   <button type="button" onClick={()=>{setAge('1–2세');setOption(before?'pending':'together');}}>처음으로</button>
  </div>
  <p className="sibling-legend">둥근 테두리 = 성인 · 네모 = 기존 아이 · 이중 테두리 = 새 아기. 실선 = 정해 둔 성인 역할, 점선 = 지원 확인 전. 위치는 역할·생활 자리 구분이며 실제 거리나 시간 비율이 아닙니다.</p>
  <div className={`sibling-scenes ${before?'sibling-comparison':''}`}>{frame.scenes.map(scene=><ConnectionMap key={scene.id} scene={scene}/>)}</div>
  {frame.needs&&<div className="sibling-needs" aria-label="아이마다 남아 있는 필요">{frame.needs.map(n=><div key={n.id}><strong>{n.label}</strong><span>{n.need}</span><span className="sibling-need-link">↓ 성인이 맡음</span><strong>{n.owner}</strong><span>{n.action}</span></div>)}</div>}
  <div role="status" className="sibling-status"><p>{frame.ageBand}: {frame.explanation}</p><p>{frame.adultPreparation}</p></div>
  <div className="sibling-facts"><h4>장면의 사실</h4><ul>{frame.observedFacts.map(x=><li key={x}>{x}</li>)}</ul><h4>단정하지 않는 해석</h4><ul>{frame.hypotheses.map(x=><li key={x}>{x}</li>)}</ul><h4>아직 모르는 것</h4><ul>{frame.unknowns.map(x=><li key={x}>{x}</li>)}</ul></div>
  <StaticAlternative frame={frame}/><p className="model-note">{frame.limit} 연령 선택은 이해 수준 검사나 발달 판정이 아닙니다. 자동 재생·타이머는 없습니다.</p>
 </section>;
}
export function BeforeSiblingLab(){return <SiblingLab before/>;}
export function LivingSiblingLab(){return <SiblingLab before={false}/>;}

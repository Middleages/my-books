import {useState} from 'react';
import {adjustmentFrame} from '../../simulations/child-family/adjustment.mjs';
import './family.css';
import './family-c.css';
export function AdjustmentLab(){
 const [day,setDay]=useState(0),[shared,setShared]=useState(false);const f=adjustmentFrame(day,shared);
 return <section className="cf-lab cfc-lab" data-cf-lab="adjustment" aria-label="적응 관찰의 맥락과 빈칸"><h3>같은 순서 위에 관찰을 놓기</h3><p>세 기록은 가상 사례입니다. A·B·C는 비교용 기록 이름이지 적응 단계나 성공 일수가 아닙니다. 간격은 실제 시간 길이가 아닙니다.</p>
 <label>가상 기록 선택<select value={day} onChange={e=>setDay(Number(e.target.value))}>{[0,1,2].map(d=><option value={d} key={d}>{adjustmentFrame(d).dayLabel}</option>)}</select></label>
 <label className="cf-check"><input type="checkbox" checked={shared} onChange={e=>setShared(e.target.checked)}/>교사 기록 함께 보기</label>
 <div className="cfc-timeline" data-record={day} data-shared={String(shared)}>{f.slots.map((s,i)=><div className="cfc-time-unit" key={s.id}><article className={'cfc-observation '+(s.known?'cfc-known':'cfc-unknown')} data-context={s.id} data-known={String(s.known)}><strong>{s.context}</strong><span className="cfc-marker" aria-hidden="true">{s.known?'●':'?'}</span><p>{s.text}</p></article>{i<2&&<div className={'cfc-time-link '+(f.links[i].connected?'cfc-connected':'cfc-gap')} aria-label={f.links[i].connected?'두 맥락의 기록 연결':'사이 맥락 기록 미확인'}><span>{f.links[i].connected?'기록 연결':'? 빈칸'}</span></div>}</div>)}</div>
 <p>●와 실선은 알려진 관찰, ?와 끊긴 점선은 미확인입니다. 연결은 관찰 맥락을 함께 놓았다는 뜻이며 아이가 좋아졌다는 화살표가 아닙니다.</p>
 <div className="cf-result" aria-live="polite"><strong>{f.summary}</strong><p>다음 질문: {f.question}</p><p>해석과 구별하기: {f.hypotheses[0]}</p></div>
 <button type="button" onClick={()=>{setDay(0);setShared(false)}}>전체 초기화</button>
 <details><summary>현재 관찰과 빈칸을 정적으로 읽기</summary><ol>{f.slots.map(s=><li key={s.id}>{s.context}: {s.text}</li>)}</ol><p>{f.summary}</p><p>미확인: {f.unknowns.join(' / ')}</p><p>다음 질문: {f.question}</p></details>
 </section>;
}

import { useState } from 'react';
import { boundaryFrame, careFrame, moveStep } from '../../simulations/child-emotions/foundation.mjs';
import './emotions.css';

function Person({ label, kind }: {label:string;kind:string}) {
 return <div className={`ce-person ce-${kind}`}><span aria-hidden="true" className="ce-head"/><span aria-hidden="true" className="ce-body"/><strong>{label}</strong></div>;
}
export function BoundaryLab() {
 const [emotion,setEmotion]=useState(0),[action,setAction]=useState('throw'),[prediction,setPrediction]=useState('');
 const f=boundaryFrame(emotion,action);
 return <section className="ce-lab" data-ce-lab="boundary" aria-label="감정과 행동의 두 층">
 <h3>마음의 추측을 바꿔도 안전 경계는 남습니다</h3><p>{f.age} · {f.fact}</p>
 <div className="ce-controls"><label>잠정적인 감정 해석<select aria-label="잠정적인 감정 해석" value={emotion} onChange={e=>setEmotion(Number(e.target.value))}><option value="0">화가 난 듯해요</option><option value="1">실망한 듯해요</option><option value="2">아직 모르겠어요</option></select></label><label>관찰할 행동<select aria-label="관찰할 행동" value={action} onChange={e=>setAction(e.target.value)}><option value="throw">사람 쪽으로 던지려 함</option><option value="put">바닥에 내려놓음</option></select></label></div>
 <div className="ce-boundary-scene" data-action={f.action}>
 <div className="ce-inner"><div className="ce-thought">점선 · 해석<br/><strong>{f.interpretation}</strong></div><Person label="아이" kind="child"/></div>
 <div className={`ce-route ${f.safePath?'ce-ground':'ce-blocked'}`}><span className="ce-cube" aria-hidden="true"/><strong>{f.safePath?'↓ 바닥에 놓는 경로':'→ 사람 쪽 경로 · 멈춤'}</strong><span className="ce-barrier" aria-hidden="true">{f.safePath?'▱':'┃'}</span></div>
 <Person label="곁의 사람" kind="adult"/>
 </div>
 <div className="ce-facts" aria-live="polite"><p><strong>실선 · 관찰 행동:</strong> {f.observed}</p><p><strong>행동 경계:</strong> {f.boundary}</p><p>{f.unknown}</p></div>
 <p className="ce-note">위치와 선은 역할·방향을 설명합니다. 거리·힘·위험 확률이나 실제 아이의 다음 행동을 계산하지 않습니다. 감정을 없애는 선이 아니라 다치게 하는 행동의 경계입니다.</p>
 <label>예측: 감정 해석이 달라지면 다치게 해도 될까요?<select aria-label="예측: 감정 해석이 달라지면 다치게 해도 될까요?" value={prediction} onChange={e=>setPrediction(e.target.value)}><option value="">선택해 보세요</option><option value="no">아니요. 안전 경계는 유지해요.</option><option value="yes">네. 감정에 따라 달라져요.</option></select></label>
 {prediction&&<p role="status">{prediction==='no'?'맞습니다.':'다시 살펴보세요.'} 감정을 인정하는 것과 다치게 하는 행동을 허용하는 것은 다릅니다.</p>}
 <button onClick={()=>{setEmotion(0);setAction('throw');setPrediction('');}}>전체 초기화</button>
 <details><summary>정적 비교로 읽기</summary><ul><li>마음: 화남·실망·모름 모두 잠정 해석입니다.</li><li>행동: 사람 쪽으로 던지려는 행동에는 안전 경계가 필요합니다.</li><li>대안: 내려놓는 경로를 안내해도 아이의 마음을 확정할 수는 없습니다.</li></ul></details>
 </section>;
}
export function CareLab() {
 const [step,setStep]=useState(0); const f=careFrame(step);
 return <section className="ce-lab" data-ce-lab="care" aria-label="공동조절의 관찰 과정"><h3>아이의 신호와 보호자의 반응</h3><p>{f.age} · 단계는 교육 순서이며 실제 돌봄의 고정 절차나 시간표가 아닙니다.</p>
 <ol className="ce-steps">{['관찰','환경과 필요','반응과 재관찰'].map((x,i)=><li key={x} aria-current={step===i?'step':undefined}>{i+1}. {x}</li>)}</ol>
 <div className="ce-care-scene" data-step={step}><div className="ce-environment">주변 환경 · 소리와 빛, 안전, 몸의 불편함을 살필 자리</div><Person label="아기" kind="baby"/><div className="ce-exchange"><span>→ 신호를 살피기</span><span className={step===2?'ce-active':''}>← 곁에서 반응하기</span></div><Person label="보호자" kind="adult"/></div>
 <div className="ce-facts" aria-live="polite"><p><strong>{f.attention}:</strong> {f.signal}</p><p>{f.response}</p><p>{f.next}</p><strong>{f.outcome}</strong></div>
 <div className="ce-controls"><button disabled={step===0} onClick={()=>setStep(moveStep(step,-1))}>이전 단계</button><button disabled={step===f.steps-1} onClick={()=>setStep(moveStep(step,1))}>다음 단계</button><button onClick={()=>setStep(0)}>전체 초기화</button></div>
 <p className="ce-note">자동 재생·진정 타이머·성공 판정이 없습니다. 화살표는 상호작용의 방향이지 치료 효과가 아닙니다. 관찰되지 않은 결말을 웃는 아기 그림으로 만들어 내지 않습니다.</p>
 <details><summary>모든 단계를 정적으로 읽기</summary><ol>{[0,1,2].map(i=>{const row=careFrame(i);return <li key={i}><strong>{row.attention}</strong>: {row.response} {row.next}</li>;})}</ol></details>
 </section>;
}

import {useState} from 'react';
import {signalFrame,languageFrame} from '../../simulations/child-emotions/signals.mjs';
import './emotions.css';
import './signals.css';
export function SignalLab(){
 const [guess,setGuess]=useState(0),[extra,setExtra]=useState(false); const f=signalFrame(guess,extra);
 return <section className="ce-lab" data-ce-lab="signals" aria-label="관찰과 잠정 해석"><h3>사실은 남고 해석은 바뀝니다</h3><p>{f.age} · 점선은 추측, 실선은 본 행동입니다.</p>
 <div className="ce-controls"><label>잠정 해석<select aria-label="잠정 해석" value={guess} onChange={e=>setGuess(Number(e.target.value))}>{['피곤한 듯해요','속상한 듯해요','아직 모르겠어요'].map((x,i)=><option key={x} value={i}>{x}</option>)}</select></label><button aria-pressed={extra} onClick={()=>setExtra(!extra)}>{extra?'추가 관찰 접기':'추가 관찰 펼치기'}</button></div>
 <div className="ces-observation"><div className="ces-guess"><strong>보호자의 해석 · 점선</strong><p>{f.interpretation}</p><span>↓ 사실로 확정하지 않음</span></div><div className="ces-record"><strong>아이에게서 본 행동 → 관찰 기록 · 실선</strong><ol>{f.facts.map(x=><li key={x}>{x}</li>)}</ol></div></div>
 <p role="status">{f.unknown}. 다른 놀이를 가리켜도 처음 행동의 이유까지 확정되지는 않습니다.</p><p className="ce-note">먼저 예측해 보세요. 해석을 바꾸면 아래 관찰 기록도 지워질까요? 해석 선택은 실제 아이의 마음을 검사하는 기능이 아닙니다.</p><button onClick={()=>{setGuess(0);setExtra(false);}}>전체 초기화</button>
 <details><summary>정적 비교로 읽기</summary><ul>{[0,1,2].map(i=>{const x=signalFrame(i,true);return <li key={i}>해석: {x.interpretation} / 같은 관찰: {x.facts.join(' → ')} / {x.unknown}</li>;})}</ul></details></section>;
}
export function LanguageLab(){
 const [ready,setReady]=useState(false);const f=languageFrame(ready);
 return <section className="ce-lab" data-ce-lab="language" aria-label="대화의 자리"><h3>시계 대신 참여할 수 있는지를 봅니다</h3><p>24–36개월 합성 비교. 선택은 미래 상태를 만들어 내지 않습니다.</p><label>비교할 장면<select aria-label="비교할 장면" value={String(ready)} onChange={e=>setReady(e.target.value==='true')}><option value="false">지금 대화가 어려움</option><option value="true">함께 대화 가능</option></select></label>
 <div className="ces-safety"><strong>유지되는 경계: {f.safety}</strong><div className="ces-zones">{['now','later'].map(zone=><div className="ces-zone" key={zone} data-zone={zone}><h4>{zone==='now'?'지금 확인':'나중 대화'}</h4>{zone==='now'&&<p>주변 안전 · 보호자의 여유 · 곁의 반응</p>}{f.zone===zone?<div className="ces-talk"><span aria-hidden="true">◯</span><strong>{f.conversation}</strong></div>:<p className="ces-empty">대화를 강요하지 않음</p>}</div>)}</div></div>
 <p role="status">{f.observation}. {f.unknown}.</p><p className="ce-note">대화 카드의 위치만 바뀝니다. 안전 경계는 유지됩니다. 시간 눈금·진정 점수·성공 판정은 없습니다.</p><button onClick={()=>setReady(false)}>전체 초기화</button><details><summary>두 장면을 정적으로 읽기</summary><ul>{[false,true].map(v=>{const x=languageFrame(v);return <li key={String(v)}>{x.observation}: 대화는 {v?'지금 함께 가능한 자리':'나중 자리'} / {x.safety} / {x.unknown}</li>;})}</ul></details></section>;
}

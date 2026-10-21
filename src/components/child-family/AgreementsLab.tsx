import {useState} from 'react';
import {agreementFrame} from '../../simulations/child-family/agreements.mjs';
import './family.css';
import './family-c.css';
export function AgreementsLab(){const [option,setOption]=useState('separate'),[answer,setAnswer]=useState(false);const f=agreementFrame(option,answer);
 return <section className="cf-lab cfc-lab" data-cf-lab="agreements" aria-label="안전 경계와 조정 가능한 인사 방식"><h3>움직여도 되는 것과 그대로 남는 것</h3><p>인사 방식을 의논하는 합성 장면입니다. 아래 경계는 안전 원칙을 취향과 구별하는 표시이며 구체적 안전 수칙 전체나 이 선택의 안전 인증을 뜻하지 않습니다.</p>
 <label>인사 방식 제안<select aria-label="인사 방식 제안" value={option} onChange={e=>setOption(e.target.value)}><option value="separate">서로 다른 방식 유지</option><option value="shared">같은 인사말 제안</option></select></label>
 <div className="cfc-boundary" data-option={option}><strong className="cfc-boundary-label">{f.boundary}</strong><p>안쪽: 상의할 수 있는 방식 · 위치는 선호의 구분이며 우열이 아닙니다.</p><div className="cfc-choice-map">{f.choices.map(c=><div className={'cfc-choice cfc-lane-'+c.lane} key={c.owner}><strong>{c.owner}</strong><span>{c.label}</span></div>)}</div><p>{f.agreement}</p></div>
 <div className={'cfc-rule-link '+(f.rule.known?'cfc-connected':'cfc-gap')} aria-hidden="true">{f.rule.known?'기관 답변과 연결':'? 답변 대기'}</div>
 <div className={'cfc-rule '+(f.rule.known?'cfc-known':'cfc-unknown')} data-rule-known={String(f.rule.known)}><strong>{f.rule.label}</strong><p>{f.rule.question}</p></div>
 <label className="cf-check"><input type="checkbox" checked={answer} onChange={e=>setAnswer(e.target.checked)}/>가상 기관의 장소 답변 보기</label>
 <div className="cf-result" aria-live="polite"><strong>{f.summary}</strong><p>{f.rule.label}. 실제 기관의 규칙이나 성인들의 동의는 여전히 별도 확인이 필요합니다.</p></div>
 <button type="button" onClick={()=>{setOption('separate');setAnswer(false)}}>전체 초기화</button><details><summary>현재 경계와 제안을 정적으로 읽기</summary><p>{f.boundary}</p><ul>{f.choices.map(c=><li key={c.owner}>{c.owner}: {c.label}</li>)}</ul><p>{f.agreement}</p><p>{f.rule.label}. 질문: {f.rule.question}</p><p>{f.summary}</p><p>미확인: {f.unknowns.join(' / ')}</p></details></section>;
}

import { useState } from 'react';
import { domains, states, observationFrame, ageFrame, evidenceAges, ageNeighbors } from '../../simulations/child-development/foundation.mjs';
import './child-development.css';
export function CareMap(){return <figure className="cd-care"><figcaption>역할이 다른 세 가지 렌즈</figcaption><ol><li><b>일상 관찰</b><span>무슨 상황에서 무엇을 했는지</span></li><li><b>표준 선별</b><span>정해진 도구·방법으로 추가 평가 필요성 살피기</span></li><li><b>전문 평가·진단</b><span>여러 정보와 전문 판단을 종합하기</span></li></ol><p>관찰 메모는 대화를 돕지만, 선별 점수나 진단으로 자동 변환되지 않습니다. 우려가 있으면 관찰을 더 쌓을 때까지 기다리지 않고 상담할 수 있습니다.</p></figure>}
export function DevelopmentMap(){
 const [index,setIndex]=useState(1),[domain,setDomain]=useState('전체'),[prediction,setPrediction]=useState('');
 const frame=observationFrame(index);
 return <section className="cd-lab" data-cd-lab="development"><h2>같은 아이, 서로 다른 관찰</h2><p className="cd-warning">가상 관찰 예시 · 규준 아님. 가로 위치는 세 번의 관찰 순서이며 월령·능력·순위가 아닙니다.</p>
 <label>볼 영역<select value={domain} onChange={e=>setDomain(e.target.value)}><option>전체</option>{domains.map(d=><option key={d}>{d}</option>)}</select></label>
 <div className="cd-controls" aria-label="관찰 시점">{[0,1,2].map(n=><button key={n} aria-pressed={n===index} onClick={()=>setIndex(n)}>관찰 {n+1}</button>)}</div>
 <div className="cd-lanes">{domains.map((d,i)=>(domain==='전체'||domain===d)&&<div className="cd-lane" key={d}><b>{d}</b><div className="cd-track">{[0,1,2].map(n=><span key={n} className={`cd-node cd-state-${observationFrame(n)[i].code} ${n===index?'cd-current':''}`} aria-label={`관찰 ${n+1}: ${observationFrame(n)[i].state}`}><span>{['●','○','—','?'][observationFrame(n)[i].code]}</span><small>{n+1}차</small></span>)}</div><p data-observation={i}><strong>{frame[i].state}</strong> · {frame[i].note}</p></div>)}</div>
 <p className="cd-legend">● 관찰함 / ○ 관찰하지 못함 / — 기회 없음 / ? 모름. 빈칸이나 0점으로 합치지 않습니다.</p>
 <label>예측: 두 번째 관찰의 소통 기록만으로 전 영역이 늦다고 말할까요?<select value={prediction} onChange={e=>setPrediction(e.target.value)}><option value="">먼저 생각해 보세요</option><option value="yes">그렇다</option><option value="no">아니다</option></select></label>
 {prediction&&<p className="cd-feedback" role="status">{prediction==='no'?'맞습니다.':'다시 살펴보세요.'} ‘이번에 보지 못함’은 모든 상황에서 못 한다는 뜻도, 다른 영역의 결과도 아닙니다. 우려는 구체적인 기록과 함께 상담합니다.</p>}
 <button onClick={()=>{setIndex(1);setDomain('전체');setPrediction('');}}>전체 초기화</button>
 <details><summary>모든 관찰 · 움직임 없이 읽기</summary>{[0,1,2].map(n=><div key={n}><h3>관찰 {n+1}</h3><ul>{observationFrame(n).map(o=><li key={o.domain}>{o.domain}: {o.state} · {o.note}</li>)}</ul></div>)}</details></section>
}
export function AgeLab(){
 const [gestation,setGestation]=useState(32),[elapsed,setElapsed]=useState(16),[months,setMonths]=useState(13);
 const f=ageFrame(gestation,elapsed),near=ageNeighbors(months);
 return <section className="cd-lab" data-cd-lab="age"><h2>출생일부터 잰 시간, 예정일부터 잰 시간</h2><p className="cd-warning">고정된 가상 출생일 2024-01-31. 실제 아이의 날짜를 입력하거나 저장하지 않습니다. 교정연령의 원리만 보여 주며 능력을 판정하지 않습니다.</p>
 <div className="cd-inputs"><label>가상 출생 재태기간 · 주<select value={gestation} onChange={e=>setGestation(Number(e.target.value))}>{[28,32,36].map(n=><option key={n} value={n}>{n}주</option>)}</select></label><label>출생 뒤 경과 시간 · 주<select value={elapsed} onChange={e=>setElapsed(Number(e.target.value))}>{[0,4,8,16,24].map(n=><option key={n} value={n}>{n}주</option>)}</select></label></div>
 <figure className="cd-age-figure"><figcaption>같은 날짜선 · 위치와 길이는 일수에 비례 (0–168일)</figcaption><div className="cd-axis"><span>출생<br/>0일</span><span>84일</span><span>168일</span></div><div className="cd-age-track"><span className="cd-early" style={{width:`${f.earlyDays/168*100}%`}}/><span className="cd-due" style={{left:`${f.earlyDays/168*100}%`}} aria-label={`예정일 위치 ${f.earlyDays}일`}>◆</span><span className="cd-now" style={{left:`${f.elapsedDays/168*100}%`}} aria-label={`관찰일 위치 ${f.elapsedDays}일`}>●</span></div><div className="cd-age-key"><span>◆ 예정일 · 출생 +{f.earlyDays}일</span><span>● 관찰일 · 출생 +{f.elapsedDays}일</span></div><dl><div><dt>출생일</dt><dd>{f.birth}</dd></div><div><dt>◆ 예정일</dt><dd>{f.due}</dd></div><div><dt>● 관찰일</dt><dd>{f.now}</dd></div></dl></figure>
 <p className="cd-result" aria-live="polite">생활 시간 {f.elapsedDays}일 − 일찍 태어난 시간 {f.earlyDays}일 = {f.correctedDays<0?`예정일 전 ${-f.correctedDays}일`:`교정 시간 ${f.correctedDays}일 (${f.correctedDays/7}주)`}</p><p>◆보다 ●가 왼쪽이면 아직 예정일 전입니다. 음수를 ‘0개월 능력’으로 바꾸지 않습니다. 1개월=4주로 환산하지 않으며, 아래 월령 탐색은 이 계산과 독립적입니다.</p>
 <h3>13개월 자료가 없다면 새 기준을 만들까요?</h3><label>자료를 찾아볼 생활 월령 · 개월<select value={months} onChange={e=>setMonths(Number(e.target.value))}>{[0,1,2,12,13,24,25,36].map(n=><option key={n} value={n}>{n}개월</option>)}</select></label>
 <div className="cd-evidence">{evidenceAges.map(n=><span key={n} className={n===near.before||n===near.after?'cd-near':''}>{n}<small>개월</small></span>)}</div>
 <p data-age-neighbors="true" aria-live="polite">{near.exact?`${months}개월 자료가 있습니다.`:`${months}개월이라는 새 체크 기준을 만들지 않습니다. 앞 자료 ${near.before===null?'없음':`${near.before}개월`}, 뒤 자료 ${near.after}개월의 실제 제목을 확인하세요.`} 앞뒤 자료는 탐색 링크이지 평균·보간·자동 검사 선택이 아닙니다.</p>
 <p><a href="https://www.cdc.gov/act-early/milestones/">CDC 원문에서 실제 연령별 자료 보기</a> · 미국 자료이며 한국 국가검진 일정이 아닙니다. 각 체크리스트의 사용 지침을 먼저 읽으세요.</p>
 <button onClick={()=>{setGestation(32);setElapsed(16);setMonths(13);}}>전체 초기화</button></section>
}

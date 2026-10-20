import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { conditionsDefaults, conditionsBoundaryCases, projectConditions, type ConditionsOptions, type ConditionsResult, type ConditionsFrame } from '../../simulations/insurance/conditions.mjs';
import { InsurancePrediction, InsuranceRange, InsuranceTable, percent, won } from './shared';
import './insurance.css';
import './coverage-conditions.css';

const benefitText=(value:number|null)=>value===null?'미정':won(value);
const stateText:Record<string,string>={pending:'○ 관찰 전',pass:'✓ 충족',fail:'× 충족하지 않음',reduced:'½ 감액 구간',unknown:'? 확인 필요',invalid:'! 순서 오류'};
function ConditionsTimeline({result}:{result:ConditionsResult}) {
  const t=result.timeline;
  return <figure className="conditions-timeline" aria-label="계약 효력과 담보 보장, 사건일과 청구일의 공통 날짜 축">
    <div className="conditions-time-row"><strong>계약 효력 구간</strong><div className="conditions-track contract" data-conditions-contract-track><i data-conditions-contract data-start={t.contract.start} data-end={t.contract.end} data-fraction={t.contract.fraction} style={{left:`${t.contract.leftFraction*100}%`,width:`${t.contract.fraction*100}%`}}/><span className="conditions-track-end" aria-hidden="true" style={{left:`${(t.contract.leftFraction+t.contract.fraction)*100}%`}}/></div><span className="conditions-row-note">0일 효력 발생 · 365일 종료(제외)</span></div>
    <div className="conditions-time-row"><strong>이 담보의 지급 구간</strong><div className="conditions-track benefit" data-conditions-timeline data-min={t.min} data-max={t.max} role="img" aria-label={t.periods.map(p=>`${p.label}: ${p.start}일부터 ${p.end}일 전까지`).join(', ')}>{t.periods.map(p=><i key={p.id} className={`conditions-period-${p.id}`} data-conditions-period={p.id} data-start={p.start} data-end={p.end} data-fraction={p.fraction} style={{left:`${p.leftFraction*100}%`,width:`${p.fraction*100}%`}}/>)}{t.boundaries.map(b=><i key={b.id} className="conditions-boundary" data-conditions-boundary={b.id} data-day={b.day} data-fraction={b.fraction} style={{left:`${b.fraction*100}%`}}/>)}</div><span className="conditions-row-note">길이 = 경과 일수 · 빗금/점/채움으로 구간 구분</span></div>
    {t.markers.map(marker=><div className={`conditions-time-row ${marker.id}`} key={marker.id}><strong>{marker.label} <b data-conditions-day={marker.id}>{marker.day===null?'미확인':`${marker.day}일`}</b></strong><div className="conditions-marker-track" data-conditions-marker-track={marker.id}>{t.boundaries.map(b=><i key={b.id} className="conditions-guide" style={{left:`${b.fraction*100}%`}}/>)}{marker.fraction!==null?<i className={`conditions-marker ${marker.id}`} data-conditions-marker={marker.id} data-day={marker.day} data-fraction={marker.fraction} style={{left:`${marker.fraction*100}%`}}><span aria-hidden="true">{marker.id==='event'?'◆':'●'}</span></i>:<span className="conditions-missing-marker">? 날짜 미확인 · 위치를 만들지 않음</span>}</div></div>)}
    <div className="insurance-axis"><span>{t.min}일</span><span>{t.max}일 · 모든 행 같은 눈금</span></div>
    <div className="conditions-period-key">{t.periods.map(p=><div key={p.id}><i className={`conditions-period-${p.id}`} aria-hidden="true"/><span><b>{p.label}</b><small>{p.start}일 이상 · {p.end}일 미만</small></span></div>)}</div>
    <div className="conditions-boundary-key">{t.boundaries.map(b=><span key={b.id}><b>{b.day}일</b> {b.label}</span>)}</div>
    <figcaption>◆는 사건이 발생한 날, ●는 청구한 날입니다. 각 표식의 가로 위치를 같은 경계선과 비교하세요. 청구 표식만 오른쪽으로 옮겨도 사건이 일어난 구간은 바뀌지 않습니다. 계약 효력 발생과 담보 보장개시는 서로 다른 경계입니다.</figcaption>
  </figure>;
}
function GateDiagram({frame}:{frame:ConditionsFrame}) {
  return <ol className="conditions-gates" aria-label="보장 사건, 제외, 날짜의 별도 확인 관문">{frame.gates.map(g=><li key={g.id} className="conditions-gate" data-conditions-gate={g.id} data-state={g.state}><div className="conditions-gate-opening" aria-hidden="true"><i/><span>{stateText[g.state].split(' ')[0]}</span><i/></div><strong>{g.label}</strong><span className="conditions-gate-state">{stateText[g.state]}</span><p>{g.detail}</p></li>)}</ol>;
}
export function CoverageConditionsOverview(){const result=projectConditions();return <div className="conditions-overview"><h3>계약은 시작됐지만, 이 담보는 아직</h3><ConditionsTimeline result={result}/><p className="insurance-note">첫 사례: 사건 {result.params.eventDay}일, 청구 {result.params.claimDay}일. 보장 사건이고 제외 조건이 없어도 사건은 대기구간에 있습니다. 이 가상 담보의 지급대상액은 {benefitText(result.benefit)}입니다.</p></div>;}
export function CoverageConditionsLab(){
  const [params,setParams]=useState<ConditionsOptions>({...conditionsDefaults});
  const [prediction,setPrediction]=useState('');
  const result=projectConditions(params),play=usePlayback(result.frames.length-1),frame=result.frames[play.step],final=frame.phase==='decision';
  const change=(patch:ConditionsOptions)=>{setParams(p=>({...p,...patch}));setPrediction('');play.rewind();};
  const reset=()=>{setParams({...conditionsDefaults});setPrediction('');play.rewind();};
  const booleanValue=(value:boolean|null)=>value===null?'unknown':value?'yes':'no';
  const fromValue=(value:string)=>value==='unknown'?null:value==='yes';
  const p=result.params;
  const answer=result.benefit===null?'unresolved':result.rate===0?'zero':result.rate===.5?'half':'full';
  return <section className="insurance-lab conditions-lab" data-insurance-lab="coverage-conditions" aria-label="사건일과 보장 조건 실험">
    <h3>청구일을 옮기면 사건의 보장도 바뀔까?</h3><p>모든 날짜와 비율은 가상 계약입니다. 정상 약정액은 {won(p.baseBenefit)}이며 이 금액을 바탕으로 조건을 비교합니다. 실제 건강정보나 사건 내용을 입력하지 않습니다.</p>
    <div className="insurance-controls"><InsuranceRange label="사건일" value={p.eventDay??0} min={-30} max={400} unit="일" onChange={value=>change({eventDay:value})}/><InsuranceRange label="청구일" value={p.claimDay??0} min={0} max={430} unit="일" onChange={value=>change({claimDay:value})}/></div>
    <fieldset className="conditions-boundary-buttons"><legend>사건일을 경계 바로 옆으로</legend>{[29,30,89,90,364,365].map(day=><button key={day} aria-pressed={p.eventDay===day} onClick={()=>change({eventDay:day})}>{day}일</button>)}<p className="insurance-note">사건일만 바뀝니다. 364·365일 비교에서는 청구일을 400일로 옮겨 보세요. 청구가 사건보다 앞서면 순서 오류로 남깁니다.</p></fieldset>
    <div className="insurance-controls"><label className="insurance-control">보장 사건 여부<select value={booleanValue(p.coveredEvent)} onChange={e=>change({coveredEvent:fromValue(e.target.value)})}><option value="yes">약정 보장 사건에 해당</option><option value="no">보장 사건에 해당하지 않음</option><option value="unknown">아직 모름</option></select></label><label className="insurance-control">제외 조건 적용<select value={booleanValue(p.exclusionApplies)} onChange={e=>change({exclusionApplies:fromValue(e.target.value)})}><option value="no">제외 조건 없음</option><option value="yes">가상 제외 조건 적용</option><option value="unknown">아직 모름</option></select></label><label className="insurance-control">자료 확인 상태<select value={p.informationKnown?'known':'unknown'} onChange={e=>change({informationKnown:e.target.value==='known'})}><option value="known">필요한 사실·문서 확인</option><option value="unknown">사실·문서 미확인</option></select></label></div>
    <InsurancePrediction question="이 조건에서 가상 지급대상액은?" value={prediction} onChange={setPrediction} options={[["zero","0원"],["half","약정액의 50%"],["full","약정액의 100%"],["unresolved","정보·날짜 확인 전에는 미정"]]}/>
    {play.controls}<div><button onClick={()=>play.seek(result.frames.length-1)}>조건 결과 보기</button><button onClick={reset}>조건까지 초기화</button></div>
    <div className="insurance-stage" data-insurance-stage={frame.phase} aria-live="polite"><strong>{frame.label}</strong><p>{frame.detail}</p></div>
    <ol className="conditions-process" aria-label="조건 관찰 단계">{result.frames.map(item=><li key={item.phase} data-current={frame.phase===item.phase}><button onClick={()=>play.seek(item.index)} aria-current={frame.phase===item.phase?'step':undefined}>{item.label}</button></li>)}</ol>
    <ConditionsTimeline result={result}/><GateDiagram frame={frame}/>
    <div className="conditions-current" data-conditions-status={frame.status}><span>현재 단계의 결과<strong>{frame.statusLabel}</strong></span><span>가상 지급대상액<strong data-conditions-paid data-value={frame.benefit??'unresolved'}>{benefitText(frame.benefit)}</strong></span><span>적용 비율<strong data-conditions-rate data-value={frame.rate??'unresolved'}>{frame.rate===null?'미정':percent(frame.rate)}</strong></span></div>
    <p className={`insurance-result ${final&&(result.status==='unresolved'||result.status==='invalid')?'warning':''}`} role="status">{final?`${prediction?prediction===answer?'예측과 같습니다. ':'예측과 다릅니다. ':''}${frame.verdict}`:'예측을 고른 뒤 관문을 차례로 살펴보세요. 관찰 중인 금액은 미정이며, 마지막 단계에서 조건을 함께 해석합니다.'}</p>
    <InsuranceTable title="현재 조건의 모든 관찰 단계"><table><caption>관찰 순서는 설명용입니다. 실제 보험회사의 심사 절차를 재현하지 않습니다.</caption><thead><tr><th>단계</th><th>날짜·자료</th><th>보장 사건</th><th>제외 조건</th><th>사건일 구간</th><th>결과</th><th>지급대상액</th></tr></thead><tbody>{result.frames.map(item=><tr key={item.phase} data-static-conditions={item.phase}><th>{item.label}</th>{item.gates.map(g=><td key={g.id}>{stateText[g.state]}</td>)}<td>{item.statusLabel}</td><td>{benefitText(item.benefit)}</td></tr>)}</tbody></table></InsuranceTable>
    <InsuranceTable title="정확한 날짜 경계 비교"><table><caption>보장 사건·제외 없음·자료 확인을 가정하고 청구일은 모두 400일로 고정합니다. 실제 청구기한을 뜻하지 않습니다.</caption><thead><tr><th>사건일</th><th>청구일</th><th>가상 구간</th><th>비율</th><th>지급대상액</th></tr></thead><tbody>{conditionsBoundaryCases().map(item=><tr key={item.params.eventDay} data-conditions-boundary-row={item.params.eventDay}><th>{item.params.eventDay}일</th><td>{item.params.claimDay}일</td><td>{item.statusLabel}</td><td>{item.rate===null?'미정':percent(item.rate)}</td><td>{benefitText(item.benefit)}</td></tr>)}</tbody></table></InsuranceTable>
    <p className="insurance-note">사건일을 기준으로 구간을 고르는 이 가상 담보만 모델링합니다. 실제 담보의 사고·진단 등 기준, 청구기한, 고지 관련 법적 효과, 개별 심사와 입금일은 판단하지 않습니다. 정보가 부족하면 확인 질문을 남깁니다. 그림은 이동 효과 없이 단계별로 바뀌며 움직임 줄이기에서도 같은 정보와 정적 표를 제공합니다.</p>
  </section>;
}

import { useState } from 'react';
import { usePlayback } from '../money/shared';
import { payoutDefaults, projectPayout, previewPayoutClaim, createPayoutYear, submitPayoutClaim, startNextPayoutYear, projectFixedBenefit, type PayoutClaimOptions, type PayoutFrame, type PayoutResult } from '../../simulations/insurance/payout.mjs';
import { InsurancePrediction, InsuranceRange, InsuranceTable, number, percent, won } from './shared';
import './insurance.css';
import './payout.css';

function LossPartition({ frame }: { frame: PayoutFrame }) {
  return <figure className="payout-loss-figure" aria-label="총손실을 중복 없이 나누는 금액 비례 띠"><div className="payout-total">총손실 <strong data-payout-loss>{won(frame.loss)}</strong></div><div className="payout-lossbar" data-payout-lossbar data-loss={frame.loss} role="img" aria-label={`전체 ${won(frame.loss)}. ${frame.segments.map(segment=>`${segment.label} ${won(segment.amount)}`).join(', ')}.`}>{frame.segments.map(segment => <i className={`payout-part ${segment.id}`} key={segment.id} data-payout-segment={segment.id} data-amount={segment.amount} data-fraction={segment.fraction} style={{ left:`${segment.leftFraction * 100}%`,width:`${segment.fraction * 100}%` }}/>)}</div><div className="insurance-axis"><span>0원</span><span>{won(frame.loss)} · 이 손실 전체</span></div>{frame.loss===0 && <p className="insurance-note">손실이 0원이므로 모든 구간의 폭도 0입니다.</p>}<div className="payout-segment-key">{frame.segments.filter(segment => segment.id !== 'unresolved' || segment.amount > 0).map(segment => <div className={`payout-key-item ${segment.id}`} key={segment.id} data-payout-key={segment.id}><i aria-hidden="true"/><span>{segment.label}</span><b>{won(segment.amount)}</b></div>)}</div><figcaption>띠 길이는 각 금액이 총손실에서 차지하는 비율입니다. 회색은 계산을 아직 마치지 않은 부분이며 확정된 보험금이 아닙니다. 슬라이더로 총손실을 바꾸면 전체 눈금도 바뀝니다. 값이 0인 항목에는 면적을 억지로 만들지 않습니다.</figcaption></figure>;
}
export function PayoutOverview() {
  const result = projectPayout();
  return <div className="payout-overview"><h3>500만원을 한 번만 나누기</h3><LossPartition frame={result.frames[result.frames.length-1]}/><p className="insurance-note">기본 가상 계약의 첫 청구 완료 모습입니다. 보험금 {won(result.paid)}과 남는 부담 {won(result.remainingBurden)}을 합하면 총손실입니다. 아래 실험에서 같은 띠가 나뉘는 순서를 관찰합니다.</p></div>;
}
function FrameTable({ result }: { result: PayoutResult }) {
  return <InsuranceTable title="계산 모든 단계의 손실 분해"><table><caption>금액은 만원. 각 행의 제외·공제·정률 부담·한도 초과·보험금·계산 전 부분을 모두 더하면 같은 총손실입니다.</caption><thead><tr><th>단계</th>{result.frames[0].segments.map(segment=><th key={segment.id}>{segment.label}</th>)}<th>총손실</th></tr></thead><tbody>{result.frames.map(frame=><tr key={frame.phase} data-static-payout={frame.phase}><th>{frame.label}</th>{result.frames[0].segments.map(segment=><td key={segment.id}>{number((frame.segments.find(item=>item.id===segment.id)?.amount ?? 0)/10000)}</td>)}<td>{number(frame.loss/10000)}</td></tr>)}</tbody></table></InsuranceTable>;
}
const defaultClaim = (): PayoutClaimOptions => ({loss:payoutDefaults.loss,excluded:payoutDefaults.excluded,deductible:payoutDefaults.deductible,insurerRate:payoutDefaults.insurerRate,perClaimLimit:payoutDefaults.perClaimLimit});
export function PayoutLab() {
  const [params,setParams]=useState(defaultClaim);
  const [year,setYear]=useState(()=>createPayoutYear());
  const [prediction,setPrediction]=useState('');
  const [fixedEligible,setFixedEligible]=useState(true);
  const result=previewPayoutClaim(year,params);
  const play=usePlayback(result.frames.length-1);
  const frame=result.frames[play.step];
  const final=play.step===result.frames.length-1;
  const change=(patch:PayoutClaimOptions)=>{setParams(previous=>({...previous,...patch}));setPrediction('');play.rewind();};
  const reset=()=>{setParams(defaultClaim());setPrediction('');setFixedEligible(true);play.rewind();};
  const record=()=>{setYear(previous=>submitPayoutClaim(previous,params));setPrediction('');play.rewind();};
  const newYear=()=>{setYear(previous=>startNextPayoutYear(previous));setPrediction('');play.rewind();};
  let previewYear=year;
  for(let index=0;index<3;index++) previewYear=submitPayoutClaim(previewYear,params);
  const previewClaims=previewYear.claims.slice(-3);
  const fixed=projectFixedBenefit({eventEligible:fixedEligible,amount:1000000});
  const p=result.params;
  return <section className="insurance-lab payout-lab" data-insurance-lab="payout" aria-label="손실 분해와 연간 한도 실험">
    <h3>손실에서 이번 보험금까지 · 한 청구 관찰</h3><p>이 가상 계약만의 계산 순서: 제외 → 공제 → 보험자 비율 → 건별한도 → 남은 연간한도. 실제 약관에 공통으로 적용하는 공식이 아닙니다. 연간총한도는 {won(p.annualLimit)}로 고정합니다.</p>
    <div className="insurance-controls"><InsuranceRange label="총손실" value={p.loss/10000} max={1000} step={25} unit="만원" onChange={value=>change({loss:value*10000})}/><InsuranceRange label="보장 제외 금액" value={p.excluded/10000} max={1000} step={25} unit="만원" onChange={value=>change({excluded:value*10000})}/><InsuranceRange label="공제 금액" value={p.deductible/10000} max={500} step={25} unit="만원" onChange={value=>change({deductible:value*10000})}/><InsuranceRange label="보험자 부담 비율" value={p.insurerRate*100} max={100} step={10} unit="%" onChange={value=>change({insurerRate:value/100})}/><InsuranceRange label="건별 지급한도" value={p.perClaimLimit/10000} max={1000} step={50} unit="만원" onChange={value=>change({perClaimLimit:value*10000})}/></div>
    <InsurancePrediction question="이번 보험금이 총손실을 모두 채울까요?" value={prediction} onChange={setPrediction} options={[["all","총손실만큼 지급된다"],["partial","부담이 남는다"]]}/>
    {play.controls}<div><button onClick={()=>play.seek(result.frames.length-1)}>이번 지급 결과 보기</button><button onClick={reset}>조건까지 초기화</button></div>
    <div className="insurance-stage" data-insurance-stage={frame.phase} aria-live="polite"><strong>{frame.label}</strong><p>{frame.detail}</p></div>
    <ol className="payout-process" aria-label="가상 계약의 계산 순서">{result.frames.map(item=><li key={item.phase} data-current={item.phase===frame.phase}><button onClick={()=>play.seek(item.index)} aria-current={item.phase===frame.phase?'step':undefined}>{item.label}</button></li>)}</ol>
    <LossPartition frame={frame}/>
    <p className={`insurance-result ${final && result.remainingBurden>0?'warning':''}`} role="status">{final ? `${prediction ? prediction === (result.remainingBurden===0?'all':'partial') ? '예측과 같습니다. ' : '예측과 다릅니다. ' : ''}${result.verdict}` : `현재까지 나뉜 본인부담 ${won(frame.resolvedBurden)}, 계산을 마치지 않은 부분 ${won(frame.unresolved)}입니다. 최종 보험금은 마지막 단계에서 확정합니다.`}</p>
    <div className="payout-current-summary"><span>현재 단계의 보험금 <strong data-payout-paid data-value={frame.paid}>{won(frame.paid)}</strong></span><span>현재까지 나뉜 본인부담 <strong data-payout-burden data-value={frame.resolvedBurden}>{won(frame.resolvedBurden)}</strong></span></div>
    <p className="insurance-note">계산 기초 미리 보기: 보험자 비율 {percent(p.insurerRate)}은 제외·공제 후 {won(result.rateBase)}에 적용합니다. 한도 전 계산액은 {won(result.payableBeforeCaps)}이며, 총손실 전체의 같은 비율을 주는 약속이 아닙니다. 지급액은 모델상 지급대상액으로, 실제 입금을 확인한 돈은 아닙니다.</p>
    <FrameTable result={result}/>
    <h3>같은 해에 다음 손실이 또 생긴다면?</h3><p>한 번의 상한과 한 해의 상한은 다릅니다. ‘이번 청구 기록하기’를 누를 때만 모형의 지급 내역에 한 건이 추가됩니다. 재생·정지·처음부터·조건 초기화는 연간 장부를 바꾸지 않습니다.</p>
    <div className="payout-annual-ledger" data-payout-annual-ledger><div className="payout-annual-heading"><strong>가상 보험연도 <span data-payout-year>{year.year}</span></strong><span>기록 <b data-payout-claim-count>{year.claims.length}</b>건</span></div><div className="payout-annual-track" data-payout-annual-track role="img" aria-label={`연간한도 ${won(year.params.annualLimit)} 중 사용 ${won(year.annualUsed)}, 남음 ${won(year.annualRemaining)}`}>
      {year.annualSegments.map(segment=><i key={segment.index} className="payout-annual-used-part" data-payout-annual-segment={segment.index} data-amount={segment.amount} style={{left:`${segment.leftFraction*100}%`,width:`${segment.fraction*100}%`}}/>)}
      <i className="payout-annual-available" data-payout-annual-available style={{left:`${year.annualUsedFraction*100}%`,width:`${year.annualRemainingFraction*100}%`}}/>
    </div><div className="insurance-axis"><span>0원</span><span>연간총한도 {won(year.params.annualLimit)}</span></div><div className="payout-annual-labels"><span>사용한 한도 <b data-payout-annual-used data-value={year.annualUsed}>{won(year.annualUsed)}</b></span><span>남은 한도 <b data-payout-annual-remaining data-value={year.annualRemaining}>{won(year.annualRemaining)}</b></span></div><p className="insurance-note">채운 초록은 사용한 한도, 빗금 없는 밝은 부분은 남은 한도입니다. 칸의 경계는 기록한 청구를 구분합니다. 보험회사의 실제 현금 잔액을 그린 통장이 아닙니다.</p>
    <button onClick={record} data-payout-record>이번 청구 기록하기</button><button onClick={newYear}>새 보험연도 시작</button><p className="payout-commit-note" aria-live="polite">지금 기록하면 {won(result.paid)}이 이번 연도 한도에 반영됩니다. 새 보험연도 시작만 사용한 한도를 0원으로 되돌리고 연도 번호를 올립니다.</p>
    <div className="insurance-table" role="region" aria-label="현재 보험연도 청구 기록" tabIndex={0}><table><caption>실제 청구가 아닌 실험 기록. 이전 건은 조건을 바꿔도 다시 계산하지 않습니다.</caption><thead><tr><th>이번 연도 청구</th><th>그때 손실</th><th>지급액</th><th>남는 부담</th><th>지급 뒤 연간 잔여</th></tr></thead><tbody>{year.claims.length ? year.claims.map((claim,index)=><tr key={index} data-payout-claim-row={index+1}><th>{index+1}번째</th><td>{won(claim.params.loss)}</td><td data-payout-recorded-paid>{won(claim.paid)}</td><td>{won(claim.remainingBurden)}</td><td>{won(claim.annualRemainingAfter)}</td></tr>):<tr><td colSpan={5}>아직 기록한 청구가 없습니다.</td></tr>}</tbody></table></div></div>
    <InsuranceTable title="지금부터 같은 청구 세 번의 정적 예상"><table><caption>현재 남은 연간한도에서 시작한 세 번의 예상입니다. 이 표를 열거나 재생해도 장부에는 기록되지 않습니다. 금액은 만원입니다.</caption><thead><tr><th>앞으로의 청구</th><th>시작 시 연간 잔여</th><th>지급액</th><th>남는 부담</th><th>지급 뒤 연간 잔여</th></tr></thead><tbody>{previewClaims.map((claim,index)=><tr key={index}><th>{index+1}번째</th><td>{number(claim.annualRemainingBefore/10000)}</td><td>{number(claim.paid/10000)}</td><td>{number(claim.remainingBurden/10000)}</td><td>{number(claim.annualRemainingAfter/10000)}</td></tr>)}</tbody></table></InsuranceTable>
    <h3>정액형은 별도의 조건부 약속</h3><p>다음은 앞의 손해 보전형 계약과 독립된 가상 정액 계약입니다. 특정 약정 사건의 모든 지급조건을 충족했다고 가정할 때 {won(fixed.amount)}을 약속합니다.</p><label className="payout-fixed-control"><input type="checkbox" checked={fixedEligible} onChange={event=>{setFixedEligible(event.target.checked);setPrediction('');play.rewind();}}/>정액 지급조건 충족</label>
    <div className="payout-fixed-lane" data-payout-fixed-lane data-eligible={fixed.eventEligible}><div className="payout-fixed-event">약정 사건<br/><strong>{fixed.eventEligible?'조건 충족':'조건 불충족'}</strong></div><div className={`payout-fixed-arrow ${fixed.eventEligible?'':'closed'}`} aria-hidden="true"><i/><span>{fixed.eventEligible?'→':'×'}</span></div><div className="payout-fixed-promise">별도 정액 지급액<strong data-payout-fixed-paid data-value={fixed.paid}>{won(fixed.paid)}</strong></div></div><p className="insurance-note">{fixed.verdict} 이 금액은 손실 분해 띠나 앞 계약의 연간 사용액에 더하지 않습니다. 현실 정액 담보도 면책·감액·횟수 등 각 지급조건을 확인해야 합니다. 정액 계약에는 앞의 공제 순서를 적용하지 않습니다.</p>
    <InsuranceTable title="정액형의 두 조건 비교"><table><caption>앞 계약과 별개인 가상 약속이며 실제 진단·지급 판단이 아닙니다.</caption><thead><tr><th>모형의 조건</th><th>약정액</th><th>조건부 지급액</th></tr></thead><tbody>{[true,false].map(eventEligible=>{const item=projectFixedBenefit({eventEligible,amount:fixed.amount});return <tr key={String(eventEligible)}><th>{eventEligible?'모든 지급조건 충족':'지급조건 불충족'}</th><td>{won(item.amount)}</td><td>{won(item.paid)}</td></tr>;})}</tbody></table></InsuranceTable>
    <p className="insurance-note">이 실험은 지급액 계산 구조에만 집중합니다. 보험료·다른 계약과의 조정·청구 심사·지급 지연은 생략합니다. 이동 효과 없이 같은 관찰 프레임을 즉시 표시하며, 자동 재생 없이도 모든 단계와 표를 볼 수 있습니다.</p>
  </section>;
}

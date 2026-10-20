import { useState } from 'react';
import { purchaseFrames, mortgageMeasures, mortgageDefaults, type PurchaseTiming, type MortgageParams } from '../../simulations/housing/purchase.mjs';
import { amount, percent, Lab, Range, StaticTable, Bar, Prediction, HouseIcon, usePlayback } from './shared';

const exactAmount=(n:number)=>Number.isInteger(n)&&n%10000!==0?`${n.toLocaleString('ko-KR')}원`:amount(n);
const timingNames:Record<PurchaseTiming,string>={before:'60일 · 잔금 직전 실행',after:'60일 · 잔금 뒤 실행 예정',nextDay:'61일 · 다음 날 실행 예정',unknown:'60일 · 입출금 순서 미확인'};
export function PurchaseCashLab() {
  const [cash,setCash]=useState(150e6),[cost,setCost]=useState(5e6),[loan,setLoan]=useState(80e6),[timing,setTiming]=useState<PurchaseTiming>('before'),p=usePlayback(5);
  const fs=purchaseFrames({startCash:cash,cost,loan,timing}),f=fs[p.step];
  const reset=()=>{setCash(150e6);setCost(5e6);setLoan(80e6);setTiming('before');p.rewind()};
  const pricePayment=f.action==='closing'&&f.completed?f.balance:f.action==='price'?f.paid:0;
  const feePayment=f.action==='closing'&&f.completed?cost:0;
  const failure=f.failure;
  return <Lab id="purchase-cash" title="총액이 아니라 납기에서 현금을 확인하기" note="2억원·지급 비율·경과일·대출·비용은 자체 가정입니다. 아래는 가상 자금 원장이지 대출 승인·법률상 소유권 이전·계약 해제 판정이 아닙니다.">
    <figure className="housing-purchase-scene" data-purchase-step={p.step} data-playing={p.playing}>
      <h4>하나의 매매가격을 세 번 나누어 지급</h4>
      <div className="housing-price-strip" role="img" aria-label="2억원의 계약금10%, 중도금20%, 잔금70%. 합계는 2억원."><i style={{width:'10%'}}>①</i><i style={{width:'20%'}}>②</i><i style={{width:'70%'}}>③</i></div>
      <div className="housing-price-labels"><span>① 계약금 {exactAmount(f.deposit)}</span><span>② 중도금 {exactAmount(f.middle)}</span><span>③ 잔금 {exactAmount(f.balance)}</span></div>
      <p className="housing-outside-cost">가격 띠 바깥의 가상 비회수성 비용 {exactAmount(cost)}. 계약금·중도금은 집값에 추가되는 비용이 아닙니다.</p>
      <div className="housing-controls"><label>대출 도착 순서<select value={timing} onChange={e=>{setTiming(e.target.value as PurchaseTiming);p.rewind()}}>{Object.entries(timingNames).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label></div>
      <p>시작현금 {exactAmount(cash)} · 가정 대출 {exactAmount(loan)} · 별도비용 {exactAmount(cost)}</p>
      <div className="housing-presets"><button onClick={()=>{setCash(124999999);setCost(5e6);setLoan(80e6);setTiming('before');p.rewind()}}>대출 실행 뒤 1원 부족</button><button onClick={()=>{setCash(205e6);setCost(5e6);setLoan(80e6);setTiming('unknown');p.rewind()}}>현금만으로 지급 가능</button></div>
      <details><summary>시작자금·비용 바꾸기</summary><Range label="시작현금" value={cash} max={250e6} step={1} unit="원" onChange={v=>{setCash(v);p.rewind()}}/><Range label="가격 밖 가상 비용" value={cost/10000} max={2000} step={100} onChange={v=>{setCost(v*10000);p.rewind()}}/><label><input type="checkbox" checked={loan>0} onChange={e=>{setLoan(e.target.checked?80e6:0);p.rewind()}}/> 가상 대출 8,000만원 포함</label></details>
      {p.controls}<button onClick={reset}>조건까지 초기화</button>
      <div className="housing-time-stops housing-purchase-stops">{fs.map(v=><span key={v.step} aria-current={p.step===v.step?'step':undefined}>{v.day<0?'지급 전':`${v.day}일`} · {v.label}</span>)}</div>
      <div className={`housing-closing-gate ${failure?'housing-warning':''}`} data-purchase-failure={failure?.kind??'none'}><strong>{f.label} · 모형에 반영한 현금 {exactAmount(f.cash)}</strong>{failure?<p>{failure.day}일 첫 납기 기록: {failure.kind==='unknown-order'?'입금 순서에 따라 달라져 판정 유보':'이 경로의 지급 부족'}. 필요한 돈 {exactAmount(failure.required)}, 당시 확인 현금 {exactAmount(failure.knownCash)}. {timing==='unknown'&&loan>0&&failure.day===60?'미확인 대출을 제외한 차이':'당시 확인 현금 대비 부족액'} {exactAmount(failure.gapBeforeArrival)}{failure.minimumGap>0?` · 순서로 해소할 수 없는 부족 ${exactAmount(failure.minimumGap)}`:''}. 이후 예정 입금·취득을 자동 실행하지 않습니다.</p>:<p>{f.completed?'이 가상 지급 경로에서 가격과 비용을 지급했습니다.':'이번 단계의 입금과 출금을 아래 경로로 구분합니다.'}{timing==='unknown'?' 미확인 대출은 제외한 현금만의 경로이며 실제 채무가 0이라는 판정이 아닙니다.':''}</p>}</div>
      <div className="housing-purchase-flows" key={f.step}>
        <div className="housing-money-route"><strong>은행</strong><div className={f.borrowed>0?'realized':''}><span>이번 단계 입금 {exactAmount(f.borrowed)}</span><b aria-hidden="true">→</b></div><strong>민지의 현금</strong></div>
        <div className="housing-money-route"><strong>민지의 현금</strong><div className={pricePayment>0?'realized':''}><span>이번 단계 대금 {exactAmount(pricePayment)}</span><b aria-hidden="true">→</b></div><strong>매도인 측</strong></div>
        <div className="housing-money-route housing-cost-route"><strong>민지의 현금</strong><div className={feePayment>0?'realized':''}><span>이번 단계 비용 {exactAmount(feePayment)}</span><b aria-hidden="true">→</b></div><strong>별도 비용 수령자</strong></div>
      </div>
      <div className="housing-purchase-property"><HouseIcon/><p>{f.completed?`취득한 집의 원가 기록 ${exactAmount(f.home)}`:`취득 전 지급대금 원가 기록 ${exactAmount(f.advance)}`}<small>취득 전 기록은 보장된 환급액이 아닙니다. 집의 법적 소유권 발생 시점을 재현하지 않습니다.</small></p></div>
      <Bar format={exactAmount} label="반영한 현금" value={f.cash} max={350e6}/><Bar format={exactAmount} label="취득 전 지급대금" value={f.advance} max={350e6} color="claim"/><Bar format={exactAmount} label="집의 원가 기록" value={f.home} max={350e6} color="home"/><Bar format={exactAmount} label="반영한 대출채무" value={f.debt} max={350e6} color="debt"/>
      <p data-book-difference={f.bookDifference} data-purchase-debt={f.debt}>원가 장부 차액 = 현금 + 취득 전 지급대금 + 집 − 반영 채무 = {exactAmount(f.bookDifference)}. 지출한 별도비용 {exactAmount(f.spentCost)}만 한 번 줄었습니다. 실패 후 회수 가능한 순자산을 평가한 값은 아닙니다.</p>
      <figcaption>가격 띠는 같은 2억원의 분할, 바깥 비용은 추가 지출입니다. 실선은 이번 단계 반영액, 점선은 반영액 없음입니다. 재생 중의 점은 그 경로를 한 번 강조할 뿐 추가 지급이 아닙니다. 각 막대는 공통0–3억5,000만원 눈금입니다. 잔금과 별도비용은 한 번에 지급하는 교육 묶음입니다. 그전에 발생한 실비·계약 해제·위약금·대출 취소·선급대금 회수는 계산하지 않습니다.</figcaption>
    </figure>
    <Prediction question="61일에 대출이 예정되어 있으면 60일 잔금의 부족은 없었던 일이 될까요?" answer={false} reason="나중의 돈으로 지난 납기 기록을 바꾸지 않습니다. 먼저 부족한 날짜와 그때의 사용 가능 현금을 확인하고 계약·실행 조건을 별도로 확인해야 합니다."/>
    <StaticTable title="지급 일정과 실제로 반영한 원장" headers={['단계','현금','취득 전 지급대금','집 원가','채무','지출 비용','최초 납기 기록']} rows={fs.map(v=>[`${v.day<0?'지급 전':`${v.day}일`} ${v.label}`,exactAmount(v.cash),exactAmount(v.advance),exactAmount(v.home),exactAmount(v.debt),exactAmount(v.spentCost),v.failure?`${v.failure.day}일 ${v.failure.kind==='unknown-order'?'순서 미확인':'부족'} / 최소 ${exactAmount(v.failure.minimumGap)}`:'이 단계의 부족 기록 없음'])}/>
  </Lab>;
}

export function MortgageLimitsLab() {
  const [input,setInput]=useState<MortgageParams>({...mortgageDefaults}),p=usePlayback(3);
  const r=mortgageMeasures(input),f=r.frames[p.step];
  const change=(key:keyof MortgageParams,value:number)=>{setInput(v=>({...v,[key]:value}));p.rewind()};
  const reset=()=>{setInput({...mortgageDefaults});p.rewind()};
  const monthlyStages=['월 실수령 유입만 보기','생활비 예정 지출 반영','기존 대출 예정 납입 반영','신규 대출 예정 납입까지 반영'];
  return <Lab id="mortgage-limits" title="담보·연간 심사·월 생활은 다른 경계입니다" note="모든 수치는 가정입니다. LTV 원리와 단순 연간 비율을 관찰할 뿐 한국의 실제 인정소득·포함 채무·예외·한도·승인을 계산하지 않습니다. 월 현금은 계획대로 지급한다는 예상이며 실제 납부 기록이 아닙니다.">
    <figure className="housing-limits-scene">
      <section className="housing-measure-boundary housing-stock-boundary"><h4>① 한 시점의 담보와 빚 · 원</h4><div className="housing-purchase-property"><HouseIcon/><p>주어진 담보평가액 {amount(r.appraisal)}<small>매매가격과 같다고 보장하지 않습니다. 대출은 은행의 소유 지분이 아닙니다.</small></p></div><Bar label="담보평가액" value={r.appraisal} max={300e6} color="home"/><Bar label="대출 원금" value={r.principal} max={300e6} color="debt"/><p data-ltv={r.ltv??'undefined'}>원리용 LTV = 대출 ÷ 담보평가액 = {r.ltv===null?'정의 불가 · 분모0':percent(r.ltv)}. 이 비율만으로 승인·안전을 판정하지 않습니다.</p><Range label="주어진 담보평가액" value={input.appraisal/10000} max={30000} step={1000} onChange={v=>change('appraisal',v*10000)}/></section>
      <section className="housing-measure-boundary housing-annual-boundary"><h4>② 앞으로 12개월의 심사용 가정 · 원/년</h4><p>계약 명목연율 {input.annualRate}%와 별도 심사용 가산 {input.stress}%p를 분리합니다. 아래 달력은 가산한 금리의 신규 예정 납입과 월 {amount(input.existingMonthly)}의 기존 납입을 합친 가정입니다.</p><div className="housing-year-calendar">{r.screenMonths.map((v,i)=><div key={i}><span>{i+1}개월</span><strong>{amount(v)}</strong></div>)}</div><Bar label="가정한 연소득" value={r.annualIncome} max={80e6} color="home"/><Bar label="심사용 12개월 합" value={r.screenAnnual} max={80e6} color="debt"/><p data-annual-ratio={r.annualRatio??'undefined'}>단순 연간 비율 = 심사용 12개월 합 ÷ 가정 연소득 = {r.annualRatio===null?'정의 불가 · 분모0':percent(r.annualRatio)}. 월 실수령액을 12배해 이 분모로 대신 넣지 않습니다.</p><Range label="가정한 연소득" value={input.annualIncome/10000} max={8000} step={200} unit="만원/년" onChange={v=>change('annualIncome',v*10000)}/><Range label="별도 심사용 가산" value={input.stress} max={5} step={.5} unit="%p" onChange={v=>change('stress',v)}/><p className="housing-stage">심사용 가산을 바꿔도 계약금리 기준 첫 달 신규 예정 납입은 <strong data-contract-payment={r.payment}>{amount(r.payment)}/월</strong> 그대로입니다. 실제 스트레스 DSR은 지역·대출·금리 유형·시점별 규정이 있으므로 이 가산을 그대로 적용하지 않습니다.</p></section>
      <section className="housing-measure-boundary housing-monthly-boundary"><h4>③ 첫 달 통장을 통과하는 생활 계획 · 원/월</h4><div className="housing-presets"><button onClick={()=>change('living',2.5e6)}>생활비만 250만원</button><button onClick={()=>change('takeHome',2e6)}>실수령만 200만원</button></div><details><summary>월 생활·계약 조건 바꾸기</summary><Range label="월 실수령" value={input.takeHome/10000} max={500} step={10} unit="만원/월" onChange={v=>change('takeHome',v*10000)}/><Range label="월 생활비" value={input.living/10000} max={400} step={10} unit="만원/월" onChange={v=>change('living',v*10000)}/><Range label="기존 대출 예정 납입" value={input.existingMonthly/10000} max={100} step={10} unit="만원/월" onChange={v=>change('existingMonthly',v*10000)}/><Range label="월 여유자금 목표" value={input.monthlyGoal/10000} max={100} step={10} unit="만원/월" onChange={v=>change('monthlyGoal',v*10000)}/><Range label="신규 대출 원금" value={input.principal/10000} max={10000} step={1000} onChange={v=>change('principal',v*10000)}/><Range label="계약 명목연율" value={input.annualRate} max={10} step={.5} unit="%" onChange={v=>change('annualRate',v)}/><label>신규 대출 예정 기간<select value={input.months} onChange={e=>change('months',Number(e.target.value))}><option value={120}>120개월</option><option value={240}>240개월</option><option value={360}>360개월</option></select></label></details>
        {p.controls}<button onClick={reset}>조건까지 초기화</button>
        <div className="housing-month-cash" data-budget-step={p.step}><strong>{p.step}. {monthlyStages[p.step]}</strong><div className="housing-budget-route"><span>실수령 {amount(r.takeHome)}</span><b aria-hidden="true">↓</b><span>이 단계까지 예정 유출 {amount(f.out)}</span><b aria-hidden="true">↓</b><strong>{f.remaining<0?'부족액':'남는 현금'} {amount(Math.abs(f.remaining))}</strong></div><Bar label="실수령 유입" value={r.takeHome} max={8e6}/><Bar label="반영한 예정 유출" value={f.out} max={8e6} color="expense"/><Bar label="예정 잔여 · 음수는 부족" value={f.remaining} max={8e6} color="cash"/></div>
        <div className="housing-month-goal"><span>비교선: 월 여유자금 목표 {amount(r.monthlyGoal)}/월</span><p data-budget-remaining={r.remaining}>모든 예정 납입 뒤 잔여 {amount(r.remaining)}/월. {r.monthlyShortage>0?`이 가정의 월 지출부터 ${amount(r.monthlyShortage)} 부족합니다.`:r.goalGap>0?`현금은 남지만 월 여유자금 목표에 ${amount(r.goalGap)} 못 미칩니다.`:'이 가정에서는 월 여유자금 목표 이상이 남습니다.'} 이 목표는 지출로 다시 빼지 않습니다. 비상자금 통장의 잔고 목표와도 다른 단위입니다.</p></div>
      </section>
      <figcaption>집·원금은 한 시점, 달력은 앞으로12개월 합, 아래 경로는 한 달입니다. 각 구역의 공통 눈금은 각각0–3억원·0–8,000만원/년·0–800만원/월로 서로 다릅니다. 음수 막대는 빗금과 부족 라벨로 구분합니다. 연간 산식은 만기 뒤 신규 납입을0으로, 기존 납입은12개월 일정하고 별도 스트레스 가산이 없는 것으로 가정합니다. 예산 부족을 실제 연체·상환 실행으로 바꾸지 않습니다.</figcaption>
    </figure>
    <Prediction question="담보평가액이 높고 비율이 낮으면 월 생활비가 늘어도 감당 가능하다고 볼까요?" answer={false} reason="담보의 한 시점 비율과 생활 현금흐름은 다른 경계입니다. 생활비·실수령·예정 납입·월 여유자금 목표를 같은 달의 기준으로 따로 확인해야 합니다."/>
    <StaticTable title="세 척도의 분자·분모·한계" headers={['척도','분자·사용액','분모·기준','결과와 한계']} rows={[
      ['담보 한 시점',amount(r.principal),amount(r.appraisal),r.ltv===null?'분모0 · 정의 불가':`${percent(r.ltv)} · 승인 아님`],
      ['심사용12개월',amount(r.screenAnnual),`${amount(r.annualIncome)}/년`,r.annualRatio===null?'분모0 · 정의 불가':`${percent(r.annualRatio)} · 실제 규제 DSR 아님`],
      ['계약금리12개월',amount(r.actualAnnual),'기존 납입 포함','심사용 가산 전 예정 합계'],
      ['월 생활',`${amount(r.monthlyOut)}/월`,`${amount(r.takeHome)}/월`,`잔여 ${amount(r.remaining)}/월 · 실제 납부 아님`],
      ['월 여유 목표',`${amount(r.monthlyGoal)}/월`,'계획 잔여와 비교','이미 차감한 비용 아님 · 잔고 목표 아님'],
    ]}/><StaticTable title="한 달 예정 지출을 반영하는 단계" headers={['단계','누적 예정 유출','예정 잔여']} rows={r.frames.map(v=>[monthlyStages[v.step],amount(v.out),amount(v.remaining)])}/>
  </Lab>;
}

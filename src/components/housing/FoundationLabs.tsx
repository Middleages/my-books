import { useState } from 'react';
import { housingModes, rightsFrames, rentComparison, rentalTimeline, type HousingMode } from '../../simulations/housing/foundations.mjs';
import { amount, percent, Lab, Range, StaticTable, Bar, Prediction, HouseIcon, usePlayback } from './shared';

export function RightsLab(){
  const [mode,setMode]=useState<HousingMode>('rent'),[withFee,setWithFee]=useState(false),p=usePlayback(3);
  const r=rightsFrames(mode,withFee),s=r.states[p.step], exchanged=p.step>=2, isBuy=mode==='buy';
  return <Lab id="rights" title="같은 집, 다른 권리와 돈의 길">
    <figure className="housing-rights-scene" data-mode={mode} data-step={p.step}>
      <div className="housing-relationship">
        <div className="housing-person"><div className="housing-person-symbol" aria-hidden="true"/><strong>민지 · {isBuy?'매수인':'임차인'}</strong><span>지금 현금 {amount(s.cash)}</span></div>
        <div className="housing-links">
          <div className={`housing-link ${exchanged?'active':''} ${p.playing&&p.step===2?'moving':''}`}>현금 지급 {amount(r.payment)}<br/>{isBuy?'매매대금':'보증금'}</div>
          <div className={`housing-link reverse claim ${exchanged?'active':''}`}>{isBuy?'소유권 이전':'반환청구권의 상대방'}<br/>{exchanged?'교환 후 관계':'아직 거래 전'}</div>
        </div>
        <div className="housing-building"><strong>{isBuy?'매도인':'임대인'}</strong><span>{isBuy?'대금 수령':'보증금 반환 의무'}</span></div>
        <div className={`housing-ownership ${isBuy&&exchanged?'owned':''}`}><HouseIcon/><div><strong>같은 크기·품질의 가상 주거</strong><p>{!exchanged?'입주 전 · 예정된 관계':isBuy?'민지 소유 · 거주':'임대인 소유 · 민지 거주'}</p><p>{isBuy?'담보권 ≠ 은행의 소유 지분':'거주 권리 ≠ 집 소유권'}</p></div></div>
        <div className="housing-building"><strong>은행</strong><span>대출채권 {amount(s.debt)}</span></div>
        <div className="housing-links"><div className={`housing-link ${p.step>=1&&r.loan>0?'active':''} ${p.playing&&p.step===1&&r.loan?'moving':''}`}>대출 현금 {amount(r.loan)}</div><div className={`housing-link reverse debt ${p.step>=1&&r.loan>0?'active':''}`}>{r.loan>0?"민지의 상환 의무":"차입 없음 · 상환 의무 없음"}</div></div>
        <div className="housing-person"><strong style={{marginTop:0}}>민지의 채무</strong><span>{amount(s.debt)}</span><p>차입과 소득을 구별</p></div>
      </div>
      <h4 className="housing-balance-title">민지의 현재 장부 · 공통 눈금 0–2억 5,000만원</h4>
      <Bar label="현금" value={s.cash} max={250_000_000}/><Bar label="보증금 반환청구권" value={s.claim} max={250_000_000} color="claim"/><Bar label="보유한 집" value={s.home} max={250_000_000} color="home"/><Bar label="빼야 할 채무" value={s.debt} max={250_000_000} color="debt"/>
      <p className="housing-cash-result" data-net-worth={s.netWorth}>순자산 = 현금 + 반환청구권 + 집 − 채무 = {amount(s.netWorth)}</p>
      <figcaption>사람 모양: 거주자 / 지붕: 집 / 기둥: 거래 상대. 점선은 예정, 실선은 이 모형에서 생긴 관계입니다. 청록은 현금, 빗금 보라는 반환청구권, 파랑은 집, 황토는 채무입니다. 움직이는 점은 경로를 한 번 강조할 뿐 추가 지급이 아닙니다. 소유권 등 실제 법적 효력 발생 순서를 재현한 화면은 아닙니다.</figcaption>
    </figure>
    <div className="housing-controls"><label>거주 방식<select value={mode} onChange={e=>{setMode(e.target.value as HousingMode);p.rewind()}}>{housingModes.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select></label><label><input type="checkbox" checked={withFee} onChange={e=>{setWithFee(e.target.checked);p.rewind()}}/>가상 초기비용 포함</label></div>
    {p.controls}<button onClick={()=>{setMode('rent');setWithFee(false);p.rewind()}}>조건까지 초기화</button>
    <div className="housing-stage" role="status"><strong>{p.step}. {s.label}</strong><p>{s.detail}</p></div>
    <Prediction question="비용 없이 보증금을 보내면 그 금액만큼 순자산이 사라질까요?" answer={false} reason="현금이 반환청구권으로 바뀝니다. 하지만 반환청구권은 즉시 쓸 현금과 다르고 전액 회수를 보장하지도 않습니다."/>
    <StaticTable title="거래 단계의 전체 장부" headers={['단계','현금','반환청구권','집','채무','누적 초기비용','순자산']} rows={r.states.map(v=>[v.label,amount(v.cash),amount(v.claim),amount(v.home),amount(v.debt),amount(v.expense),amount(v.netWorth)])}/>
  </Lab>
}

export function RentDepositLab(){
  const [deposit,setDeposit]=useState(6000),[rent,setRent]=useState(50),[share,setShare]=useState(0),[rate,setRate]=useState(4),[q,setQ]=useState(3),[available,setAvailable]=useState(15000),[months,setMonths]=useState(24),p=usePlayback(3);
  const r=rentComparison({depositB:deposit*10000,rentB:rent*10000,loanShare:share/100,loanRate:rate/100,opportunityRate:q/100,available:available*10000});
  const reset=()=>{setDeposit(6000);setRent(50);setShare(0);setRate(4);setQ(3);setAvailable(15000);setMonths(24);p.rewind()};
  const timelines=[rentalTimeline({deposit:r.depositA,rent:r.rentA,months}),rentalTimeline({deposit:r.depositB,rent:r.rentB,months})];
  const phases=['계약 전입니다. 보증금은 나중에 돌려받을 청구액, 월세는 매달 주거서비스의 대가입니다.',`시작일에는 보증금을 지급하고 반환청구권을 기록합니다. B의 보증금 차이는 ${amount(r.additional)}입니다. 아직 월세는 지급하지 않은 요약 단계입니다.`,`1–${months}개월의 월세를 누적합니다. 매월 차이는 ${amount(r.rentSaving)}이고 보증금 반환청구권은 그대로 남아 있습니다.`,'기말에 보증금 전액이 실제 도착했다고 가정하면 반환청구권이 현금으로 바뀝니다. 이미 소비한 월세는 돌아오지 않습니다. 현실의 공제·지연·회수 실패는 이 가정과 다릅니다.'];
  return <Lab id="rent-deposit" title="더 큰 보증금과 더 작은 월세를 맞바꾸면?">
    <figure className="housing-rent-scene">
      <div className="housing-offers">{[['A',r.depositA,r.rentA],['B',r.depositB,r.rentB]].map(([name,d,m])=><div className="housing-offer" key={name}><h4>가상 제안 {name}</h4><HouseIcon/><Bar label="돌려받을 보증금" value={Number(d)} max={100_000_000} color="claim"/><small>위 눈금: 0–1억원</small><Bar label="매달 내는 월세" value={Number(m)} max={1_000_000} color="expense"/><small>아래 눈금: 0–100만원/월</small></div>)}</div>
      <div className="housing-exchange-sign"><span>더 묶이는 원금 ↔ 매월 줄어드는 대가</span><strong>{amount(r.additional)} ↔ {amount(r.rentSaving)}/월</strong><p data-offer-rate={r.annualizedOffer??'undefined'}>단순 연 환산 차이: {r.annualizedOffer===null?'계산하지 않음':percent(r.annualizedOffer)}</p><p>{r.rateReason}</p></div>
      {r.additional>=0 ? <div className="housing-breakdown"><h4>추가 보증금이 양수일 때 자금의 출처</h4><Bar label="추가 자기자금" value={r.ownAdditional} max={80_000_000}/><Bar label="추가 차입" value={r.financed} max={80_000_000} color="debt"/><p>공통 눈금 0–8,000만원. 둘의 합은 추가 보증금입니다.</p><p>매월 실제 현금 감소 차이: 월세 절감 {amount(r.rentSaving)} − 추가 이자 {amount(r.monthlyInterest)} = {amount(r.monthlyCashSaving)}</p><p>별도로 포기한 기회: 자기자금 {amount(r.ownAdditional)} × 가상 연 {q}% ÷ 12 = {amount(r.monthlyOpportunity)}/월. 통장 출금이 아니라 비교 가정입니다.</p><p>단순 월 환산 경제적 차이: {amount(r.monthlyEconomicDifference ?? 0)}. 회수 위험·비용·기간을 모두 반영한 총비용이나 추천은 아닙니다.</p></div> : <p className="housing-stage">B에서는 보증금 {amount(-r.additional)}이 덜 묶입니다. 이 장의 ‘추가 보증금 조달’ 분해와 기회비용 비교는 적용하지 않습니다. 풀리는 자기자금의 다른 활용까지 비교하려면 두 제안의 방향을 바꿔 별도로 분석해야 합니다.</p>}
      <div className="housing-rental-timeline" data-timeline-step={p.step}><h4>원금과 월세의 다른 시간 · {months}개월 가정</h4>{p.controls}<div className="housing-time-stops">{timelines[0].map((v,i)=><span key={i} aria-current={p.step===i?'step':undefined}>{i}. {v.label}</span>)}</div><div className="housing-offers">{timelines.map((frames,i)=>{const f=frames[p.step];return <div className="housing-offer" key={i}><strong>제안 {i===0?'A':'B'} · {f.label}</strong><div className="housing-cash-path"><span>임차인</span><span className="housing-cash-transfer"><span>{p.step===0?'지급 전':p.step===1?'보증금 지급':p.step===2?'매월 월세 누적':'보증금 반환'}</span><b className="housing-flow-arrow" aria-hidden="true">{p.step===0?'—':p.step===3?'←':'→'}</b></span><span>임대인</span></div><Bar label="남은 반환청구권" value={f.claim} max={100_000_000} color="claim"/><Bar label="소비한 월세 누적" value={f.rentExpense} max={1_000_000*months} color="expense"/><p>보증금 반환 도착 {amount(f.refund)} · 계약 순현금 유출 {amount(f.netOut)}</p></div>})}</div><p>위 막대 눈금 0–1억원, 아래 막대 눈금 0–{amount(1_000_000*months)}. 대출·초기비용·공제·반환 지연은 제외한 계약 자체의 요약입니다. 반환은 전액·기말 도착을 가정한 것이며 실제 지급 보장이 아닙니다.</p></div>
      <figcaption>보라 빗금 띠는 반환청구액, 회색 띠는 매달 지출입니다. 같은 종류끼리는 눈금이 같습니다. 보증금과 월세의 눈금은 서로 다르며 길이끼리 직접 비교하지 않습니다. 가상 제안의 차이를 연 환산할 뿐 법정 전월세전환율·실현 투자수익률·안전등급이 아닙니다.</figcaption>
    </figure>
    <Range label="계약 관찰 기간" value={months} min={12} max={36} step={12} unit="개월" onChange={v=>{setMonths(v);p.rewind()}}/><Range label="B 보증금" value={deposit} max={10000} step={500} onChange={v=>{setDeposit(v);p.rewind()}}/><Range label="B 월세" value={rent} max={100} step={5} onChange={v=>{setRent(v);p.rewind()}}/>
    <div className="housing-controls"><button onClick={()=>{setDeposit(2000);p.rewind()}}>보증금 차이 0</button><button onClick={()=>{setDeposit(1000);setRent(80);p.rewind()}}>B가 더 작은 보증금</button><button onClick={()=>{setDeposit(6000);setRent(80);p.rewind()}}>둘 다 더 비싼 B</button></div>
    <Range label="추가 보증금 중 차입 비중" value={share} max={100} step={25} unit="%" onChange={v=>{setShare(v);p.rewind()}}/><Range label="가상 차입 명목연율" value={rate} max={12} unit="%" onChange={v=>{setRate(v);p.rewind()}}/><Range label="자기자금 기회비용 연 환산 가정" value={q} max={8} unit="%" onChange={v=>{setQ(v);p.rewind()}}/><Range label="지금 준비된 자기자금" value={available} max={15000} step={500} onChange={v=>{setAvailable(v);p.rewind()}}/>
    <p className={r.shortageA||r.shortageB?'housing-warning':'housing-stage'} data-shortage={r.shortageB}>초기 자기자금 필요: A {amount(r.requiredA)}, B {amount(r.requiredB)}. 부족: A {amount(r.shortageA)}, B {amount(r.shortageB)}. {r.shortageA||r.shortageB?'추가 자금이 확인되지 않아 계약 자금 충당을 확정할 수 없습니다. 자동 대출하지 않습니다.':'이 단순 보증금 조건에서만 준비 금액이 충족됩니다. 초기비용·비상자금·승인 여부는 별도입니다.'}</p>
    <button onClick={reset}>조건까지 초기화</button><div className="housing-stage" role="status"><strong>{p.step}. 관찰하기</strong><p>{phases[p.step]}</p></div>
    <Prediction question="기본 제안 차이가 연 6%이므로 B가 무조건 유리할까요?" answer={false} reason="자금 조달, 다른 활용 기회, 보증금 회수 위험, 거주 기간과 다른 비용이 빠져 있습니다. 제안 차이 한 숫자로 결정하지 않습니다."/>
    <StaticTable title="보증금 지급부터 반환까지" headers={["제안·단계","누적 지급","남은 반환청구권","도착 반환금","월세 비용","순현금 유출"]} rows={timelines.flatMap((fs,i)=>fs.map(f=>[`${i===0?"A":"B"} · ${f.label}`,amount(f.paid),amount(f.claim),amount(f.refund),amount(f.rentExpense),amount(f.netOut)]))}/>
    <StaticTable title="제안과 자금 출처의 정확한 비교" headers={['항목','A 또는 기준','B 또는 차이']} rows={[
      ['보증금 원금',amount(r.depositA),amount(r.depositB)],['매월 월세',amount(r.rentA),amount(r.rentB)],['추가 원금의 자기자금','원금 지급 · 소비 비용 아님',r.additional<0?'해당 없음':amount(r.ownAdditional)],['추가 원금의 차입','상환할 채무',r.additional<0?'해당 없음':amount(r.financed)],['추가 차입이자/월','가상 금리',amount(r.monthlyInterest)],['추가 자기자금 기회/월','실제 출금 아님',r.additional<0?'해당 없음':amount(r.monthlyOpportunity)],['초기 자기자금 부족',amount(r.shortageA),amount(r.shortageB)],['단순 연 환산 차이','법정 전환율 아님',r.annualizedOffer===null?'정의하지 않음':percent(r.annualizedOffer)]
    ]}/>
  </Lab>
}

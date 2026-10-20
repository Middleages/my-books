import {useState} from 'react';
import {placeComparison,marketMix,supplyFrames} from '../../simulations/housing/market.mjs';
import {Lab,Bar,Range,StaticTable,Prediction,HouseIcon,amount,usePlayback} from './shared';
const hours=(v:number)=>`${v.toLocaleString('ko-KR',{maximumFractionDigits:2})}시간`;
export function PlaceLab(){
 const [days,setDays]=useState(20),[access,setAccess]=useState(false),[space,setSpace]=useState(false),[moveBy,setMoveBy]=useState(30);
 const r=placeComparison({days,requireAccess:access,requireSpace:space,moveBy});
 const reset=()=>{setDays(20);setAccess(false);setSpace(false);setMoveBy(30)};
 return <Lab id="place-and-market" title="20만원과 20시간은 서로 다른 자입니다" note="A/B는 실제 지역·매물이 아닌 자체 사례입니다. 보증금과 공통 주거조건은 같다고 가정하고 월세·왕복 시간·필수조건만 바꿉니다. 이동 선의 길이는 실제 거리가 아닙니다.">
  <Range label="월 출근일" value={days} max={31} unit="일" onChange={setDays}/>
  <figure className="housing-place-scene" data-extra-hours={r.extraHours} data-place-candidates={r.candidateCount}>
   <div className="housing-place-paths">{r.places.map(a=><section className="housing-place-path" key={a.id}><div className="housing-place-home"><HouseIcon/><b>가상 집 {a.id}</b></div><div className="housing-commute-route"><span>집 ↔ 일터 · 왕복 {a.roundTrip}분</span><div className="housing-commute-line"><i/><i/><i/></div><b>같은 일터</b></div><Bar label="월 임차 지출" value={a.rent} max={1e6}/><Bar label="월 통근 시간" value={a.monthlyHours} max={60} color="claim" format={hours}/><p>왕복 {a.roundTrip}분 × {days}일 ÷ 60 = {hours(a.monthlyHours)}</p></section>)}</div>
   <div className="housing-place-tradeoff"><b>B의 월세 절감 {amount(r.rentSaving)}</b><b>B의 추가 통근 {hours(r.extraHours)}</b><p>서로 다른 단위입니다. 시간당 가치를 대신 정하거나 합산 점수·추천을 만들지 않습니다.</p></div>
   <figcaption>집과 일터를 잇는 양방향 선은 왕복 경로입니다. 돈 막대는 공통0–100만원, 시간 막대는 공통0–60시간의 별개 눈금입니다. 출근일0이면 통근 시간 차이는0이지만 월세 차이는 남습니다.</figcaption>
  </figure>
  <h4>가격으로 대신할 수 없는 조건은 먼저 거릅니다</h4>
  <div className="housing-controls"><label><input type="checkbox" checked={access} onChange={e=>setAccess(e.target.checked)}/> 무단차 접근 확인이 필수</label><label><input type="checkbox" checked={space} onChange={e=>setSpace(e.target.checked)}/> 별도 작업 공간이 필수</label><label>이사에 필요한 경과일<select value={moveBy} onChange={e=>setMoveBy(+e.target.value)}><option value={29}>29일 이내</option><option value={30}>30일 이내</option><option value={60}>60일 이내</option></select></label></div>
  <div className="housing-place-gates">{r.places.map(a=><section key={a.id} className={a.eligible?'open':'closed'}><b>A/B 중 {a.id}의 확인 가정</b><p>무단차 접근: {a.access===null?'미확인':'확인 가정'}<br/>별도 공간: {a.space?'있음':'없음'}<br/>입주 가능: 경과 {a.available}일</p><strong>{a.eligible?'명시한 필수조건을 통과한 후보':a.reasons.join(' · ')}</strong></section>)}</div>
  <p role="status">명시한 조건을 통과한 후보 {r.candidateCount}곳. 자료 미확인은 충족으로 세지 않습니다. 후보라는 말은 계약 안전·가격 적정·개인 적합성을 뜻하지 않습니다.</p><button onClick={reset}>조건까지 초기화</button>
  <Prediction question="월세가 더 싼 B라면 필요한 접근조건 미확인을 금액 절감으로 상쇄해도 될까요?" answer={false} reason="필수조건은 금액 점수가 아닙니다. 미확인 상태를 충족으로 바꾸지 말고 실제 현장·시설·날짜를 확인해야 합니다."/>
  <StaticTable title="생활조건과 두 단위" headers={['가상 집','월세','왕복 분','월 통근 시간','입주 가능 경과일','필수조건']} rows={r.places.map(a=>[a.id,amount(a.rent),a.roundTrip,hours(a.monthlyHours),a.available,a.eligible?'명시 조건 충족':'추가 확인·불충족'])}/>
 </Lab>;
}
export function MarketMixLab(){
 const p=usePlayback(3),r=marketMix({mix:p.step===1||p.step===3,priceRise:p.step>=2}),base=marketMix();
 const titles=['기준 구성·기준 가격','거래 구성만 바꿈','유형별 가격만10% 높임','구성과 유형별 가격을 함께 바꿈'];
 return <Lab id="market-mix" title="평균이 올라도 같은 집의 가격은 그대로일 수 있습니다" note="낮은 가격 유형2억원·높은 가격 유형4억원의 자체 거래 묶음입니다. 아래 고정구성 비교는 공식 한국부동산원 지수의 산식·표본을 재현한 것이 아닙니다.">
  <div className="housing-presets">{titles.map((t,i)=><button key={t} onClick={()=>p.seek(i)}>{t}</button>)}</div>{p.controls}
  <figure className="housing-market-scene" data-market-step={p.step} data-market-mean={r.mean??'unknown'} data-fixed-comparison={r.fixedComparison}>
   <p className="housing-stage" role="status"><strong>{titles[p.step]}</strong></p>
   <div className="housing-trade-baskets">{[{title:'기준 거래3건',v:base,observed:false},{title:'관찰 거래3건',v:r,observed:true}].map(({title,v,observed})=><section key={title} className={observed?'observed':'baseline'}><h4>{title}</h4>{observed&&<p className="housing-observed-index">같은 관찰의 자체 고정구성 비교 <strong>{r.fixedComparison.toFixed(0)}</strong> · 기준100, 유형별 비중½ 고정</p>}<div className="housing-trade-dots">{v.trades.map((type,i)=><div key={i} className={type}><HouseIcon/><b>{type==='low'?'낮은 가격 유형':'높은 가격 유형'}</b><span>{amount(type==='low'?v.lowPrice:v.highPrice)}</span></div>)}</div><Bar label="거래 평균" value={v.mean!} max={500e6}/></section>)}</div>
   <p>거래 평균: {r.lowCount}건 × {amount(r.lowPrice)} + {r.highCount}건 × {amount(r.highPrice)}를 총 {r.count}건으로 나눕니다.</p>
   <div className="housing-fixed-basket"><b>거래 건수가 아닌 유형별 비중을 절반씩 고정</b><div><span>낮은 유형 가격비 × ½</span><span>높은 유형 가격비 × ½</span></div><strong data-fixed-value={r.fixedComparison}>자체 고정구성 비교 {r.fixedComparison.toFixed(0)} (기준100)</strong><p>100 × (관찰 낮은 유형 가격 ÷ 기준 낮은 가격 + 관찰 높은 유형 가격 ÷ 기준 높은 가격) ÷ 2</p></div>
   <figcaption>집 기호 한 개는 거래 한 건이며 면적·가치 비율이 아닙니다. 실선 테두리의 낮은 유형과 점선 테두리의 높은 유형을 구분합니다. 구성만 바꾸면 평균은 움직여도 각 유형 가격비와 자체 고정구성 비교100은 그대로입니다. 실제 지수의 표본·가중치·집계법은 공식 설명서에서 따로 확인합니다.</figcaption>
  </figure>
  <Prediction question="이번 달 평균 거래가격이25% 높아지면 같은 집들도 모두25% 오른 것일까요?" answer={false} reason="낮은 유형2건·높은 유형1건을 그 반대로 바꾸면 유형 가격은 그대로인데 평균은 약2억6,667만원에서3억3,333만원으로25% 높아집니다. 거래 구성 효과입니다."/>
  <StaticTable title="구성과 가격을 따로 바꾼 네 경우" headers={['가상 조건','낮은·높은 건수','거래 평균','자체 고정구성 비교']} rows={[0,1,2,3].map(i=>{const v=marketMix({mix:i===1||i===3,priceRise:i>=2});return[titles[i],`${v.lowCount} · ${v.highCount}`,amount(v.mean!),v.fixedComparison.toFixed(0)]})}/>
 </Lab>;
}
export function HousingSupplyLab(){
 const p=usePlayback(8),rows=supplyFrames(),r=rows[p.step];
 return <Lab id="housing-supply" title="같은100호가 다른 단계로 옮겨 갑니다" note="허가 뒤2개월 착공·8개월 준공은 자체 시간 가정입니다. 실제 통계의 기간·단위·공사 완료 확률이 아닙니다. 이 장면의100호와 기관의 동수·연면적 통계를 혼동하지 않습니다.">
  <div className="housing-presets"><button onClick={()=>p.seek(0)}>허가</button><button onClick={()=>p.seek(2)}>가정 착공</button><button onClick={()=>p.seek(8)}>가정 준공</button></div>{p.controls}
  <figure className="housing-supply-scene" data-supply-step={p.step}><p className="housing-stage">허가부터 경과 {r.month}개월 · <strong>같은 묶음 합계 {r.permission+r.construction+r.completion}호</strong></p><div className="housing-supply-stages">{(['permission','construction','completion'] as const).map((k,i)=><section key={k} className={r.stage===k?'active':''}><b>{['허가·미착공','공사 중','준공'][i]}</b><div className="housing-supply-cohort" data-supply-value={r[k]}>{Array.from({length:r[k]/10},(_,j)=><i key={j} aria-hidden="true"/>)}</div><strong>{r[k]}호</strong><span>{['허가가 당장 입주를 뜻하지 않음','착공 뒤 시간·중단 가능성','준공도 실제 입주·거래와 별개'][i]}</span></section>)}</div><figcaption>작은 사각형1개는 가상10호, 강조 테두리는 현재 단계입니다. 동일100호를 허가100+착공100+준공100으로 더해300호라고 세지 않습니다. 실제 월별 통계는 서로 다른 사업 묶음일 수 있어 그대로 이 한 줄로 연결할 수 없습니다.</figcaption></figure>
  <StaticTable title="한 묶음의 단계별 보존" headers={['경과월','허가·미착공','공사 중','준공','합계']} rows={rows.map(v=>[v.month,v.permission,v.construction,v.completion,v.homes])}/>
 </Lab>;
}

import {useMemo,useState} from 'react';
import {useFoundationPlayback} from '../network/FoundationPlayback';
import {analysisModel,analysisFrames,analysisScenarios,currentLoanChoices,ratioExample,ratioExamples,breakEven,type AnalysisModel,type AnalysisPart,type Ratio} from '../../simulations/accounting/analysis.mjs';
import {reportLabels,type ReportScenario} from '../../simulations/accounting/reports.mjs';
import './accounting.css';import './analysis.css';
const fmt=(n:number)=>n.toLocaleString('ko-KR',{maximumFractionDigits:4});
const percentage=(r:Ratio|null)=>r?.defined?`${fmt(r.value!*100)}%`:'계산하지 않음';
function AnalysisStack({parts,scale,kind}:{parts:AnalysisPart[];scale:number;kind:string}){
 return <><div className="ac-an-stack" data-analysis-stack={kind} data-scale={scale}>{parts.filter(p=>p.value>0).map(p=><span key={p.id} className={`ac-an-part is-${p.id}`} data-analysis-part={p.id} data-value={p.value} style={{width:`${p.value/scale*100}%`}}/>)}</div><ul className="ac-an-legend">{parts.map(p=><li key={p.id}><i className={`is-${p.id}`} aria-hidden="true"/>{p.label} {fmt(p.value)}</li>)}</ul></>;
}
function LiquidityPanel({model:m,label,kind}:{model:AnalysisModel;label:string;kind:string}){
 return <div className="ac-an-liquidity" data-liquidity={kind} data-assets={m.currentAssets} data-liabilities={m.currentLiabilities} data-cash={m.cash} data-ratio={m.currentRatio?.value??''}>
  <h4>{label}</h4><p>유동자산 {fmt(m.currentAssets)}</p><AnalysisStack parts={m.assets} scale={m.scale} kind={`${kind}-assets`}/>
  <p>유동부채 {fmt(m.currentLiabilities)}</p><AnalysisStack parts={m.liabilities} scale={m.scale} kind={`${kind}-liabilities`}/>
  <p>그중 현금만 {fmt(m.cash)}</p><AnalysisStack parts={[{id:'cash',label:'즉시 쓸 수 있는 현금',value:m.cash}]} scale={m.scale} kind={`${kind}-cash`}/>
  <p className="ac-an-quotient">{fmt(m.currentAssets)} ÷ {fmt(m.currentLiabilities)} = {fmt(m.currentRatio!.value!)}배</p>
 </div>;
}
export function RatiosAndLimitsLab(){
 const [scenario,setScenario]=useState<ReportScenario>('no-collection'),[currentLoan,setCurrentLoan]=useState(40),[scope,setScope]=useState<'same'|'mixed'>('same'),[prediction,setPrediction]=useState('');
 const frames=useMemo(()=>analysisFrames({scenario,currentLoan,scope}),[scenario,currentLoan,scope]),player=useFoundationPlayback(frames.length),f=frames[player.index],m=f.model,base=analysisModel({currentLoan});
 const reset=()=>{player.reset();setScenario('no-collection');setCurrentLoan(40);setScope('same');setPrediction('');};
 return <section className="ac-lab ac-analysis-lab" data-ac-lab="ratios" aria-label="비율의 구성과 비교 범위 실험">
  <p className="ac-eyebrow">11 · 같은 몫, 다른 구성</p><h2>유동비율이 같으면 쓸 현금도 같을까요?</h2>
  <p>작은책상 · M1 말 잔액 / M1 전체 성과 · 가상단위. 관찰 단계는 이미 완성된 보고서의 강조만 바꾸며 실제 지급을 재생하지 않습니다.</p>
  <div className="ac-controls">
   <label>비율 비교의 거래 조건<select aria-label="비율 비교의 거래 조건" value={scenario} disabled={scope==='mixed'} onChange={e=>{player.reset();setPrediction('');setScenario(e.target.value as ReportScenario);}}>{analysisScenarios.map(k=><option key={k} value={k}>{reportLabels[k]}</option>)}</select></label>
   <label>차입280 중12개월 안 상환 가정<select aria-label="차입280 중12개월 안 상환 가정" value={currentLoan} disabled={scope==='mixed'} onChange={e=>{player.reset();setPrediction('');setCurrentLoan(Number(e.target.value));}}>{currentLoanChoices.map(n=><option key={n} value={n}>{n}가상단위 · 분류 요건 충족 가정</option>)}</select></label>
   <label>비율의 보고 범위<select aria-label="비율의 보고 범위" value={scope} onChange={e=>{player.reset();setScope(e.target.value as 'same'|'mixed');setPrediction('');}}><option value="same">같은 회사·M1 범위</option><option value="mixed">반례 · M1과 M2 일부 혼합</option></select></label>
   <label>같은 유동비율이면 현금도 같을까<select aria-label="같은 유동비율이면 현금도 같을까" value={prediction} onChange={e=>setPrediction(e.target.value)}><option value="">먼저 예상해 보세요</option><option value="same">같다 · 비율이 같으니까</option><option value="different">다를 수 있다 · 안의 구성 확인</option></select></label>
  </div>
  {!m.compatible?<div className="ac-an-mismatch" role="status" data-compatible="false"><strong>비율 계산 중지</strong><p>{m.scopeReason}</p><button onClick={reset}>전체 초기화</button></div>:<>
   <div className="ac-playback" role="group" aria-label="비율 관찰 단계">
    <button onClick={()=>player.setPlaying(!player.playing)} disabled={player.index===frames.length-1&&!player.playing}>{player.playing?'정지':'재생'}</button><button onClick={()=>player.go(-1)} disabled={!player.index}>이전 단계</button><button onClick={()=>player.go(1)} disabled={player.index===frames.length-1}>다음 단계</button><button onClick={player.reset}>다시 보기</button><button onClick={reset}>전체 초기화</button><span className="ac-step">{player.index+1} / {frames.length}단계</span>
   </div>
   <div className="ac-current" role="status" aria-live="polite"><strong>{f.title}</strong><p>{f.detail}</p></div>
   <figure className={`ac-figure ac-an-comparison ${f.kind==='composition'?'is-focus':''}`} data-analysis-stage="composition" data-current={f.kind==='composition'}>
    <h3>같은800 금액 눈금 · 비율과 현금은 별도</h3><div className="ac-an-two"><LiquidityPanel model={base} label="기준 · 회수160" kind="base"/><LiquidityPanel model={m} label={`비교 · ${reportLabels[scenario]}`} kind="selected"/></div>
    <figcaption>모든 금액 띠는 전체 폭800가상단위입니다. 비율은 길이의 별도 단위가 아니라 두 금액의 몫입니다. 현금·채권·재고·선급은 이름과 무늬로 나눕니다. 선급 서비스를 오늘 현금처럼 갚는 돈으로 세지 마세요.</figcaption>
   </figure>
   <figure className={`ac-figure ${f.kind==='maturity'?'is-focus':''}`} data-analysis-stage="maturity" data-current={f.kind==='maturity'}>
    <h3>차입 원금280의 분류 · 총액은 그대로</h3><AnalysisStack parts={[{id:'loan',label:'12개월 안 상환분',value:m.currentLoan},{id:'noncurrent',label:'이후 상환분',value:m.noncurrentLoan}]} scale={280} kind="maturity"/>
    <p>현재 조건의 총부채 {fmt(m.totalLiabilities)} · 차입 원금 {fmt(m.totalLoan)} · 현금 {fmt(m.cash)}</p><figcaption>이 띠만 전체 폭280입니다. 보고일 현재 권리·약정 등 실제 분류 요건을 충족했다고 가정합니다. 분류 변경은 현금 지급·부채 감소 사건이 아닙니다. 단순한12개월 버튼으로 실제 계약을 판정하지 않습니다.</figcaption>
   </figure>
   <figure className={`ac-figure ${f.kind==='margin'?'is-focus':''}`} data-analysis-stage="margin" data-current={f.kind==='margin'}>
    <h3>매출 안의 포함 관계 · 같은 분모 {fmt(m.margins.revenue)}</h3>
    <AnalysisStack parts={[{id:'cost',label:'매출원가',value:m.margins.cost},{id:'other',label:'다른 영업비용',value:m.margins.otherOperating},{id:'operating',label:'영업이익',value:m.margins.operating}]} scale={m.margins.revenue} kind="margins"/>
    <div className="ac-an-gross-row"><span style={{width:`${m.margins.cost/m.margins.revenue*100}%`}}/><strong data-gross-bracket data-value={m.margins.gross} style={{width:`${m.margins.gross/m.margins.revenue*100}%`}}>총이익 {fmt(m.margins.gross)}</strong></div>
    <p>총이익률 {percentage(m.margins.grossRatio)} · 영업이익률 {percentage(m.margins.operatingRatio)}</p><figcaption>총이익 {fmt(m.margins.gross)} = 다른 영업비용 {fmt(m.margins.otherOperating)} + 영업이익 {fmt(m.margins.operating)}. 총이익과 영업이익을 따로 더하지 않습니다. 영업이익에는 이자비용5가 포함되지 않고, 모형 전체의 세금은 생략했습니다. 한 달을 연환산하지 않습니다.</figcaption>
   </figure>
   <div className="ac-result" data-scenario={scenario} data-loan={currentLoan} data-ratio={m.currentRatio!.value} data-cash={m.cash} data-total-liabilities={m.totalLiabilities}><p>같은 회수 비교에서 유동비율은 같아도 현금65·225·465는 다를 수 있습니다.</p><p>비율 하나로 지급 성공·안전성·기업가치·사기를 판정하지 않습니다. 자산의 회수 조건과 실제 납기를 함께 확인하세요.</p></div>
   {prediction&&<p className="ac-feedback" role="status">{prediction==='different'?'예측과 같습니다.':'같은 몫이 같은 구성까지 뜻하지는 않습니다.'} 현재 현금{fmt(m.cash)}, 유동자산{fmt(m.currentAssets)}, 유동부채{fmt(m.currentLiabilities)}입니다. 회수0·160·400을 비교해 보세요.</p>}
   <details className="ac-static"><summary>모든 관찰 · 움직임 없이 읽기</summary><ol>{frames.map(g=><li key={g.index} data-static-index={g.index}><strong>{g.title}</strong><p>{g.detail}</p></li>)}</ol><p>현재 유동자산{fmt(m.currentAssets)} / 유동부채{fmt(m.currentLiabilities)} = {fmt(m.currentRatio!.value!)}배. 현금{fmt(m.cash)}.</p></details>
  </>}
 </section>;
}
export function RatioBoundaryLab(){
 const [key,setKey]=useState('zero'),m=ratioExample(key);
 return <section className="ac-lab ac-analysis-lab" data-ac-lab="ratio-boundary" aria-label="비율 분모의 산술과 해석 경계"><h2>계산 불가와 해석 주의는 다릅니다</h2><p>아래는 정본 장부와 분리한 작은 산술 예입니다. 실제 회사나 안전성 순위가 아닙니다.</p><label>분모 경계의 별도 예<select aria-label="분모 경계의 별도 예" value={key} onChange={e=>setKey(e.target.value)}>{Object.entries(ratioExamples).map(([id,x])=><option key={id} value={id}>{x.label}</option>)}</select></label>
  <div className="ac-an-ratio-pair" data-defined={m.ratio.defined} data-value={m.ratio.value??''} data-positive-base={m.ratio.positiveBase}><span>분자<br/><strong>{m.numerator}</strong></span><b aria-label="나누기">÷</b><span>분모<br/><strong>{m.denominator}</strong></span><b>=</b><strong>{percentage(m.ratio)}</strong></div><p role="status">{m.ratio.reason}</p><p>{m.note}</p><button onClick={()=>setKey('zero')}>분모 예 초기화</button>
 </section>;
}
export function BreakEvenMini(){
 const [quantity,setQuantity]=useState(45),[price,setPrice]=useState(5),m=breakEven({quantity,price}),path=(ps:{x:number;y:number}[])=>ps.map(p=>`${p.x*100},${p.y*100}`).join(' ');
 return <details className="ac-lab ac-analysis-lab ac-an-cvp" data-ac-lab="break-even"><summary>선택 읽기 · 별도 사업계획의 손익분기</summary><h3>팔수록 남는 금액이 고정비를 메울까요?</h3><p>정본과 별개입니다. 단일 상품·판매=구입·재고 변화0·개당 변동비3·기간 고정비90·세금/이자 제외·수량0–80의 관련 범위입니다. 고정비90이 실제 현금90 지급이라는 뜻은 아닙니다.</p>
  <div className="ac-controls"><label>별도 계획의 판매 수량<select aria-label="별도 계획의 판매 수량" value={quantity} onChange={e=>setQuantity(Number(e.target.value))}>{[0,44,45,46,80].map(q=><option key={q} value={q}>{q}개</option>)}</select></label><label>별도 계획의 판매 단가<select aria-label="별도 계획의 판매 단가" value={price} onChange={e=>setPrice(Number(e.target.value))}><option value={5}>5 · 개당 공헌2</option><option value={3}>3 · 개당 공헌0</option></select></label></div>
  <figure className="ac-figure"><h4>금액과 판매 수량의 교차</h4><p className="ac-an-cvp-legend">실선: 매출 · 점선: 총비용 · 세로선: 선택 수량의 이익/손실 차이 · 마름모: 손익분기 · 원: 선택 수량의 매출</p><div className="ac-an-plot-wrap"><div className="ac-an-y-labels" aria-hidden="true"><span>450</span><span>225</span><span>0</span></div><div className="ac-an-plot"><div className="ac-an-plot-area"><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`수량${quantity}, 매출${m.revenue}, 총비용${m.cost}, 이익${m.profit}. ${m.breakEven===null?'양의 유한 손익분기 없음':`손익분기${m.breakEven}개`}.`}><path d="M0 0V100H100" className="ac-an-axis"/><path d="M0 50H100" className="ac-an-grid"/><polyline data-cvp-line="revenue" points={path(m.revenueLine)} className="ac-an-revenue-line"/><polyline data-cvp-line="cost" points={path(m.costLine)} className="ac-an-cost-line"/><line data-cvp-gap x1={m.revenuePoint.x*100} x2={m.costPoint.x*100} y1={m.revenuePoint.y*100} y2={m.costPoint.y*100} className="ac-an-gap"/></svg>{m.intersection&&<span aria-hidden="true" data-cvp-intersection data-x={m.intersection.x} data-y={m.intersection.y} className="ac-an-marker ac-an-intersection" style={{left:`${m.intersection.x*100}%`,top:`${m.intersection.y*100}%`}}/>}<span aria-hidden="true" data-cvp-point="revenue" data-x={m.revenuePoint.x} data-y={m.revenuePoint.y} className="ac-an-marker ac-an-selected" style={{left:`${m.revenuePoint.x*100}%`,top:`${m.revenuePoint.y*100}%`}}/></div><div className="ac-an-x-labels"><span>0개</span><span>40개</span><span>80개</span></div></div></div><figcaption>세로0–450가상단위, 가로0–80개 고정 눈금. 이익은 두 금액의 차이며 현금 잔액 곡선이 아닙니다. 표식의 크기는 금액이 아니라 위치만 나타냅니다. 분기점 근처에서 표식이 겹치거나 차이가 작으면 아래 정확한 값을 함께 읽으세요.</figcaption></figure>
  <div className="ac-result" role="status" data-profit={m.profit} data-revenue={m.revenue} data-cost={m.cost} data-break-even={m.breakEven??''}><p>매출 {m.revenue} − 총비용 {m.cost} = 이익 {m.profit}</p><p>{m.breakEven===null?'개당 공헌이0이므로 고정비90을 메우는 양의 유한 손익분기점이 없습니다.':`개당 공헌${m.contribution} × 수량 − 고정비90. 손익분기는${m.breakEven}개입니다.`}</p></div><p>공헌이익은 매출−변동비라는 이 별도 계획의 정의입니다. 재고 원가를 뺀 앞의 매출총이익과 무조건 같은 말이 아닙니다. 설비 구매·회수일·상환일의 현금계획은 이 그림만으로 해결되지 않습니다.</p><button onClick={()=>{setQuantity(45);setPrice(5);}}>별도 계획 초기화</button>
 </details>;
}

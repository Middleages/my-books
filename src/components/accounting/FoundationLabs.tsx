import { useId, useState } from 'react';
import { useFoundationPlayback } from '../network/FoundationPlayback';
import { accounts, boundaryFrames, boundaryModes, modeLabels, doubleEntryFrames, ledgerSegments, type BoundaryFrame, type BoundaryMode, type Frame, type Snapshot } from '../../simulations/accounting/foundation.mjs';
import './accounting.css';
const fmt=(n:number)=>n.toLocaleString('ko-KR',{maximumFractionDigits:2});
function Controls({player,count,reset}:{player:ReturnType<typeof useFoundationPlayback>;count:number;reset:()=>void}){
 return <div className="ac-playback" role="group" aria-label="거래 관찰 단계"><button type="button" onClick={()=>player.setPlaying(!player.playing)} disabled={!player.playing&&player.index===count-1}>{player.playing?'정지':'재생'}</button><button type="button" onClick={()=>player.go(-1)} disabled={player.index===0}>이전 단계</button><button type="button" onClick={()=>player.go(1)} disabled={player.index===count-1}>다음 단계</button><button type="button" onClick={player.reset}>다시 보기</button><button type="button" onClick={reset}>전체 초기화</button><span className="ac-step">{player.index+1} / {count}단계</span></div>;
}
function StaticSteps({frames}:{frames:Frame[]}){
 return <details className="ac-static"><summary>모든 단계 · 움직임 없이 읽기</summary><ol>{frames.map(f=><li key={f.index}><strong>{f.title}</strong><p>{f.detail}</p><p>현금 {fmt(f.balances.cash)} · 매출채권 {fmt(f.balances.receivable)} · 설비 {fmt(f.balances.equipment)} = 차입금 {fmt(f.liabilities)} + 납입자본 {fmt(f.equity)}. 매출 {f.revenue}.</p></li>)}</ol></details>;
}
function BalanceBars({frame,label}:{frame:Snapshot&{scale:number};label:string}){
 const seg=ledgerSegments(frame);
 return <div className="ac-balance" data-assets={frame.assets} data-liabilities={frame.liabilities} data-equity={frame.equity} data-cash={frame.balances.cash} data-scale={frame.scale}><h3>{label}</h3>{(['assets','claims'] as const).map(side=><div className="ac-bar-group" key={side}><div className="ac-bar-label"><strong>{side==='assets'?'자산':'부채 + 자본'}</strong><span>{fmt(side==='assets'?frame.assets:frame.liabilities+frame.equity)}단위</span></div><div className="ac-bar-track" aria-hidden="true">{seg[side].filter(s=>s.value>0).map(s=><span key={s.key} className={`ac-segment ac-${s.key}`} style={{width:`${s.fraction*100}%`}} data-account={s.key} data-value={s.value} data-fraction={s.fraction}/>)}</div><ul className="ac-legend">{seg[side].filter(s=>s.value!==0||s.key==='cash').map(s=><li key={s.key}><i className={`ac-key ac-${s.key}`}/>{s.label} {fmt(s.value)}</li>)}</ul></div>)}<p className="ac-equation" data-balanced={frame.balanced}>{fmt(frame.assets)} = {fmt(frame.liabilities)} + {fmt(frame.equity)}</p></div>;
}
function BoundaryScene({frame:f,mobile}:{frame:BoundaryFrame;mobile:boolean}){
 const marker=`ac-${useId().replace(/:/g,'')}`;
 const x=mobile?140:102,y=mobile?49:122,cx=mobile?140:440,cy=mobile?247:122;
 const path=mobile?'M140 118V170':'M158 122H358';
 const claim=f.mode==='contribution'?f.balances.capital:f.mode==='borrowing'?f.balances.loan:f.balances.receivable;
 return <svg viewBox={mobile?'0 0 280 398':'0 0 680 320'} role="img" aria-label={`${f.actor}와 회사의 경계. ${f.committed?'확정':'거래 전'} 현금 ${fmt(f.balances.cash)}, ${f.relation}의 상대 잔액 ${fmt(claim)}`} data-boundary-mode={f.mode} data-committed={f.committed}>
 <defs><marker id={marker} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#346e82"/></marker></defs>
 <rect x={mobile?14:285} y={mobile?158:26} width={mobile?252:374} height={mobile?226:272} rx="18" fill="#f3f8f7" stroke="#397562" strokeWidth="2" strokeDasharray="8 4"/>
 <text x={mobile?28:303} y={mobile?184:54} className="ac-svg-heading">작은책상 · 회사 경계 안</text>
 <g transform={`translate(${x},${y})`}>
 {f.mode==='borrowing'?<><path d="M-41-17L0-42L41-17ZM-34-12V22M-12-12V22M12-12V22M34-12V22M-43 27H43" fill="#fff1dd" stroke="#a16920" strokeWidth="3"/><text x="0" y="51" textAnchor="middle">은행</text></>:f.mode==='contribution'?<><circle cy="-18" r="17" fill="#eee4f5" stroke="#765087" strokeWidth="2"/><path d="M-34 27C-34-11 34-11 34 27Z" fill="#eee4f5" stroke="#765087" strokeWidth="2"/><text x="0" y="51" textAnchor="middle">소유주</text></>:<><path d="M-32-33H32V32L21 25L10 32L0 25L-11 32L-22 25L-32 32Z" fill="#f0ecfb" stroke="#69518d" strokeWidth="2"/><path d="M-20-18H20M-20-4H20M-20 10H8" stroke="#69518d" strokeWidth="2"/><text x="0" y="51" textAnchor="middle">고객</text></>}
 </g>
 <path d={path} fill="none" stroke={f.committed?'#236f63':'#849da6'} strokeWidth="3" strokeDasharray={f.committed?undefined:'6 4'} markerEnd={`url(#${marker})`} data-money-path="incoming"/>
 <text x={mobile?190:222} y={mobile?128:101} textAnchor="middle" className="ac-svg-heading">{fmt(f.amount)}단위</text>
 <g transform={`translate(${cx},${cy})`}><rect x="-74" y="-40" width="148" height="74" rx="9" fill="#dcefe8" stroke="#347b65" strokeWidth="2"/><path d="M-65-29H-48M48 23H65" stroke="#347b65" strokeWidth="3"/><text y="-12" textAnchor="middle">회사 현금</text><text y="18" textAnchor="middle" className="ac-svg-number">{fmt(f.balances.cash)}</text></g>
 <path d={mobile?'M65 299H215':'M343 216H612'} stroke="#7f7290" strokeWidth="2"/>
 <text x={mobile?140:478} y={mobile?323:244} textAnchor="middle" className="ac-svg-heading">{f.mode==='collection'?'매출채권':f.mode==='borrowing'?'차입금':'납입자본'} {fmt(claim)}</text>
 <text x={mobile?140:478} y={mobile?348:269} textAnchor="middle">{f.committed?f.relation:'반대편 기록도 함께 확인'}</text>
 </svg>;
}
export function AccountingPrimer(){
 return <figure className="ac-primer"><div className="ac-primer-icon" aria-hidden="true"><span>↙</span><svg viewBox="0 0 120 75"><path d="M10 14H110V67H10ZM60 14V67M21 28H49M21 40H49M71 28H99M71 40H99" fill="#f4f8f5" stroke="#3b7465" strokeWidth="3"/><path d="M37 5H83" stroke="#3b7465" strokeWidth="5"/></svg><span>↘</span></div><div className="ac-primer-labels"><strong>무엇이 남았나<br/><small>자산·부채·자본</small></strong><strong>언제 벌고 썼나<br/><small>매출·비용·이익</small></strong><strong>언제 오갔나<br/><small>현금의 변화</small></strong></div><figcaption>하나의 회사, 하나의 거래 기록을 서로 다른 질문으로 읽습니다. 이 그림은 계산 결과가 아닌 학습 지도입니다.</figcaption></figure>;
}
export function CompanyBoundaryLab(){
 const [mode,setMode]=useState<BoundaryMode>('contribution'),[amount,setAmount]=useState(50),[prediction,setPrediction]=useState('');
 const frames=boundaryFrames({mode,amount}),player=useFoundationPlayback(frames.length),f=frames[player.index];
 const change=()=>{player.reset();setPrediction('');};const reset=()=>{change();setMode('contribution');setAmount(50);};
 return <section className="ac-lab" aria-label="회사 경계와 돈의 출처 실험" data-ac-lab="boundary"><p className="ac-eyebrow">01 · 같은 입금, 다른 관계</p><h2>통장 말고, 반대편도 보세요</h2><p>회수 사례는 기존 채권을 가진 별도 기초로 시작합니다. 기본50에서 현금450+채권50이고, 다른 두 사례는 현금500입니다. 모두 기초 자산 합계는500입니다.</p>
 <div className="ac-controls"><label>돈이 들어온 이유<select value={mode} onChange={e=>{change();setMode(e.target.value as BoundaryMode);}}>{boundaryModes.map(m=><option key={m} value={m}>{modeLabels[m]}</option>)}</select></label><label>비교할 금액 · 가상단위<select value={amount} onChange={e=>{change();setAmount(Number(e.target.value));}}>{[0,50,100].map(n=><option key={n} value={n}>{n}단위</option>)}</select></label></div>
 <label className="ac-prediction">먼저 예상하기<select value={prediction} onChange={e=>setPrediction(e.target.value)}><option value="">이 입금은 새 매출일까요?</option><option value="yes">매출이 늘어난다</option><option value="no">새 매출이 아니다</option></select></label>
 <Controls player={player} count={frames.length} reset={reset}/><div className="ac-current" role="status" aria-live="polite"><strong>{f.title}</strong><p>{f.detail}</p></div>
 <figure className="ac-figure"><div className="ac-desktop"><BoundaryScene frame={f} mobile={false}/></div><div className="ac-mobile"><BoundaryScene frame={f} mobile/></div><figcaption>점선 테두리는 회사와 외부 당사자의 경계입니다. 점선 화살표는 검토 중인 입금, 실선은 확정된 거래 관계이며 길이·이동 속도는 금액이나 시간의 비율이 아닙니다. 금액 비교는 아래 동일 눈금의 띠로 합니다.</figcaption></figure>
 <div className="ac-comparison"><BalanceBars frame={{...f.before,scale:f.scale}} label="거래 전"/><BalanceBars frame={f} label="현재 단계"/></div><p className="ac-scale">두 그림 모두 전체 폭 = 650가상단위. 띠의 길이만 금액에 비례하며 색과 라벨이 계정을 구분합니다.</p>
 <p className="ac-result" data-revenue={f.revenue} data-cash-change={f.cashChange}>이번 발췌의 현금 변화 {f.cashChange>=0?'+':''}{fmt(f.cashChange)} · 매출 {f.revenue} · 이익 {f.profit}</p>
 {f.committed&&prediction&&<p className="ac-feedback" role="status">{prediction==='no'?'예측과 같습니다.':'입금과 매출은 다릅니다.'} {f.detail}</p>}
 <StaticSteps frames={frames}/><p className="ac-note">가상 상품판매 회사의 세 거래만 비교합니다. 소유주의 개인 재산, 실제 계약 심사·회사 가치·세금·배당 가능액은 계산하지 않습니다. 금액0은 아무 잔액도 바꾸지 않는 비교입니다.</p></section>;
}
export function DoubleEntryLab(){
 const frames=doubleEntryFrames(),player=useFoundationPlayback(frames.length),f=frames[player.index],[prediction,setPrediction]=useState('');
 const reset=()=>{player.reset();setPrediction('');};const currentRows=f.event?.rows??[];
 return <section className="ac-lab" aria-label="한 거래의 두 기록 실험" data-ac-lab="double-entry"><p className="ac-eyebrow">02 · 같은 거래를 빠짐없이 기록</p><h2>합계가 늘었나요, 구성만 바뀌었나요?</h2><p>추가 출자50 → 차입100 → 설비 취득240을 차례로 관찰합니다. 설비를 사기 직전 자산650에서 무엇이 달라질지 먼저 생각해 보세요.</p><label className="ac-prediction">설비 취득의 결과 예측<select value={prediction} onChange={e=>setPrediction(e.target.value)}><option value="">자산 합계는 어떻게 될까요?</option><option value="same">650으로 그대로다</option><option value="down">240만큼 줄어든다</option><option value="up">240만큼 늘어난다</option></select></label><Controls player={player} count={frames.length} reset={reset}/><div className="ac-current" role="status" aria-live="polite"><strong>{f.title}</strong><p>{f.detail}</p></div>
 <figure className="ac-figure"><div className="ac-comparison"><BalanceBars frame={{...f.before,scale:f.scale}} label="이번 거래 직전"/><BalanceBars frame={f} label="현재 장부"/></div><figcaption>모든 띠의 전체 폭은650가상단위입니다. 출자/차입은 양쪽 합계를 늘리고 설비 취득은 자산 내부에서 초록 현금이 청록 설비로 바뀝니다. 자본은 자산에 추가할 별도의 돈이 아닙니다.</figcaption></figure>
 <div className="ac-journal"><h3>한 사건의 연결된 기록</h3>{f.event?<><p>{f.event.id} · {f.event.label}</p><div className="ac-journal-pair">{(['debit','credit'] as const).map(side=><div key={side}><strong>{side==='debit'?'차변 · 왼쪽':'대변 · 오른쪽'}</strong>{currentRows.filter(r=>r.side===side).map(r=><p key={r.account} data-posting-account={r.account} data-posting-side={r.side} data-posting-amount={r.amount}><span>{accounts[r.account].label}</span><b>{r.amount}</b><small>{accounts[r.account].normal===r.side?'잔액 증가':'잔액 감소'}</small></p>)}</div>)}</div><p>차변 합계 {currentRows.filter(r=>r.side==='debit').reduce((s,r)=>s+r.amount,0)} = 대변 합계 {currentRows.filter(r=>r.side==='credit').reduce((s,r)=>s+r.amount,0)}. 두 기록은 하나의 거래로 함께 확정됩니다.</p></>:<p>거래를 진행하면 같은 사건의 차변과 대변이 나타납니다.</p>}</div>
 <p className="ac-result">현재 자산 {f.assets} = 부채 {f.liabilities} + 자본 {f.equity}. 이 발췌의 매출·이익은0입니다.</p>{player.index===frames.length-1&&prediction&&<p className="ac-feedback" role="status">{prediction==='same'?'예측과 같습니다.':'설비도 회사의 자산입니다.'} 현금410+설비240=650입니다. 현금은 줄었지만 자산 합계는 변하지 않았습니다.</p>}
 <div className="ac-table" role="region" aria-label="계정별 거래 전후 잔액" tabIndex={0}><table><thead><tr><th>계정</th><th>직전</th><th>변화</th><th>현재</th></tr></thead><tbody>{Object.entries(accounts).map(([id,a])=>{const key=id as keyof typeof f.balances,diff=f.balances[key]-f.before.balances[key];return <tr key={id}><th>{a.label}</th><td>{fmt(f.before.balances[key])}</td><td>{diff>0?'+':''}{fmt(diff)}</td><td>{fmt(f.balances[key])}</td></tr>;})}</tbody></table></div><StaticSteps frames={frames}/><p className="ac-note">M1의 T01–T03만 순서대로 골라 본 발췌입니다. 설비 사용에 따른 감가상각·판매·비용·세금은 여기서 발생시키지 않습니다. 장부가 균형이라는 사실만으로 계정 분류와 거래 누락까지 정확하다고 보장할 수는 없습니다.</p></section>;
}

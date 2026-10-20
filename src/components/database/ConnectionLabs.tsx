import {useMemo,useState} from 'react';
import {poolFrames,bindingFrames,connectionBudget,type PoolFrame,type PoolScenario,type PoolSize,type BindingFrame,type BindingMode} from '../../simulations/database/connections.mjs';
import {DbPlayback,DbCurrent,DbSteps,DbPrediction,useDbPlayback} from './LabShared';
import './connections.css';
const scenarioNames:Record<PoolScenario,string>={'normal':'정상 반환','long-hold':'SQL 뒤 앱이 오래 보유','leak':'SQL 뒤 반환 누락','acquire-failure':'R1 연결 획득 실패'};
const statusNames:Record<PoolFrame['requests'][number]['status'],string>={'queued':'연결 대기','db-work':'SQL 사용','app-held':'앱 보유','completed':'반환 완료','acquire-error':'획득 실패'};
function PoolScene({frame:f,mobile,selected}:{frame:PoolFrame;mobile:boolean;selected:string}) {
 const w=mobile?280:720,rx=8,rw=mobile?80:170,cx=mobile?122:300,cw=mobile?64:150,sx=mobile?210:545,sw=mobile?64:160;
 const ry=(id:string)=>45+(Number(id.slice(1))-1)*76,cy=(slot:string)=>f.size===1?175:85+(Number(slot.slice(1))-1)*170;
 const marker=`pool-arrow-${mobile}`;
 return <svg viewBox={`0 0 ${w} 410`} role="img" aria-label="요청에서 현재 연결 대여와 DB 세션으로 이어지는 경로" data-pool-tick={f.tick}>
  <defs><marker id={marker} markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#367b68"/></marker></defs>
  <text x={rx} y="20" className="db-svg-title">앱 요청</text><text x={cx-5} y="20" className="db-svg-title">풀 상한{f.size}</text><text x={sx} y="20" className="db-svg-title">DB 세션</text>
  <rect x={cx-7} y="35" width={cw+14} height="338" rx="8" fill="#eff4fa" stroke="#879eb3" strokeDasharray="5 4"/>
  {f.requests.map(r=><g key={r.id} data-pool-request={r.id} data-request-status={r.status} data-selected={selected===r.id}><rect x={rx} y={ry(r.id)} width={rw} height="54" rx="7" className={`db-pool-request db-pool-request--${r.status}`}/><text x={rx+rw/2} y={ry(r.id)+21} textAnchor="middle" className="db-svg-title">{r.id}</text><text x={rx+rw/2} y={ry(r.id)+41} textAnchor="middle" className="db-svg-small">{statusNames[r.status]}</text></g>)}
  {f.slots.map(slot=>{const c=f.clients.find(c=>c.id===slot.clientId),y=cy(slot.id);return <g key={slot.id} data-capacity-slot={slot.id}>
   <text x={cx} y={y-9} className="db-svg-small">{slot.id} 용량 칸</text>
   {c?<g data-client-node={c.id} data-client-owner={c.ownerRequestId??'none'}><rect x={cx} y={y} width={cw} height="60" rx="7" className="db-pool-client"/><text x={cx+cw/2} y={y+23} textAnchor="middle" className="db-svg-title">{c.id}</text><text x={cx+cw/2} y={y+44} textAnchor="middle" className="db-svg-small">{c.ownerRequestId??'idle'}</text></g>:<g><rect x={cx} y={y} width={cw} height="60" rx="7" fill="none" stroke="#9aabb9" strokeDasharray="3 3"/><text x={cx+cw/2} y={y+25} textAnchor="middle" className="db-svg-small">연결</text><text x={cx+cw/2} y={y+43} textAnchor="middle" className="db-svg-small">미생성</text></g>}
   {c&&<g data-session-node={c.sessionId}><rect x={sx} y={y} width={sw} height="60" rx="6" fill="#e8f4ed" stroke="#4f8e72"/><text x={sx+sw/2} y={y+23} textAnchor="middle" className="db-svg-title">{c.sessionId}</text><text x={sx+sw/2} y={y+44} textAnchor="middle" className="db-svg-small">{c.ownerRequestId?'대여 중':'idle'}</text></g>}
  </g>;})}
  {f.edges.map(e=>{const client=f.clients.find(c=>c.id===(e.kind==='lease'?e.to:e.from))!,y=cy(client.slotId)+30;
   const i=e.kind==='lease'?Number(e.from.slice(1))-1:0,fromY=e.kind==='lease'?ry(e.from)+27:y,rail=mobile?98+i*5:220+i*13;
   const d=e.kind==='lease'?`M${rx+rw} ${fromY} H${rail} V${y} H${cx}`:`M${cx+cw} ${y} H${sx}`;
   return <path key={e.id} data-pool-edge={e.id} data-kind={e.kind} data-from={e.from} data-to={e.to} data-lease={e.leaseId} d={d} className="db-pool-edge" data-selected={client.ownerRequestId===selected} markerEnd={`url(#${marker})`}/>;
  })}
  <text x="8" y="397" className="db-svg-small">요청→client 대여 · client→세션 연결</text>
 </svg>;
}
function PoolTimeline({frame:f}:{frame:PoolFrame}) {
 const labels={acquireWait:'연결 대기',dbWork:'SQL 사용',appHeld:'앱 보유'};
 return <figure className="db-figure"><svg viewBox="0 0 280 200" role="img" aria-label="같은 교육 tick 축의 요청별 대기 사용 보유 시간" data-pool-timeline>
  <text x="6" y="16" className="db-svg-small">가상 tick · 같은0–12 눈금</text>
  {[0,2,4,6,8,10,12].map(t=><g key={t}><line x1={38+t*19} x2={38+t*19} y1="25" y2="177" stroke="#cfdae2"/><text x={38+t*19} y="194" textAnchor="middle" className="db-svg-small">{t}</text></g>)}
  {f.requests.map((r,i)=><g key={r.id}><text x="5" y={52+i*37} className="db-svg-small">{r.id}</text>{f.segments.filter(s=>s.requestId===r.id).map(s=><rect key={s.id} data-time-segment={s.id} data-kind={s.kind} data-start={s.start} data-end={s.end} x={38+s.start*19} y={34+i*37} width={(s.end-s.start)*19} height="25" className={`db-time-${s.kind}`}><title>{r.id} {labels[s.kind]} {s.start}–{s.end}tick</title></rect>)}</g>)}
 </svg><figcaption className="db-pool-legend"><span>파랑·점선: 연결 대기</span><span>초록: SQL 사용</span><span>노랑·줄무늬: SQL 종료 뒤 앱 보유</span></figcaption></figure>;
}
export function PoolLab() {
 const[size,setSize]=useState<PoolSize>(2),[scenario,setScenario]=useState<PoolScenario>('normal'),[selected,setSelected]=useState('R1'),[prediction,setPrediction]=useState('');
 const frames=useMemo(()=>poolFrames({size,scenario}),[size,scenario]),player=useDbPlayback(frames.length),f=frames[player.index];
 const reset=()=>{player.reset();setSize(2);setScenario('normal');setSelected('R1');setPrediction('');};
 return <section className="db-lab" data-db-lab="pool"><p className="db-eyebrow">07 · 요청과 대여의 수명</p><h2>SQL이 끝났는데 왜 다음 요청이 기다릴까요?</h2><p>요청4개가 동시에 도착합니다. 빈 용량 칸·실제 client·현재 대여 관계를 구별하고, 반환 뒤에도 남는 idle 연결을 보세요.</p>
 <div className="db-controls"><label>한 앱의 풀 상한<select aria-label="한 앱의 풀 상한" value={size} onChange={e=>{player.reset();setSize(Number(e.target.value) as PoolSize);setPrediction('');}}><option value="1">1개</option><option value="2">2개</option></select></label><label>연결 사용과 반환<select aria-label="연결 사용과 반환" value={scenario} onChange={e=>{player.reset();setScenario(e.target.value as PoolScenario);setPrediction('');}}>{Object.entries(scenarioNames).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label>경로를 강조할 요청<select aria-label="경로를 강조할 요청" value={selected} onChange={e=>setSelected(e.target.value)}>{['R1','R2','R3','R4'].map(id=><option key={id}>{id}</option>)}</select></label></div>
 <DbPrediction value={prediction} setValue={setPrediction}><option value="sql">SQL 종료만으로 다음 요청이 들어간다</option><option value="release">대여 반환이 필요하다</option></DbPrediction><DbPlayback player={player} count={frames.length} reset={reset}/><DbCurrent frame={f}/>
 <figure className="db-figure"><div className="db-desktop"><PoolScene frame={f} mobile={false} selected={selected}/></div><div className="db-mobile"><PoolScene frame={f} mobile selected={selected}/></div><figcaption>반환하면 요청의 대여 선은 없어집니다. 반환 완료 요청은 대기열에 없고, 정상 client와 DB 세션의 연결은 idle로 남습니다. 강조한 요청의 실제 경로가 굵어집니다.</figcaption></figure>
 <dl className="db-pool-metrics">{([['queued','대기 요청'],['inUse','현재 대여'],['openConnections','열린 연결'],['completed','반환 완료']] as const).map(([key,label])=><div key={key}><dt>{label}</dt><dd data-pool-measure={key}>{f.metrics[key]}</dd></div>)}</dl><PoolTimeline frame={f}/>
 <details className="db-static"><summary>요청별 시간과 완료 상태</summary><ul>{f.requests.map(r=><li key={r.id}><strong>{r.id} · {statusNames[r.status]}</strong><p>획득 {r.acquiredAt??'없음'} · SQL 종료 {r.sqlEndedAt??'아직 없음'} · 반환 완료 {r.status==='completed'?r.completedAt:'없음'}. {r.error?'획득 실패에는 사용할 client와 SQL 결과가 없습니다.':''}</p></li>)}</ul></details>
 <p className="db-model-note">2tick SQL·동시 도착·FIFO·즉시 연결 생성의 교육 모델입니다. 긴 보유/누락은 SQL이 끝난 뒤 앱이 client를 쥔 경우로, 열린 transaction이나 잠금까지 남았다고 가정하지 않습니다. 직접 driver 연결만 다루며 실제 지연·proxy·eviction·timeout·장애 client 폐기는 재현하지 않습니다.</p><DbSteps frames={frames}/></section>;
}
function BindingScene({frame:f,mobile}:{frame:BindingFrame;mobile:boolean}) {
 const w=mobile?280:720,callW=mobile?82:180,c1=mobile?130:365,c2=mobile?230:625,marker=`binding-${mobile}`;
 return <svg viewBox={`0 0 ${w} 390`} role="img" aria-label="각 SQL 호출이 배정된 client와 연결별 transaction 경계">
 <defs><marker id={marker} markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#59749a"/></marker></defs>
 <text x="5" y="18" className="db-svg-title">요청의 호출 이력</text>{[[c1,'C1'],[c2,'C2']].map(([x,id])=><g key={String(id)}><text x={Number(x)} y="18" textAnchor="middle" className="db-svg-title">{id}</text><rect data-binding-client-line={String(id)} x={Number(x)} y="31" width="1" height="288" fill="#a8b8c4"/></g>)}
 {f.activeTransactionClientId&&<rect data-binding-tx={f.activeTransactionClientId} x={c1-25} y="31" width="50" height="288" rx="6" fill="#eef0ff" fillOpacity=".7" stroke="#657bac" strokeDasharray="5 3"/>}
 {f.calls.map((c,i)=>{const y=39+i*54,x=c.clientId==='C1'?c1:c2;return <g key={c.id} data-binding-call={c.id} data-bound-client={c.clientId}><rect x="4" y={y} width={callW} height="35" rx="5" fill={c.clientId==='C1'?'#e9f1f7':'#fff1d9'} stroke="#8197a7"/><text x={8} y={y+22} className="db-svg-small">{c.kind}</text><path data-binding-edge={`${c.id}:binding`} data-from={c.id} data-to={c.clientId} d={c.clientId==='C1'?`M${4+callW} ${y+17} H${x}`:`M${4+callW} ${y+17} H${callW+16} V26 H${x} V${y+17}`} fill="none" stroke={c.clientId==='C1'?'#59749a':'#ac782b'} strokeWidth="2" markerEnd={`url(#${marker})`}/><circle cx={x} cy={y+17} r="4" fill="#59749a"/></g>;})}
 <text x="5" y="348" className="db-svg-title">최신 확정 재고 {f.committedStock}개</text><text x="5" y="373" className="db-svg-small">{f.pendingStock===null?'현재 미확정 변경 없음':`C1 안의 미확정 재고 ${f.pendingStock}개`}</text>
 </svg>;
}
export function BindingLab() {
 const[mode,setMode]=useState<BindingMode>('pinned'),frames=useMemo(()=>bindingFrames({mode}),[mode]),player=useDbPlayback(frames.length),f=frames[player.index];
 return <section className="db-lab" data-db-lab="connection-binding"><p className="db-eyebrow">07 · transaction은 같은 세션에서</p><h2>BEGIN을 보냈다는 사실만으로 충분할까요?</h2><p>BEGIN·재고 변경·취소가 어느 client로 갔는지 선을 따라갑니다. 점선은 현재 C1의 명시적 transaction이고, 호출 선은 이미 실행한 이력입니다.</p><div className="db-controls"><label>transaction의 연결 배정<select aria-label="transaction의 연결 배정" value={mode} onChange={e=>{player.reset();setMode(e.target.value as BindingMode);}}><option value="pinned">한 client를 끝까지 유지</option><option value="split">분리 호출의 가능한 다른 배정</option></select></label></div><DbPlayback player={player} count={frames.length} reset={()=>{player.reset();setMode('pinned');}}/><DbCurrent frame={f}/><figure className="db-figure"><div className="db-desktop"><BindingScene frame={f} mobile={false}/></div><div className="db-mobile"><BindingScene frame={f} mobile/></div><figcaption>분리 호출 예에서만 UPDATE는 C2로 갑니다. pool.query가 언제나 다른 연결을 고른다는 뜻은 아닙니다. 명시적으로 빌린 한 client로 요청 경계를 보장해야 합니다.</figcaption></figure><p className="db-model-note">교육용 가능한 배정이며 실제 driver 실행 기록이 아닙니다. 정상 반환은 transaction 정리를 대신하지 않습니다. 연결 손상·ROLLBACK 실패·COMMIT 응답 유실은 본문의 다른 오류 경계로 구별합니다.</p><DbSteps frames={frames}/></section>;
}
export function ConnectionBudgetLab() {
 const[instances,setInstances]=useState<1|3>(1),[poolMax,setPoolMax]=useState<2|4>(2),f=connectionBudget({instances,poolMax});
 return <section className="db-lab" data-db-lab="connection-budget"><p className="db-eyebrow">07 · 앱 하나에서 서버 전체로</p><h2>앱 복제본이 늘면 상한 합계는?</h2><div className="db-controls"><label>앱 인스턴스 수<select aria-label="앱 인스턴스 수" value={instances} onChange={e=>setInstances(Number(e.target.value) as 1|3)}><option value="1">1개</option><option value="3">3개</option></select></label><label>인스턴스별 풀 최대<select aria-label="인스턴스별 풀 최대" value={poolMax} onChange={e=>setPoolMax(Number(e.target.value) as 2|4)}><option value="2">2개</option><option value="4">4개</option></select></label></div><button onClick={()=>{setInstances(1);setPoolMax(2);}}>연결 예산 초기화</button><DbCurrent frame={f}/>
 <figure className="db-budget-figure"><figcaption>각 칸은 가능한 연결1개. 열린 연결의 측정치가 아닙니다.</figcaption><div className="db-server-budget" aria-label="서버 최대12의 보수적 예산 분해">{Array.from({length:12},(_,i)=><div key={i} data-budget-role={i<2?'other':i<8?'app':'reserved'}>{i<2?'다른':i<8?'앱':'예약'}<small>{i+1}</small></div>)}</div><p>다른 연결2 + 일반 앱 예산6 + 예약 진입 여유4 = 서버 최대12</p>
 <div className="db-budget-allowed"><strong>일반 앱 상한 예산6</strong><div className="db-demand-grid">{Array.from({length:6},(_,i)=>{const t=f.tokens[i];return <div key={i} data-demand-token={t?.id} data-excess="false">{t?`앱${t.instance}`:'빈 예산'}<small>{t?`상한 ${t.ordinal}`:'연결 아님'}</small></div>;})}</div></div>
 {f.excess>0&&<div className="db-budget-overflow"><strong>예산 밖의 초과{f.excess}개 · 숨기지 않음</strong><div className="db-demand-grid">{f.tokens.slice(6).map(t=><div key={t.id} data-demand-token={t.id} data-excess="true">앱{t.instance}<small>상한 {t.ordinal}</small></div>)}</div></div>}
 </figure><p className="db-budget-verdict" data-budget-fits={String(f.fits)} data-budget-excess={f.excess}>설정 상한 합계 {f.configuredDemand}개 / 일반 앱 예산 {f.appBudget}개. {f.fits?'이 보수적 상한 비교 안에 들어갑니다. 최적 성능이라는 뜻은 아닙니다.':`일반 앱 예산을 ${f.excess}개 넘습니다. 실제로 모두 연결됐다는 뜻은 아닙니다.`}</p><p className="db-model-note">예약4는 이미 만들어진 관리 연결4개가 아니라 신규 진입 제한을 남긴 것입니다. 총 사용8에서는 일반 역할 신규 진입이 제한되고,10에서는 superuser만,12에서는 모두 가득 찹니다. 다른 실제 연결도 역할과 무관하게 총량에 포함됩니다. 실제 기본값이나 권장 크기가 아닌 합성 예산입니다.</p></section>;
}

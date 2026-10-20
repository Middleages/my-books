import {useMemo,useState} from 'react';
import {DURABILITY_CASES,WAL_RECORDS,durabilityFrames,type DurabilityCase,type DurabilityFrame,type WalPage,type WalRecord} from '../../simulations/database/durability.mjs';
import {DbCurrent,DbPlayback,DbPrediction,DbSteps,useDbPlayback} from './LabShared';
import './recovery.css';
const labels:Record<DurabilityCase,string>={
 'sync-before-flush':'동기 · cache 쓰기 뒤, flush 전 장애',
 'sync-after-flush-before-ack':'동기 · flush 뒤, 응답 수신 전 장애',
 'sync-after-ack':'동기 · 성공 응답 뒤 장애',
 'uncommitted-page':'미확정 page10까지 쓴 뒤 장애',
 'async-before-flush':'비동기 · 응답 뒤, flush 전 장애',
 'async-after-flush':'비동기 · 응답과 flush 뒤 장애',
 'storage-loss':'성공 응답 뒤 로컬 저장 장치도 소실'
};
const statusText:Record<string,string>={'not-started':'시작 전','uncommitted':'미확정','awaiting-durability':'내구화 대기','logical-commit-volatile':'비동기 논리 완료','durable-commit':'COMMIT 내구화','recovery-undecided':'복구 판정 전','recovered-committed':'확정 복구','recovered-not-committed':'확정 기록 없음'};
function PageBox({page,x,y,location}:{page:WalPage;x:number;y:number;location:string}){
 return <g data-wal-page={location} data-page-id={page.id} data-page-lsn={page.lsn}><rect x={x} y={y} width="125" height="100" rx="6" fill="#edf5fa" stroke="#6e8ca4"/><text x={x+6} y={y+17} className="db-svg-title">P1 · LSN {page.lsn}</text>{page.versions.map((v,i)=><g key={v.id} data-physical-version={v.id}><rect x={x+6} y={y+27+i*32} width="113" height="27" rx="3" fill={v.createdBy==='T1'?'#f2edf9':'#fff'} stroke="#a79ab6"/><text x={x+10} y={y+45+i*32} className="db-svg-small">{v.id.split(':').at(-1)} · 재고{v.qty} · {v.createdBy}</text></g>)}</g>;
}
function LogBox({records,x,y,location,end}:{records:readonly WalRecord[];x:number;y:number;location:string;end?:number}){
 return <g data-wal-log={location}><rect x={x} y={y} width="117" height="100" rx="6" fill="#fff8e9" stroke="#b29b61"/><text x={x+6} y={y+17} className="db-svg-title">WAL{end!==undefined?` 끝${end}`:''}</text>{records.length?records.map((r,i)=><g key={r.id} data-wal-record={r.id} data-record-location={location}><rect x={x+6} y={y+27+i*32} width="105" height="27" rx="3" fill="#fff" stroke="#b29b61"/><text x={x+10} y={y+45+i*32} className="db-svg-small">{r.endLsn} · T1 {r.kind==='commit'?'확정':'P1 변경'}</text></g>):<text x={x+6} y={y+48} className="db-svg-small">아직 기록 없음</text>}</g>;
}
const paths:Record<string,string>={
 'ram-page->ram-wal':'M137 172 H150','ram-wal->os-wal':'M208 222 V260','os-wal->disk-wal':'M208 330 V400',
 'ram-page->disk-page':'M74 222 V400','disk-page->ram-page':'M74 400 V222',
 'disk-wal->ram-page':'M150 450 H143 V350 H1 V172 H12','ram-wal->app':'M208 122 V64'
};
function StorageScene({frame:f}:{frame:DurabilityFrame}){
 return <svg viewBox="0 0 280 530" role="img" aria-label="RAM 쓰기 cache와 내구 WAL 데이터 페이지의 서로 다른 위치">
 <defs><marker id="db-wal-arrow" markerWidth="5" markerHeight="5" refX="4.5" refY="2.5" orient="auto"><path d="M0 0L5 2.5L0 5Z" fill="#2d7d87"/></marker></defs>
 <g data-wal-app-response={f.appOutcome}><rect x="150" y="10" width="117" height="54" rx="12" fill="#eaf5ed" stroke="#658e75"/><text x="208" y="30" textAnchor="middle" className="db-svg-title">앱 응답</text><text x="208" y="49" textAnchor="middle" className="db-svg-small">{f.acknowledged?'성공 수신':f.appOutcome==='unknown'?'결과 불명':'성공 수신 없음'}</text></g>
 {f.ram?<g data-ram-instance={f.ram.id}><rect x="4" y="88" width="272" height="146" rx="8" fill="#f3f8fc" stroke="#8da6ba" strokeDasharray="4 3"/><text x="12" y="108" className="db-svg-small">RAM · {f.ram.id} · 휘발성</text></g>:<text x="12" y="161" className="db-svg-title">기존 RAM instance 소실</text>}
 {f.storage?<g data-storage-instance={f.storage.id}><rect x="4" y="368" width="272" height="151" rx="8" fill="#f4f6eb" stroke="#8f9d6c"/><text x="12" y="388" className="db-svg-small">내구 영역 · {f.storage.id}</text></g>:<text x="12" y="447" className="db-svg-title">data와 WAL 저장 장치 소실</text>}
 {f.flows.filter(e=>paths[e.id]).map(e=><path key={e.id} data-wal-flow={e.id} data-from={e.from} data-to={e.to} d={paths[e.id]} fill="none" stroke="#2d7d87" strokeWidth="2.5" markerEnd="url(#db-wal-arrow)"/>)}
 {f.ram&&<><PageBox page={f.ram.page} x={12} y={122} location="ram-page"/><LogBox records={f.ram.walRecords} x={150} y={122} location="ram-wal"/></>}
 {f.osCache?<g data-os-cache={f.osCache.id}><rect x="150" y="260" width="117" height="70" rx="6" fill="#f9f0de" stroke="#b39653" strokeDasharray="4 3"/><text x="156" y="280" className="db-svg-small">휘발 쓰기 cache</text><text x="156" y="302" className="db-svg-small">WAL {f.osCache.walIds.length?f.osCache.walIds.map(id=>WAL_RECORDS.find(r=>r.id===id)!.endLsn).join(' · '):'없음'}</text><text x="156" y="319" className="db-svg-small">write ≠ 내구화</text></g>:<text x="150" y="289" className="db-svg-small">쓰기 cache 소실</text>}
 {f.storage&&<><PageBox page={f.storage.page} x={12} y={400} location="disk-page"/><LogBox records={f.storage.walRecords} x={150} y={400} location="disk-wal" end={f.storage.durableEnd}/></>}
 </svg>;
}
function VisibilityScene({frame:f,onStep,count}:{frame:DurabilityFrame;onStep:(delta:number)=>void;count:number}){
 const recovered=f.ram?.id==='ram:boot2',versions=recovered?f.ram!.page.versions:[];
 const readPaths:Record<string,string>={'ram-page->reader':'M70 170 V195 H110 V222','tx-status->reader':'M211 170 V195 H170 V222'};
 return <figure className="db-figure db-visibility-figure"><div className="db-e-local-playback" role="group" aria-label="가시성 그림 단계 조작"><button type="button" aria-label="가시성 그림에서 이전 단계" onClick={()=>onStep(-1)} disabled={f.step===0}>가시성 이전</button><button type="button" aria-label="가시성 그림에서 다음 단계" onClick={()=>onStep(1)} disabled={f.step===count-1}>가시성 다음</button><span>{f.step+1} / {count}단계</span></div><p className="db-e-local-current">{f.title}</p><svg viewBox="0 0 280 300" role="img" aria-label="물리 페이지의 버전과 T1의 확정 판정을 함께 읽는 새 조회">
 <defs><marker id="db-visible-arrow" markerWidth="5" markerHeight="5" refX="4.5" refY="2.5" orient="auto"><path d="M0 0L5 2.5L0 5Z" fill="#74669b"/></marker></defs>
 <text x="8" y="20" className="db-svg-title">복구 뒤 가시성 관찰</text>
 {recovered?<><g data-visibility-page="P1"><rect x="8" y="40" width="125" height="130" rx="6" fill="#edf5fa" stroke="#6e8ca4"/><text x="14" y="59" className="db-svg-small">P1의 물리 버전</text>{versions.map((v,i)=><g key={v.id} data-visibility-version={v.id} data-visible={f.readResult?.versionId===v.id}><rect x="14" y={72+i*40} width="113" height="34" rx="4" fill={f.readResult?.versionId===v.id?'#e5f3ea':'#fff'} stroke={f.readResult?.versionId===v.id?'#287854':'#9a8eaf'} strokeWidth={f.readResult?.versionId===v.id?3:1}/><text x="20" y={94+i*40} className="db-svg-small">{v.id.split(':').at(-1)} · 재고{v.qty}</text></g>)}</g><g data-visibility-transaction={f.transactionStatus}><rect x="150" y="40" width="122" height="130" rx="6" fill="#f6f2fa" stroke="#8e7ca5"/><text x="156" y="59" className="db-svg-small">복구된 T1 판정</text><text x="156" y="93" className="db-svg-small">{statusText[f.transactionStatus]}</text><text x="156" y="120" className="db-svg-small">COMMIT 기록</text><text x="156" y="141" className="db-svg-small">{f.transactionStatus==='recovered-committed'?'20 있음':f.transactionStatus==='recovered-not-committed'?'없음':'판정 전'}</text></g></>:<text x="8" y="80" className="db-svg-small">{f.storage?'아직 새 instance의 복구 관찰 전':'생존 자료 없어 자동 복구 불가'}</text>}
 {f.flows.some(e=>e.id==='disk-wal->tx-status')&&<><g data-visibility-source="disk-wal"><rect x="8" y="202" width="125" height="70" rx="5" fill="#fff8e9" stroke="#b29b61"/><text x="14" y="223" className="db-svg-small">생존 WAL의 근거</text><text x="14" y="248" className="db-svg-small">{f.storage?.walRecords.some(r=>r.kind==='commit')?'COMMIT20 있음':'COMMIT 기록 없음'}</text></g><path data-status-flow="disk-wal->tx-status" d="M70 202 V187 H211 V170" fill="none" stroke="#74669b" strokeWidth="2.5" markerEnd="url(#db-visible-arrow)"/></>}
 {f.readResult&&<>{f.flows.filter(e=>readPaths[e.id]).map(e=><path key={e.id} data-visibility-flow={e.id} data-from={e.from} data-to={e.to} d={readPaths[e.id]} fill="none" stroke="#74669b" strokeWidth="2.5" markerEnd="url(#db-visible-arrow)"/>)}<g data-wal-read-result={f.readResult.qty}><rect x="60" y="222" width="160" height="64" rx="14" fill="#e5f3ea" stroke="#287854"/><text x="140" y="244" textAnchor="middle" className="db-svg-small">새 독자 · 상품101</text><text x="140" y="270" textAnchor="middle" className="db-svg-title">재고 {f.readResult.qty}개</text></g></>}
 </svg><figcaption>보라 선은 물리 버전과 확정 여부를 함께 판단하는 읽기입니다. 새 버전4가 페이지에 있다는 이유만으로4를 반환하지 않습니다. 선택된 버전은 두꺼운 초록 테두리로 표시합니다.</figcaption></figure>;
}
export function DurabilityLab(){
 const[scenario,setScenario]=useState<DurabilityCase>('sync-after-ack'),[prediction,setPrediction]=useState('');
 const frames=useMemo(()=>durabilityFrames({scenario}),[scenario]),player=useDbPlayback(frames.length),f=frames[player.index];
 const reset=()=>{player.reset();setScenario('sync-after-ack');setPrediction('');};
 return <section className="db-lab" data-db-lab="durability"><p className="db-eyebrow">09 · 내구 영역과 새 조회</p><h2>WAL은 남고 data page는 옛날이면?</h2><p>같은 상품101의 물리 버전·내구화된 기록·앱 응답·새 조회를 나눕니다. 먼저 장애 뒤 재고가4인지5인지, 아니면 모르는지 예상해 보세요.</p><div className="db-controls"><label>장애 관찰 시나리오<select aria-label="장애 관찰 시나리오" value={scenario} onChange={e=>{player.reset();setScenario(e.target.value as DurabilityCase);setPrediction('');}}>{DURABILITY_CASES.map(c=><option key={c} value={c}>{labels[c]}</option>)}</select></label><DbPrediction value={prediction} setValue={setPrediction}><option value="4">새 조회에서4가 보인다</option><option value="5">새 조회에서5가 보인다</option><option value="unknown">남은 자료 없이는 모른다</option></DbPrediction></div>
 <DbPlayback player={player} count={frames.length} reset={reset}/><DbCurrent frame={f}/>
 <div className="db-wal-scenes"><figure className="db-figure db-wal-physical"><StorageScene frame={f}/><figcaption>청록 선은 이번 단계의 실제 모델 경로입니다: {f.flows.filter(e=>paths[e.id]).map(e=>e.label).join(' · ')||'현재 이동 없음'}. 점선 RAM/cache는 휘발 영역, 실선 아래는 동기화 완료를 신뢰하는 내구 영역입니다. 장치 내부·원자적 쓰기 절차를 축척 재현하지 않습니다.</figcaption></figure><div><dl className="db-e-measures"><div><dt>내구 WAL 끝</dt><dd data-wal-durable-end={f.storage?.durableEnd??'unknown'}>{f.storage?.durableEnd??'장치 소실'}</dd></div><div><dt>저장된 pageLSN</dt><dd data-wal-disk-lsn={f.storage?.page.lsn??'unknown'}>{f.storage?.page.lsn??'모름'}</dd></div><div><dt>T1 관찰 상태</dt><dd>{statusText[f.transactionStatus]}</dd></div><div><dt>앱 성공 응답</dt><dd>{f.acknowledged?'수신함':'수신하지 않음'}</dd></div></dl><VisibilityScene frame={f} onStep={player.go} count={frames.length}/></div></div>
 <p className="db-model-note">기본은 fsync=on·synchronous_commit=on, 복제 없음, 정상 내구성 장치입니다. 비동기 선택지만 synchronous_commit=off의 경계를 비교합니다. 실제 설정은 바꾸지 않습니다. LSN10/20은 기록 순서 기호이지 시각·transaction 번호·실제 byte 크기가 아닙니다. v0/v1은 같은 행의 버전이며 페이지 사본과 구별합니다.</p><DbSteps frames={frames}/></section>;
}

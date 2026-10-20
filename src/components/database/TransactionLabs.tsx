import { useMemo, useState } from 'react';
import { transactionFrames, type TransactionMode, type TransactionOutcome, type TransactionFrame } from '../../simulations/database/transactions.mjs';
import { DbPlayback, DbCurrent, DbSteps, DbPrediction, useDbPlayback } from './LabShared';
import { ReservationFacts, StatementHistory, ObservationHistory, SvgVersion, blockLabel, rowShort, rowValue } from './TransactionShared';

const modes: Record<TransactionMode, string> = { atomic: '세 변경을 한 트랜잭션에', 'statement-autocommit': '문장마다 자동 확정' };
const outcomes: Record<TransactionOutcome, string> = { success: '세 변경 성공', 'header-constraint-error': '주문 헤더의 제약 오류', 'item-constraint-error': '항목 수량의 제약 오류' };
function TransactionScene({ frame: f, mobile }: { frame: TransactionFrame; mobile: boolean }) {
  const w = mobile ? 280 : 720, pad = 12, gap = mobile ? 7 : 18, cw = (w - pad * 2 - gap * 2) / 3;
  const xs = [pad, pad + cw + gap, pad + (cw + gap) * 2], activeY = 118, committedY = 295;
  const titles = ['재고 변경', '주문 헤더', '주문 항목'];
  const orderIds = f.requests.map(r => r.orderId).filter((id): id is number => id !== null);
  const relevant = (table: string, rowKey: string) => table === 'products' ? rowKey === 'products:101' : table === 'orders' ? orderIds.some(id => rowKey === `orders:${id}`) : table === 'order_items' && orderIds.some(id => rowKey.startsWith(`order_items:${id}:`));
  const current = f.versions.filter(v => f.committedVersionIds.includes(v.id) && relevant(v.table, v.rowKey));
  const changeByTable = ['products', 'orders', 'order_items'].map(table => f.activeChanges.find(c => c.table === table));
  const committedByTable = ['products', 'orders', 'order_items'].map(table => current.find(v => v.table === table));
  const activeTx = f.transactions.filter(t => t.blockStatus !== 'idle').at(-1);
  const allocating = f.sequence.allocations.at(-1), commitEvent = f.committedThisStepVersionIds.length > 0;
  return <svg viewBox={`0 0 ${w} 480`} role="img" aria-label="미확정 변경과 확정 상태, 별도 번호 배정 경계" data-transaction-phase={f.phase}>
    <defs><marker id={`db-tx-arrow-${mobile}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="#287c62"/></marker></defs>
    <text x={pad} y="22" className="db-svg-title">작성 세션 · {activeTx ? blockLabel[activeTx.blockStatus] : '블록 없음'}</text>
    {activeTx && <rect x="3" y="36" width={w - 6} height="160" rx="10" className="db-tx-boundary" data-active-block={activeTx.id} data-block-status={activeTx.blockStatus}/>}
    <text x={pad} y="59" className="db-svg-small">{f.mode === 'atomic' ? '유효한 미확정 변경 집합' : '문장 성공 뒤 자동 확정'}</text>
    {titles.map((title, i) => <text key={title} x={xs[i]} y="99" className="db-svg-small">{title}</text>)}
    {changeByTable.map((change, i) => {const version = change && f.versions.find(v => v.id === change.versionId); return version ? <SvgVersion key={version.id} version={version} x={xs[i]} y={activeY} width={cw}/> : <text key={i} x={xs[i]} y={activeY + 33} className="db-svg-small" data-empty-active={i}>변경 없음</text>;})}
    <g data-commit-event={f.event.id}><rect x={w / 2 - 58} y="212" width="116" height="32" rx="6" fill={commitEvent ? '#d9efe4' : '#edf1f4'} stroke="#72978a"/><text x={w / 2} y="233" textAnchor="middle" className="db-svg-small">{commitEvent ? '확정 사건' : '확정 사건 없음'}</text></g>
    {committedByTable.map((v, i) => v && f.committedThisStepVersionIds.includes(v.id) ? <path key={v.id} data-commit-to={v.id} d={`M${w / 2} 244 V260 H${xs[i] + cw / 2} V${committedY}`} fill="none" stroke="#287c62" strokeWidth="2" markerEnd={`url(#db-tx-arrow-${mobile})`}/> : null)}
    <text x={pad} y="389" className="db-svg-title">최신 확정 상태</text>
    <rect x="3" y={committedY - 7} width={w - 6} height="82" rx="11" className="db-committed-boundary"/>
    {committedByTable.map((v, i) => v ? <SvgVersion key={v.id} version={v} x={xs[i]} y={committedY} width={cw}/> : <text key={i} x={xs[i]} y={committedY + 36} className="db-svg-small" data-empty-committed={i}>{i === 0 ? '관찰할 행 없음' : '새 기록 없음'}</text>)}
    <path d={`M${pad} 410 H${w - pad}`} stroke="#c2a15a" strokeDasharray="5 4"/>
    <text x={pad} y="435" className="db-svg-title">번호 배정 · 취소 범위 밖</text>
    <text x={pad} y="461" className="db-svg-small" data-sequence-next={f.sequence.nextValue}>{allocating ? `소비 ${allocating.value} · 다음 값 ${f.sequence.nextValue}` : `아직 배정 전 · 다음 값 ${f.sequence.nextValue}`}</text>
  </svg>;
}
export function TransactionLab() {
  const [mode, setMode] = useState<TransactionMode>('atomic'), [outcome, setOutcome] = useState<TransactionOutcome>('success'), [prediction, setPrediction] = useState('');
  const frames = useMemo(() => transactionFrames({ mode, outcome }), [mode, outcome]);
  const player = useDbPlayback(frames.length), f = frames[player.index];
  const reset = () => {setMode('atomic');setOutcome('success');setPrediction('');player.reset();};
  return <section className="db-lab db-transaction-lab" data-db-lab="transactions"><p className="db-eyebrow">05 · 같은 요청, 다른 확정 경계</p><h2>세 변경은 어느 순간 함께 남을까요?</h2><p>재고·주문·항목의 정체성을 위아래로 비교하세요. 오류 후보와 취소 이력은 현재 변경 집합에 넣지 않습니다.</p>
    <div className="db-controls"><label>확정하는 단위<select aria-label="확정하는 단위" value={mode} onChange={e => {player.reset();setMode(e.target.value as TransactionMode);setPrediction('');}}>{Object.entries(modes).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>요청의 진행 결과<select aria-label="요청의 진행 결과" value={outcome} onChange={e => {player.reset();setOutcome(e.target.value as TransactionOutcome);setPrediction('');}}>{Object.entries(outcomes).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    <DbPrediction value={prediction} setValue={setPrediction}><option value="all">세 변경이 함께 남거나 함께 취소될 것</option><option value="partial">앞 문장의 일부 변경만 남을 수 있을 것</option></DbPrediction>
    <DbPlayback player={player} count={frames.length} reset={reset}/><DbCurrent frame={f}/>
    <figure className="db-figure"><div className="db-desktop"><TransactionScene frame={f} mobile={false}/></div><div className="db-mobile"><TransactionScene frame={f} mobile/></div><figcaption>점선은 작성 세션의 명시적 블록, 초록 경계는 확정 상태입니다. 칸은 세 종류의 기록 위치이며 ‘새 기록 없음’은 행 객체가 아닙니다. 같은 DB의 논리적 보기이지 물리적 복사본 둘이 아닙니다.</figcaption></figure>
    {f.rejectedCandidate && <div className="db-rejected-candidate" data-rejected-key={f.rejectedCandidate.rowKey}><strong>거절된 후보 · 유효한 저장 행 아님</strong><p>{rowShort(f.rejectedCandidate.row)} · {rowValue(f.rejectedCandidate.row)}<br/>{f.rejectedCandidate.constraint}</p></div>}
    {!!f.discardedChanges.length && <div className="db-discarded-history"><strong>취소 이력 · 현재 변경 경계 밖</strong><ul>{f.discardedChanges.map(c => <li key={c.id} data-discarded-version={c.versionId}>{rowShort(c.row)} · {rowValue(c.row)} · {c.reason}</li>)}</ul></div>}
    <ReservationFacts frame={f}/><ObservationHistory observations={f.readObservations} versions={f.versions}/><StatementHistory statements={f.statements}/>
    <p className="db-model-note">상품101·시작5개·요청2개. 번호 객체 {f.sequence.name}는 이 장의 명시적 교육 가정입니다. 기존 주문은 다시 차감하지 않습니다. 브라우저는 SQL을 실행하지 않으며 외부 이메일·HTTP·디스크 장애를 취소하지 않습니다.</p><DbSteps frames={frames}/>
  </section>;
}

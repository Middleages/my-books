import type { ModelRow, ModelStatement, ReadObservation, ReservationFrameBase, RowVersion } from '../../simulations/database/transactions.mjs';
import './transactions.css';

export const rowValue = (row: ModelRow): string => 'available_qty' in row ? `${row.available_qty}개` : 'qty' in row ? `${row.qty === null ? 'NULL' : row.qty}개` : 'request_key' in row ? `주문 ${row.id}` : `고객 ${row.id}`;
export const rowShort = (row: ModelRow): string => 'available_qty' in row ? `상품 ${row.id}` : 'qty' in row ? `항목 ${row.order_id},${row.line_no}` : 'request_key' in row ? `주문 ${row.id}` : `고객 ${row.id}`;
export const versionStatus = { committed: '확정', active: '미확정', superseded: '이전 버전', discarded: '취소 이력' } as const;
export const blockLabel = { idle: '블록 없음', 'in-transaction': '진행 중', failed: '실패 블록' } as const;
export const verdictLabel = { pending: '아직 처리 중', fulfilled: '예약 완료', 'rolled-back': '변경 취소', 'partial-failure': '일부만 남음', oversold: '재고보다 많이 약속', 'safe-rejection': '없는 재고의 주문 거절', 'read-check-complete': '읽기·확인 완료' } as const;
export function ReservationFacts({ frame: f }: { frame: ReservationFrameBase }) {
  return <div className="db-reservation-facts" data-business-valid={String(f.invariants.terminalBusinessValid)}>
    <dl><div><dt>최신 확정 재고</dt><dd data-measure="availableQty">{f.measurements.availableQty}개</dd></div><div><dt>새 확정 주문</dt><dd data-measure="newOrderCount">{f.measurements.newOrderCount}건</dd></div><div><dt>새 항목 수량</dt><dd data-measure="newItemQty">{f.measurements.newItemQty}개</dd></div><div><dt>완료 요청</dt><dd data-measure="fulfilledRequests">{f.measurements.fulfilledRequests}건</dd></div></dl>
    <strong data-verdict={f.invariants.verdict}>{verdictLabel[f.invariants.verdict]}</strong><p>표의 규칙: {f.invariants.schemaValid ? '충족' : '위반'} · 재고 음수 아님: {f.invariants.stockNonnegative ? '충족' : '위반'}. 처리 중에는 요청 전체의 완료 판정을 미룹니다.</p>
  </div>;
}
export function StatementResult({ statement: s }: { statement: ModelStatement }) {
  return <div className="db-statement" data-statement-id={s.id} data-statement-status={s.status} data-affected={s.affectedRows ?? 'none'} data-returned={s.returnedCount ?? 'none'}>
    <strong>{s.sessionId} · {s.kind}</strong><span>{s.status === 'waiting' ? '대기 · 완료 결과 없음' : s.status === 'error' ? `SQL 오류 · ${s.errorCode}` : s.affectedRows !== null ? `갱신/삽입 ${s.affectedRows}행` : s.returnedCount !== null ? `반환 ${s.returnedCount}행` : '문장 완료'}</span>
    <small>{s.id}{s.implicitCommit ? ' · 이 문장의 자동 확정' : ''}</small>
  </div>;
}
export function StatementHistory({ statements }: { statements: readonly ModelStatement[] }) {
  return <details className="db-static db-statement-history"><summary>문장 결과 · SQL은 실행하지 않는 예시</summary><ol>{statements.map(s => <li key={s.id}><StatementResult statement={s}/><pre className="db-tx-sql"><code>{s.sql}</code></pre>{s.targetAtStartVersionId && <p>시작 대상: {s.targetAtStartVersionId}{s.recheckedVersionId ? ` → 같은 문장의 재확인: ${s.recheckedVersionId}` : ''}</p>}</li>)}</ol></details>;
}
export function ObservationHistory({ observations, versions }: { observations: readonly ReadObservation[]; versions: readonly RowVersion[] }) {
  return <details className="db-static db-observation-history"><summary>조회 이력 · 현재 저장 상태와 구별</summary>{!observations.length ? <p>아직 완료된 조회가 없습니다.</p> : observations.map(o => <div className="db-read-history" key={o.id} data-observation={o.id} data-read-status={o.status}><strong>{o.sessionId} · 관찰 {o.atStep + 1}단계</strong>{o.status === 'error' ? <p>오류 {o.errorCode} · 성공한 행 결과 없음</p> : <><p>당시 읽은 버전. 뒤의 COMMIT이 이 과거 결과를 자동으로 바꾸지 않습니다.</p><div className="db-read-history-edges">{o.versionIds.map(id => {const v = versions.find(v => v.id === id);return <div className="db-read-history-edge" key={id} data-read-from={o.id} data-read-to={id}><span>조회 토큰</span><span aria-hidden="true">→</span><span>{v ? `${rowShort(v.row)} · ${rowValue(v.row)}` : id}<small>{id}</small></span></div>;})}</div></>}</div>)}</details>;
}
export function SvgVersion({ version, x, y, width = 78, height = 65, current = true, head = false }: { version: RowVersion; x: number; y: number; width?: number; height?: number; current?: boolean; head?: boolean }) {
  return <g data-version-id={version.id} data-row-key={version.rowKey} data-version-state={version.state} data-current={String(current)} data-latest-head={head ? version.id : undefined}><rect x={x} y={y} width={width} height={height} rx="6" className={`db-version-box db-version-box--${version.state}`}/><text x={x + 5} y={y + 18} className="db-svg-small">{rowShort(version.row)}</text><text x={x + 5} y={y + 39} className="db-svg-title">{rowValue(version.row)}</text><text x={x + 5} y={y + 55} className="db-svg-tiny">{head ? '확정·최신' : versionStatus[version.state]}</text></g>;
}

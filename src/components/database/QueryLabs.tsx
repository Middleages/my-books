import { useId, useState } from "react";
import { queryFrames, joinFilterFrames, type QueryFrame, type QueryJoin, type QueryStatus, type QueryMetric, type JoinFilterFrame } from "../../simulations/database/queries.mjs";
import { DbPlayback, DbCurrent, DbSteps, DbPrediction, useDbPlayback } from "./LabShared";
import "./queries.css";

const number = (value: number | null) => value === null ? "NULL" : value.toLocaleString("ko-KR");
const metricLabels = { "count-star": "COUNT(*) · 결과행", "count-order": "COUNT(o.id) · 값 있는 행", "count-distinct-order": "COUNT(DISTINCT o.id) · 중복 없는 주문" } as const;

function QueryScene({ frame: f, mobile }: { frame: QueryFrame; mobile: boolean }) {
  const marker = `query-arrow-${useId().replace(/:/g, "")}`;
  const width = mobile ? 280 : 720, left = mobile ? 8 : 20, sourceWidth = mobile ? 88 : 180;
  const right = mobile ? 140 : 366, resultWidth = mobile ? 132 : 330;
  const rowHeight = mobile ? 89 : 86, rowTop = (i: number) => 124 + i * 103;
  const orderY = (id: number, i: number) => {
    const targets = f.resultRows.map((row, n) => ({ row, n })).filter(({ row }) => row.orderId === id);
    return targets.length ? targets.reduce((sum, { n }) => sum + rowTop(n) + rowHeight / 2, 0) / targets.length : 165 + i * 103;
  };
  const height = Math.max(260, 142 + Math.max(f.resultRows.length, f.sourceRows.orders.length) * 103);
  const customer = f.sourceRows.customers[0];
  const curve = (x1: number, y1: number, x2: number, y2: number) => `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`;
  return <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="하나의 원본 주문에서 여러 항목 결과행으로 갈라지는 연결" data-query-phase={f.phase}>
    <defs><marker id={marker} markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto"><path d="M0,0L6,3L0,6Z" fill="#286f86" /></marker></defs>
    {customer && <g data-query-source={`customers:${customer.id}`}>
      <rect x={left} y="14" width={width - left * 2} height="44" rx="7" fill="#e3f0eb" stroke="#3c806b" />
      <text x={width / 2} y="42" textAnchor="middle" className="db-svg-title">고객 {customer.id} · {customer.display_name}</text>
    </g>}
    <text x={left} y="101" className="db-svg-title">원본 주문</text>
    <text x={right} y="101" className="db-svg-title">짝으로 만든 결과행</text>
    {f.sourceRows.orders.map((order, i) => {
      const y = orderY(order.id, i);
      const matched = f.matchedPairs.some(pair => pair.kind === "customer-order" && pair.orderId === order.id && pair.matched);
      return <g key={order.id} data-query-source={`orders:${order.id}`} data-matched={matched}>
        {matched && <path d={`M${left},36 H${mobile ? 2 : 8} V${y} H${left}`} stroke="#6b9a87" strokeWidth="2" fill="none" markerEnd={`url(#${marker})`} data-order-pair={order.id} />}
        <rect x={left} y={y - 25} width={sourceWidth} height="50" rx="5" fill={matched ? "#dfedf4" : "#fff"} stroke="#587d8d" />
        <text x={left + sourceWidth / 2} y={y - 3} textAnchor="middle" className="db-svg-title">{order.id}</text>
        <text x={left + sourceWidth / 2} y={y + 17} textAnchor="middle" className="db-svg-small">{order.status === "confirmed" ? "확정" : "취소"}</text>
      </g>;
    })}
    {f.sourceRows.orders.length === 0 && <text x={left} y="156">주문 없음</text>}
    {f.resultRows.map((row, i) => {
      const y = rowTop(i), index = f.sourceRows.orders.findIndex(order => order.id === row.orderId);
      const fromX = row.orderId === null ? left + sourceWidth / 2 : left + sourceWidth;
      const fromY = row.orderId === null ? 58 : orderY(row.orderId, index);
      const counted = f.selectedCountedIds.includes(row.id);
      return <g key={row.id} data-query-result={row.id} data-order-id={row.orderId ?? "NULL"} data-item-key={row.itemKey ?? "NULL"} data-counted={counted}>
        <path d={curve(fromX, fromY, right, y + rowHeight / 2)} fill="none" stroke={row.orderId === null ? "#886b3c" : "#286f86"} strokeWidth="2.5" strokeDasharray={row.orderId === null ? "5 3" : undefined} markerEnd={`url(#${marker})`} data-query-edge={row.id} data-from={row.orderKey ?? row.customerKey} data-to={row.id} />
        <rect x={right} y={y} width={resultWidth} height={rowHeight} rx="5" fill={row.nullExtended ? "#fff7e5" : "#fff"} stroke={counted ? "#ac551f" : "#7192a0"} strokeWidth={counted ? "3" : "1.5"} strokeDasharray={row.nullExtended ? "5 3" : undefined} />
        <rect x={right + 2} y={y + 2} width={resultWidth - 4} height="28" rx="3" fill={row.orderId === null ? "#f8edcf" : "#e1edf4"} />
        <line x1={right + 6} x2={right + resultWidth - 1} y1={y + 30} y2={y + 30} stroke="#a4bcc7" />
        <rect x={right + 1} y={y + 1} width="5" height={rowHeight - 2} fill={row.orderId === 1001 ? "#30758d" : row.orderId === 1002 ? "#826095" : "#a37b37"} />
        <text x={right + 12} y={y + 22} className="db-svg-title">주문 {number(row.orderId)}</text>
        <text x={right + 12} y={y + 43}>{row.itemKey ? `항목 (${row.orderId},${row.lineNo})` : "항목 NULL"}</text>
        <text x={right + 12} y={y + 64}>{row.qty === null ? "수량 NULL" : `수량 ${row.qty}개`}</text>
        <text x={right + 12} y={y + 82} className="db-svg-small">{row.amountWon === null ? "금액 NULL" : `${number(row.amountWon)}원`}</text>
      </g>;
    })}
    {f.resultRows.length === 0 && <g data-query-empty="true">
      <text x={right} y="149">{f.step < 2 ? "아직 결과를" : "남은 결과행이"}</text>
      <text x={right} y="174">{f.step < 2 ? "만들기 전" : "없습니다"}</text>
    </g>}
  </svg>;
}

function Aggregates({ frame: f }: { frame: QueryFrame }) {
  if (f.phase !== "aggregate") return <p className="db-query-pending">집계 단계에서 같은 결과행을 묶고 세 가지 COUNT를 비교합니다.</p>;
  if (f.groups.length === 0) return <p className="db-query-no-group" data-query-no-group="true">GROUP BY에 들어온 행이 없어 고객 집계행도 없습니다. 합계 0인 그룹을 새로 만들지 않습니다.</p>;
  return <div className="db-query-groups">{f.groups.map(group => {
    const rows = f.resultRows.filter(row => group.resultRowIds.includes(row.id));
    const maximum = Math.max(36000, group.metrics.sumWon ?? 0);
    return <section key={group.id} className="db-query-group" data-query-group={group.id}>
      <h3>고객 {group.customerId} · 같은 결과행의 집계</h3>
      <div className="db-counted-orders" aria-label="중복을 제외한 주문 묶음">
        {group.orderIds.map(id => <div key={id} data-distinct-order={`orders:${id}`} data-counted={f.selectedCountedIds.includes(`orders:${id}`)}><strong>주문 {id} 하나</strong>{rows.filter(row => row.orderId === id).map(row => <span key={row.id}>항목 {row.lineNo}</span>)}</div>)}
        {!group.orderIds.length && <p>주문 id가 없으므로 셀 주문 묶음도 없습니다.</p>}
      </div>
      <dl className="db-query-metrics">
        <div><dt>COUNT(*)</dt><dd data-query-metric="countStar">{group.metrics.countStar}</dd></div>
        <div><dt>COUNT(o.id)</dt><dd data-query-metric="countOrder">{group.metrics.countOrder}</dd></div>
        <div><dt>COUNT(DISTINCT o.id)</dt><dd data-query-metric="countDistinctOrder">{group.metrics.countDistinctOrder}</dd></div>
        <div><dt>SUM(수량)</dt><dd data-query-metric="sumQty">{number(group.metrics.sumQty)}{group.metrics.sumQty === null ? "" : "개"}</dd></div>
        <div><dt>SUM(당시 금액)</dt><dd data-query-metric="sumWon">{number(group.metrics.sumWon)}{group.metrics.sumWon === null ? "" : "원"}</dd></div>
      </dl>
      {group.metrics.sumWon === null ? <p className="db-null-amount">금액을 더할 값이 없습니다. NULL을 숫자 0의 막대로 그리지 않습니다.</p> : <>
        <p className="db-amount-scale">항목별 금액 누적 · 같은 눈금 0–{number(maximum)}원</p>
        <div className="db-amount-track" aria-label={`당시 주문 금액 합계 ${group.metrics.sumWon}원`}>{rows.filter(row => row.amountWon !== null).map((row, i) => <span key={row.id} className={`db-amount-segment db-amount-segment-${i % 3}`} style={{ width: `${row.amountWon! / maximum * 100}%` }} data-amount-row={row.id} data-amount={row.amountWon} />)}</div>
        <ul className="db-amount-legend">{rows.filter(row => row.amountWon !== null).map((row, i) => <li key={row.id}><i className={`db-amount-segment-${i % 3}`} />({row.orderId},{row.lineNo}) · {number(row.amountWon)}원</li>)}</ul>
      </>}
    </section>;
  })}</div>;
}

export function QueryFlowLab() {
  const [customerId, setCustomerId] = useState(1), [join, setJoin] = useState<QueryJoin>("inner"), [status, setStatus] = useState<QueryStatus>("confirmed"), [metric, setMetric] = useState<QueryMetric>("count-star"), [prediction, setPrediction] = useState("");
  const frames = queryFrames({ customerId, join, status, metric }), player = useDbPlayback(frames.length), f = frames[player.index];
  const changed = () => { player.reset(); setPrediction(""); };
  const reset = () => { changed(); setCustomerId(1); setJoin("inner"); setStatus("confirmed"); setMetric("count-star"); };
  return <section className="db-lab" data-db-lab="queries" aria-label="JOIN과 집계의 행 단위 실험">
    <p className="db-eyebrow">03 · 같은 원본, 다른 결과행의 단위</p><h2>주문 하나에서 두 항목 행으로 갈라집니다</h2>
    <p>고객 1의 주문 1001에서 나가는 선을 따라가세요. 원본 주문을 두 개 저장한 것이 아니라 항목마다 다른 짝을 읽습니다.</p>
    <div className="db-controls">
      <label>조회할 고객<select value={customerId} onChange={e => { changed(); setCustomerId(Number(e.target.value)); }}><option value="1">1 가람 · 확정 주문 둘</option><option value="2">2 누리 · 취소 주문만</option><option value="3">3 다온 · 주문 없음</option></select></label>
      <label>짝이 없는 행<select value={join} onChange={e => { changed(); setJoin(e.target.value as QueryJoin); }}><option value="inner">INNER · 짝이 있어야 남김</option><option value="left">LEFT · 고객을 남김</option></select></label>
      <label>주문을 연결할 조건<select value={status} onChange={e => { changed(); setStatus(e.target.value as QueryStatus); }}><option value="confirmed">ON에서 확정 주문만</option><option value="all">상태와 무관하게 모두</option></select></label>
      <label>강조할 세기 기준<select value={metric} onChange={e => { changed(); setMetric(e.target.value as QueryMetric); }}>{Object.entries(metricLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    <DbPrediction value={prediction} setValue={setPrediction}><option value="same">결과행 수와 주문 수가 같다</option><option value="different">결과행 수와 주문 수가 다를 수 있다</option></DbPrediction>
    <DbPlayback player={player} count={frames.length} reset={reset} /><DbCurrent frame={f} />
    <figure className="db-figure db-query-figure"><div className="db-desktop"><QueryScene frame={f} mobile={false} /></div><div className="db-mobile"><QueryScene frame={f} mobile /></div><figcaption>윗칸은 주문 id, 아랫칸은 기존 항목의 키·수량과 당시 단가로 계산한 금액입니다. 항목 원본 표는 생략했으며 새 항목을 저장한 것이 아닙니다. 점선 NULL 행은 LEFT JOIN이 남긴 빈 자리입니다. 주황 테두리는 COUNT가 세는 결과행, DISTINCT는 아래 주문 묶음을 강조합니다.</figcaption></figure>
    <Aggregates frame={f} />
    <details className="db-query-sql"><summary>이 선택의 SQL · 실행하지 않는 예시</summary><pre><code>{f.sql}</code></pre><pre><code>{f.aggregateSql}</code></pre></details>
    <p className="db-model-note">{f.ordering} 이 단계는 논리적 관계 설명이며 실제 PostgreSQL의 실행 순서·속도가 아닙니다. 고객 1 기본값은 주문 2건·항목 3행·수량 7개·36,000원입니다.</p>
    <DbSteps frames={frames} />
  </section>;
}

function FilterScene({ frame: f, mobile }: { frame: JoinFilterFrame; mobile: boolean }) {
  const marker = `filter-arrow-${useId().replace(/:/g, "")}`, width = mobile ? 280 : 720;
  const left = 8, leftWidth = mobile ? 88 : 190, right = mobile ? 138 : 360, rightWidth = width - right - 8;
  const rows = f.finished ? f.resultRows : f.candidateRows, top = 54, rowHeight = 73;
  const height = Math.max(330, top + rows.length * rowHeight + 18);
  const customerY = (id: number, i: number) => {
    const indices = rows.map((r, n) => ({ r, n })).filter(({ r }) => r.customerId === id);
    return indices.length ? top + indices.reduce((s, { n }) => s + n, 0) / indices.length * rowHeight + 30 : 97 + i * 92;
  };
  return <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${f.placement.toUpperCase()} 조건과 고객별 결과행`} data-filter-phase={f.phase}>
    <defs><marker id={marker} markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto"><path d="M0,0L6,3L0,6Z" fill="#397d70" /></marker></defs>
    <text x={left} y="23" className="db-svg-title">같은 고객</text><text x={right} y="23" className="db-svg-title">{f.finished ? "최종 결과" : "JOIN 후보"}</text>
    {rows.length > 0 && <rect x={right - 5} y={top - 7} width={rightWidth + 10} height={rows.length * rowHeight + 2} rx="8" stroke="#438572" fill="#edf7f0" strokeDasharray={f.finished ? undefined : "5 4"} data-filter-boundary={f.finished ? "result" : "candidate"} />}
    {f.sourceRows.customers.map((c, i) => {
      const y = customerY(c.id, i), orders = f.sourceRows.orders.filter(o => o.customer_id === c.id);
      return <g key={c.id} data-filter-customer={c.id}><rect x={left} y={y - 27} width={leftWidth} height="59" rx="5" stroke="#7c99a5" fill="#fff" /><text x={left + 7} y={y - 5} className="db-svg-title">{c.id} {c.display_name}</text><text x={left + 7} y={y + 17} className="db-svg-small">{orders.length === 0 ? "주문 없음" : orders.some(o => o.status === "confirmed") ? "확정 주문" : "취소만 있음"}</text></g>;
    })}
    {rows.map((row, i) => {
      const y = top + i * rowHeight, ci = f.sourceRows.customers.findIndex(c => c.id === row.customerId), sy = customerY(row.customerId, ci);
      return <g key={row.id} data-filter-row={row.id} data-filter-order={row.orderId ?? "NULL"}>
        <path d={`M${left + leftWidth},${sy}C${(left + leftWidth + right) / 2},${sy} ${(left + leftWidth + right) / 2},${y + 30} ${right},${y + 30}`} stroke="#397d70" strokeWidth="2" strokeDasharray={row.nullExtended ? "4 3" : undefined} fill="none" markerEnd={`url(#${marker})`} data-filter-edge={row.id} />
        <rect x={right} y={y} width={rightWidth} height="61" rx="4" fill={row.nullExtended ? "#fff5df" : "#fff"} stroke="#7c99a5" />
        <text x={right + 9} y={y + 21}>고객 {row.customerId}</text><text x={right + 9} y={y + 41}>주문 {number(row.orderId)}</text><text x={right + 9} y={y + 56} className="db-svg-small">{row.status ?? "status NULL"}</text>
      </g>;
    })}
    {!rows.length && <text x={right} y="83">다음 단계에서 연결</text>}
  </svg>;
}

export function JoinFilterLab() {
  const [placement, setPlacement] = useState<"on" | "where">("on"), [prediction, setPrediction] = useState("");
  const frames = joinFilterFrames({ placement }), player = useDbPlayback(frames.length), f = frames[player.index];
  const reset = () => { player.reset(); setPlacement("on"); setPrediction(""); };
  return <section className="db-lab" data-db-lab="join-filter" aria-label="LEFT JOIN ON과 WHERE 비교">
    <p className="db-eyebrow">03 · 고객과 주문 두 표만 비교</p><h2>확정 조건을 옮기면 누가 사라질까요?</h2>
    <div className="db-controls"><label>확정 조건의 위치<select value={placement} onChange={e => { player.reset(); setPrediction(""); setPlacement(e.target.value as typeof placement); }}><option value="on">ON · 확정 주문과 짝 찾기</option><option value="where">WHERE · 결과에서 확정만 남기기</option></select></label></div>
    <DbPrediction value={prediction} setValue={setPrediction}><option value="all">항상 모든 고객이 남는다</option><option value="position">조건 위치에 따라 고객이 사라진다</option></DbPrediction>
    <DbPlayback player={player} count={frames.length} reset={reset} /><DbCurrent frame={f} />
    <figure className="db-figure"><div className="db-desktop"><FilterScene frame={f} mobile={false} /></div><div className="db-mobile"><FilterScene frame={f} mobile /></div><figcaption>같은 고객에서 나온 결과행으로 선을 잇습니다. 점선은 실제 주문을 찾은 것이 아닌 NULL 확장 자리입니다. 최종 결과 경계 안에는 남은 행만 있습니다.</figcaption></figure>
    {f.finished && <p className="db-filter-survivors" data-preserved-customers={f.preservedCustomerIds.join(",")}>남은 고객 id: {f.preservedCustomerIds.join(", ")} · 최종 결과 {f.resultRows.length}행</p>}
    {f.discardedRows.length > 0 && <aside className="db-filter-discarded" aria-label="결과 밖으로 제외된 행"><strong>WHERE에서 제외 · 현재 결과에 없음</strong>{f.discardedRows.map(row => <p key={row.id} data-discarded-row={row.id}>고객 {row.customerId} / 주문 {number(row.orderId)} / {row.status ?? "NULL"}</p>)}</aside>}
    <details className="db-query-sql"><summary>이 선택의 SQL · 실행하지 않는 예시</summary><pre><code>{f.sql}</code></pre></details>
    <p className="db-model-note">ON의 조건은 연결할 짝을, WHERE의 조건은 연결 뒤 남길 행을 정합니다. NULL과 confirmed의 비교는 TRUE가 아니므로 이 WHERE에 남지 않습니다.</p><DbSteps frames={frames} />
  </section>;
}

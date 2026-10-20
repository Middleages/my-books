import { useId, useState } from "react";
import { indexFrames, indexWriteFrames, compositeIndexSpans, type IndexFrame, type IndexEntry, type IndexLayout, type IndexQuery, type IndexPath, type IndexWriteFrame, type IndexWriteOperation, type CompositeIndexEntry } from "../../simulations/database/indexes.mjs";
import { DbPlayback, DbCurrent, DbSteps, DbPrediction, useDbPlayback } from "./LabShared";
import "./indexes.css";

const queryLabels = { narrow: "좁게 · 처음 4일", wide: "넓게 · 처음 32일", all: "모두 · 64일", empty: "없는 범위 · 65–68일" } as const;
const shortPage = (id: string) => id.startsWith("heap:") ? `P${id.split(":").at(-1)}` : id === "index:root" ? "뿌리" : `L${id.split(":").at(-1)}`;
const date = (iso: string) => iso.slice(0, 10);

function ReadScene({ frame: f, mobile, focus }: { frame: IndexFrame; mobile: boolean; focus: IndexEntry | null }) {
  const marker = `index-arrow-${useId().replace(/:/g, "")}`, width = mobile ? 280 : 760;
  const indexed = f.path === "index", heapTop = indexed ? (mobile ? 294 : 220) : 48;
  const columns = mobile ? 2 : 4, pageWidth = mobile ? 124 : 172, pageGap = mobile ? 15 : 16, pageHeight = 106;
  const pagePosition = (n: number) => ({ x: 8 + n % columns * (pageWidth + pageGap), y: heapTop + Math.floor(n / columns) * (pageHeight + 13) });
  const leafPosition = (n: number) => ({ x: mobile ? 8 + n % 2 * 139 : 8 + n * 188, y: mobile ? 78 + Math.floor(n / 2) * 49 : 81 });
  const slotPosition = (pageId: string, slot: number) => {
    const page = pagePosition(f.fixture.heapPages.findIndex(p => p.id === pageId));
    return { x: page.x + 6 + slot % 2 * ((pageWidth - 12) / 2), y: page.y + 27 + Math.floor(slot / 2) * 18, w: (pageWidth - 16) / 2, h: 16, page };
  };
  const height = heapTop + Math.ceil(f.fixture.heapPages.length / columns) * (pageHeight + 13) + 8;
  const entryY = mobile ? 187 : 139, entryX = mobile ? 15 : 193, entryW = mobile ? 250 : 370;
  const reached = !!focus && f.returnedRowIds.includes(focus.rowId) && f.heapPageIds.includes(focus.heapPageId);
  return <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`교육용 페이지의 ${indexed ? "인덱스" : "전체 읽기"} 경로`} data-index-path={f.path}>
    <defs><marker id={marker} markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto"><path d="M0,0L6,3L0,6Z" fill="#9b4f1d" /></marker></defs>
    {indexed ? <>
      {f.fixture.leafPageIds.map((id, i) => {
        const p = leafPosition(i);
        const route = mobile && i >= 2
          ? `M${width / 2},51V64H${i % 2 === 0 ? 3 : 277}V${p.y + 18}H${i % 2 === 0 ? p.x : p.x + pageWidth}`
          : `M${width / 2},51V64H${p.x + pageWidth / 2}V${p.y}`;
        return <path key={id} d={route} stroke={f.indexPageIds.includes(id) ? "#86629e" : "#c0c8cd"} strokeWidth={f.indexPageIds.includes(id) ? 3 : 1.4} fill="none" data-index-tree-edge={id} />;
      })}
      <g data-index-page={f.fixture.rootPageId} data-visited={f.indexPageIds.includes(f.fixture.rootPageId)}><rect x={width / 2 - 54} y="14" width="108" height="37" rx="5" fill={f.indexPageIds.includes(f.fixture.rootPageId) ? "#ddcce8" : "#fff"} stroke="#826295" /><text x={width / 2} y="39" textAnchor="middle" className="db-svg-title">뿌리 R</text></g>
      {f.fixture.leafPageIds.map((id, i) => { const p = leafPosition(i); const leaf = f.fixture.indexPages.find(page => page.id === id); if (leaf?.kind !== "leaf") return null; return <g key={id} data-index-page={id} data-visited={f.indexPageIds.includes(id)}><rect x={p.x} y={p.y} width={pageWidth} height="36" rx="4" fill={f.indexPageIds.includes(id) ? "#ddcce8" : "#fff"} stroke="#826295" /><text x={p.x + pageWidth / 2} y={p.y + 22} textAnchor="middle">{shortPage(id)} · {leaf.entries[0].day}–{leaf.entries.at(-1)!.day}일째</text></g>; })}
      {focus && (() => {
        const n = f.fixture.leafPageIds.indexOf(focus.leafPageId), p = leafPosition(n);
        const route = mobile && n < 2
          ? `M${p.x + pageWidth / 2},${p.y + 36}V120H${width / 2}V${entryY}`
          : `M${p.x + pageWidth / 2},${p.y + 36}V${entryY - 7}H${width / 2}V${entryY}`;
        return <path d={route} stroke="#86629e" strokeWidth="2" fill="none" data-entry-leaf={focus.leafPageId} />;
      })()}
      <g data-focused-entry={focus?.id ?? ""}><rect x={entryX} y={entryY} width={entryW} height={mobile ? 71 : 57} rx="6" fill="#fff8e9" stroke="#ba8548" strokeDasharray={focus ? undefined : "4 3"} />
        <text x={entryX + 10} y={entryY + 21}>{focus ? `${date(focus.key)} → 주문 ${focus.rowId}` : "현재 관찰할 인덱스 항목 없음"}</text>
        <text x={entryX + 10} y={entryY + 43}>{focus ? `${shortPage(focus.heapPageId)} · 슬롯 ${focus.slot}에 있는 행` : "다음 단계에서 키와 위치 확인"}</text>
        {mobile && <text x={entryX + 10} y={entryY + 62} className="db-svg-small">{focus ? reached ? "주황선: 실제 반환 행의 위치" : "아직 이 행을 반환하지 않음" : "페이지 칠하기: 실제 들른 곳"}</text>}
      </g>
    </> : <text x="8" y="25" className="db-svg-title">인덱스 없이 데이터 페이지를 읽습니다</text>}
    {f.fixture.heapPages.map((page, n) => { const p = pagePosition(n), touched = f.heapPageIds.includes(page.id); return <g key={page.id} data-heap-page={page.id} data-visited={touched}>
      <rect x={p.x} y={p.y} width={pageWidth} height={pageHeight} rx="5" fill={touched ? "#dceef3" : "#f8fafb"} stroke={touched ? "#397b91" : "#aabcc5"} strokeWidth={touched ? 2 : 1} />
      <text x={p.x + 7} y={p.y + 19} className="db-svg-title">{shortPage(page.id)} · 데이터</text>
      {page.slots.map(slot => { const c = slotPosition(page.id, slot.slot), returned = f.returnedRowIds.includes(slot.rowId); return <g key={slot.slot} data-heap-row={slot.rowId} data-slot={slot.slot} data-returned={returned}>
        <rect x={c.x} y={c.y} width={c.w} height={c.h} rx="2" fill={returned ? "#447f6c" : "#fff"} stroke={focus?.rowId === slot.rowId && reached ? "#af581f" : "#b9cbd1"} strokeWidth={focus?.rowId === slot.rowId && reached ? 2.5 : 1} />
        <text x={c.x + c.w / 2} y={c.y + 12} textAnchor="middle" className={returned ? "db-index-row-returned" : "db-index-row"}>{slot.rowId}</text>
      </g>; })}
    </g>; })}
    {indexed && focus && reached && (() => {
      const target = slotPosition(focus.heapPageId, focus.slot), leftSide = focus.slot % 2 === 0;
      const rail = leftSide ? target.page.x - 4 : target.page.x + pageWidth + 4, endX = leftSide ? target.x : target.x + target.w, endY = target.y + target.h / 2;
      return <path d={`M${width / 2},${entryY + (mobile ? 71 : 57)}V${heapTop - 12}H${rail}V${endY}H${endX}`} stroke="#ac551f" strokeWidth="2.5" fill="none" markerEnd={`url(#${marker})`} data-index-pointer={focus.id} data-target-page={focus.heapPageId} data-target-slot={focus.slot} data-target-row={focus.rowId} />;
    })()}
  </svg>;
}

function PageComparison({ scan, indexed }: { scan: IndexFrame; indexed: IndexFrame }) {
  const maximum = Math.max(13, scan.measurements.totalPages.value, indexed.measurements.totalPages.value);
  return <section className="db-page-comparison" aria-label="같은 조건의 완료된 접근 페이지 비교">
    <h3>끝까지 읽은 두 경로 · 같은 결과행</h3><p>한 칸 = 서로 다른 페이지 1개 · 공통 눈금 0–{maximum}</p>
    {[scan, indexed].map(f => <div key={f.path} className="db-page-comparison-row" data-path-summary={f.path}>
      <strong>{f.path === "scan" ? "전체 읽기" : "인덱스"}: {f.measurements.totalPages.value}개</strong>
      <div className="db-page-units" style={{ gridTemplateColumns: `repeat(${maximum},1fr)` }} data-cost-value={f.measurements.totalPages.value}>{Array.from({ length: maximum }, (_, i) => <span key={i} data-unit-kind={i < f.indexPageIds.length ? "index" : i < f.indexPageIds.length + f.heapPageIds.length ? "heap" : "empty"} />)}</div>
      <small>인덱스 {f.measurements.indexPages.value} + 데이터 {f.measurements.heapPages.value} · 반환 {f.measurements.returnedRows.value}행</small>
    </div>)}
    <p className="db-model-note">같은 id 집합을 반환합니다. 페이지 수가 작다는 관찰은 실제 시간·물리 디스크 I/O가 더 작다는 측정이 아닙니다.</p>
  </section>;
}

export function IndexReadLab() {
  const [layout, setLayout] = useState<IndexLayout>("ordered"), [query, setQuery] = useState<IndexQuery>("narrow"), [path, setPath] = useState<IndexPath>("index"), [prediction, setPrediction] = useState(""), [focusId, setFocusId] = useState("");
  const frames = indexFrames({ layout, query, path }), player = useDbPlayback(frames.length), f = frames[player.index];
  const finishedFocusId = focusId ? Number(focusId) : f.selectedEntry && f.returnedRowIds.includes(f.selectedEntry.rowId) ? f.selectedEntry.rowId : f.returnedRowIds[0];
  const focus = f.finished && f.returnedRowIds.length ? f.fixture.entries.find(e => e.rowId === finishedFocusId) ?? null : f.selectedEntry;
  const changed = () => { player.reset(); setPrediction(""); setFocusId(""); };
  const reset = () => { changed(); setLayout("ordered"); setQuery("narrow"); setPath("index"); };
  return <section className="db-lab" data-db-lab="index-read" aria-label="인덱스와 데이터 페이지 접근 비교">
    <p className="db-eyebrow">04 · 같은 64행, 다른 찾는 길</p><h2>반환 행까지 실제 위치를 따라갑니다</h2>
    <div className="db-controls">
      <label>찾을 날짜 범위<select value={query} onChange={e => { changed(); setQuery(e.target.value as IndexQuery); }}>{Object.entries(queryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>같은 행의 배치<select value={layout} onChange={e => { changed(); setLayout(e.target.value as IndexLayout); }}><option value="ordered">날짜순으로 모인 배치</option><option value="scattered">페이지 사이에 흩어진 배치</option></select></label>
      <label>조회 경로<select value={path} onChange={e => { changed(); setPath(e.target.value as IndexPath); }}><option value="index">인덱스로 찾아가기</option><option value="scan">인덱스 없이 전체 읽기</option></select></label>
    </div>
    <DbPrediction value={prediction} setValue={setPrediction}><option value="always">인덱스가 항상 적은 페이지에 접근</option><option value="depends">조건과 배치에 따라 달라짐</option></DbPrediction>
    <DbPlayback player={player} count={frames.length} reset={reset} /><DbCurrent frame={f} />
    <div className="db-index-current" aria-label="현재 단계까지의 고유 접근 개수"><span>인덱스 <b data-read-count="indexPages">{f.measurements.indexPages.value}</b>개</span><span>데이터 <b data-read-count="heapPages">{f.measurements.heapPages.value}</b>개</span><span>반환 <b data-read-count="returnedRows">{f.measurements.returnedRows.value}</b>행</span></div>
    {f.finished && f.path === "index" && f.returnedRowIds.length > 0 && <label className="db-index-focus">완료 후 포인터만 따라갈 주문<select value={String(finishedFocusId)} onChange={e => setFocusId(e.target.value)}>{f.returnedRowIds.map(id => <option key={id} value={id}>주문 {id}</option>)}</select><small>위치는 선택한 반환 행을 따릅니다. 경계 키를 검사한 근거와 구별하며 조회 조건·접근 개수는 바꾸지 않습니다.</small></label>}
    <figure className="db-figure db-index-figure"><div className="db-desktop"><ReadScene frame={f} mobile={false} focus={focus} /></div><div className="db-mobile"><ReadScene frame={f} mobile focus={focus} /></div><figcaption>보라: 들른 인덱스 페이지. 파랑: 들른 데이터 페이지. 진한 초록 행: 현재까지 반환한 주문 id. 주황선: 관찰하는 한 항목의 정확한 행 위치. 옅은 페이지는 아직 들르지 않은 곳입니다.</figcaption></figure>
    {f.stopProof && <p className="db-index-stop" data-stop-kind={f.stopProof.kind}>멈춘 근거: {f.stopProof.detail}</p>}
    {f.finished && <PageComparison scan={indexFrames({ layout, query, path: "scan" }).at(-1)!} indexed={indexFrames({ layout, query, path: "index" }).at(-1)!} />}
    <details className="db-query-sql"><summary>SQL과 실제 반환 id · 실행하지 않는 예시</summary><pre><code>{f.sql}</code></pre><p data-returned-ids={f.returnedRowIds.join(",")}>{f.returnedRowIds.length ? f.returnedRowIds.join(", ") : "현재까지 반환한 행 없음"}</p></details>
    <p className="db-model-note">합성 주문 2001–2064, 2026-01-01부터 64일입니다. 각 데이터 페이지 8슬롯·뿌리 1개와 마지막 페이지 4개는 교육용 가정입니다. 한 단계는 페이지 사건 묶음이지 같은 시간 간격이 아닙니다. 경계의 다음 키 또는 끝 표시를 확인한 페이지도 셉니다.</p><DbSteps frames={frames} />
  </section>;
}

function WriteScene({ frame: f, mobile }: { frame: IndexWriteFrame; mobile: boolean }) {
  const marker = `write-arrow-${useId().replace(/:/g, "")}`, width = mobile ? 280 : 720, right = mobile ? 162 : 400, boxW = mobile ? 110 : 280;
  const recordTouched = f.affectedStructureIds.includes("logical-records"), indexTouched = f.affectedStructureIds.includes("created-at-index");
  const entry = indexTouched ? f.indexChange.after : f.indexChange.before;
  const removesOldKey = f.indexChange.before !== null;
  const indexCaption = !indexTouched
    ? ["변경 전 위치", "다음 단계에서 영향 관찰"]
    : removesOldKey
      ? ["변경 후 · 이전 키는", "현재 인덱스에서 빠짐"]
      : ["추가 후 · 새 키가", "현재 인덱스에 들어옴"];
  const leafPosition = (n: number) => ({ x: mobile ? 8 + n % 2 * 138 : 8 + n * 178, y: mobile ? 212 + Math.floor(n / 2) * 90 : 212, w: mobile ? 126 : 170 });
  return <svg viewBox={`0 0 ${width} ${f.indexed ? mobile ? 405 : 322 : 158}`} role="img" aria-label="논리 레코드 변경과 인덱스 정렬 위치의 전후 영향">
    <defs><marker id={marker} markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto"><path d="M0,0L6,3L0,6Z" fill="#9d5629" /></marker></defs>
    <text x="8" y="24" className="db-svg-title">변경 전</text><text x={right} y="24" className="db-svg-title">변경 후의 값</text>
    <rect x="8" y="39" width={boxW} height="78" rx="5" stroke="#7d95a1" strokeDasharray={f.record.before ? undefined : "5 3"} fill="#fff" />
    <text x="17" y="62">{f.record.before ? `주문 ${f.record.before.id}` : "기록 없음"}</text><text x="17" y="84" className="db-svg-small">{f.record.before ? date(f.record.before.created_at) : "새로 넣을 주문"}</text><text x="17" y="105" className="db-svg-small">이전 상태 · 비교용</text>
    <rect x={right} y="39" width={boxW} height="78" rx="5" stroke={recordTouched ? "#39795d" : "#9fb2bb"} fill={recordTouched ? "#e3f2e8" : "#f8fafb"} strokeWidth={recordTouched ? 2.5 : 1} />
    <text x={right + 9} y="62">주문 {f.record.after.id}</text><text x={right + 9} y="84" className="db-svg-small">{date(f.record.after.created_at)}</text><text x={right + 9} y="105" className="db-svg-small">{recordTouched ? "레코드 영향 확인" : "이번 변경의 목표"}</text>
    {recordTouched && <path d={`M${8 + boxW},78H${right}`} stroke="#9d5629" strokeWidth="2.5" markerEnd={`url(#${marker})`} data-write-record={f.record.after.id} />}
    {f.indexed ? <>
      <text x="8" y="163" className="db-svg-title">날짜 인덱스의 정렬 위치</text>
      <text x="8" y="185" className="db-svg-small">{mobile ? <><tspan x="8">{indexCaption[0]}</tspan><tspan x="8" dy="16">{indexCaption[1]}</tspan></> : indexCaption.join(" · ")}</text>
      {[0, 1, 2, 3].map(n => { const p = leafPosition(n), id = `index:leaf:${n}`, present = entry?.leafPageId === id; return <g key={id} data-write-leaf={id}>
        <rect x={p.x} y={p.y} width={p.w} height="78" rx="6" fill={f.affectedLeafPageIds.includes(id) ? "#e4d7ed" : "#f8fafb"} stroke="#9275a5" />
        <text x={p.x + 8} y={p.y + 19} className="db-svg-title">L{n}</text>
        {present && <g data-write-entry={entry.rowId} data-write-key={entry.key}><rect x={p.x + 5} y={p.y + 27} width={p.w - 10} height="43" rx="3" fill="#fff0d6" stroke="#a66d34" /><text x={p.x + 12} y={p.y + 45}>{entry.rowId} · {entry.key.slice(5, 10)}</text><text x={p.x + 12} y={p.y + 62} className="db-svg-small">{indexTouched ? "새 키의 위치" : "이전 키의 위치"}</text></g>}
      </g>; })}
      {indexTouched && entry && (() => {
        const n = Number(entry.leafPageId.split(":").at(-1)), p = leafPosition(n);
        const route = mobile && n >= 2
          ? `M${right + boxW / 2},117V200H278V${p.y + 48}H${p.x + p.w - 5}`
          : `M${right + boxW / 2},117V200H${p.x + p.w / 2}V${p.y + 27}`;
        return <path d={route} stroke="#9d5629" strokeWidth="2.5" fill="none" markerEnd={`url(#${marker})`} data-write-index-edge={entry.rowId} />;
      })()}
    </> : <text x="8" y="150">인덱스 없음 · 별도 키 항목도 없음</text>}
  </svg>;
}

export function IndexWriteLab() {
  const [operation, setOperation] = useState<IndexWriteOperation>("indexed-key-update"), [indexed, setIndexed] = useState(true);
  const frames = indexWriteFrames({ operation, indexed }), player = useDbPlayback(frames.length), f = frames[player.index];
  const reset = () => { player.reset(); setOperation("indexed-key-update"); setIndexed(true); };
  return <section className="db-lab" data-db-lab="index-write" aria-label="인덱스의 논리적 쓰기 부담">
    <p className="db-eyebrow">04 · 읽는 길도 함께 유지하기</p><h2>날짜가 바뀌면 키가 놓일 자리도 바뀝니다</h2>
    <div className="db-controls"><label>논리적 변경<select value={operation} onChange={e => { player.reset(); setOperation(e.target.value as IndexWriteOperation); }}><option value="indexed-key-update">주문 2001 날짜 변경</option><option value="insert">주문 2065 새로 추가</option></select></label><label>별도 날짜 인덱스<select value={String(indexed)} onChange={e => { player.reset(); setIndexed(e.target.value === "true"); }}><option value="true">있음</option><option value="false">없음</option></select></label></div>
    <DbPlayback player={player} count={frames.length} reset={reset} /><DbCurrent frame={f} />
    <figure className="db-figure"><div className="db-desktop"><WriteScene frame={f} mobile={false} /></div><div className="db-mobile"><WriteScene frame={f} mobile /></div><figcaption>바꾸는 키 항목만 표시하고 다른 항목은 생략했습니다. 논리적 변경의 전후 관계이며 실제 DB의 중간 공개 상태나 물리적 쓰기 순서가 아닙니다. 마지막 인덱스 페이지에 여유가 있다고 가정하며 읽기 실험의 64행 배치는 바꾸지 않습니다.</figcaption></figure>
    <div className="db-index-current"><span>논리 레코드 변경 <b data-write-count="logicalRecordChanges">{f.measurements.logicalRecordChanges.value}</b></span><span>키 추가 <b data-write-count="indexEntryAdditions">{f.measurements.indexEntryAdditions.value}</b></span><span>이전 키 제거 <b data-write-count="indexEntryRemovals">{f.measurements.indexEntryRemovals.value}</b></span></div>
    <p className="db-model-note">추가·제거 수는 논리적 인덱스 항목 수입니다. PostgreSQL tuple version·HOT·WAL·VACUUM·페이지 분할·실제 쓰기 I/O는 재현하지 않습니다. 같은 행 id의 날짜 변경도 heap tuple을 같은 자리에 덮어쓴다고 그린 것이 아닙니다.</p><DbSteps frames={frames} />
  </section>;
}

export function CompositeIndexStrip() {
  const [customerId, setCustomerId] = useState("all");
  const f = compositeIndexSpans(customerId === "all" ? {} : { customerId: Number(customerId) });
  const entryCell = (entry: CompositeIndexEntry) => <span key={entry.id} data-composite-entry={entry.id} data-match={entry.matches} data-position={entry.position}><b>{entry.key.slice(5, 10)}</b><small>주문 {entry.rowId}</small></span>;
  return <section className="db-lab" data-db-lab="composite-index" aria-label="고객과 날짜 복합 키의 정렬 구간">
    <p className="db-eyebrow">04 · 작은 정렬 띠</p><h2>먼저 고객끼리, 그 안에서 날짜순</h2>
    <p>64개 합성 주문 중 첫 16행(2001–2016)만 뽑았습니다. 고정 날짜 조건은 1월 9일 이상, 17일 미만입니다.</p>
    <div className="db-controls"><label>앞쪽 고객 키 조건<select value={customerId} onChange={e => setCustomerId(e.target.value)}><option value="all">없음 · 날짜만</option><option value="1">고객 1 + 날짜</option><option value="2">고객 2 + 날짜</option><option value="3">고객 3 + 날짜</option></select></label></div>
    <figure className="db-composite-strip"><div className="db-composite-groups">{f.customerGroups.map(group => {
      const span = f.spans.find(part => part.customerId === group.customerId);
      return <section key={group.customerId} data-composite-customer={group.customerId}><h3>고객 {group.customerId}</h3><div>
        {span ? <>
          {f.entries.slice(group.start, span.start).map(entryCell)}
          <div className="db-composite-match-run" data-composite-span={`${span.customerId}:${span.start}:${span.endExclusive}`}>
            <strong>조건에 맞는 연속 구간</strong>
            {f.entries.slice(span.start, span.endExclusive).map(entryCell)}
          </div>
          {f.entries.slice(span.endExclusive, group.endExclusive).map(entryCell)}
        </> : f.entries.slice(group.start, group.endExclusive).map(entryCell)}
      </div></section>;
    })}</div><figcaption>각 고객 안에서 왼쪽부터 날짜순으로 읽습니다. 줄이 바뀌어도 순서는 이어집니다. 초록 경계 하나가 조건에 맞는 연속 구간 하나이며, 날짜만 찾으면 서로 다른 고객 경계에 세 구간이 나뉩니다.</figcaption></figure>
    <p role="status" className="db-filter-survivors"><span data-composite-metric="spanCount">{f.measurements.spanCount.value}</span>개 연속 구간 · <span data-composite-metric="matchingRows">{f.measurements.matchingRows.value}</span>개 일치 행</p>
    <button type="button" onClick={() => setCustomerId("all")}>정렬 띠 초기화</button>
    <details className="db-query-sql"><summary>고정 조건과 반환 id</summary><pre><code>{f.sql}</code></pre><p data-composite-returned={f.returnedRowIds.join(",")}>{f.returnedRowIds.join(", ")}</p></details>
    <p className="db-model-note">정렬 구조를 설명하는 띠이며 실제 실행계획·페이지 비용이 아닙니다. PostgreSQL 18은 분포와 조건에 따라 skip scan을 선택할 수 있으므로 첫 열 조건이 없다고 사용 불가로 단정하지 않습니다.</p>
  </section>;
}

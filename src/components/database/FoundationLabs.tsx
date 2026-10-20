import { useId, useState } from "react";
import { createFixture, fixtureRelations, renameCustomer, summarizeCustomer, type ReadonlyFixture, type TableName } from "../../simulations/database/fixture.mjs";
import { fileWriteFrames, constraintFrames } from "../../simulations/database/foundation.mjs";
import { DbPlayback, DbCurrent, DbSteps, DbPrediction, useDbPlayback } from "./LabShared";
import "./database.css";

type FileFrame = ReturnType<typeof fileWriteFrames>[number];
type ConstraintFrame = ReturnType<typeof constraintFrames>[number];
const modeLabels = { race: "겹친 읽기 · 사본으로 덮어쓰기", sequential: "순차 실행 · 앞 요청 뒤에 읽기", "file-lock": "파일 잠금 · 읽기부터 확정까지", database: "DB · 조건부 감소와 주문을 묶기" } as const;
const statusLabels: Record<string, string> = { pending: "아직 읽지 않음", copy: "읽은 사본", write: "쓰기 준비", confirmed: "주문 확정", rejected: "주문 거절", waiting: "잠금 대기" };

export function DatabasePrimer() {
  return <figure className="db-figure">
    <div className="db-request-map">
      <div className="db-app-icon">웹앱 서버<br /><small>어떤 업무를 처리할까?</small></div>
      <span className="db-map-arrow" aria-label="요청과 결과를 주고받음">⇄</span>
      <div className="db-engine-icon"><strong>데이터 관리 경계</strong><small>조회 · 규칙 검사 · 변경 묶기<br />동시 실행 · 기록과 복구</small></div>
    </div>
    <figcaption>앱은 업무의 뜻을 정하고, DB는 요청받은 데이터 규칙을 관리합니다. DB도 메모리·파일·스토리지를 사용하며 올바른 규칙과 운영은 필요합니다.</figcaption>
  </figure>;
}

function FileScene({ frame: f, mobile }: { frame: FileFrame; mobile: boolean }) {
  const rawId = useId().replace(/:/g, ""); const marker = `db-arrow-${rawId}`;
  const positions: Record<string, [number, number]> = mobile ? {
    "app:A": [70, 34], "app:B": [210, 34], "copy:A": [70, 128], "copy:B": [210, 128], store: [140, 260], orders: [140, 366],
  } : { "app:A": [55, 68], "app:B": [55, 218], "copy:A": [212, 68], "copy:B": [212, 218], store: [412, 145], orders: [590, 145] };
  const edgePath = (from: string, to: string) => {
    const a = positions[from], b = positions[to];
    if (!a || !b) return "";
    if (mobile) {
      const down=b[1]>a[1];
      const extent=(node:string)=>node==="store"?51:node.startsWith("copy")?44:27;
      const y1=a[1]+(down?extent(from):-extent(from)),y2=b[1]+(down?-extent(to):extent(to));
      return `M${a[0]},${y1} C${a[0]},${(y1+y2)/2} ${b[0]},${(y1+y2)/2} ${b[0]},${y2}`;
    }
    const right=b[0]>a[0];
    const extent=(node:string)=>node==="store"?69:node.startsWith("copy")?59:node==="orders"?48:40;
    const x1 = a[0] + (right?extent(from):-extent(from)), x2 = b[0] + (right?-extent(to):extent(to));
    return `M${x1},${a[1]} C${(x1+x2)/2},${a[1]} ${(x1+x2)/2},${b[1]} ${x2},${b[1]}`;
  };
  return <svg viewBox={mobile ? "0 0 280 416" : "0 0 660 292"} role="img" aria-label={`앱 사본과 공유 저장소: 현재 재고 ${f.availableQty}, 확정 주문 ${f.committedOrders.length}`}>
    <defs><marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7Z" fill="#386e82" /></marker></defs>
    {f.edges.map(e => <path key={e.id} d={edgePath(e.from,e.to)} fill="none" stroke={e.active ? "#176b82" : "#b5c5cc"} strokeWidth={e.active ? 3 : 1.5} strokeDasharray={e.active ? undefined : "5 4"} markerEnd={`url(#${marker})`} data-edge-from={e.from} data-edge-to={e.to} data-active={e.active} />)}
    {f.localCopies.map(copy => {
      const [ax,ay] = positions[`app:${copy.app}`], [cx,cy] = positions[`copy:${copy.app}`];
      const color = copy.app === "A" ? "#176b82" : "#995525";
      return <g key={copy.app} data-app={copy.app} data-copy-status={copy.status} data-read-qty={copy.readQty} data-write-qty={copy.writeQty} data-revision={copy.sourceRevision}>
        <rect x={ax-37} y={ay-24} width="74" height="43" rx="5" fill={f.activeApp===copy.app ? "#e1edf0" : "#fff"} stroke={color} strokeWidth="2" />
        <path d={`M${ax-42} ${ay+23}h84`} stroke={color} strokeWidth="4" />
        <text x={ax} y={ay+4} textAnchor="middle" className="db-svg-title">앱 {copy.app}</text>
        <path d={`M${cx-56} ${cy-34}h96l16 16v62h-112Z`} fill="#fff" stroke={color} strokeWidth="1.8" strokeDasharray="4 3" />
        <path d={`M${cx+40} ${cy-34}v16h16`} fill="none" stroke={color} />
        <text x={cx} y={cy-14} textAnchor="middle" className="db-svg-small">{copy.sourceRevision===null ? "사본 없음" : `읽은 revision ${copy.sourceRevision}`}</text>
        <text x={cx} y={cy+10} textAnchor="middle" className="db-svg-number">{copy.readQty===null ? "—" : `${copy.readQty}개`}</text>
        <text x={cx} y={cy+33} textAnchor="middle" className="db-svg-small">{copy.writeQty!==null ? `쓸 값 ${copy.writeQty} · ` : ""}{statusLabels[copy.status]}</text>
      </g>;
    })}
    {(() => {const [x,y]=positions.store;return <g data-shared-qty={f.availableQty} data-revision={f.sourceRevision}>
      <path d={`M${x-67} ${y-38}v76c0 22 134 22 134 0v-76`} fill="#edf6f2" stroke="#39755f" strokeWidth="2" />
      <ellipse cx={x} cy={y-38} rx="67" ry="13" fill="#dceee6" stroke="#39755f" strokeWidth="2" />
      <text x={x} y={y-11} textAnchor="middle" className="db-svg-small">공유 저장소</text>
      <text x={x} y={y+15} textAnchor="middle" className="db-svg-number">{f.availableQty}개</text>
      <text x={x} y={y+36} textAnchor="middle" className="db-svg-small">현재 revision {f.sourceRevision}</text>
      {f.lockOwner && <text x={x} y={y+66} textAnchor="middle" className="db-svg-small">잠금 소유: {f.lockOwner}</text>}
    </g>;})()}
    {(() => {const [x,y]=positions.orders;return <g data-order-count={f.committedOrders.length}>
      <text x={x} y={y-28} textAnchor="middle" className="db-svg-title">확정 주문</text>
      {f.committedOrders.length===0 ? <text x={x} y={y+5} textAnchor="middle">아직 없음</text> : f.committedOrders.map((order,i) => <g key={order.id}>
        <rect x={x-46+(mobile ? i*47 : 0)} y={y-14+(mobile ? 0 : i*38)} width={mobile ? 44 : 92} height="31" rx="3" fill={order.app==="A" ? "#e4f0f4" : "#fff0df"} stroke={order.app==="A" ? "#176b82" : "#995525"} />
        <text x={x+(mobile ? i*47-24 : 0)} y={y+7+(mobile ? 0 : i*38)} textAnchor="middle">{order.app} · 1개</text>
      </g>)}
    </g>;})()}
  </svg>;
}

export function FileWriteLab() {
  const [mode,setMode]=useState<keyof typeof modeLabels>("race"), [first,setFirst]=useState<"A"|"B">("A"), [prediction,setPrediction]=useState("");
  const frames=fileWriteFrames({mode,first}), player=useDbPlayback(frames.length), f=frames[player.index];
  const changed=()=>{player.reset();setPrediction("");};
  const reset=()=>{changed();setMode("race");setFirst("A");};
  return <section className="db-lab" aria-label="파일과 DB의 동시 쓰기 실험" data-db-lab="files">
    <p className="db-eyebrow">01 · 같은 재고, 다른 처리 경계</p><h2>사본은 ‘지금의 값’이 아닐 수 있습니다</h2>
    <p>한 사람당 1개를 주문합니다. 점선 종이의 읽은 값과 가운데의 현재 값을 비교하세요. 시작 재고는 항상 1개입니다.</p>
    <div className="db-controls"><label>처리 방식<select aria-label="처리 방식" value={mode} onChange={e=>{changed();setMode(e.target.value as typeof mode);}}>{Object.entries(modeLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label>먼저 처리할 요청<select aria-label="먼저 처리할 요청" value={first} onChange={e=>{changed();setFirst(e.target.value as typeof first);}}><option value="A">앱 A</option><option value="B">앱 B</option></select></label></div>
    <DbPrediction value={prediction} setValue={setPrediction}><option value="one">주문 1개만 확정된다</option><option value="two">주문 2개가 확정될 수 있다</option></DbPrediction>
    <DbPlayback player={player} count={frames.length} reset={reset}/>
    <DbCurrent frame={f}/>
    <figure className="db-figure"><div className="db-desktop"><FileScene frame={f} mobile={false}/></div><div className="db-mobile"><FileScene frame={f} mobile/></div><figcaption>진한 선은 이번 단계의 동작, 옅은 점선은 지나온 동작의 이력입니다. 종이 안 숫자는 읽어 둔 값, 저장소 숫자는 현재 값입니다. 주문 종이는 실제로 확정된 요청에만 생깁니다.</figcaption></figure>
    <div className="db-legend"><span><i className="db-key-dot"/>앱 A</span><span><i className="db-key-dot db-key-dot--b"/>앱 B</span><span><i className="db-key-line db-key-line--active"/>현재 동작</span><span><i className="db-key-line" style={{borderTopStyle:"dashed",opacity:.55}}/>지난 동작의 이력</span></div>
    <div className="db-invariant" data-holds={f.invariant.holds}><strong>시작 1 − 새 확정 {f.committedOrders.length} = 기대 재고 {f.invariant.expectedQty}</strong><span>실제 재고 {f.invariant.actualQty}</span><span>{f.invariant.holds ? "현재까지 관계가 맞음" : "관계가 깨짐 · 재고보다 더 약속함"}</span></div>
    {player.index===frames.length-1 && prediction && <p role="status">{(prediction==="two")===(f.committedOrders.length===2) ? "예측과 같습니다." : "예측과 다릅니다."} 마지막 숫자뿐 아니라 두 요청이 어느 값을 읽고 확정했는지 확인하세요.</p>}
    <p className="db-model-note">{f.assumptions.join(" ")} 단계 간격은 처리 시간이 아닙니다. 파일의 쓰기와 주문 기록이 장애에도 원자적이라는 보장은 이 그림에 포함되지 않습니다.</p>
    <DbSteps frames={frames}/>
  </section>;
}

const tableLabels:Record<TableName,string>={customers:"고객 · customers",products:"상품 · products",orders:"주문 · orders",order_items:"항목 · order_items"};
function RelationScene({fixture,selectedCustomer,mobile}:{fixture:ReadonlyFixture;selectedCustomer:number;mobile:boolean}) {
  const marker=`rel-${useId().replace(/:/g,"")}`;
  const layouts:Record<TableName,{x:number;y:number;w:number}>=mobile ? {
    customers:{x:16,y:16,w:248},orders:{x:16,y:186,w:248},order_items:{x:16,y:376,w:248},products:{x:16,y:596,w:248},
  }:{customers:{x:8,y:20,w:202},orders:{x:294,y:20,w:230},order_items:{x:294,y:222,w:230},products:{x:8,y:222,w:202}};
  const rowHeight=29,head=45;
  const rows:Record<TableName,{key:string;label:string;active:boolean}[]>={
    customers:fixture.customers.map(r=>({key:`customers:${r.id}`,label:`${r.id}  ·  ${r.display_name}`,active:r.id===selectedCustomer})),
    orders:fixture.orders.map(r=>({key:`orders:${r.id}`,label:`${r.id}  → 고객 ${r.customer_id}`,active:r.customer_id===selectedCustomer})),
    products:fixture.products.map(r=>({key:`products:${r.id}`,label:`${r.id}  ·  ${r.name}`,active:fixture.order_items.some(i=>i.product_id===r.id&&fixture.orders.some(o=>o.id===i.order_id&&o.customer_id===selectedCustomer))})),
    order_items:fixture.order_items.map(r=>({key:`order_items:${r.order_id}:${r.line_no}`,label:`(${r.order_id},${r.line_no}) → ${r.product_id}`,active:fixture.orders.some(o=>o.id===r.order_id&&o.customer_id===selectedCustomer)})),
  };
  if (mobile) {
    let y = 12;
    for (const table of ["customers", "orders", "order_items", "products"] as TableName[]) {
      rows[table] = rows[table].filter(row => row.active);
      layouts[table].y = y;
      y += head + Math.max(1, rows[table].length) * rowHeight + 24;
    }
  }
  const mobileHeight=layouts.products.y+head+Math.max(1,rows.products.length)*rowHeight+12;
  const edges=fixtureRelations(fixture).filter(e=>rows[e.from.table].find(r=>r.key===e.from.rowKey)?.active);
  const point=(table:TableName,key:string,side:"left"|"right"|"top"|"bottom")=>{const b=layouts[table],i=rows[table].findIndex(r=>r.key===key);return [b.x+(side==="left"?0:side==="right"?b.w:b.w/2), b.y+head+i*rowHeight+rowHeight/2] as const;};
  return <svg viewBox={mobile ? `0 0 280 ${mobileHeight}` : "0 0 548 412"} role="img" aria-label={`고객 ${selectedCustomer}에 연결된 주문·항목·상품의 키 관계`}>
    <defs><marker id={marker} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#32748c"/></marker></defs>
    {(Object.keys(layouts) as TableName[]).map(table=>{const b=layouts[table];return <g key={table}>
      <rect x={b.x} y={b.y} width={b.w} height={head+rowHeight*Math.max(1,rows[table].length)+4} fill="#fff" stroke="#91acb9" rx="5"/>
      <path d={`M${b.x} ${b.y+head}h${b.w}`} stroke="#91acb9"/>
      <text x={b.x+10} y={b.y+20} className="db-svg-title">{tableLabels[table]}</text>
      <text x={b.x+10} y={b.y+36} className="db-svg-small">{table==="order_items"?"PK (주문,줄) · FK 상품":table==="orders"?"PK 주문 id · FK 고객 id":"PK id · 이름"}</text>
      {rows[table].length===0 && <text x={b.x+10} y={b.y+head+20} className="db-svg-small">연결된 행 없음</text>}
      {rows[table].map((row,i)=><g key={row.key} data-row-key={row.key} data-selected={row.active}>
        <rect x={b.x+1} y={b.y+head+i*rowHeight} width={b.w-2} height={rowHeight} fill={row.active?"#e2f0ed":"#f8fafb"}/>
        <text x={b.x+10} y={b.y+head+i*rowHeight+20} fontWeight={row.active?700:400}>{row.label}</text>
        <circle cx={b.x+(mobile?b.w-5:table==="customers"||table==="products"?b.w:0)} cy={b.y+head+i*rowHeight+rowHeight/2} r="3" fill={row.active?"#32748c":"#abbec7"}/>
      </g>)}
    </g>;})}
    {edges.map((e,i)=>{let path:string;
      if(mobile){const a=point(e.from.table,e.from.rowKey,"right"),b=point(e.to.table,e.to.rowKey,"right"),x=270+(i%2)*4;path=`M${a[0]-5} ${a[1]}H${x}V${b[1]}H${b[0]-5}`;}
      else if(e.to.table==="orders"){const a=point(e.from.table,e.from.rowKey,"right"),b=point(e.to.table,e.to.rowKey,"right"),x=532+(i%2)*7;path=`M${a[0]} ${a[1]}H${x}V${b[1]}H${b[0]}`;}
      else {const a=point(e.from.table,e.from.rowKey,"left"),b=point(e.to.table,e.to.rowKey,"right");path=`M${a[0]} ${a[1]} C${(a[0]+b[0])/2} ${a[1]} ${(a[0]+b[0])/2} ${b[1]} ${b[0]} ${b[1]}`;}
      return <path key={e.id} d={path} stroke="#32748c" strokeWidth="2" fill="none" markerEnd={`url(#${marker})`} data-relation={e.id} data-from={e.from.rowKey} data-to={e.to.rowKey}/>;
    })}
  </svg>;
}
export function RelationshipMap(){
  const [selected,setSelected]=useState(1),[renamed,setRenamed]=useState(false),[sameNames,setSameNames]=useState(false);
  let fixture=createFixture(sameNames?"same-name":"canonical");if(renamed)fixture=renameCustomer(fixture,1,"가람 문구");
  const summary=summarizeCustomer(fixture,selected);
  return <section className="db-lab" aria-label="표 사이의 키 관계" data-db-lab="relations"><p className="db-eyebrow">02 · 실제 값으로 잇는 관계</p><h2>이름을 바꿔도 선은 같은 id로 갑니다</h2>
    <div className="db-controls"><label>관계를 따라갈 고객<select aria-label="관계를 따라갈 고객" value={selected} onChange={e=>setSelected(Number(e.target.value))}>{fixture.customers.map(c=><option key={c.id} value={c.id}>고객 {c.id} · {c.display_name}</option>)}</select></label><div><label className="db-checkbox"><input type="checkbox" checked={renamed} onChange={e=>setRenamed(e.target.checked)}/>고객1 이름 변경</label><label className="db-checkbox"><input type="checkbox" checked={sameNames} onChange={e=>setSameNames(e.target.checked)}/>이름이 같은 고객 둘</label></div></div>
    <div className="db-current" role="status"><strong>선택한 고객 id {selected}</strong><p>선은 외래키에서 참조하는 기본키를 향합니다. 초록 행은 이 고객과 연결된 기록입니다. 취소 주문도 관계 자체는 남아 있습니다.</p></div>
    <figure className="db-figure"><div className="db-desktop"><RelationScene fixture={fixture} selectedCustomer={selected} mobile={false}/></div><div className="db-mobile"><RelationScene fixture={fixture} selectedCustomer={selected} mobile/></div><figcaption>고객→여러 주문, 주문→여러 항목, 상품→여러 항목의 관계입니다. 화살표 방향은 자식 행의 FK에서 부모 행의 PK로 향합니다. 같은 색만으로 연결하지 않고 실제 키와 선 끝점을 함께 확인하세요. 좁은 화면은 선택 고객과 연결된 행만 펼칩니다.</figcaption></figure>
    <p className="db-relation-summary">선택 고객의 <strong>확정 주문 {summary.orderCount}건 · 항목 {summary.itemCount}행 · 수량 {summary.totalQty}개 · {summary.totalWon.toLocaleString("ko-KR")}원</strong>. 취소 주문은 이 합계에서 제외합니다.</p>
    <button type="button" onClick={()=>{setSelected(1);setRenamed(false);setSameNames(false);}}>관계 그림 초기화</button>
    <p className="db-model-note">행의 위치는 설명을 위한 배치이지 물리 저장 순서가 아닙니다. 이름을 바꿔도 FK의 값과 선 끝점은 유지됩니다. 실험은 DB를 변경하지 않습니다.</p>
  </section>;
}
const scenarioLabels={normal:"정상 항목 추가", "duplicate-pk":"같은 (주문,줄) 중복", "missing-fk":"존재하지 않는 참조", "zero-qty":"수량 0", "null-qty":"수량 NULL", "duplicate-name":"이름이 같은 고객 추가", "empty-order":"항목이 없는 주문"} as const;
const checkNames:Record<string,string>={pass:"통과",fail:"거절 근거",unknown:"UNKNOWN · CHECK는 허용",disabled:"적용하지 않음"};
function CandidateDiagram({frame:f}:{frame:ConstraintFrame}){
  const candidate=f.candidate;
  const paper=<div className="db-candidate-paper" data-status={candidate.status} data-node-key={candidate.status==="accepted"?candidate.rowKey:candidate.nodeKey}><strong>{candidate.status==="accepted"?"들어온 새 행":candidate.status==="rejected"?"거절된 후보 · 저장 안 됨":"저장 전 후보"}</strong><code>{candidate.table}</code>{Object.entries(candidate.row).map(([key,value])=><code key={key}>{key}: {value===null?"NULL":String(value)}</code>)}</div>;
  const links=candidate.status==="accepted"?f.edges.filter(edge=>edge.from.rowKey===candidate.rowKey):f.candidateEdges;
  return <figure className="db-figure">
    <div className="db-candidate" data-candidate-status={candidate.status}>
      <div className="db-candidate-origin">{candidate.status==="accepted"?<div className="db-candidate-vacant">후보가 저장 경계를 넘었습니다.<br/>이 영역에는 현재 후보가 없습니다.</div>:paper}</div>
      <div className="db-gate" data-status={candidate.status} aria-label={candidate.status==="accepted"?"저장 영역으로 들어감":candidate.status==="rejected"?"경계에서 거절됨":"검사 경계"}>{candidate.status==="rejected"?"⊣":"→"}</div>
      <div className="db-store"><strong>저장 영역</strong><span>고객 {f.fixture.customers.length}행 · 상품 {f.fixture.products.length}행<br/>주문 {f.fixture.orders.length}행 · 항목 {f.fixture.order_items.length}행</span>{candidate.status==="accepted"&&paper}</div>
    </div>
    {links.length>0 && <svg viewBox={`0 0 280 ${links.length*43+8}`} role="img" aria-label={candidate.status==="accepted"?"저장된 새 행의 참조선":"후보의 참조 대상 존재 여부"}>{links.map((edge,i)=><g key={edge.id} transform={`translate(0 ${i*43})`}><rect x="2" y="3" width="95" height="36" fill="#fff" stroke="#638694"/><text x="49" y="18" textAnchor="middle" className="db-svg-small">{candidate.status==="accepted"?"저장된 행":"후보"}</text><text x="49" y="32" textAnchor="middle" className="db-svg-small">FK {edge.from.value}</text><path d="M99 21H177m-6-5 6 5-6 5" fill="none" stroke={edge.exists?"#32748c":"#a6384f"} strokeWidth="2" strokeDasharray={edge.exists?undefined:"4 3"} data-from={edge.from.rowKey} data-to={edge.to.rowKey}/><rect x="182" y="3" width="96" height="36" fill={edge.exists?"#e6f2ed":"#fff0f2"} stroke={edge.exists?"#39755f":"#a6384f"}/><text x="230" y="18" textAnchor="middle" className="db-svg-small">{edge.to.table}</text><text x="230" y="32" textAnchor="middle" className="db-svg-small">{edge.exists?`PK ${edge.to.value}`:"대상 없음"}</text></g>)}</svg>}
    <figcaption>통과한 후보는 저장 영역 안으로 옮겨지고 그곳의 행과 관계에 포함됩니다. 거절된 후보는 경계 밖에 남습니다. 현재 저장된 행과 검사 전 후보를 혼동하지 않습니다.</figcaption>
  </figure>;
}
export function ConstraintLab(){
  const [scenario,setScenario]=useState<keyof typeof scenarioLabels>("missing-fk"),[notNull,setNotNull]=useState(true),[prediction,setPrediction]=useState("");
  const frames=constraintFrames({scenario,notNull}),player=useDbPlayback(frames.length),f=frames[player.index];
  const changed=()=>{player.reset();setPrediction("");};const reset=()=>{changed();setScenario("missing-fk");setNotNull(true);};
  return <section className="db-lab" aria-label="제약조건과 저장 경계 실험" data-db-lab="constraints"><p className="db-eyebrow">02 · 후보가 들어갈 수 있을까?</p><h2>관계를 지키지 못하면 저장 전에 멈춥니다</h2>
    <div className="db-controls"><label>넣어 볼 기록<select aria-label="넣어 볼 기록" value={scenario} onChange={e=>{changed();setScenario(e.target.value as typeof scenario);}}>{Object.entries(scenarioLabels).map(([key,value])=><option key={key} value={key}>{value}</option>)}</select></label><label>수량의 필수 값 규칙<select aria-label="수량의 필수 값 규칙" value={String(notNull)} onChange={e=>{changed();setNotNull(e.target.value==="true");}}><option value="true">NOT NULL과 CHECK 함께</option><option value="false">NOT NULL 제거 · CHECK만</option></select></label></div>
    <DbPrediction value={prediction} setValue={setPrediction}><option value="yes">저장된다</option><option value="no">저장되지 않는다</option></DbPrediction>
    <DbPlayback player={player} count={frames.length} reset={reset}/><DbCurrent frame={f}/><CandidateDiagram frame={f}/>
    <ul className="db-checks">{f.checks.map(check=><li key={check.id} data-result={check.result}><strong>{check.label}</strong><br/>{checkNames[check.result]||check.result}</li>)}</ul>
    {f.accepted!==null && <div className="db-invariant" data-holds={f.accepted}><strong>{f.accepted?"이 제약들 아래에서 저장됨":"저장되지 않음"}</strong><span>{f.violations.length?f.violations.join(" · "):"제약을 통과해도 업무 규칙 전체의 완성을 뜻하지 않습니다."}</span></div>}
    {f.businessWarnings.map(warning=><p className="db-business-warning" key={warning}>{warning}</p>)}
    {player.index===frames.length-1&&prediction&&<p role="status">{(prediction==="yes")===f.accepted?"예측과 같습니다.":"예측과 다릅니다."} 어떤 규칙이 적용됐는지, 규칙 밖의 업무 조건은 없는지 확인하세요.</p>}
    <p className="db-model-note">PostgreSQL에서 CHECK는 TRUE 또는 UNKNOWN을 허용합니다. NULL을 막는 NOT NULL은 별도 규칙입니다. 검사 순서는 교육용 설명이며 실제 엔진의 내부 순서가 아닙니다.</p><DbSteps frames={frames}/>
  </section>;
}

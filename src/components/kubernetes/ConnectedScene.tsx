import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { DiagramNode, DiagramEdge } from '../../simulations/kubernetes/visual-explanations.mjs';
import './visual-explanations.css';
type Line={id:string;path:string;active:boolean;bidirectional?:boolean;from:string;to:string};
// Connect actual DOM boundaries, not nominal SVG coordinates. ResizeObserver covers
// wrapped Korean labels, responsive reflow, font loading and hidden details opening.
export function ConnectedScene({nodes,edges,columns=2,label,boundaryLabel,legend='화살표 = 연결 방향 · 굵은 실선 = 현재 전달 · 가는 점선 = 가능한 관계'}:{nodes:DiagramNode[];edges:DiagramEdge[];columns?:number;label:string;legend?:string;boundaryLabel?:string}) {
 const root=useRef<HTMLDivElement>(null),[lines,setLines]=useState<Line[]>([]),marker=useId().replace(/:/g,'');
 const rows=Math.max(...nodes.map(n=>n.row+(n.span??1)-1));
 const signature=JSON.stringify({nodes,edges,columns});
 useLayoutEffect(()=>{
  const el=root.current;if(!el)return;
  const measure=()=>{
   const bounds=el.getBoundingClientRect();
   const boxes=new Map([...el.querySelectorAll<HTMLElement>('[data-node]')].map(n=>[n.dataset.node!,n.getBoundingClientRect()]));
   setLines(edges.flatMap(e=>{
    const a=boxes.get(e.from),b=boxes.get(e.to);if(!a||!b)return [];
    const vertical=a.bottom<=b.top||b.bottom<=a.top;
    let x1,y1,x2,y2;
    if(vertical){x1=a.x+a.width/2-bounds.x;x2=b.x+b.width/2-bounds.x;y1=(a.y<b.y?a.bottom:a.top)-bounds.y;y2=(a.y<b.y?b.top:b.bottom)-bounds.y;}
    else{x1=(a.x<b.x?a.right:a.left)-bounds.x;x2=(a.x<b.x?b.left:b.right)-bounds.x;y1=a.y+a.height/2-bounds.y;y2=b.y+b.height/2-bounds.y;}
    const mid=vertical?(y1+y2)/2:(x1+x2)/2;
    const path=vertical?`M${x1},${y1} C${x1},${mid} ${x2},${mid} ${x2},${y2}`:`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`;
    return [{...e,path}];
   }));
  };
  measure();const resize=new ResizeObserver(measure);resize.observe(el);el.querySelectorAll('[data-node]').forEach(n=>resize.observe(n));
  return ()=>resize.disconnect();
 },[signature]);
 return <figure className="k8v-connected" aria-label={label}><figcaption>{label}</figcaption><div className="k8v-graph" ref={root} style={{gridTemplateColumns:`repeat(${columns},minmax(0,1fr))`,gridTemplateRows:`repeat(${rows},auto)`}}>
  {boundaryLabel&&<div className="k8v-vm-boundary" data-role-boundary="vm" style={{gridColumn:`1 / span ${columns}`,gridRow:`2 / span ${rows-1}`}}><strong>{boundaryLabel}</strong></div>}
  <svg className="k8v-connectors" aria-hidden="true"><defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker></defs>{lines.map(l=><path key={l.id} data-edge={l.id} data-from={l.from} data-to={l.to} data-active={l.active} d={l.path} className={l.active?'k8v-edge-current':''} markerEnd={`url(#${marker})`} markerStart={l.bidirectional&&!l.active?`url(#${marker})`:undefined}/>)}</svg>
  {nodes.map(n=><div key={n.id} data-node={n.id} className={`k8v-node k8v-${n.kind} ${n.active?'k8v-current':''}`} style={{gridColumn:n.col,gridRow:`${n.row} / span ${n.span??1}`}}><strong>{n.label}</strong><span>{n.detail}</span>{n.active&&<small>● 이번 관찰</small>}</div>)}
 </div><span className="k8v-legend">{legend}</span></figure>;
}

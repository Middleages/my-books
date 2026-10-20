import { useState } from "react";
import { events, progressiveTax } from "../../simulations/tax/taxModel.mjs";
import "./tax.css";
const fmt=(n:number)=>Number(n.toFixed(4)).toLocaleString("ko-KR");
export function TaxEventsLab(){
 const [id,setId]=useState("salary");const [step,setStep]=useState(0);const event=events.find(x=>x.id===id)!;
 return <section className="tax-lab" aria-label="과세 사건의 이동"><h3>돈의 경로와 과세 판단을 분리하기</h3><p>화살표는 돈이나 자산의 관계를 뜻하며 세금 납부를 뜻하지 않습니다.</p>
 <div className="tax-controls"><label>사건 <select value={id} onChange={e=>{setId(e.target.value);setStep(0)}}>{events.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label><button onClick={()=>setStep(x=>Math.min(2,x+1))}>한 단계</button><button onClick={()=>setStep(0)}>처음으로</button></div>
 <div className="tax-flow"><div className="tax-node">{event.from}</div><div className="tax-arrow" aria-label={step===0?"이동 전":event.kind+" 이동"}>→<small>{step===0?"이동 전":event.kind}</small></div><div className="tax-node">{event.to}</div></div>
 <p className="tax-result" aria-live="polite">{step===0?"이 사건이 과세 대상일지 먼저 예상해 보세요.":step===1?"자금 또는 자산의 이동과 세금 납부는 다른 단계입니다.":"과세 여부는 별도 확인: "+event.check}</p>
 <details><summary>전체 사건의 정적 표</summary><div className="tax-scroll" tabIndex={0} aria-label="사건 비교 표"><table><thead><tr><th>사건</th><th>출발</th><th>도착</th><th>추가 확인</th></tr></thead><tbody>{events.map(x=><tr key={x.id}><th>{x.label}</th><td>{x.from}</td><td>{x.to}</td><td>{x.check}</td></tr>)}</tbody></table></div></details></section>;
}
export function ProgressiveTaxLab(){
 const [amount,setAmount]=useState(400);const [step,setStep]=useState(3);const result=progressiveTax(amount);
 return <section className="tax-lab" aria-label="가상 누진세 구간 계산"><h3>높은 세율은 해당 구간에만</h3><p>가상 화폐단위 · 한국의 실제 세율표가 아닙니다. 0–100: 10%, 100–300: 20%, 300 초과: 30%.</p>
 <div className="tax-controls"><label>과세표준 <input type="number" min="0" max="1000000" step="10" value={amount} onChange={e=>{const n=Number(e.target.value);if(Number.isFinite(n)&&n>=0&&n<=1000000){setAmount(n);setStep(3)}}}/> 단위</label><button onClick={()=>setStep(s=>Math.min(3,s+1))}>한 단계</button><button onClick={()=>setStep(s=>Math.max(0,s-1))}>이전</button><button onClick={()=>{setAmount(400);setStep(0)}}>처음으로</button></div>
 <div className="tax-bars">{result.parts.map((p,i)=><div className="tax-bar" key={i}><span>{i===0?"0–100":i===1?"100–300":"300 초과"} · {p.rate*100}%</span><div className="tax-track"><div className={"tax-fill tax-fill-"+i} style={{width:(100*p.base/(i===0?100:i===1?200:Math.max(100,amount-300)))+"%",opacity:i<step?1:.2}}/></div><strong>{i<step?fmt(p.base)+" 단위":"관찰 전"}</strong></div>)}</div>
 <p className="tax-result" aria-live="polite">관찰한 세액: {fmt(result.parts.slice(0,step).reduce((s,p)=>s+p.tax,0))} 단위 · 전체 세액: {fmt(result.tax)} 단위</p><p>평균세율: {result.averageRate===null?"과세표준 0에서 정의되지 않음":fmt(result.averageRate*100)+"%"}</p>
 <details open><summary>전체 계산표 (정적 대안)</summary><div className="tax-scroll" tabIndex={0}><table><thead><tr><th>구간</th><th>과세 금액</th><th>세율</th><th>세액</th></tr></thead><tbody>{result.parts.map((p,i)=><tr key={i}><th>{i+1}</th><td>{fmt(p.base)}</td><td>{p.rate*100}%</td><td>{fmt(p.tax)}</td></tr>)}</tbody><tfoot><tr><th>합계</th><td>{fmt(amount)}</td><td>—</td><td>{fmt(result.tax)}</td></tr></tfoot></table></div></details></section>;
}

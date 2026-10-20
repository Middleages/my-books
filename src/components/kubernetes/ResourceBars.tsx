import { resourceAxis } from '../../simulations/kubernetes/visual-explanations.mjs';
import type { NodeResource } from '../../simulations/kubernetes/storage-resources.mjs';
import './visual-explanations.css';
export function ResourceBars({name,unit,r}:{name:string;unit:string;r:NodeResource}){
 const axis=resourceAxis(r,unit),labels=['배치된 requests 합','기존 + 새 requests 제안','현재 실제 사용량'],tones=['reserved','proposed','used'];
 return <div className="k8d-chart k8v-resource" data-capacity={axis.capacity} data-axis={axis.maximum}><h4>{name} · allocatable {axis.capacity}{unit}</h4>
 {axis.bars.map((b,i)=><div className="k8d-bar-row" key={b.key}><div><span>{labels[i]}</span><strong>{b.value}{unit}{b.value>axis.capacity?' · 수용량 초과':''}</strong></div><div className="k8d-track" aria-hidden="true"><span data-quantity={b.key} data-value={b.value} className={`k8d-fill k8d-${tones[i]}`} style={{width:`${b.percent}%`}}/><i className="k8v-capacity-line" style={{left:`${axis.capacityPercent}%`}}/></div></div>)}
 <div className="k8v-axis"><span>0</span><span style={{left:`${axis.capacityPercent}%`}}>│ {axis.capacity}{unit}<br/>수용량</span><span>{axis.maximum}{unit}</span></div><small>같은 {unit} 비교는 항상 0–{axis.maximum}{unit}. 검은 선은 노드 수용량.</small></div>;
}

import type { HelmFrame } from '../../simulations/kubernetes/helm-diagnosis.mjs';
import { helmFieldLinks, helmRevisionTracks } from '../../simulations/kubernetes/visual-explanations.mjs';
import './visual-explanations.css';
export function HelmScene({f,frames,index}:{f:HelmFrame;frames:HelmFrame[];index:number}){
 const fields=helmFieldLinks(f),tracks=helmRevisionTracks(frames,index);
 return <div data-scene="helm" className="k8v-helm">
  <div className="k8v-chart"><strong>▤ Chart · {f.chart}</strong><span>templates + 기본 values</span><b aria-hidden="true">↓ 값으로 명세 필드를 채움</b></div>
  <div className="k8v-fields">{fields.map((field,i)=><div key={field.key} className={`k8v-field k8v-field-${i} ${field.changed?'k8v-field-changed':''}`} data-field={field.key}><div><small>{f.operation==='rollback'?'보관 revision 1 values':'목표 values'} · {field.key}</small><strong>{field.target}</strong>{field.before!==null&&<span>최초 설치: {field.before}{field.changed?' → 변경':' · 유지'}</span>}</div><b aria-hidden="true">→</b><div><small>{field.destination}</small><strong>{field.rendered?field.target:'아직 렌더 전'}</strong><span>{field.scope}</span></div></div>)}</div>
  <div className={`k8v-apply-gate ${f.phase==='local'?'k8v-gate-closed':''}`}><b>{f.operation==='template'?'⊣ 출력만 · API 변경 없음':'↓ API 적용 경계'}</b><span>template은 설치 아님 · 적용과 controller 관측도 별개</span></div>
  <div className="k8v-live"><strong>클러스터 · release study / books-lab</strong><div>{fields.map(field=><span key={field.key} data-live-field={field.key}><small>{field.key}</small><b>{field.live??'객체 없음'}</b></span>)}</div><p>Service 80 → targetPort 8080 · Pod Ready: {f.ready}</p></div>
  <div className="k8v-revisions" aria-label="같은 관찰 순서의 두 revision 번호"><h3>두 번호는 서로 다른 이력</h3><p>같은 관찰 단계의 번호를 세로로 비교합니다. 선은 관찰 순서이며 실행 시간이 아닙니다.</p>{(['helm','deployment'] as const).map(kind=><div className="k8v-revision-row" key={kind}><strong>{kind==='helm'?'Helm release':'Deployment'}</strong><ol>{frames.map((step,i)=>{const t=tracks[i];return <li key={i} data-track={kind} data-step={i+1} className={i===index?'k8v-revision-current':''}><b>{t?(t[kind]??'∅'):'?'}</b><small>{i+1} · {i===index?'현재':t?'관찰':'예정'}</small></li>;})}</ol></div>)}<p>∅ 없음/미관측 · ? 아직 관찰 전. 이미지 변경은 Pod template에, replicas·이 차트의 별도 ConfigMap 변경은 다른 필드에 붙습니다.</p></div>
  <details className="k8-static"><summary>정확한 YAML과 release 이력 펼치기</summary>{f.yaml?<pre tabIndex={0} aria-label="렌더링 명세 발췌">{f.yaml}</pre>:<p>아직 출력 전</p>}<ol>{f.history.map(h=><li key={h.revision}>Helm revision {h.revision} · {h.status} · {h.values.replicas}개 / {h.values.image} / {h.values.message}</li>)}</ol></details>
 </div>;
}

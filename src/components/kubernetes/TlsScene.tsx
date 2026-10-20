import type { IngressFrame } from '../../simulations/kubernetes/edge-config.mjs';
import { tlsSegments } from '../../simulations/kubernetes/visual-explanations.mjs';
import './visual-explanations.css';
const state:Record<string,string>={pending:'아직 관측 전',done:'도달',blocked:'여기서 중단',passed:'검증 성공',failed:'검증 실패',none:'TLS 없음'};
export function TlsScene({f}:{f:IngressFrame}){
 return <figure className="k8v-tls-scene" data-scene="tls"><figcaption>요청 경로 위에서 읽는 암호화 범위 · 외부 TLS는 안쪽까지 이어지지 않음</figcaption>
  {tlsSegments(f).map((s,i)=><div className={`k8v-tls-segment ${s.encrypted?'k8v-encrypted':'k8v-clear'}`} data-segment={s.id} key={s.id}>
   {i>0&&<span className="k8v-segment-join" aria-hidden="true">↓</span>}
   <div className="k8v-tls-band"><strong>{s.encrypted?'▣':'□'} {s.label}</strong><small>{s.verifier}</small><b>{state[s.status]}</b>{s.encrypted&&<span>종료: {s.terminator}</span>}</div>
   <ol>{s.hops.map((h,j)=><li key={h.name} data-hop={h.name} data-state={h.status} className={`k8c-${h.status}`}><strong>{h.name}</strong><code>{h.address}</code><small>{state[h.status]}{h.name.includes('ServiceLB')?' · TLS 종료 아님':''}</small>{j<s.hops.length-1&&<b className="k8v-hop-join" aria-hidden="true">↓</b>}</li>)}</ol>
  </div>)}
  <p className="k8v-model-note">Ingress 규칙은 경로 옆의 설정 문서이지 요청이 통과하는 서버가 아닙니다. Service는 논리적 대상 선택이며 앱의 listen 포트를 바꾸지 않습니다. 가상 주소·관찰 단계로 실제 거리를 나타내지 않습니다.</p>
 </figure>;
}

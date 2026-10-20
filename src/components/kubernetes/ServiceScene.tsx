import type { ServiceFrame } from '../../simulations/kubernetes/workloads.mjs';
import { serviceDiagram } from '../../simulations/kubernetes/visual-explanations.mjs';
import { ConnectedScene } from './ConnectedScene';
export function ServiceScene({f,compact=false}:{f:ServiceFrame;compact?:boolean}){
 return <div className="k8v-service" data-scene="service">
  <ConnectedScene {...serviceDiagram(f)} label="① selector → Pod 선택 · 점선 바깥 namespace는 제외" legend="선 = selector가 선택한 Pod · 굵은 선 = ready 전달 후보 · 점선 = 선택됐지만 미준비 · 선 없음 = 선택 제외"/>
  <p className="k8v-endpoints"><strong>EndpointSlice · 주소 기록</strong><span>{f.endpoints.length}개 선택 / {f.eligible.length}개 ready</span>{f.endpoints.map(e=><span key={e.uid}>{e.uid} → {e.ip}:{e.port} · {e.ready?'✓ 전달 후보':'○ 전달 제외'}</span>)}{!f.endpoints.length&&<span>∅ 일치하는 주소 없음</span>}</p>
  {!compact&&<p className="k8v-dns"><strong>② DNS 조회</strong> · 호출 위치 {f.clientNamespace}<br/>{f.query} → {f.dns.found?f.dns.address:'이 이름을 찾지 못함'}<br/><small>전체 이름: {f.dns.name}. DNS와 EndpointSlice는 아래 HTTP/TCP 데이터 경로를 중계하지 않습니다.</small></p>}
  <div className="k8v-request" aria-label="새 연결의 논리 경로"><div><small>호출 Pod</small><strong>{f.clientNamespace}</strong></div><b aria-hidden="true">→</b><div><small>Service 가상 주소</small><strong>{f.service.clusterIP}:{f.service.port}</strong></div><b aria-hidden="true">{f.result.destination?'→':'×'}</b><div><small>대상 {f.result.selectedUid??'없음'}</small><strong>{f.result.destination??'전달 불가'}</strong><span>앱 listen :{f.pods[0]?.listenPort??'미관측'}</span></div></div>
  <div className="k8-feedback" role="status" aria-atomic="true"><strong>{f.result.reason}</strong>{!compact&&<p>{f.result.next}</p>}</div>
 </div>;
}

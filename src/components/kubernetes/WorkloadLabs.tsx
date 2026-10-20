import { desiredSlots } from '../../simulations/kubernetes/visual-explanations.mjs';
import { ServiceScene } from './ServiceScene';
import { useState } from 'react';
import { Playback, useFoundationPlayback } from '../network/FoundationPlayback';
import { desiredFrames, serviceFrames, type DesiredOptions, type DesiredFrame, type ServiceFrame, type ServiceOptions } from '../../simulations/kubernetes/workloads.mjs';
import './kubernetes.css';
import './workloads.css';

function Steps({frames}: {frames: {title:string;detail:string}[]}) {
 return <details className="k8-static"><summary>모든 단계 · 움직임 없이 읽기</summary><ol>{frames.map((f,i)=><li key={i}><strong>{f.title}</strong><p>{f.detail}</p></li>)}</ol></details>;
}
function Explanation({frame}: {frame:{title:string;detail:string}}) {
 return <div className="k8-explanation" role="status" aria-atomic="true"><h3>{frame.title}</h3><p>{frame.detail}</p></div>;
}
function Counts({frame:f}: {frame:DesiredFrame}) {
 return <div className="k8b-counts" aria-label="개수 비교">
  <div><small>원하는 수 · desired</small><strong>{f.desired}</strong><span>Deployment 요청</span></div>
  <div><small>현재 수 · current</small><strong>{f.current}</strong><span>그림의 Pod 객체</span></div>
  <div><small>준비 수 · ready</small><strong>{f.ready}</strong><span>Ready인 Pod</span></div>
 </div>;
}
export function DesiredStateLab() {
 const [event,setEvent]=useState<NonNullable<DesiredOptions['event']>>('delete');
 const [target,setTarget]=useState(3),[prediction,setPrediction]=useState('');
 const frames=desiredFrames({event,target}), player=useFoundationPlayback(frames.length), f=frames[player.index];
 const changed=()=>{player.reset();setPrediction('');};
 const reset=()=>{changed();setEvent('delete');setTarget(3);};
 return <section className="k8-lab k8b-lab" aria-label="Pod와 원하는 상태 실험">
  <p className="k8-eyebrow">03 · 지우기와 줄이기는 다르다</p><h2>원하는 수는 누가 기억할까?</h2>
  <p>처음에는 Pod 두 개가 준비돼 있습니다. 조건 하나를 바꾸고 UID와 개수를 함께 따라가 보세요.</p>
  <div className="k8-controls">
   <label>변경 사건<select value={event} onChange={e=>{changed();setEvent(e.target.value as typeof event);}}>
    <option value="delete">Pod 하나 삭제</option><option value="restart">컨테이너 하나 비정상 종료</option><option value="scale">replicas 변경</option><option value="node">실행 노드 불가 · 제어 영역 정상</option><option value="vm">단일 VM 전체 종료</option>
   </select></label>
   <label>변경할 replicas<select value={target} disabled={event!=='scale'} onChange={e=>{changed();setTarget(Number(e.target.value));}}>{[0,1,2,3,4].map(n=><option key={n} value={n}>{n}개</option>)}</select></label>
  </div>
  <label className="k8-predict">예측: 마지막에 무엇이 달라질까?<select value={prediction} onChange={e=>setPrediction(e.target.value)}><option value="">먼저 예상해 보세요</option><option>새 UID가 자리를 채움</option><option>같은 UID · 재시작 횟수 증가</option><option>원하는 수가 변경됨</option><option>실행할 곳 또는 제어 역할이 없음</option></select></label>
  <Playback player={player} count={frames.length} reset={reset}/>
  <div className="k8b-ownership" aria-label="소유 관계 · HTTP 이동 경로 아님">
   <div className="k8b-resource"><small>원하는 배포 상태</small><strong>Deployment</strong><span>{f.deployment}</span><b>replicas: {f.desired}</b></div>
   <div className="k8b-owner-arrow">↓ 소유 · 조정</div>
   <div className="k8b-resource"><small>이 버전의 개수 유지</small><strong>ReplicaSet</strong><span>{f.replicaSet}</span></div>
   <div className="k8b-owner-arrow">↓ Pod의 ownerReferences</div>
   <div className={`k8b-pod-boundary ${!f.nodeUp?'k8b-unavailable':''}`}>
    <p><strong>관리 중인 Pod 객체</strong> · 실행 노드 {f.nodeUp?'정상':'불가'} / 제어 영역 {f.controlUp?'정상':'중단'}</p>
    {f.observation==='stale' && <p className="k8b-warning">마지막 관측 기록입니다. 현재 실행·준비 수로 읽지 마세요.</p>}
    <div className="k8b-pods">{desiredSlots(frames,player.index).map(slot=>slot.pod?((p)=><div key={p.uid} data-pod-slot={slot.uid} className={`k8b-pod ${p.ready?'k8b-ready':'k8b-wait'}`}><strong>Pod · {p.uid}</strong><small>UID: {p.uid} (학습용 축약)</small><span>노드: {p.node??'미배정'}</span><div className="k8b-container"><b>▣ study-web 컨테이너</b><span>{p.state}</span><span>재시작 {p.restarts}회</span></div><b>{p.ready?'● Ready':'○ 준비되지 않음'}</b></div>)(slot.pod):<div key={slot.uid} data-pod-slot={slot.uid} className="k8b-pod k8v-ghost"><strong>∅ 이전 {slot.uid}</strong><span>삭제된 자리 · 현재 개수에 포함하지 않음</span></div>)}</div>
    {!f.pods.length && <p className="k8b-empty">현재 Pod 객체 0개</p>}
   </div>
  </div>
  <p className="k8-caption">큰 상자는 Pod, 안쪽 상자는 컨테이너입니다. ↓는 소유 관계이며 HTTP 요청이나 직접 호출 순서가 아닙니다. current는 이 실험의 Pod 객체 수입니다.</p>
  <Counts frame={f}/>
  <Explanation frame={f}/>
  {player.index===frames.length-1&&prediction&&<p className="k8-feedback">내 예측: {prediction} · 실제 관찰: {f.title}. UID·재시작 횟수·세 개수를 함께 비교하세요.</p>}
  <p className="k8-assumption">Pod당 앱 컨테이너 하나, 동일 이미지, restartPolicy=Always. 단계는 실제 초 단위 시간이 아닙니다. 정상 사례는 이미지·자원·runtime·준비 조건 성공을 가정합니다. 노드 불가 사례는 제어 영역이 살아 있는 별도 조건이며, 단일 VM 전체 종료는 조정도 멈춥니다. 종료 유예·퇴거 대기·상태 반영 지연을 요약했고 표시 상태를 kubectl의 정확한 phase 목록으로 재현하지 않습니다.</p>
  <Steps frames={frames}/>
  <details className="k8-static"><summary>단계별 개수와 UID 비교표</summary><div className="k8-table" role="region" aria-label="Pod 관찰 표" tabIndex={0}><table><thead><tr><th>관찰</th><th>desired / current / ready</th><th>UID · 재시작</th></tr></thead><tbody>{frames.map((x,i)=><tr key={i}><td>{x.title}{x.observation==='stale'?' (마지막 기록)':''}</td><td>{x.desired} / {x.current} / {x.ready}</td><td>{x.pods.map(p=>`${p.uid} · ${p.restarts}회`).join(', ')||'없음'}</td></tr>)}</tbody></table></div></details>
 </section>;
}
export function ServiceDiscoveryLab() {
 const [options,setOptions]=useState<ServiceOptions>({selector:'study-web',targetPort:8080,ready:true,clientNamespace:'books-lab',query:'study-web'});
 const [prediction,setPrediction]=useState('');
 const frames=serviceFrames(options),player=useFoundationPlayback(frames.length),f=frames[player.index];
 const change=(patch:ServiceOptions)=>{player.reset();setPrediction('');setOptions(o=>({...o,...patch}));};
 const reset=()=>{player.reset();setPrediction('');setOptions({selector:'study-web',targetPort:8080,ready:true,clientNamespace:'books-lab',query:'study-web'});};
 return <section className="k8-lab k8b-lab" aria-label="Service와 Pod 발견 실험">
  <p className="k8-eyebrow">04 · 이름은 유지하고 대상을 갱신하기</p><h2>Pod A가 C로 바뀌어도 같은 이름을 쓴다</h2>
  <p>두 Pod 중 하나를 교체합니다. 먼저 정상 연결을 보고, selector·준비·포트·DNS 조건을 하나씩 바꿔 비교하세요.</p>
  <div className="k8-controls">
   <label>Service selector<select value={options.selector} onChange={e=>change({selector:e.target.value})}><option value="study-web">app=study-web · 일치</option><option value="other">app=other · 불일치</option></select></label>
   <label>Service targetPort<select value={options.targetPort} onChange={e=>change({targetPort:Number(e.target.value)})}><option value={8080}>8080 · 앱 포트</option><option value={9090}>9090 · 리스너 없음</option></select></label>
   <label>앱 준비 조건<select value={String(options.ready)} onChange={e=>change({ready:e.target.value==='true'})}><option value="true">성공 · 새 Pod는 준비 후 합류</option><option value="false">실패 · 모든 대상 미준비</option></select></label>
   <label>호출 Pod namespace<select value={options.clientNamespace} onChange={e=>change({clientNamespace:e.target.value})}><option value="books-lab">books-lab</option><option value="other">other</option></select></label>
   <label>조회할 Service 이름<select value={options.query} onChange={e=>change({query:e.target.value})}><option value="study-web">study-web</option><option value="study-web.books-lab">study-web.books-lab</option><option value="study-web.books-lab.svc.cluster.local">study-web.books-lab.svc.cluster.local</option></select></label>
  </div>
  <label className="k8-predict">예측: 교체 후 새 연결은?<select value={prediction} onChange={e=>setPrediction(e.target.value)}><option value="">먼저 예상해 보세요</option><option>앱 포트에 도달</option><option>이름을 찾지 못함</option><option>선택된 Pod 없음</option><option>ready 대상 없음</option><option>대상은 있지만 포트 불일치</option></select></label>
  <Playback player={player} count={frames.length} reset={reset}/>
  <ServiceScene f={f}/>
  <Explanation frame={f}/>
  {player.index===frames.length-1&&prediction&&<p className="k8-feedback">내 예측: {prediction} · 관찰: {f.result.reason}. 위 경로에서 처음 충족되지 않은 조건을 찾아보세요.</p>}
  <p className="k8-assumption">일반 selector 기반 ClusterIP Service·TCP·IPv4·ClusterFirst DNS·cluster.local을 가정합니다. IP와 UID는 가상 예시입니다. 각 단계는 EndpointSlice와 전달 규칙이 갱신된 뒤이며 전파 지연은 생략합니다. 첫 ready 대상을 선택하는 교육용 규칙으로 실제 부하분산 순서·비율을 뜻하지 않습니다. NetworkPolicy·CNI·방화벽은 허용, 기존 연결·headless·publishNotReadyAddresses·종료 중 endpoint 예외는 범위 밖입니다.</p>
  <Steps frames={frames}/>
  <details className="k8-static"><summary>단계별 대상 주소와 결과 비교표</summary><div className="k8-table" role="region" aria-label="Service 관찰 표" tabIndex={0}><table><thead><tr><th>관찰</th><th>ready 후보 주소</th><th>새 연결 결과</th></tr></thead><tbody>{frames.map((x,i)=><tr key={i}><td>{x.title}</td><td>{x.eligible.map(p=>`${p.ip}:${p.port}`).join(', ')||'없음'}</td><td>{x.result.reason}</td></tr>)}</tbody></table></div></details>
 </section>;
}

import { useState } from 'react';
import { Playback, useFoundationPlayback } from '../network/FoundationPlayback';
import { storageFrames, resourceFrames, type StorageOptions, type StorageFile, type ResourceOptions, type NodeResource } from '../../simulations/kubernetes/storage-resources.mjs';
import './kubernetes.css';
import './data-resources.css';
function Steps({frames}:{frames:{title:string;detail:string}[]}){return <details className="k8-static"><summary>모든 단계 · 움직임 없이 읽기</summary><ol>{frames.map((f,i)=><li key={i}><strong>{f.title}</strong><p>{f.detail}</p></li>)}</ol></details>;}
function FileCard({file}:{file:StorageFile}){return <div className={`k8d-file k8d-${file.state}`}><strong>{file.label}</strong><code>{file.path}</code><span className="k8d-note">{file.state==='present'?'▤':file.state==='lost'?'∅':'?'} {file.value}</span></div>;}
const storageDefaults:StorageOptions={event:'restart',reclaim:'Delete'};
export function StorageLab(){
 const [o,setO]=useState<StorageOptions>(storageDefaults),[prediction,setPrediction]=useState('');
 const frames=storageFrames(o),p=useFoundationPlayback(frames.length),f=frames[p.index];
 const change=(patch:StorageOptions)=>{p.reset();setPrediction('');setO(v=>({...v,...patch}));};
 return <section className="k8-lab k8d-lab" aria-label="저장 위치와 수명 실험">
 <p className="k8-eyebrow">07 · 메모 A의 세 가지 수명</p><h2>어느 경계가 사라졌을까?</h2>
 <div className="k8-controls"><label>비교할 사건<select value={o.event} onChange={e=>change({event:e.target.value as StorageOptions['event']})}><option value="restart">컨테이너 재시작</option><option value="replace">Pod 교체 · 같은 노드</option><option value="offline">노드 접근 불가</option><option value="disk-loss">노드 디스크 영구 상실</option><option value="delete-pvc">PVC 삭제 요청 → Pod 제거</option></select></label><label>PV reclaim 정책<select value={o.reclaim} onChange={e=>change({reclaim:e.target.value as StorageOptions['reclaim']})}><option>Delete</option><option>Retain</option></select></label></div>
 <label className="k8-predict">예측: 마지막에 /data의 메모 A를 앱이 읽을까?<select value={prediction} onChange={e=>setPrediction(e.target.value)}><option value="">먼저 예상해 보세요</option><option>읽을 수 있다</option><option>그대로는 읽을 수 없다</option></select></label>
 <div className="k8d-api"><h3>API 객체 · 파일 바이트를 담는 상자가 아님</h3><div className="k8d-bind"><div><strong>PVC · books-lab/data</strong><span>{f.pvc}</span></div><b aria-hidden="true">{f.binding==='bound'?'↔':f.binding==='none'?'×':'?'}</b><div><strong>PV · pv-data</strong><span>{f.pv} · {f.reclaim}</span></div></div><p>{f.binding==='bound'?'현재 연결':f.binding==='none'?'PVC 참조 끊김 · 삭제 전 위치':'마지막 연결 기록 · 현재 관측 불가'}: node-a의 전용 디렉터리</p></div>
 <div className="k8d-disk"><h3>물리적 저장 경계 · {f.node}</h3><p>세 저장 위치 모두 이 노드의 로컬 디스크를 사용합니다. 아래 중첩은 <strong>수명 경계</strong>입니다.</p><div className="k8d-storage-grid"><div className="k8d-pod"><h4>Pod · {f.pod}</h4><div className="k8d-container"><strong>컨테이너 · {f.container}</strong><FileCard file={f.files[0]}/></div><FileCard file={f.files[1]}/></div><div className="k8d-volume"><h4>Pod 수명 밖의 저장 위치</h4><FileCard file={f.files[2]}/><p>{f.mount==='mounted'?'마운트 연결됨 · Pod /data ↔ 이 디렉터리':f.mount==='unmounted'?'마운트 해제 · 앱의 /data 경로에서 읽기 불가':'마운트 상태 관측 불가 · 이전 연결은 현재 성공의 증거가 아님'}</p><strong>원격 복제본·백업: 이 모델에는 없음</strong></div></div></div>
 <p className="k8-caption">▤ 기존 메모 존재 · ∅ 기존 메모 없음 · ? 관측 불가. ‘기존 메모 없음’은 이미지 기본 파일까지 사라졌다는 뜻이 아닙니다. 경로는 가상 예시입니다.</p>
 <Playback player={p} count={frames.length} reset={()=>change(storageDefaults)}/>
 <div className="k8-explanation" role="status" aria-atomic="true"><h3>{f.title}</h3><p>{f.detail}</p><strong>현재 앱의 /data 접근: {f.readable?'메모 A 읽기 가능':'읽기 불가'}</strong></div>
 {prediction&&p.index===frames.length-1&&<p className="k8-feedback">내 예측: {prediction} · 실제 관찰: {f.readable?'읽을 수 있다':'그대로는 읽을 수 없다'}. 데이터가 남는 것과 앱이 연결되는 것은 다른 조건입니다.</p>}
 <p className="k8-assumption">study-data 단일 replica · Linux · 디스크형 emptyDir · local-path-provisioner의 노드 로컬 디렉터리 · 초기 PVC/PV Bound. 정상 노드의 Pod 교체는 기존 PVC 재마운트 성공을 가정합니다. Delete의 마지막 단계는 provisioner 정리 성공 후이며, Retain은 삭제 전 실제 PV에 설정된 조건입니다. 노드 장애의 API 표시는 마지막 기록입니다. 실제 삭제 명령을 실행하지 않습니다.</p>
 <Steps frames={frames}/>
 </section>;
}
function Bar({label,value,max,unit,tone}:{label:string;value:number;max:number;unit:string;tone:string}){return <div className="k8d-bar-row"><div><span>{label}</span><strong>{value}{unit}{value>max?' · 눈금 초과':''}</strong></div><div className="k8d-track" aria-hidden="true"><span className={`k8d-fill k8d-${tone}`} style={{width:`${Math.min(100,value/max*100)}%`}}/></div></div>;}
function NodeBars({name,unit,r}:{name:string;unit:string;r:NodeResource}){return <div className="k8d-chart"><h4>{name} · allocatable {r.allocatable}{unit}</h4><Bar label="배치된 requests 합" value={r.assigned} max={r.allocatable} unit={unit} tone="reserved"/><Bar label="기존 + 새 requests 제안" value={r.proposed} max={r.allocatable} unit={unit} tone="proposed"/><Bar label="현재 실제 사용량" value={r.used} max={r.allocatable} unit={unit} tone="used"/><div className="k8d-axis"><span>0</span><span>{r.allocatable}{unit}</span></div></div>;}
const resourceDefaults:ResourceOptions={existingCpu:1800,requestCpu:500,existingMemory:512,quotaCpu:4000,load:'normal'};
const outcomes:Record<string,string>={draft:'생성 전',accepted:'접수됨 · 배치 전',rejected:'생성 거절',pending:'Pending · 미배치',scheduled:'노드 배치됨',running:'실행 중',throttled:'CPU throttling',pressure:'메모리 압박 관측',oom:'OOM 종료 관측'};
export function ResourcesLab(){
 const [o,setO]=useState<ResourceOptions>(resourceDefaults),[prediction,setPrediction]=useState('');
 const frames=resourceFrames(o),p=useFoundationPlayback(frames.length),f=frames[p.index];
 const change=(patch:ResourceOptions)=>{p.reset();setPrediction('');setO(v=>({...v,...patch}));};
 return <section className="k8-lab k8d-lab" aria-label="자원 배치와 실행 실험">
 <p className="k8-eyebrow">08 · 빈 CPU와 예약된 자리는 다르다</p><h2>새 Pod가 들어갈 자리가 있을까?</h2>
 <div className="k8-controls"><label>기존 노드 CPU requests · {o.existingCpu}m<input type="range" min="500" max="2000" step="100" value={o.existingCpu} onChange={e=>change({existingCpu:Number(e.target.value)})}/></label><label>새 앱 CPU request · {o.requestCpu}m<input type="range" min="100" max="1000" step="100" value={o.requestCpu} onChange={e=>change({requestCpu:Number(e.target.value)})}/></label><label>기존 노드 메모리 requests<select value={o.existingMemory} onChange={e=>change({existingMemory:Number(e.target.value)})}><option value="512">512Mi · 여유 있음</option><option value="1900">1900Mi · 요청 자리 부족</option></select></label><label>books-lab CPU quota<select value={o.quotaCpu} onChange={e=>change({quotaCpu:Number(e.target.value)})}><option value="4000">4000m</option><option value="1000">1000m</option><option value="750">750m</option></select></label><label>배치 후 부하<select value={o.load} onChange={e=>change({load:e.target.value as ResourceOptions['load']})}><option value="normal">일반 사용</option><option value="cpu">CPU 수요 증가</option><option value="memory">메모리 압박 → OOM 사례</option></select></label></div>
 <label className="k8-predict">예측: 새 Pod는 어느 경계까지 갈까?<select value={prediction} onChange={e=>setPrediction(e.target.value)}><option value="">먼저 예상해 보세요</option><option>quota에서 생성 거절</option><option>생성되지만 Pending</option><option>배치 후 실행 부하 관찰</option></select></label>
 <div className="k8d-gates"><div><small>① namespace · books-lab</small><strong>quota 심사</strong><span>기존 {f.quota.before}m + 새 {f.cpu.request}m = {f.quota.proposed}m</span><span>상한 {f.quota.limit}m · 현재 사용 {f.quota.used}m</span><p>노드 전체의 requests 합과 다른 집계</p></div><div><small>② 단일 노드 · node-a</small><strong>scheduler 배치</strong><span>CPU와 메모리 requests 모두 적합해야 함</span><p>현재 관찰: {outcomes[f.outcome]}</p></div></div>
 <div className="k8d-node-charts"><NodeBars name="CPU" unit="m" r={f.node.cpu}/><NodeBars name="메모리" unit="Mi" r={f.node.memory}/></div>
 <p className="k8-caption">막대 길이는 자원량입니다. 파랑 실선은 배치된 requests, 사선은 새 요청까지 더한 제안, 초록은 실사용량입니다. 눈금은 항상 노드 allocatable로 고정하며 넘친 수치는 ‘눈금 초과’로 표시합니다. requests는 실제 사용량이 아닙니다.</p>
 <div className="k8d-runtime"><h3>③ 새 앱 컨테이너 · limit과 실제 실행</h3><div className="k8d-node-charts"><div className="k8d-chart"><h4>CPU · request {f.cpu.request}m / limit {f.cpu.limit}m</h4><Bar label="CPU 수요" value={f.cpu.demand} max={2000} unit="m" tone="proposed"/><Bar label="실제 사용" value={f.cpu.actual} max={2000} unit="m" tone="used"/><Bar label="limit 기준선" value={f.cpu.limit} max={2000} unit="m" tone="limit"/><div className="k8d-axis"><span>0</span><span>2000m</span></div></div><div className="k8d-chart"><h4>메모리 · request {f.memory.request}Mi / limit {f.memory.limit}Mi</h4><Bar label="앱이 요구하는 양" value={f.memory.demand} max={1024} unit="Mi" tone="proposed"/><Bar label="관측 사용량" value={f.memory.actual} max={1024} unit="Mi" tone="used"/><Bar label="limit 기준선" value={f.memory.limit} max={1024} unit="Mi" tone="limit"/><div className="k8d-axis"><span>0</span><span>1024Mi</span></div></div></div></div>
 <Playback player={p} count={frames.length} reset={()=>change(resourceDefaults)}/>
 <div className="k8-explanation" role="status" aria-atomic="true"><h3>{f.title} · {outcomes[f.outcome]}</h3><p>{f.detail}</p></div>
 {prediction&&p.index===frames.length-1&&<p className="k8-feedback">내 예측: {prediction} · 관측 결과: {outcomes[f.outcome]}. quota → 배치 → 실행 중 한도 중 어디를 확인해야 할까요?</p>}
 <p className="k8-assumption">단일 노드, 앱당 일반 컨테이너 하나, CPU·메모리만 심사하는 고정 배치 규칙입니다. 기존 requests 중 books-lab 몫은 CPU 500m로 고정이며 나머지는 다른 namespace입니다. 새 앱의 메모리 request/limit은 256/512Mi, CPU limit은 1000m입니다. 기존 실사용은 CPU 100m·메모리 256Mi로 고정합니다. quota는 requests.cpu 하나만 설정했습니다. 실제 scheduler, init/sidecar·Pod overhead·Pod 수준 자원·LimitRange·우선순위·선점·노드 압박 퇴거·cgroup의 세부 동작은 재현하지 않습니다. OOM은 관측 사례이며 발생 시각 예측이 아닙니다.</p>
 <Steps frames={frames}/>
 </section>;
}

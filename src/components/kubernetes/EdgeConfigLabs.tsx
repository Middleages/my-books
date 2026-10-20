import { TlsScene } from './TlsScene';
import { ConfigurationScene } from './ConfigurationScene';
import { useState } from 'react';
import { Playback, useFoundationPlayback } from '../network/FoundationPlayback';
import { ingressFrames, configurationFrames, secretEncoding, type IngressOptions, type ConfigurationOptions } from '../../simulations/kubernetes/edge-config.mjs';
import './kubernetes.css';
import './edge-config.css';
const status:Record<string,string>={pending:'아직 도달 전',done:'도달',blocked:'여기서 중단',passed:'검증 성공',failed:'검증 실패',none:'TLS 없음'};
function Steps({frames}:{frames:{title:string;detail:string}[]}){return <details className="k8-static"><summary>모든 단계 · 움직임 없이 읽기</summary><ol>{frames.map((f,i)=><li key={i}><strong>{f.title}</strong><p>{f.detail}</p></li>)}</ol></details>;}
const ingressDefaults:IngressOptions={mode:'direct',host:'study.example.test',path:'/',outerValid:true,innerValid:true,controller:true,ready:true};
export function IngressTlsLab(){
 const [o,setO]=useState<IngressOptions>(ingressDefaults),[prediction,setPrediction]=useState('');
 const frames=ingressFrames(o),player=useFoundationPlayback(frames.length),f=frames[player.index];
 const change=(patch:IngressOptions)=>{player.reset();setPrediction('');setO(v=>({...v,...patch}));};
 return <section className="k8-lab k8c-lab" aria-label="외부 요청과 TLS 실험">
  <p className="k8-eyebrow">05 · 구간마다 연결의 주인이 다르다</p><h2>443 뒤에는 어떤 길이 있을까?</h2>
  <div className="k8-controls">
   <label>외부 진입 구성<select value={o.mode} onChange={e=>change({mode:e.target.value as IngressOptions['mode']})}><option value="direct">기본 k3s · 빈 80/443</option><option value="conflict">기존 NGINX + 기본 k3s · 충돌</option><option value="host-http">NGINX 유지 → HTTP NodePort</option><option value="host-tls">NGINX 유지 → HTTPS NodePort</option></select></label>
   <label>HTTP Host<select value={o.host} onChange={e=>change({host:e.target.value})}><option>study.example.test</option><option>other.example.test</option></select></label>
   <label>요청 경로<select value={o.path} onChange={e=>change({path:e.target.value})}><option>/</option><option>/health/ready</option><option>/missing</option><option>/healthier</option></select></label>
   <label>외부 인증서 검증<select value={String(o.outerValid)} onChange={e=>change({outerValid:e.target.value==='true'})}><option value="true">성공 조건</option><option value="false">실패 조건</option></select></label>
   <label>NGINX의 내부 인증서 검증<select disabled={o.mode!=='host-tls'} value={String(o.innerValid)} onChange={e=>change({innerValid:e.target.value==='true'})}><option value="true">성공 조건</option><option value="false">실패 조건</option></select></label>
   <label>클러스터 상태<select value={!o.controller?'controller':!o.ready?'ready':'normal'} onChange={e=>change({controller:e.target.value!=='controller',ready:e.target.value!=='ready'})}><option value="normal">controller 실행 · 대상 Ready</option><option value="controller">controller 없음</option><option value="ready">ready 대상 없음</option></select></label>
  </div>
  <label className="k8-predict">예측: 어디까지 도달할까?<select value={prediction} onChange={e=>setPrediction(e.target.value)}><option value="">먼저 예상해 보세요</option><option>앱까지 도달</option><option>연결·TLS 경계에서 중단</option><option>라우팅·대상 선택에서 중단</option></select></label>
  <div className="k8c-rules"><strong>Ingress 리소스 · 실행 서버가 아닌 규칙</strong><span>ingressClassName: traefik · namespace: books-lab</span><code>study.example.test + / (Exact) 또는 /health (Prefix)</code><span>↓ controller가 읽어 반영 · 두 규칙 모두 study-web:80</span></div>
  <Playback player={player} count={frames.length} reset={()=>change(ingressDefaults)}/>
  <TlsScene f={f}/>
  <div className="k8-explanation" role="status" aria-atomic="true"><h3>{f.title}</h3><p>{f.detail}</p></div>
  {prediction&&player.index===frames.length-1&&<p className="k8-feedback">내 예측: {prediction} · 위의 멈춘 구간과 TLS 검증 주체를 비교하세요.</p>}
  <p className="k8-assumption">DNS·방화벽·Pod listen은 정상, 요청마다 새 연결, HTTP Host는 원래 값 유지, URI 재작성 없음. 인증서 실패는 이름·신뢰·체인·시간 중 하나가 틀린 조건을 요약합니다. other Host 비교에서는 그 이름도 인증서 SAN에 포함돼 있다고 가정해 TLS와 HTTP 분기를 분리합니다. 실제 controller별 상태 코드를 재현하지 않습니다. ServiceLB의 포트 계획 충돌은 접속 전 진단이며 특정 패킷 탈취·bind 오류를 단정하지 않습니다.</p>
  <Steps frames={frames}/>
 </section>;
}
const configDefaults:ConfigurationOptions={delivery:'volume',reload:true,kind:'ConfigMap'};
export function ConfigurationLab(){
 const [o,setO]=useState<ConfigurationOptions>(configDefaults),[prediction,setPrediction]=useState('');
 const frames=configurationFrames(o),player=useFoundationPlayback(frames.length),f=frames[player.index];
 const change=(patch:ConfigurationOptions)=>{player.reset();setPrediction('');setO(v=>({...v,...patch}));};
 return <section className="k8-lab k8c-lab" aria-label="설정 전달과 재읽기 실험">
  <p className="k8-eyebrow">06 · 바뀐 값이 어디까지 왔을까?</p><h2>객체 변경 ≠ 앱의 사용값 변경</h2>
  <div className="k8-controls"><label>설정 객체<select value={o.kind} onChange={e=>change({kind:e.target.value as ConfigurationOptions['kind']})}><option>ConfigMap</option><option>Secret</option></select></label><label>전달 방법<select value={o.delivery} onChange={e=>change({delivery:e.target.value as ConfigurationOptions['delivery']})}><option value="env">환경변수</option><option value="volume">일반 볼륨 파일</option><option value="subpath">subPath 파일</option></select></label><label>앱의 읽기 기능<select value={String(o.reload)} onChange={e=>change({reload:e.target.value==='true'})}><option value="true">명시적 재읽기 지원</option><option value="false">시작할 때만 읽기</option></select></label></div>
  <label className="k8-predict">예측: Pod 교체 전 앱은 v2를 사용할까?<select value={prediction} onChange={e=>setPrediction(e.target.value)}><option value="">먼저 예상해 보세요</option><option>사용한다</option><option>아직 v1이다</option></select></label>
  <Playback player={player} count={frames.length} reset={()=>change(configDefaults)}/>
  <ConfigurationScene f={f}/>
  <div className="k8-explanation" role="status" aria-atomic="true"><h3>{f.title}</h3><p>{f.detail}</p></div>
  {prediction&&player.index>=3&&<p className="k8-feedback">내 예측: {prediction} · 교체 직전 앱 사용값: {frames[3].app}. 이미지와 Pod ID도 함께 비교하세요.</p>}
  <p className="k8-assumption">수정 가능한 객체, 키 존재·조회 권한·전파 성공을 가정합니다. 두 객체의 원자적 동시 변경을 가정하지 않고 선택한 하나만 관찰합니다. 파일 재읽기는 파일을 다시 여는 앱 기능입니다. 단계 간 실제 지연 시간·캐시·열린 파일 핸들·자동 reload 도구는 재현하지 않습니다. 마지막은 새 Pod 생성이며 앱 함수 재호출을 ‘재시작’으로 부르지 않습니다. 실제 Secret 값은 입력하지 마세요.</p>
  <Steps frames={frames}/><details className="k8-static"><summary>전체 단계 값 비교표</summary><div className="k8-table" role="region" aria-label="설정 단계 비교" tabIndex={0}><table><thead><tr><th>단계</th><th>API</th><th>전달 위치</th><th>앱 사용값</th></tr></thead><tbody>{frames.map((x,i)=><tr key={i}><td>{x.title}</td><td>{x.source}</td><td>{x.delivered}</td><td>{x.app}</td></tr>)}</tbody></table></div></details>
 </section>;
}
export function SecretPrimer(){return <figure className="k8c-secret"><div><small>가상 원문</small><code>{secretEncoding.plain}</code></div><div><strong>⇄ base64</strong><small>키 없이 변환</small></div><div><small>YAML data 표현</small><code>{secretEncoding.encoded}</code></div><figcaption>글자 모양이 달라졌을 뿐 비밀이 되지 않습니다. 암호화 여부: {secretEncoding.encrypted?'암호화':'암호화 아님'}. Secret 종류·조회 권한·저장 암호화는 별도 문제입니다.</figcaption></figure>;}

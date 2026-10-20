import { RecoveryScene,AirgapTrustScene } from './AppendixScenes';
import { useState } from 'react';
import { Playback, useFoundationPlayback } from '../network/FoundationPlayback';
import { recoveryFrames, dependencyMap, type RecoveryScenario } from '../../simulations/kubernetes/appendices.mjs';
import './kubernetes.css';
import './appendices.css';
const stateLabel:Record<string,string> = {unverified:'미확인',restored:'별도 복원한 조건',blocked:'token 없어 복원 중단',missing:'사본 없음 · 내용 누락','check-required':'실제 앱 확인 필요',separate:'별도 백업·복원 책임'};
export function RecoveryScopeLab(){
 const [scenario,setScenario]=useState<RecoveryScenario>('complete');
 const frames=recoveryFrames(scenario),p=useFoundationPlayback(frames.length),f=frames[p.index];
 const change=(s:RecoveryScenario)=>{p.reset();setScenario(s);};
 return <section className="k8-lab k8g-lab" aria-label="복원 범위 비교 실험"><h2>API 기록을 살리면 파일도 돌아올까요?</h2>
 <label>보관한 재료<select value={scenario} onChange={e=>change(e.target.value as RecoveryScenario)}><option value="complete">datastore + 원래 token + PV 파일</option><option value="no-token">원래 token 누락</option><option value="no-pv">PV 파일 사본 누락</option></select></label>
 <p>예측해 보세요. PVC 목록과 앱의 파일 내용 중 무엇까지 되살릴 재료가 있을까요?</p>
 <Playback player={p} count={frames.length} reset={()=>change('complete')}/>
 <RecoveryScene f={f} scenario={scenario}/>
 <div className="k8-result" aria-live="polite"><h3>{f.title}</h3><p>{f.detail}</p></div>
 <details className="k8-static"><summary>모든 단계 · 움직임 없이 읽기</summary><ol>{frames.map((step,i)=><li key={i}><strong>{step.title}</strong><p>{step.detail}</p><p>API: {stateLabel[step.api]} / PV: {stateLabel[step.pv]} / 앱: {stateLabel[step.app]} / 외부 DB: {stateLabel[step.externalDb]}</p></li>)}</ol></details>
 <p className="k8-assumption">백업의 포함 범위를 비교하는 가상 모델입니다. 실제 SQLite·etcd·파일 복원·앱 가동을 수행하지 않습니다. ‘복원한 조건’은 성공 관측이 아니며 실제 검증은 아래 절차로 별도로 수행합니다.</p></section>;
}
export function DependencyMap(){return <><AirgapTrustScene/><details className="k8-static"><summary>반입·설정 점검 항목 상세</summary><ul>{dependencyMap().map(n=><li key={n.id}><strong>{n.label}</strong><p>{n.detail}</p></li>)}</ul></details></>;}

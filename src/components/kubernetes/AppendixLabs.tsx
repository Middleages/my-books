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
 <div className="k8g-scope"><article><h3>클러스터 기록 경계</h3><p>datastore + 원래 token</p><strong>API 기록: {stateLabel[f.api]}</strong></article><article><h3>파일 경계</h3><p>PV 디스크의 별도 사본</p><strong>PV 파일: {stateLabel[f.pv]}</strong></article><article><h3>앱과 외부 상태</h3><p>앱: {stateLabel[f.app]}</p><strong>외부 DB: {stateLabel[f.externalDb]}</strong></article></div>
 <Playback player={p} count={frames.length} reset={()=>change('complete')}/>
 <div className="k8-result" aria-live="polite"><h3>{f.title}</h3><p>{f.detail}</p></div>
 <details className="k8-static"><summary>모든 단계 · 움직임 없이 읽기</summary><ol>{frames.map((step,i)=><li key={i}><strong>{step.title}</strong><p>{step.detail}</p><p>API: {stateLabel[step.api]} / PV: {stateLabel[step.pv]} / 앱: {stateLabel[step.app]} / 외부 DB: {stateLabel[step.externalDb]}</p></li>)}</ol></details>
 <p className="k8-assumption">백업의 포함 범위를 비교하는 가상 모델입니다. 실제 SQLite·etcd·파일 복원·앱 가동을 수행하지 않습니다. ‘복원한 조건’은 성공 관측이 아니며 실제 검증은 아래 절차로 별도로 수행합니다.</p></section>;
}
export function DependencyMap(){return <figure className="k8g-dependencies"><figcaption><strong>폐쇄망 의존성 지도</strong> · 화살표는 준비/접속 의존이며 HTTP 처리 순서가 아닙니다.</figcaption><ol>{dependencyMap().map(n=><li key={n.id}><h3>{n.label}</h3><p><strong>필요 조건 → </strong>{n.requires.length?n.requires.join(' · '):'반입 경로와 호스트 조건'}</p><p>{n.detail}</p></li>)}</ol><p>dns = 호출 위치의 이름 조회 / time = 유효기간 판단에 쓰는 시각 / registry-ca·browser-ca·app-ca = 각 검증 주체의 신뢰 설정. 한 곳의 CA 설치가 다른 곳까지 전파되지는 않습니다.</p></figure>;}

import { DiagnosisScene } from './DiagnosisScene';
import { HelmScene } from './HelmScene';
import { useState } from 'react';
import { Playback, useFoundationPlayback } from '../network/FoundationPlayback';
import { helmFrames, diagnosisFrames, diagnosticCases, observations, type HelmOptions, type HelmValues } from '../../simulations/kubernetes/helm-diagnosis.mjs';
import './kubernetes.css';
import './helm-diagnosis.css';

function StaticSteps({frames}:{frames:{title:string;detail:string;summary?:string}[]}) {
 return <details className="k8-static"><summary>모든 단계 · 움직임 없이 읽기</summary><ol>{frames.map((f,i)=><li key={i}><strong>{f.title}</strong><p>{f.detail}</p>{f.summary&&<p>{f.summary}</p>}</li>)}</ol></details>;
}
function Values({value}:{value:HelmValues}) {
 return <dl className="k8f-values"><div><dt>replicas</dt><dd>{value.replicas}개</dd></div><div><dt>이미지 라벨</dt><dd>{value.image}</dd></div><div><dt>APP_MESSAGE</dt><dd>{value.message}</dd></div></dl>;
}
const defaults:HelmOptions={operation:'template',environment:'dev',change:'config'};
export function HelmLab(){
 const [o,setO]=useState<HelmOptions>(defaults),[prediction,setPrediction]=useState('');
 const frames=helmFrames(o),p=useFoundationPlayback(frames.length),f=frames[p.index];
 const change=(patch:HelmOptions)=>{p.reset();setPrediction('');setO(v=>({...v,...patch}));};
 return <section className="k8-lab k8f-lab" aria-label="Helm 릴리스 실험">
  <p className="k8-eyebrow">11 · 문서 묶음에서 실행 명세까지</p><h2>출력한 YAML과 적용된 상태를 나란히 보기</h2>
  <div className="k8-controls">
   <label>작업<select value={o.operation} onChange={e=>change({operation:e.target.value as HelmOptions['operation']})}><option value="template">template · 출력만</option><option value="install">install · 처음 설치</option><option value="upgrade">upgrade · 변경 적용</option><option value="rollback">rollback · revision 1로</option></select></label>
   <label>환경 값<select value={o.environment} onChange={e=>change({environment:e.target.value as HelmOptions['environment']})}><option value="dev">개발 · replicas 1</option><option value="prod">운영 · replicas 2</option></select></label>
   <label>업그레이드에서 바꾼 것<select disabled={o.operation==='template'||o.operation==='install'} value={o.change} onChange={e=>change({change:e.target.value as HelmOptions['change']})}><option value="config">ConfigMap 내용만</option><option value="replicas">replicas만 +1</option><option value="image">이미지 v1 → v2</option></select></label>
   <label>예측: 마지막 Deployment revision<select value={prediction} onChange={e=>setPrediction(e.target.value)}><option value="">먼저 예상해 보세요</option><option value="없음">없음</option><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></label>
  </div>
  <p className="k8-assumption">환경을 바꾸면 별도의 가상 실습이 처음부터 시작됩니다. 개발/운영은 비교용 값이며 운영 권장 replica 수가 아닙니다.</p>
  <Playback player={p} count={frames.length} reset={()=>change(defaults)}/>
  <HelmScene f={f} frames={frames} index={p.index}/>
  <div className="k8-result" aria-live="polite"><h3>{f.title}</h3><p>{f.detail}</p>{p.index===frames.length-1&&prediction&&<p>내 예측 {prediction} / 관측 revision {f.deploymentRevision??'없음'}</p>}</div>
  <p className="k8f-external">{f.externalState}. rollback도 데이터 백업 복원이 아닙니다.</p>
  <details className="k8-static"><summary>이 작업에 대응하는 CLI 형태 · 여기서는 실행하지 않음</summary><pre tabIndex={0}>{f.command}</pre><p>로컬 chart·완전한 values 파일을 준비했다는 설명용 형태입니다. 이 화면은 chart 파일이나 실제 이미지를 제공하지 않습니다. 변경 명령은 일회용 실습환경에서만 별도로 검토합니다.</p></details>
  <p className="k8-assumption">고정 차트·세 필드·성공하는 API 적용·수렴 뒤의 이력을 가정한 제한 모델. 차트 버전 0.1.0과 이미지 v1/v2는 가상 라벨입니다. Helm 엔진·임의 템플릿·실제 Pod 교체·실패 상태·hooks·CRD·데이터 복구는 실행하지 않습니다. 단계는 실제 내부 API 호출 순서나 시간표가 아닙니다.</p>
  <StaticSteps frames={frames}/>
 </section>;
}
export function TroubleshootingLab(){
 const [scenario,setScenario]=useState('pending'),[observation,setObservation]=useState('get'),[prediction,setPrediction]=useState('');
 const frames=diagnosisFrames({scenario,observation}),p=useFoundationPlayback(frames.length),f=frames[p.index];
 const change=(nextScenario:string,nextObservation:string)=>{p.reset();setPrediction('');setScenario(nextScenario);setObservation(nextObservation);};
 return <section className="k8-lab k8f-lab" aria-label="증거 기반 진단 실험">
  <p className="k8-eyebrow">12 · 증상 → 증거 → 가설 → 재확인</p><h2>다음에는 어디를 관측할까요?</h2>
  <div className="k8-controls">
   <label>진단 사례<select value={scenario} onChange={e=>change(e.target.value,'get')}>{diagnosticCases.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
   <label>다음 관측<select value={observation} onChange={e=>change(scenario,e.target.value)}>{observations.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></label>
   <label>예측: 먼저 조사할 경계<select value={prediction} onChange={e=>setPrediction(e.target.value)}><option value="">먼저 예상해 보세요</option>{f.zones.map(z=><option key={z.label}>{z.label}</option>)}</select></label>
  </div>
  <p className="k8f-symptom"><strong>신고된 증상</strong>{f.symptom}</p>
  <Playback player={p} count={frames.length} reset={()=>change('pending','get')}/>
  <DiagnosisScene f={f}/>
  <div className="k8f-evidence-grid">
   <div className="k8f-card"><span className="k8f-number">관측 질문</span><h3>{f.question}</h3><p>{f.where}</p><pre tabIndex={0} aria-label="관측 명령 예시">{f.command}</pre><small>명령을 실행하는 UI가 아닙니다. 가상 기록을 열어 보는 실험입니다.</small></div>
   <div className={`k8f-card ${f.evidence?'k8f-active':''}`}><span className="k8f-number">증거 카드 · 관련 보조 관측 포함</span><h3>{f.evidence?'가상 관측 기록':'아직 관측 전'}</h3><p>{f.evidence??'한 단계 진행해 선택한 관측이 무엇을 알려주는지 확인하세요.'}</p>{f.conclusion&&<p className="k8f-conclusion"><strong>현재 가설</strong>{f.conclusion}</p>}</div>
  </div>

  <div className="k8-result" aria-live="polite"><h3>{f.title}</h3><p>{f.detail}</p>{f.next&&<p><strong>다음 행동: </strong>{f.next}</p>}{p.index===frames.length-1&&prediction&&<p>내 예측: {prediction}. 위 증거가 지지하는 범위와 비교하세요.</p>}</div>
  <p className="k8-assumption">각 사례는 대표 관측 묶음 하나로 주요 가설을 좁히는 교육용 분기입니다. 다른 명령이 항상 쓸모없다는 뜻이 아닙니다. 명령 하나의 출력만으로 알 수 없는 listen 포트·이미지 존재·DB 오류·인증서 조건은 카드에 보조 관측으로 명시했습니다. 재생 단계는 조사 순서이며 실제 장애 진행 시간이 아닙니다. 로그가 없다는 사실을 정상 증거로 삼지 않습니다.</p>
  <StaticSteps frames={frames}/>
 </section>;
}

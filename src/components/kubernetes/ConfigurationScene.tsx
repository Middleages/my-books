import type { ConfigurationFrame } from '../../simulations/kubernetes/edge-config.mjs';
import { configurationFlow } from '../../simulations/kubernetes/visual-explanations.mjs';
import './visual-explanations.css';
function Token({value,version}:{value:string;version:number}){return <div className={`k8v-version k8v-v${version}`} data-version={version}><b className="k8v-token">v{version}</b><span>{value}</span></div>;}
export function ConfigurationScene({f}:{f:ConfigurationFrame}){
 const flow=configurationFlow(f);
 return <div data-scene="configuration">
  <div className="k8v-version-key"><span>◯ v1 = 최초 값</span><span>▣ v2 = 수정한 값</span><span>모양·번호가 값의 세대를 구분합니다.</span></div>
  <div className="k8c-image"><strong>▣ 이미지 · {flow.image}</strong><span>실행 코드 제공 · 설정 변경과 별개로 유지</span></div>
  <div className="k8c-config-path">
   <div className={`k8c-value k8v-value-v${flow.source.version}`} data-config="source"><small>① API의 {f.kind}</small><Token {...flow.source}/><span>{f.kind==='ConfigMap'?'APP_MESSAGE · 일반 설정':'가상 자격 증명 · 공개 학습값'}</span></div>
   <div className={`k8v-transfer ${!flow.deliveryCurrent?'k8v-transfer-stale':''}`} data-transfer="delivery"><b aria-hidden="true">↓</b><span>{flow.deliveryCurrent?'값 일치':'전달 안 됨'}<br/>{f.delivery==='env'?'새 프로세스 생성 시':f.delivery==='subpath'?'새 Pod 연결 시':'파일 갱신 단계'}</span></div>
   <div className="k8c-process"><h3>Pod: {flow.pod}</h3>
    <div className={`k8c-value k8v-value-v${flow.delivered.version}`} data-config="delivered"><small>② {f.delivery==='env'?'실행 환경변수':f.delivery==='subpath'?'subPath 파일':'/config 일반 볼륨 파일'}</small><Token {...flow.delivered}/></div>
    <div className={`k8v-transfer ${!flow.readCurrent?'k8v-transfer-stale':''}`} data-transfer="read"><b aria-hidden="true">↓</b><span>{flow.readCurrent?'읽은 값 일치':'✕ 아직 읽지 않은 값'} · {f.delivery==='env'?'환경변수는 프로세스 생성 시 받음':'파일 변경 ≠ 메모리 변경'}</span></div>
    <div className={`k8c-value k8c-memory k8v-value-v${flow.app.version}`} data-config="app"><small>③ 앱 프로세스 메모리</small><Token {...flow.app}/><span>{flow.process}</span></div>
   </div>
  </div>
  <p className="k8-caption">고정 비교: 처음에는 API·전달 위치·앱이 모두 ◯ v1. 현재 서로 다른 모양이 남은 경계에서 전파 또는 읽기가 아직 끝나지 않았습니다. 실제 시간은 재현하지 않습니다.</p>
 </div>;
}
